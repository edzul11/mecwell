from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from ..schemas.advance import AdvanceCreate, AdvanceResponse
from ..database import get_db_client
from supabase import Client
from fastapi.responses import Response

router = APIRouter(prefix="/advances", tags=["Advances"])

@router.get("/", response_model=List[AdvanceResponse])
def get_advances(worker_id: Optional[str] = None, supabase: Client = Depends(get_db_client)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    query = supabase.table("salary_advances").select("*")
    if worker_id:
        query = query.eq("worker_id", worker_id)
    response = query.execute()
    return response.data

@router.post("/", response_model=AdvanceResponse)
def create_advance(advance: AdvanceCreate, supabase: Client = Depends(get_db_client)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
        
    # Check max amount vs base salary
    w_res = supabase.table("workers").select("base_salary").eq("id", advance.worker_id).execute()
    if not w_res.data:
        raise HTTPException(status_code=404, detail="Worker not found")
        
    base_salary = float(w_res.data[0]['base_salary'])
    if advance.amount > base_salary:
        raise HTTPException(status_code=400, detail=f"El anticipo no puede superar el sueldo base (${base_salary})")
        
    response = supabase.table("salary_advances").insert(advance.model_dump(mode='json')).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create advance")
    return response.data[0]

@router.get("/comprobante/{advance_id}")
def download_advance_receipt(advance_id: str, supabase: Client = Depends(get_db_client)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
        
    # Fetch advance with worker data
    a_res = supabase.table("salary_advances").select("*, workers(*)").eq("id", advance_id).execute()
    if not a_res.data:
        raise HTTPException(status_code=404, detail="Anticipo no encontrado")
        
    advance = a_res.data[0]
    worker = advance.get("workers") or {}
    
    from ..services.pdf_generator import generate_advance_receipt_pdf
    pdf_bytes = generate_advance_receipt_pdf(advance, worker)
    
    worker_rut = worker.get("rut", "sin_rut").replace(".", "").replace("-", "")
    filename = f"comprobante_anticipo_{worker_rut}_{advance.get('date', '')}.pdf"
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )
