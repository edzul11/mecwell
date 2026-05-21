from pydantic import BaseModel
from typing import Optional

class SiteBase(BaseModel):
    name: str
    location: Optional[str] = None
    status: str = 'active'
    client_name: Optional[str] = None
    client_rut: Optional[str] = None
    client_city: Optional[str] = None
    client_phone: Optional[str] = None
    client_contact: Optional[str] = None
    client_email: Optional[str] = None

class SiteCreate(SiteBase):
    pass

class SiteResponse(SiteBase):
    id: str
    created_at: str

    class Config:
        from_attributes = True
