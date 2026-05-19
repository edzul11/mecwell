from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class InventoryItemBase(BaseModel):
    name: str
    category: str
    stock_quantity: float = 0
    unit_price: float = 0
    unit_measure: Optional[str] = None
    is_returnable: bool = False
    minimum_stock: int = 0
    acquisition_value: float = 0

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    unit_price: Optional[float] = None
    unit_measure: Optional[str] = None
    is_returnable: Optional[bool] = None
    minimum_stock: Optional[int] = None
    acquisition_value: Optional[float] = None

class InventoryItem(InventoryItemBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class InventoryMovementBase(BaseModel):
    item_id: str
    movement_type: str  # 'IN' or 'OUT'
    quantity_change: float
    reason: str
    reference_id: Optional[str] = None

class InventoryMovementCreate(InventoryMovementBase):
    pass

class InventoryMovement(InventoryMovementBase):
    id: str
    movement_date: datetime

    class Config:
        from_attributes = True

# --- Stock por Ubicación (Bodega Central vs Faenas) ---

class StockLocationResponse(BaseModel):
    id: str
    item_id: str
    site_id: Optional[str] = None  # None = Bodega Central
    quantity: float
    created_at: datetime
    # Joined fields
    item_name: Optional[str] = None
    site_name: Optional[str] = None

    class Config:
        from_attributes = True

class StockTransfer(BaseModel):
    """Transfiere unidades desde Bodega Central a una Faena (o viceversa)."""
    item_id: str
    quantity: float
    from_site_id: Optional[str] = None   # None = Bodega Central
    to_site_id: Optional[str] = None     # None = Bodega Central
    reason: str = "Transferencia a Faena"
