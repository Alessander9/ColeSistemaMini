'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Modal } from '@/components/ui/Modal';
import { EvaluationExam, GradeLetter, Course, Section, Competency } from '@/types';
import { 
  Plus, 
  PlusCircle, 
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
  Edit3, 
  Copy, 
  Trash2, 
  Sparkles, 
  AlertCircle, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Calculator, 
  FlaskConical, 
  Layers, 
  Activity, 
  Users, 
  Palette, 
  Laptop, 
  CalendarClock, 
  GraduationCap, 
  Info, 
  TrendingUp, 
  List, 
  LayoutGrid, 
  Check, 
  Paperclip, 
  AlertTriangle,
  BarChart3,
  Timer
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function DocenteEvaluacionesPage() {
  const { 
    exams, 
    addExam, 
    courses, 
    sections, 
    enrollments, 
    evaluationPeriods, 
    currentUser, 
    getTeacherSections,
    showToast 
  } = useApp();

  // Dual View Mode: Grid (Active by default) & List
  const [viewMode, setViewMode] = useState<'grid' | 'lista'>('grid');

  // Local state for full CRUD interactivity within session
  const [localExamsList, setLocalExamsList] = useState<EvaluationExam[]>(exams);
  useEffect(() => {
    setLocalExamsList(exams);
  }, [exams]);

  // Scoped assignments: Admins have full access to all sections/courses; teachers have their assigned classes or all classes
  const teacherSections = useMemo(() => {
    if (currentUser?.rol === 'admin') {
      return sections.map(s => ({ seccion: s, cursos: courses }));
    }
    const fromContext = getTeacherSections(currentUser.id);
    if (fromContext && fromContext.length > 0) return fromContext;
    return sections.map(s => ({ seccion: s, cursos: courses }));
  }, [getTeacherSections, currentUser?.id, currentUser?.rol, sections, courses]);

  const teacherCourses = useMemo(() => {
    if (currentUser?.rol === 'admin') return courses;
    const list: Course[] = [];
    teacherSections.forEach(ts => {
      ts.cursos.forEach(c => {
        if (!list.some(existing => existing.id === c.id)) {
          list.push(c);
        }
      });
    });
    return list.length > 0 ? list : courses;
  }, [teacherSections, courses, currentUser?.rol]);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('todos');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('todos');
  const [selectedDateFilter, setSelectedDateFilter] = useState('todos');
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState('todos');
  const [sortBy, setSortBy] = useState<'fecha_proxima' | 'fecha_lejana' | 'recientes' | 'antiguas' | 'curso' | 'tipo' | 'estado'>('fecha_proxima');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === 'grid' ? 6 : 10;

  // Active Modals & Drawer states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<EvaluationExam | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Form state for creating evaluation
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'examen' as 'examen' | 'practica' | 'bimestral' | 'proyecto' | 'actividad',
    descripcion: '',
    cursoId: teacherCourses[0]?.id || courses[0]?.id || 'course-mat',
    seccionId: teacherSections[0]?.seccion.id || 'sec-3pri-a',
    periodoEvaluacionId: evaluationPeriods[1]?.id || 'eval-bim-2',
    competenciaId: 'comp-mat-1',
    fechaProgramada: '2026-09-24',
    horaInicio: '08:00',
    duracionMinutos: 60,
    ponderacion: 1.0,
    instrucciones: '',
    estado: 'programada' as 'programada' | 'borrador',
    criterioAD: '',
    criterioA: '',
    criterioB: '',
    criterioC: '',
  });

  // Reschedule form state
  const [rescheduleData, setRescheduleData] = useState({
    fecha: '',
    hora: '08:00',
    duracion: 60,
    motivo: '',
  });

  // Format date helper: "22 set. 2026"
  const formatDateDisplay = (fechaStr: string) => {
    try {
      const [year, month, day] = fechaStr.split('-');
      const months = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'set.', 'oct.', 'nov.', 'dic.'];
      const monthName = months[parseInt(month, 10) - 1] || month;
      return `${parseInt(day, 10)} ${monthName} ${year}`;
    } catch {
      return fechaStr;
    }
  };

  // Format time display: "08:00 a. m."
  const formatTimeDisplay = (timeStr?: string) => {
    if (!timeStr) return '08:00 a. m.';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'p. m.' : 'a. m.';
    const formattedHour = hours % 12 === 0 ? 12 : hours % 12;
    return `${String(formattedHour).padStart(2, '0')}:${String(minutes || 0).padStart(2, '0')} ${period}`;
  };

  // Calculate relative date badge
  const getRelativeDateInfo = (fechaStr: string) => {
    try {
      const today = new Date(2026, 8, 16); // Sept 16, 2026
      const [year, month, day] = fechaStr.split('-').map(Number);
      const targetDate = new Date(year, month - 1, day);
      
      const diffTime = targetDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return { text: 'Hoy', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300', isPast: false };
      }
      if (diffDays > 0) {
        if (diffDays <= 2) {
          return { text: `En ${diffDays} día${diffDays > 1 ? 's' : ''}`, color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200', isPast: false };
        }
        return { text: `En ${diffDays} días`, color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200', isPast: false };
      }
      const pastDays = Math.abs(diffDays);
      return { text: `Vencido hace ${pastDays} día${pastDays > 1 ? 's' : ''}`, color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200', isPast: true };
    } catch {
      return { text: fechaStr, color: 'bg-slate-100 text-slate-700 border-slate-200', isPast: false };
    }
  };

  // Icon mapping by subject / evaluation type
  const getSubjectIcon = (courseName?: string, type?: string) => {
    const name = (courseName || '').toLowerCase();
    if (name.includes('matem')) return <Calculator className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
    if (name.includes('comunic') || name.includes('lengu')) return <BookOpen className="w-5 h-5 text-pink-600 dark:text-pink-400" />;
    if (name.includes('cien') || name.includes('tecnol') || name.includes('quim')) return <FlaskConical className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
    if (name.includes('social') || name.includes('historia')) return <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
    if (name.includes('arte')) return <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
    if (name.includes('fisic') || name.includes('educaci')) return <Activity className="w-5 h-5 text-sky-600 dark:text-sky-400" />;
    if (name.includes('comput') || name.includes('rob')) return <Laptop className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />;
    if (type === 'proyecto') return <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
    return <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
  };

  // Subject badge color scheme
  const getSubjectBadgeStyle = (courseName?: string) => {
    const name = (courseName || '').toLowerCase();
    if (name.includes('matem')) return 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800';
    if (name.includes('comunic')) return 'bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border-pink-200/80 dark:border-pink-800';
    if (name.includes('cien')) return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800';
    if (name.includes('social')) return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800';
    if (name.includes('arte')) return 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800';
    if (name.includes('fisic') || name.includes('educaci')) return 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200/80 dark:border-sky-800';
    if (name.includes('ingles') || name.includes('inglés')) return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800';
    return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800';
  };

  // Evaluation type badge
  const getTypeBadgeStyle = (type: string) => {
    switch (type) {
      case 'practica':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200/70';
      case 'examen':
      case 'bimestral':
        return 'bg-pink-50 text-pink-700 dark:bg-pink-950/70 dark:text-pink-300 border-pink-200/70';
      case 'proyecto':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200/70';
      default:
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200/70';
    }
  };

  // KPIs calculations
  const kpis = useMemo(() => {
    const total = localExamsList.length;
    const examenesMensuales = localExamsList.filter(e => e.tipo === 'examen').length;
    const examenesBimestrales = localExamsList.filter(e => e.tipo === 'bimestral').length;
    const practicas = localExamsList.filter(e => e.tipo === 'practica').length;
    const proyectos = localExamsList.filter(e => e.tipo === 'proyecto').length;

    return {
      total,
      examenesMensuales,
      examenesBimestrales,
      practicas,
      proyectos,
    };
  }, [localExamsList]);

  // Filtering & Sorting
  const filteredAndSortedExams = useMemo(() => {
    let result = [...localExamsList];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(ex => 
        ex.titulo.toLowerCase().includes(q) ||
        (ex.curso?.nombre && ex.curso.nombre.toLowerCase().includes(q)) ||
        (ex.descripcion && ex.descripcion.toLowerCase().includes(q)) ||
        ex.tipo.toLowerCase().includes(q)
      );
    }

    // Type filter
    if (selectedTypeFilter !== 'todos') {
      if (selectedTypeFilter === 'examen_mensual') {
        result = result.filter(e => e.tipo === 'examen');
      } else if (selectedTypeFilter === 'examen_bimestral') {
        result = result.filter(e => e.tipo === 'bimestral');
      } else {
        result = result.filter(e => e.tipo === selectedTypeFilter);
      }
    }

    // Course filter
    if (selectedCourseFilter !== 'todos') {
      result = result.filter(e => e.curso_id === selectedCourseFilter);
    }

    // Date filter
    if (selectedDateFilter !== 'todos') {
      const todayStr = '2026-09-16';
      if (selectedDateFilter === 'proximas') {
        result = result.filter(e => e.fecha_programada >= todayStr);
      } else if (selectedDateFilter === 'pasadas') {
        result = result.filter(e => e.fecha_programada < todayStr);
      } else if (selectedDateFilter === 'este_mes') {
        result = result.filter(e => e.fecha_programada.startsWith('2026-09'));
      }
    }

    // Period filter
    if (selectedPeriodFilter !== 'todos') {
      result = result.filter(e => e.periodo_evaluacion_id === selectedPeriodFilter);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'fecha_proxima') {
        return a.fecha_programada.localeCompare(b.fecha_programada);
      }
      if (sortBy === 'fecha_lejana') {
        return b.fecha_programada.localeCompare(a.fecha_programada);
      }
      if (sortBy === 'recientes') {
        return b.id.localeCompare(a.id);
      }
      if (sortBy === 'antiguas') {
        return a.id.localeCompare(b.id);
      }
      if (sortBy === 'curso') {
        return (a.curso?.nombre || '').localeCompare(b.curso?.nombre || '');
      }
      if (sortBy === 'tipo') {
        return a.tipo.localeCompare(b.tipo);
      }
      if (sortBy === 'estado') {
        return (a.estado || '').localeCompare(b.estado || '');
      }
      return 0;
    });

    return result;
  }, [localExamsList, searchQuery, selectedTypeFilter, selectedCourseFilter, selectedDateFilter, selectedPeriodFilter, sortBy]);

  // Pagination calculation
  const totalItems = filteredAndSortedExams.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedExams = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedExams.slice(start, start + itemsPerPage);
  }, [filteredAndSortedExams, currentPage, itemsPerPage]);

  // Quick filter chips matching screenshot
  const typeFilterChips = [
    { id: 'todos', label: 'Todas las evaluaciones', count: localExamsList.length },
    { id: 'examen_mensual', label: 'Exámenes Mensuales', count: kpis.examenesMensuales },
    { id: 'practica', label: 'Prácticas Calificadas', count: kpis.practicas },
    { id: 'proyecto', label: 'Proyectos & Rúbricas', count: kpis.proyectos },
  ];

  // Handle Create Evaluation Submit
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo.trim()) {
      showToast('Por favor escribe un título para la evaluación', 'warning');
      return;
    }

    const courseObj = courses.find(c => c.id === formData.cursoId) || teacherCourses[0];
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
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b']
    });

    setIsCreateModalOpen(false);
    showToast('¡Evaluación programada con éxito!', 'success', 'Evaluación Creada');
    setFormData({
      titulo: '',
      tipo: 'examen',
      descripcion: '',
      cursoId: teacherCourses[0]?.id || courses[0]?.id || 'course-mat',
      seccionId: teacherSections[0]?.seccion.id || 'sec-3pri-a',
      periodoEvaluacionId: evaluationPeriods[1]?.id || 'eval-bim-2',
      competenciaId: 'comp-mat-1',
      fechaProgramada: '2026-09-24',
      horaInicio: '08:00',
      duracionMinutos: 60,
      ponderacion: 1.0,
      instrucciones: '',
      estado: 'programada',
      criterioAD: '',
      criterioA: '',
      criterioB: '',
      criterioC: '',
    });
  };

  // Handle Reschedule submit
  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExam || !rescheduleData.fecha) return;

    setLocalExamsList(prev => prev.map(ex => {
      if (ex.id === selectedExam.id) {
        return {
          ...ex,
          fecha_programada: rescheduleData.fecha,
          hora_inicio: rescheduleData.hora,
          duracion_minutos: Number(rescheduleData.duracion),
        };
      }
      return ex;
    }));

    showToast(`Evaluación reprogramada para el ${formatDateDisplay(rescheduleData.fecha)}`, 'success', 'Fecha Actualizada');
    setIsRescheduleModalOpen(false);
  };

  // Handle Duplicate Evaluation
  const handleDuplicateExam = (exam: EvaluationExam) => {
    const duplicated: EvaluationExam = {
      ...exam,
      id: `exam-dup-${Date.now()}`,
      titulo: `${exam.titulo} (Copia)`,
      estado: 'borrador',
    };
    setLocalExamsList(prev => [duplicated, ...prev]);
    showToast('Evaluación duplicada como borrador', 'info', 'Duplicado');
    setOpenDropdownId(null);
  };

  // Handle Delete Evaluation
  const handleDeleteExam = (examId: string) => {
    setLocalExamsList(prev => prev.filter(e => e.id !== examId));
    showToast('Evaluación eliminada del cronograma', 'info', 'Eliminada');
    setOpenDropdownId(null);
    if (selectedExam?.id === examId) {
      setIsDetailDrawerOpen(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleGlobalClick = () => setOpenDropdownId(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in-50 duration-200">
      
      {/* ── 1. ENCABEZADO ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
            <CalendarClock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Cronograma de Evaluaciones y Exámenes
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Programa exámenes bimestrales, prácticas calificadas y rúbricas por competencia.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
          {/* Live Date & Time Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span>Martes, 16 de septiembre de 2026</span>
            <span className="text-slate-400">|</span>
            <span className="font-bold text-slate-800 dark:text-white">08:24 AM</span>
          </div>

          {/* Primary CTA: + Programar Evaluación */}
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-700 hover:via-indigo-700 hover:to-purple-700 text-white font-black text-xs sm:text-sm shadow-xl shadow-indigo-600/25 transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Programar Evaluación</span>
          </button>
        </div>
      </div>

      {/* ── 2. BARRA DE BÚSQUEDA Y FILTROS ── */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3.5">
        
        {/* Top search & quick chips row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar evaluación por título o curso..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Chips & View Mode Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            {typeFilterChips.map((chip) => {
              const isActive = selectedTypeFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => {
                    setSelectedTypeFilter(chip.id);
                    setCurrentPage(1);
                  }}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80'
                  }`}
                >
                  <span>{chip.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    {chip.count}
                  </span>
                </button>
              );
            })}

            {/* Results counter */}
            <span className="text-xs font-semibold text-slate-400 px-2">
              {filteredAndSortedExams.length} resultados
            </span>

            {/* View Mode Switcher: [ Lista ] [ Grid ] */}
            <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('lista')}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  viewMode === 'lista'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
                title="Vista Lista / Tabla"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
                title="Vista Cuadrícula / Grid"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* ── 3. CONTENIDO PRINCIPAL: VISTA GRID / TABLA ── */}
      {viewMode === 'grid' ? (
        
        /* ═════════════════════════════════════════════════════════════════
           VISTA EN FORMA DE GRID (TARJETAS)
        ═════════════════════════════════════════════════════════════════ */
        <div>
          {paginatedExams.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 mx-auto flex items-center justify-center">
                <CalendarClock className="w-7 h-7" />
              </div>
              <h3 className="text-base font-black text-slate-800 dark:text-white">
                No encontramos evaluaciones
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No hay evaluaciones que coincidan con los filtros aplicados en este momento.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCourseFilter('todos');
                  setSelectedTypeFilter('todos');
                  setSelectedDateFilter('todos');
                }}
                className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold cursor-pointer transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginatedExams.map((exam) => {
                const isMenuOpen = openDropdownId === exam.id;

                return (
                  <div
                    key={exam.id}
                    onClick={() => {
                      setSelectedExam(exam);
                      setIsDetailDrawerOpen(true);
                    }}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-900/60 transition-all duration-200 flex flex-col justify-between cursor-pointer group relative"
                  >
                    
                    {/* Top Row: Subject Icon + Badges + Menu */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shadow-xs shrink-0">
                            {getSubjectIcon(exam.curso?.nombre, exam.tipo)}
                          </div>
                          
                          <span className={`px-2.5 py-0.8 rounded-lg text-xs font-extrabold border ${getSubjectBadgeStyle(exam.curso?.nombre)}`}>
                            {exam.curso?.nombre || 'General'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 relative">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${getTypeBadgeStyle(exam.tipo)}`}>
                            {exam.tipo === 'practica' ? 'PRÁCTICA' : exam.tipo === 'proyecto' ? 'PROYECTO' : 'EXAMEN'}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(isMenuOpen ? null : exam.id);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Opciones"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Options Menu */}
                          {isMenuOpen && (
                            <div 
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 z-30 animate-in zoom-in-95 duration-100 text-left"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedExam(exam);
                                  setIsDetailDrawerOpen(true);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-600" />
                                <span>Ver detalle</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedExam(exam);
                                  setRescheduleData({
                                    fecha: exam.fecha_programada,
                                    hora: exam.hora_inicio || '08:00',
                                    duracion: exam.duracion_minutos || 60,
                                    motivo: '',
                                  });
                                  setIsRescheduleModalOpen(true);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                <CalendarClock className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Reprogramar fecha</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedExam(exam);
                                  setIsStudentsModalOpen(true);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                <Users className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Ver estudiantes / Rúbrica</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDuplicateExam(exam)}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                <Copy className="w-3.5 h-3.5 text-slate-500" />
                                <span>Duplicar</span>
                              </button>

                              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                              <button
                                type="button"
                                onClick={() => handleDeleteExam(exam.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Eliminar evaluación</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-1.5 mb-4">
                        <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {exam.titulo}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {exam.descripcion || 'Sin descripción adicional registrada.'}
                        </p>
                      </div>

                      {/* Scheduled Info Box (Contrast box with 3 data points) */}
                      <div className="p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 grid grid-cols-3 gap-2 text-center mb-4">
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
                            <Calendar className="w-3 h-3 text-indigo-500" />
                            <span>Fecha</span>
                          </div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                            {exam.fecha_programada}
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
                            <Clock className="w-3 h-3 text-blue-500" />
                            <span>Hora de inicio</span>
                          </div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                            {formatTimeDisplay(exam.hora_inicio)}
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
                            <Timer className="w-3 h-3 text-purple-500" />
                            <span>Duración</span>
                          </div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                            {exam.duracion_minutos || 60} minutos
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Status + Ponderación + Action button */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Status badge */}
                        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Programado
                        </span>

                        <span className="text-slate-300 dark:text-slate-700">|</span>

                        {/* Ponderación */}
                        <span className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                          <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
                          Ponderación 100%
                        </span>
                      </div>

                      {/* Primary Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedExam(exam);
                          setIsDetailDrawerOpen(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all border border-blue-200/60 dark:border-blue-800/60"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver detalle</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      ) : (

        /* ═════════════════════════════════════════════════════════════════
           VISTA EN FORMA DE LISTA / TABLA
        ═════════════════════════════════════════════════════════════════ */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          {paginatedExams.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 mx-auto flex items-center justify-center">
                <CalendarClock className="w-7 h-7" />
              </div>
              <h3 className="text-base font-black text-slate-800 dark:text-white">
                No se encontraron evaluaciones
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No hay evaluaciones programadas que coincidan con los filtros aplicados.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCourseFilter('todos');
                  setSelectedTypeFilter('todos');
                }}
                className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold cursor-pointer transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3.5 px-5">EVALUACIÓN</th>
                    <th className="py-3.5 px-4">CURSO</th>
                    <th className="py-3.5 px-4">FECHA PROGRAMADA</th>
                    <th className="py-3.5 px-4">DURACIÓN</th>
                    <th className="py-3.5 px-4">ESTADO</th>
                    <th className="py-3.5 px-5 text-right">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {paginatedExams.map((exam) => {
                    const relativeDate = getRelativeDateInfo(exam.fecha_programada);
                    const isMenuOpen = openDropdownId === exam.id;

                    return (
                      <tr 
                        key={exam.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
                      >
                        {/* 1. Evaluación */}
                        <td className="py-4 px-5 max-w-sm">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                              {getSubjectIcon(exam.curso?.nombre, exam.tipo)}
                            </div>
                            <div className="min-w-0">
                              <h4 
                                onClick={() => {
                                  setSelectedExam(exam);
                                  setIsDetailDrawerOpen(true);
                                }}
                                className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                              >
                                {exam.titulo}
                              </h4>
                              
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${getTypeBadgeStyle(exam.tipo)}`}>
                                  {exam.tipo === 'practica' ? 'PRÁCTICA' : exam.tipo === 'proyecto' ? 'PROYECTO' : 'EXAMEN'}
                                </span>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[280px]">
                                  {exam.descripcion || 'Evaluación de competencias académicas.'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Curso */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-black border ${getSubjectBadgeStyle(exam.curso?.nombre)}`}>
                            {exam.curso?.nombre || 'General'}
                          </span>
                        </td>

                        {/* 3. Fecha Programada */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                              <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <span>{formatDateDisplay(exam.fecha_programada)}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium pl-5">
                              {formatTimeDisplay(exam.hora_inicio)}
                            </div>
                            <div className="pl-5">
                              <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${relativeDate.color}`}>
                                {relativeDate.text}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 4. Duración */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{exam.duracion_minutos || 60} minutos</span>
                          </div>
                        </td>

                        {/* 5. Estado */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
                            <Clock className="w-3 h-3 text-blue-600" />
                            Programado
                          </span>
                        </td>

                        {/* 6. Acciones */}
                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5 relative">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedExam(exam);
                                setIsDetailDrawerOpen(true);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-bold transition-all border border-blue-200/60"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ver detalle</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(isMenuOpen ? null : exam.id);
                              }}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {isMenuOpen && (
                              <div 
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 z-30 animate-in zoom-in-95 duration-100 text-left"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedExam(exam);
                                    setIsDetailDrawerOpen(true);
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                                >
                                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Ver detalle</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedExam(exam);
                                    setRescheduleData({
                                      fecha: exam.fecha_programada,
                                      hora: exam.hora_inicio || '08:00',
                                      duracion: exam.duracion_minutos || 60,
                                      motivo: '',
                                    });
                                    setIsRescheduleModalOpen(true);
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                                >
                                  <CalendarClock className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>Reprogramar</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteExam(exam.id)}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Eliminar</span>
                                </button>
                              </div>
                            )}
                          </div>
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

      {/* ── 4. PAGINACIÓN INFERIOR & CONTADOR ── */}
      <div className="px-5 py-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 shadow-xs">
        <div>
          Mostrando <strong className="text-slate-800 dark:text-white">{filteredAndSortedExams.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong> a <strong className="text-slate-800 dark:text-white">{Math.min(currentPage * itemsPerPage, filteredAndSortedExams.length)}</strong> de <strong className="text-slate-800 dark:text-white">{filteredAndSortedExams.length}</strong> evaluaciones
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              className={`w-7 h-7 rounded-xl font-bold transition-all cursor-pointer ${
                currentPage === page
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── 5. MODAL CREAR EVALUACIÓN ── */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Programar Nueva Evaluación"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          
          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Título de la Evaluación *
            </label>
            <input
              required
              type="text"
              placeholder="Ej. Práctica Calificada N° 2: Ecuaciones de Primer Grado"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Tipo de Evaluación
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none cursor-pointer"
              >
                <option value="examen">Examen Escrito / Mensual</option>
                <option value="practica">Práctica Calificada</option>
                <option value="bimestral">Examen Bimestral Centralizado</option>
                <option value="proyecto">Proyecto con Rúbrica</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Periodo Bimestral
              </label>
              <select
                value={formData.periodoEvaluacionId}
                onChange={(e) => setFormData({ ...formData, periodoEvaluacionId: e.target.value })}
                className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none cursor-pointer"
              >
                {evaluationPeriods.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Curso / Asignatura
              </label>
              <select
                value={formData.cursoId}
                onChange={(e) => setFormData({ ...formData, cursoId: e.target.value })}
                className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none cursor-pointer"
              >
                {teacherCourses.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Sección / Salón
              </label>
              <select
                value={formData.seccionId}
                onChange={(e) => setFormData({ ...formData, seccionId: e.target.value })}
                className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none cursor-pointer"
              >
                {teacherSections.map(ts => (
                  <option key={ts.seccion.id} value={ts.seccion.id}>
                    {ts.seccion.grado?.nombre} Sección {ts.seccion.letra} ({ts.seccion.grado?.nivel})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Fecha Programada
              </label>
              <input
                required
                type="date"
                value={formData.fechaProgramada}
                onChange={(e) => setFormData({ ...formData, fechaProgramada: e.target.value })}
                className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Hora de Inicio
              </label>
              <input
                required
                type="time"
                value={formData.horaInicio}
                onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Duración (Minutos)
              </label>
              <input
                required
                type="number"
                min="10"
                max="240"
                value={formData.duracionMinutos}
                onChange={(e) => setFormData({ ...formData, duracionMinutos: Number(e.target.value) })}
                className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Temas / Descripción Breve
            </label>
            <textarea
              rows={2}
              placeholder="Detalla los temas, competencias y capacidades evaluadas..."
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-black shadow-lg shadow-indigo-500/25 cursor-pointer active:scale-95"
            >
              + Publicar y Programar Evaluación
            </button>
          </div>

        </form>
      </Modal>

      {/* ── 6. DRAWER / MODAL DE DETALLE ── */}
      {isDetailDrawerOpen && selectedExam && (
        <Modal
          isOpen={isDetailDrawerOpen}
          onClose={() => setIsDetailDrawerOpen(false)}
          title="Ficha Técnica de Evaluación"
          maxWidth="lg"
        >
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50/80 dark:from-slate-800 dark:to-slate-800/80 border border-indigo-100 dark:border-slate-700 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center shrink-0">
                {getSubjectIcon(selectedExam.curso?.nombre, selectedExam.tipo)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${getTypeBadgeStyle(selectedExam.tipo)}`}>
                    {selectedExam.tipo.toUpperCase()}
                  </span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {selectedExam.curso?.nombre}
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                  {selectedExam.titulo}
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Fecha Programada</span>
                <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  {formatDateDisplay(selectedExam.fecha_programada)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Hora y Duración</span>
                <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  {formatTimeDisplay(selectedExam.hora_inicio)} ({selectedExam.duracion_minutos} min)
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Estado</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Programada
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <span className="font-black text-slate-700 dark:text-slate-300 block">
                Contenido / Indicaciones:
              </span>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 leading-relaxed">
                {selectedExam.descripcion || 'Sin descripción detallada registrada.'}
                {selectedExam.instrucciones && (
                  <p className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700 font-semibold text-indigo-600 dark:text-indigo-400">
                    Instrucciones: {selectedExam.instrucciones}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleDeleteExam(selectedExam.id)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer"
              >
                Eliminar
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDetailDrawerOpen(false);
                    setRescheduleData({
                      fecha: selectedExam.fecha_programada,
                      hora: selectedExam.hora_inicio || '08:00',
                      duracion: selectedExam.duracion_minutos || 60,
                      motivo: '',
                    });
                    setIsRescheduleModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Reprogramar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsDetailDrawerOpen(false);
                    setIsStudentsModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md cursor-pointer hover:bg-indigo-700"
                >
                  Ver Estudiantes
                </button>
              </div>
            </div>

          </div>
        </Modal>
      )}

      {/* ── 7. MODAL REPROGRAMAR ── */}
      {isRescheduleModalOpen && selectedExam && (
        <Modal
          isOpen={isRescheduleModalOpen}
          onClose={() => setIsRescheduleModalOpen(false)}
          title="Reprogramar Fecha de Evaluación"
          maxWidth="md"
        >
          <form onSubmit={handleRescheduleSubmit} className="space-y-4">
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 text-xs text-indigo-800 dark:text-indigo-200">
              Estás modificando la fecha para: <strong>{selectedExam.titulo}</strong>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase mb-1">
                Nueva Fecha
              </label>
              <input
                required
                type="date"
                value={rescheduleData.fecha}
                onChange={(e) => setRescheduleData({ ...rescheduleData, fecha: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 text-xs font-bold outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Nueva Hora
                </label>
                <input
                  required
                  type="time"
                  value={rescheduleData.hora}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, hora: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 text-xs font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Duración (Minutos)
                </label>
                <input
                  required
                  type="number"
                  value={rescheduleData.duracion}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, duracion: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 text-xs font-bold outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsRescheduleModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700"
              >
                Guardar Reprogramación
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── 8. MODAL ESTUDIANTES ── */}
      {isStudentsModalOpen && selectedExam && (
        <Modal
          isOpen={isStudentsModalOpen}
          onClose={() => setIsStudentsModalOpen(false)}
          title={`Estudiantes Inscritos: ${selectedExam.titulo}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Lista de estudiantes de la sección asignada para registro de asistencia o calificaciones:
            </p>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {enrollments.slice(0, 8).map((enr, idx) => (
                <div key={enr.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 dark:text-white block">
                        {enr.estudiante?.profile?.apellidos || 'Estudiante'}, {enr.estudiante?.profile?.nombres || ''}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Código: {enr.estudiante?.codigo_estudiante} | DNI: {enr.estudiante?.profile?.dni || '—'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Habilitado
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsStudentsModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200"
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
