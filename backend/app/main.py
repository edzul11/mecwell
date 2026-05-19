from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .routes import workers, sites, contracts, payslips, documents, inventory, expenses, ppe, vacaciones, finiquitos, advances, attendance, dashboard
import os

app = FastAPI(title="Camila RRHH API", version="1.0.0")

os.makedirs("app/uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="app/uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(workers.router, prefix="/api/v1")
app.include_router(sites.router, prefix="/api/v1")
app.include_router(contracts.router, prefix="/api/v1")
app.include_router(payslips.router, prefix="/api/v1")
app.include_router(documents.router, prefix="/api/v1")
app.include_router(inventory.router, prefix="/api/v1")
app.include_router(expenses.router, prefix="/api/v1")
app.include_router(ppe.router, prefix="/api/v1")
app.include_router(vacaciones.router, prefix="/api/v1")
app.include_router(finiquitos.router, prefix="/api/v1")
app.include_router(advances.router, prefix="/api/v1")
app.include_router(attendance.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Welcome to Camila RRHH API"}
