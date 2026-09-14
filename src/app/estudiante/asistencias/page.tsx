'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { AttendanceRecord } from '@/types';
import { QrCode, CheckCircle2, Clock, Calendar, AlertCircle, ShieldCheck } from 'lucide-react';

export default function EstudianteAsistenciasPage() {
  const { students, enrollments, attendances, currentUser } = useApp();
  const [selectedFilter, setSelectedFilter] = useState<'todos' | 'presente' | 'tardanza' | 'falta'>('todos');

  const activeStudent = students.find(s => s.profile_id === currentUser.id) || students[0];
  const activeEnrollment = enrollments.find(e => e.estudiante_id === activeStudent?.id) || enrollments[0];

  const myAttendances = useMemo(() => {
    return attendances.filter(a => a.matricula_id === activeEnrollment?.id);
  }, [attendances, activeEnrollment?.id]);

  const presentCount = myAttendances.filter(a => a.estado === 'presente').length;
  const tardanzaCount = myAttendances.filter(a => a.estado === 'tardanza').length;
  const faltaCount = myAttendances.filter(a => a.estado === 'falta').length;
  const totalCount = myAttendances.length;
  const attendancePct = totalCount > 0 ? Math.round(((presentCount + tardanzaCount) / totalCount) * 100) : 100;

  const filteredData = useMemo(() => {
    if (selectedFilter === 'todos') return myAttendances;
    return myAttendances.filter(a => a.estado === selectedFilter);
  }, [myAttendances, selectedFilter]);

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
      cell: (att) => <span className="font-mono text-slate-600 dark:text-slate-300 font-semibold">{att.hora_registro}</span>,
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
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${
          att.estado === 'presente'
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
            : att.estado === 'tardanza'
            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
            : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
        }`}>
          {att.estado === 'presente' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
          {att.estado}
        </span>
      ),
    },
    {
      header: 'Observación',
      cell: (att) => <span className="text-slate-400 text-xs italic">{att.observacion || 'Sin observaciones'}</span>,
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in-50">
      <PageHeader
        title="Historial de Asistencias"
        description="Registro cronológico de tus ingresos escaneados mediante código QR institucional."
        badge={`${myAttendances.length} Registros Totales`}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Asistencia Global</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-600 block mt-0.5">{attendancePct}%</span>
          <span className="text-[10px] text-slate-400 font-medium">Índice de permanencia</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Puntuales</span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white block mt-0.5">{presentCount}</span>
          <span className="text-[10px] text-emerald-600 font-medium">Ingresos a tiempo</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tardanzas</span>
          <span className="text-xl sm:text-2xl font-black text-amber-500 block mt-0.5">{tardanzaCount}</span>
          <span className="text-[10px] text-amber-500 font-medium">Ingresos demorados</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inasistencias</span>
          <span className="text-xl sm:text-2xl font-black text-rose-500 block mt-0.5">{faltaCount}</span>
          <span className="text-[10px] text-rose-500 font-medium">Faltas acumuladas</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-fit border border-slate-200 dark:border-slate-700">
        {(['todos', 'presente', 'tardanza', 'falta'] as const).map(f => (
          <button
            key={f}
            onClick={() => setSelectedFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedFilter === f
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {f === 'todos' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1) + 's'}
          </button>
        ))}
      </div>

      <DataTable
        data={filteredData}
        columns={columns}
        searchPlaceholder="Buscar por fecha..."
        searchFilter={(att, q) => att.fecha.toLowerCase().includes(q)}
      />
    </div>
  );
}

