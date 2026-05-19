from fastapi import APIRouter, HTTPException, Depends
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
