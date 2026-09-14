'use client';

import React, { useMemo } from 'react';
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
  Play
} from 'lucide-react';
import Link from 'next/link';

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
    getTeacherSections 
  } = useApp();

  const { currentSlot, nextSlot, todaySlots } = getCurrentOrNextClass(currentUser.id);
  const teacherSections = getTeacherSections(currentUser.id);

  // Pending tasks and submissions for this teacher
  const myTasks = useMemo(() => {
    return tasks.filter(t => t.docente_id === currentUser.id);
  }, [tasks, currentUser]);

  const pendingReviewSubmissions = useMemo(() => {
    return submissions.filter(s => {
      const isMyTask = myTasks.some(t => t.id === s.tarea_id);
      return isMyTask && !s.calificacion_letra;
    });
  }, [submissions, myTasks]);

  const teacherFirstName = currentUser?.nombres?.split(' ')[0] || 'Carlos';

  // Saludo dinámico según la hora
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Buenos días' : currentHour < 18 ? 'Buenas tardes' : 'Buenas noches';

  // Active or upcoming class details
  const featuredClass = currentSlot || nextSlot || todaySlots[0];
  const featuredCourse = courses.find(c => c.id === featuredClass?.curso_id);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
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
              Tienes <strong className="text-white font-bold">{todaySlots.length} sesiones programadas</strong> para la jornada de hoy.
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
                  <Link
                    href="/docente/asistencia"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-md shadow-emerald-500/30 transition-all active:scale-95"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Tomar Asistencia</span>
                  </Link>
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
              <span className="text-xs font-bold">Asistencia QR</span>
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

      {/* ── 2. KPIS DOCENTES DEL DÍA ── */}
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
              {pendingReviewSubmissions.length || 3}
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
              {teacherSections.length * 32 || 96}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              estudiantes
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Asistencia promedio:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">96.2%</span>
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

      {/* ── 3. GRID PRINCIPAL: TIMELINE DE CLASES & BANDEJA DE REVISIÓN ── */}
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
                      <Link
                        href="/docente/asistencia"
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs transition-colors"
                      >
                        Asistencia
                      </Link>
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
              {pendingReviewSubmissions.length || 3} entregas
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                <span>Tareas por Calificar</span>
                <span className="text-purple-600 dark:text-purple-400 font-black">{pendingReviewSubmissions.length || 3} entregas</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Alumnos de 3° Primaria A enviaron la actividad práctica de Fracciones y Geometría.
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

    </div>
  );
}
