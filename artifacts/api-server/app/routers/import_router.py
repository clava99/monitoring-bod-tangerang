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
    if replace and period:
        db.query(MonitoringData).filter(MonitoringData.period == period).delete()
        db.commit()
    elif replace and records:
        first_period = records[0].get("period")
        if first_period:
            db.query(MonitoringData).filter(MonitoringData.period == first_period).delete()
            db.commit()

    objs = [MonitoringData(**r) for r in records if r.get("unit")]
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
            detail="Google Sheets belum dikonfigurasi. Silakan atur URL spreadsheet terlebih dahulu di halaman Import.",
        )

    sheet_name = _get_config(db, "sheets_sheet_name") or "Sheet1"
    period = _get_config(db, "sheets_default_period")
    period_auto = _get_config(db, "sheets_period_auto_detect")
    if period_auto == "false":
        use_period = period
    else:
        use_period = None

    log = SyncLog(sync_type="google_sheets", source=sheets_url, status="processing")
    db.add(log)
    db.commit()

    try:
        records = sync_from_google_sheets(sheets_url, sheet_name=sheet_name, period=use_period)
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
    return db.query(SyncLog).order_by(SyncLog.created_at.desc()).limit(limit).all()
