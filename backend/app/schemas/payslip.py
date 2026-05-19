from pydantic import BaseModel
from typing import Optional

class PayslipCreate(BaseModel):
    period_month: int
    period_year: int
    days_worked: int = 30
    gratification: float = 0
    bono_responsabilidad: float = 0
    horas_extras_amount: float = 0
    colacion: float = 0
    movilizacion: float = 0
    viatico: float = 0
    anticipo: float = 0

class PayslipResponse(PayslipCreate):
    id: str
    worker_id: str
    base_salary: float
    afp_discount: float
    health_discount: float
    cesantia_discount: float
    net_salary: float
    pdf_url: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True
