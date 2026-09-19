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
  AuditLogEntry
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

export const MOCK_SECTIONS: Section[] = [
  // Inicial
  { id: 'sec-ini-3a', grado_id: 'grd-ini-3', letra: 'A', capacidad_maxima: 20, grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-ini-3') },
  { id: 'sec-ini-3b', grado_id: 'grd-ini-3', letra: 'B', capacidad_maxima: 20, grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-ini-3') },
  { id: 'sec-ini-4a', grado_id: 'grd-ini-4', letra: 'A', capacidad_maxima: 22, grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-ini-4') },
  { id: 'sec-ini-4b', grado_id: 'grd-ini-4', letra: 'B', capacidad_maxima: 22, grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-ini-4') },
  { id: 'sec-ini-5a', grado_id: 'grd-ini-5', letra: 'A', capacidad_maxima: 25, grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-ini-5') },
  { id: 'sec-ini-5b', grado_id: 'grd-ini-5', letra: 'B', capacidad_maxima: 25, grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-ini-5') },
  // Primaria
  { id: 'sec-1pri-a', grado_id: 'grd-pri-1', letra: 'A', capacidad_maxima: 30, grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-pri-1') },
  { id: 'sec-1pri-b', grado_id: 'grd-pri-1', letra: 'B', capacidad_maxima: 30, grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-pri-1') },
  { id: 'sec-2pri-a', grado_id: 'grd-pri-2', letra: 'A', capacidad_maxima: 30, grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-pri-2') },
  { id: 'sec-2pri-b', grado_id: 'grd-pri-2', letra: 'B', capacidad_maxima: 30, grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-pri-2') },
  { id: 'sec-3pri-a', grado_id: 'grd-pri-3', letra: 'A', capacidad_maxima: 30, grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-pri-3') },
  { id: 'sec-3pri-b', grado_id: 'grd-pri-3', letra: 'B', capacidad_maxima: 30, grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-pri-3') },
  { id: 'sec-4pri-a', grado_id: 'grd-pri-4', letra: 'A', capacidad_maxima: 30, grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-pri-4') },
  { id: 'sec-4pri-b', grado_id: 'grd-pri-4', letra: 'B', capacidad_maxima: 30, grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-pri-4') },
  { id: 'sec-5pri-a', grado_id: 'grd-pri-5', letra: 'A', capacidad_maxima: 30, grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-pri-5') },
  { id: 'sec-5pri-b', grado_id: 'grd-pri-5', letra: 'B', capacidad_maxima: 30, grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-pri-5') },
  { id: 'sec-6pri-a', grado_id: 'grd-pri-6', letra: 'A', capacidad_maxima: 30, grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-pri-6') },
  { id: 'sec-6pri-b', grado_id: 'grd-pri-6', letra: 'B', capacidad_maxima: 30, grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-pri-6') },
  // Secundaria
  { id: 'sec-1sec-a', grado_id: 'grd-sec-1', letra: 'A', capacidad_maxima: 32, grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-sec-1') },
  { id: 'sec-1sec-b', grado_id: 'grd-sec-1', letra: 'B', capacidad_maxima: 32, grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-sec-1') },
  { id: 'sec-2sec-a', grado_id: 'grd-sec-2', letra: 'A', capacidad_maxima: 32, grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-sec-2') },
  { id: 'sec-2sec-b', grado_id: 'grd-sec-2', letra: 'B', capacidad_maxima: 32, grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-sec-2') },
  { id: 'sec-3sec-a', grado_id: 'grd-sec-3', letra: 'A', capacidad_maxima: 32, grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-sec-3') },
  { id: 'sec-3sec-b', grado_id: 'grd-sec-3', letra: 'B', capacidad_maxima: 32, grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-sec-3') },
  { id: 'sec-4sec-a', grado_id: 'grd-sec-4', letra: 'A', capacidad_maxima: 32, grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-sec-4') },
  { id: 'sec-4sec-b', grado_id: 'grd-sec-4', letra: 'B', capacidad_maxima: 32, grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-sec-4') },
  { id: 'sec-5sec-a', grado_id: 'grd-sec-5', letra: 'A', capacidad_maxima: 32, grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-sec-5') },
  { id: 'sec-5sec-b', grado_id: 'grd-sec-5', letra: 'B', capacidad_maxima: 32, grado: MOCK_GRADE_LEVELS.find(g => g.id === 'grd-sec-5') },
];

// Competencias oficiales CNEB
export const MOCK_COMPETENCIES: Competency[] = [
  // Matemática
  {
    id: 'comp-mat-1',
    curso_id: 'course-mat',
    codigo: 'C1',
    descripcion: 'Resuelve problemas de cantidad',
    orden: 1,
  },
  {
    id: 'comp-mat-2',
    curso_id: 'course-mat',
    codigo: 'C2',
    descripcion: 'Resuelve problemas de regularidad, equivalencia y cambio',
    orden: 2,
  },
  {
    id: 'comp-mat-3',
    curso_id: 'course-mat',
    codigo: 'C3',
    descripcion: 'Resuelve problemas de forma, movimiento y localización',
    orden: 3,
  },
  {
    id: 'comp-mat-4',
    curso_id: 'course-mat',
    codigo: 'C4',
    descripcion: 'Resuelve problemas de gestión de datos e incertidumbre',
    orden: 4,
  },
  // Comunicación
  {
    id: 'comp-com-1',
    curso_id: 'course-com',
    codigo: 'C1',
    descripcion: 'Se comunica oralmente en su lengua materna',
    orden: 1,
  },
  {
    id: 'comp-com-2',
    curso_id: 'course-com',
    codigo: 'C2',
    descripcion: 'Lee diversos tipos de textos escritos en su lengua materna',
    orden: 2,
  },
  {
    id: 'comp-com-3',
    curso_id: 'course-com',
    codigo: 'C3',
    descripcion: 'Escribe diversos tipos de textos en su lengua materna',
    orden: 3,
  },
  // Ciencia y Tecnología
  {
    id: 'comp-cyt-1',
    curso_id: 'course-cyt',
    codigo: 'C1',
    descripcion: 'Indaga mediante métodos científicos para construir sus conocimientos',
    orden: 1,
  },
  {
    id: 'comp-cyt-2',
    curso_id: 'course-cyt',
    codigo: 'C2',
    descripcion: 'Explica el mundo físico basándose en conocimientos sobre seres vivos, materia y energía',
    orden: 2,
  },
  {
    id: 'comp-cyt-3',
    curso_id: 'course-cyt',
    codigo: 'C3',
    descripcion: 'Diseña y construye soluciones tecnológicas para resolver problemas de su entorno',
    orden: 3,
  },
  // Personal Social / CCSS
  {
    id: 'comp-ps-1',
    curso_id: 'course-ps',
    codigo: 'C1',
    descripcion: 'Construye su identidad',
    orden: 1,
  },
  {
    id: 'comp-ps-2',
    curso_id: 'course-ps',
    codigo: 'C2',
    descripcion: 'Convive y participa democráticamente en la búsqueda del bien común',
    orden: 2,
  },
  // Inglés
  {
    id: 'comp-ing-1',
    curso_id: 'course-ing',
    codigo: 'C1',
    descripcion: 'Se comunica oralmente en inglés como lengua extranjera',
    orden: 1,
  },
  {
    id: 'comp-ing-2',
    curso_id: 'course-ing',
    codigo: 'C2',
    descripcion: 'Lee diversos tipos de textos en inglés como lengua extranjera',
    orden: 2,
  },
  {
    id: 'comp-ing-3',
    curso_id: 'course-ing',
    codigo: 'C3',
    descripcion: 'Escribe diversos tipos de textos en inglés como lengua extranjera',
    orden: 3,
  },
];

export const MINEDU_COMPETENCIES: Competency[] = MOCK_COMPETENCIES;

export const MOCK_COURSES: Course[] = [
  {
    id: 'course-mat',
    nombre: 'Matemática',
    codigo: 'MAT',
    nivel: 'primaria',
    color: '#4f46e5',
    color_hex: '#4f46e5',
    competencias: MOCK_COMPETENCIES.filter(c => c.curso_id === 'course-mat'),
  },
  {
    id: 'course-com',
    nombre: 'Comunicación',
    codigo: 'COM',
    nivel: 'primaria',
    color: '#0891b2',
    color_hex: '#0891b2',
    competencias: MOCK_COMPETENCIES.filter(c => c.curso_id === 'course-com'),
  },
  {
    id: 'course-cyt',
    nombre: 'Ciencia y Tecnología',
    codigo: 'CYT',
    nivel: 'primaria',
    color: '#059669',
    color_hex: '#059669',
    competencias: MOCK_COMPETENCIES.filter(c => c.curso_id === 'course-cyt'),
  },
  {
    id: 'course-ps',
    nombre: 'Personal Social / CCSS',
    codigo: 'PS',
    nivel: 'primaria',
    color: '#d97706',
    color_hex: '#d97706',
    competencias: MOCK_COMPETENCIES.filter(c => c.curso_id === 'course-ps'),
  },
  {
    id: 'course-ing',
    nombre: 'Inglés',
    codigo: 'ING',
    nivel: 'primaria',
    color: '#7c3aed',
    color_hex: '#7c3aed',
    competencias: MOCK_COMPETENCIES.filter(c => c.curso_id === 'course-ing'),
  },
  {
    id: 'course-art',
    nombre: 'Arte y Cultura',
    codigo: 'ART',
    nivel: 'primaria',
    color: '#db2777',
    color_hex: '#db2777',
    competencias: [],
  },
  {
    id: 'course-ef',
    nombre: 'Educación Física',
    codigo: 'EF',
    nivel: 'primaria',
    color: '#ea580c',
    color_hex: '#ea580c',
    competencias: [],
  },
  {
    id: 'course-rel',
    nombre: 'Educación Religiosa',
    codigo: 'REL',
    nivel: 'primaria',
    color: '#ca8a04',
    color_hex: '#ca8a04',
    competencias: [],
  },
];

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
export const MOCK_LMS_MODULES: LMSModule[] = [];
export const MOCK_SYSTEM_ALERTS: SystemAlert[] = [];
export const MOCK_AUDIT_LOGS: AuditLogEntry[] = [];
