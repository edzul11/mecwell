from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List
from ..schemas.worker import WorkerCreate, WorkerResponse
from ..database import get_db_client
from supabase import Client

router = APIRouter(prefix="/workers", tags=["Workers"])

from typing import List, Optional

@router.get("/", response_model=List[WorkerResponse])
def get_workers(site_id: Optional[str] = None, supabase: Client = Depends(get_db_client)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    query = supabase.table("workers").select("*, site:sites(*)")
    if site_id:
        query = query.eq("site_id", site_id)
    response = query.execute()
    return response.data

@router.post("/", response_model=WorkerResponse)
def create_worker(worker: WorkerCreate, supabase: Client = Depends(get_db_client)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    response = supabase.table("workers").insert(worker.model_dump(mode='json')).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create worker")
    return response.data[0]

@router.get("/{worker_id}", response_model=WorkerResponse)
def get_worker(worker_id: str, supabase: Client = Depends(get_db_client)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    response = supabase.table("workers").select("*, site:sites(*)").eq("id", worker_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Worker not found")
    return response.data[0]

@router.put("/{worker_id}", response_model=WorkerResponse)
def update_worker(worker_id: str, worker: WorkerCreate, supabase: Client = Depends(get_db_client)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    
    # Exclude None values so we don't overwrite with nulls unnecessarily if we do partial updates
    update_data = {k: v for k, v in worker.model_dump(mode='json').items() if v is not None}
    
    # We might need to handle date serialization if any
    for key, value in update_data.items():
        if hasattr(value, "isoformat"):
            update_data[key] = value.isoformat()
            
    response = supabase.table("workers").update(update_data).eq("id", worker_id).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to update worker")
    return response.data[0]

@router.patch("/{worker_id}", response_model=WorkerResponse)
def patch_worker(worker_id: str, payload: dict, supabase: Client = Depends(get_db_client)):
    """Partial update — only updates the fields provided in the payload."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    response = supabase.table("workers").update(payload).eq("id", worker_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Worker not found")
    return response.data[0]

@router.post("/{worker_id}/deactivate", response_model=WorkerResponse)
def deactivate_worker(worker_id: str, payload: dict, supabase: Client = Depends(get_db_client)):
    """
    Deactivates a worker: status='inactive', site_id=null, and records termination details.
    Payload should contain: termination_date, termination_reason, termination_causal
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    
    update_data = {
        "status": "inactive",
        "site_id": None,
        "termination_date": payload.get("termination_date"),
        "termination_reason": payload.get("termination_reason"),
        "termination_causal": payload.get("termination_causal"),
        "blacklisted": payload.get("blacklisted", False),
        "blacklist_reason": payload.get("blacklist_reason"),
        "blacklist_category": payload.get("blacklist_category")
    }
    
    response = supabase.table("workers").update(update_data).eq("id", worker_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Worker not found")
    return response.data[0]

@router.post("/{worker_id}/reactivate", response_model=WorkerResponse)
def reactivate_worker(worker_id: str, site_id: str, supabase: Client = Depends(get_db_client)):
    """
    Reactivates a worker: status='active', assigns new site_id, and clears termination details.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    
    update_data = {
        "status": "active",
        "site_id": site_id,
        "termination_date": None,
        "termination_reason": None,
        "termination_causal": None
    }
    
    response = supabase.table("workers").update(update_data).eq("id", worker_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Worker not found")
    return response.data[0]

@router.delete("/{worker_id}")
def delete_worker(worker_id: str, request: Request, supabase: Client = Depends(get_db_client)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
        
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autorizado")
        
    token = auth_header.split(" ")[1]
    
    # 1. Obtener la sesión del usuario de Supabase Auth
    try:
        user_res = supabase.auth.get_user(token)
        user = user_res.user
    except Exception as e:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
        
    # 2. Validar que el usuario es el administrador autorizado
    is_authorized = (
        user.id == "b1cb200f-ae69-431a-90f6-fbc4d1bea827" or 
        user.email == "zedmundofrancisco@gmail.com"
    )
    if not is_authorized:
        raise HTTPException(
            status_code=403, 
            detail="No autorizado. Solo el administrador zedmundofrancisco@gmail.com puede eliminar trabajadores permanentemente."
        )
        
    # 3. Eliminar de forma segura y secuencial todos los registros dependientes
    try:
        # a. Finiquitos y sus ítems
        finiquito_res = supabase.table("finiquitos").select("id").eq("worker_id", worker_id).execute()
        if finiquito_res.data:
            finiquito_ids = [f["id"] for f in finiquito_res.data]
            supabase.table("finiquito_items").delete().in_("finiquito_id", finiquito_ids).execute()
            supabase.table("finiquitos").delete().eq("worker_id", worker_id).execute()
            
        # b. Resto de tablas
        supabase.table("attendance").delete().eq("worker_id", worker_id).execute()
        supabase.table("ppe_assignments").delete().eq("worker_id", worker_id).execute()
        supabase.table("payslips").delete().eq("worker_id", worker_id).execute()
        supabase.table("salary_advances").delete().eq("worker_id", worker_id).execute()
        supabase.table("documents").delete().eq("worker_id", worker_id).execute()
        supabase.table("vacaciones").delete().eq("worker_id", worker_id).execute()
        
        # c. Eliminar finalmente el trabajador
        res = supabase.table("workers").delete().eq("id", worker_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Trabajador no encontrado en el sistema")
            
        return {"message": "Trabajador y toda su información asociada eliminados exitosamente del software."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error durante la eliminación en cascada: {str(e)}")
