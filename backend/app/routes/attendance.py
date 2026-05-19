from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import date
from ..schemas.attendance import AttendanceCreate, AttendanceResponse, BulkAttendance
from ..database import get_db_client
from supabase import Client
import calendar

router = APIRouter(prefix="/attendance", tags=["Attendance"])

@router.get("/{site_id}/{date_str}", response_model=List[AttendanceResponse])
def get_attendance_by_site_date(site_id: str, date_str: date, supabase: Client = Depends(get_db_client)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    
    # Obtener los registros de asistencia para una faena y fecha específicas
    res = supabase.table("attendance").select("*").eq("site_id", site_id).eq("date", str(date_str)).execute()
    return res.data

@router.post("/bulk")
def save_bulk_attendance(payload: BulkAttendance, supabase: Client = Depends(get_db_client)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    
    records = [record.model_dump(mode='json') for record in payload.records]
    if not records:
        return {"message": "No records to save"}
        
    # Upsert attendance records. Use worker_id,date as unique constraint
    res = supabase.table("attendance").upsert(records, on_conflict="worker_id,date").execute()
    return {"message": "Attendance saved successfully", "count": len(res.data) if res.data else 0}

@router.get("/summary/{worker_id}")
def get_attendance_summary(
    worker_id: str, 
    month: int = Query(..., ge=1, le=12), 
    year: int = Query(..., ge=2000), 
    supabase: Client = Depends(get_db_client)
):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    
    # Calcular el primer y último día del mes
    _, last_day = calendar.monthrange(year, month)
    start_date = date(year, month, 1)
    end_date = date(year, month, last_day)
    
    res = supabase.table("attendance").select("*").eq("worker_id", worker_id).gte("date", str(start_date)).lte("date", str(end_date)).execute()
    records = res.data
    
    summary = {
        "presente": 0,
        "ausente": 0,
        "vacaciones": 0,
        "licencia_medica": 0,
        "permiso": 0,
        "total_overtime_hours": 0.0,
        "total_records": len(records)
    }
    
    for r in records:
        status = r.get("status", "presente").lower()
        if status in summary:
            summary[status] += 1
        elif status == "licencia":
            summary["licencia_medica"] += 1
            
        summary["total_overtime_hours"] += float(r.get("overtime_hours") or 0.0)
        
    # La legislación chilena suele asumir 30 días comerciales.
    # Días trabajados pagables = 30 - ausencias (si el mes está completo)
    # Por defecto, calcularemos una sugerencia basada en 30 días, pero permitiremos al usuario ajustarlo en el UI.
    suggested_days_worked = 30 - summary["ausente"] - summary["permiso"]
    if suggested_days_worked < 0:
        suggested_days_worked = 0
        
    summary["suggested_days_worked"] = suggested_days_worked
    return summary
