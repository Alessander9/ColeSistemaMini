'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, Column, FilterChip } from '@/components/ui/DataTable';
import { GradeBadge } from '@/components/notas/GradeBadge';
import { AnnualReportCardModal } from '@/components/notas/AnnualReportCardModal';
import { calculateAverage, calculateAnnualStatus, calculateStudentAnnualReportCard, StudentAnnualReportCard } from '@/lib/grades/calculations';
import { GradeLetter } from '@/types';
import { Download, FileSpreadsheet, Printer, FileText, Eye, Award, GraduationCap, ArrowRight } from 'lucide-react';
import { generateReportCardPdf } from '@/lib/pdf/reportCardPdfGenerator';
import { generateConsolidadoSalonPdf } from '@/lib/pdf/consolidadoSalonPdfGenerator';

export default function AdminReportesPage() {
  const { enrollments, grades, attendances, teachers, courses, evaluationPeriods, students, sections, brandingConfig, showToast } = useApp();
  const [selectedReportCard, setSelectedReportCard] = useState<StudentAnnualReportCard | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('todos');
  const [isExporting, setIsExporting] = useState(false);

  const reportData = useMemo(() => {
    return enrollments.map((enr) => {
      const student = students.find(s => s.id === enr.estudiante_id) || enr.estudiante;
      const studentName = `${student?.profile?.apellidos || student?.apellidos || ''}, ${student?.profile?.nombres || student?.nombres || ''}`.trim() || 'Estudiante';
      
      // Calculate student's overall average across all courses
      // Fix 1.4: Filtrar nota_letra nula antes de calcular promedio
      const studentGrades = grades
        .filter(g => g.matricula_id === enr.id && g.nota_letra != null)
        .map(g => g.nota_letra as GradeLetter);
      const { averageLetter, averageScore } = calculateAverage(studentGrades);
      const { status, statusColor } = calculateAnnualStatus(studentGrades);

      // SAT MINEDU: Attendance Risk (faltas > 30%)
      const studentAtts = attendances.filter(a => a.matricula_id === enr.id);
      const totalAtts = studentAtts.length;
      const faltas = studentAtts.filter(a => a.estado === 'falta').length;
      const pctFaltas = totalAtts > 0 ? (faltas / totalAtts) : 0;
      const hasAttendanceRisk = totalAtts >= 5 && pctFaltas >= 0.30;

      // SAT MINEDU: Academic Risk (3+ 'C' grades)
      const countC = studentGrades.filter(g => g === 'C').length;
      const hasAcademicRisk = countC >= 3;
      const isSatRisk = hasAttendanceRisk || hasAcademicRisk;

      return {
        id: enr.id,
        enrollment: enr,
        student,
        codigo: student?.codigo_estudiante || '',
        nombre: studentName,
        gradoSeccion: enr.seccion?.grado?.nombre ? `${enr.seccion.grado.nombre} "${enr.seccion.letra}"` : 'Sin aula',
        promedioLetra: averageLetter,
        promedioNumerico: averageScore,
        estadoPromocion: status,
        estadoColor: statusColor,
        isSatRisk,
        hasAttendanceRisk,
        hasAcademicRisk,
        countC,
        pctFaltas: Math.round(pctFaltas * 100),
      };
    });
  }, [enrollments, grades, students, attendances]);

  // Filter chips with dynamic counts
  const filterChips: FilterChip[] = useMemo(() => {
    const total = reportData.length;
    const promovidos = reportData.filter(r => r.estadoPromocion === 'PROMOVIDO').length;
    const recuperacion = reportData.filter(r => r.estadoPromocion === 'RECUPERACIÓN').length;
    const permanece = reportData.filter(r => r.estadoPromocion === 'PERMANECE').length;
    const satAlerta = reportData.filter(r => r.isSatRisk).length;
    const topMerito = reportData.filter(r => r.promedioNumerico >= 3.5).length;

    return [
      { id: 'todos', label: 'Todos los Alumnos', count: total },
      { id: 'MERITO', label: '🏆 Cuadro de Mérito (Top)', count: topMerito },
      { id: 'PROMOVIDO', label: '✅ Promovidos', count: promovidos },
      { id: 'RECUPERACIÓN', label: '⚠️ Recuperación', count: recuperacion },
      { id: 'PERMANECE', label: '🛑 Permanece', count: permanece },
      { id: 'SAT_ALERTA', label: '🚨 Alerta Temprana (MINEDU)', count: satAlerta },
    ];
  }, [reportData]);

  // Filtered dataset
  const filteredData = useMemo(() => {
    if (activeFilter === 'todos') return reportData;
    if (activeFilter === 'SAT_ALERTA') return reportData.filter(r => r.isSatRisk);
    if (activeFilter === 'MERITO') {
      return [...reportData]
        .sort((a, b) => b.promedioNumerico - a.promedioNumerico);
    }
    return reportData.filter(r => r.estadoPromocion === activeFilter);
  }, [reportData, activeFilter]);

  const handleOpenReportCard = (row: typeof reportData[0]) => {
    const studentAtts = attendances.filter(a => a.matricula_id === row.id);
    const attPct = studentAtts.length > 0 ? Math.round((studentAtts.filter(a => a.estado === 'presente').length / studentAtts.length) * 100) : 0;
    const tutorId = row.enrollment?.seccion?.tutor_id;
    const tutor = teachers.find(t => t.id === tutorId);
    const tutorName = tutor ? `${tutor.nombres} ${tutor.apellidos}` : 'No asignado';
    const conduct = row.promedioLetra || '—';

    const card = calculateStudentAnnualReportCard({
      enrollmentId: row.id,
      studentId: row.student?.id || '',
      studentName: row.nombre,
      studentDni: row.student?.profile?.dni || row.student?.dni || '—',
      studentCode: row.codigo || '—',
      gradeLevelName: row.enrollment?.seccion?.grado?.nombre || 'Sin aula asignada',
      sectionLetter: row.enrollment?.seccion?.letra || '-',
      academicYear: 2026,
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

  const handleDownloadReportCardPdf = async (row: typeof reportData[0]) => {
    const student = row.student;
    if (!student) {
      showToast('No se encontró el estudiante para generar la libreta', 'error');
      return;
    }
    try {
      showToast('Generando Libreta Oficial PDF...', 'info');
      const doc = await generateReportCardPdf({
        student,
        enrollment: row.enrollment,
        courses,
        grades,
        periods: evaluationPeriods,
        attendances,
        brandingConfig,
      });
      doc.save(`Libreta_CNEB_${row.codigo}_${row.nombre.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      showToast('Libreta PDF descargada exitosamente', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error al generar la libreta en PDF', 'error');
    }
  };

  const handleDownloadConsolidadoPdf = async () => {
    if (sections.length === 0 || evaluationPeriods.length === 0) {
      showToast('No hay secciones o periodos registrados', 'warning');
      return;
    }
    try {
      setIsExporting(true);
      showToast('Generando Acta Consolidada de Salón en PDF...', 'info');
      const targetSection = sections[0];
      const activePeriod = evaluationPeriods.find(p => p.activo) || evaluationPeriods[0];
      const sectionEnrollments = enrollments.filter(e => e.seccion_id === targetSection.id && e.estado === 'activo');

      const doc = await generateConsolidadoSalonPdf({
        section: targetSection,
        period: activePeriod,
        enrollments: sectionEnrollments.length > 0 ? sectionEnrollments : enrollments.slice(0, 15),
        courses,
        grades,
        brandingConfig,
      });
      doc.save(`Acta_Consolidada_${targetSection.grado?.nombre || 'Salon'}_${targetSection.letra}.pdf`);
      showToast('Acta Consolidada descargada exitosamente', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error al exportar acta consolidada', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const columns: Column<typeof reportData[0]>[] = [
    {
      header: 'Código',
      accessorKey: 'codigo',
      cell: (row) => <span className="font-mono font-bold text-slate-500 text-xs">{row.codigo}</span>,
    },
    {
      header: 'Estudiante',
      accessorKey: 'nombre',
      cell: (row) => <span className="font-extrabold text-slate-900 dark:text-white text-xs">{row.nombre}</span>,
    },
    {
      header: 'Grado / Sección',
      accessorKey: 'gradoSeccion',
      cell: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {row.gradoSeccion}
        </span>
      ),
    },
    {
      header: 'Promedio General',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <GradeBadge grade={row.promedioLetra} size="sm" />
          <span className="text-[11px] text-slate-400 font-mono">({row.promedioNumerico})</span>
        </div>
      ),
    },
    {
      header: 'Condición Anual',
      cell: (row) => (
        <div className="flex flex-col gap-1">
          <span className={`inline-flex items-center w-fit px-2.5 py-0.5 rounded-full text-[10px] font-black border ${row.estadoColor}`}>
            {row.estadoPromocion}
          </span>
          {row.isSatRisk && (
            <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
              🚨 SAT {row.hasAttendanceRisk ? `Ausentismo (${row.pctFaltas}%)` : `${row.countC} cursos 'C'`}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Libreta Oficial',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleOpenReportCard(row)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer"
            title="Ver en pantalla"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Ver</span>
          </button>
          <button
            onClick={() => handleDownloadReportCardPdf(row)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer"
            title="Descargar PDF oficial"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in-50 pb-12">
      <PageHeader
        title="Reportes y Consolidado de Rendimiento"
        description="Boletín integral del progreso escolar, escala cualitativa y cálculo de promoción según el CNEB."
        badge="Año Lectivo 2026"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadConsolidadoPdf}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Generando...' : '📄 Descargar Acta Consolidada PDF'}</span>
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 dark:bg-slate-800 text-white shadow-md hover:bg-slate-800 transition-all active:scale-95 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>
        </div>
      </PageHeader>

      <DataTable
        title="Padrón de Rendimiento & Promoción Anual"
        data={filteredData}
        columns={columns}
        filterChips={filterChips}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        searchPlaceholder="Buscar por nombre, código o grado..."
        itemsPerPage={10}
        searchFilter={(row, q) =>
          `${row.nombre} ${row.codigo} ${row.gradoSeccion} ${row.estadoPromocion}`.toLowerCase().includes(q)
        }
        gridItemRender={(row) => (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full group">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">
                    {row.nombre}
                  </h4>
                  <span className="text-[11px] font-mono font-bold text-slate-400">
                    {row.codigo}
                  </span>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black border ${row.estadoColor}`}>
                  {row.estadoPromocion}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Salón:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{row.gradoSeccion}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Promedio General:</span>
                  <div className="flex items-center gap-1.5">
                    <GradeBadge grade={row.promedioLetra} size="sm" />
                    <span className="text-[11px] font-mono text-slate-400">({row.promedioNumerico})</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-4">
              <button
                type="button"
                onClick={() => handleOpenReportCard(row)}
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 transition-all active:scale-95 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Ver Libreta Oficial</span>
              </button>
            </div>
          </div>
        )}
      />

      <AnnualReportCardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        reportCard={selectedReportCard}
      />
    </div>
  );
}
