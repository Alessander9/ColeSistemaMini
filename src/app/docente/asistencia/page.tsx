'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { AttendanceStatus } from '@/types';
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  FileText, 
  QrCode, 
  Search, 
  CheckCheck,
  Check,
  Sparkles,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { QrScanner } from '@/components/qr/QrScanner';

export default function DocenteAsistenciaPage() {
  const { 
    students, 
    enrollments, 
    attendances, 
    registerAttendance, 
    currentUser, 
    getTeacherSections,
    saveClassAttendanceQuickly,
    showToast 
  } = useApp();

  const teacherSections = getTeacherSections(currentUser.id);
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    teacherSections[0]?.seccion.id || enrollments[0]?.seccion_id || 'sec-3pri-a'
  );

  const [viewMode, setViewMode] = useState<'lista' | 'qr'>('lista');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  const activeSectionInfo = teacherSections.find(ts => ts.seccion.id === selectedSectionId)?.seccion 
    || enrollments.find(e => e.seccion_id === selectedSectionId)?.seccion;

  const filteredEnrollments = useMemo(() => {
    return enrollments.filter(e => e.seccion_id === selectedSectionId && e.estado === 'activo');
  }, [enrollments, selectedSectionId]);

  const activeEnrollments = filteredEnrollments.length > 0 ? filteredEnrollments : enrollments.slice(0, 8);
  const todayStr = new Date().toISOString().split('T')[0];

  // Local exception map for ultra-fast modification
  const [statusOverrides, setStatusOverrides] = useState<Record<string, AttendanceStatus>>({});

  const getStudentStatus = (matriculaId: string): AttendanceStatus => {
    if (statusOverrides[matriculaId]) return statusOverrides[matriculaId];
    const existing = attendances.find(a => a.matricula_id === matriculaId && a.fecha === todayStr);
    return existing ? existing.estado : 'presente';
  };

  const handleSetStatus = (matriculaId: string, status: AttendanceStatus) => {
    setStatusOverrides(prev => ({ ...prev, [matriculaId]: status }));
    
    registerAttendance({
      matriculaId,
      status,
      metodo: 'manual',
    });

    setIsSavedFeedback(true);
    setTimeout(() => setIsSavedFeedback(false), 1500);

    if (status === 'presente') {
      confetti({ particleCount: 15, spread: 35, origin: { y: 0.8 } });
    }
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const newOverrides: Record<string, AttendanceStatus> = {};
    activeEnrollments.forEach(enr => {
      newOverrides[enr.id] = status;
      registerAttendance({
        matriculaId: enr.id,
        status,
        metodo: 'manual',
      });
    });
    setStatusOverrides(newOverrides);
    setIsSavedFeedback(true);
    setTimeout(() => setIsSavedFeedback(false), 1500);
    showToast(`Todos los alumnos marcados como ${status.toUpperCase()}`, 'success', '✓ Asistencia Actualizada');
  };

  const handleCloseAttendance = () => {
    setIsClosed(true);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    showToast('La sesión de asistencia ha sido cerrada y sincronizada.', 'success', '✓ Asistencia Cerrada');
  };

  const displayedEnrollments = useMemo(() => {
    return activeEnrollments.filter(enr => {
      const fullName = `${enr.estudiante?.profile?.apellidos || ''} ${enr.estudiante?.profile?.nombres || ''} ${enr.estudiante?.codigo_estudiante || ''}`.toLowerCase();
      return fullName.includes(searchQuery.toLowerCase());
    });
  }, [activeEnrollments, searchQuery]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      
      {/* Header */}
      <PageHeader
        title="Toma de Asistencia Ultrarrápida"
        description="Por defecto todos los estudiantes figuran en estado PRESENTE. Modifica excepciones o escanea los carnets QR."
        badge={activeSectionInfo ? `${activeSectionInfo.grado?.nombre || ''} "${activeSectionInfo.letra}"` : "Aula 3° 'A'"}
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('lista')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'lista'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              📋 Lista de Aula
            </button>
            <button
              type="button"
              onClick={() => setViewMode('qr')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'qr'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" /> 📷 Lector QR
            </button>
          </div>

          {isSavedFeedback && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/20 animate-fade-in">
              <Check className="w-3.5 h-3.5" /> ✓ Guardado
            </span>
          )}
          <button
            onClick={handleCloseAttendance}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-sm active:scale-95 transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            {isClosed ? '✓ Cerrada' : 'Cerrar Asistencia'}
          </button>
        </div>
      </PageHeader>

      {/* Salones & Acciones Rápidas */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Selector de salón */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-thin">
          <span className="text-xs font-bold text-slate-400 shrink-0">Aula:</span>
          {teacherSections.map(ts => (
            <button
              key={ts.seccion.id}
              onClick={() => setSelectedSectionId(ts.seccion.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedSectionId === ts.seccion.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {ts.seccion.grado?.nombre} &quot;{ts.seccion.letra}&quot;
            </button>
          ))}
        </div>

        {/* Botones de acción masiva */}
        {viewMode === 'lista' && (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => handleMarkAll('presente')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-100 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Marcar</span> Todos Presentes
            </button>
            <button
              onClick={() => handleMarkAll('falta')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold text-xs hover:bg-rose-100 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Marcar</span> Ausentes
            </button>
          </div>
        )}
      </div>

      {/* RENDER SEGÚN MODO: QR SCANNER O LISTA */}
      {viewMode === 'qr' ? (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm">
            <div className="max-w-lg mx-auto">
              <div className="mb-4 text-center">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Lector de Carnets para {activeSectionInfo?.grado?.nombre} &quot;{activeSectionInfo?.letra}&quot;
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Apunta la cámara al carnet de cada estudiante para registrar su asistencia en vivo
                </p>
              </div>
              <QrScanner autoStart={true} variant="embedded" showHeader={false} />
            </div>
          </div>
        </div>
      ) : (
        /* Lista Interactiva de Alumnos */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60">
          {/* Search */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Filtrar alumno por nombre o DNI..."
            className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none"
          />
        </div>

        {displayedEnrollments.map((enr) => {
          const st = getStudentStatus(enr.id);
          const student = enr.estudiante;
          const fullName = `${student?.profile?.apellidos || ''}, ${student?.profile?.nombres || ''}`;

          return (
            <div
              key={enr.id}
              className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={student?.profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                    alt={fullName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {fullName}
                  </h4>
                  <p className="text-[10px] font-mono text-slate-400">
                    DNI: {student?.profile?.dni} • Código: {student?.codigo_estudiante}
                  </p>
                </div>
              </div>

              {/* Botones de Selección de Estado (4 Estados) */}
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => handleSetStatus(enr.id, 'presente')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    st === 'presente'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                >
                  ✓ Presente
                </button>

                <button
                  type="button"
                  onClick={() => handleSetStatus(enr.id, 'tardanza')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    st === 'tardanza'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-50 hover:text-amber-700'
                  }`}
                >
                  ⏱ Tardanza
                </button>

                <button
                  type="button"
                  onClick={() => handleSetStatus(enr.id, 'justificado')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    st === 'justificado'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  📄 Justificada
                </button>

                <button
                  type="button"
                  onClick={() => handleSetStatus(enr.id, 'falta')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    st === 'falta'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-50 hover:text-rose-700'
                  }`}
                >
                  ✕ Injustificada
                </button>
              </div>
            </div>
          );
        })}
        </div>
      )}

    </div>
  );
}
