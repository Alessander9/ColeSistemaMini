'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { GradeBadge } from '@/components/notas/GradeBadge';
import { calculateAverage, calculateAnnualStatus } from '@/lib/grades/calculations';
import { QrCard } from '@/components/qr/QrCard';
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
  Plus,
  X,
  Rocket,
  Lightbulb,
  MessageCircle,
  UserCheck,
  ListChecks
} from 'lucide-react';
import Link from 'next/link';

const STUDY_TIPS = [
  'Explicarle lo que aprendiste a papá, mamá o a un amigo hace que tu cerebro lo recuerde para siempre.',
  'Estudia en bloques de 25 minutos y descansa 5: tu mente rinde más con pausas cortas.',
  'Los mapas mentales con colores te ayudan a fijar hasta un 70% más lo aprendido.',
  'Repasa tus apuntes el mismo día de la clase: así la información no se olvida.',
  'Dormir bien la noche antes de un examen vale más que estudiar hasta tarde.',
  'Hazte preguntas sobre el tema como si fueras el profesor: es la mejor forma de practicar.',
  'Prepara tu mochila la noche anterior y empieza el día sin prisas.',
];

const MEMORY_TRICKS = [
  { title: 'Palabras clave', text: 'Resume cada tema en 3 palabras y crea una frase divertida con ellas.' },
  { title: 'Método de los lugares', text: 'Imagina cada dato en un lugar de tu casa y recórrela mentalmente.' },
  { title: 'Enseña lo aprendido', text: 'Explícalo en voz alta como si dieras la clase; lo que no puedas explicar, repásalo.' },
];

export default function EstudianteDashboardPage() {
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isHelpBubbleVisible, setIsHelpBubbleVisible] = useState(true);
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
  const studentAvatar = activeStudent?.profile?.avatar_url || currentUser?.avatar_url || '';

  // Dynamic greeting by hour
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? '¡Buenos días' : currentHour < 18 ? '¡Buenas tardes' : '¡Buenas noches';

  // Tip de estudio distinto cada día del mes
  const dailyTip = STUDY_TIPS[new Date().getDate() % STUDY_TIPS.length];

  // Próxima letra CNEB a alcanzar (C → B → A → AD)
  const nextLetter = averageLetter === 'C' ? 'B' : averageLetter === 'B' ? 'A' : averageLetter === 'A' ? 'AD' : null;

  const upcomingExams = exams.length;

  // Pasos de la ruta diaria con su estado en vivo
  const routeSteps = [
    {
      step: '1. Entrada', title: 'Carnet QR', subtitle: 'Pase de portería', href: '/estudiante/carnet-qr',
      icon: QrCode, iconColor: 'text-emerald-500', chip: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300',
      hover: 'hover:border-emerald-300 dark:hover:border-emerald-700',
      status: activeStudent ? 'Listo hoy' : 'Sin carnet', statusIcon: CheckCircle2, statusColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      step: '2. Clases', title: 'Mi Horario', subtitle: 'Cursos de hoy', href: '/estudiante/horario',
      icon: Clock, iconColor: 'text-sky-500', chip: 'bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300',
      hover: 'hover:border-sky-300 dark:hover:border-sky-700',
      status: todaySlots.length > 0 ? `${todaySlots.length} ${todaySlots.length === 1 ? 'clase hoy' : 'clases hoy'}` : 'Ver cronograma', statusIcon: null, statusColor: 'text-slate-500 dark:text-slate-400',
    },
    {
      step: '3. Puntualidad', title: 'Asistencia', subtitle: 'Récord y registro', href: '/estudiante/asistencias',
      icon: Flame, iconColor: 'text-teal-500', chip: 'bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300',
      hover: 'hover:border-teal-300 dark:hover:border-teal-700',
      status: attendanceCount > 0 ? `${attendanceRate}% Asistido` : 'Sin registros', statusIcon: null,
      statusColor: attendanceCount > 0 && attendanceRate < 80 ? 'text-amber-600 dark:text-amber-400' : 'text-teal-600 dark:text-teal-400',
    },
    {
      step: '4. Deberes', title: 'Mis Tareas', subtitle: 'Entregas y archivos', href: '/estudiante/tareas',
      icon: BookOpen, iconColor: 'text-purple-500', chip: 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300',
      hover: 'hover:border-purple-300 dark:hover:border-purple-700',
      status: pendingTasks.length === 0 ? 'Al día (0 pendientes)' : `${pendingTasks.length} ${pendingTasks.length === 1 ? 'pendiente' : 'pendientes'}`,
      statusIcon: pendingTasks.length === 0 ? Check : AlertCircle,
      statusColor: pendingTasks.length === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400',
    },
    {
      step: '5. Exámenes', title: 'Evaluaciones', subtitle: 'Calendario de pruebas', href: '/estudiante/evaluaciones',
      icon: CheckSquare, iconColor: 'text-blue-500', chip: 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300',
      hover: 'hover:border-blue-300 dark:hover:border-blue-700',
      status: upcomingExams > 0 ? `${upcomingExams} ${upcomingExams === 1 ? 'programada' : 'programadas'}` : 'Próximos eventos', statusIcon: null,
      statusColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      step: '6. Notas', title: 'Libreta CNEB', subtitle: 'Promedios y reporte', href: '/estudiante/libreta-notas',
      icon: Award, iconColor: 'text-amber-500', chip: 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300',
      hover: 'hover:border-amber-300 dark:hover:border-amber-700',
      status: averageLetter ? `Logro ${averageLetter}` : 'Sin notas aún', statusIcon: null,
      statusColor: 'text-amber-600 dark:text-amber-400',
    },
  ];

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
              <Rocket className="w-3.5 h-3.5 text-emerald-400" />
              <span>Portal del Estudiante • Año Escolar 2026</span>
            </div>

            {/* Saludo Principal: el nombre y el emoji nunca se separan de línea */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.1]">
                <span suppressHydrationWarning>{greeting}</span>,{' '}
                <span className="whitespace-nowrap">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300" suppressHydrationWarning>
                    {studentName}!
                  </span>{' '}
                  <span className="inline-block animate-wave origin-bottom-right">👋</span>
                </span>
              </h1>

              <p className="text-sm sm:text-base font-semibold text-emerald-100/90">
                Tu curiosidad y perseverancia son tu superpoder hoy <span className="text-blue-400">💙</span>
              </p>
            </div>

            {/* Tip de Oro del día */}
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-inner max-w-xl">
              <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-300/30 text-amber-300 flex items-center justify-center shrink-0">
                <Lightbulb className="w-[18px] h-[18px]" />
              </div>
              <p className="text-xs sm:text-[13px] leading-relaxed text-slate-200" suppressHydrationWarning>
                <strong className="text-amber-300">Tip de Oro: </strong>
                &ldquo;{dailyTip}&rdquo;
              </p>
            </div>

            {/* Badges y Chips de Estado Informativos */}
            <div className="pt-1 flex flex-wrap items-center gap-2.5">
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
            
            {/* Tarjeta de Perfil del Alumno */}
            <div className="hidden sm:flex flex-col items-center p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 w-full sm:w-52 shadow-lg">
              <div className="relative">
                <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-emerald-400 to-cyan-400 shadow-lg shadow-emerald-500/20">
                  {studentAvatar ? (
                    <img
                      src={studentAvatar}
                      alt={studentName}
                      className="w-full h-full rounded-full object-cover bg-slate-900"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-white font-black text-xl">
                      {studentName.charAt(0)}
                    </div>
                  )}
                </div>
                <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-[#062428]" />
              </div>
              <p className="mt-2.5 text-sm font-bold text-white truncate max-w-full">{studentName}</p>
              <p className="text-[11px] text-emerald-200/70">Matriculado 2026</p>
              <div className="w-full mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Asistencia:</span>
                <strong className="text-emerald-400">
                  {attendanceCount === 0 ? 'Sin registros' : `${attendanceRate}% ${attendanceRate === 100 ? 'Impecable' : attendanceRate >= 80 ? 'Regular' : ''}`}
                </strong>
              </div>
            </div>

            {/* Pila de Botones de Acción Rápida */}
            <div className="flex flex-col gap-2.5 w-full sm:w-56 shrink-0">
              
              {/* Botón Principal: Ver Mi Carnet QR (Modal Instantáneo) */}
              <button
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-center"
              >
                <QrCode className="w-4 h-4 text-slate-950" />
                <span>Mostrar Carnet QR</span>
              </button>

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

      {/* ── 2. MI RUTA DE ESTUDIO DIARIA (ACCESOS CON ESTADO EN VIVO) ── */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 px-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Mi Ruta de Estudio Diaria
            </h3>
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Acceso rápido a todas tus herramientas escolares
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {routeSteps.map((step) => {
            const Icon = step.icon;
            return (
              <Link
                key={step.href}
                href={step.href}
                className={`group flex flex-col p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all text-left ${step.hover}`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${step.chip}`}>
                    {step.step}
                  </span>
                  <Icon className={`w-4 h-4 ${step.iconColor} group-hover:scale-110 transition-transform`} />
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{step.title}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{step.subtitle}</span>
                <span className={`mt-auto pt-3 flex items-center gap-1 text-[11px] font-bold ${step.statusColor}`}>
                  {step.statusIcon && <step.statusIcon className="w-3.5 h-3.5 shrink-0" />}
                  <span className="leading-tight">{step.status}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── 3. CARDS DE MÉTRICAS PRINCIPALES ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* CARD 1: PROMEDIO ACTUAL */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Promedio Actual</div>
              <div className="text-xs text-slate-400 mt-0.5">De todas mis materias</div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
          </div>

          <div className="my-5 flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                {averageScore > 0 ? averageScore.toFixed(1) : (averageLetter || '—')}
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold">
                {averageScore > 0 ? '/20' : 'CNEB'}
              </span>
            </div>
            <div className="flex items-end gap-1 h-8">
              <div className="w-2 h-4 rounded-full bg-purple-200 dark:bg-purple-900/60" />
              <div className="w-2 h-6 rounded-full bg-purple-300 dark:bg-purple-700/60" />
              <div className="w-2 h-8 rounded-full bg-purple-600 dark:bg-purple-400" />
            </div>
          </div>

          <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Escala: <strong className="text-slate-800 dark:text-slate-200">{averageLetter ? `Logro ${averageLetter}` : 'Sin notas'}</strong>
            </span>
            {nextLetter ? (
              <Link href="/estudiante/libreta-notas" className="inline-flex items-center gap-0.5 font-bold text-purple-600 dark:text-purple-400 hover:underline">
                ¿Cómo subir a {nextLetter}? <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            ) : averageLetter === 'AD' ? (
              <span className="font-bold text-emerald-600 dark:text-emerald-400">¡Logro destacado! 🏆</span>
            ) : null}
          </div>
        </div>

        {/* CARD 2: PUNTUALIDAD & ASISTENCIA */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Puntualidad</div>
              <div className="text-xs text-slate-400 mt-0.5">Asistencia a clases</div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="my-5 flex items-center justify-between">
            <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {attendanceRate}%
            </span>
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
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

          <div className={`mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-xs font-bold ${
            attendanceCount > 0 && attendanceRate < 80 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
            <span>
              {attendanceCount === 0
                ? 'Sin registros de asistencia'
                : attendanceRate === 100
                  ? 'Asistencia regular e impecable'
                  : attendanceRate >= 80
                    ? 'Asistencia regular'
                    : 'Atención a inasistencias'}
            </span>
          </div>
        </div>

        {/* CARD 3: DEBERES PENDIENTES */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Deberes Pendientes</div>
              <div className="text-xs text-slate-400 mt-0.5">Por entregar a tiempo</div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <ListChecks className="w-5 h-5" />
            </div>
          </div>

          <div className="my-5 flex items-center justify-between">
            <span className={`text-4xl font-black tracking-tight ${pendingTasks.length > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>
              {pendingTasks.length}
            </span>
            <div className="w-11 h-11 rounded-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 flex items-center justify-center text-slate-400">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          <Link
            href="/estudiante/tareas"
            className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <span>{pendingTasks.length === 0 ? '✓ Al día sin pendientes' : `${pendingTasks.length} ${pendingTasks.length === 1 ? 'tarea por entregar' : 'tareas por entregar'}`}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* CARD 4: PRÓXIMO EXAMEN */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Próximo Examen</div>
              <div className="text-xs text-slate-400 mt-0.5">Evaluación programada</div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          <div className="my-5 space-y-1.5">
            <h4 className="text-base font-black text-slate-900 dark:text-white leading-snug line-clamp-2">
              {upcomingExams > 0 ? exams[0].titulo : 'Sin evaluaciones próximas'}
            </h4>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-amber-500" />
                {upcomingExams > 0 ? exams[0].fecha_programada : 'Calendario al día'}
              </span>
              {upcomingExams > 0 && (
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

          <Link
            href="/estudiante/evaluaciones"
            className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
          >
            <span className="flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5" />
              {upcomingExams > 0 ? 'Prepárate con tiempo' : 'Sin exámenes pendientes'}
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>

      {/* ── 4. GRID PRINCIPAL: MI HORARIO DE HOY & MIS PENDIENTES ── */}
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

      {/* ── 5. CONTINUAR APRENDIENDO (AULA VIRTUAL LMS) ── */}
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

      {/* ── 6. COMUNICADOS & AVISOS DEL COLEGIO PARA EL ALUMNO ── */}
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

      {/* ── AYUDANTE DE ESTUDIO FLOTANTE ── */}
      <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 flex flex-col items-end gap-3">
        {isHelpOpen && (
          <div className="w-[calc(100vw-2rem)] max-w-xs bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 space-y-3 animate-in fade-in-50 slide-in-from-bottom-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Trucos para memorizar</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Cerrar ayudante"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="space-y-2">
              {MEMORY_TRICKS.map((trick) => (
                <li key={trick.title} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{trick.title}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">{trick.text}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center gap-3">
          {isHelpBubbleVisible && !isHelpOpen && (
            <div className="hidden sm:flex items-center gap-2 pl-4 pr-2 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg text-xs animate-in fade-in-50">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="text-slate-700 dark:text-slate-300">¿Necesitas un truco para memorizar mejor, {studentName}?</span>
              <button
                type="button"
                onClick={() => setIsHelpOpen(true)}
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Pregúntame
              </button>
              <button
                type="button"
                onClick={() => setIsHelpBubbleVisible(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Ocultar sugerencia"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsHelpOpen(!isHelpOpen)}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-xl shadow-emerald-600/30 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Abrir ayudante de estudio"
          >
            {isHelpOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* ── MODAL EMERGENTE RÁPIDO DE CARNET QR ── */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-50">
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-500" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Pase Escolar Biométrico QR</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeStudent && (
              <QrCard
                student={activeStudent}
                section={activeEnrollment?.seccion || undefined}
                schoolName="Colegio San Martín"
              />
            )}

            <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
              <Link
                href="/estudiante/carnet-qr"
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Página completa →
              </Link>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
