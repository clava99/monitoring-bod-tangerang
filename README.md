# SIGMON — Sistem Informasi Monitoring BOD

Dashboard monitoring BOD interaktif untuk Cabang Tangerang dengan 81 unit, analisis performa, dan manajemen data terintegrasi.

## Stack

- **Backend**: FastAPI (Python 3.11) + SQLAlchemy + PostgreSQL
- **Frontend**: React + Vite + TailwindCSS + Recharts
- **Auth**: JWT Bearer + RBAC (admin/manager/staff)
- **Import**: Upload Excel (.xlsx) atau sync dari Google Sheets URL
- **Export**: Download laporan Excel

## Setup Development

### Backend

```bash
cd artifacts/api-server
pip install -r requirements.txt
cp ../../.env.example .env        # isi nilai yang sesuai
uvicorn main:app --reload --port 8080
```

### Frontend

```bash
cd artifacts/sigmon
pnpm install
pnpm dev
```

## Environment Variables

Lihat `.env.example` untuk daftar lengkap. Variabel wajib:

| Variable | Keterangan |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | String random panjang untuk JWT signing |
| `ALLOWED_ORIGINS` | (Opsional) Comma-separated daftar origin frontend |

## Default Credentials (Development)

| Username | Password | Role |
|---|---|---|
| admin | admin123 | admin |
| manager | admin123 | manager |
| staff | admin123 | staff |

> **Ganti password default segera di production!**

## Struktur Project

```
artifacts/api-server/   → FastAPI backend
  app/                  → Models, routers, auth
  services/             → Excel & Google Sheets parser
  tests/                → Unit tests
  main.py               → Entry point

artifacts/sigmon/       → React/Vite frontend
  src/pages/            → Login, Dashboard, Import, Units
  src/components/       → UI components
  src/lib/api.ts        → API client

.env.example            → Template environment variables
Dockerfile              → Untuk Hugging Face Spaces deployment
```

## API Docs

Buka `/api/docs` saat server berjalan untuk Swagger UI interaktif.

## Menjalankan Tests

```bash
cd artifacts/api-server
pytest tests/ -v
```
