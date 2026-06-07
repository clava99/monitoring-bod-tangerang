import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.routers import auth_router, dashboard_router, units_router, import_router, export_router
from app.routers import config_router

Base.metadata.create_all(bind=engine)


def seed_default_users():
    from app.models import User
    from app.auth import get_password_hash
    db = SessionLocal()
    try:
        defaults = [
            ("admin", "admin@sigmon.local", "admin123", "admin"),
            ("manager", "manager@sigmon.local", "admin123", "manager"),
            ("staff", "staff@sigmon.local", "admin123", "staff"),
        ]
        for username, email, password, role in defaults:
            if not db.query(User).filter(User.username == username).first():
                db.add(User(
                    username=username,
                    email=email,
                    hashed_password=get_password_hash(password),
                    role=role,
                ))
        db.commit()
    finally:
        db.close()


seed_default_users()

app = FastAPI(title="SIGMON API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
