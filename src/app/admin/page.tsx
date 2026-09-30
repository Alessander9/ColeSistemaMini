'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { EducationalLevel } from '@/types';
import {
  Activity,
  FileText,
  AlertTriangle,
  ArrowRight,
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  GraduationCap,
  Megaphone,
  QrCode,
  School,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

type Level = EducationalLevel | 'todos';

// ── Utilidades de fecha (siempre locales, nunca UTC) ──
const localIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parseIso = (iso: string) => { const [y, m, d] = iso.slice(0, 10).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
const daysBetween = (fromIso: string, toIso: string) => Math.round((parseIso(toIso).getTime() - parseIso(fromIso).getTime()) / 86400000);
// Últimos N días hábiles (lunes a viernes) terminando hoy
function lastSchoolDays(n: number, today = new Date()) {
  const out: Date[] = [];
  const d = new Date(today);
  while (out.length < n) {
    if (d.getDay() !== 0 && d.getDay() !== 6) out.unshift(new Date(d));
    d.setDate(d.getDate() - 1);
  }
  return out;
}
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

// ── Gráficos simples en SVG ──
function Ring({ value, size = 60, stroke = 7, color, track = 'text-slate-100 dark:text-slate-800', label }: { value: number; size?: number; stroke?: number; color: string; track?: string; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className={`stroke-current ${track}`} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round" className={`stroke-current ${color} transition-all duration-700`} strokeDasharray={c} strokeDashoffset={c - (v / 100) * c} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-slate-900 dark:text-white">{label ?? `${v}%`}</span>
    </div>
  );
}

function Donut({ parts, size = 124, stroke = 18, center }: { parts: { value: number; color: string; label: string }[]; size?: number; stroke?: number; center: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = parts.reduce((a, p) => a + p.value, 0);
  let offset = 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={parts.map(p => `${p.label}: ${p.value}`).join(', ')}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-current text-slate-100 dark:text-slate-800" />
        {total > 0 && parts.map(p => {
          const len = (p.value / total) * c;
          const el = <circle key={p.label} cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className={`stroke-current ${p.color}`} strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} />;
          offset += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{center}</div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const {
    currentUser,
    students = [],
    enrollments = [],
    attendances = [],
    grades = [],
    courses = [],
    gradeLevels = [],
    sections = [],
    teachers = [],
    scheduleSlots = [],
    evaluationPeriods = [],
    exams = [],
    calendarEvents = [],
    staffAttendances = [],
    brandingConfig,
    academicContext = { institucion: 'Colegio', nivel: 'todos', anio: 2026 },
    setAcademicLevel,
    alerts = [],
    resolveAlert,
    auditLogs = [],
    sectionCourses = [],
    tasks = [],
    submissions = [],
  } = useApp();

  const now = new Date();
  const todayIso = localIso(now);
  const level: Level = academicContext?.nivel || 'todos';

  // ── Nivel de cada aula y de cada matrícula ──
  const levelOfGrade = useMemo(() => new Map(gradeLevels.map(g => [g.id, g.nivel])), [gradeLevels]);
  const levelOfSection = useMemo(
    () => new Map(sections.map(s => [s.id, (s.grado?.nivel || levelOfGrade.get(s.grado_id)) as EducationalLevel | undefined])),
    [sections, levelOfGrade]
  );
  const activeEnrollments = useMemo(() => enrollments.filter(e => e.estado === 'activo'), [enrollments]);
  const inLevel = (secId?: string) => level === 'todos' || levelOfSection.get(secId || '') === level;

  const levelSections = useMemo(() => sections.filter(s => inLevel(s.id)), [sections, level, levelOfSection]); // eslint-disable-line react-hooks/exhaustive-deps
  const levelEnrollments = useMemo(() => activeEnrollments.filter(e => inLevel(e.seccion_id)), [activeEnrollments, level, levelOfSection]); // eslint-disable-line react-hooks/exhaustive-deps
  const levelEnrollmentIds = useMemo(() => new Set(levelEnrollments.map(e => e.id)), [levelEnrollments]);
  const enrollmentById = useMemo(() => new Map(activeEnrollments.map(e => [e.id, e])), [activeEnrollments]);

  const countByLevel = (lvl: EducationalLevel) => activeEnrollments.filter(e => levelOfSection.get(e.seccion_id) === lvl).length;

  // ── Alumnos y vacantes ──
  const totalStudents = levelEnrollments.length;
  const capacity = levelSections.reduce((sum, s) => sum + (s.capacidad_maxima || 30), 0);
  const occupancy = pct(totalStudents, capacity);

  // ── Asistencia (entradas del día, sin salidas) ──
  const entryRecords = useMemo(
    () => attendances.filter(a => a.tipo_registro !== 'salida' && levelEnrollmentIds.has(a.matricula_id)),
    [attendances, levelEnrollmentIds]
  );
  const dayStats = (iso: string) => {
    const recs = entryRecords.filter(a => a.fecha === iso);
    const byEnr = new Map(recs.map(r => [r.matricula_id, r.estado]));
    const count = (st: string) => Array.from(byEnr.values()).filter(v => v === st).length;
    const presente = count('presente'), tardanza = count('tardanza'), falta = count('falta'), justificado = count('justificado');
    const registered = byEnr.size;
    return { iso, presente, tardanza, falta, justificado, registered, came: presente + tardanza, rate: pct(presente + tardanza, registered) };
  };
  const today = dayStats(todayIso);
  const week = lastSchoolDays(5, now).map(d => ({ ...dayStats(localIso(d)), date: d }));
  const pastDaysWithData = week.filter(d => d.iso !== todayIso && d.registered > 0);
  const weekAvg = pastDaysWithData.length > 0 ? Math.round(pastDaysWithData.reduce((a, d) => a + d.rate, 0) / pastDaysWithData.length) : null;
  const deltaVsWeek = weekAvg !== null && today.registered > 0 ? today.rate - weekAvg : null;
  const withoutRecord = Math.max(0, totalStudents - today.registered);
  const lastRecord = entryRecords.filter(a => a.fecha === todayIso).sort((a, b) => (b.hora_registro || '').localeCompare(a.hora_registro || ''))[0];

  // ── Rendimiento académico (bimestre actual) ──
  const currentPeriod = evaluationPeriods.find(p => p.fecha_inicio <= todayIso && todayIso <= p.fecha_fin) || evaluationPeriods.find(p => p.activo && !p.cerrado);
  const levelGrades = grades.filter(g => levelEnrollmentIds.has(g.matricula_id) && (!currentPeriod || g.periodo_evaluacion_id === currentPeriod.id) && g.nota_letra);
  const gradeCount = (l: string) => levelGrades.filter(g => g.nota_letra === l).length;
  const gAD = gradeCount('AD'), gA = gradeCount('A'), gB = gradeCount('B'), gC = gradeCount('C');
  const gTotal = gAD + gA + gB + gC;
  const achievement = pct(gAD + gA, gTotal);
  const courseOfCompetency = useMemo(() => {
    const m = new Map<string, { id: string; nombre: string; color?: string }>();
    courses.forEach(c => c.competencias?.forEach(k => m.set(k.id, { id: c.id, nombre: c.nombre, color: c.color_hex })));
    return m;
  }, [courses]);
  const coursesNeedingHelp = useMemo(() => {
    const agg = new Map<string, { nombre: string; color?: string; c: number; total: number }>();
    levelGrades.forEach(g => {
      const course = courseOfCompetency.get(g.competencia_id);
      if (!course) return;
      const row = agg.get(course.id) || { nombre: course.nombre, color: course.color, c: 0, total: 0 };
      row.total++;
      if (g.nota_letra === 'C' || g.nota_letra === 'B') row.c++;
      agg.set(course.id, row);
    });
    return Array.from(agg.values()).filter(r => r.c > 0).map(r => ({ ...r, share: pct(r.c, r.total) })).sort((a, b) => b.share - a.share).slice(0, 4);
  }, [levelGrades, courseOfCompetency]);
  const daysToClose = currentPeriod ? daysBetween(todayIso, currentPeriod.fecha_fin) : null;

  // ── Docentes ──
  const activeTeachers = teachers.filter(t => t.rol === 'docente' && t.activo !== false);
  const teachersToday = new Set(staffAttendances.filter(s => s.fecha === todayIso && s.tipo === 'entrada').map(s => s.user_id)).size;

  // ── Aulas: ocupación y asistencia de hoy ──
  const classroomCards = useMemo(() => {
    // Índices: una sola pasada por matrículas, asistencias de hoy y horarios
    const enrsBySection = new Map<string, string[]>();
    activeEnrollments.forEach(e => enrsBySection.set(e.seccion_id, [...(enrsBySection.get(e.seccion_id) || []), e.id]));
    const todayByEnr = new Map<string, string>();
    attendances.forEach(a => { if (a.fecha === todayIso && a.tipo_registro !== 'salida') todayByEnr.set(a.matricula_id, a.estado); });
    const withSchedule = new Set(scheduleSlots.map(sl => sl.seccion_id));
    return levelSections
      .map(s => {
        const enrIds = enrsBySection.get(s.id) || [];
        let registered = 0, came = 0;
        enrIds.forEach(id => {
          const st = todayByEnr.get(id);
          if (st === undefined) return;
          registered++;
          if (st === 'presente' || st === 'tardanza') came++;
        });
        return {
          s,
          students: enrIds.length,
          capacity: s.capacidad_maxima || 30,
          registered,
          rate: pct(came, registered),
          hasSchedule: withSchedule.has(s.id),
        };
      })
      .sort((a, b) => (a.s.grado?.numero_grado ?? 0) - (b.s.grado?.numero_grado ?? 0) || a.s.letra.localeCompare(b.s.letra));
  }, [levelSections, activeEnrollments, attendances, scheduleSlots, todayIso]);
  const [showAllClassrooms, setShowAllClassrooms] = useState(false);
  const classroomsWithStudents = classroomCards.filter(c => c.students > 0);
  const shownClassrooms = showAllClassrooms ? classroomCards : (classroomsWithStudents.length > 0 ? classroomsWithStudents : classroomCards).slice(0, 12);

  // ── Qué requiere atención (lista única, ordenada por urgencia) ──
  const pendingAlerts = alerts.filter(a => a.estado !== 'resuelta' && (level === 'todos' || !a.nivel || a.nivel === level));
  const prioOrder = { critica: 0, alta: 1, media: 2, baja: 3 } as const;
  const studentsManyAbsences = useMemo(() => {
    const byEnr = new Map<string, number>();
    entryRecords.filter(a => a.estado === 'falta' && (!currentPeriod || (a.fecha >= currentPeriod.fecha_inicio && a.fecha <= currentPeriod.fecha_fin)))
      .forEach(a => byEnr.set(a.matricula_id, (byEnr.get(a.matricula_id) || 0) + 1));
    return Array.from(byEnr.entries()).filter(([, n]) => n >= 3).length;
  }, [entryRecords, currentPeriod]);
  const sectionsWithoutSchedule = classroomCards.filter(c => c.students > 0 && !c.hasSchedule).length;

  type AttentionItem = { key: string; tone: 'rose' | 'amber' | 'blue' | 'purple'; icon: React.ElementType; title: string; detail: string; href: string; action: string; onResolve?: () => void };
  const attention: AttentionItem[] = [
    ...pendingAlerts
      .slice()
      .sort((a, b) => prioOrder[a.prioridad] - prioOrder[b.prioridad])
      .slice(0, 3)
      .map(a => ({
        key: a.id,
        tone: (a.prioridad === 'critica' ? 'rose' : a.prioridad === 'alta' ? 'amber' : 'purple') as AttentionItem['tone'],
        icon: AlertTriangle,
        title: a.titulo,
        detail: a.descripcion,
        href: a.accion_url || '/admin/alertas',
        action: a.accion_label || 'Revisar',
        onResolve: () => resolveAlert(a.id),
      })),
    ...(studentsManyAbsences > 0 ? [{ key: 'faltas', tone: 'amber' as const, icon: Users, title: `${studentsManyAbsences} ${studentsManyAbsences === 1 ? 'alumno con' : 'alumnos con'} 3 o más faltas`, detail: 'En este bimestre. Conviene contactar a sus familias', href: '/admin/estudiantes', action: 'Ver alumnos' }] : []),
    ...(daysToClose !== null && daysToClose >= 0 && daysToClose <= 21 ? [{ key: 'cierre', tone: (daysToClose <= 7 ? 'rose' : 'blue') as AttentionItem['tone'], icon: Award, title: `${daysToClose} ${daysToClose === 1 ? 'día' : 'días'} para cerrar el ${currentPeriod?.nombre}`, detail: 'Verifica que los docentes registren todas sus notas', href: '/admin/notas-salon', action: 'Ver notas por aula' }] : []),
    ...(sectionsWithoutSchedule > 0 ? [{ key: 'horario', tone: 'purple' as const, icon: Calendar, title: `${sectionsWithoutSchedule} ${sectionsWithoutSchedule === 1 ? 'aula sin horario' : 'aulas sin horario'}`, detail: 'Tienen alumnos pero aún no tienen clases programadas', href: '/admin/horarios', action: 'Armar horario' }] : []),
  ];
  const TONE = {
    rose: { box: 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300', bar: 'bg-rose-500', btn: 'bg-rose-600 hover:bg-rose-700' },
    amber: { box: 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300', bar: 'bg-amber-500', btn: 'bg-amber-500 hover:bg-amber-600' },
    blue: { box: 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300', bar: 'bg-blue-500', btn: 'bg-blue-600 hover:bg-blue-700' },
    purple: { box: 'bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300', bar: 'bg-purple-500', btn: 'bg-purple-600 hover:bg-purple-700' },
  };

  // ── Agenda: eventos del calendario, evaluaciones y cierre de bimestre ──
  const agenda = [
    ...calendarEvents
      .filter(e => e.fecha_fin >= todayIso && (level === 'todos' || e.nivel === 'todos' || e.nivel === level))
      .map(e => ({ key: e.id, date: e.fecha_inicio < todayIso ? todayIso : e.fecha_inicio, title: e.titulo, kind: e.es_laborable ? 'Evento' : 'Feriado / sin clases', icon: CalendarDays, href: '/admin/calendario' })),
    ...exams
      .filter(e => e.fecha_programada >= todayIso && inLevel(e.seccion_id) && e.estado !== 'borrador')
      .map(e => {
        const s = sections.find(x => x.id === e.seccion_id);
        return { key: e.id, date: e.fecha_programada, title: e.titulo, kind: `Evaluación · ${s ? `${s.grado?.nombre || ''} "${s.letra}"` : ''}`, icon: BookOpen, href: '/admin/evaluaciones' };
      }),
    ...(currentPeriod && currentPeriod.fecha_fin >= todayIso ? [{ key: 'cierre', date: currentPeriod.fecha_fin, title: `Cierre del ${currentPeriod.nombre}`, kind: 'Fin de periodo', icon: Award, href: '/admin/evaluaciones' }] : []),
  ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);

  // ── Guía de puesta en marcha (solo si falta algo) ──
  const steps = [
    { title: 'Cursos', ready: courses.length > 0, href: '/admin/academico', icon: BookOpen, detail: `${courses.length} cursos` },
    { title: 'Aulas', ready: sections.length > 0, href: '/admin/academico?tab=grados', icon: School, detail: `${sections.length} aulas` },
    { title: 'Docentes', ready: activeTeachers.length > 0, href: '/admin/docentes', icon: GraduationCap, detail: `${activeTeachers.length} docentes` },
    { title: 'Horarios', ready: scheduleSlots.length > 0, href: '/admin/horarios', icon: Calendar, detail: `${scheduleSlots.length} bloques` },
    { title: 'Matrícula', ready: enrollments.length > 0, href: '/admin/matriculas', icon: UserPlus, detail: `${enrollments.length} alumnos` },
  ];
  const setupDone = steps.filter(s => s.ready).length;
  const [setupOpen, setSetupOpen] = useState(false);
  const [attentionOpen, setAttentionOpen] = useState(false);

  // ── Actividad reciente: la hora se guarda en UTC ("YYYY-MM-DD HH:mm:ss"), se muestra en hora local ──
  const [showAllActivity, setShowAllActivity] = useState(false);
  const logDate = (ts: string) => {
    const d = new Date(ts.includes('T') || ts.endsWith('Z') ? ts : `${ts.replace(' ', 'T')}Z`);
    return isNaN(d.getTime()) ? null : d;
  };
  const timeAgo = (ts: string) => {
    const d = logDate(ts);
    if (!d) return ts;
    const mins = Math.round((now.getTime() - d.getTime()) / 60000);
    const hhmm = d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    if (mins < 1) return 'Hace un momento';
    if (mins < 60) return `Hace ${mins} min`;
    const days = daysBetween(localIso(d), todayIso);
    if (days === 0) return `Hoy, ${hhmm}`;
    if (days === 1) return `Ayer, ${hhmm}`;
    return `${d.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' })}, ${hhmm}`;
  };
  const MODULE_STYLE: { match: RegExp; icon: React.ElementType; cls: string }[] = [
    { match: /matr[ií]cula|estudiante|alumno/i, icon: UserPlus, cls: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300' },
    { match: /asistencia|kiosco|qr/i, icon: QrCode, cls: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300' },
    { match: /nota|evaluaci|calificaci/i, icon: Award, cls: 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300' },
    { match: /tarea/i, icon: FileText, cls: 'bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300' },
    { match: /comunicado|aviso/i, icon: Megaphone, cls: 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300' },
    { match: /horario/i, icon: Calendar, cls: 'bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300' },
    { match: /docente|curso|acad[eé]mic/i, icon: GraduationCap, cls: 'bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300' },
    { match: /usuario|rbac|seguridad/i, icon: Users, cls: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  ];
  const moduleStyle = (modulo: string) => MODULE_STYLE.find(m => m.match.test(modulo)) || { icon: Clock, cls: 'bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300' };
  const sortedLogs = [...auditLogs].sort((a, b) => (logDate(b.timestamp)?.getTime() || 0) - (logDate(a.timestamp)?.getTime() || 0));
  const shownLogs = sortedLogs.slice(0, showAllActivity ? 12 : 5);
  useEffect(() => {
    if (!attentionOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setAttentionOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [attentionOpen]);

  // ── Avance del bimestre: notas registradas por cada docente ──
  const gradeKeys = useMemo(
    () => new Set(grades.filter(g => g.nota_letra && (!currentPeriod || g.periodo_evaluacion_id === currentPeriod.id)).map(g => `${g.matricula_id}|${g.competencia_id}`)),
    [grades, currentPeriod]
  );
  const teacherName = (id: string) => {
    const t = teachers.find(x => x.id === id);
    return t ? `${t.nombres || ''} ${t.apellidos || ''}`.trim() || 'Docente' : 'Sin docente asignado';
  };
  const teacherProgress = (() => {
    const map = new Map<string, { id: string; expected: number; done: number }>();
    sectionCourses.filter(sc => inLevel(sc.seccion_id)).forEach(sc => {
      const comps = courses.find(c => c.id === sc.curso_id)?.competencias || [];
      const enrs = activeEnrollments.filter(e => e.seccion_id === sc.seccion_id);
      if (comps.length === 0 || enrs.length === 0) return;
      const row = map.get(sc.docente_id) || { id: sc.docente_id, expected: 0, done: 0 };
      enrs.forEach(e => comps.forEach(k => { row.expected++; if (gradeKeys.has(`${e.id}|${k.id}`)) row.done++; }));
      map.set(sc.docente_id, row);
    });
    return Array.from(map.values()).map(r => ({ ...r, pct: pct(r.done, r.expected), name: teacherName(r.id) }));
  })();
  const notesExpected = teacherProgress.reduce((a, t) => a + t.expected, 0);
  const notesDone = teacherProgress.reduce((a, t) => a + t.done, 0);
  const notesPct = pct(notesDone, notesExpected);
  const notesPctText = notesDone > 0 && notesPct === 0 ? 'menos del 1' : String(notesPct);
  const teachersBehind = teacherProgress.filter(t => t.pct < 100).sort((a, b) => a.pct - b.pct);
  const levelTaskIds = new Set(tasks.filter(t => inLevel(t.seccion_id)).map(t => t.id));
  const toGrade = submissions.filter(sb => levelTaskIds.has(sb.tarea_id) && !sb.calificacion_letra).length;
  const in7 = localIso(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7));
  const examsThisWeek = exams.filter(e => e.fecha_programada >= todayIso && e.fecha_programada <= in7 && inLevel(e.seccion_id) && e.estado !== 'borrador').length;

  // ── Encabezado ──
  const greeting = now.getHours() < 12 ? 'Buenos días' : now.getHours() < 18 ? 'Buenas tardes' : 'Buenas noches';
  const longDate = (() => { const t = now.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); return t.charAt(0).toUpperCase() + t.slice(1); })();
  const schoolName = brandingConfig?.nombreInstitucion || academicContext?.institucion || 'Tu institución';
  const firstName = currentUser?.nombres && currentUser.nombres !== 'Administrador' ? currentUser.nombres.split(' ')[0] : '';
  const summary: string[] = [
    attention.length > 0 ? `tienes ${attention.length} ${attention.length === 1 ? 'tema pendiente' : 'temas pendientes'}` : 'no tienes pendientes urgentes',
    ...(notesExpected > 0 ? [`los docentes llevan el ${notesPctText}% de las notas del ${currentPeriod?.nombre || 'bimestre'}`] : []),
  ];
  const summaryRest = summary.slice(1);
  const summaryTail = summaryRest.length === 0 ? '' : summaryRest.length === 1 ? ` y ${summaryRest[0]}` : `, ${summaryRest.slice(0, -1).join(', ')} y ${summaryRest[summaryRest.length - 1]}`;

  const levelTabs: { id: Level; label: string; icon: string; count: number }[] = [
    { id: 'todos', label: 'Todo el colegio', icon: '🏛️', count: activeEnrollments.length },
    { id: 'inicial', label: 'Inicial', icon: '🧸', count: countByLevel('inicial') },
    { id: 'primaria', label: 'Primaria', icon: '📚', count: countByLevel('primaria') },
    { id: 'secundaria', label: 'Secundaria', icon: '🎓', count: countByLevel('secundaria') },
  ];

  const card = 'rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm';
  const maxWeek = Math.max(1, ...week.map(d => d.registered));

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10 animate-in fade-in-50">

      {/* ══════════ 1. ENCABEZADO (compacto) ══════════ */}
      <section className={`${card} overflow-hidden`}>
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-500" />
        <div className="p-4 sm:p-5 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5" suppressHydrationWarning>
                <School className="w-3.5 h-3.5 text-indigo-500" /> {schoolName} · {longDate}
              </p>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-0.5" suppressHydrationWarning>
                {greeting}{firstName ? `, ${firstName}` : ''}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                Hoy {attention.length > 0 ? (
                  <button type="button" onClick={() => setAttentionOpen(true)} className="font-bold text-rose-600 dark:text-rose-400 underline decoration-dotted underline-offset-4 hover:decoration-solid cursor-pointer">{summary[0]}</button>
                ) : summary[0]}{summaryTail}.
              </p>
            </div>

            <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2 shrink-0">
              {[
                { href: '/admin/matriculas', label: 'Matricular alumno', short: 'Matricular', icon: UserPlus, cls: 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent' },
                { href: '/admin/comunicados', label: 'Enviar comunicado', short: 'Comunicado', icon: Megaphone, cls: 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-400' },
                { href: '/admin/reportes', label: 'Reportes', short: 'Reportes', icon: BarChart3, cls: 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-400' },
              ].map(a => (
                <Link key={a.href} href={a.href} className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-bold transition-colors ${a.cls}`}>
                  <a.icon className="w-4 h-4 shrink-0" /> <span className="sm:hidden">{a.short}</span><span className="hidden sm:inline">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Selector de nivel */}
          <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800" role="tablist" aria-label="Ver por nivel">
            {levelTabs.map(t => {
              const active = level === t.id;
              return (
                <button key={t.id} type="button" role="tab" aria-selected={active} onClick={() => setAcademicLevel(t.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${active ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                  <span>{t.icon}</span> {t.label}
                  <span className={`px-1.5 rounded-full text-xs ${active ? 'bg-white/20 dark:bg-slate-900/10' : 'bg-white dark:bg-slate-900'}`}>{t.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════ Guía de puesta en marcha (solo si falta configurar algo) ══════════ */}
      {setupDone < steps.length && (
        <section className={`${card} p-3 sm:p-4`}>
          <div className="flex flex-wrap items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white flex items-center justify-center shrink-0"><Sparkles className="w-5 h-5 text-amber-300" /></span>
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white">Termina de configurar tu colegio · {setupDone} de {steps.length} pasos listos</p>
              <div className="mt-1.5 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden max-w-md">
                <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500" style={{ width: `${pct(setupDone, steps.length)}%` }} />
              </div>
            </div>
            <button type="button" onClick={() => setSetupOpen(v => !v)} aria-expanded={setupOpen} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
              {setupOpen ? <>Ocultar pasos <ChevronUp className="w-4 h-4" /></> : <>Ver pasos <ChevronDown className="w-4 h-4" /></>}
            </button>
          </div>
          {setupOpen && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4">
              {steps.map((st, i) => (
                <Link key={st.title} href={st.href} className={`p-3 rounded-2xl border-2 transition-all hover:-translate-y-0.5 ${st.ready ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20' : 'border-indigo-300 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/20'}`}>
                  <span className={`inline-flex w-7 h-7 rounded-lg items-center justify-center text-xs font-black ${st.ready ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white'}`}>{st.ready ? <Check className="w-4 h-4" /> : i + 1}</span>
                  <p className="text-sm font-black text-slate-900 dark:text-white mt-2">{st.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{st.ready ? st.detail : 'Pendiente · configurar →'}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ══════════ 2. INDICADORES: docentes, matrícula, notas y asistencia ══════════ */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3" aria-label="Indicadores principales">
        {/* Docentes */}
        <Link href="/admin/docentes" className={`${card} p-4 flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all`}>
          <Ring value={pct(teachersToday, activeTeachers.length)} color="text-amber-500" label={`${teachersToday}/${activeTeachers.length}`} />
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Docentes</p>
            <p className="text-xl font-black text-slate-900 dark:text-white leading-tight">{activeTeachers.length} {activeTeachers.length === 1 ? 'activo' : 'activos'}</p>
            <p className="text-xs text-slate-500">{teachersToday} marcaron su ingreso hoy</p>
          </div>
        </Link>
        {/* Alumnos */}
        <Link href="/admin/estudiantes" className={`${card} p-4 flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all`}>
          <Ring value={occupancy} color="text-indigo-500" />
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Alumnos matriculados</p>
            <p className="text-xl font-black text-slate-900 dark:text-white leading-tight">{totalStudents.toLocaleString('es-PE')}</p>
            <p className="text-xs text-slate-500"><strong className="text-slate-700 dark:text-slate-200">{Math.max(0, capacity - totalStudents)} vacantes libres</strong> en {levelSections.length} aulas</p>
          </div>
        </Link>

        {/* Rendimiento */}
        <Link href="/admin/notas-salon" className={`${card} p-4 flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all`}>
          <Ring value={achievement} color="text-blue-500" label={gTotal > 0 ? `${achievement}%` : '—'} />
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Notas en logro</p>
            <p className="text-xl font-black text-slate-900 dark:text-white leading-tight">AD + A</p>
            <p className="text-xs text-slate-500">{gTotal > 0 ? `${gTotal} notas del ${currentPeriod?.nombre || 'bimestre'}` : 'Aún no hay notas este bimestre'}</p>
          </div>
        </Link>

        {/* Asistencia hoy */}
        <Link href="/admin/estudiantes" className={`${card} p-4 flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all`}>
          <Ring value={today.rate} color="text-emerald-500" label={today.registered > 0 ? `${today.rate}%` : '—'} />
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Asistencia de hoy</p>
            <p className="text-xl font-black text-slate-900 dark:text-white leading-tight">{today.came} <span className="text-sm font-bold text-slate-400">de {totalStudents}</span></p>
            {deltaVsWeek !== null ? (
              <p className={`text-xs font-bold inline-flex items-center gap-1 ${deltaVsWeek >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {deltaVsWeek >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {deltaVsWeek >= 0 ? '+' : ''}{deltaVsWeek} pts vs. la semana
              </p>
            ) : <p className="text-xs text-slate-500">{today.registered > 0 ? `${today.tardanza} tardanzas` : 'Esperando registros del kiosco'}</p>}
          </div>
        </Link>

      </section>

      {/* ══════════ 3. AVANCE DEL BIMESTRE + RENDIMIENTO ══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className={`${card} lg:col-span-6 p-4 sm:p-5 space-y-3`}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2"><Award className="w-5 h-5 text-indigo-600" /> Avance del {currentPeriod?.nombre || 'bimestre'}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {daysToClose !== null && daysToClose >= 0 ? <>Cierra en <strong className={daysToClose <= 7 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-200'}>{daysToClose} {daysToClose === 1 ? 'día' : 'días'}</strong> · ¿los docentes están al día?</> : '¿Los docentes están al día con sus notas?'}
              </p>
            </div>
            <Link href="/admin/notas-salon" className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0">Ver notas</Link>
          </div>

          {notesExpected === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">Cuando haya cursos con docente y alumnos matriculados verás aquí el avance de notas.</p>
          ) : (
            <>
              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
                <div className="flex items-end justify-between gap-2">
                  <p className="text-sm font-bold text-indigo-800 dark:text-indigo-200">Notas registradas</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white leading-none">{notesDone > 0 && notesPct === 0 ? '<1' : notesPct}%</p>
                </div>
                <div className="mt-2 h-2.5 rounded-full bg-white dark:bg-slate-800 overflow-hidden"><div className={`h-full rounded-full ${notesPct >= 90 ? 'bg-emerald-500' : notesPct >= 50 ? 'bg-indigo-600' : 'bg-amber-500'}`} style={{ width: `${notesPct}%` }} /></div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5">{notesDone.toLocaleString('es-PE')} de {notesExpected.toLocaleString('es-PE')} notas esperadas (alumnos × competencias de cada curso)</p>
              </div>

              {teachersBehind.length === 0 ? (
                <p className="text-sm font-bold text-emerald-600 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Todos los docentes tienen sus notas completas</p>
              ) : (
                <div className="space-y-2.5">
                  <p className="text-sm font-black text-slate-800 dark:text-slate-100">{teachersBehind.length} {teachersBehind.length === 1 ? 'docente aún no termina' : 'docentes aún no terminan'} de registrar notas</p>
                  {teachersBehind.slice(0, 4).map(t => (
                    <div key={t.id} className="space-y-1">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">{t.name}</span>
                        <span className={`text-xs font-black shrink-0 ${t.pct < 50 ? 'text-rose-600' : 'text-amber-600'}`}>{t.pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"><div className={`h-full rounded-full ${t.pct < 50 ? 'bg-rose-500' : 'bg-amber-400'}`} style={{ width: `${t.pct}%` }} /></div>
                    </div>
                  ))}
                  {teachersBehind.length > 4 && <Link href="/admin/docentes" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">y {teachersBehind.length - 4} más →</Link>}
                </div>
              )}
            </>
          )}

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Link href="/admin/tareas" className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800">
              <p className="text-xl font-black text-slate-900 dark:text-white">{toGrade}</p>
              <p className="text-xs font-semibold text-slate-500">entregas de tareas sin calificar</p>
            </Link>
            <Link href="/admin/evaluaciones" className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800">
              <p className="text-xl font-black text-slate-900 dark:text-white">{examsThisWeek}</p>
              <p className="text-xs font-semibold text-slate-500">evaluaciones en los próximos 7 días</p>
            </Link>
          </div>
        </section>
        {/* Rendimiento académico */}
        <section className={`${card} lg:col-span-6 p-4 sm:p-5 space-y-4`}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2"><Award className="w-5 h-5 text-blue-600" /> Rendimiento académico</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{currentPeriod ? `Notas del ${currentPeriod.nombre}` : 'Notas del periodo actual'}</p>
            </div>
            <Link href="/admin/notas-salon" className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0">Ver por aula</Link>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <Donut
              parts={[
                { value: gAD, color: 'text-emerald-500', label: 'AD' },
                { value: gA, color: 'text-blue-500', label: 'A' },
                { value: gB, color: 'text-amber-400', label: 'B' },
                { value: gC, color: 'text-rose-500', label: 'C' },
              ]}
              center={gTotal > 0 ? <><span className="text-3xl font-black text-slate-900 dark:text-white">{achievement}%</span><span className="text-[11px] font-bold text-slate-500">en logro</span></> : <span className="text-xs font-bold text-slate-400 px-4">Sin notas aún</span>}
            />
            <ul className="flex-1 w-full space-y-2">
              {[
                { l: 'AD', name: 'Logro destacado', n: gAD, dot: 'bg-emerald-500' },
                { l: 'A', name: 'Logro esperado', n: gA, dot: 'bg-blue-500' },
                { l: 'B', name: 'En proceso', n: gB, dot: 'bg-amber-400' },
                { l: 'C', name: 'En inicio', n: gC, dot: 'bg-rose-500' },
              ].map(x => (
                <li key={x.l} className="flex items-center gap-2.5 text-sm">
                  <span className={`w-7 h-7 rounded-lg ${x.dot} text-white text-xs font-black flex items-center justify-center`}>{x.l}</span>
                  <span className="flex-1 text-slate-700 dark:text-slate-200">{x.name}</span>
                  <span className="font-black text-slate-900 dark:text-white">{pct(x.n, gTotal)}%</span>
                </li>
              ))}
            </ul>
          </div>
          {coursesNeedingHelp.length > 0 && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <p className="text-sm font-black text-slate-800 dark:text-slate-100">Cursos que necesitan refuerzo</p>
              {coursesNeedingHelp.map(c => (
                <div key={c.nombre} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color || '#6366f1' }} /> {c.nombre}</span>
                    <span className="text-xs font-bold text-slate-500">{c.share}% en B o C</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-500" style={{ width: `${c.share}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

      {/* ══════════ 4. AGENDA + ACTIVIDAD ══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Agenda */}
        <section className={`${card} p-4 sm:p-5 space-y-3`}>
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2"><CalendarDays className="w-5 h-5 text-purple-600" /> Próximamente</h2>
            <Link href="/admin/calendario" className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Calendario</Link>
          </div>
          {agenda.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">No hay eventos próximos.</p>
          ) : (
            <ul className="space-y-2.5">
              {agenda.map(a => {
                const d = parseIso(a.date);
                const inDays = daysBetween(todayIso, a.date);
                return (
                  <li key={a.key}>
                    <Link href={a.href} className="flex items-center gap-3 p-2 -mx-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <span className="w-12 shrink-0 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 text-center">
                        <span className="block text-[10px] font-black bg-purple-600 text-white uppercase">{d.toLocaleDateString('es-PE', { month: 'short' }).replace('.', '')}</span>
                        <span className="block text-lg font-black text-slate-900 dark:text-white leading-tight py-0.5">{d.getDate()}</span>
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-slate-900 dark:text-white truncate">{a.title}</span>
                        <span className="block text-xs text-slate-500 truncate">{inDays === 0 ? 'Hoy' : inDays === 1 ? 'Mañana' : `En ${inDays} días`} · {a.kind}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Actividad reciente */}
        <section className={`${card} p-4 sm:p-5 space-y-3`}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2"><Activity className="w-5 h-5 text-sky-600" /> Actividad reciente</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Lo último que se hizo en el sistema y quién lo hizo</p>
            </div>
            {sortedLogs.length > 0 && <span className="text-xs font-bold text-slate-400 shrink-0">{sortedLogs.length} registros</span>}
          </div>
          {sortedLogs.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">Aún no hay actividad registrada.</p>
          ) : (
            <>
              <ol className="relative space-y-3 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-slate-200 dark:before:bg-slate-700">
                {shownLogs.map(log => {
                  const st = moduleStyle(log.modulo);
                  return (
                    <li key={log.id} className="relative flex items-start gap-3">
                      <span className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ring-4 ring-white dark:ring-slate-900 ${st.cls}`}><st.icon className="w-4 h-4" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-800 dark:text-slate-100 leading-snug"><strong>{log.usuario_nombre}</strong> · {log.detalle}</p>
                        <p className="text-xs text-slate-400 mt-0.5" suppressHydrationWarning>{log.modulo} · {timeAgo(log.timestamp)}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
              {sortedLogs.length > 5 && (
                <button type="button" onClick={() => setShowAllActivity(v => !v)} className="w-full py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center justify-center gap-1 cursor-pointer">
                  {showAllActivity ? <>Ver menos <ChevronUp className="w-4 h-4" /></> : <>Ver más actividad <ChevronDown className="w-4 h-4" /></>}
                </button>
              )}
            </>
          )}
        </section>
      </div>

      {/* ══════════ 5. ASISTENCIA Y AULAS (consulta del día a día) ══════════ */}
        <section className={`${card} p-4 sm:p-5 space-y-4`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2"><QrCode className="w-5 h-5 text-emerald-600" /> Asistencia de la semana</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Cuántos alumnos llegaron cada día (registros del kiosco y de los docentes)</p>
            </div>
            {weekAvg !== null && <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-sm font-black">Promedio: {weekAvg}%</span>}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-center">
          {/* Barras por día */}
          <div className="lg:col-span-3 grid grid-cols-5 gap-3 items-end h-36" role="img" aria-label={week.map(d => `${d.date.toLocaleDateString('es-PE', { weekday: 'long' })}: ${d.registered > 0 ? `${d.rate}%` : 'sin registros'}`).join('. ')}>
            {week.map(d => {
              const isToday = d.iso === todayIso;
              const h = (n: number) => `${(n / maxWeek) * 100}%`;
              return (
                <div key={d.iso} className="h-full flex flex-col items-center gap-2">
                  <span className={`text-sm font-black ${d.registered === 0 ? 'text-slate-300 dark:text-slate-600' : d.rate >= 90 ? 'text-emerald-600' : d.rate >= 80 ? 'text-amber-600' : 'text-rose-600'}`}>{d.registered > 0 ? `${d.rate}%` : '—'}</span>
                  <div className={`w-full max-w-[64px] flex-1 flex flex-col justify-end rounded-2xl overflow-hidden ${isToday ? 'ring-2 ring-indigo-400 ring-offset-2 dark:ring-offset-slate-900' : ''} bg-slate-100 dark:bg-slate-800`}>
                    <div className="bg-rose-400" style={{ height: h(d.falta) }} title={`Faltas: ${d.falta}`} />
                    <div className="bg-sky-400" style={{ height: h(d.justificado) }} title={`Justificadas: ${d.justificado}`} />
                    <div className="bg-amber-400" style={{ height: h(d.tardanza) }} title={`Tardanzas: ${d.tardanza}`} />
                    <div className="bg-emerald-500" style={{ height: h(d.presente) }} title={`Puntuales: ${d.presente}`} />
                  </div>
                  <span className={`text-xs font-bold capitalize ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}>{isToday ? 'Hoy' : d.date.toLocaleDateString('es-PE', { weekday: 'short' }).replace('.', '')}</span>
                </div>
              );
            })}
          </div>

          {/* Hoy en detalle */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2">
            {[
              { label: 'Puntuales', value: today.presente, dot: 'bg-emerald-500' },
              { label: 'Tardanzas', value: today.tardanza, dot: 'bg-amber-400' },
              { label: 'Justificadas', value: today.justificado, dot: 'bg-sky-400' },
              { label: 'Faltas', value: today.falta, dot: 'bg-rose-400' },
              { label: 'Sin registro', value: withoutRecord, dot: 'bg-slate-300 dark:bg-slate-600' },
            ].map(x => (
              <div key={x.label} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-full ${x.dot}`} /> {x.label}</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">{x.value}</p>
              </div>
            ))}
          </div>

          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-sm">
            <span className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {lastRecord ? <>Último registro hoy: <strong className="text-slate-700 dark:text-slate-200">{lastRecord.hora_registro}</strong></> : 'Sin registros hoy todavía'}
            </span>
            <Link href="/asistencia" className="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Abrir kiosco QR <ArrowRight className="w-4 h-4" /></Link>
          </div>
        </section>


      {/* ══════════ 6. MAPA DE AULAS ══════════ */}
      <section className={`${card} p-4 sm:p-5 space-y-3`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2"><School className="w-5 h-5 text-indigo-600" /> Cómo están las aulas hoy</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Toca un aula para ver su detalle. El color indica la asistencia de hoy.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500">
            <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500" /> 90% o más</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-400" /> 80–89%</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-500" /> Menos de 80%</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-300 dark:bg-slate-600" /> Sin registro</span>
          </div>
        </div>
        {classroomCards.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No hay aulas creadas en este nivel.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
              {shownClassrooms.map(c => {
                const tone = c.registered === 0 ? 'slate' : c.rate >= 90 ? 'emerald' : c.rate >= 80 ? 'amber' : 'rose';
                const styles = {
                  emerald: 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/20',
                  amber: 'border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/20',
                  rose: 'border-rose-300 dark:border-rose-800 bg-rose-50/70 dark:bg-rose-950/20',
                  slate: 'border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40',
                }[tone];
                const bar = { emerald: 'bg-emerald-500', amber: 'bg-amber-400', rose: 'bg-rose-500', slate: 'bg-slate-300 dark:bg-slate-600' }[tone];
                return (
                  <Link key={c.s.id} href={`/admin/secciones/${c.s.id}`} className={`group p-3.5 rounded-2xl border-2 ${styles} hover:-translate-y-0.5 hover:shadow-md transition-all`}>
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">{c.s.grado?.nombre || 'Grado'} &quot;{c.s.letra}&quot;</p>
                      <span className="text-sm font-black text-slate-700 dark:text-slate-200">{c.registered > 0 ? `${c.rate}%` : '—'}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{c.students} de {c.capacity} alumnos</p>
                    <div className="mt-2 h-1.5 rounded-full bg-white/80 dark:bg-slate-800 overflow-hidden">
                      <div className={`h-full rounded-full ${bar}`} style={{ width: `${c.registered > 0 ? c.rate : pct(c.students, c.capacity)}%` }} />
                    </div>
                    {!c.hasSchedule && c.students > 0 && <p className="text-[11px] font-bold text-purple-600 dark:text-purple-400 mt-1.5">Sin horario</p>}
                  </Link>
                );
              })}
            </div>
            {classroomCards.length > shownClassrooms.length || showAllClassrooms ? (
              <button type="button" onClick={() => setShowAllClassrooms(v => !v)} className="w-full py-2.5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:border-indigo-400 cursor-pointer">
                {showAllClassrooms ? 'Ver menos aulas' : `Ver todas las aulas (${classroomCards.length})`}
              </button>
            ) : null}
          </>
        )}
      </section>

      {/* ══════════ Requiere tu atención: botón flotante (encima del de WhatsApp) ══════════ */}
      {attentionOpen && <div className="fixed inset-0 z-[9988]" onClick={() => setAttentionOpen(false)} aria-hidden="true" />}
      <div className="fixed bottom-36 md:bottom-24 right-4 md:right-6 z-[9989] flex flex-col items-end">
        {attentionOpen && (
          <section role="dialog" aria-label="Requiere tu atención" className="mb-3 w-[23rem] max-w-[calc(100vw-2rem)] max-h-[70vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 fade-in duration-200 origin-bottom-right">
            <div className="flex items-start justify-between gap-2 p-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-rose-500" /> Requiere tu atención</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Lo más urgente primero{pendingAlerts.length > 3 && <> · <Link href="/admin/alertas" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Ver todo ({pendingAlerts.length})</Link></>}</p>
              </div>
              <button type="button" onClick={() => setAttentionOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" aria-label="Cerrar">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 overflow-y-auto">
              {attention.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <p className="text-4xl">✅</p>
                  <p className="text-base font-black text-slate-900 dark:text-white">Todo en orden</p>
                  <p className="text-sm text-slate-500">No hay alertas ni pendientes urgentes.</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {attention.map(it => {
                    const t = TONE[it.tone];
                    return (
                      <li key={it.key} className="relative flex items-start gap-3 p-3.5 pl-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 overflow-hidden">
                        <span className={`absolute left-0 top-0 bottom-0 w-1.5 ${t.bar}`} />
                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${t.box}`}><it.icon className="w-5 h-5" /></span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-slate-900 dark:text-white leading-snug">{it.title}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{it.detail}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Link href={it.href} className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-xs font-black ${t.btn}`}>{it.action} <ArrowRight className="w-3.5 h-3.5" /></Link>
                            {it.onResolve && (
                              <button type="button" onClick={it.onResolve} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-emerald-400 hover:text-emerald-600 cursor-pointer">
                                <Check className="w-3.5 h-3.5" /> Resuelto
                              </button>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        )}
        <button
          type="button"
          onClick={() => setAttentionOpen(v => !v)}
          aria-expanded={attentionOpen}
          aria-label={attention.length > 0 ? `Requiere tu atención: ${attention.length} pendientes` : 'Requiere tu atención: todo en orden'}
          title="Requiere tu atención"
          className={`relative w-14 h-14 rounded-full text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer ${attention.length > 0 ? 'bg-gradient-to-tr from-rose-600 to-orange-500 shadow-rose-500/40' : 'bg-gradient-to-tr from-slate-700 to-slate-500 shadow-slate-500/30'}`}
        >
          {attentionOpen ? <X className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
          {attention.length > 0 && !attentionOpen && (
            <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1 rounded-full bg-white text-rose-600 text-xs font-black flex items-center justify-center ring-2 ring-rose-500">{attention.length}</span>
          )}
        </button>
      </div>

      {/* Nota de datos */}
      <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5" /> Datos actualizados en tiempo real{level !== 'todos' ? ` · mostrando solo ${levelTabs.find(t => t.id === level)?.label}` : ''}
      </p>
    </div>
  );
}
