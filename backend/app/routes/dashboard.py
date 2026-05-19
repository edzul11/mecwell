from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional, List, Any
from supabase import Client
from ..database import get_db_client

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/activities", response_model=List[Any])
def get_recent_activities(
    site_id: Optional[str] = Query(None),
    supabase: Client = Depends(get_db_client)
):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    
    activities = []
    worker_ids = None

    # Si se proporciona un site_id, obtenemos los IDs de los trabajadores de esa faena
    if site_id:
        try:
            workers_res = supabase.table("workers").select("id").eq("site_id", site_id).execute()
            worker_ids = [w["id"] for w in workers_res.data] if workers_res.data else []
        except Exception as e:
            print(f"Error fetching worker IDs for site_id {site_id}: {e}")
            worker_ids = []

    # 1. TRABAJADORES RECIENTES
    try:
        w_query = supabase.table("workers").select("id, first_name, last_name, created_at, site_id, sites(name)")
        if site_id:
            w_query = w_query.eq("site_id", site_id)
        recent_workers = w_query.order("created_at", desc=True).limit(5).execute().data
        
        for rw in (recent_workers or []):
            site_name = rw.get("sites", {}).get("name") if rw.get("sites") else "Sin Faena"
            activities.append({
                "type": "worker_created",
                "title": "Nuevo trabajador contratado",
                "subtitle": f"{rw['first_name']} {rw['last_name']} · {site_name}",
                "time": rw["created_at"],
                "icon": "UserPlus",
                "color": "#1E4D8C"
            })
    except Exception as e:
        print(f"Error fetching recent workers for dashboard: {e}")

    # Si se filtró por faena y no hay trabajadores, no tiene sentido consultar el resto de tablas
    if site_id and not worker_ids:
        # Retorna lo acumulado de workers (que será vacío) o las actividades que hayan
        return sorted(activities, key=lambda x: x["time"], reverse=True)[:6]

    # 2. DOCUMENTOS Y CONTRATOS RECIENTES
    try:
        doc_query = supabase.table("documents").select("id, name, document_type, created_at, worker_id, workers(first_name, last_name, site_id, sites(name))")
        if worker_ids is not None:
            doc_query = doc_query.in_("worker_id", worker_ids)
        recent_docs = doc_query.order("created_at", desc=True).limit(5).execute().data
        
        for rd in (recent_docs or []):
            worker_info = rd.get("workers")
            if not worker_info:
                continue
            site_name = worker_info.get("sites", {}).get("name") if worker_info.get("sites") else "Sin Faena"
            activities.append({
                "type": "document_created",
                "title": f"{rd['document_type']} generado",
                "subtitle": f"{worker_info['first_name']} {worker_info['last_name']} · {site_name}",
                "time": rd["created_at"],
                "icon": "FileText",
                "color": "#7C3AED"
            })
    except Exception as e:
        print(f"Error fetching recent documents for dashboard: {e}")

    # 3. LIQUIDACIONES DE SUELDO RECIENTES
    try:
        payslip_query = supabase.table("payslips").select("id, period_month, period_year, created_at, worker_id, workers(first_name, last_name, site_id, sites(name))")
        if worker_ids is not None:
            payslip_query = payslip_query.in_("worker_id", worker_ids)
        recent_payslips = payslip_query.order("created_at", desc=True).limit(5).execute().data
        
        months_es = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
        for rp in (recent_payslips or []):
            worker_info = rp.get("workers")
            if not worker_info:
                continue
            site_name = worker_info.get("sites", {}).get("name") if worker_info.get("sites") else "Sin Faena"
            month_idx = rp["period_month"] - 1
            month_name = months_es[month_idx] if 0 <= month_idx < 12 else str(rp["period_month"])
            activities.append({
                "type": "payslip_created",
                "title": "Liquidación creada",
                "subtitle": f"Lote {month_name} {rp['period_year']} · {worker_info['first_name']} {worker_info['last_name']} ({site_name})",
                "time": rp["created_at"],
                "icon": "Wallet",
                "color": "#059669"
            })
    except Exception as e:
        print(f"Error fetching recent payslips for dashboard: {e}")

    # 4. ENTREGAS DE EPP RECIENTES
    try:
        ppe_query = supabase.table("ppe_assignments").select("id, quantity, created_at, worker_id, workers(first_name, last_name, site_id, sites(name)), item_id, inventory_items(name)")
        if worker_ids is not None:
            ppe_query = ppe_query.in_("worker_id", worker_ids)
        recent_ppes = ppe_query.order("created_at", desc=True).limit(5).execute().data
        
        for rppe in (recent_ppes or []):
            worker_info = rppe.get("workers")
            item_info = rppe.get("inventory_items")
            if not worker_info or not item_info:
                continue
            site_name = worker_info.get("sites", {}).get("name") if worker_info.get("sites") else "Sin Faena"
            # Asegurar redondeo o formateo de cantidad
            qty = int(rppe['quantity']) if float(rppe['quantity']).is_integer() else rppe['quantity']
            activities.append({
                "type": "ppe_assigned",
                "title": "EPP asignado",
                "subtitle": f"{qty}x {item_info['name']} entregado a {worker_info['first_name']} {worker_info['last_name']} · {site_name}",
                "time": rppe["created_at"],
                "icon": "Shield",
                "color": "#D97706"
            })
    except Exception as e:
        print(f"Error fetching recent PPE assignments for dashboard: {e}")

    # 5. ANTICIPOS DE SUELDO RECIENTES
    try:
        adv_query = supabase.table("salary_advances").select("id, amount, created_at, worker_id, workers(first_name, last_name, site_id, sites(name))")
        if worker_ids is not None:
            adv_query = adv_query.in_("worker_id", worker_ids)
        recent_advances = adv_query.order("created_at", desc=True).limit(5).execute().data
        
        for ra in (recent_advances or []):
            worker_info = ra.get("workers")
            if not worker_info:
                continue
            site_name = worker_info.get("sites", {}).get("name") if worker_info.get("sites") else "Sin Faena"
            formatted_amount = f"${ra['amount']:,.0f}".replace(",", ".")
            activities.append({
                "type": "advance_created",
                "title": "Anticipo registrado",
                "subtitle": f"Monto: {formatted_amount} · {worker_info['first_name']} {worker_info['last_name']} ({site_name})",
                "time": ra["created_at"],
                "icon": "TrendingUp",
                "color": "#7C3AED"
            })
    except Exception as e:
        print(f"Error fetching recent advances for dashboard: {e}")

    # Ordenamiento global descendente por fecha
    activities.sort(key=lambda x: x["time"], reverse=True)
    
    # Retorna las 6 actividades más recientes
    return activities[:6]
