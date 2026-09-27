'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '@/context/AppContext';
import Link from 'next/link';
import { EvaluationExam } from '@/types';
import { GradeBadge } from '@/components/notas/GradeBadge';
import { getGradeMeta } from '@/lib/grades/calculations';
import {
  Calendar,
  Clock,
  ChevronDown,
  Check,
  Sparkles,
  Target,
  ListChecks,
  History,
  Lightbulb,
  PartyPopper,
  X,
  ChevronRight,
  MessageCircle,
} from 'lucide-react';

// Mensaje de ánimo según la nota obtenida
const GRADE_CHEER = {
  AD: '🌟 ¡Excelente! Superaste lo esperado. ¡Sigue así!',
  A: '🎉 ¡Muy bien! Lograste lo que se esperaba.',
  B: '💪 ¡Vas cerca! Repasa un poco más y lo lograrás.',
  C: '🌱 Este tema necesita práctica. Pide ayuda a tu profesor, ¡tú puedes!',
} as const;

// ── Utilidades de fecha (fechas locales YYYY-MM-DD, sin desfase UTC) ──
function parseLocalDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function daysFromToday(iso: string) {
  return Math.round((parseLocalDate(iso).getTime() - startOfToday().getTime()) / 86400000);
}

function longDate(iso: string) {
  const text = parseLocalDate(iso).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function durationText(min: number) {
  if (!min) return 'Duración por confirmar';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

function whenText(days: number) {
  if (days === 0) return '¡Es hoy!';
  if (days === 1) return 'Mañana';
  if (days < 0) return days === -1 ? 'Fue ayer' : `Hace ${-days} días`;
  return `En ${days} días`;
}

// ── Cada tipo de evaluación con su nombre amigable, dibujo y color ──
const TYPE_META: Record<EvaluationExam['tipo'], { label: string; emoji: string; chip: string; soft: string }> = {
  examen: { label: 'Examen', emoji: '📝', chip: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300', soft: 'from-indigo-50 to-white dark:from-indigo-950/40 dark:to-slate-900' },
  practica: { label: 'Práctica calificada', emoji: '✏️', chip: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300', soft: 'from-sky-50 to-white dark:from-sky-950/40 dark:to-slate-900' },
  bimestral: { label: 'Examen bimestral', emoji: '📚', chip: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300', soft: 'from-purple-50 to-white dark:from-purple-950/40 dark:to-slate-900' },
  actividad: { label: 'Actividad evaluada', emoji: '🎯', chip: 'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300', soft: 'from-teal-50 to-white dark:from-teal-950/40 dark:to-slate-900' },
  proyecto: { label: 'Proyecto', emoji: '🏆', chip: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300', soft: 'from-amber-50 to-white dark:from-amber-950/40 dark:to-slate-900' },
};

// Color del contador según lo cerca que está la evaluación
function urgencyChip(days: number) {
  if (days <= 1) return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300';
  if (days <= 3) return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300';
  return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300';
}

// Plan de estudio sugerido según los días que faltan
function studyPlan(days: number, course: string): string[] {
  if (days <= 0) {
    return ['Respira hondo antes de empezar', 'Lee cada pregunta con calma', 'Revisa tus respuestas antes de entregar'];
  }
  if (days <= 2) {
    return [`Haz un repaso corto de ${course}`, 'Prepara tus útiles en la mochila', 'Duerme temprano la noche anterior'];
  }
  return [
    `Repasa tus apuntes de ${course}`,
    'Practica ejercicios parecidos a los de clase',
    'Anota tus dudas y pregúntale a tu profesor',
    'La noche antes: repaso corto y a dormir temprano',
  ];
}

const BEFORE_TIPS = [
  { emoji: '😴', title: 'Duerme bien', text: '8 a 10 horas la noche anterior', bg: 'bg-indigo-50 dark:bg-indigo-950/40' },
  { emoji: '🥣', title: 'Desayuna', text: 'Tu cerebro necesita energía', bg: 'bg-amber-50 dark:bg-amber-950/40' },
  { emoji: '🎒', title: 'Lleva tus útiles', text: 'Lápiz, borrador y regla', bg: 'bg-sky-50 dark:bg-sky-950/40' },
  { emoji: '🧘', title: 'Respira hondo', text: 'Los nervios bajan si respiras lento', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
];

// Dibujo amigable para la cabecera (calendario con lápiz y estrellas)
function ExamsIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden="true">
      <circle cx="80" cy="62" r="52" className="fill-white/60 dark:fill-white/5" />
      <rect x="38" y="30" width="74" height="70" rx="12" className="fill-white dark:fill-slate-800" stroke="#6366f1" strokeWidth="3" />
      <rect x="38" y="30" width="74" height="20" rx="10" fill="#6366f1" />
      <rect x="38" y="40" width="74" height="10" fill="#6366f1" />
      <rect x="52" y="22" width="6" height="16" rx="3" fill="#312e81" />
      <rect x="92" y="22" width="6" height="16" rx="3" fill="#312e81" />
      <circle cx="56" cy="64" r="5" fill="#a5b4fc" />
      <circle cx="75" cy="64" r="5" fill="#a5b4fc" />
      <circle cx="94" cy="64" r="5" fill="#f472b6" />
      <circle cx="56" cy="84" r="5" fill="#a5b4fc" />
      <circle cx="75" cy="84" r="5" fill="#34d399" />
      <path d="M90 84 l4 4 l8 -9" fill="none" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <g transform="rotate(35 128 70)">
        <rect x="122" y="40" width="12" height="48" rx="3" fill="#fbbf24" />
        <rect x="122" y="40" width="12" height="8" rx="3" fill="#f472b6" />
        <path d="M122 88 L128 100 L134 88 Z" fill="#fde68a" />
        <path d="M126.5 97 L128 100 L129.5 97 Z" fill="#334155" />
      </g>
      <path d="M22 30 l3 6 l6 1 l-4.5 4.5 l1 6.5 l-5.5 -3 l-5.5 3 l1 -6.5 l-4.5 -4.5 l6 -1 Z" fill="#fbbf24" />
      <path d="M140 18 l2 4 l4 0.7 l-3 3 l0.7 4.3 l-3.7 -2 l-3.7 2 l0.7 -4.3 l-3 -3 l4 -0.7 Z" fill="#f472b6" />
    </svg>
  );
}

export default function EstudianteEvaluacionesPage() {
  const { exams, courses, grades, currentUser, students, enrollments } = useApp();
  const [selectedPastExam, setSelectedPastExam] = useState<EvaluationExam | null>(null);

  // Cerrar el modal de detalle con Esc
  useEffect(() => {
    if (!selectedPastExam) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedPastExam(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selectedPastExam]);
  const [typeFilter, setTypeFilter] = useState<'todos' | EvaluationExam['tipo']>('todos');
  const [openExamId, setOpenExamId] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);
  const pastButtonRef = useRef<HTMLButtonElement>(null);
  const pastPanelRef = useRef<HTMLDivElement>(null);

  // El menú de "ya rendidas" se cierra al hacer clic fuera o con Esc
  useEffect(() => {
    if (!showPast) return;
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (pastPanelRef.current?.contains(target) || pastButtonRef.current?.contains(target)) return;
      setShowPast(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowPast(false); };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [showPast]);
  const [checkedSteps, setCheckedSteps] = useState<Set<string>>(new Set());

  const currentStudent = useMemo(
    () => students.find(s => s.profile_id === currentUser?.id || s.id === currentUser?.id),
    [students, currentUser]
  );
  const currentEnrollment = useMemo(
    () => enrollments.find(e => e.estudiante_id === currentStudent?.id),
    [enrollments, currentStudent]
  );

  const myExams = useMemo(() => {
    const sectionId = currentEnrollment?.seccion_id;
    return exams.filter(e => e.estado !== 'borrador' && (!sectionId || !e.seccion_id || e.seccion_id === sectionId));
  }, [exams, currentEnrollment]);

  const courseOf = (exam: EvaluationExam) => courses.find(c => c.id === exam.curso_id);
  const courseName = (exam: EvaluationExam) => courseOf(exam)?.nombre || 'Curso';
  const courseColor = (exam: EvaluationExam) => courseOf(exam)?.color_hex || '#6366f1';

  const upcoming = useMemo(
    () => myExams
      .filter(e => daysFromToday(e.fecha_programada) >= 0 && e.estado !== 'finalizada' && e.estado !== 'calificada')
      .sort((a, b) => (a.fecha_programada + (a.hora_inicio || '')).localeCompare(b.fecha_programada + (b.hora_inicio || ''))),
    [myExams]
  );
  const past = useMemo(
    () => myExams
      .filter(e => !upcoming.includes(e))
      .sort((a, b) => b.fecha_programada.localeCompare(a.fecha_programada)),
    [myExams, upcoming]
  );

  // Nota de una evaluación: el registro de la competencia que evalúa, en su bimestre
  // (el sistema no guarda notas por evaluación, sino por competencia y periodo)
  const examGrade = (exam: EvaluationExam) => {
    if (!exam.competencia_id || !currentEnrollment?.id) return null;
    return grades.find(g =>
      g.matricula_id === currentEnrollment.id &&
      g.competencia_id === exam.competencia_id &&
      g.periodo_evaluacion_id === exam.periodo_evaluacion_id
    ) || null;
  };

  const nextExam = upcoming[0] || null;
  const nextDays = nextExam ? daysFromToday(nextExam.fecha_programada) : null;
  const thisWeekCount = upcoming.filter(e => daysFromToday(e.fecha_programada) <= 7).length;

  const filteredUpcoming = typeFilter === 'todos' ? upcoming : upcoming.filter(e => e.tipo === typeFilter);
  const typesPresent = (Object.keys(TYPE_META) as EvaluationExam['tipo'][]).filter(t => upcoming.some(e => e.tipo === t));

  // Agrupar por cercanía para que se entienda de un vistazo
  const groups = [
    { id: 'hoy', title: 'Hoy', items: filteredUpcoming.filter(e => daysFromToday(e.fecha_programada) === 0) },
    { id: 'manana', title: 'Mañana', items: filteredUpcoming.filter(e => daysFromToday(e.fecha_programada) === 1) },
    { id: 'semana', title: 'Esta semana', items: filteredUpcoming.filter(e => { const d = daysFromToday(e.fecha_programada); return d >= 2 && d <= 7; }) },
    { id: 'despues', title: 'Más adelante', items: filteredUpcoming.filter(e => daysFromToday(e.fecha_programada) > 7) },
  ].filter(g => g.items.length > 0);

  // Próximos 14 días con marca en los días con evaluación
  const nextTwoWeeks = Array.from({ length: 14 }, (_, i) => {
    const d = startOfToday();
    d.setDate(d.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { iso, date: d, exams: upcoming.filter(e => e.fecha_programada.slice(0, 10) === iso) };
  });

  const studentName = currentStudent?.profile?.nombres?.split(' ')[0] || currentUser?.nombres?.split(' ')[0] || '';
  const plan = nextExam && nextDays !== null ? studyPlan(nextDays, courseName(nextExam)) : [];

  const toggleStep = (key: string) => {
    setCheckedSteps(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto animate-in fade-in-50 pb-12">

      {/* ── CABECERA AMIGABLE CON DIBUJO ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-100 via-sky-50 to-pink-100 dark:from-indigo-950/60 dark:via-slate-900 dark:to-purple-950/50 border border-violet-200/70 dark:border-indigo-900/60 px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Mis evaluaciones {studentName && <span className="text-violet-600 dark:text-violet-300">· {studentName}</span>}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Aquí ves cuándo son tus exámenes, qué entra y cómo prepararte. ¡Tú puedes! 💪
            </p>
            <div className="flex flex-wrap gap-2 pt-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 dark:bg-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-200">
                <Target className="w-3.5 h-3.5 text-violet-500" /> {upcoming.length} por rendir
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 dark:bg-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-200">
                <Calendar className="w-3.5 h-3.5 text-sky-500" /> {thisWeekCount} en los próximos 7 días
              </span>
            </div>
          </div>
          <ExamsIllustration className="hidden sm:block w-36 h-28 shrink-0 animate-float" />
        </div>
      </div>

      {upcoming.length === 0 ? (
        /* ── SIN EVALUACIONES PRÓXIMAS ── */
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-8 text-center space-y-2">
          <div className="text-5xl" aria-hidden="true">🎉</div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">¡No tienes evaluaciones programadas!</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Cuando tus profesores programen un examen o una práctica, aparecerá aquí con su fecha y lo que debes estudiar.
            Mientras tanto, repasar un poquito cada día te deja siempre listo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

          {/* ── COLUMNA PRINCIPAL ── */}
          <div className="lg:col-span-8 space-y-4">

            {/* Próxima evaluación destacada con cuenta regresiva */}
            {nextExam && nextDays !== null && (
              <div className={`rounded-3xl bg-gradient-to-br ${TYPE_META[nextExam.tipo].soft} border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5`}>
                <p className="text-xs font-black uppercase tracking-wider text-violet-600 dark:text-violet-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> Tu próxima evaluación
                </p>
                <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className={`w-24 h-24 rounded-3xl flex flex-col items-center justify-center shrink-0 ${urgencyChip(nextDays)}`}>
                    {nextDays === 0 ? (
                      <span className="text-2xl font-black">¡Hoy!</span>
                    ) : (
                      <>
                        <span className="text-4xl font-black leading-none">{nextDays}</span>
                        <span className="text-xs font-bold">{nextDays === 1 ? 'día' : 'días'}</span>
                      </>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: courseColor(nextExam) }}>
                        {courseName(nextExam)}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${TYPE_META[nextExam.tipo].chip}`}>
                        {TYPE_META[nextExam.tipo].emoji} {TYPE_META[nextExam.tipo].label}
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug">{nextExam.titulo}</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="inline-flex items-center gap-1"><Calendar className="w-4 h-4 text-violet-500" /> {longDate(nextExam.fecha_programada)}</span>
                      {nextExam.hora_inicio && <span className="inline-flex items-center gap-1"><Clock className="w-4 h-4 text-sky-500" /> {nextExam.hora_inicio}</span>}
                      <span className="inline-flex items-center gap-1">⏱️ {durationText(nextExam.duracion_minutos)}</span>
                    </p>
                  </div>
                </div>

                {/* Plan de estudio con casillas */}
                <div className="mt-4 rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-white dark:border-slate-800 p-3">
                  <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-emerald-500" /> Tu plan para prepararte
                  </p>
                  <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {plan.map(step => {
                      const key = `${nextExam.id}:${step}`;
                      const done = checkedSteps.has(key);
                      return (
                        <li key={key}>
                          <button
                            type="button"
                            onClick={() => toggleStep(key)}
                            className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left text-sm transition-colors cursor-pointer ${
                              done ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                              {done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </span>
                            <span className={done ? 'line-through' : ''}>{step}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            )}

            {/* Filtro por tipo */}
            {typesPresent.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setTypeFilter('todos')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer ${typeFilter === 'todos' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
                >
                  Todas ({upcoming.length})
                </button>
                {typesPresent.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTypeFilter(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer ${typeFilter === t ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : `${TYPE_META[t].chip}`}`}
                  >
                    {TYPE_META[t].emoji} {TYPE_META[t].label} ({upcoming.filter(e => e.tipo === t).length})
                  </button>
                ))}
              </div>
            )}

            {/* Lista agrupada por cercanía */}
            {groups.map(group => (
              <section key={group.id} className="space-y-2">
                <h3 className="px-1 text-sm font-black text-slate-700 dark:text-slate-300">{group.title}</h3>
                {group.items.map(exam => {
                  const days = daysFromToday(exam.fecha_programada);
                  const meta = TYPE_META[exam.tipo];
                  const isOpen = openExamId === exam.id;
                  const hasDetails = !!(exam.descripcion || exam.instrucciones || exam.rubrica_criterios?.length);
                  return (
                    <div key={exam.id} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                      <div className="flex">
                        <span className="w-1.5 shrink-0" style={{ backgroundColor: courseColor(exam) }} />
                        <div className="flex-1 p-3 sm:p-4 flex items-center gap-3">
                          <span className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${meta.chip}`} aria-hidden="true">{meta.emoji}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-black text-slate-900 dark:text-white truncate">{exam.titulo}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              <strong className="text-slate-700 dark:text-slate-300">{courseName(exam)}</strong> · {meta.label} · {longDate(exam.fecha_programada)}
                              {exam.hora_inicio ? ` · ${exam.hora_inicio}` : ''} · {durationText(exam.duracion_minutos)}
                            </p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-black whitespace-nowrap ${urgencyChip(days)}`}>{whenText(days)}</span>
                          {hasDetails && (
                            <button
                              type="button"
                              onClick={() => setOpenExamId(isOpen ? null : exam.id)}
                              aria-expanded={isOpen}
                              aria-label={isOpen ? 'Ocultar detalles' : 'Ver qué entra'}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40 cursor-pointer"
                            >
                              <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                            </button>
                          )}
                        </div>
                      </div>

                      {isOpen && (
                        <div className="px-4 pb-4 pt-1 ml-1.5 space-y-2 text-sm animate-in fade-in-50">
                          {exam.descripcion && (
                            <p className="text-slate-600 dark:text-slate-300"><strong className="text-slate-800 dark:text-slate-100">📖 Qué entra: </strong>{exam.descripcion}</p>
                          )}
                          {exam.instrucciones && (
                            <p className="text-slate-600 dark:text-slate-300"><strong className="text-slate-800 dark:text-slate-100">📌 Indicaciones: </strong>{exam.instrucciones}</p>
                          )}
                          {!!exam.rubrica_criterios?.length && (
                            <div>
                              <p className="font-bold text-slate-800 dark:text-slate-100">✅ Lo que van a revisar:</p>
                              <ul className="mt-1 flex flex-wrap gap-1.5">
                                {exam.rubrica_criterios.map(c => (
                                  <li key={c.criterio} className="px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 text-xs font-semibold">
                                    {c.criterio}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </section>
            ))}
          </div>

          {/* ── COLUMNA LATERAL ── */}
          <div className="lg:col-span-4 space-y-4">

            {/* Próximos 14 días */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-violet-500" /> Próximas 2 semanas
              </h3>
              <div className="mt-3 grid grid-cols-7 gap-1 text-center">
                {nextTwoWeeks.map(({ iso, date, exams: dayExams }, i) => (
                  <div
                    key={iso}
                    title={dayExams.map(e => `${courseName(e)}: ${e.titulo}`).join('\n') || undefined}
                    className={`rounded-xl py-1.5 ${
                      dayExams.length ? 'bg-violet-100 dark:bg-violet-950/60 text-violet-800 dark:text-violet-200' : i === 0 ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <p className="text-[10px] font-bold uppercase">{date.toLocaleDateString('es-PE', { weekday: 'short' }).slice(0, 2)}</p>
                    <p className="text-sm font-black">{date.getDate()}</p>
                    <p className="text-xs leading-none h-3">{dayExams.length ? TYPE_META[dayExams[0].tipo].emoji : ''}</p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-slate-400">Los días con dibujo tienen evaluación. El primero es hoy.</p>
            </div>

            {/* Consejos antes de cada evaluación */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" /> Antes de cada evaluación
              </h3>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {BEFORE_TIPS.map(tip => (
                  <div key={tip.title} className={`rounded-2xl p-3 ${tip.bg}`}>
                    <div className="text-2xl" aria-hidden="true">{tip.emoji}</div>
                    <p className="text-xs font-black text-slate-800 dark:text-slate-100 mt-1">{tip.title}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{tip.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mensaje de ánimo */}
            <div className="rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200/70 dark:border-emerald-900/50 p-4 flex gap-3">
              <PartyPopper className="w-6 h-6 text-emerald-500 shrink-0" />
              <p className="text-sm text-emerald-900 dark:text-emerald-200">
                Una nota no dice cuánto vales. Si algo sale difícil, es una pista de qué practicar. ¡Pregunta sin miedo! 🌱
              </p>
            </div>
          </div>
        </div>
      )}


      {/* ── BOTÓN FLOTANTE: EVALUACIONES YA RENDIDAS (estilo botón de WhatsApp) ── */}
      {past.length > 0 && createPortal(
        <div className="fixed bottom-[9.5rem] md:bottom-24 right-4 md:right-6 z-[9989] flex flex-col items-end print:hidden">
          {showPast && (
            <div
              ref={pastPanelRef}
              role="dialog"
              aria-label="Evaluaciones que ya rendiste"
              className="mb-3 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 origin-bottom-right"
            >
              <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-full bg-violet-500 text-white flex items-center justify-center">
                    <History className="w-4 h-4" />
                  </span>
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">Evaluaciones que ya rendiste</p>
                    <p className="text-[10px] font-semibold text-violet-600 dark:text-violet-400">
                      {past.length} {past.length === 1 ? 'evaluación terminada' : 'evaluaciones terminadas'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPast(false)}
                  aria-label="Cerrar"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ul className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {past.map(exam => {
                  const grade = examGrade(exam);
                  return (
                    <li key={exam.id}>
                      <button
                        type="button"
                        onClick={() => { setSelectedPastExam(exam); setShowPast(false); }}
                        className="w-full px-4 py-2.5 flex items-center gap-2.5 text-xs text-left hover:bg-violet-50/70 dark:hover:bg-violet-950/30 transition-colors cursor-pointer"
                        title="Ver detalle de la evaluación"
                      >
                        <span className="text-base" aria-hidden="true">{TYPE_META[exam.tipo].emoji}</span>
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: courseColor(exam) }} />
                        <span className="flex-1 min-w-0">
                          <span className="block truncate text-slate-800 dark:text-slate-200 font-semibold">{exam.titulo}</span>
                          <span className="block text-[11px] text-slate-400">{courseName(exam)} · {longDate(exam.fecha_programada)}</span>
                        </span>
                        {grade ? (
                          <GradeBadge grade={grade.nota_letra} size="sm" />
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            Sin nota aún
                          </span>
                        )}
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <button
            ref={pastButtonRef}
            type="button"
            onClick={() => setShowPast(v => !v)}
            aria-expanded={showPast}
            aria-label="Ver evaluaciones que ya rendiste"
            title="Evaluaciones que ya rendiste"
            className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-violet-500/30 opacity-80 hover:opacity-100 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            {showPast ? <X className="w-5 h-5" /> : <History className="w-5 h-5" />}
            {!showPast && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-white text-violet-700 border-2 border-violet-500 text-[10px] font-black flex items-center justify-center">
                {past.length}
              </span>
            )}
          </button>
        </div>,
        document.body
      )}

      {/* ── MODAL: DETALLE DE UNA EVALUACIÓN YA RENDIDA ── */}
      {selectedPastExam && (() => {
        const exam = selectedPastExam;
        const meta = TYPE_META[exam.tipo];
        const grade = examGrade(exam);
        const gradeMeta = grade ? getGradeMeta(grade.nota_letra) : null;
        const competency = courseOf(exam)?.competencias?.find(c => c.id === exam.competencia_id);
        const cheer = grade ? GRADE_CHEER[grade.nota_letra as keyof typeof GRADE_CHEER] : null;
        // Portal al <body>: así el `space-y-4` de la página no le agrega margen superior a la capa fija
        return createPortal(
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in-50"
            onMouseDown={(e) => { if (e.target === e.currentTarget) setSelectedPastExam(null); }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`Detalle de ${exam.titulo}`}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200"
            >
              {/* Cabecera con el color del curso */}
              <div className={`relative px-5 pt-5 pb-4 bg-gradient-to-br ${meta.soft} border-b border-slate-100 dark:border-slate-800`}>
                <button
                  type="button"
                  onClick={() => setSelectedPastExam(null)}
                  aria-label="Cerrar"
                  className="absolute top-3 right-3 p-1.5 rounded-xl bg-white/80 dark:bg-slate-800/80 text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-start gap-3 pr-8">
                  <span className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${meta.chip}`} aria-hidden="true">{meta.emoji}</span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white" style={{ backgroundColor: courseColor(exam) }}>
                        {courseName(exam)}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${meta.chip}`}>{meta.label}</span>
                    </div>
                    <h2 className="mt-1.5 text-lg font-black text-slate-900 dark:text-white leading-snug">{exam.titulo}</h2>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 flex flex-wrap gap-x-3 gap-y-0.5">
                      <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-violet-500" /> {longDate(exam.fecha_programada)}</span>
                      {exam.hora_inicio && <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-sky-500" /> {exam.hora_inicio}</span>}
                      <span>⏱️ {durationText(exam.duracion_minutos)}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Nota */}
                {grade && gradeMeta ? (
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 p-4">
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Tu nota en la competencia evaluada</p>
                    <div className="mt-2 flex items-center gap-3">
                      <GradeBadge grade={grade.nota_letra} size="xl" />
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-900 dark:text-white">{gradeMeta.label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{gradeMeta.desc}</p>
                      </div>
                    </div>
                    {cheer && (
                      <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{cheer}</p>
                    )}
                    {grade.conclusion_descriptiva && (
                      <p className="mt-2 text-xs italic text-slate-600 dark:text-slate-300 flex gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5 text-violet-500 shrink-0 mt-0.5" />
                        <span>&ldquo;{grade.conclusion_descriptiva}&rdquo;</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-dashed border-slate-300 dark:border-slate-700 p-4 flex items-center gap-3">
                    <span className="text-3xl" aria-hidden="true">⏳</span>
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white">Sin nota aún</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Tu profesor todavía no registra la nota de esta evaluación. ¡Pronto la verás aquí!</p>
                    </div>
                  </div>
                )}

                {/* Qué se evaluó */}
                {competency && (
                  <div>
                    <p className="text-xs font-black text-slate-800 dark:text-slate-100">🎯 Competencia evaluada</p>
                    <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{competency.descripcion}</p>
                  </div>
                )}
                {exam.descripcion && (
                  <div>
                    <p className="text-xs font-black text-slate-800 dark:text-slate-100">📖 Qué entró</p>
                    <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{exam.descripcion}</p>
                  </div>
                )}
                {!!exam.rubrica_criterios?.length && (
                  <div>
                    <p className="text-xs font-black text-slate-800 dark:text-slate-100">✅ Lo que se revisó</p>
                    <ul className="mt-1.5 flex flex-wrap gap-1.5">
                      {exam.rubrica_criterios.map(c => (
                        <li key={c.criterio} className="px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 text-xs font-semibold">
                          {c.criterio}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {!!exam.ponderacion && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Esta evaluación vale el <strong className="text-slate-700 dark:text-slate-200">{exam.ponderacion}%</strong> de la nota del bimestre en esta competencia.
                  </p>
                )}
              </div>

              <div className="px-5 pb-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPastExam(null)}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Cerrar
                </button>
                <Link
                  href="/estudiante/libreta-notas"
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-violet-600 hover:bg-violet-700 text-white text-center"
                >
                  Ver mi libreta de notas
                </Link>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}
    </div>
  );
}
