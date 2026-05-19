from pydantic import BaseModel
from typing import Optional, List

class WorkerSpecificData(BaseModel):
    worker_id: str
    worker_address: str = ""
    worker_commune: str = "Antofagasta"
    worker_region: str = "Antofagasta"
    worker_nationality: str = "chilena"
    worker_civil_status: str = "soltero(a)"
    worker_birth_date: str = "01 de enero de 1990"
    job_position: str = "maestro mayor"
    base_salary: float = 539000

class BulkContractPayload(BaseModel):
    # Employer
    employer_company: str = "MECWELL LIMITADA"
    employer_rut: str = "78.349.631-3"
    employer_rep: str = "Sergio Hans Farías Anabalón"
    employer_rep_rut: str = "15.019.122-k"
    employer_address: str = "Uribe # 636 depto. 302"
    employer_city: str = "Antofagasta"
    employer_email: str = "mecwelllimitada@gmail.com"
    
    # Dates
    contract_date: str = "01 de marzo de 2026"
    contract_start_date: str = "01 de marzo de 2026"
    contract_duration: str = "60 DIAS" # or "indefinido"
    
    # Job Site
    job_city: str = "Mejillones"
    job_site: str = "NORACID"
    job_site_address: str = "Tercera Industrial # 850"
    job_specific_task: str = "Levantamiento condiciones de riesgo"
    
    # Work Schedule
    work_schedule: str = "44 horas semanales, distribuidas de lunes a jueves de 08:00 a 18:00 y los dias viernes de 08:00 a 17:00 horas, un tiempo intermedio destinado a colación de 1 horas"
    
    # Clauses Options
    include_clause_13_14: bool = False
    old_employer_company: str = "MECWELL LIMITADA"
    old_employer_rut: str = "77.273.364-K"
    old_labor_start_date: str = "23 de febrero del 2026"
    custom_clauses: List[str] = []

    # Workers List
    workers: List[WorkerSpecificData] = []
