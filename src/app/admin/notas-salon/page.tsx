'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { GradeBadge } from '@/components/notas/GradeBadge';
import { Modal } from '@/components/ui/Modal';
import { AnnualReportCardModal } from '@/components/notas/AnnualReportCardModal';
import { calculateStudentAnnualReportCard, StudentAnnualReportCard } from '@/lib/grades/calculations';
import { GradeLetter, Section, Student, Course } from '@/types';
import Link from 'next/link';
import {
  BookOpen,
  Users,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Search,
  Download,
  Award,
  TrendingUp,
  GraduationCap,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  School,
  Printer,
  FileSpreadsheet,
  ExternalLink,
  UserCheck,
  Eye,
  ShieldCheck,
  X,
  FileText,
  Calendar,
  MoreHorizontal,
  Settings,
  Layers,
  ArrowUpDown,
  Check
} from 'lucide-react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { initialsAvatarUrl } from '@/lib/avatar';

// Grade letter to number mapping
const gradeToNum: Record<GradeLetter, number> = { AD: 4, A: 3, B: 2, C: 1 };
const numToGrade = (n: number): GradeLetter => {
  if (n >= 3.5) return 'AD';
  if (n >= 2.5) return 'A';
  if (n >= 1.5) return 'B';
  return 'C';
};

type FilterNivel = 'todos' | 'inicial' | 'primaria' | 'secundaria';
type EvaluationStatus = 'todos' | 'sin_notas' | 'en_progreso' | 'evaluado';

export default function NotasSalonPage() {
  const {
    grades: gradeRecords,
    enrollments,
    courses,
    sections,
    gradeLevels,
    teachers,
    academicContext,
    students: allStudentsList,
    attendances,
    evaluationPeriods = [],
  } = useApp();

  const [filterNivel, setFilterNivel] = useState<FilterNivel>('todos');
  const [filterCurso, setFilterCurso] = useState<string>('todos');
  const [filterStatus, setFilterStatus] = useState<EvaluationStatus>('todos');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [search, setSearch] = useState('');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [activeMenuSectionId, setActiveMenuSectionId] = useState<string | null>(null);
  // Grados desplegados (por defecto todos plegados para no mostrar todas las secciones de golpe)
  const [expandedGrades, setExpandedGrades] = useState<Set<string>>(new Set());
  const toggleGrade = (id: string) => setExpandedGrades(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  // Modal State for Selected Section
  const [selectedSectionForModal, setSelectedSectionForModal] = useState<Section | null>(null);
  const [selectedQuickViewSection, setSelectedQuickViewSection] = useState<Section | null>(null);

  // Modal State for Grade Detail (Nivel / Grado)
  const [selectedGradeForDetail, setSelectedGradeForDetail] = useState<{ id: string; nombre: string; nivel: string } | null>(null);

  // Modal State for Individual Student Annual Report Card
  const [selectedReportCard, setSelectedReportCard] = useState<StudentAnnualReportCard | null>(null);
  const [isReportCardModalOpen, setIsReportCardModalOpen] = useState(false);

  // Helper: Build section statistics & student grade data
  const getSectionData = (sectionId: string) => {
    const sectionEnrollments = enrollments.filter(e => e.seccion_id === sectionId && e.estado === 'activo');

    const studentsData = sectionEnrollments.map(enr => {
      const studentGrades = gradeRecords.filter(g => {
        const base = g.matricula_id === enr.id;
        if (!base) return false;
        if (filterCurso !== 'todos') {
          const comp = courses.find(c => c.id === filterCurso);
          return comp?.competencias?.some(cp => cp.id === g.competencia_id);
        }
        return true;
      });

      const scores = studentGrades.map(g => gradeToNum[g.nota_letra]).filter(Boolean);
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

      // Per-course averages
      const courseAvgs: Record<string, GradeLetter | null> = {};
      courses.forEach(course => {
        const courseGrades = gradeRecords.filter(g =>
          g.matricula_id === enr.id &&
          course.competencias?.some(c => c.id === g.competencia_id)
        );
        if (courseGrades.length > 0) {
          const cScores = courseGrades.map(g => gradeToNum[g.nota_letra]);
          const cAvg = cScores.reduce((a, b) => a + b, 0) / cScores.length;
          courseAvgs[course.id] = numToGrade(cAvg);
        } else {
          courseAvgs[course.id] = null;
        }
      });

      return {
        enr,
        student: enr.estudiante,
        grades: studentGrades,
        avg,
        avgLetter: avg > 0 ? numToGrade(avg) : null,
        courseAvgs,
        totalGrades: studentGrades.length,
      };
    }).filter(s => {
      if (!search) return true;
      const name = `${s.student?.profile?.nombres} ${s.student?.profile?.apellidos} ${s.student?.profile?.dni} ${s.student?.codigo_estudiante}`.toLowerCase();
      return name.includes(search.toLowerCase());
    });

    // Section stats
    const withGrades = studentsData.filter(s => s.avg > 0);
    const sectionAvg = withGrades.length > 0
      ? withGrades.reduce((a, b) => a + b.avg, 0) / withGrades.length
      : 0;

    const distrib = { AD: 0, A: 0, B: 0, C: 0 };
    withGrades.forEach(s => {
      if (s.avgLetter) distrib[s.avgLetter]++;
    });

    // Evaluation Status
    let status: 'sin_notas' | 'en_progreso' | 'evaluado' = 'sin_notas';
    if (sectionEnrollments.length > 0) {
      if (withGrades.length === 0) {
        status = 'sin_notas';
      } else if (withGrades.length === sectionEnrollments.length) {
        status = 'evaluado';
      } else {
        status = 'en_progreso';
      }
    }

    return {
      students: studentsData,
      sectionAvg,
      distrib,
      totalStudents: sectionEnrollments.length,
      evaluatedStudents: withGrades.length,
      status
    };
  };

  // Group sections by grade and apply status filter
  const sectionsByGrade = useMemo(() => {
    const filtered = sections.filter(s => {
      if (filterNivel !== 'todos' && s.grado?.nivel !== filterNivel) return false;

      if (filterStatus !== 'todos') {
        const data = getSectionData(s.id);
        if (data.status !== filterStatus) return false;
      }

      if (search) {
        const data = getSectionData(s.id);
        if (data.students.length === 0) return false;
      }

      return true;
    });

    const byGrade: Record<string, typeof sections> = {};
    filtered.forEach(sec => {
      const key = sec.grado_id;
      if (!byGrade[key]) byGrade[key] = [];
      byGrade[key].push(sec);
    });
    return byGrade;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, filterNivel, filterStatus, search, gradeRecords, filterCurso]);

  // Sorted grade levels
  const sortedGrades = useMemo(() => {
    const seen = new Set<string>();
    const result: { id: string; nombre: string; nivel: string; numero: number }[] = [];
    sections.forEach(s => {
      if (!s.grado || seen.has(s.grado_id)) return;
      if (filterNivel !== 'todos' && s.grado.nivel !== filterNivel) return;

      // Check if this grade has any sections after filtering
      if (sectionsByGrade[s.grado_id] && sectionsByGrade[s.grado_id].length > 0) {
        seen.add(s.grado_id);
        result.push({ id: s.grado_id, nombre: s.grado.nombre, nivel: s.grado.nivel, numero: s.grado.numero_grado });
      }
    });
    return result.sort((a, b) => {
      const levelOrder: Record<string, number> = { inicial: 1, primaria: 2, secundaria: 3 };
      const orderA = levelOrder[a.nivel] || 2;
      const orderB = levelOrder[b.nivel] || 2;
      if (orderA !== orderB) return orderA - orderB;
      return a.numero - b.numero;
    });
  }, [sections, filterNivel, sectionsByGrade]);

  // Open Annual Report Card Modal for single student
  const handleOpenStudentReport = (student: Student, section?: Section) => {
    const enr = enrollments.find(e => e.estudiante_id === student.id);
    if (!enr) return;
    const targetSection = section || enr.seccion;
    const tutorId = targetSection?.tutor_id;
    const tutor = teachers.find(t => t.id === tutorId);
    const tutorName = tutor ? `${tutor.nombres} ${tutor.apellidos}` : 'No asignado';
    const studentAtts = attendances.filter(a => a.matricula_id === enr.id);
    const attPct = studentAtts.length > 0 ? Math.round((studentAtts.filter(a => a.estado === 'presente').length / studentAtts.length) * 100) : 0;

    const card = calculateStudentAnnualReportCard({
      enrollmentId: enr.id,
      studentId: student.id,
      studentName: `${student.profile?.apellidos || student.apellidos || ''}, ${student.profile?.nombres || student.nombres || ''}`.trim() || 'Estudiante',
      studentDni: student.profile?.dni || student.dni || '—',
      studentCode: student.codigo_estudiante || '—',
      gradeLevelName: targetSection?.grado?.nombre || 'Sin aula asignada',
      sectionLetter: targetSection?.letra || '-',
      academicYear: selectedYear,
      tutorName,
      attendancePercentage: attPct,
      courses,
      grades: gradeRecords,
      evaluationPeriodIds: [
        { id: 'eval-b1', numero_periodo: 1 },
        { id: 'eval-b2', numero_periodo: 2 },
        { id: 'eval-b3', numero_periodo: 3 },
        { id: 'eval-b4', numero_periodo: 4 },
      ],
    });
    setSelectedReportCard(card);
    setIsReportCardModalOpen(true);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (activeMenuSectionId && !(e.target as HTMLElement).closest('.section-menu-container')) {
        setActiveMenuSectionId(null);
      }
      if (isFilterMenuOpen && !(e.target as HTMLElement).closest('.filter-menu-container')) {
        setIsFilterMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeMenuSectionId, isFilterMenuOpen]);

  // Global Institutional Metrics Calculation
  const globalMetrics = useMemo(() => {
    const allActiveEnrollments = enrollments.filter(e => e.estado === 'activo');
    let totalScore = 0;
    let evaluatedCount = 0;
    const globalDistrib = { AD: 0, A: 0, B: 0, C: 0 };

    allActiveEnrollments.forEach(enr => {
      const studentGrades = gradeRecords.filter(g => g.matricula_id === enr.id);
      if (studentGrades.length > 0) {
        const scores = studentGrades.map(g => gradeToNum[g.nota_letra]).filter(Boolean);
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        const letter = numToGrade(avg);
        totalScore += avg;
        evaluatedCount++;
        globalDistrib[letter]++;
      }
    });

    const average = evaluatedCount > 0 ? totalScore / evaluatedCount : 0;
    const approvalRate = evaluatedCount > 0
      ? Math.round(((globalDistrib.AD + globalDistrib.A) / evaluatedCount) * 100)
      : 0;

    return {
      totalSections: sections.length,
      totalStudents: allActiveEnrollments.length,
      evaluatedCount,
      average,
      averageLetter: average > 0 ? numToGrade(average) : 'A',
      approvalRate,
      globalDistrib
    };
  }, [enrollments, gradeRecords, sections]);

  // Modal Section Data for Full Grade Sheet
  const modalSectionData = selectedSectionForModal
    ? getSectionData(selectedSectionForModal.id)
    : null;

  // Modal Section Data for Quick View
  const quickViewData = selectedQuickViewSection
    ? getSectionData(selectedQuickViewSection.id)
    : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-16 font-sans">

      {/* ══════════ 1. ENCABEZADO (claro y sobrio) ══════════ */}
      {(() => {
        const now = new Date();
        const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const currentPeriod = evaluationPeriods.find(p => p.fecha_inicio <= todayIso && todayIso <= p.fecha_fin) || evaluationPeriods.find(p => p.activo && !p.cerrado);
        const evaluatedPct = globalMetrics.totalStudents > 0 ? Math.round((globalMetrics.evaluatedCount / globalMetrics.totalStudents) * 100) : 0;
        const avgPct = globalMetrics.average > 0 ? Math.round((globalMetrics.average / 4) * 100) : 0;
        const kpis = [
          { icon: School, tone: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300', bar: 'bg-blue-500', label: 'Aulas', value: `${globalMetrics.totalSections}`, hint: 'secciones en el colegio', pct: null as number | null },
          { icon: Users, tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300', bar: 'bg-emerald-500', label: 'Alumnos con notas', value: `${globalMetrics.evaluatedCount} de ${globalMetrics.totalStudents}`, hint: `${evaluatedPct}% ya tiene al menos una nota`, pct: evaluatedPct },
          { icon: Award, tone: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300', bar: 'bg-amber-500', label: 'Promedio del colegio', value: globalMetrics.average > 0 ? globalMetrics.averageLetter : '—', hint: globalMetrics.average > 0 ? `${globalMetrics.average.toFixed(2)} de 4.00` : 'Aún no hay notas registradas', pct: globalMetrics.average > 0 ? avgPct : null },
          { icon: TrendingUp, tone: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300', bar: 'bg-indigo-500', label: 'Alumnos en logro', value: globalMetrics.evaluatedCount > 0 ? `${globalMetrics.approvalRate}%` : '—', hint: 'con promedio AD o A', pct: globalMetrics.evaluatedCount > 0 ? globalMetrics.approvalRate : null },
        ];
        return (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-500" />
            <div className="p-5 sm:p-6 space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> Evaluación por competencias (CNEB)
                    </span>
                    {currentPeriod && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> {currentPeriod.nombre} {academicContext?.anio || new Date().getFullYear()} en curso
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="w-8 h-8 text-indigo-600" /> Notas por salón
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
                    Revisa cómo van las notas de cada aula (AD, A, B y C). Toca un grado para ver sus secciones y abre el consolidado de cualquiera para ver alumno por alumno.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:border-slate-400 cursor-pointer">
                    <Printer className="w-4 h-4" /> Imprimir
                  </button>
                  <Link href="/admin/reportes" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black shadow-md shadow-indigo-600/20">
                    <FileText className="w-4 h-4" /> Reportes y actas <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {kpis.map(k => (
                  <div key={k.label} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${k.tone}`}><k.icon className="w-5 h-5" /></span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{k.label}</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{k.value}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">{k.hint}</p>
                    {k.pct !== null && (
                      <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mt-2"><div className={`h-full rounded-full ${k.bar}`} style={{ width: `${k.pct}%` }} /></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── 2. BARRA DE BÚSQUEDA Y FILTROS ── */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">

        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por alumno, DNI o código..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 text-xs font-medium rounded-xl bg-slate-50/90 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Level Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setFilterNivel('todos')}
            className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              filterNivel === 'todos'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/80'
            }`}
          >
            Todos los Niveles
          </button>

          <button
            onClick={() => setFilterNivel('inicial')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              filterNivel === 'inicial'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/80'
            }`}
          >
            <span>🧸</span>
            <span>Inicial</span>
          </button>

          <button
            onClick={() => setFilterNivel('primaria')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              filterNivel === 'primaria'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/80'
            }`}
          >
            <span>📚</span>
            <span>Primaria</span>
          </button>

          <button
            onClick={() => setFilterNivel('secundaria')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              filterNivel === 'secundaria'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/80'
            }`}
          >
            <span>🎓</span>
            <span>Secundaria</span>
          </button>
        </div>

        {/* Extra Filters Button */}
        <div className="relative filter-menu-container">
          <button
            onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
            className={`w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              filterStatus !== 'todos'
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/50 dark:border-indigo-800 dark:text-indigo-300'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Filtros</span>
            {filterStatus !== 'todos' && (
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            )}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Filter Popover */}
          {isFilterMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl z-30 animate-in fade-in zoom-in-95 duration-150">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider px-2 block mb-2">
                Estado de Evaluación
              </span>
              <div className="space-y-1">
                {[
                  { id: 'todos', label: 'Todos los estados' },
                  { id: 'sin_notas', label: 'Sin notas registradas' },
                  { id: 'en_progreso', label: 'En progreso' },
                  { id: 'evaluado', label: 'Evaluación completa' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setFilterStatus(opt.id as EvaluationStatus);
                      setIsFilterMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors ${
                      filterStatus === opt.id
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {filterStatus === opt.id && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ── 3. ORGANIZACIÓN POR NIVEL Y GRADO ── */}
      {sortedGrades.length > 0 && (() => {
        const allOpen = sortedGrades.every(g => expandedGrades.has(g.id));
        const totalSecs = sortedGrades.reduce((a, g) => a + (sectionsByGrade[g.id]?.length || 0), 0);
        return (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              <strong className="text-slate-900 dark:text-white">{sortedGrades.length} {sortedGrades.length === 1 ? 'grado' : 'grados'}</strong> con <strong className="text-slate-900 dark:text-white">{totalSecs} {totalSecs === 1 ? 'sección' : 'secciones'}</strong>. Toca un grado para ver sus secciones.
            </p>
            <button
              type="button"
              onClick={() => setExpandedGrades(allOpen ? new Set() : new Set(sortedGrades.map(g => g.id)))}
              aria-expanded={allOpen}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black shadow-sm cursor-pointer shrink-0"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${allOpen ? 'rotate-180' : ''}`} />
              {allOpen ? 'Plegar todas las secciones' : 'Desplegar todas las secciones'}
            </button>
          </div>
        );
      })()}

      <div className="space-y-3">
        {sortedGrades.map(grade => {
          const gradeSections = sectionsByGrade[grade.id] || [];
          // Con una búsqueda activa se despliegan solos los grados que tienen resultados
          const isOpen = expandedGrades.has(grade.id) || !!search.trim();
          const gradeData = gradeSections.map(sec => getSectionData(sec.id));
          const gradeEvaluated = gradeData.reduce((a, d) => a + d.evaluatedStudents, 0);
          const statusCount = {
            evaluado: gradeData.filter(d => d.status === 'evaluado').length,
            en_progreso: gradeData.filter(d => d.status === 'en_progreso').length,
            sin_notas: gradeData.filter(d => d.status === 'sin_notas').length,
          };

          // Calculate total students in this grade
          const totalGradeStudents = gradeSections.reduce((acc, sec) => {
            const secData = getSectionData(sec.id);
            return acc + secData.totalStudents;
          }, 0);

          // Pastel palette styling per grade/level
          const isGrade3Años = grade.nombre.includes('3');
          const isGrade4Años = grade.nombre.includes('4');
          const isGrade5Años = grade.nombre.includes('5');

          let headerBg = 'bg-[#fdf2f8] dark:bg-pink-950/20 border-pink-100 dark:border-pink-900/30 text-pink-900 dark:text-pink-200';
          let iconBg = 'bg-[#e11d48] text-white shadow-pink-500/20';
          let pillBg = 'bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300';
          let sectionSquircle = 'bg-[#e11d48]';

          if (isGrade4Años || (grade.nivel === 'primaria' && grade.numero % 2 === 0)) {
            headerBg = 'bg-[#eff6ff] dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30 text-blue-900 dark:text-blue-200';
            iconBg = 'bg-[#2563eb] text-white shadow-blue-500/20';
            pillBg = 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300';
            sectionSquircle = 'bg-[#2563eb]';
          } else if (isGrade5Años || (grade.nivel === 'primaria' && grade.numero % 2 !== 0)) {
            headerBg = 'bg-[#f0fdf4] dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-900 dark:text-emerald-200';
            iconBg = 'bg-[#16a34a] text-white shadow-emerald-500/20';
            pillBg = 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300';
            sectionSquircle = 'bg-[#16a34a]';
          } else if (grade.nivel === 'secundaria') {
            headerBg = 'bg-[#faf5ff] dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/30 text-purple-900 dark:text-purple-200';
            iconBg = 'bg-[#7c3aed] text-white shadow-purple-500/20';
            pillBg = 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300';
            sectionSquircle = 'bg-[#7c3aed]';
          }

          return (
            <div key={grade.id} className="space-y-3">

              {/* Header Bar of Grade Group */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleGrade(grade.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleGrade(grade.id); } }}
                aria-expanded={isOpen}
                className={`p-4 sm:p-4.5 rounded-2xl border ${headerBg} flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs transition-all cursor-pointer hover:shadow-md`}
              >

                {/* Left: Cap Icon + Name + Section Count Pill */}
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center shadow-md shrink-0`}>
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                      {grade.nombre} <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 font-normal">({grade.nivel === 'inicial' ? 'Inicial' : grade.nivel === 'primaria' ? 'Primaria' : 'Secundaria'})</span>
                    </h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${pillBg}`}>
                      {gradeSections.length} {gradeSections.length === 1 ? 'sección' : 'secciones'}
                    </span>
                  </div>
                </div>

                {/* Right: resumen, detalle del nivel y botón para desplegar */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0 justify-between sm:justify-end">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>{totalGradeStudents} alumnos · {gradeEvaluated} con notas</span>
                  </div>
                  <div className="hidden md:flex items-center gap-1">
                    {statusCount.evaluado > 0 && <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">{statusCount.evaluado} evaluadas</span>}
                    {statusCount.en_progreso > 0 && <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">{statusCount.en_progreso} en progreso</span>}
                    {statusCount.sin_notas > 0 && <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{statusCount.sin_notas} sin notas</span>}
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedGradeForDetail(grade); }}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold text-xs border border-indigo-200/80 dark:border-indigo-900/60 shadow-xs transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                  >
                    <span>Detalle del grado</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black ${isOpen ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'}`}>
                    {isOpen ? 'Ocultar secciones' : `Ver secciones (${gradeSections.length})`}
                    <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </span>
                </div>

              </div>

              {/* ── 4. TARJETAS DE SECCIONES (solo con el grado desplegado) ── */}
              {isOpen && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                {gradeSections
                  .sort((a, b) => a.letra.localeCompare(b.letra))
                  .map(section => {
                    const data = getSectionData(section.id);
                    const isMenuOpen = activeMenuSectionId === section.id;

                    // Section Card Letter Palette (matching design reference)
                    let cardSquircleColor = sectionSquircle;
                    if (section.letra === 'B') {
                      cardSquircleColor = isGrade3Años ? 'bg-[#e11d48]' : isGrade4Años ? 'bg-[#2563eb]' : 'bg-[#16a34a]';
                    }

                    return (
                      <div
                        key={section.id}
                        className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-5.5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
                      >
                        {/* ── Card Top: Section Letter, Name, Info, Status & Quick View Eye ── */}
                        <div className="flex items-start justify-between gap-3">

                          {/* Left: Letter & Meta */}
                          <div className="flex items-center gap-3.5">
                            <div className={`w-11 h-11 rounded-xl ${cardSquircleColor} text-white font-black text-xl flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform`}>
                              {section.letra}
                            </div>
                            <div>
                              <h3 className="font-black text-base text-slate-900 dark:text-white leading-tight">
                                Sección {section.letra}
                              </h3>
                              <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                <span className="flex items-center gap-1">
                                  <Users className="w-3.5 h-3.5 text-slate-400" />
                                  {data.totalStudents} alumnos
                                </span>
                                <span className="text-slate-300 dark:text-slate-700">|</span>
                                <span className="flex items-center gap-1">
                                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                                  Cap. {section.capacidad_maxima}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Status Badge & Eye Quick View Button */}
                          <div className="flex items-center gap-2 shrink-0">

                            {/* Status Badge */}
                            {data.status === 'sin_notas' ? (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/70 dark:border-slate-700">
                                Sin notas
                              </span>
                            ) : data.status === 'en_progreso' ? (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                                En progreso
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                                Evaluado
                              </span>
                            )}

                            {/* Eye Quick View Button */}
                            <button
                              type="button"
                              onClick={() => setSelectedQuickViewSection(section)}
                              className="w-8 h-8 rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center transition-colors cursor-pointer"
                              title="Vista rápida del salón"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                          </div>

                        </div>

                        {/* ── 5. Card Middle: Distribución de Logros (AD, A, B, C) ── */}
                        <div className="my-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80">

                          {/* Header of Logros */}
                          <div className="flex items-center justify-between text-xs font-bold mb-2.5">
                            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                              <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                              Distribución de Logros
                            </span>
                            <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-[11px]">
                              {data.evaluatedStudents} de {data.totalStudents} evaluados
                            </span>
                          </div>

                          {/* 4 Micro Bars for AD, A, B, C */}
                          <div className="grid grid-cols-4 gap-2 sm:gap-3">

                            {/* AD */}
                            <div className="space-y-1">
                              <div className="flex items-center text-[11px] font-bold text-slate-700 dark:text-slate-300 gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                <span>AD</span>
                                <span className="text-[10px] text-slate-400 font-normal font-mono ml-auto">
                                  {data.distrib.AD} ({data.totalStudents > 0 ? Math.round((data.distrib.AD / data.totalStudents) * 100) : 0}%)
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                  style={{ width: `${data.totalStudents > 0 ? (data.distrib.AD / data.totalStudents) * 100 : 0}%` }}
                                />
                              </div>
                            </div>

                            {/* A */}
                            <div className="space-y-1">
                              <div className="flex items-center text-[11px] font-bold text-slate-700 dark:text-slate-300 gap-1">
                                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                                <span>A</span>
                                <span className="text-[10px] text-slate-400 font-normal font-mono ml-auto">
                                  {data.distrib.A} ({data.totalStudents > 0 ? Math.round((data.distrib.A / data.totalStudents) * 100) : 0}%)
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                                  style={{ width: `${data.totalStudents > 0 ? (data.distrib.A / data.totalStudents) * 100 : 0}%` }}
                                />
                              </div>
                            </div>

                            {/* B */}
                            <div className="space-y-1">
                              <div className="flex items-center text-[11px] font-bold text-slate-700 dark:text-slate-300 gap-1">
                                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                <span>B</span>
                                <span className="text-[10px] text-slate-400 font-normal font-mono ml-auto">
                                  {data.distrib.B} ({data.totalStudents > 0 ? Math.round((data.distrib.B / data.totalStudents) * 100) : 0}%)
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-amber-500 transition-all duration-500"
                                  style={{ width: `${data.totalStudents > 0 ? (data.distrib.B / data.totalStudents) * 100 : 0}%` }}
                                />
                              </div>
                            </div>

                            {/* C */}
                            <div className="space-y-1">
                              <div className="flex items-center text-[11px] font-bold text-slate-700 dark:text-slate-300 gap-1">
                                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                                <span>C</span>
                                <span className="text-[10px] text-slate-400 font-normal font-mono ml-auto">
                                  {data.distrib.C} ({data.totalStudents > 0 ? Math.round((data.distrib.C / data.totalStudents) * 100) : 0}%)
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-rose-500 transition-all duration-500"
                                  style={{ width: `${data.totalStudents > 0 ? (data.distrib.C / data.totalStudents) * 100 : 0}%` }}
                                />
                              </div>
                            </div>

                          </div>

                        </div>

                        {/* ── 6. Card Bottom: Acciones de la Sección ── */}
                        <div className="pt-2 flex items-center justify-between gap-3">

                          {/* Primary Action Button: Ver Consolidado Completo */}
                          <button
                            type="button"
                            onClick={() => setSelectedSectionForModal(section)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#f5f3ff] hover:bg-[#ede9fe] dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200/60 dark:border-indigo-800/60 transition-all active:scale-98 cursor-pointer"
                          >
                            <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <span>Ver Consolidado Completo</span>
                          </button>

                          {/* Dropdown: Más opciones */}
                          <div className="relative section-menu-container">
                            <button
                              type="button"
                              onClick={() => setActiveMenuSectionId(isMenuOpen ? null : section.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 transition-colors cursor-pointer"
                            >
                              <span>Más opciones</span>
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            </button>

                            {/* Dropdown Menu */}
                            {isMenuOpen && (
                              <div className="absolute right-0 bottom-full mb-2 w-48 p-1.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl z-20 animate-in fade-in zoom-in-95 duration-150">
                                <button
                                  onClick={() => {
                                    setSelectedQuickViewSection(section);
                                    setActiveMenuSectionId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-left transition-colors cursor-pointer"
                                >
                                  <Users className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Ver estudiantes</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedSectionForModal(section);
                                    setActiveMenuSectionId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-left transition-colors cursor-pointer"
                                >
                                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Exportar consolidado</span>
                                </button>

                                <button
                                  onClick={() => {
                                    window.print();
                                    setActiveMenuSectionId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-left transition-colors cursor-pointer"
                                >
                                  <Printer className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Imprimir</span>
                                </button>

                                <Link
                                  href={`/admin/secciones/${section.id}`}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-left transition-colors cursor-pointer"
                                >
                                  <Award className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Ver acta oficial</span>
                                </Link>

                                <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />

                                <Link
                                  href={`/admin/academico`}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-left transition-colors cursor-pointer"
                                >
                                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Configuración evaluación</span>
                                </Link>
                              </div>
                            )}

                          </div>

                        </div>

                      </div>
                    );
                  })}
              </div>
              )}

            </div>
          );
        })}

        {/* ── Empty State ── */}
        {sortedGrades.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-slate-700 dark:text-slate-200 font-black text-base">
              No se encontraron secciones para los filtros seleccionados
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Intenta restablecer el nivel, limpiar la búsqueda o cambiar el estado de evaluación en el menú de filtros.
            </p>
            <button
              onClick={() => {
                setFilterNivel('todos');
                setFilterStatus('todos');
                setSearch('');
                setFilterCurso('todos');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              Restablecer todos los filtros
            </button>
          </div>
        )}

      </div>

      {/* ── MODAL: DETALLE DEL NIVEL / GRADO COMPLETO ── */}
      <Modal
        isOpen={!!selectedGradeForDetail}
        onClose={() => setSelectedGradeForDetail(null)}
        title={`Detalle Académico del Grado: ${selectedGradeForDetail?.nombre || ''}`}
        maxWidth="2xl"
      >
        {selectedGradeForDetail && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Nivel Educativo
                </span>
                <p className="text-sm font-black text-slate-900 dark:text-white capitalize">
                  {selectedGradeForDetail.nivel}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Año Académico
                </span>
                <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                  {selectedYear}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Secciones en este Grado
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(sectionsByGrade[selectedGradeForDetail.id] || []).map(sec => {
                  const secData = getSectionData(sec.id);
                  return (
                    <div key={sec.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center">
                          {sec.letra}
                        </span>
                        <div>
                          <p className="font-bold text-xs text-slate-900 dark:text-white">Sección {sec.letra}</p>
                          <p className="text-[10px] text-slate-400">{secData.totalStudents} alumnos · Cap. {sec.capacidad_maxima}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedGradeForDetail(null);
                          setSelectedSectionForModal(sec);
                        }}
                        className="text-xs font-bold text-indigo-600 hover:underline"
                      >
                        Abrir
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedGradeForDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL: VISTA RÁPIDA DE SECCIÓN (Eye Icon) ── */}
      <Modal
        isOpen={!!selectedQuickViewSection}
        onClose={() => setSelectedQuickViewSection(null)}
        title={`Vista Rápida: ${selectedQuickViewSection?.grado?.nombre || ''} - Sección "${selectedQuickViewSection?.letra || ''}"`}
        maxWidth="2xl"
      >
        {selectedQuickViewSection && quickViewData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
              <div>
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                  Estudiantes Matriculados: {quickViewData.totalStudents}
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Evaluados: {quickViewData.evaluatedStudents} de {quickViewData.totalStudents}
                </p>
              </div>
              <button
                onClick={() => {
                  const sec = selectedQuickViewSection;
                  setSelectedQuickViewSection(null);
                  setSelectedSectionForModal(sec);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-sm hover:bg-indigo-700 transition-colors"
              >
                Ver Expediente Completo
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl">
              {quickViewData.students.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs font-semibold">
                  Sin alumnos matriculados en esta sección.
                </div>
              ) : (
                quickViewData.students.map((s, idx) => (
                  <div key={s.enr.id} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-slate-400 text-[10px] w-5">{idx + 1}</span>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white">
                          {s.student?.profile?.apellidos}, {s.student?.profile?.nombres}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">{s.student?.codigo_estudiante}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.avgLetter ? <GradeBadge grade={s.avgLetter} size="sm" /> : <span className="text-slate-400 font-mono text-[10px]">Sin notas</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL: CONSOLIDADO COMPLETO DEL SALÓN (Full Official Sheet) ── */}
      <Modal
        isOpen={!!selectedSectionForModal}
        onClose={() => setSelectedSectionForModal(null)}
        title={`Consolidado Académico Oficial — ${selectedSectionForModal?.grado?.nombre || ''} Sección "${selectedSectionForModal?.letra || ''}"`}
        maxWidth="5xl"
      >
        {selectedSectionForModal && modalSectionData && (
          <div className="space-y-6">

            {/* Header Card inside Modal */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white shadow-xl">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-2xl text-white shadow-lg shrink-0">
                  {selectedSectionForModal.letra}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-white/15 text-purple-200">
                      Nivel {selectedSectionForModal.grado?.nivel}
                    </span>
                    <span className="text-xs text-purple-200 font-mono">Año {selectedYear}</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white mt-0.5">
                    {selectedSectionForModal.grado?.nombre} — Sección {selectedSectionForModal.letra}
                  </h3>
                  <p className="text-xs text-purple-200/80 mt-0.5">
                    Capacidad: {modalSectionData.totalStudents} / {selectedSectionForModal.capacidad_maxima} alumnos matriculados
                  </p>
                </div>
              </div>

              {/* Section Average Badge */}
              <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/15 self-start sm:self-auto">
                <div className="text-right">
                  <span className="text-[10px] font-bold text-purple-200 uppercase tracking-wider block">Promedio del Salón</span>
                  <span className="text-base font-black text-white">{modalSectionData.sectionAvg.toFixed(2)} / 4.0</span>
                </div>
                {modalSectionData.sectionAvg > 0 && (
                  <GradeBadge grade={numToGrade(modalSectionData.sectionAvg)} size="lg" />
                )}
              </div>
            </div>

            {/* Quick KPIs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                  Logro Destacado (AD)
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                    {modalSectionData.distrib.AD}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600">
                    ({modalSectionData.totalStudents > 0 ? Math.round((modalSectionData.distrib.AD / modalSectionData.totalStudents) * 100) : 0}%)
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-400 block">
                  Logro Esperado (A)
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-blue-700 dark:text-blue-300">
                    {modalSectionData.distrib.A}
                  </span>
                  <span className="text-xs font-semibold text-blue-600">
                    ({modalSectionData.totalStudents > 0 ? Math.round((modalSectionData.distrib.A / modalSectionData.totalStudents) * 100) : 0}%)
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                  En Proceso (B)
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-amber-700 dark:text-amber-300">
                    {modalSectionData.distrib.B}
                  </span>
                  <span className="text-xs font-semibold text-amber-600">
                    ({modalSectionData.totalStudents > 0 ? Math.round((modalSectionData.distrib.B / modalSectionData.totalStudents) * 100) : 0}%)
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-400 block">
                  En Inicio / Riesgo (C)
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-rose-700 dark:text-rose-300">
                    {modalSectionData.distrib.C}
                  </span>
                  <span className="text-xs font-semibold text-rose-600">
                    ({modalSectionData.totalStudents > 0 ? Math.round((modalSectionData.distrib.C / modalSectionData.totalStudents) * 100) : 0}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Complete Table of Students in the Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Padrón de Estudiantes y Notas por Área Curricular
                </h4>
                <span className="text-xs text-slate-400 font-semibold">
                  {modalSectionData.students.length} estudiantes registrados
                </span>
              </div>

              {modalSectionData.students.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-slate-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-bold">No hay estudiantes matriculados en este salón</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 scrollbar-thin">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 font-black uppercase text-[10px] text-slate-600 dark:text-slate-300">
                        <th className="py-3 px-3.5 w-10 text-center">#</th>
                        <th className="py-3 px-4 min-w-[180px]">Estudiante</th>
                        <th className="py-3 px-3 text-center">DNI</th>
                        {courses.map(c => (
                          <th key={c.id} className="py-3 px-2 text-center min-w-[80px]">
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color_hex || '#6366f1' }} />
                              <span className="truncate max-w-[70px]">{c.nombre.split(' ')[0]}</span>
                            </div>
                          </th>
                        ))}
                        <th className="py-3 px-3 text-center min-w-[90px] bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300">
                          Promedio
                        </th>
                        <th className="py-3 px-3 text-center min-w-[100px]">Condición</th>
                        <th className="py-3 px-3 text-center">Libreta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {modalSectionData.students.map((s, idx) => {
                        const isApproved = s.avgLetter === 'AD' || s.avgLetter === 'A';
                        const isAtRisk = s.avgLetter === 'C';

                        return (
                          <tr key={s.enr.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={s.student?.profile?.avatar_url || initialsAvatarUrl(s.student?.profile?.nombres || 'Alumno')}
                                  alt=""
                                  className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                                />
                                <div>
                                  <p className="font-extrabold text-slate-900 dark:text-white leading-tight">
                                    {s.student?.profile?.apellidos}, {s.student?.profile?.nombres}
                                  </p>
                                  <p className="text-[10px] font-mono text-slate-400">
                                    {s.student?.codigo_estudiante}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center font-mono font-semibold text-slate-600 dark:text-slate-300">
                              {s.student?.profile?.dni || '—'}
                            </td>
                            {courses.map(c => (
                              <td key={c.id} className="py-3 px-2 text-center">
                                {s.courseAvgs[c.id] ? (
                                  <GradeBadge grade={s.courseAvgs[c.id]!} size="sm" />
                                ) : (
                                  <span className="text-slate-300 dark:text-slate-600 font-mono">—</span>
                                )}
                              </td>
                            ))}
                            <td className="py-3 px-3 text-center bg-indigo-50/40 dark:bg-indigo-950/20 font-bold">
                              {s.avgLetter ? (
                                <div className="flex flex-col items-center gap-0.5">
                                  <GradeBadge grade={s.avgLetter} size="sm" />
                                  <span className="text-[9px] font-mono text-slate-400">{s.avg.toFixed(1)}</span>
                                </div>
                              ) : (
                                <span className="text-slate-400 font-mono">—</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {s.avgLetter ? (
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  isApproved
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                    : isAtRisk
                                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                                }`}>
                                  {isApproved ? 'Aprobado' : isAtRisk ? 'En Riesgo' : 'En Proceso'}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400">Sin evaluar</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => s.student && handleOpenStudentReport(s.student, selectedSectionForModal)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 font-bold text-[11px] transition-colors cursor-pointer"
                                title="Ver Libreta Oficial del Alumno"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Libreta</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Link
                href={`/admin/secciones/${selectedSectionForModal.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
              >
                <School className="w-3.5 h-3.5 text-indigo-500" />
                <span>Ir al Panel del Salón</span>
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Acta</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSectionForModal(null)}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>

          </div>
        )}
      </Modal>

      {/* ── MODAL INDIVIDUAL: LIBRETA DE NOTAS OFICIAL (SIAGIE) ── */}
      <AnnualReportCardModal
        isOpen={isReportCardModalOpen}
        onClose={() => setIsReportCardModalOpen(false)}
        reportCard={selectedReportCard}
      />

    </div>
  );
}

