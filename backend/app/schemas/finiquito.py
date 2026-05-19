from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class FiniquitoItemBase(BaseModel):
    tipo: str
    nombre: str
    descripcion: Optional[str] = None
    dias: Optional[float] = None
    valor_dia: Optional[float] = None
    valor: float
    signo: Optional[str] = "+"
    formula: Optional[str] = None
    es_imponible: Optional[bool] = False
    orden: Optional[int] = None

class FiniquitoItemCreate(FiniquitoItemBase):
    pass

class FiniquitoItemResponse(FiniquitoItemBase):
    id: str
    finiquito_id: str

    class Config:
        from_attributes = True

class FiniquitoBase(BaseModel):
    worker_id: str
    site_id: Optional[str] = None
    fecha_finiquito: date
    fecha_ultimo_dia: date
    causal_articulo: str
    causal_numero: Optional[str] = None
    causal_descripcion: Optional[str] = None
    carta_aviso_requerida: Optional[bool] = False
    carta_aviso_enviada: Optional[bool] = False
    carta_aviso_fecha_envio: Optional[date] = None
    carta_aviso_medio: Optional[str] = None
    carta_aviso_datos: Optional[dict] = None
    total_haberes_imponibles: Optional[float] = 0
    total_haberes_no_imponibles: Optional[float] = 0
    total_descuentos_legales: Optional[float] = 0
    total_descuentos_deudas: Optional[float] = 0
    total_indemnizacion: Optional[float] = 0
    monto_bruto: Optional[float] = 0
    monto_neto: Optional[float] = 0
    estado: Optional[str] = "borrador"
    observaciones: Optional[str] = None

class FiniquitoCreate(FiniquitoBase):
    items: Optional[List[FiniquitoItemCreate]] = []

class FiniquitoResponse(FiniquitoBase):
    id: str
    items: List[FiniquitoItemResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CausalResponse(BaseModel):
    id: str
    articulo: str
    numero: Optional[str] = None
    nombre: str
    descripcion: Optional[str] = None
    requiere_aviso: bool
    tiene_indemn: bool
    activo: bool

    class Config:
        from_attributes = True
