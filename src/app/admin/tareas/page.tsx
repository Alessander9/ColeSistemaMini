'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Modal } from '@/components/ui/Modal';
import { TaskAssignment, TaskSubmission, Course, Section } from '@/types';
import { 
  Plus, 
  BookOpen, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  FileText, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Eye, 
  AlertCircle, 
  X, 
  Users, 
  LayoutGrid, 
  List as ListIcon,
  Layers,
  Award,
  Download,
  School,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AdminTareasPage() {
  const { 
    tasks, 
    addTask, 
    submissions, 
    courses, 
    enrollments, 
    sections,
    gradeLevels,
    showToast 
  } = useApp();

  // Dual View Mode: Grid (Active by default) & List
  const [viewMode, setViewMode] = useState<'grid' | 'lista'>('grid');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState('todos');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('todos');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState('todos');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('todos');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('todos');
  const [sortBy, setSortBy] = useState<'fecha_limite' | 'recientes' | 'materia'>('fecha_limite');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === 'grid' ? 6 : 10;

  // Active Modals & Detail
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<TaskAssignment | null>(null);

  // New Task Form
  const [formData, setFormData] = useState({
    cursoId: courses[0]?.id || '',
    seccionId: sections[0]?.id || '',
    titulo: '',
    descripcion: '',
    fechaLimite: '2026-09-30T18:00',
    materialUrl: '',
  });

  // Helper to compute task status and delivery metrics
  const getTaskMetrics = (task: TaskAssignment) => {
    const targetSectionId = task.seccion_id;
    const sectionStudents = targetSectionId
      ? enrollments.filter(e => e.seccion_id === targetSectionId && e.estado === 'activo')
      : [];
    const totalStudents = sectionStudents.length > 0 ? sectionStudents.length : 0;
    
    const taskSubs = submissions.filter(s => s.tarea_id === task.id);
    const gradedSubs = taskSubs.filter(s => !!s.calificacion_letra);
    const subCount = taskSubs.length;

    const dueDate = new Date(task.fecha_limite);
    const now = new Date(); // Fix 1.3: Usar fecha real del sistema
    const isPastDue = dueDate < now;

    let computedStatus: 'completada' | 'en_proceso' | 'pendiente' | 'vencida' = 'pendiente';
    if (subCount === totalStudents && gradedSubs.length === totalStudents) {
      computedStatus = 'completada';
    } else if (isPastDue) {
      computedStatus = 'vencida';
    } else if (subCount > 0) {
      computedStatus = 'en_proceso';
    } else {
      computedStatus = 'pendiente';
    }

    const progressPct = totalStudents > 0 ? Math.round((subCount / totalStudents) * 100) : 0;

    return {
      totalStudents,
      subCount,
      gradedCount: gradedSubs.length,
      status: computedStatus,
      progressPct,
      dueDate
    };
  };

  // KPIs
  const kpis = useMemo(() => {
    const total = tasks.length;
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

    const completionRate = total > 0 ? Math.round((completadas / total) * 100) : 0;

    return {
      total,
      completadas,
      enProceso,
      pendientes,
      vencidas,
      completionRate
    };
  }, [tasks, submissions]);

  // Section options based on level & grade
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

  // Filtered & sorted tasks
  const filteredTasks = useMemo(() => {
    let list = tasks.filter(t => {
      const matchQuery = !searchQuery || 
        `${t.titulo} ${t.descripcion} ${t.curso?.nombre || ''}`.toLowerCase().includes(searchQuery.toLowerCase());
      
      const sec = sections.find(s => s.id === t.seccion_id);
      const matchLevel = selectedLevelFilter === 'todos' || sec?.grado?.nivel === selectedLevelFilter;
      const matchGrade = selectedGradeFilter === 'todos' || sec?.grado_id === selectedGradeFilter;
      const matchSection = selectedSectionFilter === 'todos' || t.seccion_id === selectedSectionFilter;
      const matchCourse = selectedCourseFilter === 'todos' || t.curso_id === selectedCourseFilter;

      const { status } = getTaskMetrics(t);
      const matchStatus = selectedStatusFilter === 'todos' || status === selectedStatusFilter;

      return matchQuery && matchLevel && matchGrade && matchSection && matchCourse && matchStatus;
    });

    list.sort((a, b) => {
      if (sortBy === 'fecha_limite') return new Date(a.fecha_limite).getTime() - new Date(b.fecha_limite).getTime();
      if (sortBy === 'recientes') return new Date(b.created_at || b.fecha_limite).getTime() - new Date(a.created_at || a.fecha_limite).getTime();
      if (sortBy === 'materia') return (a.curso?.nombre || '').localeCompare(b.curso?.nombre || '');
      return 0;
    });

    return list;
  }, [tasks, searchQuery, selectedLevelFilter, selectedGradeFilter, selectedSectionFilter, selectedCourseFilter, selectedStatusFilter, sortBy, sections, submissions]);

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage) || 1;
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTasks.slice(start, start + itemsPerPage);
  }, [filteredTasks, currentPage, itemsPerPage]);

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

    confetti({ particleCount: 35, spread: 50, origin: { y: 0.7 } });
    showToast(`Tarea institucional publicada: "${formData.titulo}"`, 'success', 'Supervisión');
    setIsAddModalOpen(false);

    setFormData({
      cursoId: courses[0]?.id || '',
      seccionId: sections[0]?.id || '',
      titulo: '',
      descripcion: '',
      fechaLimite: '2026-09-30T18:00',
      materialUrl: '',
    });
  };

  const getSectionLabel = (seccionId?: string) => {
    const sec = sections.find(s => s.id === seccionId);
    if (!sec) return 'Sección no asignada';
    return `${sec.grado?.nombre || ''} "${sec.letra}" (${sec.grado?.nivel.toUpperCase()})`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in-50 duration-200">
      
      {/* ── 1. HEADER SUPERVISIÓN LMS ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Supervisión de Tareas & Entregas LMS
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200">
                LMS Global
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Monitorea el cumplimiento de asignaciones escolares y el porcentaje de entrega por aula.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm shadow-xl shadow-blue-600/25 transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Crear Asignación</span>
          </button>
        </div>
      </div>

      {/* ── 2. KPIS DE ENTREGA ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Total de Tareas</span>
            <FileText className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">{kpis.total}</div>
          <span className="text-[11px] font-semibold text-slate-500">Asignaciones en curso</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Completadas al 100%</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{kpis.completadas}</div>
          <span className="text-[11px] font-semibold text-slate-500">Con entregas calificadas</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">En Proceso</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">{kpis.enProceso}</div>
          <span className="text-[11px] font-semibold text-slate-500">Recibiendo entregas</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Pendientes / Sin envío</span>
            <AlertCircle className="w-5 h-5 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">{kpis.pendientes}</div>
          <span className="text-[11px] font-semibold text-slate-500">Esperando respuesta</span>
        </div>
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
              placeholder="Buscar tarea por título o curso..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
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
              <option value="todos">🏛️ Todos los Niveles</option>
              <option value="inicial">🧸 Inicial</option>
              <option value="primaria">📚 Primaria</option>
              <option value="secundaria">🎓 Secundaria</option>
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
              <option value="todos">📖 Todos los Grados</option>
              {availableGrades.map(g => (
                <option key={g.id} value={g.id}>{g.nombre} ({g.nivel.toUpperCase()})</option>
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
              <option value="todos">🏫 Todas las Secciones</option>
              {availableSections.map(s => (
                <option key={s.id} value={s.id}>{s.grado?.nombre} &quot;{s.letra}&quot;</option>
              ))}
            </select>
          </div>
        </div>

        {/* Second Filter Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedStatusFilter}
              onChange={(e) => {
                setSelectedStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none"
            >
              <option value="todos">Todos los Estados</option>
              <option value="completada">Completadas</option>
              <option value="en_proceso">En Proceso</option>
              <option value="pendiente">Pendientes</option>
              <option value="vencida">Vencidas</option>
            </select>

            <select
              value={selectedCourseFilter}
              onChange={(e) => {
                setSelectedCourseFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none"
            >
              <option value="todos">Todos los Cursos</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.nombre} ({c.nivel.toUpperCase()})</option>
              ))}
            </select>

            <span className="text-xs font-bold text-slate-400 pl-2">
              {filteredTasks.length} tareas encontradas
            </span>
          </div>

          {/* View switcher */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('lista')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === 'lista'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Vista Lista"
            >
              <ListIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-xs'
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
      {paginatedTasks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-500 mx-auto flex items-center justify-center">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-slate-800 dark:text-white">
            No encontramos tareas con los filtros actuales
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Prueba seleccionando otro nivel, grado o sección.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedTasks.map((task) => {
            const { subCount, totalStudents, progressPct, dueDate, status } = getTaskMetrics(task);
            return (
              <div
                key={task.id}
                onClick={() => setSelectedTaskForDetail(task)}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-800 transition-all duration-200 flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200/60">
                      {task.curso?.nombre || 'General'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                      status === 'completada' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      status === 'en_proceso' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      status === 'vencida' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors mb-1.5">
                    {task.titulo}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                    {task.descripcion}
                  </p>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-500">Aula:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{getSectionLabel(task.seccion_id)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-500">Entrega de Alumnos:</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{subCount} de {totalStudents} ({progressPct}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    Vence: {dueDate.toLocaleDateString('es-PE')}
                  </span>
                  <button
                    type="button"
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:underline"
                  >
                    Detalle →
                  </button>
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
                  <th className="py-3 px-4">Tarea & Materia</th>
                  <th className="py-3 px-4">Aula Destino</th>
                  <th className="py-3 px-4">Avance Entregas</th>
                  <th className="py-3 px-4">Fecha Límite</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedTasks.map((task) => {
                  const { subCount, totalStudents, progressPct, dueDate, status } = getTaskMetrics(task);
                  return (
                    <tr key={task.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{task.titulo}</div>
                        <div className="text-[11px] text-blue-600 font-semibold">{task.curso?.nombre}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {getSectionLabel(task.seccion_id)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{subCount} / {totalStudents} ({progressPct}%)</div>
                        <div className="w-24 h-1 bg-slate-200 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-blue-600" style={{ width: `${progressPct}%` }} />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {dueDate.toLocaleDateString('es-PE')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          status === 'completada' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          status === 'en_proceso' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedTaskForDetail(task)}
                          className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-100"
                        >
                          Ver
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

      {/* ── 5. MODAL CREAR TAREA (SUPERVISIÓN) ── */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Crear Tarea Escolar (Supervisión LMS)"
        >
          <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Título de la Asignación *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Guía Práctica de Ecuaciones Lineales"
                value={formData.titulo}
                onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white"
              />
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

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Fecha & Hora Límite
              </label>
              <input
                type="datetime-local"
                value={formData.fechaLimite}
                onChange={(e) => setFormData(prev => ({ ...prev, fechaLimite: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Indicaciones y Criterios
              </label>
              <textarea
                rows={3}
                required
                placeholder="Describe la consigna para los estudiantes..."
                value={formData.descripcion}
                onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Enlace / Material de Apoyo (Opcional)
              </label>
              <input
                type="url"
                placeholder="https://drive.google.com/..."
                value={formData.materialUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, materialUrl: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md"
              >
                Publicar Asignación
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── 6. MODAL DETALLE DE TAREA ── */}
      {selectedTaskForDetail && (
        <Modal
          isOpen={!!selectedTaskForDetail}
          onClose={() => setSelectedTaskForDetail(null)}
          title="Supervisión de Tarea Escolar"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50">
              <span className="text-xs font-black text-blue-700 dark:text-blue-300 uppercase">
                {selectedTaskForDetail.curso?.nombre}
              </span>
              <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">
                {selectedTaskForDetail.titulo}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                {selectedTaskForDetail.descripcion}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">AULA</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{getSectionLabel(selectedTaskForDetail.seccion_id)}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">FECHA LÍMITE</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {new Date(selectedTaskForDetail.fecha_limite).toLocaleString('es-PE')}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedTaskForDetail(null)}
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
