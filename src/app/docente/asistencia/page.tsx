'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { QrScanner } from '@/components/qr/QrScanner';
import { AttendanceStatus } from '@/types';
import { CheckCircle2, Clock, XCircle, FileText, QrCode } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function DocenteAsistenciaPage() {
  const { students, enrollments, attendances, registerAttendance } = useApp();

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

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in-50">
      <PageHeader
        title="Toma de Asistencia con Código QR"
        description="Apunta la cámara del dispositivo al carnet del alumno para registrar automáticamente su ingreso."
        badge="Sección 3° 'A'"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Col: Camera QR Scanner */}
        <div className="lg:col-span-5">
          <QrScanner />
        </div>

        {/* Right Col: Today's Attendance List & Manual Overrides */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-base text-slate-800 dark:text-white">
                Padrón de Asistencia de Hoy
              </h3>
              <p className="text-xs text-slate-400">
                Fecha: <strong className="text-slate-700 dark:text-slate-300">{new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              {enrollments.length} alumnos
            </span>
          </div>

          <div className="space-y-3">
            {enrollments.map((enr) => {
              const fullName = `${enr.estudiante?.profile?.apellidos}, ${enr.estudiante?.profile?.nombres}`;
              const attRecord = attendances.find(
                a => a.matricula_id === enr.id && a.fecha === todayStr
              );

              return (
                <div
                  key={enr.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
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
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
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
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
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
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
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
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
