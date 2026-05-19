from supabase import Client
from app.schemas.expense import CompanyExpenseCreate, CompanyExpenseUpdate
from fastapi import HTTPException

def get_expenses(supabase: Client):
    response = supabase.table("expenses").select("*, sites(name)").order("created_at", desc=True).execute()
    return response.data

def get_expense(expense_id: str, supabase: Client):
    response = supabase.table("expenses").select("*, sites(name)").eq("id", expense_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Expense not found")
    return response.data[0]

def create_expense(expense: CompanyExpenseCreate, supabase: Client):
    response = supabase.table("expenses").insert(expense.dict(exclude_none=True)).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Error creating expense")
    return response.data[0]

def update_expense(expense_id: str, expense: CompanyExpenseUpdate, supabase: Client):
    update_data = {k: v for k, v in expense.dict(exclude_none=True).items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data provided to update")
    response = supabase.table("expenses").update(update_data).eq("id", expense_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Expense not found")
    return response.data[0]

def delete_expense(expense_id: str, supabase: Client):
    response = supabase.table("expenses").delete().eq("id", expense_id).execute()
    return response.data
