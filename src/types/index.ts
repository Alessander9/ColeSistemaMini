export type UserRole = 'admin' | 'docente' | 'estudiante' | 'apoderado' | 'asistencia';

export type EducationalLevel = 'inicial' | 'primaria' | 'secundaria';

export type GradeLetter = 'AD' | 'A' | 'B' | 'C';

export type AttendanceStatus = 'presente' | 'tardanza' | 'falta' | 'justificado';

export type AttendanceMethod = 'qr' | 'manual';

export interface AcademicContextState {
  institucion: string;
  anio: number;
  nivel: EducationalLevel | 'todos';
  gradoId?: string;
  seccionId?: string;
  periodoId?: string;
}

export interface ChildProfile {
  id: string;
  estudiante_id: string;
  nombre: string;
  apellidos: string;
  nivel: EducationalLevel;
  grado_nombre: string;
  seccion_letra: string;
  avatar_url?: string;
  promedio_letra?: GradeLetter;
  promedio_score?: number;
  asistencia_porcentaje: number;
  tareas_pendientes: number;
  proximas_evaluaciones?: number;
  tutor_nombre?: string;
  tutor_email?: string;
  tutor_avatar?: string;
}

export interface ParentProfile {
  id: string;
  user_id: string;
  nombres: string;
  apellidos: string;
  dni: string;
  email: string;
  telefono: string;
  direccion?: string;
  ocupacion?: string;
  hijos_ids: string[]; // estudiante_id array
}

export interface UserProfile {
  id: string;
  rol: UserRole;
  nombres: string;
  apellidos: string;
  dni: string;
  email?: string;
  username?: string;
  password?: string;
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
  aula?: string;
}

export interface Student {
  id: string;
  profile_id: string;
  codigo_estudiante: string;
  nombres?: string;
  apellidos?: string;
  dni?: string;
  fecha_nacimiento?: string;
  genero?: string;
  direccion?: string;
  nombre_apoderado?: string;
  telefono_apoderado?: string;
  email_apoderado?: string;
  token_qr: string;
  profile?: UserProfile;
}

export interface EnrollmentDocument {
  id: string;
  nombre: string;
  entregado: boolean;
  fecha_entrega?: string;
  archivo_url?: string;
}

export interface Enrollment {
  id: string;
  estudiante_id: string;
  periodo_id: string;
  seccion_id: string;
  fecha_matricula: string;
  estado: 'activo' | 'retirado' | 'trasladado';
  observaciones?: string;
  documentos_entregados?: string[];
  estudiante?: Student;
  seccion?: Section;
  periodo?: AcademicPeriod;
}

export interface Course {
  id: string;
  nombre: string;
  codigo: string;
  nivel: EducationalLevel;
  color?: string;
  color_hex?: string;
  area_curricular?: string;
  horas_semanales_sugeridas?: number;
  descripcion?: string;
  activo?: boolean;
  created_at?: string;
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
  activo?: boolean;
}

export interface AttendanceRecord {
  id: string;
  matricula_id: string;
  fecha: string;
  hora_registro: string;
  estado: AttendanceStatus;
  metodo: AttendanceMethod;
  tipo_registro?: 'ingreso' | 'salida' | 'inasistencia';
  dispositivo?: string;
  ubicacion?: string;
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
// TAREAS, EVALUACIONES Y NOTIFICACIONES
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
  enlaces?: string[];
  estado?: 'borrador' | 'publicada' | 'cerrada';
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
  archivo_nombre?: string;
  archivo_tamano?: string;
  enlace_entrega?: string;
  comentario_estudiante?: string;
  calificacion_letra?: GradeLetter;
  calificacion_numerica?: number;
  retroalimentacion_docente?: string;
  estado?: 'entregado' | 'calificado' | 'retrasado' | 'pendiente';
  tarea?: TaskAssignment;
}

export interface EvaluationExam {
  id: string;
  curso_id: string;
  seccion_id: string;
  periodo_evaluacion_id: string;
  competencia_id?: string;
  titulo: string;
  tipo: 'examen' | 'practica' | 'bimestral' | 'actividad' | 'proyecto';
  descripcion?: string;
  fecha_programada: string;
  hora_inicio?: string;
  duracion_minutos: number;
  ponderacion: number;
  instrucciones?: string;
  archivo_adjunto?: string;
  rubrica_criterios?: {
    criterio: string;
    nivelAD?: string;
    nivelA?: string;
    nivelB?: string;
    nivelC?: string;
  }[];
  estado?: 'borrador' | 'programada' | 'activa' | 'finalizada' | 'calificada';
  curso?: Course;
  competencia?: Competency;
}

export interface AppNotification {
  id: string;
  user_id: string;
  categoria?: 'academico' | 'tarea' | 'evaluacion' | 'asistencia' | 'institucional';
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

// -------------------------------------------------------------
// LMS (AULA VIRTUAL Y MÓDULOS DE APRENDIZAJE)
// -------------------------------------------------------------

export interface LMSContentItem {
  id: string;
  modulo_id: string;
  titulo: string;
  tipo: 'video' | 'lectura' | 'documento' | 'tarea' | 'cuestionario';
  duracion_estimada: string;
  url?: string;
  orden: number;
}

export interface LMSModule {
  id: string;
  curso_id: string;
  seccion_id?: string;
  titulo: string;
  descripcion: string;
  orden: number;
  contenidos: LMSContentItem[];
}

export interface LMSStudentProgress {
  matricula_id: string;
  curso_id: string;
  contenido_id: string;
  completado: boolean;
  fecha_completado?: string;
}

// -------------------------------------------------------------
// CENTRO DE ALERTAS Y AUDITORÍA
// -------------------------------------------------------------

export interface SystemAlert {
  id: string;
  prioridad: 'critica' | 'alta' | 'media' | 'baja';
  categoria: 'academico' | 'asistencia' | 'tareas' | 'notas' | 'sistema';
  titulo: string;
  descripcion: string;
  nivel?: EducationalLevel;
  grado_id?: string;
  seccion_id?: string;
  estudiante_id?: string;
  estado: 'nueva' | 'en_revision' | 'resuelta';
  accion_label: string;
  accion_url: string;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  usuario_id: string;
  usuario_nombre: string;
  rol: UserRole;
  accion: string;
  modulo: string;
  detalle: string;
  valor_anterior?: string;
  valor_nuevo?: string;
  timestamp: string;
  ip?: string;
}

export interface OnboardingStep {
  id: number;
  titulo: string;
  descripcion: string;
  completado: boolean;
}

export interface SitemapUrlEntry {
  url: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
  lastmod?: string;
}

export interface SystemBrandingConfig {
  nombreInstitucion: string;
  siglas: string;
  slogan: string;
  descripcion: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  themePreset: string;
  borderRadius: string;
  fontFamily: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogImageUrl: string;
  canonicalUrl: string;
  twitterHandle: string;
  contactoEmail: string;
  telefono: string;
  direccion: string;
  allowRobotsIndex: boolean;
  allowRobotsFollow: boolean;
  disallowedPaths: string[];
  customRobotsTxt: string;
  sitemapIncludedPaths: SitemapUrlEntry[];
  
  // ── Documentos Oficiales & Sello Digital ──
  codigoModular: string;
  ugel: string;
  dre: string;
  ruc: string;
  directorNombre: string;
  directorFirmaUrl: string;
  mostrarMembreteEnPdf: boolean;
  watermarkUrl: string;
  watermarkOpacity: number;
  documentSecurityFooterText: string;

  // ── Diseñador de Carnet Escolar QR ──
  carnetColorBorde: string;
  carnetFondoUrl: string;
  carnetOrientacion: 'vertical' | 'horizontal';
  carnetFranjaNivelColor: string;
  carnetReversoNormas: string;
  carnetReversoEmergencia: string;
  carnetReversoTelefono: string;
  carnetSelloHolografico: boolean;

  // ── UI Global & Estilos del Sistema ──
  borderRadiusMode: 'sharp' | 'modern' | 'rounded';
  sidebarStyle: 'dark' | 'gradient' | 'glass';
  defaultTheme: 'system' | 'light' | 'dark';
  splashScreenActivo: boolean;
  splashScreenTexto: string;

  // ── Diplomas & Certificados de Honor ──
  diplomaBordeEstilo: 'oro_clasico' | 'azul_imperial' | 'moderno_geometrico';
  diplomaFirmaDirector: boolean;
  diplomaFirmaTutor: boolean;
  diplomaTextoPredeterminado: string;

  // ── Sonido Institucional del Kiosco QR ──
  kioskSoundPreset: 'bell' | 'chime' | 'arpeggio' | 'voice';

  // ── Pantalla de Login & White-Label ──
  loginBannerUrl: string;
  loginBienvenidaTitulo: string;
  loginBienvenidaMensaje: string;
  mostrarPoweredBy: boolean;
  whiteLabelFooterTexto: string;

  // ── PWA & Canales de Soporte (WhatsApp / Analytics) ──
  pwaShortName: string;
  pwaThemeColor: string;
  whatsappSoporteNumero: string;
  whatsappSoporteMensaje: string;
  mostrarWhatsappFlotante: boolean;
  googleAnalyticsId: string;
  metaPixelId: string;

  // ── BREVO (Exclusivo: Asistencias Diarias en Tiempo Real) ──
  brevoApiKey: string;
  brevoSenderEmail: string;
  brevoSenderName: string;
  brevoActivarEnvioAsistencia: boolean;
  brevoPlantillaAsunto: string;

  // ── RESEND (Exclusivo: Libretas Bimestrales, Matrícula & Tesorería) ──
  resendApiKey: string;
  resendSenderEmail: string;
  resendSenderName: string;
  resendPlantillaLibretaAsunto: string;
  resendPlantillaBienvenidaAsunto: string;
  resendPlantillaPensionAsunto: string;

  updatedAt?: string;
}

// -------------------------------------------------------------
// ANECDOTARIO / CUADERNO DE CONTROL CONDUCTUAL
// -------------------------------------------------------------

export interface BehaviorLogEntry {
  id: string;
  matricula_id: string;
  estudiante_id?: string;
  fecha: string;
  tipo: 'merito' | 'demerito' | 'felicitacion' | 'observacion' | 'citacion';
  titulo: string;
  descripcion: string;
  docente_id?: string;
  docente_nombre?: string;
  autor_nombre?: string;
  visible_apoderado: boolean;
  created_at?: string;
}

// -------------------------------------------------------------
// TESORERÍA, PENSIONES Y PAGOS
// -------------------------------------------------------------

export interface PaymentRecord {
  id: string;
  matricula_id: string;
  estudiante_id: string;
  mes: string; // "Marzo", "Abril", etc.
  concepto: string; // "Pensión Marzo", "Matrícula 2025"
  monto: number;
  mora: number;
  total: number;
  fecha_vencimiento: string;
  fecha_pago?: string;
  metodo_pago?: 'efectivo' | 'transferencia' | 'yape' | 'plin' | 'tarjeta';
  numero_operacion?: string;
  estado: 'pendiente' | 'pagado' | 'vencido' | 'anulado';
  comprobante_url?: string;
  created_at: string;
  estudiante?: Student;
  matricula?: Enrollment;
}

export interface FeeSchedule {
  id: string;
  periodo_id: string;
  nivel: EducationalLevel;
  concepto: string;
  monto_base: number;
  fecha_vencimiento: string;
}

// -------------------------------------------------------------
// COMUNICADOS Y CIRCULARES INSTITUCIONALES (MINEDU / UGEL)
// -------------------------------------------------------------

export interface Announcement {
  id: string;
  titulo: string;
  contenido: string;
  remitente_nombre: string;
  remitente_rol: UserRole;
  destinatarios_rol?: UserRole | 'todos';
  nivel_destinatario: EducationalLevel | 'todos';
  nivel?: EducationalLevel | 'todos';
  tipo?: 'comunicado' | 'citacion' | 'urgente';
  grado_id?: string;
  seccion_id?: string;
  fecha_publicacion: string;
  fecha_expiracion?: string;
  es_urgente: boolean;
  categoria: 'general' | 'academico' | 'urgente' | 'evento' | 'administrativo' | 'citacion';
  requiere_confirmacion?: boolean;
  confirmado_por?: string[]; // user_ids que han confirmado asistencia/recepción
  canales?: ('sistema' | 'email' | 'whatsapp')[];
  fecha_citacion?: string;
  hora_citacion?: string;
  lugar_citacion?: string;
  enlace_reunion?: string;
  adjuntos?: string[];
  leido_por?: string[]; // user_ids que han leído
  creado_en: string;
}

// -------------------------------------------------------------
// CALENDARIO ESCOLAR INSTITUCIONAL / MINEDU
// -------------------------------------------------------------

export type CalendarEventType = 
  | 'inicio_bimestre'
  | 'fin_bimestre'
  | 'evaluaciones'
  | 'vacaciones'
  | 'feriado'
  | 'capacitacion'
  | 'actividad_cultural'
  | 'reunion_apoderados';

export interface SchoolCalendarEvent {
  id: string;
  titulo: string;
  descripcion?: string;
  fecha_inicio: string;
  fecha_fin: string;
  tipo: CalendarEventType;
  nivel: EducationalLevel | 'todos';
  es_laborable: boolean;
  color?: string;
}

// -------------------------------------------------------------
// RECUPERACIÓN PEDAGÓGICA Y SUBSANACIÓN (CNEB)
// -------------------------------------------------------------

export interface SubsanacionRecord {
  id: string;
  matricula_id: string;
  estudiante_id: string;
  curso_id: string;
  periodo_id: string;
  nota_original: GradeLetter;
  nota_subsanacion?: GradeLetter;
  fecha_evaluacion: string;
  docente_evaluador_id?: string;
  observaciones?: string;
  estado: 'pendiente' | 'aprobado' | 'desaprobado';
}

// -------------------------------------------------------------
// JUSTIFICACIONES DE INASISTENCIA / TARDANZA (FAMILIA ↔ TUTOR)
// -------------------------------------------------------------

export interface JustificationRequest {
  id: string;
  matricula_id: string;
  estudiante_id: string;
  apoderado_id?: string;
  apoderado_nombre?: string;
  fecha: string;
  tipo: 'falta' | 'tardanza';
  motivo: string;
  documento_url?: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  respuesta_colegio?: string;
  revisado_por?: string;
  created_at: string;
}

// -------------------------------------------------------------
// CONTROL DE ASISTENCIA DE PERSONAL DOCENTE Y ADMINISTRATIVO
// -------------------------------------------------------------

export interface StaffAttendanceRecord {
  id: string;
  user_id: string;
  fecha: string;
  hora_ingreso?: string;
  hora_salida?: string;
  tipo: 'entrada' | 'salida';
  estado: 'puntual' | 'tardanza' | 'falta' | 'justificado';
  metodo: 'qr' | 'manual';
  creado_en: string;
}

export * from './sesiones';

