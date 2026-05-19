from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from ..schemas.vacacion import VacacionCreate, VacacionResponse
from ..database import get_db_client
from supabase import Client

router = APIRouter(prefix="/vacaciones", tags=["Vacaciones"])

@router.get("/", response_model=List[VacacionResponse])
def get_vacaciones(worker_id: Optional[str] = None, supabase: Client = Depends(get_db_client)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    query = supabase.table("vacaciones").select("*")
    if worker_id:
        query = query.eq("worker_id", worker_id)
    response = query.execute()
    return response.data

@router.post("/", response_model=VacacionResponse)
def create_vacacion(vacacion: VacacionCreate, supabase: Client = Depends(get_db_client)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    response = supabase.table("vacaciones").insert(vacacion.model_dump(mode='json')).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to record vacation")
    return response.data[0]

@router.get("/saldo/{worker_id}")
def get_saldo_vacaciones(worker_id: str, supabase: Client = Depends(get_db_client)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    
    # Obtener trabajador para entry_date
    w_res = supabase.table("workers").select("entry_date").eq("id", worker_id).execute()
    if not w_res.data:
        raise HTTPException(status_code=404, detail="Worker not found")
    
    # Lógica simple de cálculo (1.25 días por mes)
    from datetime import date
    entry_date = date.fromisoformat(w_res.data[0]['entry_date'])
    today = date.today()
    months = (today.year - entry_date.year) * 12 + today.month - entry_date.month
    total_acumulado = months * 1.25
    
    # Restar tomadas
    v_res = supabase.table("vacaciones").select("dias_habiles").eq("worker_id", worker_id).eq("estado", "aprobado").execute()
    total_tomadas = sum(v['dias_habiles'] for v in v_res.data)
    
    return {
        "worker_id": worker_id,
        "total_acumulado": total_acumulado,
        "total_tomadas": total_tomadas,
        "saldo_actual": total_acumulado - total_tomadas
    }

from fastapi.responses import Response

@router.get("/comprobante/{vacacion_id}")
def download_vacation_receipt(vacacion_id: str, supabase: Client = Depends(get_db_client)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    
    # Fetch vacation with worker data
    v_res = supabase.table("vacaciones").select("*, workers(*)").eq("id", vacacion_id).execute()
    
    if not v_res.data:
        raise HTTPException(status_code=404, detail="Vacación no encontrada")
        
    vacacion = v_res.data[0]
    worker = vacacion.get("workers") or {}
    
    from ..services.pdf_generator import generate_vacation_receipt_pdf
    pdf_bytes = generate_vacation_receipt_pdf(vacacion, worker)
    
    worker_rut = worker.get("rut", "sin_rut").replace(".", "").replace("-", "")
    filename = f"comprobante_vacaciones_{worker_rut}_{vacacion.get('fecha_inicio', '')}.pdf"
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )
