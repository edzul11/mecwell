from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import date

class WorkerBase(BaseModel):
    first_name: str
    last_name: str
    rut: str
    email: Optional[EmailStr] = None
    position: str
    base_salary: float
    health_institution: str # Fonasa, Isapre
    pension_fund: str # AFP
    shift: Optional[str] = None
    birth_date: Optional[date] = None
    entry_date: Optional[date] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    clothing_size: Optional[str] = None
    shoe_size: Optional[str] = None
    glove_size: Optional[str] = None
    bank_name: Optional[str] = None
    account_type: Optional[str] = None
    account_number: Optional[str] = None
    marital_status: Optional[str] = None
    site_id: Optional[str] = None
    status: Optional[str] = "active"
    termination_date: Optional[date] = None
    termination_reason: Optional[str] = None
    termination_causal: Optional[str] = None
    blacklisted: Optional[bool] = False
    blacklist_reason: Optional[str] = None
    blacklist_category: Optional[str] = None

    @field_validator('birth_date', 'entry_date', mode='before')
    @classmethod
    def empty_str_to_none_date(cls, v):
        if v == "":
            return None
        return v

    @field_validator('email', mode='before')
    @classmethod
    def empty_str_to_none_email(cls, v):
        if v == "":
            return None
        return v

class WorkerCreate(WorkerBase):
    pass

class WorkerResponse(WorkerBase):
    id: str
    created_at: str
    site: Optional[dict] = None

    class Config:
        from_attributes = True
