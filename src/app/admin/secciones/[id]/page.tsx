'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { GradeBadge } from '@/components/notas/GradeBadge';
import { DataTable, Column } from '@/components/ui/DataTable';
import { 
  School, 
  Calendar, 
  ChevronRight, 
  Users, 
  BookOpen, 
  Award, 
  Clock, 
  ClipboardCheck, 
  FileText, 
  CheckCircle2, 
  User, 
  Sparkles, 
  ArrowLeft,
  MapPin,
  Mail,
  Phone,
  QrCode,
  GraduationCap
} from 'lucide-react';
import { Student, Enrollment, GradeLetter, DayOfWeek } from '@/types';

export default function SectionHubDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const seccionId = (params?.id as string) || 'sec-3pri-a';

  const { 
    sections, 
    gradeLevels, 
    courses, 
    enrollments, 
    sectionCourses, 
    scheduleSlots, 
    grades, 
    evaluationPeriods, 
    classSessions,
    attendances,
    teachers
  } = useApp();

  const [selectedBimestre, setSelectedBimestre] = useState<string>('eval-bim-1');
  const [activeTab, setActiveTab] = useState<'areas' | 'alumnos' | 'calificaciones' | 'horario' | 'bitacora'>('areas');

  const currentSection = sections.find(s => s.id === seccionId) || sections[0];
  const currentGrade = currentSection ? gradeLevels.find(g => g.id === currentSection.grado_id) : gradeLevels[0];
  const isSecundaria = currentGrade?.nivel.toLowerCase() === 'secundaria';

  // Section specific data
  const sectionEnrollments = enrollments.filter(e => e.seccion_id === currentSection?.id);
  const sectionStudentsCount = sectionEnrollments.length > 0 ? sectionEnrollments.length : 28;
  const sectionAssignments = sectionCourses.filter(sc => sc.seccion_id === currentSection?.id);
  const sectionSlots = scheduleSlots.filter(s => s.seccion_id === currentSection?.id);
  const sectionSessions = classSessions.filter(cs => cs.seccion_id === currentSection?.id);

  // Section teachers count
  const uniqueTeacherIds = Array.from(new Set(sectionAssignments.map(a => a.docente_id)));
  const teacherCount = uniqueTeacherIds.length > 0 ? uniqueTeacherIds.length : 8;

  // Attendance metrics
  const todayStr = new Date().toISOString().split('T')[0];
  const sectionAttendances = attendances.filter(a => 
    sectionEnrollments.some(e => e.id === a.matricula_id)
  );
  const presentCount = sectionAttendances.filter(a => a.estado === 'presente' || a.estado === 'tardanza').length;
  const attendanceRate = sectionAttendances.length > 0 ? Math.round((presentCount / sectionAttendances.length) * 100) : 96;

  const days: DayOfWeek[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
  const dayLabels: Record<DayOfWeek, string> = {
    lunes: 'Lunes',
    martes: 'Martes',
    miercoles: 'Miércoles',
    jueves: 'Jueves',
    viernes: 'Viernes',
  };

  const timeBlocks = [
    { start: '08:00', end: '08:45', label: '1.° Bloque' },
    { start: '08:45', end: '09:30', label: '2.° Bloque' },
    { start: '09:30', end: '10:15', label: '3.° Bloque' },
    { isBreak: true, start: '10:15', end: '10:45', label: '☕ Recreo Escolar' },
    { start: '10:45', end: '11:30', label: '4.° Bloque' },
    { start: '11:30', end: '12:15', label: '5.° Bloque' },
    { start: '12:15', end: '13:00', label: '6.° Bloque' },
    { start: '13:00', end: '13:45', label: '7.° Bloque' },
  ];

  // Tab 2 Columns for Students
  const studentColumns: Column<Enrollment>[] = [
    {
      header: 'Estudiante',
      cell: (enr) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold text-xs">
            {enr.estudiante?.profile?.nombres?.[0] || 'E'}
          </div>
          <div>
            <p className="font-extrabold text-slate-800 dark:text-white text-xs">
              {enr.estudiante?.profile?.apellidos}, {enr.estudiante?.profile?.nombres}
            </p>
            <p className="text-[10px] text-slate-400 font-mono">
              {enr.estudiante?.codigo_estudiante || 'EST-2026-001'} · DNI {enr.estudiante?.profile?.dni}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Apoderado / Contacto',
      cell: (enr) => (
        <div>
          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
            {enr.estudiante?.nombre_apoderado || 'Apoderado Registrado'}
          </p>
          <p className="text-[10px] text-slate-400 flex items-center gap-1">
            <Phone className="w-3 h-3" />
            {enr.estudiante?.telefono_apoderado || '987 654 321'}
          </p>
        </div>
      ),
    },
    {
      header: 'Carnet QR',
      cell: (enr) => (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <QrCode className="w-3 h-3 text-purple-600" />
          {enr.estudiante?.token_qr?.substring(0, 14) || 'QR-EST-2026'}...
        </span>
      ),
    },
    {
      header: 'Estado',
      cell: () => (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3" />
          Matriculado Activo
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in-50 pb-16">
      
      {/* ── Breadcrumb Navigation ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Link href="/admin" className="flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-purple-600">
            <School className="w-3.5 h-3.5 text-purple-600" />
            Colegio
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <Link href="/admin/academico" className="text-slate-600 dark:text-slate-300 hover:text-purple-600 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-amber-500" />
            Año 2026
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-slate-600 dark:text-slate-300">
            {isSecundaria ? '🎓 Secundaria' : '👦 Primaria'}
          </span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-slate-600 dark:text-slate-300">
            {currentGrade?.nombre}
          </span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-purple-600 dark:text-purple-400 font-extrabold bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">
            Sección &quot;{currentSection?.letra}&quot;
          </span>
        </nav>

        <Link
          href="/admin/academico"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Ver Todos los Salones
        </Link>
      </div>

      {/* ── Classroom Hub Header ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 p-6 sm:p-8 border border-purple-900/40 shadow-2xl text-white">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-black">
                {isSecundaria ? 'Nivel Secundaria' : 'Nivel Primaria'} · Turno Mañana
              </span>
              <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold flex items-center gap-1">
                <MapPin className="w-3 h-3 text-blue-300" />
                Aula 301 · Pabellón B
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {currentGrade?.nombre} · Sección &quot;{currentSection?.letra}&quot;
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
              Panel pedagógico centralizado: gestión de docentes asignados, avance curricular, calificaciones por bimestre y asistencia.
            </p>
          </div>

          {/* ── Period Selector (Bimestres) ── */}
          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 space-y-2 shrink-0">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-200 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Periodo Académico
            </span>
            <div className="flex items-center gap-1.5">
              {evaluationPeriods.map((period) => (
                <button
                  key={period.id}
                  onClick={() => setSelectedBimestre(period.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    selectedBimestre === period.id
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/40 scale-105'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  {period.nombre.replace(' Bimestre', ' Bim')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Alumnos Matriculados"
          value={sectionStudentsCount}
          subtitle={`Capacidad: ${currentSection?.capacidad_maxima || 30} vacantes`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Docentes Asignados"
          value={teacherCount}
          subtitle="Especialistas por área"
          icon={User}
          color="purple"
        />
        <StatCard
          title="Áreas Curriculares"
          value={sectionAssignments.length > 0 ? sectionAssignments.length : 9}
          subtitle="Currículo Nacional CNEB"
          icon={BookOpen}
          color="emerald"
        />
        <StatCard
          title="Asistencia Promedio"
          value={`${attendanceRate}%`}
          subtitle="Puntualidad en aula"
          icon={CheckCircle2}
          color="amber"
          trend={{ value: "+3%", positive: true }}
        />
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveTab('areas')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'areas'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Áreas Curriculares ({sectionAssignments.length > 0 ? sectionAssignments.length : courses.length})
        </button>

        <button
          onClick={() => setActiveTab('alumnos')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'alumnos'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Padrón de Alumnos ({sectionStudentsCount})
        </button>

        <button
          onClick={() => setActiveTab('calificaciones')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'calificaciones'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          Calificaciones ({evaluationPeriods.find(p => p.id === selectedBimestre)?.nombre || 'I Bim'})
        </button>

        <button
          onClick={() => setActiveTab('horario')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'horario'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          Horario Semanal
        </button>

        <button
          onClick={() => setActiveTab('bitacora')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'bitacora'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Cuaderno de Campo ({sectionSessions.length})
        </button>
      </div>

      {/* ── TAB 1: ÁREAS CURRICULARES & DOCENTES ── */}
      {activeTab === 'areas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900 dark:text-white text-base">
              Plan de Estudios Asignado — {currentGrade?.nombre} &quot;{currentSection?.letra}&quot;
            </h3>
            <Link
              href="/admin/horarios"
              className="px-3.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 hover:bg-purple-100 text-xs font-bold border border-purple-200 dark:border-purple-800 transition-all"
            >
              Configurar Horas & Docentes
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => {
              const assignment = sectionAssignments.find(sa => sa.curso_id === course.id);
              const teacher = assignment?.docente || teachers[0];

              return (
                <div
                  key={course.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white text-sm shadow-md"
                          style={{ backgroundColor: course.color_hex }}
                        >
                          {course.codigo.substring(0, 3)}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 dark:text-white text-sm">
                            {course.nombre}
                          </h4>
                          <span className="text-[10px] font-bold text-slate-400">
                            Código: {course.codigo}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {assignment?.horas_semanales || 4} hrs/sem
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                      {course.competencias?.map(c => c.descripcion).join(' · ') || 'Desarrollo de competencias y capacidades CNEB.'}
                    </p>

                    {/* Teacher badge */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {teacher?.nombres?.[0] || 'P'}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] uppercase font-bold text-purple-600 dark:text-purple-400 block">
                          Docente Titular
                        </span>
                        <p className="font-extrabold text-slate-800 dark:text-white text-xs truncate">
                          {teacher?.nombres} {teacher?.apellidos}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400">
                    <span>{course.competencias?.length || 3} Competencias CNEB</span>
                    <span className="text-slate-400 font-medium">Aula 301</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 2: PADRÓN DE ALUMNOS ── */}
      {activeTab === 'alumnos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900 dark:text-white text-base">
              Estudiantes Matriculados — Año Lectivo 2026
            </h3>
            <Link
              href="/admin/matriculas"
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/25 transition-all"
            >
              + Matricular Alumno en esta Sección
            </Link>
          </div>

          <DataTable
            columns={studentColumns}
            data={sectionEnrollments}
            searchPlaceholder="Buscar estudiante por nombre o DNI..."
            searchFilter={(enr, q) => {
              const full = `${enr.estudiante?.profile?.nombres} ${enr.estudiante?.profile?.apellidos} ${enr.estudiante?.profile?.dni} ${enr.estudiante?.codigo_estudiante}`.toLowerCase();
              return full.includes(q);
            }}
          />
        </div>
      )}

      {/* ── TAB 3: CALIFICACIONES DEL BIMESTRE ── */}
      {activeTab === 'calificaciones' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                Matriz de Logros por Competencia ({evaluationPeriods.find(p => p.id === selectedBimestre)?.nombre})
              </h3>
              <p className="text-xs text-slate-500">
                Escala oficial MINEDU: AD (Destacado), A (Esperado), B (En Proceso), C (En Inicio).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Filtrar Bimestre:</span>
              <select
                value={selectedBimestre}
                onChange={(e) => setSelectedBimestre(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
              >
                {evaluationPeriods.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-black uppercase text-[10px]">
                  <th className="p-3.5 pl-5">N.°</th>
                  <th className="p-3.5">Estudiante</th>
                  {courses.slice(0, 6).map(c => (
                    <th key={c.id} className="p-3.5 text-center">{c.codigo}</th>
                  ))}
                  <th className="p-3.5 text-center pr-5">Logro Predominante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {sectionEnrollments.map((enr, idx) => {
                  const studentGrades = grades.filter(g => g.matricula_id === enr.id && g.periodo_evaluacion_id === selectedBimestre);
                  const adCount = studentGrades.filter(g => g.nota_letra === 'AD').length;
                  const finalBadge: GradeLetter = adCount >= 2 ? 'AD' : 'A';

                  return (
                    <tr key={enr.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 pl-5 font-mono text-slate-400 font-bold">{idx + 1}</td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                        {enr.estudiante?.profile?.apellidos}, {enr.estudiante?.profile?.nombres}
                      </td>
                      {courses.slice(0, 6).map((c, cIdx) => {
                        const letter: GradeLetter = cIdx % 2 === 0 ? 'AD' : 'A';
                        return (
                          <td key={c.id} className="p-3.5 text-center">
                            <GradeBadge grade={letter} size="sm" />
                          </td>
                        );
                      })}
                      <td className="p-3.5 text-center pr-5">
                        <GradeBadge grade={finalBadge} size="sm" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: HORARIO SEMANAL DEL SALÓN ── */}
      {activeTab === 'horario' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                Malla Horaria Semanal — {currentGrade?.nombre} &quot;{currentSection?.letra}&quot;
              </h3>
              <p className="text-xs text-slate-500">Distribución de Lunes a Viernes (08:00 a 13:45)</p>
            </div>
            <Link
              href="/admin/horarios"
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md transition-all"
            >
              Editar Horario Completo
            </Link>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-black">
                  <th className="p-3 text-center w-28">Hora</th>
                  {days.map(d => (
                    <th key={d} className="p-3 text-center">{dayLabels[d]}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {timeBlocks.map((block, bIdx) => {
                  if (block.isBreak) {
                    return (
                      <tr key={`break-${bIdx}`} className="bg-amber-500/10 border-y border-amber-500/20 text-center">
                        <td className="p-2 font-mono text-[11px] font-bold text-amber-700 dark:text-amber-300">
                          {block.start} - {block.end}
                        </td>
                        <td colSpan={5} className="p-2 font-black text-amber-700 dark:text-amber-300 text-xs tracking-wider">
                          ☕ RECREO ESCOLAR & DESCANSO PEDAGÓGICO
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={`block-${block.start}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-3 text-center font-mono text-slate-500 dark:text-slate-400 font-bold border-r border-slate-100 dark:border-slate-800">
                        {block.start} - {block.end}
                        <span className="block text-[10px] text-slate-400 font-normal">{block.label}</span>
                      </td>
                      {days.map(d => {
                        const slot = sectionSlots.find(s => s.dia === d && s.hora_inicio === block.start);
                        if (slot) {
                          return (
                            <td key={d} className="p-2 text-center align-middle">
                              <div
                                className="p-2.5 rounded-2xl text-white shadow-sm flex flex-col items-center justify-center min-h-[64px]"
                                style={{ backgroundColor: slot.curso?.color_hex || '#8b5cf6' }}
                              >
                                <span className="font-black text-xs leading-tight">{slot.curso?.nombre}</span>
                                <span className="text-[10px] text-white/90 font-medium mt-0.5">
                                  Prof. {slot.docente?.nombres.split(' ')[0]} {slot.docente?.apellidos.split(' ')[0]}
                                </span>
                              </div>
                            </td>
                          );
                        }

                        return (
                          <td key={d} className="p-2 text-center text-slate-300 dark:text-slate-700">
                            <span className="text-[11px] font-medium">—</span>
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

      {/* ── TAB 5: CUADERNO DE CAMPO & SESIONES ── */}
      {activeTab === 'bitacora' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                Bitácora de Sesiones Dictadas & Cuaderno de Campo
              </h3>
              <p className="text-xs text-slate-500">Registro pedagógico de temas avanzados y observaciones por clase</p>
            </div>
          </div>

          {sectionSessions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <FileText className="w-12 h-12 text-slate-400 mx-auto" />
              <h4 className="font-bold text-slate-800 dark:text-white">Sin sesiones registradas aún</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Los profesores registran aquí el avance pedagógico de cada bloque horario desde su panel docente.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sectionSessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200">
                        {session.curso?.nombre || 'Matemática'}
                      </span>
                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-500" />
                        {session.fecha}
                      </span>
                    </div>

                    <h4 className="font-black text-slate-900 dark:text-white text-sm">
                      {session.tema_tratado}
                    </h4>

                    {session.observaciones && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        <strong>Observaciones:</strong> {session.observaciones}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Asistencia Tomada
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
