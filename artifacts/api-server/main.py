import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.database import engine, Base
from app.routers import (
    auth_router,
    dashboard_router,
    units_router,
    import_router,
    export_router,
    config_router,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SIGMON API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

_default_origins = "http://localhost:5000,http://localhost:5173,http://localhost:8080"
_replit_domain = os.environ.get("REPLIT_DEV_DOMAIN")
if _replit_domain:
    _default_origins += f",https://{_replit_domain}"

ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", _default_origins).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth_router.router, prefix="/api/auth", tags=["auth"])
app.include_router(dashboard_router.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(units_router.router, prefix="/api/units", tags=["units"])
app.include_router(import_router.router, prefix="/api/import", tags=["import"])
app.include_router(export_router.router, prefix="/api/export", tags=["export"])
app.include_router(config_router.router, prefix="/api/config", tags=["config"])


@app.get("/api/healthz", tags=["health"])
def health_check():
    return {"status": "ok", "version": "1.0.0"}


static_dir = Path(__file__).parent / "static"

if static_dir.exists():
    assets_dir = static_dir / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_frontend(full_path: str):
        """
        Catch-all: semua URL yang bukan /api/* dikembalikan ke index.html
        sehingga React Router bisa handle navigasi sisi klien.
        """
        index_file = static_dir / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        return {"error": "Frontend belum di-build. Jalankan: cd artifacts/sigmon && pnpm build"}
