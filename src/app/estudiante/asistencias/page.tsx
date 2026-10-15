'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { useParentChildren } from '@/hooks/useParentChildren';
import { AttendanceRecord, AttendanceStatus } from '@/types';
import { AttendanceSkeleton } from '@/components/estudiante/asistencias/AttendanceSkeleton';
import { exportAttendanceToPDF, exportAttendanceToExcel } from '@/components/estudiante/asistencias/ExportAttendance';
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Flame,
  HelpCircle,
  QrCode,
  Sparkles,
  X,
} from 'lucide-react';

// ── Cada estado con su nombre amigable, dibujo y colores ──
const STATUS_META: Record<AttendanceStatus, { label: string; singular: string; plural: string; emoji: string; chip: string; dot: string; stripe: string; cell: string }> = {
  presente: {
    label: 'A tiempo', singular: 'a tiempo', plural: 'a tiempo', emoji: '✅',
    chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    dot: 'bg-emerald-500', stripe: 'bg-emerald-500',
    cell: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200',
  },
  tardanza: {
    label: 'Tardanza', singular: 'tardanza', plural: 'tardanzas', emoji: '⏰',
    chip: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
    dot: 'bg-amber-500', stripe: 'bg-amber-400',
    cell: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200',
  },
  falta: {
    label: 'Falta', singular: 'falta', plural: 'faltas', emoji: '❌',
    chip: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
    dot: 'bg-rose-500', stripe: 'bg-rose-500',
    cell: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200',
  },
  justificado: {
    label: 'Falta justificada', singular: 'justificada', plural: 'justificadas', emoji: '📝',
    chip: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
    dot: 'bg-sky-500', stripe: 'bg-sky-400',
    cell: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-200',
  },
};

type Period = 'mes' | 'anterior' | 'anio';

function parseLocal(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
function isoOf(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
function timeText(hora?: string) {
  if (!hora || hora === '—') return '';
  const [h, m] = hora.split(':').map(Number);
  if (Number.isNaN(h)) return hora;
  const d = new Date();
  d.setHours(h, m || 0, 0, 0);
  return d.toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit' });
}
// Con `who` (nombre del hijo) el mensaje va en tercera persona para el apoderado
function recordMessage(r: AttendanceRecord, who?: string) {
  const t = timeText(r.hora_registro);
  if (who) {
    if (r.estado === 'presente') return t ? `${who} llegó a tiempo a las ${t}` : `${who} llegó a tiempo`;
    if (r.estado === 'tardanza') return t ? `${who} llegó tarde, a las ${t}` : `${who} llegó tarde`;
    if (r.estado === 'justificado') return `${who} faltó, pero la falta fue justificada`;
    return `${who} no asistió a clases`;
  }
  if (r.estado === 'presente') return t ? `Llegaste a tiempo a las ${t}` : 'Llegaste a tiempo';
  if (r.estado === 'tardanza') return t ? `Llegaste tarde, a las ${t}` : 'Llegaste tarde';
  if (r.estado === 'justificado') return 'Faltaste, pero tu familia lo justificó';
  return 'No asististe a clases';
}

// Dibujo amigable: colegio con reloj y estrellas
function AttendanceIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden="true">
      <circle cx="80" cy="64" r="50" className="fill-white/60 dark:fill-white/5" />
      <path d="M40 58 L80 32 L120 58 Z" fill="#f97316" />
      <rect x="46" y="58" width="68" height="46" rx="4" className="fill-white dark:fill-slate-800" stroke="#10b981" strokeWidth="3" />
      <rect x="72" y="80" width="16" height="24" rx="3" fill="#10b981" />
      <rect x="54" y="68" width="12" height="10" rx="2" fill="#bae6fd" />
      <rect x="94" y="68" width="12" height="10" rx="2" fill="#bae6fd" />
      <circle cx="80" cy="48" r="7" fill="#fff" stroke="#334155" strokeWidth="2" />
      <path d="M80 44 V48 L83 50" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
      <rect x="79" y="14" width="2" height="18" fill="#64748b" />
      <path d="M81 14 L96 19 L81 24 Z" fill="#ef4444" />
      <path d="M24 34 l3 6 l6 1 l-4.5 4.5 l1 6.5 l-5.5 -3 l-5.5 3 l1 -6.5 l-4.5 -4.5 l6 -1 Z" fill="#fbbf24" />
      <path d="M138 30 l2 4 l4 0.7 l-3 3 l0.7 4.3 l-3.7 -2 l-3.7 2 l0.7 -4.3 l-3 -3 l4 -0.7 Z" fill="#34d399" />
      <circle cx="130" cy="92" r="11" fill="#10b981" />
      <path d="M125 92 l4 4 l7 -8" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function EstudianteAsistenciasPage() {
  const { students, enrollments, attendances, currentUser, isLoading, showToast } = useApp();

  // El apoderado ve la asistencia del hijo seleccionado, no la suya
  const { child } = useParentChildren();
  const isParent = currentUser?.rol === 'apoderado';
  const activeStudent = useMemo(
    () => isParent ? child?.student : students.find(s => s.profile_id === currentUser?.id || s.id === currentUser?.id),
    [isParent, child?.student, students, currentUser?.id]
  );
  const activeEnrollment = useMemo(
    () => isParent ? child?.enrollment : enrollments.find(e => e.estudiante_id === activeStudent?.id),
    [isParent, child?.enrollment, enrollments, activeStudent?.id]
  );
  // Nombre del hijo para los textos en tercera persona (vacío para el estudiante)
  const childName = isParent ? (activeStudent?.profile?.nombres || activeStudent?.nombres || 'Tu hijo').split(' ')[0] : '';

  // Un registro por día (el de ingreso); las salidas no cuentan para la asistencia
  const myDays = useMemo(() => {
    if (!activeEnrollment?.id) return [];
    const byDay = new Map<string, AttendanceRecord>();
    attendances
      .filter(a => a.matricula_id === activeEnrollment.id && a.tipo_registro !== 'salida')
      .forEach(a => {
        const prev = byDay.get(a.fecha);
        if (!prev || (a.hora_registro || '') < (prev.hora_registro || '')) byDay.set(a.fecha, a);
      });
    return Array.from(byDay.values()).sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [attendances, activeEnrollment?.id]);

  const [period, setPeriod] = useState<Period>('mes');
  const [statusFilter, setStatusFilter] = useState<'todos' | AttendanceStatus>('todos');
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [calMonth, setCalMonth] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });

  const today = new Date();
  const todayIso = isoOf(today);

  const periodRange = useMemo(() => {
    const n = new Date();
    if (period === 'mes') return { start: isoOf(new Date(n.getFullYear(), n.getMonth(), 1)), end: isoOf(new Date(n.getFullYear(), n.getMonth() + 1, 0)), label: capitalize(n.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })) };
    if (period === 'anterior') {
      const p = new Date(n.getFullYear(), n.getMonth() - 1, 1);
      return { start: isoOf(p), end: isoOf(new Date(p.getFullYear(), p.getMonth() + 1, 0)), label: capitalize(p.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })) };
    }
    return { start: `${n.getFullYear()}-01-01`, end: `${n.getFullYear()}-12-31`, label: `Todo el año ${n.getFullYear()}` };
  }, [period]);

  const periodDays = useMemo(
    () => myDays.filter(r => r.fecha >= periodRange.start && r.fecha <= periodRange.end),
    [myDays, periodRange]
  );

  const count = (status: AttendanceStatus, list = periodDays) => list.filter(r => r.estado === status).length;
  const attended = count('presente') + count('tardanza');
  const pct = periodDays.length ? Math.round((attended / periodDays.length) * 100) : 0;

  const visible = statusFilter === 'todos' ? periodDays : periodDays.filter(r => r.estado === statusFilter);

  // A primera vista solo los días más recientes; el resto se despliega con un botón
  const COLLAPSED_COUNT = 6;
  const [showAll, setShowAll] = useState(false);
  useEffect(() => { setShowAll(false); }, [period, statusFilter]);
  const shown = showAll ? visible : visible.slice(0, COLLAPSED_COUNT);
  const hiddenCount = visible.length - shown.length;

  // Agrupar por mes (más reciente primero)
  const groups = useMemo(() => {
    const map = new Map<string, AttendanceRecord[]>();
    shown.forEach(r => {
      const key = r.fecha.slice(0, 7);
      map.set(key, [...(map.get(key) || []), r]);
    });
    return Array.from(map.entries()).map(([key, items]) => ({
      key,
      label: capitalize(parseLocal(`${key}-01`).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })),
      items,
      total: visible.filter(r => r.fecha.startsWith(key)).length,
    }));
  }, [shown, visible]);

  // Racha: días de clase seguidos (del más reciente hacia atrás) llegando a tiempo
  const { streak, bestStreak } = useMemo(() => {
    const asc = [...myDays].sort((a, b) => a.fecha.localeCompare(b.fecha));
    let best = 0;
    let run = 0;
    asc.forEach(r => {
      run = r.estado === 'presente' ? run + 1 : 0;
      best = Math.max(best, run);
    });
    return { streak: run, bestStreak: best };
  }, [myDays]);

  const todayRecord = myDays.find(r => r.fecha === todayIso) || null;
  const isWeekend = today.getDay() === 0 || today.getDay() === 6;

  const cheer = isParent
    ? !periodDays.length
      ? `Cuando ${childName} registre su entrada con el carnet QR, aquí verás su asistencia.`
      : pct >= 95 ? `¡${childName} tiene una asistencia de campeón! 🏆`
      : pct >= 85 ? `${childName} va muy bien con su asistencia. 🌟`
      : `Ayuda a ${childName} a llegar a tiempo: cada día de clase cuenta. 💪`
    : !periodDays.length
    ? 'Cuando registres tu entrada con el carnet QR, aquí verás tu asistencia.'
    : pct >= 95 ? '¡Asistencia de campeón! Sigue así. 🏆'
    : pct >= 85 ? '¡Muy bien! Cada día que vienes aprendes algo nuevo. 🌟'
    : 'Cada día cuenta. ¡Mañana es una nueva oportunidad para llegar a tiempo! 💪';

  // Calendario del mes elegido
  const calYear = calMonth.getFullYear();
  const calM = calMonth.getMonth();
  const calLabel = capitalize(calMonth.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' }));
  const calCells = [
    ...Array.from({ length: (new Date(calYear, calM, 1).getDay() + 6) % 7 }, () => null),
    ...Array.from({ length: new Date(calYear, calM + 1, 0).getDate() }, (_, i) => {
      const iso = `${calYear}-${String(calM + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
      return { day: i + 1, iso, record: myDays.find(r => r.fecha === iso) || null };
    }),
  ];

  // Lista con alto disponible y scroll interno en escritorio (la página entra en una pantalla)
  const listRef = useRef<HTMLDivElement>(null);
  const [listMaxHeight, setListMaxHeight] = useState<number | undefined>(undefined);
  useEffect(() => {
    const compute = () => {
      const el = listRef.current;
      if (!el || window.innerWidth < 1024) { setListMaxHeight(undefined); return; }
      const main = el.closest('main');
      const top = el.getBoundingClientRect().top + (main?.scrollTop ?? 0);
      const mainPad = main ? parseFloat(getComputedStyle(main).paddingBottom) || 0 : 0;
      setListMaxHeight(Math.max(260, Math.floor(window.innerHeight - top - mainPad - 8)));
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [period, statusFilter, periodDays.length]);

  // Cerrar el detalle con Esc
  useEffect(() => {
    if (!selectedRecord) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedRecord(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selectedRecord]);

  const handleExport = (format: 'pdf' | 'excel') => {
    if (visible.length === 0) {
      showToast('No hay registros para descargar en este periodo.', 'warning', 'Descargar');
      return;
    }
    if (format === 'pdf') exportAttendanceToPDF(visible, activeStudent, activeEnrollment, periodRange.label);
    else exportAttendanceToExcel(visible, activeStudent, activeEnrollment, periodRange.label);
  };

  // Los datos ya están en el navegador: solo se muestra el esqueleto si aún no hay nada que mostrar
  if (isLoading && myDays.length === 0) return <AttendanceSkeleton />;

  const firstName = (activeStudent?.profile?.nombres || activeStudent?.nombres || (isParent ? '' : currentUser?.nombres) || '').split(' ')[0];

  return (
    <div className="space-y-4 max-w-7xl mx-auto animate-in fade-in-50">

      {/* ── 1. CABECERA AMIGABLE ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-100 via-sky-50 to-amber-100 dark:from-emerald-950/50 dark:via-slate-900 dark:to-amber-950/30 border border-emerald-200/70 dark:border-emerald-900/60 px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {isParent ? 'Asistencia' : 'Mi asistencia'} {firstName && <span className="text-emerald-600 dark:text-emerald-300">· {firstName}</span>}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {isParent
                ? `Mira qué días ${firstName || 'tu hijo'} llegó a tiempo, cuándo llegó tarde y cuándo faltó.`
                : 'Mira qué días llegaste a tiempo, cuándo llegaste tarde y cuándo faltaste.'} {periodRange.label}.
            </p>
            <div className="flex flex-wrap gap-2 pt-1.5">
              {(['presente', 'tardanza', 'falta', 'justificado'] as AttendanceStatus[]).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(statusFilter === s ? 'todos' : s)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                    statusFilter === s ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <span aria-hidden="true">{STATUS_META[s].emoji}</span> {count(s)} {count(s) === 1 ? STATUS_META[s].singular : STATUS_META[s].plural}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4 shrink-0">
            <div className="relative w-20 h-20" title={`${attended} de ${periodDays.length} días ${isParent ? `asistió ${childName}` : 'asististe'}`}>
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9155" fill="none" strokeWidth="3.5" className="stroke-white/80 dark:stroke-slate-800" />
                <circle cx="18" cy="18" r="15.9155" fill="none" strokeWidth="3.5" strokeLinecap="round"
                  className={`${pct >= 90 ? 'stroke-emerald-500' : pct >= 80 ? 'stroke-amber-500' : 'stroke-rose-500'} transition-all duration-700`}
                  strokeDasharray={`${pct}, 100`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-black text-slate-900 dark:text-white leading-none">{pct}%</span>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{isParent ? 'asistió' : 'asistí'}</span>
              </div>
            </div>
            <AttendanceIllustration className="hidden lg:block w-32 h-24 animate-float" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

        {/* ── COLUMNA PRINCIPAL ── */}
        <div className="lg:col-span-8 space-y-3">

          {/* Hoy + racha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className={`rounded-3xl border p-4 flex items-center gap-3 ${
              todayRecord ? `${STATUS_META[todayRecord.estado].cell} border-transparent` : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
            }`}>
              <span className="w-12 h-12 rounded-2xl bg-white/80 dark:bg-slate-900/60 flex items-center justify-center text-3xl shrink-0" aria-hidden="true">
                {todayRecord ? STATUS_META[todayRecord.estado].emoji : isWeekend ? '🛋️' : '🎒'}
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-wider opacity-70">Hoy · {capitalize(today.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }))}</p>
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  {todayRecord ? recordMessage(todayRecord, childName) : isWeekend ? 'Hoy no hay clases. ¡A descansar!' : isParent ? `${childName} aún no registra su entrada` : 'Aún no registras tu entrada'}
                </p>
                {!todayRecord && !isWeekend && !isParent && (
                  <Link href="/estudiante/carnet-qr" className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline">
                    Muestra tu carnet QR en la puerta →
                  </Link>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-orange-200/70 dark:border-orange-900/50 bg-orange-50/80 dark:bg-orange-950/30 p-4 flex items-center gap-3">
              <span className="w-12 h-12 rounded-2xl bg-white/80 dark:bg-slate-900/60 flex items-center justify-center shrink-0">
                <Flame className="w-7 h-7 text-orange-500" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-wider text-orange-700/80 dark:text-orange-300/80">Racha a tiempo</p>
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  {streak} {streak === 1 ? 'día seguido' : 'días seguidos'} llegando a tiempo
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{isParent ? 'Su' : 'Tu'} mejor racha: {bestStreak} {bestStreak === 1 ? 'día' : 'días'}</p>
              </div>
            </div>
          </div>

          <p className="px-1 text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" /> {cheer}
          </p>

          {/* Periodo + pestañas + descargas */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-2xl overflow-x-auto">
              {([
                { id: 'mes', label: 'Este mes' },
                { id: 'anterior', label: 'Mes anterior' },
                { id: 'anio', label: 'Todo el año' },
              ] as { id: Period; label: string }[]).map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriod(p.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                    period === p.id ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 overflow-x-auto">
              {(['todos', 'presente', 'tardanza', 'falta', 'justificado'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    statusFilter === s
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : s === 'todos' ? 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300' : STATUS_META[s].chip
                  }`}
                >
                  {s === 'todos' ? `Todos (${periodDays.length})` : `${STATUS_META[s].emoji} ${count(s)}`}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 ml-auto">
              <button type="button" onClick={() => handleExport('pdf')} title="Descargar en PDF" className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400 cursor-pointer">
                <Download className="w-3.5 h-3.5" /> PDF
              </button>
              <button type="button" onClick={() => handleExport('excel')} title="Descargar en Excel" className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400 cursor-pointer">
                <FileText className="w-3.5 h-3.5" /> Excel
              </button>
            </div>
          </div>

          {/* Lista de días */}
          <div ref={listRef} style={{ maxHeight: listMaxHeight }} className="space-y-4 lg:overflow-y-auto lg:pr-1 custom-scrollbar">
            {groups.length === 0 ? (
              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-8 text-center space-y-2">
                <div className="text-5xl" aria-hidden="true">{statusFilter === 'falta' || statusFilter === 'tardanza' ? '🎉' : '📭'}</div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {statusFilter === 'falta' ? '¡Sin faltas en este periodo!' : statusFilter === 'tardanza' ? '¡Sin tardanzas en este periodo!' : 'No hay registros en este periodo'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Prueba con otro periodo, por ejemplo &quot;Todo el año&quot;.</p>
              </div>
            ) : groups.map(group => (
              <section key={group.key} className="space-y-2">
                <h3 className="px-1 text-sm font-black text-slate-700 dark:text-slate-300">
                  {group.label} <span className="text-xs font-bold text-slate-400">({group.total} {group.total === 1 ? 'día' : 'días'})</span>
                </h3>
                {group.items.map(r => {
                  const meta = STATUS_META[r.estado];
                  const d = parseLocal(r.fecha);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRecord(r)}
                      className="w-full flex rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden text-left cursor-pointer"
                    >
                      <span className={`w-1.5 shrink-0 ${meta.stripe}`} />
                      <span className="flex-1 min-w-0 p-3 flex items-center gap-3">
                        <span className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex flex-col items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold uppercase text-slate-400">{d.toLocaleDateString('es-PE', { weekday: 'short' }).replace('.', '')}</span>
                          <span className="text-lg font-black text-slate-900 dark:text-white leading-none">{d.getDate()}</span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-black text-slate-900 dark:text-white truncate">{recordMessage(r, childName)}</span>
                          <span className="block text-xs text-slate-500 dark:text-slate-400 truncate">
                            {r.observacion || (r.metodo === 'qr' ? `Registrado con ${isParent ? 'su' : 'tu'} carnet QR` : 'Registrado por el colegio')}
                          </span>
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-black whitespace-nowrap ${meta.chip}`}>
                          <span aria-hidden="true">{meta.emoji}</span> {meta.label}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </section>
            ))}

            {visible.length > COLLAPSED_COUNT && (
              <div className="flex justify-center pt-1 pb-2">
                <button
                  type="button"
                  onClick={() => setShowAll(v => !v)}
                  aria-expanded={showAll}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-xs font-black text-emerald-700 dark:text-emerald-300 shadow-sm hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${showAll ? 'rotate-180' : ''}`} />
                  {showAll ? 'Ver menos' : `Ver todas las asistencias (${hiddenCount} más)`}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── COLUMNA LATERAL ── */}
        <div className="lg:col-span-4 space-y-3">

          {/* Calendario de colores */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4">
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setCalMonth(new Date(calYear, calM - 1, 1))} aria-label="Mes anterior" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-500" /> {calLabel}
              </h3>
              <button type="button" onClick={() => setCalMonth(new Date(calYear, calM + 1, 1))} aria-label="Mes siguiente" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1 text-center">
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                <span key={i} className="text-[10px] font-bold text-slate-400 py-1">{d}</span>
              ))}
              {calCells.map((cell, i) => {
                if (!cell) return <span key={`e-${i}`} />;
                const isToday = cell.iso === todayIso;
                return (
                  <button
                    key={cell.iso}
                    type="button"
                    disabled={!cell.record}
                    onClick={() => cell.record && setSelectedRecord(cell.record)}
                    title={cell.record ? `${STATUS_META[cell.record.estado].label} · ${recordMessage(cell.record, childName)}` : undefined}
                    className={`h-9 rounded-xl text-xs font-bold transition-transform ${
                      cell.record ? `${STATUS_META[cell.record.estado].cell} hover:scale-105 cursor-pointer` : 'text-slate-400 dark:text-slate-500 cursor-default'
                    } ${isToday ? 'ring-2 ring-offset-1 ring-slate-900 dark:ring-white dark:ring-offset-slate-900' : ''}`}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400">
              {(['presente', 'tardanza', 'falta', 'justificado'] as AttendanceStatus[]).map(s => (
                <span key={s} className="inline-flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${STATUS_META[s].dot}`} /> {STATUS_META[s].label}</span>
              ))}
            </div>
          </div>

          {/* Consejos */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-500" /> Para llegar siempre a tiempo
            </h3>
            <ul className="mt-2.5 space-y-2">
              {(isParent ? [
                { emoji: '🎒', text: `Dejen lista la mochila y el uniforme de ${childName} la noche anterior.` },
                { emoji: '⏰', text: 'Pongan la alarma un poquito más temprano.' },
                { emoji: '🪪', text: `Recuérdale a ${childName} mostrar su carnet QR en la puerta al llegar.` },
                { emoji: '📝', text: 'Si falta, envía la justificación desde "Justificar inasistencia".' },
              ] : [
                { emoji: '🎒', text: 'Deja lista tu mochila y tu uniforme la noche anterior.' },
                { emoji: '⏰', text: 'Pon tu alarma un poquito más temprano.' },
                { emoji: '🪪', text: 'Muestra tu carnet QR en la puerta al llegar.' },
                { emoji: '📝', text: 'Si faltas, pide a tu familia que envíe la justificación.' },
              ]).map((tip, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <span className="w-7 h-7 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-base shrink-0" aria-hidden="true">{tip.emoji}</span>
                  <span className="pt-1">{tip.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <Link
            href={isParent ? '/apoderado/justificar' : '/estudiante/carnet-qr'}
            className="flex items-center justify-between gap-2 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors"
          >
            <span className="flex items-center gap-2">{isParent ? <FileText className="w-4 h-4" /> : <QrCode className="w-4 h-4" />} {isParent ? 'Justificar una falta' : 'Ver mi carnet QR'}</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ── MODAL: DETALLE DE UN DÍA ── */}
      {selectedRecord && createPortal(
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in-50"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setSelectedRecord(null); }}
        >
          <div role="dialog" aria-modal="true" aria-label="Detalle de asistencia" className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`relative px-5 pt-5 pb-4 ${STATUS_META[selectedRecord.estado].cell}`}>
              <button type="button" onClick={() => setSelectedRecord(null)} aria-label="Cerrar" className="absolute top-3 right-3 p-1.5 rounded-xl bg-white/80 dark:bg-slate-900/70 text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3 pr-8">
                <span className="w-14 h-14 rounded-2xl bg-white/80 dark:bg-slate-900/60 flex items-center justify-center text-3xl" aria-hidden="true">
                  {STATUS_META[selectedRecord.estado].emoji}
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider opacity-70">{STATUS_META[selectedRecord.estado].label}</p>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white leading-snug">
                    {capitalize(parseLocal(selectedRecord.fecha).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }))}
                  </h2>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <p className="font-bold text-slate-800 dark:text-slate-100">{recordMessage(selectedRecord, childName)}</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Hora de entrada</p>
                  <p className="font-black text-slate-900 dark:text-white">{timeText(selectedRecord.hora_registro) || 'Sin marca'}</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1"><QrCode className="w-3 h-3" /> Cómo se registró</p>
                  <p className="font-black text-slate-900 dark:text-white">{selectedRecord.metodo === 'qr' ? `Con ${isParent ? 'su' : 'tu'} carnet QR` : 'Por el colegio'}</p>
                </div>
              </div>
              {selectedRecord.dispositivo && <p className="text-xs text-slate-500 dark:text-slate-400">Equipo: {selectedRecord.dispositivo}</p>}
              {selectedRecord.ubicacion && <p className="text-xs text-slate-500 dark:text-slate-400">Lugar: {selectedRecord.ubicacion}</p>}
              {selectedRecord.observacion && (
                <p className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-xs text-amber-900 dark:text-amber-200">
                  <strong>Nota del colegio:</strong> {selectedRecord.observacion}
                </p>
              )}
              {selectedRecord.estado === 'falta' && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isParent
                    ? `Si ${childName} faltó por una razón importante (por ejemplo, estaba enfermo), envía la justificación desde "Justificar inasistencia".`
                    : 'Si faltaste por una razón importante (por ejemplo, estabas enfermo), pide a tu familia que envíe la justificación al colegio.'}
                </p>
              )}
            </div>
            <div className="px-5 pb-5">
              <button type="button" onClick={() => setSelectedRecord(null)} className="w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white font-bold text-sm cursor-pointer">
                Entendido
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
