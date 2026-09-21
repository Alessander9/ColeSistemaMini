'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { GradeBadge } from '@/components/notas/GradeBadge';
import { calculateAverage, calculateAnnualStatus } from '@/lib/grades/calculations';
import { 
  QrCode, 
  Award, 
  Clock, 
  FileText, 
  Calendar, 
  GraduationCap, 
  ChevronRight, 
  ArrowRight,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Play,
  TrendingUp,
  Sparkles,
  Flame,
  Check,
  LayoutGrid,
  BarChart3,
  Bell,
  Users,
  CheckSquare,
  ArrowUpRight,
  School,
  Laptop,
  Plus
} from 'lucide-react';
import Link from 'next/link';

export default function EstudianteDashboardPage() {
  const { 
    students, 
    enrollments, 
    grades, 
    attendances, 
    currentUser, 
    scheduleSlots, 
    tasks, 
    submissions, 
    exams, 
    courses, 
    teachers,
    lmsModules,
    announcements,
    confirmAnnouncement,
  } = useApp();

  // Identify active student
  const activeStudent = useMemo(() => {
    if (!currentUser?.id) return null;
    return students.find(s => s.profile_id === currentUser.id || s.id === currentUser.id) || (currentUser.rol === 'estudiante' ? null : students[0] || null);
  }, [students, currentUser]);

  const activeEnrollment = useMemo(() => {
    if (!activeStudent?.id) return null;
    return enrollments.find(e => e.estudiante_id === activeStudent.id) || null;
  }, [enrollments, activeStudent]);

  const studentSectionId = activeEnrollment?.seccion_id || '';

  // Grades calculation 100% real
  const myGrades = useMemo(() => {
    if (!activeEnrollment?.id) return [];
    return grades.filter(g => g.matricula_id === activeEnrollment.id);
  }, [grades, activeEnrollment]);

  const studentGradeLetters = myGrades.map(g => g.nota_letra);
  const { averageLetter, averageScore } = calculateAverage(studentGradeLetters);
  const { status } = calculateAnnualStatus(studentGradeLetters);

  // Attendance calculation 100% real
  const myAttendances = useMemo(() => {
    if (!activeEnrollment?.id) return [];
    return attendances.filter(a => a.matricula_id === activeEnrollment.id);
  }, [attendances, activeEnrollment]);

  const attendanceCount = myAttendances.length;
  const presentCount = myAttendances.filter(a => a.estado === 'presente').length;
  const attendanceRate = attendanceCount > 0 ? Math.round((presentCount / attendanceCount) * 100) : 0;

  // Tasks & submissions 100% real
  const myTasks = useMemo(() => {
    if (!studentSectionId) return [];
    return tasks.filter(t => t.seccion_id === studentSectionId);
  }, [tasks, studentSectionId]);

  const pendingTasks = useMemo(() => {
    if (!activeEnrollment?.id) return myTasks;
    return myTasks.filter(t => !submissions.some(s => s.tarea_id === t.id && s.matricula_id === activeEnrollment.id));
  }, [myTasks, submissions, activeEnrollment]);

  // Today's schedule 100% real
  const todayDay = new Date().toLocaleDateString('es-PE', { weekday: 'long' }).toLowerCase() as any;
  const mySchedule = useMemo(() => {
    if (!studentSectionId) return [];
    return scheduleSlots.filter(s => s.seccion_id === studentSectionId);
  }, [scheduleSlots, studentSectionId]);

  const todaySlots = useMemo(() => {
    const valid = mySchedule.filter(s => s.dia === todayDay || s.dia === 'lunes');
    return valid.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
  }, [mySchedule, todayDay]);

  // Comunicados dirigidos a este estudiante
  const studentAnnouncements = useMemo(() => {
    const myLevel = activeEnrollment?.seccion?.grado?.nivel;
    const myGradeId = activeEnrollment?.seccion?.grado_id;
    const mySecId = activeEnrollment?.seccion_id;

    return announcements.filter(a => {
      const roleMatch = !a.destinatarios_rol || a.destinatarios_rol === 'todos' || a.destinatarios_rol === 'estudiante';
      if (!roleMatch) return false;

      if (a.nivel && a.nivel !== 'todos' && myLevel && a.nivel !== myLevel) return false;
      if (a.grado_id && myGradeId && a.grado_id !== myGradeId) return false;
      if (a.seccion_id && mySecId && a.seccion_id !== mySecId) return false;

      return true;
    });
  }, [announcements, activeEnrollment]);

  const studentName = activeStudent?.profile?.nombres?.split(' ')[0] || currentUser?.nombres?.split(' ')[0] || 'Estudiante';
  const gradeName = activeEnrollment?.seccion?.grado?.nombre ? `${activeEnrollment.seccion.grado.nombre} "${activeEnrollment.seccion.letra}"` : 'Sin aula asignada';
  const studentCode = activeStudent?.codigo_estudiante || 'Sin código';

  // Dynamic greeting by hour
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? '¡Buenos días' : currentHour < 18 ? '¡Buenas tardes' : '¡Buenas noches';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in-50 duration-200">
      
      {/* ── 1. CABECERA PANORÁMICA HERO (ESTILO PORTAL PREMIUM 2026) ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-[#062428] to-[#041a1e] text-white p-6 sm:p-8 lg:p-9 shadow-2xl shadow-emerald-950/30 border border-emerald-500/20">
        
        {/* Luces y ambiente de fondo decorativos */}
        <div className="absolute top-0 right-1/4 -mt-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 -mb-10 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-8">
          
          {/* Columna Izquierda: Saludo fluido, frase inspiracional y badges */}
          <div className="space-y-4 max-w-2xl">
            
            {/* Badge superior */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 backdrop-blur-md border border-emerald-400/30 text-emerald-200 text-xs font-semibold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Portal del Estudiante • Año Escolar 2026</span>
            </div>

            {/* Saludo Principal sin cortes de comas ni saltos extraños */}
            <div className="space-y-1.5">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                <span suppressHydrationWarning>{greeting}</span>,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300" suppressHydrationWarning>
                  {studentName}!
                </span>{' '}
                <span className="inline-block animate-wave origin-bottom-right">👋</span>
              </h1>
              
              <p className="text-sm sm:text-base font-semibold text-emerald-100/90 flex items-center gap-2">
                <span>Tu curiosidad y esfuerzo transforman tu futuro</span>
                <span className="text-blue-400">💙</span>
              </p>

              <p className="text-xs sm:text-sm text-slate-300/80 italic font-medium">
                &ldquo;Aprender es sembrar oportunidades todos los días&rdquo;
              </p>
            </div>

            {/* Badges y Chips de Estado Informativos */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              {/* Bimestre Actual */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-500/30 text-xs font-bold text-emerald-200 backdrop-blur-sm shadow-xs">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Bimestre actual: <strong className="text-white">III Bimestre</strong></span>
              </div>

              {/* Grado y Sección */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-950/60 border border-amber-500/30 text-xs font-bold text-amber-200 backdrop-blur-sm shadow-xs">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>Aula / Sección: <strong className="text-white">{gradeName}</strong></span>
              </div>

              {/* Código de Estudiante */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700 text-xs font-bold text-slate-300 backdrop-blur-sm shadow-xs">
                <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                <span>ID: <strong className="font-mono text-cyan-300">{studentCode}</strong></span>
              </div>
            </div>

          </div>

          {/* Columna Derecha: Tarjeta de Resumen Rápido & Botones de Acción */}
          <div className="flex flex-col sm:flex-row lg:flex-row items-stretch sm:items-center gap-4 lg:gap-5 shrink-0">
            
            {/* Widget de Estado del Alumno (Desktop) */}
            <div className="hidden xl:flex flex-col justify-between p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 w-44 h-36 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">ESTUDIANTE</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-center my-auto">
                <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-black text-sm shadow-md mb-1">
                  {studentName.charAt(0)}
                </div>
                <p className="text-xs font-bold text-white truncate">{studentName}</p>
                <p className="text-[10px] text-emerald-200/70 font-mono">Matriculado 2026</p>
              </div>
              <div className="text-center pt-1 border-t border-white/10">
                <span className="text-[9px] text-slate-400">Asistencia: <strong className="text-emerald-400">{attendanceRate}%</strong></span>
              </div>
            </div>

            {/* Pila de Botones de Acción Rápida */}
            <div className="flex flex-col gap-2.5 w-full sm:w-56 shrink-0">
              
              {/* Botón Principal: Ver Mi Carnet QR */}
              <Link
                href="/estudiante/carnet-qr"
                className="flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-center"
              >
                <QrCode className="w-4 h-4 text-slate-950" />
                <span>Ver Mi Carnet QR</span>
              </Link>

              {/* Botón 2: Ir a Mis Tareas */}
              <Link
                href="/estudiante/tareas"
                className="flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 text-white font-bold text-xs transition-all duration-150 hover:scale-[1.02] cursor-pointer text-center group"
              >
                <LayoutGrid className="w-4 h-4 text-emerald-300 group-hover:rotate-6 transition-transform" />
                <span>Ir a Mis Tareas</span>
                {pendingTasks.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                    {pendingTasks.length}
                  </span>
                )}
              </Link>

              {/* Botón 3: Ver Libreta de Notas */}
              <Link
                href="/estudiante/libreta-notas"
                className="flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 text-white font-bold text-xs transition-all duration-150 hover:scale-[1.02] cursor-pointer text-center group"
              >
                <BarChart3 className="w-4 h-4 text-cyan-300 group-hover:scale-110 transition-transform" />
                <span>Ver Libreta de Notas</span>
              </Link>

            </div>

          </div>

        </div>
      </div>

      {/* ── 2. BARRA DE RUTA DE APRENDIZAJE SECUENCIAL DEL ESTUDIANTE ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Mi Ruta de Estudio Diaria
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Acceso rápido a todas tus herramientas escolares
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-3">
          <Link
            href="/estudiante/carnet-qr"
            className="group flex flex-col p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/60 dark:border-slate-700/60 hover:border-emerald-300 transition-all text-left"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                1. Entrada
              </span>
              <QrCode className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">Carnet QR</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Pase de portería</span>
          </Link>

          <Link
            href="/estudiante/horario"
            className="group flex flex-col p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-slate-200/60 dark:border-slate-700/60 hover:border-sky-300 transition-all text-left"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300">
                2. Clases
              </span>
              <Calendar className="w-3.5 h-3.5 text-sky-500 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">Mi Horario</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Cursos de hoy</span>
          </Link>

          <Link
            href="/estudiante/asistencias"
            className="group flex flex-col p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50 dark:hover:bg-teal-950/40 border border-slate-200/60 dark:border-slate-700/60 hover:border-teal-300 transition-all text-left"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300">
                3. Puntualidad
              </span>
              <Clock className="w-3.5 h-3.5 text-teal-500 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">Asistencia</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Récord y récord</span>
          </Link>

          <Link
            href="/estudiante/tareas"
            className="group flex flex-col p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-slate-200/60 dark:border-slate-700/60 hover:border-purple-300 transition-all text-left"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                4. Deberes
              </span>
              <FileText className="w-3.5 h-3.5 text-purple-500 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">Mis Tareas</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Entregas y archivos</span>
          </Link>

          <Link
            href="/estudiante/evaluaciones"
            className="group flex flex-col p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200/60 dark:border-slate-700/60 hover:border-blue-300 transition-all text-left"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                5. Exámenes
              </span>
              <CheckSquare className="w-3.5 h-3.5 text-blue-500 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">Evaluaciones</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Calendario de pruebas</span>
          </Link>

          <Link
            href="/estudiante/libreta-notas"
            className="group flex flex-col p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200/60 dark:border-slate-700/60 hover:border-amber-300 transition-all text-left"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                6. Notas
              </span>
              <Award className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">Libreta CNEB</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Promedios y reporte</span>
          </Link>
        </div>
      </div>

      {/* ── 3. CARDS DE MÉTRICAS PRINCIPALES ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CARD 1: PROMEDIO ACTUAL */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-xs">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                  PROMEDIO ACTUAL
                </div>
                <div className="text-[11px] text-slate-400">
                  De todas mis materias
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  {averageScore > 0 ? averageScore.toFixed(1) : (averageLetter || '—')}
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 text-xs font-bold">
                  {averageScore > 0 ? '/20' : 'CNEB'}
                </span>
              </div>

              {/* Mini vertical bars visual representation */}
              <div className="flex items-end gap-1 h-8">
                <div className="w-2 h-4 rounded-full bg-purple-200 dark:bg-purple-900/60" />
                <div className="w-2 h-6 rounded-full bg-purple-300 dark:bg-purple-700/60" />
                <div className="w-2 h-8 rounded-full bg-purple-600 dark:bg-purple-400" />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Escala: <span className="font-bold text-slate-700 dark:text-slate-300">{averageLetter ? `Logro ${averageLetter}` : 'Sin notas registradas'}</span></span>
          </div>
        </div>

        {/* CARD 2: PUNTUALIDAD & ASISTENCIA */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                  PUNTUALIDAD
                </div>
                <div className="text-[11px] text-slate-400">
                  Asistencia a clases
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  {attendanceRate}%
                </span>
              </div>

              {/* Mini Circular Progress Ring with User Icon */}
              <div className="relative w-11 h-11 flex items-center justify-center">
                <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100 dark:text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-500"
                    strokeDasharray={`${attendanceRate}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400 absolute" />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{attendanceRate >= 80 ? 'Asistencia regular' : attendanceCount === 0 ? 'Sin registros de asistencia' : 'Atención a inasistencias'}</span>
          </div>
        </div>

        {/* CARD 3: DEBERES PENDIENTES */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-xs">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                  DEBERES PENDIENTES
                </div>
                <div className="text-[11px] text-slate-400">
                  Por revisar y calificar
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <span className="text-3xl sm:text-4xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
                  {pendingTasks.length}
                </span>
              </div>

              {/* Task Checklist Icon Graphic */}
              <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <FileText className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
            <span>{pendingTasks.length === 0 ? '✓ Al día sin pendientes' : `${pendingTasks.length} ${pendingTasks.length === 1 ? 'tarea por entregar' : 'tareas por entregar'}`}</span>
          </div>
        </div>

        {/* CARD 4: PRÓXIMO EXAMEN */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                    PRÓXIMO EXAMEN
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Evaluación programada
                  </div>
                </div>
              </div>

              <Link
                href="/estudiante/evaluaciones"
                className="w-7 h-7 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 text-slate-400 flex items-center justify-center transition-colors shadow-xs"
                title="Ver evaluaciones"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-3 space-y-1">
              <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                {exams.length > 0 ? exams[0].titulo : 'Sin evaluaciones próximas'}
              </h4>
              
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-amber-500" />
                  {exams.length > 0 ? exams[0].fecha_programada : 'Calendario al día'}
                </span>
                {exams.length > 0 && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-500" />
                      {exams[0].hora_inicio}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
              exams.length > 0 
                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}>
              <Bell className="w-3 h-3 text-amber-500" />
              {exams.length > 0 ? 'Evaluación programada' : 'Sin exámenes pendientes'}
            </span>
          </div>
        </div>

      </div>

      {/* ── 3. GRID PRINCIPAL: MI HORARIO DE HOY & MIS PENDIENTES ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Mi Día (Horario de Clases) - Columna 7 */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Mi Día • Horario de Clases
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Cursos y docentes programados para la jornada de hoy
              </p>
            </div>
            <Link
              href="/estudiante/horario"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Ver Semana Completa</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {todaySlots.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No hay clases programadas para hoy.</p>
            ) : (
              todaySlots.map((slot) => {
                const course = courses.find(c => c.id === slot.curso_id);
                const teacher = teachers.find(t => t.id === slot.docente_id);
                return (
                  <div
                    key={slot.id}
                    className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                        {slot.hora_inicio}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {course?.nombre || 'Materia'}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Prof. {teacher?.nombres} {teacher?.apellidos} • {slot.aula || 'Aula Principal'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-semibold text-slate-400 shrink-0">
                      {slot.hora_inicio} - {slot.hora_fin}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Mis Pendientes (Tareas Próximas a Vencer) - Columna 5 */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Mis Tareas & Entregas
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Actividades con entrega abierta
              </p>
            </div>
            <Link
              href="/estudiante/tareas"
              className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
            >
              <span>Ver Todas ({myTasks.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {myTasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No tienes tareas asignadas por el momento.</p>
            ) : (
              myTasks.slice(0, 3).map((task) => {
                const isSubmitted = submissions.some(s => s.tarea_id === task.id && s.matricula_id === activeEnrollment?.id);
                return (
                  <div
                    key={task.id}
                    className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {task.titulo}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Fecha Límite: <strong>{task.fecha_limite}</strong>
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-xl shrink-0 ${
                      isSubmitted
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    }`}>
                      {isSubmitted ? '✓ Entregada' : '● Pendiente'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* ── 4. CONTINUAR APRENDIENDO (AULA VIRTUAL LMS) ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Continuar Aprendiendo • Aula Virtual LMS
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Módulos explicativos, videos y recursos interactivos de tus cursos
            </p>
          </div>
        </div>

        {lmsModules.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No hay módulos de autoaprendizaje activos en el Aula Virtual por el momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {lmsModules.slice(0, 3).map((module) => {
              const course = courses.find(c => c.id === module.curso_id);
              return (
                <div
                  key={module.id}
                  className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg border border-indigo-200/60 dark:border-indigo-800/40">
                      {course?.nombre || 'Curso'}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-3 leading-snug">
                      {module.titulo}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {module.descripcion}
                    </p>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                    <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                      <Play className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{module.contenidos.length} lecciones</span>
                    </div>
                    <Link
                      href="/estudiante/tareas"
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Abrir Módulo <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 5. COMUNICADOS & AVISOS DEL COLEGIO PARA EL ALUMNO ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Mural de Avisos &amp; Comunicados
              </h3>
              <p className="text-xs text-slate-500 font-medium">Información oficial para los estudiantes</p>
            </div>
          </div>
        </div>

        {studentAnnouncements.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No tienes avisos escolares pendientes en este momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {studentAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                      {ann.categoria === 'evento' ? '🎉 Evento Escolar' : ann.tipo === 'urgente' ? '⚠️ Urgente' : '📢 Comunicado'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">{ann.fecha_publicacion || ann.creado_en?.substring(0, 10)}</span>
                  </div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white leading-snug">
                    {ann.titulo}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                    {ann.contenido}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{ann.destinatarios_rol === 'todos' ? 'Toda la comunidad' : 'Alumnos'}</span>
                  {ann.requiere_confirmacion && (
                    <span className="text-emerald-600 font-bold">✓ Requiere lectura</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
