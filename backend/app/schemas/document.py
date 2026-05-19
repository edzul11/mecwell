from pydantic import BaseModel
from typing import Optional
from datetime import date

class DocumentBase(BaseModel):
    worker_id: str
    name: str
    document_type: str
    expiration_date: date
    file_url: Optional[str] = None

class DocumentCreate(DocumentBase):
    pass

class DocumentResponse(DocumentBase):
    id: str
    created_at: str

    class Config:
        from_attributes = True
