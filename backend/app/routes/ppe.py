from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from typing import List, Any
from ..schemas.ppe import PPEAssignment, PPEAssignmentCreate, PPEAssignmentUpdate
from ..services import ppe_service
from ..database import get_db_client
from supabase import Client

router = APIRouter(prefix="/ppe", tags=["PPE"])

@router.get("/worker/{worker_id}", response_model=List[Any])
def get_worker_ppes(worker_id: str, supabase: Client = Depends(get_db_client)):
    return ppe_service.get_worker_ppes(worker_id, supabase)

@router.post("/assign", response_model=PPEAssignment)
def assign_ppe(assignment: PPEAssignmentCreate, supabase: Client = Depends(get_db_client)):
    return ppe_service.assign_ppe(assignment, supabase)

@router.post("/return/{assignment_id}", response_model=PPEAssignment)
def return_ppe(assignment_id: str, return_update: PPEAssignmentUpdate, supabase: Client = Depends(get_db_client)):
    return ppe_service.return_ppe(assignment_id, return_update, supabase)

@router.get("/receipt/{assignment_id}")
def download_ppe_receipt(assignment_id: str, supabase: Client = Depends(get_db_client)):
    """Genera y descarga el Acta de Recepción de EPP/Material firmada por el trabajador."""
    # Fetch assignment with item and worker data
    assignment_res = supabase.table("ppe_assignments").select(
        "*, inventory_items(name, unit_measure, category, is_returnable), workers(first_name, last_name, rut, position)"
    ).eq("id", assignment_id).execute()

    if not assignment_res.data:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")

    assignment = assignment_res.data[0]
    worker = assignment.get("workers") or {}
    item = assignment.get("inventory_items") or {}

    from ..services.pdf_generator import generate_ppe_receipt_pdf
    pdf_bytes = generate_ppe_receipt_pdf(assignment, worker, item)

    worker_rut = worker.get("rut", "sin_rut").replace(".", "").replace("-", "")
    filename = f"acta_recepcion_{worker_rut}_{item.get('name', 'material').replace(' ', '_')}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )
