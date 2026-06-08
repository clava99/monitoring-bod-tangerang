from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from app.database import get_db
from app.models import MonitoringData, User
from app.schemas import (
    DashboardSummary, TopBottomResponse, TopBottomItem,
    TrendDataPoint, AlertUnit, RiskAreaData,
)
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


def _apply_filters(q, region, area, period):
    if region:
        q = q.filter(MonitoringData.region == region)
    if area:
        q = q.filter(MonitoringData.area == area)
    if period:
        q = q.filter(MonitoringData.period == period)
    return q


@router.get("/summary", response_model=DashboardSummary)
def get_summary(
    region: Optional[str] = None,
    area: Optional[str] = None,
    period: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = _apply_filters(db.query(MonitoringData), region, area, period)
    rows = q.all()

    if not rows:
        return DashboardSummary(
            total_unit=0, total_noc=0, total_os_aktif=0.0,
            total_lending=0.0, total_os_npl=0.0, avg_pct_rr=0.0,
            avg_pct_noc=0.0, avg_pct_os=0.0, avg_pct_lending=0.0,
            period=period,
        )

    total_noc = sum(r.noc or 0 for r in rows)
    total_os = sum(r.os_aktif or 0 for r in rows)
    total_lending = sum(r.lending or 0 for r in rows)
    total_npl = sum(r.os_npl or 0 for r in rows)

    rr_vals = [r.pct_rr for r in rows if r.pct_rr is not None]
    avg_rr = sum(rr_vals) / len(rr_vals) if rr_vals else 0.0

    noc_vals = [r.pct_noc for r in rows if r.pct_noc is not None]
    avg_pct_noc = sum(noc_vals) / len(noc_vals) if noc_vals else 0.0

    os_vals = [r.pct_os for r in rows if r.pct_os is not None]
    avg_pct_os = sum(os_vals) / len(os_vals) if os_vals else 0.0

    lend_vals = [r.pct_lending for r in rows if r.pct_lending is not None]
    avg_pct_lending = sum(lend_vals) / len(lend_vals) if lend_vals else 0.0

    periods = list(set(r.period for r in rows if r.period))
    latest_period = sorted(periods)[-1] if periods else None

    return DashboardSummary(
        total_unit=len(rows),
        total_noc=total_noc,
        total_os_aktif=round(total_os, 2),
        total_lending=round(total_lending, 2),
        total_os_npl=round(total_npl, 2),
        avg_pct_rr=round(avg_rr * 100, 2),
        avg_pct_noc=round(avg_pct_noc * 100, 2),
        avg_pct_os=round(avg_pct_os * 100, 2),
        avg_pct_lending=round(avg_pct_lending * 100, 2),
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
    q = _apply_filters(
        db.query(MonitoringData).filter(col.isnot(None)),
        region, area, period,
    )
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


@router.get("/trend", response_model=List[TrendDataPoint])
def get_trend(
    region: Optional[str] = None,
    area: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = _apply_filters(db.query(MonitoringData), region, area, None)
    rows = q.all()

    from collections import defaultdict
    by_period: dict = defaultdict(list)
    for r in rows:
        if r.period:
            by_period[r.period].append(r)

    result = []
    for period in sorted(by_period.keys()):
        group = by_period[period]
        total_noc = sum(r.noc or 0 for r in group)
        total_os = sum(r.os_aktif or 0 for r in group)
        total_lending = sum(r.lending or 0 for r in group)

        rr_vals = [r.pct_rr for r in group if r.pct_rr is not None]
        avg_rr = (sum(rr_vals) / len(rr_vals) * 100) if rr_vals else 0.0

        noc_vals = [r.pct_noc for r in group if r.pct_noc is not None]
        avg_noc = (sum(noc_vals) / len(noc_vals) * 100) if noc_vals else 0.0

        os_vals = [r.pct_os for r in group if r.pct_os is not None]
        avg_os = (sum(os_vals) / len(os_vals) * 100) if os_vals else 0.0

        lend_vals = [r.pct_lending for r in group if r.pct_lending is not None]
        avg_lend = (sum(lend_vals) / len(lend_vals) * 100) if lend_vals else 0.0

        result.append(TrendDataPoint(
            period=period,
            total_noc=total_noc,
            total_os_aktif=round(total_os, 2),
            total_lending=round(total_lending, 2),
            avg_pct_rr=round(avg_rr, 2),
            avg_pct_noc=round(avg_noc, 2),
            avg_pct_os=round(avg_os, 2),
            avg_pct_lending=round(avg_lend, 2),
        ))

    return result


@router.get("/alerts", response_model=List[AlertUnit])
def get_alerts(
    region: Optional[str] = None,
    area: Optional[str] = None,
    period: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = _apply_filters(db.query(MonitoringData), region, area, period)
    rows = q.all()

    alerts = []
    for r in rows:
        issues = []
        severity = "warning"

        pct_rr_pct = (r.pct_rr or 0) * 100
        npl_ratio = ((r.os_npl or 0) / r.os_aktif * 100) if r.os_aktif else 0
        pct_noc_pct = (r.pct_noc or 0) * 100
        pct_os_pct = (r.pct_os or 0) * 100
        pct_lend_pct = (r.pct_lending or 0) * 100

        if r.pct_rr is not None and pct_rr_pct < 80:
            issues.append(f"% RR rendah: {pct_rr_pct:.1f}%")
            if pct_rr_pct < 60:
                severity = "critical"

        if r.os_aktif and r.os_npl and npl_ratio > 5:
            issues.append(f"NPL tinggi: {npl_ratio:.2f}%")
            if npl_ratio > 10:
                severity = "critical"

        if r.pct_noc is not None and pct_noc_pct < 70:
            issues.append(f"Pencapaian NOC: {pct_noc_pct:.1f}%")

        if r.pct_os is not None and pct_os_pct < 70:
            issues.append(f"Pencapaian OS: {pct_os_pct:.1f}%")

        if r.pct_lending is not None and pct_lend_pct < 70:
            issues.append(f"Pencapaian Lending: {pct_lend_pct:.1f}%")

        if issues:
            alerts.append(AlertUnit(
                id=r.id,
                unit=r.unit,
                region=r.region,
                area=r.area,
                period=r.period,
                pct_rr=round(pct_rr_pct, 2) if r.pct_rr is not None else None,
                pct_os_npl=round(npl_ratio, 2),
                pct_noc=round(pct_noc_pct, 2) if r.pct_noc is not None else None,
                pct_os=round(pct_os_pct, 2) if r.pct_os is not None else None,
                pct_lending=round(pct_lend_pct, 2) if r.pct_lending is not None else None,
                os_npl=r.os_npl,
                os_aktif=r.os_aktif,
                issues=issues,
                severity=severity,
            ))

    alerts.sort(key=lambda a: (0 if a.severity == "critical" else 1, -(a.pct_os_npl or 0)))
    return alerts


@router.get("/risk", response_model=List[RiskAreaData])
def get_risk(
    region: Optional[str] = None,
    area: Optional[str] = None,
    period: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = _apply_filters(db.query(MonitoringData), region, area, period)
    rows = q.all()

    from collections import defaultdict
    by_area: dict = defaultdict(list)
    for r in rows:
        key = r.area or r.region or "Lainnya"
        by_area[key].append(r)

    result = []
    for area_name, group in sorted(by_area.items()):
        total_os = sum(r.os_aktif or 0 for r in group)
        total_par = sum(r.os_par or 0 for r in group)
        total_npl = sum(r.os_npl or 0 for r in group)
        total_lar = sum(r.os_lar or 0 for r in group)

        par_ratio = (total_par / total_os * 100) if total_os else 0
        npl_ratio = (total_npl / total_os * 100) if total_os else 0
        lar_ratio = (total_lar / total_os * 100) if total_os else 0

        result.append(RiskAreaData(
            area=area_name,
            os_par=round(total_par, 2),
            os_npl=round(total_npl, 2),
            os_lar=round(total_lar, 2),
            os_aktif=round(total_os, 2),
            par_ratio=round(par_ratio, 2),
            npl_ratio=round(npl_ratio, 2),
            lar_ratio=round(lar_ratio, 2),
        ))

    return result


@router.get("/unit-history/{unit_name:path}")
def get_unit_history(
    unit_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(MonitoringData)
        .filter(MonitoringData.unit == unit_name)
        .order_by(MonitoringData.period.asc())
        .all()
    )
    return rows
