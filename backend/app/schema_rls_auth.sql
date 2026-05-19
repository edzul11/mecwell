-- 1. Habilitar RLS en todas las tablas
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppe_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- 2. Crear políticas que permiten acceso total SOLO a usuarios autenticados (con sesión iniciada en Supabase Auth)
-- Nota: La clave 'anon' pública será rechazada automáticamente porque no cumple 'TO authenticated'.

CREATE POLICY "Permitir todo a usuarios autenticados" ON workers FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON sites FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON inventory_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON inventory_transactions FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON ppe_assignments FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON expenses FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON payslips FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON documents FOR ALL TO authenticated USING (true);
