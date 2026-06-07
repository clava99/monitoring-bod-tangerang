from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.models import MonitoringData, User
from app.schemas import DashboardSummary, TopBottomResponse, TopBottomItem
from app.auth import get_current_user

router = APIRouter()

METRIC_COLUMNS = {
    "lending":      MonitoringData.lending,
    "os_aktif":     MonitoringData.os_aktif,
    "noc":          MonitoringData.noc,
    "os_npl":       MonitoringData.os_npl,
    "pct_rr":       MonitoringData.pct_rr,
    "pct_lending":  MonitoringData.pct_lending,
}

# Ambang batas minimum pct_rr agar unit dianggap "sudah melapor".
# Konsisten dengan perilaku GAS yang hanya menghitung "78 unit pelapor"
# (mengecualikan unit dengan pct_rr = 0 atau belum mengisi data).
PCT_RR_MIN_THRESHOLD = 0.0   # > 0  → unit dengan nilai 0 dikecualikan


def _base_query(db: Session, region, area, period):
    """Helper: query MonitoringData dengan filter opsional."""
    q = db.query(MonitoringData)
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
    area:   Optional[str] = None,
    period: Optional[str] = None,
    db:     Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = _base_query(db, region, area, period).all()

    if not rows:
        return DashboardSummary(
            total_unit=0, total_noc=0, total_os_aktif=0.0,
            total_lending=0.0, total_os_npl=0.0, avg_pct_rr=0.0, period=period
        )

    total_noc     = sum(r.noc      or 0 for r in rows)
    total_os      = sum(r.os_aktif or 0 for r in rows)
    total_lending = sum(r.lending  or 0 for r in rows)
    total_npl     = sum(r.os_npl   or 0 for r in rows)

    # ── FIX #1: Rata-rata % RR — hanya unit yang sudah melapor (pct_rr > 0) ─
    # Konsisten dengan GAS yang menampilkan "rata-rata 78 unit pelapor".
    # Unit dengan pct_rr = None atau 0 TIDAK diikutkan dalam rata-rata.
    rr_vals = [
        r.pct_rr for r in rows
        if r.pct_rr is not None and r.pct_rr > PCT_RR_MIN_THRESHOLD
    ]
    avg_rr = sum(rr_vals) / len(rr_vals) if rr_vals else 0.0

    # ── FIX #2: pct_rr tersimpan sebagai 0–1 di DB (sudah dinormalisasi saat
    # import). Kalikan 100 untuk tampilan persentase (0–100%). ────────────────
    avg_pct_rr_display = round(avg_rr * 100, 2)

    periods = list(set(r.period for r in rows if r.period))
    latest_period = sorted(periods)[-1] if periods else None

    return DashboardSummary(
        total_unit=len(rows),
        total_noc=total_noc,
        total_os_aktif=round(total_os, 2),
        total_lending=round(total_lending, 2),
        total_os_npl=round(total_npl, 2),
        avg_pct_rr=avg_pct_rr_display,
        period=latest_period,
    )


@router.get("/top-bottom", response_model=TopBottomResponse)
def get_top_bottom(
    metric: str = Query("lending", enum=list(METRIC_COLUMNS.keys())),
    n:      int = Query(5, ge=1, le=20),
    region: Optional[str] = None,
    area:   Optional[str] = None,
    period: Optional[str] = None,
    db:     Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    col = METRIC_COLUMNS[metric]
    q   = _base_query(db, region, area, period).filter(col.isnot(None))

    # ── FIX #1 (top-bottom): Untuk metrik pct_rr, kecualikan unit
    # yang belum melapor (nilai 0) agar ranking konsisten dengan GAS. ─────────
    if metric == "pct_rr":
        q = q.filter(MonitoringData.pct_rr > PCT_RR_MIN_THRESHOLD)

    rows = q.all()

    def to_item(r: MonitoringData) -> TopBottomItem:
        raw_val = getattr(r, metric) or 0
        # ── FIX #2: konversi ke % untuk tampilan jika metrik adalah pct_rr ──
        display_val = round(raw_val * 100, 2) if metric == "pct_rr" else round(raw_val, 2)
        return TopBottomItem(
            unit=r.unit,
            region=r.region,
            area=r.area,
            value=display_val,
        )

    sorted_desc = sorted(rows, key=lambda r: getattr(r, metric) or 0, reverse=True)
    sorted_asc  = sorted(rows, key=lambda r: getattr(r, metric) or 0)

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
    areas   = [r[0] for r in db.query(MonitoringData.area).distinct().all()   if r[0]]
    periods = [r[0] for r in db.query(MonitoringData.period).distinct().all() if r[0]]
    return {"regions": sorted(regions), "areas": sorted(areas), "periods": sorted(periods)}
