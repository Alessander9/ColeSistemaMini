'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Modal } from '@/components/ui/Modal';
import { EvaluationExam, Course, Section } from '@/types';
import { AlertCircle, Award, CalendarClock, CalendarDays, Clock, Plus, Search, Trash2, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAulaColors } from '@/hooks/useAulaColors';

type TabKey = 'proximas' | 'tomadas' | 'todas';
type ExamType = 'examen' | 'practica' | 'bimestral' | 'proyecto';

const TYPE_INFO: Record<string, { label: string; emoji: string; chip: string }> = {
  examen: { label: 'Examen', emoji: '📝', chip: 'bg-pink-100 text-pink-800 dark:bg-pink-950/60 dark:text-pink-200' },
  practica: { label: 'Práctica calificada', emoji: '✏️', chip: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200' },
  bimestral: { label: 'Examen bimestral', emoji: '📚', chip: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200' },
  proyecto: { label: 'Proyecto', emoji: '🧩', chip: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-200' },
  actividad: { label: 'Actividad', emoji: '⭐', chip: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200' },
};
const typeInfo = (t: string) => TYPE_INFO[t] || TYPE_INFO.examen;

const DURATIONS = [30, 45, 60, 90, 120];
const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SET', 'OCT', 'NOV', 'DIC'];

// Fechas locales "YYYY-MM-DD" (sin pasar por UTC)
const localIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const parseIso = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
const longDate = (iso: string) => parseIso(iso).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
const timeText = (hhmm?: string) => {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m || 0).padStart(2, '0')} ${h >= 12 ? 'p. m.' : 'a. m.'}`;
};
const daysFromToday = (iso: string, todayIso: string) => Math.round((parseIso(iso).getTime() - parseIso(todayIso).getTime()) / 86400000);
const whenInWords = (days: number) =>
  days === 0 ? 'Es hoy' : days === 1 ? 'Es mañana' : days > 1 ? `Faltan ${days} días` : days === -1 ? 'Fue ayer' : `Fue hace ${Math.abs(days)} días`;

export default function DocenteEvaluacionesPage() {
  const { exams, addExam, updateExam, deleteExam, courses, sections, enrollments, grades, evaluationPeriods, currentUser, getTeacherSections, showToast } = useApp();
  const aulaColor = useAulaColors();
  // Botón de aula con su color fijo (elegido = color sólido; sin elegir = borde de color)
  const aulaBtnCls = (secId: string, active: boolean) =>
    active ? `${aulaColor(secId).solid} shadow-md` : `bg-white dark:bg-slate-800 ${aulaColor(secId).border} text-slate-800 dark:text-slate-100 ${aulaColor(secId).hover}`;
  const aulaDot = (secId: string) => <span className={`inline-block w-2.5 h-2.5 rounded-full ${aulaColor(secId).dot}`} />;
  const todayIso = localIso(new Date());
  const isAdmin = currentUser?.rol === 'admin';

  // Aulas y cursos del docente (el admin ve todo)
  const teacherSections = useMemo<{ seccion: Section; cursos: Course[] }[]>(() => {
    if (isAdmin) return sections.map(s => ({ seccion: s, cursos: courses }));
    return currentUser?.id ? getTeacherSections(currentUser.id) || [] : [];
  }, [isAdmin, sections, courses, getTeacherSections, currentUser?.id]);

  const sectionOf = (id?: string) => sections.find(s => s.id === id) || teacherSections.find(t => t.seccion.id === id)?.seccion;
  const sectionLabel = (id?: string) => { const s = sectionOf(id); return s ? `${s.grado?.nombre || ''} "${s.letra}"` : 'Aula'; };
  const courseOf = (e: EvaluationExam) => courses.find(c => c.id === e.curso_id) || e.curso;
  const studentsOf = (secId?: string) => enrollments.filter(e => e.seccion_id === secId && e.estado === 'activo');
  const periodName = (id?: string) => evaluationPeriods.find(p => p.id === id)?.nombre || '';
  const periodForDate = (iso: string) =>
    evaluationPeriods.find(p => p.fecha_inicio <= iso && iso <= p.fecha_fin) ||
    evaluationPeriods.find(p => p.activo && !p.cerrado) ||
    evaluationPeriods.find(p => !p.cerrado) ||
    evaluationPeriods[0];

  // Solo las evaluaciones de las aulas y cursos del docente
  const myExams = useMemo(() => {
    if (isAdmin) return exams;
    const pairs = new Set(teacherSections.flatMap(ts => ts.cursos.map(c => `${ts.seccion.id}|${c.id}`)));
    return exams.filter(e => pairs.has(`${e.seccion_id}|${e.curso_id}`));
  }, [isAdmin, exams, teacherSections]);

  // Avance de notas: la nota de una evaluación es la de su competencia en su bimestre
  const gradeProgress = (exam: EvaluationExam) => {
    const students = studentsOf(exam.seccion_id);
    if (!exam.competencia_id) return { total: students.length, done: 0, known: false };
    const done = students.filter(enr => grades.some(g => g.matricula_id === enr.id && g.competencia_id === exam.competencia_id && g.periodo_evaluacion_id === exam.periodo_evaluacion_id && g.nota_letra)).length;
    return { total: students.length, done, known: true };
  };

  const [tab, setTab] = useState<TabKey>('proximas');
  const [sectionFilter, setSectionFilter] = useState('todas');
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(8);

  const inTab = (e: EvaluationExam, t: TabKey) => (t === 'proximas' ? e.fecha_programada >= todayIso : t === 'tomadas' ? e.fecha_programada < todayIso : true);
  const tabCount = (t: TabKey) => myExams.filter(e => inTab(e, t)).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return myExams
      .filter(e => inTab(e, tab))
      .filter(e => sectionFilter === 'todas' || e.seccion_id === sectionFilter)
      .filter(e => !q || `${e.titulo} ${e.descripcion || ''} ${courseOf(e)?.nombre || ''}`.toLowerCase().includes(q))
      .sort((a, b) => {
        const byDate = `${a.fecha_programada} ${a.hora_inicio || ''}`.localeCompare(`${b.fecha_programada} ${b.hora_inicio || ''}`);
        // Próximas: la más cercana primero · Ya tomadas: la más reciente primero
        return tab === 'proximas' ? byDate : tab === 'tomadas' ? -byDate : (a.fecha_programada >= todayIso) !== (b.fecha_programada >= todayIso) ? (a.fecha_programada >= todayIso ? -1 : 1) : byDate;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myExams, tab, sectionFilter, search, todayIso]);

  // ── Programar evaluación ──
  const first = teacherSections[0];
  const newForm = () => {
    const seccionId = first?.seccion.id || '';
    const curso = first?.cursos[0];
    return {
      tipo: 'examen' as ExamType,
      seccionId,
      cursoId: curso?.id || '',
      competenciaId: [...(curso?.competencias || [])].sort((a, b) => a.orden - b.orden)[0]?.id || '',
      titulo: '',
      fecha: localIso(addDays(new Date(), 7)),
      hora: '08:00',
      duracion: 60,
      descripcion: '',
    };
  };
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState(newForm);
  const formCourses = teacherSections.find(ts => ts.seccion.id === form.seccionId)?.cursos || [];
  const formCompetencies = [...(formCourses.find(c => c.id === form.cursoId)?.competencias || [])].sort((a, b) => a.orden - b.orden);
  const formPeriod = periodForDate(form.fecha);
  const formDateInvalid = !form.fecha || form.fecha < todayIso;
  const canCreate = !!form.seccionId && !!form.cursoId && form.titulo.trim() !== '' && !formDateInvalid && !!form.hora;

  const pickSection = (secId: string) => {
    const cursos = teacherSections.find(ts => ts.seccion.id === secId)?.cursos || [];
    const curso = cursos.find(c => c.id === form.cursoId) || cursos[0];
    const comps = [...(curso?.competencias || [])].sort((a, b) => a.orden - b.orden);
    setForm(f => ({ ...f, seccionId: secId, cursoId: curso?.id || '', competenciaId: comps.some(c => c.id === f.competenciaId) ? f.competenciaId : comps[0]?.id || '' }));
  };
  const pickCourse = (cursoId: string) => {
    const comps = [...(formCourses.find(c => c.id === cursoId)?.competencias || [])].sort((a, b) => a.orden - b.orden);
    setForm(f => ({ ...f, cursoId, competenciaId: comps[0]?.id || '' }));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate || !formPeriod) return;
    addExam({
      cursoId: form.cursoId,
      seccionId: form.seccionId,
      periodoEvaluacionId: formPeriod.id,
      competenciaId: form.competenciaId,
      titulo: form.titulo.trim(),
      tipo: form.tipo,
      fechaProgramada: form.fecha,
      horaInicio: form.hora,
      duracionMinutos: form.duracion,
      descripcion: form.descripcion.trim() || undefined,
    });
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    setIsCreateOpen(false);
    setTab('proximas');
    setSectionFilter('todas');
  };

  // ── Cambiar fecha ──
  const [rescheduling, setRescheduling] = useState<EvaluationExam | null>(null);
  const [resForm, setResForm] = useState({ fecha: '', hora: '08:00', duracion: 60 });
  const openReschedule = (exam: EvaluationExam) => {
    setRescheduling(exam);
    setResForm({ fecha: exam.fecha_programada >= todayIso ? exam.fecha_programada : localIso(addDays(new Date(), 1)), hora: exam.hora_inicio || '08:00', duracion: exam.duracion_minutos || 60 });
  };
  const resInvalid = !resForm.fecha || resForm.fecha < todayIso || !resForm.hora;
  const saveReschedule = () => {
    if (!rescheduling || resInvalid) return;
    const p = periodForDate(resForm.fecha);
    updateExam(rescheduling.id, { fecha_programada: resForm.fecha, hora_inicio: resForm.hora, duracion_minutos: resForm.duracion, periodo_evaluacion_id: p?.id || rescheduling.periodo_evaluacion_id });
    showToast(`Nueva fecha: ${longDate(resForm.fecha)} a las ${timeText(resForm.hora)}. Se avisó a los alumnos.`, 'success', 'Fecha cambiada');
    setRescheduling(null);
  };

  // ── Eliminar (con confirmación) ──
  const [deleting, setDeleting] = useState<EvaluationExam | null>(null);
  const confirmDelete = () => {
    if (!deleting) return;
    deleteExam(deleting.id);
    showToast(`Se eliminó "${deleting.titulo}"`, 'info', 'Evaluación eliminada');
    setDeleting(null);
  };

  const TABS: { key: TabKey; label: string; hint: string }[] = [
    { key: 'proximas', label: 'Próximas', hint: 'Aún no se toman' },
    { key: 'tomadas', label: 'Ya tomadas', hint: 'Falta poner o revisar notas' },
    { key: 'todas', label: 'Todas', hint: 'Todas mis evaluaciones' },
  ];

  const inputCls = 'w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500';
  const chipCls = (active: boolean, on = 'bg-indigo-600 border-indigo-600 text-white') =>
    `px-3.5 py-2 rounded-xl border-2 text-sm font-black cursor-pointer ${active ? on : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 hover:border-indigo-400'}`;

  const dateChooser = (fecha: string, hora: string, duracion: number, set: (patch: Partial<{ fecha: string; hora: string; duracion: number }>) => void) => (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {[{ label: 'Mañana', d: 1 }, { label: 'En 3 días', d: 3 }, { label: 'En 1 semana', d: 7 }, { label: 'En 2 semanas', d: 14 }].map(q => {
          const iso = localIso(addDays(new Date(), q.d));
          return <button key={q.d} type="button" onClick={() => set({ fecha: iso })} aria-pressed={fecha === iso} className={chipCls(fecha === iso, 'bg-amber-500 border-amber-500 text-white')}>{q.label}</button>;
        })}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="block"><span className="block text-xs font-bold text-slate-500 mb-1">Día</span>
          <input type="date" min={todayIso} value={fecha} onChange={e => set({ fecha: e.target.value })} className={inputCls} />
        </label>
        <label className="block"><span className="block text-xs font-bold text-slate-500 mb-1">Hora de inicio</span>
          <input type="time" value={hora} onChange={e => set({ hora: e.target.value })} className={inputCls} />
        </label>
      </div>
      <div>
        <span className="block text-xs font-bold text-slate-500 mb-1">¿Cuánto dura?</span>
        <div className="flex flex-wrap gap-2">
          {DURATIONS.map(d => (
            <button key={d} type="button" onClick={() => set({ duracion: d })} aria-pressed={duracion === d} className={chipCls(duracion === d, 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900')}>
              {d < 60 ? `${d} min` : d === 60 ? '1 hora' : d === 90 ? '1 h 30 min' : '2 horas'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 max-w-6xl mx-auto animate-in fade-in-50 pb-16">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="w-7 h-7 text-indigo-600" /> Mis evaluaciones
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">Programa exámenes y prácticas. Los alumnos reciben el aviso con la fecha.</p>
        </div>
        <button type="button" onClick={() => { setForm(newForm()); setIsCreateOpen(true); }} disabled={teacherSections.length === 0}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-base font-black shadow-md disabled:opacity-40 cursor-pointer shrink-0">
          <Plus className="w-5 h-5 stroke-[3]" /> Programar evaluación
        </button>
      </div>

      {/* Pestañas + filtros */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {TABS.map(t => {
            const active = tab === t.key;
            return (
              <button key={t.key} type="button" onClick={() => { setTab(t.key); setVisibleCount(8); }} aria-pressed={active}
                className={`text-left px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl border-2 transition-colors cursor-pointer ${active ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 hover:border-indigo-400'}`}>
                <span className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-2">
                  <span className="text-sm sm:text-base font-black leading-tight">{t.label}</span>
                  <span className={`min-w-[28px] text-center px-2 py-0.5 rounded-full text-sm font-black ${active ? 'bg-white/25' : 'bg-slate-100 dark:bg-slate-700'}`}>{tabCount(t.key)}</span>
                </span>
                <span className={`hidden sm:block text-xs ${active ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>{t.hint}</span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-1">
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300 shrink-0 mr-1">Aula:</span>
            {[{ id: 'todas', label: 'Todas' }, ...teacherSections.map(ts => ({ id: ts.seccion.id, label: sectionLabel(ts.seccion.id) }))].map(opt => (
              <button key={opt.id} type="button" onClick={() => { setSectionFilter(opt.id); setVisibleCount(8); }} aria-pressed={sectionFilter === opt.id}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 text-sm font-bold cursor-pointer ${opt.id === 'todas' ? (sectionFilter === opt.id ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-400') : aulaBtnCls(opt.id, sectionFilter === opt.id)}`}>
                {opt.id !== 'todas' && sectionFilter !== opt.id && aulaDot(opt.id)}{opt.label}
              </button>
            ))}
          </div>
          <div className="relative md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar una evaluación" className="w-full pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500" />
            {search && <button type="button" onClick={() => setSearch('')} aria-label="Borrar búsqueda" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"><X className="w-4 h-4" /></button>}
          </div>
        </div>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-10 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 flex items-center justify-center mx-auto"><CalendarDays className="w-7 h-7" /></div>
          <h3 className="font-black text-slate-900 dark:text-white text-lg">
            {myExams.length === 0 ? 'Todavía no programaste evaluaciones' : tab === 'proximas' ? 'No tienes evaluaciones próximas' : 'No hay evaluaciones aquí'}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {myExams.length === 0 || tab === 'proximas' ? 'Toca "Programar evaluación" para agendar la siguiente.' : 'Prueba con otra pestaña, otra aula o borra la búsqueda.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.slice(0, visibleCount).map(exam => {
            const course = courseOf(exam);
            const info = typeInfo(exam.tipo);
            const d = parseIso(exam.fecha_programada);
            const days = daysFromToday(exam.fecha_programada, todayIso);
            const past = days < 0;
            const prog = gradeProgress(exam);
            const competency = course?.competencias?.find(c => c.id === exam.competencia_id);
            const notasHref = `/docente/notas?aula=${exam.seccion_id}&curso=${exam.curso_id}&periodo=${exam.periodo_evaluacion_id}`;
            return (
              <div key={exam.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col md:flex-row md:items-center gap-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                {/* Fecha grande tipo calendario */}
                <div className={`w-20 shrink-0 rounded-2xl overflow-hidden border-2 text-center ${days === 0 ? 'border-amber-400' : past ? 'border-slate-200 dark:border-slate-700 opacity-80' : 'border-indigo-200 dark:border-indigo-800'}`}>
                  <div className={`text-[11px] font-black py-0.5 text-white ${days === 0 ? 'bg-amber-500' : past ? 'bg-slate-400' : 'bg-indigo-600'}`}>{MONTHS[d.getMonth()]}</div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white leading-tight">{d.getDate()}</div>
                  <div className="text-[11px] font-bold text-slate-500 pb-1 capitalize">{d.toLocaleDateString('es-PE', { weekday: 'short' }).replace('.', '')}</div>
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                    <span className={`px-2.5 py-0.5 rounded-full ${info.chip}`}>{info.emoji} {info.label}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-white" style={{ backgroundColor: course?.color_hex || '#6366f1' }}>{course?.nombre || 'Curso'}</span>
                    <span className={`px-2.5 py-0.5 rounded-full ${aulaColor(exam.seccion_id).chip}`}>{sectionLabel(exam.seccion_id)}</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white leading-snug">{exam.titulo}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    <span className={`font-black ${days === 0 ? 'text-amber-600' : past ? 'text-slate-500' : days <= 3 ? 'text-amber-600' : 'text-indigo-700 dark:text-indigo-300'}`}>{whenInWords(days)}</span>
                    {exam.hora_inicio && <span className="inline-flex items-center gap-1"><Clock className="w-4 h-4" /> {timeText(exam.hora_inicio)} · {exam.duracion_minutos} min</span>}
                    {periodName(exam.periodo_evaluacion_id) && <span className="text-slate-400">{periodName(exam.periodo_evaluacion_id)}</span>}
                  </p>
                  {competency && <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">Evalúa: {competency.descripcion}</p>}
                </div>

                <div className="flex flex-col gap-2 md:w-52 shrink-0">
                  {past && prog.known && (
                    <p className={`text-xs font-bold ${prog.done >= prog.total && prog.total > 0 ? 'text-emerald-600' : 'text-purple-700 dark:text-purple-300'}`}>
                      {prog.done >= prog.total && prog.total > 0 ? '✓ Notas completas' : `● Notas puestas: ${prog.done} de ${prog.total}`}
                    </p>
                  )}
                  <Link href={notasHref}
                    className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-black ${past && prog.done < prog.total ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-md' : 'bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 hover:border-indigo-500'}`}>
                    <Award className="w-4 h-4" /> Poner notas
                  </Link>
                  <div className="flex gap-2">
                    {!past && (
                      <button type="button" onClick={() => openReschedule(exam)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-amber-400 cursor-pointer">
                        <CalendarClock className="w-4 h-4 text-amber-500" /> Cambiar fecha
                      </button>
                    )}
                    <button type="button" onClick={() => setDeleting(exam)} aria-label={`Eliminar ${exam.titulo}`} className={`${past ? 'flex-1' : ''} inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-xs font-bold text-rose-600 hover:border-rose-400 cursor-pointer`}>
                      <Trash2 className="w-4 h-4" /> {past ? 'Eliminar' : ''}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length > visibleCount && (
            <button type="button" onClick={() => setVisibleCount(c => c + 8)} className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:border-indigo-400 cursor-pointer">
              Ver más ({filtered.length - visibleCount} más)
            </button>
          )}
        </div>
      )}

      {/* ───────── Ventana: programar evaluación ───────── */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Programar evaluación" maxWidth="2xl">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <p className="text-sm font-black text-slate-800 dark:text-slate-100 mb-1.5">1. ¿Qué vas a tomar?</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['examen', 'practica', 'bimestral', 'proyecto'] as ExamType[]).map(t => (
                <button key={t} type="button" onClick={() => setForm(f => ({ ...f, tipo: t }))} aria-pressed={form.tipo === t}
                  className={`p-2.5 rounded-2xl border-2 text-center cursor-pointer ${form.tipo === t ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 hover:border-indigo-400'}`}>
                  <span className="block text-2xl">{TYPE_INFO[t].emoji}</span>
                  <span className="block text-sm font-black">{TYPE_INFO[t].label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-black text-slate-800 dark:text-slate-100 mb-1.5">2. ¿Para qué aula?</p>
            <div className="flex flex-wrap gap-2">
              {teacherSections.map(ts => (
                <button key={ts.seccion.id} type="button" onClick={() => pickSection(ts.seccion.id)} aria-pressed={form.seccionId === ts.seccion.id} className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 text-sm font-black cursor-pointer ${aulaBtnCls(ts.seccion.id, form.seccionId === ts.seccion.id)}`}>
                  {form.seccionId !== ts.seccion.id && aulaDot(ts.seccion.id)}{sectionLabel(ts.seccion.id)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-black text-slate-800 dark:text-slate-100 mb-1.5">3. ¿De qué curso?</p>
            {formCourses.length === 0 ? <p className="text-sm text-amber-600 font-semibold">No dictas cursos en esta aula.</p> : (
              <div className="flex flex-wrap gap-2">
                {formCourses.map(c => (
                  <button key={c.id} type="button" onClick={() => pickCourse(c.id)} aria-pressed={form.cursoId === c.id} className={`inline-flex items-center gap-2 ${chipCls(form.cursoId === c.id, 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900')}`}>
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color_hex || '#3b82f6' }} /> {c.nombre}
                  </button>
                ))}
              </div>
            )}
          </div>

          {formCompetencies.length > 0 && (
            <div>
              <p className="text-sm font-black text-slate-800 dark:text-slate-100 mb-1.5">4. ¿Qué competencia evalúa? <span className="font-normal text-slate-500">(la nota irá a esta columna del registro)</span></p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {formCompetencies.map((c, i) => (
                  <button key={c.id} type="button" onClick={() => setForm(f => ({ ...f, competenciaId: c.id }))} aria-pressed={form.competenciaId === c.id}
                    className={`text-left px-3 py-2 rounded-xl border-2 text-sm cursor-pointer ${form.competenciaId === c.id ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 text-indigo-900 dark:text-indigo-100' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-300'}`}>
                    <span className="font-black">Competencia {i + 1}:</span> {c.descripcion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <label className="block">
            <span className="block text-sm font-black text-slate-800 dark:text-slate-100 mb-1.5">{formCompetencies.length > 0 ? 5 : 4}. Nombre de la evaluación</span>
            <input required type="text" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Ej. Práctica de fracciones" className={inputCls} />
          </label>

          <div>
            <p className="text-sm font-black text-slate-800 dark:text-slate-100 mb-1.5">{formCompetencies.length > 0 ? 6 : 5}. ¿Cuándo?</p>
            {dateChooser(form.fecha, form.hora, form.duracion, patch => setForm(f => ({ ...f, ...patch })))}
            {formDateInvalid ? (
              <p className="mt-1.5 text-sm font-bold text-rose-600 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Elige una fecha de hoy en adelante.</p>
            ) : (
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
                Será el <strong>{longDate(form.fecha)} a las {timeText(form.hora)}</strong>{formPeriod ? <> · cuenta para el <strong>{formPeriod.nombre}</strong></> : null}
              </p>
            )}
          </div>

          <label className="block">
            <span className="block text-sm font-black text-slate-800 dark:text-slate-100 mb-1.5">Temas que entran <span className="font-normal text-slate-500">(opcional)</span></span>
            <textarea rows={2} value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Ej. Suma y resta de fracciones, fracciones equivalentes." className={`${inputCls} resize-none`} />
          </label>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-sm text-slate-600 dark:text-slate-300">Se avisará a <strong>{studentsOf(form.seccionId).length} {studentsOf(form.seccionId).length === 1 ? 'alumno' : 'alumnos'}</strong> de {sectionLabel(form.seccionId)}.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer">Cancelar</button>
              <button type="submit" disabled={!canCreate} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                <CalendarDays className="w-4 h-4" /> Programar
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* ───────── Ventana: cambiar fecha ───────── */}
      {rescheduling && (
        <Modal isOpen={!!rescheduling} onClose={() => setRescheduling(null)} title="Cambiar fecha" maxWidth="lg">
          <div className="space-y-4">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <p className="text-lg font-black text-slate-900 dark:text-white">{rescheduling.titulo}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">Fecha actual: {longDate(rescheduling.fecha_programada)}{rescheduling.hora_inicio ? ` a las ${timeText(rescheduling.hora_inicio)}` : ''}</p>
            </div>
            {dateChooser(resForm.fecha, resForm.hora, resForm.duracion, patch => setResForm(f => ({ ...f, ...patch })))}
            {resInvalid ? (
              <p className="text-sm font-bold text-rose-600 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Elige una fecha de hoy en adelante.</p>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-300">Nueva fecha: <strong>{longDate(resForm.fecha)} a las {timeText(resForm.hora)}</strong> · Los alumnos recibirán un aviso.</p>
            )}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={() => setRescheduling(null)} className="px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer">Cancelar</button>
              <button type="button" disabled={resInvalid} onClick={saveReschedule} className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-black shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">Guardar nueva fecha</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ───────── Ventana: confirmar eliminación ───────── */}
      {deleting && (
        <Modal isOpen={!!deleting} onClose={() => setDeleting(null)} title="¿Eliminar evaluación?" maxWidth="md">
          <div className="space-y-4">
            <p className="text-sm text-slate-700 dark:text-slate-200">
              Vas a eliminar <strong>{deleting.titulo}</strong> ({sectionLabel(deleting.seccion_id)}, {longDate(deleting.fecha_programada)}). Los alumnos ya no la verán en su calendario.
            </p>
            <p className="text-xs text-slate-500">Las notas que ya pusiste en el registro no se borran.</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDeleting(null)} className="px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer">No, volver</button>
              <button type="button" onClick={confirmDelete} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-black cursor-pointer"><Trash2 className="w-4 h-4" /> Sí, eliminar</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
