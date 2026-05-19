from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class PPEAssignmentBase(BaseModel):
    worker_id: str
    item_id: str
    quantity: float = 1.0
    assignment_date: date
    acta_url: Optional[str] = None
    is_returned: bool = False
    return_date: Optional[date] = None

class PPEAssignmentCreate(PPEAssignmentBase):
    pass

class PPEAssignmentUpdate(BaseModel):
    is_returned: Optional[bool] = None
    return_date: Optional[date] = None
    acta_url: Optional[str] = None

class PPEAssignment(PPEAssignmentBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
