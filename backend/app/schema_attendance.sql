-- Script para crear la tabla de asistencia en Supabase

CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Presente',
    overtime_hours NUMERIC DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(worker_id, date)
);

-- Habilitar RLS
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Crear política de acceso para usuarios autenticados
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON attendance;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Permitir todo a usuarios autenticados" ON attendance FOR ALL TO authenticated USING (true);
