from fastapi import Depends, APIRouter, HTTPException
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel
from typing import List
import zipfile
import io
from ..database import get_db_client
from supabase import Client
from ..services.payroll import calculate_payslip
from ..services.pdf_generator import generate_payslip_pdf
from ..schemas.payslip import PayslipCreate

class BulkPayslipCreate(BaseModel):
    worker_ids: List[str]
    payload: PayslipCreate

router = APIRouter(prefix="/payslips", tags=["Payslips"])

@router.post("/generate/{worker_id}")
def generate_payslip(worker_id: str, payload: PayslipCreate, supabase: Client = Depends(get_db_client)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not initialized")
    
    worker_res = supabase.table("workers").select("*").eq("id", worker_id).execute()
    if not worker_res.data:
        raise HTTPException(404, "Worker not found")
    
    worker = worker_res.data[0]
    
    # Fetch approved salary advances
    adv_res = supabase.table("salary_advances").select("*").eq("worker_id", worker_id).eq("status", "approved").execute()
    total_advances = sum(float(a["amount"]) for a in adv_res.data)
    payload.anticipo = payload.anticipo + total_advances
    
    # Calculate exact payslip math based on payload
    payroll_data = calculate_payslip(
        base_salary=worker["base_salary"],
        afp_name=worker["pension_fund"],
        health_name=worker["health_institution"],
        days_worked=payload.days_worked,
        gratification=payload.gratification,
        bono_responsabilidad=payload.bono_responsabilidad,
        horas_extras_amount=payload.horas_extras_amount,
        colacion=payload.colacion,
        movilizacion=payload.movilizacion,
        viatico=payload.viatico,
        anticipo=payload.anticipo
    )
    
    # Save the record in the DB (Historical Data)
    db_record = {
        "worker_id": worker_id,
        "period_month": payload.period_month,
        "period_year": payload.period_year,
        "days_worked": payload.days_worked,
        "base_salary": worker["base_salary"],
        "gratification": payload.gratification,
        "bono_responsabilidad": payload.bono_responsabilidad,
        "horas_extras_amount": payload.horas_extras_amount,
        "colacion": payload.colacion,
        "movilizacion": payload.movilizacion,
        "viatico": payload.viatico,
        "afp_discount": payroll_data["afp_discount"],
        "health_discount": payroll_data["health_discount"],
        "cesantia_discount": payroll_data["cesantia_discount"],
        "anticipo": payload.anticipo,
        "net_salary": payroll_data["liquido_a_pagar"],
        "pdf_url": "" # Could save generated URL here if uploading to Supabase Storage
    }
    
    try:
        supabase.table("payslips").insert(db_record).execute()
        # Mark advances as deducted
        for a in adv_res.data:
            supabase.table("salary_advances").update({"status": "deducted"}).eq("id", a["id"]).execute()
    except Exception as e:
        print(f"Warning: could not save payslip history (did you create the table?): {e}")
        # Not failing so the user can still get the PDF
    
    # Generate the PDF Document
    pdf_bytes = generate_payslip_pdf(worker, payroll_data, payload)
    
    headers = {
        'Content-Disposition': f'attachment; filename="liquidacion_{worker.get("rut")}_{payload.period_month}_{payload.period_year}.pdf"'
    }
    return Response(content=pdf_bytes, media_type="application/pdf", headers=headers)

@router.post("/generate_bulk")
def generate_bulk_payslips(data: BulkPayslipCreate, supabase: Client = Depends(get_db_client)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not initialized")
    
    # Fetch all requested workers
    worker_res = supabase.table("workers").select("*").in_("id", data.worker_ids).execute()
    workers = worker_res.data
    if not workers:
        raise HTTPException(404, "No workers found")

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for worker in workers:
            # Fetch approved salary advances
            adv_res = supabase.table("salary_advances").select("*").eq("worker_id", worker["id"]).eq("status", "approved").execute()
            total_advances = sum(float(a["amount"]) for a in adv_res.data)
            
            # Use a local copy of anticipo for this worker
            worker_anticipo = data.payload.anticipo + total_advances
            
            # Calculate math
            payroll_data = calculate_payslip(
                base_salary=worker["base_salary"],
                afp_name=worker["pension_fund"],
                health_name=worker["health_institution"],
                days_worked=data.payload.days_worked,
                gratification=data.payload.gratification,
                bono_responsabilidad=data.payload.bono_responsabilidad,
                horas_extras_amount=data.payload.horas_extras_amount,
                colacion=data.payload.colacion,
                movilizacion=data.payload.movilizacion,
                viatico=data.payload.viatico,
                anticipo=worker_anticipo
            )
            
            # Save history
            db_record = {
                "worker_id": worker["id"],
                "period_month": data.payload.period_month,
                "period_year": data.payload.period_year,
                "days_worked": data.payload.days_worked,
                "base_salary": worker["base_salary"],
                "gratification": data.payload.gratification,
                "bono_responsabilidad": data.payload.bono_responsabilidad,
                "horas_extras_amount": data.payload.horas_extras_amount,
                "colacion": data.payload.colacion,
                "movilizacion": data.payload.movilizacion,
                "viatico": data.payload.viatico,
                "afp_discount": payroll_data["afp_discount"],
                "health_discount": payroll_data["health_discount"],
                "cesantia_discount": payroll_data["cesantia_discount"],
                "anticipo": worker_anticipo,
                "net_salary": payroll_data["liquido_a_pagar"],
                "pdf_url": ""
            }
            try:
                supabase.table("payslips").insert(db_record).execute()
                # Mark advances as deducted
                for a in adv_res.data:
                    supabase.table("salary_advances").update({"status": "deducted"}).eq("id", a["id"]).execute()
            except Exception as e:
                print(f"Warning: could not save payslip history for {worker['id']}: {e}")
            
            # Update data.payload to have the worker_anticipo for the PDF generation
            worker_payload = data.payload.model_copy(update={"anticipo": worker_anticipo})
            
            # Generate PDF
            pdf_bytes = generate_payslip_pdf(worker, payroll_data, worker_payload)
            filename = f"liquidacion_{worker.get('rut')}_{data.payload.period_month}_{data.payload.period_year}.pdf"
            zip_file.writestr(filename, pdf_bytes)

    zip_buffer.seek(0)
    
    headers = {
        'Content-Disposition': f'attachment; filename="liquidaciones_masivas_{data.payload.period_month}_{data.payload.period_year}.zip"'
    }
    return Response(content=zip_buffer.getvalue(), media_type="application/zip", headers=headers)
