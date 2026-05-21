from pydantic import BaseModel, field_validator
from typing import List, Optional
from datetime import date, datetime

class LaborItem(BaseModel):
    role: str
    unit: str = "HH"
    qty: int
    days: int
    hh_per_day: float
    unit_price: float
    total: float

class MaterialItem(BaseModel):
    name: str
    unit: str
    qty: float
    unit_price: float
    total: float

class EquipmentItem(BaseModel):
    name: str
    unit: str
    qty: float
    unit_price: float
    total: float

class OtherExpenseItem(BaseModel):
    name: str
    unit: str
    qty: float
    unit_price: float
    total: float

class QuoteBase(BaseModel):
    quote_number: str
    client_name: str
    client_rut: Optional[str] = None
    client_city: Optional[str] = None
    client_phone: Optional[str] = None
    client_contact: Optional[str] = None
    client_area: Optional[str] = None
    client_email: Optional[str] = None
    client_contact_phone: Optional[str] = None
    
    service_name: str
    status: str = "Borrador"
    issue_date: date
    expiration_date: Optional[date] = None
    labor_items: List[LaborItem] = []
    material_items: List[MaterialItem] = []
    equipment_items: List[EquipmentItem] = []
    other_expense_items: List[OtherExpenseItem] = []
    overhead_percent: float = 0.15
    utility_percent: float = 0.15
    po_number: Optional[str] = None
    po_file_url: Optional[str] = None
    po_missing_reason: Optional[str] = None

    @field_validator('issue_date', 'expiration_date', mode='before')
    @classmethod
    def empty_str_to_none_date(cls, v):
        if v == "":
            return None
        return v

class QuoteCreate(QuoteBase):
    pass

class QuoteResponse(QuoteBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
