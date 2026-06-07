from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models import AppConfig, User
from app.auth import get_current_user, require_admin

router = APIRouter()


class SheetsConfigIn(BaseModel):
    spreadsheet_url: str
    sheet_name: Optional[str] = "Sheet1"
    period_auto_detect: Optional[bool] = True
    default_period: Optional[str] = None


class SheetsConfigOut(BaseModel):
    spreadsheet_url: Optional[str] = None
    sheet_name: Optional[str] = "Sheet1"
    period_auto_detect: Optional[bool] = True
    default_period: Optional[str] = None
    is_configured: bool = False
    url_type: Optional[str] = None


def _get(db: Session, key: str) -> Optional[str]:
    row = db.query(AppConfig).filter(AppConfig.key == key).first()
    return row.value if row else None


def _set(db: Session, key: str, value: str):
    row = db.query(AppConfig).filter(AppConfig.key == key).first()
    if row:
        row.value = value
    else:
        db.add(AppConfig(key=key, value=value))
    db.commit()


def detect_url_type(url: str) -> str:
    if "script.google.com/macros/s/" in url:
        return "apps_script"
    if "docs.google.com/spreadsheets" in url:
        return "spreadsheet"
    return "unknown"


@router.get("/sheets", response_model=SheetsConfigOut)
def get_sheets_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    url = _get(db, "sheets_url")
    sheet_name = _get(db, "sheets_sheet_name") or "Sheet1"
    period_auto = _get(db, "sheets_period_auto_detect")
    default_period = _get(db, "sheets_default_period")
    return SheetsConfigOut(
        spreadsheet_url=url,
        sheet_name=sheet_name,
        period_auto_detect=(period_auto != "false") if period_auto else True,
        default_period=default_period,
        is_configured=bool(url),
        url_type=detect_url_type(url) if url else None,
    )


@router.put("/sheets", response_model=SheetsConfigOut)
def save_sheets_config(
    data: SheetsConfigIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    url = data.spreadsheet_url.strip()
    url_type = detect_url_type(url)

    if url_type == "unknown":
        raise HTTPException(
            status_code=400,
            detail="URL tidak dikenali. Masukkan URL Google Apps Script (script.google.com/macros/s/...) atau URL Google Spreadsheet (docs.google.com/spreadsheets/...)."
        )

    _set(db, "sheets_url", url)
    _set(db, "sheets_sheet_name", data.sheet_name or "Sheet1")
    _set(db, "sheets_period_auto_detect", str(data.period_auto_detect).lower())
    if data.default_period:
        _set(db, "sheets_default_period", data.default_period)
    elif _get(db, "sheets_default_period"):
        _set(db, "sheets_default_period", data.default_period or "")

    return SheetsConfigOut(
        spreadsheet_url=url,
        sheet_name=data.sheet_name,
        period_auto_detect=data.period_auto_detect,
        default_period=data.default_period,
        is_configured=True,
        url_type=url_type,
    )


@router.delete("/sheets")
def clear_sheets_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    for key in ("sheets_url", "sheets_sheet_name", "sheets_period_auto_detect", "sheets_default_period"):
        db.query(AppConfig).filter(AppConfig.key == key).delete()
    db.commit()
    return {"message": "Konfigurasi berhasil dihapus"}
