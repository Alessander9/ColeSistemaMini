'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Modal } from '@/components/ui/Modal';
import { EvaluationExam, GradeLetter, Course, Section } from '@/types';
import {
  Plus,
  BookOpen,
  Clock,
  Calendar,
  CheckCircle2,
  Award,
  FileText,
  Search,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Eye,
  Copy,
  Trash2,
  AlertCircle,
  X,
  Calculator,
  FlaskConical,
  Layers,
  Activity,
  Users,
  Palette,
  Laptop,
  CalendarClock,
  GraduationCap,
  TrendingUp,
  List,
  LayoutGrid,
  Timer,
  School,
  Check,
  ShieldCheck,
  BarChart3
} from 'lucide-react';
import confetti from 'canvas-confetti';

type ExamType = 'examen' | 'practica' | 'bimestral' | 'proyecto' | 'actividad';
const TYPE_STYLE: Record<ExamType, { label: string; icon: React.ElementType; strip: string; chip: string; soft: string; text: string; tile: string; ring: string; row: string; card: string }> = {
  bimestral: { label: 'Bimestral', icon: Award, strip: 'from-purple-500 to-fuchsia-500', chip: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300', soft: 'bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-900/60', text: 'text-purple-600 dark:text-purple-400', tile: 'bg-purple-600', ring: 'ring-purple-500', row: 'border-l-purple-500', card: 'from-purple-50 border-purple-200 dark:from-purple-950/40 dark:border-purple-900/60' },
  examen: { label: 'Mensual', icon: CalendarClock, strip: 'from-indigo-500 to-blue-500', chip: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300', soft: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-900/60', text: 'text-indigo-600 dark:text-indigo-400', tile: 'bg-indigo-600', ring: 'ring-indigo-500', row: 'border-l-indigo-500', card: 'from-indigo-50 border-indigo-200 dark:from-indigo-950/40 dark:border-indigo-900/60' },
  practica: { label: 'Práctica', icon: FileText, strip: 'from-sky-400 to-cyan-500', chip: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300', soft: 'bg-sky-50 border-sky-200 dark:bg-sky-950/30 dark:border-sky-900/60', text: 'text-sky-600 dark:text-sky-400', tile: 'bg-sky-500', ring: 'ring-sky-500', row: 'border-l-sky-500', card: 'from-sky-50 border-sky-200 dark:from-sky-950/40 dark:border-sky-900/60' },
  proyecto: { label: 'Proyecto', icon: Layers, strip: 'from-emerald-500 to-teal-500', chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300', soft: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/60', text: 'text-emerald-600 dark:text-emerald-400', tile: 'bg-emerald-600', ring: 'ring-emerald-500', row: 'border-l-emerald-500', card: 'from-emerald-50 border-emerald-200 dark:from-emerald-950/40 dark:border-emerald-900/60' },
  actividad: { label: 'Actividad', icon: Activity, strip: 'from-amber-400 to-orange-500', chip: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300', soft: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/60', text: 'text-amber-600 dark:text-amber-400', tile: 'bg-amber-500', ring: 'ring-amber-500', row: 'border-l-amber-500', card: 'from-amber-50 border-amber-200 dark:from-amber-950/40 dark:border-amber-900/60' },
};
const typeStyle = (t?: string) => TYPE_STYLE[t as ExamType] || TYPE_STYLE.examen;
const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const examStatus = (e: EvaluationExam) => {
  if (e.estado === 'borrador') return { label: 'Borrador', cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300', dot: 'bg-slate-400' };
  const today = localToday();
  if (e.fecha_programada === today) return { label: 'Es hoy', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300', dot: 'bg-amber-500' };
  if (e.fecha_programada < today) return { label: 'Realizada', cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300', dot: 'bg-slate-400' };
  return { label: 'Programada', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300', dot: 'bg-emerald-500' };
};
const dateParts = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return {
    day: d || '—',
    month: dt.toLocaleDateString('es-PE', { month: 'short' }).replace('.', ''),
    weekday: dt.toLocaleDateString('es-PE', { weekday: 'short' }).replace('.', ''),
  };
};

export default function AdminEvaluacionesPage() {
  const {
    exams,
    addExam,
    courses,
    sections,
    enrollments,
    evaluationPeriods,
    teachers,
    gradeLevels,
    showToast
  } = useApp();

  // Curso de la evaluación (algunas no traen el curso incrustado)
  const courseOf = (e: EvaluationExam) => e.curso || courses.find(c => c.id === e.curso_id);

  // Dual View Mode: Grid (Active by default) & List
  const [viewMode, setViewMode] = useState<'grid' | 'lista'>('grid');
  const [localExamsList, setLocalExamsList] = useState<EvaluationExam[]>(exams);

  // Sync with context
  React.useEffect(() => {
    setLocalExamsList(exams);
  }, [exams]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState('todos');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('todos');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState('todos');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('todos');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('todos');
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState('todos');
  const [sortBy, setSortBy] = useState<'fecha_proxima' | 'fecha_lejana' | 'recientes' | 'curso' | 'tipo'>('fecha_proxima');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === 'grid' ? 6 : 10;

  // Active Modals & Drawer states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<EvaluationExam | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Form state for creating evaluation
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'examen' as 'examen' | 'practica' | 'bimestral' | 'proyecto' | 'actividad',
    descripcion: '',
    cursoId: courses[0]?.id || '',
    seccionId: sections[0]?.id || '',
    periodoEvaluacionId: evaluationPeriods[0]?.id || '',
    competenciaId: 'comp-mat-1',
    fechaProgramada: '2026-09-25',
    horaInicio: '08:00',
    duracionMinutos: 60,
    ponderacion: 1.0,
    instrucciones: '',
    estado: 'programada' as 'programada' | 'borrador',
  });

  // Filter sections by level/grade
  const availableGrades = useMemo(() => {
    if (selectedLevelFilter === 'todos') return gradeLevels;
    return gradeLevels.filter(g => g.nivel === selectedLevelFilter);
  }, [gradeLevels, selectedLevelFilter]);

  const availableSections = useMemo(() => {
    if (selectedGradeFilter === 'todos') {
      if (selectedLevelFilter === 'todos') return sections;
      return sections.filter(s => s.grado?.nivel === selectedLevelFilter);
    }
    return sections.filter(s => s.grado_id === selectedGradeFilter);
  }, [sections, selectedLevelFilter, selectedGradeFilter]);

  // KPIs calculations
  const kpis = useMemo(() => {
    const total = localExamsList.length;
    const bimestrales = localExamsList.filter(e => e.tipo === 'bimestral').length;
    const mensuales = localExamsList.filter(e => e.tipo === 'examen').length;
    const practicas = localExamsList.filter(e => e.tipo === 'practica').length;
    const proyectos = localExamsList.filter(e => e.tipo === 'proyecto').length;

    return {
      total,
      bimestrales,
      mensuales,
      practicas,
      proyectos,
    };
  }, [localExamsList]);

  // Filtering & Sorting
  const filteredExams = useMemo(() => {
    let result = [...localExamsList];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(ex =>
        ex.titulo.toLowerCase().includes(q) ||
        (courseOf(ex)?.nombre || '').toLowerCase().includes(q) ||
        (ex.descripcion && ex.descripcion.toLowerCase().includes(q))
      );
    }

    if (selectedLevelFilter !== 'todos') {
      result = result.filter(e => {
        const sec = sections.find(s => s.id === e.seccion_id);
        return sec?.grado?.nivel === selectedLevelFilter;
      });
    }

    if (selectedGradeFilter !== 'todos') {
      result = result.filter(e => {
        const sec = sections.find(s => s.id === e.seccion_id);
        return sec?.grado_id === selectedGradeFilter;
      });
    }

    if (selectedSectionFilter !== 'todos') {
      result = result.filter(e => e.seccion_id === selectedSectionFilter);
    }

    if (selectedTypeFilter !== 'todos') {
      result = result.filter(e => e.tipo === selectedTypeFilter);
    }

    if (selectedCourseFilter !== 'todos') {
      result = result.filter(e => e.curso_id === selectedCourseFilter);
    }

    if (selectedPeriodFilter !== 'todos') {
      result = result.filter(e => e.periodo_evaluacion_id === selectedPeriodFilter);
    }

    result.sort((a, b) => {
      if (sortBy === 'fecha_proxima') return a.fecha_programada.localeCompare(b.fecha_programada);
      if (sortBy === 'fecha_lejana') return b.fecha_programada.localeCompare(a.fecha_programada);
      if (sortBy === 'recientes') return b.id.localeCompare(a.id);
      if (sortBy === 'curso') return (courseOf(a)?.nombre || '').localeCompare(courseOf(b)?.nombre || '');
      if (sortBy === 'tipo') return a.tipo.localeCompare(b.tipo);
      return 0;
    });

    return result;
    // courseOf solo depende de "courses"
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localExamsList, searchQuery, selectedLevelFilter, selectedGradeFilter, selectedSectionFilter, selectedTypeFilter, selectedCourseFilter, selectedPeriodFilter, sortBy, sections, courses]);

  const totalPages = Math.ceil(filteredExams.length / itemsPerPage) || 1;
  const paginatedExams = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredExams.slice(start, start + itemsPerPage);
  }, [filteredExams, currentPage, itemsPerPage]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo.trim()) {
      showToast('Por favor escribe un título para la evaluación', 'warning');
      return;
    }

    const courseObj = courses.find(c => c.id === formData.cursoId);
    const newExamObj: EvaluationExam = {
      id: `exam-${Date.now()}`,
      curso_id: formData.cursoId,
      seccion_id: formData.seccionId,
      periodo_evaluacion_id: formData.periodoEvaluacionId,
      competencia_id: formData.competenciaId,
      titulo: formData.titulo.trim(),
      tipo: formData.tipo,
      descripcion: formData.descripcion.trim() || `Evaluación de ${courseObj?.nombre || 'materia'} programada.`,
      fecha_programada: formData.fechaProgramada,
      hora_inicio: formData.horaInicio,
      duracion_minutos: Number(formData.duracionMinutos),
      ponderacion: Number(formData.ponderacion) || 1.0,
      instrucciones: formData.instrucciones.trim(),
      estado: formData.estado,
      curso: courseObj,
    };

    addExam({
      cursoId: formData.cursoId,
      seccionId: formData.seccionId,
      periodoEvaluacionId: formData.periodoEvaluacionId,
      competenciaId: formData.competenciaId,
      titulo: formData.titulo.trim(),
      tipo: (formData.tipo === 'bimestral' || formData.tipo === 'actividad') ? 'examen' : formData.tipo,
      fechaProgramada: formData.fechaProgramada,
      horaInicio: formData.horaInicio,
      duracionMinutos: Number(formData.duracionMinutos),
    });

    setLocalExamsList(prev => [newExamObj, ...prev]);

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.6 },
    });

    setIsCreateModalOpen(false);
    showToast('Evaluación programada', 'success', 'Evaluaciones');
  };

  const getSectionInfo = (seccionId?: string) => {
    const sec = sections.find(s => s.id === seccionId);
    if (!sec) return { nombre: 'Sección no asignada', nivel: '' };
    return {
      nombre: `${sec.grado?.nombre || ''} "${sec.letra}"`,
      nivel: sec.grado?.nivel || '',
      aula: sec.aula || 'Aula'
    };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in-50 duration-200">

      {/* ══════════ 1. ENCABEZADO ══════════ */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-500" />
        <div className="p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarClock className="w-8 h-8 text-indigo-600" /> Evaluaciones
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
                Los exámenes, prácticas y proyectos que tienen programados las aulas del colegio. Toca un tipo para filtrar o abre una evaluación para ver su detalle.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> Programar evaluación
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. RESUMEN POR TIPO (toca una tarjeta para filtrar) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {([
          { id: 'todos', label: 'Todas', hint: 'en todos los niveles', value: kpis.total, icon: CalendarClock, tone: 'bg-slate-900 text-white dark:bg-white dark:text-slate-900', card: 'from-slate-50 border-slate-200 dark:from-slate-800/60 dark:border-slate-700', text: 'text-slate-900 dark:text-white', ring: 'ring-slate-900 dark:ring-white' },
          { id: 'bimestral', label: 'Bimestrales', hint: 'cierre de periodo', value: kpis.bimestrales },
          { id: 'examen', label: 'Mensuales', hint: 'exámenes del mes', value: kpis.mensuales },
          { id: 'practica', label: 'Prácticas', hint: 'evaluación continua', value: kpis.practicas },
          { id: 'proyecto', label: 'Proyectos', hint: 'por competencias', value: kpis.proyectos },
        ] as { id: string; label: string; hint: string; value: number; icon?: React.ElementType; tone?: string; card?: string; text?: string; ring?: string }[]).map(k => {
          const ts = k.id === 'todos' ? null : typeStyle(k.id);
          const Icon = k.icon || ts!.icon;
          const active = selectedTypeFilter === k.id;
          return (
            <button
              key={k.id}
              type="button"
              aria-pressed={active}
              onClick={() => { setSelectedTypeFilter(active && k.id !== 'todos' ? 'todos' : k.id); setCurrentPage(1); }}
              className={`text-left p-4 rounded-2xl border bg-gradient-to-br to-white dark:to-slate-900 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer ${k.card || ts!.card} ${active ? `ring-2 ${k.ring || ts!.ring}` : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${k.tone || `${ts!.tile} text-white`}`}><Icon className="w-5 h-5" /></span>
                <span className={`text-2xl font-black ${k.text || ts!.text}`}>{k.value}</span>
              </div>
              <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-2">{k.label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{k.hint}</p>
            </button>
          );
        })}
      </div>

      {/* ── 3. FILTROS Y CONTROLES ── */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">

        {/* Search & Level/Grade/Section Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por título o curso..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            />
          </div>

          {/* Level Filter */}
          <div className="relative">
            <select
              value={selectedLevelFilter}
              onChange={(e) => {
                setSelectedLevelFilter(e.target.value);
                setSelectedGradeFilter('todos');
                setSelectedSectionFilter('todos');
                setCurrentPage(1);
              }}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="todos">Todos los niveles</option>
              <option value="inicial">Inicial</option>
              <option value="primaria">Primaria</option>
              <option value="secundaria">Secundaria</option>
            </select>
          </div>

          {/* Grade Filter */}
          <div className="relative">
            <select
              value={selectedGradeFilter}
              onChange={(e) => {
                setSelectedGradeFilter(e.target.value);
                setSelectedSectionFilter('todos');
                setCurrentPage(1);
              }}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="todos">Todos los grados</option>
              {availableGrades.map(g => (
                <option key={g.id} value={g.id}>{g.nombre}</option>
              ))}
            </select>
          </div>

          {/* Section Filter */}
          <div className="relative">
            <select
              value={selectedSectionFilter}
              onChange={(e) => {
                setSelectedSectionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="todos">Todas las aulas</option>
              {availableSections.map(s => (
                <option key={s.id} value={s.id}>{s.grado?.nombre} &quot;{s.letra}&quot;</option>
              ))}
            </select>
          </div>
        </div>

        {/* Second Filter Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            {/* Type Filter */}
            <select
              value={selectedTypeFilter}
              onChange={(e) => {
                setSelectedTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none"
            >
              <option value="todos">Todos los Tipos</option>
              <option value="bimestral">Bimestrales</option>
              <option value="examen">Mensuales</option>
              <option value="practica">Prácticas</option>
              <option value="proyecto">Proyectos</option>
            </select>

            {/* Period Filter */}
            <select
              value={selectedPeriodFilter}
              onChange={(e) => {
                setSelectedPeriodFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none"
            >
              <option value="todos">Todos los Periodos</option>
              {evaluationPeriods.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} {p.cerrado ? '(Cerrado)' : '(Abierto)'}</option>
              ))}
            </select>

            <span className="text-xs font-bold text-slate-400 pl-2">
              {filteredExams.length} evaluaciones
            </span>
          </div>

          {/* View switcher */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('lista')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === 'lista'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Vista Lista"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Vista Cuadrícula"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* ── 4. RENDER GRID O LISTA ── */}
      {paginatedExams.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 mx-auto flex items-center justify-center">
            <CalendarClock className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-slate-800 dark:text-white">
            No se encontraron evaluaciones
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Ajusta los filtros por nivel, grado o sección para visualizar las evaluaciones programadas.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedExams.map((exam) => {
            const secInfo = getSectionInfo(exam.seccion_id);
            const ts = typeStyle(exam.tipo);
            const st = examStatus(exam);
            const dp = dateParts(exam.fecha_programada);
            return (
              <div
                key={exam.id}
                onClick={() => {
                  setSelectedExam(exam);
                  setIsDetailDrawerOpen(true);
                }}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col cursor-pointer group overflow-hidden"
              >
                <div className={`h-1.5 bg-gradient-to-r ${ts.strip}`} />
                <div className="p-5 flex flex-col gap-3 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black ${ts.chip}`}>
                      <ts.icon className="w-3.5 h-3.5" /> {ts.label}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-bold ${st.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} /> {st.label}
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className={`w-14 shrink-0 rounded-2xl overflow-hidden text-center border ${ts.soft}`}>
                      <div className={`text-[10px] font-black uppercase text-white py-0.5 ${ts.tile}`}>{dp.month}</div>
                      <div className="text-xl font-black text-slate-900 dark:text-white leading-tight pt-1">{dp.day}</div>
                      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 capitalize pb-1">{dp.weekday}</div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: courseOf(exam)?.color_hex || '#6366f1' }} />
                        {courseOf(exam)?.nombre || 'Curso'}
                      </p>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white line-clamp-2 leading-snug mt-0.5 transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {exam.titulo}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                        {exam.descripcion || 'Sin descripción adicional'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold"><School className="w-3.5 h-3.5" /> {secInfo.nombre}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold"><Clock className="w-3.5 h-3.5" /> {exam.hora_inicio || '08:00'}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-semibold"><Timer className="w-3.5 h-3.5" /> {exam.duracion_minutos || 60} min</span>
                  </div>
                </div>

                <div className={`px-5 py-2.5 border-t flex items-center justify-end text-xs ${ts.soft}`}>
                  <span className={`font-bold group-hover:underline ${ts.text}`}>Ver detalles →</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Evaluación & Curso</th>
                  <th className="py-3 px-4">Aula / Nivel</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Fecha & Hora</th>
                  <th className="py-3 px-4">Duración</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedExams.map((exam) => {
                  const secInfo = getSectionInfo(exam.seccion_id);
                  return (
                    <tr key={exam.id} className={`border-l-4 ${typeStyle(exam.tipo).row} hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors`}>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{exam.titulo}</div>
                        <div className="text-[11px] text-indigo-600 font-semibold">{courseOf(exam)?.nombre}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-700 dark:text-slate-300">{secInfo.nombre}</div>
                        <div className="text-[10px] text-slate-400 uppercase">{secInfo.nivel}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold ${typeStyle(exam.tipo).chip}`}>
                          {typeStyle(exam.tipo).label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{exam.fecha_programada}</div>
                        <div className="text-[10px] text-slate-400">{exam.hora_inicio || '08:00'} · <span className="font-bold">{examStatus(exam).label}</span></div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {exam.duracion_minutos || 60} min
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedExam(exam);
                            setIsDetailDrawerOpen(true);
                          }}
                          className="px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100"
                        >
                          Detalle
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs text-slate-500">
            Página {currentPage} de {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* ── 5. MODAL CREAR EVALUACIÓN ── */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Programar evaluación"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Título de la Evaluación *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Examen Mensual de Álgebra - II Bimestre"
                value={formData.titulo}
                onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tipo de Evaluación
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value as any }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white"
                >
                  <option value="examen">Examen Mensual</option>
                  <option value="bimestral">Examen Bimestral</option>
                  <option value="practica">Práctica Calificada</option>
                  <option value="proyecto">Proyecto / Rúbrica</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Periodo CNEB
                </label>
                <select
                  value={formData.periodoEvaluacionId}
                  onChange={(e) => setFormData(prev => ({ ...prev, periodoEvaluacionId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white"
                >
                  {evaluationPeriods.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Sección / Aula
                </label>
                <select
                  value={formData.seccionId}
                  onChange={(e) => setFormData(prev => ({ ...prev, seccionId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white"
                >
                  {sections.map(s => (
                    <option key={s.id} value={s.id}>{s.grado?.nombre} &quot;{s.letra}&quot; ({s.grado?.nivel.toUpperCase()})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Curso / Materia
                </label>
                <select
                  value={formData.cursoId}
                  onChange={(e) => setFormData(prev => ({ ...prev, cursoId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre} ({c.nivel.toUpperCase()})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  value={formData.fechaProgramada}
                  onChange={(e) => setFormData(prev => ({ ...prev, fechaProgramada: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Hora
                </label>
                <input
                  type="time"
                  value={formData.horaInicio}
                  onChange={(e) => setFormData(prev => ({ ...prev, horaInicio: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Duración (min)
                </label>
                <input
                  type="number"
                  min="15"
                  max="180"
                  value={formData.duracionMinutos}
                  onChange={(e) => setFormData(prev => ({ ...prev, duracionMinutos: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Descripción / Indicaciones
              </label>
              <textarea
                rows={3}
                placeholder="Instrucciones para los docentes y estudiantes..."
                value={formData.descripcion}
                onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md"
              >
                Publicar en Calendario
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── 6. DETALLE MODAL ── */}
      {isDetailDrawerOpen && selectedExam && (
        <Modal
          isOpen={isDetailDrawerOpen}
          onClose={() => setIsDetailDrawerOpen(false)}
          title="Ficha de Evaluación Supervisada"
        >
          <div className="space-y-4 text-xs">
            <div className={`p-4 rounded-2xl border ${typeStyle(selectedExam.tipo).soft}`}>
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black ${typeStyle(selectedExam.tipo).chip}`}>
                  {typeStyle(selectedExam.tipo).label}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${examStatus(selectedExam).cls}`}>
                  {examStatus(selectedExam).label}
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">
                {selectedExam.titulo}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                {selectedExam.descripcion || 'Sin descripción'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">CURSO</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{courseOf(selectedExam)?.nombre || 'General'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">SECCIÓN</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{getSectionInfo(selectedExam.seccion_id).nombre}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">FECHA PROGRAMADA</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedExam.fecha_programada} ({selectedExam.hora_inicio || '08:00'})</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">DURACIÓN</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedExam.duracion_minutos || 60} minutos</span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsDetailDrawerOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
