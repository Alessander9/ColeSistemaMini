import { 
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
  SubsanacionRecord
} from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// 1. USUARIOS REALES DEL SISTEMA
// Cuenta inicial de Administrador oficial del colegio
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

export const MOCK_USERS: UserProfile[] = [INITIAL_ADMIN_USER];

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

// Grados oficiales (Inicial, Primaria, Secundaria)
export const MOCK_GRADE_LEVELS: GradeLevel[] = [
  // Inicial
  { id: 'grd-ini-3', nivel: 'inicial', nombre: '3 Años', numero_grado: 1 },
  { id: 'grd-ini-4', nivel: 'inicial', nombre: '4 Años', numero_grado: 2 },
  { id: 'grd-ini-5', nivel: 'inicial', nombre: '5 Años', numero_grado: 3 },
  // Primaria
  { id: 'grd-pri-1', nivel: 'primaria', nombre: '1° de Primaria', numero_grado: 1 },
  { id: 'grd-pri-2', nivel: 'primaria', nombre: '2° de Primaria', numero_grado: 2 },
  { id: 'grd-pri-3', nivel: 'primaria', nombre: '3° de Primaria', numero_grado: 3 },
  { id: 'grd-pri-4', nivel: 'primaria', nombre: '4° de Primaria', numero_grado: 4 },
  { id: 'grd-pri-5', nivel: 'primaria', nombre: '5° de Primaria', numero_grado: 5 },
  { id: 'grd-pri-6', nivel: 'primaria', nombre: '6° de Primaria', numero_grado: 6 },
  // Secundaria
  { id: 'grd-sec-1', nivel: 'secundaria', nombre: '1° de Secundaria', numero_grado: 1 },
  { id: 'grd-sec-2', nivel: 'secundaria', nombre: '2° de Secundaria', numero_grado: 2 },
  { id: 'grd-sec-3', nivel: 'secundaria', nombre: '3° de Secundaria', numero_grado: 3 },
  { id: 'grd-sec-4', nivel: 'secundaria', nombre: '4° de Secundaria', numero_grado: 4 },
  { id: 'grd-sec-5', nivel: 'secundaria', nombre: '5° de Secundaria', numero_grado: 5 },
];

export const MOCK_GRADES: GradeLevel[] = MOCK_GRADE_LEVELS;
export const MOCK_PERIODS: EvaluationPeriod[] = MOCK_EVALUATION_PERIODS;
export const MOCK_TEACHERS: UserProfile[] = [];

import { getOfficialCnebCoursesAndCompetencies } from '@/lib/cneb/officialCurriculum';

export const MOCK_SECTIONS: Section[] = [
  // Inicial
  { id: 'sec-ini-3a', grado_id: 'grd-ini-3', letra: 'A', capacidad_maxima: 20, aula: 'Pabellón Inicial - Aula 01', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-ini-3') },
  { id: 'sec-ini-3b', grado_id: 'grd-ini-3', letra: 'B', capacidad_maxima: 20, aula: 'Pabellón Inicial - Aula 02', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-ini-3') },
  { id: 'sec-ini-4a', grado_id: 'grd-ini-4', letra: 'A', capacidad_maxima: 22, aula: 'Pabellón Inicial - Aula 03', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-ini-4') },
  { id: 'sec-ini-4b', grado_id: 'grd-ini-4', letra: 'B', capacidad_maxima: 22, aula: 'Pabellón Inicial - Aula 04', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-ini-4') },
  { id: 'sec-ini-5a', grado_id: 'grd-ini-5', letra: 'A', capacidad_maxima: 25, aula: 'Pabellón Inicial - Aula 05', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-ini-5') },
  { id: 'sec-ini-5b', grado_id: 'grd-ini-5', letra: 'B', capacidad_maxima: 25, aula: 'Pabellón Inicial - Aula 06', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-ini-5') },
  // Primaria
  { id: 'sec-1pri-a', grado_id: 'grd-pri-1', letra: 'A', capacidad_maxima: 30, aula: 'Pabellón A - Aula 101', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-pri-1') },
  { id: 'sec-1pri-b', grado_id: 'grd-pri-1', letra: 'B', capacidad_maxima: 30, aula: 'Pabellón A - Aula 102', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-pri-1') },
  { id: 'sec-2pri-a', grado_id: 'grd-pri-2', letra: 'A', capacidad_maxima: 30, aula: 'Pabellón A - Aula 103', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-pri-2') },
  { id: 'sec-2pri-b', grado_id: 'grd-pri-2', letra: 'B', capacidad_maxima: 30, aula: 'Pabellón A - Aula 104', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-pri-2') },
  { id: 'sec-3pri-a', grado_id: 'grd-pri-3', letra: 'A', capacidad_maxima: 30, aula: 'Pabellón A - Aula 201', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-pri-3') },
  { id: 'sec-3pri-b', grado_id: 'grd-pri-3', letra: 'B', capacidad_maxima: 30, aula: 'Pabellón A - Aula 202', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-pri-3') },
  { id: 'sec-4pri-a', grado_id: 'grd-pri-4', letra: 'A', capacidad_maxima: 30, aula: 'Pabellón A - Aula 203', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-pri-4') },
  { id: 'sec-4pri-b', grado_id: 'grd-pri-4', letra: 'B', capacidad_maxima: 30, aula: 'Pabellón A - Aula 204', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-pri-4') },
  { id: 'sec-5pri-a', grado_id: 'grd-pri-5', letra: 'A', capacidad_maxima: 30, aula: 'Pabellón B - Aula 101', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-pri-5') },
  { id: 'sec-5pri-b', grado_id: 'grd-pri-5', letra: 'B', capacidad_maxima: 30, aula: 'Pabellón B - Aula 102', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-pri-5') },
  { id: 'sec-6pri-a', grado_id: 'grd-pri-6', letra: 'A', capacidad_maxima: 30, aula: 'Pabellón B - Aula 103', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-pri-6') },
  { id: 'sec-6pri-b', grado_id: 'grd-pri-6', letra: 'B', capacidad_maxima: 30, aula: 'Pabellón B - Aula 104', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-pri-6') },
  // Secundaria
  { id: 'sec-1sec-a', grado_id: 'grd-sec-1', letra: 'A', capacidad_maxima: 32, aula: 'Pabellón C - Aula 201', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-sec-1') },
  { id: 'sec-1sec-b', grado_id: 'grd-sec-1', letra: 'B', capacidad_maxima: 32, aula: 'Pabellón C - Aula 202', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-sec-1') },
  { id: 'sec-2sec-a', grado_id: 'grd-sec-2', letra: 'A', capacidad_maxima: 32, aula: 'Pabellón C - Aula 203', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-sec-2') },
  { id: 'sec-2sec-b', grado_id: 'grd-sec-2', letra: 'B', capacidad_maxima: 32, aula: 'Pabellón C - Aula 204', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-sec-2') },
  { id: 'sec-3sec-a', grado_id: 'grd-sec-3', letra: 'A', capacidad_maxima: 32, aula: 'Pabellón C - Aula 301', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-sec-3') },
  { id: 'sec-3sec-b', grado_id: 'grd-sec-3', letra: 'B', capacidad_maxima: 32, aula: 'Pabellón C - Aula 302', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-sec-3') },
  { id: 'sec-4sec-a', grado_id: 'grd-sec-4', letra: 'A', capacidad_maxima: 32, aula: 'Pabellón C - Aula 303', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-sec-4') },
  { id: 'sec-4sec-b', grado_id: 'grd-sec-4', letra: 'B', capacidad_maxima: 32, aula: 'Pabellón C - Aula 304', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-sec-4') },
  { id: 'sec-5sec-a', grado_id: 'grd-sec-5', letra: 'A', capacidad_maxima: 32, aula: 'Pabellón C - Aula 305', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-sec-5') },
  { id: 'sec-5sec-b', grado_id: 'grd-sec-5', letra: 'B', capacidad_maxima: 32, aula: 'Pabellón C - Aula 306', grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-sec-5') },
];

const cnebData = getOfficialCnebCoursesAndCompetencies();

// Competencias oficiales CNEB
export const MOCK_COMPETENCIES: Competency[] = cnebData.competencies;
export const MINEDU_COMPETENCIES: Competency[] = MOCK_COMPETENCIES;

// Cursos oficiales CNEB
export const MOCK_COURSES: Course[] = cnebData.courses;

// ─────────────────────────────────────────────────────────────────────────────
// 3. COLECCIONES OPERATIVAS LIMPIAS (SIN DATOS MOCKEADOS NI DUMMY RECORDS)
// Listas vacías listas para recibir registros reales de los usuarios
// ─────────────────────────────────────────────────────────────────────────────
export const MOCK_STUDENTS: Student[] = [];
export const MOCK_ENROLLMENTS: Enrollment[] = [];
export const MOCK_ATTENDANCES: AttendanceRecord[] = [];
export const MOCK_GRADE_RECORDS: GradeRecord[] = [];
export const MOCK_TASKS: TaskAssignment[] = [];
export const MOCK_SUBMISSIONS: TaskSubmission[] = [];
export const MOCK_EXAMS: EvaluationExam[] = [];
export const MOCK_NOTIFICATIONS: AppNotification[] = [];
export const MOCK_SECTION_COURSES: SectionCourseAssignment[] = [];
export const MOCK_SCHEDULE_SLOTS: ScheduleSlot[] = [];
export const MOCK_CLASS_SESSIONS: ClassSessionLog[] = [];
export const MOCK_CHILDREN: ChildProfile[] = [];
export const MOCK_PARENTS: ParentProfile[] = [];
export const MOCK_LMS_MODULES: LMSModule[] = [
  {
    id: 'lms-mod-mat-1',
    curso_id: 'cneb-pri-mat',
    titulo: 'Módulo 1: Operaciones con Números Naturales y Fracciones',
    descripcion: 'Fundamentos de aritmética, resolución de problemas y aplicaciones cotidianas.',
    orden: 1,
    contenidos: [
      {
        id: 'cnt-mat-1',
        modulo_id: 'lms-mod-mat-1',
        titulo: 'Video Explicativo: Estrategias de Cálculo Mental',
        tipo: 'video',
        duracion_estimada: '15 min',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        orden: 1,
      },
      {
        id: 'cnt-mat-2',
        modulo_id: 'lms-mod-mat-1',
        titulo: 'Guía de Práctica en PDF: Fracciones Equivalentes',
        tipo: 'documento',
        duracion_estimada: '25 min',
        url: '#',
        orden: 2,
      },
      {
        id: 'cnt-mat-3',
        modulo_id: 'lms-mod-mat-1',
        titulo: 'Cuestionario de Autoevaluación CNEB',
        tipo: 'cuestionario',
        duracion_estimada: '20 min',
        url: '#',
        orden: 3,
      },
    ],
  },
  {
    id: 'lms-mod-com-1',
    curso_id: 'cneb-pri-com',
    titulo: 'Módulo 1: Comprensión Lectora y Tipología Textual',
    descripcion: 'Análisis de textos narrativos, argumentativos y organizadores gráficos.',
    orden: 1,
    contenidos: [
      {
        id: 'cnt-com-1',
        modulo_id: 'lms-mod-com-1',
        titulo: 'Lectura Guiada: Cuentos Peruanos Clásicos',
        tipo: 'lectura',
        duracion_estimada: '30 min',
        url: '#',
        orden: 1,
      },
      {
        id: 'cnt-com-2',
        modulo_id: 'lms-mod-com-1',
        titulo: 'Ficha de Producción Escrita: El Ensayo Escolar',
        tipo: 'tarea',
        duracion_estimada: '45 min',
        url: '#',
        orden: 2,
      },
    ],
  },
];
export const MOCK_SYSTEM_ALERTS: SystemAlert[] = [];
export const MOCK_AUDIT_LOGS: AuditLogEntry[] = [];
export const MOCK_PAYMENTS: PaymentRecord[] = [];
export const MOCK_BEHAVIOR_LOGS: BehaviorLogEntry[] = [];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    titulo: 'Inicio del Año Escolar y Entrega de Útiles',
    contenido: 'Estimada comunidad educativa, les damos la más cordial bienvenida al Año Escolar 2026. Recordamos que el horario de ingreso es de 07:30 a 08:00 AM. El uniforme escolar completo es de uso obligatorio a partir de la segunda semana.',
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
    titulo: 'Primera Reunión General de Padres de Familia',
    contenido: 'Se convoca a todos los padres de familia y apoderados a la I Asamblea General para la presentación del Plan Anual de Trabajo 2026 y conformación de Comités de Aula. Lugar: Auditorio Principal.',
    remitente_nombre: 'Dirección General',
    remitente_rol: 'admin',
    destinatarios_rol: 'apoderado',
    nivel_destinatario: 'todos',
    fecha_publicacion: '2026-03-15',
    es_urgente: true,
    categoria: 'administrativo',
    creado_en: '2026-03-15T09:30:00Z',
  }
];

export const MOCK_CALENDAR_EVENTS: SchoolCalendarEvent[] = [
  {
    id: 'cal-1',
    titulo: 'Inicio del Año Escolar 2026 (I Bimestre)',
    descripcion: 'Primer día de clases para los niveles Inicial, Primaria y Secundaria.',
    fecha_inicio: '2026-03-01',
    fecha_fin: '2026-03-01',
    tipo: 'inicio_bimestre',
    nivel: 'todos',
    es_laborable: true,
    color: '#3B82F6',
  },
  {
    id: 'cal-2',
    titulo: 'Evaluaciones Parciales I Bimestre',
    descripcion: 'Semana de evaluaciones de competencias y consolidación de evidencias.',
    fecha_inicio: '2026-04-13',
    fecha_fin: '2026-04-17',
    tipo: 'evaluaciones',
    nivel: 'todos',
    es_laborable: true,
    color: '#8B5CF6',
  },
  {
    id: 'cal-3',
    titulo: 'Semana Santa (Feriado Nacional)',
    descripcion: 'Suspensión de labores escolares según calendario oficial del Ministerio de Trabajo.',
    fecha_inicio: '2026-04-02',
    fecha_fin: '2026-04-03',
    tipo: 'feriado',
    nivel: 'todos',
    es_laborable: false,
    color: '#EF4444',
  },
  {
    id: 'cal-4',
    titulo: 'Vacaciones de Medio Año (Estudiantes)',
    descripcion: 'Descanso estudiantil y Jornada de Reflexión y Planificación Pedagógica para Docentes.',
    fecha_inicio: '2026-07-27',
    fecha_fin: '2026-08-07',
    tipo: 'vacaciones',
    nivel: 'todos',
    es_laborable: false,
    color: '#10B981',
  },
  {
    id: 'cal-5',
    titulo: 'Clausura del Año Escolar 2026',
    descripcion: 'Ceremonia oficial de clausura y entrega de Libretas de Información Académica.',
    fecha_inicio: '2026-12-22',
    fecha_fin: '2026-12-22',
    tipo: 'actividad_cultural',
    nivel: 'todos',
    es_laborable: true,
    color: '#F59E0B',
  }
];

export const MOCK_SUBSANACIONES: SubsanacionRecord[] = [];

