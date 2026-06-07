import pandas as pd
import io
from typing import List, Dict, Any, Optional


def parse_excel_bytes(content: bytes, period: Optional[str] = None) -> List[Dict[str, Any]]:
    df = pd.read_excel(io.BytesIO(content), header=None)

    header_row = None
    for i, row in df.iterrows():
        vals = [str(v).strip() for v in row if pd.notna(v)]
        if "WILAYAH" in vals and "REGION" in vals and "UNIT" in vals:
            header_row = i
            break

    if header_row is None:
        raise ValueError("Tidak dapat menemukan header kolom di file Excel")

    sub_header_row = header_row + 1
    data_start = sub_header_row + 1

    h2 = df.iloc[header_row]
    h3 = df.iloc[sub_header_row]

    period_value = period
    if not period_value:
        for i, val in enumerate(h2):
            if pd.notna(val) and "BOD" in str(val) and "2026" in str(val):
                period_value = str(val).strip()
                break

    col_map = {
        0: "wilayah", 1: "region", 2: "area", 3: "cabang_id", 4: "unit",
        18: "noa", 19: "noc", 20: "os_aktif", 21: "lending",
        22: "noa_par", 23: "os_par", 24: "noa_npl", 25: "os_npl",
        26: "os_3r", 27: "noa_lar", 28: "os_lar", 29: "pct_rr",
        46: "target_noc", 47: "target_os", 48: "target_lending",
        52: "gap_noc", 53: "gap_os", 54: "gap_lending",
        58: "pct_noc", 59: "pct_os", 60: "pct_lending",
        62: "pct_os_npl",
        65: "ao",
    }

    records = []
    for i in range(data_start, len(df)):
        row = df.iloc[i]
        unit_val = row.iloc[4] if len(row) > 4 else None
        if pd.isna(unit_val) or not str(unit_val).strip():
            continue

        record = {"period": period_value}
        for col_idx, field_name in col_map.items():
            if col_idx < len(row):
                val = row.iloc[col_idx]
                if pd.isna(val):
                    record[field_name] = None
                elif field_name in ("noc", "noa_par", "noa_npl", "noa_lar", "target_noc", "gap_noc", "ao"):
                    try:
                        record[field_name] = int(float(val))
                    except:
                        record[field_name] = None
                elif field_name in ("wilayah", "region", "area", "unit"):
                    record[field_name] = str(val).strip()
                elif field_name == "cabang_id":
                    record[field_name] = str(int(float(val))) if pd.notna(val) else None
                else:
                    try:
                        record[field_name] = float(val)
                    except:
                        record[field_name] = None
            else:
                record[field_name] = None

        records.append(record)

    return records
