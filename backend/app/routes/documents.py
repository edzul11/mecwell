from fastapi import Depends, APIRouter, HTTPException, UploadFile, File, Request
from typing import List
import shutil
import os
from uuid import uuid4
from ..schemas.document import DocumentCreate, DocumentResponse
from ..database import get_db_client
from supabase import Client

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.post("/upload")
def upload_file(request: Request, file: UploadFile = File(...), supabase: Client = Depends(get_db_client)):
    ext = file.filename.split(".")[-1]
    filename = f"{uuid4()}.{ext}"
    path = f"app/uploads/{filename}"
    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    base_url = str(request.base_url).rstrip('/')
    return {"url": f"{base_url}/uploads/{filename}"}

@router.get("/")
def get_documents(supabase: Client = Depends(get_db_client)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    
    response = supabase.table("documents").select("*, workers(first_name, last_name)").execute()
    return response.data

@router.post("/")
def create_document(doc: DocumentCreate, supabase: Client = Depends(get_db_client)):
    doc_dict = doc.model_dump()
    doc_dict['expiration_date'] = doc_dict['expiration_date'].isoformat()
    
    response = supabase.table("documents").insert(doc_dict).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create document")
    return response.data[0]
