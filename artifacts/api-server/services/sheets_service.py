import re
import requests
import io
from typing import List, Dict, Any, Optional
from services.excel_service import parse_excel_bytes


def is_apps_script_url(url: str) -> bool:
    return "script.google.com/macros/s/" in url


def fetch_from_apps_script(url: str) -> List[Dict[str, Any]]:
    """
    Fetch JSON data from a deployed Google Apps Script Web App.
    The script must return an array of objects or {"data": [...]} / {"rows": [...]}.
    """
    headers = {"Accept": "application/json", "User-Agent": "SIGMON/1.0"}
    resp = requests.get(url, headers=headers, timeout=30, allow_redirects=True)

    if resp.status_code != 200:
        raise ValueError(f"Apps Script mengembalikan status {resp.status_code}. Pastikan deployment sudah benar dan aksesnya 'Anyone'.")

    try:
        payload = resp.json()
    except Exception:
        raise ValueError("Response dari Apps Script bukan JSON yang valid. Periksa kode Apps Script kamu.")

    # Normalise ke list of dicts
    if isinstance(payload, list):
        rows = payload
    elif isinstance(payload, dict):
        rows = payload.get("data") or payload.get("rows") or payload.get("records") or []
        if not rows:
            raise ValueError("JSON dari Apps Script tidak mengandung key 'data', 'rows', atau 'records'.")
    else:
        raise ValueError("Format JSON tidak dikenali. Harus berupa array atau object dengan key 'data'/'rows'.")

    if not rows:
        raise ValueError("Apps Script mengembalikan data kosong.")

    return rows


def normalise_apps_script_records(rows: List[Dict], period: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Map field names from Apps Script JSON to SIGMON database columns.
    Supports both Indonesian and English field names, case-insensitive.
    """
    FIELD_MAP = {
        # unit identity
        "wilayah": "wilayah", "region": "region", "area": "area",
        "cabang_id": "cabang_id", "cabang": "cabang_id",
        "unit": "unit", "nama_unit": "unit",

        # BOD metrics
        "noa": "noa",
        "noc": "noc", "jumlah_nasabah": "noc",
        "os_aktif": "os_aktif", "os": "os_aktif", "outstanding": "os_aktif",
        "lending": "lending",
        "noa_par": "noa_par",
        "os_par": "os_par",
        "noa_npl": "noa_npl",
        "os_npl": "os_npl",
        "os_3r": "os_3r",
        "noa_lar": "noa_lar",
        "os_lar": "os_lar",
        "pct_rr": "pct_rr", "rr": "pct_rr", "tingkat_pengembalian": "pct_rr",

        # targets
        "target_noc": "target_noc",
        "target_os": "target_os",
        "target_lending": "target_lending",

        # gaps
        "gap_noc": "gap_noc",
        "gap_os": "gap_os",
        "gap_lending": "gap_lending",

        # achievement %
        "pct_noc": "pct_noc", "pencapaian_noc": "pct_noc",
        "pct_os": "pct_os", "pencapaian_os": "pct_os",
        "pct_lending": "pct_lending", "pencapaian_lending": "pct_lending",
        "pct_os_npl": "pct_os_npl",

        # AO
        "ao": "ao",

        # period
        "period": "period", "periode": "period",
    }

    INT_FIELDS = {"noc", "noa_par", "noa_npl", "noa_lar", "target_noc", "gap_noc", "ao"}
    FLOAT_FIELDS = {
        "noa", "os_aktif", "lending", "os_par", "os_npl", "os_3r",
        "os_lar", "pct_rr", "target_os", "target_lending",
        "gap_os", "gap_lending", "pct_noc", "pct_os", "pct_lending", "pct_os_npl",
    }

    records = []
    for row in rows:
        if not isinstance(row, dict):
            continue

        # Normalise keys: lowercase + strip
        norm_row = {k.strip().lower().replace(" ", "_"): v for k, v in row.items()}

        record: Dict[str, Any] = {"period": period}

        for src_key, db_key in FIELD_MAP.items():
            if src_key in norm_row:
                val = norm_row[src_key]
                if val is None or (isinstance(val, str) and val.strip() == ""):
                    record.setdefault(db_key, None)
                    continue
                if db_key in INT_FIELDS:
                    try:
                        record[db_key] = int(float(val))
                    except (TypeError, ValueError):
                        record[db_key] = None
                elif db_key in FLOAT_FIELDS:
                    try:
                        record[db_key] = float(val)
                    except (TypeError, ValueError):
                        record[db_key] = None
                else:
                    record[db_key] = str(val).strip() if val is not None else None

        # Override period from row data if present & caller didn't force one
        if period is None and "period" in record and record["period"]:
            pass  # already set from row
        elif period:
            record["period"] = period

        if record.get("unit"):
            records.append(record)

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


def download_as_excel(spreadsheet_id: str, sheet_name: Optional[str] = None) -> bytes:
    export_url = f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/export?format=xlsx"
    if sheet_name:
        export_url += f"&sheet={sheet_name}"
    headers = {"User-Agent": "Mozilla/5.0"}
    response = requests.get(export_url, headers=headers, timeout=30)
    if response.status_code == 403:
        raise ValueError("Spreadsheet tidak bisa diakses. Pastikan sharing diatur ke 'Anyone with the link can view'.")
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
        sheet_id = extract_sheet_id(url)
        excel_bytes = download_as_excel(sheet_id, sheet_name)
        return parse_excel_bytes(excel_bytes, period=period)
