'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
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
  GraduationCap,
  Plus,
  AlertCircle,
  TrendingUp,
  UserPlus,
  ExternalLink,
  Settings
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
  const [activeTab, setActiveTab] = useState<'alumnos' | 'areas' | 'calificaciones' | 'horario'>('alumnos');

  const currentSection = sections.find(s => s.id === seccionId) || sections[0];
  const currentGrade = currentSection ? gradeLevels.find(g => g.id === currentSection.grado_id) : gradeLevels[0];
  const nivel = currentGrade?.nivel || 'primaria';

  // Real enrolled students in this section
  const sectionEnrollments = useMemo(() => {
    return enrollments.filter(e => e.seccion_id === currentSection?.id && e.estado === 'activo');
  }, [enrollments, currentSection]);

  const realStudentsCount = sectionEnrollments.length;
  const sectionCapacity = currentSection?.capacidad_maxima || 30;
  const capacityPercent = Math.min(100, Math.round((realStudentsCount / sectionCapacity) * 100));

  // Real course assignments
  const sectionAssignments = useMemo(() => {
    return sectionCourses.filter(sc => sc.seccion_id === currentSection?.id);
  }, [sectionCourses, currentSection]);

  // Courses applicable for this level
  const coursesForThisLevel = useMemo(() => {
    return courses.filter(c => c.nivel === nivel || !c.nivel);
  }, [courses, nivel]);

  // Real assigned teachers
  const assignedTeacherIds = Array.from(new Set(sectionAssignments.map(a => a.docente_id)));
  const realTeachersCount = assignedTeacherIds.length;

  // Real attendance rate for this section
  const sectionAttendances = useMemo(() => {
    return attendances.filter(a => sectionEnrollments.some(e => e.id === a.matricula_id));
  }, [attendances, sectionEnrollments]);

  const presentCount = sectionAttendances.filter(a => a.estado === 'presente' || a.estado === 'tardanza').length;
  const attendanceRate = sectionAttendances.length > 0 
    ? Math.round((presentCount / sectionAttendances.length) * 100) 
    : null;

  // Real schedule slots
  const sectionSlots = useMemo(() => {
    return scheduleSlots.filter(s => s.seccion_id === currentSection?.id);
  }, [scheduleSlots, currentSection]);

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

  const nivelBadgeData: Record<string, { label: string; icon: string; bg: string }> = {
    inicial: { label: '🧸 Nivel Inicial', icon: '🧸', bg: 'bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border-pink-200 dark:border-pink-800' },
    primaria: { label: '📚 Nivel Primaria', icon: '📚', bg: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
    secundaria: { label: '🎓 Nivel Secundaria', icon: '🎓', bg: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
  };

  const currentNivelConfig = nivelBadgeData[nivel] || nivelBadgeData.primaria;

  // Columns for Students DataTable
  const studentColumns: Column<Enrollment>[] = [
    {
      header: 'Estudiante',
      cell: (enr) => {
        const student = enr.estudiante;
        const fullName = `${student?.profile?.apellidos || ''}, ${student?.profile?.nombres || ''}`;
        return (
          <div className="flex items-center gap-3">
            <img
              src={student?.profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(student?.profile?.nombres || 'Alumno')}`}
              alt={fullName}
              className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
            />
            <div>
              <p className="font-extrabold text-slate-800 dark:text-white text-xs leading-tight">
                {fullName}
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                {student?.codigo_estudiante} · DNI {student?.profile?.dni}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Apoderado / Contacto',
      cell: (enr) => (
        <div>
          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
            {enr.estudiante?.nombre_apoderado || 'Sin apoderado registrado'}
          </p>
          <p className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
            <Phone className="w-3 h-3 text-slate-400" />
            {enr.estudiante?.telefono_apoderado || '—'}
          </p>
        </div>
      ),
    },
    {
      header: 'Carnet QR',
      cell: (enr) => (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <QrCode className="w-3 h-3 text-emerald-500" />
          {enr.estudiante?.token_qr ? `${enr.estudiante.token_qr.substring(0, 12)}...` : 'QR-ACTIVO'}
        </span>
      ),
    },
    {
      header: 'Condición',
      cell: () => (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-3 h-3" />
          Matriculado Activo
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-16">
      
      {/* ── 1. Breadcrumb Navigation Precisa ── */}
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
            {currentNivelConfig.label}
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

        <div className="flex items-center gap-2">
          <Link
            href="/admin/academico"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Ver Todos los Salones</span>
          </Link>
        </div>
      </div>

      {/* ── 2. Header Hero del Salón ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 p-6 sm:p-8 border border-purple-900/40 shadow-2xl text-white">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Left Info */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-purple-200 text-xs font-black">
                {currentNivelConfig.label} · Turno Mañana
              </span>
              <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold flex items-center gap-1">
                <MapPin className="w-3 h-3 text-blue-300" />
                Aula {currentGrade?.numero_grado || '3'}01 · Pabellón {nivel === 'inicial' ? 'A' : 'B'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
              {currentGrade?.nombre} — Sección &quot;{currentSection?.letra}&quot;
            </h1>
            <p className="text-purple-200/80 text-xs sm:text-sm max-w-xl leading-relaxed">
              Expediente centralizado del aula: padrón de estudiantes, asignación docente por curso, registro bimestral y horario oficial.
            </p>
          </div>

          {/* Right Action Shortcuts */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/admin/matriculas"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Matricular Alumno</span>
            </Link>

            <Link
              href="/admin/horarios"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all active:scale-95"
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Gestionar Horario</span>
            </Link>

            <Link
              href="/admin/notas-salon"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all active:scale-95"
            >
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Consolidado de Notas</span>
            </Link>
          </div>

        </div>

        {/* Capacity Meter Bar */}
        <div className="relative z-10 mt-6 pt-5 border-t border-white/10">
          <div className="flex items-center justify-between text-xs font-bold text-purple-200 mb-1.5">
            <span>Ocupación de Vacantes: {realStudentsCount} de {sectionCapacity} alumnos</span>
            <span className="font-mono">{capacityPercent}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                capacityPercent >= 90 ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${capacityPercent}%` }}
            />
          </div>
        </div>

      </div>

      {/* ── 3. KPIs del Salón con Datos Reales ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Matriculados</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{realStudentsCount}</span>
            <span className="text-xs text-slate-400 font-medium">/ {sectionCapacity} max</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Alumnos activos en el aula</p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Docentes</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{realTeachersCount}</span>
            <span className="text-xs text-slate-400 font-medium">asignados</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Profesores especialistas</p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Áreas / Cursos</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {sectionAssignments.length > 0 ? sectionAssignments.length : coursesForThisLevel.length}
            </span>
            <span className="text-xs text-slate-400 font-medium">materias</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Malla curricular CNEB</p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Asistencia</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {attendanceRate !== null ? `${attendanceRate}%` : '—'}
            </span>
            <span className="text-xs text-emerald-600 font-semibold">{attendanceRate !== null ? 'registrada' : 'Sin registros'}</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Puntualidad en aula</p>
        </div>
      </div>

      {/* ── 4. Navegación por Pestañas Limpia & Intuitiva ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-2 scrollbar-thin">
        
        {/* Tab 1: Padrón de Alumnos */}
        <button
          onClick={() => setActiveTab('alumnos')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'alumnos'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Padrón de Alumnos ({realStudentsCount})</span>
        </button>

        {/* Tab 2: Plan Curricular & Docentes */}
        <button
          onClick={() => setActiveTab('areas')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'areas'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Plan de Estudios & Docentes ({sectionAssignments.length > 0 ? sectionAssignments.length : coursesForThisLevel.length})</span>
        </button>

        {/* Tab 3: Calificaciones */}
        <button
          onClick={() => setActiveTab('calificaciones')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'calificaciones'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Calificaciones Bimestrales</span>
        </button>

        {/* Tab 4: Horario Semanal */}
        <button
          onClick={() => setActiveTab('horario')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'horario'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Horario Semanal ({sectionSlots.length} bloques)</span>
        </button>

      </div>

      {/* ── TAB 1: PADRÓN DE ESTUDIANTES ── */}
      {activeTab === 'alumnos' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Padrón Oficial de Estudiantes — {currentGrade?.nombre} &quot;{currentSection?.letra}&quot;
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {realStudentsCount} de {sectionCapacity} estudiantes matriculados
              </p>
            </div>

            <Link
              href="/admin/matriculas"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-md shadow-purple-600/25 transition-all self-start sm:self-auto active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Matricular Alumno en este Salón</span>
            </Link>
          </div>

          {realStudentsCount === 0 ? (
            <div className="py-14 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center mx-auto">
                <Users className="w-7 h-7" />
              </div>
              <h4 className="font-extrabold text-base text-slate-800 dark:text-white">
                No hay alumnos matriculados en este salón todavía
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Puedes registrar nuevos estudiantes o asignarlos directamente a esta sección desde el módulo de matrículas.
              </p>
              <div className="pt-2">
                <Link
                  href="/admin/matriculas"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-md shadow-purple-600/20 transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Iniciar Matrícula para {currentGrade?.nombre} &quot;{currentSection?.letra}&quot;</span>
                </Link>
              </div>
            </div>
          ) : (
            <DataTable
              columns={studentColumns}
              data={sectionEnrollments}
              searchPlaceholder="Buscar estudiante por nombre, apellidos o DNI..."
              searchFilter={(enr, q) => {
                const full = `${enr.estudiante?.profile?.nombres} ${enr.estudiante?.profile?.apellidos} ${enr.estudiante?.profile?.dni} ${enr.estudiante?.codigo_estudiante}`.toLowerCase();
                return full.includes(q);
              }}
            />
          )}
        </div>
      )}

      {/* ── TAB 2: ÁREAS CURRICULARES & DOCENTES ── */}
      {activeTab === 'areas' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Plan de Estudios & Docentes Especialistas
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Carga horaria semanal y profesores titulares para {currentGrade?.nombre} &quot;{currentSection?.letra}&quot;
              </p>
            </div>

            <Link
              href="/admin/horarios"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors self-start sm:self-auto"
            >
              <Settings className="w-3.5 h-3.5 text-purple-600" />
              <span>Configurar Horas & Docentes</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coursesForThisLevel.map((course) => {
              const assignment = sectionAssignments.find(sa => sa.curso_id === course.id);
              const teacher = assignment?.docente || (assignment?.docente_id ? teachers.find(t => t.id === assignment.docente_id) : undefined);

              return (
                <div
                  key={course.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white text-xs shadow-md shrink-0"
                          style={{ backgroundColor: course.color_hex || '#6366f1' }}
                        >
                          {course.codigo.substring(0, 3)}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm leading-tight">
                            {course.nombre}
                          </h4>
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            {course.codigo}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                        {assignment?.horas_semanales || 4} hrs/sem
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                      {course.competencias?.map(c => c.descripcion).join(' · ') || 'Desarrollo de competencias curriculares oficiales CNEB.'}
                    </p>

                    {/* Teacher status */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-3">
                      {teacher ? (
                        <>
                          <img
                            src={teacher.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.nombres)}`}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-purple-500/30 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="text-[9px] uppercase font-black text-purple-600 dark:text-purple-400 block">
                              Docente Titular
                            </span>
                            <p className="font-extrabold text-slate-800 dark:text-white text-xs truncate">
                              {teacher.nombres} {teacher.apellidos}
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-semibold text-slate-400 italic">Sin docente asignado</span>
                          <Link href="/admin/horarios" className="text-[11px] font-bold text-purple-600 hover:underline">
                            + Asignar
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3.5 mt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-purple-600 dark:text-purple-400">
                    <span>{course.competencias?.length || 3} Competencias CNEB</span>
                    <span className="text-slate-400 font-medium">Aula {currentGrade?.numero_grado || '3'}01</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 3: CALIFICACIONES DEL SALÓN ── */}
      {activeTab === 'calificaciones' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Matriz de Calificaciones ({evaluationPeriods.find(p => p.id === selectedBimestre)?.nombre || 'I Bimestre'})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Escala oficial CNEB: AD (Destacado), A (Esperado), B (En Proceso), C (En Inicio).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Bimestre:</span>
              <select
                value={selectedBimestre}
                onChange={(e) => setSelectedBimestre(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white outline-none cursor-pointer"
              >
                {evaluationPeriods.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {realStudentsCount === 0 ? (
            <div className="py-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6">
              <Award className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-sm text-slate-700 dark:text-slate-300">Sin calificaciones registradas</p>
              <p className="text-xs text-slate-400 mt-1">Este salón aún no cuenta con alumnos matriculados para evaluar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm scrollbar-thin">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-black uppercase text-[10px]">
                    <th className="p-3.5 pl-5">N.°</th>
                    <th className="p-3.5 min-w-[160px]">Estudiante</th>
                    {coursesForThisLevel.slice(0, 6).map(c => (
                      <th key={c.id} className="p-3.5 text-center min-w-[70px]">{c.codigo.substring(0, 3)}</th>
                    ))}
                    <th className="p-3.5 text-center pr-5">Promedio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sectionEnrollments.map((enr, idx) => {
                    const studentGrades = grades.filter(g => g.matricula_id === enr.id);
                    const scores = studentGrades.map(g => {
                      if (g.nota_letra === 'AD') return 4;
                      if (g.nota_letra === 'A') return 3;
                      if (g.nota_letra === 'B') return 2;
                      return 1;
                    });
                    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
                    const letter: GradeLetter = avg >= 3.5 ? 'AD' : avg >= 2.5 ? 'A' : avg >= 1.5 ? 'B' : 'C';

                    return (
                      <tr key={enr.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 pl-5 font-bold text-slate-400 font-mono">{idx + 1}</td>
                        <td className="p-3.5">
                          <p className="font-extrabold text-slate-800 dark:text-white">
                            {enr.estudiante?.profile?.apellidos}, {enr.estudiante?.profile?.nombres}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">{enr.estudiante?.codigo_estudiante}</p>
                        </td>
                        {coursesForThisLevel.slice(0, 6).map(c => {
                          const courseGrade = grades.find(g => 
                            g.matricula_id === enr.id && 
                            c.competencias?.some(comp => comp.id === g.competencia_id)
                          );
                          return (
                            <td key={c.id} className="p-3.5 text-center">
                              {courseGrade ? (
                                <GradeBadge grade={courseGrade.nota_letra} size="sm" />
                              ) : (
                                <span className="text-slate-300 dark:text-slate-600 font-mono">—</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="p-3.5 text-center pr-5">
                          {studentGrades.length > 0 ? (
                            <GradeBadge grade={letter} size="sm" />
                          ) : (
                            <span className="text-slate-400 text-xs">Sin notas</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: HORARIO SEMANAL ── */}
      {activeTab === 'horario' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Malla Horaria Semanal — {currentGrade?.nombre} &quot;{currentSection?.letra}&quot;
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Distribución de clases de Lunes a Viernes (08:00 a 13:45)
              </p>
            </div>

            <Link
              href="/admin/horarios"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all self-start sm:self-auto"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Editar Horario Completo</span>
            </Link>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-black uppercase text-[10px]">
                  <th className="p-3.5 pl-5 w-24">Hora</th>
                  {days.map(d => (
                    <th key={d} className="p-3.5 text-center font-extrabold">{dayLabels[d]}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {timeBlocks.map((block, idx) => {
                  if (block.isBreak) {
                    return (
                      <tr key={idx} className="bg-amber-50/60 dark:bg-amber-950/20">
                        <td className="p-2.5 pl-5 font-bold text-[10px] text-amber-700 dark:text-amber-400 font-mono">
                          {block.start} - {block.end}
                        </td>
                        <td colSpan={5} className="p-2.5 text-center font-black text-xs text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                          ☕ Recreo Escolar & Descanso Pedagógico
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={idx} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="p-3 pl-5 border-r border-slate-100 dark:border-slate-800">
                        <span className="font-mono font-bold text-[10px] text-slate-500 dark:text-slate-400 block">{block.start} - {block.end}</span>
                        <span className="text-[9px] text-slate-400 font-semibold">{block.label}</span>
                      </td>
                      {days.map(day => {
                        const slot = sectionSlots.find(s => s.dia === day && s.hora_inicio === block.start);
                        const course = slot ? courses.find(c => c.id === slot.curso_id) : null;
                        const teacher = slot ? teachers.find(t => t.id === slot.docente_id) : null;

                        return (
                          <td key={day} className="p-2 text-center align-top border-r border-slate-100 dark:border-slate-800 last:border-r-0">
                            {slot && course ? (
                              <div
                                className="p-2 rounded-xl text-left border shadow-xs"
                                style={{
                                  backgroundColor: `${course.color_hex || '#8b5cf6'}15`,
                                  borderColor: `${course.color_hex || '#8b5cf6'}40`,
                                }}
                              >
                                <p className="font-extrabold text-[11px] text-slate-900 dark:text-white truncate">
                                  {course.nombre}
                                </p>
                                <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate">
                                  Prof. {teacher?.nombres?.split(' ')[0] || 'Docente'}
                                </p>
                              </div>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600 font-mono text-sm">—</span>
                            )}
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

    </div>
  );
}
