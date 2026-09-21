'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { GradeBadge } from '@/components/notas/GradeBadge';
import { AnnualReportCardView } from '@/components/notas/AnnualReportCardView';
import { QrCard } from '@/components/qr/QrCard';
import { calculateAverage, calculateAnnualStatus, calculateStudentAnnualReportCard } from '@/lib/grades/calculations';
import { DayOfWeek } from '@/types';
import { 
  Heart, 
  Users, 
  Award, 
  Clock, 
  FileText, 
  Calendar, 
  ChevronRight, 
  ChevronLeft,
  ArrowRight, 
  Sparkles, 
  QrCode, 
  MessageSquare, 
  AlertCircle, 
  Phone, 
  Mail, 
  ShieldCheck, 
  TrendingUp, 
  CheckCircle2,
  BookOpen,
  CalendarCheck,
  CheckSquare,
  FileCheck2,
  Send,
  Printer,
  Download,
  FileSpreadsheet,
  FileImage,
  MapPin,
  HelpCircle,
  X,
  AlertTriangle,
  GraduationCap,
  BarChart2,
  BarChart3,
  Info,
  Maximize2,
  ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import { generateReportCardPdf } from '@/lib/pdf/reportCardPdfGenerator';
import { downloadEnrollmentFichaPdf } from '@/lib/pdf/generateEnrollmentFichaPdf';
import { downloadEnrollmentCertificatePdf } from '@/lib/pdf/certificatePdfGenerator';
import { TIME_BLOCKS, DAYS } from '@/lib/constants/schedule';

export default function ApoderadoDashboardPage() {
  const { 
    currentUser,
    childrenList, 
    selectedChildId, 
    setSelectedChildId, 
    selectedChild,
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
    requestJustification,
    justificationRequests,
    showToast,
    announcements,
    markAnnouncementRead,
    confirmAnnouncement,
    calendarEvents,
    sections
  } = useApp();

  // Modales de profundización interactiva
  const [isReportCardModalOpen, setIsReportCardModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isJustifyModalOpen, setIsJustifyModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Estados del modal de justificación
  const [justifyDate, setJustifyDate] = useState(new Date().toISOString().split('T')[0]);
  const [justifyReason, setJustifyReason] = useState('Salud / Cita médica');
  const [justifyDetails, setJustifyDetails] = useState('');

  // Lista de hijos/estudiantes disponibles
  const dynamicChildrenList = useMemo(() => {
    if (childrenList && childrenList.length > 0) return childrenList;
    if (!students || students.length === 0) return [];
    
    let studentMatches = students;
    if (currentUser && currentUser.rol === 'apoderado') {
      const email = currentUser.email?.toLowerCase().trim();
      const phone = currentUser.telefono?.trim();
      const name = `${currentUser.nombres || ''} ${currentUser.apellidos || ''}`.toLowerCase().trim();
      const filtered = students.filter(s => {
        const matchEmail = s.email_apoderado && email && s.email_apoderado.toLowerCase().trim() === email;
        const matchPhone = s.telefono_apoderado && phone && s.telefono_apoderado.trim() === phone;
        const matchName = s.nombre_apoderado && name && (s.nombre_apoderado.toLowerCase().includes(name) || name.includes(s.nombre_apoderado.toLowerCase()));
        return matchEmail || matchPhone || matchName;
      });
      if (filtered.length > 0) {
        studentMatches = filtered;
      }
    }

    return studentMatches.map((s) => {
      const enr = enrollments.find(e => e.estudiante_id === s.id);
      const sec = enr?.seccion;
      const grd = sec?.grado;
      const studentAtts = enr ? attendances.filter(a => a.matricula_id === enr.id) : [];
      const attPct = studentAtts.length > 0 ? Math.round((studentAtts.filter(a => a.estado === 'presente').length / studentAtts.length) * 100) : 0;
      const studentGrds = enr ? grades.filter(g => g.matricula_id === enr.id).map(g => g.nota_letra) : [];
      const { averageLetter } = calculateAverage(studentGrds);
      const tutor = teachers.find(t => t.id === sec?.tutor_id);

      return {
        id: s.id,
        estudiante_id: s.id,
        nombre: s.profile?.nombres || s.nombres || '',
        apellidos: s.profile?.apellidos || s.apellidos || '',
        nivel: grd?.nivel || 'primaria',
        grado_nombre: grd?.nombre || 'Grado sin asignar',
        seccion_letra: sec?.letra || '-',
        avatar_url: s.profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        promedio_letra: (averageLetter || '—') as any,
        asistencia_porcentaje: attPct,
        tareas_pendientes: 0,
        tutor_nombre: tutor ? `${tutor.nombres} ${tutor.apellidos}` : 'No asignado',
        tutor_email: tutor?.email || '',
        tutor_avatar: tutor?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
      };
    });
  }, [childrenList, students, enrollments, attendances, grades, teachers, currentUser]);

  // Identificar hijo seleccionado actualmente
  const currentChild = useMemo(() => {
    if (dynamicChildrenList.length === 0) return null;
    return dynamicChildrenList.find(c => c.id === selectedChildId || c.estudiante_id === selectedChildId) || dynamicChildrenList[0];
  }, [dynamicChildrenList, selectedChildId]);

  // Estudiante y matrícula correspondientes al hijo seleccionado
  const activeStudent = useMemo(() => {
    if (!currentChild) return null;
    return students.find(s => s.id === currentChild.estudiante_id || s.id === currentChild.id) || null;
  }, [students, currentChild]);

  const activeEnrollment = useMemo(() => {
    if (!activeStudent?.id) return null;
    return enrollments.find(e => e.estudiante_id === activeStudent.id) || null;
  }, [enrollments, activeStudent]);

  const studentSectionId = activeEnrollment?.seccion_id || '';

  const activeSection = useMemo(() => {
    return activeEnrollment?.seccion || sections.find(s => s.id === studentSectionId) || null;
  }, [activeEnrollment, sections, studentSectionId]);

  // Calificaciones del hijo 100% reales
  const studentGrades = useMemo(() => {
    if (!activeEnrollment?.id) return [];
    return grades.filter(g => g.matricula_id === activeEnrollment.id);
  }, [grades, activeEnrollment]);

  const studentGradeLetters = useMemo(() => {
    return studentGrades.map(g => g.nota_letra);
  }, [studentGrades]);

  const { averageLetter, averageScore } = useMemo(() => {
    return calculateAverage(studentGradeLetters);
  }, [studentGradeLetters]);

  const { status: annualStatus } = useMemo(() => {
    return calculateAnnualStatus(studentGradeLetters);
  }, [studentGradeLetters]);

  // Asistencias del hijo 100% reales
  const studentAttendances = useMemo(() => {
    if (!activeEnrollment?.id) return [];
    return attendances.filter(a => a.matricula_id === activeEnrollment.id);
  }, [attendances, activeEnrollment]);

  const totalAttendances = studentAttendances.length;
  const presentAttendances = studentAttendances.filter(a => a.estado === 'presente').length;
  const tardanzaAttendances = studentAttendances.filter(a => a.estado === 'tardanza').length;
  const faltaAttendances = studentAttendances.filter(a => a.estado === 'falta').length;
  const attendanceRate = totalAttendances > 0 ? Math.round((presentAttendances / totalAttendances) * 100) : 0;

  // Tutor del salón
  const currentTutor = useMemo(() => {
    const tutorId = activeEnrollment?.seccion?.tutor_id;
    return teachers.find(t => t.id === tutorId) || null;
  }, [activeEnrollment, teachers]);

  const tutorDisplayName = currentTutor ? `${currentTutor.nombres} ${currentTutor.apellidos}` : 'No asignado';

  // Consolidado Anual del ReportCard
  const annualReportCard = useMemo(() => {
    return calculateStudentAnnualReportCard({
      enrollmentId: activeEnrollment?.id || '',
      studentId: activeStudent?.id || '',
      studentName: `${activeStudent?.apellidos || currentChild?.apellidos || ''}, ${activeStudent?.nombres || currentChild?.nombre || ''}`.trim() || 'Estudiante',
      studentDni: activeStudent?.profile?.dni || activeStudent?.dni || '—',
      studentCode: activeStudent?.codigo_estudiante || '—',
      gradeLevelName: activeEnrollment?.seccion?.grado?.nombre || currentChild?.grado_nombre || 'Sin aula asignada',
      sectionLetter: activeEnrollment?.seccion?.letra || currentChild?.seccion_letra || '-',
      academicYear: 2026,
      tutorName: tutorDisplayName,
      courses,
      grades: studentGrades,
      evaluationPeriodIds: evaluationPeriods.map(p => ({ id: p.id, numero_periodo: p.numero_periodo })),
      attendancePercentage: attendanceRate,
      conductGrade: studentGradeLetters.length > 0 ? (averageLetter || 'A') : undefined,
    });
  }, [activeEnrollment, activeStudent, currentChild, tutorDisplayName, courses, studentGrades, evaluationPeriods, attendanceRate, studentGradeLetters, averageLetter]);

  // Tareas de la sección del hijo
  const studentTasks = useMemo(() => {
    if (!studentSectionId) return [];
    return tasks.filter(t => t.seccion_id === studentSectionId);
  }, [tasks, studentSectionId]);

  // Exámenes de la sección del hijo
  const studentExams = useMemo(() => {
    if (!studentSectionId) return [];
    return exams.filter(e => e.seccion_id === studentSectionId);
  }, [exams, studentSectionId]);

  // Horario semanal de la sección del hijo
  const studentSchedule = useMemo(() => {
    if (!studentSectionId) return [];
    return scheduleSlots.filter(s => s.seccion_id === studentSectionId);
  }, [scheduleSlots, studentSectionId]);

  // Horario del día actual
  const todayDay = new Date().toLocaleDateString('es-PE', { weekday: 'long' }).toLowerCase() as DayOfWeek;
  const todaySlots = useMemo(() => {
    const valid = studentSchedule.filter(s => s.dia === todayDay || s.dia === 'lunes');
    return valid.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
  }, [studentSchedule, todayDay]);

  // Comunicados y citaciones dirigidos específicamente a este estudiante y familia
  const targetedAnnouncements = useMemo(() => {
    const childLevel = activeEnrollment?.seccion?.grado?.nivel || currentChild?.nivel;
    const childGradeId = activeEnrollment?.seccion?.grado_id;
    const childSecId = activeEnrollment?.seccion_id;

    return announcements.filter(a => {
      // Rol filter
      const roleMatch = !a.destinatarios_rol || a.destinatarios_rol === 'todos' || a.destinatarios_rol === 'apoderado';
      if (!roleMatch) return false;

      // Nivel filter
      const targetNivel = a.nivel || a.nivel_destinatario;
      if (targetNivel && targetNivel !== 'todos' && targetNivel !== childLevel) return false;

      // Grado filter
      if (a.grado_id && childGradeId && a.grado_id !== childGradeId) return false;

      // Sección filter
      if (a.seccion_id && childSecId && a.seccion_id !== childSecId) return false;

      return true;
    });
  }, [announcements, activeEnrollment, currentChild]);

  // Saludo dinámico según la hora
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Buenos días' : currentHour < 18 ? 'Buenas tardes' : 'Buenas noches';

  // Descargar Libreta Oficial CNEB en PDF
  const handleDownloadReportCardPdf = async () => {
    if (!activeEnrollment || !activeStudent) return;
    try {
      const doc = await generateReportCardPdf({
        student: activeStudent,
        enrollment: activeEnrollment,
        courses,
        grades: studentGrades,
        evaluationPeriods,
        brandingConfig,
        tutorName: tutorDisplayName,
      });
      doc.save(`Libreta_Oficial_CNEB_2026_${activeStudent.apellidos || ''}_${activeStudent.nombres || ''}.pdf`);
      showToast('Libreta Oficial CNEB descargada en PDF', 'success', 'Descarga');
    } catch (err) {
      console.error(err);
      showToast('Error al generar la libreta PDF', 'error');
    }
  };

  // Descargar Ficha Oficial de Matrícula en PDF
  const handleDownloadFichaMatriculaPdf = async () => {
    if (!activeEnrollment || !activeStudent) return;
    try {
      await downloadEnrollmentFichaPdf({
        student: activeStudent,
        enrollment: activeEnrollment,
        section: activeSection,
        parentName: currentUser ? `${currentUser.nombres} ${currentUser.apellidos}` : activeStudent.nombre_apoderado,
        parentPhone: activeStudent.telefono_apoderado,
        parentEmail: activeStudent.email_apoderado,
        brandingConfig,
      });
      showToast('Ficha Oficial de Matrícula descargada', 'success', '📄 Matrícula');
    } catch (err) {
      console.error(err);
      showToast('Error al generar la ficha de matrícula', 'error');
    }
  };

  const handleDownloadConstancia = async () => {
    if (!activeStudent) {
      showToast('No se encontró el estudiante activo', 'error');
      return;
    }
    try {
      await downloadEnrollmentCertificatePdf({
        student: activeStudent,
        enrollment: activeEnrollment,
        section: activeEnrollment?.seccion,
        gradeLevel: activeEnrollment?.seccion?.grado,
        brandingConfig,
      });
      showToast('Constancia Oficial de Matrícula generada y descargada', 'success', '📄 Documento Oficial');
    } catch (err) {
      console.error(err);
      showToast('Error al generar la constancia de matrícula', 'error');
    }
  };

  const handleSubmitJustification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEnrollment) {
      showToast('No se encontró la matrícula activa del estudiante seleccionado.', 'error');
      return;
    }
    if (!justifyDetails.trim()) {
      showToast('Por favor describe el motivo o sustento de la inasistencia.', 'warning');
      return;
    }

    requestJustification({
      matricula_id: activeEnrollment.id,
      estudiante_id: activeEnrollment.estudiante_id,
      apoderado_id: currentUser?.id,
      apoderado_nombre: currentUser ? `${currentUser.nombres} ${currentUser.apellidos}` : 'Apoderado',
      fecha: justifyDate,
      tipo: 'falta',
      motivo: `${justifyReason} — ${justifyDetails.trim()}`,
    });

    setIsJustifyModalOpen(false);
    setJustifyDetails('');
  };

  // Navegación secuencial de hijos
  const handleSelectPrevChild = () => {
    if (dynamicChildrenList.length === 0) return;
    const currentIndex = dynamicChildrenList.findIndex(c => c.id === (selectedChildId || dynamicChildrenList[0].id));
    const prevIndex = (currentIndex - 1 + dynamicChildrenList.length) % dynamicChildrenList.length;
    setSelectedChildId(dynamicChildrenList[prevIndex].id);
    showToast(`Viendo a ${dynamicChildrenList[prevIndex].nombre} ${dynamicChildrenList[prevIndex].apellidos}`, 'info', 'Estudiante Activo');
  };

  const handleSelectNextChild = () => {
    if (dynamicChildrenList.length === 0) return;
    const currentIndex = dynamicChildrenList.findIndex(c => c.id === (selectedChildId || dynamicChildrenList[0].id));
    const nextIndex = (currentIndex + 1) % dynamicChildrenList.length;
    setSelectedChildId(dynamicChildrenList[nextIndex].id);
    showToast(`Viendo a ${dynamicChildrenList[nextIndex].nombre} ${dynamicChildrenList[nextIndex].apellidos}`, 'info', 'Estudiante Activo');
  };

  // Métricas completas y reales por cada hijo del apoderado
  const enrichedChildren = useMemo(() => {
    return dynamicChildrenList.map((child) => {
      const childStudent = students.find(s => s.id === child.estudiante_id || s.id === child.id);
      const childEnrollment = enrollments.find(e => e.estudiante_id === child.estudiante_id || e.estudiante_id === child.id);
      const secId = childEnrollment?.seccion_id;
      
      // Tareas de la sección
      const childSecTasks = secId ? tasks.filter(t => t.seccion_id === secId) : [];
      const childSubmissions = childEnrollment ? submissions.filter(s => s.matricula_id === childEnrollment.id) : [];
      
      const totalTasksCount = childSecTasks.length;
      const pendingTasksCount = childSecTasks.filter(t => !childSubmissions.some(s => s.tarea_id === t.id)).length;

      // Calificaciones
      const childGrades = childEnrollment ? grades.filter(g => g.matricula_id === childEnrollment.id) : [];
      const childAvg = calculateAverage(childGrades.map(g => g.nota_letra)).averageLetter || child.promedio_letra || '—';
      
      const avgStatusLabel = childAvg === 'AD' ? 'Excelente' : childAvg === 'A' ? 'Bueno' : childAvg === 'B' ? 'En proceso' : childAvg === 'C' ? 'En inicio' : 'Sin notas';

      // Asistencias
      const childAttendances = childEnrollment ? attendances.filter(a => a.matricula_id === childEnrollment.id) : [];
      const totalAtt = childAttendances.length;
      const presentAtt = childAttendances.filter(a => a.estado === 'presente').length;
      const attPct = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : (child.asistencia_porcentaje || 0);

      const isSelected = child.id === (selectedChildId || dynamicChildrenList[0]?.id);

      return {
        ...child,
        studentCode: childStudent?.codigo_estudiante || 'Sin código',
        totalTasks: totalTasksCount,
        pendingTasks: pendingTasksCount,
        averageLetter: childAvg,
        averageStatus: avgStatusLabel,
        attendancePct: attPct,
        isSelected,
      };
    });
  }, [dynamicChildrenList, selectedChildId, students, enrollments, tasks, submissions, grades, attendances]);

  return (
    <div className="space-y-8 max-w-[1500px] mx-auto pb-20 animate-fade-in">
      
      {/* ── 1. HERO / ENCABEZADO PRINCIPAL (INSPIRADO EN REFERENCIA) ── */}
      <div className="relative overflow-hidden rounded-3xl sm:rounded-[36px] bg-gradient-to-r from-[#0c1938] via-[#102454] to-[#141b3d] text-white p-6 sm:p-8 lg:p-10 shadow-2xl shadow-indigo-950/30 border border-indigo-500/20">
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-1/4 -mt-12 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 -mb-16 -mr-16 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          
          {/* Left Content Column */}
          <div className="space-y-3.5 max-w-xl">
            {/* Top Breadcrumb / Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-pink-200 text-xs font-semibold shadow-xs">
              <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400/40" />
              <span>Portal de Familias • Seguimiento Escolar 2026</span>
            </div>

            {/* Main Greeting */}
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
                <span suppressHydrationWarning>{greeting},</span>
                <span className="block font-black mt-0.5 text-white flex items-center gap-2">
                  Estimada Familia <span className="inline-block animate-wave origin-bottom-right">👋</span>
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed mt-2.5">
                Monitoreo en tiempo real de asistencia, calificaciones oficiales CNEB y avisos de tutoría de sus hijos.
              </p>
            </div>

            {/* Security Status Badge */}
            <div className="pt-2">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold backdrop-blur-sm shadow-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Modo Solo Consulta Familiar Protegida</span>
              </span>
            </div>
          </div>

          {/* Center-Right Illustration & Romantic Tagline */}
          <div className="hidden xl:flex items-center gap-6 shrink-0 relative">
            <div className="relative">
              {/* Floating Artistic Slogan */}
              <div className="absolute -top-6 -left-12 z-20 pointer-events-none">
                <span className="font-serif italic text-sm text-pink-200/90 drop-shadow-md -rotate-6 block font-bold leading-tight">
                  Acompañamos<br />su crecimiento ♡
                </span>
              </div>

              {/* 3D Cute Illustration Badge */}
              <div className="w-64 h-44 rounded-3xl overflow-hidden border border-indigo-400/30 shadow-2xl bg-gradient-to-b from-indigo-950/60 to-slate-950/80 backdrop-blur-sm relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/hero-family.jpg"
                  alt="Familia y Estudio"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c1938]/80 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Right Column: Direct Action Buttons */}
          <div className="flex flex-col gap-3 shrink-0 min-w-[240px]">
            <button
              onClick={() => setIsReportCardModalOpen(true)}
              className="flex items-center justify-between gap-3 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
                  <Award className="w-4 h-4 text-amber-300" />
                </div>
                <span>Libreta Oficial de Notas</span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/70 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => setIsQrModalOpen(true)}
              className="flex items-center justify-between gap-3 px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs backdrop-blur-md transition-all hover:scale-[1.02] active:scale-98 cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center">
                  <QrCode className="w-4 h-4 text-emerald-300" />
                </div>
                <span>Carnet QR del Estudiante</span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/70 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => setIsJustifyModalOpen(true)}
              className="flex items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-rose-600/30 hover:bg-rose-600/40 border border-rose-500/40 text-rose-200 font-bold text-xs backdrop-blur-md transition-all hover:scale-[1.02] active:scale-98 cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-rose-500/20 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-rose-300" />
                </div>
                <span>Justificar Inasistencia / Falta</span>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-200/70 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={handleDownloadConstancia}
              className="flex items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-indigo-600/30 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-200 font-bold text-xs backdrop-blur-md transition-all hover:scale-[1.02] active:scale-98 cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-indigo-300" />
                </div>
                <span>Constancia de Matrícula (PDF)</span>
              </div>
              <ChevronRight className="w-4 h-4 text-indigo-200/70 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Slogan */}
            <p className="text-[10px] tracking-[0.2em] text-slate-400 font-black uppercase text-center pt-1">
              COLEGIO • FAMILIA • FUTURO
            </p>
          </div>

        </div>
      </div>

      {/* ── 2. SECCIÓN: SUPERVISIÓN ESCOLAR DE HIJOS (MÓDULO DE SUPERVISIÓN RÁPIDA) ── */}
      <div className="space-y-4">
        {/* Encabezado Principal de la Sección de Supervisión */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/60 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                Supervisión Escolar de Hijos
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                Selecciona al estudiante para supervisar sus deberes y entregas
              </p>
            </div>
          </div>

          {/* Selector / Contador de Hijos con Navegación Rápida */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <div className="text-left">
                <span className="text-xs font-black text-slate-900 dark:text-white block leading-tight">
                  {childrenList.length} hijos registrados
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block leading-tight">
                  Cambia entre ellos para ver su información
                </span>
              </div>
            </div>

            {/* Botones de navegación < > */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleSelectPrevChild}
                className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
                title="Hijo anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleSelectNextChild}
                className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
                title="Siguiente hijo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── 3. TARJETAS DE SUPERVISIÓN RÁPIDA (AMPLIAS, COMPLETAS Y RESPONSIVAS) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {enrichedChildren.map((child) => {
            const isPrimaria = child.nivel === 'primaria';
            const isInicial = child.nivel === 'inicial';

            const levelBadgeClass = isPrimaria
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 border-blue-200/90 dark:border-blue-800/60'
              : isInicial
              ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border-purple-200/90 dark:border-purple-800/60'
              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 border-emerald-200/90 dark:border-emerald-800/60';

            return (
              <div
                key={child.id}
                onClick={() => {
                  setSelectedChildId(child.id);
                  showToast(`Viendo a ${child.nombre} ${child.apellidos}`, 'info', 'Estudiante Activo');
                }}
                className={`group rounded-3xl sm:rounded-[32px] p-5 sm:p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between gap-5 relative bg-white dark:bg-slate-900 ${
                  child.isSelected
                    ? 'border-2 border-blue-500 dark:border-blue-400 shadow-2xl shadow-blue-500/15 ring-4 ring-blue-500/15 bg-gradient-to-b from-blue-50/20 via-white to-white dark:from-slate-900/90 dark:to-slate-900'
                    : 'border border-slate-200/90 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700 shadow-sm hover:shadow-lg hover:-translate-y-0.5'
                }`}
              >
                {/* Encabezado de la Tarjeta: Avatar + Datos + Flecha de Estado */}
                <div className="flex items-start justify-between gap-3.5">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-white dark:border-slate-800 shadow-md ring-2 ring-slate-100 dark:ring-slate-700/80 shrink-0 bg-slate-100 dark:bg-slate-800 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={child.avatar_url || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80'}
                        alt={child.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <h3 className="text-base sm:text-[17px] font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5 leading-snug truncate">
                        <span>{child.nombre}</span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                      </h3>
                      <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 font-medium truncate">
                        {child.grado_nombre} · Sección &quot;{child.seccion_letra}&quot;
                      </p>
                      <div className="pt-0.5">
                        <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg border ${levelBadgeClass}`}>
                          NIVEL {child.nivel.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    child.isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-blue-600 group-hover:text-white'
                  }`}>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                {/* ── 3 MÉTRICAS REALES Y DIFERENCIADAS ── */}
                <div className="grid grid-cols-3 gap-2.5 sm:gap-3 pt-1">
                  
                  {/* Métrica 1: Tareas */}
                  <div className="p-3 sm:p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100/90 dark:border-blue-900/50 flex flex-col justify-between gap-1 transition-all">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-lg bg-blue-100 dark:bg-blue-900/70 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <FileText className="w-3 h-3" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Tareas</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight mt-0.5">
                      {child.totalTasks}
                    </div>
                    <div className={`text-[11px] font-bold leading-tight ${
                      child.pendingTasks > 0 ? 'text-pink-600 dark:text-pink-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {child.pendingTasks > 0 ? `${child.pendingTasks} pendientes` : 'Al día'}
                    </div>
                  </div>

                  {/* Métrica 2: Promedio */}
                  <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100/90 dark:border-emerald-900/50 flex flex-col justify-between gap-1 transition-all">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-lg bg-emerald-100 dark:bg-emerald-900/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Award className="w-3 h-3" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Promedio</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight mt-0.5">
                      {child.averageLetter}
                    </div>
                    <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 leading-tight">
                      {child.averageStatus}
                    </div>
                  </div>

                  {/* Métrica 3: Asistencia */}
                  <div className="p-3 sm:p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-100/90 dark:border-purple-900/50 flex flex-col justify-between gap-1 transition-all">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-lg bg-purple-100 dark:bg-purple-900/70 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <MapPin className="w-3 h-3" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Asistencia</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight mt-0.5">
                      {child.attendancePct}%
                    </div>
                    <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400 leading-tight">
                      Este mes
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3.5 BARRA DE RUTA DE SEGUIMIENTO FAMILIAR (SECUENCIA LÓGICA) ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Ruta de Seguimiento Familiar
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Monitoreo en tiempo real de {currentChild?.nombre || 'tu hijo'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-3">
          <button
            type="button"
            onClick={() => document.getElementById('asistencia-en-vivo')?.scrollIntoView({ behavior: 'smooth' })}
            className="group flex flex-col p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/60 dark:border-slate-700/60 hover:border-emerald-300 transition-all text-left cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                1. Ingreso
              </span>
              <Clock className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">Asistencia Live</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Hora de llegada y estado</span>
          </button>

          <button
            type="button"
            onClick={() => setIsJustifyModalOpen(true)}
            className="group flex flex-col p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200/60 dark:border-slate-700/60 hover:border-amber-300 transition-all text-left cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                2. Bienestar
              </span>
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">Justificar Falta</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Enviar motivo al tutor</span>
          </button>

          <Link
            href="/apoderado/tareas"
            className="group flex flex-col p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200/60 dark:border-slate-700/60 hover:border-blue-300 transition-all text-left"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                3. Estudio
              </span>
              <FileText className="w-3.5 h-3.5 text-blue-500 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">Tareas en Casa</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Deberes pendientes</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsReportCardModalOpen(true)}
            className="group flex flex-col p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-slate-200/60 dark:border-slate-700/60 hover:border-purple-300 transition-all text-left cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                4. Notas
              </span>
              <Award className="w-3.5 h-3.5 text-purple-500 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">Libreta CNEB</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Informe bimestral</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadFichaMatriculaPdf}
            className="group flex flex-col p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/60 dark:border-slate-700/60 hover:border-indigo-300 transition-all text-left cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                5. Matrícula
              </span>
              <Download className="w-3.5 h-3.5 text-indigo-500 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">Ficha Oficial</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Descargar PDF</span>
          </button>
        </div>
      </div>

      {/* ── 4. BANNER SECUNDARIO: TAREAS ESCOLARES (APRENDIZAJE EN CASA) ── */}
      <div className="relative overflow-hidden rounded-3xl sm:rounded-[32px] bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-blue-50/80 dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-900 border border-blue-200/70 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
        
        {/* Glow & Decorative elements */}
        <div className="absolute top-0 right-1/3 -mt-8 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Lado Izquierdo: Icono + Título + Píldoras */}
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-start gap-4">
              {/* Icono 3D de Libro Azul */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
                <BookOpen className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>

              <div className="space-y-1">
                {/* Badge Superior */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/90 dark:bg-blue-900/50 border border-blue-200/80 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase tracking-wider">
                  <BookOpen className="w-3 h-3" />
                  <span>Aprendizaje en Casa</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                  Tareas Escolares
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
                  Organiza y revisa las actividades escolares de tus hijos.
                </p>
              </div>
            </div>

            {/* 3 Chips Informativos */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 backdrop-blur-sm shadow-2xs">
                <div className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block leading-tight">Revisa y entrega</span>
                  <span className="text-[10px] text-slate-400 font-medium">sus tareas</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 backdrop-blur-sm shadow-2xs">
                <div className="w-7 h-7 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block leading-tight">Consulta fechas</span>
                  <span className="text-[10px] text-slate-400 font-medium">de vencimiento</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 backdrop-blur-sm shadow-2xs">
                <div className="w-7 h-7 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block leading-tight">Acompaña</span>
                  <span className="text-[10px] text-slate-400 font-medium">su progreso</span>
                </div>
              </div>
            </div>
          </div>

          {/* Lado Derecho: Frase Inspiradora, Ilustración y Botón */}
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center gap-4 shrink-0 justify-between lg:justify-end">
            
            {/* Frase / Cita */}
            <div className="text-center sm:text-left lg:text-center xl:text-left space-y-1">
              <span className="font-serif italic text-sm text-indigo-500 dark:text-indigo-300 font-bold block leading-tight">
                Pequeños esfuerzos,<br />grandes logros ♡
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-[180px] leading-tight">
                &ldquo;La disciplina de hoy es el éxito de mañana.&rdquo;
              </p>
            </div>

            {/* Mini Ilustración del Estudiante */}
            <div className="w-36 h-24 sm:w-40 sm:h-28 rounded-2xl overflow-hidden border border-indigo-200/80 dark:border-slate-700 shadow-md relative group shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/hero-tasks-student.jpg"
                alt="Tareas Escolares"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Botón de Acción */}
            <Link
              href="/apoderado/tareas"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-blue-600/25 transition-all hover:scale-102 active:scale-98 cursor-pointer shrink-0"
            >
              <span>Ver mis tareas</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

          </div>

        </div>
      </div>

      {/* ── 5. BENTO GRID EJECUTIVO DEL HIJO SELECCIONADO (SINGLE PANE OF GLASS) ── */}
      <div className="space-y-6">
        
        {/* Banner de Contexto del Hijo Seleccionado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-600/20">
              {currentChild?.nombre?.[0] || 'E'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Expediente Escolar de {currentChild ? `${currentChild.nombre} ${currentChild.apellidos}` : 'Estudiante'}
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 uppercase">
                  {currentChild?.grado_nombre || 'Grado'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Sección &quot;{currentChild?.seccion_letra || '-'}&quot; • Código: {activeStudent?.codigo_estudiante || '—'} • Tutor: {tutorDisplayName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsReportCardModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-black hover:bg-blue-100 transition-all cursor-pointer shadow-2xs"
            >
              <Award className="w-4 h-4 text-amber-500" />
              <span>Ver Libreta Oficial</span>
            </button>
            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black hover:bg-slate-200 transition-all cursor-pointer shadow-2xs"
            >
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Horario Completo</span>
            </button>
            <button
              onClick={() => setIsJustifyModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-black shadow-md shadow-pink-600/20 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Justificar Falta</span>
            </button>
          </div>
        </div>

        {/* Bento Grid Principal: 2 Columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* ── COLUMNA IZQUIERDA (7 de 12 Cols): NOTAS, ASISTENCIA SEMANAL Y TAREAS ── */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. Rendimiento por Cursos & Notas CNEB */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-900 dark:text-white">
                      Calificaciones por Asignatura (I Bimestre)
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium">Evaluación cualitativa según currículo CNEB</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsReportCardModalOpen(true)}
                  className="text-xs font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Ver boletín completo <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Lista de Asignaturas con Barra de Nivel de Logro */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {courses.slice(0, 6).map((course) => {
                  const courseCompetencyIds = course.competencias?.map(c => c.id) || [];
                  const courseGrades = studentGrades.filter(g => 
                    courseCompetencyIds.includes(g.competencia_id) || (g as any).curso_id === course.id
                  );
                  const grade = courseGrades[0]?.nota_letra;
                  const scoreNumber = grade === 'AD' ? 19 : grade === 'A' ? 16 : grade === 'B' ? 13 : grade === 'C' ? 10 : 0;
                  const progressPct = scoreNumber > 0 ? Math.round((scoreNumber / 20) * 100) : 0;

                  return (
                    <div key={course.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-slate-900 dark:text-white truncate">
                          {course.nombre}
                        </span>
                        {grade ? <GradeBadge grade={grade} size="sm" /> : <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">Sin nota</span>}
                      </div>

                      {/* Micro Progress Bar */}
                      <div className="space-y-1">
                        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              grade === 'AD' ? 'bg-indigo-600' : grade === 'A' ? 'bg-blue-500' : grade === 'B' ? 'bg-amber-500' : grade === 'C' ? 'bg-rose-500' : 'bg-slate-300'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                          <span>Logro: {grade === 'AD' ? 'Destacado' : grade === 'A' ? 'Esperado' : grade === 'B' ? 'En Proceso' : grade === 'C' ? 'En Inicio' : 'Sin evaluar'}</span>
                          <span className="font-bold">{scoreNumber > 0 ? `${scoreNumber}/20` : '—'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Monitor Semanal de Asistencia */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-900 dark:text-white">
                      Registro de Asistencia de la Semana
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium">Puntualidad acumulada: {attendanceRate}%</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsJustifyModalOpen(true)}
                  className="text-xs font-black text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Justificar falta <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 5 Days Dynamic Strip */}
              {studentAttendances.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No hay registros de asistencia recientes para el estudiante seleccionado.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
                  {[...studentAttendances].slice(-5).map((att, idx) => (
                    <div 
                      key={att.id || idx}
                      className={`p-3 rounded-2xl border transition-all ${
                        att.estado === 'presente'
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-900/40'
                          : att.estado === 'tardanza'
                            ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-900/40'
                            : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-900/40'
                      }`}
                    >
                      <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block">{att.fecha}</span>
                      <div className="my-1.5 flex items-center justify-center">
                        {att.estado === 'presente' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        )}
                      </div>
                      <span className="font-mono text-[9px] font-black text-slate-500 capitalize block">{att.estado}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Tareas y Actividades del Alumno */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-900 dark:text-white">
                      Agenda de Tareas &amp; Deberes Escolares
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium">Actividades académicas asignadas en plataforma</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-1 rounded-full border border-purple-200/60">
                    {studentTasks.filter(t => !submissions.some(s => s.tarea_id === t.id && s.matricula_id === activeEnrollment?.id)).length} Pendientes
                  </span>
                  <Link
                    href="/apoderado/tareas"
                    className="text-xs font-black text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-0.5 ml-1"
                  >
                    Ver panel <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <div className="space-y-3">
                {studentTasks.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No hay tareas asignadas en esta aula.</p>
                ) : (
                  studentTasks.slice(0, 3).map((task) => {
                    const courseObj = courses.find(c => c.id === task.curso_id);
                    const sub = submissions.find(s => s.tarea_id === task.id && s.matricula_id === activeEnrollment?.id);
                    const isSubmitted = !!sub;
                    return (
                      <div key={task.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase text-purple-600 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded-md border border-purple-200/60">
                              {courseObj?.nombre || 'Curso'}
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {task.titulo}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Vence: {task.fecha_limite} • Valor pedagógico
                          </p>
                        </div>

                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl shrink-0 ${
                          isSubmitted 
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                            : 'bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border border-pink-500/30'
                        }`}>
                          {isSubmitted ? '✓ Entregada' : '● Pendiente de Envío'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* ── COLUMNA DERECHA (5 de 12 Cols): CLASES DE HOY, CARNET QR Y TUTOR ── */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* 1. Clases del Día (Timeline Dinámico) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-900 dark:text-white">
                      Clases de Hoy ({todaySlots.length} Bloques)
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium">Turno Mañana • Salón &quot;{currentChild?.seccion_letra || 'A'}&quot;</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="text-xs font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Ver malla <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5">
                {todaySlots.length > 0 ? (
                  todaySlots.map((slot, idx) => {
                    const courseObj = courses.find(c => c.id === slot.curso_id);
                    const teacherObj = teachers.find(t => t.id === slot.docente_id);
                    return (
                      <div key={slot.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-black text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-600">
                            {slot.hora_inicio}
                          </span>
                          <div>
                            <span className="font-black text-xs text-slate-900 dark:text-white block">
                              {courseObj?.nombre || 'Clase Curricular'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium block">
                              {teacherObj ? `Prof. ${teacherObj.nombres.split(' ')[0]} ${teacherObj.apellidos.split(' ')[0]}` : 'Docente'} • {slot.aula || 'Aula 301'}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/40">
                          {slot.hora_fin}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">No hay clases registradas hoy.</p>
                )}
              </div>
            </div>

            {/* 2. Carnet Escolar QR (Mini Widget Rápido) */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white p-6 rounded-3xl border border-indigo-500/20 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/10 text-emerald-300 flex items-center justify-center font-black">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-white">
                      Carnet QR de Ingreso
                    </h4>
                    <p className="text-[10px] text-slate-300 font-medium">Pase oficial para control en portería</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsQrModalOpen(true)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
                  title="Ampliar carnet"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-white p-1.5 shrink-0 flex items-center justify-center">
                  <QrCode className="w-12 h-12 text-slate-900" />
                </div>
                <div className="space-y-1 min-w-0">
                  <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400 block">Identificador Oficial</span>
                  <span className="font-mono text-xs font-black text-white block">{activeStudent?.codigo_estudiante || '—'}</span>
                  <span className="text-[11px] text-slate-300 block truncate">{currentChild?.nombre} {currentChild?.apellidos}</span>
                </div>
              </div>

              <button
                onClick={() => setIsQrModalOpen(true)}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Credencial Digital</span>
              </button>
            </div>

            {/* 3. Ficha de Tutoría & Contacto */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md">
                  {currentTutor?.nombres?.[0] || 'D'}{currentTutor?.apellidos?.[0] || 'T'}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Tutor de Salón</span>
                  <h4 className="font-black text-sm text-slate-900 dark:text-white">
                    {currentTutor ? `Prof. ${currentTutor.nombres} ${currentTutor.apellidos}` : 'Docente Tutor por asignar'}
                  </h4>
                  <span className="text-[11px] text-slate-400 font-medium block">
                    {currentTutor ? 'Horario de Atención: Lun a Vie 8:00 AM - 1:00 PM' : 'Contacto institucional'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {currentTutor?.telefono ? (
                  <a
                    href={`tel:${currentTutor.telefono}`}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700"
                  >
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    <span>Llamar</span>
                  </a>
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 font-medium text-xs flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Sin teléfono</span>
                  </div>
                )}
                {currentTutor?.email ? (
                  <a
                    href={`mailto:${currentTutor.email}`}
                    className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Enviar Correo</span>
                  </a>
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 font-medium text-xs flex items-center justify-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Sin correo</span>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Próximas Evaluaciones / Exámenes */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-amber-500" />
                  <h4 className="font-black text-sm text-slate-900 dark:text-white">
                    Próximas Evaluaciones
                  </h4>
                </div>
                <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                  I Bimestre
                </span>
              </div>

              <div className="space-y-2">
                {studentExams.slice(0, 2).map((exam) => (
                  <div key={exam.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 dark:text-white">{exam.titulo}</span>
                      <span className="text-[10px] font-black text-amber-600">{exam.fecha_programada}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      Duración: {exam.duracion_minutos} min • Hora: {exam.hora_inicio || '08:00 AM'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* ── 6. SECCIÓN DE COMUNICADOS & CITACIONES OFICIALES (DIRIGIDO A ESTE SALÓN) ── */}
        <div id="comunicados-section" className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Boletín Oficial &amp; Citaciones Escolares</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                    {currentChild?.grado_nombre} &quot;{currentChild?.seccion_letra}&quot;
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">Avisos y citaciones oficiales emitidos por Dirección y Tutoría</p>
              </div>
            </div>
            <span className="text-xs text-slate-400 font-medium">Año Lectivo 2026</span>
          </div>

          {targetedAnnouncements.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
              No hay comunicados o citaciones pendientes para este grado y sección.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {targetedAnnouncements.map((ann) => {
                const isConfirmed = currentUser?.id && ann.confirmado_por?.includes(currentUser.id);
                const isCitacion = ann.categoria === 'citacion' || ann.tipo === 'citacion';
                const isUrgente = ann.tipo === 'urgente';

                const cardBgClass = isCitacion
                  ? 'bg-purple-50/60 dark:bg-purple-950/30 border-purple-200/80 dark:border-purple-900/40'
                  : isUrgente
                  ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-900/40'
                  : 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200/80 dark:border-blue-900/40';

                const badgeBgClass = isCitacion
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200'
                  : isUrgente
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200';

                return (
                  <div key={ann.id} className={`p-4 sm:p-5 rounded-2xl border ${cardBgClass} space-y-3 flex flex-col justify-between shadow-2xs`}>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md ${badgeBgClass}`}>
                          {isCitacion ? '📅 Citación a Padres' : isUrgente ? '⚠️ Comunicado Urgente' : '📢 Comunicado Oficial'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold">
                          {ann.fecha_publicacion || ann.creado_en?.substring(0, 10) || '2026'}
                        </span>
                      </div>

                      <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                        {ann.titulo}
                      </h4>

                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-line">
                        {ann.contenido}
                      </p>

                      {/* Detalles de Citación si aplica */}
                      {isCitacion && (ann.fecha_citacion || ann.lugar_citacion || ann.enlace_reunion) && (
                        <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-purple-200/60 dark:border-purple-800/40 space-y-1 text-xs text-purple-950 dark:text-purple-200">
                          {ann.fecha_citacion && (
                            <div className="flex items-center gap-1.5 font-bold">
                              <Calendar className="w-3.5 h-3.5 text-purple-600" />
                              <span>Fecha: {ann.fecha_citacion} {ann.hora_citacion ? `a las ${ann.hora_citacion}` : ''}</span>
                            </div>
                          )}
                          {ann.lugar_citacion && (
                            <div className="flex items-center gap-1.5 font-medium text-[11px] text-slate-600 dark:text-slate-400">
                              <MapPin className="w-3.5 h-3.5 text-slate-500" />
                              <span>Lugar: {ann.lugar_citacion}</span>
                            </div>
                          )}
                          {ann.enlace_reunion && (
                            <div className="pt-1">
                              <a
                                href={ann.enlace_reunion}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-black text-blue-600 hover:underline"
                              >
                                <span>🔗 Unirse a Sala Virtual (Google Meet / Zoom)</span>
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Acciones de Confirmación & Acuse de Recibo */}
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2">
                      <div className="text-[10px] text-slate-500">
                        {ann.requiere_confirmacion ? 'Requiere confirmación familiar' : 'Aviso informativo'}
                      </div>

                      {ann.requiere_confirmacion && (
                        isConfirmed ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs font-black">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Confirmado por ti</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => confirmAnnouncement(ann.id, currentUser?.id || 'apoderado-user')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black text-xs shadow-md shadow-indigo-600/20 cursor-pointer transition-all"
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
                            <span>Confirmar Asistencia</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: LIBRETA DE NOTAS OFICIAL (COMPLETA)                            */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {isReportCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-black">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Libreta Oficial de Calificaciones • {currentChild?.nombre} {currentChild?.apellidos}
                  </h3>
                  <p className="text-xs text-slate-500">{currentChild?.grado_nombre} • Sección &quot;{currentChild?.seccion_letra}&quot;</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadReportCardPdf}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs cursor-pointer flex items-center gap-1.5 shadow-md shadow-purple-600/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar PDF CNEB</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-black text-xs hover:bg-slate-800 cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
                <button
                  onClick={() => setIsReportCardModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <AnnualReportCardView reportCard={annualReportCard} showPrintButton={false} />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: HORARIO COMPLETO DE CLASES                                     */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-black">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Malla Horaria Semanal ({currentChild?.grado_nombre} &quot;{currentChild?.seccion_letra}&quot;)
                  </h3>
                  <p className="text-xs text-slate-500">Distribución de horas de Lunes a Viernes • Turno Mañana</p>
                </div>
              </div>

              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[650px] text-xs">
                <thead>
                  <tr>
                    <th className="p-2.5 text-center w-28 bg-slate-50 dark:bg-slate-800/60 font-black text-slate-700 dark:text-slate-300 rounded-l-xl">HORA</th>
                    {DAYS.map((d) => (
                      <th key={d.key} className="p-2.5 text-center font-black text-slate-800 dark:text-slate-200 uppercase">
                        {d.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {TIME_BLOCKS.map((block) => {
                    if (block.isBreak) {
                      return (
                        <tr key={block.id} className="bg-amber-50/60 dark:bg-amber-950/20">
                          <td className="p-2 text-center font-black text-amber-900 dark:text-amber-300">{block.inicio} - {block.fin}</td>
                          <td colSpan={5} className="p-2 text-center font-black text-amber-800 dark:text-amber-300 uppercase tracking-widest text-[11px]">
                            ☕ RECREO &amp; DESCANSO ESCOLAR
                          </td>
                        </tr>
                      );
                    }
                    return (
                      <tr key={block.id}>
                        <td className="p-2.5 text-center font-black text-slate-700 dark:text-slate-300">
                          <span>{block.label}</span>
                          <span className="block text-[10px] text-slate-400 font-mono font-medium">{block.inicio} - {block.fin}</span>
                        </td>
                        {DAYS.map((day) => {
                          const slot = studentSchedule.find(s => s.dia === day.key && s.hora_inicio === block.inicio);
                          const courseObj = courses.find(c => c.id === slot?.curso_id);
                          return (
                            <td key={day.key} className="p-1.5 text-center">
                              {slot ? (
                                <div className="p-2 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-left">
                                  <span className="font-black text-xs text-blue-950 dark:text-blue-200 block">{courseObj?.nombre || 'Clase'}</span>
                                  <span className="text-[10px] text-slate-500 font-medium block">{slot.aula || 'Aula 301'}</span>
                                </div>
                              ) : (
                                <span className="text-slate-300 dark:text-slate-700 text-xs font-bold">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 3: CARNET ESCOLAR QR DIGITAL                                      */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {isQrModalOpen && activeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black">
                  <QrCode className="w-4 h-4" />
                </div>
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  Carnet QR • {currentChild?.nombre}
                </h3>
              </div>
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-center">
              <QrCard
                student={activeStudent}
                section={activeEnrollment?.seccion}
                showActions={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 4: JUSTIFICACIÓN DE INASISTENCIA O TARDANZA                       */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {isJustifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-pink-100 dark:bg-pink-900/50 text-pink-600 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Justificar Falta o Tardanza
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Estudiante: {currentChild?.nombre} {currentChild?.apellidos}</p>
                </div>
              </div>
              <button
                onClick={() => setIsJustifyModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitJustification} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300">Fecha de la Inasistencia o Tardanza</label>
                <input
                  type="date"
                  required
                  value={justifyDate}
                  onChange={(e) => setJustifyDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-pink-500 outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300">Motivo de la Justificación</label>
                <select
                  value={justifyReason}
                  onChange={(e) => setJustifyReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-pink-500 outline-hidden"
                >
                  <option value="Salud / Cita médica">Salud / Cita médica con constancia</option>
                  <option value="Emergencia Familiar">Emergencia Familiar justificada</option>
                  <option value="Representación Deportiva o Académica">Representación Deportiva o Académica</option>
                  <option value="Motivos de Fuerza Mayor">Motivos de Fuerza Mayor</option>
                  <option value="Otro">Otro motivo</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300">Detalle / Explicación del Apoderado</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Escriba brevemente los detalles para el tutor de aula y secretaría..."
                  value={justifyDetails}
                  onChange={(e) => setJustifyDetails(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-pink-500 outline-hidden"
                />
              </div>

              <div className="p-3 rounded-xl bg-pink-50 dark:bg-pink-950/40 border border-pink-100 dark:border-pink-900/40 text-[11px] text-pink-700 dark:text-pink-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="font-medium">La justificación será enviada de inmediato a la bitácora del tutor para su aprobación en el sistema.</span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsJustifyModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-black shadow-md shadow-pink-600/20 cursor-pointer transition-all hover:scale-102"
                >
                  Enviar Justificación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
