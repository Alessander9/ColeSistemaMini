-- ==============================================================================
-- SISTEMA ESCOLAR MINI (ColeSistemaMini) - ESQUEMA DE BASE DE DATOS POSTGRESQL
-- Diseñado para Supabase con Row Level Security (RLS), RBAC, Tareas, Evaluaciones,
-- Horarios Escolares, Bitácoras de Sesiones y Notificaciones Push
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TIPOS Y ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'docente', 'estudiante', 'apoderado', 'asistencia');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE nivel_educativo AS ENUM ('inicial', 'primaria', 'secundaria');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE calificacion_letra AS ENUM ('AD', 'A', 'B', 'C');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE estado_asistencia AS ENUM ('presente', 'tardanza', 'falta', 'justificado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE metodo_asistencia AS ENUM ('qr', 'manual');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE estado_matricula AS ENUM ('activo', 'retirado', 'trasladado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE dia_semana AS ENUM ('lunes', 'martes', 'miercoles', 'jueves', 'viernes');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABLA DE PERFILES (Extensión de auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    rol user_role NOT NULL DEFAULT 'estudiante',
    nombres TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    dni VARCHAR(15) UNIQUE NOT NULL,
    email TEXT UNIQUE,
    telefono VARCHAR(20),
    avatar_url TEXT,
    especialidad TEXT,
    cargo TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. PERIODOS ACADÉMICOS (Años Lectivos)
CREATE TABLE IF NOT EXISTS public.periodos_academicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL, -- ej. "Año Escolar 2026"
    anio INTEGER NOT NULL UNIQUE,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. GRADOS
CREATE TABLE IF NOT EXISTS public.grados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nivel nivel_educativo NOT NULL,
    nombre TEXT NOT NULL, -- ej. "1° Grado", "2° Grado"
    numero_grado INTEGER NOT NULL, -- 1, 2, 3, 4, 5, 6
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_nivel_numero UNIQUE (nivel, numero_grado)
);

-- 6. SECCIONES
CREATE TABLE IF NOT EXISTS public.secciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grado_id UUID NOT NULL REFERENCES public.grados(id) ON DELETE CASCADE,
    letra VARCHAR(5) NOT NULL, -- "A", "B", "C", "Única"
    capacidad_maxima INTEGER DEFAULT 35,
    tutor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_grado_seccion UNIQUE (grado_id, letra)
);

-- 7. ESTUDIANTES (Datos específicos del alumno y Apoderado)
CREATE TABLE IF NOT EXISTS public.estudiantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    codigo_estudiante VARCHAR(20) UNIQUE NOT NULL,
    fecha_nacimiento DATE,
    genero VARCHAR(10),
    direccion TEXT,
    nombre_apoderado TEXT,
    telefono_apoderado VARCHAR(20),
    email_apoderado TEXT,
    token_qr UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. MATRÍCULAS
CREATE TABLE IF NOT EXISTS public.matriculas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    estudiante_id UUID NOT NULL REFERENCES public.estudiantes(id) ON DELETE CASCADE,
    periodo_id UUID NOT NULL REFERENCES public.periodos_academicos(id) ON DELETE CASCADE,
    seccion_id UUID NOT NULL REFERENCES public.secciones(id) ON DELETE RESTRICT,
    fecha_matricula DATE DEFAULT CURRENT_DATE NOT NULL,
    estado estado_matricula NOT NULL DEFAULT 'activo',
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_estudiante_periodo UNIQUE (estudiante_id, periodo_id)
);

-- 9. CURSOS
CREATE TABLE IF NOT EXISTS public.cursos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nivel nivel_educativo NOT NULL,
    color_hex VARCHAR(10) DEFAULT '#3b82f6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. COMPETENCIAS
CREATE TABLE IF NOT EXISTS public.competencias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    curso_id UUID NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
    orden INTEGER NOT NULL DEFAULT 1,
    codigo VARCHAR(20),
    descripcion TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. ASIGNACIONES DOCENTE (Plan de Estudios por Aula)
CREATE TABLE IF NOT EXISTS public.asignaciones_docente (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    docente_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    curso_id UUID NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
    seccion_id UUID NOT NULL REFERENCES public.secciones(id) ON DELETE CASCADE,
    periodo_id UUID NOT NULL REFERENCES public.periodos_academicos(id) ON DELETE CASCADE,
    horas_semanales INTEGER DEFAULT 4,
    aula_defecto VARCHAR(50) DEFAULT 'Aula Principal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_docente_curso_seccion_periodo UNIQUE (docente_id, curso_id, seccion_id, periodo_id)
);

-- 12. HORARIOS ESCOLARES (Slots semanales con validación anti-cruce)
CREATE TABLE IF NOT EXISTS public.horarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seccion_id UUID NOT NULL REFERENCES public.secciones(id) ON DELETE CASCADE,
    curso_id UUID NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
    docente_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    dia dia_semana NOT NULL,
    hora_inicio VARCHAR(10) NOT NULL, -- ej. "08:00"
    hora_fin VARCHAR(10) NOT NULL,    -- ej. "08:45"
    aula VARCHAR(50) DEFAULT 'Aula 301',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_seccion_dia_hora UNIQUE (seccion_id, dia, hora_inicio),
    CONSTRAINT uq_docente_dia_hora UNIQUE (docente_id, dia, hora_inicio)
);

-- 13. PERIODOS DE EVALUACIÓN (Bimestres / Trimestres)
CREATE TABLE IF NOT EXISTS public.periodos_evaluacion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    periodo_academico_id UUID NOT NULL REFERENCES public.periodos_academicos(id) ON DELETE CASCADE,
    numero_periodo INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    cerrado BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_periodo_numero UNIQUE (periodo_academico_id, numero_periodo)
);

-- 14. ASISTENCIAS (Control QR y Manual Diario)
CREATE TABLE IF NOT EXISTS public.asistencias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matricula_id UUID NOT NULL REFERENCES public.matriculas(id) ON DELETE CASCADE,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    hora_registro TIME NOT NULL DEFAULT CURRENT_TIME,
    estado estado_asistencia NOT NULL DEFAULT 'presente',
    metodo metodo_asistencia NOT NULL DEFAULT 'qr',
    observacion TEXT,
    registrado_por UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_matricula_fecha UNIQUE (matricula_id, fecha)
);

-- 15. SESIONES DE CLASE & BITÁCORA DOCENTE
CREATE TABLE IF NOT EXISTS public.sesiones_clase (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slot_id UUID REFERENCES public.horarios(id) ON DELETE SET NULL,
    seccion_id UUID NOT NULL REFERENCES public.secciones(id) ON DELETE CASCADE,
    curso_id UUID NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
    docente_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    tema_tratado TEXT NOT NULL,
    observaciones TEXT,
    asistencia_tomada BOOLEAN NOT NULL DEFAULT true,
    alumnos_ausentes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 16. CALIFICACIONES (Notas por Competencia AD, A, B, C con Promedios)
CREATE TABLE IF NOT EXISTS public.calificaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matricula_id UUID NOT NULL REFERENCES public.matriculas(id) ON DELETE CASCADE,
    competencia_id UUID NOT NULL REFERENCES public.competencias(id) ON DELETE CASCADE,
    periodo_evaluacion_id UUID NOT NULL REFERENCES public.periodos_evaluacion(id) ON DELETE CASCADE,
    nota_letra calificacion_letra NOT NULL,
    nota_numerica INTEGER NOT NULL,
    conclusion_descriptiva TEXT,
    modificado_por UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_calificacion_estudiante_competencia UNIQUE (matricula_id, competencia_id, periodo_evaluacion_id)
);

-- 17. TAREAS ESCOLARES (Assignments)
CREATE TABLE IF NOT EXISTS public.tareas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    curso_id UUID NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
    seccion_id UUID NOT NULL REFERENCES public.secciones(id) ON DELETE CASCADE,
    docente_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    competencia_id UUID REFERENCES public.competencias(id) ON DELETE SET NULL,
    titulo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_limite TIMESTAMP WITH TIME ZONE NOT NULL,
    archivo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 18. ENTREGAS DE TAREAS
CREATE TABLE IF NOT EXISTS public.entregas_tareas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tarea_id UUID NOT NULL REFERENCES public.tareas(id) ON DELETE CASCADE,
    matricula_id UUID NOT NULL REFERENCES public.matriculas(id) ON DELETE CASCADE,
    fecha_entrega TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    archivo_url TEXT,
    comentario_estudiante TEXT,
    calificacion_letra calificacion_letra,
    retroalimentacion_docente TEXT,
    calificado_por UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    calificado_en TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_tarea_matricula UNIQUE (tarea_id, matricula_id)
);

-- 19. EVALUACIONES CONTINUAS (Exámenes y Prácticas)
CREATE TABLE IF NOT EXISTS public.evaluaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    curso_id UUID NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
    seccion_id UUID NOT NULL REFERENCES public.secciones(id) ON DELETE CASCADE,
    periodo_evaluacion_id UUID NOT NULL REFERENCES public.periodos_evaluacion(id) ON DELETE CASCADE,
    competencia_id UUID NOT NULL REFERENCES public.competencias(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL DEFAULT 'examen',
    fecha_programada DATE NOT NULL,
    hora_inicio TIME,
    duracion_minutos INTEGER DEFAULT 60,
    ponderacion NUMERIC(4,2) DEFAULT 1.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 20. NOTIFICACIONES EN TIEMPO REAL
CREATE TABLE IF NOT EXISTS public.notificaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL, -- 'asistencia', 'tarea', 'nota', 'comunicado'
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    leido BOOLEAN NOT NULL DEFAULT false,
    url_redireccion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 21. ÍNDICES DE ALTO RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_estudiantes_token_qr ON public.estudiantes(token_qr);
CREATE INDEX IF NOT EXISTS idx_estudiantes_codigo ON public.estudiantes(codigo_estudiante);
CREATE INDEX IF NOT EXISTS idx_asistencias_fecha ON public.asistencias(fecha);
CREATE INDEX IF NOT EXISTS idx_asistencias_matricula ON public.asistencias(matricula_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_matricula_fecha ON public.asistencias(matricula_id, fecha);
CREATE INDEX IF NOT EXISTS idx_matriculas_seccion_estado ON public.matriculas(seccion_id, estado);
CREATE INDEX IF NOT EXISTS idx_calificaciones_matricula_periodo ON public.calificaciones(matricula_id, periodo_evaluacion_id);
CREATE INDEX IF NOT EXISTS idx_horarios_docente_dia ON public.horarios(docente_id, dia, hora_inicio);
CREATE INDEX IF NOT EXISTS idx_horarios_seccion_dia ON public.horarios(seccion_id, dia, hora_inicio);
CREATE INDEX IF NOT EXISTS idx_sesiones_seccion_fecha ON public.sesiones_clase(seccion_id, fecha);
CREATE INDEX IF NOT EXISTS idx_sesiones_docente_fecha ON public.sesiones_clase(docente_id, fecha);
CREATE INDEX IF NOT EXISTS idx_tareas_curso_seccion ON public.tareas(curso_id, seccion_id);
CREATE INDEX IF NOT EXISTS idx_entregas_tarea ON public.entregas_tareas(tarea_id);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_curso ON public.evaluaciones(curso_id, seccion_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_user ON public.notificaciones(user_id, leido);

-- 22. TRIGGER DE AUTO-ACTUALIZACIÓN PARA updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_calificaciones_updated_at ON public.calificaciones;
CREATE TRIGGER set_calificaciones_updated_at
    BEFORE UPDATE ON public.calificaciones
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 23. AJUSTES DE TIPOS PARA LOS ROLES Y NIVELES QUE USA LA APLICACIÓN
-- (ADD VALUE no puede ir dentro de una transacción en versiones antiguas de Postgres; Supabase lo acepta)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'apoderado';
ALTER TYPE nivel_educativo ADD VALUE IF NOT EXISTS 'inicial';

-- Vínculo explícito alumno → cuenta del apoderado
ALTER TABLE public.estudiantes ADD COLUMN IF NOT EXISTS apoderado_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_estudiantes_apoderado ON public.estudiantes(apoderado_id);

-- 24. FUNCIONES DE APOYO PARA RLS
-- SECURITY DEFINER evita la recursión infinita que provoca consultar profiles desde una política de profiles.
CREATE OR REPLACE FUNCTION public.current_rol()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT rol::text FROM public.profiles WHERE id = auth.uid() AND activo = true
$$;

-- Personal del colegio: puede ver la información de todos los alumnos
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT COALESCE(public.current_rol() IN ('admin', 'docente', 'asistencia'), false)
$$;

-- Alumnos que el usuario actual puede ver: él mismo (estudiante) o sus hijos (apoderado)
CREATE OR REPLACE FUNCTION public.own_student_ids()
RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT id FROM public.estudiantes WHERE profile_id = auth.uid() OR apoderado_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.own_matricula_ids()
RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT id FROM public.matriculas WHERE estudiante_id IN (SELECT public.own_student_ids())
$$;

-- 25. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.periodos_academicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estudiantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matriculas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asignaciones_docente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.periodos_evaluacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sesiones_clase ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entregas_tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

-- Políticas anteriores (se borran para poder volver a ejecutar este archivo)
DROP POLICY IF EXISTS "Permitir lectura autenticada en profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin gestiona perfiles" ON public.profiles;
DROP POLICY IF EXISTS "Lectura general de catalogos" ON public.cursos;
DROP POLICY IF EXISTS "Lectura general de competencias" ON public.competencias;
DROP POLICY IF EXISTS "Lectura general de periodos" ON public.periodos_academicos;
DROP POLICY IF EXISTS "Lectura general de periodos evaluacion" ON public.periodos_evaluacion;
DROP POLICY IF EXISTS "Lectura general de grados" ON public.grados;
DROP POLICY IF EXISTS "Lectura general de secciones" ON public.secciones;
DROP POLICY IF EXISTS "Lectura de estudiantes" ON public.estudiantes;
DROP POLICY IF EXISTS "Admin gestiona estudiantes" ON public.estudiantes;
DROP POLICY IF EXISTS "Lectura de matriculas" ON public.matriculas;
DROP POLICY IF EXISTS "Admin gestiona matriculas" ON public.matriculas;
DROP POLICY IF EXISTS "Lectura de calificaciones" ON public.calificaciones;
DROP POLICY IF EXISTS "Docentes y Admin registran calificaciones" ON public.calificaciones;
DROP POLICY IF EXISTS "Lectura general de horarios" ON public.horarios;
DROP POLICY IF EXISTS "Admin gestiona horarios" ON public.horarios;
DROP POLICY IF EXISTS "Lectura general de sesiones" ON public.sesiones_clase;
DROP POLICY IF EXISTS "Docentes y Admin registran sesiones" ON public.sesiones_clase;
DROP POLICY IF EXISTS "Lectura de asistencias" ON public.asistencias;
DROP POLICY IF EXISTS "Registro de asistencias" ON public.asistencias;
DROP POLICY IF EXISTS "Lectura de tareas" ON public.tareas;
DROP POLICY IF EXISTS "Docentes y Admin gestionan tareas" ON public.tareas;
DROP POLICY IF EXISTS "Lectura de entregas" ON public.entregas_tareas;
DROP POLICY IF EXISTS "Estudiantes entregan tareas" ON public.entregas_tareas;
DROP POLICY IF EXISTS "Docentes califican entregas" ON public.entregas_tareas;
DROP POLICY IF EXISTS "Lectura de evaluaciones" ON public.evaluaciones;
DROP POLICY IF EXISTS "Gestion de evaluaciones por docente" ON public.evaluaciones;
DROP POLICY IF EXISTS "Gestion de notificaciones propias" ON public.notificaciones;

-- Perfiles: cada uno ve el suyo; el personal ve todos; el apoderado ve el de sus hijos y el alumno el de su apoderado
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (
    id = auth.uid()
    OR public.is_staff()
    OR id IN (SELECT profile_id FROM public.estudiantes WHERE apoderado_id = auth.uid())
    OR id IN (SELECT apoderado_id FROM public.estudiantes WHERE profile_id = auth.uid())
);
CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL TO authenticated
    USING (public.current_rol() = 'admin') WITH CHECK (public.current_rol() = 'admin');

-- Catálogos del colegio: lectura para cualquier usuario autenticado, cambios solo del admin
CREATE POLICY "periodos_academicos_select" ON public.periodos_academicos FOR SELECT TO authenticated USING (true);
CREATE POLICY "periodos_academicos_admin" ON public.periodos_academicos FOR ALL TO authenticated
    USING (public.current_rol() = 'admin') WITH CHECK (public.current_rol() = 'admin');
CREATE POLICY "periodos_evaluacion_select" ON public.periodos_evaluacion FOR SELECT TO authenticated USING (true);
CREATE POLICY "periodos_evaluacion_admin" ON public.periodos_evaluacion FOR ALL TO authenticated
    USING (public.current_rol() = 'admin') WITH CHECK (public.current_rol() = 'admin');
CREATE POLICY "grados_select" ON public.grados FOR SELECT TO authenticated USING (true);
CREATE POLICY "grados_admin" ON public.grados FOR ALL TO authenticated
    USING (public.current_rol() = 'admin') WITH CHECK (public.current_rol() = 'admin');
CREATE POLICY "secciones_select" ON public.secciones FOR SELECT TO authenticated USING (true);
CREATE POLICY "secciones_admin" ON public.secciones FOR ALL TO authenticated
    USING (public.current_rol() = 'admin') WITH CHECK (public.current_rol() = 'admin');
CREATE POLICY "cursos_select" ON public.cursos FOR SELECT TO authenticated USING (true);
CREATE POLICY "cursos_admin" ON public.cursos FOR ALL TO authenticated
    USING (public.current_rol() = 'admin') WITH CHECK (public.current_rol() = 'admin');
CREATE POLICY "competencias_select" ON public.competencias FOR SELECT TO authenticated USING (true);
CREATE POLICY "competencias_admin" ON public.competencias FOR ALL TO authenticated
    USING (public.current_rol() = 'admin') WITH CHECK (public.current_rol() = 'admin');
CREATE POLICY "asignaciones_select" ON public.asignaciones_docente FOR SELECT TO authenticated USING (true);
CREATE POLICY "asignaciones_admin" ON public.asignaciones_docente FOR ALL TO authenticated
    USING (public.current_rol() = 'admin') WITH CHECK (public.current_rol() = 'admin');
CREATE POLICY "horarios_select" ON public.horarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "horarios_admin" ON public.horarios FOR ALL TO authenticated
    USING (public.current_rol() = 'admin') WITH CHECK (public.current_rol() = 'admin');

-- Datos personales de alumnos: el personal ve todo; el alumno y su apoderado, solo lo suyo
CREATE POLICY "estudiantes_select" ON public.estudiantes FOR SELECT TO authenticated USING (
    public.is_staff() OR id IN (SELECT public.own_student_ids())
);
CREATE POLICY "estudiantes_admin" ON public.estudiantes FOR ALL TO authenticated
    USING (public.current_rol() = 'admin') WITH CHECK (public.current_rol() = 'admin');

CREATE POLICY "matriculas_select" ON public.matriculas FOR SELECT TO authenticated USING (
    public.is_staff() OR id IN (SELECT public.own_matricula_ids())
);
CREATE POLICY "matriculas_admin" ON public.matriculas FOR ALL TO authenticated
    USING (public.current_rol() = 'admin') WITH CHECK (public.current_rol() = 'admin');

CREATE POLICY "calificaciones_select" ON public.calificaciones FOR SELECT TO authenticated USING (
    public.is_staff() OR matricula_id IN (SELECT public.own_matricula_ids())
);
CREATE POLICY "calificaciones_staff" ON public.calificaciones FOR ALL TO authenticated
    USING (public.current_rol() IN ('admin', 'docente')) WITH CHECK (public.current_rol() IN ('admin', 'docente'));

CREATE POLICY "asistencias_select" ON public.asistencias FOR SELECT TO authenticated USING (
    public.is_staff() OR matricula_id IN (SELECT public.own_matricula_ids())
);
CREATE POLICY "asistencias_insert" ON public.asistencias FOR INSERT TO authenticated
    WITH CHECK (public.current_rol() IN ('admin', 'docente', 'asistencia'));
CREATE POLICY "asistencias_update" ON public.asistencias FOR UPDATE TO authenticated
    USING (public.current_rol() IN ('admin', 'docente')) WITH CHECK (public.current_rol() IN ('admin', 'docente'));
CREATE POLICY "asistencias_delete" ON public.asistencias FOR DELETE TO authenticated
    USING (public.current_rol() = 'admin');

CREATE POLICY "sesiones_select" ON public.sesiones_clase FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "sesiones_staff" ON public.sesiones_clase FOR ALL TO authenticated
    USING (public.current_rol() IN ('admin', 'docente')) WITH CHECK (public.current_rol() IN ('admin', 'docente'));

CREATE POLICY "tareas_select" ON public.tareas FOR SELECT TO authenticated USING (
    public.is_staff()
    OR seccion_id IN (SELECT seccion_id FROM public.matriculas WHERE id IN (SELECT public.own_matricula_ids()))
);
CREATE POLICY "tareas_staff" ON public.tareas FOR ALL TO authenticated
    USING (public.current_rol() IN ('admin', 'docente')) WITH CHECK (public.current_rol() IN ('admin', 'docente'));

CREATE POLICY "entregas_select" ON public.entregas_tareas FOR SELECT TO authenticated USING (
    public.is_staff() OR matricula_id IN (SELECT public.own_matricula_ids())
);
-- Un alumno solo puede entregar a nombre de su propia matrícula
CREATE POLICY "entregas_insert_alumno" ON public.entregas_tareas FOR INSERT TO authenticated WITH CHECK (
    public.current_rol() = 'estudiante'
    AND matricula_id IN (SELECT m.id FROM public.matriculas m JOIN public.estudiantes e ON e.id = m.estudiante_id WHERE e.profile_id = auth.uid())
);
CREATE POLICY "entregas_staff" ON public.entregas_tareas FOR ALL TO authenticated
    USING (public.current_rol() IN ('admin', 'docente')) WITH CHECK (public.current_rol() IN ('admin', 'docente'));

CREATE POLICY "evaluaciones_select" ON public.evaluaciones FOR SELECT TO authenticated USING (
    public.is_staff()
    OR seccion_id IN (SELECT seccion_id FROM public.matriculas WHERE id IN (SELECT public.own_matricula_ids()))
);
CREATE POLICY "evaluaciones_staff" ON public.evaluaciones FOR ALL TO authenticated
    USING (public.current_rol() IN ('admin', 'docente')) WITH CHECK (public.current_rol() IN ('admin', 'docente'));

CREATE POLICY "notificaciones_propias" ON public.notificaciones FOR ALL TO authenticated
    USING (user_id = auth.uid() OR public.current_rol() = 'admin')
    WITH CHECK (user_id = auth.uid() OR public.is_staff());
