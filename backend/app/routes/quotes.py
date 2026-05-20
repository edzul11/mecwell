from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import Response
from typing import List, Optional
from ..schemas.quote import QuoteCreate, QuoteResponse
from ..database import get_db_client
from supabase import Client
from ..services.pdf_generator import generate_quote_pdf

router = APIRouter(prefix="/quotes", tags=["Quotes"])

@router.get("/", response_model=List[QuoteResponse])
def get_quotes(status: Optional[str] = None, supabase: Client = Depends(get_db_client)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    
    query = supabase.table("quotes").select("*").order("created_at", desc=True)
    if status:
        query = query.eq("status", status)
        
    response = query.execute()
    return response.data

@router.post("/", response_model=QuoteResponse)
def create_quote(quote: QuoteCreate, supabase: Client = Depends(get_db_client)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    
    # Check if quote number already exists
    exists = supabase.table("quotes").select("id").eq("quote_number", quote.quote_number).execute()
    if exists.data:
        raise HTTPException(status_code=400, detail=f"El número de cotización '{quote.quote_number}' ya existe.")
        
    response = supabase.table("quotes").insert(quote.model_dump(mode='json')).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Error al crear la cotización")
    return response.data[0]

@router.get("/{quote_id}", response_model=QuoteResponse)
def get_quote(quote_id: str, supabase: Client = Depends(get_db_client)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
        
    response = supabase.table("quotes").select("*").eq("id", quote_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    return response.data[0]

@router.put("/{quote_id}", response_model=QuoteResponse)
def update_quote(quote_id: str, quote: QuoteCreate, supabase: Client = Depends(get_db_client)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
        
    update_data = quote.model_dump(mode='json')
    # Update timestamp
    import datetime
    update_data["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    response = supabase.table("quotes").update(update_data).eq("id", quote_id).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Error al actualizar la cotización")
    return response.data[0]

@router.delete("/{quote_id}")
def delete_quote(quote_id: str, supabase: Client = Depends(get_db_client)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
        
    response = supabase.table("quotes").delete().eq("id", quote_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    return {"message": "Cotización eliminada exitosamente"}

@router.get("/{quote_id}/pdf")
def get_quote_pdf(quote_id: str, supabase: Client = Depends(get_db_client)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
        
    response = supabase.table("quotes").select("*").eq("id", quote_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
        
    quote_data = response.data[0]
    
    try:
        pdf_bytes = generate_quote_pdf(quote_data)
        filename = f"cotizacion_{quote_data.get('quote_number').replace(' ', '_')}.pdf"
        headers = {
            'Content-Disposition': f'attachment; filename="{filename}"',
            'Access-Control-Expose-Headers': 'Content-Disposition'
        }
        return Response(content=pdf_bytes, media_type="application/pdf", headers=headers)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar el PDF: {str(e)}")
