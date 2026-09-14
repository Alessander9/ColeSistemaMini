'use client';

import React, { useMemo } from 'react';
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
  Check
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
    lmsProgress
  } = useApp();

  // Identify active student
  const activeStudent = useMemo(() => {
    return students.find(s => s.profile_id === currentUser.id) || students[0];
  }, [students, currentUser]);

  const activeEnrollment = useMemo(() => {
    return enrollments.find(e => e.estudiante_id === activeStudent?.id) || enrollments[0];
  }, [enrollments, activeStudent]);

  const studentSectionId = activeEnrollment?.seccion_id || 'sec-3pri-a';

  // Grades calculation
  const myGrades = useMemo(() => {
    return grades.filter(g => g.matricula_id === activeEnrollment?.id);
  }, [grades, activeEnrollment]);

  const studentGradeLetters = myGrades.map(g => g.nota_letra);
  const { averageLetter, averageScore } = calculateAverage(studentGradeLetters);
  const { status } = calculateAnnualStatus(studentGradeLetters);

  // Attendance
  const myAttendances = useMemo(() => {
    return attendances.filter(a => a.matricula_id === activeEnrollment?.id);
  }, [attendances, activeEnrollment]);

  const attendanceCount = myAttendances.length || 45;
  const presentCount = myAttendances.filter(a => a.estado === 'presente').length || 43;
  const attendanceRate = Math.round((presentCount / Math.max(1, attendanceCount)) * 100) || 98;

  // Tasks & submissions
  const myTasks = useMemo(() => {
    return tasks.filter(t => t.seccion_id === studentSectionId);
  }, [tasks, studentSectionId]);

  const pendingTasks = useMemo(() => {
    return myTasks.filter(t => !submissions.some(s => s.tarea_id === t.id && s.matricula_id === activeEnrollment?.id));
  }, [myTasks, submissions, activeEnrollment]);

  // Today's schedule
  const todayDay = new Date().toLocaleDateString('es-PE', { weekday: 'long' }).toLowerCase() as any;
  const mySchedule = useMemo(() => {
    return scheduleSlots.filter(s => s.seccion_id === studentSectionId);
  }, [scheduleSlots, studentSectionId]);

  const todaySlots = useMemo(() => {
    const valid = mySchedule.filter(s => s.dia === todayDay || s.dia === 'lunes');
    return valid.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
  }, [mySchedule, todayDay]);

  const studentName = activeStudent?.profile?.nombres?.split(' ')[0] || currentUser?.nombres?.split(' ')[0] || 'Estudiante';
  const gradeName = activeEnrollment?.seccion?.grado?.nombre || '3° de Primaria';
  const sectionLetter = activeEnrollment?.seccion?.letra || 'A';

  // Dynamic greeting
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? '¡Buenos días' : currentHour < 18 ? '¡Buenas tardes' : '¡Buenas noches';

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* ── 1. HERO COCKPIT DEL ESTUDIANTE ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-xl shadow-emerald-950/20 border border-emerald-700/30">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-emerald-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Portal del Estudiante • Año Escolar 2026</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-2.5">
              {greeting}, {studentName}! <span className="inline-block animate-wave origin-bottom-right">🎒</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              {gradeName} — Sección &quot;{sectionLetter}&quot; • Código Oficial: <span className="font-mono font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/30">{activeStudent?.codigo_estudiante || 'EST-2026-001'}</span>
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 text-xs font-bold text-emerald-300 border border-emerald-400/20">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Condición: {status || 'Promovido Destacado'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 text-xs font-bold text-amber-300 border border-amber-400/20">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Racha de Asistencia: 100%
              </span>
            </div>
          </div>

          {/* Direct Student Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
            <Link
              href="/estudiante/carnet-qr"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-lg shadow-emerald-500/30 transition-all hover:scale-102 active:scale-98"
            >
              <QrCode className="w-4 h-4" />
              <span>Ver Mi Carnet QR</span>
            </Link>
            <Link
              href="/estudiante/libreta-notas"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white text-xs font-bold transition-all hover:scale-102"
            >
              <Award className="w-4 h-4 text-amber-300" />
              <span>Libreta Oficial de Notas</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── 2. 4 CARDS DE MÉTRICAS PRINCIPALES ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Promedio Ponderado */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Promedio Actual</span>
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2.5">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {averageScore > 0 ? averageScore.toFixed(1) : '18.5'}
            </span>
            <GradeBadge grade={averageLetter || 'AD'} size="md" />
          </div>
          <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Logro Destacado CNEB
          </p>
        </div>

        {/* Asistencia */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Puntualidad</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {attendanceRate}%
            </span>
            <span className="text-xs text-slate-500">asistencia</span>
          </div>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-2">
            0 inasistencias injustificadas
          </p>
        </div>

        {/* Deberes Pendientes */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Deberes Pendientes</span>
            <div className="w-9 h-9 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-purple-600 dark:text-purple-400">
              {pendingTasks.length}
            </span>
            <span className="text-xs text-slate-500">actividades</span>
          </div>
          <p className="text-[11px] font-medium text-purple-600 dark:text-purple-400 mt-2">
            {pendingTasks.length === 0 ? '¡Felicitaciones! Estás al día' : 'Por entregar esta semana'}
          </p>
        </div>

        {/* Próximo Examen */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Próximo Examen</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-base font-black text-slate-900 dark:text-white truncate">
            {exams[0]?.titulo || 'Práctica Calificada'}
          </div>
          <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 mt-2">
            {exams[0]?.fecha_programada || 'Viernes 18 de Septiembre'}
          </p>
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
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Ver Semana Completa
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
              className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
            >
              Ver Todas ({myTasks.length})
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
      </div>

    </div>
  );
}
