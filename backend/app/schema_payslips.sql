-- Crear tabla payslips (Liquidaciones de sueldo)
CREATE TABLE IF NOT EXISTS payslips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
    period_month INT NOT NULL,
    period_year INT NOT NULL,
    days_worked INT DEFAULT 30,
    base_salary DECIMAL(10,2) NOT NULL,
    gratification DECIMAL(10,2) DEFAULT 0,
    bono_responsabilidad DECIMAL(10,2) DEFAULT 0,
    horas_extras_amount DECIMAL(10,2) DEFAULT 0,
    colacion DECIMAL(10,2) DEFAULT 0,
    movilizacion DECIMAL(10,2) DEFAULT 0,
    viatico DECIMAL(10,2) DEFAULT 0,
    afp_discount DECIMAL(10,2) DEFAULT 0,
    health_discount DECIMAL(10,2) DEFAULT 0,
    cesantia_discount DECIMAL(10,2) DEFAULT 0,
    anticipo DECIMAL(10,2) DEFAULT 0,
    net_salary DECIMAL(10,2) NOT NULL,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Refrescar la caché de PostgREST para que el API detecte la tabla inmediatamente
NOTIFY pgrst, 'reload schema';
