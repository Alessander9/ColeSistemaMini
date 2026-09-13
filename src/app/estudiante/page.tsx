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
  Mail,
  Phone,
  Sparkles,
  Users,
  AlertCircle,
  Download,
  CheckCircle,
  Layers,
  ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import { DayOfWeek } from '@/types';

const DAYS_MAP: Record<number, DayOfWeek> = {
  1: 'lunes',
  2: 'martes',
  3: 'miercoles',
  4: 'jueves',
  5: 'viernes',
};

const DAY_NAMES: Record<DayOfWeek, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
};

export default function EstudianteDashboardPage() {
  const { 
    students, 
    enrollments, 
    grades, 
    attendances, 
    currentUser, 
    scheduleSlots, 
    sectionCourses, 
    tasks, 
    submissions, 
    exams, 
    courses, 
    teachers 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'resumen' | 'horario' | 'notas' | 'profesores' | 'examenes' | 'tareas'>('resumen');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('lunes');

  // Identify active student & enrollment
  const activeStudent = useMemo(() => {
    return students.find(s => s.profile_id === currentUser.id) || students[0];
  }, [students, currentUser]);

  const activeEnrollment = useMemo(() => {
    return enrollments.find(e => e.estudiante_id === activeStudent?.id) || enrollments[0];
  }, [enrollments, activeStudent]);

  const studentSectionId = activeEnrollment?.seccion_id || 'sec-3pri-a';

  // Section specific courses & teachers
  const mySectionCourses = useMemo(() => {
    return sectionCourses.filter(sc => sc.seccion_id === studentSectionId);
  }, [sectionCourses, studentSectionId]);

  // Section schedule
  const mySchedule = useMemo(() => {
    return scheduleSlots.filter(s => s.seccion_id === studentSectionId);
  }, [scheduleSlots, studentSectionId]);

  // Today's classes
  const daySchedule = useMemo(() => {
    return mySchedule
      .filter(s => s.dia === selectedDay)
      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
  }, [mySchedule, selectedDay]);

  // Grades calculation
  const myGrades = useMemo(() => {
    return grades.filter(g => g.matricula_id === activeEnrollment?.id);
  }, [grades, activeEnrollment]);

  const studentGradeLetters = myGrades.map(g => g.nota_letra);
  const { averageLetter, averageScore } = calculateAverage(studentGradeLetters);
  const { status } = calculateAnnualStatus(studentGradeLetters);

  // Attendance metrics
  const myAttendances = useMemo(() => {
    return attendances.filter(a => a.matricula_id === activeEnrollment?.id);
  }, [attendances, activeEnrollment]);

  const presentCount = myAttendances.filter(a => a.estado === 'presente').length;
  const lateCount = myAttendances.filter(a => a.estado === 'tardanza').length;
  const totalDays = myAttendances.length;
  const attendancePct = totalDays > 0 ? Math.round(((presentCount + lateCount) / totalDays) * 100) : 96;

  // Tasks & submissions
  const myTasks = useMemo(() => {
    return tasks.filter(t => t.seccion_id === studentSectionId);
  }, [tasks, studentSectionId]);

  // Exams
  const myExams = useMemo(() => {
    return exams.filter(e => e.seccion_id === studentSectionId);
  }, [exams, studentSectionId]);

  const studentName = activeStudent?.profile?.nombres?.split(' ')[0] || currentUser.nombres.split(' ')[0];
  const studentFullName = `${activeStudent?.profile?.nombres || currentUser.nombres} ${activeStudent?.profile?.apellidos || currentUser.apellidos}`;
  const gradeName = activeEnrollment?.seccion?.grado?.nombre || '3° de Primaria';
  const sectionLetter = activeEnrollment?.seccion?.letra || 'A';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      
      {/* ── 1. Student Hero Welcome Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-950 to-indigo-950 text-white p-6 sm:p-8 border border-emerald-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <img
              src={activeStudent?.profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(studentFullName)}&background=10b981&color=fff`}
              alt={studentFullName}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-emerald-500/30 shadow-lg shrink-0"
            />
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold mb-2">
                <GraduationCap className="w-3.5 h-3.5" />
                {gradeName} — Sección &quot;{sectionLetter}&quot; • Código: {activeStudent?.codigo_estudiante || 'EST-2026-001'}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                ¡Hola, {studentName}! 🎒
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
                Año Escolar 2026 activo. Revisa tu horario de clases, calificaciones bimestrales, tareas y carnet QR.
              </p>
            </div>
          </div>

          {/* Quick Academic Status Box */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shrink-0">
            <div className="text-center px-2">
              <span className="text-[10px] uppercase font-bold text-slate-300 block">Logro Promedio</span>
              <span className="text-2xl font-black text-white">{averageLetter}</span>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center px-2">
              <span className="text-[10px] uppercase font-bold text-slate-300 block">Asistencia</span>
              <span className="text-2xl font-black text-emerald-300">{attendancePct}%</span>
            </div>
          </div>
        </div>

        {/* Quick Highlights Strip */}
        <div className="relative z-10 mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 font-medium block truncate">Materias del Salón</span>
              <span className="text-sm font-black text-white">{mySectionCourses.length} Áreas</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5">
            <Users className="w-4 h-4 text-blue-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 font-medium block truncate">Plana de Profesores</span>
              <span className="text-sm font-black text-white">{mySectionCourses.length} Docentes</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 font-medium block truncate">Próximas Evaluaciones</span>
              <span className="text-sm font-black text-white">{myExams.length} Programadas</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 font-medium block truncate">Tareas Asignadas</span>
              <span className="text-sm font-black text-white">{myTasks.length} Tareas</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Interactive Navigation Hub (Direct View Switcher) ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-2 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {[
          { id: 'resumen', label: 'Panel General', icon: Sparkles },
          { id: 'horario', label: 'Mi Horario Semanal', icon: Calendar },
          { id: 'notas', label: 'Mis Calificaciones (AD-A-B-C)', icon: Award },
          { id: 'profesores', label: 'Mis Profesores', icon: Users },
          { id: 'examenes', label: 'Exámenes & Prácticas', icon: FileText },
          { id: 'tareas', label: 'Tareas & Entregas', icon: CheckCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB: PANEL GENERAL / RESUMEN ── */}
      {activeTab === 'resumen' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left: Classes of Today & Grades Preview */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Clases de Hoy */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-600" />
                    Horario de Clases — {DAY_NAMES[selectedDay]}
                  </h3>
                  <p className="text-xs text-slate-400">Selecciona el día para ver la distribución de materias y profesores</p>
                </div>

                {/* Day selector pills */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                  {(['lunes', 'martes', 'miercoles', 'jueves', 'viernes'] as DayOfWeek[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setSelectedDay(d)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                        selectedDay === d
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {d.slice(0, 3).toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Class list cards */}
              <div className="space-y-3">
                {daySchedule.map((slot) => {
                  const courseColor = slot.curso?.color_hex || '#10b981';
                  return (
                    <div
                      key={slot.id}
                      className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3.5">
                        <div 
                          className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs text-white shadow-sm shrink-0"
                          style={{ backgroundColor: courseColor }}
                        >
                          {slot.hora_inicio}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {slot.curso?.nombre}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            <span>Prof. {slot.docente?.nombres} {slot.docente?.apellidos}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {slot.aula || 'Aula 301'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <span className="px-3 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-700 dark:text-slate-300 w-fit">
                        {slot.hora_inicio} - {slot.hora_fin}
                      </span>
                    </div>
                  );
                })}

                {daySchedule.length === 0 && (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No hay clases programadas para este día.
                  </div>
                )}
              </div>
            </div>

            {/* Calificaciones Recientes */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-purple-600" />
                    Últimas Calificaciones Oficiales
                  </h3>
                  <p className="text-xs text-slate-400">Evaluación del I Bimestre por Competencias (CNEB - MINEDU)</p>
                </div>
                <button
                  onClick={() => setActiveTab('notas')}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  Ver libreta completa <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {myGrades.slice(0, 4).map((g) => (
                  <div
                    key={g.id}
                    className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {g.competencia?.descripcion}
                      </span>
                      <GradeBadge grade={g.nota_letra} size="sm" />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {g.conclusion_descriptiva || 'Desempeño satisfactorio en la competencia.'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right: Carnet QR & Upcoming Exams */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Carnet QR */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center">
              <div className="mb-4">
                <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  Mi Carnet de Asistencia QR
                </h3>
                <p className="text-[11px] text-slate-400">Presenta este código en la entrada o clase</p>
              </div>
              <QrCard
                student={activeStudent}
                section={activeEnrollment?.seccion}
                showActions={true}
              />
            </div>

            {/* Próximos Exámenes */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  Próximos Exámenes
                </h4>
                <button
                  onClick={() => setActiveTab('examenes')}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Ver todos
                </button>
              </div>

              <div className="space-y-2">
                {myExams.slice(0, 3).map((exam) => (
                  <div
                    key={exam.id}
                    className="p-3 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 flex items-start gap-3"
                  >
                    <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex flex-col items-center justify-center text-[9px] font-black shrink-0">
                      <span>{new Date(exam.fecha_programada).getDate()}</span>
                      <span className="uppercase text-[8px] opacity-80">SEP</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {exam.titulo}
                      </p>
                      <p className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold mt-0.5">
                        {exam.curso?.nombre} • {exam.duracion_minutos} min
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ── TAB: MI HORARIO SEMANAL ── */}
      {activeTab === 'horario' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                Malla Horaria Semanal — {gradeName} &quot;{sectionLetter}&quot;
              </h3>
              <p className="text-xs text-slate-400">
                Horario oficial de clases con los profesores titulares asignados.
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-200"
            >
              <Calendar className="w-4 h-4" />
              Imprimir Horario
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full border-collapse text-left min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 text-xs font-black uppercase text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3.5 text-center w-28">Hora</th>
                  {(['lunes', 'martes', 'miercoles', 'jueves', 'viernes'] as DayOfWeek[]).map(d => (
                    <th key={d} className="p-3.5 text-center">{DAY_NAMES[d]}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {[
                  { label: '08:00 - 08:45', start: '08:00' },
                  { label: '08:45 - 09:30', start: '08:45' },
                  { label: '09:30 - 10:15', start: '09:30' },
                  { label: '10:15 - 10:45', isBreak: true },
                  { label: '10:45 - 11:30', start: '10:45' },
                  { label: '11:30 - 12:15', start: '11:30' },
                  { label: '12:15 - 13:00', start: '12:15' },
                  { label: '13:00 - 13:45', start: '13:00' },
                ].map((b, idx) => {
                  if (b.isBreak) {
                    return (
                      <tr key={idx} className="bg-amber-500/10 dark:bg-amber-950/20 text-center font-bold text-amber-700 dark:text-amber-300">
                        <td className="p-2 text-xs">10:15 - 10:45</td>
                        <td colSpan={5} className="p-2 uppercase tracking-widest text-[11px]">☕ RECREO ESCOLAR</td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={idx}>
                      <td className="p-2.5 text-center font-bold text-slate-500 border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        {b.label}
                      </td>
                      {(['lunes', 'martes', 'miercoles', 'jueves', 'viernes'] as DayOfWeek[]).map(d => {
                        const slot = mySchedule.find(s => s.dia === d && s.hora_inicio === b.start);
                        if (!slot) return <td key={d} className="p-1.5 text-center text-slate-300 dark:text-slate-700 text-[10px]">Libre</td>;

                        const color = slot.curso?.color_hex || '#10b981';
                        return (
                          <td key={d} className="p-1.5 border-r border-slate-100 dark:border-slate-800 last:border-r-0">
                            <div 
                              className="p-2.5 rounded-xl border flex flex-col justify-between min-h-[58px]"
                              style={{
                                backgroundColor: `${color}14`,
                                borderColor: `${color}40`,
                              }}
                            >
                              <span className="font-black text-slate-900 dark:text-white truncate">
                                {slot.curso?.nombre}
                              </span>
                              <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-400 mt-1">
                                <span className="truncate">Prof. {slot.docente?.nombres.split(' ')[0]}</span>
                                <span className="font-bold">{slot.aula || 'A301'}</span>
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: MIS CALIFICACIONES (AD, A, B, C) ── */}
      {activeTab === 'notas' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-600" />
                Libreta Oficial de Calificaciones por Competencias (CNEB)
              </h3>
              <p className="text-xs text-slate-400">
                Escala oficial del Ministerio de Educación: AD (Logro Destacado), A (Logro Esperado), B (En Proceso), C (En Inicio).
              </p>
            </div>
            <Link
              href="/estudiante/libreta-notas"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors w-fit"
            >
              Ver Boleta Completa
            </Link>
          </div>

          <div className="space-y-4">
            {mySectionCourses.map(assignment => {
              const courseGrades = myGrades.filter(g => g.competencia?.curso_id === assignment.curso_id);
              const courseColor = assignment.curso?.color_hex || '#8b5cf6';

              return (
                <div
                  key={assignment.id}
                  className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: courseColor }} />
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {assignment.curso?.nombre} ({assignment.curso?.codigo})
                      </h4>
                      <span className="text-xs text-slate-400">
                        • Prof. {assignment.docente?.nombres} {assignment.docente?.apellidos}
                      </span>
                    </div>
                  </div>

                  {/* Competencies Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    {courseGrades.map(g => (
                      <div
                        key={g.id}
                        className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                            {g.competencia?.codigo}
                          </span>
                          <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5 leading-snug">
                            {g.competencia?.descripcion}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic">
                            &quot;{g.conclusion_descriptiva || 'Desempeño evaluado conforme al estándar.'}&quot;
                          </p>
                        </div>
                        <GradeBadge grade={g.nota_letra} size="sm" />
                      </div>
                    ))}

                    {courseGrades.length === 0 && (
                      <div className="col-span-2 text-xs text-slate-400 italic py-2">
                        Notas del II Bimestre en proceso de evaluación por el docente.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB: MIS PROFESORES ── */}
      {activeTab === 'profesores' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <Users className="w-5 h-5 text-blue-600" />
              Plana Docente de {gradeName} &quot;{sectionLetter}&quot;
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Profesores especialistas encargados de impartir las materias de tu grado.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mySectionCourses.map(assignment => (
                <div
                  key={assignment.id}
                  className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start gap-3.5"
                >
                  <img
                    src={assignment.docente?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(assignment.docente?.nombres || 'Docente')}`}
                    alt={assignment.docente?.nombres}
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-blue-500/20 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span 
                      className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-black uppercase mb-1"
                      style={{
                        backgroundColor: `${assignment.curso?.color_hex || '#3b82f6'}18`,
                        color: assignment.curso?.color_hex || '#3b82f6',
                      }}
                    >
                      {assignment.curso?.nombre}
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                      {assignment.docente?.nombres} {assignment.docente?.apellidos}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 truncate">
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      {assignment.docente?.email}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      {assignment.aula_defecto || 'Aula 301'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: EXÁMENES & PRÁCTICAS ── */}
      {activeTab === 'examenes' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Calendario de Exámenes & Prácticas Calificadas
              </h3>
              <p className="text-xs text-slate-400">
                Fechas programadas para evaluaciones bimestrales y prácticas en aula.
              </p>
            </div>
            <Link
              href="/estudiante/evaluaciones"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Ver calendario completo →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myExams.map(exam => (
              <div
                key={exam.id}
                className="p-4 rounded-2xl border border-purple-100 dark:border-purple-900/40 bg-purple-50/40 dark:bg-purple-950/20 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                      {exam.tipo === 'practica' ? 'Práctica Calificada' : 'Examen Bimestral'}
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-1">
                      {exam.titulo}
                    </h4>
                  </div>
                  <span className="text-xs font-black text-purple-700 dark:text-purple-300 shrink-0">
                    {exam.duracion_minutos} min
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-purple-100 dark:border-purple-900/40">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    📅 {exam.fecha_programada}
                  </span>
                  <span>•</span>
                  <span>⏰ {exam.hora_inicio || '08:00 AM'}</span>
                  <span>•</span>
                  <span>📚 {exam.curso?.nombre}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: TAREAS & ENTREGAS ── */}
      {activeTab === 'tareas' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                Mis Tareas & Trabajos Asignados
              </h3>
              <p className="text-xs text-slate-400">
                Consulta los ejercicios, fechas de entrega y la retroalimentación de tus profesores.
              </p>
            </div>
            <Link
              href="/estudiante/tareas"
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Ir al módulo de entregas →
            </Link>
          </div>

          <div className="space-y-3">
            {myTasks.map(task => {
              const submission = submissions.find(s => s.tarea_id === task.id && s.matricula_id === activeEnrollment?.id);
              const isSubmitted = !!submission;

              return (
                <div
                  key={task.id}
                  className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {task.curso?.nombre}
                      </span>
                      <h4 className="font-black text-sm text-slate-900 dark:text-white">
                        {task.titulo}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {task.descripcion}
                      </p>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                      isSubmitted 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {isSubmitted ? '✓ Entregado' : 'Pendiente'}
                    </span>
                  </div>

                  {submission && submission.calificacion_letra && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
                      <div>
                        <span className="font-bold">Retroalimentación del Docente:</span>
                        <p className="text-[11px] mt-0.5">&quot;{submission.retroalimentacion_docente}&quot;</p>
                      </div>
                      <GradeBadge grade={submission.calificacion_letra} size="sm" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
