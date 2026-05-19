from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class AttendanceBase(BaseModel):
    worker_id: str
    site_id: str
    date: date
    status: str
    overtime_hours: float = 0.0

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceResponse(AttendanceBase):
    id: str
    created_at: datetime

class BulkAttendance(BaseModel):
    records: List[AttendanceCreate]
