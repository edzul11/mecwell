from supabase import Client
from app.schemas.ppe import PPEAssignmentCreate, PPEAssignmentUpdate
from fastapi import HTTPException
from datetime import datetime

def get_worker_ppes(worker_id: str, supabase: Client):
    response = supabase.table("ppe_assignments").select("*, inventory_items(name, is_returnable)").eq("worker_id", worker_id).order("created_at", desc=True).execute()
    return response.data

def assign_ppe(assignment: PPEAssignmentCreate, supabase: Client):
    # Check item and stock
    item_res = supabase.table("inventory_items").select("stock_quantity, is_returnable").eq("id", assignment.item_id).execute()
    if not item_res.data:
        raise HTTPException(status_code=404, detail="Item not found")
        
    current_stock = float(item_res.data[0]["stock_quantity"])
    if current_stock < assignment.quantity:
        raise HTTPException(status_code=400, detail="Not enough stock")
        
    # Create assignment
    assign_res = supabase.table("ppe_assignments").insert(assignment.dict(exclude_none=True)).execute()
    if not assign_res.data:
        raise HTTPException(status_code=400, detail="Error creating assignment")
        
    # Update stock
    new_stock = current_stock - assignment.quantity
    supabase.table("inventory_items").update({"stock_quantity": new_stock}).eq("id", assignment.item_id).execute()
    
    # Register movement
    movement = {
        "item_id": assignment.item_id,
        "movement_type": "OUT",
        "quantity_change": assignment.quantity,
        "reason": "Asignación EPP",
        "reference_id": assign_res.data[0]["id"]
    }
    supabase.table("inventory_movements").insert(movement).execute()
    
    return assign_res.data[0]

def return_ppe(assignment_id: str, return_update: PPEAssignmentUpdate, supabase: Client):
    # Get assignment
    assign_res = supabase.table("ppe_assignments").select("*").eq("id", assignment_id).execute()
    if not assign_res.data:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    assignment = assign_res.data[0]
    
    if assignment.get("is_returned"):
        raise HTTPException(status_code=400, detail="PPE already returned")
        
    # Update assignment
    update_data = {"is_returned": True, "return_date": return_update.return_date.isoformat() if return_update.return_date else datetime.utcnow().date().isoformat()}
    if return_update.acta_url:
        update_data["acta_url"] = return_update.acta_url
        
    res = supabase.table("ppe_assignments").update(update_data).eq("id", assignment_id).execute()
    
    # Update stock if returnable
    item_res = supabase.table("inventory_items").select("stock_quantity, is_returnable").eq("id", assignment["item_id"]).execute()
    if item_res.data and item_res.data[0].get("is_returnable"):
        new_stock = float(item_res.data[0]["stock_quantity"]) + float(assignment["quantity"])
        supabase.table("inventory_items").update({"stock_quantity": new_stock}).eq("id", assignment["item_id"]).execute()
        
        # Register movement
        movement = {
            "item_id": assignment["item_id"],
            "movement_type": "IN",
            "quantity_change": assignment["quantity"],
            "reason": "Devolución EPP",
            "reference_id": assignment_id
        }
        supabase.table("inventory_movements").insert(movement).execute()
        
    return res.data[0]
