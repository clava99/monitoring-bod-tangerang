import pandas as pd
import io
from typing import List, Dict, Any, Optional


def parse_excel_bytes(content: bytes, period: Optional[str] = None) -> List[Dict[str, Any]]:
    df = pd.read_excel(io.BytesIO(content), header=None)

    # ── Cari baris header utama ──────────────────────────────────────────────
    header_row = None
    for i, row in df.iterrows():
        vals = [str(v).strip() for v in row if pd.notna(v)]
        if "WILAYAH" in vals and "REGION" in vals and "UNIT" in vals:
            header_row = i
            break

    if header_row is None:
        raise ValueError("Tidak dapat menemukan header kolom di file Excel")

    sub_header_row = header_row + 1
    data_start     = sub_header_row + 1

    h2 = df.iloc[header_row]

    # ── Deteksi periode otomatis dari header ─────────────────────────────────
    period_value = period
    if not period_value:
        for i, val in enumerate(h2):
            if pd.notna(val) and "BOD" in str(val) and "2026" in str(val):
                period_value = str(val).strip()
                break

    # ── Mapping kolom: indeks → nama field ───────────────────────────────────
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

    # Kolom yang nilainya mungkin dalam bentuk desimal (0.938) dari Excel
    # dan perlu dinormalisasi ke 0–1 sebelum disimpan ke DB.
    # pct_rr  : GAS menyimpan 0–1, FastAPI juga harus 0–1
    # pct_noc, pct_os, pct_lending, pct_os_npl: sama
    PCT_FIELDS = {"pct_rr", "pct_noc", "pct_os", "pct_lending", "pct_os_npl"}

    records: List[Dict[str, Any]] = []

    # ── FIX #4: carry-forward untuk merged cell ──────────────────────────────
    last_wilayah = ""
    last_region  = ""
    last_area    = ""

    for i in range(data_start, len(df)):
        row = df.iloc[i]

        # Ambil nilai kolom unit
        unit_val = row.iloc[4] if len(row) > 4 else None

        # ── FIX #3: skip baris kosong DAN baris TOTAL/GRAND TOTAL ───────────
        if pd.isna(unit_val) or not str(unit_val).strip():
            continue
        unit_str = str(unit_val).strip()
        if "TOTAL" in unit_str.upper():
            continue

        # ── FIX #4: carry-forward wilayah / region / area ───────────────────
        def _str(v) -> str:
            return "" if pd.isna(v) else str(v).strip()

        w  = _str(row.iloc[0])
        rg = _str(row.iloc[1])
        ar = _str(row.iloc[2])
        if w:  last_wilayah = w
        if rg: last_region  = rg
        if ar: last_area    = ar

        record: Dict[str, Any] = {"period": period_value}

        for col_idx, field_name in col_map.items():
            if col_idx >= len(row):
                record[field_name] = None
                continue

            val = row.iloc[col_idx]

            # Kolom identitas teks (kecuali wilayah/region/area — sudah ditangani
            # carry-forward di atas)
            if field_name == "wilayah":
                record[field_name] = last_wilayah
                continue
            if field_name == "region":
                record[field_name] = last_region
                continue
            if field_name == "area":
                record[field_name] = last_area
                continue
            if field_name == "unit":
                record[field_name] = unit_str
                continue

            if pd.isna(val):
                record[field_name] = None
                continue

            # Kolom integer
            if field_name in ("noc", "noa_par", "noa_npl", "noa_lar",
                              "target_noc", "gap_noc", "ao"):
                try:
                    record[field_name] = int(float(val))
                except Exception:
                    record[field_name] = None

            # cabang_id
            elif field_name == "cabang_id":
                try:
                    record[field_name] = str(int(float(val)))
                except Exception:
                    record[field_name] = str(val).strip()

            # Kolom persentase — normalisasi ke 0–1
            # ── FIX #2: pastikan pct_rr tersimpan sebagai 0–1, BUKAN 0–100 ──
            elif field_name in PCT_FIELDS:
                try:
                    v = float(val)
                    # Jika nilai > 1 (artinya Excel sudah dalam format 0–100),
                    # bagi 100 agar konsisten dengan representasi 0–1 di DB.
                    if v > 1:
                        v = v / 100.0
                    record[field_name] = round(v, 6)
                except Exception:
                    record[field_name] = None

            # Kolom float biasa
            else:
                try:
                    record[field_name] = float(val)
                except Exception:
                    record[field_name] = None

        records.append(record)

    return records
