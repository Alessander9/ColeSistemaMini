'use client';

import React, { useState, useMemo } from 'react';
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
  FileText
} from 'lucide-react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

// Grade letter to number mapping
const gradeToNum: Record<GradeLetter, number> = { AD: 4, A: 3, B: 2, C: 1 };
const numToGrade = (n: number): GradeLetter => {
  if (n >= 3.5) return 'AD';
  if (n >= 2.5) return 'A';
  if (n >= 1.5) return 'B';
  return 'C';
};

type FilterNivel = 'todos' | 'inicial' | 'primaria' | 'secundaria';

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
    attendances
  } = useApp();

  const [filterNivel, setFilterNivel] = useState<FilterNivel>('todos');
  const [filterCurso, setFilterCurso] = useState<string>('todos');
  const [search, setSearch] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Modal State for Selected Section
  const [selectedSectionForModal, setSelectedSectionForModal] = useState<Section | null>(null);
  
  // Modal State for Individual Student Annual Report Card
  const [selectedReportCard, setSelectedReportCard] = useState<StudentAnnualReportCard | null>(null);
  const [isReportCardModalOpen, setIsReportCardModalOpen] = useState(false);

  // Group sections by grade
  const sectionsByGrade = useMemo(() => {
    const filtered = sections.filter(s => {
      if (filterNivel === 'todos') return true;
      return s.grado?.nivel === filterNivel;
    });
    
    const byGrade: Record<string, typeof sections> = {};
    filtered.forEach(sec => {
      const key = sec.grado_id;
      if (!byGrade[key]) byGrade[key] = [];
      byGrade[key].push(sec);
    });
    return byGrade;
  }, [sections, filterNivel]);

  // Sorted grade levels
  const sortedGrades = useMemo(() => {
    const seen = new Set<string>();
    const result: { id: string; nombre: string; nivel: string; numero: number }[] = [];
    sections.forEach(s => {
      if (!s.grado || seen.has(s.grado_id)) return;
      if (filterNivel !== 'todos' && s.grado.nivel !== filterNivel) return;
      seen.add(s.grado_id);
      result.push({ id: s.grado_id, nombre: s.grado.nombre, nivel: s.grado.nivel, numero: s.grado.numero_grado });
    });
    return result.sort((a, b) => {
      const levelOrder: Record<string, number> = { inicial: 1, primaria: 2, secundaria: 3 };
      const orderA = levelOrder[a.nivel] || 2;
      const orderB = levelOrder[b.nivel] || 2;
      if (orderA !== orderB) return orderA - orderB;
      return a.numero - b.numero;
    });
  }, [sections, filterNivel]);

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

    return { 
      students: studentsData, 
      sectionAvg, 
      distrib, 
      totalStudents: sectionEnrollments.length,
      evaluatedStudents: withGrades.length 
    };
  };

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

  const gradeColors: Record<string, string> = {
    AD: 'from-emerald-500 to-teal-600',
    A: 'from-blue-500 to-indigo-600',
    B: 'from-amber-500 to-orange-500',
    C: 'from-rose-500 to-pink-600',
  };

  const statusColors: Record<string, string> = {
    AD: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    A: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    B: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    C: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',
  };

  const nivelBadgeColors: Record<string, string> = {
    inicial: 'bg-pink-100 dark:bg-pink-950/50 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800',
    primaria: 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    secundaria: 'bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  };

  // Open Annual Report Card Modal for single student
  const handleOpenStudentReport = (student: Student, section?: Section) => {
    const enr = enrollments.find(e => e.estudiante_id === student.id);
    if (!enr) return;
    const targetSection = section || enr.seccion || sections[0];
    const card = calculateStudentAnnualReportCard({
      enrollmentId: enr.id,
      studentId: student.id,
      studentName: `${student.profile?.apellidos || ''}, ${student.profile?.nombres || ''}`,
      studentDni: student.profile?.dni || '',
      studentCode: student.codigo_estudiante || '',
      gradeLevelName: targetSection?.grado?.nombre || '3° de Primaria',
      sectionLetter: targetSection?.letra || 'A',
      academicYear: 2026,
      courses,
      grades: gradeRecords,
      evaluationPeriodIds: [
        { id: 'eval-bim-1', numero_periodo: 1 },
        { id: 'eval-bim-2', numero_periodo: 2 },
        { id: 'eval-bim-3', numero_periodo: 3 },
        { id: 'eval-bim-4', numero_periodo: 4 },
      ],
    });
    setSelectedReportCard(card);
    setIsReportCardModalOpen(true);
  };

  // Modal Section Data
  const modalSectionData = selectedSectionForModal 
    ? getSectionData(selectedSectionForModal.id) 
    : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      
      {/* ── 1. Hero Header Banner con KPIs Macro ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 text-white p-6 sm:p-8 shadow-2xl border border-purple-500/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500/10 rounded-full blur-2xl pointer-events-none -translate-x-1/3 translate-y-1/3" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30 flex items-center gap-1.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Evaluación CNEB (RVM 094-2020-MINEDU)
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                II Bimestre 2026 • Activo
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              Consolidado de Calificaciones
            </h1>
            <p className="text-purple-200/80 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
              Monitorea el rendimiento académico por salón y competencias oficiales (AD – A – B – C). Haz clic sobre cualquier salón para abrir el expediente completo.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all active:scale-95 shadow-sm"
            >
              <Printer className="w-4 h-4 text-purple-300" />
              <span>Imprimir Malla</span>
            </button>
            <Link
              href="/admin/reportes"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all active:scale-95"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Reportes & Actas</span>
            </Link>
          </div>
        </div>

        {/* Macro KPIs Grid */}
        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <span className="text-[11px] font-bold text-purple-200 uppercase tracking-wider block">Total Aulas / Salones</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-white">{globalMetrics.totalSections}</span>
              <span className="text-xs text-purple-300 font-medium">secciones</span>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <span className="text-[11px] font-bold text-purple-200 uppercase tracking-wider block">Alumnos Evaluados</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400">{globalMetrics.evaluatedCount}</span>
              <span className="text-xs text-purple-300 font-medium">/ {globalMetrics.totalStudents} total</span>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <span className="text-[11px] font-bold text-purple-200 uppercase tracking-wider block">Promedio Institucional</span>
            <div className="flex items-center gap-2 mt-1">
              <GradeBadge grade={globalMetrics.averageLetter} size="md" />
              <span className="text-xs text-purple-200 font-bold">({globalMetrics.average.toFixed(2)}/4.0)</span>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <span className="text-[11px] font-bold text-purple-200 uppercase tracking-wider block">Tasa de Aprobación</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-blue-400">{globalMetrics.approvalRate}%</span>
              <span className="text-xs text-emerald-300 font-semibold">(AD + A)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Barra de Filtros & Búsqueda ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por alumno, DNI o código..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 text-xs font-semibold rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
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

        {/* Level pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
          {[
            { id: 'todos', label: 'Todos los Niveles' },
            { id: 'inicial', label: '🧸 Inicial' },
            { id: 'primaria', label: '📚 Primaria' },
            { id: 'secundaria', label: '🎓 Secundaria' },
          ].map(n => (
            <button
              key={n.id}
              onClick={() => setFilterNivel(n.id as FilterNivel)}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                filterNivel === n.id
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>

        {/* Course filter */}
        <div className="shrink-0 min-w-[200px]">
          <SearchableSelect
            value={filterCurso}
            onChange={(val) => setFilterCurso(val)}
            icon={<BookOpen className="w-3.5 h-3.5" />}
            options={[
              { value: 'todos', label: 'Todos los cursos', sublabel: 'Malla completa' },
              ...courses.map(c => ({
                value: c.id,
                label: c.nombre,
                sublabel: `Código: ${c.codigo}`,
              })),
            ]}
            placeholder="Filtrar por curso..."
          />
        </div>
      </div>

      {/* ── 3. Malla de Grados y Secciones con Tarjetas Interactivas ── */}
      <div className="space-y-8">
        {sortedGrades.map(grade => {
          const gradeSections = sectionsByGrade[grade.id] || [];
          const currentNivelColor = nivelBadgeColors[grade.nivel] || nivelBadgeColors.primaria;

          return (
            <div key={grade.id} className="space-y-4">
              
              {/* Grade Section Title */}
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black border shadow-xs ${currentNivelColor}`}>
                  <GraduationCap className="w-4 h-4" />
                  <span>{grade.nombre}</span>
                </div>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {gradeSections.length} {gradeSections.length === 1 ? 'sección oficial' : 'secciones oficiales'}
                </span>
              </div>

              {/* Sections Grid */}
              <div className={`grid gap-4 sm:gap-5 ${gradeSections.length > 1 ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
                {gradeSections
                  .sort((a, b) => a.letra.localeCompare(b.letra))
                  .map(section => {
                    const isExpanded = expandedSection === section.id;
                    const data = getSectionData(section.id);
                    const avgLetter = data.sectionAvg > 0 ? numToGrade(data.sectionAvg) : null;
                    const tutor = section.tutor_id ? teachers.find(t => t.id === section.tutor_id) : undefined;

                    return (
                      <div
                        key={section.id}
                        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                      >
                        {/* Section Header Card (Clickable to open Modal or Expand) */}
                        <div className="p-5 sm:p-6 select-none flex-1 flex flex-col justify-between">
                          
                          {/* Top Row */}
                          <div className="flex items-start justify-between gap-4">
                            
                            {/* Left Badge & Names */}
                            <div 
                              onClick={() => setSelectedSectionForModal(section)}
                              className="flex items-center gap-3.5 cursor-pointer group-hover:opacity-95 transition-opacity"
                            >
                              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${grade.nivel === 'primaria' ? 'from-blue-600 to-indigo-600' : grade.nivel === 'secundaria' ? 'from-purple-600 to-violet-600' : 'from-pink-500 to-rose-600'} flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0 text-white font-black text-xl group-hover:scale-105 transition-transform`}>
                                {section.letra}
                              </div>
                              <div>
                                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-tight group-hover:text-purple-600 transition-colors">
                                  {grade.nombre} — Sección {section.letra}
                                </h3>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                    <Users className="w-3.5 h-3.5 text-slate-400" />
                                    {data.totalStudents} alumnos
                                  </span>
                                  <span className="text-slate-300 dark:text-slate-700">·</span>
                                  <span className="text-[11px] text-slate-400 font-medium">
                                    Cap. {section.capacidad_maxima}
                                  </span>
                                  {tutor && (
                                    <>
                                      <span className="text-slate-300 dark:text-slate-700">·</span>
                                      <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold truncate max-w-[130px]">
                                        Tutor: {tutor.nombres.split(' ')[0]} {tutor.apellidos.split(' ')[0]}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right Average & Modal Trigger */}
                            <div className="flex items-center gap-2.5 shrink-0">
                              {avgLetter ? (
                                <div className="flex flex-col items-end">
                                  <GradeBadge grade={avgLetter} size="md" />
                                  <span className="text-[10px] font-mono text-slate-400 font-bold mt-0.5">
                                    {data.sectionAvg.toFixed(1)}/4.0
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs font-bold text-slate-400 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                                  Sin notas
                                </span>
                              )}

                              {/* Button to open Modal directly */}
                              <button
                                type="button"
                                onClick={() => setSelectedSectionForModal(section)}
                                className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/60 text-purple-600 dark:text-purple-400 transition-colors shadow-xs"
                                title="Abrir Expediente y Consolidado Completo del Salón"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>

                          </div>

                          {/* Progress bar of AD / A / B / C */}
                          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1.5">
                              <span>Distribución de Logros:</span>
                              <span className="text-purple-600 dark:text-purple-400">{data.evaluatedStudents} de {data.totalStudents} evaluados</span>
                            </div>
                            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                              {(['AD','A','B','C'] as GradeLetter[]).map(l => {
                                const count = data.distrib[l] || 0;
                                const pct = data.totalStudents > 0 ? Math.round((count / data.totalStudents) * 100) : 0;
                                return (
                                  <div key={l} className="space-y-1">
                                    <div className="flex items-center justify-between text-[10px]">
                                      <span className="font-extrabold text-slate-700 dark:text-slate-300">{l} ({count})</span>
                                      <span className="font-mono text-slate-400">{pct}%</span>
                                    </div>
                                    <div className="h-1.5 sm:h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full bg-gradient-to-r ${gradeColors[l]} transition-all duration-700`}
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                        </div>

                        {/* Card Footer Bar with Modal Button and In-page Expand */}
                        <div className="px-5 py-3 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
                          <button
                            type="button"
                            onClick={() => setSelectedSectionForModal(section)}
                            className="inline-flex items-center gap-1.5 font-extrabold text-purple-600 dark:text-purple-400 hover:text-purple-700 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Ver Consolidado Completo</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                          >
                            <span>{isExpanded ? 'Ocultar alumnos' : 'Ver en página'}</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        </div>

                        {/* In-page Expanded Table */}
                        {isExpanded && (
                          <div className="border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-200">
                            {data.students.length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                                <AlertCircle className="w-7 h-7 mb-1.5 text-slate-300" />
                                <p className="text-xs font-bold">Sin alumnos matriculados</p>
                              </div>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="bg-slate-50/90 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                      <th className="text-left px-4 py-2.5">Alumno</th>
                                      {courses.slice(0, 5).map(c => (
                                        <th key={c.id} className="text-center px-2 py-2.5">
                                          {c.nombre.split(' ')[0]}
                                        </th>
                                      ))}
                                      <th className="text-center px-3 py-2.5">Promedio</th>
                                      <th className="text-center px-3 py-2.5">Acción</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {data.students.map((s, idx) => (
                                      <tr key={s.enr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                        <td className="px-4 py-2.5">
                                          <p className="font-bold text-slate-800 dark:text-white truncate max-w-[160px]">
                                            {s.student?.profile?.apellidos?.split(' ')[0]}, {s.student?.profile?.nombres?.split(' ')[0]}
                                          </p>
                                          <p className="text-[10px] text-slate-400 font-mono">{s.student?.codigo_estudiante}</p>
                                        </td>
                                        {courses.slice(0, 5).map(c => (
                                          <td key={c.id} className="px-2 py-2.5 text-center">
                                            {s.courseAvgs[c.id] ? (
                                              <GradeBadge grade={s.courseAvgs[c.id]!} size="sm" />
                                            ) : (
                                              <span className="text-slate-300">—</span>
                                            )}
                                          </td>
                                        ))}
                                        <td className="px-3 py-2.5 text-center">
                                          {s.avgLetter ? <GradeBadge grade={s.avgLetter} size="sm" /> : '—'}
                                        </td>
                                        <td className="px-3 py-2.5 text-center">
                                          <button
                                            type="button"
                                            onClick={() => s.student && handleOpenStudentReport(s.student, section)}
                                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-purple-600"
                                            title="Ver Libreta del Alumno"
                                          >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}

                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })}

        {sortedGrades.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-600 dark:text-slate-300 font-bold text-sm">No se encontraron salones para los filtros seleccionados</p>
            <p className="text-xs text-slate-400 mt-1">Intenta restablecer el nivel o el término de búsqueda.</p>
          </div>
        )}
      </div>

      {/* ── 4. MODAL DETALLADO DE CONSOLIDADO DEL SALÓN (Pop-up Completo) ── */}
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
                    <span className="text-xs text-purple-200 font-mono">Año 2026</span>
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
                  <Users className="w-4 h-4 text-purple-600" />
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
                        <th className="py-3 px-3 text-center min-w-[90px] bg-purple-50/60 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300">
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
                                  src={s.student?.profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.student?.profile?.nombres || 'Alumno')}`}
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
                            <td className="py-3 px-3 text-center bg-purple-50/40 dark:bg-purple-950/20 font-bold">
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
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 font-bold text-[11px] transition-colors"
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
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Acta</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSectionForModal(null)}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-md shadow-purple-500/20 transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>

          </div>
        )}
      </Modal>

      {/* ── 5. MODAL INDIVIDUAL: LIBRETA DE NOTAS OFICIAL (SIAGIE) ── */}
      <AnnualReportCardModal
        isOpen={isReportCardModalOpen}
        onClose={() => setIsReportCardModalOpen(false)}
        reportCard={selectedReportCard}
      />

    </div>
  );
}
