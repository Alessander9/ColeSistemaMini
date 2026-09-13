'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
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
  ScheduleConflict
} from '@/types';
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
  MOCK_CLASS_SESSIONS
} from '@/lib/mock-data';
import { gradeToNumber } from '@/lib/grades/calculations';
import { generateStudentPassword, generateStudentEmail, generateStudentUsername } from '@/lib/auth/generateCredentials';

interface AppContextType {
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  switchRole: (role: UserRole) => void;
  
  students: Student[];
  enrollments: Enrollment[];
  courses: Course[];
  sections: Section[];
  gradeLevels: GradeLevel[];
  evaluationPeriods: EvaluationPeriod[];
  teachers: UserProfile[];
  addTeacher: (data: {
    nombres: string;
    apellidos: string;
    dni: string;
    email?: string;
    telefono?: string;
    especialidad?: string;
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
  }) => { success: boolean; message: string; record?: AttendanceRecord };
  
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
    genero?: string;
  }) => { student: Student; credentials: { username: string; password: string; email: string } };

  tasks: TaskAssignment[];
  addTask: (task: {
    cursoId: string;
    seccionId: string;
    titulo: string;
    descripcion: string;
    fechaLimite: string;
    competenciaId?: string;
  }) => TaskAssignment;

  submissions: TaskSubmission[];
  submitTask: (params: {
    tareaId: string;
    matriculaId: string;
    comentarioEstudiante?: string;
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
    tipo: 'examen' | 'practica' | 'proyecto';
    fechaProgramada: string;
    horaInicio?: string;
    duracionMinutos: number;
  }) => EvaluationExam;

  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  unreadCount: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<UserProfile[]>(MOCK_USERS);
  const [currentUser, setCurrentUser] = useState<UserProfile>(MOCK_USERS[0]); // Default to Admin
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [enrollments, setEnrollments] = useState<Enrollment[]>(MOCK_ENROLLMENTS);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>(MOCK_ATTENDANCES);
  const [grades, setGrades] = useState<GradeRecord[]>(MOCK_GRADE_RECORDS);
  const [tasks, setTasks] = useState<TaskAssignment[]>(MOCK_TASKS);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>(MOCK_SUBMISSIONS);
  const [exams, setExams] = useState<EvaluationExam[]>(MOCK_EXAMS);
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);
  const [sectionCourses, setSectionCourses] = useState<SectionCourseAssignment[]>(MOCK_SECTION_COURSES);
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>(MOCK_SCHEDULE_SLOTS);
  const [classSessions, setClassSessions] = useState<ClassSessionLog[]>(MOCK_CLASS_SESSIONS);

  const teachers = users.filter(u => u.rol === 'docente');

  const addTeacher = (data: {
    nombres: string;
    apellidos: string;
    dni: string;
    email?: string;
    telefono?: string;
    especialidad?: string;
  }) => {
    const cleanFirst = data.nombres.trim().split(' ')[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const cleanLast = data.apellidos.trim().split(' ')[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const autoEmail = data.email?.trim() || `${cleanFirst[0]}${cleanLast}@colegio.edu.pe`;
    const autoUsername = `${cleanFirst[0]}${cleanLast}${data.dni.slice(-4)}`;
    const autoPassword = `Docente2026!`;

    const newTeacher: UserProfile = {
      id: `user-docente-${Date.now()}`,
      rol: 'docente',
      nombres: data.nombres,
      apellidos: data.apellidos,
      dni: data.dni,
      email: autoEmail,
      telefono: data.telefono,
      especialidad: data.especialidad || 'Educación General',
      avatar_url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      activo: true,
    };

    setUsers(prev => [...prev, newTeacher]);
    return {
      teacher: newTeacher,
      credentials: {
        username: autoUsername,
        password: autoPassword,
        email: autoEmail,
      }
    };
  };

  const switchRole = (role: UserRole) => {
    const user = users.find(u => u.rol === role);
    if (user) {
      setCurrentUser(user);
    }
  };

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

  const unreadCount = notifications.filter(n => !n.leido).length;

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
  }) => {
    let targetEnrollment: Enrollment | undefined;

    if (studentQrToken) {
      const student = students.find(s => s.token_qr === studentQrToken || s.codigo_estudiante === studentQrToken);
      if (!student) {
        return { success: false, message: 'Código QR no reconocido o estudiante inexistente' };
      }
      targetEnrollment = enrollments.find(e => e.estudiante_id === student.id);
    } else if (matriculaId) {
      targetEnrollment = enrollments.find(e => e.id === matriculaId);
    }

    if (!targetEnrollment) {
      return { success: false, message: 'Estudiante no matriculado en el periodo lectivo actual' };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const currentTimeStr = new Date().toLocaleTimeString('es-PE', { hour12: false });

    const existingIndex = attendances.findIndex(
      a => a.matricula_id === targetEnrollment!.id && a.fecha === todayStr
    );

    const studentName = `${targetEnrollment.estudiante?.profile?.nombres} ${targetEnrollment.estudiante?.profile?.apellidos}`;

    // Emit Notification
    addNotification({
      user_id: targetEnrollment.estudiante?.profile_id || '',
      tipo: 'asistencia',
      titulo: 'Asistencia Registrada',
      mensaje: `Ingreso registrado a las ${currentTimeStr} (${status.toUpperCase()}) vía ${metodo.toUpperCase()}`,
      url_redireccion: '/estudiante/asistencias'
    });

    if (existingIndex >= 0) {
      const updated = [...attendances];
      updated[existingIndex] = {
        ...updated[existingIndex],
        estado: status,
        hora_registro: currentTimeStr,
        metodo,
        observacion: observacion || updated[existingIndex].observacion,
      };
      setAttendances(updated);
      return { 
        success: true, 
        message: `Asistencia actualizada para ${studentName} (${status.toUpperCase()})`,
        record: updated[existingIndex]
      };
    } else {
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
      return { 
        success: true, 
        message: `¡Asistencia registrada con éxito para ${studentName}!`,
        record: newRecord
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
    genero?: string;
  }) => {
    const studentCount = students.length + 1;
    const studentCode = `EST-2026-${String(studentCount).padStart(3, '0')}`;
    const tokenQr = `QR-${studentCode}-${data.nombres.split(' ')[0].toUpperCase()}-${data.apellidos.split(' ')[0].toUpperCase()}`;

    // ── Auto-generate credentials ──────────────────────────────
    const password = generateStudentPassword(data.nombres, data.apellidos, data.fechaNacimiento);
    const email    = generateStudentEmail(data.nombres, data.apellidos);
    const username = generateStudentUsername(data.apellidos, data.dni);
    // ──────────────────────────────────────────────────────────

    const newProfile: UserProfile = {
      id: `user-alumno-${Date.now()}`,
      rol: 'estudiante',
      nombres: data.nombres,
      apellidos: data.apellidos,
      dni: data.dni,
      email,
      telefono: data.telefonoApoderado,
      avatar_url: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
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
      token_qr: tokenQr,
      profile: newProfile,
    };

    const targetSection = MOCK_SECTIONS.find(s => s.id === data.seccionId);

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

    return { student: newStudent, credentials: { username, password, email } };
  };

  const addTask = (data: {
    cursoId: string;
    seccionId: string;
    titulo: string;
    descripcion: string;
    fechaLimite: string;
    competenciaId?: string;
  }) => {
    const course = MOCK_COURSES.find(c => c.id === data.cursoId);
    const newTask: TaskAssignment = {
      id: `task-${Date.now()}`,
      curso_id: data.cursoId,
      seccion_id: data.seccionId,
      docente_id: currentUser.id,
      competencia_id: data.competenciaId,
      titulo: data.titulo,
      descripcion: data.descripcion,
      fecha_limite: data.fechaLimite,
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

    return newTask;
  };

  const submitTask = ({
    tareaId,
    matriculaId,
    comentarioEstudiante
  }: {
    tareaId: string;
    matriculaId: string;
    comentarioEstudiante?: string;
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
        comentario_estudiante: comentarioEstudiante,
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
  };

  const addExam = (data: {
    cursoId: string;
    seccionId: string;
    periodoEvaluacionId: string;
    competenciaId: string;
    titulo: string;
    tipo: 'examen' | 'practica' | 'proyecto';
    fechaProgramada: string;
    horaInicio?: string;
    duracionMinutos: number;
  }) => {
    const course = MOCK_COURSES.find(c => c.id === data.cursoId);
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
      ponderacion: 1.0,
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

    return newExam;
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
    const docente = MOCK_USERS.find(u => u.id === params.docenteId);

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
  };

  const updateSectionCourseTeacher = (assignmentId: string, newDocenteId: string) => {
    const targetDocente = MOCK_USERS.find(u => u.id === newDocenteId);
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
    const seccion = MOCK_SECTIONS.find(s => s.id === data.seccionId);
    const curso = MOCK_COURSES.find(c => c.id === data.cursoId);
    const docente = MOCK_USERS.find(u => u.id === data.docenteId);

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
    return newSlot;
  };

  const removeScheduleSlot = (slotId: string) => {
    setScheduleSlots(prev => prev.filter(s => s.id !== slotId));
  };

  const getSectionCourses = (seccionId: string) => {
    return sectionCourses.filter(sc => sc.seccion_id === seccionId);
  };

  const getSectionSchedule = (seccionId: string) => {
    return scheduleSlots.filter(slot => slot.seccion_id === seccionId);
  };

  const getTeacherSchedule = (docenteId: string) => {
    return scheduleSlots.filter(slot => slot.docente_id === docenteId);
  };

  const getTeacherSections = (docenteId: string) => {
    const assignments = sectionCourses.filter(sc => sc.docente_id === docenteId);
    const uniqueSecIds = Array.from(new Set(assignments.map(a => a.seccion_id)));
    return uniqueSecIds
      .map(secId => {
        const seccion = MOCK_SECTIONS.find(s => s.id === secId);
        const cursos = assignments
          .filter(a => a.seccion_id === secId)
          .map(a => a.curso || MOCK_COURSES.find(c => c.id === a.curso_id))
          .filter((c): c is Course => !!c);
        return seccion ? { seccion, cursos } : null;
      })
      .filter((item): item is { seccion: Section; cursos: Course[] } => item !== null);
  };

  // ── Validación Anti-Cruce de Horarios ──
  const checkTeacherConflict = (
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
  };

  const auditScheduleIntegrity = () => {
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
  };

  // ── Helper Contextual: Clase Actual / Siguiente del Docente ──
  const getCurrentOrNextClass = (docenteId: string) => {
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
  };

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

    return newSession;
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchRole,
        students,
        enrollments,
        courses: MOCK_COURSES,
        sections: MOCK_SECTIONS,
        gradeLevels: MOCK_GRADES,
        evaluationPeriods: MOCK_EVALUATION_PERIODS,
        teachers,
        addTeacher,
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
        tasks,
        addTask,
        submissions,
        submitTask,
        gradeTask,
        exams,
        addExam,
        notifications,
        markNotificationRead,
        unreadCount,
      }}
    >
      {children}
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

