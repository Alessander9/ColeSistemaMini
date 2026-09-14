'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { GradeBadge } from '@/components/notas/GradeBadge';
import { QrCard } from '@/components/qr/QrCard';
import { calculateAverage, calculateAnnualStatus } from '@/lib/grades/calculations';
import { 
  QrCode, 
  Award, 
  UserCheck, 
  BookOpen, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Calendar, 
  GraduationCap, 
  Star, 
  ChevronRight, 
  MapPin, 
  Activity,
  Target,
  Sparkles,
  TrendingUp,
  AlertCircle
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
    simulacros,
    rankings,
    academicContext
  } = useApp();

  const [viewMode, setViewMode] = useState<'escolar' | 'preuni'>('escolar');

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

  // Tasks & submissions
  const myTasks = useMemo(() => {
    return tasks.filter(t => t.seccion_id === studentSectionId);
  }, [tasks, studentSectionId]);

  const studentName = activeStudent?.profile?.nombres?.split(' ')[0] || currentUser.nombres.split(' ')[0];
  const studentFullName = `${activeStudent?.profile?.nombres || currentUser.nombres} ${activeStudent?.profile?.apellidos || currentUser.apellidos}`;
  const gradeName = activeEnrollment?.seccion?.grado?.nombre || '3° de Primaria';
  const sectionLetter = activeEnrollment?.seccion?.letra || 'A';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* 1. Header de Bienvenida del Estudiante */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold mb-1.5">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Portal del Estudiante · 2026</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            ¡Hola, {studentName}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {gradeName} — Sección &quot;{sectionLetter}&quot; · Código: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{activeStudent?.codigo_estudiante}</span>
          </p>
        </div>

        {/* Mode Switcher (Escolar vs. Preuniversitario) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
            <button
              onClick={() => setViewMode('escolar')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'escolar'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              📚 Cursos & Libreta
            </button>
            <button
              onClick={() => setViewMode('preuni')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'preuni'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🚀 Preuniversitario (Simulacros)
            </button>
          </div>

          <Link
            href="/estudiante/carnet-qr"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <QrCode className="w-4 h-4" />
            Mi Carnet QR
          </Link>
        </div>
      </div>

      {/* 2. Vistas Condicionales (Escolar vs. Preuniversitario) */}
      {viewMode === 'escolar' ? (
        <>
          {/* Métricas Escolares */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Promedio General
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {averageLetter}
                </span>
                <span className="text-xs font-semibold text-slate-500">Logro Destacado</span>
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Asistencia Acumulada
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-blue-600 dark:text-blue-400 font-mono">
                  98%
                </span>
                <span className="text-xs font-semibold text-slate-500">0 Faltas</span>
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Tareas Asignadas
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                  {myTasks.length}
                </span>
                <span className="text-xs font-semibold text-slate-500">1 pendiente</span>
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Condición Final
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {status}
                </span>
              </div>
            </div>
          </div>

          {/* Cursos y Tareas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              
              {/* Tarjeta de Cursos */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Mis Cursos del I Bimestre
                  </h3>
                  <Link href="/estudiante/libreta-notas" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                    Ver libreta completa →
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {courses.slice(0, 6).map((course) => {
                    const courseComps = course.competencias || [];
                    const cGrades = myGrades.filter(g => courseComps.some(c => c.id === g.competencia_id));
                    const courseAvg = calculateAverage(cGrades.map(g => g.nota_letra));
                    const hasGrades = cGrades.length > 0;

                    return (
                      <div
                        key={course.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between"
                      >
                        <div>
                          <h4 className="font-extrabold text-xs text-slate-900 dark:text-white mb-0.5">
                            {course.nombre}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-mono">{course.codigo}</p>
                        </div>
                        {hasGrades ? (
                          <GradeBadge grade={courseAvg.averageLetter} size="sm" />
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-500 font-mono text-[10px]">
                            -
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>


              {/* Tareas Escolares */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-500" />
                    Tareas Escolares Pendientes
                  </h3>
                  <Link href="/estudiante/tareas" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                    Ver todas ({myTasks.length})
                  </Link>
                </div>

                <div className="space-y-2">
                  {myTasks.slice(0, 2).map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{t.titulo}</p>
                        <p className="text-[11px] text-slate-400">Vence: {t.fecha_limite}</p>
                      </div>
                      <Link
                        href="/estudiante/tareas"
                        className="px-3 py-1 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-sm hover:bg-indigo-500 transition-all"
                      >
                        Entregar
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Carnet QR Digital Preview */}
            <div>
              <QrCard student={activeStudent} section={activeEnrollment?.seccion} />
            </div>
          </div>
        </>
      ) : (
        /* Modo Preuniversitario */
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Header Preuni */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-600 via-orange-600 to-indigo-700 text-white shadow-xl shadow-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wider mb-2 inline-block">
                Ciclo Anual Regular · UNI & San Marcos
              </span>
              <h2 className="text-xl font-black text-white">
                Módulo de Rendimiento y Simulacros de Admisión
              </h2>
              <p className="text-xs text-amber-100 max-w-lg mt-0.5">
                Seguimiento de puntajes, percentiles, evolución por áreas académicas y puesto en el ranking institucional.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center shrink-0">
              <span className="text-[10px] font-semibold text-amber-200 block">Último Puntaje</span>
              <span className="text-2xl font-black text-white font-mono">412.50</span>
              <span className="text-[10px] text-emerald-300 font-bold block">Puesto #4 (Top 3%)</span>
            </div>
          </div>

          {/* Simulacros Realizados */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 space-y-6">
              <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4 text-amber-500" />
                  Historial de Simulacros Rendidos
                </h3>

                <div className="space-y-4">
                  {simulacros.map((sim) => (
                    <div
                      key={sim.id}
                      className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/40"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                              {sim.universidad}
                            </span>
                            <span className="font-mono text-xs text-slate-400">{sim.fecha}</span>
                          </div>
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-1">
                            {sim.titulo}
                          </h4>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-lg font-black text-indigo-600 dark:text-indigo-400">
                            {sim.puntaje_obtenido}
                          </span>
                          <span className="text-xs text-slate-400 font-mono"> / {sim.puntaje_maximo}</span>
                          <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            Percentil {sim.percentil}%
                          </span>
                        </div>
                      </div>

                      {/* Desglose por áreas */}
                      {sim.areas && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                          {sim.areas.map((area, aIdx) => (
                            <div key={aIdx} className="p-2 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                              <p className="font-bold text-[11px] text-slate-800 dark:text-slate-200 truncate mb-1">
                                {area.nombre}
                              </p>
                              <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
                                <span>✔ {area.aciertos}</span>
                                <span>✖ {area.errores}</span>
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">{area.puntaje} pts</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Ranking General */}
            <div className="space-y-6">
              <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Target className="w-4 h-4 text-amber-500" />
                    Cuadro de Mérito
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400">Top Institucional</span>
                </div>

                <div className="space-y-2.5">
                  {rankings.map((r) => {
                    const isMe = r.estudiante_id === 'student-8' || r.nombre.includes('Gabriel');
                    return (
                      <div
                        key={r.puesto}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-2 transition-all ${
                          isMe
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 ring-2 ring-amber-500/20'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                            r.puesto === 1 ? 'bg-amber-400 text-amber-950' :
                            r.puesto === 2 ? 'bg-slate-300 text-slate-800' :
                            r.puesto === 3 ? 'bg-amber-700/20 text-amber-700 dark:text-amber-300' :
                            'text-slate-400 font-mono'
                          }`}>
                            #{r.puesto}
                          </span>
                          <div>
                            <p className="font-extrabold text-xs text-slate-900 dark:text-white leading-snug">
                              {r.nombre} {isMe && <span className="text-amber-600 font-bold text-[10px]">(Tú)</span>}
                            </p>
                            <p className="text-[10px] text-slate-400">{r.carrera_objetivo}</p>
                          </div>
                        </div>

                        <div className="text-right font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                          {r.puntaje_total}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
