'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Modal } from '@/components/ui/Modal';
import { TaskAssignment } from '@/types';
import { useAulaColors, sortSections } from '@/hooks/useAulaColors';
import {
  Plus,
  Clock,
  Calendar,
  CheckCircle2,
  FileText,
  Search,
  AlertCircle,
  Users,
  LayoutGrid,
  List as ListIcon,
  Download,
  Send,
  Inbox,
  ClipboardCheck,
  Link as LinkIcon,
  ChevronDown,
  X,
  UserCheck,
  UserX,
  GraduationCap,
} from 'lucide-react';
import confetti from 'canvas-confetti';

type TaskStatus = 'completada' | 'en_proceso' | 'pendiente' | 'vencida';
type StatusFilter = 'todos' | TaskStatus | 'por_calificar';

// Nombres en lenguaje sencillo para el cliente
const STATUS_INFO: Record<TaskStatus, { label: string; chip: string; bar: string }> = {
  en_proceso: { label: 'Recibiendo entregas', chip: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900', bar: 'bg-blue-500' },
  pendiente: { label: 'Sin entregas aún', chip: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700', bar: 'bg-slate-400' },
  vencida: { label: 'Plazo vencido', chip: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900', bar: 'bg-rose-500' },
  completada: { label: 'Completa', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900', bar: 'bg-emerald-500' },
};

const LEVELS = [
  { id: 'todos', label: 'Todos' },
  { id: 'inicial', label: 'Inicial' },
  { id: 'primaria', label: 'Primaria' },
  { id: 'secundaria', label: 'Secundaria' },
];

const PAGE_SIZE = 12;

// Fecha local "YYYY-MM-DDTHH:mm" para el input datetime-local (sin toISOString: Perú es UTC−5)
const toLocalInput = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
const defaultDue = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setHours(18, 0, 0, 0);
  return toLocalInput(d);
};

// "Vence hoy", "Vence en 3 días", "Venció hace 2 días"
const dueInWords = (due: Date) => {
  const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((start(due) - start(new Date())) / 86400000);
  const past = due.getTime() < Date.now();
  if (days === 0) return past ? 'Venció hoy' : 'Vence hoy';
  if (days === 1) return 'Vence mañana';
  if (days === -1) return 'Venció ayer';
  if (days > 1) return `Vence en ${days} días`;
  return `Venció hace ${-days} días`;
};

const niceDate = (d: Date) =>
  d.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' }) +
  ' · ' + d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

export default function AdminTareasPage() {
  const {
    tasks,
    addTask,
    submissions,
    courses,
    enrollments,
    sections,
    sectionCourses,
    users,
    students,
  } = useApp();
  const aulaColor = useAulaColors();

  const [viewMode, setViewMode] = useState<'grid' | 'lista'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('todos');
  const [sectionFilter, setSectionFilter] = useState('todos');
  const [courseFilter, setCourseFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [sortBy, setSortBy] = useState<'fecha_limite' | 'recientes' | 'avance'>('fecha_limite');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<TaskAssignment | null>(null);
  const [detailTab, setDetailTab] = useState<'entregaron' | 'faltan'>('entregaron');

  const emptyForm = () => ({ seccionId: '', cursoId: '', titulo: '', descripcion: '', fechaLimite: defaultDue(), materialUrl: '' });
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [searchQuery, levelFilter, sectionFilter, courseFilter, statusFilter, sortBy]);

  // ── Ayudas ──
  const orderedSections = useMemo(() => sortSections(sections), [sections]);
  const sectionOf = (id?: string) => sections.find(s => s.id === id);
  const levelOf = (id?: string) => sectionOf(id)?.grado?.nivel || '';
  const sectionLabel = (id?: string) => {
    const sec = sectionOf(id);
    return sec ? `${sec.grado?.nombre || 'Grado'} "${sec.letra}"` : 'Aula no asignada';
  };
  const courseName = (t: TaskAssignment) => t.curso?.nombre || courses.find(c => c.id === t.curso_id)?.nombre || 'Curso';
  const teacherName = (id?: string) => {
    const u = users.find(x => x.id === id);
    if (!u) return 'Sin docente';
    if (u.rol === 'admin') return 'Dirección';
    return `${u.nombres || ''} ${u.apellidos || ''}`.trim() || 'Docente';
  };
  const studentName = (studentId: string) => {
    const st = students.find(x => x.id === studentId);
    const n = `${st?.profile?.apellidos || st?.apellidos || ''}, ${st?.profile?.nombres || st?.nombres || ''}`;
    return n.replace(/^, |, $/g, '') || 'Alumno';
  };

  // Métricas de cada tarea (entregas y estado)
  const metricsById = useMemo(() => {
    const map = new Map<string, {
      totalStudents: number; subCount: number; gradedCount: number; toGrade: number;
      status: TaskStatus; progressPct: number; dueDate: Date;
    }>();
    const now = Date.now();
    const studentsBySection = new Map<string, number>();
    enrollments.forEach(e => { if (e.estado === 'activo') studentsBySection.set(e.seccion_id, (studentsBySection.get(e.seccion_id) || 0) + 1); });
    const subsByTask = new Map<string, typeof submissions>();
    submissions.forEach(s => subsByTask.set(s.tarea_id, [...(subsByTask.get(s.tarea_id) || []), s]));
    tasks.forEach(task => {
      const totalStudents = studentsBySection.get(task.seccion_id) || 0;
      const subs = subsByTask.get(task.id) || [];
      const gradedCount = subs.filter(s => !!s.calificacion_letra).length;
      const subCount = subs.length;
      const dueDate = new Date(task.fecha_limite);
      let status: TaskStatus = 'pendiente';
      if (totalStudents > 0 && subCount >= totalStudents && gradedCount >= totalStudents) status = 'completada';
      else if (dueDate.getTime() < now) status = 'vencida';
      else if (subCount > 0) status = 'en_proceso';
      map.set(task.id, {
        totalStudents, subCount, gradedCount, toGrade: subCount - gradedCount, status, dueDate,
        progressPct: totalStudents > 0 ? Math.min(100, Math.round((subCount / totalStudents) * 100)) : 0,
      });
    });
    return map;
  }, [tasks, submissions, enrollments]);
  const metricsOf = (t: TaskAssignment) => metricsById.get(t.id)!;

  // Resumen superior (cada tarjeta también es un filtro)
  const summary = useMemo(() => {
    const c = { todos: tasks.length, en_proceso: 0, pendiente: 0, vencida: 0, completada: 0, por_calificar: 0, entregas: 0, esperadas: 0 };
    tasks.forEach(t => {
      const m = metricsById.get(t.id);
      if (!m) return;
      c[m.status]++;
      if (m.toGrade > 0) c.por_calificar++;
      c.entregas += m.subCount;
      c.esperadas += m.totalStudents;
    });
    return c;
  }, [tasks, metricsById]);
  const globalPct = summary.esperadas > 0 ? Math.round((summary.entregas / summary.esperadas) * 100) : 0;

  const sectionOptions = useMemo(
    () => orderedSections.filter(s => levelFilter === 'todos' || s.grado?.nivel === levelFilter),
    [orderedSections, levelFilter]
  );
  const courseOptions = useMemo(() => {
    const used = new Set(tasks.map(t => t.curso_id));
    return courses
      .filter(c => used.has(c.id) && (levelFilter === 'todos' || c.nivel === levelFilter))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [courses, tasks, levelFilter]);

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = tasks.filter(t => {
      const m = metricsById.get(t.id);
      if (!m) return false;
      if (q && !`${t.titulo} ${t.descripcion} ${courseName(t)} ${sectionLabel(t.seccion_id)} ${teacherName(t.docente_id)}`.toLowerCase().includes(q)) return false;
      if (levelFilter !== 'todos' && levelOf(t.seccion_id) !== levelFilter) return false;
      if (sectionFilter !== 'todos' && t.seccion_id !== sectionFilter) return false;
      if (courseFilter !== 'todos' && t.curso_id !== courseFilter) return false;
      if (statusFilter === 'por_calificar') return m.toGrade > 0;
      if (statusFilter !== 'todos' && m.status !== statusFilter) return false;
      return true;
    });
    list.sort((a, b) => {
      if (sortBy === 'recientes') return new Date(b.created_at || b.fecha_limite).getTime() - new Date(a.created_at || a.fecha_limite).getTime();
      if (sortBy === 'avance') return metricsOf(a).progressPct - metricsOf(b).progressPct;
      // Primero las que vencen pronto; las vencidas al final
      const ma = metricsOf(a), mb = metricsOf(b);
      const pa = ma.status === 'vencida' || ma.status === 'completada' ? 1 : 0;
      const pb = mb.status === 'vencida' || mb.status === 'completada' ? 1 : 0;
      if (pa !== pb) return pa - pb;
      return pa === 0 ? ma.dueDate.getTime() - mb.dueDate.getTime() : mb.dueDate.getTime() - ma.dueDate.getTime();
    });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, metricsById, searchQuery, levelFilter, sectionFilter, courseFilter, statusFilter, sortBy, sections, users, courses]);

  const visibleTasks = filteredTasks.slice(0, visibleCount);
  const hasFilters = !!searchQuery || levelFilter !== 'todos' || sectionFilter !== 'todos' || courseFilter !== 'todos' || statusFilter !== 'todos';
  const clearFilters = () => {
    setSearchQuery(''); setLevelFilter('todos'); setSectionFilter('todos'); setCourseFilter('todos'); setStatusFilter('todos');
  };

  // ── Crear tarea ──
  const formSection = sectionOf(formData.seccionId);
  const formCourses = useMemo(() => {
    if (!formData.seccionId) return [];
    const assigned = sectionCourses.filter(sc => sc.seccion_id === formData.seccionId);
    if (assigned.length > 0) {
      return assigned
        .map(sc => ({ course: courses.find(c => c.id === sc.curso_id), docenteId: sc.docente_id }))
        .filter((x): x is { course: NonNullable<typeof x.course>; docenteId: string } => !!x.course)
        .sort((a, b) => a.course.nombre.localeCompare(b.course.nombre));
    }
    const nivel = formSection?.grado?.nivel;
    return courses.filter(c => !nivel || c.nivel === nivel).map(c => ({ course: c, docenteId: '' }));
  }, [formData.seccionId, sectionCourses, courses, formSection]);
  const formDocente = formCourses.find(x => x.course.id === formData.cursoId)?.docenteId;
  const formStudents = formData.seccionId ? enrollments.filter(e => e.seccion_id === formData.seccionId && e.estado === 'activo').length : 0;
  const formDueIsPast = !!formData.fechaLimite && new Date(formData.fechaLimite).getTime() < Date.now();

  const openCreate = (seccionId = '') => {
    setFormData({ ...emptyForm(), seccionId });
    setIsAddModalOpen(true);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.seccionId || !formData.cursoId || !formData.titulo.trim() || !formData.descripcion.trim() || formDueIsPast) return;
    addTask({
      cursoId: formData.cursoId,
      seccionId: formData.seccionId,
      titulo: formData.titulo.trim(),
      descripcion: formData.descripcion.trim(),
      fechaLimite: new Date(formData.fechaLimite).toISOString(),
      archivoUrl: formData.materialUrl.trim() || undefined,
      docenteId: formDocente || undefined,
    });
    confetti({ particleCount: 35, spread: 50, origin: { y: 0.7 } });
    setIsAddModalOpen(false);
    setFormData(emptyForm());
  };

  // ── Exportar CSV (lo que se ve con los filtros actuales) ──
  const exportCsv = () => {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = [['Tarea', 'Curso', 'Aula', 'Docente', 'Fecha límite', 'Entregaron', 'Alumnos', 'Calificadas', 'Estado']];
    filteredTasks.forEach(t => {
      const m = metricsOf(t);
      rows.push([t.titulo, courseName(t), sectionLabel(t.seccion_id), teacherName(t.docente_id), m.dueDate.toLocaleString('es-PE'), String(m.subCount), String(m.totalStudents), String(m.gradedCount), STATUS_INFO[m.status].label]);
    });
    const blob = new Blob(['﻿' + rows.map(r => r.map(esc).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tareas-${toLocalInput(new Date()).slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // ── Detalle: quién entregó y quién falta ──
  const detail = useMemo(() => {
    if (!detailTask) return null;
    const roster = enrollments.filter(e => e.seccion_id === detailTask.seccion_id && e.estado === 'activo');
    const subs = submissions.filter(s => s.tarea_id === detailTask.id);
    const delivered = roster
      .map(enr => ({ enr, sub: subs.find(s => s.matricula_id === enr.id) }))
      .filter(x => !!x.sub)
      .map(x => ({ id: x.enr.id, name: studentName(x.enr.estudiante_id), sub: x.sub! }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const missing = roster
      .filter(enr => !subs.some(s => s.matricula_id === enr.id))
      .map(enr => ({ id: enr.id, name: studentName(enr.estudiante_id) }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return { delivered, missing };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailTask, enrollments, submissions, students]);

  const openDetail = (t: TaskAssignment) => {
    setDetailTask(t);
    setDetailTab(metricsOf(t).subCount > 0 ? 'entregaron' : 'faltan');
  };

  const summaryCards: { id: StatusFilter; label: string; hint: string; value: number; icon: typeof FileText; tone: string; ring: string }[] = [
    { id: 'todos', label: 'Todas las tareas', hint: 'publicadas este año', value: summary.todos, icon: FileText, tone: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300', ring: 'ring-indigo-500' },
    { id: 'en_proceso', label: 'Recibiendo entregas', hint: 'aún dentro del plazo', value: summary.en_proceso, icon: Inbox, tone: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300', ring: 'ring-blue-500' },
    { id: 'pendiente', label: 'Sin entregas aún', hint: 'nadie ha entregado', value: summary.pendiente, icon: Clock, tone: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300', ring: 'ring-amber-500' },
    { id: 'por_calificar', label: 'Por calificar', hint: 'tienen entregas sin nota', value: summary.por_calificar, icon: ClipboardCheck, tone: 'bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300', ring: 'ring-violet-500' },
    { id: 'vencida', label: 'Plazo vencido', hint: 'cerraron incompletas', value: summary.vencida, icon: AlertCircle, tone: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300', ring: 'ring-rose-500' },
    { id: 'completada', label: 'Completas', hint: 'todos entregaron y tienen nota', value: summary.completada, icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300', ring: 'ring-emerald-500' },
  ];

  const selectCls = 'w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer';
  const inputCls = 'w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500';

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12 animate-in fade-in-50 duration-200">

      {/* ══════════ 1. ENCABEZADO ══════════ */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-500" />
        <div className="p-5 sm:p-6 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-8 h-8 text-indigo-600" /> Tareas
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
                Aquí ves todas las tareas que los docentes dejan a sus aulas y cuántos alumnos ya las entregaron. Toca una tarea para ver quién entregó y quién falta.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button type="button" onClick={exportCsv} disabled={filteredTasks.length === 0} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:border-slate-400 disabled:opacity-50 cursor-pointer">
                <Download className="w-4 h-4" /> Descargar lista
              </button>
              <button type="button" onClick={() => openCreate()} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black shadow-md shadow-indigo-600/20 cursor-pointer">
                <Plus className="w-4 h-4 stroke-[3]" /> Nueva tarea
              </button>
            </div>
          </div>

          {/* Cómo funciona, en tres pasos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { n: 1, icon: Send, title: 'El docente publica', text: 'La tarea llega a todos los alumnos del aula.' },
              { n: 2, icon: Inbox, title: 'Los alumnos entregan', text: 'Suben su trabajo antes de la fecha límite.' },
              { n: 3, icon: ClipboardCheck, title: 'El docente califica', text: 'Pone AD, A, B o C a cada entrega.' },
            ].map(s => (
              <div key={s.n} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-indigo-600 shrink-0"><s.icon className="w-4 h-4" /></span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100"><span className="text-indigo-600 mr-1">{s.n}.</span>{s.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{s.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Avance general de entregas */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
            <div className="flex items-center gap-3 shrink-0">
              <span className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center"><UserCheck className="w-5 h-5" /></span>
              <div>
                <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300">Entregas recibidas en total</p>
                <p className="text-xl font-black text-slate-900 dark:text-white leading-tight">{summary.entregas} de {summary.esperadas}</p>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="h-2.5 rounded-full bg-white dark:bg-slate-800 overflow-hidden border border-indigo-100 dark:border-indigo-900/50">
                <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${globalPct}%` }} />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5">
                {summary.esperadas > 0 ? <>El <strong>{globalPct}%</strong> de los trabajos esperados ya fue entregado.</> : 'Cuando se publiquen tareas verás aquí el avance.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ 2. RESUMEN (también son filtros) ══════════ */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {summaryCards.map(k => {
          const active = statusFilter === k.id;
          return (
            <button
              key={k.id}
              type="button"
              onClick={() => setStatusFilter(active && k.id !== 'todos' ? 'todos' : k.id)}
              aria-pressed={active}
              className={`text-left p-4 rounded-2xl bg-white dark:bg-slate-900 border shadow-xs transition-all cursor-pointer hover:shadow-md ${active ? `border-transparent ring-2 ${k.ring}` : 'border-slate-200/80 dark:border-slate-800'}`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${k.tone}`}><k.icon className="w-5 h-5" /></span>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{k.value}</p>
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-2">{k.label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{k.hint}</p>
            </button>
          );
        })}
      </div>

      {/* ══════════ 3. BUSCAR Y FILTRAR ══════════ */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por tarea, curso, aula o docente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${inputCls} pl-10`}
            />
          </div>
          <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 overflow-x-auto">
            {LEVELS.map(l => (
              <button
                key={l.id}
                type="button"
                onClick={() => { setLevelFilter(l.id); setSectionFilter('todos'); setCourseFilter('todos'); }}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap cursor-pointer transition-all ${levelFilter === l.id ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} className={selectCls} aria-label="Aula">
            <option value="todos">Todas las aulas</option>
            {sectionOptions.map(s => <option key={s.id} value={s.id}>{sectionLabel(s.id)}</option>)}
          </select>
          <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className={selectCls} aria-label="Curso">
            <option value="todos">Todos los cursos</option>
            {courseOptions.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className={selectCls} aria-label="Ordenar">
            <option value="fecha_limite">Ordenar: vencen primero</option>
            <option value="recientes">Ordenar: más recientes</option>
            <option value="avance">Ordenar: menos entregas primero</option>
          </select>
        </div>

        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 flex-wrap text-sm text-slate-600 dark:text-slate-300">
            <span><strong className="text-slate-900 dark:text-white">{filteredTasks.length}</strong> {filteredTasks.length === 1 ? 'tarea' : 'tareas'}</span>
            {hasFilters && (
              <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 cursor-pointer">
                <X className="w-3.5 h-3.5" /> Quitar filtros
              </button>
            )}
          </div>
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            {([['grid', LayoutGrid, 'Tarjetas'], ['lista', ListIcon, 'Lista']] as const).map(([id, Icon, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setViewMode(id)}
                title={`Ver como ${label.toLowerCase()}`}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${viewMode === id ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Icon className="w-4 h-4" /> <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════ 4. TAREAS ══════════ */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 mx-auto flex items-center justify-center">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-slate-800 dark:text-white">
            {tasks.length === 0 ? 'Todavía no hay tareas publicadas' : 'No hay tareas con estos filtros'}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {tasks.length === 0 ? 'Cuando un docente publique una tarea aparecerá aquí. También puedes crear una tú mismo.' : 'Prueba con otro nivel, aula o curso.'}
          </p>
          {tasks.length === 0 ? (
            <button type="button" onClick={() => openCreate()} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold cursor-pointer"><Plus className="w-4 h-4" /> Nueva tarea</button>
          ) : (
            <button type="button" onClick={clearFilters} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer"><X className="w-4 h-4" /> Quitar filtros</button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleTasks.map(task => {
            const m = metricsOf(task);
            const st = STATUS_INFO[m.status];
            const color = aulaColor(task.seccion_id);
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => openDetail(task)}
                className="text-left bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex flex-col cursor-pointer group overflow-hidden"
              >
                <div className={`h-1 w-full ${color.solid}`} />
                <div className="p-4 flex flex-col gap-3 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${color.chip}`}>
                      <span className={`w-2 h-2 rounded-full ${color.dot}`} /> {sectionLabel(task.seccion_id)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border whitespace-nowrap ${st.chip}`}>{st.label}</span>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{courseName(task)}</p>
                    <h3 className="text-base font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-700 dark:group-hover:text-indigo-300">{task.titulo}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> {teacherName(task.docente_id)}</p>
                  </div>

                  <div className="mt-auto space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        {m.totalStudents > 0 ? <><strong className="text-slate-900 dark:text-white">{m.subCount} de {m.totalStudents}</strong> entregaron</> : 'Aula sin alumnos'}
                      </span>
                      <span className="font-black text-slate-900 dark:text-white">{m.progressPct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className={`h-full rounded-full ${st.bar}`} style={{ width: `${m.progressPct}%` }} />
                    </div>
                    {m.toGrade > 0 && <p className="text-xs font-semibold text-violet-600 dark:text-violet-400">{m.toGrade} por calificar</p>}
                  </div>
                </div>
                <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs bg-slate-50/60 dark:bg-slate-800/30">
                  <span className={`inline-flex items-center gap-1.5 font-semibold ${m.status === 'vencida' ? 'text-rose-600' : 'text-slate-600 dark:text-slate-300'}`}>
                    <Calendar className="w-3.5 h-3.5" /> {dueInWords(m.dueDate)}
                  </span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline">Ver entregas →</span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500 font-bold">
                <tr>
                  <th className="py-3 px-4">Tarea</th>
                  <th className="py-3 px-4">Aula</th>
                  <th className="py-3 px-4">Entregaron</th>
                  <th className="py-3 px-4">Fecha límite</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {visibleTasks.map(task => {
                  const m = metricsOf(task);
                  const st = STATUS_INFO[m.status];
                  const color = aulaColor(task.seccion_id);
                  return (
                    <tr key={task.id} onClick={() => openDetail(task)} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                      <td className="py-3 px-4 min-w-[220px]">
                        <div className="font-bold text-slate-900 dark:text-white">{task.titulo}</div>
                        <div className="text-xs text-slate-500">{courseName(task)} · {teacherName(task.docente_id)}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200"><span className={`w-2 h-2 rounded-full ${color.dot}`} />{sectionLabel(task.seccion_id)}</span>
                      </td>
                      <td className="py-3 px-4 min-w-[140px]">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{m.subCount} de {m.totalStudents}</div>
                        <div className="w-28 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden"><div className={`h-full ${st.bar}`} style={{ width: `${m.progressPct}%` }} /></div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-slate-700 dark:text-slate-200">{m.dueDate.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}</div>
                        <div className={`text-xs ${m.status === 'vencida' ? 'text-rose-600' : 'text-slate-500'}`}>{dueInWords(m.dueDate)}</div>
                      </td>
                      <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border whitespace-nowrap ${st.chip}`}>{st.label}</span></td>
                      <td className="py-3 px-4 text-right"><span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">Ver →</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredTasks.length > visibleCount && (
        <div className="flex flex-col items-center gap-1">
          <button type="button" onClick={() => setVisibleCount(c => c + PAGE_SIZE)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:border-slate-400 cursor-pointer">
            <ChevronDown className="w-4 h-4" /> Ver más tareas
          </button>
          <span className="text-xs text-slate-500">Mostrando {visibleCount} de {filteredTasks.length}</span>
        </div>
      )}

      {/* ══════════ 5. NUEVA TAREA ══════════ */}
      {isAddModalOpen && (
        <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Nueva tarea" maxWidth="lg">
          <form onSubmit={handleCreateTask} className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">La tarea les llegará como aviso a todos los alumnos del aula que elijas.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">1. ¿Para qué aula?</label>
                <select required value={formData.seccionId} onChange={(e) => setFormData(prev => ({ ...prev, seccionId: e.target.value, cursoId: '' }))} className={selectCls}>
                  <option value="">Elige un aula</option>
                  {orderedSections.map(s => <option key={s.id} value={s.id}>{sectionLabel(s.id)} · {s.grado?.nivel ? s.grado.nivel[0].toUpperCase() + s.grado.nivel.slice(1) : ''}</option>)}
                </select>
                {formData.seccionId && <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {formStudents === 1 ? '1 alumno recibirá' : `${formStudents} alumnos recibirán`} la tarea</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">2. ¿De qué curso?</label>
                <select required disabled={!formData.seccionId} value={formData.cursoId} onChange={(e) => setFormData(prev => ({ ...prev, cursoId: e.target.value }))} className={`${selectCls} disabled:opacity-50`}>
                  <option value="">{formData.seccionId ? 'Elige un curso' : 'Primero elige el aula'}</option>
                  {formCourses.map(x => <option key={x.course.id} value={x.course.id}>{x.course.nombre}</option>)}
                </select>
                {formData.cursoId && (
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> Quedará a nombre de: <strong>{formDocente ? teacherName(formDocente) : 'Dirección'}</strong></p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">3. Título</label>
              <input type="text" required placeholder="Ej. Resolver la ficha de ecuaciones" value={formData.titulo} onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))} className={inputCls} />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">4. ¿Qué deben hacer los alumnos?</label>
              <textarea rows={3} required placeholder="Explica la tarea con palabras sencillas..." value={formData.descripcion} onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))} className={inputCls} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">5. Fecha límite</label>
                <input type="datetime-local" required value={formData.fechaLimite} onChange={(e) => setFormData(prev => ({ ...prev, fechaLimite: e.target.value }))} className={inputCls} />
                {formDueIsPast
                  ? <p className="text-xs font-semibold text-rose-600 mt-1">La fecha ya pasó, elige una fecha futura.</p>
                  : formData.fechaLimite && <p className="text-xs text-slate-500 mt-1">{dueInWords(new Date(formData.fechaLimite))}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Material de apoyo <span className="font-normal text-slate-400">(opcional)</span></label>
                <input type="url" placeholder="https://drive.google.com/..." value={formData.materialUrl} onChange={(e) => setFormData(prev => ({ ...prev, materialUrl: e.target.value }))} className={inputCls} />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">Cancelar</button>
              <button type="submit" disabled={formDueIsPast} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-black shadow-md cursor-pointer">
                <Send className="w-4 h-4" /> Publicar tarea
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ══════════ 6. DETALLE: QUIÉN ENTREGÓ ══════════ */}
      {detailTask && detail && (() => {
        const m = metricsOf(detailTask);
        const st = STATUS_INFO[m.status];
        const color = aulaColor(detailTask.seccion_id);
        return (
          <Modal isOpen={!!detailTask} onClose={() => setDetailTask(null)} title="Detalle de la tarea" maxWidth="2xl">
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${color.chip}`}><span className={`w-2 h-2 rounded-full ${color.dot}`} />{sectionLabel(detailTask.seccion_id)}</span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{courseName(detailTask)}</span>
                  <span className={`ml-auto px-2 py-0.5 rounded-lg text-[11px] font-bold border ${st.chip}`}>{st.label}</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">{detailTask.titulo}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line">{detailTask.descripcion}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-slate-600 dark:text-slate-300">
                  <span className="inline-flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> {teacherName(detailTask.docente_id)}</span>
                  <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {niceDate(m.dueDate)} ({dueInWords(m.dueDate).toLowerCase()})</span>
                  {detailTask.archivo_url && (
                    <a href={detailTask.archivo_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:underline"><LinkIcon className="w-3.5 h-3.5" /> Material de apoyo</a>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Entregaron', value: m.subCount, tone: 'text-blue-600' },
                  { label: 'Faltan', value: Math.max(0, m.totalStudents - m.subCount), tone: 'text-amber-600' },
                  { label: 'Calificadas', value: m.gradedCount, tone: 'text-emerald-600' },
                ].map(x => (
                  <div key={x.label} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                    <p className={`text-2xl font-black ${x.tone}`}>{x.value}</p>
                    <p className="text-xs font-semibold text-slate-500">{x.label}</p>
                  </div>
                ))}
              </div>

              <div>
                <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 mb-3">
                  {([['entregaron', `Entregaron (${detail.delivered.length})`, UserCheck], ['faltan', `Faltan (${detail.missing.length})`, UserX]] as const).map(([id, label, Icon]) => (
                    <button key={id} type="button" onClick={() => setDetailTab(id)} className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold cursor-pointer ${detailTab === id ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs' : 'text-slate-500'}`}>
                      <Icon className="w-4 h-4" /> {label}
                    </button>
                  ))}
                </div>
                <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
                  {detailTab === 'entregaron' ? (
                    detail.delivered.length === 0 ? (
                      <p className="p-6 text-center text-sm text-slate-500">Todavía nadie ha entregado esta tarea.</p>
                    ) : detail.delivered.map(x => (
                      <div key={x.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{x.name}</p>
                          <p className="text-xs text-slate-500">Entregó el {new Date(x.sub.fecha_entrega).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}{new Date(x.sub.fecha_entrega) > m.dueDate ? ' · fuera de plazo' : ''}</p>
                        </div>
                        {x.sub.calificacion_letra
                          ? <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 shrink-0">Nota {x.sub.calificacion_letra}</span>
                          : <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 shrink-0">Por calificar</span>}
                      </div>
                    ))
                  ) : (
                    detail.missing.length === 0 ? (
                      <p className="p-6 text-center text-sm text-emerald-600 font-semibold flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> Todos los alumnos entregaron.</p>
                    ) : detail.missing.map(x => (
                      <div key={x.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{x.name}</p>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 ${m.dueDate.getTime() < Date.now() ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                          {m.dueDate.getTime() < Date.now() ? 'No entregó' : 'Pendiente'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setDetailTask(null)} className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">Cerrar</button>
              </div>
            </div>
          </Modal>
        );
      })()}

    </div>
  );
}
