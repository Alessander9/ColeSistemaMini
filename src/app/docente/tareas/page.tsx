'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Modal } from '@/components/ui/Modal';
import { GradeSelector } from '@/components/notas/GradeSelector';
import { GradeBadge } from '@/components/notas/GradeBadge';
import { TaskAssignment, TaskSubmission, GradeLetter, Course, Section } from '@/types';
import { 
  Plus, 
  PlusCircle, 
  BookOpen, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  User, 
  Award, 
  Paperclip, 
  FileText, 
  School, 
  AlignLeft,
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
  Download,
  Check,
  Calculator,
  FlaskConical,
  Activity,
  Users,
  Globe2,
  ArrowUpRight,
  ShieldCheck,
  Link as LinkIcon,
  LayoutGrid,
  List as ListIcon,
  Laptop,
  Palette
} from 'lucide-react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import confetti from 'canvas-confetti';

type TaskStatusType = 'completada' | 'en_proceso' | 'pendiente' | 'vencida';

export default function DocenteTareasPage() {
  const { 
    tasks, 
    addTask, 
    submissions, 
    gradeTask, 
    courses, 
    enrollments, 
    sections,
    currentUser, 
    getTeacherSections,
    showToast 
  } = useApp();

  // Dual View Mode: Grid (Active by default) & List
  const [viewMode, setViewMode] = useState<'grid' | 'lista'>('grid');

  // Scoped assignments: Admins have full access to all sections/courses; teachers have their assigned classes or all classes
  const teacherSections = useMemo(() => {
    if (currentUser?.rol === 'admin') {
      return sections.map(s => ({ seccion: s, cursos }));
    }
    const fromContext = getTeacherSections(currentUser.id);
    if (fromContext && fromContext.length > 0) return fromContext;
    return sections.map(s => ({ seccion: s, cursos }));
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

  // Search, Filter & Sorting States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('todos');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('todos');
  const [sortBy, setSortBy] = useState<'fecha_limite' | 'recientes' | 'antiguas' | 'estado' | 'materia'>('fecha_limite');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === 'grid' ? 9 : 6;

  // Active Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTaskForReview, setSelectedTaskForReview] = useState<TaskAssignment | null>(null);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<TaskAssignment | null>(null);
  const [activeMenuTaskId, setActiveMenuTaskId] = useState<string | null>(null);

  // New Task Form State
  const [formData, setFormData] = useState({
    cursoId: teacherCourses[0]?.id || courses[0]?.id || 'course-mat',
    seccionId: teacherSections[0]?.seccion.id || 'sec-3pri-a',
    titulo: '',
    descripcion: '',
    fechaLimite: '2026-09-28T18:59',
    materialUrl: '',
    permiteArchivos: true,
  });

  // Grading Modal State
  const [gradingSubmission, setGradingSubmission] = useState<{
    tareaId: string;
    matriculaId: string;
    studentName: string;
    studentAvatar?: string;
    currentGrade?: GradeLetter;
    retroalimentacion?: string;
    comentarioEstudiante?: string;
    archivoUrl?: string;
    archivoNombre?: string;
    archivoTamano?: string;
  } | null>(null);

  // Sample student avatars for the overlap stack
  const studentAvatarsSample = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
  ];

  // Helper to compute task status and delivery metrics
  const getTaskMetrics = (task: TaskAssignment) => {
    const targetSectionId = task.seccion_id || 'sec-3pri-a';
    const sectionStudents = enrollments.filter(e => e.seccion_id === targetSectionId && e.estado === 'activo');
    const totalStudents = sectionStudents.length > 0 ? sectionStudents.length : 11;
    
    const taskSubs = submissions.filter(s => s.tarea_id === task.id);
    const gradedSubs = taskSubs.filter(s => !!s.calificacion_letra);
    const subCount = taskSubs.length;

    const dueDate = new Date(task.fecha_limite);
    const now = new Date('2026-09-16T19:40:00Z'); // Simulation baseline
    const isPastDue = dueDate < now;

    let computedStatus: TaskStatusType = 'pendiente';
    if (subCount === totalStudents && gradedSubs.length === totalStudents) {
      computedStatus = 'completada';
    } else if (isPastDue) {
      computedStatus = 'vencida';
    } else if (subCount > 0) {
      computedStatus = 'en_proceso';
    } else {
      computedStatus = 'pendiente';
    }

    // Relative due date text
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let relativeDueText = '';
    let relativeDueClass = '';
    if (computedStatus === 'completada') {
      relativeDueText = 'Completada';
      relativeDueClass = 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/80 dark:border-emerald-900';
    } else if (isPastDue) {
      const pastDays = Math.abs(diffDays);
      relativeDueText = 'Vencida';
      relativeDueClass = 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-200/80 dark:border-rose-900';
    } else if (diffDays === 0) {
      relativeDueText = 'Vence hoy';
      relativeDueClass = 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200/80 dark:border-rose-900 font-bold';
    } else if (diffDays <= 4) {
      relativeDueText = `Faltan ${diffDays} días`;
      relativeDueClass = 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200/80 dark:border-amber-900 font-semibold';
    } else if (computedStatus === 'en_proceso') {
      relativeDueText = 'En proceso';
      relativeDueClass = 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border-blue-200/80 dark:border-blue-900 font-semibold';
    } else {
      relativeDueText = `Faltan ${diffDays} días`;
      relativeDueClass = 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200/80 dark:border-amber-900 font-semibold';
    }

    const progressPct = totalStudents > 0 ? Math.round((subCount / totalStudents) * 100) : 0;

    return {
      totalStudents,
      subCount,
      gradedCount: gradedSubs.length,
      status: computedStatus,
      isPastDue,
      relativeDueText,
      relativeDueClass,
      dueDate,
      progressPct,
      diffDays,
    };
  };

  // Helper for subject visual badges & icons matching reference
  const getSubjectVisual = (courseName?: string) => {
    const name = (courseName || '').toLowerCase();
    if (name.includes('matemática') || name.includes('matematica') || name.includes('álgebra') || name.includes('geometría')) {
      return {
        icon: Calculator,
        badgeClass: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
        iconContainer: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/60',
      };
    }
    if (name.includes('comunicación') || name.includes('comunicacion') || name.includes('lenguaje') || name.includes('lectora')) {
      return {
        icon: BookOpen,
        badgeClass: 'bg-pink-50 text-pink-700 dark:bg-pink-950/70 dark:text-pink-300 border-pink-200 dark:border-pink-800',
        iconContainer: 'bg-pink-50 text-pink-600 dark:bg-pink-950/80 dark:text-pink-300 border border-pink-100 dark:border-pink-900/60',
      };
    }
    if (name.includes('ciencia') || name.includes('tecnología') || name.includes('cta') || name.includes('química') || name.includes('física')) {
      return {
        icon: FlaskConical,
        badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        iconContainer: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/60',
      };
    }
    if (name.includes('computación') || name.includes('robótica') || name.includes('computacion') || name.includes('scratch')) {
      return {
        icon: Laptop,
        badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        iconContainer: 'bg-amber-50 text-amber-600 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-100 dark:border-amber-900/60',
      };
    }
    if (name.includes('física') || name.includes('educación física') || name.includes('educ. física') || name.includes('deporte')) {
      return {
        icon: Activity,
        badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        iconContainer: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/60',
      };
    }
    if (name.includes('social') || name.includes('personal') || name.includes('historia') || name.includes('cívica')) {
      return {
        icon: Users,
        badgeClass: 'bg-purple-50 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        iconContainer: 'bg-purple-50 text-purple-600 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-100 dark:border-purple-900/60',
      };
    }
    if (name.includes('arte') || name.includes('cultura') || name.includes('dibujo')) {
      return {
        icon: Palette,
        badgeClass: 'bg-pink-50 text-pink-700 dark:bg-pink-950/70 dark:text-pink-300 border-pink-200 dark:border-pink-800',
        iconContainer: 'bg-pink-50 text-pink-600 dark:bg-pink-950/80 dark:text-pink-300 border border-pink-100 dark:border-pink-900/60',
      };
    }
    return {
      icon: Globe2,
      badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      iconContainer: 'bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-100 dark:border-blue-900/60',
    };
  };

  // KPIs Calculations
  const kpis = useMemo(() => {
    let total = tasks.length;
    let completadas = 0;
    let enProceso = 0;
    let pendientes = 0;
    let vencidas = 0;

    tasks.forEach(t => {
      const { status } = getTaskMetrics(t);
      if (status === 'completada') completadas++;
      else if (status === 'en_proceso') enProceso++;
      else if (status === 'pendiente') pendientes++;
      else if (status === 'vencida') vencidas++;
    });

    const completadasPct = total > 0 ? Math.round((completadas / total) * 100) : 0;
    const enProcesoPct = total > 0 ? Math.round((enProceso / total) * 100) : 0;
    const pendientesPct = total > 0 ? Math.round((pendientes / total) * 100) : 0;
    const vencidasPct = total > 0 ? Math.round((vencidas / total) * 100) : 0;

    return {
      total,
      completadas,
      completadasPct,
      enProceso,
      enProcesoPct,
      pendientes,
      pendientesPct,
      vencidas,
      vencidasPct,
    };
  }, [tasks, submissions]);

  // Filtered & Sorted Tasks List
  const filteredTasks = useMemo(() => {
    let list = tasks.filter(t => {
      const matchQuery = !searchQuery || 
        `${t.titulo} ${t.descripcion} ${t.curso?.nombre || ''}`.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchCourse = selectedCourseFilter === 'todos' || t.curso_id === selectedCourseFilter;
      
      const { status } = getTaskMetrics(t);
      const matchStatus = selectedStatusFilter === 'todos' || status === selectedStatusFilter;

      return matchQuery && matchCourse && matchStatus;
    });

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'fecha_limite') {
        return new Date(a.fecha_limite).getTime() - new Date(b.fecha_limite).getTime();
      }
      if (sortBy === 'recientes') {
        return new Date(b.created_at || b.fecha_limite).getTime() - new Date(a.created_at || a.fecha_limite).getTime();
      }
      if (sortBy === 'antiguas') {
        return new Date(a.created_at || a.fecha_limite).getTime() - new Date(b.created_at || b.fecha_limite).getTime();
      }
      if (sortBy === 'materia') {
        return (a.curso?.nombre || '').localeCompare(b.curso?.nombre || '');
      }
      if (sortBy === 'estado') {
        return getTaskMetrics(a).status.localeCompare(getTaskMetrics(b).status);
      }
      return 0;
    });

    return list;
  }, [tasks, searchQuery, selectedCourseFilter, selectedStatusFilter, sortBy, submissions]);

  // Paginated tasks
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTasks.slice(start, start + itemsPerPage);
  }, [filteredTasks, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage) || 1;

  // Handle New Task Submission
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo || !formData.descripcion) return;

    addTask({
      cursoId: formData.cursoId,
      seccionId: formData.seccionId,
      titulo: formData.titulo,
      descripcion: formData.descripcion,
      fechaLimite: new Date(formData.fechaLimite).toISOString(),
      archivoUrl: formData.materialUrl || undefined,
    });

    confetti({
      particleCount: 35,
      spread: 50,
      origin: { y: 0.7 },
    });

    showToast(`Tarea "${formData.titulo}" publicada exitosamente.`, 'success', '✓ Tarea Creada');
    setIsAddModalOpen(false);

    setFormData({
      cursoId: teacherCourses[0]?.id || courses[0]?.id || 'course-mat',
      seccionId: teacherSections[0]?.seccion.id || 'sec-3pri-a',
      titulo: '',
      descripcion: '',
      fechaLimite: '2026-09-28T18:59',
      materialUrl: '',
      permiteArchivos: true,
    });
  };

  // Handle Save Grade
  const handleSaveGrade = (grade: GradeLetter, retro?: string) => {
    if (!gradingSubmission) return;

    gradeTask({
      tareaId: gradingSubmission.tareaId,
      matriculaId: gradingSubmission.matriculaId,
      calificacionLetra: grade,
      retroalimentacion: retro,
    });

    confetti({
      particleCount: 25,
      spread: 45,
      origin: { y: 0.8 },
    });

    showToast(`Calificación guardada para ${gradingSubmission.studentName}`, 'success', '✓ Nota Registrada');
    setGradingSubmission(null);
  };

  // Quick subject chips
  const subjectFilterChips = useMemo(() => {
    return [
      { id: 'todos', label: 'Todas mis Materias', count: tasks.length },
      ...teacherCourses.map(c => ({
        id: c.id,
        label: c.nombre,
        count: tasks.filter(t => t.curso_id === c.id).length,
      })),
    ];
  }, [teacherCourses, tasks]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in-50 pb-16 font-sans select-none">
      
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. ENCABEZADO PRINCIPAL (MATCHING SCREENSHOT)
          ───────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Gestión de Tareas Escolares
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">
              Publica asignaciones para tus secciones, recibe entregas y califica con retroalimentación cualitativa.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-end sm:self-center">
          {/* Current Date & Time Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/80 text-xs">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <div className="text-left">
              <p className="text-[10px] font-semibold text-slate-400 leading-none">Martes, 16 de septiembre de 2026</p>
              <p className="font-mono font-bold text-slate-700 dark:text-slate-200 text-xs mt-0.5 leading-none">08:24 AM</p>
            </div>
          </div>

          {/* Primary CTA Button */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/25 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Crear Nueva Tarea</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. RESUMEN DE TAREAS / KPIS (MATCHING SCREENSHOT)
          ───────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total de Tareas */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/50">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total de Tareas</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900 dark:text-white">{kpis.total}</span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                ↑ +2 <span className="text-slate-400 font-normal hidden xl:inline">Este período</span>
              </span>
            </div>
          </div>
        </div>

        {/* Completadas */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/50">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Completadas</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900 dark:text-white">{kpis.completadas}</span>
              <span className="text-[11px] font-medium text-slate-400">{kpis.completadasPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${kpis.completadasPct}%` }} />
            </div>
          </div>
        </div>

        {/* En proceso */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900/50">
            <Clock className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">En proceso</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900 dark:text-white">{kpis.enProceso}</span>
              <span className="text-[11px] font-medium text-slate-400">{kpis.enProcesoPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${kpis.enProcesoPct}%` }} />
            </div>
          </div>
        </div>

        {/* Pendientes / Vencidas */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900/50">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pendientes</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900 dark:text-white">{kpis.pendientes}</span>
              <span className="text-[11px] font-medium text-slate-400">{kpis.pendientesPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
              <div className="h-full bg-rose-500 rounded-full transition-all" style={{ width: `${kpis.pendientesPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. BÚSQUEDA, FILTROS Y SELECTOR DE VISTA (GRID / LISTA)
          ───────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        
        {/* Search input + Dropdowns row */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full lg:flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar tarea por título, descripción o palabra clave..."
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
            {/* Materias Select */}
            <div className="relative">
              <select
                value={selectedCourseFilter}
                onChange={(e) => {
                  setSelectedCourseFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none pl-9 pr-8 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="todos">📖 Todas las materias</option>
                {teacherCourses.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
              <BookOpen className="w-3.5 h-3.5 text-indigo-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Estados Select */}
            <div className="relative">
              <select
                value={selectedStatusFilter}
                onChange={(e) => {
                  setSelectedStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none pl-9 pr-8 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="todos">📊 Todos los estados</option>
                <option value="en_proceso">🟢 En proceso</option>
                <option value="pendiente">🔵 Pendiente</option>
                <option value="completada">🟢 Completada</option>
                <option value="vencida">🔴 Vencida</option>
              </select>
              <Filter className="w-3.5 h-3.5 text-indigo-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Ordenar por Select */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none pl-9 pr-8 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="fecha_limite">Fecha límite</option>
                <option value="recientes">Más recientes</option>
                <option value="antiguas">Más antiguas</option>
                <option value="materia">Materia</option>
                <option value="estado">Estado</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Quick Subject Chips Bar + View Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-thin">
            {subjectFilterChips.map((chip) => {
              const isSelected = selectedCourseFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => {
                    setSelectedCourseFilter(chip.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
                      : 'bg-slate-100/90 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{chip.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    isSelected 
                      ? 'bg-white/25 text-white' 
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {chip.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* View Switcher: Lista vs Grid */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={() => setViewMode('lista')}
              className={`p-1.5 rounded-xl transition-all ${
                viewMode === 'lista'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title="Vista en Lista / Tabla"
              aria-label="Vista Lista"
            >
              <ListIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-xl transition-all ${
                viewMode === 'grid'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title="Vista en Cuadrícula (Grid)"
              aria-label="Vista Grid"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. RENDERIZADO: VISTA EN GRID O VISTA EN TABLA
          ───────────────────────────────────────────────────────────────────────────── */}
      {paginatedTasks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-3 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="font-extrabold text-slate-800 dark:text-white text-base">
            TODAVÍA NO TIENES TAREAS
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No encontramos tareas con estos filtros o aún no has creado asignaciones para este periodo.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCourseFilter('todos');
                setSelectedStatusFilter('todos');
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            >
              Limpiar filtros
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm"
            >
              + Crear Nueva Tarea
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        
        /* ═══════════════════════════════════════════════════════════════════════════
           MODALIDAD 1: VISTA EN GRID (3 COLUMNAS RESPONSIVE MATCHING SCREENSHOT)
           ═══════════════════════════════════════════════════════════════════════════ */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in zoom-in-95 duration-150">
          {paginatedTasks.map((task) => {
            const { 
              subCount, 
              totalStudents, 
              status, 
              relativeDueText, 
              relativeDueClass, 
              dueDate,
              progressPct 
            } = getTaskMetrics(task);

            const visual = getSubjectVisual(task.curso?.nombre);
            const IconComponent = visual.icon;
            const remainingAvatarsCount = Math.max(totalStudents - 3, 0);

            return (
              <div
                key={task.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800/80 transition-all duration-200 flex flex-col justify-between group relative"
              >
                {/* ── Top Row: Subject, Date, Status & Menu ── */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    {/* Subject Icon + Name Badge */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${visual.iconContainer}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className={`px-2.5 py-0.8 rounded-xl text-[11px] font-bold border truncate ${visual.badgeClass}`}>
                        {task.curso?.nombre || 'General'}
                      </span>
                    </div>

                    {/* Deadline & Status Badge + Menu */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap" suppressHydrationWarning>
                        {dueDate.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border whitespace-nowrap ${relativeDueClass}`}>
                        {relativeDueText}
                      </span>

                      {/* Dropdown Menu Trigger */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setActiveMenuTaskId(activeMenuTaskId === task.id ? null : task.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {activeMenuTaskId === task.id && (
                          <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTaskForDetail(task);
                                setActiveMenuTaskId(null);
                              }}
                              className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                            >
                              <FileText className="w-3.5 h-3.5 text-slate-400" />
                              <span>Ver Detalle</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTaskForReview(task);
                                setActiveMenuTaskId(null);
                              }}
                              className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                            >
                              <Award className="w-3.5 h-3.5 text-blue-500" />
                              <span>Calificar Entregas</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                showToast('Función de duplicar tarea en preparación', 'info');
                                setActiveMenuTaskId(null);
                              }}
                              className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                            >
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              <span>Duplicar Tarea</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── Card Body: Title & Short Description ── */}
                  <div className="space-y-1.5 mb-5">
                    <button
                      type="button"
                      onClick={() => setSelectedTaskForDetail(task)}
                      className="font-extrabold text-sm text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 text-left line-clamp-1 transition-colors leading-snug cursor-pointer block w-full"
                    >
                      {task.titulo}
                    </button>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {task.descripcion}
                    </p>
                  </div>
                </div>

                {/* ── Card Bottom: Progress Bar & Student Avatars & CTA ── */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  {/* Progress Line */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        <Users className="w-3 h-3 text-indigo-500" />
                        <span>{subCount} de {totalStudents} entregas</span>
                      </span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">
                        {progressPct}%
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          progressPct === 100 
                            ? 'bg-emerald-500' 
                            : progressPct > 0 
                            ? 'bg-indigo-600' 
                            : status === 'vencida'
                            ? 'bg-rose-500'
                            : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Avatars Overlap Stack & Action Button */}
                  <div className="flex items-center justify-between gap-2">
                    {/* Avatars Stack */}
                    <div className="flex items-center">
                      <div className="flex -space-x-2 overflow-hidden">
                        {studentAvatarsSample.map((src, idx) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={idx}
                            src={src}
                            alt="Estudiante"
                            className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover"
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 ml-1.5">
                        +{remainingAvatarsCount}
                      </span>
                    </div>

                    {/* Action Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedTaskForReview(task)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Revisar Entregas</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (

        /* ═══════════════════════════════════════════════════════════════════════════
           MODALIDAD 2: VISTA EN TABLA / LISTA TRADICIONAL
           ═══════════════════════════════════════════════════════════════════════════ */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6 min-w-[280px]">
                    <div className="flex items-center gap-1.5 cursor-pointer hover:text-slate-600">
                      <span>TAREA / ASIGNACIÓN</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-4 px-4 min-w-[120px]">CURSO</th>
                  <th className="py-4 px-4 min-w-[170px]">
                    <div className="flex items-center gap-1.5 cursor-pointer hover:text-slate-600">
                      <span>FECHA LÍMITE</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-4 px-4 min-w-[130px]">
                    <div className="flex items-center gap-1.5 cursor-pointer hover:text-slate-600">
                      <span>ENTREGAS</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-4 px-4 min-w-[130px]">
                    <div className="flex items-center gap-1.5 cursor-pointer hover:text-slate-600">
                      <span>ESTADO</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-4 px-6 text-right min-w-[140px]">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedTasks.map((task) => {
                  const { 
                    subCount, 
                    totalStudents, 
                    status, 
                    relativeDueText, 
                    relativeDueClass, 
                    dueDate 
                  } = getTaskMetrics(task);

                  const visual = getSubjectVisual(task.curso?.nombre);
                  const IconComponent = visual.icon;

                  return (
                    <tr 
                      key={task.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Tarea / Asignación */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          {/* Subject Icon Box */}
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${visual.iconContainer}`}>
                            <IconComponent className="w-5 h-5" />
                          </div>

                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => setSelectedTaskForDetail(task)}
                              className="font-extrabold text-xs text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 text-left line-clamp-1 transition-colors cursor-pointer"
                            >
                              {task.titulo}
                            </button>
                            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 max-w-sm">
                              {task.descripcion}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Curso / Materia */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[11px] font-bold border ${visual.badgeClass}`}>
                          {task.curso?.nombre || 'General'}
                        </span>
                      </td>

                      {/* Fecha Límite */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 font-bold" suppressHydrationWarning>
                            <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span>
                              {dueDate.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="text-[10px] font-normal text-slate-400">
                              06:59 p. m.
                            </span>
                          </div>

                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border ${relativeDueClass}`}>
                            <Clock className="w-2.5 h-2.5" />
                            <span>{relativeDueText}</span>
                          </span>
                        </div>
                      </td>

                      {/* Entregas */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-black ${
                            subCount > 0 
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' 
                              : status === 'vencida'
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}>
                            {subCount} de {totalStudents} entregas
                          </span>
                          
                          {/* Mini Progress Bar */}
                          <div className="w-24 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                subCount === totalStudents 
                                  ? 'bg-emerald-500' 
                                  : subCount > 0 
                                  ? 'bg-indigo-500' 
                                  : 'bg-slate-300 dark:bg-slate-700'
                              }`}
                              style={{ width: `${(subCount / totalStudents) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-4 px-4">
                        {status === 'en_proceso' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>En proceso</span>
                          </span>
                        )}
                        {status === 'pendiente' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            <span>Pendiente</span>
                          </span>
                        )}
                        {status === 'vencida' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            <span>Vencida</span>
                          </span>
                        )}
                        {status === 'completada' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>Completada</span>
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedTaskForReview(task)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Revisar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          PAGINACIÓN & FOOTER (MATCHING SCREENSHOT)
          ───────────────────────────────────────────────────────────────────────────── */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div>
          Mostrando <span className="font-bold text-slate-700 dark:text-slate-200">{paginatedTasks.length}</span> de{' '}
          <span className="font-bold text-slate-700 dark:text-slate-200">{filteredTasks.length}</span> tareas
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx + 1}
              onClick={() => setCurrentPage(idx + 1)}
              className={`w-8 h-8 rounded-xl font-bold text-xs transition-all ${
                currentPage === idx + 1
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
              }`}
            >
              {idx + 1}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          4. MODAL: CREAR NUEVA TAREA (FLUIDO, MODERNO Y PASO A PASO)
          ───────────────────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Publicar Nueva Asignación Escolar"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Título */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                Título de la Tarea / Actividad *
              </label>
              <input
                required
                type="text"
                placeholder="Ej. Guía de Fracciones y Números Mixtos"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Materia Scoped */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                Curso o Materia Asignada *
              </label>
              <SearchableSelect
                value={formData.cursoId}
                onChange={(val) => setFormData({ ...formData, cursoId: val })}
                icon={<BookOpen className="w-4 h-4" />}
                options={teacherCourses.map((c) => ({
                  value: c.id,
                  label: c.nombre,
                  sublabel: `Código: ${c.codigo}`,
                }))}
                placeholder="Buscar materia..."
              />
            </div>

            {/* Sección Scoped */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-indigo-500" />
                Salón / Sección Asignada *
              </label>
              <SearchableSelect
                value={formData.seccionId}
                onChange={(val) => setFormData({ ...formData, seccionId: val })}
                icon={<School className="w-4 h-4" />}
                options={teacherSections.map((ts) => ({
                  value: ts.seccion.id,
                  label: `${ts.seccion.grado?.nombre || ''} "${ts.seccion.letra}"`,
                  sublabel: `Nivel ${ts.seccion.grado?.nivel || 'General'}`,
                }))}
                placeholder="Buscar salón..."
              />
            </div>

            {/* Fecha y Hora Límite */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                Fecha y Hora Límite *
              </label>
              <input
                required
                type="datetime-local"
                value={formData.fechaLimite}
                onChange={(e) => setFormData({ ...formData, fechaLimite: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Material Adjunto / URL */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-indigo-500" />
                Enlace a Material de Apoyo (Opcional)
              </label>
              <input
                type="url"
                placeholder="https://drive.google.com/..."
                value={formData.materialUrl}
                onChange={(e) => setFormData({ ...formData, materialUrl: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Instrucciones */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-indigo-500" />
              Instrucciones y Descripción para los Estudiantes *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Describe detalladamente los ejercicios o actividades que deben realizar los alumnos..."
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 resize-none font-normal"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                showToast('Borrador guardado localmente', 'info');
                setIsAddModalOpen(false);
              }}
              className="px-4 py-2 font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Guardar Borrador
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/25 transition-all active:scale-95 cursor-pointer"
              >
                Publicar Tarea
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────────────
          5. MODAL: DETALLE Y REVISIÓN DE ENTREGAS (LISTA DE ESTUDIANTES)
          ───────────────────────────────────────────────────────────────────────────── */}
      {selectedTaskForReview && (
        <Modal
          isOpen={!!selectedTaskForReview}
          onClose={() => setSelectedTaskForReview(null)}
          title={`Entregas: ${selectedTaskForReview.titulo}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            {/* Task Info Pill */}
            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-indigo-900 dark:text-indigo-200">
                  {selectedTaskForReview.curso?.nombre}
                </span>
                <span className="text-[11px] font-semibold text-slate-500" suppressHydrationWarning>
                  Límite: {new Date(selectedTaskForReview.fecha_limite).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                {selectedTaskForReview.descripcion}
              </p>
            </div>

            {/* Students Deliveries Table */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {(
                enrollments.filter(e => !selectedTaskForReview.seccion_id || e.seccion_id === selectedTaskForReview.seccion_id).length > 0
                  ? enrollments.filter(e => !selectedTaskForReview.seccion_id || e.seccion_id === selectedTaskForReview.seccion_id)
                  : enrollments.slice(0, 11)
              ).map((enr) => {
                const sub = submissions.find(
                  s => s.tarea_id === selectedTaskForReview.id && s.matricula_id === enr.id
                );
                const studentName = `${enr.estudiante?.profile?.apellidos || ''}, ${enr.estudiante?.profile?.nombres || ''}`;

                return (
                  <div
                    key={enr.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={enr.estudiante?.profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                        alt={studentName}
                        className="w-9 h-9 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                      />
                      <div className="space-y-1">
                        <p className="font-extrabold text-slate-800 dark:text-white">{studentName}</p>
                        <p className="text-[10px] text-slate-400">
                          {sub ? `Entregado el ${new Date(sub.fecha_entrega).toLocaleString('es-PE')}` : 'Sin entrega registrada'}
                        </p>

                        {sub?.archivo_nombre && (
                          <a
                            href={sub.archivo_url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-bold hover:bg-blue-100"
                          >
                            <Paperclip className="w-3 h-3 text-blue-600" />
                            <span className="truncate max-w-[180px]">{sub.archivo_nombre}</span>
                          </a>
                        )}

                        {sub?.comentario_estudiante && (
                          <p className="text-[11px] text-slate-500 italic max-w-sm">
                            &quot;{sub.comentario_estudiante}&quot;
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {sub?.calificacion_letra ? (
                        <GradeBadge grade={sub.calificacion_letra} size="sm" />
                      ) : (
                        <span className="text-[10px] text-amber-600 font-bold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-200">
                          Pendiente
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          setGradingSubmission({
                            tareaId: selectedTaskForReview.id,
                            matriculaId: enr.id,
                            studentName,
                            studentAvatar: enr.estudiante?.profile?.avatar_url,
                            currentGrade: sub?.calificacion_letra,
                            retroalimentacion: sub?.retroalimentacion_docente,
                            comentarioEstudiante: sub?.comentario_estudiante,
                            archivoUrl: sub?.archivo_url,
                            archivoNombre: sub?.archivo_nombre,
                            archivoTamano: sub?.archivo_tamano,
                          })
                        }
                        className="px-3.5 py-1.5 rounded-xl font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 text-[11px] transition-all cursor-pointer"
                      >
                        Calificar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          6. MODAL: CALIFICAR Y EVALUAR ENTREGA ESPECÍFICA
          ───────────────────────────────────────────────────────────────────────────── */}
      {gradingSubmission && (
        <Modal
          isOpen={!!gradingSubmission}
          onClose={() => setGradingSubmission(null)}
          title={`Calificar Entrega: ${gradingSubmission.studentName}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={gradingSubmission.studentAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                alt={gradingSubmission.studentName}
                className="w-10 h-10 rounded-xl object-cover"
              />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Estudiante</span>
                <p className="text-xs font-bold text-slate-800 dark:text-white">{gradingSubmission.studentName}</p>
              </div>
            </div>

            {/* Student Attached File and Comment */}
            {(gradingSubmission.archivoNombre || gradingSubmission.comentarioEstudiante) && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Material Entregado
                </span>
                {gradingSubmission.archivoNombre && (
                  <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {gradingSubmission.archivoNombre}
                      </span>
                    </div>
                    {gradingSubmission.archivoUrl && (
                      <a
                        href={gradingSubmission.archivoUrl}
                        download={gradingSubmission.archivoNombre}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-[11px] hover:bg-blue-100 shrink-0 flex items-center gap-1"
                      >
                        Descargar
                      </a>
                    )}
                  </div>
                )}
                {gradingSubmission.comentarioEstudiante && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                    &quot;{gradingSubmission.comentarioEstudiante}&quot;
                  </p>
                )}
              </div>
            )}

            {/* Escala CNEB Selector */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2 text-center">
                Calificación Oficial MINEDU (Escala AD, A, B, C):
              </label>
              <div className="flex justify-center">
                <GradeSelector
                  value={gradingSubmission.currentGrade}
                  onChange={(grade) => handleSaveGrade(grade, gradingSubmission.retroalimentacion)}
                />
              </div>
            </div>

            {/* Retroalimentación Cualitativa */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Retroalimentación Docente:
              </label>
              <textarea
                rows={3}
                placeholder="Escribe tus observaciones pedagógicas o recomendaciones de mejora..."
                value={gradingSubmission.retroalimentacion || ''}
                onChange={(e) =>
                  setGradingSubmission({
                    ...gradingSubmission,
                    retroalimentacion: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setGradingSubmission(null)}
                className="px-4 py-2 font-bold text-slate-600 rounded-xl"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSaveGrade(
                    gradingSubmission.currentGrade || 'A',
                    gradingSubmission.retroalimentacion
                  )
                }
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow cursor-pointer"
              >
                Guardar Evaluación
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          7. DRAWER / MODAL: DETALLE COMPLETO DE TAREA
          ───────────────────────────────────────────────────────────────────────────── */}
      {selectedTaskForDetail && (
        <Modal
          isOpen={!!selectedTaskForDetail}
          onClose={() => setSelectedTaskForDetail(null)}
          title="Ficha Detallada de la Asignación"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="font-bold text-xs px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                {selectedTaskForDetail.curso?.nombre}
              </span>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                {selectedTaskForDetail.titulo}
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                {selectedTaskForDetail.descripcion}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block">Fecha Límite:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {new Date(selectedTaskForDetail.fecha_limite).toLocaleString('es-PE')}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block">Entregas Recibidas:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {submissions.filter(s => s.tarea_id === selectedTaskForDetail.id).length} estudiantes
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedTaskForDetail(null)}
                className="px-4 py-2 font-bold text-slate-500 rounded-xl hover:bg-slate-100"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  const t = selectedTaskForDetail;
                  setSelectedTaskForDetail(null);
                  setSelectedTaskForReview(t);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow cursor-pointer"
              >
                Ver Entregas
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}

