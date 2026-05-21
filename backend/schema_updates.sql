-- 1. Crear tabla de Cotizaciones (si no existe)
CREATE TABLE IF NOT EXISTS public.quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_number VARCHAR(100) NOT NULL UNIQUE,
    client_name VARCHAR(255) NOT NULL,
    client_rut VARCHAR(20),
    client_city VARCHAR(100),
    client_phone VARCHAR(50),
    client_contact VARCHAR(100),
    client_area VARCHAR(100),
    client_email VARCHAR(255),
    service_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'Borrador',
    issue_date DATE NOT NULL,
    expiration_date DATE,
    
    labor_items JSONB DEFAULT '[]'::jsonb,
    material_items JSONB DEFAULT '[]'::jsonb,
    equipment_items JSONB DEFAULT '[]'::jsonb,
    other_expense_items JSONB DEFAULT '[]'::jsonb,
    
    overhead_percent NUMERIC(5, 4) DEFAULT 0.1500,
    utility_percent NUMERIC(5, 4) DEFAULT 0.1500,
    
    po_number VARCHAR(100),
    po_file_url TEXT,
    po_missing_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en quotes
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo en desarrollo" ON public.quotes FOR ALL USING (true);

-- 2. Agregar datos de facturación de cliente a las Faenas
ALTER TABLE public.sites 
ADD COLUMN IF NOT EXISTS client_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS client_rut VARCHAR(20),
ADD COLUMN IF NOT EXISTS client_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS client_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS client_contact VARCHAR(100),
ADD COLUMN IF NOT EXISTS client_email VARCHAR(255);
