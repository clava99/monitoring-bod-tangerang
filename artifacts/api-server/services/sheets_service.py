import re
import requests
from typing import List, Dict, Any, Optional


def is_apps_script_url(url: str) -> bool:
    return "script.google.com/macros/s/" in url


def fetch_from_apps_script(url: str) -> List[Dict[str, Any]]:
    """
    Fetch JSON data dari Google Apps Script Web App.
    GAS mengembalikan: { success, count, data: [...], fetchedAt, fromCache }
    """
    headers = {"Accept": "application/json", "User-Agent": "SIGMON/1.0"}
    resp = requests.get(url, headers=headers, timeout=30, allow_redirects=True)

    if resp.status_code != 200:
        raise ValueError(
            f"Apps Script mengembalikan status {resp.status_code}. "
            "Pastikan deployment sudah benar dan aksesnya 'Anyone'."
        )

    try:
        payload = resp.json()
    except Exception:
        raise ValueError(
            "Response dari Apps Script bukan JSON yang valid. "
            "Periksa kode Apps Script kamu."
        )

    # Format GAS: { success: true, data: [...] }
    if isinstance(payload, dict):
        if payload.get("success", True) is not False:
            rows = (
                payload.get("data")
                or payload.get("rows")
                or payload.get("records")
                or []
            )
        else:
            raise ValueError(f"Apps Script error: {payload.get('error', 'Unknown error')}")
    elif isinstance(payload, list):
        rows = payload
    else:
        raise ValueError("Format JSON tidak dikenali dari Apps Script.")

    if not rows:
        raise ValueError("Apps Script mengembalikan data kosong (0 baris).")

    return rows


def _detect_column_aliases(rows: List[Dict]) -> Dict[str, str]:
    """
    Auto-detect non-standard column names by analyzing values.
    Returns a mapping of detected_key -> sigmon_field.
    """
    KNOWN_SIGMON_FIELDS = {
        "wilayah", "region", "area", "unit", "cabangid", "cabang_id",
        "noa", "noc", "osaktif", "os_aktif", "lending",
        "noapar", "noa_par", "ospar", "os_par", "noanpl", "noa_npl",
        "osnpl", "os_npl", "os3r", "os_3r", "pctrr", "pct_rr",
        "target_noc", "target_os", "target_lending",
        "gap_noc", "gap_os", "gap_lending",
        "pct_noc", "pct_os", "pct_lending", "pct_os_npl", "ao", "period",
    }

    REGION_KEYWORDS = ["reg.", "region", "regional", "wilayah"]
    AREA_KEYWORDS = ["area", "cab.", "cabang"]
    UNIT_KEYWORDS = ["unit", "kcp", "kcu", "kantor"]

    extra_map: Dict[str, str] = {}
    col_samples: Dict[str, List[str]] = {}

    for row in rows[:10]:
        for k, v in row.items():
            norm_k = k.strip().lower().replace(" ", "").replace("_", "")
            if norm_k in KNOWN_SIGMON_FIELDS:
                continue
            if norm_k not in col_samples:
                col_samples[norm_k] = []
            if v and isinstance(v, str) and v.strip():
                col_samples[norm_k].append(v.strip().lower())

    for col_key, samples in col_samples.items():
        if not samples:
            continue
        joined = " ".join(samples)
        if any(kw in col_key for kw in REGION_KEYWORDS) or any(kw in joined for kw in REGION_KEYWORDS):
            extra_map[col_key] = "region"
        elif any(kw in col_key for kw in AREA_KEYWORDS):
            extra_map[col_key] = "area"
        elif any(kw in col_key for kw in UNIT_KEYWORDS):
            extra_map[col_key] = "unit"

    return extra_map


def normalise_apps_script_records(
    rows: List[Dict], period: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Map field camelCase dari GAS ke snake_case untuk DB.

    GAS mengirim field seperti:
      wilayah, region, area, cabangId, unit,
      noa, noc, osAktif, lending,
      noaPar, osPar, noaNpl, osNpl, os3r,
      pctRr, rkapOs, rkapLending,
      pctNoc, pctOs, pctLending, pctOsNpl
    """

    FIELD_MAP = {
        # identitas
        "wilayah":      "wilayah",
        "region":       "region",
        "area":         "area",
        "cabangid":     "cabang_id",
        "cabang_id":    "cabang_id",
        "unit":         "unit",
        "namaunit":     "unit",
        "nama_unit":    "unit",
        "kcp":          "unit",
        "kcu":          "unit",
        # metrik utama MEI (bulan berjalan)
        "meinoa":       "noa",
        "noa":          "noa",
        "meinoc":       "noc",
        "noc":          "noc",
        "jumlah_nasabah": "noc",
        "osaktif":      "os_aktif",
        "os_aktif":     "os_aktif",
        "os":           "os_aktif",
        "outstanding":  "os_aktif",
        "lending":      "lending",
        "noapar":       "noa_par",
        "noa_par":      "noa_par",
        "ospar":        "os_par",
        "os_par":       "os_par",
        "noanpl":       "noa_npl",
        "noa_npl":      "noa_npl",
        "osnpl":        "os_npl",
        "os_npl":       "os_npl",
        "os3r":         "os_3r",
        "os_3r":        "os_3r",
        "noalar":       "noa_lar",
        "noa_lar":      "noa_lar",
        "oslar":        "os_lar",
        "os_lar":       "os_lar",
        "pctrr":        "pct_rr",
        "pct_rr":       "pct_rr",
        "rr":           "pct_rr",
        "tingkat_pengembalian": "pct_rr",
        # APR 2026 (bulan sebelumnya)
        "aprnoa":       "apr_noa",
        "aprnoc":       "apr_noc",
        "aprosaktif":   "apr_os_aktif",
        "aprlending":   "apr_lending",
        "aprnoapar":    "apr_noa_par",
        "aprospar":     "apr_os_par",
        "aprnoanpl":    "apr_noa_npl",
        "aprosnpl":     "apr_os_npl",
        "apros3r":      "apr_os_3r",
        "aprnoalar":    "apr_noa_lar",
        "aproslar":     "apr_os_lar",
        "aprpctrr":     "apr_pct_rr",
        # RKAP / target
        "rkapnoc":      "target_noc",
        "rkapos":       "target_os",
        "rkap_os":      "target_os",
        "targetos":     "target_os",
        "target_os":    "target_os",
        "rkaplending":  "target_lending",
        "rkap_lending": "target_lending",
        "targetlending": "target_lending",
        "target_lending": "target_lending",
        "targetnoc":    "target_noc",
        "target_noc":   "target_noc",
        "rkapospar":    "rkap_os_par",
        "rkappctosnpl": "rkap_pct_os_npl",
        "rkappctoslar": "rkap_pct_os_lar",
        # gap
        "gapnoc":       "gap_noc",
        "gap_noc":      "gap_noc",
        "gapos":        "gap_os",
        "gap_os":       "gap_os",
        "gaplending":   "gap_lending",
        "gap_lending":  "gap_lending",
        # pencapaian %
        "pctnoc":       "pct_noc",
        "pct_noc":      "pct_noc",
        "pencapaian_noc": "pct_noc",
        "pctos":        "pct_os",
        "pct_os":       "pct_os",
        "pencapaian_os": "pct_os",
        "pctlending":   "pct_lending",
        "pct_lending":  "pct_lending",
        "pencapaian_lending": "pct_lending",
        "pctospar":     "pct_os_par",
        "pct_os_par":   "pct_os_par",
        "pctosnpl":     "pct_os_npl",
        "pct_os_npl":   "pct_os_npl",
        "pctoslar":     "pct_os_lar",
        "pct_os_lar":   "pct_os_lar",
        "ao":           "ao",
        # periode
        "period":       "period",
        "periode":      "period",
    }

    INT_FIELDS = {
        "noc", "noa_par", "noa_npl", "noa_lar", "target_noc", "gap_noc", "ao",
        "apr_noc", "apr_noa_par", "apr_noa_npl", "apr_noa_lar",
    }
    FLOAT_FIELDS = {
        "noa", "os_aktif", "lending", "os_par", "os_npl",
        "os_3r", "os_lar", "target_os", "target_lending",
        "gap_os", "gap_lending",
        "apr_noa", "apr_os_aktif", "apr_lending", "apr_os_par",
        "apr_os_npl", "apr_os_3r", "apr_os_lar",
        "rkap_os_par",
    }
    PCT_FIELDS = {
        "pct_rr", "pct_noc", "pct_os", "pct_lending", "pct_os_npl", "pct_os_par", "pct_os_lar",
        "apr_pct_rr", "rkap_pct_os_npl", "rkap_pct_os_lar",
    }

    # Auto-detect kolom non-standar
    extra_aliases = _detect_column_aliases(rows)
    effective_map = {**FIELD_MAP, **extra_aliases}

    records: List[Dict[str, Any]] = []

    for row in rows:
        if not isinstance(row, dict):
            continue

        # Normalise key: simpan versi tanpa spasi/underscore + versi snake_case
        norm_row: Dict[str, Any] = {}
        for k, v in row.items():
            lookup = k.strip().lower().replace(" ", "").replace("_", "")
            norm_row[lookup] = v
            snake = k.strip().lower().replace(" ", "_")
            norm_row[snake] = v

        # Skip baris TOTAL atau tanpa unit
        unit_raw = norm_row.get("unit") or norm_row.get("namaunit") or norm_row.get("nama_unit") or ""
        if not unit_raw or "TOTAL" in str(unit_raw).upper():
            continue

        record: Dict[str, Any] = {"period": period}

        for lookup_key, db_key in effective_map.items():
            val = norm_row.get(lookup_key)
            if val is None:
                continue
            if isinstance(val, str) and val.strip() == "":
                record.setdefault(db_key, None)
                continue

            if db_key in INT_FIELDS:
                try:
                    record[db_key] = int(float(val))
                except (TypeError, ValueError):
                    record[db_key] = None
            elif db_key in PCT_FIELDS:
                try:
                    v = float(val)
                    # GAS menyimpan pct sebagai 0–1 atau 0–100
                    if v > 1:
                        v = v / 100.0
                    record[db_key] = round(v, 6)
                except (TypeError, ValueError):
                    record[db_key] = None
            elif db_key in FLOAT_FIELDS:
                try:
                    record[db_key] = float(val)
                except (TypeError, ValueError):
                    record[db_key] = None
            elif db_key == "period":
                if not period:
                    record[db_key] = str(val).strip()
            else:
                record[db_key] = str(val).strip() if val is not None else None

        if period:
            record["period"] = period

        if record.get("unit"):
            records.append(record)

    # Jika 0 records, beri error yang jelas
    if not records and rows:
        found_keys = sorted(set(
            k.strip().lower().replace(" ", "_")
            for row in rows[:3]
            for k in row.keys()
            if k.strip()
        ))
        raise ValueError(
            f"Apps Script tidak mengembalikan field yang dikenali. "
            f"Field yang ditemukan: {found_keys}. "
            f"Field wajib: 'unit'. "
            f"Contoh format: {{\"unit\": \"KCP Nama\", \"region\": \"Reg. X\", \"noc\": 100, \"osAktif\": 500.5}}"
        )

    return records


def extract_sheet_id(url: str) -> str:
    patterns = [
        r"/spreadsheets/d/([a-zA-Z0-9-_]+)",
        r"id=([a-zA-Z0-9-_]+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    raise ValueError("URL Google Sheets tidak valid.")


def download_as_excel(
    spreadsheet_id: str, sheet_name: Optional[str] = None
) -> bytes:
    export_url = (
        f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/export?format=xlsx"
    )
    if sheet_name:
        export_url += f"&sheet={sheet_name}"
    headers = {"User-Agent": "Mozilla/5.0"}
    response = requests.get(export_url, headers=headers, timeout=30)
    if response.status_code == 403:
        raise ValueError(
            "Spreadsheet tidak bisa diakses. "
            "Pastikan sharing diatur ke 'Anyone with the link can view'."
        )
    if response.status_code != 200:
        raise ValueError(f"Gagal mengunduh spreadsheet. Status: {response.status_code}")
    return response.content


def sync_from_google_sheets(
    url: str,
    sheet_name: Optional[str] = None,
    period: Optional[str] = None,
) -> List[Dict[str, Any]]:
    if is_apps_script_url(url):
        raw_rows = fetch_from_apps_script(url)
        return normalise_apps_script_records(raw_rows, period=period)
    else:
        from services.excel_service import parse_excel_bytes
        sheet_id = extract_sheet_id(url)
        excel_bytes = download_as_excel(sheet_id, sheet_name)
        return parse_excel_bytes(excel_bytes, period=period)
