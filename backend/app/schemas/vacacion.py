from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class VacacionBase(BaseModel):
    worker_id: str
    site_id: Optional[str] = None
    fecha_inicio: date
    fecha_fin: date
    dias_habiles: int
    tipo: Optional[str] = "tomadas"
    estado: Optional[str] = "aprobado"
    observaciones: Optional[str] = None

class VacacionCreate(VacacionBase):
    pass

class VacacionResponse(VacacionBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
