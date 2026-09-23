import { 
  UserProfile, 
  Section, 
  GradeLevel, 
  Course, 
  SectionCourseAssignment, 
  ScheduleSlot, 
  Student, 
  Enrollment, 
  EvaluationPeriod, 
  GradeRecord 
} from '../types';

export const TEST_GRADES: GradeLevel[] = [
  { id: 'g-ini-3', nombre: '3 Años', nivel: 'inicial', numero_grado: 1 },
  { id: 'g-ini-4', nombre: '4 Años', nivel: 'inicial', numero_grado: 2 },
  { id: 'g-ini-5', nombre: '5 Años', nivel: 'inicial', numero_grado: 3 },
  { id: 'g-pri-1', nombre: '1° Primaria', nivel: 'primaria', numero_grado: 1 },
  { id: 'g-pri-2', nombre: '2° Primaria', nivel: 'primaria', numero_grado: 2 },
  { id: 'g-pri-3', nombre: '3° Primaria', nivel: 'primaria', numero_grado: 3 },
  { id: 'g-pri-4', nombre: '4° Primaria', nivel: 'primaria', numero_grado: 4 },
  { id: 'g-pri-5', nombre: '5° Primaria', nivel: 'primaria', numero_grado: 5 },
  { id: 'g-pri-6', nombre: '6° Primaria', nivel: 'primaria', numero_grado: 6 },
  { id: 'g-sec-1', nombre: '1° Secundaria', nivel: 'secundaria', numero_grado: 1 },
  { id: 'g-sec-2', nombre: '2° Secundaria', nivel: 'secundaria', numero_grado: 2 },
  { id: 'g-sec-3', nombre: '3° Secundaria', nivel: 'secundaria', numero_grado: 3 },
  { id: 'g-sec-4', nombre: '4° Secundaria', nivel: 'secundaria', numero_grado: 4 },
  { id: 'g-sec-5', nombre: '5° Secundaria', nivel: 'secundaria', numero_grado: 5 },
];

export const TEST_SECTIONS: Section[] = [
  { id: 'sec-g-ini-3-a', grado_id: 'g-ini-3', letra: 'A', capacidad_maxima: 25, tutor_id: 'user-docente-1' },
  { id: 'sec-g-ini-3-b', grado_id: 'g-ini-3', letra: 'B', capacidad_maxima: 25, tutor_id: 'user-docente-2' },
  { id: 'sec-g-pri-1-a', grado_id: 'g-pri-1', letra: 'A', capacidad_maxima: 30, tutor_id: 'user-docente-1' },
  { id: 'sec-g-sec-1-a', grado_id: 'g-sec-1', letra: 'A', capacidad_maxima: 35, tutor_id: 'user-docente-3' },
];

export const TEST_COURSES: Course[] = [
  { id: 'cur-mat-1', codigo: 'MAT-101', nombre: 'Matemática', nivel: 'primaria', area_curricular: 'Matemática', competencias: [{ id: 'comp-1', curso_id: 'cur-mat-1', codigo: 'C1', descripcion: 'Resuelve problemas de cantidad', orden: 1 }] },
  { id: 'cur-com-1', codigo: 'COM-101', nombre: 'Comunicación', nivel: 'primaria', area_curricular: 'Comunicación', competencias: [{ id: 'comp-2', curso_id: 'cur-com-1', codigo: 'C2', descripcion: 'Se comunica oralmente', orden: 1 }] },
  { id: 'cur-cta-1', codigo: 'CTA-101', nombre: 'Ciencia y Tecnología', nivel: 'primaria', area_curricular: 'Ciencia', competencias: [{ id: 'comp-3', curso_id: 'cur-cta-1', codigo: 'C3', descripcion: 'Indaga mediante métodos científicos', orden: 1 }] },
];

export const TEST_USERS: UserProfile[] = [
  { id: 'user-admin', email: 'admin@colegio.edu.pe', nombres: 'Administrador', apellidos: 'General', dni: '12345678', rol: 'admin', activo: true },
  { id: 'user-docente-1', email: 'carlos.mendoza@colegio.edu.pe', nombres: 'Carlos', apellidos: 'Mendoza', rol: 'docente', activo: true, dni: '45678901', telefono: '987654321', especialidad: 'Matemáticas' },
  { id: 'user-docente-2', email: 'patricia.garcia@colegio.edu.pe', nombres: 'Patricia', apellidos: 'García', rol: 'docente', activo: true, dni: '45678902', telefono: '987654322', especialidad: 'Comunicación' },
  { id: 'user-docente-3', email: 'jorge.ramirez@colegio.edu.pe', nombres: 'Jorge', apellidos: 'Ramírez', rol: 'docente', activo: true, dni: '45678903', telefono: '987654323', especialidad: 'Ciencias' },
  { id: 'user-docente-4', email: 'maria.flores@colegio.edu.pe', nombres: 'María', apellidos: 'Flores', rol: 'docente', activo: true, dni: '45678904', telefono: '987654324', especialidad: 'Historia' },
  { id: 'user-docente-5', email: 'rosa.quispe@colegio.edu.pe', nombres: 'Rosa', apellidos: 'Quispe', rol: 'docente', activo: true, dni: '45678905', telefono: '987654325', especialidad: 'Inglés' },
  { id: 'user-docente-6', email: 'luis.alva@colegio.edu.pe', nombres: 'Luis', apellidos: 'Alva', rol: 'docente', activo: true, dni: '45678906', telefono: '987654326', especialidad: 'Educación Física' },
  { id: 'user-docente-7', email: 'ana.torres@colegio.edu.pe', nombres: 'Ana', apellidos: 'Torres', rol: 'docente', activo: true, dni: '45678907', telefono: '987654327', especialidad: 'Arte y Cultura' },
  { id: 'user-docente-8', email: 'diego.sanchez@colegio.edu.pe', nombres: 'Diego', apellidos: 'Sánchez', rol: 'docente', activo: true, dni: '45678908', telefono: '987654328', especialidad: 'Computación' },
];

export const TEST_SECTION_COURSES: SectionCourseAssignment[] = [
  { id: 'sc-1', seccion_id: 'sec-g-pri-1-a', curso_id: 'cur-mat-1', docente_id: 'user-docente-1', horas_semanales: 5 },
  { id: 'sc-2', seccion_id: 'sec-g-pri-1-a', curso_id: 'cur-com-1', docente_id: 'user-docente-2', horas_semanales: 4 },
];

export const TEST_SCHEDULE_SLOTS: ScheduleSlot[] = [
  { id: 'slot-1', seccion_id: 'sec-g-pri-1-a', curso_id: 'cur-mat-1', docente_id: 'user-docente-1', dia: 'lunes', hora_inicio: '08:00', hora_fin: '09:30', aula: 'Aula 101' },
  { id: 'slot-2', seccion_id: 'sec-g-pri-1-a', curso_id: 'cur-com-1', docente_id: 'user-docente-2', dia: 'martes', hora_inicio: '08:00', hora_fin: '09:30', aula: 'Aula 101' },
];

export const TEST_STUDENTS: Student[] = [
  { id: 'est-1', profile_id: 'user-est-1', codigo_estudiante: 'EST2026001', nombres: 'Héctor Alessander', apellidos: 'Vargas Silva', dni: '74125896', fecha_nacimiento: '2010-05-15', genero: 'M', direccion: 'Av. Las Palmeras 123', nombre_apoderado: 'Héctor Vargas', telefono_apoderado: '987654321', email_apoderado: 'hector.apoderado@colegio.edu.pe', token_qr: 'QR-TEST-EST1' },
];

export const TEST_ENROLLMENTS: Enrollment[] = [
  { id: 'mat-1', estudiante_id: 'est-1', periodo_id: 'per-2026', seccion_id: 'sec-g-pri-1-a', estado: 'activo', fecha_matricula: '2026-02-01' },
];

export const TEST_PERIODS: EvaluationPeriod[] = [
  { id: 'per-b1', periodo_academico_id: 'per-2026', nombre: '1er Bimestre', numero_periodo: 1, fecha_inicio: '2026-03-01', fecha_fin: '2026-05-10', activo: true, cerrado: false },
  { id: 'per-b2', periodo_academico_id: 'per-2026', nombre: '2do Bimestre', numero_periodo: 2, fecha_inicio: '2026-05-15', fecha_fin: '2026-07-25', activo: false, cerrado: false },
  { id: 'per-b3', periodo_academico_id: 'per-2026', nombre: '3er Bimestre', numero_periodo: 3, fecha_inicio: '2026-08-10', fecha_fin: '2026-10-15', activo: false, cerrado: false },
  { id: 'per-b4', periodo_academico_id: 'per-2026', nombre: '4to Bimestre', numero_periodo: 4, fecha_inicio: '2026-10-20', fecha_fin: '2026-12-20', activo: false, cerrado: false },
];

export const TEST_GRADE_RECORDS: GradeRecord[] = [
  { id: 'gn-1', matricula_id: 'mat-1', competencia_id: 'comp-1', periodo_evaluacion_id: 'per-b1', nota_letra: 'AD', nota_numerica: 19 },
];
