---
title: Sigmon API
emoji: 📊
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
---

# SIGMON — Sistem Informasi Monitoring BOD

SIGMON adalah platform monitoring performa unit bisnis yang membantu manajemen dan Board of Directors melakukan pemantauan KPI, analisis risiko, evaluasi performa, serta pelaporan secara real-time melalui dashboard terintegrasi.

---

## Overview

Cabang Tangerang mengelola **81 unit bisnis aktif** yang perlu dipantau secara berkala berdasarkan data BOD _(Book of Data)_. Sebelumnya, proses ini dilakukan secara manual menggunakan spreadsheet Excel yang dibagikan lewat email, sehingga rentan terhadap keterlambatan informasi, inkonsistensi data, dan kesulitan analisis perbandingan antar unit.

**SIGMON hadir untuk:**

- Memusatkan data monitoring seluruh unit dalam satu sistem terpadu
- Memberikan visibilitas real-time terhadap KPI kritis: NOC, OS Aktif, Lending, OS NPL, dan % RR
- Mempercepat identifikasi unit dengan performa terbaik dan terburuk melalui grafik Top/Bottom
- Mengotomasi proses import data dari file Excel maupun Google Sheets
- Menyediakan laporan yang dapat diunduh sesuai filter periode, region, dan area

---

## Key Features

### Dashboard Monitoring
- **6 KPI Summary Cards**: Total Unit, Total NOC, OS Aktif (Juta), Total Lending (Juta), OS NPL (Juta), Rata-rata % RR
- Filter dinamis berdasarkan Region, Area, dan Periode
- Refresh data tanpa reload halaman

### Analisis Performa (Top/Bottom Chart)
- Grafik bar **Top 5 / Bottom 5 Unit** berdasarkan metrik pilihan
- 6 metrik tersedia: Lending, OS Aktif, NOC, OS NPL, % RR, % Pencapaian Lending
- Visualisasi interaktif menggunakan Recharts

### Manajemen Unit
- Tabel 81 unit yang dapat **diurutkan** (9 kolom), **dicari**, dan **dipaginasi**
- CRUD lengkap: Tambah, Edit, Hapus per unit
- Hapus massal (bulk delete) dan hapus semua data
- Export tabel ke file Excel terfilter

### Import Data
- **Upload Excel (.xlsx / .xls)** dengan deteksi header otomatis (cari baris WILAYAH + REGION + UNIT)
- **Sinkronisasi Google Sheets** via URL Spreadsheet publik
- **Sinkronisasi Apps Script** via Google Apps Script Web App URL
- Opsi replace data periode yang sama atau append
- Riwayat 20 log sinkronisasi terakhir

### Manajemen Pengguna
- Daftar seluruh pengguna (Admin only)
- Tambah dan hapus akun pengguna
- Aktivasi/nonaktivasi akun

### Autentikasi & Keamanan
- JWT Bearer Token (HS256, expire 24 jam)
- Password hashing dengan bcrypt (bcrypt ≥ 4.0)
- Role-Based Access Control (RBAC): Admin / Manager / Staff
- Protected routes di frontend dan dependency injection di backend

### UX & Aksesibilitas
- **Dark mode / Light mode** dengan toggle persisten (localStorage)
- Skeleton loading untuk transisi data yang mulus
- Responsif untuk tampilan mobile dan desktop

---

## User Roles

| Role | Deskripsi | Akses |
|---|---|---|
| **Admin** | Akses penuh ke seluruh sistem | Dashboard, Import, Export, CRUD Unit, Manajemen User, Konfigurasi |
| **Manager** | Monitoring dan pelaporan | Dashboard, Import (upload + sync), Export, Lihat Unit |
| **Staff** | Akses data operasional | Dashboard (read-only), Export, Lihat Unit |

### Matriks Akses Detail

| Fitur | Staff | Manager | Admin |
|---|:---:|:---:|:---:|
| Lihat Dashboard & KPI | ✅ | ✅ | ✅ |
| Lihat & Cari Tabel Unit | ✅ | ✅ | ✅ |
| Export Excel | ✅ | ✅ | ✅ |
| Upload File Excel | ❌ | ✅ | ✅ |
| Sinkronisasi Google Sheets | ❌ | ✅ | ✅ |
| Tambah / Edit Unit | ❌ | ✅ | ✅ |
| Hapus Unit / Bulk Delete | ❌ | ✅ | ✅ |
| Manajemen Pengguna | ❌ | ❌ | ✅ |
| Konfigurasi URL Sheets | ❌ | ❌ | ✅ |

---

## Tech Stack

### Frontend

| Teknologi | Versi | Fungsi |
|---|---|---|
| **TypeScript** | 5.x | Bahasa pemrograman (type-safe) |
| **React** | 18 | Library UI berbasis komponen |
| **Vite** | 5.x | Build tool & dev server |
| **Tailwind CSS** | 4.x | Utility-first CSS framework |
| **TanStack React Query** | — | Server state & data fetching |
| **Recharts** | 2.x | Grafik bar chart interaktif |
| **Wouter** | 3.x | Client-side routing ringan |
| **Radix UI** | — | Komponen UI headless (Dialog, Select, Toast, dll) |
| **Lucide React** | — | Library icon SVG |
| **Framer Motion** | — | Animasi transisi halaman & komponen |
| **React Hook Form + Zod** | — | Form management & validasi schema |
| **shadcn/ui** | — | Component library di atas Radix UI |

### Backend

| Teknologi | Versi | Fungsi |
|---|---|---|
| **Python** | 3.11 | Bahasa pemrograman backend |
| **FastAPI** | 0.136.x | Framework REST API async |
| **SQLAlchemy** | 2.x | ORM (Object-Relational Mapping) |
| **Pydantic** | 2.x | Validasi request/response schema |
| **Uvicorn** | — | ASGI server |
| **python-jose** | — | Pembuatan & validasi JWT (HS256) |
| **bcrypt** | ≥ 4.0 | Hashing password |
| **pandas** | — | Parsing & ekspor file Excel |
| **openpyxl** | — | Baca/tulis format .xlsx |
| **requests** | — | HTTP client untuk Google Sheets sync |

### Database

| Teknologi | Fungsi |
|---|---|
| **PostgreSQL** | Database relasional utama |
| **SQLAlchemy ORM** | Abstraksi query & manajemen koneksi |

### Integrations

| Integrasi | Keterangan |
|---|---|
| **Google Sheets API** | Sinkronisasi data dari spreadsheet publik |
| **Google Apps Script** | Sinkronisasi via Web App URL (JSON response) |
| **Excel Processing** | Upload & download file .xlsx dengan pandas + openpyxl |

---

## System Architecture

```mermaid
graph TD
    User["👤 User (Browser)"]

    subgraph Frontend ["Frontend — React + Vite (Port 5000)"]
        Login["Login Page"]
        Dashboard["Dashboard"]
        Units["Units Management"]
        Import["Import / Sync"]
        Users["User Management"]
    end

    subgraph Backend ["Backend — FastAPI (Port 8080)"]
        Auth["/api/auth"]
        DashAPI["/api/dashboard"]
        UnitsAPI["/api/units"]
        ImportAPI["/api/import"]
        ExportAPI["/api/export"]
        ConfigAPI["/api/config"]
    end

    subgraph DB ["Database — PostgreSQL"]
        UsersTable["users"]
        MonData["monitoring_data"]
        SyncLogs["sync_logs"]
        AppConfig["app_config"]
    end

    subgraph External ["External Sources"]
        Excel["File Excel (.xlsx)"]
        GSheets["Google Sheets"]
        AppsScript["Apps Script Web App"]
    end

    User --> Login
    Login --> Auth
    Auth --> UsersTable

    Dashboard --> DashAPI
    DashAPI --> MonData

    Units --> UnitsAPI
    UnitsAPI --> MonData

    Import --> ImportAPI
    ImportAPI --> Excel
    ImportAPI --> GSheets
    ImportAPI --> AppsScript
    ImportAPI --> MonData
    ImportAPI --> SyncLogs

    ExportAPI --> MonData
    ConfigAPI --> AppConfig

    Users --> Auth
```

---

## Project Structure

```
workspace/
│
├── artifacts/
│   │
│   ├── api-server/                      # Backend FastAPI (Python)
│   │   ├── main.py                      # Entry point: CORS, router mount, DB init
│   │   ├── app/
│   │   │   ├── auth.py                  # JWT middleware, bcrypt, dependency injection
│   │   │   ├── database.py              # Koneksi PostgreSQL, session factory
│   │   │   ├── models.py                # SQLAlchemy models (tabel DB)
│   │   │   ├── schemas.py               # Pydantic request/response schemas
│   │   │   └── routers/
│   │   │       ├── auth_router.py       # Login, me, CRUD user
│   │   │       ├── dashboard_router.py  # Summary KPI, top-bottom, filters
│   │   │       ├── units_router.py      # CRUD unit, bulk delete, paginasi
│   │   │       ├── import_router.py     # Upload Excel, sync Google Sheets
│   │   │       ├── export_router.py     # Download Excel terfilter
│   │   │       └── config_router.py     # Simpan/baca URL Google Sheets
│   │   └── services/
│   │       ├── excel_service.py         # Parser Excel: auto-detect header
│   │       └── sheets_service.py        # HTTP fetcher Google Sheets/Apps Script
│   │
│   └── sigmon/                          # Frontend React (TypeScript)
│       ├── public/                      # Static assets
│       └── src/
│           ├── pages/
│           │   ├── Login.tsx            # Halaman login + form auth
│           │   ├── Dashboard.tsx        # KPI cards + chart + tabel utama
│           │   ├── Units.tsx            # Manajemen data unit (CRUD)
│           │   ├── Import.tsx           # Upload Excel / sync Sheets
│           │   ├── Users.tsx            # Manajemen pengguna (Admin only)
│           │   └── not-found.tsx        # Halaman 404
│           ├── components/
│           │   ├── Sidebar.tsx          # Navigasi sidebar dengan role awareness
│           │   ├── SummaryCards.tsx     # 6 KPI cards dengan icon & accent
│           │   ├── TopBottomChart.tsx   # Recharts bar chart Top/Bottom 5
│           │   ├── UnitsTable.tsx       # Tabel sortable, searchable, paginated
│           │   ├── SkeletonLoader.tsx   # Loading skeleton placeholder
│           │   ├── ThemeToggle.tsx      # Toggle dark/light mode (3 varian)
│           │   └── ui/                  # shadcn/ui components (Dialog, Button, dll)
│           ├── contexts/
│           │   ├── AuthContext.tsx      # State login, JWT, user info
│           │   └── ThemeContext.tsx     # State tema, persist di localStorage
│           ├── hooks/
│           │   ├── use-mobile.tsx       # Deteksi viewport mobile
│           │   └── use-toast.ts         # Toast notification hook
│           └── lib/
│               ├── api.ts               # Fetch wrapper + error handling + auth header
│               └── utils.ts             # cn() utility untuk class merging
│
├── README.md                            # Dokumentasi proyek (file ini)
└── replit.md                            # Konfigurasi Replit
```

---

## Database Overview

| Tabel | Fungsi | Kolom Utama |
|---|---|---|
| **users** | Akun pengguna & autentikasi | id, username, email, hashed_password, role, is_active, created_at |
| **monitoring_data** | Data KPI seluruh unit per periode | id, period, wilayah, region, area, unit, noc, os_aktif, lending, os_npl, pct_rr, target_*, gap_*, pct_*, ao |
| **sync_logs** | Riwayat import & sinkronisasi | id, sync_type, source, status, records_count, error_message, created_at |
| **app_config** | Konfigurasi aplikasi (key-value) | id, key, value, updated_at |

### Detail Kolom monitoring_data

| Kolom | Tipe | Keterangan |
|---|---|---|
| `period` | String | Label periode, contoh: "BOD 30 MEI 2026" |
| `wilayah` | String | Wilayah cabang |
| `region` | String | Kode region |
| `area` | String | Kode area |
| `unit` | String | Nama unit bisnis |
| `noc` | Integer | Number of Contract |
| `os_aktif` | Float | Outstanding aktif (jutaan) |
| `lending` | Float | Total lending (jutaan) |
| `os_npl` | Float | Outstanding NPL (jutaan) |
| `pct_rr` | Float | Repayment Rate, desimal 0.0–1.0 (tampil ×100%) |
| `target_*` | Float/Int | Target NOC, OS, Lending |
| `gap_*` | Float/Int | Selisih aktual vs target |
| `pct_lending` | Float | % Pencapaian Lending |
| `ao` | Integer | Jumlah AO (Account Officer) |

---

## Installation Guide

### Clone Repository

```bash
git clone <repository-url>
cd sigmon
```

### Backend Setup

```bash
cd artifacts/api-server

# Buat virtual environment
python -m venv .venv

# Aktifkan virtual environment
source .venv/bin/activate        # Linux / macOS
# atau
.venv\Scripts\activate           # Windows

# Install dependensi
pip install fastapi uvicorn sqlalchemy psycopg2-binary \
    python-jose bcrypt pandas openpyxl requests pydantic
```

### Environment Variables

Buat file `.env` di root `api-server/`:

```env
# Wajib diisi
DATABASE_URL=postgresql://username:password@localhost:5432/sigmon_db
SESSION_SECRET=your-random-secret-key-minimal-32-karakter

# Opsional
ALLOWED_ORIGINS=http://localhost:5000,https://yourdomain.com
```

### Inisialisasi Database

```bash
# Pastikan PostgreSQL berjalan, lalu jalankan server
# Tabel akan dibuat otomatis oleh SQLAlchemy saat pertama start
uvicorn main:app --reload --port 8080
```

### Run Backend

```bash
cd artifacts/api-server
.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```

### Frontend Setup

```bash
cd artifacts/sigmon

# Install dependensi (gunakan pnpm)
pnpm install
```

### Run Frontend

```bash
pnpm dev --host 0.0.0.0 --port 5000
```

> **Di Replit**: kedua workflow sudah dikonfigurasi otomatis — cukup klik **Run**.

---

## Application Workflow

### Alur Kerja Pengguna

1. **Login** — User memasukkan username & password; backend memvalidasi dengan bcrypt dan menerbitkan JWT token (expire 24 jam)
2. **JWT Authentication** — Token disimpan di `localStorage`; setiap request menyertakan `Authorization: Bearer <token>`
3. **Dashboard Loading** — Frontend memanggil 3 endpoint paralel: summary KPI, top-bottom chart, tabel unit
4. **Filter & Analisis** — User memilih Region / Area / Periode; data ter-refresh tanpa reload
5. **Import Data** — Manager/Admin upload Excel atau klik sync Google Sheets; backend mem-parse, menyimpan ke DB, dan mencatat log
6. **Performance Analysis** — Grafik Top 5 / Bottom 5 menampilkan perbandingan unit berdasarkan metrik pilihan
7. **Manajemen Unit** — Admin dapat tambah, edit, atau hapus data unit langsung dari tabel
8. **Export Laporan** — User download file Excel terfilter untuk keperluan pelaporan
9. **Manajemen Akun** — Admin dapat membuat dan menghapus akun pengguna dari halaman Users

---

## Flowchart

### Alur Utama Aplikasi

```mermaid
flowchart TD
    A([Buka Browser]) --> B[Halaman Login]
    B --> C{Kredensial\nValid?}
    C -- Tidak --> D[Tampilkan Error]
    D --> B
    C -- Ya --> E[JWT Token Diterbitkan\nDisimpan localStorage]
    E --> F[Dashboard Utama]

    F --> G[6 KPI Cards\nNOC · OS Aktif · Lending\nOS NPL · % RR · Total Unit]
    F --> H[Grafik Top 5 / Bottom 5\n6 Pilihan Metrik]
    F --> I[Tabel Unit\nSortable · Search · Paginated]
    F --> J{Navigasi Sidebar}

    J -- Import --> K[Halaman Import]
    J -- Data Unit --> L[Halaman Unit]
    J -- Users --> M[Halaman Users\nAdmin Only]
    J -- Logout --> B

    K --> N{Pilih Metode}
    N -- Upload Excel --> O[Pilih File .xlsx]
    N -- Google Sheets --> P[Klik Sinkronisasi]
    O & P --> Q[(PostgreSQL\nmonitoring_data)]
    Q --> F

    L --> R{Aksi}
    R -- Tambah/Edit --> S[Form Unit]
    R -- Hapus --> T[Konfirmasi]
    S & T --> Q

    M --> U{Aksi User}
    U -- Tambah --> V[Form Pengguna]
    U -- Hapus --> W[Konfirmasi Hapus]
    V & W --> X[(PostgreSQL\nusers)]
```

### Alur Autentikasi JWT

```mermaid
sequenceDiagram
    participant B as Browser
    participant F as React Frontend
    participant A as FastAPI Backend
    participant D as PostgreSQL

    B->>F: Input username + password
    F->>A: POST /api/auth/login
    A->>D: SELECT user WHERE username=? AND is_active=true
    D-->>A: User record
    A->>A: bcrypt.checkpw(password, hashed_password)

    alt Password Benar
        A->>A: jwt.encode(sub=str(user.id), exp=24h, alg=HS256)
        A-->>F: { access_token, token_type, user }
        F->>F: localStorage.setItem('token', ...)
        F-->>B: Redirect → Dashboard
    else Password Salah
        A-->>F: 401 Unauthorized
        F-->>B: Tampilkan pesan error
    end

    Note over F,A: Setiap request berikutnya

    F->>A: GET /api/dashboard/summary\nAuthorization: Bearer eyJ...
    A->>A: jwt.decode() → user_id
    A->>D: SELECT user WHERE id=? AND is_active=true
    D-->>A: User valid
    A->>D: SELECT monitoring_data ...
    D-->>A: Rows data
    A-->>F: JSON { total_unit, avg_pct_rr, ... }
    F-->>B: Render KPI Cards
```

### Alur Import Data Excel

```mermaid
flowchart TD
    A([File .xlsx Diupload]) --> B[Baca sebagai bytes]
    B --> C[pandas.read_excel header=None]
    C --> D{Loop baris:\ncari WILAYAH+REGION+UNIT}
    D -- Tidak ditemukan --> E([Error: Format tidak dikenali])
    D -- Ditemukan di baris X --> F[sub_header = X+1\ndata_start = X+2]
    F --> G{replace=True?}
    G -- Ya --> H[DELETE data periode yang sama]
    G -- Tidak --> I
    H --> I[Loop setiap baris data]
    I --> J{Kolom UNIT\nkosong?}
    J -- Ya --> K[Skip baris]
    K --> I
    J -- Tidak --> L[Map 30+ kolom ke field DB\ncol 19=NOC, 29=% RR, dll]
    L --> M[bulk_save_objects ke monitoring_data]
    M --> N[Catat ke sync_logs]
    N --> O([Selesai: N records berhasil])
```

### Alur Sinkronisasi Google Sheets

```mermaid
flowchart TD
    A([Klik Sinkronisasi]) --> B[Baca sheets_url\ndari app_config]
    B --> C{URL dikonfigurasi?}
    C -- Tidak --> D([Error: URL belum diatur])
    C -- Ya --> E{Tipe URL?}
    E -- apps_script\nscript.google.com --> F[HTTP GET ke Apps Script]
    E -- spreadsheet\ndocs.google.com --> G[Konstruksi CSV export URL]
    G --> H[HTTP GET CSV]
    F --> I{Response OK?}
    H --> I
    I -- Gagal/Timeout --> J[Log status=failed\nTampilkan error]
    I -- OK --> K[Parse JSON / CSV]
    K --> L[Mapping field ke MonitoringData]
    L --> M[DELETE periode lama + INSERT baru]
    M --> N[Log status=success\nrecords_count=N]
    N --> O([Tampilkan: N data berhasil disinkronkan])
```

---

## API Overview

### Authentication (`/api/auth`)

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| `POST` | `/api/auth/login` | Login, dapatkan JWT token | Public |
| `GET` | `/api/auth/me` | Info user yang sedang login | Semua |
| `GET` | `/api/auth/users` | Daftar semua pengguna | Admin |
| `POST` | `/api/auth/users` | Buat akun pengguna baru | Admin |
| `DELETE` | `/api/auth/users/{user_id}` | Hapus pengguna | Admin |

### Dashboard (`/api/dashboard`)

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| `GET` | `/api/dashboard/summary` | 6 KPI agregasi (dengan filter) | Semua |
| `GET` | `/api/dashboard/top-bottom` | Top 5 / Bottom 5 unit per metrik | Semua |
| `GET` | `/api/dashboard/filters` | Daftar Region, Area, Periode tersedia | Semua |

**Query params `top-bottom`**: `metric` (lending/os_aktif/noc/os_npl/pct_rr/pct_lending), `n` (1–20), `region`, `area`, `period`

### Units (`/api/units`)

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| `GET` | `/api/units` | Daftar unit (paginasi, sort, search, filter) | Semua |
| `GET` | `/api/units/{id}` | Detail satu unit | Semua |
| `POST` | `/api/units` | Tambah unit baru | Manager+ |
| `PUT` | `/api/units/{id}` | Edit data unit | Manager+ |
| `DELETE` | `/api/units/{id}` | Hapus satu unit | Manager+ |
| `DELETE` | `/api/units/bulk/selected` | Hapus beberapa unit (bulk) | Manager+ |
| `DELETE` | `/api/units/all/data` | Hapus semua data unit | Manager+ |

**Query params `GET /units`**: `page`, `limit`, `region`, `area`, `period`, `search`, `sort_by`, `sort_order`

### Import (`/api/import`)

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| `POST` | `/api/import/excel` | Upload & import file Excel | Manager+ |
| `POST` | `/api/import/sheets-sync` | Sinkronisasi dari Google Sheets | Manager+ |
| `GET` | `/api/import/logs` | Riwayat sinkronisasi (20 terakhir) | Semua |

### Export (`/api/export`)

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| `GET` | `/api/export/excel` | Download file Excel terfilter | Semua |

### Config (`/api/config`)

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| `GET` | `/api/config/sheets` | Baca konfigurasi sumber data | Semua |
| `PUT` | `/api/config/sheets` | Simpan URL Google Sheets | Admin |
| `DELETE` | `/api/config/sheets` | Hapus konfigurasi | Admin |

> Dokumentasi API interaktif (Swagger UI) tersedia di **`/api/docs`** saat server berjalan.

---

## Security Features

### JWT Authentication
- Token menggunakan algoritma **HS256** dengan `SESSION_SECRET` dari environment variable
- Masa berlaku token: **24 jam**
- Field `sub` berisi `str(user.id)` — selalu string, bukan integer
- Token dikirim via header `Authorization: Bearer <token>` di setiap request

### Password Hashing
- Menggunakan library **bcrypt** versi ≥ 4.0 secara langsung (`bcrypt.hashpw` / `bcrypt.checkpw`)
- Tidak menggunakan `passlib.CryptContext` karena inkompatibel dengan bcrypt ≥ 4.0 di Python 3.11
- Salt di-generate otomatis untuk setiap password

### Role-Based Access Control (RBAC)
- 3 level role: `admin`, `manager`, `staff`
- Enforcement dilakukan di level backend via FastAPI dependency injection (`require_admin`, `require_manager`)
- Frontend menyembunyikan elemen UI yang tidak sesuai role, namun validasi utama tetap di backend

### Protected Routes
- Seluruh endpoint (kecuali `/api/auth/login`) memerlukan JWT valid
- User yang dihapus atau di-deaktivasi (`is_active=False`) otomatis ditolak meskipun token masih valid

### API Security
- CORS dikonfigurasi di `main.py` dengan daftar origin yang diizinkan
- Input divalidasi dengan **Pydantic schemas** sebelum menyentuh database
- Query database menggunakan **SQLAlchemy ORM** — tidak ada raw SQL string yang rentan injection

---

## Default Credentials

| Username | Password | Role |
|---|---|---|
| `admin` | `admin123` | Admin — akses penuh |
| `manager` | `admin123` | Manager — import & monitoring |
| `staff` | `admin123` | Staff — baca & export |

> ⚠️ **Ganti seluruh password default sebelum digunakan di lingkungan produksi!**

---

## Future Improvements

| Improvement | Manfaat |
|---|---|
| **Alembic Migration** | Versioning skema database yang aman untuk production deployment |
| **Redis Cache** | Cache hasil agregasi dashboard agar tidak query DB setiap request |
| **Audit Logging** | Catat siapa yang melakukan perubahan apa dan kapan |
| **Background Jobs (Celery)** | Jadwal otomatis sinkronisasi Google Sheets setiap hari |
| **Multi-Periode Comparison** | Grafik tren performa unit antar beberapa periode |
| **Notifikasi Alert** | Peringatan otomatis jika unit turun di bawah threshold tertentu |
| **Monitoring & Observability** | Integrasi Prometheus/Grafana untuk memantau performa API |
| **Test Coverage** | Unit tests dan integration tests untuk endpoint kritis |

---

## License

Internal Company Project — Cabang Tangerang.
