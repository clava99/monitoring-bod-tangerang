from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
import pandas as pd
import io
from app.database import get_db
from app.models import MonitoringData, User
from app.auth import get_current_user

router = APIRouter()


@router.get("/excel")
def export_excel(
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

    data = []
    for r in rows:
        data.append({
            "Period": r.period,
            "Wilayah": r.wilayah,
            "Region": r.region,
            "Area": r.area,
            "Cabang ID": r.cabang_id,
            "Unit": r.unit,
            "NOC": r.noc,
            "OS Aktif (Juta)": r.os_aktif,
            "Lending (Juta)": r.lending,
            "NOA PAR": r.noa_par,
            "OS PAR": r.os_par,
            "NOA NPL": r.noa_npl,
            "OS NPL": r.os_npl,
            "% RR": r.pct_rr,
            "Target NOC": r.target_noc,
            "Target OS": r.target_os,
            "Target Lending": r.target_lending,
            "Gap NOC": r.gap_noc,
            "Gap OS": r.gap_os,
            "Gap Lending": r.gap_lending,
            "% Pencapaian NOC": r.pct_noc,
            "% Pencapaian OS": r.pct_os,
            "% Pencapaian Lending": r.pct_lending,
            "% OS NPL": r.pct_os_npl,
            "AO": r.ao,
        })

    df = pd.DataFrame(data)
    buf = io.BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="SIGMON Data")
    buf.seek(0)

    filename = f"SIGMON_Export_{period or 'all'}.xlsx"
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
