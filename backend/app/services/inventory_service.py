from supabase import Client
from ..schemas.inventory import InventoryItemCreate, InventoryItemUpdate, InventoryMovementCreate, StockTransfer
from fastapi import HTTPException

def get_inventory_items(supabase: Client):
    response = supabase.table("inventory_items").select("*").order("created_at", desc=True).execute()
    return response.data

def get_inventory_item(item_id: str, supabase: Client):
    response = supabase.table("inventory_items").select("*").eq("id", item_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Item not found")
    return response.data[0]

def create_inventory_item(item: InventoryItemCreate, supabase: Client):
    response = supabase.table("inventory_items").insert(item.dict()).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Error creating inventory item")
    return response.data[0]

def update_inventory_item(item_id: str, item: InventoryItemUpdate, supabase: Client):
    update_data = {k: v for k, v in item.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data provided to update")
    response = supabase.table("inventory_items").update(update_data).eq("id", item_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return response.data[0]

def delete_inventory_item(item_id: str, supabase: Client):
    response = supabase.table("inventory_items").delete().eq("id", item_id).execute()
    return response.data

def register_movement(movement: InventoryMovementCreate, supabase: Client):
    mov_response = supabase.table("inventory_transactions").insert(movement.dict()).execute()
    if not mov_response.data:
        raise HTTPException(status_code=400, detail="Error registering movement")

    item_response = supabase.table("inventory_items").select("stock_quantity").eq("id", movement.item_id).execute()
    if not item_response.data:
        raise HTTPException(status_code=404, detail="Item not found")

    current_stock = item_response.data[0]["stock_quantity"]
    new_stock = (
        current_stock + movement.quantity_change
        if movement.movement_type == 'IN'
        else current_stock - movement.quantity_change
    )
    supabase.table("inventory_items").update({"stock_quantity": new_stock}).eq("id", movement.item_id).execute()
    return mov_response.data[0]

def get_item_movements(item_id: str, supabase: Client):
    response = supabase.table("inventory_transactions").select("*").eq("item_id", item_id).order("movement_date", desc=True).execute()
    return response.data

# --- Stock por Ubicación (Bodega Central vs Faenas) ---

def get_stock_locations(supabase: Client, site_id: str = None, item_id: str = None):
    """
    Retorna el stock por ubicación, enriquecido con nombre del item y de la faena.
    site_id=None retorna todo; site_id='central' retorna la bodega central (site_id IS NULL).
    """
    query = supabase.table("stock_locations").select(
        "*, inventory_items(name, unit_measure, category), sites(name)"
    )
    if site_id == "central":
        query = query.is_("site_id", "null")
    elif site_id:
        query = query.eq("site_id", site_id)

    if item_id:
        query = query.eq("item_id", item_id)

    response = query.order("created_at", desc=True).execute()
    # Flatten the joined data
    results = []
    for row in response.data:
        results.append({
            **row,
            "item_name": (row.get("inventory_items") or {}).get("name"),
            "item_unit": (row.get("inventory_items") or {}).get("unit_measure"),
            "item_category": (row.get("inventory_items") or {}).get("category"),
            "site_name": (row.get("sites") or {}).get("name", "Bodega Central"),
        })
    return results

def transfer_stock(transfer: StockTransfer, supabase: Client):
    """
    Mueve stock entre ubicaciones. Descuenta del origen y suma al destino
    usando upsert en stock_locations.
    """
    # 1. Validar que hay suficiente stock en el origen
    from_query = supabase.table("stock_locations").select("id, quantity")
    if transfer.from_site_id:
        from_query = from_query.eq("site_id", transfer.from_site_id)
    else:
        from_query = from_query.is_("site_id", "null")
    from_query = from_query.eq("item_id", transfer.item_id)
    from_res = from_query.execute()

    if not from_res.data:
        raise HTTPException(status_code=400, detail="No hay stock disponible en el origen para este ítem.")
    
    current_origin_qty = from_res.data[0]["quantity"]
    if current_origin_qty < transfer.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Stock insuficiente en origen. Disponible: {current_origin_qty}"
        )

    # 2. Descontar del origen
    new_origin_qty = current_origin_qty - transfer.quantity
    supabase.table("stock_locations").update({"quantity": new_origin_qty}).eq("id", from_res.data[0]["id"]).execute()

    # 3. Sumar al destino (upsert por item_id + site_id)
    to_query = supabase.table("stock_locations").select("id, quantity")
    if transfer.to_site_id:
        to_query = to_query.eq("site_id", transfer.to_site_id)
    else:
        to_query = to_query.is_("site_id", "null")
    to_query = to_query.eq("item_id", transfer.item_id)
    to_res = to_query.execute()

    if to_res.data:
        new_dest_qty = to_res.data[0]["quantity"] + transfer.quantity
        supabase.table("stock_locations").update({"quantity": new_dest_qty}).eq("id", to_res.data[0]["id"]).execute()
    else:
        insert_data = {"item_id": transfer.item_id, "quantity": transfer.quantity}
        if transfer.to_site_id:
            insert_data["site_id"] = transfer.to_site_id
        supabase.table("stock_locations").insert(insert_data).execute()

    # 4. Registrar movimiento en el historial
    supabase.table("inventory_transactions").insert({
        "item_id": transfer.item_id,
        "movement_type": "TRANSFER",
        "quantity_change": transfer.quantity,
        "reason": transfer.reason,
        "reference_id": transfer.to_site_id or "central"
    }).execute()

    return {"message": "Transferencia realizada con éxito", "quantity_transferred": transfer.quantity}
