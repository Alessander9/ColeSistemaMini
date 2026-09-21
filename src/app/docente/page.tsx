'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  QrCode, 
  Award, 
  BookOpen, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  Calendar, 
  Clock, 
  Sparkles, 
  MapPin, 
  Check, 
  ChevronRight, 
  GraduationCap, 
  Plus, 
  Layers, 
  FileCheck,
  AlertCircle,
  Play,
  Search,
  CheckCheck,
  UserCheck,
  School,
  XCircle,
  HelpCircle,
  ShieldCheck,
  CheckSquare
} from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { AttendanceStatus } from '@/types';

export default function DocenteDashboardPage() {
  const { 
    courses, 
    students, 
    enrollments, 
    attendances, 
    tasks, 
    submissions, 
    exams, 
    currentUser, 
    getCurrentOrNextClass, 
    getTeacherSections,
    saveClassAttendanceQuickly,
    registerAttendance,
    announcements,
    confirmAnnouncement,
    showToast 
  } = useApp();

  const { currentSlot, nextSlot, todaySlots = [] } = currentUser?.id ? getCurrentOrNextClass(currentUser.id) : { currentSlot: null, nextSlot: null, todaySlots: [] };
  
  // Aulas designadas del profesor 100% reales
  const teacherSections = useMemo(() => {
    return currentUser?.id ? (getTeacherSections(currentUser.id) || []) : [];
  }, [getTeacherSections, currentUser]);

  // Aula seleccionada para el pase de asistencia rápido en el dashboard
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    teacherSections[0]?.seccion.id || ''
  );

  // Fix 1.1: Sincronizar selectedSectionId cuando teacherSections carga después de currentUser
  useEffect(() => {
    if (teacherSections.length > 0 && !selectedSectionId) {
      setSelectedSectionId(teacherSections[0].seccion.id);
    }
  }, [teacherSections, selectedSectionId]);

  // Estados locales para el pase rápido de asistencia en el dashboard
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [statusOverrides, setStatusOverrides] = useState<Record<string, AttendanceStatus>>({});
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [closedSections, setClosedSections] = useState<Record<string, boolean>>({});

  const todayStr = new Date().toISOString().split('T')[0];

  // Matrículas reales del aula seleccionada
  const selectedSectionEnrollments = useMemo(() => {
    return enrollments.filter(e => e.seccion_id === selectedSectionId && e.estado === 'activo');
  }, [enrollments, selectedSectionId]);

  // Alumnos filtrados por búsqueda dentro del aula
  const displayedStudents = useMemo(() => {
    return selectedSectionEnrollments.filter(enr => {
      const fullName = `${enr.estudiante?.profile?.apellidos || ''} ${enr.estudiante?.profile?.nombres || ''} ${enr.estudiante?.codigo_estudiante || ''}`.toLowerCase();
      return fullName.includes(studentSearchQuery.toLowerCase());
    });
  }, [selectedSectionEnrollments, studentSearchQuery]);

  // Obtener estado actual de un estudiante
  const getStudentCurrentStatus = (matriculaId: string): AttendanceStatus => {
    if (statusOverrides[matriculaId]) return statusOverrides[matriculaId];
    const existing = attendances.find(a => a.matricula_id === matriculaId && a.fecha === todayStr);
    return existing ? existing.estado : 'presente';
  };

  // Cambiar estado individual de un alumno en 1 toque
  const handleToggleStatus = (matriculaId: string, status: AttendanceStatus) => {
    setStatusOverrides(prev => ({ ...prev, [matriculaId]: status }));
    registerAttendance({
      matriculaId,
      status,
      metodo: 'manual',
    });
  };

  // Marcar todos presentes en 1 click
  const handleMarkAllPresent = () => {
    const overrides: Record<string, AttendanceStatus> = {};
    selectedSectionEnrollments.forEach(enr => {
      overrides[enr.id] = 'presente';
      registerAttendance({
        matriculaId: enr.id,
        status: 'presente',
        metodo: 'manual',
      });
    });
    setStatusOverrides(overrides);
    showToast('Todos los alumnos del aula marcados como PRESENTES', 'success', '✓ Asistencia Rápida');
  };

  // Guardar y cerrar asistencia de la sección seleccionada
  const handleSaveSectionAttendance = () => {
    setIsSavingAttendance(true);
    
    const exceptions = selectedSectionEnrollments
      .map(enr => ({
        matriculaId: enr.id,
        estado: getStudentCurrentStatus(enr.id)
      }));

    saveClassAttendanceQuickly(selectedSectionId, todayStr, exceptions);
    setClosedSections(prev => ({ ...prev, [selectedSectionId]: true }));
    setIsSavingAttendance(false);

    confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    showToast('Asistencia del aula guardada y sincronizada exitosamente.', 'success', '✓ Asistencia Cerrada');
  };

  // Contadores de asistencia en vivo para el aula activa
  const attendanceStats = useMemo(() => {
    let present = 0;
    let late = 0;
    let absent = 0;
    let justified = 0;

    selectedSectionEnrollments.forEach(enr => {
      const st = getStudentCurrentStatus(enr.id);
      if (st === 'presente') present++;
      else if (st === 'tardanza') late++;
      else if (st === 'falta') absent++;
      else if (st === 'justificado') justified++;
    });

    const total = selectedSectionEnrollments.length || 1;
    const rate = Math.round((present / total) * 100);

    return { present, late, absent, justified, total: selectedSectionEnrollments.length, rate };
  }, [selectedSectionEnrollments, statusOverrides, attendances, todayStr]);

  // Tareas pendientes
  const myTasks = useMemo(() => {
    if (!currentUser?.id) return [];
    return tasks.filter(t => t.docente_id === currentUser.id);
  }, [tasks, currentUser]);

  const pendingReviewSubmissions = useMemo(() => {
    return submissions.filter(s => {
      const isMyTask = myTasks.some(t => t.id === s.tarea_id);
      return isMyTask && !s.calificacion_letra;
    });
  }, [submissions, myTasks]);

  const teacherFirstName = currentUser?.nombres?.split(' ')[0] || 'Docente';

  // Cálculos dinámicos 100% reales para el profesor
  const totalAssignedStudentsCount = useMemo(() => {
    const teacherSecIds = teacherSections.map(ts => ts.seccion.id);
    return enrollments.filter(e => teacherSecIds.includes(e.seccion_id) && e.estado === 'activo').length;
  }, [teacherSections, enrollments]);

  const teacherAverageAttendance = useMemo(() => {
    const teacherSecIds = teacherSections.map(ts => ts.seccion.id);
    const teacherEnrollments = enrollments.filter(e => teacherSecIds.includes(e.seccion_id));
    const enrIds = teacherEnrollments.map(e => e.id);
    const teacherAtts = attendances.filter(a => enrIds.includes(a.matricula_id));
    if (teacherAtts.length === 0) return '0%';
    const presents = teacherAtts.filter(a => a.estado === 'presente').length;
    return `${Math.round((presents / teacherAtts.length) * 100)}%`;
  }, [teacherSections, enrollments, attendances]);

  // Saludo dinámico según la hora
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Buenos días' : currentHour < 18 ? 'Buenas tardes' : 'Buenas noches';

  // Active or upcoming class details
  const featuredClass = currentSlot || nextSlot || todaySlots[0];
  const featuredCourse = courses.find(c => c.id === featuredClass?.curso_id);
  const activeSelectedSection = teacherSections.find(ts => ts.seccion.id === selectedSectionId) || teacherSections[0];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans">
      
      {/* ── 1. HERO COCKPIT PEDAGÓGICO (CLASE EN CURSO / ACCIÓN INMEDIATA) ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-xl shadow-blue-950/20 border border-blue-700/30">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-blue-200 text-xs font-semibold">
              <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
              <span>Gestión Pedagógica Docente • Año Escolar 2026</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span suppressHydrationWarning>{greeting}</span>, Prof. <span suppressHydrationWarning>{teacherFirstName}</span> <span className="inline-block animate-wave origin-bottom-right">👋</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              Tienes <strong className="text-white font-bold">{todaySlots.length} sesiones programadas</strong> y <strong className="text-white font-bold">{teacherSections.length} aulas designadas</strong> para el pase de asistencia rápido.
            </p>

            {/* Banner de Clase Activa / Próxima */}
            {featuredClass && (
              <div className="mt-4 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black text-xs shrink-0 shadow-md ${
                    currentSlot 
                      ? 'bg-emerald-500 text-white shadow-emerald-500/30 ring-2 ring-white/30 animate-pulse' 
                      : 'bg-indigo-600 text-white shadow-indigo-600/30'
                  }`}>
                    <span>{featuredClass.hora_inicio}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-white">
                        {featuredCourse?.nombre || 'Matemática'}
                      </h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        currentSlot 
                          ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40' 
                          : 'bg-blue-500/30 text-blue-200 border border-blue-400/40'
                      }`}>
                        {currentSlot ? '● En Curso Ahora' : 'Próxima Clase'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-2">
                      <span>{featuredClass.seccion?.grado?.nombre || '3° Primaria'} — Sección &quot;{featuredClass.seccion?.letra || 'A'}&quot;</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" /> {featuredClass.aula || 'Aula 204'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (featuredClass.seccion?.id) {
                        setSelectedSectionId(featuredClass.seccion.id);
                        document.getElementById('pase-asistencia-rapido')?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-md shadow-emerald-500/30 transition-all active:scale-95 cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Tomar Asistencia</span>
                  </button>
                  <Link
                    href="/docente/notas"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold transition-all"
                  >
                    <Award className="w-4 h-4 text-amber-300" />
                    <span>Notas</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions Grid Docente */}
          <div className="grid grid-cols-2 gap-2 shrink-0">
            <Link
              href="/docente/asistencia"
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-600/90 hover:bg-emerald-500 text-white border border-emerald-400/30 shadow-md shadow-emerald-600/20 transition-all hover:scale-102"
            >
              <QrCode className="w-5 h-5 mb-1 text-emerald-200" />
              <span className="text-xs font-bold">Lector QR</span>
            </Link>
            <Link
              href="/docente/notas"
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-indigo-600/90 hover:bg-indigo-500 text-white border border-indigo-400/30 shadow-md shadow-indigo-600/20 transition-all hover:scale-102"
            >
              <Award className="w-5 h-5 mb-1 text-indigo-200" />
              <span className="text-xs font-bold">Registro Notas</span>
            </Link>
            <Link
              href="/docente/tareas"
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all hover:scale-102"
            >
              <Plus className="w-5 h-5 mb-1 text-purple-300" />
              <span className="text-xs font-bold">+ Nueva Tarea</span>
            </Link>
            <Link
              href="/docente/horario"
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all hover:scale-102"
            >
              <Calendar className="w-5 h-5 mb-1 text-sky-300" />
              <span className="text-xs font-bold">Mi Horario</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── 2. BARRA DE FLUJO PEDAGÓGICO SECUENCIAL (JORNADA DOCENTE) ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Secuencia Lógica de Trabajo Docente
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Flujo diario recomendado para aula
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-3">
          <Link
            href="/docente/horario"
            className="group flex flex-col p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/60 dark:border-slate-700/60 hover:border-indigo-300 transition-all text-left"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                Paso 1
              </span>
              <Calendar className="w-3.5 h-3.5 text-indigo-500 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">Mi Horario</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Bloques y aulas</span>
          </Link>

          <Link
            href="/docente/asistencia"
            className="group flex flex-col p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/60 dark:border-slate-700/60 hover:border-emerald-300 transition-all text-left"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                Paso 2
              </span>
              <QrCode className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">Pase Asistencia</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Lista o lector QR</span>
          </Link>

          <Link
            href="/docente/notas"
            className="group flex flex-col p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200/60 dark:border-slate-700/60 hover:border-amber-300 transition-all text-left"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                Paso 3
              </span>
              <Award className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">Notas CNEB</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Escala AD, A, B, C</span>
          </Link>

          <Link
            href="/docente/tareas"
            className="group flex flex-col p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-slate-200/60 dark:border-slate-700/60 hover:border-purple-300 transition-all text-left"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                Paso 4
              </span>
              <FileText className="w-3.5 h-3.5 text-purple-500 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">Tareas & LMS</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Publicar y calificar</span>
          </Link>

          <Link
            href="/docente/evaluaciones"
            className="group flex flex-col p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200/60 dark:border-slate-700/60 hover:border-blue-300 transition-all text-left"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                Paso 5
              </span>
              <CheckSquare className="w-3.5 h-3.5 text-blue-500 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">Evaluaciones</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Exámenes y actas</span>
          </Link>
        </div>
      </div>

      {/* ── 3. SECCIÓN PRINCIPAL: SELECTOR DE AULAS DESIGNADAS & PASE DE ASISTENCIA RÁPIDO ── */}
      <div id="pase-asistencia-rapido" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6">
        
        {/* Cabecera de la Sección */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <UserCheck className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                Pase de Asistencia Rápido de Aula
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 pl-10">
              Selecciona cualquiera de tus aulas designadas para registrar la asistencia diaria en un solo toque.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleMarkAllPresent}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
              title="Marcar todos los estudiantes de esta aula en estado PRESENTE"
            >
              <CheckCheck className="w-4 h-4 text-emerald-600" />
              <span>Marcar Todos Presentes</span>
            </button>

            <Link
              href="/docente/asistencia"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <QrCode className="w-4 h-4" />
              <span>Modo Carnet QR</span>
            </Link>
          </div>
        </div>

        {/* ── SELECTOR VISUAL DE AULAS DESIGNADAS ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Mis Aulas Asignadas ({teacherSections.length})
            </span>
            <span className="text-[11px] text-slate-400">
              Haz clic en cualquier aula para cargar su padrón
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {teacherSections.map((ts) => {
              const sec = ts.seccion;
              const isSelected = selectedSectionId === sec.id;
              const isClosed = closedSections[sec.id];
              const coursesList = ts.cursos.map(c => c.nombre).join(', ') || 'Matemática';

              return (
                <div
                  key={sec.id}
                  onClick={() => setSelectedSectionId(sec.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'bg-gradient-to-br from-emerald-50/90 to-indigo-50/50 dark:from-emerald-950/40 dark:to-indigo-950/30 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md scale-101'
                      : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                        isSelected 
                          ? 'bg-emerald-600 text-white border-emerald-600' 
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}>
                        {sec.grado?.nivel || 'Primaria'}
                      </span>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white mt-1.5">
                        {sec.grado?.nombre || 'Grado'} — Sección &quot;{sec.letra}&quot;
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[180px] mt-0.5">
                        {coursesList}
                      </p>
                    </div>

                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-emerald-500 text-white shadow-xs' : 'bg-white dark:bg-slate-700 text-slate-400'
                    }`}>
                      <School className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      {sec.aula || 'Aula 201'}
                    </span>
                    
                    {isClosed ? (
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Cerrada Hoy
                      </span>
                    ) : (
                      <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Pendiente
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── COCKPIT DE TOMA DE ASISTENCIA DEL AULA SELECCIONADA ── */}
        <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800 space-y-4">
          
          {/* Header del Aula Activa */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                  Padrón de Estudiantes:
                </span>
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {activeSelectedSection?.seccion?.grado?.nombre || 'Aula Asignada'} — Sección &quot;{activeSelectedSection?.seccion?.letra || '-'}&quot; ({attendanceStats.total} alumnos)
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {attendanceStats.present} Presentes
                </span>
                <span>•</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {attendanceStats.late} Tardanzas
                </span>
                <span>•</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">
                  {attendanceStats.absent} Faltas
                </span>
                <span>•</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {attendanceStats.justified} Justificadas
                </span>
              </div>
            </div>

            {/* Buscador de Alumnos en el aula */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                placeholder="Buscar alumno en este salón..."
                className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden"
              />
              {studentSearchQuery && (
                <button
                  type="button"
                  onClick={() => setStudentSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Grid de Estudiantes con Selector de 1 Toque */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
            {displayedStudents.map((enr) => {
              const currentStatus = getStudentCurrentStatus(enr.id);
              const fullName = `${enr.estudiante?.profile?.apellidos || 'Alumno'}, ${enr.estudiante?.profile?.nombres || 'Estudiante'}`;
              const dni = enr.estudiante?.profile?.dni || enr.estudiante?.codigo_estudiante || 'DNI';

              return (
                <div
                  key={enr.id}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    currentStatus === 'presente'
                      ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                      : currentStatus === 'tardanza'
                        ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/60'
                        : currentStatus === 'falta'
                          ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800/60'
                          : 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800/60'
                  }`}
                >
                  {/* Foto y Datos */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={enr.estudiante?.profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=6366f1&color=fff&size=80`}
                      alt={fullName}
                      className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {fullName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {dni}
                      </div>
                    </div>
                  </div>

                  {/* Botones de Estado Rápido (P / T / F / J) */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(enr.id, 'presente')}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        currentStatus === 'presente'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-100'
                      }`}
                      title="Presente"
                    >
                      P
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(enr.id, 'tardanza')}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        currentStatus === 'tardanza'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-100'
                      }`}
                      title="Tardanza"
                    >
                      T
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(enr.id, 'falta')}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        currentStatus === 'falta'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-100'
                      }`}
                      title="Falta injustificada"
                    >
                      F
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(enr.id, 'justificado')}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        currentStatus === 'justificado'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-100'
                      }`}
                      title="Falta Justificada"
                    >
                      J
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botón Principal Guardar Asistencia */}
          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Índice de asistencia de este salón hoy: <strong className="text-slate-900 dark:text-white font-bold">{attendanceStats.rate}%</strong>
            </div>

            <button
              type="button"
              onClick={handleSaveSectionAttendance}
              disabled={isSavingAttendance}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Asistencia de {activeSelectedSection?.seccion?.grado?.nombre || 'Aula'} &quot;{activeSelectedSection?.seccion?.letra || '-'}&quot;</span>
            </button>
          </div>

        </div>

      </div>

      {/* ── 3. KPIS DOCENTES DEL DÍA ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Clases Hoy */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              Clases de Hoy
            </span>
            <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {todaySlots.length}
            </span>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
              sesiones programadas
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Aulas asignadas:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{teacherSections.length} secciones</span>
          </div>
        </div>

        {/* KPI 2: Entregas por Calificar */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              Tareas por Calificar
            </span>
            <div className="w-9 h-9 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-purple-600 dark:text-purple-400">
              {pendingReviewSubmissions.length}
            </span>
            <span className="text-xs text-slate-500">entregas de alumnos</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Tareas activas en LMS:</span>
            <span className="font-bold text-purple-600 dark:text-purple-400">{myTasks.length} creadas</span>
          </div>
        </div>

        {/* KPI 3: Alumnos a Cargo */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              Alumnos a Cargo
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {totalAssignedStudentsCount}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              estudiantes
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Asistencia promedio:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{teacherAverageAttendance}</span>
          </div>
        </div>

        {/* KPI 4: Cierre Bimestral */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              Cierre II Bimestre
            </span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-amber-600 dark:text-amber-400">
              7 días
            </span>
            <span className="text-xs text-slate-500">para registrar notas</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Competencias CNEB:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">En proceso</span>
          </div>
        </div>

      </div>

      {/* ── 4. GRID: TIMELINE DE CLASES & BANDEJA DE REVISIÓN ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Mis Clases de Hoy (Columna 7) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Mis Clases de Hoy (Cronograma en Vivo)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Sesiones pedagógicas asignadas para el día
              </p>
            </div>
            <Link
              href="/docente/horario"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Ver Horario Semanal
            </Link>
          </div>

          <div className="space-y-3">
            {todaySlots.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No tienes sesiones programadas para hoy. Puedes consultar tu horario semanal.
              </div>
            ) : (
              todaySlots.map((slot) => {
                const course = courses.find(c => c.id === slot.curso_id);
                const section = slot.seccion;
                const isCurrent = currentSlot?.id === slot.id;

                return (
                  <div
                    key={slot.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isCurrent
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 shadow-md ring-2 ring-indigo-500/20'
                        : 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black text-xs shrink-0 ${
                        isCurrent 
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        <span>{slot.hora_inicio}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {course?.nombre || 'Curso'}
                          </h4>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white animate-pulse">
                              ● En Curso
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {section?.grado?.nombre || 'Grado'} — Sección &quot;{section?.letra || 'A'}&quot; • {slot.aula || 'Aula 204'}
                        </p>
                      </div>
                    </div>

                    {/* Botones de acción directa por clase */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (section?.id) {
                            setSelectedSectionId(section.id);
                            document.getElementById('pase-asistencia-rapido')?.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs transition-colors cursor-pointer"
                      >
                        Pase Rápido
                      </button>
                      <Link
                        href="/docente/notas"
                        className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 shadow-2xs transition-colors"
                      >
                        Notas
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pendientes de Revisión & Evaluaciones (Columna 5) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Bandeja de Pendientes
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Entregas por corregir y cierres pedagógicos
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold text-xs border border-purple-200/60 dark:border-purple-800/40">
              {pendingReviewSubmissions.length} {pendingReviewSubmissions.length === 1 ? 'entrega' : 'entregas'}
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                <span>Tareas por Calificar</span>
                <span className="text-purple-600 dark:text-purple-400 font-black">{pendingReviewSubmissions.length} {pendingReviewSubmissions.length === 1 ? 'entrega' : 'entregas'}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {pendingReviewSubmissions.length > 0 
                  ? `Tienes ${pendingReviewSubmissions.length} actividades entregadas por estudiantes esperando calificación.`
                  : 'No tienes entregas pendientes de calificación en este momento.'}
              </p>
              <Link
                href="/docente/tareas"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline pt-1"
              >
                Revisar Entregas <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                <span>Cierre de Notas II Bimestre</span>
                <span className="text-amber-600 dark:text-amber-400 font-black">7 Días Restantes</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Recuerda registrar la conclusión descriptiva en la competencia C2 para alumnos con nota C o B.
              </p>
              <Link
                href="/docente/notas"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline pt-1"
              >
                Completar Registro <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                <span>Banco de Evaluaciones</span>
                <span className="text-blue-600 dark:text-blue-400 font-black">{exams.length} programadas</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Revisa el calendario oficial de prácticas calificadas y exámenes bimestrales.
              </p>
              <Link
                href="/docente/evaluaciones"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline pt-1"
              >
                Ver Evaluaciones <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. SECCIÓN DE COMUNICADOS & CITACIONES INSTITUCIONALES PARA DOCENTES ── */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span>Circular Institucional &amp; Convocatorias a Docentes</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                  Plana Docente 2026
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">Disposiciones pedagógicas emitidas por Dirección y Coordinación Académica</p>
            </div>
          </div>
        </div>

        {announcements.filter(a => !a.destinatarios_rol || a.destinatarios_rol === 'todos' || a.destinatarios_rol === 'docente').length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
            No hay comunicados o citaciones docentes pendientes en este momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {announcements
              .filter(a => !a.destinatarios_rol || a.destinatarios_rol === 'todos' || a.destinatarios_rol === 'docente')
              .map((ann) => {
                const isConfirmed = currentUser?.id && ann.confirmado_por?.includes(currentUser.id);
                const isCitacion = ann.categoria === 'citacion' || ann.tipo === 'citacion';
                const isUrgente = ann.tipo === 'urgente';

                return (
                  <div key={ann.id} className="p-4 sm:p-5 rounded-2xl border bg-slate-50/60 dark:bg-slate-800/30 border-slate-200/80 dark:border-slate-800 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md ${
                          isCitacion ? 'bg-purple-100 text-purple-800' : isUrgente ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {isCitacion ? '📅 Convocatoria Docente' : isUrgente ? '⚠️ Urgente' : '📢 Circular Interna'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {ann.fecha_publicacion || ann.creado_en?.substring(0, 10) || '2026'}
                        </span>
                      </div>

                      <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                        {ann.titulo}
                      </h4>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line font-medium">
                        {ann.contenido}
                      </p>

                      {isCitacion && (ann.fecha_citacion || ann.lugar_citacion || ann.enlace_reunion) && (
                        <div className="p-2.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200/60 space-y-1 text-xs text-purple-950 dark:text-purple-200">
                          {ann.fecha_citacion && (
                            <div className="flex items-center gap-1.5 font-bold">
                              <Calendar className="w-3.5 h-3.5 text-purple-600" />
                              <span>Reunión: {ann.fecha_citacion} {ann.hora_citacion ? `(${ann.hora_citacion})` : ''}</span>
                            </div>
                          )}
                          {ann.lugar_citacion && (
                            <div className="flex items-center gap-1.5 font-medium text-[11px] text-slate-600 dark:text-slate-400">
                              <MapPin className="w-3.5 h-3.5 text-slate-500" />
                              <span>Lugar: {ann.lugar_citacion}</span>
                            </div>
                          )}
                          {ann.enlace_reunion && (
                            <a
                              href={ann.enlace_reunion}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-black text-blue-600 hover:underline pt-1"
                            >
                              <span>🔗 Sala Virtual (Google Meet / Zoom)</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2">
                      <div className="text-[10px] text-slate-400">
                        {ann.requiere_confirmacion ? 'Requiere acuse de recibo' : 'Aviso informativo'}
                      </div>

                      {ann.requiere_confirmacion && (
                        isConfirmed ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-black">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Recibido y Leído</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => confirmAnnouncement(ann.id, currentUser?.id || 'docente-user')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-xs cursor-pointer"
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
                            <span>Confirmar Recepción</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

    </div>
  );
}
