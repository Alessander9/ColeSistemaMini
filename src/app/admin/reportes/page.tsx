'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { DataTable, Column } from '@/components/ui/DataTable';
import { GradeBadge } from '@/components/notas/GradeBadge';
import { AnnualReportCardModal } from '@/components/notas/AnnualReportCardModal';
import { calculateAverage, calculateAnnualStatus, calculateStudentAnnualReportCard, StudentAnnualReportCard } from '@/lib/grades/calculations';
import { GradeLetter, Student } from '@/types';
import {
  Download,
  FileSpreadsheet,
  Printer,
  FileText,
  Eye,
  Award,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  BarChart3,
  LifeBuoy,
  Ban,
  BookOpen,
} from 'lucide-react';

// Se carga solo al generar el PDF (así jsPDF no pesa en la carga inicial de la página)
const generateReportCardPdf = async (...args: Parameters<typeof import('@/lib/pdf/reportCardPdfGenerator').generateReportCardPdf>) =>
  (await import('@/lib/pdf/reportCardPdfGenerator')).generateReportCardPdf(...args);
const downloadBatchReportCardsPdf = async (...args: Parameters<typeof import('@/lib/pdf/reportCardPdfGenerator').downloadBatchReportCardsPdf>) =>
  (await import('@/lib/pdf/reportCardPdfGenerator')).downloadBatchReportCardsPdf(...args);
// Se carga solo al generar el PDF (así jsPDF no pesa en la carga inicial de la página)
const generateConsolidadoSalonPdf = async (...args: Parameters<typeof import('@/lib/pdf/consolidadoSalonPdfGenerator').generateConsolidadoSalonPdf>) =>
  (await import('@/lib/pdf/consolidadoSalonPdfGenerator')).generateConsolidadoSalonPdf(...args);

type Situation = 'PROMOVIDO' | 'RECUPERACIÓN' | 'PERMANECE' | 'SIN_NOTAS';
type FilterId = 'todos' | Situation | 'MERITO' | 'SAT_ALERTA';

// Situación del alumno en palabras sencillas
const SITUATION: Record<Situation, { label: string; cls: string }> = {
  PROMOVIDO: { label: 'Va aprobando', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900' },
  RECUPERACIÓN: { label: 'Recuperación', cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900' },
  PERMANECE: { label: 'Permanece en el grado', cls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900' },
  SIN_NOTAS: { label: 'Sin notas aún', cls: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' },
};

const localIso = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function AdminReportesPage() {
  const { enrollments, grades, attendances, teachers, courses, evaluationPeriods, students, sections, brandingConfig, academicContext, showToast } = useApp();
  const [selectedReportCard, setSelectedReportCard] = useState<StudentAnnualReportCard | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterId>('todos');
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingBatchLibretas, setIsExportingBatchLibretas] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const year = academicContext?.anio || new Date().getFullYear();

  const sectionLabel = (id?: string) => {
    const s = sections.find(x => x.id === id);
    return s ? `${s.grado?.nombre || 'Grado'} "${s.letra}"` : 'Sin aula';
  };

  // ── Datos por alumno (solo matrículas vigentes) ──
  const reportData = useMemo(() => {
    // Índices por matrícula (antes se recorrían todas las notas y asistencias por cada alumno)
    const gradesByEnr = new Map<string, GradeLetter[]>();
    grades.forEach(g => { if (g.nota_letra != null) gradesByEnr.set(g.matricula_id, [...(gradesByEnr.get(g.matricula_id) || []), g.nota_letra as GradeLetter]); });
    const attsByEnr = new Map<string, { total: number; faltas: number }>();
    attendances.forEach(a => {
      const r = attsByEnr.get(a.matricula_id) || { total: 0, faltas: 0 };
      r.total++;
      if (a.estado === 'falta') r.faltas++;
      attsByEnr.set(a.matricula_id, r);
    });
    return enrollments.filter(e => e.estado === 'activo').map((enr) => {
      const student = students.find(s => s.id === enr.estudiante_id) || enr.estudiante;
      const studentName = `${student?.profile?.apellidos || student?.apellidos || ''}, ${student?.profile?.nombres || student?.nombres || ''}`.replace(/^, |, $/g, '').trim() || 'Estudiante';

      const studentGrades = gradesByEnr.get(enr.id) || [];
      const { averageLetter, averageScore } = calculateAverage(studentGrades);
      const situation: Situation = studentGrades.length === 0 ? 'SIN_NOTAS' : calculateAnnualStatus(studentGrades).status;

      // Alerta temprana (MINEDU): 30% o más de faltas, o 3 o más notas en C
      const att = attsByEnr.get(enr.id) || { total: 0, faltas: 0 };
      const pctFaltas = att.total > 0 ? att.faltas / att.total : 0;
      const hasAttendanceRisk = att.total >= 5 && pctFaltas >= 0.30;
      const countC = studentGrades.filter(g => g === 'C').length;
      const hasAcademicRisk = countC >= 3;

      return {
        id: enr.id,
        enrollment: enr,
        student,
        codigo: student?.codigo_estudiante || '',
        nombre: studentName,
        seccionId: enr.seccion_id,
        gradoSeccion: sectionLabel(enr.seccion_id),
        notas: studentGrades.length,
        promedioLetra: studentGrades.length > 0 ? averageLetter : null,
        promedioNumerico: studentGrades.length > 0 ? averageScore : 0,
        situation,
        isSatRisk: hasAttendanceRisk || hasAcademicRisk,
        hasAttendanceRisk,
        hasAcademicRisk,
        countC,
        pctFaltas: Math.round(pctFaltas * 100),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrollments, grades, students, attendances, sections]);
  type Row = typeof reportData[0];

  const counts = useMemo(() => ({
    todos: reportData.length,
    PROMOVIDO: reportData.filter(r => r.situation === 'PROMOVIDO').length,
    RECUPERACIÓN: reportData.filter(r => r.situation === 'RECUPERACIÓN').length,
    PERMANECE: reportData.filter(r => r.situation === 'PERMANECE').length,
    SIN_NOTAS: reportData.filter(r => r.situation === 'SIN_NOTAS').length,
    MERITO: reportData.filter(r => r.promedioNumerico >= 3.5).length,
    SAT_ALERTA: reportData.filter(r => r.isSatRisk).length,
  }), [reportData]);

  const filteredData = useMemo(() => {
    const byName = (a: Row, b: Row) => a.nombre.localeCompare(b.nombre);
    if (activeFilter === 'todos') return [...reportData].sort(byName);
    if (activeFilter === 'SAT_ALERTA') return reportData.filter(r => r.isSatRisk).sort(byName);
    if (activeFilter === 'MERITO') return reportData.filter(r => r.promedioNumerico >= 3.5).sort((a, b) => b.promedioNumerico - a.promedioNumerico);
    return reportData.filter(r => r.situation === activeFilter).sort(byName);
  }, [reportData, activeFilter]);

  // ── Acta consolidada: el administrador elige aula y bimestre ──
  const todayIso = localIso();
  const currentPeriod = evaluationPeriods.find(p => p.fecha_inicio <= todayIso && todayIso <= p.fecha_fin) || evaluationPeriods.find(p => p.activo) || evaluationPeriods[0];
  const sectionsWithStudents = useMemo(
    () => sections
      .map(s => ({ s, n: enrollments.filter(e => e.seccion_id === s.id && e.estado === 'activo').length }))
      .filter(x => x.n > 0)
      .sort((a, b) => (a.s.grado?.nivel || '').localeCompare(b.s.grado?.nivel || '') || (a.s.grado?.numero_grado ?? 0) - (b.s.grado?.numero_grado ?? 0) || a.s.letra.localeCompare(b.s.letra)),
    [sections, enrollments]
  );
  const [actaSectionId, setActaSectionId] = useState('');
  const [actaPeriodId, setActaPeriodId] = useState('');
  const actaSection = sections.find(s => s.id === (actaSectionId || sectionsWithStudents[0]?.s.id));
  const actaPeriod = evaluationPeriods.find(p => p.id === actaPeriodId) || currentPeriod;

  const scrollToList = (focusSearch = false) => {
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (focusSearch) setTimeout(() => listRef.current?.querySelector('input')?.focus(), 350);
  };
  const pickFilter = (id: FilterId) => {
    setActiveFilter(prev => (prev === id && id !== 'todos' ? 'todos' : id));
  };

  const handleOpenReportCard = (row: Row) => {
    const studentAtts = attendances.filter(a => a.matricula_id === row.id);
    const attPct = studentAtts.length > 0 ? Math.round((studentAtts.filter(a => a.estado === 'presente').length / studentAtts.length) * 100) : 0;
    const sec = sections.find(s => s.id === row.seccionId) || row.enrollment?.seccion;
    const tutor = teachers.find(t => t.id === sec?.tutor_id);
    const tutorName = tutor ? `${tutor.nombres} ${tutor.apellidos}` : 'No asignado';

    const card = calculateStudentAnnualReportCard({
      enrollmentId: row.id,
      studentId: row.student?.id || '',
      studentName: row.nombre,
      studentDni: row.student?.profile?.dni || row.student?.dni || '—',
      studentCode: row.codigo || '—',
      gradeLevelName: sec?.grado?.nombre || 'Sin aula asignada',
      sectionLetter: sec?.letra || '-',
      academicYear: year,
      tutorName,
      courses,
      grades,
      evaluationPeriodIds: evaluationPeriods.map(p => ({ id: p.id, numero_periodo: p.numero_periodo })),
      attendancePercentage: attPct,
      conductGrade: row.promedioLetra || undefined,
    });

    setSelectedReportCard(card);
    setIsModalOpen(true);
  };

  const handleDownloadReportCardPdf = async (row: Row) => {
    const student = row.student;
    if (!student) {
      showToast('No se encontró el alumno para generar la libreta', 'error');
      return;
    }
    try {
      showToast('Preparando la libreta en PDF...', 'info');
      const doc = await generateReportCardPdf({
        student,
        enrollment: row.enrollment,
        courses,
        grades,
        periods: evaluationPeriods,
        attendances,
        brandingConfig,
      });
      doc.save(`Libreta_${row.codigo}_${row.nombre.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      showToast('Libreta descargada', 'success');
    } catch (err) {
      console.error(err);
      showToast('No se pudo generar la libreta en PDF', 'error');
    }
  };

  const handleDownloadConsolidadoPdf = async () => {
    if (!actaSection || !actaPeriod) {
      showToast('Primero elige el aula y el bimestre', 'warning');
      return;
    }
    const sectionEnrollments = enrollments.filter(e => e.seccion_id === actaSection.id && e.estado === 'activo');
    if (sectionEnrollments.length === 0) {
      showToast('Esta aula no tiene alumnos matriculados', 'warning');
      return;
    }
    try {
      setIsExporting(true);
      showToast(`Preparando el acta de ${sectionLabel(actaSection.id)}...`, 'info');
      const doc = await generateConsolidadoSalonPdf({
        section: actaSection,
        period: actaPeriod,
        enrollments: sectionEnrollments,
        courses,
        grades,
        brandingConfig,
      });
      doc.save(`Acta_${actaSection.grado?.nombre || 'Aula'}_${actaSection.letra}_${actaPeriod.nombre}.pdf`.replace(/\s+/g, '_'));
      showToast('Acta descargada', 'success');
    } catch (err) {
      console.error(err);
      showToast('No se pudo generar el acta', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadBatchLibretasPdf = async () => {
    if (!actaSection) {
      showToast('Primero elige el aula para descargar las libretas', 'warning');
      return;
    }
    const sectionEnrollments = enrollments.filter(e => e.seccion_id === actaSection.id && e.estado === 'activo');
    if (sectionEnrollments.length === 0) {
      showToast('Esta aula no tiene alumnos matriculados', 'warning');
      return;
    }
    try {
      setIsExportingBatchLibretas(true);
      showToast(`Generando libretas oficiales en lote para ${sectionLabel(actaSection.id)} (${sectionEnrollments.length} alumnos)...`, 'info');

      const tutorObj = actaSection.tutor_id ? teachers.find(t => t.id === actaSection.tutor_id) : undefined;
      const tutorFullName = tutorObj ? `${tutorObj.nombres} ${tutorObj.apellidos}` : undefined;

      const items = sectionEnrollments.map(enr => {
        const student = (students.find(s => s.id === enr.estudiante_id) || enr.estudiante || {
          id: enr.estudiante_id,
          profile_id: enr.estudiante_id,
          codigo_estudiante: `EST-${enr.estudiante_id.slice(-6)}`,
          nombres: 'Estudiante',
          apellidos: 'Escolar',
        }) as Student;
        const studentAttendances = attendances.filter(a => a.matricula_id === enr.id);
        const studentGrades = grades.filter(g => g.matricula_id === enr.id);

        return {
          student,
          enrollment: enr,
          courses,
          grades: studentGrades,
          periods: evaluationPeriods,
          attendances: studentAttendances,
          brandingConfig,
          tutorName: tutorFullName,
        };
      });

      await downloadBatchReportCardsPdf({
        items,
        sectionName: `${actaSection.grado?.nombre || 'Aula'}_${actaSection.letra}`,
        anioLectivo: String(year),
      });

      showToast(`¡Consolidado de ${items.length} libretas descargado con éxito!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('No se pudieron generar las libretas en lote', 'error');
    } finally {
      setIsExportingBatchLibretas(false);
    }
  };

  const situationBadge = (row: Row) => (
    <div className="flex flex-col gap-1">
      <span className={`inline-flex items-center w-fit px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${SITUATION[row.situation].cls}`}>
        {SITUATION[row.situation].label}
      </span>
      {row.isSatRisk && (
        <span className="inline-flex items-center gap-1 w-fit text-[11px] font-semibold text-rose-600 dark:text-rose-400">
          <AlertTriangle className="w-3 h-3" /> {row.hasAttendanceRisk ? `Falta mucho (${row.pctFaltas}% de faltas)` : `${row.countC} notas en C`}
        </span>
      )}
    </div>
  );

  const libretaButtons = (row: Row, full = false) => (
    <div className={`flex items-center gap-1.5 ${full ? 'w-full' : ''}`}>
      <button
        type="button"
        onClick={() => handleOpenReportCard(row)}
        className={`inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300 transition-all cursor-pointer ${full ? 'flex-1' : ''}`}
        title="Ver la libreta en pantalla"
      >
        <Eye className="w-3.5 h-3.5" /> Ver libreta
      </button>
      <button
        type="button"
        onClick={() => handleDownloadReportCardPdf(row)}
        className={`inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 transition-all cursor-pointer ${full ? 'flex-1' : ''}`}
        title="Descargar la libreta en PDF"
      >
        <Download className="w-3.5 h-3.5" /> PDF
      </button>
    </div>
  );

  const columns: Column<Row>[] = [
    {
      header: 'Alumno',
      accessorKey: 'nombre',
      cell: (row) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white text-sm">{row.nombre}</p>
          <p className="text-[11px] font-mono text-slate-400">{row.codigo}</p>
        </div>
      ),
    },
    {
      header: 'Aula',
      accessorKey: 'gradoSeccion',
      cell: (row) => <span className="inline-flex px-2 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{row.gradoSeccion}</span>,
    },
    {
      header: 'Promedio',
      cell: (row) => row.promedioLetra ? (
        <div className="flex items-center gap-2">
          <GradeBadge grade={row.promedioLetra} size="sm" />
          <span className="text-[11px] text-slate-400">{row.notas} {row.notas === 1 ? 'nota' : 'notas'}</span>
        </div>
      ) : <span className="text-xs text-slate-400">—</span>,
    },
    { header: 'Situación', cell: situationBadge },
    { header: 'Libreta', cell: (row) => libretaButtons(row) },
  ];

  const summaryCards: { id: FilterId; label: string; hint: string; icon: React.ElementType; tone: string; ring: string }[] = [
    { id: 'todos', label: 'Todos los alumnos', hint: 'matriculados este año', icon: Users, tone: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300', ring: 'ring-indigo-500' },
    { id: 'PROMOVIDO', label: 'Van aprobando', hint: 'sin cursos en C', icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300', ring: 'ring-emerald-500' },
    { id: 'RECUPERACIÓN', label: 'Recuperación', hint: 'promedio B con algún C', icon: LifeBuoy, tone: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300', ring: 'ring-amber-500' },
    { id: 'PERMANECE', label: 'Permanecen', hint: 'promedio general C', icon: Ban, tone: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300', ring: 'ring-rose-500' },
    { id: 'MERITO', label: 'Cuadro de mérito', hint: 'promedio AD', icon: Award, tone: 'bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300', ring: 'ring-violet-500' },
    { id: 'SIN_NOTAS', label: 'Sin notas aún', hint: 'todavía no evaluados', icon: Clock, tone: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300', ring: 'ring-slate-400' },
  ];
  const activeCard = [...summaryCards, { id: 'SAT_ALERTA' as FilterId, label: 'Necesitan apoyo' }].find(c => c.id === activeFilter);

  const selectCls = 'w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer';

  return (
    <div className="space-y-5 max-w-7xl mx-auto animate-in fade-in-50 pb-12">

      {/* ── 1. ENCABEZADO ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-emerald-500 to-rose-400" />
        <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Año escolar {year}{currentPeriod ? ` · ${currentPeriod.nombre}` : ''}
            </span>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-indigo-600" /> Reportes
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Descarga las libretas de notas y las actas de cada aula, y revisa qué alumnos van aprobando y cuáles necesitan apoyo.
            </p>
          </div>
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:border-slate-400 cursor-pointer shrink-0">
            <Printer className="w-4 h-4" /> Imprimir
          </button>
        </div>
      </div>

      {/* ── 2. ¿QUÉ NECESITAS? ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Libreta de un alumno */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0"><FileText className="w-5 h-5" /></span>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">Libreta de un alumno</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Notas de todos sus cursos y bimestres</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 flex-1">Busca al alumno en la lista y toca <strong>Ver libreta</strong> o <strong>PDF</strong>.</p>
          <button type="button" onClick={() => scrollToList(true)} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold cursor-pointer">
            <Search className="w-4 h-4" /> Buscar alumno
          </button>
        </div>

        {/* Acta consolidada de un aula */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0"><FileSpreadsheet className="w-5 h-5" /></span>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">Acta de un aula</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Las notas de todos los alumnos del aula en un PDF</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 flex-1">
            <select value={actaSection?.id || ''} onChange={(e) => setActaSectionId(e.target.value)} className={selectCls} aria-label="Aula del acta">
              {sectionsWithStudents.length === 0 && <option value="">Sin aulas con alumnos</option>}
              {sectionsWithStudents.map(({ s, n }) => <option key={s.id} value={s.id}>{sectionLabel(s.id)} ({n})</option>)}
            </select>
            <select value={actaPeriod?.id || ''} onChange={(e) => setActaPeriodId(e.target.value)} className={selectCls} aria-label="Bimestre del acta">
              {evaluationPeriods.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button type="button" onClick={handleDownloadConsolidadoPdf} disabled={isExporting || isExportingBatchLibretas || !actaSection} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer transition-all">
              <Download className="w-4 h-4" /> {isExporting ? 'Preparando...' : 'Descargar Acta'}
            </button>
            <button type="button" onClick={handleDownloadBatchLibretasPdf} disabled={isExporting || isExportingBatchLibretas || !actaSection} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer transition-all" title="Descarga las libretas oficiales de todos los alumnos de esta aula en un solo PDF consolidado">
              <BookOpen className="w-4 h-4" /> {isExportingBatchLibretas ? 'Generando...' : 'Libretas en Lote'}
            </button>
          </div>
        </div>

        {/* Alumnos que necesitan apoyo */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0"><AlertTriangle className="w-5 h-5" /></span>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">Alumnos que necesitan apoyo</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Alerta temprana del MINEDU</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 flex-1">
            <strong className={`text-2xl font-black mr-1 ${counts.SAT_ALERTA > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{counts.SAT_ALERTA}</strong>
            {counts.SAT_ALERTA === 1 ? 'alumno tiene' : 'alumnos tienen'} 3 o más notas en C o faltan al 30% de las clases.
          </p>
          <button
            type="button"
            onClick={() => { setActiveFilter('SAT_ALERTA'); scrollToList(); }}
            disabled={counts.SAT_ALERTA === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 disabled:opacity-50 text-sm font-bold cursor-pointer"
          >
            {counts.SAT_ALERTA > 0 ? 'Ver quiénes son' : 'Nadie en riesgo por ahora'}
          </button>
        </div>
      </div>

      {/* ── 3. RESUMEN (cada tarjeta filtra la lista) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {summaryCards.map(k => {
          const active = activeFilter === k.id;
          return (
            <button
              key={k.id}
              type="button"
              aria-pressed={active}
              onClick={() => pickFilter(k.id)}
              className={`text-left p-3.5 rounded-2xl bg-white dark:bg-slate-900 border shadow-xs hover:shadow-md transition-all cursor-pointer ${active ? `border-transparent ring-2 ${k.ring}` : 'border-slate-200/80 dark:border-slate-800'}`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${k.tone}`}><k.icon className="w-5 h-5" /></span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">{counts[k.id as keyof typeof counts]}</span>
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-2">{k.label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{k.hint}</p>
            </button>
          );
        })}
      </div>

      {/* ── 4. LISTA DE ALUMNOS ── */}
      <div ref={listRef} className="scroll-mt-20">
        <DataTable
          title={activeFilter === 'todos' ? 'Alumnos y sus libretas' : `Alumnos · ${activeCard?.label || ''}`}
          actions={activeFilter !== 'todos' ? (
            <button type="button" onClick={() => setActiveFilter('todos')} className="px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 cursor-pointer">
              Ver todos
            </button>
          ) : undefined}
          data={filteredData}
          columns={columns}
          searchPlaceholder="Buscar alumno por nombre, código o aula..."
          emptyMessage="No hay alumnos en este grupo."
          itemsPerPage={10}
          searchFilter={(row, q) => `${row.nombre} ${row.codigo} ${row.gradoSeccion} ${SITUATION[row.situation].label}`.toLowerCase().includes(q)}
          gridItemRender={(row) => (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col gap-3 h-full">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">{row.nombre}</h4>
                  <p className="text-xs text-slate-500">{row.gradoSeccion}</p>
                </div>
                {row.promedioLetra ? <GradeBadge grade={row.promedioLetra} size="sm" /> : <span className="text-xs text-slate-400">—</span>}
              </div>
              {situationBadge(row)}
              <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">{libretaButtons(row, true)}</div>
            </div>
          )}
        />
      </div>

      <AnnualReportCardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        reportCard={selectedReportCard}
      />
    </div>
  );
}
