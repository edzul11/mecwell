from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from typing import List, Optional, Any
from ..schemas.inventory import (
    InventoryItem, InventoryItemCreate, InventoryItemUpdate,
    InventoryMovement, InventoryMovementCreate,
    StockLocationResponse, StockTransfer
)
from ..services import inventory_service
from ..database import get_db_client
from supabase import Client

router = APIRouter(prefix="/inventory", tags=["Inventory"])

@router.get("/items", response_model=List[InventoryItem])
def get_items(supabase: Client = Depends(get_db_client)):
    return inventory_service.get_inventory_items(supabase)

@router.get("/items/{item_id}", response_model=InventoryItem)
def get_item(item_id: str, supabase: Client = Depends(get_db_client)):
    return inventory_service.get_inventory_item(item_id, supabase)

@router.post("/items", response_model=InventoryItem)
def create_item(item: InventoryItemCreate, supabase: Client = Depends(get_db_client)):
    return inventory_service.create_inventory_item(item, supabase)

@router.patch("/items/{item_id}", response_model=InventoryItem)
def update_item(item_id: str, item: InventoryItemUpdate, supabase: Client = Depends(get_db_client)):
    return inventory_service.update_inventory_item(item_id, item, supabase)

@router.delete("/items/{item_id}")
def delete_item(item_id: str, supabase: Client = Depends(get_db_client)):
    inventory_service.delete_inventory_item(item_id, supabase)
    return {"message": "Item deleted successfully"}

@router.post("/movements", response_model=InventoryMovement)
def register_movement(movement: InventoryMovementCreate, supabase: Client = Depends(get_db_client)):
    return inventory_service.register_movement(movement, supabase)

@router.get("/items/{item_id}/movements", response_model=List[InventoryMovement])
def get_item_movements(item_id: str, supabase: Client = Depends(get_db_client)):
    return inventory_service.get_item_movements(item_id, supabase)

# --- Endpoints de Stock por Ubicación (Bodega vs Faenas) ---

@router.get("/stock-locations", response_model=List[Any])
def get_stock_locations(site_id: Optional[str] = None, item_id: Optional[str] = None, supabase: Client = Depends(get_db_client)):
    """Retorna el stock por ubicación. Si no se pasa site_id, retorna todo."""
    return inventory_service.get_stock_locations(supabase, site_id=site_id, item_id=item_id)

@router.post("/transfer")
def transfer_stock(transfer: StockTransfer, supabase: Client = Depends(get_db_client)):
    """Mueve stock de una ubicación a otra (Bodega Central <-> Faena)."""
    return inventory_service.transfer_stock(transfer, supabase)
