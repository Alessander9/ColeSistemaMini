'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, Column, FilterChip } from '@/components/ui/DataTable';
import { AttendanceRecord } from '@/types';
import { QrCode, CheckCircle2, Clock, Calendar, AlertCircle, ShieldCheck, XCircle } from 'lucide-react';

export default function EstudianteAsistenciasPage() {
  const { students, enrollments, attendances, currentUser } = useApp();
  const [selectedFilter, setSelectedFilter] = useState<string>('todos');

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

  // Integrated Filter Chips
  const filterChips: FilterChip[] = useMemo(() => [
    { id: 'todos', label: 'Todos los Registros', count: totalCount },
    { id: 'presente', label: '✅ Puntuales', count: presentCount },
    { id: 'tardanza', label: '⏰ Tardanzas', count: tardanzaCount },
    { id: 'falta', label: '❌ Faltas', count: faltaCount },
  ], [totalCount, presentCount, tardanzaCount, faltaCount]);

  const filteredData = useMemo(() => {
    if (selectedFilter === 'todos') return myAttendances;
    return myAttendances.filter(a => a.estado === selectedFilter);
  }, [myAttendances, selectedFilter]);

  const columns: Column<AttendanceRecord>[] = [
    {
      header: 'Fecha',
      accessorKey: 'fecha',
      cell: (att) => (
        <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 text-xs">
          <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          {att.fecha}
        </span>
      ),
    },
    {
      header: 'Hora de Ingreso',
      accessorKey: 'hora_registro',
      cell: (att) => (
        <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold text-xs">
          {att.hora_registro}
        </span>
      ),
    },
    {
      header: 'Método',
      cell: (att) => (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <QrCode className="w-3 h-3 text-emerald-500" />
          {att.metodo.toUpperCase()}
        </span>
      ),
    },
    {
      header: 'Estado',
      cell: (att) => (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
          att.estado === 'presente'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
            : att.estado === 'tardanza'
            ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
            : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
        }`}>
          {att.estado === 'presente' ? <CheckCircle2 className="w-3 h-3" /> : att.estado === 'tardanza' ? <Clock className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
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
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in-50 pb-12">
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

      <DataTable
        title="Bitácora de Ingresos & Asistencia"
        data={filteredData}
        columns={columns}
        filterChips={filterChips}
        activeFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
        searchPlaceholder="Buscar por fecha (AAAA-MM-DD)..."
        itemsPerPage={10}
        searchFilter={(att, q) => `${att.fecha} ${att.hora_registro} ${att.estado} ${att.metodo}`.toLowerCase().includes(q)}
        gridItemRender={(att) => (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full group">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 text-xs">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  {att.fecha}
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                  att.estado === 'presente'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                    : att.estado === 'tardanza'
                    ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                    : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                }`}>
                  {att.estado}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Hora de Registro:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{att.hora_registro}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Método:</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <QrCode className="w-3 h-3" />
                    {att.metodo.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic pt-2 border-t border-slate-100 dark:border-slate-800 mt-3">
              {att.observacion || 'Registro automático de portería'}
            </p>
          </div>
        )}
      />
    </div>
  );
}
