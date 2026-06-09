---
title: Sigmon API
emoji: 📊
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
---

# SIGMON — Sistem Informasi Monitoring BOD

> Dashboard monitoring interaktif untuk memantau performa 81 unit di Cabang Tangerang secara real-time, lengkap dengan analisis KPI, grafik Top/Bottom, dan manajemen data terintegrasi.

---

## Daftar Isi

- [Tentang Proyek](#tentang-proyek)
- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Arsitektur Sistem](#arsitektur-sistem)
- [Struktur Folder](#struktur-folder)
- [Cara Menjalankan](#cara-menjalankan)
- [Alur Kerja Aplikasi](#alur-kerja-aplikasi)
- [Flowchart Sistem](#flowchart-sistem)
- [Hak Akses RBAC](#hak-akses-rbac)
- [Format Data Excel](#format-data-excel)
- [API Endpoints](#api-endpoints)
- [Kredensial Default](#kredensial-default)

---

## Tentang Proyek

**SIGMON** (Sistem Informasi Monitoring BOD) adalah aplikasi web _full-stack_ yang dirancang untuk memantau performa unit-unit di Cabang Tangerang berdasarkan data BOD _(Book of Data)_. Aplikasi ini menggantikan proses monitoring manual berbasis spreadsheet dengan dashboard yang dapat diakses oleh seluruh jenjang manajemen.

**Fitur Utama:**

- Login dengan autentikasi JWT dan 3 level akses (Admin / Manager / Staff)
- Dashboard dengan **6 KPI cards**: Total Unit, Total NOC, OS Aktif, Total Lending, OS NPL, Rata-rata % RR
- **Grafik Top 5 / Bottom 5** unit berdasarkan 6 pilihan metrik
- **Tabel 81 unit** yang dapat diurutkan, dicari, dan dipaginasi
- **Import data** dari file Excel (.xlsx) atau sinkronisasi dari Google Sheets / Apps Script API
- **Export laporan** ke Excel dengan filter periode/region/area
- **Manajemen data unit**: Tambah, Edit, Hapus (CRUD)
- **Dark mode / Light mode** dengan toggle persisten

---

## Teknologi yang Digunakan

### Backend

| Teknologi | Fungsi |
|---|---|
| **Python 3.11** | Bahasa pemrograman backend |
| **FastAPI** | Framework REST API, routing, dependency injection |
| **SQLAlchemy** | ORM (Object-Relational Mapping) untuk database |
| **PostgreSQL** | Database relasional penyimpan seluruh data |
| **Uvicorn** | ASGI server yang menjalankan FastAPI |
| **python-jose** | Pembuatan dan validasi JWT token |
| **bcrypt** | Hashing password (digunakan langsung, tanpa passlib) |
| **pandas + openpyxl** | Parsing dan ekspor file Excel (.xlsx) |
| **requests** | HTTP client untuk sinkronisasi Google Sheets |

### Frontend

| Teknologi | Fungsi |
|---|---|
| **TypeScript** | Bahasa pemrograman frontend (type-safe) |
| **React 18** | Library UI berbasis komponen |
| **Vite 5** | Build tool dan dev server ultra-cepat |
| **TailwindCSS 4** | Utility-first CSS framework |
| **Recharts** | Komponen grafik bar chart (Top/Bottom 5) |
| **Wouter** | Client-side routing ringan |
| **Lucide React** | Library ikon SVG |

### Infrastruktur & Tooling

| Komponen | Keterangan |
|---|---|
| **pnpm Workspace** | Monorepo package manager |
| **Replit** | Platform hosting, environment, dan deployment |

---

## Arsitektur Sistem

```
┌─────────────────────────────────────────────────────┐
│                  BROWSER (User)                      │
│       React + Vite + TailwindCSS  (Port 5000)        │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP Fetch API
                       │ Authorization: Bearer <JWT>
┌──────────────────────▼──────────────────────────────┐
│             FastAPI Backend  (Port 8080)              │
│                                                      │
│  /api/auth       → Login, validasi token             │
│  /api/dashboard  → KPI summary, Top/Bottom chart     │
│  /api/units      → CRUD data unit                    │
│  /api/import     → Upload Excel / Sync Google Sheets │
│  /api/export     → Download Excel laporan            │
│  /api/config     → Konfigurasi URL sumber data       │
└──────────────────────┬──────────────────────────────┘
                       │ SQLAlchemy ORM
┌──────────────────────▼──────────────────────────────┐
│                  PostgreSQL Database                  │
│                                                      │
│  users            → Akun pengguna + role             │
│  monitoring_data  → Data BOD 81 unit per periode     │
│  sync_logs        → Riwayat import/sinkronisasi      │
│  app_config       → URL Google Sheets tersimpan      │
└─────────────────────────────────────────────────────┘
                       ▲
          ┌────────────┴────────────┐
          │                         │
  ┌───────┴──────┐       ┌──────────┴──────┐
  │  File Excel  │       │  Google Sheets   │
  │   (.xlsx)    │       │  / Apps Script   │
  └──────────────┘       └─────────────────┘
```

---

## Struktur Folder

```
workspace/
├── artifacts/
│   ├── api-server/                    ← Backend FastAPI (Python)
│   │   ├── main.py                    ← Entry point, CORS, router mount
│   │   ├── requirements.txt           ← Daftar dependensi Python
│   │   ├── app/
│   │   │   ├── models.py              ← SQLAlchemy models (tabel DB)
│   │   │   ├── schemas.py             ← Pydantic request/response schemas
│   │   │   ├── auth.py                ← JWT middleware & dependency
│   │   │   ├── database.py            ← Koneksi PostgreSQL
│   │   │   └── routers/
│   │   │       ├── auth_router.py     ← POST /auth/login, GET /auth/me
│   │   │       ├── dashboard_router.py← GET /dashboard/summary, top-bottom
│   │   │       ├── units_router.py    ← GET/POST/PUT/DELETE /units
│   │   │       ├── import_router.py   ← POST /import/excel, sheets-sync
│   │   │       ├── export_router.py   ← GET /export/excel
│   │   │       └── config_router.py   ← GET/POST /config/sheets
│   │   └── services/
│   │       ├── excel_service.py       ← Parser Excel: deteksi header otomatis
│   │       └── sheets_service.py      ← HTTP fetcher Google Sheets/Apps Script
│   │
│   └── sigmon/                        ← Frontend React (TypeScript)
│       └── src/
│           ├── pages/
│           │   ├── Login.tsx          ← Halaman login + form auth
│           │   ├── Dashboard.tsx      ← KPI cards + chart + tabel utama
│           │   ├── Units.tsx          ← Manajemen data unit (CRUD)
│           │   └── Import.tsx         ← Upload Excel / sync Google Sheets
│           ├── components/
│           │   ├── Sidebar.tsx        ← Navigasi sidebar
│           │   ├── SummaryCards.tsx   ← 6 KPI cards dengan icon + accent
│           │   ├── TopBottomChart.tsx ← Bar chart Top 5 / Bottom 5
│           │   ├── UnitsTable.tsx     ← Tabel sortable + search + paginasi
│           │   └── ThemeToggle.tsx    ← Toggle dark/light mode (3 varian)
│           ├── contexts/
│           │   ├── AuthContext.tsx    ← State login, user info, JWT
│           │   └── ThemeContext.tsx   ← State tema, localStorage persist
│           └── lib/
│               └── api.ts             ← Fetch wrapper + error handling
│
├── README.md                          ← Dokumentasi proyek (file ini)
└── replit.md                          ← Konfigurasi & catatan Replit
```

---

## Cara Menjalankan

### Prasyarat

- Python 3.11+
- Node.js 18+ dan pnpm
- PostgreSQL (atau Replit Database bawaan)

### Environment Variables

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
SESSION_SECRET=random-secret-key-minimal-32-karakter
```

### Jalankan Backend

```bash
cd artifacts/api-server
python -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```

### Jalankan Frontend

```bash
cd artifacts/sigmon
pnpm install
pnpm dev --host 0.0.0.0 --port 5000
```

> Saat berjalan di Replit, kedua workflow sudah dikonfigurasi otomatis — cukup klik **Run**.

---

## Alur Kerja Aplikasi

### 1. Login & Autentikasi

1. User membuka halaman login dan memasukkan username + password
2. Frontend mengirim `POST /api/auth/login`
3. Backend memvalidasi dengan `bcrypt.checkpw()` terhadap hash di database
4. Jika valid, backend menerbitkan **JWT Token** berlaku 8 jam
5. Frontend menyimpan token di `localStorage`
6. Setiap request selanjutnya menyertakan header `Authorization: Bearer <token>`
7. Backend memvalidasi token di setiap endpoint via dependency injection

### 2. Melihat Dashboard

1. Frontend memanggil `GET /api/dashboard/summary` → 6 KPI card
2. Memanggil `GET /api/dashboard/top-bottom?metric=lending` → grafik bar
3. Memanggil `GET /api/units?page=1&sort_by=unit` → tabel unit
4. User dapat memfilter data berdasarkan **Region**, **Area**, dan **Periode**
5. Toggle metrik grafik langsung update chart tanpa reload halaman

### 3. Import Data via Excel

1. User memilih file `.xlsx` dan klik Upload
2. Backend menerima file sebagai bytes (`multipart/form-data`)
3. `excel_service.py` membaca dengan pandas: **deteksi otomatis baris header** (cari baris dengan WILAYAH + REGION + UNIT)
4. Data di-parse sesuai mapping kolom (col 18–29 = data MEI 2026)
5. Nilai `% RR` dibaca sebagai desimal (0.944 = 94.4%), disimpan as-is
6. Jika `replace=True`, data periode yang sama dihapus dulu sebelum INSERT
7. Hasil dicatat ke tabel `sync_logs`

### 4. Import via Google Sheets / Apps Script

1. Admin menyimpan URL sumber data di halaman Import → Konfigurasi
2. URL bisa berupa Google Sheets biasa (public) atau Apps Script Web App URL
3. User klik **Sinkronisasi Sekarang**
4. Backend melakukan `HTTP GET` ke URL tersebut
5. Jika Apps Script: respons JSON langsung diparse
6. Jika Spreadsheet biasa: `sheets_service.py` mengunduh dan parse CSV export
7. Data disimpan ke database, log dicatat

### 5. Export Laporan

1. User mengatur filter (periode/region/area) di dashboard
2. Klik tombol **Ekspor Excel**
3. Frontend mengirim `GET /api/export/excel` dengan parameter filter
4. Backend query database sesuai filter, generate file `.xlsx` dengan openpyxl
5. File langsung terunduh ke perangkat user

---

## Flowchart Sistem

### Alur Utama Aplikasi

```mermaid
flowchart TD
    A([User Buka Browser]) --> B[Halaman Login]
    B --> C{Kredensial Valid?}
    C -- Tidak --> D[Tampilkan Pesan Error]
    D --> B
    C -- Ya --> E[JWT Token Diterbitkan\n& Disimpan localStorage]
    E --> F[Dashboard Utama]

    F --> G[6 KPI Cards\nTotal Unit · NOC · OS Aktif\nLending · OS NPL · % RR]
    F --> H[Grafik Top 5 / Bottom 5\n6 Pilihan Metrik]
    F --> I[Tabel 81 Unit\nSortable · Search · Paginated]
    F --> J{Pilih Menu Sidebar}

    J -- Import Data --> K[Halaman Import]
    J -- Data Unit --> L[Halaman CRUD Unit]
    J -- Logout --> B

    K --> M{Pilih Metode Import}
    M -- Upload Excel --> N[Pilih File .xlsx]
    M -- Google Sheets --> O[Klik Sinkronisasi]

    N --> P[Backend: Parse Excel\nexcel_service.py]
    O --> Q[Backend: Fetch HTTP\nsheets_service.py]

    P --> R[(PostgreSQL\nmonitoring_data)]
    Q --> R

    R --> F

    L --> S{Aksi User}
    S -- Tambah --> T[Form Tambah Unit\nAdmin Only]
    S -- Edit --> U[Form Edit Unit\nAdmin Only]
    S -- Hapus --> V[Konfirmasi Hapus\nAdmin Only]
    T & U & V --> R
```

### Alur Import Data Excel

```mermaid
flowchart TD
    A([File .xlsx Diupload]) --> B[Baca sebagai bytes]
    B --> C[pandas.read_excel\nheader=None]
    C --> D{Cari baris header\nWILAYAH + REGION + UNIT}
    D -- Tidak ditemukan --> E([Error:\nFormat file tidak dikenali])
    D -- Ditemukan di baris X --> F[Sub-header = baris X+1\nData mulai baris X+2]
    F --> G[Loop setiap baris data]
    G --> H{Kolom UNIT\nkosong?}
    H -- Ya --> I[Skip baris ini]
    I --> G
    H -- Tidak --> J[Map kolom ke field DB\ncol 19=NOC, 20=OS Aktif\n25=OS NPL, 29=% RR, dst]
    J --> K{Parameter\nreplace=True?}
    K -- Ya --> L[DELETE data\nperiode yang sama]
    L --> M[INSERT record baru]
    K -- Tidak --> M
    M --> N[(Simpan ke\nmonitoring_data)]
    N --> O[Catat ke sync_logs]
    O --> P([Selesai:\nN record berhasil diimport])
```

### Alur Autentikasi JWT

```mermaid
sequenceDiagram
    participant U as Browser
    participant F as Frontend React
    participant A as FastAPI Backend
    participant D as PostgreSQL

    U->>F: Input username + password
    F->>A: POST /api/auth/login
    A->>D: SELECT * FROM users WHERE username=?
    D-->>A: User record (hashed_password, role)
    A->>A: bcrypt.checkpw(password, hashed_password)

    alt Password Benar
        A->>A: Buat JWT\nsub=str(user.id), exp=8jam
        A-->>F: { access_token, token_type: "bearer" }
        F->>F: Simpan token di localStorage
        F-->>U: Redirect → Dashboard
    else Password Salah
        A-->>F: 401 Unauthorized
        F-->>U: Tampilkan pesan error
    end

    Note over F,A: Setiap request berikutnya

    F->>A: GET /api/dashboard/summary\nAuthorization: Bearer eyJ...
    A->>A: Decode & validasi JWT signature
    A->>A: Cek expired? Cek sub valid?
    A->>D: Query monitoring_data
    D-->>A: Data rows
    A-->>F: JSON { total_unit, total_noc, ... }
    F-->>U: Render KPI cards
```

### Alur Sinkronisasi Google Sheets

```mermaid
flowchart TD
    A([Admin simpan URL]) --> B{Tipe URL?}
    B -- Apps Script .../exec --> C[HTTP GET ke Apps Script URL]
    B -- Google Spreadsheet --> D[Konstruksi CSV export URL\n/export?format=csv&gid=...]
    C --> E{Response OK?}
    D --> F[HTTP GET CSV]
    F --> E
    E -- Error / Timeout --> G([Catat gagal ke sync_logs\nTampilkan pesan error])
    E -- OK --> H{Tipe konten?}
    H -- JSON Apps Script --> I[Parse JSON array]
    H -- CSV Spreadsheet --> J[Parse CSV dengan pandas]
    I & J --> K[Mapping field:\nosAktif, lending, pctRr, dst]
    K --> L[INSERT ke monitoring_data]
    L --> M[Catat sukses ke sync_logs]
    M --> N([Tampilkan: N data berhasil\ndisinkronkan])
```

---

## Hak Akses RBAC

| Fitur | Staff | Manager | Admin |
|---|:---:|:---:|:---:|
| Lihat Dashboard & KPI | ✅ | ✅ | ✅ |
| Lihat & Cari Tabel Unit | ✅ | ✅ | ✅ |
| Export Excel | ✅ | ✅ | ✅ |
| Sinkronisasi Google Sheets | ❌ | ✅ | ✅ |
| Upload File Excel | ❌ | ✅ | ✅ |
| Tambah / Edit Unit | ❌ | ❌ | ✅ |
| Hapus Unit / Hapus Semua | ❌ | ❌ | ✅ |
| Konfigurasi URL Sumber Data | ❌ | ❌ | ✅ |
| Manajemen Pengguna | ❌ | ❌ | ✅ |

---

## Format Data Excel

File Excel yang dapat diimport harus memiliki struktur berikut:

| Baris | Isi |
|---|---|
| Baris 1–2 | Header kosong / judul laporan |
| **Baris 3** | **Header utama**: WILAYAH, REGION, AREA, UNIT + label periode |
| **Baris 4** | **Sub-header**: nama kolom detail (OS Aktif, NOC, Lending, % RR, dst) |
| **Baris 5+** | **Data** satu baris per unit |

**Kolom yang dibaca** (index 0-based):

| Index | Sub-header | Field di DB | Keterangan |
|---|---|---|---|
| 0 | WILAYAH | `wilayah` | |
| 1 | REGION | `region` | |
| 2 | AREA | `area` | |
| 4 | UNIT | `unit` | Wajib ada, baris kosong dilewati |
| 19 | NOC | `noc` | Periode MEI 2026 |
| 20 | OS Aktif | `os_aktif` | Dalam jutaan |
| 21 | Lending | `lending` | Dalam jutaan |
| 25 | OS NPL | `os_npl` | Dalam jutaan |
| **29** | **% RR** | **`pct_rr`** | **Desimal 0.0–1.0** (94.4% → 0.944) |

> ⚠️ **Penting:** Nilai `% RR` di Excel disimpan internal sebagai desimal (94.4% = 0.944). SIGMON membaca nilai ini langsung dan menampilkan `× 100` di layar. Pastikan sel diformat sebagai **Percentage** di Excel, bukan angka biasa.

---

## API Endpoints

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| POST | `/api/auth/login` | Login, dapatkan JWT token | Public |
| GET | `/api/auth/me` | Info user yang sedang login | Semua |
| GET | `/api/dashboard/summary` | 6 KPI aggregasi | Semua |
| GET | `/api/dashboard/top-bottom` | Top 5 / Bottom 5 unit | Semua |
| GET | `/api/dashboard/filters` | Daftar region/area/periode | Semua |
| GET | `/api/units` | Daftar unit (paginasi, sort, search) | Semua |
| POST | `/api/units` | Tambah unit baru | Admin |
| PUT | `/api/units/{id}` | Edit data unit | Admin |
| DELETE | `/api/units/{id}` | Hapus satu unit | Admin |
| DELETE | `/api/units` | Hapus semua unit | Admin |
| POST | `/api/import/excel` | Upload & import file Excel | Manager+ |
| POST | `/api/import/sheets-sync` | Sinkronisasi dari Google Sheets | Manager+ |
| GET | `/api/import/logs` | Riwayat sinkronisasi (20 terakhir) | Semua |
| GET | `/api/export/excel` | Download Excel laporan terfilter | Semua |
| GET | `/api/config/sheets` | Baca konfigurasi sumber data | Semua |
| POST | `/api/config/sheets` | Simpan/update URL Google Sheets | Admin |
| DELETE | `/api/config/sheets` | Hapus konfigurasi | Admin |

> Dokumentasi API interaktif (Swagger UI) tersedia di `/api/docs` saat server berjalan.

---

## Kredensial Default

| Username | Password | Role |
|---|---|---|
| `admin` | `admin123` | Admin — akses penuh |
| `manager` | `admin123` | Manager — import + sync |
| `staff` | `admin123` | Staff — baca + export |

> ⚠️ **Ganti password default sebelum digunakan di lingkungan produksi!**

---

*SIGMON v1.0 — Sistem Informasi Monitoring BOD | Cabang Tangerang*
