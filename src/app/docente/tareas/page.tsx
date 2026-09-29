'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Modal } from '@/components/ui/Modal';
import { GRADE_OPTIONS, gradeOption } from '@/components/notas/gradeOptions';
import { TaskAssignment, GradeLetter, Course, Section } from '@/types';
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Link as LinkIcon,
  Paperclip,
  Plus,
  Search,
  Send,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAulaColors } from '@/hooks/useAulaColors';

type TabKey = 'por_calificar' | 'abiertas' | 'vencidas' | 'todas';

// Fecha local "YYYY-MM-DD" (sin pasar por UTC)
const localIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const timeText = (d: Date) => d.toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit', hour12: true });
const dateText = (d: Date) => d.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });

// "Vence hoy a las 6:00 p. m.", "Vence mañana…", "Venció hace 3 días"
function dueInWords(due: Date, now: Date) {
  const days = Math.round((new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86400000);
  if (due < now) {
    if (days === 0) return { text: `Venció hoy a las ${timeText(due)}`, tone: 'late' as const };
    const ago = Math.abs(days);
    return { text: `Venció hace ${ago} ${ago === 1 ? 'día' : 'días'}`, tone: 'late' as const };
  }
  if (days === 0) return { text: `Vence hoy a las ${timeText(due)}`, tone: 'soon' as const };
  if (days === 1) return { text: `Vence mañana a las ${timeText(due)}`, tone: 'soon' as const };
  if (days <= 3) return { text: `Vence en ${days} días (${dateText(due)})`, tone: 'soon' as const };
  return { text: `Vence el ${dateText(due)}`, tone: 'ok' as const };
}

const emptyForm = (sectionId: string, courseId: string) => ({
  seccionId: sectionId,
  cursoId: courseId,
  titulo: '',
  descripcion: '',
  fecha: localIso(addDays(new Date(), 7)),
  hora: '18:00',
  materialUrl: '',
});

export default function DocenteTareasPage() {
  const { tasks, addTask, submissions, gradeTask, courses, enrollments, sections, currentUser, getTeacherSections } = useApp();
  const aulaColor = useAulaColors();
  // Botón de aula con su color fijo (elegido = color sólido; sin elegir = borde de color)
  const aulaBtnCls = (secId: string, active: boolean) =>
    active ? `${aulaColor(secId).solid} shadow-md` : `bg-white dark:bg-slate-800 ${aulaColor(secId).border} text-slate-800 dark:text-slate-100 ${aulaColor(secId).hover}`;
  const aulaDot = (secId: string) => <span className={`inline-block w-2.5 h-2.5 rounded-full ${aulaColor(secId).dot}`} />;
  const now = new Date();
  const isAdmin = currentUser?.rol === 'admin';

  // Aulas y cursos del docente (el admin ve todo)
  const teacherSections = useMemo<{ seccion: Section; cursos: Course[] }[]>(() => {
    if (isAdmin) return sections.map(s => ({ seccion: s, cursos: courses }));
    return currentUser?.id ? getTeacherSections(currentUser.id) || [] : [];
  }, [isAdmin, sections, courses, getTeacherSections, currentUser?.id]);

  const sectionOf = (id?: string) => sections.find(s => s.id === id) || teacherSections.find(t => t.seccion.id === id)?.seccion;
  const sectionLabel = (id?: string) => { const s = sectionOf(id); return s ? `${s.grado?.nombre || ''} "${s.letra}"` : 'Aula'; };
  const courseOf = (t: TaskAssignment) => t.curso || courses.find(c => c.id === t.curso_id);
  const studentsOf = (secId?: string) => enrollments.filter(e => e.seccion_id === secId && e.estado === 'activo');

  // Solo las tareas del docente: las que creó o las de sus aulas y cursos
  const myTasks = useMemo(() => {
    if (isAdmin) return tasks;
    const pairs = new Set(teacherSections.flatMap(ts => ts.cursos.map(c => `${ts.seccion.id}|${c.id}`)));
    return tasks.filter(t => t.docente_id === currentUser?.id || pairs.has(`${t.seccion_id}|${t.curso_id}`));
  }, [isAdmin, tasks, teacherSections, currentUser?.id]);

  const metricsOf = (task: TaskAssignment) => {
    const total = studentsOf(task.seccion_id).length;
    const subs = submissions.filter(s => s.tarea_id === task.id);
    const graded = subs.filter(s => !!s.calificacion_letra).length;
    const due = new Date(task.fecha_limite);
    return { total, delivered: subs.length, graded, toGrade: subs.length - graded, missing: Math.max(total - subs.length, 0), due, isPastDue: due < now };
  };

  const inTab = (task: TaskAssignment, tab: TabKey) => {
    const m = metricsOf(task);
    if (tab === 'por_calificar') return m.toGrade > 0;
    if (tab === 'abiertas') return !m.isPastDue;
    if (tab === 'vencidas') return m.isPastDue;
    return true;
  };
  const tabCount = (tab: TabKey) => myTasks.filter(t => inTab(t, tab)).length;
  const totalToGrade = myTasks.reduce((acc, t) => acc + metricsOf(t).toGrade, 0);

  const [tab, setTab] = useState<TabKey>(() => (myTasks.some(t => inTab(t, 'por_calificar')) ? 'por_calificar' : 'todas'));
  const [sectionFilter, setSectionFilter] = useState('todas');
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(8);

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return myTasks
      .filter(t => inTab(t, tab))
      .filter(t => sectionFilter === 'todas' || t.seccion_id === sectionFilter)
      .filter(t => !q || `${t.titulo} ${t.descripcion} ${courseOf(t)?.nombre || ''}`.toLowerCase().includes(q))
      .sort((a, b) => {
        // Primero las que tienen entregas por calificar, luego las más próximas a vencer
        const pa = metricsOf(a).toGrade > 0 ? 0 : 1;
        const pb = metricsOf(b).toGrade > 0 ? 0 : 1;
        if (pa !== pb) return pa - pb;
        const da = new Date(a.fecha_limite).getTime();
        const db = new Date(b.fecha_limite).getTime();
        const aPast = da < now.getTime(), bPast = db < now.getTime();
        if (aPast !== bPast) return aPast ? 1 : -1;
        return aPast ? db - da : da - db;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myTasks, tab, sectionFilter, search, submissions, enrollments]);

  // ── Crear tarea ──
  const firstSection = teacherSections[0];
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState(() => emptyForm(firstSection?.seccion.id || '', firstSection?.cursos[0]?.id || ''));
  const formCourses = teacherSections.find(ts => ts.seccion.id === form.seccionId)?.cursos || [];

  const openCreate = () => {
    setForm(emptyForm(firstSection?.seccion.id || '', firstSection?.cursos[0]?.id || ''));
    setIsCreateOpen(true);
  };
  const pickFormSection = (secId: string) => {
    const cursos = teacherSections.find(ts => ts.seccion.id === secId)?.cursos || [];
    setForm(f => ({ ...f, seccionId: secId, cursoId: cursos.some(c => c.id === f.cursoId) ? f.cursoId : cursos[0]?.id || '' }));
  };
  const formDue = new Date(`${form.fecha}T${form.hora || '23:59'}`);
  const formDueInvalid = isNaN(formDue.getTime()) || formDue <= now;
  const canPublish = !!form.seccionId && !!form.cursoId && form.titulo.trim() !== '' && form.descripcion.trim() !== '' && !formDueInvalid;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPublish) return;
    addTask({
      cursoId: form.cursoId,
      seccionId: form.seccionId,
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim(),
      fechaLimite: formDue.toISOString(),
      archivoUrl: form.materialUrl.trim() || undefined,
    });
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    setIsCreateOpen(false);
    setTab('abiertas');
    setSectionFilter('todas');
  };

  // ── Revisar entregas ──
  const [reviewTask, setReviewTask] = useState<TaskAssignment | null>(null);
  const [reviewView, setReviewView] = useState<'entregaron' | 'faltan'>('entregaron');
  const [showInstructions, setShowInstructions] = useState(false);
  const [gradingId, setGradingId] = useState<string | null>(null); // matricula en calificación
  const [gradeDraft, setGradeDraft] = useState<GradeLetter | undefined>(undefined);
  const [feedbackDraft, setFeedbackDraft] = useState('');

  const openReview = (task: TaskAssignment) => {
    setReviewTask(task);
    setReviewView(metricsOf(task).delivered > 0 ? 'entregaron' : 'faltan');
    setShowInstructions(false);
    setGradingId(null);
  };

  const reviewStudents = reviewTask ? studentsOf(reviewTask.seccion_id) : [];
  const nameOf = (enr: typeof enrollments[number]) => ({
    nombres: enr.estudiante?.profile?.nombres || enr.estudiante?.nombres || '',
    apellidos: enr.estudiante?.profile?.apellidos || enr.estudiante?.apellidos || '',
  });
  const subOf = (tareaId: string, matriculaId: string) => submissions.find(s => s.tarea_id === tareaId && s.matricula_id === matriculaId);
  const delivered = reviewTask
    ? reviewStudents.filter(e => subOf(reviewTask.id, e.id)).sort((a, b) => Number(!!subOf(reviewTask.id, a.id)?.calificacion_letra) - Number(!!subOf(reviewTask.id, b.id)?.calificacion_letra))
    : [];
  const missing = reviewTask ? reviewStudents.filter(e => !subOf(reviewTask.id, e.id)) : [];

  const startGrading = (matriculaId: string) => {
    if (!reviewTask) return;
    const sub = subOf(reviewTask.id, matriculaId);
    setGradingId(matriculaId);
    setGradeDraft(sub?.calificacion_letra);
    setFeedbackDraft(sub?.retroalimentacion_docente || '');
  };

  const saveGrading = (goNext: boolean) => {
    if (!reviewTask || !gradingId || !gradeDraft) return;
    gradeTask({ tareaId: reviewTask.id, matriculaId: gradingId, calificacionLetra: gradeDraft, retroalimentacion: feedbackDraft.trim() || undefined });
    // Siguiente alumno que entregó y aún no tiene nota
    const next = goNext ? delivered.find(e => e.id !== gradingId && !subOf(reviewTask.id, e.id)?.calificacion_letra) : undefined;
    if (next) startGrading(next.id);
    else {
      setGradingId(null);
      confetti({ particleCount: 25, spread: 45, origin: { y: 0.8 } });
    }
  };

  const TABS: { key: TabKey; label: string; hint: string }[] = [
    { key: 'por_calificar', label: 'Por calificar', hint: 'Tienen entregas sin nota' },
    { key: 'abiertas', label: 'Abiertas', hint: 'Los alumnos aún pueden entregar' },
    { key: 'vencidas', label: 'Vencidas', hint: 'Ya pasó la fecha de entrega' },
    { key: 'todas', label: 'Todas', hint: 'Todas mis tareas' },
  ];

  const inputCls = 'w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500';

  return (
    <div className="space-y-4 max-w-6xl mx-auto animate-in fade-in-50 pb-16">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-600" /> Mis tareas
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">Crea tareas para tus aulas, mira quién entregó y ponles nota.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          disabled={teacherSections.length === 0}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-base font-black shadow-md disabled:opacity-40 cursor-pointer shrink-0"
        >
          <Plus className="w-5 h-5 stroke-[3]" /> Crear tarea nueva
        </button>
      </div>

      {/* Aviso de entregas por calificar */}
      {totalToGrade > 0 && tab !== 'por_calificar' && (
        <button
          type="button"
          onClick={() => setTab('por_calificar')}
          className="w-full flex items-center gap-3 p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border-2 border-purple-200 dark:border-purple-800 text-left cursor-pointer hover:border-purple-400"
        >
          <ClipboardCheck className="w-6 h-6 text-purple-600 shrink-0" />
          <span className="flex-1 text-sm text-purple-900 dark:text-purple-100">
            Tienes <strong>{totalToGrade} {totalToGrade === 1 ? 'entrega' : 'entregas'} por calificar</strong>. Toca aquí para verlas.
          </span>
          <ChevronRight className="w-5 h-5 text-purple-500" />
        </button>
      )}

      {/* Pestañas + filtros */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TABS.map(t => {
            const active = tab === t.key;
            const count = tabCount(t.key);
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => { setTab(t.key); setVisibleCount(8); }}
                aria-pressed={active}
                className={`text-left px-4 py-2.5 rounded-2xl border-2 transition-colors cursor-pointer ${
                  active ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 hover:border-indigo-400'
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-base font-black">{t.label}</span>
                  <span className={`min-w-[28px] text-center px-2 py-0.5 rounded-full text-sm font-black ${active ? 'bg-white/25' : t.key === 'por_calificar' && count > 0 ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-700'}`}>{count}</span>
                </span>
                <span className={`block text-xs ${active ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>{t.hint}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-1">
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300 shrink-0 mr-1">Aula:</span>
            {[{ id: 'todas', label: 'Todas' }, ...teacherSections.map(ts => ({ id: ts.seccion.id, label: sectionLabel(ts.seccion.id) }))].map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => { setSectionFilter(opt.id); setVisibleCount(8); }}
                aria-pressed={sectionFilter === opt.id}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 text-sm font-bold cursor-pointer ${
                  opt.id === 'todas'
                    ? sectionFilter === opt.id ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-400'
                    : aulaBtnCls(opt.id, sectionFilter === opt.id)
                }`}
              >
                {opt.id !== 'todas' && sectionFilter !== opt.id && aulaDot(opt.id)}{opt.label}
              </button>
            ))}
          </div>
          <div className="relative md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar una tarea" className="w-full pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500" />
            {search && (
              <button type="button" onClick={() => setSearch('')} aria-label="Borrar búsqueda" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"><X className="w-4 h-4" /></button>
            )}
          </div>
        </div>
      </div>

      {/* Lista de tareas */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-10 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 flex items-center justify-center mx-auto"><FileText className="w-7 h-7" /></div>
          <h3 className="font-black text-slate-900 dark:text-white text-lg">
            {myTasks.length === 0 ? 'Todavía no creaste tareas' : tab === 'por_calificar' ? '¡Todo calificado! 🎉' : 'No hay tareas aquí'}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {myTasks.length === 0 ? 'Toca "Crear tarea nueva" para enviar la primera a tus alumnos.' : tab === 'por_calificar' ? 'No tienes entregas pendientes de nota.' : 'Prueba con otra pestaña, otra aula o borra la búsqueda.'}
          </p>
          {myTasks.length === 0 && (
            <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black cursor-pointer">
              <Plus className="w-4 h-4" /> Crear tarea nueva
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.slice(0, visibleCount).map(task => {
            const m = metricsOf(task);
            const course = courseOf(task);
            const due = dueInWords(m.due, now);
            const pct = m.total > 0 ? Math.round((m.delivered / m.total) * 100) : 0;
            return (
              <div key={task.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col md:flex-row md:items-center gap-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                <span className="hidden md:block w-2 self-stretch rounded-full shrink-0" style={{ backgroundColor: course?.color_hex || '#6366f1' }} />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                    <span className="px-2.5 py-0.5 rounded-full text-white" style={{ backgroundColor: course?.color_hex || '#6366f1' }}>{course?.nombre || 'Curso'}</span>
                    <span className={`px-2.5 py-0.5 rounded-full ${aulaColor(task.seccion_id).chip}`}>{sectionLabel(task.seccion_id)}</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white leading-snug">{task.titulo}</h3>
                  <p className={`text-sm font-bold flex items-center gap-1.5 ${due.tone === 'late' ? 'text-rose-600 dark:text-rose-400' : due.tone === 'soon' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300'}`} suppressHydrationWarning>
                    <CalendarClock className="w-4 h-4" /> {due.text}
                  </p>
                </div>

                <div className="md:w-56 space-y-1.5">
                  <p className="text-sm text-slate-700 dark:text-slate-200"><strong>{m.delivered} de {m.total}</strong> entregaron</p>
                  <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs font-bold">
                    {m.toGrade > 0
                      ? <span className="text-purple-700 dark:text-purple-300">● {m.toGrade} por calificar</span>
                      : m.delivered > 0 ? <span className="text-emerald-600 dark:text-emerald-400">✓ Todas las entregas calificadas</span>
                      : <span className="text-slate-400">Aún nadie entregó</span>}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => openReview(task)}
                  className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-black cursor-pointer shrink-0 md:w-48 ${
                    m.toGrade > 0 ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-md' : 'bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 hover:border-indigo-500'
                  }`}
                >
                  {m.toGrade > 0 ? <><ClipboardCheck className="w-5 h-5" /> Calificar ({m.toGrade})</> : <><Users className="w-5 h-5" /> Ver entregas</>}
                </button>
              </div>
            );
          })}
          {filteredTasks.length > visibleCount && (
            <button type="button" onClick={() => setVisibleCount(c => c + 8)} className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:border-indigo-400 cursor-pointer">
              Ver más tareas ({filteredTasks.length - visibleCount} más)
            </button>
          )}
        </div>
      )}

      {/* ───────── Ventana: crear tarea ───────── */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Crear tarea nueva" maxWidth="2xl">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <p className="text-sm font-black text-slate-800 dark:text-slate-100 mb-1.5">1. ¿Para qué aula?</p>
            <div className="flex flex-wrap gap-2">
              {teacherSections.map(ts => (
                <button key={ts.seccion.id} type="button" onClick={() => pickFormSection(ts.seccion.id)} aria-pressed={form.seccionId === ts.seccion.id}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 text-sm font-black cursor-pointer ${aulaBtnCls(ts.seccion.id, form.seccionId === ts.seccion.id)}`}>
                  {form.seccionId !== ts.seccion.id && aulaDot(ts.seccion.id)}{sectionLabel(ts.seccion.id)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-black text-slate-800 dark:text-slate-100 mb-1.5">2. ¿De qué curso?</p>
            {formCourses.length === 0 ? (
              <p className="text-sm text-amber-600 font-semibold">No dictas cursos en esta aula.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {formCourses.map(c => (
                  <button key={c.id} type="button" onClick={() => setForm(f => ({ ...f, cursoId: c.id }))} aria-pressed={form.cursoId === c.id}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 text-sm font-black cursor-pointer ${form.cursoId === c.id ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 hover:border-slate-500'}`}>
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color_hex || '#3b82f6' }} /> {c.nombre}
                  </button>
                ))}
              </div>
            )}
          </div>

          <label className="block">
            <span className="block text-sm font-black text-slate-800 dark:text-slate-100 mb-1.5">3. Título de la tarea</span>
            <input required type="text" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Ej. Resolver los ejercicios de fracciones" className={inputCls} />
          </label>

          <label className="block">
            <span className="block text-sm font-black text-slate-800 dark:text-slate-100 mb-1.5">4. ¿Qué deben hacer los alumnos?</span>
            <textarea required rows={4} value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Ej. Resuelvan los ejercicios 1 al 10 de la página 45 y tomen foto de su cuaderno." className={`${inputCls} resize-none`} />
          </label>

          <div>
            <p className="text-sm font-black text-slate-800 dark:text-slate-100 mb-1.5">5. ¿Hasta cuándo pueden entregar?</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {[{ label: 'Mañana', d: 1 }, { label: 'En 3 días', d: 3 }, { label: 'En 1 semana', d: 7 }, { label: 'En 2 semanas', d: 14 }].map(q => {
                const iso = localIso(addDays(now, q.d));
                return (
                  <button key={q.d} type="button" onClick={() => setForm(f => ({ ...f, fecha: iso }))} aria-pressed={form.fecha === iso}
                    className={`px-3 py-1.5 rounded-xl border-2 text-sm font-bold cursor-pointer ${form.fecha === iso ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-amber-400'}`}>
                    {q.label}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="block text-xs font-bold text-slate-500 mb-1">Día</span>
                <input required type="date" min={localIso(now)} value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} className={inputCls} />
              </label>
              <label className="block">
                <span className="block text-xs font-bold text-slate-500 mb-1">Hora</span>
                <input required type="time" value={form.hora} onChange={e => setForm(f => ({ ...f, hora: e.target.value }))} className={inputCls} />
              </label>
            </div>
            {formDueInvalid ? (
              <p className="mt-1.5 text-sm font-bold text-rose-600 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> La fecha de entrega debe ser después de ahora.</p>
            ) : (
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300" suppressHydrationWarning>Los alumnos pueden entregar hasta el <strong>{dateText(formDue)} a las {timeText(formDue)}</strong></p>
            )}
          </div>

          <label className="block">
            <span className="block text-sm font-black text-slate-800 dark:text-slate-100 mb-1.5">6. Enlace a material de apoyo <span className="font-normal text-slate-500">(opcional)</span></span>
            <input type="url" value={form.materialUrl} onChange={e => setForm(f => ({ ...f, materialUrl: e.target.value }))} placeholder="https://drive.google.com/…" className={inputCls} />
          </label>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Se enviará a <strong>{studentsOf(form.seccionId).length} {studentsOf(form.seccionId).length === 1 ? 'alumno' : 'alumnos'}</strong> de {sectionLabel(form.seccionId)}.
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer">Cancelar</button>
              <button type="submit" disabled={!canPublish} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                <Send className="w-4 h-4" /> Enviar tarea
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* ───────── Ventana: entregas y calificación ───────── */}
      {reviewTask && (() => {
        const m = metricsOf(reviewTask);
        const course = courseOf(reviewTask);
        return (
          <Modal isOpen={!!reviewTask} onClose={() => setReviewTask(null)} title="Entregas de la tarea" maxWidth="2xl">
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-white" style={{ backgroundColor: course?.color_hex || '#6366f1' }}>{course?.nombre || 'Curso'}</span>
                  <span className={`px-2.5 py-0.5 rounded-full ${aulaColor(reviewTask.seccion_id).chip}`}>{sectionLabel(reviewTask.seccion_id)}</span>
                </div>
                <p className="text-lg font-black text-slate-900 dark:text-white">{reviewTask.titulo}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300" suppressHydrationWarning>{dueInWords(m.due, now).text}</p>
                <button type="button" onClick={() => setShowInstructions(v => !v)} className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-indigo-700 dark:text-indigo-300 cursor-pointer" aria-expanded={showInstructions}>
                  {showInstructions ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />} Ver instrucciones
                </button>
                {showInstructions && (
                  <div className="mt-1 space-y-1">
                    <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line">{reviewTask.descripcion}</p>
                    {reviewTask.archivo_url && (
                      <a href={reviewTask.archivo_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-bold text-blue-700 dark:text-blue-300 underline"><LinkIcon className="w-4 h-4" /> Material de apoyo</a>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {([
                  { key: 'entregaron', label: 'Entregaron', count: delivered.length, icon: CheckCircle2, on: 'bg-emerald-600 border-emerald-600 text-white' },
                  { key: 'faltan', label: 'No entregaron', count: missing.length, icon: XCircle, on: 'bg-rose-600 border-rose-600 text-white' },
                ] as const).map(v => (
                  <button key={v.key} type="button" onClick={() => setReviewView(v.key)} aria-pressed={reviewView === v.key}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-2xl border-2 text-sm font-black cursor-pointer ${reviewView === v.key ? v.on : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200'}`}>
                    <v.icon className="w-4 h-4" /> {v.label} ({v.count})
                  </button>
                ))}
              </div>

              <div className="space-y-2 max-h-[48vh] overflow-y-auto pr-1">
                {reviewView === 'faltan' ? (
                  missing.length === 0 ? (
                    <p className="py-6 text-center text-sm text-emerald-600 font-bold">¡Todos entregaron! 🎉</p>
                  ) : missing.map(enr => {
                    const { nombres, apellidos } = nameOf(enr);
                    return (
                      <div key={enr.id} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                        <span className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-black flex items-center justify-center shrink-0">{`${nombres[0] || ''}${apellidos[0] || ''}`.toUpperCase()}</span>
                        <span className="flex-1 text-sm font-bold text-slate-800 dark:text-slate-100">{apellidos}, {nombres}</span>
                        <span className="text-xs font-bold text-rose-600">{m.isPastDue ? 'No entregó' : 'Aún no entrega'}</span>
                      </div>
                    );
                  })
                ) : delivered.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-500">Todavía nadie entregó esta tarea.</p>
                ) : delivered.map(enr => {
                  const { nombres, apellidos } = nameOf(enr);
                  const sub = subOf(reviewTask.id, enr.id)!;
                  const opt = gradeOption(sub.calificacion_letra);
                  const late = new Date(sub.fecha_entrega) > m.due;
                  const isGrading = gradingId === enr.id;
                  return (
                    <div key={enr.id} className={`p-3 rounded-2xl border-2 ${isGrading ? 'border-purple-400 bg-purple-50/50 dark:bg-purple-950/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <span className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-black flex items-center justify-center shrink-0">{`${nombres[0] || ''}${apellidos[0] || ''}`.toUpperCase()}</span>
                          <div className="min-w-0 space-y-1">
                            <p className="text-sm font-black text-slate-900 dark:text-white">{apellidos}, {nombres}</p>
                            <p className="text-xs text-slate-500" suppressHydrationWarning>
                              Entregó el {new Date(sub.fecha_entrega).toLocaleDateString('es-PE', { day: 'numeric', month: 'long' })} a las {timeText(new Date(sub.fecha_entrega))}
                              {late && <span className="ml-1 font-bold text-amber-600">· Fuera de fecha</span>}
                            </p>
                            {sub.archivo_nombre && (
                              <a href={sub.archivo_url || '#'} target="_blank" rel="noopener noreferrer" download={sub.archivo_nombre} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold hover:bg-blue-100">
                                <Paperclip className="w-3.5 h-3.5" /> <span className="truncate max-w-[220px]">Abrir: {sub.archivo_nombre}</span>
                              </a>
                            )}
                            {sub.enlace_entrega && (
                              <a href={sub.enlace_entrega} target="_blank" rel="noopener noreferrer" className="ml-1 inline-flex items-center gap-1 text-xs font-bold text-blue-700 dark:text-blue-300 underline"><LinkIcon className="w-3.5 h-3.5" /> Enlace</a>
                            )}
                            {sub.comentario_estudiante && <p className="text-xs text-slate-600 dark:text-slate-300 italic">&quot;{sub.comentario_estudiante}&quot;</p>}
                          </div>
                        </div>
                        {!isGrading && (
                          opt ? (
                            <button type="button" onClick={() => startGrading(enr.id)} aria-label={`Cambiar nota ${opt.letter} de ${nombres} ${apellidos}`}
                              className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border-2 text-base font-black cursor-pointer shrink-0 ${opt.solid}`}>
                              {opt.letter} <span className="text-xs font-bold opacity-90">Cambiar</span>
                            </button>
                          ) : (
                            <button type="button" onClick={() => startGrading(enr.id)} className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-black cursor-pointer shrink-0">
                              <ClipboardCheck className="w-4 h-4" /> Poner nota
                            </button>
                          )
                        )}
                      </div>

                      {isGrading && (
                        <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-900 space-y-2.5">
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Elige la nota:</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {GRADE_OPTIONS.map(o => (
                              <button key={o.letter} type="button" onClick={() => setGradeDraft(o.letter)} aria-pressed={gradeDraft === o.letter}
                                className={`p-2 rounded-xl border-2 text-left cursor-pointer ${gradeDraft === o.letter ? `${o.solid} ring-4 ring-purple-200 dark:ring-purple-900` : o.soft}`}>
                                <span className="block text-lg font-black leading-none">{o.letter}</span>
                                <span className="block text-[11px] font-bold mt-0.5">{o.label}</span>
                              </button>
                            ))}
                          </div>
                          <textarea rows={2} value={feedbackDraft} onChange={e => setFeedbackDraft(e.target.value)} placeholder="Comentario para el alumno (opcional). Ej. ¡Buen trabajo! Revisa el ejercicio 4." className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-purple-500" />
                          <div className="flex flex-wrap justify-end gap-2">
                            <button type="button" onClick={() => setGradingId(null)} className="px-4 py-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer">Cancelar</button>
                            <button type="button" disabled={!gradeDraft} onClick={() => saveGrading(false)} className="px-4 py-2 rounded-xl border-2 border-purple-600 text-purple-700 dark:text-purple-300 text-sm font-black disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">Guardar</button>
                            {delivered.some(e => e.id !== enr.id && !subOf(reviewTask.id, e.id)?.calificacion_letra) && (
                              <button type="button" disabled={!gradeDraft} onClick={() => saveGrading(true)} className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-black disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                                Guardar y siguiente <ChevronRight className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {m.toGrade > 0 ? <><strong className="text-purple-700 dark:text-purple-300">{m.toGrade}</strong> por calificar</> : m.delivered > 0 ? '✓ Todas las entregas tienen nota' : ''}
                </p>
                <button type="button" onClick={() => setReviewTask(null)} className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-black cursor-pointer">Listo</button>
              </div>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}
