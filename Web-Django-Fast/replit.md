# SIGMON — Sistem Informasi Monitoring BOD

Dashboard monitoring BOD interaktif untuk Cabang Tangerang dengan 81 unit, analisis performa, dan manajemen data terintegrasi.

## Run & Operate

- API Server: runs via uvicorn at `/api` — `cd artifacts/api-server && uvicorn main:app --host 0.0.0.0 --port $PORT --reload`
- Frontend: React/Vite at `/` — `pnpm --filter @workspace/sigmon run dev`
- `pnpm run typecheck` — full typecheck across all packages
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT secret

## Stack

- **Backend**: FastAPI (Python 3.11) + SQLAlchemy + PostgreSQL
- **Frontend**: React + Vite + TailwindCSS + Recharts + Wouter
- **Auth**: JWT Bearer tokens (python-jose + bcrypt), RBAC (admin/manager/staff)
- **Import**: Excel (.xlsx) upload + Google Sheets URL sync
- **Export**: Download Excel laporan

## Where things live

- `artifacts/api-server/` — FastAPI backend Python app
  - `main.py` — entry point
  - `app/models.py` — SQLAlchemy models (users, monitoring_data, sync_logs)
  - `app/routers/` — auth, dashboard, units, import, export
  - `services/excel_service.py` — Excel parser (header di row 2, data mulai row 4)
  - `services/sheets_service.py` — Google Sheets downloader
- `artifacts/sigmon/` — React frontend
  - `src/pages/` — Login, Dashboard, Import, Units
  - `src/components/` — Sidebar, SummaryCards, TopBottomChart, UnitsTable
  - `src/lib/api.ts` — API client (fetch wrapper)
  - `src/contexts/AuthContext.tsx` — Auth state management

## Architecture decisions

- FastAPI menggantikan Express untuk API; artifact.toml diupdate ke uvicorn run command
- JWT `sub` field harus string (bukan integer) — python-jose throws JWTClaimsError jika integer
- bcrypt digunakan langsung (bukan passlib) karena passlib incompatible dengan bcrypt >= 4.0 di Python 3.11
- Excel parsing: header di row index 2 (WILAYAH, REGION, UNIT), data mulai row 4
- pct_rr disimpan sebagai desimal (0.0–1.0), ditampilkan sebagai persentase di frontend

## Product

- **Login** dengan JWT auth, 3 role: admin/manager/staff
- **Dashboard**: 6 KPI cards, Top 5 / Bottom 5 chart (6 metrik pilihan), tabel 81 unit
- **Import**: Upload Excel atau sync dari Google Sheets URL
- **Data Unit**: CRUD operations, sortable, searchable, paginated
- **Export Excel**: Download data terfilter

## Default credentials

| Username | Password  | Role    |
|----------|-----------|---------|
| admin    | admin123  | admin   |
| manager  | admin123  | manager |
| staff    | admin123  | staff   |

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- JWT `sub` must be string, not int — convert with `str(user.id)` when creating token
- Use `bcrypt` directly, not `passlib.context.CryptContext`, due to bcrypt >= 4.0 incompatibility
- Excel file header is at row index 2 (0-based), sub-header at row 3, data starts row 4
- The API server artifact runs Python uvicorn, not Node.js Express

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- FastAPI docs available at `/api/docs` when server is running
