from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from app.database import get_db
from app.models import MonitoringData, User
from app.schemas import MonitoringDataOut, MonitoringDataCreate, PaginatedUnits
from app.auth import get_current_user, require_manager
import math

router = APIRouter()


class BulkDeleteRequest(BaseModel):
    ids: List[int]


@router.get("", response_model=PaginatedUnits)
def list_units(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    region: Optional[str] = None,
    area: Optional[str] = None,
    period: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = "unit",
    sort_order: Optional[str] = "asc",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(MonitoringData)
    if region:
        q = q.filter(MonitoringData.region == region)
    if area:
        q = q.filter(MonitoringData.area == area)
    if period:
        q = q.filter(MonitoringData.period == period)
    if search:
        q = q.filter(MonitoringData.unit.ilike(f"%{search}%"))

    SORTABLE = {
        "unit": MonitoringData.unit,
        "region": MonitoringData.region,
        "area": MonitoringData.area,
        "noc": MonitoringData.noc,
        "os_aktif": MonitoringData.os_aktif,
        "lending": MonitoringData.lending,
        "os_npl": MonitoringData.os_npl,
        "pct_rr": MonitoringData.pct_rr,
        "pct_lending": MonitoringData.pct_lending,
    }
    col = SORTABLE.get(sort_by, MonitoringData.unit)
    q = q.order_by(col.desc() if sort_order == "desc" else col.asc())

    total = q.count()
    rows = q.offset((page - 1) * limit).limit(limit).all()

    return PaginatedUnits(
        data=rows,
        total=total,
        page=page,
        limit=limit,
        total_pages=math.ceil(total / limit) if total > 0 else 1,
    )


@router.post("", response_model=MonitoringDataOut)
def create_unit(
    data: MonitoringDataCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    row = MonitoringData(**data.dict())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/bulk/selected")
def bulk_delete_units(
    payload: BulkDeleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    if not payload.ids:
        raise HTTPException(status_code=400, detail="Tidak ada ID yang dipilih")
    deleted = db.query(MonitoringData).filter(MonitoringData.id.in_(payload.ids)).delete(synchronize_session=False)
    db.commit()
    return {"message": f"{deleted} data berhasil dihapus"}


@router.delete("/all/data")
def delete_all_units(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    deleted = db.query(MonitoringData).delete(synchronize_session=False)
    db.commit()
    return {"message": f"Semua data ({deleted} unit) berhasil dihapus"}


@router.get("/{unit_id}", response_model=MonitoringDataOut)
def get_unit(unit_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    row = db.query(MonitoringData).filter(MonitoringData.id == unit_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Data tidak ditemukan")
    return row


@router.put("/{unit_id}", response_model=MonitoringDataOut)
def update_unit(
    unit_id: int,
    data: MonitoringDataCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    row = db.query(MonitoringData).filter(MonitoringData.id == unit_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Data tidak ditemukan")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{unit_id}")
def delete_unit(
    unit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    row = db.query(MonitoringData).filter(MonitoringData.id == unit_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Data tidak ditemukan")
    db.delete(row)
    db.commit()
    return {"message": "Data berhasil dihapus"}
