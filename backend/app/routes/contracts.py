from fastapi import Depends, APIRouter, HTTPException
from fastapi.responses import Response
from ..services.pdf_generator import generate_contract_pdf
from ..database import get_db_client
from supabase import Client
from ..schemas.contract import BulkContractPayload
import zipfile
import io

router = APIRouter(prefix="/contracts", tags=["Contracts"])

@router.post("/generate-bulk")
def generate_contract_bulk(payload: BulkContractPayload, supabase: Client = Depends(get_db_client)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not initialized")
    
    if not payload.workers:
        raise HTTPException(400, "No workers specified")
        
    generated_pdfs = []
    
    for worker_data in payload.workers:
        worker_res = supabase.table("workers").select("*").eq("id", worker_data.worker_id).execute()
        if not worker_res.data:
            continue
            
        worker = worker_res.data[0]
        
        # Merge global payload with worker specific payload
        combined_payload = payload.dict(exclude={'workers'})
        worker_specific = worker_data.dict()
        combined_payload.update(worker_specific)
        
        pdf_bytes = generate_contract_pdf(worker, combined_payload)
        filename = f'contrato_{worker.get("rut")}.pdf'
        
        generated_pdfs.append((filename, pdf_bytes))
        
    if not generated_pdfs:
        raise HTTPException(404, "No contracts could be generated")
        
    # Return single PDF if only 1 worker
    if len(generated_pdfs) == 1:
        filename, pdf_bytes = generated_pdfs[0]
        headers = {
            'Content-Disposition': f'attachment; filename="{filename}"',
            'Access-Control-Expose-Headers': 'Content-Disposition'
        }
        return Response(content=pdf_bytes, media_type="application/pdf", headers=headers)
        
    # Return ZIP if multiple
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for filename, pdf_bytes in generated_pdfs:
            zip_file.writestr(filename, pdf_bytes)
            
    zip_buffer.seek(0)
    headers = {
        'Content-Disposition': 'attachment; filename="contratos.zip"',
        'Access-Control-Expose-Headers': 'Content-Disposition'
    }
    return Response(content=zip_buffer.getvalue(), media_type="application/zip", headers=headers)
