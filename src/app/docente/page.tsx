'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { StatCard } from '@/components/ui/StatCard';
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
  ClipboardList,
  Check,
  X,
  ChevronRight,
  AlertCircle,
  GraduationCap,
  School
} from 'lucide-react';
import Link from 'next/link';

export default function DocenteDashboardPage() {
  const { 
    courses, 
    students, 
    enrollments, 
    attendances, 
    grades, 
    tasks,
    submissions,
    exams,
    currentUser,
    getCurrentOrNextClass,
    saveClassSessionLog,
    getTeacherSections
  } = useApp();

  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [sessionTopic, setSessionTopic] = useState('');
  const [sessionObs, setSessionObs] = useState('');
  const [sessionSuccess, setSessionSuccess] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendances = attendances.filter(a => a.fecha === todayStr);

  const teacherSections = getTeacherSections(currentUser.id);
  const mySectionIds = teacherSections.map(ts => ts.seccion.id);
  const myEnrollments = enrollments.filter(e => mySectionIds.includes(e.seccion_id));
  const myStudentsCount = myEnrollments.length > 0 ? myEnrollments.length : students.length;
  const myTodayAttendances = todayAttendances.filter(a => myEnrollments.some(e => e.id === a.matricula_id));
  const myPresentCount = myTodayAttendances.filter(a => a.estado === 'presente' || a.estado === 'tardanza').length;
  const attendancePct = myStudentsCount > 0 ? Math.round((myPresentCount / myStudentsCount) * 100) : 0;

  const teacherTasks = tasks.filter(t => t.docente_id === currentUser.id);
  const unreviewedSubmissions = submissions.filter(s => {
    const isMyTask = teacherTasks.some(t => t.id === s.tarea_id);
    return isMyTask && !s.calificacion_letra;
  });

  const { currentSlot, nextSlot, todaySlots } = getCurrentOrNextClass(currentUser.id);

  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSlot || !sessionTopic) return;

    saveClassSessionLog({
      slotId: currentSlot.id,
      seccionId: currentSlot.seccion_id,
      cursoId: currentSlot.curso_id,
      docenteId: currentUser.id,
      temaTratado: sessionTopic,
      observaciones: sessionObs,
    });

    setSessionSuccess(true);
    setTimeout(() => {
      setSessionSuccess(false);
      setIsSessionModalOpen(false);
      setSessionTopic('');
      setSessionObs('');
    }, 1200);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* 1. Encabezado Personalizado del Docente */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 text-[11px] font-bold mb-1.5">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Portal del Docente</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            {getGreeting()}, Prof. {currentUser.nombres.split(' ')[0]}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Aquí tienes tu programación de clases, tareas pendientes y control de asistencia para hoy.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/docente/asistencia"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <QrCode className="w-4 h-4" />
            Tomar Asistencia QR
          </Link>
          <Link
            href="/docente/tareas"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition-all hover:opacity-90 active:scale-95"
          >
            <FileText className="w-4 h-4" />
            Publicar Tarea
          </Link>
        </div>
      </div>

      {/* 2. Banner de Clase en Curso o Próxima */}
      {currentSlot ? (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold">
              <Clock className="w-5 h-5 text-white animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wider">
                  Clase en Curso Ahora
                </span>
                <span className="font-mono text-xs font-bold text-blue-100">
                  {currentSlot.hora_inicio} — {currentSlot.hora_fin}
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-0.5">
                {currentSlot.curso?.nombre} · {currentSlot.seccion?.grado?.nombre} &quot;{currentSlot.seccion?.letra}&quot;
              </h3>
              <p className="text-xs text-blue-100 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3 h-3" />
                {currentSlot.aula || 'Aula Principal'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsSessionModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-white text-blue-900 text-xs font-bold hover:bg-blue-50 transition-all shadow-md active:scale-95"
            >
              Registrar Bitácora de Clase
            </button>
            <Link
              href="/docente/asistencia"
              className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all backdrop-blur-sm"
            >
              Asistencia
            </Link>
          </div>
        </div>
      ) : nextSlot ? (
        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 font-semibold">Próxima sesión a las {nextSlot.hora_inicio}:</span>{' '}
              <strong className="text-slate-900 dark:text-white font-bold">{nextSlot.curso?.nombre}</strong> en{' '}
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                {nextSlot.seccion?.grado?.nombre} &quot;{nextSlot.seccion?.letra}&quot;
              </span>
            </div>
          </div>
          <Link
            href="/docente/horario"
            className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
          >
            Ver horario completo →
          </Link>
        </div>
      ) : null}

      {/* 3. Grid de KPIs Operativos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Clases para Hoy"
          value={todaySlots.length}
          subtitle="Bloques programados"
          icon={Calendar}
          color="blue"
          trend={{ value: "Activo", positive: true }}
          delay={50}
        />
        <StatCard
          title="Salones a Cargo"
          value={teacherSections.length}
          subtitle="Secciones asignadas"
          icon={School}
          color="purple"
          trend={{ value: "2026", positive: true }}
          delay={100}
        />
        <StatCard
          title="Entregas por Calificar"
          value={unreviewedSubmissions.length}
          subtitle="Tareas pendientes"
          icon={FileText}
          color={unreviewedSubmissions.length > 0 ? "amber" : "emerald"}
          trend={{ value: unreviewedSubmissions.length > 0 ? "Requiere atención" : "Al día", positive: unreviewedSubmissions.length === 0 }}
          delay={150}
        />
        <StatCard
          title="Asistencia en Mis Aulas"
          value={`${attendancePct}%`}
          subtitle="Registro del día"
          icon={CheckCircle2}
          color="emerald"
          trend={{ value: "Hoy", positive: true }}
          delay={200}
        />
      </div>

      {/* 4. Contenido Principal: Cursos Asignados & Agenda */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda (2 spans): Cursos Asignados */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Mis Cursos & Salones Asignados
                </h3>
                <p className="text-xs text-slate-400">Acceso directo a listas de notas, asistencias y tareas</p>
              </div>
              <Link
                href="/docente/notas"
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
              >
                Ver notas AD-A-B-C
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {teacherSections.length > 0 ? (
                teacherSections.map(({ seccion, cursos }) => (
                  <div
                    key={seccion.id}
                    className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-slate-50/50 dark:bg-slate-800/40 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 text-[10px] font-bold">
                          {seccion.grado?.nivel.toUpperCase()}
                        </span>
                        <span className="font-mono text-xs font-semibold text-slate-400">
                          Aula {seccion.letra}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mb-1">
                        {seccion.grado?.nombre} — Sección &quot;{seccion.letra}&quot;
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {cursos.map(c => c.nombre).join(', ')}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px] font-medium">
                        Capacidad: {seccion.capacidad_maxima} alumnos
                      </span>
                      <Link
                        href={`/docente/notas`}
                        className="font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1"
                      >
                        Evaluar
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-8 text-slate-400">
                  No tienes secciones asignadas en este momento.
                </div>
              )}
            </div>
          </div>

          {/* Módulo de Tareas Pendientes por Calificar */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                Entregas Recientes de Estudiantes
              </h3>
              <Link href="/docente/tareas" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                Gestionar todas ({unreviewedSubmissions.length})
              </Link>
            </div>

            {unreviewedSubmissions.length > 0 ? (
              <div className="space-y-2">
                {unreviewedSubmissions.slice(0, 3).map((sub) => {
                  const task = tasks.find(t => t.id === sub.tarea_id);
                  const enr = enrollments.find(e => e.id === sub.matricula_id);
                  const student = enr?.estudiante?.profile;

                  return (
                    <div
                      key={sub.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {student?.nombres} {student?.apellidos}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Tarea: &quot;{task?.titulo}&quot;
                        </p>
                      </div>
                      <Link
                        href="/docente/tareas"
                        className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] transition-all shadow-sm"
                      >
                        Revisar
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">¡Todas las tareas están calificadas!</p>
                <p className="text-[11px] text-slate-400">No hay entregas pendientes de revisión.</p>
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha (1 span): Horario de Hoy */}
        <div className="space-y-6">
          
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Agenda de Hoy
              </h3>
              <span className="font-mono text-xs font-bold text-slate-400">
                {todaySlots.length} clases
              </span>
            </div>

            {todaySlots.length > 0 ? (
              <div className="space-y-2.5">
                {todaySlots.map((slot) => {
                  const isCurrent = currentSlot?.id === slot.id;
                  return (
                    <div
                      key={slot.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        isCurrent
                          ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 ring-2 ring-blue-500/20'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                          {slot.hora_inicio} — {slot.hora_fin}
                        </span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 rounded bg-blue-600 text-white font-bold text-[9px] uppercase tracking-wider">
                            En curso
                          </span>
                        )}
                      </div>
                      <p className="font-extrabold text-xs text-slate-900 dark:text-white leading-snug">
                        {slot.curso?.nombre}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {slot.seccion?.grado?.nombre} &quot;{slot.seccion?.letra}&quot; · {slot.aula || 'Aula Principal'}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                No tienes clases asignadas para el día de hoy.
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Modal: Registro de Bitácora de Sesión */}
      {isSessionModalOpen && currentSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Bitácora Pedagógica
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Registrar Tema de Clase
                </h3>
              </div>
              <button
                onClick={() => setIsSessionModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {sessionSuccess ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 animate-bounce" />
                <h4 className="text-base font-black text-slate-900 dark:text-white">¡Sesión guardada con éxito!</h4>
                <p className="text-xs text-slate-400">Los estudiantes fueron notificados del avance curricular.</p>
              </div>
            ) : (
              <form onSubmit={handleSaveSession} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Tema o Contenido Desarrollado *
                  </label>
                  <input
                    type="text"
                    required
                    value={sessionTopic}
                    onChange={(e) => setSessionTopic(e.target.value)}
                    placeholder="Ej. Ecuaciones de 2do Grado y Resolución de Problemas"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Observaciones Pedagógicas (Opcional)
                  </label>
                  <textarea
                    rows={3}
                    value={sessionObs}
                    onChange={(e) => setSessionObs(e.target.value)}
                    placeholder="Ej. Buena participación grupal. Se dejó ejercicios 4 y 5 de la guía."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSessionModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition-all"
                  >
                    Guardar Sesión
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
