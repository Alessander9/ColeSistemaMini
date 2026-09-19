'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { AttendanceRecord } from '@/types';
import { AttendanceHistoryHeader } from '@/components/estudiante/asistencias/AttendanceHistoryHeader';
import { AttendanceSummary } from '@/components/estudiante/asistencias/AttendanceSummary';
import { DateRangePicker, DateRange } from '@/components/estudiante/asistencias/DateRangePicker';
import { AttendanceFilters } from '@/components/estudiante/asistencias/AttendanceFilters';
import { AttendanceTable } from '@/components/estudiante/asistencias/AttendanceTable';
import { AttendanceDetailDrawer } from '@/components/estudiante/asistencias/AttendanceDetailDrawer';
import { EmptyAttendanceState } from '@/components/estudiante/asistencias/EmptyAttendanceState';
import { Pagination } from '@/components/estudiante/asistencias/Pagination';
import { AttendanceSkeleton } from '@/components/estudiante/asistencias/AttendanceSkeleton';
import { exportAttendanceToPDF, exportAttendanceToExcel } from '@/components/estudiante/asistencias/ExportAttendance';
import { Calendar, Info, ShieldCheck, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function EstudianteAsistenciasPage() {
  const { students, enrollments, attendances, currentUser, isLoading, showToast } = useApp();

  // Active student & enrollment
  const activeStudent = useMemo(() => {
    return students.find(s => s.profile_id === currentUser?.id) || students[0];
  }, [students, currentUser?.id]);

  const activeEnrollment = useMemo(() => {
    return enrollments.find(e => e.estudiante_id === activeStudent?.id) || enrollments[0];
  }, [enrollments, activeStudent?.id]);

  // All student attendances
  const myAttendances = useMemo(() => {
    if (!activeEnrollment?.id) return [];
    return attendances.filter(a => a.matricula_id === activeEnrollment.id);
  }, [attendances, activeEnrollment?.id]);

  // Date Range State (Default: Este mes: 01 sept. 2026 — 16 sept. 2026)
  const [dateRange, setDateRange] = useState<DateRange>({
    id: 'este_mes',
    label: '01 sept. 2026 — 16 sept. 2026',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
  });

  // Filter and Search States
  const [selectedFilter, setSelectedFilter] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Sorting
  const [sortField, setSortField] = useState<string>('fecha');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Detail Drawer State
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  // Filter by Date Range
  const rangeFilteredAttendances = useMemo(() => {
    return myAttendances.filter(att => {
      if (dateRange.startDate && att.fecha < dateRange.startDate) return false;
      if (dateRange.endDate && att.fecha > dateRange.endDate) return false;
      return true;
    });
  }, [myAttendances, dateRange]);

  // Counts for quick chips
  const counts = useMemo(() => {
    return {
      todos: rangeFilteredAttendances.length,
      presente: rangeFilteredAttendances.filter(a => a.estado === 'presente').length,
      tardanza: rangeFilteredAttendances.filter(a => a.estado === 'tardanza').length,
      falta: rangeFilteredAttendances.filter(a => a.estado === 'falta').length,
    };
  }, [rangeFilteredAttendances]);

  // Filter by Chip and Search Query
  const finalFilteredData = useMemo(() => {
    let list = rangeFilteredAttendances;

    // Filter chip
    if (selectedFilter !== 'todos') {
      list = list.filter(a => a.estado === selectedFilter);
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(a => {
        const fullString = `${a.fecha} ${a.hora_registro} ${a.estado} ${a.tipo_registro || ''} ${a.dispositivo || ''} ${a.observacion || ''}`.toLowerCase();
        return fullString.includes(q);
      });
    }

    // Sort
    return [...list].sort((a, b) => {
      let valA = a[sortField as keyof AttendanceRecord] || '';
      let valB = b[sortField as keyof AttendanceRecord] || '';
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [rangeFilteredAttendances, selectedFilter, searchQuery, sortField, sortOrder]);

  // Overall KPI metrics calculated
  const totalCount = rangeFilteredAttendances.length;
  const presentCount = counts.presente;
  const tardanzaCount = counts.tardanza;
  const faltaCount = counts.falta;
  const attendancePct = totalCount > 0 
    ? Math.round(((presentCount + tardanzaCount) / totalCount) * 100) 
    : (myAttendances.length > 0 ? 100 : 0);

  // Pagination Slice
  const totalPages = Math.ceil(finalFilteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return finalFilteredData.slice(start, start + itemsPerPage);
  }, [finalFilteredData, currentPage, itemsPerPage]);

  // Export handlers
  const handleExport = (format: 'pdf' | 'excel') => {
    if (finalFilteredData.length === 0) {
      showToast('No hay registros para exportar en la vista actual.', 'warning', 'Exportación');
      return;
    }

    if (format === 'pdf') {
      exportAttendanceToPDF(finalFilteredData, activeStudent, activeEnrollment, dateRange.label);
      showToast('Generando vista de impresión / PDF oficial.', 'info', 'Exportar PDF');
    } else {
      exportAttendanceToExcel(finalFilteredData, activeStudent, activeEnrollment, dateRange.label);
      showToast('Historial descargado en formato Excel / CSV.', 'success', 'Exportar Excel');
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  if (isLoading) {
    return <AttendanceSkeleton />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in-50 pb-12">
      {/* 1. Encabezado */}
      <AttendanceHistoryHeader onExport={handleExport} />

      {/* 2. Resumen de Asistencia (4 KPI Cards) */}
      <AttendanceSummary
        totalRecords={totalCount}
        presentCount={presentCount}
        tardanzaCount={tardanzaCount}
        faltaCount={faltaCount}
        attendancePct={attendancePct}
      />

      {/* 3. Bitácora de Ingresos & Asistencia (Main Container Card) */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 sm:p-6 space-y-5">
        {/* Section Top Header & Date Range Picker */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-800 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Bitácora de Ingresos & Asistencia
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Consulta el detalle de tus registros de entrada escaneados con código QR institucional.
              </p>
            </div>
          </div>

          <DateRangePicker
            selectedRange={dateRange}
            onSelectRange={(newRange) => {
              setDateRange(newRange);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Search & Quick Filters Bar */}
        <AttendanceFilters
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            setCurrentPage(1);
          }}
          selectedFilter={selectedFilter}
          onSelectFilter={(f) => {
            setSelectedFilter(f);
            setCurrentPage(1);
          }}
          counts={counts}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          totalResults={finalFilteredData.length}
        />

        {/* Table / Cards Content or Empty State */}
        {finalFilteredData.length === 0 ? (
          <EmptyAttendanceState
            onExpandDateRange={() => {
              setDateRange({
                id: 'todo_anio',
                label: 'Todo el año escolar 2026',
                startDate: '2026-03-01',
                endDate: '2026-12-20',
              });
              setSelectedFilter('todos');
              setSearchQuery('');
              setCurrentPage(1);
            }}
            onClearFilters={() => {
              setSelectedFilter('todos');
              setSearchQuery('');
              setCurrentPage(1);
            }}
          />
        ) : (
          <div className="space-y-4 pt-1">
            <AttendanceTable
              records={paginatedData}
              onViewDetail={(r) => setSelectedRecord(r)}
              viewMode={viewMode}
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={handleSort}
            />

            {/* Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={finalFilteredData.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        )}
      </div>

      {/* 4. Bottom Information & Action Banners */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/60 text-blue-900 dark:text-blue-200 flex-1">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="font-medium">
            Recuerda escanear tu código QR al ingresar a la institución para registrar tu asistencia.
          </span>
        </div>

        <Link
          href="/estudiante/carnet-qr"
          className="flex items-center justify-between sm:justify-start gap-2 px-4 py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold transition-all cursor-pointer group shrink-0"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Tu disciplina construye grandes oportunidades</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Detail Drawer Modal */}
      <AttendanceDetailDrawer
        record={selectedRecord}
        student={activeStudent}
        enrollment={activeEnrollment}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  );
}
