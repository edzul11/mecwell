from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class CompanyExpenseBase(BaseModel):
    amount: float
    expense_date: date
    description: str
    receipt_url: Optional[str] = None
    site_id: Optional[str] = None

class CompanyExpenseCreate(CompanyExpenseBase):
    pass

class CompanyExpenseUpdate(BaseModel):
    amount: Optional[float] = None
    expense_date: Optional[date] = None
    description: Optional[str] = None
    receipt_url: Optional[str] = None
    site_id: Optional[str] = None

class CompanyExpense(CompanyExpenseBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
