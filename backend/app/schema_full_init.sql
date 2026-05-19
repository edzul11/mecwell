-- 1. Crear extensión uuid-ossp si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Crear las tablas necesarias (IF NOT EXISTS asegura que no borre nada si ya está)

CREATE TABLE IF NOT EXISTS sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    location TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Asegurarse de que workers tenga FK a sites si corresponde
-- ALTER TABLE workers ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES sites(id);

CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    stock_quantity NUMERIC DEFAULT 0,
    unit_price NUMERIC DEFAULT 0,
    unit_measure TEXT,
    is_returnable BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL, -- 'IN' or 'OUT'
    quantity_change NUMERIC NOT NULL,
    reason TEXT NOT NULL,
    reference_id TEXT,
    movement_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    amount NUMERIC NOT NULL,
    expense_date DATE NOT NULL,
    description TEXT NOT NULL,
    receipt_url TEXT,
    site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS ppe_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
    item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
    quantity NUMERIC DEFAULT 1.0,
    assignment_date DATE NOT NULL,
    acta_url TEXT,
    is_returned BOOLEAN DEFAULT false,
    return_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS payslips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
    period_month INTEGER NOT NULL,
    period_year INTEGER NOT NULL,
    days_worked INTEGER DEFAULT 30,
    gratification NUMERIC DEFAULT 0,
    bono_responsabilidad NUMERIC DEFAULT 0,
    horas_extras_amount NUMERIC DEFAULT 0,
    colacion NUMERIC DEFAULT 0,
    movilizacion NUMERIC DEFAULT 0,
    viatico NUMERIC DEFAULT 0,
    anticipo NUMERIC DEFAULT 0,
    base_salary NUMERIC NOT NULL,
    afp_discount NUMERIC NOT NULL,
    health_discount NUMERIC NOT NULL,
    cesantia_discount NUMERIC NOT NULL,
    net_salary NUMERIC NOT NULL,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    document_type TEXT NOT NULL,
    expiration_date DATE,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==========================================
-- 3. Habilitar RLS en todas las tablas
-- ==========================================
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppe_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 4. Crear políticas (Policies) para Usuarios Autenticados
-- ==========================================
-- Esto permite que cualquier usuario logueado pueda ver y editar todo
-- Si falla con "policy already exists", ignorar o ejecutar DROP POLICY primero.

DO $$ 
BEGIN
    -- Intentar borrar políticas anteriores si existen para evitar errores
    DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON workers;
    DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON sites;
    DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON inventory_items;
    DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON inventory_transactions;
    DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON ppe_assignments;
    DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON expenses;
    DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON payslips;
    DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON documents;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Permitir todo a usuarios autenticados" ON workers FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON sites FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON inventory_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON inventory_transactions FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON ppe_assignments FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON expenses FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON payslips FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON documents FOR ALL TO authenticated USING (true);
