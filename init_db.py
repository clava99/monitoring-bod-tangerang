"""
init_db.py — Inisialisasi database untuk SIGMON
Mendukung SQLite (dev) dan PostgreSQL/Neon (production)
"""
import os
import sys

# Pastikan /app ada di path agar bisa import app.*
sys.path.insert(0, os.path.dirname(__file__))

from app.database import engine, Base
from app.models import User, MonitoringData, SyncLog, AppConfig
from sqlalchemy.orm import Session
from sqlalchemy import text
import bcrypt


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def seed_users(db: Session):
    existing = db.query(User).filter(User.username == "admin").first()
    if existing:
        print("Users sudah ada, skip seeding.")
        return

    users = [
        User(
            username="admin",
            email="admin@sigmon.id",
            hashed_password=hash_password("admin123"),
            role="admin",
            is_active=True,
        ),
        User(
            username="manager",
            email="manager@sigmon.id",
            hashed_password=hash_password("admin123"),
            role="manager",
            is_active=True,
        ),
        User(
            username="staff",
            email="staff@sigmon.id",
            hashed_password=hash_password("admin123"),
            role="staff",
            is_active=True,
        ),
    ]
    db.add_all(users)
    db.commit()
    print(f"Berhasil membuat {len(users)} user default.")


def seed_config(db: Session):
    existing = db.query(AppConfig).filter(AppConfig.key == "sheets_url").first()
    if existing:
        print("Config sudah ada, skip seeding.")
        return

    configs = [
        AppConfig(
            key="sheets_url",
            value="https://script.google.com/macros/s/AKfycbzvXbh8w_R_Llfh4hynn9T_MhPV8HEJWK3lC8rwGYyYT2ThVEwSWSz1qR2YCYYuCz6d/exec",
        ),
        AppConfig(key="sheets_sheet_name", value="Sheet1"),
        AppConfig(key="sheets_period_auto_detect", value="true"),
    ]
    db.add_all(configs)
    db.commit()
    print(f"Berhasil membuat {len(configs)} config default.")


def main():
    db_url = os.environ.get("DATABASE_URL", "")
    print(f"Database URL: {db_url[:30]}..." if len(db_url) > 30 else f"Database URL: {db_url}")

    print("Membuat tabel jika belum ada...")
    Base.metadata.create_all(bind=engine)
    print("Tabel berhasil dibuat.")

    with Session(engine) as db:
        seed_users(db)
        seed_config(db)

    print("Inisialisasi database selesai!")


if __name__ == "__main__":
    main()
