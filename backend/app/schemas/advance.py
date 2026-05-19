from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class AdvanceBase(BaseModel):
    worker_id: str
    amount: float
    date: date
    reason: Optional[str] = None
    status: Optional[str] = "approved"

class AdvanceCreate(AdvanceBase):
    pass

class AdvanceResponse(AdvanceBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
