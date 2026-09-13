-- ==============================================================================
-- DATOS INICIALES COMPLETOS (SEED DATA) PARA COLESISTEMA MINI
-- Estructura Curricular Oficial CNEB (Primaria & Secundaria)
-- ==============================================================================

-- 1. Insertar Año Lectivo 2026
INSERT INTO public.periodos_academicos (id, nombre, anio, fecha_inicio, fecha_fin, activo)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Año Lectivo 2026', 2026, '2026-03-01', '2026-12-20', true)
ON CONFLICT (anio) DO UPDATE SET activo = true;

-- 2. Insertar 4 Bimestres Escolares
INSERT INTO public.periodos_evaluacion (id, periodo_academico_id, numero_periodo, nombre, fecha_inicio, fecha_fin, cerrado)
VALUES 
    ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111111', 1, 'I Bimestre', '2026-03-01', '2026-05-15', false),
    ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111111', 2, 'II Bimestre', '2026-05-18', '2026-07-24', false),
    ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111111', 3, 'III Bimestre', '2026-08-10', '2026-10-16', false),
    ('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111111', 4, 'IV Bimestre', '2026-10-19', '2026-12-18', false)
ON CONFLICT DO NOTHING;

-- 3. Insertar los 11 Grados Escolares
INSERT INTO public.grados (id, nivel, nombre, numero_grado)
VALUES
    ('33333333-3333-3333-3333-333333333301', 'primaria', '1° de Primaria', 1),
    ('33333333-3333-3333-3333-333333333302', 'primaria', '2° de Primaria', 2),
    ('33333333-3333-3333-3333-333333333303', 'primaria', '3° de Primaria', 3),
    ('33333333-3333-3333-3333-333333333304', 'primaria', '4° de Primaria', 4),
    ('33333333-3333-3333-3333-333333333305', 'primaria', '5° de Primaria', 5),
    ('33333333-3333-3333-3333-333333333306', 'primaria', '6° de Primaria', 6),
    ('33333333-3333-3333-3333-333333333307', 'secundaria', '1° de Secundaria', 1),
    ('33333333-3333-3333-3333-333333333308', 'secundaria', '2° de Secundaria', 2),
    ('33333333-3333-3333-3333-333333333309', 'secundaria', '3° de Secundaria', 3),
    ('33333333-3333-3333-3333-333333333310', 'secundaria', '4° de Secundaria', 4),
    ('33333333-3333-3333-3333-333333333311', 'secundaria', '5° de Secundaria', 5)
ON CONFLICT (nivel, numero_grado) DO NOTHING;

-- 4. Insertar Secciones A y B para los Grados
INSERT INTO public.secciones (id, grado_id, letra, capacidad_maxima)
VALUES
    ('44444444-4444-4444-4444-444444444401', '33333333-3333-3333-3333-333333333303', 'A', 30),
    ('44444444-4444-4444-4444-444444444402', '33333333-3333-3333-3333-333333333303', 'B', 30),
    ('44444444-4444-4444-4444-444444444403', '33333333-3333-3333-3333-333333333309', 'A', 35),
    ('44444444-4444-4444-4444-444444444404', '33333333-3333-3333-3333-333333333309', 'B', 35)
ON CONFLICT (grado_id, letra) DO NOTHING;

-- 5. Insertar Cursos Curriculares CNEB
INSERT INTO public.cursos (id, nombre, codigo, nivel, color_hex)
VALUES
    ('55555555-5555-5555-5555-555555555501', 'Matemática', 'MAT-PRI', 'primaria', '#3b82f6'),
    ('55555555-5555-5555-5555-555555555502', 'Comunicación', 'COM-PRI', 'primaria', '#ec4899'),
    ('55555555-5555-5555-5555-555555555503', 'Ciencia y Tecnología', 'CTA-PRI', 'primaria', '#10b981'),
    ('55555555-5555-5555-5555-555555555504', 'Personal Social', 'PS-PRI', 'primaria', '#f59e0b'),
    ('55555555-5555-5555-5555-555555555505', 'Inglés', 'ING-PRI', 'primaria', '#8b5cf6'),
    ('55555555-5555-5555-5555-555555555506', 'Matemática', 'MAT-SEC', 'secundaria', '#3b82f6'),
    ('55555555-5555-5555-5555-555555555507', 'Comunicación', 'COM-SEC', 'secundaria', '#ec4899'),
    ('55555555-5555-5555-5555-555555555508', 'Ciencia y Tecnología', 'CTA-SEC', 'secundaria', '#10b981'),
    ('55555555-5555-5555-5555-555555555509', 'Ciencias Sociales', 'CCSS-SEC', 'secundaria', '#f59e0b'),
    ('55555555-5555-5555-5555-555555555510', 'Inglés', 'ING-SEC', 'secundaria', '#8b5cf6')
ON CONFLICT (codigo) DO NOTHING;

-- 6. Insertar Competencias Curriculares
INSERT INTO public.competencias (id, curso_id, orden, codigo, descripcion)
VALUES
    ('66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555501', 1, 'C1', 'Resuelve problemas de cantidad'),
    ('66666666-6666-6666-6666-666666666602', '55555555-5555-5555-5555-555555555501', 2, 'C2', 'Resuelve problemas de regularidad, equivalencia y cambio'),
    ('66666666-6666-6666-6666-666666666603', '55555555-5555-5555-5555-555555555501', 3, 'C3', 'Resuelve problemas de forma, movimiento y localización'),
    ('66666666-6666-6666-6666-666666666604', '55555555-5555-5555-5555-555555555501', 4, 'C4', 'Resuelve problemas de gestión de datos e incertidumbre'),
    ('66666666-6666-6666-6666-666666666605', '55555555-5555-5555-5555-555555555502', 1, 'C1', 'Se comunica oralmente en su lengua materna'),
    ('66666666-6666-6666-6666-666666666606', '55555555-5555-5555-5555-555555555502', 2, 'C2', 'Lee diversos tipos de textos escritos en su lengua materna'),
    ('66666666-6666-6666-6666-666666666607', '55555555-5555-5555-5555-555555555502', 3, 'C3', 'Escribe diversos tipos de textos en su lengua materna')
ON CONFLICT DO NOTHING;
