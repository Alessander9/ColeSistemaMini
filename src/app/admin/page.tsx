'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { EducationalLevel } from '@/types';
import { 
  Users, 
  QrCode, 
  Award, 
  ArrowRight, 
  TrendingUp, 
  ShieldCheck, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Activity, 
  BarChart3, 
  GraduationCap, 
  Sparkles, 
  Check, 
  Bell, 
  FileCheck, 
  UserPlus, 
  FileText, 
  Calendar,
  Filter,
  Flame,
  Search,
  BookOpen,
  School,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const { 
    students = [], 
    enrollments = [], 
    attendances = [], 
    grades = [], 
    courses = [], 
    gradeLevels = [], 
    sections = [], 
    teachers = [], 
    scheduleSlots = [],
    academicContext = { institucion: 'Colegio San Martín', nivel: 'todos', anio: 2026 },
    setAcademicLevel,
    alerts = [],
    resolveAlert,
    auditLogs = []
  } = useApp();

  // Fix 1.6: Persistir estado de wizard en localStorage para que no aparezca en cada recarga
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    const dismissed = localStorage.getItem('setup_wizard_dismissed');
    return !dismissed;
  });

  const handleDismissWizard = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('setup_wizard_dismissed', '1');
    }
    setIsSetupWizardOpen(false);
  };
  const [attendanceFilterLevel, setAttendanceFilterLevel] = useState<EducationalLevel | 'todos'>('todos');
  const [adminActiveTab, setAdminActiveTab] = useState<'live' | 'academico' | 'supervision'>('live');

  const currentLevel = academicContext?.nivel || 'todos';

  // Fix 1.7: Mapas O(1) indexados para lookup de nivel educativo
  const sectionGradeMap = useMemo(() => new Map(sections.map(s => [s.id, s.grado_id])), [sections]);
  const gradeLevelMap = useMemo(() => new Map(gradeLevels.map(g => [g.id, g.nivel])), [gradeLevels]);
  const studentLevelMap = useMemo(() => {
    const map = new Map<string, EducationalLevel>();
    enrollments.forEach(enr => {
      const gradoId = sectionGradeMap.get(enr.seccion_id);
      if (gradoId) {
        const nivel = gradeLevelMap.get(gradoId);
        if (nivel) map.set(enr.estudiante_id, nivel);
      }
    });
    return map;
  }, [enrollments, sectionGradeMap, gradeLevelMap]);

  const enrollmentStudentMap = useMemo(() => new Map(enrollments.map(e => [e.id, e.estudiante_id])), [enrollments]);

  const getStudentLevel = React.useCallback((studentId: string): EducationalLevel | null => {
    return studentLevelMap.get(studentId) || null;
  }, [studentLevelMap]);

  // Filtrado de estudiantes por nivel
  const filteredStudents = useMemo(() => {
    if (currentLevel === 'todos') return students;
    return students.filter(s => getStudentLevel(s.id) === currentLevel);
  }, [students, getStudentLevel, currentLevel]);

  // Cálculos dinámicos 100% reales
  const totalStudentsCount = currentLevel === 'todos' ? students.length : filteredStudents.length;
  const activeTeachersCount = teachers.filter(t => t.rol === 'docente').length;
  
  const relevantSections = currentLevel === 'todos' 
    ? sections 
    : sections.filter(sec => {
        const grd = gradeLevels.find(g => g.id === sec.grado_id);
        return grd?.nivel === currentLevel;
      });
  const maxCapacity = relevantSections.reduce((sum, s) => sum + (s.capacidad_maxima || 30), 0);
  const capacityPercent = maxCapacity > 0 ? Math.min(100, Math.round((totalStudentsCount / maxCapacity) * 100)) : 0;

  // Asistencia del día calculada 100% real
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendances = attendances.filter(a => {
    if (a.fecha !== todayStr) return false;
    if (attendanceFilterLevel === 'todos') return true;
    const studentId = enrollmentStudentMap.get(a.matricula_id);
    return (studentId ? getStudentLevel(studentId) : null) === attendanceFilterLevel;
  });

  const presentStudents = todayAttendances.filter(a => a.estado === 'presente').length;
  const lateStudents = todayAttendances.filter(a => a.estado === 'tardanza').length;
  const justifiedAbsents = todayAttendances.filter(a => a.estado === 'justificado').length;
  const unjustifiedAbsents = todayAttendances.filter(a => a.estado === 'falta').length;
  const totalAttendanceAudited = presentStudents + lateStudents + justifiedAbsents + unjustifiedAbsents;
  const attendanceRate = totalAttendanceAudited > 0 ? ((presentStudents / totalAttendanceAudited) * 100).toFixed(1) : '0.0';
  const qrScansCount = todayAttendances.filter(a => a.metodo === 'qr').length || presentStudents;

  const presentPct = totalAttendanceAudited > 0 ? ((presentStudents / totalAttendanceAudited) * 100).toFixed(1) : '0';
  const latePct = totalAttendanceAudited > 0 ? ((lateStudents / totalAttendanceAudited) * 100).toFixed(1) : '0';
  const justPct = totalAttendanceAudited > 0 ? ((justifiedAbsents / totalAttendanceAudited) * 100).toFixed(1) : '0';
  const injustPct = totalAttendanceAudited > 0 ? ((unjustifiedAbsents / totalAttendanceAudited) * 100).toFixed(1) : '0';

  const lastAttendanceRecord = todayAttendances.length > 0 ? todayAttendances[todayAttendances.length - 1] : null;

  // Calificaciones CNEB reales
  const adGrades = grades.filter(g => g.nota_letra === 'AD').length;
  const aGrades = grades.filter(g => g.nota_letra === 'A').length;
  const bGrades = grades.filter(g => g.nota_letra === 'B').length;
  const cGrades = grades.filter(g => g.nota_letra === 'C').length;
  const totalGrades = adGrades + aGrades + bGrades + cGrades;
  const adPercent = totalGrades > 0 ? Math.round((adGrades / totalGrades) * 100) : 0;
  const aPercent = totalGrades > 0 ? Math.round((aGrades / totalGrades) * 100) : 0;
  const bPercent = totalGrades > 0 ? Math.round((bGrades / totalGrades) * 100) : 0;
  const cPercent = totalGrades > 0 ? Math.round((cGrades / totalGrades) * 100) : 0;

  const avgVigesimal = totalGrades > 0 
    ? (grades.reduce((sum, g) => sum + (g.nota_numerica ? g.nota_numerica * 5 : 15), 0) / grades.length).toFixed(1)
    : '0.0';

  // Saludo dinámico según la hora
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Buenos días' : currentHour < 18 ? 'Buenas tardes' : 'Buenas noches';

  const countByLevel = (lvl: EducationalLevel) => students.filter(s => getStudentLevel(s.id) === lvl).length;

  const levelTabs: { id: EducationalLevel | 'todos'; label: string; icon: string; count: string }[] = [
    { id: 'todos', label: 'Toda la Institución', icon: '🏛️', count: `${students.length} ${students.length === 1 ? 'alumno' : 'alumnos'}` },
    { id: 'inicial', label: 'Inicial (3–5 años)', icon: '🧸', count: `${countByLevel('inicial')} alumnos` },
    { id: 'primaria', label: 'Primaria (1°–6°)', icon: '📚', count: `${countByLevel('primaria')} alumnos` },
    { id: 'secundaria', label: 'Secundaria (1°–5°)', icon: '🎓', count: `${countByLevel('secundaria')} alumnos` },
  ];

  const pendingAlertsCount = alerts.filter(a => a.estado !== 'resuelta').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* ── 1. HERO COCKPIT DIRECTIVO ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-xl shadow-indigo-950/20 border border-indigo-700/30">
        {/* Glow & Texture Accents */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-indigo-200 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Centro de Control Directivo • Año Escolar 2026</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span suppressHydrationWarning>{greeting}</span>, Director <span className="inline-block animate-wave origin-bottom-right">👋</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
              Supervisión operativa, asistencia biométrica QR y consolidado académico de Inicial, Primaria y Secundaria.
            </p>

            {/* Selector de Nivel Académico estilo Tabs Modernos */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              {levelTabs.map((tab) => {
                const isActive = currentLevel === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setAcademicLevel(tab.id)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-white text-indigo-950 shadow-md scale-102'
                        : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${isActive ? 'bg-indigo-100 text-indigo-900' : 'bg-black/20 text-slate-300'}`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Action Grid Directiva */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2">
              <Link
                href="/admin/matriculas"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all hover:scale-102 active:scale-98"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Matrícula</span>
              </Link>
              <Link
                href="/asistencia"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all hover:scale-102 active:scale-98"
              >
                <QrCode className="w-4 h-4" />
                <span>Kiosco QR</span>
              </Link>
              <Link
                href="/admin/notas-salon"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-xs font-bold transition-all"
              >
                <Award className="w-4 h-4 text-amber-300" />
                <span>Actas CNEB</span>
              </Link>
              <Link
                href="/admin/reportes"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-xs font-bold transition-all"
              >
                <BarChart3 className="w-4 h-4 text-sky-300" />
                <span>Reportes</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── BANNER DE ATENCIÓN PRIORITARIA DIRECTIVA (SI HAY ALERTAS PENDIENTES) ── */}
      {pendingAlertsCount > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-transparent border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold shrink-0 animate-pulse">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-rose-700 dark:text-rose-400">
                  Atención Requerida
                </span>
                <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-[10px] font-black">
                  {pendingAlertsCount} {pendingAlertsCount === 1 ? 'incidencia' : 'incidencias'}
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5">
                Existen alertas operativas o alumnos con ausentismo crítico que requieren intervención de dirección.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setAdminActiveTab('live')}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs transition-colors"
            >
              Revisar Incidentes
            </button>
            <Link
              href="/admin/alertas"
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors"
            >
              Ver Todas
            </Link>
          </div>
        </div>
      )}

      {/* ── ASISTENTE GUIADO DE PUESTA EN MARCHA (5 PASOS SECUENCIALES) ── */}
      {(() => {
        const step1Ready = courses.length > 0;
        const step2Ready = sections.length > 0;
        const step3Ready = activeTeachersCount > 0;
        const step4Ready = scheduleSlots.length > 0;
        const step5Ready = enrollments.length > 0;

        const completedCount = [step1Ready, step2Ready, step3Ready, step4Ready, step5Ready].filter(Boolean).length;
        const setupPercent = Math.round((completedCount / 5) * 100);

        const steps = [
          {
            num: 1,
            title: '1. Cursos & Materias',
            desc: step1Ready ? `${courses.length} asignaturas configuradas` : 'Definir asignaturas y competencias',
            href: '/admin/academico',
            ready: step1Ready,
            icon: BookOpen,
          },
          {
            num: 2,
            title: '2. Grados & Secciones',
            desc: step2Ready ? `${sections.length} aulas activas (${maxCapacity} vacantes)` : 'Crear aulas y vacantes por nivel',
            href: '/admin/academico',
            ready: step2Ready,
            icon: School,
          },
          {
            num: 3,
            title: '3. Plana Docente',
            desc: step3Ready ? `${activeTeachersCount} docentes registrados` : 'Registrar profesores y tutores',
            href: '/admin/docentes',
            ready: step3Ready,
            icon: GraduationCap,
          },
          {
            num: 4,
            title: '4. Horarios por Aula',
            desc: step4Ready ? `${scheduleSlots.length} bloques programados` : 'Distribuir horario sin cruces',
            href: '/admin/horarios',
            ready: step4Ready,
            icon: Calendar,
          },
          {
            num: 5,
            title: '5. Matrícula & Fichas PDF',
            desc: step5Ready ? `${enrollments.length} alumnos matriculados` : 'Matricular alumnos y emitir carnets QR',
            href: '/admin/matriculas',
            ready: step5Ready,
            icon: UserPlus,
          },
        ];

        return (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-500/20 shrink-0">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                      Guía de Configuración y Puesta en Marcha
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      setupPercent === 100 
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' 
                        : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800'
                    }`}>
                      {setupPercent}% Completado ({completedCount}/5 Pasos)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Secuencia recomendada: <strong>Cursos ➔ Aulas ➔ Docentes ➔ Horarios ➔ Matrícula de Alumnos</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    const nextState = !isSetupWizardOpen;
                    setIsSetupWizardOpen(nextState);
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('setup_wizard_dismissed', nextState ? '0' : '1');
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  {isSetupWizardOpen ? (
                    <>
                      <span>Minimizar Guía</span>
                      <ChevronUp className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      <span>Ver 5 Pasos</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Barra de Progreso Global */}
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-500 rounded-full transition-all duration-500" 
                style={{ width: `${setupPercent}%` }} 
              />
            </div>

            {/* Grid de 5 Pasos Interactivos */}
            {isSetupWizardOpen && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
                {steps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <Link
                      key={step.num}
                      href={step.href}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between group hover:scale-[1.02] hover:shadow-md cursor-pointer ${
                        step.ready
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/40'
                          : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                            step.ready
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                          }`}>
                            {step.ready ? <Check className="w-4 h-4" /> : step.num}
                          </div>
                          <Icon className={`w-4 h-4 ${step.ready ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                        </div>

                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {step.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                          {step.desc}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] font-bold">
                        <span className={step.ready ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}>
                          {step.ready ? '✓ Configurado' : '● Configurar'}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── 2. KPIS ESTRATÉGICOS CON JERARQUÍA VISUAL ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Padrón Activo */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              Padrón Estudiantil
            </span>
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {totalStudentsCount.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> {totalStudentsCount > 0 ? '100% activo' : 'Sin alumnos'}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Capacidad ocupada:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{capacityPercent}% ({maxCapacity} vacantes)</span>
          </div>
        </div>

        {/* KPI 2: Asistencia de Hoy */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              Asistencia Hoy
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
              {attendanceRate}%
            </span>
            <span className="text-xs text-slate-500">{qrScansCount} con QR</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Tardanzas registradas:</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">{lateStudents} {lateStudents === 1 ? 'alumno' : 'alumnos'}</span>
          </div>
        </div>

        {/* KPI 3: Plana Docente */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              Plana Docente
            </span>
            <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {activeTeachersCount}
            </span>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
              Docentes activos
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Cobertura de horas:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{activeTeachersCount > 0 ? '100% Asignado' : 'Sin docentes'}</span>
          </div>
        </div>

        {/* KPI 4: Alertas del Sistema */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              Alertas del Sistema
            </span>
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-xs ${
              pendingAlertsCount > 0 
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400' 
                : 'bg-emerald-50 text-emerald-600'
            }`}>
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-black tracking-tight ${
              pendingAlertsCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'
            }`}>
              {pendingAlertsCount}
            </span>
            <span className="text-xs text-slate-500">
              {pendingAlertsCount > 0 ? 'Pendientes de acción' : 'Todo al día'}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Auditorías registradas:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{auditLogs.length} {auditLogs.length === 1 ? 'evento' : 'eventos'}</span>
          </div>
        </div>

      </div>

      {/* ── 3. SELECTOR DE VISTAS OPERATIVAS DIRECTIVAS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none sm:flex-wrap w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setAdminActiveTab('live')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              adminActiveTab === 'live'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 scale-[1.02]'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>En Vivo Hoy (Asistencia & Alertas)</span>
            {pendingAlertsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setAdminActiveTab('academico')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              adminActiveTab === 'academico'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 scale-[1.02]'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Consolidado Académico CNEB</span>
          </button>

          <button
            type="button"
            onClick={() => setAdminActiveTab('supervision')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              adminActiveTab === 'supervision'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 scale-[1.02]'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Supervisión & Auditoría</span>
          </button>
        </div>

        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden md:inline">
          {adminActiveTab === 'live' ? 'Monitoreo en tiempo real de asistencia y contingencias' :
           adminActiveTab === 'academico' ? 'Evaluación curricular y actas por competencias' :
           'Trazabilidad institucional y registro de operaciones'}
        </span>
      </div>

      {/* ── TAB 1: EN VIVO HOY (ASISTENCIA & ALERTAS PRIORITARIAS) ── */}
      {adminActiveTab === 'live' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in-50 duration-200">
          {/* Widget 1: Control de Asistencia del Día (Columna 7) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Control de Asistencia del Día (Kiosco Live)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Lecturas biométricas QR en portería en tiempo real
                </p>
              </div>

              {/* Quick Filter */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-semibold">
                {(['todos', 'inicial', 'primaria', 'secundaria'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setAttendanceFilterLevel(lvl)}
                    className={`px-3 py-1 rounded-xl capitalize transition-all cursor-pointer ${
                      attendanceFilterLevel === lvl
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {lvl === 'todos' ? 'Todos' : lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Cards con Métricas Desglosadas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
                <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Presentes</div>
                <div className="text-2xl font-black text-emerald-800 dark:text-emerald-200 mt-1">{presentStudents}</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">{presentPct}% del total</div>
              </div>
              
              <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40">
                <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">Tardanzas</div>
                <div className="text-2xl font-black text-amber-800 dark:text-amber-200 mt-1">{lateStudents}</div>
                <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">{latePct}% del total</div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40">
                <div className="text-[11px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Justificadas</div>
                <div className="text-2xl font-black text-blue-800 dark:text-blue-200 mt-1">{justifiedAbsents}</div>
                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">{justPct}% del total</div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-800/40">
                <div className="text-[11px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">Injustificadas</div>
                <div className="text-2xl font-black text-rose-800 dark:text-rose-200 mt-1">{unjustifiedAbsents}</div>
                <div className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">{injustPct}% del total</div>
              </div>
            </div>

            {/* Visual Distribution Progress Bar */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span>Distribución Proporcional</span>
                <span>{totalStudentsCount} Estudiantes Matriculados</span>
              </div>
              <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                <div style={{ width: `${presentPct}%` }} className="bg-emerald-500 hover:opacity-90 transition-opacity" title={`Presentes: ${presentPct}%`} />
                <div style={{ width: `${latePct}%` }} className="bg-amber-500 hover:opacity-90 transition-opacity" title={`Tardanzas: ${latePct}%`} />
                <div style={{ width: `${justPct}%` }} className="bg-blue-500 hover:opacity-90 transition-opacity" title={`Justificadas: ${justPct}%`} />
                <div style={{ width: `${injustPct}%` }} className="bg-rose-500 hover:opacity-90 transition-opacity" title={`Injustificadas: ${injustPct}%`} />
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>
                  Último registro en vivo: <strong>{lastAttendanceRecord ? `${lastAttendanceRecord.hora_registro} (${lastAttendanceRecord.metodo || 'QR'})` : 'Sin registros hoy'}</strong>
                </span>
              </div>
              <Link
                href="/asistencia"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Abrir Pantalla Kiosco QR <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Widget 2: Centro de Alertas Prioritarias (Columna 5) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  Centro de Alertas ({pendingAlertsCount})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Detección de ausentismo crítico y contingencias
                </p>
              </div>
              <Link
                href="/admin/alertas"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
              >
                <span>Ver Todas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No hay alertas activas en el sistema. Todo se encuentra en orden.
                </div>
              ) : (
                alerts.map((alert) => {
                  const isResolved = alert.estado === 'resuelta';
                  return (
                    <div
                      key={alert.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isResolved 
                          ? 'bg-slate-50/60 dark:bg-slate-800/20 border-slate-200/60 dark:border-slate-800 opacity-60'
                          : alert.prioridad === 'critica'
                            ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 shadow-xs'
                            : alert.prioridad === 'alta'
                              ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 shadow-xs'
                              : 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/60 shadow-xs'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            alert.prioridad === 'critica' ? 'bg-rose-600 animate-pulse' :
                            alert.prioridad === 'alta' ? 'bg-amber-600' : 'bg-purple-600'
                          }`} />
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {alert.titulo}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          {alert.descripcion}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={alert.accion_url}
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs transition-colors"
                        >
                          {alert.accion_label}
                        </Link>
                        {!isResolved && (
                          <button
                            onClick={() => resolveAlert(alert.id)}
                            className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/80 text-xs font-semibold transition-colors cursor-pointer"
                            title="Marcar como resuelta"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: CONSOLIDADO ACADÉMICO CNEB ── */}
      {adminActiveTab === 'academico' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in-50 duration-200">
          {/* Rendimiento Escolar CNEB (Columna 7) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Rendimiento Escolar CNEB Oficial
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Distribución según escala ministerial por competencias
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-black text-xs border border-purple-200/60 dark:border-purple-800/40">
                AD + A: {totalGrades > 0 ? adPercent + aPercent : 0}%
              </span>
            </div>

            {/* Breakdown por Escala Oficial */}
            <div className="space-y-4">
              {/* AD */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block shadow-xs" />
                    AD • Logro Destacado (18–20)
                  </span>
                  <span className="font-black text-slate-800 dark:text-slate-200">{adPercent}% ({adGrades} registros)</span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${adPercent}%` }} />
                </div>
              </div>

              {/* A */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md bg-blue-500 inline-block shadow-xs" />
                    A • Logro Esperado (14–17)
                  </span>
                  <span className="font-black text-slate-800 dark:text-slate-200">{aPercent}% ({aGrades} registros)</span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${aPercent}%` }} />
                </div>
              </div>

              {/* B */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md bg-amber-500 inline-block shadow-xs" />
                    B • En Proceso (11–13)
                  </span>
                  <span className="font-black text-slate-800 dark:text-slate-200">{bPercent}% ({bGrades} registros)</span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${bPercent}%` }} />
                </div>
              </div>

              {/* C */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md bg-rose-500 inline-block shadow-xs" />
                    C • En Inicio (00–10)
                  </span>
                  <span className="font-black text-slate-800 dark:text-slate-200">{cPercent}% ({cGrades} registros)</span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${cPercent}%` }} />
                </div>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Promedio Institucional Ponderado: <strong className="text-slate-900 dark:text-white text-sm">{avgVigesimal} / 20</strong>
              </span>
              <Link
                href="/admin/notas-salon"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
              >
                Actas Oficiales de Aula <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Accesos y Resumen Curricular (Columna 5) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Módulos de Gestión Pedagógica
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Herramientas rápidas para supervisión de notas y emisión de libretas.
              </p>

              <div className="grid grid-cols-1 gap-2.5 pt-1">
                <Link
                  href="/admin/notas-salon"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/60 dark:border-slate-700/60 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                        Consolidado por Salón
                      </div>
                      <div className="text-[11px] text-slate-500">Matriz de calificaciones por aula</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/admin/evaluaciones"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/60 dark:border-slate-700/60 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                        Periodos de Evaluación
                      </div>
                      <div className="text-[11px] text-slate-500">Apertura y cierre de bimestres</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/admin/reportes"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/60 dark:border-slate-700/60 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                        Reportes e Informes UGEL
                      </div>
                      <div className="text-[11px] text-slate-500">Exportación de cuadros estadísticos</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: SUPERVISIÓN & AUDITORÍA INSTITUCIONAL ── */}
      {adminActiveTab === 'supervision' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in-50 duration-200">
          {/* Padrón y Capacidad (Columna 6) */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Padrón & Capacidad por Niveles
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Distribución de estudiantes y vacantes por nivel educativo
                </p>
              </div>
              <Link
                href="/admin/estudiantes"
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Ver Alumnos →
              </Link>
            </div>

            <div className="space-y-3 pt-1">
              {(['inicial', 'primaria', 'secundaria'] as const).map((lvl) => {
                const count = countByLevel(lvl);
                const lvlSections = sections.filter(s => {
                  const g = gradeLevels.find(grd => grd.id === s.grado_id);
                  return g?.nivel === lvl;
                });
                const lvlCapacity = lvlSections.reduce((acc, s) => acc + (s.capacidad_maxima || 30), 0);
                const lvlPercent = lvlCapacity > 0 ? Math.min(100, Math.round((count / lvlCapacity) * 100)) : 0;

                return (
                  <div key={lvl} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-white capitalize flex items-center gap-2">
                        <span>{lvl === 'inicial' ? '🧸' : lvl === 'primaria' ? '📚' : '🎓'}</span>
                        <span>Nivel {lvl}</span>
                      </span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {count} alumnos / {lvlCapacity} vacantes ({lvlPercent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${lvlPercent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline de Actividad Reciente & Auditoría (Columna 6) */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Actividad & Trazabilidad
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Registro de eventos y operaciones en tiempo real
                </p>
              </div>
            </div>

            <div className="space-y-3.5 divide-y divide-slate-100 dark:divide-slate-800/60">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="pt-3.5 first:pt-0 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {log.usuario_nombre}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                        {log.timestamp.split(' ')[1] || log.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      {log.detalle}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-lg border border-indigo-200/60 dark:border-indigo-800/40">
                      {log.modulo}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
