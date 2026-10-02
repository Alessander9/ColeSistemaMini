# -*- coding: utf-8 -*-
"""
Script para generar mock-data.ts con datos completos y realistas
emulando un colegio peruano a mitad del año escolar 2026.
- Bimestres I y II cerrados con calificaciones completas.
- Bimestre III en curso con evaluaciones parciales, tareas y asistencias activas.
- Tesorería al día hasta Julio, Agosto/Septiembre en proceso de cobro.
- Bitácora de convivencia escolar, asistencias QR, horarios y alertas del sistema.
"""
import json
import os

output_file = r"c:\Users\Alessander\Desktop\TRABAJOS\ACTUALES\ColeSistemaMini\src\lib\mock-data.ts"

content = '''import { 
  UserProfile, 
  Student, 
  AcademicPeriod, 
  GradeLevel, 
  Section, 
  Course, 
  Competency, 
  EvaluationPeriod, 
  Enrollment, 
  AttendanceRecord, 
  GradeRecord,
  TaskAssignment,
  TaskSubmission,
  EvaluationExam,
  AppNotification,
  SectionCourseAssignment,
  ScheduleSlot,
  ClassSessionLog,
  ChildProfile,
  ParentProfile,
  LMSModule,
  SystemAlert,
  AuditLogEntry,
  PaymentRecord,
  BehaviorLogEntry,
  Announcement,
  SchoolCalendarEvent,
  SubsanacionRecord,
  JustificationRequest,
  StaffAttendanceRecord
} from '@/types';
import { getOfficialCnebCoursesAndCompetencies } from '@/lib/cneb/officialCurriculum';

// ─────────────────────────────────────────────────────────────────────────────
// 1. USUARIOS DEL SISTEMA
// ─────────────────────────────────────────────────────────────────────────────
export const INITIAL_ADMIN_USER: UserProfile = {
  id: 'user-admin-1',
  rol: 'admin',
  nombres: 'Administrador',
  apellidos: 'Institucional',
  dni: '44556677',
  email: 'admin@colegio.edu.pe',
  telefono: '987654321',
  avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  activo: true,
};

export const DEMO_TEACHER_USER: UserProfile = {
  id: 'teacher-1',
  rol: 'docente',
  nombres: 'Tomás',
  apellidos: 'Pérez Quispe',
  dni: '10203040',
  email: 'docente@colegio.edu.pe',
  telefono: '912345678',
  especialidad: 'Matemática',
  avatar_url: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&auto=format&fit=crop&q=80',
  activo: true,
};

export const TEACHER_2: UserProfile = {
  id: 'teacher-2',
  rol: 'docente',
  nombres: 'Carmen Rosa',
  apellidos: 'Mendoza Ramos',
  dni: '25487910',
  email: 'carmen.mendoza@colegio.edu.pe',
  telefono: '984512367',
  especialidad: 'Comunicación',
  avatar_url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80',
  activo: true,
};

export const TEACHER_3: UserProfile = {
  id: 'teacher-3',
  rol: 'docente',
  nombres: 'Carlos Eduardo',
  apellidos: 'Benites Castro',
  dni: '19874563',
  email: 'carlos.benites@colegio.edu.pe',
  telefono: '978541236',
  especialidad: 'Ciencia y Tecnología',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  activo: true,
};

export const TEACHER_4: UserProfile = {
  id: 'teacher-4',
  rol: 'docente',
  nombres: 'Maritza Elena',
  apellidos: 'Salazar Ortiz',
  dni: '08745129',
  email: 'maritza.salazar@colegio.edu.pe',
  telefono: '965874123',
  especialidad: 'Personal Social',
  avatar_url: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=150&auto=format&fit=crop&q=80',
  activo: true,
};

export const TEACHER_5: UserProfile = {
  id: 'teacher-5',
  rol: 'docente',
  nombres: 'David John',
  apellidos: 'Smith Gómez',
  dni: '41258963',
  email: 'david.smith@colegio.edu.pe',
  telefono: '945632178',
  especialidad: 'Inglés',
  avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  activo: true,
};

export const DEMO_STUDENT_USER: UserProfile = {
  id: 'user-student-1',
  rol: 'estudiante',
  nombres: 'Lucas',
  apellidos: 'Morales Vega',
  dni: '70809010',
  email: 'estudiante@colegio.edu.pe',
  telefono: '998877665',
  avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  activo: true,
};

export const DEMO_PARENT_USER: UserProfile = {
  id: 'parent-1',
  rol: 'apoderado',
  nombres: 'Perico',
  apellidos: 'Morales Silva',
  dni: '09876543',
  email: 'apoderado@colegio.edu.pe',
  telefono: '987654321',
  avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  activo: true,
};

export const DEMO_ASISTENCIA_USER: UserProfile = {
  id: 'user-asistencia-1',
  rol: 'asistencia',
  nombres: 'Portería',
  apellidos: 'Principal',
  dni: '99887766',
  email: 'asistencia@colegio.edu.pe',
  telefono: '999888777',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  activo: true,
};

export const MOCK_USERS: UserProfile[] = [
  INITIAL_ADMIN_USER,
  DEMO_TEACHER_USER,
  TEACHER_2,
  TEACHER_3,
  TEACHER_4,
  TEACHER_5,
  DEMO_STUDENT_USER,
  DEMO_PARENT_USER,
  DEMO_ASISTENCIA_USER,
];

export const MOCK_TEACHERS: UserProfile[] = [
  DEMO_TEACHER_USER,
  TEACHER_2,
  TEACHER_3,
  TEACHER_4,
  TEACHER_5,
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. ESTRUCTURA ACADÉMICA OFICIAL CNEB (MINISTERIO DE EDUCACIÓN)
// ─────────────────────────────────────────────────────────────────────────────
export const MOCK_PERIOD: AcademicPeriod = {
  id: 'period-2026',
  nombre: 'Año Escolar 2026',
  anio: 2026,
  fecha_inicio: '2026-03-01',
  fecha_fin: '2026-12-20',
  activo: true,
};

// A mitad de año escolar: I y II Bimestres cerrados, III Bimestre en curso activo
export const MOCK_EVALUATION_PERIODS: EvaluationPeriod[] = [
  {
    id: 'eval-b1',
    periodo_academico_id: 'period-2026',
    nombre: 'I Bimestre',
    numero_periodo: 1,
    fecha_inicio: '2026-03-01',
    fecha_fin: '2026-05-15',
    activo: false,
    cerrado: true,
  },
  {
    id: 'eval-b2',
    periodo_academico_id: 'period-2026',
    nombre: 'II Bimestre',
    numero_periodo: 2,
    fecha_inicio: '2026-05-18',
    fecha_fin: '2026-07-24',
    activo: false,
    cerrado: true,
  },
  {
    id: 'eval-b3',
    periodo_academico_id: 'period-2026',
    nombre: 'III Bimestre',
    numero_periodo: 3,
    fecha_inicio: '2026-08-10',
    fecha_fin: '2026-10-16',
    activo: true,
    cerrado: false,
  },
  {
    id: 'eval-b4',
    periodo_academico_id: 'period-2026',
    nombre: 'IV Bimestre',
    numero_periodo: 4,
    fecha_inicio: '2026-10-19',
    fecha_fin: '2026-12-20',
    activo: false,
    cerrado: false,
  },
];

export const MOCK_PERIODS: EvaluationPeriod[] = MOCK_EVALUATION_PERIODS;

// Grados oficiales
export const MOCK_GRADE_LEVELS: GradeLevel[] = [
  { id: 'grd-ini-3', nivel: 'inicial', nombre: '3 Años', numero_grado: 1 },
  { id: 'grd-ini-4', nivel: 'inicial', nombre: '4 Años', numero_grado: 2 },
  { id: 'grd-ini-5', nivel: 'inicial', nombre: '5 Años', numero_grado: 3 },
  { id: 'grd-pri-1', nivel: 'primaria', nombre: '1° de Primaria', numero_grado: 1 },
  { id: 'grd-pri-2', nivel: 'primaria', nombre: '2° de Primaria', numero_grado: 2 },
  { id: 'grd-pri-3', nivel: 'primaria', nombre: '3° de Primaria', numero_grado: 3 },
  { id: 'grd-pri-4', nivel: 'primaria', nombre: '4° de Primaria', numero_grado: 4 },
  { id: 'grd-pri-5', nivel: 'primaria', nombre: '5° de Primaria', numero_grado: 5 },
  { id: 'grd-pri-6', nivel: 'primaria', nombre: '6° de Primaria', numero_grado: 6 },
  { id: 'grd-sec-1', nivel: 'secundaria', nombre: '1° de Secundaria', numero_grado: 1 },
  { id: 'grd-sec-2', nivel: 'secundaria', nombre: '2° de Secundaria', numero_grado: 2 },
  { id: 'grd-sec-3', nivel: 'secundaria', nombre: '3° de Secundaria', numero_grado: 3 },
  { id: 'grd-sec-4', nivel: 'secundaria', nombre: '4° de Secundaria', numero_grado: 4 },
  { id: 'grd-sec-5', nivel: 'secundaria', nombre: '5° de Secundaria', numero_grado: 5 },
];

export const MOCK_GRADES: GradeLevel[] = MOCK_GRADE_LEVELS;

export const MOCK_SECTIONS: Section[] = [
  // Inicial
  { id: 'sec-ini-3a', grado_id: 'grd-ini-3', letra: 'A', capacidad_maxima: 20, aula: 'Pabellón Inicial - Aula 01', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-ini-3') },
  { id: 'sec-ini-4a', grado_id: 'grd-ini-4', letra: 'A', capacidad_maxima: 22, aula: 'Pabellón Inicial - Aula 03', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-ini-4') },
  { id: 'sec-ini-5a', grado_id: 'grd-ini-5', letra: 'A', capacidad_maxima: 25, aula: 'Pabellón Inicial - Aula 05', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-ini-5') },
  // Primaria
  { id: 'sec-1pri-a', grado_id: 'grd-pri-1', letra: 'A', capacidad_maxima: 30, aula: 'Pabellón A - Aula 101', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-pri-1') },
  { id: 'sec-2pri-a', grado_id: 'grd-pri-2', letra: 'A', capacidad_maxima: 30, aula: 'Pabellón A - Aula 103', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-pri-2') },
  { id: 'sec-3pri-a', grado_id: 'grd-pri-3', letra: 'A', capacidad_maxima: 30, aula: 'Pabellón A - Aula 201', tutor_id: 'teacher-1', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-pri-3') },
  { id: 'sec-3pri-b', grado_id: 'grd-pri-3', letra: 'B', capacidad_maxima: 30, aula: 'Pabellón A - Aula 202', tutor_id: 'teacher-2', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-pri-3') },
  { id: 'sec-4pri-a', grado_id: 'grd-pri-4', letra: 'A', capacidad_maxima: 30, aula: 'Pabellón A - Aula 203', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-pri-4') },
  { id: 'sec-5pri-a', grado_id: 'grd-pri-5', letra: 'A', capacidad_maxima: 30, aula: 'Pabellón B - Aula 101', tutor_id: 'teacher-3', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-pri-5') },
  { id: 'sec-6pri-a', grado_id: 'grd-pri-6', letra: 'A', capacidad_maxima: 30, aula: 'Pabellón B - Aula 103', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-pri-6') },
  // Secundaria
  { id: 'sec-1sec-a', grado_id: 'grd-sec-1', letra: 'A', capacidad_maxima: 32, aula: 'Pabellón C - Aula 201', tutor_id: 'teacher-4', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-sec-1') },
  { id: 'sec-2sec-a', grado_id: 'grd-sec-2', letra: 'A', capacidad_maxima: 32, aula: 'Pabellón C - Aula 203', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-sec-2') },
  { id: 'sec-3sec-a', grado_id: 'grd-sec-3', letra: 'A', capacidad_maxima: 32, aula: 'Pabellón C - Aula 301', tutor_id: 'teacher-5', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-sec-3') },
  { id: 'sec-4sec-a', grado_id: 'grd-sec-4', letra: 'A', capacidad_maxima: 32, aula: 'Pabellón C - Aula 303', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-sec-4') },
  { id: 'sec-5sec-a', grado_id: 'grd-sec-5', letra: 'A', capacidad_maxima: 32, aula: 'Pabellón C - Aula 305', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-sec-5') },
];

const cnebData = getOfficialCnebCoursesAndCompetencies();
export const MOCK_COMPETENCIES: Competency[] = cnebData.competencies;
export const MINEDU_COMPETENCIES: Competency[] = MOCK_COMPETENCIES;
export const MOCK_COURSES: Course[] = cnebData.courses;

// ─────────────────────────────────────────────────────────────────────────────
// 3. ESTUDIANTES Y MATRÍCULAS (COHORTE COMPLETA PARA SIMULACIÓN ACTIVA)
// ─────────────────────────────────────────────────────────────────────────────
export const DEMO_STUDENT: Student = {
  id: 'student-1',
  profile_id: 'user-student-1',
  codigo_estudiante: 'EST-2026-001',
  nombres: 'Lucas',
  apellidos: 'Morales Vega',
  dni: '70809010',
  fecha_nacimiento: '2015-05-14',
  genero: 'M',
  direccion: 'Av. Los Álamos 456, Lima',
  nombre_apoderado: 'Perico Morales Silva',
  telefono_apoderado: '987654321',
  email_apoderado: 'apoderado@colegio.edu.pe',
  token_qr: 'QR-EST-2026-001-Lucas_Morales',
  profile: DEMO_STUDENT_USER,
};

export const MOCK_STUDENTS: Student[] = [
  DEMO_STUDENT,
  {
    id: 'student-2',
    profile_id: 'user-student-2',
    codigo_estudiante: 'EST-2026-002',
    nombres: 'Sofía Valentina',
    apellidos: 'Castro Rivas',
    dni: '71203040',
    fecha_nacimiento: '2015-08-22',
    genero: 'F',
    direccion: 'Jr. Huancavelica 782, Lima',
    nombre_apoderado: 'Carmen Rivas de Castro',
    telefono_apoderado: '984512399',
    email_apoderado: 'carmen.rivas@gmail.com',
    token_qr: 'QR-EST-2026-002-SOFIA-CASTRO',
  },
  {
    id: 'student-3',
    profile_id: 'user-student-3',
    codigo_estudiante: 'EST-2026-003',
    nombres: 'Mateo Alejandro',
    apellidos: 'Flores Díaz',
    dni: '72304050',
    fecha_nacimiento: '2015-03-10',
    genero: 'M',
    direccion: 'Calle Las Begonias 310, San Isidro',
    nombre_apoderado: 'Jorge Flores Meza',
    telefono_apoderado: '974125863',
    email_apoderado: 'jorge.flores@empresa.com',
    token_qr: 'QR-EST-2026-003-MATEO-FLORES',
  },
  {
    id: 'student-4',
    profile_id: 'user-student-4',
    codigo_estudiante: 'EST-2026-004',
    nombres: 'Camila Belén',
    apellidos: 'Quispe Huamán',
    dni: '73405060',
    fecha_nacimiento: '2015-11-05',
    genero: 'F',
    direccion: 'Av. Arequipa 1420, Lince',
    nombre_apoderado: 'Elena Huamán de Quispe',
    telefono_apoderado: '965823147',
    email_apoderado: 'elena.huaman@outlook.com',
    token_qr: 'QR-EST-2026-004-CAMILA-QUISPE',
  },
  {
    id: 'student-5',
    profile_id: 'user-student-5',
    codigo_estudiante: 'EST-2026-005',
    nombres: 'Joaquín Alonso',
    apellidos: 'Herrera Romero',
    dni: '74506070',
    fecha_nacimiento: '2015-07-19',
    genero: 'M',
    direccion: 'Av. Brasil 2341, Jesús María',
    nombre_apoderado: 'Alonso Herrera Benítez',
    telefono_apoderado: '958741236',
    email_apoderado: 'alonso.herrera@gmail.com',
    token_qr: 'QR-EST-2026-005-JOAQUIN-HERRERA',
  },
  {
    id: 'student-6',
    profile_id: 'user-student-6',
    codigo_estudiante: 'EST-2026-006',
    nombres: 'Valeria Lucía',
    apellidos: 'Benavides Prado',
    dni: '75607080',
    fecha_nacimiento: '2015-09-30',
    genero: 'F',
    direccion: 'Calle Los Pinos 180, Miraflores',
    nombre_apoderado: 'Patricia Prado de Benavides',
    telefono_apoderado: '945612378',
    email_apoderado: 'patricia.prado@yahoo.com',
    token_qr: 'QR-EST-2026-006-VALERIA-BENAVIDES',
  },
  {
    id: 'student-7',
    profile_id: 'user-student-7',
    codigo_estudiante: 'EST-2026-007',
    nombres: 'Thiago Gael',
    apellidos: 'Mendoza Navarro',
    dni: '76708090',
    fecha_nacimiento: '2015-02-14',
    genero: 'M',
    direccion: 'Jr. Junín 540, Magdalena',
    nombre_apoderado: 'Gael Mendoza Ríos',
    telefono_apoderado: '932145687',
    email_apoderado: 'gael.mendoza@gmail.com',
    token_qr: 'QR-EST-2026-007-THIAGO-MENDOZA',
  },
  {
    id: 'student-8',
    profile_id: 'user-student-8',
    codigo_estudiante: 'EST-2026-008',
    nombres: 'Emma Celeste',
    apellidos: 'Ramos Villanueva',
    dni: '77809001',
    fecha_nacimiento: '2015-12-03',
    genero: 'F',
    direccion: 'Av. Salaverry 1850, Jesús María',
    nombre_apoderado: 'Raúl Ramos Cárdenas',
    telefono_apoderado: '921456987',
    email_apoderado: 'raul.ramos@gmail.com',
    token_qr: 'QR-EST-2026-008-EMMA-RAMOS',
  },
  {
    id: 'student-9',
    profile_id: 'user-student-9',
    codigo_estudiante: 'EST-2026-009',
    nombres: 'Nicolás Adrián',
    apellidos: 'Salazar Ortiz',
    dni: '78910112',
    fecha_nacimiento: '2015-06-18',
    genero: 'M',
    direccion: 'Av. Sucre 420, Pueblo Libre',
    nombre_apoderado: 'Adrián Salazar Silva',
    telefono_apoderado: '915847263',
    email_apoderado: 'adrian.salazar@gmail.com',
    token_qr: 'QR-EST-2026-009-NICOLAS-SALAZAR',
  },
  {
    id: 'student-10',
    profile_id: 'user-student-10',
    codigo_estudiante: 'EST-2026-010',
    nombres: 'Luciana Mía',
    apellidos: 'Palacios Vega',
    dni: '79021223',
    fecha_nacimiento: '2015-04-25',
    genero: 'F',
    direccion: 'Calle Los Cedros 240, San Borja',
    nombre_apoderado: 'Mónica Vega de Palacios',
    telefono_apoderado: '987412563',
    email_apoderado: 'monica.vega@gmail.com',
    token_qr: 'QR-EST-2026-010-LUCIANA-PALACIOS',
  },
  {
    id: 'student-11',
    profile_id: 'user-student-11',
    codigo_estudiante: 'EST-2026-011',
    nombres: 'Rodrigo Gabriel',
    apellidos: 'Paucar Reyes',
    dni: '68243445',
    fecha_nacimiento: '2013-09-12',
    genero: 'M',
    direccion: 'Av. Javier Prado Este 3200, San Borja',
    nombre_apoderado: 'Gabriel Paucar Tello',
    telefono_apoderado: '978521463',
    email_apoderado: 'gabriel.paucar@gmail.com',
    token_qr: 'QR-EST-2026-011-RODRIGO-PAUCAR',
  },
  {
    id: 'student-12',
    profile_id: 'user-student-12',
    codigo_estudiante: 'EST-2026-012',
    nombres: 'Antonella Nicole',
    apellidos: 'Chávez Solano',
    dni: '69354556',
    fecha_nacimiento: '2013-01-20',
    genero: 'F',
    direccion: 'Calle Independencia 610, Miraflores',
    nombre_apoderado: 'Nicole Solano de Chávez',
    telefono_apoderado: '965412873',
    email_apoderado: 'nicole.solano@hotmail.com',
    token_qr: 'QR-EST-2026-012-ANTONELLA-CHAVEZ',
  },
  {
    id: 'student-13',
    profile_id: 'user-student-13',
    codigo_estudiante: 'EST-2026-013',
    nombres: 'Sebastián André',
    apellidos: 'Romero Vega',
    dni: '60576778',
    fecha_nacimiento: '2012-04-14',
    genero: 'M',
    direccion: 'Av. La Marina 2890, San Miguel',
    nombre_apoderado: 'Roberto Romero Vega',
    telefono_apoderado: '954781236',
    email_apoderado: 'roberto.romero@gmail.com',
    token_qr: 'QR-EST-2026-013-SEBASTIAN-ROMERO',
  },
  {
    id: 'student-14',
    profile_id: 'user-student-14',
    codigo_estudiante: 'EST-2026-014',
    nombres: 'Ariana Paz',
    apellidos: 'Salazar Cruz',
    dni: '61687889',
    fecha_nacimiento: '2012-10-08',
    genero: 'F',
    direccion: 'Av. Universitaria 1500, Pueblo Libre',
    nombre_apoderado: 'Fernando Salazar Peña',
    telefono_apoderado: '941258763',
    email_apoderado: 'fernando.salazar@gmail.com',
    token_qr: 'QR-EST-2026-014-ARIANA-SALAZAR',
  },
  {
    id: 'student-15',
    profile_id: 'user-student-15',
    codigo_estudiante: 'EST-2026-015',
    nombres: 'Leonardo Fabián',
    apellidos: 'Cruzado Morales',
    dni: '58809001',
    fecha_nacimiento: '2010-06-25',
    genero: 'M',
    direccion: 'Av. Bolívar 890, Pueblo Libre',
    nombre_apoderado: 'Fabián Cruzado Torres',
    telefono_apoderado: '932587412',
    email_apoderado: 'fabian.cruzado@gmail.com',
    token_qr: 'QR-EST-2026-015-LEONARDO-CRUZADO',
  },
  {
    id: 'student-16',
    profile_id: 'user-student-16',
    codigo_estudiante: 'EST-2026-016',
    nombres: 'Santiago Nicolás',
    apellidos: 'Paredes Soto',
    dni: '82021223',
    fecha_nacimiento: '2021-02-10',
    genero: 'M',
    direccion: 'Calle El Parque 115, Surco',
    nombre_apoderado: 'Nicolás Paredes Lara',
    telefono_apoderado: '921478523',
    email_apoderado: 'nicolas.paredes@gmail.com',
    token_qr: 'QR-EST-2026-016-SANTIAGO-PAREDES',
  }
];

export const MOCK_ENROLLMENTS: Enrollment[] = [
  // 3° Primaria A
  { id: 'enr-1', estudiante_id: 'student-1', periodo_id: 'period-2026', seccion_id: 'sec-3pri-a', fecha_matricula: '2026-03-01', estado: 'activo', estudiante: MOCK_STUDENTS[0], seccion: MOCK_SECTIONS.find(s => s.id === 'sec-3pri-a') },
  { id: 'enr-2', estudiante_id: 'student-2', periodo_id: 'period-2026', seccion_id: 'sec-3pri-a', fecha_matricula: '2026-03-01', estado: 'activo', estudiante: MOCK_STUDENTS[1], seccion: MOCK_SECTIONS.find(s => s.id === 'sec-3pri-a') },
  { id: 'enr-3', estudiante_id: 'student-3', periodo_id: 'period-2026', seccion_id: 'sec-3pri-a', fecha_matricula: '2026-03-01', estado: 'activo', estudiante: MOCK_STUDENTS[2], seccion: MOCK_SECTIONS.find(s => s.id === 'sec-3pri-a') },
  { id: 'enr-4', estudiante_id: 'student-4', periodo_id: 'period-2026', seccion_id: 'sec-3pri-a', fecha_matricula: '2026-03-01', estado: 'activo', estudiante: MOCK_STUDENTS[3], seccion: MOCK_SECTIONS.find(s => s.id === 'sec-3pri-a') },
  { id: 'enr-5', estudiante_id: 'student-5', periodo_id: 'period-2026', seccion_id: 'sec-3pri-a', fecha_matricula: '2026-03-01', estado: 'activo', estudiante: MOCK_STUDENTS[4], seccion: MOCK_SECTIONS.find(s => s.id === 'sec-3pri-a') },
  { id: 'enr-6', estudiante_id: 'student-6', periodo_id: 'period-2026', seccion_id: 'sec-3pri-a', fecha_matricula: '2026-03-01', estado: 'activo', estudiante: MOCK_STUDENTS[5], seccion: MOCK_SECTIONS.find(s => s.id === 'sec-3pri-a') },
  { id: 'enr-7', estudiante_id: 'student-7', periodo_id: 'period-2026', seccion_id: 'sec-3pri-a', fecha_matricula: '2026-03-01', estado: 'activo', estudiante: MOCK_STUDENTS[6], seccion: MOCK_SECTIONS.find(s => s.id === 'sec-3pri-a') },
  { id: 'enr-8', estudiante_id: 'student-8', periodo_id: 'period-2026', seccion_id: 'sec-3pri-a', fecha_matricula: '2026-03-01', estado: 'activo', estudiante: MOCK_STUDENTS[7], seccion: MOCK_SECTIONS.find(s => s.id === 'sec-3pri-a') },
  // 3° Primaria B
  { id: 'enr-9', estudiante_id: 'student-9', periodo_id: 'period-2026', seccion_id: 'sec-3pri-b', fecha_matricula: '2026-03-02', estado: 'activo', estudiante: MOCK_STUDENTS[8], seccion: MOCK_SECTIONS.find(s => s.id === 'sec-3pri-b') },
  { id: 'enr-10', estudiante_id: 'student-10', periodo_id: 'period-2026', seccion_id: 'sec-3pri-b', fecha_matricula: '2026-03-02', estado: 'activo', estudiante: MOCK_STUDENTS[9], seccion: MOCK_SECTIONS.find(s => s.id === 'sec-3pri-b') },
  // 5° Primaria A
  { id: 'enr-11', estudiante_id: 'student-11', periodo_id: 'period-2026', seccion_id: 'sec-5pri-a', fecha_matricula: '2026-03-01', estado: 'activo', estudiante: MOCK_STUDENTS[10], seccion: MOCK_SECTIONS.find(s => s.id === 'sec-5pri-a') },
  { id: 'enr-12', estudiante_id: 'student-12', periodo_id: 'period-2026', seccion_id: 'sec-5pri-a', fecha_matricula: '2026-03-01', estado: 'activo', estudiante: MOCK_STUDENTS[11], seccion: MOCK_SECTIONS.find(s => s.id === 'sec-5pri-a') },
  // 1° Secundaria A
  { id: 'enr-13', estudiante_id: 'student-13', periodo_id: 'period-2026', seccion_id: 'sec-1sec-a', fecha_matricula: '2026-03-01', estado: 'activo', estudiante: MOCK_STUDENTS[12], seccion: MOCK_SECTIONS.find(s => s.id === 'sec-1sec-a') },
  { id: 'enr-14', estudiante_id: 'student-14', periodo_id: 'period-2026', seccion_id: 'sec-1sec-a', fecha_matricula: '2026-03-01', estado: 'activo', estudiante: MOCK_STUDENTS[13], seccion: MOCK_SECTIONS.find(s => s.id === 'sec-1sec-a') },
  // 3° Secundaria A
  { id: 'enr-15', estudiante_id: 'student-15', periodo_id: 'period-2026', seccion_id: 'sec-3sec-a', fecha_matricula: '2026-03-01', estado: 'activo', estudiante: MOCK_STUDENTS[14], seccion: MOCK_SECTIONS.find(s => s.id === 'sec-3sec-a') },
  // Inicial 5 Años A
  { id: 'enr-16', estudiante_id: 'student-16', periodo_id: 'period-2026', seccion_id: 'sec-ini-5a', fecha_matricula: '2026-03-01', estado: 'activo', estudiante: MOCK_STUDENTS[15], seccion: MOCK_SECTIONS.find(s => s.id === 'sec-ini-5a') },
];

export const MOCK_SECTION_COURSES: SectionCourseAssignment[] = [
  // 3° Primaria A
  { id: 'sc-1', seccion_id: 'sec-3pri-a', curso_id: 'cneb-pri-mat', docente_id: 'teacher-1', horas_semanales: 6, aula_defecto: 'Aula 201', docente: DEMO_TEACHER_USER, curso: MOCK_COURSES.find(c => c.id === 'cneb-pri-mat'), seccion: MOCK_SECTIONS.find(s => s.id === 'sec-3pri-a') },
  { id: 'sc-2', seccion_id: 'sec-3pri-a', curso_id: 'cneb-pri-com', docente_id: 'teacher-2', horas_semanales: 6, aula_defecto: 'Aula 201', docente: TEACHER_2, curso: MOCK_COURSES.find(c => c.id === 'cneb-pri-com'), seccion: MOCK_SECTIONS.find(s => s.id === 'sec-3pri-a') },
  { id: 'sc-3', seccion_id: 'sec-3pri-a', curso_id: 'cneb-pri-cyt', docente_id: 'teacher-3', horas_semanales: 4, aula_defecto: 'Lab. Primaria', docente: TEACHER_3, curso: MOCK_COURSES.find(c => c.id === 'cneb-pri-cyt'), seccion: MOCK_SECTIONS.find(s => s.id === 'sec-3pri-a') },
  { id: 'sc-4', seccion_id: 'sec-3pri-a', curso_id: 'cneb-pri-ps', docente_id: 'teacher-4', horas_semanales: 4, aula_defecto: 'Aula 201', docente: TEACHER_4, curso: MOCK_COURSES.find(c => c.id === 'cneb-pri-ps'), seccion: MOCK_SECTIONS.find(s => s.id === 'sec-3pri-a') },
  { id: 'sc-5', seccion_id: 'sec-3pri-a', curso_id: 'cneb-pri-ing', docente_id: 'teacher-5', horas_semanales: 3, aula_defecto: 'Aula 201', docente: TEACHER_5, curso: MOCK_COURSES.find(c => c.id === 'cneb-pri-ing'), seccion: MOCK_SECTIONS.find(s => s.id === 'sec-3pri-a') },
  // 5° Primaria A
  { id: 'sc-6', seccion_id: 'sec-5pri-a', curso_id: 'cneb-pri-mat', docente_id: 'teacher-1', horas_semanales: 6, aula_defecto: 'Aula 101', docente: DEMO_TEACHER_USER, curso: MOCK_COURSES.find(c => c.id === 'cneb-pri-mat'), seccion: MOCK_SECTIONS.find(s => s.id === 'sec-5pri-a') },
  { id: 'sc-7', seccion_id: 'sec-5pri-a', curso_id: 'cneb-pri-cyt', docente_id: 'teacher-3', horas_semanales: 4, aula_defecto: 'Lab. Ciencias', docente: TEACHER_3, curso: MOCK_COURSES.find(c => c.id === 'cneb-pri-cyt'), seccion: MOCK_SECTIONS.find(s => s.id === 'sec-5pri-a') },
  // 1° Secundaria A
  { id: 'sc-8', seccion_id: 'sec-1sec-a', curso_id: 'cneb-sec-mat', docente_id: 'teacher-1', horas_semanales: 6, aula_defecto: 'Aula 201', docente: DEMO_TEACHER_USER, curso: MOCK_COURSES.find(c => c.id === 'cneb-sec-mat'), seccion: MOCK_SECTIONS.find(s => s.id === 'sec-1sec-a') },
  { id: 'sc-9', seccion_id: 'sec-1sec-a', curso_id: 'cneb-sec-com', docente_id: 'teacher-2', horas_semanales: 5, aula_defecto: 'Aula 201', docente: TEACHER_2, curso: MOCK_COURSES.find(c => c.id === 'cneb-sec-com'), seccion: MOCK_SECTIONS.find(s => s.id === 'sec-1sec-a') },
];

export const MOCK_CHILDREN: ChildProfile[] = [
  {
    id: 'child-1',
    estudiante_id: 'student-1',
    nombre: 'Lucas',
    apellidos: 'Morales Vega',
    nivel: 'primaria',
    grado_nombre: '3° de Primaria',
    seccion_letra: 'A',
    asistencia_porcentaje: 97,
    promedio_letra: 'AD',
    promedio_score: 3.7,
    tareas_pendientes: 1,
    proximas_evaluaciones: 2,
    tutor_nombre: 'Prof. Tomás Pérez',
    tutor_email: 'docente@colegio.edu.pe',
  }
];

export const MOCK_PARENTS: ParentProfile[] = [
  {
    id: 'parent-1',
    user_id: 'parent-1',
    nombres: 'Perico',
    apellidos: 'Morales Silva',
    dni: '09876543',
    telefono: '987654321',
    email: 'apoderado@colegio.edu.pe',
    hijos_ids: ['student-1'],
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// 4. CALIFICACIONES CNEB (I Y II BIMESTRE COMPLETOS, III BIMESTRE EN CURSO)
// Escala CNEB oficial en nota_numerica (1 a 4): AD=4, A=3, B=2, C=1
// ─────────────────────────────────────────────────────────────────────────────
export const MOCK_GRADE_RECORDS: GradeRecord[] = [
  // ── Lucas Morales Vega (enr-1) - I Bimestre (eval-b1) ──
  { id: 'grd-b1-1-1', matricula_id: 'enr-1', periodo_evaluacion_id: 'eval-b1', competencia_id: 'comp-mat-pri-c1', nota_letra: 'AD', nota_numerica: 4, conclusion_descriptiva: 'Resuelve problemas de cantidad con cálculo mental fluido y fundamenta sus estrategias.' },
  { id: 'grd-b1-1-2', matricula_id: 'enr-1', periodo_evaluacion_id: 'eval-b1', competencia_id: 'comp-mat-pri-c2', nota_letra: 'A', nota_numerica: 3, conclusion_descriptiva: 'Identifica regularidades y expresa relaciones de equivalencia con material concreto.' },
  { id: 'grd-b1-1-3', matricula_id: 'enr-1', periodo_evaluacion_id: 'eval-b1', competencia_id: 'comp-mat-pri-c3', nota_letra: 'A', nota_numerica: 3, conclusion_descriptiva: 'Ubica objetos en cuadrículas y describe trayectorias con vocabulario geométrico adecuado.' },
  { id: 'grd-b1-1-4', matricula_id: 'enr-1', periodo_evaluacion_id: 'eval-b1', competencia_id: 'comp-mat-pri-c4', nota_letra: 'AD', nota_numerica: 4, conclusion_descriptiva: 'Organiza datos en tablas de frecuencia y gráficos de barras interpretando conclusiones.' },
  { id: 'grd-b1-1-5', matricula_id: 'enr-1', periodo_evaluacion_id: 'eval-b1', competencia_id: 'comp-com-pri-c1', nota_letra: 'A', nota_numerica: 3, conclusion_descriptiva: 'Se expresa oralmente con claridad respetando los turnos de diálogo en el aula.' },
  { id: 'grd-b1-1-6', matricula_id: 'enr-1', periodo_evaluacion_id: 'eval-b1', competencia_id: 'comp-com-pri-c2', nota_letra: 'AD', nota_numerica: 4, conclusion_descriptiva: 'Comprende textos narrativos y argumentativos extrayendo ideas implícitas y explícitas.' },
  { id: 'grd-b1-1-7', matricula_id: 'enr-1', periodo_evaluacion_id: 'eval-b1', competencia_id: 'comp-com-pri-c3', nota_letra: 'A', nota_numerica: 3, conclusion_descriptiva: 'Escribe textos empleando conectores lógicos y adecuada puntuación.' },
  { id: 'grd-b1-1-8', matricula_id: 'enr-1', periodo_evaluacion_id: 'eval-b1', competencia_id: 'comp-cyt-pri-c1', nota_letra: 'A', nota_numerica: 3, conclusion_descriptiva: 'Formula preguntas de indagación y registra observaciones en su cuaderno de campo.' },
  { id: 'grd-b1-1-9', matricula_id: 'enr-1', periodo_evaluacion_id: 'eval-b1', competencia_id: 'comp-cyt-pri-c2', nota_letra: 'A', nota_numerica: 3, conclusion_descriptiva: 'Explica las relaciones ecológicas en los ecosistemas locales.' },
  { id: 'grd-b1-1-10', matricula_id: 'enr-1', periodo_evaluacion_id: 'eval-b1', competencia_id: 'comp-ps-pri-c1', nota_letra: 'AD', nota_numerica: 4, conclusion_descriptiva: 'Manifiesta respeto por sus compañeros y valora la identidad pluricultural.' },

  // ── Lucas Morales Vega (enr-1) - II Bimestre (eval-b2) ──
  { id: 'grd-b2-1-1', matricula_id: 'enr-1', periodo_evaluacion_id: 'eval-b2', competencia_id: 'comp-mat-pri-c1', nota_letra: 'AD', nota_numerica: 4, conclusion_descriptiva: 'Domina operaciones con fracciones y números decimales en situaciones cotidianas.' },
  { id: 'grd-b2-1-2', matricula_id: 'enr-1', periodo_evaluacion_id: 'eval-b2', competencia_id: 'comp-mat-pri-c2', nota_letra: 'AD', nota_numerica: 4, conclusion_descriptiva: 'Modela patrones numéricos y resuelve ecuaciones lineales de primer grado.' },
  { id: 'grd-b2-1-3', matricula_id: 'enr-1', periodo_evaluacion_id: 'eval-b2', competencia_id: 'comp-mat-pri-c3', nota_letra: 'A', nota_numerica: 3, conclusion_descriptiva: 'Calcula perímetros y áreas de figuras poligonales con exactitud.' },
  { id: 'grd-b2-1-4', matricula_id: 'enr-1', periodo_evaluacion_id: 'eval-b2', competencia_id: 'comp-mat-pri-c4', nota_letra: 'A', nota_numerica: 3, conclusion_descriptiva: 'Determina la probabilidad de sucesos simples mediante juegos vivenciales.' },
  { id: 'grd-b2-1-5', matricula_id: 'enr-1', periodo_evaluacion_id: 'eval-b2', competencia_id: 'comp-com-pri-c1', nota_letra: 'AD', nota_numerica: 4, conclusion_descriptiva: 'Destaca en la exposición de debates y declamación poética por Fiestas Patrias.' },
  { id: 'grd-b2-1-6', matricula_id: 'enr-1', periodo_evaluacion_id: 'eval-b2', competencia_id: 'comp-com-pri-c2', nota_letra: 'AD', nota_numerica: 4, conclusion_descriptiva: 'Analiza críticamente lecturas complejas identificando la intención del autor.' },
  { id: 'grd-b2-1-7', matricula_id: 'enr-1', periodo_evaluacion_id: 'eval-b2', competencia_id: 'comp-com-pri-c3', nota_letra: 'A', nota_numerica: 3, conclusion_descriptiva: 'Produce ensayos escolares bien estructurados con introducción, nudo y desenlace.' },
  { id: 'grd-b2-1-8', matricula_id: 'enr-1', periodo_evaluacion_id: 'eval-b2', competencia_id: 'comp-cyt-pri-c1', nota_letra: 'A', nota_numerica: 3, conclusion_descriptiva: 'Diseña prototipos de soluciones tecnológicas sustentables.' },
  { id: 'grd-b2-1-9', matricula_id: 'enr-1', periodo_evaluacion_id: 'eval-b2', competencia_id: 'comp-cyt-pri-c2', nota_letra: 'AD', nota_numerica: 4, conclusion_descriptiva: 'Argumenta el impacto de la energía renovable en la preservación del planeta.' },

  // ── Lucas Morales Vega (enr-1) - III Bimestre (eval-b3) [En curso] ──
  { id: 'grd-b3-1-1', matricula_id: 'enr-1', periodo_evaluacion_id: 'eval-b3', competencia_id: 'comp-mat-pri-c1', nota_letra: 'AD', nota_numerica: 4, conclusion_descriptiva: 'Avance notable en fracciones heterogéneas y mínimo común múltiplo.' },
  { id: 'grd-b3-1-2', matricula_id: 'enr-1', periodo_evaluacion_id: 'eval-b3', competencia_id: 'comp-com-pri-c2', nota_letra: 'A', nota_numerica: 3, conclusion_descriptiva: 'Comprensión lectora de textos expositivos en progreso satisfactorio.' },

  // ── Sofía Castro Rivas (enr-2) - I, II y III Bimestre ──
  { id: 'grd-b1-2-1', matricula_id: 'enr-2', periodo_evaluacion_id: 'eval-b1', competencia_id: 'comp-mat-pri-c1', nota_letra: 'A', nota_numerica: 3, conclusion_descriptiva: 'Buen desempeño en resolución de operaciones básicas.' },
  { id: 'grd-b1-2-2', matricula_id: 'enr-2', periodo_evaluacion_id: 'eval-b1', competencia_id: 'comp-com-pri-c2', nota_letra: 'AD', nota_numerica: 4, conclusion_descriptiva: 'Excelente lectora, fluida y con alto nivel de comprensión.' },
  { id: 'grd-b2-2-1', matricula_id: 'enr-2', periodo_evaluacion_id: 'eval-b2', competencia_id: 'comp-mat-pri-c1', nota_letra: 'AD', nota_numerica: 4, conclusion_descriptiva: 'Mejora continua en resolución de problemas complejos.' },
  { id: 'grd-b2-2-2', matricula_id: 'enr-2', periodo_evaluacion_id: 'eval-b2', competencia_id: 'comp-com-pri-c2', nota_letra: 'AD', nota_numerica: 4, conclusion_descriptiva: 'Destacada redacción y creatividad narrativa.' },
  { id: 'grd-b3-2-1', matricula_id: 'enr-2', periodo_evaluacion_id: 'eval-b3', competencia_id: 'comp-mat-pri-c1', nota_letra: 'A', nota_numerica: 3, conclusion_descriptiva: 'Buen avance en temas del tercer bimestre.' },

  // ── Mateo Flores Díaz (enr-3) - I, II y III Bimestre ──
  { id: 'grd-b1-3-1', matricula_id: 'enr-3', periodo_evaluacion_id: 'eval-b1', competencia_id: 'comp-mat-pri-c1', nota_letra: 'B', nota_numerica: 2, conclusion_descriptiva: 'Requiere reforzar tablas de multiplicar y concentración en clase.' },
  { id: 'grd-b1-3-2', matricula_id: 'enr-3', periodo_evaluacion_id: 'eval-b1', competencia_id: 'comp-com-pri-c2', nota_letra: 'B', nota_numerica: 2, conclusion_descriptiva: 'Necesita apoyo para identificar ideas principales en textos extensos.' },
  { id: 'grd-b2-3-1', matricula_id: 'enr-3', periodo_evaluacion_id: 'eval-b2', competencia_id: 'comp-mat-pri-c1', nota_letra: 'A', nota_numerica: 3, conclusion_descriptiva: 'Se observa superación notable gracias a las sesiones de reforzamiento.' },
  { id: 'grd-b2-3-2', matricula_id: 'enr-3', periodo_evaluacion_id: 'eval-b2', competencia_id: 'comp-com-pri-c2', nota_letra: 'A', nota_numerica: 3, conclusion_descriptiva: 'Mayor autonomía y entusiasmo por la lectura.' },

  // ── Camila Quispe Huamán (enr-4) ──
  { id: 'grd-b1-4-1', matricula_id: 'enr-4', periodo_evaluacion_id: 'eval-b1', competencia_id: 'comp-mat-pri-c1', nota_letra: 'A', nota_numerica: 3 },
  { id: 'grd-b1-4-2', matricula_id: 'enr-4', periodo_evaluacion_id: 'eval-b1', competencia_id: 'comp-com-pri-c2', nota_letra: 'A', nota_numerica: 3 },
  { id: 'grd-b2-4-1', matricula_id: 'enr-4', periodo_evaluacion_id: 'eval-b2', competencia_id: 'comp-mat-pri-c1', nota_letra: 'AD', nota_numerica: 4 },
  { id: 'grd-b2-4-2', matricula_id: 'enr-4', periodo_evaluacion_id: 'eval-b2', competencia_id: 'comp-com-pri-c2', nota_letra: 'A', nota_numerica: 3 },

  // ── Joaquín Herrera Romero (enr-5) ──
  { id: 'grd-b1-5-1', matricula_id: 'enr-5', periodo_evaluacion_id: 'eval-b1', competencia_id: 'comp-mat-pri-c1', nota_letra: 'AD', nota_numerica: 4 },
  { id: 'grd-b1-5-2', matricula_id: 'enr-5', periodo_evaluacion_id: 'eval-b1', competencia_id: 'comp-com-pri-c2', nota_letra: 'A', nota_numerica: 3 },
  { id: 'grd-b2-5-1', matricula_id: 'enr-5', periodo_evaluacion_id: 'eval-b2', competencia_id: 'comp-mat-pri-c1', nota_letra: 'AD', nota_numerica: 4 },
  { id: 'grd-b2-5-2', matricula_id: 'enr-5', periodo_evaluacion_id: 'eval-b2', competencia_id: 'comp-com-pri-c2', nota_letra: 'AD', nota_numerica: 4 },

  // ── Valeria Benavides Prado (enr-6) ──
  { id: 'grd-b1-6-1', matricula_id: 'enr-6', periodo_evaluacion_id: 'eval-b1', competencia_id: 'comp-mat-pri-c1', nota_letra: 'A', nota_numerica: 3 },
  { id: 'grd-b2-6-1', matricula_id: 'enr-6', periodo_evaluacion_id: 'eval-b2', competencia_id: 'comp-mat-pri-c1', nota_letra: 'A', nota_numerica: 3 },

  // ── Thiago Mendoza Navarro (enr-7) ──
  { id: 'grd-b1-7-1', matricula_id: 'enr-7', periodo_evaluacion_id: 'eval-b1', competencia_id: 'comp-mat-pri-c1', nota_letra: 'C', nota_numerica: 1, conclusion_descriptiva: 'Presenta dificultades en la resolución de problemas aditivos y multiplicativos.' },
  { id: 'grd-b2-7-1', matricula_id: 'enr-7', periodo_evaluacion_id: 'eval-b2', competencia_id: 'comp-mat-pri-c1', nota_letra: 'B', nota_numerica: 2, conclusion_descriptiva: 'En proceso de recuperación pedagógica con avances positivos.' },

  // ── Emma Ramos Villanueva (enr-8) ──
  { id: 'grd-b1-8-1', matricula_id: 'enr-8', periodo_evaluacion_id: 'eval-b1', competencia_id: 'comp-mat-pri-c1', nota_letra: 'A', nota_numerica: 3 },
  { id: 'grd-b2-8-1', matricula_id: 'enr-8', periodo_evaluacion_id: 'eval-b2', competencia_id: 'comp-mat-pri-c1', nota_letra: 'A', nota_numerica: 3 },

  // ── Rodrigo Paucar (enr-11 - 5° Primaria) ──
  { id: 'grd-b1-11-1', matricula_id: 'enr-11', periodo_evaluacion_id: 'eval-b1', competencia_id: 'comp-mat-pri-c1', nota_letra: 'AD', nota_numerica: 4 },
  { id: 'grd-b2-11-1', matricula_id: 'enr-11', periodo_evaluacion_id: 'eval-b2', competencia_id: 'comp-mat-pri-c1', nota_letra: 'A', nota_numerica: 3 },

  // ── Sebastián Romero (enr-13 - 1° Secundaria) ──
  { id: 'grd-b1-13-1', matricula_id: 'enr-13', periodo_evaluacion_id: 'eval-b1', competencia_id: 'comp-mat-sec-c1', nota_letra: 'A', nota_numerica: 3 },
  { id: 'grd-b2-13-1', matricula_id: 'enr-13', periodo_evaluacion_id: 'eval-b2', competencia_id: 'comp-mat-sec-c1', nota_letra: 'AD', nota_numerica: 4 },

  // ── Leonardo Cruzado (enr-15 - 3° Secundaria) ──
  { id: 'grd-b1-15-1', matricula_id: 'enr-15', periodo_evaluacion_id: 'eval-b1', competencia_id: 'comp-mat-sec-c1', nota_letra: 'A', nota_numerica: 3 },
  { id: 'grd-b2-15-1', matricula_id: 'enr-15', periodo_evaluacion_id: 'eval-b2', competencia_id: 'comp-mat-sec-c1', nota_letra: 'B', nota_numerica: 2 },
];

// ─────────────────────────────────────────────────────────────────────────────
// 5. ASISTENCIAS DIARIAS (HISTORIAL COMPLETO DE MARZO A OCTUBRE)
// ─────────────────────────────────────────────────────────────────────────────
export const MOCK_ATTENDANCES: AttendanceRecord[] = [
  // Semana actual de Octubre (ingresos QR y puntualidad)
  { id: 'att-oct-01-1', matricula_id: 'enr-1', fecha: '2026-10-01', hora_registro: '07:44:12', estado: 'presente', metodo: 'qr', tipo_registro: 'ingreso', observacion: 'Ingreso puntual por molinete portería A', registrado_por: 'user-asistencia-1' },
  { id: 'att-oct-01-2', matricula_id: 'enr-2', fecha: '2026-10-01', hora_registro: '07:48:30', estado: 'presente', metodo: 'qr', tipo_registro: 'ingreso', registrado_por: 'user-asistencia-1' },
  { id: 'att-oct-01-3', matricula_id: 'enr-3', fecha: '2026-10-01', hora_registro: '08:08:15', estado: 'tardanza', metodo: 'qr', tipo_registro: 'ingreso', observacion: 'Tardanza por congestión vehicular', registrado_por: 'user-asistencia-1' },
  { id: 'att-oct-01-4', matricula_id: 'enr-4', fecha: '2026-10-01', hora_registro: '07:50:00', estado: 'presente', metodo: 'qr', tipo_registro: 'ingreso', registrado_por: 'user-asistencia-1' },
  { id: 'att-oct-01-7', matricula_id: 'enr-7', fecha: '2026-10-01', hora_registro: '08:14:20', estado: 'tardanza', metodo: 'qr', tipo_registro: 'ingreso', registrado_por: 'user-asistencia-1' },

  // Septiembre
  { id: 'att-sep-25-1', matricula_id: 'enr-1', fecha: '2026-09-25', hora_registro: '07:42:00', estado: 'presente', metodo: 'qr', tipo_registro: 'ingreso', registrado_por: 'user-asistencia-1' },
  { id: 'att-sep-25-2', matricula_id: 'enr-2', fecha: '2026-09-25', hora_registro: '07:45:10', estado: 'presente', metodo: 'qr', tipo_registro: 'ingreso', registrado_por: 'user-asistencia-1' },
  { id: 'att-sep-25-3', matricula_id: 'enr-3', fecha: '2026-09-25', hora_registro: '07:49:50', estado: 'presente', metodo: 'qr', tipo_registro: 'ingreso', registrado_por: 'user-asistencia-1' },
  { id: 'att-sep-25-5', matricula_id: 'enr-5', fecha: '2026-09-25', hora_registro: '08:00:00', estado: 'justificado', metodo: 'manual', observacion: 'Cita odontológica justificada con constancia', registrado_por: 'teacher-1' },

  { id: 'att-sep-18-1', matricula_id: 'enr-1', fecha: '2026-09-18', hora_registro: '07:41:00', estado: 'presente', metodo: 'qr', tipo_registro: 'ingreso', registrado_por: 'user-asistencia-1' },
  { id: 'att-sep-18-2', matricula_id: 'enr-2', fecha: '2026-09-18', hora_registro: '07:43:20', estado: 'presente', metodo: 'qr', tipo_registro: 'ingreso', registrado_por: 'user-asistencia-1' },
  { id: 'att-sep-18-7', matricula_id: 'enr-7', fecha: '2026-09-18', hora_registro: '08:12:00', estado: 'tardanza', metodo: 'qr', tipo_registro: 'ingreso', registrado_por: 'user-asistencia-1' },

  // Agosto (Reinicio tras vacaciones de medio año)
  { id: 'att-ago-11-1', matricula_id: 'enr-1', fecha: '2026-08-11', hora_registro: '07:39:10', estado: 'presente', metodo: 'qr', tipo_registro: 'ingreso', registrado_por: 'user-asistencia-1' },
  { id: 'att-ago-11-2', matricula_id: 'enr-2', fecha: '2026-08-11', hora_registro: '07:45:00', estado: 'presente', metodo: 'qr', tipo_registro: 'ingreso', registrado_por: 'user-asistencia-1' },
  { id: 'att-ago-11-3', matricula_id: 'enr-3', fecha: '2026-08-11', hora_registro: '07:52:10', estado: 'presente', metodo: 'qr', tipo_registro: 'ingreso', registrado_por: 'user-asistencia-1' },

  // Julio (Cierre de II Bimestre)
  { id: 'att-jul-22-1', matricula_id: 'enr-1', fecha: '2026-07-22', hora_registro: '07:46:15', estado: 'presente', metodo: 'qr', tipo_registro: 'ingreso', registrado_por: 'user-asistencia-1' },
  { id: 'att-jul-22-2', matricula_id: 'enr-2', fecha: '2026-07-22', hora_registro: '07:49:00', estado: 'presente', metodo: 'qr', tipo_registro: 'ingreso', registrado_por: 'user-asistencia-1' },

  // Junio
  { id: 'att-jun-17-1', matricula_id: 'enr-1', fecha: '2026-06-17', hora_registro: '07:45:00', estado: 'presente', metodo: 'qr', tipo_registro: 'ingreso', registrado_por: 'user-asistencia-1' },
  { id: 'att-jun-17-3', matricula_id: 'enr-3', fecha: '2026-06-17', hora_registro: '07:55:00', estado: 'presente', metodo: 'qr', tipo_registro: 'ingreso', registrado_por: 'user-asistencia-1' },

  // Mayo (Cierre de I Bimestre)
  { id: 'att-may-14-1', matricula_id: 'enr-1', fecha: '2026-05-14', hora_registro: '07:40:00', estado: 'presente', metodo: 'qr', tipo_registro: 'ingreso', registrado_por: 'user-asistencia-1' },
  { id: 'att-may-14-2', matricula_id: 'enr-2', fecha: '2026-05-14', hora_registro: '07:44:00', estado: 'presente', metodo: 'qr', tipo_registro: 'ingreso', registrado_por: 'user-asistencia-1' },

  // Abril
  { id: 'att-abr-20-1', matricula_id: 'enr-1', fecha: '2026-04-20', hora_registro: '07:43:00', estado: 'presente', metodo: 'qr', tipo_registro: 'ingreso', registrado_por: 'user-asistencia-1' },
  { id: 'att-abr-20-2', matricula_id: 'enr-2', fecha: '2026-04-20', hora_registro: '07:48:00', estado: 'presente', metodo: 'qr', tipo_registro: 'ingreso', registrado_por: 'user-asistencia-1' },

  // Marzo (Inicio de Año Escolar)
  { id: 'att-mar-02-1', matricula_id: 'enr-1', fecha: '2026-03-02', hora_registro: '07:35:00', estado: 'presente', metodo: 'qr', tipo_registro: 'ingreso', observacion: 'Primer día de clases 2026', registrado_por: 'user-asistencia-1' },
  { id: 'att-mar-02-2', matricula_id: 'enr-2', fecha: '2026-03-02', hora_registro: '07:38:00', estado: 'presente', metodo: 'qr', tipo_registro: 'ingreso', registrado_por: 'user-asistencia-1' },
  { id: 'att-mar-02-3', matricula_id: 'enr-3', fecha: '2026-03-02', hora_registro: '07:40:00', estado: 'presente', metodo: 'qr', tipo_registro: 'ingreso', registrado_por: 'user-asistencia-1' },
];

// ─────────────────────────────────────────────────────────────────────────────
// 6. TAREAS ACADÉMICAS Y EVALUACIONES (BIMESTRES I, II Y III EN CURSO)
// ─────────────────────────────────────────────────────────────────────────────
export const MOCK_TASKS: TaskAssignment[] = [
  // I Bimestre (Cerradas)
  {
    id: 'task-1',
    curso_id: 'cneb-pri-mat',
    seccion_id: 'sec-3pri-a',
    docente_id: 'teacher-1',
    competencia_id: 'comp-mat-pri-c1',
    titulo: 'Ficha N° 1: Descomposición y Orden de Números Naturales',
    descripcion: 'Resolver los ejercicios de la página 18 a 20 del libro de actividades MINEDU.',
    fecha_limite: '2026-03-25T23:59:00',
    estado: 'cerrada',
    created_at: '2026-03-18T08:00:00Z',
  },
  {
    id: 'task-2',
    curso_id: 'cneb-pri-com',
    seccion_id: 'sec-3pri-a',
    docente_id: 'teacher-2',
    competencia_id: 'comp-com-pri-c3',
    titulo: 'Redacción Creativa: Mi Anécdota de Vacaciones',
    descripcion: 'Escribir un texto narrativo de al menos 3 párrafos aplicando conectores de secuencia.',
    fecha_limite: '2026-04-12T23:59:00',
    estado: 'cerrada',
    created_at: '2026-04-05T08:00:00Z',
  },
  // II Bimestre (Cerradas)
  {
    id: 'task-3',
    curso_id: 'cneb-pri-mat',
    seccion_id: 'sec-3pri-a',
    docente_id: 'teacher-1',
    competencia_id: 'comp-mat-pri-c1',
    titulo: 'Taller de Fracciones: Representación Gráfica y Numérica',
    descripcion: 'Elaborar un círculo de fracciones con material reciclado y resolver la guía práctica.',
    fecha_limite: '2026-06-15T23:59:00',
    estado: 'cerrada',
    created_at: '2026-06-08T08:00:00Z',
  },
  {
    id: 'task-4',
    curso_id: 'cneb-pri-cyt',
    seccion_id: 'sec-3pri-a',
    docente_id: 'teacher-3',
    competencia_id: 'comp-cyt-pri-c2',
    titulo: 'Informe de Indagación: La Fotosíntesis y la Luz Solar',
    descripcion: 'Registrar en 5 días el desarrollo de dos plantas testigo bajo luz y sombra.',
    fecha_limite: '2026-07-02T23:59:00',
    estado: 'cerrada',
    created_at: '2026-06-20T08:00:00Z',
  },
  // III Bimestre (En curso / Activas a mitad de año)
  {
    id: 'task-5',
    curso_id: 'cneb-pri-mat',
    seccion_id: 'sec-3pri-a',
    docente_id: 'teacher-1',
    competencia_id: 'comp-mat-pri-c1',
    titulo: 'Ficha Práctica: Operaciones Combinadas con Fracciones Heterogéneas',
    descripcion: 'Desarrollar los 8 problemas de la ficha adjunta mostrando el procedimiento con MCM.',
    fecha_limite: '2026-09-28T23:59:00',
    estado: 'cerrada',
    created_at: '2026-09-20T08:00:00Z',
  },
  {
    id: 'task-6',
    curso_id: 'cneb-pri-com',
    seccion_id: 'sec-3pri-a',
    docente_id: 'teacher-2',
    competencia_id: 'comp-com-pri-c3',
    titulo: 'Producción de Texto: Ensayo Breve sobre el Cuidado del Agua',
    descripcion: 'Redactar un ensayo expositivo con postura fundamentada y propuestas para la escuela.',
    fecha_limite: '2026-10-08T23:59:00',
    estado: 'publicada',
    created_at: '2026-09-29T10:00:00Z',
  },
  {
    id: 'task-7',
    curso_id: 'cneb-pri-cyt',
    seccion_id: 'sec-3pri-a',
    docente_id: 'teacher-3',
    competencia_id: 'comp-cyt-pri-c3',
    titulo: 'Proyecto de Tecnología: Prototipo de Purificador Casero',
    descripcion: 'Construir un filtro de arena, grava y carbón activo y enviar foto o video explicativo.',
    fecha_limite: '2026-10-15T23:59:00',
    estado: 'publicada',
    created_at: '2026-10-01T08:00:00Z',
  }
];

export const MOCK_SUBMISSIONS: TaskSubmission[] = [
  // Entregas de Lucas Morales (enr-1)
  {
    id: 'sub-1',
    tarea_id: 'task-1',
    matricula_id: 'enr-1',
    fecha_entrega: '2026-03-24T18:30:00',
    comentario_estudiante: 'Profesor, adjunto las fotos de la página 18 a 20 resueltas.',
    calificacion_letra: 'AD',
    calificacion_numerica: 4,
    retroalimentacion_docente: 'Excelente orden y resolución sin errores. Felicitaciones.',
    estado: 'calificado',
  },
  {
    id: 'sub-2',
    tarea_id: 'task-2',
    matricula_id: 'enr-1',
    fecha_entrega: '2026-04-11T16:20:00',
    comentario_estudiante: 'Mi anécdota fue sobre nuestro viaje familiar a Huancayo.',
    calificacion_letra: 'A',
    calificacion_numerica: 3,
    retroalimentacion_docente: 'Muy buena historia. Cuida las tildes en palabras esdrújulas.',
    estado: 'calificado',
  },
  {
    id: 'sub-3',
    tarea_id: 'task-3',
    matricula_id: 'enr-1',
    fecha_entrega: '2026-06-14T20:10:00',
    calificacion_letra: 'AD',
    calificacion_numerica: 4,
    retroalimentacion_docente: 'Material creativo y comprensión cabal de las fracciones equivalentes.',
    estado: 'calificado',
  },
  {
    id: 'sub-5',
    tarea_id: 'task-5',
    matricula_id: 'enr-1',
    fecha_entrega: '2026-09-27T19:00:00',
    comentario_estudiante: 'Resuelto con todo el desarrollo paso a paso.',
    calificacion_letra: 'AD',
    calificacion_numerica: 4,
    retroalimentacion_docente: 'Excelente aplicación del método del aspa y MCM.',
    estado: 'calificado',
  },
  {
    id: 'sub-6',
    tarea_id: 'task-6',
    matricula_id: 'enr-1',
    fecha_entrega: '2026-10-01T15:45:00',
    comentario_estudiante: 'Profesor, ya subí mi borrador del ensayo sobre el agua.',
    estado: 'entregado',
  },
];

export const MOCK_EXAMS: EvaluationExam[] = [
  // I Bimestre
  {
    id: 'exam-1',
    curso_id: 'cneb-pri-mat',
    seccion_id: 'sec-3pri-a',
    periodo_evaluacion_id: 'eval-b1',
    competencia_id: 'comp-mat-pri-c1',
    titulo: 'Examen Bimestral de Matemática - I Bimestre',
    tipo: 'bimestral',
    fecha_programada: '2026-05-12',
    hora_inicio: '08:00',
    duracion_minutos: 90,
    ponderacion: 30,
    estado: 'calificada',
  },
  // II Bimestre
  {
    id: 'exam-2',
    curso_id: 'cneb-pri-mat',
    seccion_id: 'sec-3pri-a',
    periodo_evaluacion_id: 'eval-b2',
    competencia_id: 'comp-mat-pri-c1',
    titulo: 'Examen Bimestral de Matemática - II Bimestre',
    tipo: 'bimestral',
    fecha_programada: '2026-07-20',
    hora_inicio: '08:00',
    duracion_minutos: 90,
    ponderacion: 30,
    estado: 'calificada',
  },
  // III Bimestre (En curso)
  {
    id: 'exam-3',
    curso_id: 'cneb-pri-mat',
    seccion_id: 'sec-3pri-a',
    periodo_evaluacion_id: 'eval-b3',
    competencia_id: 'comp-mat-pri-c1',
    titulo: 'Práctica Calificada N° 1 - III Bimestre (Fracciones)',
    tipo: 'practica',
    fecha_programada: '2026-09-18',
    hora_inicio: '08:00',
    duracion_minutos: 60,
    ponderacion: 20,
    estado: 'calificada',
  },
  {
    id: 'exam-4',
    curso_id: 'cneb-pri-mat',
    seccion_id: 'sec-3pri-a',
    periodo_evaluacion_id: 'eval-b3',
    competencia_id: 'comp-mat-pri-c2',
    titulo: 'Examen Bimestral de Matemática - III Bimestre',
    tipo: 'bimestral',
    fecha_programada: '2026-10-14',
    hora_inicio: '08:00',
    duracion_minutos: 90,
    ponderacion: 30,
    estado: 'programada',
  },
  {
    id: 'exam-5',
    curso_id: 'cneb-pri-com',
    seccion_id: 'sec-3pri-a',
    periodo_evaluacion_id: 'eval-b3',
    competencia_id: 'comp-com-pri-c2',
    titulo: 'Evaluación de Comprensión Lectora - III Bimestre',
    tipo: 'examen',
    fecha_programada: '2026-10-15',
    hora_inicio: '09:45',
    duracion_minutos: 60,
    ponderacion: 25,
    estado: 'programada',
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// 7. HORARIOS ESCOLARES Y SESIONES DE CLASE
// ─────────────────────────────────────────────────────────────────────────────
export const MOCK_SCHEDULE_SLOTS: ScheduleSlot[] = [
  // 3° Primaria A - Lunes a Viernes
  { id: 'slot-1', seccion_id: 'sec-3pri-a', curso_id: 'cneb-pri-mat', docente_id: 'teacher-1', dia: 'lunes', hora_inicio: '08:00', hora_fin: '09:30', aula: 'Aula 201' },
  { id: 'slot-2', seccion_id: 'sec-3pri-a', curso_id: 'cneb-pri-com', docente_id: 'teacher-2', dia: 'lunes', hora_inicio: '09:45', hora_fin: '11:15', aula: 'Aula 201' },
  { id: 'slot-3', seccion_id: 'sec-3pri-a', curso_id: 'cneb-pri-cyt', docente_id: 'teacher-3', dia: 'lunes', hora_inicio: '11:30', hora_fin: '13:00', aula: 'Lab. Primaria' },

  { id: 'slot-4', seccion_id: 'sec-3pri-a', curso_id: 'cneb-pri-com', docente_id: 'teacher-2', dia: 'martes', hora_inicio: '08:00', hora_fin: '09:30', aula: 'Aula 201' },
  { id: 'slot-5', seccion_id: 'sec-3pri-a', curso_id: 'cneb-pri-ps', docente_id: 'teacher-4', dia: 'martes', hora_inicio: '09:45', hora_fin: '11:15', aula: 'Aula 201' },
  { id: 'slot-6', seccion_id: 'sec-3pri-a', curso_id: 'cneb-pri-ing', docente_id: 'teacher-5', dia: 'martes', hora_inicio: '11:30', hora_fin: '13:00', aula: 'Aula 201' },

  { id: 'slot-7', seccion_id: 'sec-3pri-a', curso_id: 'cneb-pri-mat', docente_id: 'teacher-1', dia: 'miercoles', hora_inicio: '08:00', hora_fin: '09:30', aula: 'Aula 201' },
  { id: 'slot-8', seccion_id: 'sec-3pri-a', curso_id: 'cneb-pri-cyt', docente_id: 'teacher-3', dia: 'miercoles', hora_inicio: '09:45', hora_fin: '11:15', aula: 'Lab. Primaria' },
  { id: 'slot-9', seccion_id: 'sec-3pri-a', curso_id: 'cneb-pri-ps', docente_id: 'teacher-4', dia: 'miercoles', hora_inicio: '11:30', hora_fin: '13:00', aula: 'Aula 201' },

  { id: 'slot-10', seccion_id: 'sec-3pri-a', curso_id: 'cneb-pri-com', docente_id: 'teacher-2', dia: 'jueves', hora_inicio: '08:00', hora_fin: '09:30', aula: 'Aula 201' },
  { id: 'slot-11', seccion_id: 'sec-3pri-a', curso_id: 'cneb-pri-mat', docente_id: 'teacher-1', dia: 'jueves', hora_inicio: '09:45', hora_fin: '11:15', aula: 'Aula 201' },
  { id: 'slot-12', seccion_id: 'sec-3pri-a', curso_id: 'cneb-pri-ing', docente_id: 'teacher-5', dia: 'jueves', hora_inicio: '11:30', hora_fin: '13:00', aula: 'Aula 201' },

  { id: 'slot-13', seccion_id: 'sec-3pri-a', curso_id: 'cneb-pri-mat', docente_id: 'teacher-1', dia: 'viernes', hora_inicio: '08:00', hora_fin: '09:30', aula: 'Aula 201' },
  { id: 'slot-14', seccion_id: 'sec-3pri-a', curso_id: 'cneb-pri-com', docente_id: 'teacher-2', dia: 'viernes', hora_inicio: '09:45', hora_fin: '11:15', aula: 'Aula 201' },
];

export const MOCK_CLASS_SESSIONS: ClassSessionLog[] = [
  {
    id: 'sess-1',
    slot_id: 'slot-1',
    seccion_id: 'sec-3pri-a',
    curso_id: 'cneb-pri-mat',
    docente_id: 'teacher-1',
    fecha: '2026-09-28',
    tema_tratado: 'Operaciones combinadas con fracciones heterogéneas',
    observaciones: 'Participación activa de los alumnos en pizarra interactiva.',
    asistencia_tomada: true,
    created_at: '2026-09-28T09:30:00Z',
  },
  {
    id: 'sess-2',
    slot_id: 'slot-4',
    seccion_id: 'sec-3pri-a',
    curso_id: 'cneb-pri-com',
    docente_id: 'teacher-2',
    fecha: '2026-09-29',
    tema_tratado: 'Estructura del texto argumentativo y conectores lógicos',
    observaciones: 'Lectura modelo y análisis de ejemplos en grupo.',
    asistencia_tomada: true,
    created_at: '2026-09-29T09:30:00Z',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 8. TESORERÍA Y PENSIONES (PAGADAS HASTA JULIO, AGOSTO/SEPT EN COBRO)
// ─────────────────────────────────────────────────────────────────────────────
export const MOCK_PAYMENTS: PaymentRecord[] = [
  // Lucas Morales Vega (enr-1, student-1)
  { id: 'pay-1-0', matricula_id: 'enr-1', estudiante_id: 'student-1', mes: 'Matrícula', concepto: 'Matrícula 2026', monto: 350, mora: 0, total: 350, fecha_vencimiento: '2026-03-01', fecha_pago: '2026-02-18', metodo_pago: 'transferencia', numero_operacion: 'BCP-894125', estado: 'pagado', created_at: '2026-02-18T10:00:00Z' },
  { id: 'pay-1-1', matricula_id: 'enr-1', estudiante_id: 'student-1', mes: 'Marzo', concepto: 'Pensión Marzo', monto: 420, mora: 0, total: 420, fecha_vencimiento: '2026-03-31', fecha_pago: '2026-03-27', metodo_pago: 'yape', numero_operacion: 'YAP-102548', estado: 'pagado', created_at: '2026-03-27T14:20:00Z' },
  { id: 'pay-1-2', matricula_id: 'enr-1', estudiante_id: 'student-1', mes: 'Abril', concepto: 'Pensión Abril', monto: 420, mora: 0, total: 420, fecha_vencimiento: '2026-04-30', fecha_pago: '2026-04-28', metodo_pago: 'plin', numero_operacion: 'PLN-963258', estado: 'pagado', created_at: '2026-04-28T11:15:00Z' },
  { id: 'pay-1-3', matricula_id: 'enr-1', estudiante_id: 'student-1', mes: 'Mayo', concepto: 'Pensión Mayo', monto: 420, mora: 0, total: 420, fecha_vencimiento: '2026-05-31', fecha_pago: '2026-05-29', metodo_pago: 'transferencia', numero_operacion: 'BBV-741258', estado: 'pagado', created_at: '2026-05-29T09:40:00Z' },
  { id: 'pay-1-4', matricula_id: 'enr-1', estudiante_id: 'student-1', mes: 'Junio', concepto: 'Pensión Junio', monto: 420, mora: 0, total: 420, fecha_vencimiento: '2026-06-30', fecha_pago: '2026-06-26', metodo_pago: 'yape', numero_operacion: 'YAP-852147', estado: 'pagado', created_at: '2026-06-26T16:00:00Z' },
  { id: 'pay-1-5', matricula_id: 'enr-1', estudiante_id: 'student-1', mes: 'Julio', concepto: 'Pensión Julio', monto: 420, mora: 0, total: 420, fecha_vencimiento: '2026-07-31', fecha_pago: '2026-07-28', metodo_pago: 'transferencia', numero_operacion: 'BCP-321456', estado: 'pagado', created_at: '2026-07-28T12:30:00Z' },
  { id: 'pay-1-6', matricula_id: 'enr-1', estudiante_id: 'student-1', mes: 'Agosto', concepto: 'Pensión Agosto', monto: 420, mora: 0, total: 420, fecha_vencimiento: '2026-08-31', fecha_pago: '2026-08-30', metodo_pago: 'yape', numero_operacion: 'YAP-456987', estado: 'pagado', created_at: '2026-08-30T17:10:00Z' },
  { id: 'pay-1-7', matricula_id: 'enr-1', estudiante_id: 'student-1', mes: 'Septiembre', concepto: 'Pensión Septiembre', monto: 420, mora: 0, total: 420, fecha_vencimiento: '2026-09-30', fecha_pago: '2026-09-29', metodo_pago: 'transferencia', numero_operacion: 'BCP-654987', estado: 'pagado', created_at: '2026-09-29T10:15:00Z' },
  { id: 'pay-1-8', matricula_id: 'enr-1', estudiante_id: 'student-1', mes: 'Octubre', concepto: 'Pensión Octubre', monto: 420, mora: 0, total: 420, fecha_vencimiento: '2026-10-31', estado: 'pendiente', created_at: '2026-10-01T08:00:00Z' },

  // Sofía Castro Rivas (enr-2)
  { id: 'pay-2-1', matricula_id: 'enr-2', estudiante_id: 'student-2', mes: 'Julio', concepto: 'Pensión Julio', monto: 420, mora: 0, total: 420, fecha_vencimiento: '2026-07-31', fecha_pago: '2026-07-25', metodo_pago: 'yape', numero_operacion: 'YAP-998877', estado: 'pagado', created_at: '2026-07-25T11:00:00Z' },
  { id: 'pay-2-2', matricula_id: 'enr-2', estudiante_id: 'student-2', mes: 'Agosto', concepto: 'Pensión Agosto', monto: 420, mora: 0, total: 420, fecha_vencimiento: '2026-08-31', fecha_pago: '2026-08-28', metodo_pago: 'yape', numero_operacion: 'YAP-776655', estado: 'pagado', created_at: '2026-08-28T09:15:00Z' },
  { id: 'pay-2-3', matricula_id: 'enr-2', estudiante_id: 'student-2', mes: 'Septiembre', concepto: 'Pensión Septiembre', monto: 420, mora: 15, total: 435, fecha_vencimiento: '2026-09-30', estado: 'pendiente', created_at: '2026-09-01T08:00:00Z' },

  // Mateo Flores Díaz (enr-3)
  { id: 'pay-3-1', matricula_id: 'enr-3', estudiante_id: 'student-3', mes: 'Agosto', concepto: 'Pensión Agosto', monto: 420, mora: 0, total: 420, fecha_vencimiento: '2026-08-31', fecha_pago: '2026-08-31', metodo_pago: 'efectivo', numero_operacion: 'REC-001248', estado: 'pagado', created_at: '2026-08-31T15:30:00Z' },
  { id: 'pay-3-2', matricula_id: 'enr-3', estudiante_id: 'student-3', mes: 'Septiembre', concepto: 'Pensión Septiembre', monto: 420, mora: 0, total: 420, fecha_vencimiento: '2026-09-30', fecha_pago: '2026-09-30', metodo_pago: 'yape', numero_operacion: 'YAP-332211', estado: 'pagado', created_at: '2026-09-30T14:00:00Z' },

  // Thiago Mendoza Navarro (enr-7) - Caso con mora pendiente de regularización
  { id: 'pay-7-1', matricula_id: 'enr-7', estudiante_id: 'student-7', mes: 'Agosto', concepto: 'Pensión Agosto', monto: 420, mora: 25, total: 445, fecha_vencimiento: '2026-08-31', estado: 'vencido', created_at: '2026-08-01T08:00:00Z' },
  { id: 'pay-7-2', matricula_id: 'enr-7', estudiante_id: 'student-7', mes: 'Septiembre', concepto: 'Pensión Septiembre', monto: 420, mora: 10, total: 430, fecha_vencimiento: '2026-09-30', estado: 'vencido', created_at: '2026-09-01T08:00:00Z' },
];

// ─────────────────────────────────────────────────────────────────────────────
// 9. CONVIVENCIA ESCOLAR / ANECDOTARIO
// ─────────────────────────────────────────────────────────────────────────────
export const MOCK_BEHAVIOR_LOGS: BehaviorLogEntry[] = [
  {
    id: 'beh-1',
    matricula_id: 'enr-1',
    estudiante_id: 'student-1',
    fecha: '2026-06-24',
    tipo: 'felicitacion',
    titulo: 'Destacada participación en la Feria Científica Escolar',
    descripcion: 'Lucas demostró gran compromiso y solvencia en la exposición del proyecto de ciencias de su aula.',
    docente_id: 'teacher-3',
    docente_nombre: 'Prof. Carlos Benites',
    visible_apoderado: true,
    created_at: '2026-06-24T12:00:00Z',
  },
  {
    id: 'beh-2',
    matricula_id: 'enr-1',
    estudiante_id: 'student-1',
    fecha: '2026-07-22',
    tipo: 'merito',
    titulo: 'Reconocimiento de Convivencia y Solidaridad',
    descripcion: 'Apoyo constante y cordial a sus compañeros de aula durante el trabajo colaborativo.',
    docente_id: 'teacher-1',
    docente_nombre: 'Prof. Tomás Pérez',
    visible_apoderado: true,
    created_at: '2026-07-22T11:30:00Z',
  },
  {
    id: 'beh-3',
    matricula_id: 'enr-7',
    estudiante_id: 'student-7',
    fecha: '2026-09-18',
    tipo: 'observacion',
    titulo: 'Tardanza reiterada en el ingreso a clases',
    descripcion: 'Se registra tercera tardanza consecutiva al inicio de la jornada escolar.',
    docente_id: 'teacher-1',
    docente_nombre: 'Prof. Tomás Pérez',
    visible_apoderado: true,
    created_at: '2026-09-18T08:30:00Z',
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// 10. RECURSOS LMS, AVISOS, EVENTOS Y ALERTAS
// ─────────────────────────────────────────────────────────────────────────────
export const MOCK_LMS_MODULES: LMSModule[] = [
  {
    id: 'lms-mod-mat-1',
    curso_id: 'cneb-pri-mat',
    titulo: 'Módulo 1: Operaciones con Números Naturales y Fracciones',
    descripcion: 'Fundamentos de aritmética, resolución de problemas y aplicaciones cotidianas.',
    orden: 1,
    contenidos: [
      { id: 'cnt-mat-1', modulo_id: 'lms-mod-mat-1', titulo: 'Video Explicativo: Estrategias de Cálculo Mental', tipo: 'video', duracion_estimada: '15 min', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', orden: 1 },
      { id: 'cnt-mat-2', modulo_id: 'lms-mod-mat-1', titulo: 'Guía de Práctica en PDF: Fracciones Equivalentes', tipo: 'documento', duracion_estimada: '25 min', url: '#', orden: 2 },
      { id: 'cnt-mat-3', modulo_id: 'lms-mod-mat-1', titulo: 'Cuestionario de Autoevaluación CNEB', tipo: 'cuestionario', duracion_estimada: '20 min', url: '#', orden: 3 },
    ],
  },
  {
    id: 'lms-mod-com-1',
    curso_id: 'cneb-pri-com',
    titulo: 'Módulo 1: Comprensión Lectora y Tipología Textual',
    descripcion: 'Análisis de textos narrativos, argumentativos y organizadores gráficos.',
    orden: 1,
    contenidos: [
      { id: 'cnt-com-1', modulo_id: 'lms-mod-com-1', titulo: 'Lectura Guiada: Cuentos Peruanos Clásicos', tipo: 'lectura', duracion_estimada: '30 min', url: '#', orden: 1 },
      { id: 'cnt-com-2', modulo_id: 'lms-mod-com-1', titulo: 'Ficha de Producción Escrita: El Ensayo Escolar', tipo: 'tarea', duracion_estimada: '45 min', url: '#', orden: 2 },
    ],
  },
];

export const MOCK_SYSTEM_ALERTS: SystemAlert[] = [
  {
    id: 'alt-1',
    prioridad: 'alta',
    categoria: 'academico',
    titulo: 'Cierre de Actas Pedagógicas II Bimestre',
    descripcion: 'Las actas y libretas del II Bimestre han sido consolidadas y firmadas digitalmente.',
    estado: 'resuelta',
    accion_label: 'Ver Actas',
    accion_url: '/admin/reportes',
    created_at: '2026-08-01T10:00:00Z',
  },
  {
    id: 'alt-2',
    prioridad: 'media',
    categoria: 'asistencia',
    titulo: 'Monitoreo de Asistencia y Puntualidad',
    descripcion: 'El 96.2% de los estudiantes registró asistencia puntual mediante credencial QR esta semana.',
    estado: 'resuelta',
    accion_label: 'Ver Registro',
    accion_url: '/admin/asistencia',
    created_at: '2026-10-01T08:30:00Z',
  },
  {
    id: 'alt-3',
    prioridad: 'alta',
    categoria: 'tareas',
    titulo: 'Pensiones de Septiembre por Regularizar',
    descripcion: 'Existen cuotas del mes de Septiembre pendientes de confirmación en tesorería.',
    estado: 'nueva',
    accion_label: 'Revisar Tesorería',
    accion_url: '/admin/reportes',
    created_at: '2026-10-01T09:00:00Z',
  }
];

export const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
  { id: 'aud-1', usuario_id: 'teacher-1', usuario_nombre: 'Prof. Tomás Pérez', rol: 'docente', accion: 'REGISTRO_CALIFICACIONES', modulo: 'NOTAS', detalle: 'Ingreso oficial de calificaciones finales de II Bimestre para 3° Primaria A', timestamp: '2026-07-24T18:00:00Z' },
  { id: 'aud-2', usuario_id: 'user-admin-1', usuario_nombre: 'Administrador Institucional', rol: 'admin', accion: 'EMISION_LIBRETAS', modulo: 'REPORTES', detalle: 'Generación masiva de Libretas de Información Académica del II Bimestre', timestamp: '2026-07-25T10:30:00Z' },
  { id: 'aud-3', usuario_id: 'user-asistencia-1', usuario_nombre: 'Portería Principal', rol: 'asistencia', accion: 'SCAN_QR_MASIVO', modulo: 'ASISTENCIA', detalle: 'Apertura de molinete y escaneo de 180 credenciales QR escolares', timestamp: '2026-10-01T07:30:00Z' },
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    titulo: 'Inicio del Año Escolar y Entrega de Útiles',
    contenido: 'Estimada comunidad educativa, les damos la más cordial bienvenida al Año Escolar 2026. Recordamos que el horario de ingreso es de 07:30 a 08:00 AM.',
    remitente_nombre: 'Dirección General',
    remitente_rol: 'admin',
    destinatarios_rol: 'todos',
    nivel_destinatario: 'todos',
    fecha_publicacion: '2026-03-01',
    es_urgente: false,
    categoria: 'general',
    creado_en: '2026-03-01T08:00:00Z',
  },
  {
    id: 'ann-2',
    titulo: 'Entrega de Libretas de Información - II Bimestre',
    contenido: 'Se informa a los padres de familia que las libretas bimestrales de calificaciones ya se encuentran disponibles para descarga desde el portal web y aplicación.',
    remitente_nombre: 'Dirección Académica',
    remitente_rol: 'admin',
    destinatarios_rol: 'apoderado',
    nivel_destinatario: 'todos',
    fecha_publicacion: '2026-07-25',
    es_urgente: false,
    categoria: 'academico',
    creado_en: '2026-07-25T09:30:00Z',
  },
  {
    id: 'ann-3',
    titulo: 'Reunión de Escuela para Padres - III Bimestre',
    contenido: 'Invitamos a los señores apoderados a participar en el taller psicopedagógico "Acompañamiento escolar y hábitos de estudio en la era digital". Auditorio Central.',
    remitente_nombre: 'Departamento Psicopedagógico',
    remitente_rol: 'admin',
    destinatarios_rol: 'apoderado',
    nivel_destinatario: 'todos',
    fecha_publicacion: '2026-09-15',
    es_urgente: true,
    categoria: 'general',
    creado_en: '2026-09-15T10:00:00Z',
  }
];

export const MOCK_CALENDAR_EVENTS: SchoolCalendarEvent[] = [
  { id: 'cal-1', titulo: 'Inicio del Año Escolar 2026 (I Bimestre)', descripcion: 'Primer día de clases oficial.', fecha_inicio: '2026-03-01', fecha_fin: '2026-03-01', tipo: 'inicio_bimestre', nivel: 'todos', es_laborable: true, color: '#3B82F6' },
  { id: 'cal-2', titulo: 'Evaluaciones Parciales I Bimestre', descripcion: 'Semana de consolidación de evidencias.', fecha_inicio: '2026-04-13', fecha_fin: '2026-04-17', tipo: 'evaluaciones', nivel: 'todos', es_laborable: true, color: '#8B5CF6' },
  { id: 'cal-3', titulo: 'Semana Santa (Feriado Nacional)', descripcion: 'Suspensión de labores escolares.', fecha_inicio: '2026-04-02', fecha_fin: '2026-04-03', tipo: 'feriado', nivel: 'todos', es_laborable: false, color: '#EF4444' },
  { id: 'cal-4', titulo: 'Vacaciones de Medio Año (Estudiantes)', descripcion: 'Descanso de medio año escolar y jornada pedagógica docente.', fecha_inicio: '2026-07-27', fecha_fin: '2026-08-07', tipo: 'vacaciones', nivel: 'todos', es_laborable: false, color: '#10B981' },
  { id: 'cal-5', titulo: 'Inicio del III Bimestre', descripcion: 'Reincorporación a las actividades lectivas.', fecha_inicio: '2026-08-10', fecha_fin: '2026-08-10', tipo: 'inicio_bimestre', nivel: 'todos', es_laborable: true, color: '#3B82F6' },
  { id: 'cal-6', titulo: 'Evaluaciones Bimestrales III Bimestre', descripcion: 'Exámenes de fin de III Bimestre.', fecha_inicio: '2026-10-12', fecha_fin: '2026-10-16', tipo: 'evaluaciones', nivel: 'todos', es_laborable: true, color: '#8B5CF6' },
  { id: 'cal-7', titulo: 'Clausura del Año Escolar 2026', descripcion: 'Ceremonia de clausura y entrega de diplomas de honor.', fecha_inicio: '2026-12-22', fecha_fin: '2026-12-22', tipo: 'actividad_cultural', nivel: 'todos', es_laborable: true, color: '#F59E0B' },
];

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    user_id: 'user-student-1',
    categoria: 'academico',
    tipo: 'nota',
    titulo: 'Calificaciones de II Bimestre Publicadas',
    mensaje: 'Tu libreta de notas del II Bimestre ya está disponible. ¡Felicitaciones por tu promedio AD!',
    leido: true,
    url_redireccion: '/estudiante/notas',
    created_at: '2026-07-25T11:00:00Z',
  },
  {
    id: 'notif-2',
    user_id: 'user-student-1',
    categoria: 'tarea',
    tipo: 'tarea',
    titulo: 'Nueva tarea: Ensayo Breve sobre el Agua',
    mensaje: 'La Prof. Carmen Mendoza ha publicado una tarea con fecha límite el 08 de Octubre.',
    leido: false,
    url_redireccion: '/estudiante/tareas',
    created_at: '2026-09-29T10:05:00Z',
  },
  {
    id: 'notif-3',
    user_id: 'parent-1',
    categoria: 'asistencia',
    tipo: 'asistencia',
    titulo: 'Ingreso puntual registrado',
    mensaje: 'Su menor hijo Lucas Morales ingresó al colegio a las 07:44 AM mediante credencial QR.',
    leido: false,
    url_redireccion: '/apoderado/asistencia',
    created_at: '2026-10-01T07:45:00Z',
  }
];

export const MOCK_SUBSANACIONES: SubsanacionRecord[] = [
  {
    id: 'sub-cneb-1',
    matricula_id: 'enr-7',
    estudiante_id: 'student-7',
    curso_id: 'cneb-pri-mat',
    periodo_id: 'period-2026',
    nota_original: 'C',
    nota_subsanacion: 'B',
    fecha_evaluacion: '2026-08-14',
    docente_evaluador_id: 'teacher-1',
    observaciones: 'Carpeta de recuperación pedagógica sustentada con éxito en el periodo vacacional.',
    estado: 'aprobado',
  }
];

export const MOCK_JUSTIFICATIONS: JustificationRequest[] = [
  {
    id: 'just-1',
    matricula_id: 'enr-5',
    estudiante_id: 'student-5',
    apoderado_id: 'parent-5',
    apoderado_nombre: 'Alonso Herrera Benítez',
    fecha: '2026-09-25',
    tipo: 'falta',
    motivo: 'Atención médica odontológica especializada con reposo indicado.',
    estado: 'aprobada',
    respuesta_colegio: 'Falta justificada en el registro oficial. Se otorgará reprogramación de actividades.',
    revisado_por: 'teacher-1',
    created_at: '2026-09-25T08:30:00Z',
  }
];

export const MOCK_STAFF_ATTENDANCES: StaffAttendanceRecord[] = [
  { id: 'stf-1', user_id: 'teacher-1', fecha: '2026-10-01', hora_ingreso: '07:25:00', tipo: 'entrada', estado: 'puntual', metodo: 'qr', creado_en: '2026-10-01T07:25:00Z' },
  { id: 'stf-2', user_id: 'teacher-2', fecha: '2026-10-01', hora_ingreso: '07:28:00', tipo: 'entrada', estado: 'puntual', metodo: 'qr', creado_en: '2026-10-01T07:28:00Z' },
  { id: 'stf-3', user_id: 'teacher-3', fecha: '2026-10-01', hora_ingreso: '07:30:00', tipo: 'entrada', estado: 'puntual', metodo: 'qr', creado_en: '2026-10-01T07:30:00Z' },
  { id: 'stf-4', user_id: 'user-asistencia-1', fecha: '2026-10-01', hora_ingreso: '07:00:00', tipo: 'entrada', estado: 'puntual', metodo: 'qr', creado_en: '2026-10-01T07:00:00Z' },
];
'''

with open(output_file, 'w', encoding='utf-8') as f:
    f.write(content.strip() + '\n')

print("mock-data.ts actualizado exitosamente.")
