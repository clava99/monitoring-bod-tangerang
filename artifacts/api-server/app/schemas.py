from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class UserLogin(BaseModel):
    username: str
    password: str


class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str = "staff"


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


class MonitoringDataOut(BaseModel):
    id: int
    period: Optional[str]
    wilayah: Optional[str]
    region: Optional[str]
    area: Optional[str]
    cabang_id: Optional[str]
    unit: str
    noa: Optional[float]
    noc: Optional[int]
    os_aktif: Optional[float]
    lending: Optional[float]
    noa_par: Optional[int]
    os_par: Optional[float]
    noa_npl: Optional[int]
    os_npl: Optional[float]
    os_3r: Optional[float]
    noa_lar: Optional[int]
    os_lar: Optional[float]
    pct_rr: Optional[float]
    target_noc: Optional[int]
    target_os: Optional[float]
    target_lending: Optional[float]
    gap_noc: Optional[int]
    gap_os: Optional[float]
    gap_lending: Optional[float]
    pct_noc: Optional[float]
    pct_os: Optional[float]
    pct_lending: Optional[float]
    pct_os_npl: Optional[float]
    ao: Optional[int]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class MonitoringDataCreate(BaseModel):
    period: Optional[str] = None
    wilayah: Optional[str] = None
    region: Optional[str] = None
    area: Optional[str] = None
    cabang_id: Optional[str] = None
    unit: str
    noa: Optional[float] = None
    noc: Optional[int] = None
    os_aktif: Optional[float] = None
    lending: Optional[float] = None
    noa_par: Optional[int] = None
    os_par: Optional[float] = None
    noa_npl: Optional[int] = None
    os_npl: Optional[float] = None
    pct_rr: Optional[float] = None
    target_lending: Optional[float] = None
    ao: Optional[int] = None


class DashboardSummary(BaseModel):
    total_unit: int
    total_noc: int
    total_os_aktif: float
    total_lending: float
    total_os_npl: float
    avg_pct_rr: float
    avg_pct_noc: float
    avg_pct_os: float
    avg_pct_lending: float
    period: Optional[str]


class TopBottomItem(BaseModel):
    unit: str
    region: Optional[str]
    area: Optional[str]
    value: float


class TopBottomResponse(BaseModel):
    metric: str
    top5: List[TopBottomItem]
    bottom5: List[TopBottomItem]


class PaginatedUnits(BaseModel):
    data: List[MonitoringDataOut]
    total: int
    page: int
    limit: int
    total_pages: int


class SyncLogOut(BaseModel):
    id: int
    sync_type: str
    source: Optional[str]
    status: str
    records_count: int
    error_message: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class SheetsImportRequest(BaseModel):
    spreadsheet_url: str
    sheet_name: Optional[str] = "Sheet1"
    period: Optional[str] = None


class TrendDataPoint(BaseModel):
    period: str
    total_noc: int
    total_os_aktif: float
    total_lending: float
    avg_pct_rr: float
    avg_pct_noc: float
    avg_pct_os: float
    avg_pct_lending: float


class AlertUnit(BaseModel):
    id: int
    unit: str
    region: Optional[str]
    area: Optional[str]
    period: Optional[str]
    pct_rr: Optional[float]
    pct_os_npl: Optional[float]
    pct_noc: Optional[float]
    pct_os: Optional[float]
    pct_lending: Optional[float]
    os_npl: Optional[float]
    os_aktif: Optional[float]
    issues: List[str]
    severity: str


class RiskAreaData(BaseModel):
    area: str
    os_par: float
    os_npl: float
    os_lar: float
    os_aktif: float
    par_ratio: float
    npl_ratio: float
    lar_ratio: float
