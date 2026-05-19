from pydantic import BaseModel
from typing import Optional

class SiteBase(BaseModel):
    name: str
    location: Optional[str] = None
    status: str = 'active'

class SiteCreate(SiteBase):
    pass

class SiteResponse(SiteBase):
    id: str
    created_at: str

    class Config:
        from_attributes = True
