from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="staff")
    is_active = Column(Boolean, default=True)
    password_changed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class MonitoringData(Base):
    __tablename__ = "monitoring_data"
    id = Column(Integer, primary_key=True, index=True)
    period = Column(String(50), index=True)
    wilayah = Column(String(100))
    region = Column(String(100), index=True)
    area = Column(String(100), index=True)
    cabang_id = Column(String(50))
    unit = Column(String(200), nullable=False, index=True)
    noa = Column(Float)
    noc = Column(Integer)
    os_aktif = Column(Float)
    lending = Column(Float)
    noa_par = Column(Integer)
    os_par = Column(Float)
    noa_npl = Column(Integer)
    os_npl = Column(Float)
    os_3r = Column(Float)
    noa_lar = Column(Integer)
    os_lar = Column(Float)
    pct_rr = Column(Float)
    target_noc = Column(Integer)
    target_os = Column(Float)
    target_lending = Column(Float)
    gap_noc = Column(Integer)
    gap_os = Column(Float)
    gap_lending = Column(Float)
    pct_noc = Column(Float)
    pct_os = Column(Float)
    pct_lending = Column(Float)
    pct_os_npl = Column(Float)
    ao = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class SyncLog(Base):
    __tablename__ = "sync_logs"
    id = Column(Integer, primary_key=True, index=True)
    sync_type = Column(String(50))
    source = Column(String(500))
    status = Column(String(50))
    records_count = Column(Integer, default=0)
    error_message = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AppConfig(Base):
    __tablename__ = "app_config"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(Text)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
