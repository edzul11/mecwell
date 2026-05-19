-- 1. Añadir columna site_id a workers para vincularlos con una faena
ALTER TABLE workers ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES sites(id) ON DELETE SET NULL;
