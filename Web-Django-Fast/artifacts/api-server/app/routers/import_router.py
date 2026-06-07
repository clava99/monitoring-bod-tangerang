from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import MonitoringData, SyncLog, AppConfig, User
from app.schemas import SyncLogOut
from app.auth import get_current_user, require_manager
from services.excel_service import parse_excel_bytes
from services.sheets_service import sync_from_google_sheets

router = APIRouter()


def _get_config(db: Session, key: str) -> Optional[str]:
    row = db.query(AppConfig).filter(AppConfig.key == key).first()
    return row.value if row else None


def save_records(db: Session, records: list, replace: bool = True, period: Optional[str] = None):
    """
    Simpan records ke DB.

    Logika replace:
    - Jika replace=True dan period diketahui → hapus data periode itu dulu
    - Jika replace=True dan period None → coba deteksi dari data;
      jika masih None → hapus SEMUA data (full replace)
    - Jika replace=False → append saja tanpa hapus
    """
    if replace:
        # Tentukan periode yang akan dihapus
        target_period = period

        if not target_period and records:
            # Deteksi dari record pertama yang punya period
            for r in records:
                if r.get("period"):
                    target_period = r["period"]
                    break

        if target_period:
            # Hapus hanya data periode ini
            db.query(MonitoringData).filter(
                MonitoringData.period == target_period
            ).delete(synchronize_session=False)
        else:
            # Tidak ada info periode → hapus semua (full replace)
            db.query(MonitoringData).delete(synchronize_session=False)

        db.commit()

    # Simpan records baru — hanya yang punya field unit
    # Filter key yang tidak dikenal agar tidak crash saat ada field baru di GAS
    valid_cols = {c.key for c in MonitoringData.__table__.columns}
    objs = [
        MonitoringData(**{k: v for k, v in r.items() if k in valid_cols})
        for r in records if r.get("unit")
    ]
    if objs:
        db.bulk_save_objects(objs)
        db.commit()

    return len(objs)


@router.post("/excel", response_model=SyncLogOut)
async def import_excel(
    file: UploadFile = File(...),
    period: Optional[str] = Form(None),
    replace: bool = Form(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="File harus berformat .xlsx atau .xls")

    log = SyncLog(sync_type="excel", source=file.filename, status="processing")
    db.add(log)
    db.commit()

    try:
        content = await file.read()
        records = parse_excel_bytes(content, period=period)
        if not records:
            raise ValueError(
                "Tidak ada data yang berhasil dibaca dari file Excel. "
                "Pastikan format file sesuai dan header kolom benar."
            )
        count = save_records(db, records, replace=replace, period=period)
        log.status = "success"
        log.records_count = count
    except Exception as e:
        log.status = "failed"
        log.error_message = str(e)
        db.commit()
        raise HTTPException(status_code=400, detail=f"Gagal memproses file: {str(e)}")

    db.commit()
    db.refresh(log)
    return log


@router.post("/sheets-sync", response_model=SyncLogOut)
def sync_sheets(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    sheets_url = _get_config(db, "sheets_url")
    if not sheets_url:
        raise HTTPException(
            status_code=400,
            detail="Google Sheets belum dikonfigurasi. Silakan atur URL di halaman Import.",
        )

    sheet_name  = _get_config(db, "sheets_sheet_name") or "Sheet1"
    period      = _get_config(db, "sheets_default_period")
    period_auto = _get_config(db, "sheets_period_auto_detect")

    # Jika auto-detect aktif (default), biarkan sheets_service yang deteksi periode
    use_period = None if period_auto != "false" else period

    log = SyncLog(sync_type="google_sheets", source=sheets_url, status="processing")
    db.add(log)
    db.commit()

    try:
        records = sync_from_google_sheets(
            sheets_url, sheet_name=sheet_name, period=use_period
        )
        if not records:
            raise ValueError(
                "Tidak ada data yang berhasil dibaca dari sumber. "
                "Pastikan Apps Script mengembalikan data yang benar "
                "dan format JSON sesuai."
            )
        count = save_records(db, records, replace=True, period=use_period)
        log.status = "success"
        log.records_count = count
    except Exception as e:
        log.status = "failed"
        log.error_message = str(e)
        db.commit()
        raise HTTPException(status_code=400, detail=f"Gagal sinkronisasi: {str(e)}")

    db.commit()
    db.refresh(log)
    return log


@router.get("/logs", response_model=list[SyncLogOut])
def get_sync_logs(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(SyncLog)
        .order_by(SyncLog.created_at.desc())
        .limit(limit)
        .all()
    )
