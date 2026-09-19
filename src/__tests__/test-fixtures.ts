import { Usuario, Seccion, Grado, Curso, AsignacionDocenteSeccion, HorarioSlot, Estudiante, Matricula, PeriodoEvaluacion, RegistroNota } from '../types';

export const TEST_GRADES: Grado[] = [
  { id: 'g-ini-3', nombre: '3 Años', nivel: 'inicial', orden: 1 },
  { id: 'g-ini-4', nombre: '4 Años', nivel: 'inicial', orden: 2 },
  { id: 'g-ini-5', nombre: '5 Años', nivel: 'inicial', orden: 3 },
  { id: 'g-pri-1', nombre: '1° Primaria', nivel: 'primaria', orden: 4 },
  { id: 'g-pri-2', nombre: '2° Primaria', nivel: 'primaria', orden: 5 },
  { id: 'g-pri-3', nombre: '3° Primaria', nivel: 'primaria', orden: 6 },
  { id: 'g-pri-4', nombre: '4° Primaria', nivel: 'primaria', orden: 7 },
  { id: 'g-pri-5', nombre: '5° Primaria', nivel: 'primaria', orden: 8 },
  { id: 'g-pri-6', nombre: '6° Primaria', nivel: 'primaria', orden: 9 },
  { id: 'g-sec-1', nombre: '1° Secundaria', nivel: 'secundaria', orden: 10 },
  { id: 'g-sec-2', nombre: '2° Secundaria', nivel: 'secundaria', orden: 11 },
  { id: 'g-sec-3', nombre: '3° Secundaria', nivel: 'secundaria', orden: 12 },
  { id: 'g-sec-4', nombre: '4° Secundaria', nivel: 'secundaria', orden: 13 },
  { id: 'g-sec-5', nombre: '5° Secundaria', nivel: 'secundaria', orden: 14 },
];

export const TEST_SECTIONS: Seccion[] = [
  { id: 'sec-g-ini-3-a', grado_id: 'g-ini-3', nombre: 'A', anio_academico: 2026, capacidad_maxima: 25, tutor_id: 'user-docente-1' },
  { id: 'sec-g-ini-3-b', grado_id: 'g-ini-3', nombre: 'B', anio_academico: 2026, capacidad_maxima: 25, tutor_id: 'user-docente-2' },
  { id: 'sec-g-pri-1-a', grado_id: 'g-pri-1', nombre: 'A', anio_academico: 2026, capacidad_maxima: 30, tutor_id: 'user-docente-1' },
  { id: 'sec-g-sec-1-a', grado_id: 'g-sec-1', nombre: 'A', anio_academico: 2026, capacidad_maxima: 35, tutor_id: 'user-docente-3' },
];

export const TEST_COURSES: Curso[] = [
  { id: 'cur-mat-1', codigo: 'MAT-101', nombre: 'Matemática', nivel: 'primaria', area_curricular: 'Matemática', orden_libreta: 1, competencias: [{ id: 'comp-1', codigo: 'C1', descripcion: 'Resuelve problemas de cantidad', orden: 1, peso: 1 }] },
  { id: 'cur-com-1', codigo: 'COM-101', nombre: 'Comunicación', nivel: 'primaria', area_curricular: 'Comunicación', orden_libreta: 2, competencias: [{ id: 'comp-2', codigo: 'C2', descripcion: 'Se comunica oralmente', orden: 1, peso: 1 }] },
  { id: 'cur-cta-1', codigo: 'CTA-101', nombre: 'Ciencia y Tecnología', nivel: 'primaria', area_curricular: 'Ciencia', orden_libreta: 3, competencias: [{ id: 'comp-3', codigo: 'C3', descripcion: 'Indaga mediante métodos científicos', orden: 1, peso: 1 }] },
];

export const TEST_USERS: Usuario[] = [
  { id: 'user-admin', email: 'admin@colegio.edu.pe', nombre: 'Administrador General', rol: 'admin', activo: true, created_at: '2026-01-01' },
  { id: 'user-docente-1', email: 'carlos.mendoza@colegio.edu.pe', nombre: 'Prof. Carlos Mendoza', rol: 'docente', activo: true, dni: '45678901', telefono: '987654321', created_at: '2026-01-01' },
  { id: 'user-docente-2', email: 'patricia.garcia@colegio.edu.pe', nombre: 'Prof. Patricia García', rol: 'docente', activo: true, dni: '45678902', telefono: '987654322', created_at: '2026-01-01' },
  { id: 'user-docente-3', email: 'jorge.ramirez@colegio.edu.pe', nombre: 'Prof. Jorge Ramírez', rol: 'docente', activo: true, dni: '45678903', telefono: '987654323', created_at: '2026-01-01' },
  { id: 'user-docente-4', email: 'ana.torres@colegio.edu.pe', nombre: 'Prof. Ana Torres', rol: 'docente', activo: true, dni: '45678904', telefono: '987654324', created_at: '2026-01-01' },
  { id: 'user-docente-5', email: 'luis.paredes@colegio.edu.pe', nombre: 'Prof. Luis Paredes', rol: 'docente', activo: true, dni: '45678905', telefono: '987654325', created_at: '2026-01-01' },
  { id: 'user-docente-6', email: 'rosa.vega@colegio.edu.pe', nombre: 'Prof. Rosa Vega', rol: 'docente', activo: true, dni: '45678906', telefono: '987654326', created_at: '2026-01-01' },
  { id: 'user-docente-7', email: 'diego.morales@colegio.edu.pe', nombre: 'Prof. Diego Morales', rol: 'docente', activo: true, dni: '45678907', telefono: '987654327', created_at: '2026-01-01' },
  { id: 'user-docente-8', email: 'elena.castro@colegio.edu.pe', nombre: 'Prof. Elena Castro', rol: 'docente', activo: true, dni: '45678908', telefono: '987654328', created_at: '2026-01-01' },
];

export const TEST_SECTION_COURSES: AsignacionDocenteSeccion[] = [
  { id: 'sc-1', seccion_id: 'sec-g-pri-1-a', curso_id: 'cur-mat-1', docente_id: 'user-docente-1', horas_semanales: 5 },
  { id: 'sc-2', seccion_id: 'sec-g-pri-1-a', curso_id: 'cur-com-1', docente_id: 'user-docente-2', horas_semanales: 4 },
];

export const TEST_SCHEDULE_SLOTS: HorarioSlot[] = [
  { id: 'slot-1', seccion_id: 'sec-g-pri-1-a', curso_id: 'cur-mat-1', docente_id: 'user-docente-1', dia: 1, hora_inicio: '08:00', hora_fin: '09:30', aula: 'Aula 101' },
  { id: 'slot-2', seccion_id: 'sec-g-pri-1-a', curso_id: 'cur-com-1', docente_id: 'user-docente-2', dia: 2, hora_inicio: '08:00', hora_fin: '09:30', aula: 'Aula 101' },
];

export const TEST_STUDENTS: Estudiante[] = [
  { id: 'est-1', codigo_estudiante: 'EST2026001', nombres: 'Héctor Alessander', apellidos: 'Vargas Silva', dni: '74125896', fecha_nacimiento: '2010-05-15', genero: 'M', direccion: 'Av. Las Palmeras 123', nombre_apoderado: 'Héctor Vargas', telefono_apoderado: '987654321', email_apoderado: 'hector.apoderado@colegio.edu.pe', created_at: '2026-01-01' },
];

export const TEST_ENROLLMENTS: Matricula[] = [
  { id: 'mat-1', estudiante_id: 'est-1', seccion_id: 'sec-g-pri-1-a', anio_academico: 2026, estado: 'activo', fecha_matricula: '2026-02-01' },
];

export const TEST_PERIODS: PeriodoEvaluacion[] = [
  { id: 'per-b1', nombre: '1er Bimestre', numero: 1, tipo: 'bimestre', anio_academico: 2026, fecha_inicio: '2026-03-01', fecha_fin: '2026-05-10', activo: true, cerrado: false },
  { id: 'per-b2', nombre: '2do Bimestre', numero: 2, tipo: 'bimestre', anio_academico: 2026, fecha_inicio: '2026-05-15', fecha_fin: '2026-07-25', activo: false, cerrado: false },
  { id: 'per-b3', nombre: '3er Bimestre', numero: 3, tipo: 'bimestre', anio_academico: 2026, fecha_inicio: '2026-08-10', fecha_fin: '2026-10-15', activo: false, cerrado: false },
  { id: 'per-b4', nombre: '4to Bimestre', numero: 4, tipo: 'bimestre', anio_academico: 2026, fecha_inicio: '2026-10-20', fecha_fin: '2026-12-20', activo: false, cerrado: false },
];

export const TEST_GRADE_RECORDS: RegistroNota[] = [
  { id: 'gn-1', matricula_id: 'mat-1', curso_id: 'cur-mat-1', competencia_id: 'comp-1', periodo_evaluacion_id: 'per-b1', nota_cualitativa: 'AD', nota_cuantitativa: 19, docente_id: 'user-docente-1', fecha_registro: '2026-04-15' },
];
