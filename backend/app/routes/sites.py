from fastapi import Depends, APIRouter, HTTPException
from typing import List
from ..schemas.site import SiteCreate, SiteResponse
from ..database import get_db_client
from supabase import Client

router = APIRouter(prefix="/sites", tags=["Sites"])

@router.get("/", response_model=List[SiteResponse])
def get_sites(supabase: Client = Depends(get_db_client)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    response = supabase.table("sites").select("*").execute()
    return response.data

@router.post("/", response_model=SiteResponse)
def create_site(site: SiteCreate, supabase: Client = Depends(get_db_client)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    response = supabase.table("sites").insert(site.model_dump()).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create site")
    return response.data[0]

@router.get("/{site_id}", response_model=SiteResponse)
def get_site(site_id: str, supabase: Client = Depends(get_db_client)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    response = supabase.table("sites").select("*").eq("id", site_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Site not found")
    return response.data[0]

@router.delete("/{site_id}")
def delete_site(site_id: str, supabase: Client = Depends(get_db_client)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    try:
        response = supabase.table("sites").delete().eq("id", site_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Site not found")
        return {"status": "success", "message": "Site deleted successfully", "data": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete site: {str(e)}")
