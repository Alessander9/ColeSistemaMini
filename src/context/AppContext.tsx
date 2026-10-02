'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import RootLoading from '@/app/loading';
import { 
  UserProfile, 
  Student, 
  Enrollment, 
  AttendanceRecord, 
  GradeRecord, 
  GradeLetter, 
  AttendanceStatus, 
  UserRole, 
  Course, 
  Competency,
  Section, 
  GradeLevel, 
  EvaluationPeriod, 
  TaskAssignment, 
  TaskSubmission, 
  EvaluationExam, 
  AppNotification,
  SectionCourseAssignment,
  ScheduleSlot,
  DayOfWeek,
  ClassSessionLog,
  ScheduleConflict,
  ToastMessage,
  EducationalLevel,
  AcademicContextState,
  ChildProfile,
  ParentProfile,
  LMSModule,
  LMSStudentProgress,
  SystemAlert,
  AuditLogEntry,
  SystemBrandingConfig,
  EnrollmentDocument,
  BehaviorLogEntry,
  PaymentRecord,
  Announcement,
  SchoolCalendarEvent,
  SubsanacionRecord,
  JustificationRequest,
  StaffAttendanceRecord
} from '@/types';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { 
  getStoredBranding, 
  saveStoredBranding, 
  resetStoredBranding, 
  applyBrandingToDOM, 
  DEFAULT_BRANDING_CONFIG 
} from '@/lib/services/brandingService';
import { sendBrevoAttendanceEmail } from '@/lib/services/brevoService';
import { 
  MOCK_USERS, 
  MOCK_STUDENTS, 
  MOCK_ENROLLMENTS, 
  MOCK_ATTENDANCES, 
  MOCK_GRADE_RECORDS, 
  MOCK_COURSES, 
  MOCK_SECTIONS, 
  MOCK_GRADES, 
  MOCK_EVALUATION_PERIODS, 
  MOCK_PERIOD, 
  MOCK_TASKS, 
  MOCK_SUBMISSIONS, 
  MOCK_EXAMS, 
  MOCK_NOTIFICATIONS,
  MOCK_SECTION_COURSES,
  MOCK_SCHEDULE_SLOTS,
  MOCK_CLASS_SESSIONS,
  MOCK_CHILDREN,
  MOCK_PARENTS,
  MOCK_LMS_MODULES,
  MOCK_SYSTEM_ALERTS,
  MOCK_AUDIT_LOGS,
  MOCK_PAYMENTS,
  MOCK_BEHAVIOR_LOGS,
  MOCK_ANNOUNCEMENTS,
  MOCK_CALENDAR_EVENTS,
  MOCK_SUBSANACIONES,
  MOCK_JUSTIFICATIONS,
  MOCK_STAFF_ATTENDANCES
} from '@/lib/mock-data';
import { getOfficialCnebCoursesAndCompetencies } from '@/lib/cneb/officialCurriculum';
import * as academicService from '@/lib/services/academicService';
import * as attendanceService from '@/lib/services/attendanceService';
import * as scheduleService from '@/lib/services/scheduleService';
import * as tasksService from '@/lib/services/tasksService';
import * as notificationsService from '@/lib/services/notificationsService';
import { logoutUser } from '@/lib/services/authService';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { pushToast, removeToast as removeToastFromStore } from '@/lib/toastStore';
import { findStudentByQr } from '@/lib/attendance/qrMatcher';
import { gradeToNumber } from '@/lib/grades/calculations';
import { generateStudentPassword, generateStudentEmail, generateStudentUsername } from '@/lib/auth/generateCredentials';

interface AppContextType {
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  switchRole: (role: UserRole) => void;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  logout: () => Promise<void>;

  // ── Contexto Académico Institucional (Inicial, Primaria, Secundaria) ──
  academicContext: AcademicContextState;
  setAcademicContext: (ctx: Partial<AcademicContextState>) => void;
  setAcademicLevel: (level: EducationalLevel | 'todos') => void;
  setAcademicGrade: (gradeId?: string) => void;
  setAcademicSection: (sectionId?: string) => void;
  
  showToast: (mensaje: string, tipo?: 'success' | 'error' | 'info' | 'warning', titulo?: string, duracionMs?: number) => void;
  removeToast: (id: string) => void;

  users: UserProfile[];
  addUser: (data: {
    nombres: string;
    apellidos: string;
    dni: string;
    rol: UserRole;
    email?: string;
    username?: string;
    password?: string;
    telefono?: string;
    especialidad?: string;
    cargo?: string;
    avatar_url?: string;
    activo?: boolean;
  }) => { user: UserProfile; credentials: { username: string; password: string; email: string } };
  updateUserRole: (userId: string, newRole: UserRole) => void;
  toggleUserStatus: (userId: string) => void;
  deleteUser: (userId: string) => void;

  students: Student[];
  teachers: UserProfile[];
  enrollments: Enrollment[];
  courses: Course[];
  addCourse: (data: {
    nombre: string;
    codigo: string;
    nivel: EducationalLevel;
    color?: string;
    color_hex?: string;
    area_curricular?: string;
    horas_semanales_sugeridas?: number;
    descripcion?: string;
    competencias?: { codigo: string; descripcion: string }[];
    assignTo?: { docenteId: string; seccionId: string; horasSemanales?: number; aulaDefecto?: string }[];
  }) => Course;
  updateCourse: (
    courseId: string,
    data: Omit<Partial<Course>, 'competencias'> & { competencias?: { codigo: string; descripcion: string; id?: string }[] }
  ) => void;
  deleteCourse: (courseId: string) => void;
  preloadOfficialCnebCurriculum: (level?: EducationalLevel) => { addedCourses: number; addedCompetencies: number };
  
  // ── Secciones y Aulas ──
  sections: Section[];
  addSection: (data: { gradoId: string; letra: string; capacidadMaxima?: number; aula?: string; tutorId?: string }) => Section;
  updateSection: (sectionId: string, data: Partial<Section>) => void;
  deleteSection: (sectionId: string) => void;
  assignSectionTutor: (sectionId: string, docenteId?: string) => void;
  gradeLevels: GradeLevel[];

  // ── Periodos de Evaluación y Cierre ──
  evaluationPeriods: EvaluationPeriod[];
  updateEvaluationPeriod: (periodId: string, data: Partial<EvaluationPeriod>) => void;
  toggleClosePeriod: (periodId: string) => void;

  // ── Anecdotario Conductual ──
  behaviorLogs: BehaviorLogEntry[];
  addBehaviorLog: (log: Omit<BehaviorLogEntry, 'id' | 'created_at'>) => BehaviorLogEntry;
  deleteBehaviorLog: (id: string) => void;

  // ── Tesorería y Pensiones ──
  payments: PaymentRecord[];
  addPayment: (payment: Omit<PaymentRecord, 'id' | 'created_at'>) => PaymentRecord;
  updatePaymentStatus: (paymentId: string, estado: 'pendiente' | 'pagado' | 'vencido' | 'anulado', extra?: { metodo_pago?: PaymentRecord['metodo_pago']; numero_operacion?: string; fecha_pago?: string }) => void;
  generateMonthlyFeeRecords: (mes: string, fechaVencimiento: string, montos?: number | { inicial?: number; primaria?: number; secundaria?: number }) => number;

  // ── Promoción Masiva y Matrícula ──
  promoteStudentsMassive: (params: { originSectionId: string; targetSectionId: string; targetPeriodId: string; studentIds: string[] }) => { promotedCount: number };
  updateEnrollmentDocuments: (enrollmentId: string, docs: string[]) => void;
  justifyAttendance: (attendanceId: string, motivo: string, observacion?: string) => void;

  // ── Portal de Apoderados ──
  childrenList: ChildProfile[];
  selectedChildId: string;
  setSelectedChildId: (id: string) => void;
  selectedChild: ChildProfile | undefined;
  parentsList: ParentProfile[];

  // ── LMS: Módulos & Progreso ──
  lmsModules: LMSModule[];
  lmsProgress: LMSStudentProgress[];
  completeLMSContent: (matriculaId: string, cursoId: string, contenidoId: string) => void;

  // ── Centro de Alertas ──
  alerts: SystemAlert[];
  resolveAlert: (alertId: string) => void;
  addAlert: (alert: Omit<SystemAlert, 'id' | 'created_at' | 'estado'>) => void;

  // ── Registro de Auditoría ──
  auditLogs: AuditLogEntry[];
  addAuditLog: (log: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void;

  // ── Command Palette & Onboarding ──
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  onboardingCompleted: boolean;
  setOnboardingCompleted: (completed: boolean) => void;

  // ── Sidebar Collapse / Expand State ──
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsedState: (collapsed: boolean) => void;

  // ── Branding & Personalización Institucional (Logo, Nombre, Colores, SEO, Robots) ──
  brandingConfig: SystemBrandingConfig;
  updateBrandingConfig: (newConfig: Partial<SystemBrandingConfig>) => void;
  resetBrandingConfig: () => void;

  // ── Asistencia Rápida Docente ──
  saveClassAttendanceQuickly: (
    seccionId: string,
    fecha: string,
    exceptions: { matriculaId: string; estado: AttendanceStatus; observacion?: string }[]
  ) => { success: boolean; totalMarked: number };
  addTeacher: (data: {
    nombres: string;
    apellidos: string;
    dni: string;
    email?: string;
    telefono?: string;
    especialidad?: string;
    avatar_url?: string;
  }) => { teacher: UserProfile; credentials: { username: string; password: string; email: string } };

  // ── Asignación de Materias y Docentes por Salón ──
  sectionCourses: SectionCourseAssignment[];
  assignCourseToSection: (params: {
    seccionId: string;
    cursoId: string;
    docenteId: string;
    horasSemanales?: number;
    aulaDefecto?: string;
  }) => SectionCourseAssignment;
  removeSectionCourse: (assignmentId: string) => void;
  updateSectionCourseTeacher: (assignmentId: string, newDocenteId: string) => void;

  // ── Horarios Escolares por Salón & Validación Anti-Cruce ──
  scheduleSlots: ScheduleSlot[];
  addScheduleSlot: (slot: {
    seccionId: string;
    cursoId: string;
    docenteId: string;
    dia: DayOfWeek;
    horaInicio: string;
    horaFin: string;
    aula?: string;
  }) => ScheduleSlot;
  removeScheduleSlot: (slotId: string) => void;
  checkTeacherConflict: (docenteId: string, dia: DayOfWeek, horaInicio: string, ignoreSlotId?: string) => ScheduleConflict;
  auditScheduleIntegrity: () => {
    totalSlots: number;
    conflictsCount: number;
    conflicts: { slotA: ScheduleSlot; slotB: ScheduleSlot }[];
  };

  // ── Helper Getters & Contexto Docente ──
  getSectionCourses: (seccionId: string) => SectionCourseAssignment[];
  getSectionSchedule: (seccionId: string) => ScheduleSlot[];
  getTeacherSchedule: (docenteId: string) => ScheduleSlot[];
  getTeacherSections: (docenteId: string) => { seccion: Section; cursos: Course[] }[];
  getCurrentOrNextClass: (docenteId: string) => {
    currentSlot?: ScheduleSlot;
    nextSlot?: ScheduleSlot;
    todaySlots: ScheduleSlot[];
  };

  // ── Bitácora de Sesiones de Clase & Asistencia por Hora ──
  classSessions: ClassSessionLog[];
  saveClassSessionLog: (data: {
    slotId: string;
    seccionId: string;
    cursoId: string;
    docenteId: string;
    temaTratado: string;
    observaciones?: string;
    ausentesMatriculaIds?: string[];
  }) => ClassSessionLog;
  
  attendances: AttendanceRecord[];
  registerAttendance: (params: {
    studentQrToken?: string;
    matriculaId?: string;
    status?: AttendanceStatus;
    observacion?: string;
    metodo: 'qr' | 'manual';
  }) => { success: boolean; message: string; duplicate?: boolean; record?: AttendanceRecord; studentName?: string };
  
  grades: GradeRecord[];
  updateGrade: (params: {
    matriculaId: string;
    competenciaId: string;
    periodoEvaluacionId: string;
    notaLetra: GradeLetter;
    conclusionDescriptiva?: string;
  }) => void;
  
  addStudent: (newStudentData: {
    nombres: string;
    apellidos: string;
    dni: string;
    fechaNacimiento: string;
    seccionId: string;
    nombreApoderado: string;
    telefonoApoderado: string;
    dniApoderado?: string;
    emailApoderado?: string;
    parentesco?: string;
    username?: string;
    password?: string;
    email?: string;
    parentPassword?: string;
    genero?: string;
    avatar_url?: string;
  }) => { 
    student: Student; 
    enrollment: Enrollment;
    credentials: { username: string; password: string; email: string };
    parentCredentials?: { username: string; password: string; email: string };
  };

  updateStudent: (studentId: string, updatedData: Partial<{
    nombres: string;
    apellidos: string;
    dni: string;
    fechaNacimiento: string;
    seccionId: string;
    nombreApoderado: string;
    telefonoApoderado: string;
    genero: string;
    avatar_url: string;
  }>) => void;

  deleteStudent: (studentId: string) => void;

  toggleStudentStatus: (studentId: string) => void;

  updateTeacher: (teacherId: string, updatedData: Partial<UserProfile>) => void;
  deleteTeacher: (teacherId: string) => void;
  toggleTeacherStatus: (teacherId: string) => void;

  tasks: TaskAssignment[];
  addTask: (task: {
    cursoId: string;
    seccionId: string;
    titulo: string;
    descripcion: string;
    fechaLimite: string;
    competenciaId?: string;
    archivoUrl?: string;
    docenteId?: string;
  }) => TaskAssignment;

  submissions: TaskSubmission[];
  submitTask: (params: {
    tareaId: string;
    matriculaId: string;
    comentarioEstudiante?: string;
    archivoUrl?: string;
    archivoNombre?: string;
    archivoTamano?: string;
  }) => TaskSubmission;

  gradeTask: (params: {
    tareaId: string;
    matriculaId: string;
    calificacionLetra: GradeLetter;
    retroalimentacion?: string;
  }) => void;

  exams: EvaluationExam[];
  addExam: (exam: {
    cursoId: string;
    seccionId: string;
    periodoEvaluacionId: string;
    competenciaId: string;
    titulo: string;
    tipo: 'examen' | 'practica' | 'bimestral' | 'proyecto';
    fechaProgramada: string;
    horaInicio?: string;
    duracionMinutos: number;
    descripcion?: string;
  }) => EvaluationExam;
  updateExam: (examId: string, changes: Partial<Pick<EvaluationExam, 'fecha_programada' | 'hora_inicio' | 'duracion_minutos' | 'periodo_evaluacion_id' | 'titulo' | 'descripcion'>>) => void;
  deleteExam: (examId: string) => void;

  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  unreadCount: number;

  // ── Comunicados Institucionales ──
  announcements: Announcement[];
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'creado_en'>) => Announcement;
  deleteAnnouncement: (id: string) => void;
  markAnnouncementRead: (id: string, userId: string) => void;
  confirmAnnouncement: (id: string, userId: string) => void;

  // ── Calendario Escolar Institucional & MINEDU ──
  calendarEvents: SchoolCalendarEvent[];
  addCalendarEvent: (event: Omit<SchoolCalendarEvent, 'id'>) => SchoolCalendarEvent;
  deleteCalendarEvent: (id: string) => void;
  updateCalendarEvent: (id: string, data: Partial<SchoolCalendarEvent>) => void;

  // ── Recuperación Pedagógica / Subsanación CNEB ──
  subsanaciones: SubsanacionRecord[];
  registerSubsanacion: (data: Omit<SubsanacionRecord, 'id'>) => SubsanacionRecord;
  updateSubsanacion: (id: string, data: Partial<SubsanacionRecord>) => void;

  // ── Justificaciones de Inasistencia / Tardanzas ──
  justificationRequests: JustificationRequest[];
  requestJustification: (data: Omit<JustificationRequest, 'id' | 'created_at' | 'estado'>) => JustificationRequest;
  approveJustification: (id: string, respuesta?: string) => void;
  rejectJustification: (id: string, motivoRechazo: string) => void;

  // ── Asistencia de Personal Docente y Administrativo ──
  staffAttendances: StaffAttendanceRecord[];
  recordStaffAttendance: (params: { userId: string; tipo: 'entrada' | 'salida'; metodo?: 'qr' | 'manual' }) => { success: boolean; message: string; record?: StaffAttendanceRecord };

  resetToDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_VERSION_KEY = 'colegio_storage_clean_v7';

function ensureLegacyMockDataPurged() {
  if (typeof window === 'undefined') return;
  try {
    const version = localStorage.getItem(STORAGE_VERSION_KEY);
    if (!version) {
      // Limpiar todas las claves para dejar la base de datos completamente limpia y actualizada con datos de medio año
      const legacyKeys = [
        'colegio_users',
        'colegio_current_user',
        'colegio_students',
        'colegio_enrollments',
        'colegio_attendances',
        'colegio_grades',
        'colegio_tasks',
        'colegio_submissions',
        'colegio_exams',
        'colegio_notifications',
        'colegio_section_courses',
        'colegio_schedule_slots',
        'colegio_class_sessions',
        'colegio_children',
        'colegio_parents',
        'colegio_lms_modules',
        'colegio_alerts',
        'colegio_audit_logs',
        'colegio_storage_clean_v5',
        'colegio_storage_clean_v6',
        'colegio_payments',
        'colegio_behavior_logs',
        'colegio_announcements',
        'colegio_calendar_events',
        'colegio_subsanaciones',
        'colegio_justifications',
        'colegio_staff_attendances',
        'colegio_sections',
        'colegio_evaluation_periods'
      ];
      legacyKeys.forEach(k => localStorage.removeItem(k));
      localStorage.setItem(STORAGE_VERSION_KEY, '7.0.0');
    }
  } catch (err) {
    console.warn('[Storage] Error al purgar datos mock antiguos:', err);
  }
}

// Ejecutar purga de datos mock legados inmediatamente
ensureLegacyMockDataPurged();

function getInitialData<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      if (typeof fallback === 'string') return saved as unknown as T;
      if (typeof fallback === 'boolean') return (saved === 'true') as unknown as T;
      const parsed = JSON.parse(saved);
      if (parsed !== null && parsed !== undefined) return parsed as T;
    }
  } catch (err) {
    console.warn(`[Storage] Fallo al parsear ${key}`, err);
  }
  return fallback;
}

function getInitialUser(): UserProfile {
  if (typeof window === 'undefined') return MOCK_USERS[0];
  try {
    const saved = localStorage.getItem('colegio_current_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.id && parsed.rol) {
        if (typeof document !== 'undefined') {
          document.cookie = `cole_user_role=${parsed.rol}; path=/; max-age=604800; SameSite=Lax`;
          document.cookie = `cole_access_token=jwt-active-session; path=/; max-age=604800; SameSite=Lax`;
        }
        return parsed;
      }
    }
    // Cookie fallback
    if (typeof document !== 'undefined') {
      const cookieMatch = document.cookie.match(/cole_user_role=([^;]+)/);
      if (cookieMatch && cookieMatch[1]) {
        const cookieRole = cookieMatch[1].trim() as UserRole;
        const userForRole = MOCK_USERS.find(u => u.rol === cookieRole);
        if (userForRole) {
          localStorage.setItem('colegio_current_user', JSON.stringify(userForRole));
          return userForRole;
        }
      }
    }
  } catch (err) {
    console.warn('[Storage] Error al inicializar usuario:', err);
  }
  return MOCK_USERS[0];
}

// Guarda un dato en localStorage solo cuando ESE dato cambia.
// Antes, cualquier cambio (una asistencia, una nota) volvía a serializar y escribir las ~30 tablas.
function usePersist(key: string, value: unknown, raw = false) {
  const mounted = React.useRef(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      // Al montar, el valor acaba de leerse de localStorage: solo se escribe si aún no existía
      if (!mounted.current) {
        mounted.current = true;
        if (localStorage.getItem(key) !== null) return;
      }
      localStorage.setItem(key, raw ? String(value) : JSON.stringify(value));
    } catch (err) {
      console.warn(`[Storage] No se pudo guardar ${key}`, err);
    }
  }, [key, value, raw]);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<UserProfile[]>(() => getInitialData('colegio_users', MOCK_USERS));
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => getInitialUser());
  const [students, setStudents] = useState<Student[]>(() => getInitialData('colegio_students', MOCK_STUDENTS));
  const [enrollments, setEnrollments] = useState<Enrollment[]>(() => getInitialData('colegio_enrollments', MOCK_ENROLLMENTS));
  const [attendances, setAttendances] = useState<AttendanceRecord[]>(() => getInitialData('colegio_attendances', MOCK_ATTENDANCES));
  const [grades, setGrades] = useState<GradeRecord[]>(() => getInitialData('colegio_grades', MOCK_GRADE_RECORDS));
  const [tasks, setTasks] = useState<TaskAssignment[]>(() => getInitialData('colegio_tasks', MOCK_TASKS));
  const [submissions, setSubmissions] = useState<TaskSubmission[]>(() => getInitialData('colegio_submissions', MOCK_SUBMISSIONS));
  const [exams, setExams] = useState<EvaluationExam[]>(() => getInitialData('colegio_exams', MOCK_EXAMS));
  const [notifications, setNotifications] = useState<AppNotification[]>(() => getInitialData('colegio_notifications', MOCK_NOTIFICATIONS));
  const [courses, setCourses] = useState<Course[]>(() => getInitialData('colegio_courses', MOCK_COURSES));
  const [sectionCourses, setSectionCourses] = useState<SectionCourseAssignment[]>(() => getInitialData('colegio_section_courses', MOCK_SECTION_COURSES));
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>(() => getInitialData('colegio_schedule_slots', MOCK_SCHEDULE_SLOTS));
  const [classSessions, setClassSessions] = useState<ClassSessionLog[]>(() => getInitialData('colegio_class_sessions', MOCK_CLASS_SESSIONS));
  const [academicContext, setAcademicContextState] = useState<AcademicContextState>(() => getInitialData('colegio_academic_context', {
    institucion: 'Institución Educativa San José',
    anio: 2026,
    nivel: 'todos',
  }));
  const [childrenList, setChildrenList] = useState<ChildProfile[]>(() => getInitialData('colegio_children', MOCK_CHILDREN));
  const [selectedChildId, setSelectedChildId] = useState<string>(() => getInitialData('colegio_selected_child_id', 'child-1'));
  const [parentsList, setParentsList] = useState<ParentProfile[]>(() => getInitialData('colegio_parents', MOCK_PARENTS));
  const [lmsModules, setLmsModules] = useState<LMSModule[]>(() => getInitialData('colegio_lms_modules', MOCK_LMS_MODULES));
  const [lmsProgress, setLmsProgress] = useState<LMSStudentProgress[]>(() => getInitialData('colegio_lms_progress', []));
  const [alerts, setAlerts] = useState<SystemAlert[]>(() => getInitialData('colegio_alerts', MOCK_SYSTEM_ALERTS));
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => getInitialData('colegio_audit_logs', MOCK_AUDIT_LOGS));
  const [sections, setSections] = useState<Section[]>(() => getInitialData('colegio_sections', MOCK_SECTIONS));
  const [evaluationPeriods, setEvaluationPeriods] = useState<EvaluationPeriod[]>(() => getInitialData('colegio_evaluation_periods', MOCK_EVALUATION_PERIODS));
  const [behaviorLogs, setBehaviorLogs] = useState<BehaviorLogEntry[]>(() => getInitialData('colegio_behavior_logs', MOCK_BEHAVIOR_LOGS));
  const [payments, setPayments] = useState<PaymentRecord[]>(() => getInitialData('colegio_payments', MOCK_PAYMENTS));
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => getInitialData('colegio_announcements', MOCK_ANNOUNCEMENTS));
  const [calendarEvents, setCalendarEvents] = useState<SchoolCalendarEvent[]>(() => getInitialData('colegio_calendar_events', MOCK_CALENDAR_EVENTS));
  const [subsanaciones, setSubsanaciones] = useState<SubsanacionRecord[]>(() => getInitialData('colegio_subsanaciones', MOCK_SUBSANACIONES));
  const [justificationRequests, setJustificationRequests] = useState<JustificationRequest[]>(() => getInitialData('colegio_justifications', MOCK_JUSTIFICATIONS));
  const [staffAttendances, setStaffAttendances] = useState<StaffAttendanceRecord[]>(() => getInitialData('colegio_staff_attendances', MOCK_STAFF_ATTENDANCES));
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(() => getInitialData('colegio_onboarding', true));
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => getInitialData('colegio_sidebar_collapsed', false));
  const [brandingConfig, setBrandingConfig] = useState<SystemBrandingConfig>(() => getStoredBranding());

  // Sincronización a localStorage de entidades operativas (cada una solo cuando cambia)
  usePersist('colegio_announcements', announcements);
  usePersist('colegio_calendar_events', calendarEvents);
  usePersist('colegio_subsanaciones', subsanaciones);
  usePersist('colegio_justifications', justificationRequests);
  usePersist('colegio_staff_attendances', staffAttendances);
  usePersist('colegio_payments', payments);
  usePersist('colegio_behavior_logs', behaviorLogs);

  // Hidratación y sincronización de DOM y cookies post-montaje
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (currentUser && currentUser.rol && typeof document !== 'undefined') {
        document.cookie = `cole_user_role=${currentUser.rol}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `cole_access_token=jwt-active-session; path=/; max-age=604800; SameSite=Lax`;
      }
      applyBrandingToDOM(brandingConfig || DEFAULT_BRANDING_CONFIG);
    } catch (err) {
      console.warn('[Storage] Error sincronizando estado inicial:', err);
    }
  }, [currentUser, brandingConfig]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('colegio_sidebar_collapsed', String(next));
        } catch {
          /* ignore */
        }
      }
      return next;
    });
  }, []);



  const setSidebarCollapsedState = useCallback((collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('colegio_sidebar_collapsed', String(collapsed));
      } catch {
        /* ignore */
      }
    }
  }, []);

  const [isLoading, setIsLoading] = useState(false);

  const refreshData = async () => {
    // Sin un Supabase real, los servicios devuelven los datos de ejemplo de fábrica:
    // sincronizar con ellos reemplazaría lo guardado en el navegador (cursos, asignaciones, etc.)
    if (!isSupabaseConfigured()) return;
    setIsLoading(true);
    try {
      const [
        loadedStudents,
        loadedEnrollments,
        loadedAttendances,
        loadedGrades,
        loadedTasks,
        loadedSubmissions,
        loadedExams,
        loadedCourses,
        loadedSectionCourses,
        loadedSlots,
        loadedSessions,
      ] = await Promise.all([
        academicService.fetchStudents(),
        academicService.fetchEnrollments(),
        attendanceService.fetchAttendances(),
        academicService.fetchGradeRecords(),
        tasksService.fetchTasks(),
        tasksService.fetchSubmissions(),
        tasksService.fetchExams(),
        academicService.fetchCourses(),
        scheduleService.fetchSectionCourses(),
        scheduleService.fetchScheduleSlots(),
        scheduleService.fetchClassSessions(),
      ]);

      // Sincronización inteligente sin sobrescribir estudiantes locales recién creados
      setStudents(prev => {
        const map = new Map<string, Student>();
        loadedStudents.forEach(s => map.set(s.id, s));
        prev.forEach(s => map.set(s.id, s));
        return Array.from(map.values());
      });

      setEnrollments(prev => {
        const map = new Map<string, Enrollment>();
        loadedEnrollments.forEach(e => map.set(e.id, e));
        prev.forEach(e => map.set(e.id, e));
        return Array.from(map.values());
      });

      setAttendances(prev => {
        const map = new Map<string, AttendanceRecord>();
        loadedAttendances.forEach(a => map.set(a.id, a));
        prev.forEach(a => map.set(a.id, a));
        return Array.from(map.values());
      });

      if (loadedGrades && loadedGrades.length > 0) setGrades(loadedGrades);
      if (loadedTasks && loadedTasks.length > 0) setTasks(loadedTasks);
      if (loadedSubmissions && loadedSubmissions.length > 0) setSubmissions(loadedSubmissions);
      if (loadedExams && loadedExams.length > 0) setExams(loadedExams);
      if (loadedCourses && loadedCourses.length > 0) setCourses(loadedCourses);
      if (loadedSectionCourses && loadedSectionCourses.length > 0) setSectionCourses(loadedSectionCourses);
      if (loadedSlots && loadedSlots.length > 0) setScheduleSlots(loadedSlots);
      if (loadedSessions && loadedSessions.length > 0) setClassSessions(loadedSessions);
    } catch (err) {
      console.warn('[Supabase] Error al sincronizar datos remotos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const logout = async () => {
    await logoutUser();
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('colegio_current_user');
      } catch {
        /* ignore */
      }
    }
  };

  const handleSetCurrentUser = useCallback((user: UserProfile) => {
    setCurrentUser(user);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('colegio_current_user', JSON.stringify(user));
      } catch {
        /* ignore */
      }
      if (typeof document !== 'undefined' && user?.rol) {
        document.cookie = `cole_user_role=${user.rol}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `cole_access_token=jwt-active-session; path=/; max-age=604800; SameSite=Lax`;
      }
    }
  }, []);

  // Sincronización a localStorage: cada dato se guarda solo cuando cambia
  usePersist('colegio_users', users);
  usePersist('colegio_current_user', currentUser);
  usePersist('colegio_students', students);
  usePersist('colegio_enrollments', enrollments);
  usePersist('colegio_attendances', attendances);
  usePersist('colegio_grades', grades);
  usePersist('colegio_tasks', tasks);
  usePersist('colegio_submissions', submissions);
  usePersist('colegio_exams', exams);
  usePersist('colegio_notifications', notifications);
  usePersist('colegio_courses', courses);
  usePersist('colegio_section_courses', sectionCourses);
  usePersist('colegio_schedule_slots', scheduleSlots);
  usePersist('colegio_class_sessions', classSessions);
  usePersist('colegio_academic_context', academicContext);
  usePersist('colegio_children', childrenList);
  usePersist('colegio_selected_child_id', selectedChildId, true);
  usePersist('colegio_parents', parentsList);
  usePersist('colegio_lms_modules', lmsModules);
  usePersist('colegio_lms_progress', lmsProgress);
  usePersist('colegio_alerts', alerts);
  usePersist('colegio_audit_logs', auditLogs);
  usePersist('colegio_sections', sections);
  usePersist('colegio_evaluation_periods', evaluationPeriods);

  const resetToDemoData = () => {
    if (typeof window !== 'undefined') {
      const storageKeys = [
        'colegio_users',
        'colegio_current_user',
        'colegio_students',
        'colegio_enrollments',
        'colegio_attendances',
        'colegio_grades',
        'colegio_tasks',
        'colegio_submissions',
        'colegio_exams',
        'colegio_notifications',
        'colegio_section_courses',
        'colegio_schedule_slots',
        'colegio_class_sessions',
        'colegio_payments',
        'colegio_behavior_logs',
        'colegio_announcements',
        'colegio_calendar_events',
        'colegio_subsanaciones',
        'colegio_justifications',
        'colegio_staff_attendances',
        'colegio_children',
        'colegio_parents',
        'colegio_alerts',
        'colegio_audit_logs',
        'colegio_evaluation_periods',
        'colegio_sections'
      ];
      storageKeys.forEach((key) => localStorage.removeItem(key));
    }
    setUsers(MOCK_USERS);
    setCurrentUser(MOCK_USERS[0]);
    setStudents(MOCK_STUDENTS);
    setEnrollments(MOCK_ENROLLMENTS);
    setAttendances(MOCK_ATTENDANCES);
    setGrades(MOCK_GRADE_RECORDS);
    setTasks(MOCK_TASKS);
    setSubmissions(MOCK_SUBMISSIONS);
    setExams(MOCK_EXAMS);
    setNotifications(MOCK_NOTIFICATIONS);
    setSectionCourses(MOCK_SECTION_COURSES);
    setScheduleSlots(MOCK_SCHEDULE_SLOTS);
    setClassSessions(MOCK_CLASS_SESSIONS);
    setPayments(MOCK_PAYMENTS);
    setBehaviorLogs(MOCK_BEHAVIOR_LOGS);
    setAlerts(MOCK_SYSTEM_ALERTS);
    setAuditLogs(MOCK_AUDIT_LOGS);
    setAnnouncements(MOCK_ANNOUNCEMENTS);
    setCalendarEvents(MOCK_CALENDAR_EVENTS);
    setSubsanaciones(MOCK_SUBSANACIONES);
    setJustificationRequests(MOCK_JUSTIFICATIONS);
    setStaffAttendances(MOCK_STAFF_ATTENDANCES);
    setChildrenList(MOCK_CHILDREN);
    setParentsList(MOCK_PARENTS);
    setEvaluationPeriods(MOCK_EVALUATION_PERIODS);
    setSections(MOCK_SECTIONS);
    showToast('Datos del sistema restaurados al estado original', 'info', 'Datos Reiniciados');
  };

  const removeToast = useCallback((id: string) => removeToastFromStore(id), []);

  const showToast = useCallback((
    mensaje: string, 
    tipo: 'success' | 'error' | 'info' | 'warning' = 'success', 
    titulo?: string, 
    duracionMs = 4000
  ) => {
    pushToast({ tipo, titulo, mensaje, duracionMs });
  }, []);

  const updateBrandingConfig = useCallback((newConfig: Partial<SystemBrandingConfig>) => {
    setBrandingConfig((prev) => {
      const updated: SystemBrandingConfig = {
        ...prev,
        ...newConfig,
        updatedAt: new Date().toISOString(),
      };
      saveStoredBranding(updated);
      applyBrandingToDOM(updated);
      return updated;
    });
  }, []);

  const resetBrandingConfig = useCallback(() => {
    const reset = resetStoredBranding();
    setBrandingConfig(reset);
    applyBrandingToDOM(reset);
    showToast('Branding restablecido a los valores por defecto', 'info', 'Configuración Reiniciada');
  }, [showToast]);

  const teachers = useMemo(() => users.filter(u => u.rol === 'docente'), [users]);

  const addTeacher = (data: {
    nombres: string;
    apellidos: string;
    dni: string;
    email?: string;
    telefono?: string;
    especialidad?: string;
    avatar_url?: string;
  }) => {
    const cleanFirst = data.nombres.trim().split(' ')[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const cleanLast = data.apellidos.trim().split(' ')[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const autoEmail = data.email?.trim() || `${cleanFirst[0]}${cleanLast}@colegio.edu.pe`;
    const autoUsername = `${cleanFirst[0]}${cleanLast}${data.dni.slice(-4)}`;
    const autoPassword = `Doc${cleanFirst[0].toUpperCase()}${cleanLast.slice(0,3)}${data.dni.slice(-4)}!`;

    const newTeacher: UserProfile = {
      id: `user-docente-${Date.now()}`,
      rol: 'docente',
      nombres: data.nombres,
      apellidos: data.apellidos,
      dni: data.dni,
      email: autoEmail,
      telefono: data.telefono,
      especialidad: data.especialidad || 'Educación General',
      avatar_url: data.avatar_url || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      activo: true,
    };

    setUsers(prev => [...prev, newTeacher]);

    showToast(
      `Docente ${data.nombres} ${data.apellidos} registrado exitosamente.`,
      'success',
      'Docente Registrado'
    );

    return {
      teacher: newTeacher,
      credentials: {
        username: autoUsername,
        password: autoPassword,
        email: autoEmail,
      }
    };
  };

  const addUser = (data: {
    nombres: string;
    apellidos: string;
    dni: string;
    rol: UserRole;
    email?: string;
    username?: string;
    password?: string;
    telefono?: string;
    especialidad?: string;
    cargo?: string;
    avatar_url?: string;
    activo?: boolean;
  }) => {
    const cleanFirst = data.nombres.trim().split(' ')[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const cleanLast = data.apellidos.trim().split(' ')[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const autoEmail = data.email?.trim() || `${cleanFirst[0]}${cleanLast}@colegio.edu.pe`;
    const autoUsername = data.username?.trim() || `${cleanFirst[0]}${cleanLast}${data.dni.slice(-4)}`;
    const rolePrefix = data.rol === 'admin' ? 'Adm' : data.rol === 'docente' ? 'Doc' : data.rol === 'estudiante' ? 'Est' : data.rol === 'apoderado' ? 'Apo' : 'Ast';
    const finalPassword = data.password?.trim() || `${rolePrefix}${cleanFirst[0].toUpperCase()}${cleanLast.slice(0, 3)}${data.dni.slice(-4)}!`;

    const newUser: UserProfile = {
      id: `user-${data.rol}-${Date.now()}`,
      rol: data.rol,
      nombres: data.nombres,
      apellidos: data.apellidos,
      dni: data.dni,
      email: autoEmail,
      username: autoUsername,
      password: finalPassword,
      telefono: data.telefono,
      especialidad: data.especialidad,
      cargo: data.cargo,
      avatar_url: data.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.nombres + ' ' + data.apellidos)}&background=6366f1&color=fff&size=150`,
      activo: data.activo !== undefined ? data.activo : true,
    };

    setUsers(prev => {
      const nextUsers = [newUser, ...prev];
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('colegio_users', JSON.stringify(nextUsers));
        } catch { /* ignore */ }
      }
      return nextUsers;
    });

    // Registrar en auditoría
    const auditEntry: AuditLogEntry = {
      id: `log-${Date.now()}`,
      usuario_id: currentUser.id,
      usuario_nombre: `${currentUser.nombres} ${currentUser.apellidos}`,
      rol: currentUser.rol,
      accion: 'CREAR_USUARIO',
      modulo: 'Usuarios & RBAC',
      detalle: `Creó usuario ${data.nombres} ${data.apellidos} con rol "${data.rol.toUpperCase()}"`,
      valor_nuevo: `ID: ${newUser.id} | Rol: ${data.rol}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      ip: '192.168.1.45',
    };
    setAuditLogs(prev => [auditEntry, ...prev]);

    showToast(
      `Usuario ${data.nombres} ${data.apellidos} (${data.rol.toUpperCase()}) creado exitosamente.`,
      'success',
      'Usuario Creado'
    );

    return {
      user: newUser,
      credentials: {
        username: autoUsername,
        password: finalPassword,
        email: autoEmail,
      }
    };
  };

  const updateUserRole = useCallback((userId: string, newRole: UserRole) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, rol: newRole } : u));
    showToast(`Rol actualizado a "${newRole.toUpperCase()}".`, 'success', 'Rol Actualizado');
  }, [showToast]);

  const toggleUserStatus = useCallback((userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, activo: !u.activo } : u));
    showToast('Estado del usuario actualizado.', 'success');
  }, [showToast]);

  const deleteUser = useCallback((userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    showToast('Usuario eliminado del sistema.', 'info');
  }, [showToast]);

  const switchRole = useCallback((targetRole: UserRole) => {
    const targetUser = users.find(u => u.rol === targetRole && u.activo) || 
                       MOCK_USERS.find(u => u.rol === targetRole) ||
                       users.find(u => u.rol === targetRole);
    if (targetUser) {
      handleSetCurrentUser(targetUser);
      showToast(`Sesión cambiada a perfil: ${targetUser.nombres} (${targetRole.toUpperCase()})`, 'info', 'Perfil Actualizado');
    }
  }, [users, handleSetCurrentUser, showToast]);

  const addNotification = (notif: Omit<AppNotification, 'id' | 'created_at' | 'leido'>) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      ...notif,
      leido: false,
      created_at: new Date().toISOString(),
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, leido: true } : n)
    );
  };

  const unreadCount = useMemo(() => notifications.filter(n => !n.leido).length, [notifications]);

  const registerAttendance = ({
    studentQrToken,
    matriculaId,
    status = 'presente',
    observacion,
    metodo
  }: {
    studentQrToken?: string;
    matriculaId?: string;
    status?: AttendanceStatus;
    observacion?: string;
    metodo: 'qr' | 'manual';
  }): { success: boolean; message: string; duplicate?: boolean; record?: AttendanceRecord; studentName?: string } => {
    let targetEnrollment: Enrollment | undefined;

    if (studentQrToken) {
      // Búsqueda exacta compartida con el kiosco (nunca coincidencias parciales)
      const student = findStudentByQr(students, studentQrToken);
      if (!student) {
        return { success: false, message: 'Código QR no reconocido o estudiante inexistente' };
      }
      targetEnrollment = enrollments.find(e => 
        e.estudiante_id === student.id ||
        e.estudiante?.id === student.id ||
        (student.profile_id && (e.estudiante_id === student.profile_id || e.estudiante?.profile_id === student.profile_id)) ||
        (student.codigo_estudiante && e.estudiante?.codigo_estudiante === student.codigo_estudiante) ||
        (student.dni && (e.estudiante?.dni === student.dni || e.estudiante?.profile?.dni === student.dni)) ||
        (student.profile?.dni && (e.estudiante?.dni === student.profile.dni || e.estudiante?.profile?.dni === student.profile.dni))
      );

      // Si el estudiante existe pero no tiene registro en matrículas, crear fallback activo automáticamente
      if (!targetEnrollment) {
        const fallbackSection = sections[0] || MOCK_SECTIONS[0];
        targetEnrollment = {
          id: `enr-auto-${student.id}`,
          estudiante_id: student.id,
          periodo_id: MOCK_PERIOD.id,
          seccion_id: fallbackSection.id,
          fecha_matricula: new Date().toISOString().split('T')[0],
          estado: 'activo',
          estudiante: student,
          seccion: fallbackSection,
          periodo: MOCK_PERIOD,
        };
        setEnrollments(prev => [targetEnrollment!, ...prev]);
      }
    } else if (matriculaId) {
      targetEnrollment = enrollments.find(e => e.id === matriculaId);
    }

    if (!targetEnrollment) {
      return { success: false, message: 'Estudiante no matriculado en el periodo lectivo actual' };
    }

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentTimeStr = now.toLocaleTimeString('es-PE', { hour12: false });

    // Look for attendance registered today only
    const existingIndex = attendances.findIndex(
      a => a.matricula_id === targetEnrollment!.id && a.fecha === todayStr
    );

    const studentName = targetEnrollment.estudiante?.profile
      ? `${targetEnrollment.estudiante.profile.nombres} ${targetEnrollment.estudiante.profile.apellidos}`
      : `${targetEnrollment.estudiante?.nombres || ''} ${targetEnrollment.estudiante?.apellidos || ''}`.trim() || 'Estudiante';

    if (existingIndex >= 0) {
      const existing = attendances[existingIndex];

      // ── DUPLICATE BLOCK: via QR → reject, never register twice ───────────
      if (metodo === 'qr') {
        showToast(
          `⚠️ ${studentName} YA TIENE ASISTENCIA registrada hoy a las ${existing.hora_registro} (${existing.estado.toUpperCase()})`,
          'warning',
          '⚠️ Ya registrado hoy',
          5000
        );
        return {
          success: false,
          duplicate: true,
          message: `Ya se registró asistencia de ${studentName} hoy a las ${existing.hora_registro} (${existing.estado.toUpperCase()})`,
          record: existing,
          studentName
        };
      }

      // ── Manual override: allow updating status ────────────────────────────
      const updated = [...attendances];
      updated[existingIndex] = {
        ...updated[existingIndex],
        estado: status,
        hora_registro: currentTimeStr,
        metodo,
        observacion: observacion || updated[existingIndex].observacion,
      };
      setAttendances(updated);

      // Manual override: persist to Supabase if available
      attendanceService.recordAttendanceInDb({
        matriculaId: targetEnrollment.id,
        estado: status,
        metodo,
        observacion,
        registradoPorId: currentUser.id,
      }).catch(() => {});

      addNotification({
        user_id: targetEnrollment.estudiante?.profile_id || '',
        tipo: 'asistencia',
        titulo: 'Asistencia Actualizada',
        mensaje: `Estado actualizado a ${status.toUpperCase()} a las ${currentTimeStr} vía MANUAL`,
        url_redireccion: '/estudiante/asistencias'
      });

      showToast(
        `Asistencia actualizada: ${studentName} → ${status.toUpperCase()}`,
        status === 'falta' ? 'warning' : 'success',
        'Asistencia Actualizada'
      );

      return {
        success: true,
        message: `Asistencia actualizada para ${studentName} (${status.toUpperCase()})`,
        record: updated[existingIndex],
        studentName
      };
    } else {
      // ── New registration ─────────────────────────────────────────────────
      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}`,
        matricula_id: targetEnrollment.id,
        fecha: todayStr,
        hora_registro: currentTimeStr,
        estado: status,
        metodo,
        observacion,
        registrado_por: currentUser.id,
        matricula: targetEnrollment
      };

      setAttendances(prev => [newRecord, ...prev]);

      // Persist to Supabase if available
      attendanceService.recordAttendanceInDb({
        matriculaId: targetEnrollment.id,
        estado: status,
        metodo,
        observacion,
        registradoPorId: currentUser.id,
      }).catch(() => {});

      // Dispatch Brevo Email to Parent/Guardian if enabled
      if (brandingConfig?.brevoActivarEnvioAsistencia !== false) {
        const student = targetEnrollment.estudiante;
        const parent = parentsList.find(p => p.hijos_ids?.includes(targetEnrollment!.estudiante_id));
        const parentEmail = student?.email_apoderado || parent?.email || student?.profile?.email || 'apoderado@gmail.com';
        const parentName = student?.nombre_apoderado || (parent ? `${parent.nombres} ${parent.apellidos}` : 'Padre de Familia');
        const gradeSection = targetEnrollment.seccion?.grado?.nombre 
          ? `${targetEnrollment.seccion.grado.nombre} - "${targetEnrollment.seccion.letra}"`
          : targetEnrollment.seccion?.letra || '';

        sendBrevoAttendanceEmail({
          parentEmail,
          parentName,
          studentName,
          studentCode: student?.codigo_estudiante,
          gradeSection,
          avatarUrl: student?.profile?.avatar_url,
          fecha: todayStr,
          horaRegistro: currentTimeStr,
          estado: status,
          metodo,
          observacion,
          branding: brandingConfig,
        }).catch(() => {});
      }

      // Notify student
      addNotification({
        user_id: targetEnrollment.estudiante?.profile_id || '',
        tipo: 'asistencia',
        titulo: '✅ Asistencia Confirmada',
        mensaje: `Ingreso registrado a las ${currentTimeStr} (${status.toUpperCase()}) vía ${metodo === 'qr' ? 'Lector QR' : 'Manual'}`,
        url_redireccion: '/estudiante/asistencias'
      });

      showToast(
        `✅ ${studentName} — ${status.toUpperCase()} — ${currentTimeStr}`,
        status === 'falta' ? 'warning' : 'success',
        '¡Asistencia Registrada!'
      );

      return {
        success: true,
        message: `¡Asistencia registrada con éxito para ${studentName}!`,
        record: newRecord,
        studentName
      };
    }
  };

  const updateGrade = ({
    matriculaId,
    competenciaId,
    periodoEvaluacionId,
    notaLetra,
    conclusionDescriptiva
  }: {
    matriculaId: string;
    competenciaId: string;
    periodoEvaluacionId: string;
    notaLetra: GradeLetter;
    conclusionDescriptiva?: string;
  }) => {
    const targetEnr = enrollments.find(e => e.id === matriculaId);
    if (targetEnr?.estudiante?.profile_id) {
      addNotification({
        user_id: targetEnr.estudiante.profile_id,
        tipo: 'nota',
        titulo: 'Calificación Actualizada',
        mensaje: `Se ha registrado la nota ${notaLetra} en tu evaluación por competencias.`,
        url_redireccion: '/estudiante/libreta-notas'
      });
    }

    showToast(
      `Nota ${notaLetra} guardada para ${targetEnr?.estudiante?.profile?.nombres || 'el alumno'}.`,
      'success',
      'Calificación Guardada (CNEB)'
    );

    setGrades(prev => {
      const existingIdx = prev.findIndex(
        g => g.matricula_id === matriculaId && 
             g.competencia_id === competenciaId && 
             g.periodo_evaluacion_id === periodoEvaluacionId
      );

      const numericValue = gradeToNumber(notaLetra);

      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = {
          ...copy[existingIdx],
          nota_letra: notaLetra,
          nota_numerica: numericValue,
          conclusion_descriptiva: conclusionDescriptiva || copy[existingIdx].conclusion_descriptiva,
          modificado_por: currentUser.id,
          updated_at: new Date().toISOString()
        };
        return copy;
      } else {
        const newGrade: GradeRecord = {
          id: `gr-${Date.now()}`,
          matricula_id: matriculaId,
          competencia_id: competenciaId,
          periodo_evaluacion_id: periodoEvaluacionId,
          nota_letra: notaLetra,
          nota_numerica: numericValue,
          conclusion_descriptiva: conclusionDescriptiva,
          modificado_por: currentUser.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        return [...prev, newGrade];
      }
    });
  };

  const addStudent = (data: {
    nombres: string;
    apellidos: string;
    dni: string;
    fechaNacimiento: string;
    seccionId: string;
    nombreApoderado: string;
    telefonoApoderado: string;
    dniApoderado?: string;
    emailApoderado?: string;
    parentesco?: string;
    username?: string;
    password?: string;
    email?: string;
    parentPassword?: string;
    genero?: string;
    avatar_url?: string;
  }) => {
    // Generar un código único basado en timestamp para evitar colisiones
    const uniqueSuffix = String(Date.now()).slice(-6);
    const studentCode = `EST-2026-${uniqueSuffix}`;
    const cleanFirst = data.nombres.trim().split(' ')[0].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    const cleanLast = data.apellidos.trim().split(' ')[0].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    const tokenQr = `QR-${studentCode}-${cleanFirst}-${cleanLast}`;

    // ── Credentials generation or custom ──────────────────────────────
    const password = data.password?.trim() || generateStudentPassword(data.nombres, data.apellidos, data.fechaNacimiento);
    const email    = data.email?.trim() || generateStudentEmail(data.nombres, data.apellidos);
    const username = data.username?.trim() || generateStudentUsername(data.apellidos, data.dni);

    // Apoderado credentials
    const parentUsername = data.dniApoderado?.trim() || data.emailApoderado?.trim() || `apo${data.telefonoApoderado?.slice(-4) || data.dni.slice(-4)}`;
    const parentEmail = data.emailApoderado?.trim() || `${parentUsername.toLowerCase()}@apoderado.colegio.edu.pe`;
    const parentPassword = data.parentPassword?.trim() || `Apo${data.telefonoApoderado?.slice(-4) || data.dni.slice(-4)}!`;
    // ──────────────────────────────────────────────────────────

    const newProfile: UserProfile = {
      id: `user-alumno-${Date.now()}`,
      rol: 'estudiante',
      nombres: data.nombres,
      apellidos: data.apellidos,
      dni: data.dni,
      email,
      username,
      password,
      telefono: data.telefonoApoderado,
      avatar_url: data.avatar_url || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      activo: true,
    };

    const newStudent: Student = {
      id: `student-${Date.now()}`,
      profile_id: newProfile.id,
      codigo_estudiante: studentCode,
      fecha_nacimiento: data.fechaNacimiento,
      genero: data.genero || 'No especificado',
      nombre_apoderado: data.nombreApoderado,
      telefono_apoderado: data.telefonoApoderado,
      email_apoderado: data.emailApoderado,
      dni: data.dni,
      nombres: data.nombres,
      apellidos: data.apellidos,
      token_qr: tokenQr,
      profile: newProfile,
    };

    // Crear o vincular perfil de apoderado
    const parentUserId = `user-apoderado-${Date.now()}`;
    const parentProfile: UserProfile = {
      id: parentUserId,
      rol: 'apoderado',
      nombres: data.nombreApoderado || 'Apoderado',
      apellidos: data.apellidos.split(' ')[0] || '',
      dni: data.dniApoderado || `${data.dni.slice(0, 4)}9999`,
      email: parentEmail,
      username: parentUsername,
      password: parentPassword,
      telefono: data.telefonoApoderado,
      avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.nombreApoderado || 'Apoderado')}&background=10b981&color=fff`,
      activo: true,
    };

    const targetSection = MOCK_SECTIONS.find(s => s.id === data.seccionId) || MOCK_SECTIONS[0];

    const newEnrollment: Enrollment = {
      id: `enr-${Date.now()}`,
      estudiante_id: newStudent.id,
      periodo_id: MOCK_PERIOD.id,
      seccion_id: data.seccionId,
      fecha_matricula: new Date().toISOString().split('T')[0],
      estado: 'activo',
      estudiante: newStudent,
      seccion: targetSection,
      periodo: MOCK_PERIOD,
    };

    setStudents(prev => [newStudent, ...prev]);
    setEnrollments(prev => [newEnrollment, ...prev]);
    setUsers(prev => [newProfile, parentProfile, ...prev]);

    // Persistencia inmediata síncrona en localStorage para evitar pérdida al navegar
    if (typeof window !== 'undefined') {
      try {
        const currentSavedStudents = JSON.parse(localStorage.getItem('colegio_students') || '[]');
        localStorage.setItem('colegio_students', JSON.stringify([newStudent, ...currentSavedStudents]));
        const currentSavedEnrollments = JSON.parse(localStorage.getItem('colegio_enrollments') || '[]');
        localStorage.setItem('colegio_enrollments', JSON.stringify([newEnrollment, ...currentSavedEnrollments]));
        const currentSavedUsers = JSON.parse(localStorage.getItem('colegio_users') || '[]');
        localStorage.setItem('colegio_users', JSON.stringify([newProfile, parentProfile, ...currentSavedUsers]));
      } catch (err) {
        console.warn('[Storage] Error al persistir inmediatamente:', err);
      }
    }

    // Persistir en Supabase de manera asíncrona si está activo
    academicService.createStudentInDb({
      ...data,
      studentCode,
      tokenQr,
      avatar_url: newProfile.avatar_url,
    }).catch(err => {
      console.warn('[Supabase] Error al crear estudiante en DB remota:', err);
    });

    showToast(
      `Estudiante ${data.nombres} ${data.apellidos} matriculado con éxito (${studentCode}).`,
      'success',
      'Matrícula Exitosa'
    );

    return { 
      student: newStudent, 
      enrollment: newEnrollment,
      credentials: { username, password, email },
      parentCredentials: { username: parentUsername, password: parentPassword, email: parentEmail }
    };
  };

  const updateStudent = (studentId: string, updatedData: Partial<{
    nombres: string;
    apellidos: string;
    dni: string;
    fechaNacimiento: string;
    seccionId: string;
    nombreApoderado: string;
    telefonoApoderado: string;
    genero: string;
    avatar_url: string;
  }>) => {
    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      const updatedProfile = {
        ...(s.profile || {}),
        ...(updatedData.nombres ? { nombres: updatedData.nombres } : {}),
        ...(updatedData.apellidos ? { apellidos: updatedData.apellidos } : {}),
        ...(updatedData.dni ? { dni: updatedData.dni } : {}),
        ...(updatedData.avatar_url ? { avatar_url: updatedData.avatar_url } : {}),
      } as UserProfile;

      return {
        ...s,
        fecha_nacimiento: updatedData.fechaNacimiento || s.fecha_nacimiento,
        genero: updatedData.genero || s.genero,
        nombre_apoderado: updatedData.nombreApoderado !== undefined ? updatedData.nombreApoderado : s.nombre_apoderado,
        telefono_apoderado: updatedData.telefonoApoderado !== undefined ? updatedData.telefonoApoderado : s.telefono_apoderado,
        profile: updatedProfile,
      };
    }));

    if (updatedData.seccionId) {
      const targetSec = MOCK_SECTIONS.find(sec => sec.id === updatedData.seccionId);
      if (targetSec) {
        setEnrollments(prev => prev.map(enr => {
          if (enr.estudiante_id !== studentId) return enr;
          return {
            ...enr,
            seccion_id: targetSec.id,
            seccion: targetSec,
          };
        }));
      }
    }

    showToast('Datos del estudiante actualizados correctamente.', 'success', 'Actualización Exitosa');
  };

  const deleteStudent = (studentId: string) => {
    setStudents(prev => prev.filter(s => s.id !== studentId));
    setEnrollments(prev => prev.filter(e => e.estudiante_id !== studentId));
    showToast('Estudiante y matrícula eliminados.', 'info', 'Estudiante Eliminado');
  };

  const toggleStudentStatus = (studentId: string) => {
    let newStatus: 'activo' | 'retirado' = 'activo';
    setEnrollments(prev => prev.map(enr => {
      if (enr.estudiante_id !== studentId) return enr;
      newStatus = enr.estado === 'activo' ? 'retirado' : 'activo';
      return {
        ...enr,
        estado: newStatus,
      };
    }));

    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      return {
        ...s,
        profile: s.profile ? { ...s.profile, activo: newStatus === 'activo' } : undefined,
      };
    }));

    showToast(
      `Estado del estudiante cambiado a ${newStatus === 'activo' ? 'Activo' : 'Inactivo'}.`,
      'info',
      'Estado Actualizado'
    );
  };

  const addTask = (data: {
    cursoId: string;
    seccionId: string;
    titulo: string;
    descripcion: string;
    fechaLimite: string;
    competenciaId?: string;
    archivoUrl?: string;
    docenteId?: string;
  }) => {
    const course = courses.find(c => c.id === data.cursoId) || MOCK_COURSES.find(c => c.id === data.cursoId);
    const newTask: TaskAssignment = {
      id: `task-${Date.now()}`,
      curso_id: data.cursoId,
      seccion_id: data.seccionId,
      docente_id: data.docenteId || currentUser.id,
      competencia_id: data.competenciaId,
      titulo: data.titulo,
      descripcion: data.descripcion,
      fecha_limite: data.fechaLimite,
      archivo_url: data.archivoUrl,
      created_at: new Date().toISOString(),
      curso: course,
    };

    setTasks(prev => [newTask, ...prev]);

    // Dispatch notification to all students in section
    enrollments.filter(e => e.seccion_id === data.seccionId).forEach(enr => {
      if (enr.estudiante?.profile_id) {
        addNotification({
          user_id: enr.estudiante.profile_id,
          tipo: 'tarea',
          titulo: 'Nueva Tarea Publicada',
          mensaje: `${course?.nombre}: ${data.titulo}`,
          url_redireccion: '/estudiante/tareas'
        });
      }
    });

    showToast(
      `Tarea "${data.titulo}" publicada correctamente.`,
      'success',
      'Tarea Asignada'
    );

    return newTask;
  };

  const submitTask = ({
    tareaId,
    matriculaId,
    comentarioEstudiante,
    archivoUrl,
    archivoNombre,
    archivoTamano,
  }: {
    tareaId: string;
    matriculaId: string;
    comentarioEstudiante?: string;
    archivoUrl?: string;
    archivoNombre?: string;
    archivoTamano?: string;
  }) => {
    const task = tasks.find(t => t.id === tareaId);
    const targetEnr = enrollments.find(e => e.id === matriculaId);
    const studentName = targetEnr?.estudiante?.profile ? `${targetEnr.estudiante.profile.nombres} ${targetEnr.estudiante.profile.apellidos}` : 'Un alumno';

    let resultSub: TaskSubmission;
    const existingIdx = submissions.findIndex(s => s.tarea_id === tareaId && s.matricula_id === matriculaId);
    if (existingIdx >= 0) {
      const copy = [...submissions];
      copy[existingIdx] = {
        ...copy[existingIdx],
        comentario_estudiante: comentarioEstudiante !== undefined ? comentarioEstudiante : copy[existingIdx].comentario_estudiante,
        archivo_url: archivoUrl || copy[existingIdx].archivo_url,
        archivo_nombre: archivoNombre || copy[existingIdx].archivo_nombre,
        archivo_tamano: archivoTamano || copy[existingIdx].archivo_tamano,
        fecha_entrega: new Date().toISOString(),
      };
      setSubmissions(copy);
      resultSub = copy[existingIdx];
    } else {
      const newSub: TaskSubmission = {
        id: `sub-${Date.now()}`,
        tarea_id: tareaId,
        matricula_id: matriculaId,
        fecha_entrega: new Date().toISOString(),
        comentario_estudiante: comentarioEstudiante,
        archivo_url: archivoUrl,
        archivo_nombre: archivoNombre,
        archivo_tamano: archivoTamano,
      };
      setSubmissions(prev => [newSub, ...prev]);
      resultSub = newSub;
    }

    // Dispatch notification to teacher
    if (task?.docente_id) {
      addNotification({
        user_id: task.docente_id,
        tipo: 'tarea',
        titulo: 'Entrega de Tarea Recibida',
        mensaje: `${studentName} entregó la tarea "${task.titulo}".`,
        url_redireccion: '/docente/tareas'
      });
    }

    showToast(
      `Entrega enviada para la tarea "${task?.titulo || ''}".`,
      'success',
      'Tarea Entregada'
    );

    return resultSub;
  };

  const gradeTask = ({
    tareaId,
    matriculaId,
    calificacionLetra,
    retroalimentacion
  }: {
    tareaId: string;
    matriculaId: string;
    calificacionLetra: GradeLetter;
    retroalimentacion?: string;
  }) => {
    setSubmissions(prev => {
      const idx = prev.findIndex(s => s.tarea_id === tareaId && s.matricula_id === matriculaId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          calificacion_letra: calificacionLetra,
          retroalimentacion_docente: retroalimentacion,
        };
        return copy;
      }
      return prev;
    });

    const targetEnr = enrollments.find(e => e.id === matriculaId);
    if (targetEnr?.estudiante?.profile_id) {
      addNotification({
        user_id: targetEnr.estudiante.profile_id,
        tipo: 'tarea',
        titulo: 'Tarea Calificada',
        mensaje: `Tu tarea ha sido revisada con nota ${calificacionLetra}`,
        url_redireccion: '/estudiante/tareas'
      });
    }

    showToast(
      `Tarea calificada con nota ${calificacionLetra}.`,
      'success',
      'Calificación Registrada'
    );
  };

  const addExam = (data: {
    cursoId: string;
    seccionId: string;
    periodoEvaluacionId: string;
    competenciaId: string;
    titulo: string;
    tipo: 'examen' | 'practica' | 'bimestral' | 'proyecto';
    fechaProgramada: string;
    horaInicio?: string;
    duracionMinutos: number;
    descripcion?: string;
  }) => {
    const course = courses.find(c => c.id === data.cursoId) || MOCK_COURSES.find(c => c.id === data.cursoId);
    const newExam: EvaluationExam = {
      id: `exam-${Date.now()}`,
      curso_id: data.cursoId,
      seccion_id: data.seccionId,
      periodo_evaluacion_id: data.periodoEvaluacionId,
      competencia_id: data.competenciaId,
      titulo: data.titulo,
      tipo: data.tipo,
      fecha_programada: data.fechaProgramada,
      hora_inicio: data.horaInicio,
      duracion_minutos: data.duracionMinutos,
      descripcion: data.descripcion,
      ponderacion: 1.0,
      estado: 'programada',
      curso: course,
    };

    setExams(prev => [newExam, ...prev]);

    enrollments.filter(e => e.seccion_id === data.seccionId).forEach(enr => {
      if (enr.estudiante?.profile_id) {
        addNotification({
          user_id: enr.estudiante.profile_id,
          tipo: 'nota',
          titulo: 'Nueva Evaluación Programada',
          mensaje: `${data.titulo} programada para el ${data.fechaProgramada}`,
          url_redireccion: '/estudiante/evaluaciones'
        });
      }
    });

    showToast(
      `Evaluación "${data.titulo}" programada para el ${data.fechaProgramada}.`,
      'success',
      'Evaluación Creada'
    );

    return newExam;
  };

  const updateExam = (examId: string, changes: Partial<Pick<EvaluationExam, 'fecha_programada' | 'hora_inicio' | 'duracion_minutos' | 'periodo_evaluacion_id' | 'titulo' | 'descripcion'>>) => {
    const exam = exams.find(e => e.id === examId);
    setExams(prev => prev.map(e => (e.id === examId ? { ...e, ...changes } : e)));
    // Avisar a los alumnos si cambió la fecha u hora
    if (exam && (changes.fecha_programada || changes.hora_inicio)) {
      enrollments.filter(e => e.seccion_id === exam.seccion_id).forEach(enr => {
        if (enr.estudiante?.profile_id) {
          addNotification({
            user_id: enr.estudiante.profile_id,
            tipo: 'nota',
            titulo: 'Evaluación reprogramada',
            mensaje: `${exam.titulo}: nueva fecha ${changes.fecha_programada || exam.fecha_programada}`,
            url_redireccion: '/estudiante/evaluaciones'
          });
        }
      });
    }
  };

  const deleteExam = (examId: string) => {
    setExams(prev => prev.filter(e => e.id !== examId));
  };

  // ── Asignación de Materias y Docentes por Salón ──
  const assignCourseToSection = (params: {
    seccionId: string;
    cursoId: string;
    docenteId: string;
    horasSemanales?: number;
    aulaDefecto?: string;
  }) => {
    const seccion = MOCK_SECTIONS.find(s => s.id === params.seccionId);
    const curso = MOCK_COURSES.find(c => c.id === params.cursoId);
    const docente = users.find(u => u.id === params.docenteId) || teachers.find(t => t.id === params.docenteId) || MOCK_USERS.find(u => u.id === params.docenteId);

    const existingIdx = sectionCourses.findIndex(
      sc => sc.seccion_id === params.seccionId && sc.curso_id === params.cursoId
    );

    let createdOrUpdated: SectionCourseAssignment;

    if (existingIdx >= 0) {
      const copy = [...sectionCourses];
      copy[existingIdx] = {
        ...copy[existingIdx],
        docente_id: params.docenteId,
        horas_semanales: params.horasSemanales || copy[existingIdx].horas_semanales || 4,
        aula_defecto: params.aulaDefecto || copy[existingIdx].aula_defecto || 'Aula General',
        docente,
        seccion,
        curso,
      };
      setSectionCourses(copy);
      createdOrUpdated = copy[existingIdx];

      // Also update any existing schedule slots for this section & course to the new teacher!
      setScheduleSlots(prev =>
        prev.map(slot =>
          slot.seccion_id === params.seccionId && slot.curso_id === params.cursoId
            ? { ...slot, docente_id: params.docenteId, docente }
            : slot
        )
      );

      showToast(
        `Carga docente actualizada para ${curso?.nombre || 'el curso'}.`,
        'success',
        'Asignación Actualizada'
      );
    } else {
      const newAssignment: SectionCourseAssignment = {
        id: `sca-${Date.now()}`,
        seccion_id: params.seccionId,
        curso_id: params.cursoId,
        docente_id: params.docenteId,
        horas_semanales: params.horasSemanales || 4,
        aula_defecto: params.aulaDefecto || 'Aula General',
        seccion,
        curso,
        docente,
      };
      setSectionCourses(prev => [newAssignment, ...prev]);
      createdOrUpdated = newAssignment;

      showToast(
        `Materia ${curso?.nombre || ''} asignada a ${docente?.nombres.split(' ')[0] || 'docente'}.`,
        'success',
        'Curso Asignado'
      );
    }

    if (docente) {
      addNotification({
        user_id: docente.id,
        tipo: 'comunicado',
        titulo: 'Nueva Carga Académica Asignada',
        mensaje: `Se te ha asignado el curso de ${curso?.nombre} en ${seccion?.grado?.nombre} "${seccion?.letra}".`,
        url_redireccion: '/docente/horario'
      });
    }

    return createdOrUpdated;
  };

  const removeSectionCourse = (assignmentId: string) => {
    const target = sectionCourses.find(sc => sc.id === assignmentId);
    if (!target) return;

    setSectionCourses(prev => prev.filter(sc => sc.id !== assignmentId));
    // Also remove schedule slots associated with this section and course
    setScheduleSlots(prev =>
      prev.filter(
        slot => !(slot.seccion_id === target.seccion_id && slot.curso_id === target.curso_id)
      )
    );

    showToast('Asignación de materia eliminada.', 'info', 'Asignación Removida');
  };

  // ── Gestión Integral de Cursos & Materias ──
  const addCourse = useCallback((data: {
    nombre: string;
    codigo: string;
    nivel: EducationalLevel;
    color?: string;
    color_hex?: string;
    area_curricular?: string;
    horas_semanales_sugeridas?: number;
    descripcion?: string;
    competencias?: { codigo: string; descripcion: string }[];
    assignTo?: { docenteId: string; seccionId: string; horasSemanales?: number; aulaDefecto?: string }[];
  }): Course => {
    const courseId = `course-${data.codigo.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}`;
    const hex = data.color_hex || data.color || '#4f46e5';
    
    const createdCompetencias: Competency[] = (data.competencias || []).map((c, idx) => ({
      id: `comp-${courseId}-${idx + 1}`,
      curso_id: courseId,
      codigo: c.codigo || `C${idx + 1}`,
      descripcion: c.descripcion,
      orden: idx + 1,
    }));

    const newCourse: Course = {
      id: courseId,
      nombre: data.nombre.trim(),
      codigo: data.codigo.trim().toUpperCase(),
      nivel: data.nivel,
      color: hex,
      color_hex: hex,
      area_curricular: data.area_curricular || 'General',
      horas_semanales_sugeridas: data.horas_semanales_sugeridas || 4,
      descripcion: data.descripcion || '',
      activo: true,
      created_at: new Date().toISOString(),
      competencias: createdCompetencias,
    };

    setCourses(prev => [...prev, newCourse]);
    academicService.createCourseInDb(data);

    // Asignaciones directas si fueron seleccionadas en el formulario
    if (data.assignTo && data.assignTo.length > 0) {
      data.assignTo.forEach(item => {
        if (item.docenteId && item.seccionId) {
          assignCourseToSection({
            seccionId: item.seccionId,
            cursoId: newCourse.id,
            docenteId: item.docenteId,
            horasSemanales: item.horasSemanales || newCourse.horas_semanales_sugeridas || 4,
            aulaDefecto: item.aulaDefecto,
          });
        }
      });
    }

    showToast(`Curso "${newCourse.nombre}" registrado exitosamente`, 'success', '✓ Asignatura Registrada');
    return newCourse;
  }, [assignCourseToSection, showToast]);

  const updateCourse = useCallback((
    courseId: string,
    data: Omit<Partial<Course>, 'competencias'> & { competencias?: { codigo: string; descripcion: string; id?: string }[] }
  ) => {
    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      let updatedCompetencias: Competency[] = c.competencias || [];
      if (data.competencias) {
        updatedCompetencias = data.competencias.map((comp, idx) => ({
          id: comp.id || `comp-${courseId}-${idx + 1}-${Date.now()}`,
          curso_id: courseId,
          codigo: comp.codigo || `C${idx + 1}`,
          descripcion: comp.descripcion,
          orden: idx + 1,
        }));
      }
      return {
        ...c,
        ...data,
        competencias: updatedCompetencias,
      };
    }));

    academicService.updateCourseInDb(courseId, data);
    showToast('Curso y competencias actualizados correctamente', 'success');
  }, [showToast]);

  const deleteCourse = useCallback((courseId: string) => {
    const courseToDelete = courses.find(c => c.id === courseId);
    setCourses(prev => prev.filter(c => c.id !== courseId));
    setSectionCourses(prev => prev.filter(sc => sc.curso_id !== courseId));
    setScheduleSlots(prev => prev.filter(s => s.curso_id !== courseId));
    
    academicService.deleteCourseFromDb(courseId);
    showToast(`Curso "${courseToDelete?.nombre || ''}" eliminado`, 'info');
  }, [courses, showToast]);

  const updateSectionCourseTeacher = (assignmentId: string, newDocenteId: string) => {
    const targetDocente = users.find(u => u.id === newDocenteId) || teachers.find(t => t.id === newDocenteId) || MOCK_USERS.find(u => u.id === newDocenteId);
    const targetAssignment = sectionCourses.find(sc => sc.id === assignmentId);
    if (!targetAssignment) return;

    setSectionCourses(prev =>
      prev.map(sc =>
        sc.id === assignmentId
          ? { ...sc, docente_id: newDocenteId, docente: targetDocente }
          : sc
      )
    );

    // Update in schedule slots
    setScheduleSlots(prev =>
      prev.map(slot =>
        slot.seccion_id === targetAssignment.seccion_id && slot.curso_id === targetAssignment.curso_id
          ? { ...slot, docente_id: newDocenteId, docente: targetDocente }
          : slot
      )
    );

    showToast(
      `Docente reasignado: ${targetDocente?.nombres || ''} ${targetDocente?.apellidos || ''}`,
      'success',
      'Docente Asignado'
    );

    if (targetDocente) {
      addNotification({
        user_id: targetDocente.id,
        tipo: 'comunicado',
        titulo: 'Asignación de Curso Actualizada',
        mensaje: `Has sido asignado como docente de ${targetAssignment.curso?.nombre} en ${targetAssignment.seccion?.grado?.nombre} "${targetAssignment.seccion?.letra}".`,
        url_redireccion: '/docente/horario'
      });
    }
  };

  // ── Horarios Escolares por Salón ──
  const addScheduleSlot = (data: {
    seccionId: string;
    cursoId: string;
    docenteId: string;
    dia: DayOfWeek;
    horaInicio: string;
    horaFin: string;
    aula?: string;
  }) => {
    // Datos reales primero; los de ejemplo solo como respaldo
    const seccion = sections.find(s => s.id === data.seccionId) || MOCK_SECTIONS.find(s => s.id === data.seccionId);
    const curso = courses.find(c => c.id === data.cursoId) || MOCK_COURSES.find(c => c.id === data.cursoId);
    const docente = users.find(u => u.id === data.docenteId) || MOCK_USERS.find(u => u.id === data.docenteId);

    const newSlot: ScheduleSlot = {
      id: `slot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      seccion_id: data.seccionId,
      curso_id: data.cursoId,
      docente_id: data.docenteId,
      dia: data.dia,
      hora_inicio: data.horaInicio,
      hora_fin: data.horaFin,
      aula: data.aula || 'Aula Principal',
      seccion,
      curso,
      docente,
    };

    setScheduleSlots(prev => [...prev, newSlot]);

    showToast(
      `Bloque asignado: ${curso?.nombre || 'Curso'} (${data.dia} ${data.horaInicio}-${data.horaFin})`,
      'success',
      'Horario Añadido'
    );

    return newSlot;
  };

  const removeScheduleSlot = (slotId: string) => {
    setScheduleSlots(prev => prev.filter(s => s.id !== slotId));
    showToast('Bloque de horario eliminado.', 'info', 'Horario Actualizado');
  };

  const getSectionCourses = useCallback((seccionId: string) => {
    return sectionCourses.filter(sc => sc.seccion_id === seccionId);
  }, [sectionCourses]);

  // Cada bloque con el curso y el docente actuales (si se renombran o reasignan, el horario se actualiza solo)
  const withCurrentRefs = useCallback((slot: ScheduleSlot): ScheduleSlot => ({
    ...slot,
    curso: courses.find(c => c.id === slot.curso_id) || slot.curso,
    docente: users.find(u => u.id === slot.docente_id) || slot.docente,
    seccion: sections.find(sec => sec.id === slot.seccion_id) || slot.seccion,
  }), [courses, users, sections]);

  const getSectionSchedule = useCallback((seccionId: string) => {
    return scheduleSlots.filter(slot => slot.seccion_id === seccionId).map(withCurrentRefs);
  }, [scheduleSlots, withCurrentRefs]);

  const getTeacherSchedule = useCallback((docenteId: string) => {
    return scheduleSlots.filter(slot => slot.docente_id === docenteId).map(withCurrentRefs);
  }, [scheduleSlots, withCurrentRefs]);

  const getTeacherSections = useCallback((docenteId: string) => {
    const assignments = sectionCourses.filter(sc => sc.docente_id === docenteId);
    const uniqueSecIds = Array.from(new Set(assignments.map(a => a.seccion_id)));
    return uniqueSecIds
      .map(secId => {
        // Primero las secciones y cursos guardados; los de ejemplo solo como respaldo
        const seccion = sections.find(s => s.id === secId) || MOCK_SECTIONS.find(s => s.id === secId);
        const cursos = assignments
          .filter(a => a.seccion_id === secId)
          .map(a => courses.find(c => c.id === a.curso_id) || a.curso || MOCK_COURSES.find(c => c.id === a.curso_id))
          .filter((c): c is Course => !!c);
        return seccion ? { seccion, cursos } : null;
      })
      .filter((item): item is { seccion: Section; cursos: Course[] } => item !== null);
  }, [sectionCourses, sections, courses]);

  // ── Validación Anti-Cruce de Horarios ──
  const checkTeacherConflict = useCallback((
    docenteId: string,
    dia: DayOfWeek,
    horaInicio: string,
    ignoreSlotId?: string
  ): ScheduleConflict => {
    const existingSlot = scheduleSlots.find(
      slot =>
        slot.docente_id === docenteId &&
        slot.dia === dia &&
        slot.hora_inicio === horaInicio &&
        slot.id !== ignoreSlotId
    );

    if (existingSlot) {
      const sec = existingSlot.seccion || MOCK_SECTIONS.find(s => s.id === existingSlot.seccion_id);
      const crs = existingSlot.curso || MOCK_COURSES.find(c => c.id === existingSlot.curso_id);
      const doc = existingSlot.docente || MOCK_USERS.find(u => u.id === existingSlot.docente_id);

      return {
        hasConflict: true,
        conflictingSlot: { ...existingSlot, seccion: sec, curso: crs, docente: doc },
        message: `El Prof. ${doc?.nombres.split(' ')[0]} ${doc?.apellidos.split(' ')[0]} ya tiene asignado ${crs?.nombre} en ${sec?.grado?.nombre} "${sec?.letra}" el día ${dia} a las ${horaInicio}.`
      };
    }

    return { hasConflict: false };
  }, [scheduleSlots]);

  const auditScheduleIntegrity = useCallback(() => {
    const conflicts: { slotA: ScheduleSlot; slotB: ScheduleSlot }[] = [];

    for (let i = 0; i < scheduleSlots.length; i++) {
      for (let j = i + 1; j < scheduleSlots.length; j++) {
        const a = scheduleSlots[i];
        const b = scheduleSlots[j];

        if (
          a.docente_id === b.docente_id &&
          a.dia === b.dia &&
          a.hora_inicio === b.hora_inicio &&
          a.seccion_id !== b.seccion_id
        ) {
          conflicts.push({
            slotA: {
              ...a,
              seccion: a.seccion || MOCK_SECTIONS.find(s => s.id === a.seccion_id),
              curso: a.curso || MOCK_COURSES.find(c => c.id === a.curso_id),
              docente: a.docente || MOCK_USERS.find(u => u.id === a.docente_id),
            },
            slotB: {
              ...b,
              seccion: b.seccion || MOCK_SECTIONS.find(s => s.id === b.seccion_id),
              curso: b.curso || MOCK_COURSES.find(c => c.id === b.curso_id),
              docente: b.docente || MOCK_USERS.find(u => u.id === b.docente_id),
            },
          });
        }
      }
    }

    return {
      totalSlots: scheduleSlots.length,
      conflictsCount: conflicts.length,
      conflicts,
    };
  }, [scheduleSlots]);

  // ── Helper Contextual: Clase Actual / Siguiente del Docente ──
  const getCurrentOrNextClass = useCallback((docenteId: string) => {
    const teacherSlots = getTeacherSchedule(docenteId);
    
    // Convert current JS day to DayOfWeek
    const dayIndex = new Date().getDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri
    const dayMap: Record<number, DayOfWeek> = {
      1: 'lunes',
      2: 'martes',
      3: 'miercoles',
      4: 'jueves',
      5: 'viernes',
    };
    const currentDay: DayOfWeek = dayMap[dayIndex] || 'lunes'; // Default to lunes for weekend testing

    const todaySlots = teacherSlots
      .filter(s => s.dia === currentDay)
      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

    const currentTimeStr = new Date().toLocaleTimeString('es-PE', { hour12: false, hour: '2-digit', minute: '2-digit' });

    // Find current active slot or next upcoming slot
    const currentSlot = todaySlots.find(
      s => currentTimeStr >= s.hora_inicio && currentTimeStr <= s.hora_fin
    ) || todaySlots[0]; // fallback to first slot of day

    const nextSlot = todaySlots.find(s => s.hora_inicio > currentTimeStr) || todaySlots[1] || todaySlots[0];

    return {
      currentSlot,
      nextSlot,
      todaySlots,
    };
  }, [getTeacherSchedule]);

  // ── Bitácora de Sesiones de Clase & Asistencia por Hora ──
  const saveClassSessionLog = (data: {
    slotId: string;
    seccionId: string;
    cursoId: string;
    docenteId: string;
    temaTratado: string;
    observaciones?: string;
    ausentesMatriculaIds?: string[];
  }) => {
    const seccion = MOCK_SECTIONS.find(s => s.id === data.seccionId);
    const curso = MOCK_COURSES.find(c => c.id === data.cursoId);

    const todayStr = new Date().toISOString().split('T')[0];

    const newSession: ClassSessionLog = {
      id: `session-${Date.now()}`,
      slot_id: data.slotId,
      seccion_id: data.seccionId,
      curso_id: data.cursoId,
      docente_id: data.docenteId,
      fecha: todayStr,
      tema_tratado: data.temaTratado,
      observaciones: data.observaciones,
      asistencia_tomada: true,
      alumnos_ausentes: data.ausentesMatriculaIds || [],
      created_at: new Date().toISOString(),
      curso,
      seccion,
    };

    setClassSessions(prev => [newSession, ...prev]);

    // Dispatch notification to students in that section
    enrollments.filter(e => e.seccion_id === data.seccionId).forEach(enr => {
      if (enr.estudiante?.profile_id) {
        addNotification({
          user_id: enr.estudiante.profile_id,
          tipo: 'comunicado',
          titulo: `Sesión de ${curso?.nombre} Registrada`,
          mensaje: `Tema avanzado: ${data.temaTratado}`,
          url_redireccion: '/estudiante/horario'
        });
      }
    });

    showToast(
      `Bitácora guardada: ${data.temaTratado} (${curso?.nombre || ''})`,
      'success',
      'Sesión Registrada'
    );

    return newSession;
  };

  const setAcademicContext = useCallback((ctx: Partial<AcademicContextState>) => {
    setAcademicContextState(prev => {
      const next = { ...prev, ...ctx };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('colegio_academic_context', JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  }, []);

  const setAcademicLevel = useCallback((level: EducationalLevel | 'todos') => {
    setAcademicContext({ nivel: level, gradoId: undefined, seccionId: undefined });
  }, [setAcademicContext]);

  const setAcademicGrade = useCallback((gradoId?: string) => {
    setAcademicContext({ gradoId, seccionId: undefined });
  }, [setAcademicContext]);

  const setAcademicSection = useCallback((seccionId?: string) => {
    setAcademicContext({ seccionId });
  }, [setAcademicContext]);

  const selectedChild = useMemo(() => {
    return childrenList.find(c => c.id === selectedChildId) || childrenList[0];
  }, [childrenList, selectedChildId]);

  // ── Currículo CNEB Oficial ──
  const preloadOfficialCnebCurriculum = useCallback((level?: EducationalLevel) => {
    const { courses: cnebCourses } = getOfficialCnebCoursesAndCompetencies(level);
    let addedCourses = 0;
    let addedCompetencies = 0;

    setCourses(prev => {
      const existingCodes = new Set(prev.map(c => c.codigo.toUpperCase()));
      const newOnes = cnebCourses.filter(c => !existingCodes.has(c.codigo.toUpperCase()));
      addedCourses = newOnes.length;
      addedCompetencies = newOnes.reduce((acc, c) => acc + (c.competencias?.length || 0), 0);
      return [...prev, ...newOnes];
    });

    showToast(
      `CNEB Precargado: ${addedCourses} cursos y ${addedCompetencies} competencias añadidas`,
      'success',
      'Currículo MINEDU Oficial'
    );

    return { addedCourses, addedCompetencies };
  }, [showToast]);

  // ── Gestión de Secciones y Aulas ──
  const addSection = useCallback((data: { gradoId: string; letra: string; capacidadMaxima?: number; aula?: string; tutorId?: string }) => {
    const grado = MOCK_GRADES.find(g => g.id === data.gradoId);
    const newSection: Section = {
      id: `sec-${Date.now()}`,
      grado_id: data.gradoId,
      letra: data.letra.trim().toUpperCase(),
      capacidad_maxima: data.capacidadMaxima || 30,
      aula: data.aula || 'Aula Principal',
      tutor_id: data.tutorId,
      grado,
    };
    setSections(prev => [...prev, newSection]);
    showToast(`Sección ${grado?.nombre || ''} "${newSection.letra}" creada`, 'success', 'Sección Creada');
    return newSection;
  }, [showToast]);

  const updateSection = useCallback((sectionId: string, data: Partial<Section>) => {
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      const updated = { ...s, ...data };
      if (data.grado_id) {
        updated.grado = MOCK_GRADES.find(g => g.id === data.grado_id) || s.grado;
      }
      return updated;
    }));
    showToast('Sección actualizada con éxito', 'success');
  }, [showToast]);

  const deleteSection = useCallback((sectionId: string) => {
    setSections(prev => prev.filter(s => s.id !== sectionId));
    setSectionCourses(prev => prev.filter(sc => sc.seccion_id !== sectionId));
    setScheduleSlots(prev => prev.filter(sl => sl.seccion_id !== sectionId));
    showToast('Sección eliminada del sistema', 'info');
  }, [showToast]);

  const assignSectionTutor = useCallback((seccionId: string, docenteId?: string) => {
    setSections(prev => prev.map(s => s.id === seccionId ? { ...s, tutor_id: docenteId } : s));
    const targetDocente = users.find(u => u.id === docenteId) || teachers.find(t => t.id === docenteId);
    showToast(
      docenteId ? `Tutor asignado: ${targetDocente?.nombres || 'Docente'}` : 'Tutor removido de la sección',
      'success',
      'Tutoría Asignada'
    );
  }, [users, teachers, showToast]);

  // ── Periodos Académicos y Cierre de Bimestres ──
  const updateEvaluationPeriod = useCallback((periodId: string, data: Partial<EvaluationPeriod>) => {
    setEvaluationPeriods(prev => prev.map(p => p.id === periodId ? { ...p, ...data } : p));
    showToast('Periodo académico actualizado', 'success');
  }, [showToast]);

  const toggleClosePeriod = useCallback((periodId: string) => {
    setEvaluationPeriods(prev => prev.map(p => {
      if (p.id !== periodId) return p;
      const nextClosed = !p.cerrado;
      showToast(
        nextClosed ? `Periodo "${p.nombre}" CERRADO para edición de notas` : `Periodo "${p.nombre}" ABIERTO`,
        nextClosed ? 'warning' : 'success',
        'Estado del Periodo'
      );
      return { ...p, cerrado: nextClosed };
    }));
  }, [showToast]);

  // ── Justificación de Inasistencias ──
  const justifyAttendance = useCallback((attendanceId: string, motivo: string, observacion?: string) => {
    setAttendances(prev => prev.map(a => {
      if (a.id !== attendanceId) return a;
      return {
        ...a,
        estado: 'justificado',
        observacion: `[Justificado - ${motivo}] ${observacion || a.observacion || ''}`.trim()
      };
    }));
    showToast('Inasistencia justificada correctamente', 'success', 'Falta Justificada');
  }, [showToast]);

  // ── Anecdotario Conductual / Cuaderno de Control ──
  const addBehaviorLog = useCallback((logData: Omit<BehaviorLogEntry, 'id' | 'created_at'>) => {
    const newEntry: BehaviorLogEntry = {
      id: `beh-${Date.now()}`,
      ...logData,
      created_at: new Date().toISOString(),
    };
    setBehaviorLogs(prev => [newEntry, ...prev]);

    if (logData.visible_apoderado) {
      const enr = enrollments.find(e => e.id === logData.matricula_id);
      if (enr?.estudiante?.profile_id) {
        addNotification({
          user_id: enr.estudiante.profile_id,
          tipo: 'comunicado',
          titulo: `Anotación en Cuaderno de Control: ${logData.titulo}`,
          mensaje: logData.descripcion,
          url_redireccion: '/estudiante'
        });
      }
    }

    showToast(`Anotación conductual (${logData.tipo}) registrada`, 'success', 'Cuaderno de Control');
    return newEntry;
  }, [enrollments, showToast]);

  const deleteBehaviorLog = useCallback((id: string) => {
    setBehaviorLogs(prev => prev.filter(b => b.id !== id));
    showToast('Anotación eliminada', 'info');
  }, [showToast]);

  // ── Tesorería y Pensiones ──
  const addPayment = useCallback((paymentData: Omit<PaymentRecord, 'id' | 'created_at'>) => {
    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      ...paymentData,
      created_at: new Date().toISOString(),
    };
    setPayments(prev => [newPayment, ...prev]);
    showToast(`Pago registrado: ${paymentData.concepto} (S/ ${paymentData.total})`, 'success', 'Tesorería');
    return newPayment;
  }, [showToast]);

  const updatePaymentStatus = useCallback((
    paymentId: string,
    estado: 'pendiente' | 'pagado' | 'vencido' | 'anulado',
    extra?: { metodo_pago?: PaymentRecord['metodo_pago']; numero_operacion?: string; fecha_pago?: string }
  ) => {
    setPayments(prev => prev.map(p => {
      if (p.id !== paymentId) return p;
      return {
        ...p,
        estado,
        ...(extra?.metodo_pago ? { metodo_pago: extra.metodo_pago } : {}),
        ...(extra?.numero_operacion ? { numero_operacion: extra.numero_operacion } : {}),
        fecha_pago: estado === 'pagado' ? (extra?.fecha_pago || new Date().toISOString().split('T')[0]) : p.fecha_pago,
      };
    }));
    showToast(`Estado de cobro actualizado a "${estado.toUpperCase()}"`, 'info', 'Tesorería');
  }, [showToast]);

  const generateMonthlyFeeRecords = useCallback((
    mes: string,
    fechaVencimiento: string,
    montos?: number | { inicial?: number; primaria?: number; secundaria?: number }
  ) => {
    const activeEnrollments = enrollments.filter(e => e.estado === 'activo');
    let createdCount = 0;
    const newRecords: PaymentRecord[] = [];

    activeEnrollments.forEach(enr => {
      const alreadyExists = payments.some(p => p.matricula_id === enr.id && p.mes === mes);
      if (!alreadyExists) {
        let feeAmount = 350;
        if (typeof montos === 'number') {
          feeAmount = montos;
        } else if (montos && typeof montos === 'object') {
          const nivel = enr.seccion?.grado?.nivel || 'primaria';
          if (nivel === 'inicial') feeAmount = montos.inicial || 300;
          else if (nivel === 'secundaria') feeAmount = montos.secundaria || 400;
          else feeAmount = montos.primaria || 350;
        }

        newRecords.push({
          id: `pay-${mes.toLowerCase()}-${enr.id}`,
          matricula_id: enr.id,
          estudiante_id: enr.estudiante_id,
          mes,
          concepto: `Pensión ${mes} 2026`,
          monto: feeAmount,
          mora: 0,
          total: feeAmount,
          fecha_vencimiento: fechaVencimiento,
          estado: 'pendiente',
          created_at: new Date().toISOString(),
          estudiante: enr.estudiante,
          matricula: enr,
        });
        createdCount++;
      }
    });

    if (newRecords.length > 0) {
      setPayments(prev => [...newRecords, ...prev]);
    }
    showToast(`Se generaron ${createdCount} órdenes de pensión para ${mes}`, 'success', 'Emisión Masiva de Pensiones');
    return createdCount;
  }, [enrollments, payments, showToast]);

  // ── Promoción Escolar Masiva ──
  const promoteStudentsMassive = useCallback((params: {
    originSectionId: string;
    targetSectionId: string;
    targetPeriodId: string;
    studentIds: string[];
  }) => {
    const targetSection = sections.find(s => s.id === params.targetSectionId) || MOCK_SECTIONS.find(s => s.id === params.targetSectionId);
    let promotedCount = 0;

    const newEnrollments: Enrollment[] = [];

    params.studentIds.forEach(studentId => {
      const student = students.find(s => s.id === studentId);
      if (!student) return;

      const newEnr: Enrollment = {
        id: `enr-prom-${Date.now()}-${studentId}`,
        estudiante_id: studentId,
        periodo_id: params.targetPeriodId,
        seccion_id: params.targetSectionId,
        fecha_matricula: new Date().toISOString().split('T')[0],
        estado: 'activo',
        observaciones: `Promoción escolar desde sección anterior`,
        estudiante: student,
        seccion: targetSection,
      };
      newEnrollments.push(newEnr);
      promotedCount++;
    });

    setEnrollments(prev => [...newEnrollments, ...prev]);
    showToast(`Promoción escolar completada: ${promotedCount} alumnos promovidos`, 'success', '🎓 Promoción Masiva');
    return { promotedCount };
  }, [sections, students, showToast]);

  // ── Checklist Documentos de Matrícula ──
  const updateEnrollmentDocuments = useCallback((enrollmentId: string, docs: string[]) => {
    setEnrollments(prev => prev.map(e => e.id === enrollmentId ? { ...e, documentos_entregados: docs } : e));
    showToast('Checklist de documentos actualizado', 'success', 'Matrícula');
  }, [showToast]);

  const contextValue = useMemo<AppContextType>(() => ({
    currentUser,
    setCurrentUser: handleSetCurrentUser,
    switchRole,
    academicContext,
    setAcademicContext,
    setAcademicLevel,
    setAcademicGrade,
    setAcademicSection,
    showToast,
    removeToast,
    users,
    addUser,
    updateUserRole,
    toggleUserStatus,
    deleteUser,
    students,
    enrollments,
    courses,
    addCourse,
    updateCourse,
    deleteCourse,
    preloadOfficialCnebCurriculum,
    sections,
    addSection,
    updateSection,
    deleteSection,
    assignSectionTutor,
    gradeLevels: MOCK_GRADES,
    evaluationPeriods,
    updateEvaluationPeriod,
    toggleClosePeriod,
    behaviorLogs,
    addBehaviorLog,
    deleteBehaviorLog,
    payments,
    addPayment,
    updatePaymentStatus,
    generateMonthlyFeeRecords,
    promoteStudentsMassive,
    updateEnrollmentDocuments,
    justifyAttendance,
    teachers,
    addTeacher,
    updateTeacher: (teacherId: string, updatedData: Partial<UserProfile>) => {
      setUsers(prev => prev.map(u => u.id === teacherId ? { ...u, ...updatedData } : u));
      showToast('Docente actualizado con éxito', 'success');
    },
    deleteTeacher: (teacherId: string) => {
      setUsers(prev => prev.filter(u => u.id !== teacherId));
      setSectionCourses(prev => prev.filter(sc => sc.docente_id !== teacherId));
      showToast('Docente eliminado de la plana docente', 'info');
    },
    toggleTeacherStatus: (teacherId: string) => {
      setUsers(prev => prev.map(u => u.id === teacherId ? { ...u, activo: !u.activo } : u));
      showToast('Estado del docente actualizado', 'success');
    },
    sectionCourses,
    assignCourseToSection,
    removeSectionCourse,
    updateSectionCourseTeacher,
    scheduleSlots,
    addScheduleSlot,
    removeScheduleSlot,
    checkTeacherConflict,
    auditScheduleIntegrity,
    getSectionCourses,
    getSectionSchedule,
    getTeacherSchedule,
    getTeacherSections,
    getCurrentOrNextClass,
    classSessions,
    saveClassSessionLog,
    attendances,
    registerAttendance,
    grades,
    updateGrade,
    addStudent,
    updateStudent,
    deleteStudent,
    toggleStudentStatus,
    tasks,
    addTask,
    submissions,
    submitTask,
    gradeTask,
    exams,
    addExam,
    updateExam,
    deleteExam,
    childrenList,
    selectedChildId,
    setSelectedChildId,
    selectedChild,
    parentsList,
    lmsModules,
    lmsProgress,
    completeLMSContent: (matriculaId: string, cursoId: string, contenidoId: string) => {
      const newProgress: LMSStudentProgress = {
        matricula_id: matriculaId,
        curso_id: cursoId,
        contenido_id: contenidoId,
        completado: true,
        fecha_completado: new Date().toISOString(),
      };
      setLmsProgress(prev => [...prev.filter(p => !(p.matricula_id === matriculaId && p.contenido_id === contenidoId)), newProgress]);
      showToast('Progreso de contenido completado', 'success');
    },
    alerts,
    resolveAlert: (alertId: string) => {
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, estado: 'resuelta' } : a));
      showToast('Alerta marcada como resuelta', 'info');
    },
    addAlert: (alertData: Omit<SystemAlert, 'id' | 'created_at' | 'estado'>) => {
      const newAlert: SystemAlert = {
        id: `alert-${Date.now()}`,
        ...alertData,
        estado: 'nueva',
        created_at: new Date().toISOString(),
      };
      setAlerts(prev => [newAlert, ...prev]);
    },
    auditLogs,
    addAuditLog: (logData: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
      const newLog: AuditLogEntry = {
        id: `log-${Date.now()}`,
        ...logData,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };
      setAuditLogs(prev => [newLog, ...prev]);
    },
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    toggleCommandPalette: () => setIsCommandPaletteOpen(prev => !prev),
    onboardingCompleted,
    setOnboardingCompleted,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    toggleSidebar,
    setSidebarCollapsedState,
    saveClassAttendanceQuickly: (
      seccionId: string,
      fecha: string,
      exceptions: { matriculaId: string; estado: AttendanceStatus; observacion?: string }[]
    ) => {
      const sectionEnrollments = enrollments.filter(e => e.seccion_id === seccionId && e.estado === 'activo');
      const exceptionMap = new Map(exceptions.map(e => [e.matriculaId, e]));
      
      const newRecords: AttendanceRecord[] = sectionEnrollments.map(enr => {
        const exc = exceptionMap.get(enr.id);
        const estado = exc ? exc.estado : 'presente';
        // Si el alumno ya tenía registro con el mismo estado (p. ej. marcó con su carnet QR), se conserva su hora real
        const existing = attendances.find(a => a.matricula_id === enr.id && a.fecha === fecha && a.tipo_registro !== 'salida');
        if (existing && existing.estado === estado) return existing;
        return {
          id: `att-quick-${enr.id}-${fecha}`,
          matricula_id: enr.id,
          fecha,
          // Faltas sin hora de entrada; asistencias conservan la hora real si ya existía
          hora_registro: estado === 'falta' || estado === 'justificado'
            ? '—'
            : existing?.hora_registro && existing.hora_registro !== '—' ? existing.hora_registro : '08:00',
          estado,
          metodo: 'manual',
          observacion: exc?.observacion || (exc ? 'Excepción registrada por docente' : 'Presente automático'),
          registrado_por: currentUser.nombres,
        };
      });

      setAttendances(prev => [
        ...prev.filter(a => !(a.fecha === fecha && sectionEnrollments.some(e => e.id === a.matricula_id))),
        ...newRecords
      ]);

      showToast(`Asistencia guardada (${newRecords.length} alumnos registrados)`, 'success', '✓ Asistencia Cerrada');
      return { success: true, totalMarked: newRecords.length };
    },
    notifications,
    markNotificationRead,
    unreadCount,
    // ── Comunicados Institucionales ──
    announcements,
    addAnnouncement: (announcementData: Omit<Announcement, 'id' | 'creado_en'>) => {
      const newAnn: Announcement = {
        id: `ann-${Date.now()}`,
        ...announcementData,
        creado_en: new Date().toISOString(),
      };
      setAnnouncements(prev => [newAnn, ...prev]);
      showToast('Comunicado publicado exitosamente', 'success', '📢 Comunicado Emitido');
      return newAnn;
    },
    deleteAnnouncement: (id: string) => {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      showToast('Comunicado eliminado', 'info');
    },
    markAnnouncementRead: (id: string, userId: string) => {
      setAnnouncements(prev => prev.map(a => {
        if (a.id === id) {
          const leidoPor = a.leido_por || [];
          if (!leidoPor.includes(userId)) {
            return { ...a, leido_por: [...leidoPor, userId] };
          }
        }
        return a;
      }));
    },
    confirmAnnouncement: (id: string, userId: string) => {
      setAnnouncements(prev => prev.map(a => {
        if (a.id === id) {
          const confirmadoPor = a.confirmado_por || [];
          if (!confirmadoPor.includes(userId)) {
            return { ...a, confirmado_por: [...confirmadoPor, userId] };
          }
        }
        return a;
      }));
      showToast('Confirmación registrada con éxito', 'success', '✓ Confirmado');
    },
    // ── Calendario Escolar Institucional & MINEDU ──
    calendarEvents,
    addCalendarEvent: (eventData: Omit<SchoolCalendarEvent, 'id'>) => {
      const newEvent: SchoolCalendarEvent = {
        id: `cal-${Date.now()}`,
        ...eventData,
      };
      setCalendarEvents(prev => [...prev, newEvent]);
      showToast('Evento agregado al calendario escolar', 'success', '📅 Calendario Actualizado');
      return newEvent;
    },
    deleteCalendarEvent: (id: string) => {
      setCalendarEvents(prev => prev.filter(e => e.id !== id));
      showToast('Evento eliminado del calendario', 'info');
    },
    updateCalendarEvent: (id: string, data: Partial<SchoolCalendarEvent>) => {
      setCalendarEvents(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
      showToast('Evento del calendario actualizado', 'success');
    },
    // ── Recuperación Pedagógica / Subsanación CNEB ──
    subsanaciones,
    registerSubsanacion: (data: Omit<SubsanacionRecord, 'id'>) => {
      const newSub: SubsanacionRecord = {
        id: `sub-${Date.now()}`,
        ...data,
      };
      setSubsanaciones(prev => [newSub, ...prev]);
      showToast('Registro de subsanación pedagógica guardado', 'success', '📝 Subsanación CNEB');
      return newSub;
    },
    updateSubsanacion: (id: string, data: Partial<SubsanacionRecord>) => {
      setSubsanaciones(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
      showToast('Acta de subsanación actualizada', 'success');
    },
    // ── Justificaciones de Inasistencia / Tardanzas ──
    justificationRequests,
    requestJustification: (data: Omit<JustificationRequest, 'id' | 'created_at' | 'estado'>) => {
      const newReq: JustificationRequest = {
        ...data,
        id: `justif-${Date.now()}`,
        estado: 'pendiente',
        created_at: new Date().toISOString(),
      };
      setJustificationRequests(prev => [newReq, ...prev]);
      showToast('Solicitud de justificación enviada al tutor/coordinación', 'success', 'Enviado');
      return newReq;
    },
    approveJustification: (id: string, respuesta?: string) => {
      setJustificationRequests(prev => prev.map(req => {
        if (req.id !== id) return req;
        return { ...req, estado: 'aprobada', respuesta_colegio: respuesta, revisado_por: currentUser.nombres };
      }));
      const targetReq = justificationRequests.find(r => r.id === id);
      if (targetReq) {
        setAttendances(prev => prev.map(att => {
          if (att.matricula_id === targetReq.matricula_id && att.fecha === targetReq.fecha) {
            return { ...att, estado: 'justificado', observacion: `Justificada por apoderado: ${targetReq.motivo}` };
          }
          return att;
        }));
      }
      showToast('Justificación aprobada y asistencia regularizada a Justificado', 'success', 'Aprobado');
    },
    rejectJustification: (id: string, motivoRechazo: string) => {
      setJustificationRequests(prev => prev.map(req => {
        if (req.id !== id) return req;
        return { ...req, estado: 'rechazada', respuesta_colegio: motivoRechazo, revisado_por: currentUser.nombres };
      }));
      showToast('Solicitud de justificación rechazada', 'warning', 'Rechazado');
    },

    // ── Asistencia de Personal Docente y Administrativo ──
    staffAttendances,
    recordStaffAttendance: (params: { userId: string; tipo: 'entrada' | 'salida'; metodo?: 'qr' | 'manual' }) => {
      const targetUser = users.find(u => u.id === params.userId);
      const now = new Date();
      const fecha = now.toISOString().split('T')[0];
      const hora = now.toTimeString().split(' ')[0].substring(0, 5);
      
      let estado: 'puntual' | 'tardanza' = 'puntual';
      if (params.tipo === 'entrada') {
        const [h, m] = hora.split(':').map(Number);
        if (h > 7 || (h === 7 && m > 45)) {
          estado = 'tardanza';
        }
      }

      const record: StaffAttendanceRecord = {
        id: `staff-att-${Date.now()}`,
        user_id: params.userId,
        fecha,
        hora_ingreso: params.tipo === 'entrada' ? hora : undefined,
        hora_salida: params.tipo === 'salida' ? hora : undefined,
        tipo: params.tipo,
        estado,
        metodo: params.metodo || 'qr',
        creado_en: now.toISOString(),
      };

      setStaffAttendances(prev => [record, ...prev]);
      const teacherName = targetUser ? `${targetUser.nombres} ${targetUser.apellidos}` : 'Docente';
      return { success: true, message: `Asistencia de personal registrada: ${teacherName} (${estado})`, record };
    },

    brandingConfig,
    updateBrandingConfig,
    resetBrandingConfig,
    isLoading,
    refreshData,
    logout,
    resetToDemoData,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [
    currentUser,
    academicContext,
    students,
    enrollments,
    teachers,
    sectionCourses,
    scheduleSlots,
    classSessions,
    attendances,
    grades,
    tasks,
    submissions,
    exams,
    childrenList,
    selectedChildId,
    selectedChild,
    parentsList,
    lmsModules,
    lmsProgress,
    alerts,
    auditLogs,
    isCommandPaletteOpen,
    onboardingCompleted,
    isSidebarCollapsed,
    toggleSidebar,
    setSidebarCollapsedState,
    brandingConfig,
    updateBrandingConfig,
    resetBrandingConfig,
    notifications,
    unreadCount,
    isLoading,
    sections,
    evaluationPeriods,
    behaviorLogs,
    payments,
    announcements,
    calendarEvents,
    subsanaciones,
    justificationRequests,
    staffAttendances,
    users,
    courses,
    handleSetCurrentUser,
    removeToast,
    showToast,
    updateUserRole,
    toggleUserStatus,
    deleteUser,
    switchRole,
    addCourse,
    updateCourse,
    deleteCourse,
    getSectionCourses,
    getSectionSchedule,
    getTeacherSchedule,
    getTeacherSections,
    checkTeacherConflict,
    auditScheduleIntegrity,
    getCurrentOrNextClass,
    setAcademicContext,
    setAcademicLevel,
    setAcademicGrade,
    setAcademicSection,
    preloadOfficialCnebCurriculum,
    addSection,
    updateSection,
    deleteSection,
    assignSectionTutor,
    updateEvaluationPeriod,
    toggleClosePeriod,
    justifyAttendance,
    addBehaviorLog,
    deleteBehaviorLog,
    addPayment,
    updatePaymentStatus,
    generateMonthlyFeeRecords,
    promoteStudentsMassive,
    updateEnrollmentDocuments,
  ]);

  // El estado inicial se lee de localStorage, que no existe en el servidor.
  // Diferimos el render de los hijos hasta el montaje para evitar errores de hidratación.
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => { setHasMounted(true); }, []);

  return (
    <AppContext.Provider value={contextValue}>
      {hasMounted ? children : <RootLoading />}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe ser usado dentro de un AppProvider');
  }
  return context;
}

