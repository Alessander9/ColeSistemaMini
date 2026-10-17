'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { SystemAlert } from '@/types';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Check,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  Users,
  UserX,
  Award,
  Calendar,
  GraduationCap,
  FileText,
  School,
  UserPlus,
  Activity,
  Clock,
  Sparkles,
  QrCode,
  Megaphone,
  BookOpen,
} from 'lucide-react';

type Priority = 'critica' | 'alta' | 'media' | 'baja';
type Group = 'urgente' | 'importante' | 'aviso';

// Una alerta tal como la ve el cliente: qué pasa, a quién afecta y qué hacer
interface AlertItem {
  key: string;
  priority: Priority;
  icon: React.ElementType;
  title: string;
  detail: string;
  people?: string[];
  peopleLabel?: string;
  actionLabel: string;
  actionHref: string;
  auto: boolean;
  createdAt?: string;
  stored?: SystemAlert;
}

const GROUP_OF: Record<Priority, Group> = { critica: 'urgente', alta: 'urgente', media: 'importante', baja: 'aviso' };
const GROUP_STYLE: Record<Group, { label: string; hint: string; icon: React.ElementType; bar: string; tile: string; chip: string; ring: string; btn: string }> = {
  urgente: { label: 'Urgentes', hint: 'atiéndelas hoy', icon: AlertTriangle, bar: 'bg-rose-500', tile: 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300', chip: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300', ring: 'ring-rose-500', btn: 'bg-rose-600 hover:bg-rose-700' },
  importante: { label: 'Importantes', hint: 'revísalas esta semana', icon: AlertCircle, bar: 'bg-amber-400', tile: 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300', chip: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300', ring: 'ring-amber-500', btn: 'bg-amber-500 hover:bg-amber-600' },
  aviso: { label: 'Para tener en cuenta', hint: 'sin apuro', icon: Info, bar: 'bg-sky-400', tile: 'bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300', chip: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300', ring: 'ring-sky-500', btn: 'bg-sky-600 hover:bg-sky-700' },
};
const PRIORITY_ORDER: Record<Priority, number> = { critica: 0, alta: 1, media: 2, baja: 3 };
const CATEGORY_ICON: Record<string, React.ElementType> = { academico: Award, asistencia: UserX, tareas: FileText, notas: Award, sistema: Bell };

const localIso = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const daysBetween = (fromIso: string, toIso: string) => {
  const p = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d).getTime(); };
  return Math.round((p(toIso) - p(fromIso)) / 86400000);
};
// La actividad se guarda en UTC ("YYYY-MM-DD HH:mm:ss"); se muestra en hora local
const parseTs = (ts: string) => {
  const d = new Date(ts.includes('T') || ts.endsWith('Z') ? ts : `${ts.replace(' ', 'T')}Z`);
  return isNaN(d.getTime()) ? null : d;
};
const timeAgo = (ts?: string) => {
  if (!ts) return '';
  const d = parseTs(ts);
  if (!d) return ts;
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  const hhmm = d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  if (mins < 1) return 'Hace un momento';
  if (mins < 60) return `Hace ${mins} min`;
  const days = daysBetween(localIso(d), localIso());
  if (days === 0) return `Hoy, ${hhmm}`;
  if (days === 1) return `Ayer, ${hhmm}`;
  return `${d.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' })}, ${hhmm}`;
};
const MODULE_ICON: { match: RegExp; icon: React.ElementType; cls: string }[] = [
  { match: /matr[ií]cula|estudiante|alumno/i, icon: UserPlus, cls: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300' },
  { match: /asistencia|kiosco|qr/i, icon: QrCode, cls: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300' },
  { match: /nota|evaluaci/i, icon: Award, cls: 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300' },
  { match: /tarea/i, icon: FileText, cls: 'bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300' },
  { match: /comunicado/i, icon: Megaphone, cls: 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300' },
  { match: /horario/i, icon: Calendar, cls: 'bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300' },
  { match: /docente|curso|acad/i, icon: GraduationCap, cls: 'bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300' },
  { match: /usuario|rbac/i, icon: Users, cls: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
];
const moduleIcon = (m: string) => MODULE_ICON.find(x => x.match.test(m)) || { icon: Clock, cls: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300' };

export default function AlertasPage() {
  const {
    alerts = [],
    resolveAlert,
    auditLogs = [],
    enrollments = [],
    students = [],
    sections = [],
    courses = [],
    grades = [],
    attendances = [],
    sectionCourses = [],
    scheduleSlots = [],
    evaluationPeriods = [],
    tasks = [],
    submissions = [],
    teachers = [],
    academicContext,
  } = useApp();

  const [tab, setTab] = useState<'pendientes' | 'resueltas' | 'actividad'>('pendientes');
  const [groupFilter, setGroupFilter] = useState<Group | 'todas'>('todas');
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [activityQuery, setActivityQuery] = useState('');
  const [activityShown, setActivityShown] = useState(15);

  const todayIso = localIso();
  const level = academicContext?.nivel || 'todos';
  const levelOf = (secId?: string) => sections.find(s => s.id === secId)?.grado?.nivel;
  const inLevel = (secId?: string) => level === 'todos' || levelOf(secId) === level;
  const sectionLabel = (id?: string) => { const s = sections.find(x => x.id === id); return s ? `${s.grado?.nombre || 'Grado'} "${s.letra}"` : 'un aula'; };
  const studentName = (studentId: string) => {
    const st = students.find(x => x.id === studentId);
    return `${st?.profile?.nombres || st?.nombres || ''} ${st?.profile?.apellidos || st?.apellidos || ''}`.trim() || 'Alumno';
  };
  const teacherName = (id: string) => { const t = teachers.find(x => x.id === id); return t ? `${t.nombres} ${t.apellidos}`.trim() : 'Docente'; };
  const currentPeriod = evaluationPeriods.find(p => p.fecha_inicio <= todayIso && todayIso <= p.fecha_fin) || evaluationPeriods.find(p => p.activo && !p.cerrado);

  // ── Revisiones automáticas con los datos reales del colegio ──
  const autoAlerts = useMemo<AlertItem[]>(() => {
    const out: AlertItem[] = [];
    const active = enrollments.filter(e => e.estado === 'activo' && inLevel(e.seccion_id));
    const activeIds = new Set(active.map(e => e.id));
    const inPeriod = (f: string) => !currentPeriod || (f >= currentPeriod.fecha_inicio && f <= currentPeriod.fecha_fin);
    const periodName = currentPeriod?.nombre || 'bimestre';

    // 1. Alumnos que faltan mucho
    const absences = new Map<string, number>();
    attendances
      .filter(a => a.estado === 'falta' && a.tipo_registro !== 'salida' && activeIds.has(a.matricula_id) && inPeriod(a.fecha))
      .forEach(a => absences.set(a.matricula_id, (absences.get(a.matricula_id) || 0) + 1));
    const manyAbs = active.filter(e => (absences.get(e.id) || 0) >= 3);
    if (manyAbs.length > 0) {
      out.push({
        key: 'auto-faltas', priority: 'alta', icon: UserX, auto: true,
        title: `${manyAbs.length} ${manyAbs.length === 1 ? 'alumno tiene' : 'alumnos tienen'} 3 o más faltas`,
        detail: `En el ${periodName}. Conviene llamar a sus familias para saber qué pasa.`,
        people: manyAbs.map(e => `${studentName(e.estudiante_id)} · ${sectionLabel(e.seccion_id)} · ${absences.get(e.id)} faltas`),
        peopleLabel: 'Ver alumnos', actionLabel: 'Ver alumnos', actionHref: '/admin/estudiantes',
      });
    }

    // 2. Alumnos con varias notas en C
    const cCount = new Map<string, number>();
    grades.filter(g => g.nota_letra === 'C' && activeIds.has(g.matricula_id)).forEach(g => cCount.set(g.matricula_id, (cCount.get(g.matricula_id) || 0) + 1));
    const lowGrades = active.filter(e => (cCount.get(e.id) || 0) >= 3);
    if (lowGrades.length > 0) {
      out.push({
        key: 'auto-notas-c', priority: 'alta', icon: Award, auto: true,
        title: `${lowGrades.length} ${lowGrades.length === 1 ? 'alumno tiene' : 'alumnos tienen'} 3 o más notas en C`,
        detail: 'Están en riesgo de no aprobar el año. Coordina refuerzo con sus docentes y tutores.',
        people: lowGrades.map(e => `${studentName(e.estudiante_id)} · ${sectionLabel(e.seccion_id)} · ${cCount.get(e.id)} notas en C`),
        peopleLabel: 'Ver alumnos', actionLabel: 'Ver reportes', actionHref: '/admin/reportes',
      });
    }

    // 3. Cierre de bimestre y docentes con notas pendientes
    const daysToClose = currentPeriod ? daysBetween(todayIso, currentPeriod.fecha_fin) : null;
    if (currentPeriod && daysToClose !== null && daysToClose >= 0 && daysToClose <= 21) {
      const gradeKeys = new Set(grades.filter(g => g.nota_letra && g.periodo_evaluacion_id === currentPeriod.id).map(g => `${g.matricula_id}|${g.competencia_id}`));
      const byTeacher = new Map<string, { expected: number; done: number }>();
      sectionCourses.filter(sc => inLevel(sc.seccion_id)).forEach(sc => {
        const comps = courses.find(c => c.id === sc.curso_id)?.competencias || [];
        const enrs = active.filter(e => e.seccion_id === sc.seccion_id);
        if (comps.length === 0 || enrs.length === 0) return;
        const row = byTeacher.get(sc.docente_id) || { expected: 0, done: 0 };
        enrs.forEach(e => comps.forEach(k => { row.expected++; if (gradeKeys.has(`${e.id}|${k.id}`)) row.done++; }));
        byTeacher.set(sc.docente_id, row);
      });
      const behind = Array.from(byTeacher.entries()).filter(([, r]) => r.done < r.expected);
      if (behind.length > 0) {
        out.push({
          key: 'auto-cierre', priority: daysToClose <= 7 ? 'critica' : 'media', icon: Calendar, auto: true,
          title: `El ${periodName} cierra en ${daysToClose} ${daysToClose === 1 ? 'día' : 'días'} y faltan notas`,
          detail: `${behind.length} ${behind.length === 1 ? 'docente aún no termina' : 'docentes aún no terminan'} de registrar las notas de sus alumnos.`,
          people: behind
            .map(([id, r]) => ({ id, pct: Math.round((r.done / r.expected) * 100) }))
            .sort((a, b) => a.pct - b.pct)
            .map(t => `${teacherName(t.id)} · lleva el ${t.pct}%`),
          peopleLabel: 'Ver docentes', actionLabel: 'Ver notas por aula', actionHref: '/admin/notas-salon',
        });
      }
    }

    // 4. Aulas con alumnos pero sin horario
    const noSchedule = sections.filter(s => inLevel(s.id) && active.some(e => e.seccion_id === s.id) && !scheduleSlots.some(sl => sl.seccion_id === s.id));
    if (noSchedule.length > 0) {
      out.push({
        key: 'auto-horario', priority: 'media', icon: Calendar, auto: true,
        title: `${noSchedule.length} ${noSchedule.length === 1 ? 'aula no tiene' : 'aulas no tienen'} horario`,
        detail: 'Tienen alumnos, pero aún no tienen clases programadas. Sin horario, los docentes no pueden tomar asistencia por curso.',
        people: noSchedule.map(s => sectionLabel(s.id)), peopleLabel: 'Ver aulas',
        actionLabel: 'Armar horario', actionHref: '/admin/horarios',
      });
    }

    // 5. Cursos sin docente en aulas con alumnos
    const missingTeacher: string[] = [];
    sections.filter(s => inLevel(s.id) && active.some(e => e.seccion_id === s.id)).forEach(s => {
      const nivel = s.grado?.nivel;
      courses.filter(c => c.nivel === nivel).forEach(c => {
        if (!sectionCourses.some(sc => sc.seccion_id === s.id && sc.curso_id === c.id && sc.docente_id)) missingTeacher.push(`${c.nombre} · ${sectionLabel(s.id)}`);
      });
    });
    if (missingTeacher.length > 0) {
      out.push({
        key: 'auto-sin-docente', priority: 'media', icon: GraduationCap, auto: true,
        title: `${missingTeacher.length} ${missingTeacher.length === 1 ? 'curso no tiene' : 'cursos no tienen'} docente en aulas con alumnos`,
        detail: 'Esos alumnos no tienen quién les registre notas ni asistencia en ese curso.',
        people: missingTeacher, peopleLabel: 'Ver cursos',
        actionLabel: 'Asignar docentes', actionHref: '/admin/docentes',
      });
    }

    // 6. Alumnos sin aula
    const enrolledStudents = new Set(enrollments.filter(e => e.estado === 'activo').map(e => e.estudiante_id));
    const noClassroom = level === 'todos' ? students.filter(s => !enrolledStudents.has(s.id)) : [];
    if (noClassroom.length > 0) {
      out.push({
        key: 'auto-sin-aula', priority: 'media', icon: School, auto: true,
        title: `${noClassroom.length} ${noClassroom.length === 1 ? 'alumno registrado no tiene' : 'alumnos registrados no tienen'} aula`,
        detail: 'Están en el sistema pero sin matrícula vigente, así que no aparecen en asistencia ni en notas.',
        people: noClassroom.map(s => studentName(s.id)), peopleLabel: 'Ver alumnos',
        actionLabel: 'Matricular', actionHref: '/admin/matriculas',
      });
    }

    // 7. Entregas de tareas sin calificar
    const levelTaskIds = new Set(tasks.filter(t => inLevel(t.seccion_id)).map(t => t.id));
    const toGrade = submissions.filter(s => levelTaskIds.has(s.tarea_id) && !s.calificacion_letra).length;
    if (toGrade > 0) {
      out.push({
        key: 'auto-tareas', priority: 'baja', icon: FileText, auto: true,
        title: `${toGrade} ${toGrade === 1 ? 'entrega de tarea espera' : 'entregas de tareas esperan'} nota`,
        detail: 'Los alumnos ya entregaron; falta que el docente las califique.',
        actionLabel: 'Ver tareas', actionHref: '/admin/tareas',
      });
    }

    // 8. Aulas llenas
    const full = sections.filter(s => inLevel(s.id) && active.filter(e => e.seccion_id === s.id).length >= (s.capacidad_maxima || 30));
    if (full.length > 0) {
      out.push({
        key: 'auto-llenas', priority: 'baja', icon: Users, auto: true,
        title: `${full.length} ${full.length === 1 ? 'aula está llena' : 'aulas están llenas'}`,
        detail: 'Ya no admiten más matrículas. Si llegan más alumnos, abre otra sección.',
        people: full.map(s => sectionLabel(s.id)), peopleLabel: 'Ver aulas',
        actionLabel: 'Ver matrículas', actionHref: '/admin/matriculas',
      });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrollments, students, sections, courses, grades, attendances, sectionCourses, scheduleSlots, evaluationPeriods, tasks, submissions, teachers, level, todayIso]);

  // ── Alertas registradas en el sistema ──
  const storedToItem = (a: SystemAlert): AlertItem => ({
    key: a.id, priority: a.prioridad, icon: CATEGORY_ICON[a.categoria] || Bell, auto: false,
    title: a.titulo, detail: a.descripcion, actionLabel: a.accion_label || 'Revisar', actionHref: a.accion_url || '/admin',
    createdAt: a.created_at, stored: a,
  });
  const levelAlerts = alerts.filter(a => level === 'todos' || !a.nivel || a.nivel === level);
  const pending = useMemo(
    () => [...levelAlerts.filter(a => a.estado !== 'resuelta').map(storedToItem), ...autoAlerts].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [alerts, autoAlerts, level]
  );
  const resolved = levelAlerts.filter(a => a.estado === 'resuelta').map(storedToItem);
  const countBy = (g: Group) => pending.filter(p => GROUP_OF[p.priority] === g).length;
  const shownPending = groupFilter === 'todas' ? pending : pending.filter(p => GROUP_OF[p.priority] === groupFilter);

  // ── Actividad reciente (quién hizo qué) ──
  const sortedLogs = useMemo(
    () => [...auditLogs].sort((a, b) => (parseTs(b.timestamp)?.getTime() || 0) - (parseTs(a.timestamp)?.getTime() || 0)),
    [auditLogs]
  );
  const filteredLogs = sortedLogs.filter(l => !activityQuery.trim() || `${l.usuario_nombre} ${l.detalle} ${l.modulo}`.toLowerCase().includes(activityQuery.trim().toLowerCase()));

  const renderAlert = (it: AlertItem, isResolved = false) => {
    const g = GROUP_STYLE[GROUP_OF[it.priority]];
    const open = openKey === it.key;
    return (
      <li key={it.key} className={`relative rounded-2xl border bg-white dark:bg-slate-900 overflow-hidden ${isResolved ? 'border-slate-200 dark:border-slate-800 opacity-80' : 'border-slate-200/80 dark:border-slate-800 shadow-xs'}`}>
        <span className={`absolute left-0 top-0 bottom-0 w-1.5 ${isResolved ? 'bg-emerald-400' : g.bar}`} />
        <div className="p-4 pl-5 flex flex-col sm:flex-row sm:items-start gap-3">
          <span className={`hidden sm:flex w-11 h-11 rounded-xl items-center justify-center shrink-0 ${isResolved ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300' : g.tile}`}>
            {isResolved ? <CheckCircle2 className="w-5 h-5" /> : <it.icon className="w-5 h-5" />}
          </span>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {!isResolved && <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${g.chip}`}>{g.label.replace(/s$/, '').replace('Para tener en cuenta', 'Aviso')}</span>}
              {it.auto
                ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><Sparkles className="w-3 h-3" /> Revisión automática</span>
                : it.createdAt && <span className="text-[11px] text-slate-400">{timeAgo(it.createdAt)}</span>}
            </div>
            <p className="text-base font-black text-slate-900 dark:text-white leading-snug">{it.title}</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">{it.detail}</p>
            {it.people && it.people.length > 0 && (
              <div className="pt-1">
                <button type="button" onClick={() => setOpenKey(open ? null : it.key)} aria-expanded={open} className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                  {open ? <>Ocultar <ChevronUp className="w-3.5 h-3.5" /></> : <>{it.peopleLabel || 'Ver detalle'} ({it.people.length}) <ChevronDown className="w-3.5 h-3.5" /></>}
                </button>
                {open && (
                  <ul className="mt-2 max-h-56 overflow-y-auto rounded-xl bg-slate-50 dark:bg-slate-800/50 divide-y divide-slate-100 dark:divide-slate-800">
                    {it.people.map((p, i) => <li key={i} className="px-3 py-1.5 text-sm text-slate-700 dark:text-slate-200">{p}</li>)}
                  </ul>
                )}
              </div>
            )}
            {it.auto && !isResolved && <p className="text-[11px] text-slate-400">Desaparece sola cuando se resuelva.</p>}
          </div>
          <div className="flex sm:flex-col items-stretch gap-2 shrink-0 sm:w-44">
            {!isResolved && (
              <Link href={it.actionHref} className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-sm font-bold ${g.btn}`}>
                {it.actionLabel} <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            {it.stored && !isResolved && (
              <button type="button" onClick={() => resolveAlert(it.stored!.id)} className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:border-emerald-400 hover:text-emerald-600 cursor-pointer">
                <Check className="w-4 h-4" /> Ya lo resolví
              </button>
            )}
          </div>
        </div>
      </li>
    );
  };

  const urgent = countBy('urgente');

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-16 animate-in fade-in-50">

      {/* ── 1. ENCABEZADO ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-rose-400 via-amber-400 to-sky-400" />
        <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-8 h-8 text-rose-500" /> Alertas
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              El sistema revisa tu colegio todo el tiempo y te avisa lo que necesita atención. Cada alerta te dice <strong>qué pasa</strong> y <strong>qué hacer</strong>.
            </p>
          </div>
          <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shrink-0 ${pending.length === 0 ? 'bg-emerald-50 dark:bg-emerald-950/30' : urgent > 0 ? 'bg-rose-50 dark:bg-rose-950/30' : 'bg-amber-50 dark:bg-amber-950/30'}`}>
            {pending.length === 0 ? <CheckCircle2 className="w-8 h-8 text-emerald-600" /> : <AlertTriangle className={`w-8 h-8 ${urgent > 0 ? 'text-rose-600' : 'text-amber-600'}`} />}
            <div>
              <p className="text-lg font-black text-slate-900 dark:text-white leading-tight">{pending.length === 0 ? 'Todo en orden' : `${pending.length} ${pending.length === 1 ? 'tema por revisar' : 'temas por revisar'}`}</p>
              <p className="text-xs text-slate-600 dark:text-slate-300">{pending.length === 0 ? 'No hay nada pendiente' : urgent > 0 ? `${urgent} ${urgent === 1 ? 'es urgente' : 'son urgentes'}` : 'Ninguno es urgente'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. RESUMEN POR URGENCIA (filtra la lista) ── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {(Object.keys(GROUP_STYLE) as Group[]).map(gId => {
          const g = GROUP_STYLE[gId];
          const active = groupFilter === gId;
          return (
            <button
              key={gId}
              type="button"
              aria-pressed={active}
              onClick={() => { setGroupFilter(active ? 'todas' : gId); setTab('pendientes'); }}
              className={`flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border text-left shadow-xs hover:shadow-md transition-all cursor-pointer ${active ? `border-transparent ring-2 ${g.ring}` : 'border-slate-200/80 dark:border-slate-800'}`}
            >
              <span className={`hidden sm:flex w-11 h-11 rounded-xl items-center justify-center shrink-0 ${g.tile}`}><g.icon className="w-5 h-5" /></span>
              <div className="flex-1 min-w-0 order-2 sm:order-none">
                <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 leading-tight">{g.label}</p>
                <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400">{g.hint}</p>
              </div>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white order-1 sm:order-none">{countBy(gId)}</span>
            </button>
          );
        })}
      </div>

      {/* ── 3. PESTAÑAS ── */}
      <div className="flex gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 w-full sm:w-fit overflow-x-auto">
        {([
          ['pendientes', 'Por atender', pending.length, AlertTriangle],
          ['resueltas', 'Resueltas', resolved.length, CheckCircle2],
          ['actividad', 'Actividad reciente', sortedLogs.length, Activity],
        ] as const).map(([id, label, n, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap cursor-pointer transition-all ${tab === id ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            <Icon className="w-4 h-4" /> {label}
            <span className={`px-1.5 rounded-full text-xs ${tab === id ? 'bg-slate-100 dark:bg-slate-800' : 'bg-white/70 dark:bg-slate-900/50'}`}>{n}</span>
          </button>
        ))}
      </div>

      {/* ── 4A. POR ATENDER ── */}
      {tab === 'pendientes' && (
        shownPending.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-emerald-300 dark:border-emerald-800 p-12 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <p className="text-lg font-black text-slate-900 dark:text-white">{groupFilter === 'todas' ? '¡Todo en orden!' : `No hay alertas ${GROUP_STYLE[groupFilter].label.toLowerCase()}`}</p>
            <p className="text-sm text-slate-500">Cuando algo necesite tu atención aparecerá aquí.</p>
            {groupFilter !== 'todas' && <button type="button" onClick={() => setGroupFilter('todas')} className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer"><X className="w-4 h-4" /> Ver todas</button>}
          </div>
        ) : (
          <ul className="space-y-3">{shownPending.map(it => renderAlert(it))}</ul>
        )
      )}

      {/* ── 4B. RESUELTAS ── */}
      {tab === 'resueltas' && (
        resolved.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center space-y-2">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-base font-black text-slate-900 dark:text-white">Aún no hay alertas resueltas</p>
            <p className="text-sm text-slate-500">Cuando marques una alerta como resuelta, quedará guardada aquí.</p>
          </div>
        ) : (
          <ul className="space-y-3">{resolved.map(it => renderAlert(it, true))}</ul>
        )
      )}

      {/* ── 4C. ACTIVIDAD RECIENTE ── */}
      {tab === 'actividad' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-base font-black text-slate-900 dark:text-white">¿Quién hizo qué?</p>
              <p className="text-xs text-slate-500">Todo lo que se hace en el sistema queda registrado aquí.</p>
            </div>
            <div className="relative sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={activityQuery}
                onChange={(e) => { setActivityQuery(e.target.value); setActivityShown(15); }}
                placeholder="Buscar por persona o acción..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          </div>
          {filteredLogs.length === 0 ? (
            <p className="p-10 text-center text-sm text-slate-500">{sortedLogs.length === 0 ? 'Aún no hay actividad registrada.' : 'No hay actividad con esa búsqueda.'}</p>
          ) : (
            <>
              <ol className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLogs.slice(0, activityShown).map(log => {
                  const m = moduleIcon(log.modulo);
                  return (
                    <li key={log.id} className="flex items-start gap-3 px-4 py-3">
                      <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${m.cls}`}><m.icon className="w-4 h-4" /></span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800 dark:text-slate-100"><strong>{log.usuario_nombre}</strong> · {log.detalle}</p>
                        <p className="text-xs text-slate-400 mt-0.5" suppressHydrationWarning>{log.modulo} · {timeAgo(log.timestamp)}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
              {filteredLogs.length > activityShown && (
                <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-center">
                  <button type="button" onClick={() => setActivityShown(n => n + 15)} className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer">
                    <ChevronDown className="w-4 h-4" /> Ver más actividad
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <p className="text-center text-xs text-slate-400">
        Las alertas se calculan con los datos actuales{level !== 'todos' ? ` · mostrando solo ${level}` : ''}.
      </p>
    </div>
  );
}
