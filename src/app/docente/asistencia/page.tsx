'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { QrScanner } from '@/components/qr/QrScanner';
import { AttendanceStatus } from '@/types';
import { CheckCircle2, Clock, XCircle, FileText, QrCode, Search, CheckCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function DocenteAsistenciaPage() {
  const { students, enrollments, attendances, registerAttendance, currentUser, getTeacherSections } = useApp();

  const teacherSections = getTeacherSections(currentUser.id);
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    teacherSections[0]?.seccion.id || enrollments[0]?.seccion_id || 'sec-3pri-a'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'presente' | 'tardanza' | 'falta' | 'sin_registro'>('todos');

  const activeSectionInfo = teacherSections.find(ts => ts.seccion.id === selectedSectionId)?.seccion 
    || enrollments.find(e => e.seccion_id === selectedSectionId)?.seccion;

  const filteredEnrollments = useMemo(() => {
    return enrollments.filter(e => e.seccion_id === selectedSectionId);
  }, [enrollments, selectedSectionId]);

  const activeEnrollments = filteredEnrollments.length > 0 ? filteredEnrollments : enrollments;

  const todayStr = new Date().toISOString().split('T')[0];

  const handleManualStatusChange = (matriculaId: string, status: AttendanceStatus) => {
    registerAttendance({
      matriculaId,
      status,
      metodo: 'manual',
    });
    if (status === 'presente') {
      confetti({
        particleCount: 20,
        spread: 40,
        origin: { y: 0.8 },
      });
    }
  };

  const handleMarkAllPresent = () => {
    activeEnrollments.forEach(enr => {
      registerAttendance({
        matriculaId: enr.id,
        status: 'presente',
        metodo: 'manual',
      });
    });

    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const badgeText = activeSectionInfo 
    ? `${activeSectionInfo.grado?.nombre || ''} "${activeSectionInfo.letra}"`
    : "Sección 3° 'A'";

  // Filtered list by query and status
  const displayedEnrollments = useMemo(() => {
    return activeEnrollments.filter(enr => {
      const fullName = `${enr.estudiante?.profile?.apellidos || ''} ${enr.estudiante?.profile?.nombres || ''} ${enr.estudiante?.codigo_estudiante || ''}`.toLowerCase();
      const matchesQuery = fullName.includes(searchQuery.toLowerCase());
      
      const att = attendances.find(a => a.matricula_id === enr.id && a.fecha === todayStr);
      if (statusFilter === 'todos') return matchesQuery;
      if (statusFilter === 'sin_registro') return matchesQuery && !att;
      return matchesQuery && att?.estado === statusFilter;
    });
  }, [activeEnrollments, searchQuery, statusFilter, attendances, todayStr]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in-50">
      <PageHeader
        title="Toma de Asistencia con Código QR & Manual"
        description="Escanea el carnet digital del alumno o utiliza los controles rápidos de asistencia de aula."
        badge={badgeText}
      />

      {/* Selector de Aula / Sección */}
      {teacherSections.length > 0 && (
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-x-auto">
          <span className="text-xs font-bold text-slate-400 px-2 shrink-0">Mis Salones:</span>
          {teacherSections.map(ts => (
            <button
              key={ts.seccion.id}
              onClick={() => setSelectedSectionId(ts.seccion.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedSectionId === ts.seccion.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {ts.seccion.grado?.nombre} &quot;{ts.seccion.letra}&quot; ({ts.seccion.grado?.nivel})
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Col: Camera QR Scanner */}
        <div className="lg:col-span-5">
          <QrScanner />
        </div>

        {/* Right Col: Today's Attendance List & Manual Overrides */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-base text-slate-800 dark:text-white">
                Padrón de Asistencia: {badgeText}
              </h3>
              <p className="text-xs text-slate-400">
                Fecha: <strong className="text-slate-700 dark:text-slate-300">{new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkAllPresent}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-bold border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer"
                title="Marcar a todos los alumnos de este salón como presentes hoy"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Marcar Todos
              </button>
              <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {activeEnrollments.length} alumnos
              </span>
            </div>
          </div>

          {/* Search Bar & Status Filter */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o código..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {(['todos', 'presente', 'tardanza', 'falta', 'sin_registro'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2 py-1 text-[11px] font-bold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {st === 'todos' ? 'Todos' : st === 'sin_registro' ? 'Pendientes' : st.charAt(0).toUpperCase() + st.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {displayedEnrollments.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No se encontraron estudiantes que coincidan con los filtros.
              </div>
            ) : (
              displayedEnrollments.map((enr) => {
                const fullName = `${enr.estudiante?.profile?.apellidos || ''}, ${enr.estudiante?.profile?.nombres || ''}`;
                const attRecord = attendances.find(
                  a => a.matricula_id === enr.id && a.fecha === todayStr
                );

                return (
                  <div
                    key={enr.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={enr.estudiante?.profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                        alt={fullName}
                        className="w-9 h-9 rounded-xl object-cover"
                      />
                      <div>
                        <p className="font-extrabold text-xs text-slate-800 dark:text-white">{fullName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {attRecord ? `Hora: ${attRecord.hora_registro} (${attRecord.metodo.toUpperCase()})` : 'Sin registro aún'}
                        </p>
                      </div>
                    </div>

                    {/* Fast Action Status Buttons */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleManualStatusChange(enr.id, 'presente')}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                          attRecord?.estado === 'presente'
                            ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/50'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Presente
                      </button>
                      <button
                        type="button"
                        onClick={() => handleManualStatusChange(enr.id, 'tardanza')}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                          attRecord?.estado === 'tardanza'
                            ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-400/50'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-50 hover:text-amber-700 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Tardanza
                      </button>
                      <button
                        type="button"
                        onClick={() => handleManualStatusChange(enr.id, 'falta')}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                          attRecord?.estado === 'falta'
                            ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-400/50'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-700 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Falta
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

