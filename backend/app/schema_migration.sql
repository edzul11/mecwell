-- Supabase SQL Migration: Inventory, Expenses & PPE Assignments

-- 1. Inventory Items Table
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- e.g., 'Material', 'EPP'
    stock_quantity NUMERIC NOT NULL DEFAULT 0,
    unit_price NUMERIC NOT NULL DEFAULT 0,
    unit_measure TEXT, -- e.g., 'Unidad', 'Kg', 'Metro'
    is_returnable BOOLEAN NOT NULL DEFAULT false, -- For PPE like helmets
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Company Expenses Table
CREATE TABLE company_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount NUMERIC NOT NULL,
    expense_date DATE NOT NULL,
    description TEXT NOT NULL,
    receipt_url TEXT, -- URL from Supabase Storage 'receipts' bucket
    site_id UUID REFERENCES sites(id) ON DELETE SET NULL, -- Nullable if it's general expense
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Inventory Movements Table (Traceability)
CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL, -- 'IN' (Entrada) or 'OUT' (Salida)
    quantity_change NUMERIC NOT NULL, -- Absolute number of items changed
    reason TEXT NOT NULL, -- e.g., 'Compra', 'Asignación EPP', 'Pérdida/Desecho'
    reference_id UUID, -- Optional: ID of the expense or PPE assignment that caused this
    movement_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. PPE Assignments (Entregas de EPP)
CREATE TABLE ppe_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    quantity NUMERIC NOT NULL DEFAULT 1,
    assignment_date DATE NOT NULL,
    acta_url TEXT, -- URL from Supabase Storage 'documents' bucket
    is_returned BOOLEAN DEFAULT false, -- Only matters if the item is returnable
    return_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
