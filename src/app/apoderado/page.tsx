'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useParentChildren } from '@/hooks/useParentChildren';
import { useApp } from '@/context/AppContext';
import { GradeBadge } from '@/components/notas/GradeBadge';
import { AnnualReportCardView } from '@/components/notas/AnnualReportCardView';
import { QrCard } from '@/components/qr/QrCard';
import { calculateAverage, calculateCoursePeriodAverage, calculateStudentAnnualReportCard } from '@/lib/grades/calculations';
import { DayOfWeek, GradeLetter } from '@/types';
import { TIME_BLOCKS, DAYS } from '@/lib/constants/schedule';
import {
  Award,
  CalendarCheck,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Mail,
  MapPin,
  Megaphone,
  Phone,
  Printer,
  QrCode,
  Send,
  X,
  AlertTriangle,
  BookOpen,
  Heart,
  Star,
  UserCheck,
  UserX,
  School,
  Sparkles,
} from 'lucide-react';

// Los generadores de PDF se cargan solo al descargar (no pesan en la carga de la página)
const generateReportCardPdf = async (...args: Parameters<typeof import('@/lib/pdf/reportCardPdfGenerator').generateReportCardPdf>) =>
  (await import('@/lib/pdf/reportCardPdfGenerator')).generateReportCardPdf(...args);
const downloadEnrollmentFichaPdf = async (...args: Parameters<typeof import('@/lib/pdf/generateEnrollmentFichaPdf').downloadEnrollmentFichaPdf>) =>
  (await import('@/lib/pdf/generateEnrollmentFichaPdf')).downloadEnrollmentFichaPdf(...args);
const downloadEnrollmentCertificatePdf = async (...args: Parameters<typeof import('@/lib/pdf/certificatePdfGenerator').downloadEnrollmentCertificatePdf>) =>
  (await import('@/lib/pdf/certificatePdfGenerator')).downloadEnrollmentCertificatePdf(...args);

type Tab = 'notas' | 'asistencia' | 'tareas' | 'avisos' | 'tutor';

// Fecha local "YYYY-MM-DD" (no toISOString: en Perú daría el día siguiente desde las 7 p. m.)
const localIso = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parseIso = (iso: string) => { const [y, m, d] = iso.slice(0, 10).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
const niceDate = (iso?: string, withWeekday = false) => {
  if (!iso) return '—';
  const d = parseIso(iso);
  return d.toLocaleDateString('es-PE', withWeekday ? { weekday: 'short', day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short' }).replace('.', '');
};
const WEEKDAY_KEYS: (DayOfWeek | null)[] = [null, 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', null];

// Qué significa cada letra, en palabras de papá y mamá
const GRADE_MEANING: Record<GradeLetter, { label: string; tone: string }> = {
  AD: { label: 'Excelente', tone: 'text-emerald-700 dark:text-emerald-300' },
  A: { label: 'Va bien', tone: 'text-blue-700 dark:text-blue-300' },
  B: { label: 'Está en proceso', tone: 'text-amber-700 dark:text-amber-300' },
  C: { label: 'Necesita apoyo', tone: 'text-rose-700 dark:text-rose-300' },
};
const dueInWords = (iso: string) => {
  const due = new Date(iso);
  const days = Math.round((parseIso(localIso(due)).getTime() - parseIso(localIso()).getTime()) / 86400000);
  if (due.getTime() < Date.now()) return days === 0 ? 'Venció hoy' : `Venció hace ${Math.abs(days)} ${Math.abs(days) === 1 ? 'día' : 'días'}`;
  if (days === 0) return 'Vence hoy';
  if (days === 1) return 'Vence mañana';
  return `Vence en ${days} días`;
};

export default function ApoderadoDashboardPage() {
  const {
    currentUser,
    setSelectedChildId,
    students,
    enrollments,
    courses,
    grades,
    attendances,
    tasks,
    submissions,
    exams,
    evaluationPeriods,
    scheduleSlots,
    teachers,
    brandingConfig,
    behaviorLogs,
    justificationRequests,
    showToast,
    announcements,
    confirmAnnouncement,
    calendarEvents,
    sections,
    academicContext,
  } = useApp();

  const [tab, setTab] = useState<Tab>('notas');
  const [isReportCardModalOpen, setIsReportCardModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [periodId, setPeriodId] = useState('');

  const todayIso = localIso();
  const year = academicContext?.anio || new Date().getFullYear();

  // ── Hijos del apoderado (hook compartido con Justificar falta) ──
  const router = useRouter();
  const { children, child } = useParentChildren();
  const enrollment = child?.enrollment || null;
  const section = child?.section || null;
  const student = child?.student || null;
  const firstName = child?.nombre.split(' ')[0] || 'tu hijo';

  const tutor = teachers.find(t => t.id === section?.tutor_id) || null;
  const tutorName = tutor ? `${tutor.nombres} ${tutor.apellidos}` : 'Por asignar';

  // ── Bimestre actual ──
  const currentPeriod = evaluationPeriods.find(p => p.fecha_inicio <= todayIso && todayIso <= p.fecha_fin) || evaluationPeriods.find(p => p.activo && !p.cerrado) || evaluationPeriods[evaluationPeriods.length - 1];
  const selectedPeriod = evaluationPeriods.find(p => p.id === periodId) || currentPeriod;

  // ── Notas ──
  const childGrades = useMemo(() => grades.filter(g => g.matricula_id === enrollment?.id && g.nota_letra), [grades, enrollment]);
  const periodGrades = childGrades.filter(g => !selectedPeriod || g.periodo_evaluacion_id === selectedPeriod.id);
  const courseRows = useMemo(() => {
    const nivel = section?.grado?.nivel;
    return courses
      .filter(c => !nivel || !c.nivel || c.nivel === nivel)
      .map(c => {
        const compIds = new Set((c.competencias || []).map(k => k.id));
        const recs = periodGrades.filter(g => compIds.has(g.competencia_id));
        const avg = calculateCoursePeriodAverage(recs);
        return { course: c, letter: avg.letra, evaluated: recs.length, total: compIds.size };
      })
      .sort((a, b) => (a.letter ? 0 : 1) - (b.letter ? 0 : 1) || a.course.nombre.localeCompare(b.course.nombre));
  }, [courses, periodGrades, section]);
  const periodAverage = calculateAverage(periodGrades.map(g => g.nota_letra as GradeLetter)).averageLetter;
  const coursesInC = courseRows.filter(r => r.letter === 'C');

  // ── Asistencia (un registro por día; tardanza cuenta como asistió) ──
  const attendanceDays = useMemo(() => {
    const byDay = new Map<string, string>();
    attendances
      .filter(a => a.matricula_id === enrollment?.id && a.tipo_registro !== 'salida')
      .sort((a, b) => (a.tipo_registro === 'ingreso' ? -1 : 1) - (b.tipo_registro === 'ingreso' ? -1 : 1))
      .forEach(a => { if (!byDay.has(a.fecha)) byDay.set(a.fecha, a.estado); });
    return Array.from(byDay.entries()).map(([fecha, estado]) => ({ fecha, estado })).sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [attendances, enrollment]);
  const attCount = (st: string) => attendanceDays.filter(d => d.estado === st).length;
  const present = attCount('presente'), late = attCount('tardanza'), absent = attCount('falta'), excused = attCount('justificado');
  const attendedPct = attendanceDays.length > 0 ? Math.round(((present + late + excused) / attendanceDays.length) * 100) : null;
  const myJustifications = justificationRequests.filter(j => j.matricula_id === enrollment?.id).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const unexcused = attendanceDays.filter(d => d.estado === 'falta' && !myJustifications.some(j => j.fecha === d.fecha));

  // ── Hoy ──
  const todayKey = WEEKDAY_KEYS[new Date().getDay()];
  const holidayToday = calendarEvents.find(e => !e.es_laborable && e.fecha_inicio <= todayIso && todayIso <= e.fecha_fin && (e.nivel === 'todos' || e.nivel === section?.grado?.nivel));
  const todayRecord = attendanceDays.find(d => d.fecha === todayIso);
  const todayEntryTime = attendances.find(a => a.matricula_id === enrollment?.id && a.fecha === todayIso && a.tipo_registro !== 'salida')?.hora_registro?.slice(0, 5);
  const schedule = useMemo(() => scheduleSlots.filter(s => s.seccion_id === section?.id), [scheduleSlots, section]);
  const todayClasses = todayKey ? schedule.filter(s => s.dia === todayKey).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)) : [];

  // ── Tareas y evaluaciones ──
  const childTasks = useMemo(() => {
    return tasks
      .filter(t => t.seccion_id === section?.id)
      .map(t => {
        const sub = submissions.find(s => s.tarea_id === t.id && s.matricula_id === enrollment?.id);
        const overdue = !sub && new Date(t.fecha_limite).getTime() < Date.now();
        return { task: t, sub, overdue, courseName: t.curso?.nombre || courses.find(c => c.id === t.curso_id)?.nombre || 'Curso' };
      })
      .sort((a, b) => (a.sub ? 1 : 0) - (b.sub ? 1 : 0) || new Date(a.task.fecha_limite).getTime() - new Date(b.task.fecha_limite).getTime());
  }, [tasks, submissions, section, enrollment, courses]);
  const pendingTasks = childTasks.filter(t => !t.sub && !t.overdue);
  const overdueTasks = childTasks.filter(t => t.overdue);
  const upcomingExams = exams
    .filter(e => e.seccion_id === section?.id && e.fecha_programada >= todayIso && e.estado !== 'borrador')
    .sort((a, b) => a.fecha_programada.localeCompare(b.fecha_programada));

  // ── Avisos del colegio para esta familia ──
  const notices = useMemo(() => {
    const nivel = section?.grado?.nivel;
    return announcements
      .filter(a => {
        if (a.destinatarios_rol && a.destinatarios_rol !== 'todos' && a.destinatarios_rol !== 'apoderado') return false;
        const targetNivel = a.nivel_destinatario;
        if (targetNivel && targetNivel !== 'todos' && targetNivel !== nivel) return false;
        if (a.grado_id && a.grado_id !== section?.grado_id) return false;
        if (a.seccion_id && a.seccion_id !== section?.id) return false;
        return true;
      })
      .sort((a, b) => (b.fecha_publicacion || '').localeCompare(a.fecha_publicacion || ''));
  }, [announcements, section]);
  const toConfirm = notices.filter(a => a.requiere_confirmacion && !(currentUser?.id && a.confirmado_por?.includes(currentUser.id)));
  const conduct = behaviorLogs.filter(b => b.matricula_id === enrollment?.id && b.visible_apoderado).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const upcomingEvents = calendarEvents
    .filter(e => e.fecha_fin >= todayIso && (e.nivel === 'todos' || e.nivel === section?.grado?.nivel))
    .sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio))
    .slice(0, 4);

  // ── Lo que el apoderado debe atender ──
  const attention: { key: string; icon: React.ElementType; tone: string; text: string; action: string; onClick: () => void }[] = [
    ...toConfirm.map(a => ({
      key: `conf-${a.id}`, icon: Megaphone, tone: 'bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300',
      text: a.categoria === 'citacion' ? `Te citan: ${a.titulo}${a.fecha_citacion ? ` · ${niceDate(a.fecha_citacion, true)}${a.hora_citacion ? `, ${a.hora_citacion}` : ''}` : ''}` : `Confirma que leíste: ${a.titulo}`,
      action: 'Confirmar', onClick: () => confirmAnnouncement(a.id, currentUser?.id || 'apoderado'),
    })),
    ...(unexcused.length > 0 ? [{
      key: 'faltas', icon: UserX, tone: 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300',
      text: `${firstName} tiene ${unexcused.length} ${unexcused.length === 1 ? 'falta sin justificar' : 'faltas sin justificar'} (${unexcused.slice(0, 3).map(d => niceDate(d.fecha)).join(', ')})`,
      action: 'Justificar', onClick: () => openJustify(unexcused[0].fecha),
    }] : []),
    ...(overdueTasks.length > 0 ? [{
      key: 'vencidas', icon: FileText, tone: 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300',
      text: `${overdueTasks.length} ${overdueTasks.length === 1 ? 'tarea venció' : 'tareas vencieron'} sin entregar`,
      action: 'Ver tareas', onClick: () => setTab('tareas'),
    }] : []),
    ...(coursesInC.length > 0 ? [{
      key: 'notas-c', icon: Award, tone: 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300',
      text: `Necesita apoyo en ${coursesInC.map(c => c.course.nombre).join(', ')}`,
      action: 'Ver notas', onClick: () => setTab('notas'),
    }] : []),
  ];

  // ── Libreta anual ──
  const annualReportCard = useMemo(() => calculateStudentAnnualReportCard({
    enrollmentId: enrollment?.id || '',
    studentId: student?.id || '',
    studentName: `${child?.apellidos || ''}, ${child?.nombre || ''}`,
    studentDni: student?.profile?.dni || student?.dni || '—',
    studentCode: student?.codigo_estudiante || '—',
    gradeLevelName: section?.grado?.nombre || 'Sin aula asignada',
    sectionLetter: section?.letra || '-',
    academicYear: year,
    tutorName,
    courses,
    grades: childGrades,
    evaluationPeriodIds: evaluationPeriods.map(p => ({ id: p.id, numero_periodo: p.numero_periodo })),
    attendancePercentage: attendedPct ?? 0,
    conductGrade: undefined,
  }), [enrollment, student, child, section, year, tutorName, courses, childGrades, evaluationPeriods, attendedPct]);

  // ── Acciones ──
  function openJustify(date?: string) {
    router.push(date ? `/apoderado/justificar?fecha=${date}` : '/apoderado/justificar');
  }

  const handleDownloadReportCardPdf = async () => {
    if (!enrollment || !student) return;
    try {
      showToast('Preparando la libreta...', 'info');
      const doc = await generateReportCardPdf({ student, enrollment, courses, grades: childGrades, periods: evaluationPeriods, attendances, brandingConfig });
      doc.save(`Libreta_${year}_${child?.apellidos}_${child?.nombre}.pdf`.replace(/\s+/g, '_'));
      showToast('Libreta descargada', 'success');
    } catch (err) {
      console.error(err);
      showToast('No se pudo generar la libreta', 'error');
    }
  };
  const handleDownloadFicha = async () => {
    if (!enrollment || !student) return;
    try {
      await downloadEnrollmentFichaPdf({
        student, enrollment, section: section || undefined,
        parentName: currentUser ? `${currentUser.nombres} ${currentUser.apellidos}` : student.nombre_apoderado,
        parentPhone: student.telefono_apoderado, parentEmail: student.email_apoderado, brandingConfig,
      });
      showToast('Ficha de matrícula descargada', 'success');
    } catch (err) {
      console.error(err);
      showToast('No se pudo generar la ficha', 'error');
    }
  };
  const handleDownloadConstancia = async () => {
    if (!student) return;
    try {
      await downloadEnrollmentCertificatePdf({ student, enrollment: enrollment || undefined, section: section || undefined, gradeLevel: section?.grado, brandingConfig });
      showToast('Constancia de matrícula descargada', 'success');
    } catch (err) {
      console.error(err);
      showToast('No se pudo generar la constancia', 'error');
    }
  };
  // ── Tarjeta "Hoy" ──
  const today = (() => {
    if (!todayKey) return { title: 'Hoy no hay clases', detail: 'Es fin de semana', tone: 'slate', icon: Calendar };
    if (holidayToday) return { title: 'Hoy no hay clases', detail: holidayToday.titulo, tone: 'slate', icon: Calendar };
    if (todayRecord?.estado === 'presente') return { title: 'Llegó al colegio', detail: todayEntryTime ? `Entró a las ${todayEntryTime}` : 'Ingreso registrado', tone: 'emerald', icon: UserCheck };
    if (todayRecord?.estado === 'tardanza') return { title: 'Llegó tarde', detail: todayEntryTime ? `Entró a las ${todayEntryTime}` : 'Tardanza registrada', tone: 'amber', icon: Clock };
    if (todayRecord?.estado === 'justificado') return { title: 'Falta justificada', detail: 'El colegio ya lo sabe', tone: 'sky', icon: CheckCircle2 };
    if (todayRecord?.estado === 'falta') return { title: 'No asistió hoy', detail: 'Puedes justificar la falta', tone: 'rose', icon: UserX };
    return { title: 'Aún no registra ingreso', detail: 'Se actualiza al pasar su carnet', tone: 'slate', icon: Clock };
  })();
  const TONE: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
    sky: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  };
  const gradeTone = !periodAverage ? 'slate' : periodAverage === 'C' ? 'rose' : periodAverage === 'B' ? 'amber' : periodAverage === 'A' ? 'blue' : 'emerald';
  const attTone = attendedPct === null ? 'slate' : attendedPct >= 90 ? 'emerald' : attendedPct >= 80 ? 'amber' : 'rose';
  const taskTone = overdueTasks.length > 0 ? 'rose' : pendingTasks.length > 0 ? 'amber' : 'emerald';

  const greeting = new Date().getHours() < 12 ? 'Buenos días' : new Date().getHours() < 18 ? 'Buenas tardes' : 'Buenas noches';
  const parentName = currentUser?.nombres?.split(' ')[0] || '';
  const card = 'bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm';

  if (!child) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-3">
        <Heart className="w-12 h-12 text-rose-400 mx-auto" />
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Aún no hay alumnos vinculados a tu cuenta</h1>
        <p className="text-sm text-slate-500">Pide al colegio que registre tu DNI, correo o teléfono como apoderado de tu hijo.</p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'notas', label: 'Notas', icon: Award },
    { id: 'asistencia', label: 'Asistencia', icon: CalendarCheck, badge: unexcused.length || undefined },
    { id: 'tareas', label: 'Tareas', icon: FileText, badge: pendingTasks.length + overdueTasks.length || undefined },
    { id: 'avisos', label: 'Avisos', icon: Megaphone, badge: toConfirm.length || undefined },
    { id: 'tutor', label: 'Tutor y documentos', icon: School },
  ];

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-24 animate-fade-in">

      {/* ── 1. ENCABEZADO + HIJO SELECCIONADO ── */}
      <section className={`${card} overflow-hidden`}>
        <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-pink-400" />
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400" suppressHydrationWarning>
                {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^\w/, c => c.toUpperCase())}
              </p>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white" suppressHydrationWarning>
                {greeting}{parentName ? `, ${parentName}` : ''}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">Así va {firstName} en el colegio.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => openJustify()} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-sm font-bold cursor-pointer"><Send className="w-4 h-4" /> Justificar falta</button>
              <button type="button" onClick={() => setIsQrModalOpen(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:border-slate-400 cursor-pointer"><QrCode className="w-4 h-4 text-emerald-600" /> Carnet</button>
            </div>
          </div>

          {/* Selector de hijo */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {children.map(c => {
              const active = c.id === child.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedChildId(c.id)}
                  aria-pressed={active}
                  className={`flex items-center gap-3 pl-2 pr-4 py-2 rounded-2xl border text-left shrink-0 transition-all cursor-pointer ${active ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 ring-2 ring-blue-500/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-blue-300'}`}
                >
                  {c.avatar
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={c.avatar} alt="" className="w-11 h-11 rounded-xl object-cover" />
                    : <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black">{c.nombre[0]}{c.apellidos[0] || ''}</span>}
                  <span>
                    <span className="block text-sm font-black text-slate-900 dark:text-white">{c.nombre} {c.apellidos.split(' ')[0]}</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">{c.aula} · Tutor(a): {c.id === child.id ? tutorName : (teachers.find(t => t.id === c.section?.tutor_id)?.nombres || 'por asignar')}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 2. ¿CÓMO VA? (4 tarjetas) ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3" aria-label="Resumen">
        {[
          { key: 'hoy', label: 'Hoy', value: today.title, sub: today.detail, icon: today.icon, tone: today.tone, onClick: () => setTab('asistencia') },
          { key: 'notas', label: `Notas · ${selectedPeriod?.nombre || 'bimestre'}`, value: periodAverage ? GRADE_MEANING[periodAverage].label : 'Aún sin notas', sub: periodAverage ? `Promedio ${periodAverage}` : 'Los docentes aún no califican', icon: Award, tone: gradeTone, onClick: () => setTab('notas') },
          { key: 'asist', label: 'Asistencia', value: attendedPct === null ? 'Sin registros' : `${attendedPct}% asistió`, sub: attendanceDays.length > 0 ? `${absent} ${absent === 1 ? 'falta' : 'faltas'} · ${late} ${late === 1 ? 'tardanza' : 'tardanzas'}` : 'Aún no hay días registrados', icon: CalendarCheck, tone: attTone, onClick: () => setTab('asistencia') },
          { key: 'tareas', label: 'Tareas', value: overdueTasks.length > 0 ? `${overdueTasks.length} ${overdueTasks.length === 1 ? 'vencida' : 'vencidas'}` : pendingTasks.length > 0 ? `${pendingTasks.length} por entregar` : 'Al día', sub: pendingTasks[0] ? `${pendingTasks[0].courseName}: ${dueInWords(pendingTasks[0].task.fecha_limite).toLowerCase()}` : `${childTasks.filter(t => t.sub).length} entregadas`, icon: FileText, tone: taskTone, onClick: () => setTab('tareas') },
        ].map(k => (
          <button key={k.key} type="button" onClick={k.onClick} className={`${card} p-3.5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer`}>
            <div className="flex items-center gap-2">
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${TONE[k.tone]}`}><k.icon className="w-4 h-4" /></span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">{k.label}</span>
            </div>
            <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-2 leading-tight">{k.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{k.sub}</p>
          </button>
        ))}
      </section>

      {/* ── 3. NECESITA TU ATENCIÓN ── */}
      {attention.length > 0 ? (
        <section className={`${card} p-4 border-amber-200 dark:border-amber-900/60`}>
          <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 mb-2.5"><AlertTriangle className="w-4 h-4 text-amber-500" /> Necesita tu atención</h2>
          <ul className="space-y-2">
            {attention.map(a => (
              <li key={a.key} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${a.tone}`}><a.icon className="w-4 h-4" /></span>
                <p className="flex-1 text-sm text-slate-800 dark:text-slate-100">{a.text}</p>
                <button type="button" onClick={a.onClick} className="shrink-0 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold cursor-pointer">{a.action}</button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm text-emerald-800 dark:text-emerald-200"><strong>Todo en orden.</strong> No tienes nada pendiente por ahora.</p>
        </section>
      )}

      {/* ── 4. PESTAÑAS ── */}
      <div className="flex gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold whitespace-nowrap cursor-pointer transition-all ${tab === t.id ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
            {t.badge ? <span className="px-1.5 rounded-full text-[11px] font-black bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300">{t.badge}</span> : null}
          </button>
        ))}
      </div>

      {/* ── NOTAS ── */}
      {tab === 'notas' && (
        <section className={`${card} p-4 sm:p-5 space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">Notas por curso</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">AD = excelente · A = va bien · B = en proceso · C = necesita apoyo</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setIsReportCardModalOpen(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold cursor-pointer"><BookOpen className="w-4 h-4" /> Ver libreta</button>
              <button type="button" onClick={handleDownloadReportCardPdf} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:border-slate-400 cursor-pointer"><Download className="w-4 h-4" /> PDF</button>
            </div>
          </div>

          {evaluationPeriods.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {evaluationPeriods.map(p => (
                <button key={p.id} type="button" onClick={() => setPeriodId(p.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${selectedPeriod?.id === p.id ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}>
                  {p.nombre}{p.id === currentPeriod?.id ? ' (actual)' : ''}
                </button>
              ))}
            </div>
          )}

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {courseRows.map(r => (
              <li key={r.course.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="w-2.5 h-9 rounded-full shrink-0" style={{ backgroundColor: r.course.color_hex || '#94a3b8' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{r.course.nombre}</p>
                  <p className={`text-xs font-semibold ${r.letter ? GRADE_MEANING[r.letter].tone : 'text-slate-400'}`}>
                    {r.letter ? GRADE_MEANING[r.letter].label : 'Aún sin nota'}
                    {r.evaluated > 0 && r.total > 0 && <span className="text-slate-400 font-normal"> · {Math.min(r.evaluated, r.total)} de {r.total} competencias</span>}
                  </p>
                </div>
                {r.letter ? <GradeBadge grade={r.letter} size="md" /> : <span className="text-sm text-slate-300">—</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── ASISTENCIA ── */}
      {tab === 'asistencia' && (
        <section className={`${card} p-4 sm:p-5 space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">Asistencia</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Se registra cuando {firstName} pasa su carnet en la entrada.</p>
            </div>
            <button type="button" onClick={() => openJustify()} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-sm font-bold cursor-pointer self-start"><Send className="w-4 h-4" /> Justificar una falta</button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Puntual', value: present, cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
              { label: 'Tardanzas', value: late, cls: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
              { label: 'Faltas', value: absent, cls: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' },
              { label: 'Justificadas', value: excused, cls: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300' },
            ].map(x => (
              <div key={x.label} className={`p-3 rounded-xl ${x.cls}`}>
                <p className="text-2xl font-black">{x.value}</p>
                <p className="text-xs font-bold">{x.label}</p>
              </div>
            ))}
          </div>

          {attendanceDays.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">Aún no hay días registrados.</p>
          ) : (
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2">Últimos días</p>
              <div className="flex flex-wrap gap-1.5">
                {attendanceDays.slice(0, 20).map(d => {
                  const cls = d.estado === 'presente' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-300'
                    : d.estado === 'tardanza' ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-300'
                    : d.estado === 'justificado' ? 'bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-950/30 dark:border-sky-900 dark:text-sky-300'
                    : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-300';
                  const label = d.estado === 'presente' ? 'Asistió' : d.estado === 'tardanza' ? 'Tarde' : d.estado === 'justificado' ? 'Justificada' : 'Faltó';
                  const canJustify = d.estado === 'falta' && !myJustifications.some(j => j.fecha === d.fecha);
                  return (
                    <button
                      key={d.fecha}
                      type="button"
                      disabled={!canJustify}
                      onClick={() => openJustify(d.fecha)}
                      title={canJustify ? 'Justificar esta falta' : undefined}
                      className={`px-2.5 py-1.5 rounded-lg border text-left ${cls} ${canJustify ? 'cursor-pointer hover:shadow' : 'cursor-default'}`}
                    >
                      <span className="block text-[11px] font-bold capitalize">{niceDate(d.fecha, true)}</span>
                      <span className="block text-xs font-black">{label}{canJustify ? ' · justificar' : ''}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {myJustifications.length > 0 && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-500 mb-2">Tus justificaciones</p>
              <ul className="space-y-1.5">
                {myJustifications.slice(0, 5).map(j => (
                  <li key={j.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-sm">
                    <span className="min-w-0"><strong className="capitalize">{niceDate(j.fecha, true)}</strong> <span className="text-slate-500 truncate">· {j.motivo.split(' — ')[0]}</span></span>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-bold ${j.estado === 'aprobada' ? 'bg-emerald-100 text-emerald-700' : j.estado === 'rechazada' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                      {j.estado === 'aprobada' ? 'Aceptada' : j.estado === 'rechazada' ? 'No aceptada' : 'En revisión'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* ── TAREAS Y EXÁMENES ── */}
      {tab === 'tareas' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <section className={`${card} p-4 sm:p-5 space-y-3 lg:col-span-3`}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-black text-slate-900 dark:text-white">Tareas</h2>
              <Link href="/apoderado/tareas" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5">Ver detalle <ChevronRight className="w-4 h-4" /></Link>
            </div>
            {childTasks.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">No hay tareas asignadas.</p>
            ) : (
              <ul className="space-y-2">
                {childTasks.slice(0, 8).map(t => (
                  <li key={t.task.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${t.sub ? TONE.emerald : t.overdue ? TONE.rose : TONE.amber}`}>
                      {t.sub ? <CheckCircle2 className="w-4 h-4" /> : t.overdue ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{t.task.titulo}</p>
                      <p className="text-xs text-slate-500">{t.courseName} · {t.sub ? 'Entregada' : dueInWords(t.task.fecha_limite)}</p>
                    </div>
                    {t.sub?.calificacion_letra ? <GradeBadge grade={t.sub.calificacion_letra} size="sm" /> : t.sub ? <span className="text-[11px] font-bold text-slate-400">Sin nota aún</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={`${card} p-4 sm:p-5 space-y-3 lg:col-span-2`}>
            <h2 className="text-base font-black text-slate-900 dark:text-white">Próximas evaluaciones</h2>
            {upcomingExams.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">No hay evaluaciones programadas.</p>
            ) : (
              <ul className="space-y-2">
                {upcomingExams.slice(0, 6).map(ex => {
                  const d = parseIso(ex.fecha_programada);
                  return (
                    <li key={ex.id} className="flex items-center gap-3">
                      <span className="w-11 shrink-0 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 text-center">
                        <span className="block text-[10px] font-black bg-amber-500 text-white uppercase">{d.toLocaleDateString('es-PE', { month: 'short' }).replace('.', '')}</span>
                        <span className="block text-base font-black text-slate-900 dark:text-white">{d.getDate()}</span>
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-slate-900 dark:text-white truncate">{ex.titulo}</span>
                        <span className="block text-xs text-slate-500">{courses.find(c => c.id === ex.curso_id)?.nombre || ex.curso?.nombre || 'Curso'}{ex.hora_inicio ? ` · ${ex.hora_inicio}` : ''}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}

      {/* ── AVISOS ── */}
      {tab === 'avisos' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <section className={`${card} p-4 sm:p-5 space-y-3 lg:col-span-3`}>
            <h2 className="text-base font-black text-slate-900 dark:text-white">Comunicados del colegio</h2>
            {notices.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">No hay comunicados por ahora.</p>
            ) : (
              <ul className="space-y-2.5">
                {notices.slice(0, 10).map(a => {
                  const confirmed = !!(currentUser?.id && a.confirmado_por?.includes(currentUser.id));
                  const isCitacion = a.categoria === 'citacion';
                  const urgent = a.es_urgente || a.categoria === 'urgente';
                  return (
                    <li key={a.id} className={`p-3.5 rounded-xl border ${urgent ? 'border-rose-200 bg-rose-50/50 dark:border-rose-900 dark:bg-rose-950/20' : isCitacion ? 'border-violet-200 bg-violet-50/50 dark:border-violet-900 dark:bg-violet-950/20' : 'border-slate-200 dark:border-slate-700'}`}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[11px] font-bold text-slate-500">{isCitacion ? 'Citación' : urgent ? 'Urgente' : 'Comunicado'} · {niceDate(a.fecha_publicacion)}</span>
                        {a.requiere_confirmacion && (confirmed
                          ? <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /> Confirmado</span>
                          : <button type="button" onClick={() => confirmAnnouncement(a.id, currentUser?.id || 'apoderado')} className="px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold cursor-pointer">Confirmar</button>)}
                      </div>
                      <p className="text-sm font-black text-slate-900 dark:text-white">{a.titulo}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-3 whitespace-pre-line">{a.contenido}</p>
                      {isCitacion && (a.fecha_citacion || a.lugar_citacion) && (
                        <p className="mt-1.5 text-xs font-semibold text-violet-700 dark:text-violet-300 flex flex-wrap gap-x-3">
                          {a.fecha_citacion && <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {niceDate(a.fecha_citacion, true)}{a.hora_citacion ? `, ${a.hora_citacion}` : ''}</span>}
                          {a.lugar_citacion && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {a.lugar_citacion}</span>}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <div className="lg:col-span-2 space-y-4">
            <section className={`${card} p-4 sm:p-5 space-y-3`}>
              <h2 className="text-base font-black text-slate-900 dark:text-white">Conducta</h2>
              {conduct.length === 0 ? (
                <p className="text-sm text-slate-500">Sin observaciones. ¡Buen comportamiento!</p>
              ) : (
                <ul className="space-y-2">
                  {conduct.slice(0, 5).map(b => {
                    const good = b.tipo === 'merito' || b.tipo === 'felicitacion';
                    return (
                      <li key={b.id} className="flex items-start gap-2.5">
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${good ? TONE.emerald : TONE.amber}`}>{good ? <Star className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}</span>
                        <span className="min-w-0">
                          <span className="block text-sm font-bold text-slate-900 dark:text-white">{b.titulo}</span>
                          <span className="block text-xs text-slate-500">{niceDate(b.fecha)}{b.docente_nombre || b.autor_nombre ? ` · ${b.docente_nombre || b.autor_nombre}` : ''}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
            <section className={`${card} p-4 sm:p-5 space-y-3`}>
              <h2 className="text-base font-black text-slate-900 dark:text-white">Próximas fechas</h2>
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-slate-500">Sin eventos próximos.</p>
              ) : (
                <ul className="space-y-2">
                  {upcomingEvents.map(e => (
                    <li key={e.id} className="flex items-center gap-2.5 text-sm">
                      <Sparkles className={`w-4 h-4 shrink-0 ${e.es_laborable ? 'text-indigo-500' : 'text-amber-500'}`} />
                      <span className="flex-1 min-w-0 truncate text-slate-800 dark:text-slate-100">{e.titulo}{!e.es_laborable && <span className="text-amber-600 font-semibold"> · sin clases</span>}</span>
                      <span className="text-xs font-bold text-slate-500 shrink-0">{niceDate(e.fecha_inicio)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}

      {/* ── TUTOR Y DOCUMENTOS ── */}
      {tab === 'tutor' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <section className={`${card} p-4 sm:p-5 space-y-4`}>
            <div className="flex items-center gap-3">
              <span className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">{tutor ? `${tutor.nombres[0]}${tutor.apellidos[0] || ''}` : '?'}</span>
              <div>
                <p className="text-xs font-bold text-slate-500">Tutor(a) de {section ? `${section.grado?.nombre} "${section.letra}"` : 'su aula'}</p>
                <p className="text-base font-black text-slate-900 dark:text-white">{tutor ? `${tutor.nombres} ${tutor.apellidos}` : 'Aún no asignado'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {tutor?.telefono
                ? <a href={`tel:${tutor.telefono}`} className="inline-flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:border-slate-400"><Phone className="w-4 h-4 text-blue-600" /> Llamar</a>
                : <span className="inline-flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm text-slate-400"><Phone className="w-4 h-4" /> Sin teléfono</span>}
              {tutor?.email
                ? <a href={`mailto:${tutor.email}`} className="inline-flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold"><Mail className="w-4 h-4" /> Escribir</a>
                : <span className="inline-flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm text-slate-400"><Mail className="w-4 h-4" /> Sin correo</span>}
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-500">Clases de hoy</p>
                <button type="button" onClick={() => setIsScheduleModalOpen(true)} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">Horario completo</button>
              </div>
              {todayClasses.length === 0 ? (
                <p className="text-sm text-slate-500">{todayKey ? 'No hay clases registradas hoy.' : 'Hoy no hay clases.'}</p>
              ) : (
                <ul className="space-y-1">
                  {todayClasses.map(s => (
                    <li key={s.id} className="flex items-center gap-2 text-sm">
                      <span className="font-mono text-xs font-bold text-slate-500 w-12">{s.hora_inicio}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{courses.find(c => c.id === s.curso_id)?.nombre || 'Clase'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className={`${card} p-4 sm:p-5 space-y-3`}>
            <h2 className="text-base font-black text-slate-900 dark:text-white">Documentos</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Descárgalos en PDF cuando los necesites.</p>
            {[
              { label: 'Libreta de notas', hint: `Notas del año ${year}`, icon: Award, onClick: handleDownloadReportCardPdf },
              { label: 'Constancia de matrícula', hint: 'Para trámites externos', icon: FileText, onClick: handleDownloadConstancia },
              { label: 'Ficha de matrícula', hint: 'Datos del alumno y apoderado', icon: FileText, onClick: handleDownloadFicha },
              { label: 'Carnet con QR', hint: 'Para ingresar al colegio', icon: QrCode, onClick: () => setIsQrModalOpen(true) },
            ].map(d => (
              <button key={d.label} type="button" onClick={d.onClick} className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-left cursor-pointer">
                <span className="w-9 h-9 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-blue-600"><d.icon className="w-4 h-4" /></span>
                <span className="flex-1">
                  <span className="block text-sm font-bold text-slate-900 dark:text-white">{d.label}</span>
                  <span className="block text-xs text-slate-500">{d.hint}</span>
                </span>
                <Download className="w-4 h-4 text-slate-400" />
              </button>
            ))}
          </section>
        </div>
      )}

      {/* ══════════ MODAL: LIBRETA ══════════ */}
      {isReportCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsReportCardModalOpen(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Libreta de {child.nombre}</h3>
                <p className="text-xs text-slate-500">{child.aula} · Año {year}</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={handleDownloadReportCardPdf} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold cursor-pointer"><Download className="w-4 h-4" /> PDF</button>
                <button type="button" onClick={() => window.print()} className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer"><Printer className="w-4 h-4" /> Imprimir</button>
                <button type="button" onClick={() => setIsReportCardModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" aria-label="Cerrar"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <AnnualReportCardView reportCard={annualReportCard} showPrintButton={false} />
          </div>
        </div>
      )}

      {/* ══════════ MODAL: HORARIO ══════════ */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsScheduleModalOpen(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Horario de {child.aula}</h3>
              <button type="button" onClick={() => setIsScheduleModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" aria-label="Cerrar"><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[600px] text-xs">
                <thead>
                  <tr>
                    <th className="p-2 text-left text-slate-500 font-bold w-24">Hora</th>
                    {DAYS.map(d => <th key={d.key} className={`p-2 text-center font-black uppercase ${d.key === todayKey ? 'text-blue-600' : 'text-slate-700 dark:text-slate-200'}`}>{d.label}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {TIME_BLOCKS.map(block => block.isBreak ? (
                    <tr key={block.id} className="bg-amber-50/60 dark:bg-amber-950/20">
                      <td className="p-2 font-bold text-amber-800 dark:text-amber-300">{block.inicio}</td>
                      <td colSpan={5} className="p-2 text-center font-bold text-amber-700 dark:text-amber-300">Recreo</td>
                    </tr>
                  ) : (
                    <tr key={block.id}>
                      <td className="p-2 font-mono text-slate-500">{block.inicio}–{block.fin}</td>
                      {DAYS.map(day => {
                        const slot = schedule.find(s => s.dia === day.key && s.hora_inicio === block.inicio);
                        const c = courses.find(x => x.id === slot?.curso_id);
                        return (
                          <td key={day.key} className="p-1">
                            {slot ? <div className="p-1.5 rounded-lg text-center font-bold text-slate-800 dark:text-slate-100" style={{ backgroundColor: `${c?.color_hex || '#6366f1'}22` }}>{c?.nombre || 'Clase'}</div> : <span className="block text-center text-slate-300">—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ MODAL: CARNET QR ══════════ */}
      {isQrModalOpen && student && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsQrModalOpen(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-5 space-y-4 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white">Carnet de {child.nombre}</h3>
                <p className="text-xs text-slate-500">Lo pasa por el lector al entrar al colegio.</p>
              </div>
              <button type="button" onClick={() => setIsQrModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" aria-label="Cerrar"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex justify-center"><QrCard student={student} section={section || undefined} showActions={true} /></div>
          </div>
        </div>
      )}

    </div>
  );
}
