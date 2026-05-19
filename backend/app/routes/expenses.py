from fastapi import APIRouter, Depends
from typing import List, Any
from app.schemas.expense import CompanyExpense, CompanyExpenseCreate, CompanyExpenseUpdate
from app.services import expense_service
from app.database import get_db_client
from supabase import Client

router = APIRouter(prefix="/expenses", tags=["Expenses"])

@router.get("/", response_model=List[Any])
def get_expenses(supabase: Client = Depends(get_db_client)):
    return expense_service.get_expenses(supabase)

@router.get("/{expense_id}", response_model=Any)
def get_expense(expense_id: str, supabase: Client = Depends(get_db_client)):
    return expense_service.get_expense(expense_id, supabase)

@router.post("/", response_model=CompanyExpense)
def create_expense(expense: CompanyExpenseCreate, supabase: Client = Depends(get_db_client)):
    return expense_service.create_expense(expense, supabase)

@router.patch("/{expense_id}", response_model=CompanyExpense)
def update_expense(expense_id: str, expense: CompanyExpenseUpdate, supabase: Client = Depends(get_db_client)):
    return expense_service.update_expense(expense_id, expense, supabase)

@router.delete("/{expense_id}")
def delete_expense(expense_id: str, supabase: Client = Depends(get_db_client)):
    expense_service.delete_expense(expense_id, supabase)
    return {"message": "Expense deleted successfully"}
