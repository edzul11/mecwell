-- Crear tabla de Cotizaciones (Quotes)
CREATE TABLE public.quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_number VARCHAR(100) NOT NULL UNIQUE,
    client_name VARCHAR(255) NOT NULL,
    client_rut VARCHAR(20),
    client_city VARCHAR(100),
    client_phone VARCHAR(50),
    client_contact VARCHAR(255),
    client_area VARCHAR(255),
    client_email VARCHAR(255),
    service_name TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Borrador' NOT NULL, -- Borrador, Enviada, Aprobada, Rechazada, Vencida, Por Pagar, Pagada
    issue_date DATE DEFAULT CURRENT_DATE NOT NULL,
    expiration_date DATE,
    labor_items JSONB DEFAULT '[]'::jsonb NOT NULL,
    material_items JSONB DEFAULT '[]'::jsonb NOT NULL,
    equipment_items JSONB DEFAULT '[]'::jsonb NOT NULL,
    other_expense_items JSONB DEFAULT '[]'::jsonb NOT NULL,
    overhead_percent NUMERIC(5, 2) DEFAULT 0.15 NOT NULL,
    utility_percent NUMERIC(5, 2) DEFAULT 0.15 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Crear políticas de desarrollo
CREATE POLICY "Permitir todo en desarrollo" ON public.quotes FOR ALL USING (true);
