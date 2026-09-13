'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { AttendanceRecord } from '@/types';
import { QrCode, CheckCircle2, Clock, Calendar } from 'lucide-react';

export default function EstudianteAsistenciasPage() {
  const { students, enrollments, attendances, currentUser } = useApp();

  const activeStudent = students.find(s => s.profile_id === currentUser.id) || students[0];
  const activeEnrollment = enrollments.find(e => e.estudiante_id === activeStudent.id) || enrollments[0];

  const myAttendances = attendances.filter(a => a.matricula_id === activeEnrollment?.id);

  const columns: Column<AttendanceRecord>[] = [
    {
      header: 'Fecha',
      accessorKey: 'fecha',
      cell: (att) => (
        <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-blue-500" />
          {att.fecha}
        </span>
      ),
    },
    {
      header: 'Hora de Registro',
      accessorKey: 'hora_registro',
      cell: (att) => <span className="font-mono text-slate-500">{att.hora_registro}</span>,
    },
    {
      header: 'Método',
      cell: (att) => (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          <QrCode className="w-3 h-3 text-emerald-500" />
          {att.metodo.toUpperCase()}
        </span>
      ),
    },
    {
      header: 'Estado',
      cell: (att) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${
          att.estado === 'presente'
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
        }`}>
          {att.estado}
        </span>
      ),
    },
    {
      header: 'Observación',
      cell: (att) => <span className="text-slate-400 text-xs">{att.observacion || '-'}</span>,
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in-50">
      <PageHeader
        title="Historial de Asistencias"
        description="Registro cronológico de tus ingresos escaneados mediante código QR."
        badge={`${myAttendances.length} Registros`}
      />

      <DataTable
        data={myAttendances}
        columns={columns}
        searchPlaceholder="Buscar por fecha..."
        searchFilter={(att, q) => att.fecha.toLowerCase().includes(q)}
      />
    </div>
  );
}
