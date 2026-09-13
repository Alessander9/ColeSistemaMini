export type UserRole = 'admin' | 'docente' | 'estudiante' | 'asistencia';

export type EducationalLevel = 'primaria' | 'secundaria';

export type GradeLetter = 'AD' | 'A' | 'B' | 'C';

export type AttendanceStatus = 'presente' | 'tardanza' | 'falta' | 'justificado';

export type AttendanceMethod = 'qr' | 'manual';

export interface UserProfile {
  id: string;
  rol: UserRole;
  nombres: string;
  apellidos: string;
  dni: string;
  email?: string;
  telefono?: string;
  avatar_url?: string;
  especialidad?: string;
  cargo?: string;
  activo: boolean;
}

export interface AcademicPeriod {
  id: string;
  nombre: string;
  anio: number;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
}

export interface GradeLevel {
  id: string;
  nivel: EducationalLevel;
  nombre: string;
  numero_grado: number;
}

export interface Section {
  id: string;
  grado_id: string;
  letra: string;
  capacidad_maxima: number;
  tutor_id?: string;
  grado?: GradeLevel;
}

export interface Student {
  id: string;
  profile_id: string;
  codigo_estudiante: string;
  fecha_nacimiento?: string;
  genero?: string;
  direccion?: string;
  nombre_apoderado?: string;
  telefono_apoderado?: string;
  email_apoderado?: string;
  token_qr: string;
  profile?: UserProfile;
}

export interface Enrollment {
  id: string;
  estudiante_id: string;
  periodo_id: string;
  seccion_id: string;
  fecha_matricula: string;
  estado: 'activo' | 'retirado' | 'trasladado';
  observaciones?: string;
  estudiante?: Student;
  seccion?: Section;
  periodo?: AcademicPeriod;
}

export interface Course {
  id: string;
  nombre: string;
  codigo: string;
  nivel: EducationalLevel;
  color_hex?: string;
  competencias?: Competency[];
}

export interface Competency {
  id: string;
  curso_id: string;
  orden: number;
  codigo: string;
  descripcion: string;
}

export interface EvaluationPeriod {
  id: string;
  periodo_academico_id: string;
  numero_periodo: number; // 1, 2, 3, 4
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  cerrado: boolean;
}

export interface AttendanceRecord {
  id: string;
  matricula_id: string;
  fecha: string;
  hora_registro: string;
  estado: AttendanceStatus;
  metodo: AttendanceMethod;
  observacion?: string;
  registrado_por?: string;
  matricula?: Enrollment;
}

export interface GradeRecord {
  id: string;
  matricula_id: string;
  competencia_id: string;
  periodo_evaluacion_id: string;
  nota_letra: GradeLetter;
  nota_numerica: number;
  conclusion_descriptiva?: string;
  modificado_por?: string;
  created_at?: string;
  updated_at?: string;
  competencia?: Competency;
}

// -------------------------------------------------------------
// NUEVOS TIPOS: TAREAS, EVALUACIONES Y NOTIFICACIONES
// -------------------------------------------------------------

export interface TaskAssignment {
  id: string;
  curso_id: string;
  seccion_id: string;
  docente_id: string;
  competencia_id?: string;
  titulo: string;
  descripcion: string;
  fecha_limite: string;
  archivo_url?: string;
  created_at?: string;
  curso?: Course;
  competencia?: Competency;
}

export interface TaskSubmission {
  id: string;
  tarea_id: string;
  matricula_id: string;
  fecha_entrega: string;
  archivo_url?: string;
  comentario_estudiante?: string;
  calificacion_letra?: GradeLetter;
  retroalimentacion_docente?: string;
  tarea?: TaskAssignment;
}

export interface EvaluationExam {
  id: string;
  curso_id: string;
  seccion_id: string;
  periodo_evaluacion_id: string;
  competencia_id: string;
  titulo: string;
  tipo: 'examen' | 'practica' | 'proyecto';
  fecha_programada: string;
  hora_inicio?: string;
  duracion_minutos: number;
  ponderacion: number;
  curso?: Course;
  competencia?: Competency;
}

export interface AppNotification {
  id: string;
  user_id: string;
  tipo: 'asistencia' | 'tarea' | 'nota' | 'comunicado';
  titulo: string;
  mensaje: string;
  leido: boolean;
  url_redireccion?: string;
  created_at: string;
}

// -------------------------------------------------------------
// ASIGNACIÓN DE MATERIAS, PROFESORES Y HORARIOS POR SALÓN
// -------------------------------------------------------------

export interface SectionCourseAssignment {
  id: string;
  seccion_id: string;
  curso_id: string;
  docente_id: string;
  horas_semanales?: number;
  aula_defecto?: string;
  seccion?: Section;
  curso?: Course;
  docente?: UserProfile;
}

export type DayOfWeek = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes';

export interface ScheduleSlot {
  id: string;
  seccion_id: string;
  curso_id: string;
  docente_id: string;
  dia: DayOfWeek;
  hora_inicio: string; // "08:00"
  hora_fin: string;    // "08:45"
  aula?: string;       // "Aula 301"
  seccion?: Section;
  curso?: Course;
  docente?: UserProfile;
}

export interface ClassSessionLog {
  id: string;
  slot_id: string;
  seccion_id: string;
  curso_id: string;
  docente_id: string;
  fecha: string;
  tema_tratado: string;
  observaciones?: string;
  asistencia_tomada: boolean;
  alumnos_ausentes?: string[]; // IDs de matricula
  created_at: string;
  curso?: Course;
  seccion?: Section;
}

export interface ScheduleConflict {
  hasConflict: boolean;
  conflictingSlot?: ScheduleSlot;
  message?: string;
}

export interface ToastMessage {
  id: string;
  tipo: 'success' | 'error' | 'info' | 'warning';
  titulo?: string;
  mensaje: string;
  duracionMs?: number;
}


