-- 1. Actualizar la tabla workers para asegurar que tenga todas las columnas del perfil
ALTER TABLE workers ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS clothing_size TEXT;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS shoe_size TEXT;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS glove_size TEXT;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS account_type TEXT;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS marital_status TEXT;

-- 2. Crear tabla de documentos si no existe
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    document_type TEXT NOT NULL,
    expiration_date DATE,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
