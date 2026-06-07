import re
import time
import requests
import io
from typing import List, Dict, Any, Optional
from services.excel_service import parse_excel_bytes


# ---------------------------------------------------------------------------
# URL helpers
# ---------------------------------------------------------------------------

def is_apps_script_url(url: str) -> bool:
    return "script.google.com/macros/s/" in url


def extract_sheet_id(url: str) -> str:
    """Extract spreadsheet ID from any Google Sheets URL variant."""
    patterns = [
        r"/spreadsheets/d/([a-zA-Z0-9-_]+)",
        r"id=([a-zA-Z0-9-_]+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    raise ValueError(
        "URL Google Sheets tidak valid. "
        "Pastikan URL mengandung '/spreadsheets/d/...' atau 'id=...'."
    )


def extract_gid(url: str) -> Optional[str]:
    """Extract sheet gid (tab index) from URL if present."""
    match = re.search(r"[#&?]gid=(\d+)", url)
    return match.group(1) if match else None


# ---------------------------------------------------------------------------
# Google Sheets export (URL spreadsheet biasa)
# ---------------------------------------------------------------------------

_EXPORT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0 Safari/537.36"
    ),
    "Accept": (
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,"
        "application/octet-stream,*/*"
    ),
}


def download_as_excel(
    spreadsheet_id: str,
    sheet_name: Optional[str] = None,
    gid: Optional[str] = None,
    retry: int = 3,
) -> bytes:
    """
    Download Google Spreadsheet as .xlsx via the /export endpoint.

    Perbaikan vs versi lama:
    - Menyertakan gid (tab index) bila ada di URL aslinya
    - Retry otomatis 3x untuk menghindari timeout sesaat
    - User-Agent lebih lengkap agar tidak diblokir Google
    - Pesan error lebih deskriptif per status code
    """
    export_url = (
        f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}"
        f"/export?format=xlsx&id={spreadsheet_id}"
    )

    # Tambahkan gid (nomor tab) bila tersedia
    if gid:
        export_url += f"&gid={gid}"
    elif sheet_name and sheet_name != "Sheet1":
        export_url += f"&sheet={sheet_name}"

    last_err = None
    for attempt in range(1, retry + 1):
        try:
            resp = requests.get(
                export_url,
                headers=_EXPORT_HEADERS,
                timeout=45,
                allow_redirects=True,
            )

            if resp.status_code == 200:
                # Pastikan konten adalah binary xlsx, bukan HTML error page
                content_type = resp.headers.get("Content-Type", "")
                if "text/html" in content_type:
                    raise ValueError(
                        "Google mengembalikan halaman HTML, bukan file Excel. "
                        "Kemungkinan spreadsheet belum di-share ke 'Anyone with the link'."
                    )
                return resp.content

            elif resp.status_code == 401:
                raise ValueError(
                    "Akses ditolak (401). Spreadsheet mungkin memerlukan login Google. "
                    "Ubah sharing ke 'Anyone with the link can view'."
                )
            elif resp.status_code == 403:
                raise ValueError(
                    "Akses dilarang (403). Pastikan sharing spreadsheet diatur ke "
                    "'Anyone with the link can view', bukan restricted."
                )
            elif resp.status_code == 404:
                raise ValueError(
                    "Spreadsheet tidak ditemukan (404). Periksa kembali URL yang dimasukkan."
                )
            elif resp.status_code == 429:
                # Rate limited - tunggu sebentar lalu retry
                time.sleep(2 * attempt)
                last_err = ValueError("Google membatasi request (429 Too Many Requests). Coba lagi dalam beberapa detik.")
                continue
            else:
                raise ValueError(
                    f"Gagal mengunduh spreadsheet. Status HTTP: {resp.status_code}. "
                    f"URL: {export_url}"
                )

        except ValueError:
            raise
        except requests.exceptions.Timeout:
            last_err = ValueError(
                f"Timeout saat mengunduh spreadsheet (percobaan {attempt}/{retry}). "
                "Coba lagi atau gunakan Apps Script untuk spreadsheet yang besar."
            )
            if attempt < retry:
                time.sleep(1)
                continue
        except requests.exceptions.ConnectionError as e:
            raise ValueError(
                f"Tidak dapat terhubung ke Google Sheets. "
                f"Periksa koneksi jaringan server. Detail: {e}"
            )

    raise last_err or ValueError("Gagal mengunduh spreadsheet setelah beberapa percobaan.")


# ---------------------------------------------------------------------------
# Apps Script fetch
# ---------------------------------------------------------------------------

def fetch_from_apps_script(url: str) -> List[Dict[str, Any]]:
    """
    Fetch JSON dari Google Apps Script Web App yang sudah di-deploy.

    Perbaikan vs versi lama:
    - Tambah Accept dan Origin header agar tidak diblokir CORS
    - Pesan error lebih spesifik per jenis kegagalan
    - Validasi content-type sebelum parse JSON
    """
    headers = {
        "Accept": "application/json, text/plain, */*",
        "User-Agent": "SIGMON/1.0 (Google Apps Script Sync)",
    }

    try:
        resp = requests.get(url, headers=headers, timeout=30, allow_redirects=True)
    except requests.exceptions.Timeout:
        raise ValueError(
            "Timeout saat menghubungi Apps Script. "
            "Pastikan script sudah di-deploy dan aksesnya 'Anyone'."
        )
    except requests.exceptions.ConnectionError as e:
        raise ValueError(f"Tidak dapat terhubung ke Apps Script. Detail: {e}")

    if resp.status_code == 302 or resp.url != url:
        # Google redirect ke login page berarti deployment tidak public
        if "accounts.google.com" in resp.url:
            raise ValueError(
                "Apps Script mengarahkan ke halaman login Google. "
                "Pastikan saat deploy, 'Who has access' diset ke 'Anyone' (bukan 'Anyone with Google Account')."
            )

    if resp.status_code != 200:
        raise ValueError(
            f"Apps Script mengembalikan status {resp.status_code}. "
            "Pastikan:\n"
            "1. Script sudah di-deploy sebagai Web App\n"
            "2. 'Execute as' = Me\n"
            "3. 'Who has access' = Anyone\n"
            "4. URL yang dipakai adalah URL /exec (bukan /dev)"
        )

    content_type = resp.headers.get("Content-Type", "")
    if "text/html" in content_type and "application/json" not in content_type:
        raise ValueError(
            "Apps Script mengembalikan HTML, bukan JSON. "
            "Kemungkinan akses di-redirect ke halaman login. "
            "Periksa kembali setting deployment Apps Script."
        )

    try:
        payload = resp.json()
    except Exception:
        preview = resp.text[:200].strip()
        raise ValueError(
            f"Response dari Apps Script bukan JSON yang valid. "
            f"Preview: {preview}"
        )

    if isinstance(payload, list):
        rows = payload
    elif isinstance(payload, dict):
        rows = (
            payload.get("data")
            or payload.get("rows")
            or payload.get("records")
            or []
        )
        if not rows:
            keys = list(payload.keys())
            raise ValueError(
                f"JSON dari Apps Script tidak mengandung key 'data', 'rows', atau 'records'. "
                f"Key yang ditemukan: {keys}. "
                "Pastikan script mengembalikan format yang benar."
            )
    else:
        raise ValueError(
            "Format JSON tidak dikenali. Harus berupa array atau "
            "object dengan key 'data'/'rows'/'records'."
        )

    if not rows:
        raise ValueError(
            "Apps Script mengembalikan data kosong (0 baris). "
            "Pastikan spreadsheet memiliki data dan nama sheet sudah benar."
        )

    return rows


# ---------------------------------------------------------------------------
# Normalise Apps Script JSON → DB records
# ---------------------------------------------------------------------------

def normalise_apps_script_records(
    rows: List[Dict], period: Optional[str] = None
) -> List[Dict[str, Any]]:
    FIELD_MAP = {
        "wilayah": "wilayah", "region": "region", "area": "area",
        "cabang_id": "cabang_id", "cabang": "cabang_id",
        "unit": "unit", "nama_unit": "unit",
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
        "target_noc": "target_noc",
        "target_os": "target_os",
        "target_lending": "target_lending",
        "gap_noc": "gap_noc",
        "gap_os": "gap_os",
        "gap_lending": "gap_lending",
        "pct_noc": "pct_noc", "pencapaian_noc": "pct_noc",
        "pct_os": "pct_os", "pencapaian_os": "pct_os",
        "pct_lending": "pct_lending", "pencapaian_lending": "pct_lending",
        "pct_os_npl": "pct_os_npl",
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

        if period is None and record.get("period"):
            pass
        elif period:
            record["period"] = period

        if record.get("unit"):
            records.append(record)

    return records


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def sync_from_google_sheets(
    url: str,
    sheet_name: Optional[str] = None,
    period: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Sinkronisasi data dari Google Sheets atau Apps Script.

    Mendukung dua mode:
    1. Apps Script URL  → fetch JSON langsung dari doGet()
    2. Spreadsheet URL → download sebagai .xlsx lalu parse seperti upload biasa
    """
    url = url.strip()

    if is_apps_script_url(url):
        raw_rows = fetch_from_apps_script(url)
        return normalise_apps_script_records(raw_rows, period=period)
    else:
        sheet_id = extract_sheet_id(url)
        gid = extract_gid(url)          # ambil tab index dari URL bila ada
        excel_bytes = download_as_excel(sheet_id, sheet_name=sheet_name, gid=gid)
        return parse_excel_bytes(excel_bytes, period=period)    ]
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
