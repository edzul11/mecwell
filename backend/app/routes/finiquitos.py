from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from ..schemas.finiquito import FiniquitoCreate, FiniquitoResponse, CausalResponse
from ..database import get_db_client
from supabase import Client

router = APIRouter(prefix="/finiquitos", tags=["Finiquitos"])

@router.get("/causales", response_model=List[CausalResponse])
def get_causales(supabase: Client = Depends(get_db_client)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    response = supabase.table("termination_causals").select("*").eq("activo", True).execute()
    return response.data

@router.get("/", response_model=List[FiniquitoResponse])
def get_finiquitos(site_id: Optional[str] = None, supabase: Client = Depends(get_db_client)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    query = supabase.table("finiquitos").select("*, items:finiquito_items(*)")
    if site_id:
        query = query.eq("site_id", site_id)
    response = query.execute()
    return response.data

@router.get("/{finiquito_id}", response_model=FiniquitoResponse)
def get_finiquito(finiquito_id: str, supabase: Client = Depends(get_db_client)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    response = supabase.table("finiquitos").select("*, items:finiquito_items(*)").eq("id", finiquito_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Finiquito not found")
    return response.data[0]

from fastapi.responses import Response
from ..services.pdf_generator import generate_finiquito_pdf, generate_notice_letter_pdf

@router.post("/", response_model=FiniquitoResponse)
def create_finiquito(finiquito: FiniquitoCreate, supabase: Client = Depends(get_db_client)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    
    # Extraer items y removerlos del dump principal
    data = finiquito.model_dump(mode='json')
    items = data.pop('items', [])
    
    # Crear cabecera
    response = supabase.table("finiquitos").insert(data).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create finiquito")
    
    new_finiquito = response.data[0]
    
    # Insertar items
    if items:
        for item in items:
            item['finiquito_id'] = new_finiquito['id']
        supabase.table("finiquito_items").insert(items).execute()
    
    # Devolver completo
    full_res = supabase.table("finiquitos").select("*, items:finiquito_items(*)").eq("id", new_finiquito['id']).execute()
    return full_res.data[0]

@router.get("/{finiquito_id}/pdf")
def get_finiquito_pdf(finiquito_id: str, supabase: Client = Depends(get_db_client)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    
    # Obtener datos completos
    f_res = supabase.table("finiquitos").select("*, items:finiquito_items(*)").eq("id", finiquito_id).execute()
    if not f_res.data:
        raise HTTPException(status_code=404, detail="Finiquito not found")
    f_data = f_res.data[0]
    
    w_res = supabase.table("workers").select("*").eq("id", f_data['worker_id']).execute()
    if not w_res.data:
        raise HTTPException(status_code=404, detail="Worker not found")
    w_data = w_res.data[0]
    
    pdf_bytes = generate_finiquito_pdf(w_data, f_data, f_data['items'])
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=finiquito_{w_data['rut']}.pdf"}
    )

@router.get("/{finiquito_id}/carta-aviso")
def get_carta_aviso_pdf(finiquito_id: str, supabase: Client = Depends(get_db_client)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    
    f_res = supabase.table("finiquitos").select("*").eq("id", finiquito_id).execute()
    if not f_res.data:
        raise HTTPException(status_code=404, detail="Finiquito not found")
    f_data = f_res.data[0]
    
    w_res = supabase.table("workers").select("*").eq("id", f_data['worker_id']).execute()
    w_data = w_res.data[0]
    
    # Preparar datos para la carta
    notice_data = {
        "fecha_aviso": f_data.get('carta_aviso_fecha_envio') or f_data['fecha_finiquito'],
        "fecha_termino": f_data['fecha_ultimo_dia'],
        "causal_articulo": f_data['causal_articulo'],
        "causal_nombre": f_data['causal_descripcion'],
        "causal_detalle": f_data.get('observaciones') or "Término de contrato."
    }
    
    pdf_bytes = generate_notice_letter_pdf(w_data, notice_data)
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=carta_aviso_{w_data['rut']}.pdf"}
    )

@router.patch("/{finiquito_id}", response_model=FiniquitoResponse)
def update_finiquito(finiquito_id: str, payload: dict, supabase: Client = Depends(get_db_client)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    response = supabase.table("finiquitos").update(payload).eq("id", finiquito_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Finiquito not found")
    return response.data[0]
