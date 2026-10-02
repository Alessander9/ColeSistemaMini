# -*- coding: utf-8 -*-
"""
Genera supabase/seed.sql enriquecido con datos realistas
a mitad del año escolar 2026.
"""

output_sql = r"c:\Users\Alessander\Desktop\TRABAJOS\ACTUALES\ColeSistemaMini\supabase\seed.sql"

sql_content = """-- ==============================================================================
-- DATOS INICIALES COMPLETOS (SEED DATA) PARA COLESISTEMA MINI
-- Estructura Curricular Oficial CNEB a mitad del año escolar 2026
-- I y II Bimestres cerrados con notas; III Bimestre activo en curso.
-- ==============================================================================

-- 1. Insertar Año Lectivo 2026
INSERT INTO public.periodos_academicos (id, nombre, anio, fecha_inicio, fecha_fin, activo)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Año Lectivo 2026', 2026, '2026-03-01', '2026-12-20', true)
ON CONFLICT (anio) DO UPDATE SET activo = true;

-- 2. Insertar 4 Bimestres Escolares (I y II cerrados, III activo)
INSERT INTO public.periodos_evaluacion (id, periodo_academico_id, numero_periodo, nombre, fecha_inicio, fecha_fin, cerrado)
VALUES 
    ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111111', 1, 'I Bimestre', '2026-03-01', '2026-05-15', true),
    ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111111', 2, 'II Bimestre', '2026-05-18', '2026-07-24', true),
    ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111111', 3, 'III Bimestre', '2026-08-10', '2026-10-16', false),
    ('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111111', 4, 'IV Bimestre', '2026-10-19', '2026-12-18', false)
ON CONFLICT DO NOTHING;

-- 3. Insertar los Grados Escolares
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

-- 4. Insertar Secciones
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

-- 7. Insertar Usuarios de Demostración en public.profiles
INSERT INTO public.profiles (id, rol, nombres, apellidos, dni, email, telefono, activo)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin', 'Administrador', 'Institucional', '44556677', 'admin@colegio.edu.pe', '987654321', true),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'docente', 'Tomás', 'Pérez Quispe', '10203040', 'docente@colegio.edu.pe', '912345678', true),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'docente', 'Carmen Rosa', 'Mendoza Ramos', '25487910', 'carmen.mendoza@colegio.edu.pe', '984512367', true),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'estudiante', 'Lucas', 'Morales Vega', '70809010', 'estudiante@colegio.edu.pe', '998877665', true),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'estudiante', 'Sofía Valentina', 'Castro Rivas', '71203040', 'sofia.castro@colegio.edu.pe', '984512399', true),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'asistencia', 'Portería', 'Principal', '99887766', 'asistencia@colegio.edu.pe', '999888777', true)
ON CONFLICT (dni) DO NOTHING;

-- 8. Insertar Estudiantes
INSERT INTO public.estudiantes (id, profile_id, codigo_estudiante, fecha_nacimiento, genero, direccion, nombre_apoderado, telefono_apoderado, email_apoderado, token_qr)
VALUES
    ('77777777-7777-7777-7777-777777777701', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'EST-2026-001', '2015-05-14', 'M', 'Av. Los Álamos 456, Lima', 'Perico Morales Silva', '987654321', 'apoderado@colegio.edu.pe', '99999999-9999-9999-9999-999999999901'),
    ('77777777-7777-7777-7777-777777777702', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'EST-2026-002', '2015-08-22', 'F', 'Jr. Huancavelica 782, Lima', 'Carmen Rivas de Castro', '984512399', 'carmen.rivas@gmail.com', '99999999-9999-9999-9999-999999999902')
ON CONFLICT (codigo_estudiante) DO NOTHING;

-- 9. Insertar Matrículas
INSERT INTO public.matriculas (id, estudiante_id, periodo_id, seccion_id, fecha_matricula, estado)
VALUES
    ('88888888-8888-8888-8888-888888888801', '77777777-7777-7777-7777-777777777701', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444401', '2026-03-01', 'activo'),
    ('88888888-8888-8888-8888-888888888802', '77777777-7777-7777-7777-777777777702', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444401', '2026-03-01', 'activo')
ON CONFLICT DO NOTHING;

-- 10. Insertar Calificaciones Oficiales (I y II Bimestre completas, III Bimestre parcial)
INSERT INTO public.calificaciones (matricula_id, competencia_id, periodo_evaluacion_id, nota_letra, nota_numerica, conclusion_descriptiva)
VALUES
    -- I Bimestre Lucas
    ('88888888-8888-8888-8888-888888888801', '66666666-6666-6666-6666-666666666601', '22222222-2222-2222-2222-222222222201', 'AD', 4, 'Resuelve problemas de cantidad con cálculo mental fluido.'),
    ('88888888-8888-8888-8888-888888888801', '66666666-6666-6666-6666-666666666602', '22222222-2222-2222-2222-222222222201', 'A', 3, 'Expresa regularidades y equivalencias numéricas.'),
    ('88888888-8888-8888-8888-888888888801', '66666666-6666-6666-6666-666666666605', '22222222-2222-2222-2222-222222222201', 'A', 3, 'Se comunica oralmente con claridad y respeto.'),
    ('88888888-8888-8888-8888-888888888801', '66666666-6666-6666-6666-666666666606', '22222222-2222-2222-2222-222222222201', 'AD', 4, 'Comprende textos narrativos y argumentativos a profundidad.'),
    -- II Bimestre Lucas
    ('88888888-8888-8888-8888-888888888801', '66666666-6666-6666-6666-666666666601', '22222222-2222-2222-2222-222222222202', 'AD', 4, 'Domina operaciones con fracciones y números decimales.'),
    ('88888888-8888-8888-8888-888888888801', '66666666-6666-6666-6666-666666666602', '22222222-2222-2222-2222-222222222202', 'AD', 4, 'Modela patrones numéricos y resuelve ecuaciones.'),
    ('88888888-8888-8888-8888-888888888801', '66666666-6666-6666-6666-666666666606', '22222222-2222-2222-2222-222222222202', 'AD', 4, 'Excelente comprensión lectora crítica.'),
    -- III Bimestre Lucas (en curso)
    ('88888888-8888-8888-8888-888888888801', '66666666-6666-6666-6666-666666666601', '22222222-2222-2222-2222-222222222203', 'AD', 4, 'Avance notable en fracciones heterogéneas.'),
    -- I y II Bimestre Sofía
    ('88888888-8888-8888-8888-888888888802', '66666666-6666-6666-6666-666666666601', '22222222-2222-2222-2222-222222222201', 'A', 3, 'Buen desempeño en resolución de operaciones.'),
    ('88888888-8888-8888-8888-888888888802', '66666666-6666-6666-6666-666666666606', '22222222-2222-2222-2222-222222222201', 'AD', 4, 'Excelente nivel de comprensión lectora.'),
    ('88888888-8888-8888-8888-888888888802', '66666666-6666-6666-6666-666666666601', '22222222-2222-2222-2222-222222222202', 'AD', 4, 'Superación destacada en resolución de problemas.')
ON CONFLICT (matricula_id, competencia_id, periodo_evaluacion_id) DO NOTHING;

-- 11. Insertar Asistencias QR Representativas
INSERT INTO public.asistencias (matricula_id, fecha, hora_registro, estado, metodo, observacion, registrado_por)
VALUES
    ('88888888-8888-8888-8888-888888888801', '2026-10-01', '07:44:12', 'presente', 'qr', 'Ingreso puntual por portería principal', 'ffffffff-ffff-ffff-ffff-ffffffffffff'),
    ('88888888-8888-8888-8888-888888888802', '2026-10-01', '07:48:30', 'presente', 'qr', 'Ingreso puntual por portería principal', 'ffffffff-ffff-ffff-ffff-ffffffffffff'),
    ('88888888-8888-8888-8888-888888888801', '2026-09-25', '07:42:00', 'presente', 'qr', 'Ingreso puntual', 'ffffffff-ffff-ffff-ffff-ffffffffffff'),
    ('88888888-8888-8888-8888-888888888801', '2026-09-18', '07:41:00', 'presente', 'qr', 'Ingreso puntual', 'ffffffff-ffff-ffff-ffff-ffffffffffff'),
    ('88888888-8888-8888-8888-888888888801', '2026-08-11', '07:39:10', 'presente', 'qr', 'Ingreso puntual', 'ffffffff-ffff-ffff-ffff-ffffffffffff')
ON CONFLICT (matricula_id, fecha) DO NOTHING;

-- 12. Insertar Tareas
INSERT INTO public.tareas (id, curso_id, seccion_id, docente_id, competencia_id, titulo, descripcion, fecha_limite)
VALUES
    ('99999999-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555501', '44444444-4444-4444-4444-444444444401', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '66666666-6666-6666-6666-666666666601', 'Ficha N° 1: Descomposición de Números', 'Páginas 18 a 20 del cuaderno de trabajo', '2026-03-25 23:59:00+00'),
    ('99999999-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555501', '44444444-4444-4444-4444-444444444401', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '66666666-6666-6666-6666-666666666601', 'Taller de Fracciones: Representación Gráfica', 'Guía práctica de fracciones homogéneas', '2026-06-15 23:59:00+00'),
    ('99999999-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555502', '44444444-4444-4444-4444-444444444401', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '66666666-6666-6666-6666-666666666607', 'Ensayo Breve: El Cuidado del Agua', 'Redactar un ensayo expositivo de 3 párrafos', '2026-10-08 23:59:00+00')
ON CONFLICT DO NOTHING;

-- 13. Insertar Entregas de Tareas
INSERT INTO public.entregas_tareas (tarea_id, matricula_id, fecha_entrega, comentario_estudiante, calificacion_letra, retroalimentacion_docente, calificado_por)
VALUES
    ('99999999-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888801', '2026-03-24 18:30:00+00', 'Adjunto mis actividades resueltas', 'AD', 'Excelente orden y precisión en los cálculos', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
    ('99999999-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888801', '2026-06-14 20:10:00+00', 'Círculo de fracciones completado', 'AD', 'Creativo y correcto dominio pedagógico', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
ON CONFLICT (tarea_id, matricula_id) DO NOTHING;
"""

with open(output_sql, 'w', encoding='utf-8') as f:
    f.write(sql_content.strip() + '\n')

print("supabase/seed.sql actualizado con éxito.")
