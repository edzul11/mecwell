-- Crear tabla de Faenas (Sites)
CREATE TABLE public.sites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear tabla de Trabajadores (Workers)
CREATE TABLE public.workers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    rut VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    position VARCHAR(100) NOT NULL,
    base_salary NUMERIC(10, 2) NOT NULL,
    health_institution VARCHAR(50) NOT NULL, -- Fonasa, Isapre (Cruz Blanca, Colmena, etc.)
    pension_fund VARCHAR(50) NOT NULL, -- AFP (Modelo, Habitat, etc.)
    site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL, -- Llave foránea a la faena actual
    status VARCHAR(50) DEFAULT 'active', -- active, inactive
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;

-- Crear políticas de desarrollo (Permitir acceso mientras programamos los endpoints)
CREATE POLICY "Permitir todo en desarrollo" ON public.sites FOR ALL USING (true);
CREATE POLICY "Permitir todo en desarrollo" ON public.workers FOR ALL USING (true);

-- Crear tabla de Anticipos de Sueldo (Salary Advances)
CREATE TABLE public.salary_advances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    worker_id UUID REFERENCES public.workers(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'approved',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.salary_advances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo en desarrollo" ON public.salary_advances FOR ALL USING (true);

-- Crear tabla de Asistencia (Attendance)
CREATE TABLE public.attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    worker_id UUID REFERENCES public.workers(id) ON DELETE CASCADE,
    site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'presente', -- presente, ausente, vacaciones, licencia, permiso
    overtime_hours NUMERIC(5, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(worker_id, date) -- Un trabajador solo puede tener un registro por día
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo en desarrollo" ON public.attendance FOR ALL USING (true);
