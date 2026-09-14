'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { GradeBadge } from '@/components/notas/GradeBadge';
import { AnnualReportCardModal } from '@/components/notas/AnnualReportCardModal';
import { calculateAverage, calculateAnnualStatus, calculateStudentAnnualReportCard, StudentAnnualReportCard } from '@/lib/grades/calculations';
import { GradeLetter } from '@/types';
import { Download, FileSpreadsheet, Printer, FileText, Eye } from 'lucide-react';

export default function AdminReportesPage() {
  const { enrollments, grades, courses, evaluationPeriods, students } = useApp();
  const [selectedReportCard, setSelectedReportCard] = useState<StudentAnnualReportCard | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const reportData = enrollments.map((enr) => {
    const student = students.find(s => s.id === enr.estudiante_id) || enr.estudiante;
    const studentName = `${student?.profile?.apellidos || ''}, ${student?.profile?.nombres || ''}`;
    
    // Calculate student's overall average across all courses
    const studentGrades = grades.filter(g => g.matricula_id === enr.id).map(g => g.nota_letra);
    const { averageLetter, averageScore } = calculateAverage(studentGrades);
    const { status, statusColor } = calculateAnnualStatus(studentGrades);

    return {
      id: enr.id,
      enrollment: enr,
      student,
      codigo: student?.codigo_estudiante || '',
      nombre: studentName,
      gradoSeccion: `${enr.seccion?.grado?.nombre || ''} "${enr.seccion?.letra || ''}"`,
      promedioLetra: averageLetter,
      promedioNumerico: averageScore,
      estadoPromocion: status,
      estadoColor: statusColor,
    };
  });

  const handleOpenReportCard = (row: typeof reportData[0]) => {
    const card = calculateStudentAnnualReportCard({
      enrollmentId: row.id,
      studentId: row.student?.id || '',
      studentName: row.nombre,
      studentDni: row.student?.profile?.dni || '44556677',
      studentCode: row.codigo,
      gradeLevelName: row.enrollment?.seccion?.grado?.nombre || '3° de Primaria',
      sectionLetter: row.enrollment?.seccion?.letra || 'A',
      academicYear: 2026,
      tutorName: 'Lic. Carlos Alberto Mendoza Rojas',
      courses,
      grades,
      evaluationPeriodIds: evaluationPeriods.map(p => ({ id: p.id, numero_periodo: p.numero_periodo })),
      attendancePercentage: 98,
      conductGrade: 'AD',
    });

    setSelectedReportCard(card);
    setIsModalOpen(true);
  };

  const columns: Column<typeof reportData[0]>[] = [
    {
      header: 'Código',
      accessorKey: 'codigo',
      cell: (row) => <span className="font-mono font-bold text-slate-500">{row.codigo}</span>,
    },
    {
      header: 'Estudiante',
      accessorKey: 'nombre',
      cell: (row) => <span className="font-extrabold text-slate-900 dark:text-white">{row.nombre}</span>,
    },
    {
      header: 'Grado / Sección',
      accessorKey: 'gradoSeccion',
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
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black border ${row.estadoColor}`}>
          {row.estadoPromocion}
        </span>
      ),
    },
    {
      header: 'Libreta Final',
      cell: (row) => (
        <button
          onClick={() => handleOpenReportCard(row)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 transition-all active:scale-95 cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5" />
          Ver Libreta
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in-50">
      <PageHeader
        title="Reportes y Consolidado de Rendimiento"
        description="Boletín integral del progreso escolar, escala cualitativa y cálculo de promoción."
        badge="Año 2026"
      >
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 dark:bg-slate-800 text-white shadow-md hover:bg-slate-800 transition-all active:scale-95 cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          Imprimir Consolidado
        </button>
      </PageHeader>

      <DataTable
        data={reportData}
        columns={columns}
        searchPlaceholder="Filtrar estudiante o código..."
        searchFilter={(row, q) =>
          `${row.nombre} ${row.codigo} ${row.gradoSeccion}`.toLowerCase().includes(q)
        }
      />

      <AnnualReportCardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        reportCard={selectedReportCard}
      />
    </div>
  );
}

