import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import auth_router, dashboard_router, units_router, import_router, export_router
from app.routers import config_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SIGMON API", version="1.0.0")

_default_origins = "http://localhost:5000,http://localhost:5173"
_replit_domain = os.environ.get("REPLIT_DEV_DOMAIN")
if _replit_domain:
    _default_origins += f",https://{_replit_domain}"

ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", _default_origins).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth_router.router, prefix="/api/auth", tags=["auth"])
app.include_router(dashboard_router.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(units_router.router, prefix="/api/units", tags=["units"])
app.include_router(import_router.router, prefix="/api/import", tags=["import"])
app.include_router(export_router.router, prefix="/api/export", tags=["export"])
app.include_router(config_router.router, prefix="/api/config", tags=["config"])


@app.get("/api/healthz")
def health_check():
    return {"status": "ok"}
