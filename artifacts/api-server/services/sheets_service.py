import re
import time
import requests
from typing import List, Dict, Any, Optional
from services.excel_service import parse_excel_bytes


def _camel_to_snake(name: str) -> str:
    """Convert camelCase/PascalCase to snake_case: pctRr → pct_rr, osAktif → os_aktif"""
    s = re.sub(r"([A-Z])", r"_\1", name.strip()).lower().lstrip("_")
    return re.sub(r"_+", "_", s)


def is_apps_script_url(url: str) -> bool:
    return "script.google.com/macros/s/" in url


def extract_sheet_id(url: str) -> str:
    patterns = [
        r"/spreadsheets/d/([a-zA-Z0-9-_]+)",
        r"id=([a-zA-Z0-9-_]+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    raise ValueError("URL Google Sheets tidak valid. Pastikan URL mengandung '/spreadsheets/d/...'.")


def extract_gid(url: str) -> Optional[str]:
    match = re.search(r"[#&?]gid=(\d+)", url)
    return match.group(1) if match else None


def download_as_excel(
    spreadsheet_id: str,
    sheet_name: Optional[str] = None,
    gid: Optional[str] = None,
    retry: int = 3,
) -> bytes:
    export_url = (
        "https://docs.google.com/spreadsheets/d/"
        + spreadsheet_id
        + "/export?format=xlsx&id="
        + spreadsheet_id
    )
    if gid:
        export_url += "&gid=" + gid
    elif sheet_name and sheet_name != "Sheet1":
        export_url += "&sheet=" + sheet_name

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0 Safari/537.36"
        ),
        "Accept": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*",
    }

    last_err = None
    for attempt in range(1, retry + 1):
        try:
            resp = requests.get(export_url, headers=headers, timeout=45, allow_redirects=True)
            if resp.status_code == 200:
                content_type = resp.headers.get("Content-Type", "")
                if "text/html" in content_type:
                    raise ValueError(
                        "Google mengembalikan halaman HTML bukan file Excel. "
                        "Pastikan spreadsheet di-share ke 'Anyone with the link can view'."
                    )
                return resp.content
            elif resp.status_code == 401:
                raise ValueError("Akses ditolak (401). Ubah sharing spreadsheet ke 'Anyone with the link can view'.")
            elif resp.status_code == 403:
                raise ValueError("Akses dilarang (403). Pastikan sharing spreadsheet diatur ke 'Anyone with the link can view'.")
            elif resp.status_code == 404:
                raise ValueError("Spreadsheet tidak ditemukan (404). Periksa kembali URL.")
            elif resp.status_code == 429:
                time.sleep(2 * attempt)
                last_err = ValueError("Google membatasi request (429). Coba lagi beberapa saat.")
                continue
            else:
                raise ValueError("Gagal mengunduh spreadsheet. Status HTTP: " + str(resp.status_code))
        except ValueError:
            raise
        except requests.exceptions.Timeout:
            last_err = ValueError("Timeout saat mengunduh spreadsheet (percobaan " + str(attempt) + "/" + str(retry) + ").")
            if attempt < retry:
                time.sleep(1)
                continue
        except requests.exceptions.ConnectionError as e:
            raise ValueError("Tidak dapat terhubung ke Google Sheets: " + str(e))

    raise last_err or ValueError("Gagal mengunduh spreadsheet setelah beberapa percobaan.")


def fetch_from_apps_script(url: str) -> List[Dict[str, Any]]:
    headers = {
        "Accept": "application/json, text/plain, */*",
        "User-Agent": "SIGMON/1.0",
    }
    try:
        resp = requests.get(url, headers=headers, timeout=30, allow_redirects=True)
    except requests.exceptions.Timeout:
        raise ValueError("Timeout saat menghubungi Apps Script.")
    except requests.exceptions.ConnectionError as e:
        raise ValueError("Tidak dapat terhubung ke Apps Script: " + str(e))

    if "accounts.google.com" in resp.url:
        raise ValueError(
            "Apps Script redirect ke login Google. "
            "Saat deploy, set 'Who has access' ke 'Anyone' (bukan 'Anyone with Google Account')."
        )

    if resp.status_code != 200:
        raise ValueError(
            "Apps Script mengembalikan status " + str(resp.status_code) + ". "
            "Pastikan: 1) sudah di-deploy sebagai Web App, "
            "2) Execute as = Me, 3) Who has access = Anyone, 4) pakai URL /exec."
        )

    content_type = resp.headers.get("Content-Type", "")
    if "text/html" in content_type and "application/json" not in content_type:
        raise ValueError("Apps Script mengembalikan HTML bukan JSON. Periksa setting deployment.")

    try:
        payload = resp.json()
    except Exception:
        preview = resp.text[:200].strip()
        raise ValueError("Response bukan JSON valid. Preview: " + preview)

    if isinstance(payload, list):
        rows = payload
    elif isinstance(payload, dict):
        rows = payload.get("data") or payload.get("rows") or payload.get("records") or []
        if not rows:
            raise ValueError(
                "JSON tidak mengandung key 'data', 'rows', atau 'records'. "
                "Key ditemukan: " + str(list(payload.keys()))
            )
    else:
        raise ValueError("Format JSON tidak dikenali. Harus array atau object dengan key 'data'/'rows'.")

    if not rows:
        raise ValueError("Apps Script mengembalikan data kosong (0 baris).")

    return rows


def normalise_apps_script_records(rows: List[Dict], period: Optional[str] = None) -> List[Dict[str, Any]]:
    # Maps normalised source key → DB field name.
    # Covers both snake_case (legacy) and camelCase-derived snake_case keys
    # that Apps Script sends (e.g. pctRr → pct_rr, osAktif → os_aktif).
    FIELD_MAP = {
        # identity / string fields
        "wilayah": "wilayah", "region": "region", "area": "area",
        "cabang_id": "cabang_id", "cabang": "cabang_id", "cabangid": "cabang_id",
        "unit": "unit", "nama_unit": "unit",
        # NOA / NOC — Apps Script sends meiNoa / meiNoc
        "noa": "noa", "mei_noa": "noa", "meinoa": "noa",
        "noc": "noc", "mei_noc": "noc", "meinoc": "noc", "jumlah_nasabah": "noc",
        # OS Aktif — Apps Script key is osAktif (camelCase)
        "os_aktif": "os_aktif", "osaktif": "os_aktif",
        "os": "os_aktif", "outstanding": "os_aktif",
        # Lending
        "lending": "lending",
        # PAR / NPL / LAR
        "noa_par": "noa_par", "noapar": "noa_par",
        "os_par": "os_par",   "ospar": "os_par",
        "noa_npl": "noa_npl", "noanpl": "noa_npl",
        "os_npl": "os_npl",   "osnpl": "os_npl",
        "os_3r": "os_3r",     "os3r": "os_3r",
        "noa_lar": "noa_lar", "noalar": "noa_lar",
        "os_lar": "os_lar",   "oslar": "os_lar",
        # % RR — Apps Script key is pctRr
        "pct_rr": "pct_rr", "pctrr": "pct_rr",
        "rr": "pct_rr", "tingkat_pengembalian": "pct_rr",
        # RKAP / target — Apps Script sends rkapOs / rkapLending
        "target_noc": "target_noc",
        "target_os": "target_os",   "rkap_os": "target_os",   "rkapos": "target_os",
        "target_lending": "target_lending", "rkap_lending": "target_lending", "rkaplending": "target_lending",
        # Gap
        "gap_noc": "gap_noc", "gap_os": "gap_os", "gap_lending": "gap_lending",
        # % Pencapaian — Apps Script sends pctNoc / pctOs / pctLending
        "pct_noc": "pct_noc", "pctnoc": "pct_noc", "pencapaian_noc": "pct_noc",
        "pct_os": "pct_os",   "pctos": "pct_os",   "pencapaian_os": "pct_os",
        "pct_lending": "pct_lending", "pctlending": "pct_lending", "pencapaian_lending": "pct_lending",
        "pct_os_npl": "pct_os_npl",  "pctosnpl": "pct_os_npl",
        "pct_os_par": "pct_os_npl",  "pctospar": "pct_os_npl",
        "pct_os_lar": "pct_os_npl",  "pctoslar": "pct_os_npl",
        # AO & period
        "ao": "ao",
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

        # Build a normalised lookup that covers BOTH:
        #   1. simple lowercase + underscore (for snake_case keys)
        #   2. camelCase → snake_case conversion (for Apps Script camelCase keys)
        norm_row: Dict[str, Any] = {}
        for k, v in row.items():
            simple = k.strip().lower().replace(" ", "_")
            snake  = _camel_to_snake(k)
            norm_row[simple] = v
            if snake != simple:
                norm_row[snake] = v

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

        if period:
            record["period"] = period
        if record.get("unit"):
            records.append(record)
    return records


def sync_from_google_sheets(
    url: str,
    sheet_name: Optional[str] = None,
    period: Optional[str] = None,
) -> List[Dict[str, Any]]:
    url = url.strip()
    if is_apps_script_url(url):
        raw_rows = fetch_from_apps_script(url)
        return normalise_apps_script_records(raw_rows, period=period)
    else:
        sheet_id = extract_sheet_id(url)
        gid = extract_gid(url)
        excel_bytes = download_as_excel(sheet_id, sheet_name=sheet_name, gid=gid)
        return parse_excel_bytes(excel_bytes, period=period)