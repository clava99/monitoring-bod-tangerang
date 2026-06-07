from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from app.database import get_db
from app.models import MonitoringData, User
from app.schemas import DashboardSummary, TopBottomResponse, TopBottomItem
from app.auth import get_current_user

router = APIRouter()

METRIC_COLUMNS = {
    "lending": MonitoringData.lending,
    "os_aktif": MonitoringData.os_aktif,
    "noc": MonitoringData.noc,
    "os_npl": MonitoringData.os_npl,
    "pct_rr": MonitoringData.pct_rr,
    "pct_lending": MonitoringData.pct_lending,
}


@router.get("/summary", response_model=DashboardSummary)
def get_summary(
    region: Optional[str] = None,
    area: Optional[str] = None,
    period: Optional[str] = None,
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

    rows = q.all()

    if not rows:
        return DashboardSummary(
            total_unit=0, total_noc=0, total_os_aktif=0.0,
            total_lending=0.0, total_os_npl=0.0, avg_pct_rr=0.0, period=period
        )

    total_noc = sum(r.noc or 0 for r in rows)
    total_os = sum(r.os_aktif or 0 for r in rows)
    total_lending = sum(r.lending or 0 for r in rows)
    total_npl = sum(r.os_npl or 0 for r in rows)
    rr_vals = [r.pct_rr for r in rows if r.pct_rr is not None]
    avg_rr = sum(rr_vals) / len(rr_vals) if rr_vals else 0.0
    periods = list(set(r.period for r in rows if r.period))
    latest_period = sorted(periods)[-1] if periods else None

    return DashboardSummary(
        total_unit=len(rows),
        total_noc=total_noc,
        total_os_aktif=round(total_os, 2),
        total_lending=round(total_lending, 2),
        total_os_npl=round(total_npl, 2),
        avg_pct_rr=round(avg_rr * 100, 2),
        period=latest_period,
    )


@router.get("/top-bottom", response_model=TopBottomResponse)
def get_top_bottom(
    metric: str = Query("lending", enum=list(METRIC_COLUMNS.keys())),
    n: int = Query(5, ge=1, le=20),
    region: Optional[str] = None,
    area: Optional[str] = None,
    period: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    col = METRIC_COLUMNS[metric]
    q = db.query(MonitoringData).filter(col.isnot(None))
    if region:
        q = q.filter(MonitoringData.region == region)
    if area:
        q = q.filter(MonitoringData.area == area)
    if period:
        q = q.filter(MonitoringData.period == period)

    rows = q.all()

    def to_item(r):
        return TopBottomItem(
            unit=r.unit,
            region=r.region,
            area=r.area,
            value=round(getattr(r, metric) or 0, 2),
        )

    sorted_desc = sorted(rows, key=lambda r: getattr(r, metric) or 0, reverse=True)
    sorted_asc = sorted(rows, key=lambda r: getattr(r, metric) or 0)

    return TopBottomResponse(
        metric=metric,
        top5=[to_item(r) for r in sorted_desc[:n]],
        bottom5=[to_item(r) for r in sorted_asc[:n]],
    )


@router.get("/filters")
def get_filter_options(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    regions = [r[0] for r in db.query(MonitoringData.region).distinct().all() if r[0]]
    areas = [r[0] for r in db.query(MonitoringData.area).distinct().all() if r[0]]
    periods = [r[0] for r in db.query(MonitoringData.period).distinct().all() if r[0]]
    return {"regions": sorted(regions), "areas": sorted(areas), "periods": sorted(periods)}
