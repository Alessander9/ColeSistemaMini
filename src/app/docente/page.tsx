'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { useApp } from '@/context/AppContext';
import { AttendanceStatus, DayOfWeek, ScheduleSlot } from '@/types';
import {
  Award,
  Bell,
  Calendar,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FileCheck,
  Hourglass,
  Lock,
  MapPin,
  Plus,
  Search,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { getSectionClassStatus, nextClassStart, timeLeftInWords } from '@/lib/schedule/attendanceWindow';
import { Modal } from '@/components/ui/Modal';
import { useAulaColors } from '@/hooks/useAulaColors';

const WEEKDAY_KEYS: (DayOfWeek | null)[] = [null, 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', null];
const DAY_LABELS: Record<string, string> = { lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles', jueves: 'Jueves', viernes: 'Viernes' };

// Botones de asistencia: letra, nombre completo y colores
const STATUS_BUTTONS: { status: AttendanceStatus; letter: string; label: string; on: string; hover: string; row: string }[] = [
  { status: 'presente', letter: 'P', label: 'Presente', on: 'bg-emerald-600 text-white', hover: 'hover:bg-emerald-100 dark:hover:bg-emerald-950/40', row: 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800' },
  { status: 'tardanza', letter: 'T', label: 'Tardanza', on: 'bg-amber-500 text-white', hover: 'hover:bg-amber-100 dark:hover:bg-amber-950/40', row: 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/60' },
  { status: 'falta', letter: 'F', label: 'Falta', on: 'bg-rose-600 text-white', hover: 'hover:bg-rose-100 dark:hover:bg-rose-950/40', row: 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800/60' },
  { status: 'justificado', letter: 'J', label: 'Justificada', on: 'bg-sky-600 text-white', hover: 'hover:bg-sky-100 dark:hover:bg-sky-950/40', row: 'bg-sky-50/80 dark:bg-sky-950/30 border-sky-300 dark:border-sky-800/60' },
];

// Cuenta regresiva en vivo (se actualiza cada segundo mientras la ventana está abierta)
function Countdown({ target, onReady }: { target: Date; onReady: () => void }) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const readyRef = useRef(false);
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const left = Math.max(0, target.getTime() - nowMs);
  useEffect(() => {
    if (left === 0 && !readyRef.current) { readyRef.current = true; onReady(); }
  }, [left, onReady]);
  const h = Math.floor(left / 3_600_000);
  const m = Math.floor((left % 3_600_000) / 60_000);
  const sec = Math.floor((left % 60_000) / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <div className="text-center space-y-1">
      <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Faltan</p>
      <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">{timeLeftInWords(left)}</p>
      {left < 86_400_000 && (
        <p className="font-mono text-2xl font-black tracking-widest text-slate-500 dark:text-slate-400" aria-hidden="true">{pad(h)}:{pad(m)}:{pad(sec)}</p>
      )}
    </div>
  );
}

function localIso(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function timeText(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m || 0, 0, 0);
  return d.toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit' });
}

export default function DocenteDashboardPage() {
  const {
    courses,
    sections,
    enrollments,
    attendances,
    tasks,
    submissions,
    exams,
    evaluationPeriods,
    currentUser,
    getTeacherSchedule,
    getTeacherSections,
    saveClassAttendanceQuickly,
    announcements,
    confirmAnnouncement,
  } = useApp();
  const aulaColor = useAulaColors();

  // Hora actual que se actualiza sola cada 30 s (habilita/deshabilita la asistencia sin recargar)
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  const todayStr = localIso(now);
  const todayKey = WEEKDAY_KEYS[now.getDay()];
  const nowHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // ── Horario del docente ──
  const mySlots = useMemo(() => (currentUser?.id ? getTeacherSchedule(currentUser.id) : []), [getTeacherSchedule, currentUser?.id]);
  const todaySlots = useMemo(
    () => (todayKey ? mySlots.filter(s => s.dia === todayKey).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)) : []),
    [mySlots, todayKey]
  );
  const currentSlot = todaySlots.find(s => s.hora_inicio <= nowHHMM && nowHHMM < s.hora_fin) || null;
  const nextToday = todaySlots.find(s => s.hora_inicio > nowHHMM) || null;
  // Si hoy ya no hay clases, la primera del próximo día con clases
  const nextDaySlot = useMemo(() => {
    if (currentSlot || nextToday) return null;
    const order: DayOfWeek[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
    const start = todayKey ? order.indexOf(todayKey) + 1 : 0;
    for (let i = 0; i < order.length; i++) {
      const key = order[(start + i) % order.length];
      const first = mySlots.filter(s => s.dia === key).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))[0];
      if (first) return first;
    }
    return null;
  }, [currentSlot, nextToday, mySlots, todayKey]);
  const featured: ScheduleSlot | null = currentSlot || nextToday || nextDaySlot;

  const courseName = (id?: string) => courses.find(c => c.id === id)?.nombre || 'Curso';
  const sectionOf = (id?: string) => sections.find(s => s.id === id);
  const sectionLabel = (id?: string) => {
    const s = sectionOf(id);
    return s ? `${s.grado?.nombre || 'Grado'} "${s.letra}"` : 'Aula';
  };

  // ── Aulas del docente y asistencia ──
  const teacherSections = useMemo(() => (currentUser?.id ? getTeacherSections(currentUser.id) || [] : []), [getTeacherSections, currentUser?.id]);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  // Desde "Mi horario" se llega con ?aula=<id> para abrir esa aula directamente (tiene prioridad)
  const aulaFromUrlRef = useRef<string | null>(null);
  useEffect(() => {
    if (aulaFromUrlRef.current !== null || teacherSections.length === 0) return;
    const aula = new URLSearchParams(window.location.search).get('aula') || '';
    aulaFromUrlRef.current = aula;
    if (aula && teacherSections.some(t => t.seccion.id === aula)) {
      setSelectedSectionId(aula);
      setTimeout(() => document.getElementById('tomar-asistencia')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    }
  }, [teacherSections]);
  useEffect(() => {
    if (aulaFromUrlRef.current) return;
    if (!selectedSectionId && teacherSections.length > 0) {
      setSelectedSectionId(featured?.seccion_id && teacherSections.some(t => t.seccion.id === featured.seccion_id) ? featured.seccion_id : teacherSections[0].seccion.id);
    }
  }, [teacherSections, featured?.seccion_id, selectedSectionId]);

  const [draft, setDraft] = useState<Record<string, AttendanceStatus>>({});
  const [search, setSearch] = useState('');
  const [showLockedList, setShowLockedList] = useState(false);
  useEffect(() => { setDraft({}); setSearch(''); setShowLockedList(false); }, [selectedSectionId]);

  const sectionEnrollments = useMemo(
    () => enrollments
      .filter(e => e.seccion_id === selectedSectionId && e.estado === 'activo')
      .sort((a, b) => (a.estudiante?.profile?.apellidos || a.estudiante?.apellidos || '').localeCompare(b.estudiante?.profile?.apellidos || b.estudiante?.apellidos || '')),
    [enrollments, selectedSectionId]
  );
  const savedStatus = (matriculaId: string) =>
    attendances.find(a => a.matricula_id === matriculaId && a.fecha === todayStr && a.tipo_registro !== 'salida')?.estado;
  const statusOf = (matriculaId: string): AttendanceStatus => draft[matriculaId] || savedStatus(matriculaId) || 'presente';
  // Un cambio es una marca distinta de lo que se ve sin tocar nada (lo guardado o "Presente" por defecto)
  const baseStatus = (matriculaId: string): AttendanceStatus => savedStatus(matriculaId) || 'presente';
  const pendingChanges = Object.entries(draft).filter(([id, st]) => st !== baseStatus(id)).length;

  const isSectionTaken = (secId: string) => {
    const list = enrollments.filter(e => e.seccion_id === secId && e.estado === 'activo');
    return list.length > 0 && list.every(e => !!attendances.find(a => a.matricula_id === e.id && a.fecha === todayStr && a.tipo_registro !== 'salida'));
  };
  const takenToday = isSectionTaken(selectedSectionId);

  // Regla: la asistencia de un aula solo se toma durante la hora de su clase (la misma de "Mi horario")
  const classStatusOf = (secId: string): { open: boolean; chip: string; message: string; slot?: ScheduleSlot } => {
    const st = getSectionClassStatus(mySlots, secId, todayKey, nowHHMM);
    if (st.kind === 'open') {
      return { open: true, slot: st.slot, chip: '🟢 En clase ahora', message: `Clase de ${courseName(st.slot.curso_id)} en curso · puedes tomar la asistencia hasta las ${timeText(st.slot.hora_fin)}` };
    }
    if (st.kind === 'later-today') {
      return { open: false, slot: st.slot, chip: `Hoy a las ${timeText(st.slot.hora_inicio)}`, message: `Se habilita hoy a las ${timeText(st.slot.hora_inicio)}` };
    }
    if (st.kind === 'next-day') {
      return {
        open: false,
        slot: st.slot,
        chip: st.hadClassToday ? 'Hoy ya terminó' : 'Sin clase hoy',
        message: `${st.hadClassToday ? 'La clase de hoy ya terminó. ' : ''}Se habilita el ${(DAY_LABELS[st.slot.dia] || '').toLowerCase()} a las ${timeText(st.slot.hora_inicio)}`,
      };
    }
    return { open: false, chip: 'Sin horario', message: 'Esta aula aún no tiene clases en tu horario' };
  };
  const selectedStatus = selectedSectionId ? classStatusOf(selectedSectionId) : null;
  const canEdit = !!selectedStatus?.open;

  const counts = sectionEnrollments.reduce(
    (acc, e) => { acc[statusOf(e.id)]++; return acc; },
    { presente: 0, tardanza: 0, falta: 0, justificado: 0 } as Record<AttendanceStatus, number>
  );

  const visibleStudents = sectionEnrollments.filter(e => {
    const name = `${e.estudiante?.profile?.apellidos || e.estudiante?.apellidos || ''} ${e.estudiante?.profile?.nombres || e.estudiante?.nombres || ''}`.toLowerCase();
    return name.includes(search.trim().toLowerCase());
  });

  const markAllPresent = () => {
    if (!canEdit) return;
    const next: Record<string, AttendanceStatus> = {};
    sectionEnrollments.forEach(e => { next[e.id] = 'presente'; });
    setDraft(next);
  };

  const saveAttendance = () => {
    if (!canEdit || !selectedSectionId || sectionEnrollments.length === 0) return;
    saveClassAttendanceQuickly(
      selectedSectionId,
      todayStr,
      sectionEnrollments.map(e => ({ matriculaId: e.id, estado: statusOf(e.id) }))
    );
    setDraft({});
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
  };

  const listRef = useRef<HTMLDivElement>(null);

  // ── Pendientes ──
  const myTaskIds = useMemo(() => new Set(tasks.filter(t => t.docente_id === currentUser?.id).map(t => t.id)), [tasks, currentUser?.id]);
  const toGrade = submissions.filter(s => myTaskIds.has(s.tarea_id) && !s.calificacion_letra).length;
  // Solo las evaluaciones de los cursos que dicta en cada aula
  const myCoursePairs = new Set(teacherSections.flatMap(t => t.cursos.map(c => `${t.seccion.id}|${c.id}`)));
  const upcomingExams = exams
    .filter(e => myCoursePairs.has(`${e.seccion_id}|${e.curso_id}`) && e.fecha_programada >= todayStr && e.estado !== 'borrador')
    .sort((a, b) => a.fecha_programada.localeCompare(b.fecha_programada));
  const currentPeriod = evaluationPeriods.find(p => p.fecha_inicio <= todayStr && todayStr <= p.fecha_fin);
  const daysToClose = currentPeriod
    ? Math.round((new Date(`${currentPeriod.fecha_fin}T00:00:00`).getTime() - new Date(`${todayStr}T00:00:00`).getTime()) / 86400000)
    : null;

  // ── Comunicados para docentes ──
  const [showAllNotices, setShowAllNotices] = useState(false);
  const teacherNotices = announcements
    .filter(a => !a.destinatarios_rol || a.destinatarios_rol === 'todos' || a.destinatarios_rol === 'docente')
    .map(a => ({ a, needsConfirm: !!a.requiere_confirmacion && !(currentUser?.id && a.confirmado_por?.includes(currentUser.id)) }))
    .sort((x, y) => Number(y.needsConfirm) - Number(x.needsConfirm));
  const noticesToConfirm = teacherNotices.filter(n => n.needsConfirm).length;
  const shownNotices = showAllNotices ? teacherNotices : teacherNotices.slice(0, 2);

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';
  const firstName = currentUser?.nombres?.split(' ')[0] || 'Docente';
  const longDate = (() => {
    const t = now.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
    return t.charAt(0).toUpperCase() + t.slice(1);
  })();
  const selectedLabel = sectionLabel(selectedSectionId);

  // "Tomar asistencia" siempre se puede tocar: si la clase está en curso va a la lista; si no, explica cuánto falta
  const [waitSlot, setWaitSlot] = useState<ScheduleSlot | null>(null);
  const openClass = (slot: ScheduleSlot) => {
    if (currentSlot && slot.id === currentSlot.id) scrollToAttendance(slot.seccion_id);
    else setWaitSlot(slot);
  };
  // Al llegar la hora, se actualiza el reloj del panel y la ventana muestra "Tomar asistencia ahora"
  const onClassReady = useCallback(() => setNow(new Date()), []);
  const toMinutes = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + (m || 0); };
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const minutesText = (mins: number) => timeLeftInWords(Math.max(0, mins) * 60_000);
  // Tiempo exacto hasta una hora de hoy (mismo cálculo que la cuenta regresiva)
  const untilToday = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); const t = new Date(now); t.setHours(h, m || 0, 0, 0); return timeLeftInWords(Math.max(0, t.getTime() - now.getTime())); };
  const featuredStart = featured && !currentSlot ? nextClassStart(featured, now) : null;
  const classProgress = currentSlot
    ? Math.min(100, Math.max(0, Math.round(((nowMinutes - toMinutes(currentSlot.hora_inicio)) / Math.max(1, toMinutes(currentSlot.hora_fin) - toMinutes(currentSlot.hora_inicio))) * 100)))
    : 0;

  const scrollToAttendance = (secId?: string) => {
    if (secId && teacherSections.some(t => t.seccion.id === secId)) setSelectedSectionId(secId);
    document.getElementById('tomar-asistencia')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-10 animate-in fade-in-50">

      {/* ── 1. SALUDO ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">{greeting}, Prof. {firstName} 👋</h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-0.5">{longDate}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/docente/notas" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-400 shadow-sm text-sm font-black text-slate-800 dark:text-slate-100">
            <Award className="w-5 h-5 text-indigo-600" /> Registrar notas
          </Link>
          <Link href="/docente/tareas" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-purple-400 shadow-sm text-sm font-black text-slate-800 dark:text-slate-100">
            <Plus className="w-5 h-5 text-purple-600" /> Nueva tarea
          </Link>
        </div>
      </div>

          {/* ── 2. MI DÍA: clase actual o siguiente + fichas de las clases de hoy ── */}
          {featured ? (() => {
            const fc = aulaColor(featured.seccion_id);
            const status = currentSlot
              ? '● En clase ahora'
              : nextToday
                ? `Tu próxima clase · empieza en ${untilToday(featured.hora_inicio)}`
                : `Tu próxima clase · el ${(DAY_LABELS[featured.dia] || '').toLowerCase()}`;
            return (
              <section className={`rounded-3xl border-2 ${currentSlot ? 'border-emerald-400 dark:border-emerald-700' : fc.border} bg-white dark:bg-slate-900 overflow-hidden`}>
                <div className={`p-5 sm:p-6 flex flex-col md:flex-row md:items-center gap-5 ${currentSlot ? 'bg-emerald-50 dark:bg-emerald-950/30' : fc.soft}`}>
                  <div className="flex-1 min-w-0 space-y-2">
                    <p className={`text-sm font-black uppercase tracking-wider ${currentSlot ? 'text-emerald-700 dark:text-emerald-300' : fc.text}`}>{status}</p>
                    <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white leading-tight">{courseName(featured.curso_id)}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-slate-700 dark:text-slate-200">
                      <span className={`px-3 py-0.5 rounded-full font-black ${fc.chip}`}>{sectionLabel(featured.seccion_id)}</span>
                      <span className="inline-flex items-center gap-1 font-bold"><Clock className="w-4 h-4" /> {timeText(featured.hora_inicio)} – {timeText(featured.hora_fin)}</span>
                      <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400"><MapPin className="w-4 h-4" /> {featured.aula || sectionOf(featured.seccion_id)?.aula || 'Aula por confirmar'}</span>
                    </div>
                    {currentSlot && (
                      <div className="pt-2 max-w-lg">
                        <div className="h-3 rounded-full bg-white/80 dark:bg-slate-800 overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${classProgress}%` }} />
                        </div>
                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 mt-1.5">Quedan {minutesText(toMinutes(currentSlot.hora_fin) - nowMinutes)} de clase</p>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => openClass(featured)}
                    aria-label={currentSlot ? `Tomar asistencia de ${sectionLabel(featured.seccion_id)}` : `Tomar asistencia de ${sectionLabel(featured.seccion_id)}: ver cuánto falta`}
                    className={`md:w-72 shrink-0 flex items-center gap-3 px-4 py-4 rounded-2xl text-left cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                      currentSlot ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md' : `bg-white dark:bg-slate-900 border-2 ${fc.border} text-slate-800 dark:text-slate-100`
                    }`}
                  >
                    <span className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${currentSlot ? 'bg-white/20' : `${fc.dot} text-white`}`}>
                      {currentSlot ? <UserCheck className="w-6 h-6" /> : <Lock className="w-5 h-5" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-lg font-black leading-tight">Tomar asistencia</span>
                      <span className={`block text-sm font-bold mt-0.5 ${currentSlot ? 'text-emerald-100' : fc.text}`}>
                        {currentSlot ? `${sectionLabel(featured.seccion_id)} · hasta las ${timeText(featured.hora_fin)}` : featuredStart ? `${sectionLabel(featured.seccion_id)} · en ${timeLeftInWords(featuredStart.getTime() - now.getTime())}` : sectionLabel(featured.seccion_id)}
                      </span>
                    </span>
                  </button>
                </div>

                {/* Clases de hoy en fichas */}
                <div className="px-5 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {todaySlots.length > 0 ? `Hoy tienes ${todaySlots.length} ${todaySlots.length === 1 ? 'clase' : 'clases'}` : todayKey ? 'Hoy no tienes clases' : 'Hoy no hay clases · ¡buen descanso!'}
                    </p>
                    <Link href="/docente/horario" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">Ver mi horario →</Link>
                  </div>
                  {todaySlots.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2.5">
                      {todaySlots.map(sl => {
                        const c = aulaColor(sl.seccion_id);
                        const isNow = currentSlot?.id === sl.id;
                        const past = toMinutes(sl.hora_fin) <= nowMinutes;
                        const taken = isSectionTaken(sl.seccion_id);
                        return (
                          <button
                            key={sl.id}
                            type="button"
                            onClick={() => openClass(sl)}
                            className={`text-left px-3 py-2.5 rounded-2xl border-2 cursor-pointer transition-all hover:-translate-y-0.5 ${
                              isNow ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : past ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400' : `bg-white dark:bg-slate-900 ${c.border} text-slate-800 dark:text-slate-100`
                            }`}
                          >
                            <span className="flex items-center justify-between gap-1">
                              <span className="text-base font-black">{timeText(sl.hora_inicio)}</span>
                              <span className={`w-3 h-3 rounded-full ${isNow ? 'bg-white' : c.dot}`} />
                            </span>
                            <span className="block text-sm font-bold truncate mt-0.5">{courseName(sl.curso_id)}</span>
                            <span className="block text-xs truncate opacity-90">{sectionLabel(sl.seccion_id)}</span>
                            <span className={`block text-xs font-black mt-1.5 ${isNow ? 'text-emerald-100' : past ? (taken ? 'text-emerald-600' : 'text-amber-600') : c.text}`}>
                              {isNow ? '● Ahora · toca para marcar' : past ? (taken ? '✅ Asistencia tomada' : '⚠️ Sin asistencia') : `🔒 En ${untilToday(sl.hora_inicio)}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            );
          })() : (
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 text-sm text-slate-500 dark:text-slate-400">
              Aún no tienes clases en tu horario. Cuando Coordinación publique tu horario, aquí verás tu próxima clase.
            </div>
          )}


      {/* ── 3. PENDIENTES: tarjetas de color, fáciles de ver ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            href: '/docente/tareas',
            icon: FileCheck,
            count: toGrade,
            title: toGrade === 1 ? 'entrega por calificar' : 'entregas por calificar',
            detail: toGrade > 0 ? 'Tus alumnos esperan su nota' : '¡Todo calificado!',
            action: toGrade > 0 ? 'Calificar ahora' : 'Ver tareas',
            tone: toGrade > 0 ? 'bg-purple-600 text-white border-purple-600' : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-purple-200 dark:border-purple-900',
            iconTone: toGrade > 0 ? 'bg-white/20 text-white' : 'bg-purple-100 dark:bg-purple-950/60 text-purple-600',
          },
          {
            href: '/docente/evaluaciones',
            icon: Calendar,
            count: upcomingExams.length,
            title: upcomingExams.length === 1 ? 'evaluación próxima' : 'evaluaciones próximas',
            detail: upcomingExams[0] ? `La siguiente: ${upcomingExams[0].titulo}` : 'No hay evaluaciones programadas',
            action: upcomingExams.length > 0 ? 'Ver evaluaciones' : 'Programar una',
            tone: upcomingExams.length > 0 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-blue-200 dark:border-blue-900',
            iconTone: upcomingExams.length > 0 ? 'bg-white/20 text-white' : 'bg-blue-100 dark:bg-blue-950/60 text-blue-600',
          },
          ...(currentPeriod && daysToClose !== null ? [{
            href: '/docente/notas',
            icon: Award,
            count: daysToClose,
            title: daysToClose === 1 ? `día para cerrar el ${currentPeriod.nombre}` : `días para cerrar el ${currentPeriod.nombre}`,
            detail: daysToClose <= 7 ? '¡Ya casi! Registra tus notas' : 'Registra tus notas a tiempo',
            action: 'Registrar notas',
            tone: daysToClose <= 7 ? 'bg-rose-600 text-white border-rose-600' : 'bg-amber-500 text-white border-amber-500',
            iconTone: 'bg-white/20 text-white',
          }] : []),
        ].map(t => {
          const Icon = t.icon;
          return (
            <Link key={t.href} href={t.href} className={`group rounded-3xl border-2 p-4 flex items-center gap-3 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all ${t.tone}`}>
              <span className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${t.iconTone}`}><Icon className="w-6 h-6" /></span>
              <span className="flex-1 min-w-0">
                <span className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black leading-none">{t.count}</span>
                  <span className="text-sm font-black leading-tight">{t.title}</span>
                </span>
                <span className="block text-xs font-semibold opacity-80 truncate mt-1">{t.detail}</span>
                <span className="inline-flex items-center gap-0.5 text-xs font-black mt-1.5 underline-offset-2 group-hover:underline">{t.action} <ChevronRight className="w-3.5 h-3.5" /></span>
              </span>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* ── COLUMNA PRINCIPAL ── */}
        <div className="lg:col-span-8 space-y-5">

          {/* ── TOMAR ASISTENCIA ── */}
          <section id="tomar-asistencia" className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 space-y-4 scroll-mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" /> Asistencia de hoy
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Todos empiezan como <strong>Presente</strong>: marca solo a quien faltó o llegó tarde.</p>
            </div>

            {teacherSections.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">No tienes aulas asignadas todavía.</p>
            ) : (
              <>
                {/* Aulas */}
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2">
                  {teacherSections.map(ts => {
                    const active = ts.seccion.id === selectedSectionId;
                    const taken = isSectionTaken(ts.seccion.id);
                    const cls = classStatusOf(ts.seccion.id);
                    return (
                      <button
                        key={ts.seccion.id}
                        type="button"
                        onClick={() => setSelectedSectionId(ts.seccion.id)}
                        className={`text-left px-3 py-2.5 rounded-2xl border-2 transition-colors cursor-pointer ${
                          active ? `${aulaColor(ts.seccion.id).solid} shadow-md` : `bg-white dark:bg-slate-800/60 ${aulaColor(ts.seccion.id).border} text-slate-700 dark:text-slate-200 ${aulaColor(ts.seccion.id).hover}`
                        }`}
                      >
                        <span className="flex items-center gap-1.5 text-sm font-black">{!active && <span className={`w-2.5 h-2.5 rounded-full ${aulaColor(ts.seccion.id).dot}`} />}{ts.seccion.grado?.nombre || 'Grado'} &quot;{ts.seccion.letra}&quot;</span>
                        <span className={`block text-xs font-bold mt-0.5 ${active ? aulaColor(ts.seccion.id).solidSub : taken ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {cls.open ? '🟢 En clase ahora' : taken ? '✅ Tomada hoy' : `🔒 ${cls.chip}`}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Bloqueada: explica cuándo se abre en lugar de mostrar una lista gris */}
                {!canEdit && selectedStatus && (
                  <div className={`rounded-2xl border-2 ${aulaColor(selectedSectionId).border} ${aulaColor(selectedSectionId).soft} p-4 flex flex-col sm:flex-row sm:items-center gap-3`}>
                    <span className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white ${aulaColor(selectedSectionId).dot}`}><Lock className="w-5 h-5" /></span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-base font-black ${aulaColor(selectedSectionId).text}`}>{selectedLabel}: aún no es hora de clase</p>
                      <p className="text-sm text-slate-700 dark:text-slate-200">{selectedStatus.message}.</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {selectedStatus.slot && (
                        <button type="button" onClick={() => setWaitSlot(selectedStatus.slot!)} className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl ${aulaColor(selectedSectionId).btn} text-sm font-black cursor-pointer`}>
                          <Hourglass className="w-4 h-4" /> ¿Cuánto falta?
                        </button>
                      )}
                      {sectionEnrollments.length > 0 && (
                        <button type="button" onClick={() => setShowLockedList(v => !v)} aria-expanded={showLockedList} className="inline-flex items-center gap-1 px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                          <ChevronDown className={`w-4 h-4 transition-transform ${showLockedList ? 'rotate-180' : ''}`} /> {showLockedList ? 'Ocultar lista' : 'Ver lista'}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Herramientas (solo con la clase en curso) */}
                {canEdit && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-xs font-black text-emerald-800 dark:text-emerald-200">
                      <Clock className="w-3.5 h-3.5" /> {selectedStatus?.message}
                    </span>
                    {STATUS_BUTTONS.filter(b => b.status !== 'presente' && counts[b.status] > 0).map(b => (
                      <span key={b.status} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-700 dark:text-slate-200">
                        <span className={`w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center ${b.on}`}>{b.letter}</span>
                        {counts[b.status]} {b.label.toLowerCase()}
                      </span>
                    ))}
                    <div className="flex items-center gap-1.5 ml-auto">
                      <button type="button" onClick={markAllPresent} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold cursor-pointer">
                        <CheckCheck className="w-4 h-4" /> Todos presentes
                      </button>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar alumno" className="w-36 pl-8 pr-7 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                        {search && (
                          <button type="button" onClick={() => setSearch('')} aria-label="Borrar búsqueda" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"><XCircle className="w-3.5 h-3.5" /></button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Lista de alumnos */}
                {(canEdit || showLockedList) && (<>
                <div ref={listRef} className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {visibleStudents.length === 0 ? (
                    <p className="md:col-span-2 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                      {sectionEnrollments.length === 0 ? 'Esta aula aún no tiene alumnos matriculados.' : 'No hay alumnos con ese nombre.'}
                    </p>
                  ) : visibleStudents.map(enr => {
                    const st = statusOf(enr.id);
                    const meta = STATUS_BUTTONS.find(b => b.status === st)!;
                    const nombres = enr.estudiante?.profile?.nombres || enr.estudiante?.nombres || '';
                    const apellidos = enr.estudiante?.profile?.apellidos || enr.estudiante?.apellidos || '';
                    const changed = draft[enr.id] !== undefined && draft[enr.id] !== baseStatus(enr.id);
                    return (
                      <div key={enr.id} className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${meta.row}`}>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-black flex items-center justify-center shrink-0">
                            {`${nombres[0] || ''}${apellidos[0] || ''}`.toUpperCase()}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-bold text-slate-900 dark:text-white truncate">{apellidos}, {nombres}</span>
                            <span className="block text-xs text-slate-400">{changed ? '● Sin guardar' : savedStatus(enr.id) ? 'Guardado' : 'Aún no registrado'}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {STATUS_BUTTONS.map(b => (
                            <button
                              key={b.status}
                              type="button"
                              onClick={() => canEdit && setDraft(prev => ({ ...prev, [enr.id]: b.status }))}
                              disabled={!canEdit}
                              title={b.label}
                              aria-label={`${b.label}: ${nombres} ${apellidos}`}
                              aria-pressed={st === b.status}
                              className={`w-10 h-10 rounded-xl text-sm font-black transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${st === b.status ? b.on : `bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 ${b.hover}`}`}
                            >
                              {b.letter}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Guardar */}
                {canEdit && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {pendingChanges > 0
                      ? <><strong className="text-amber-600">{pendingChanges} {pendingChanges === 1 ? 'cambio sin guardar' : 'cambios sin guardar'}</strong> en {selectedLabel}.</>
                      : takenToday ? <>✅ La asistencia de {selectedLabel} ya está guardada hoy. Puedes corregirla y volver a guardar.</>
                      : <>Aún no guardas la asistencia de {selectedLabel} hoy.</>}
                  </p>
                  <button
                    type="button"
                    onClick={saveAttendance}
                    disabled={!canEdit || sectionEnrollments.length === 0}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-black shadow-md cursor-pointer"
                  >
                    <Check className="w-5 h-5" /> Guardar asistencia de {selectedLabel}
                  </button>
                </div>
                )}
                </>)}
              </>
            )}
          </section>
        </div>

        {/* ── COLUMNA LATERAL ── */}
        <div className="lg:col-span-4 space-y-5">

          {/* Comunicados */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2"><Bell className="w-5 h-5 text-indigo-500" /> Comunicados</h3>
              {noticesToConfirm > 0 && <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[11px] font-bold">{noticesToConfirm} por confirmar</span>}
            </div>
            {teacherNotices.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">No hay comunicados nuevos.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {shownNotices.map(({ a, needsConfirm }) => (
                  <li key={a.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                    <p className="text-sm font-black text-slate-900 dark:text-white leading-snug">{a.titulo}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{a.contenido}</p>
                    {(a.fecha_citacion || a.lugar_citacion) && (
                      <p className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 mt-0.5">📅 {a.fecha_citacion} {a.hora_citacion || ''} {a.lugar_citacion ? `· ${a.lugar_citacion}` : ''}</p>
                    )}
                    {needsConfirm ? (
                      <button type="button" onClick={() => currentUser?.id && confirmAnnouncement(a.id, currentUser.id)} className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black cursor-pointer">
                        <Check className="w-3.5 h-3.5" /> Confirmar que lo leí
                      </button>
                    ) : a.requiere_confirmacion ? (
                      <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /> Confirmado</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            {teacherNotices.length > 2 && (
              <button type="button" onClick={() => setShowAllNotices(v => !v)} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer">
                <ChevronDown className={`w-4 h-4 transition-transform ${showAllNotices ? 'rotate-180' : ''}`} />
                {showAllNotices ? 'Ver menos' : `Ver todos (${teacherNotices.length})`}
              </button>
            )}
          </div>
        </div>
      </div>
      {/* ── Ventana: estado de una clase (cuánto falta / ya terminó / ya empezó) ── */}
      {waitSlot && (() => {
        const ws = waitSlot;
        const c = aulaColor(ws.seccion_id);
        const isNow = !!currentSlot && currentSlot.id === ws.id;
        const endedToday = ws.dia === todayKey && toMinutes(ws.hora_fin) <= nowMinutes;
        // Si ya terminó hoy, la cuenta regresiva es hasta la siguiente clase con esa misma aula
        const nextSt = endedToday ? getSectionClassStatus(mySlots, ws.seccion_id, todayKey, nowHHMM) : null;
        const target: ScheduleSlot | null = endedToday ? (nextSt && 'slot' in nextSt ? nextSt.slot : null) : ws;
        const targetStart = target && !isNow ? nextClassStart(target, now) : null;
        const taken = isSectionTaken(ws.seccion_id);
        const dayWord = (sl: ScheduleSlot) => (sl.dia === todayKey && toMinutes(sl.hora_inicio) > nowMinutes ? 'hoy' : `el ${(DAY_LABELS[sl.dia] || '').toLowerCase()}`);
        return (
          <Modal isOpen onClose={() => setWaitSlot(null)} title={isNow ? '¡Ya puedes tomar asistencia!' : endedToday ? 'Esta clase ya terminó' : 'Aún no es hora de tomar asistencia'} maxWidth="md">
            <div className="space-y-4">
              <div className={`flex items-center gap-3 p-3 rounded-2xl border-2 ${c.border} ${c.soft}`}>
                <span className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${c.dot} text-white`}>
                  {isNow ? <UserCheck className="w-6 h-6" /> : endedToday ? <CheckCircle2 className="w-6 h-6" /> : <Hourglass className="w-6 h-6" />}
                </span>
                <div className="min-w-0">
                  <p className={`text-lg font-black ${c.text}`}>{sectionLabel(ws.seccion_id)} · {courseName(ws.curso_id)}</p>
                  <p className="text-sm text-slate-700 dark:text-slate-200">
                    {ws.dia === todayKey ? 'Hoy' : `El ${(DAY_LABELS[ws.dia] || '').toLowerCase()}`} de {timeText(ws.hora_inicio)} a {timeText(ws.hora_fin)}
                  </p>
                </div>
              </div>

              {isNow ? (
                <button type="button" onClick={() => { setWaitSlot(null); scrollToAttendance(ws.seccion_id); }} className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-base font-black cursor-pointer">
                  <UserCheck className="w-5 h-5" /> Tomar asistencia ahora
                </button>
              ) : (
                <>
                  {endedToday && (
                    <p className={`p-3 rounded-2xl text-sm font-bold text-center ${taken ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200'}`}>
                      {taken ? '✅ La asistencia de esta clase quedó guardada.' : '⚠️ En esta clase no se tomó asistencia. Si necesitas registrarla, comunícate con Coordinación.'}
                    </p>
                  )}
                  {target && targetStart && (
                    <>
                      {endedToday && <p className="text-sm font-bold text-slate-600 dark:text-slate-300 text-center">Tu próxima clase con {sectionLabel(ws.seccion_id)} es {dayWord(target)} a las {timeText(target.hora_inicio)}.</p>}
                      <Countdown key={targetStart.getTime()} target={targetStart} onReady={onClassReady} />
                    </>
                  )}
                  <p className="text-sm text-slate-600 dark:text-slate-300 text-center">
                    La asistencia se toma <strong>solo durante la hora de clase</strong>. El botón se abre solo, no hace falta recargar la página.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link href="/docente/horario" className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 text-sm font-bold text-slate-700 dark:text-slate-200">
                      <Calendar className="w-4 h-4" /> Ver mi horario
                    </Link>
                    <button type="button" onClick={() => setWaitSlot(null)} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-black cursor-pointer">
                      Entendido
                    </button>
                  </div>
                </>
              )}
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}
