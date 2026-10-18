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
  Eye,
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
  const [taskFilter, setTaskFilter] = useState<'urgentes' | 'semana' | 'entregadas' | 'todas'>('todas');

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

  // ── Semana escolar actual (Lunes a Viernes para la tira interactiva) ──
  const currentWeekDays = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 es domingo, 1 es lunes...
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday);

    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    const shortNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
    const days = [];

    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = localIso(d);
      const isToday = iso === todayIso;
      const isFuture = iso > todayIso;

      const holiday = calendarEvents.find(
        e => !e.es_laborable && e.fecha_inicio <= iso && iso <= e.fecha_fin && (e.nivel === 'todos' || e.nivel === section?.grado?.nivel)
      );

      const attRec = attendanceDays.find(a => a.fecha === iso);
      const entryTime = attendances.find(
        a => a.matricula_id === enrollment?.id && a.fecha === iso && a.tipo_registro !== 'salida'
      )?.hora_registro?.slice(0, 5);

      const isJustified = myJustifications.some(j => j.fecha === iso);

      let status: 'presente' | 'tardanza' | 'falta' | 'justificado' | 'feriado' | 'futuro' | 'sin_registro' = 'sin_registro';
      if (holiday) {
        status = 'feriado';
      } else if (attRec?.estado === 'presente') {
        status = 'presente';
      } else if (attRec?.estado === 'tardanza') {
        status = 'tardanza';
      } else if (attRec?.estado === 'justificado' || isJustified) {
        status = 'justificado';
      } else if (attRec?.estado === 'falta') {
        status = 'falta';
      } else if (isFuture) {
        status = 'futuro';
      }

      days.push({
        date: d,
        iso,
        dayName: dayNames[i],
        shortName: shortNames[i],
        dayNumber: d.getDate(),
        isToday,
        isFuture,
        holidayTitle: holiday?.titulo,
        status,
        entryTime,
        canJustify: status === 'falta' && !isJustified,
      });
    }
    return days;
  }, [todayIso, calendarEvents, section, attendanceDays, attendances, enrollment, myJustifications]);

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
  const urgentTasks = useMemo(() => {
    return childTasks.filter(t => !t.sub && (t.overdue || dueInWords(t.task.fecha_limite).includes('hoy') || dueInWords(t.task.fecha_limite).includes('mañana')));
  }, [childTasks]);
  const upcomingTasks = useMemo(() => {
    return childTasks.filter(t => !t.sub && !t.overdue && !dueInWords(t.task.fecha_limite).includes('hoy') && !dueInWords(t.task.fecha_limite).includes('mañana'));
  }, [childTasks]);
  const completedTasks = useMemo(() => {
    return childTasks.filter(t => !!t.sub);
  }, [childTasks]);
  const displayedTasks = useMemo(() => {
    if (taskFilter === 'urgentes') return urgentTasks;
    if (taskFilter === 'semana') return upcomingTasks;
    if (taskFilter === 'entregadas') return completedTasks;
    return childTasks;
  }, [taskFilter, urgentTasks, upcomingTasks, completedTasks, childTasks]);
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
      action: 'Ver tareas', onClick: () => { setTab('tareas'); setTaskFilter('urgentes'); },
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
  // ── Colores institucionales armonizados ──
  const primaryColor = brandingConfig?.primaryColor || '#2563eb';
  const secondaryColor = brandingConfig?.secondaryColor || '#4f46e5';
  const accentColor = brandingConfig?.accentColor || '#ec4899';

  const isSchoolHours = (() => {
    const h = new Date().getHours();
    return h >= 7 && h < 15;
  })();

  // ── Tarjeta "Hoy" (con pulso en vivo) ──
  const today = (() => {
    if (!todayKey) return { title: 'Hoy no hay clases', detail: 'Es fin de semana', tone: 'slate', icon: Calendar, isLive: false, statusBadge: 'Fin de semana' };
    if (holidayToday) return { title: 'Hoy no hay clases', detail: holidayToday.titulo, tone: 'slate', icon: Calendar, isLive: false, statusBadge: 'Feriado' };
    if (todayRecord?.estado === 'presente') return { title: 'Llegó al colegio', detail: todayEntryTime ? `Entró a las ${todayEntryTime}` : 'Ingreso registrado', tone: 'emerald', icon: UserCheck, isLive: isSchoolHours, statusBadge: 'En clase' };
    if (todayRecord?.estado === 'tardanza') return { title: 'Llegó tarde', detail: todayEntryTime ? `Entró a las ${todayEntryTime}` : 'Tardanza registrada', tone: 'amber', icon: Clock, isLive: isSchoolHours, statusBadge: 'En clase' };
    if (todayRecord?.estado === 'justificado') return { title: 'Falta justificada', detail: 'El colegio ya lo sabe', tone: 'sky', icon: CheckCircle2, isLive: false, statusBadge: 'Justificada' };
    if (todayRecord?.estado === 'falta') return { title: 'No asistió hoy', detail: 'Puedes justificar la falta', tone: 'rose', icon: UserX, isLive: false, statusBadge: 'Falta' };
    return { title: 'Aún no registra ingreso', detail: isSchoolHours ? 'En espera de marcación' : 'Se actualiza al pasar su carnet', tone: 'slate', icon: Clock, isLive: isSchoolHours, statusBadge: isSchoolHours ? 'En espera' : 'Pendiente' };
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
        <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor}, ${accentColor})` }} />
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
              <button
                type="button"
                onClick={() => openJustify()}
                style={{ backgroundColor: primaryColor }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-sm font-bold shadow-sm hover:opacity-95 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" /> Justificar falta
              </button>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:border-slate-400 cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-emerald-600" /> Carnet
              </button>
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
                  style={active ? { borderColor: primaryColor, backgroundColor: `${primaryColor}14` } : {}}
                  className={`flex items-center gap-3 pl-2 pr-4 py-2 rounded-2xl border text-left shrink-0 transition-all cursor-pointer ${
                    active
                      ? 'shadow-sm ring-2 ring-indigo-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  {c.avatar
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={c.avatar} alt="" className="w-11 h-11 rounded-xl object-cover" />
                    : (
                      <span
                        className="w-11 h-11 rounded-xl text-white flex items-center justify-center font-black"
                        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                      >
                        {c.nombre[0]}{c.apellidos[0] || ''}
                      </span>
                    )}
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

      {/* ── 2. ¿CÓMO VA? (4 tarjetas con Pulso en Vivo) ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3" aria-label="Resumen">
        {[
          { key: 'hoy', label: 'Hoy', value: today.title, sub: today.detail, icon: today.icon, tone: today.tone, onClick: () => setTab('asistencia') },
          { key: 'notas', label: `Notas · ${selectedPeriod?.nombre || 'bimestre'}`, value: periodAverage ? GRADE_MEANING[periodAverage].label : 'Aún sin notas', sub: periodAverage ? `Promedio ${periodAverage}` : 'Los docentes aún no califican', icon: Award, tone: gradeTone, onClick: () => setTab('notas') },
          { key: 'asist', label: 'Asistencia', value: attendedPct === null ? 'Sin registros' : `${attendedPct}% asistió`, sub: attendanceDays.length > 0 ? `${absent} ${absent === 1 ? 'falta' : 'faltas'} · ${late} ${late === 1 ? 'tardanza' : 'tardanzas'}` : 'Aún no hay días registrados', icon: CalendarCheck, tone: attTone, onClick: () => setTab('asistencia') },
          { key: 'tareas', label: 'Tareas', value: overdueTasks.length > 0 ? `${overdueTasks.length} ${overdueTasks.length === 1 ? 'vencida' : 'vencidas'}` : pendingTasks.length > 0 ? `${pendingTasks.length} por entregar` : 'Al día', sub: pendingTasks[0] ? `${pendingTasks[0].courseName}: ${dueInWords(pendingTasks[0].task.fecha_limite).toLowerCase()}` : `${childTasks.filter(t => t.sub).length} entregadas`, icon: FileText, tone: taskTone, onClick: () => { setTab('tareas'); if (overdueTasks.length > 0) setTaskFilter('urgentes'); } },
        ].map(k => (
          <button key={k.key} type="button" onClick={k.onClick} className={`${card} p-3.5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer`}>
            <div className="flex items-center justify-between gap-1 w-full">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${TONE[k.tone]}`}><k.icon className="w-4 h-4" /></span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">{k.label}</span>
              </div>
              {k.key === 'hoy' && today.isLive && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shrink-0" suppressHydrationWarning>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>{today.statusBadge}</span>
                </span>
              )}
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
      <div role="tablist" aria-label="Secciones del dashboard" className="flex gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-x-auto">
        {tabs.map(t => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={isActive}
              data-tab={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              style={isActive ? { color: primaryColor } : {}}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold whitespace-nowrap cursor-pointer transition-all ${
                isActive
                  ? 'bg-white dark:bg-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
              {t.badge ? (
                <span
                  className="px-1.5 rounded-full text-[11px] font-black"
                  style={isActive ? { backgroundColor: `${primaryColor}20`, color: primaryColor } : { backgroundColor: '#fee2e2', color: '#b91c1c' }}
                >
                  {t.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* ── NOTAS ── */}
      {tab === 'notas' && (
        <section className={`${card} p-4 sm:p-5 space-y-4`}>
          {/* ── 7. Tarjeta Destacada: Libreta Oficial de Notas ── */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/40 dark:from-slate-800/90 dark:via-slate-900 dark:to-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {brandingConfig?.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={brandingConfig.logoUrl}
                    alt="Insignia del Colegio"
                    className="w-14 h-14 object-contain rounded-2xl p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs shrink-0"
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-2xl text-white flex items-center justify-center font-black shadow-xs shrink-0"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                  >
                    <School className="w-7 h-7" />
                  </div>
                )}
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      MINEDU · SIAGIE
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      Estilo: {brandingConfig?.libretaEstilo === 'moderno_ejecutivo' ? 'Moderno Ejecutivo' : brandingConfig?.libretaEstilo === 'academico_elegante' ? 'Académico Elegante' : brandingConfig?.libretaEstilo === 'minimalista_compacto' ? 'Minimalista' : 'Oficial MINEDU'}
                    </span>
                    {brandingConfig?.directorFirmaUrl && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Sello Digital
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
                    Libreta Oficial de Calificaciones {year}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {brandingConfig?.nombreInstitucion || 'Institución Educativa'} · {child.aula}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsReportCardModalOpen(true)}
                  style={{ backgroundColor: primaryColor }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-sm transition-all hover:opacity-95 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Ver Libreta Digital</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadReportCardPdf}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:border-slate-400 bg-white dark:bg-slate-800 shadow-xs transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  <span>Descargar PDF</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-indigo-100/70 dark:border-slate-800 text-xs">
              <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-800/50">
                <p className="text-slate-500 font-medium">Promedio actual</p>
                <p className="font-black text-slate-900 dark:text-white text-sm mt-0.5">
                  {periodAverage ? `Nivel ${periodAverage} (${GRADE_MEANING[periodAverage].label})` : 'En evaluación'}
                </p>
              </div>
              <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-800/50">
                <p className="text-slate-500 font-medium">Cursos evaluados</p>
                <p className="font-black text-slate-900 dark:text-white text-sm mt-0.5">
                  {courseRows.filter(r => r.letter).length} de {courseRows.length} cursos
                </p>
              </div>
              <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-800/50">
                <p className="text-slate-500 font-medium">Bimestre actual</p>
                <p className="font-black text-slate-900 dark:text-white text-sm mt-0.5">
                  {selectedPeriod?.nombre || 'Periodo vigente'}
                </p>
              </div>
              <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-800/50">
                <p className="text-slate-500 font-medium">Asistencia acumulada</p>
                <p className="font-black text-slate-900 dark:text-white text-sm mt-0.5">
                  {attendedPct !== null ? `${attendedPct}% de asistencia` : 'Sin registros'}
                </p>
              </div>
            </div>
          </div>

          {/* ── 5. Guía Visual Oficial CNEB ── */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Escala Oficial de Calificaciones CNEB (MINEDU)</h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">Evaluación formativa</span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-black text-xs">AD</span>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">18 - 20</span>
                </div>
                <p className="text-xs font-black text-emerald-900 dark:text-emerald-200">Logro Destacado</p>
                <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300/90 mt-0.5 leading-snug">
                  Supera con holgura los aprendizajes esperados con gran autonomía.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2 py-0.5 rounded-lg bg-blue-600 text-white font-black text-xs">A</span>
                  <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300">14 - 17</span>
                </div>
                <p className="text-xs font-black text-blue-900 dark:text-blue-200">Logro Esperado</p>
                <p className="text-[11px] text-blue-800/90 dark:text-blue-300/90 mt-0.5 leading-snug">
                  Demuestra satisfactoriamente el nivel previsto para su grado escolar.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2 py-0.5 rounded-lg bg-amber-600 text-white font-black text-xs">B</span>
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300">11 - 13</span>
                </div>
                <p className="text-xs font-black text-amber-900 dark:text-amber-200">En Proceso</p>
                <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 mt-0.5 leading-snug">
                  Cerca del nivel esperado; requiere acompañamiento o refuerzo pedagógico.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2 py-0.5 rounded-lg bg-rose-600 text-white font-black text-xs">C</span>
                  <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300">0 - 10</span>
                </div>
                <p className="text-xs font-black text-rose-900 dark:text-rose-200">En Inicio</p>
                <p className="text-[11px] text-rose-800/90 dark:text-rose-300/90 mt-0.5 leading-snug">
                  Muestra dificultades; necesita apoyo guiado continuo del docente y la familia.
                </p>
              </div>
            </div>
          </div>

          {/* ── Alerta Empática de Apoyo si hay cursos en C ── */}
          {coursesInC.length > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 dark:from-rose-950/30 dark:via-amber-950/20 dark:to-orange-950/20 border border-rose-200 dark:border-rose-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Heart className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    Acompañamiento pedagógico recomendado para {firstName}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Se identificaron calificaciones en inicio (C) en: <strong>{coursesInC.map(c => c.course.nombre).join(', ')}</strong>. La evaluación busca detectar oportunidades a tiempo. Coordinar con su tutor(a) {tutorName} te permitirá acordar un plan de tutoría o reforzamiento.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTab('tutor')}
                style={{ backgroundColor: primaryColor }}
                className="shrink-0 px-3.5 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-sm hover:opacity-95 cursor-pointer whitespace-nowrap self-start sm:self-center"
              >
                Ver tutor y coordinar
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">Notas por curso</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Detalle por área curricular y competencias del periodo</p>
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
            <button
              type="button"
              onClick={() => openJustify()}
              style={{ backgroundColor: primaryColor }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-sm font-bold shadow-sm hover:opacity-95 transition-all cursor-pointer self-start"
            >
              <Send className="w-4 h-4" /> Justificar una falta
            </button>
          </div>

          {/* ── 4. Tira Semanal de Asistencia (Lunes a Viernes) ── */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-slate-800/60 dark:to-slate-800/30 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Esta semana escolar (Lunes a Viernes)</h3>
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400" suppressHydrationWarning>
                {currentWeekDays[0] && currentWeekDays[4]
                  ? currentWeekDays[0].date.getMonth() === currentWeekDays[4].date.getMonth()
                    ? `${currentWeekDays[0].dayNumber} al ${currentWeekDays[4].dayNumber} de ${currentWeekDays[0].date.toLocaleDateString('es-PE', { month: 'long' })}`
                    : `${currentWeekDays[0].dayNumber} de ${currentWeekDays[0].date.toLocaleDateString('es-PE', { month: 'short' }).replace('.', '')} al ${currentWeekDays[4].dayNumber} de ${currentWeekDays[4].date.toLocaleDateString('es-PE', { month: 'short' }).replace('.', '')}`
                  : ''}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {currentWeekDays.map(day => {
                const isPresent = day.status === 'presente';
                const isLate = day.status === 'tardanza';
                const isAbsent = day.status === 'falta';
                const isExcused = day.status === 'justificado';
                const isHoliday = day.status === 'feriado';
                const isFuture = day.status === 'futuro';

                return (
                  <div
                    key={day.iso}
                    className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                      day.isToday
                        ? 'ring-2 ring-indigo-500/30 border-indigo-400 dark:border-indigo-600 bg-white dark:bg-slate-900 shadow-sm'
                        : 'bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                        {day.shortName} {day.dayNumber}
                      </span>
                      {day.isToday && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          Hoy
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 my-1">
                      {isPresent && (
                        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-xs font-black">Asistió</span>
                        </div>
                      )}
                      {isLate && (
                        <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="text-xs font-black">Tardanza</span>
                        </div>
                      )}
                      {isAbsent && (
                        <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                          <UserX className="w-4 h-4 text-rose-600 shrink-0" />
                          <span className="text-xs font-black">Falta</span>
                        </div>
                      )}
                      {isExcused && (
                        <div className="flex items-center gap-1.5 text-sky-700 dark:text-sky-300">
                          <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                          <span className="text-xs font-black">Justificada</span>
                        </div>
                      )}
                      {isHoliday && (
                        <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300">
                          <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
                          <span className="text-xs font-bold text-[11px] truncate">{day.holidayTitle || 'Feriado'}</span>
                        </div>
                      )}
                      {isFuture && (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                          <span className="text-xs font-medium">Por registrar</span>
                        </div>
                      )}
                      {!isPresent && !isLate && !isAbsent && !isExcused && !isHoliday && !isFuture && (
                        <span className="text-xs text-slate-400 font-medium">Sin registro</span>
                      )}

                      {day.entryTime && (
                        <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          Ingreso: {day.entryTime}
                        </p>
                      )}
                    </div>

                    {day.canJustify ? (
                      <button
                        type="button"
                        onClick={() => openJustify(day.iso)}
                        className="mt-2 w-full py-1 px-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold text-center transition-all cursor-pointer shadow-xs"
                      >
                        Justificar
                      </button>
                    ) : (
                      <div className="h-1"></div>
                    )}
                  </div>
                );
              })}
            </div>
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
          <section className={`${card} p-4 sm:p-5 space-y-3.5 lg:col-span-3`}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">Tareas</h2>
                <p className="text-xs text-slate-500">Actividades y deberes escolares asignados</p>
              </div>
              <Link href="/apoderado/tareas" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5">Ver detalle <ChevronRight className="w-4 h-4" /></Link>
            </div>

            {/* ── 3. Semáforo de Urgencia: Filter Chips ── */}
            <div className="flex flex-wrap items-center gap-1.5 pb-1">
              <button
                type="button"
                onClick={() => setTaskFilter('urgentes')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  taskFilter === 'urgentes'
                    ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Urgentes / Por vencer</span>
                {urgentTasks.length > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${taskFilter === 'urgentes' ? 'bg-white text-rose-600' : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'}`}>
                    {urgentTasks.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setTaskFilter('semana')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  taskFilter === 'semana'
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Próximas</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${taskFilter === 'semana' ? 'bg-white text-blue-600' : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'}`}>
                  {upcomingTasks.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setTaskFilter('entregadas')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  taskFilter === 'entregadas'
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Entregadas</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${taskFilter === 'entregadas' ? 'bg-white text-emerald-600' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'}`}>
                  {completedTasks.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setTaskFilter('todas')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  taskFilter === 'todas'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>Todas</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${taskFilter === 'todas' ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}>
                  {childTasks.length}
                </span>
              </button>
            </div>

            {displayedTasks.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {taskFilter === 'urgentes'
                    ? `¡Excelente! ${firstName} no tiene tareas urgentes ni vencidas.`
                    : taskFilter === 'semana'
                    ? 'No hay tareas programadas para esta semana.'
                    : taskFilter === 'entregadas'
                    ? 'Aún no registra tareas entregadas.'
                    : 'No hay tareas asignadas para este periodo.'}
                </p>
                <p className="text-xs text-slate-500">
                  {taskFilter === 'urgentes' ? 'Revisa "Próximas" o "Todas" para ver las siguientes actividades.' : 'Las nuevas tareas de los profesores aparecerán aquí automáticamente.'}
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {displayedTasks.slice(0, 12).map(t => {
                  const isUrgent = !t.sub && (t.overdue || dueInWords(t.task.fecha_limite).includes('hoy') || dueInWords(t.task.fecha_limite).includes('mañana'));
                  return (
                    <li
                      key={t.task.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        t.overdue
                          ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                          : isUrgent
                          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                          : t.sub
                          ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-slate-100 dark:border-slate-800'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-transparent'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${t.sub ? TONE.emerald : t.overdue ? TONE.rose : TONE.amber}`}>
                        {t.sub ? <CheckCircle2 className="w-4 h-4" /> : t.overdue ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{t.task.titulo}</p>
                          {t.overdue && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 shrink-0">
                              Vencida
                            </span>
                          )}
                          {!t.sub && !t.overdue && dueInWords(t.task.fecha_limite).includes('hoy') && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 shrink-0">
                              Vence hoy
                            </span>
                          )}
                          {!t.sub && !t.overdue && dueInWords(t.task.fecha_limite).includes('mañana') && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 shrink-0">
                              Vence mañana
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{t.courseName} · {t.sub ? 'Entregada' : dueInWords(t.task.fecha_limite)}</p>
                      </div>
                      {t.sub?.calificacion_letra ? <GradeBadge grade={t.sub.calificacion_letra} size="sm" /> : t.sub ? <span className="text-[11px] font-bold text-slate-400">Entregada</span> : null}
                    </li>
                  );
                })}
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
              <span
                className="w-12 h-12 rounded-xl text-white flex items-center justify-center font-black shadow-xs"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
              >
                {tutor ? `${tutor.nombres[0]}${tutor.apellidos[0] || ''}` : '?'}
              </span>
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
                ? (
                  <a
                    href={`mailto:${tutor.email}`}
                    style={{ backgroundColor: primaryColor }}
                    className="inline-flex items-center justify-center gap-1.5 p-2.5 rounded-xl text-white text-sm font-bold hover:opacity-95 shadow-xs transition-all"
                  >
                    <Mail className="w-4 h-4" /> Escribir
                  </a>
                )
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
                <button
                  type="button"
                  onClick={handleDownloadReportCardPdf}
                  style={{ backgroundColor: primaryColor }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-sm font-bold shadow-sm hover:opacity-95 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" /> PDF
                </button>
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
