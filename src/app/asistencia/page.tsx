'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { AttendanceStatus } from '@/types';
import { QrScanner } from '@/components/qr/QrScanner';
import { 
  QrCode, 
  LogOut, 
  Home,
  Users, 
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Calendar,
  Smartphone
} from 'lucide-react';
import Link from 'next/link';

export default function AsistenciaMobilePage() {
  const { 
    currentUser, 
    attendances, 
    students, 
    enrollments 
  } = useApp();

  const [scanStatusMode, setScanStatusMode] = useState<AttendanceStatus>('presente');

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendances = attendances.filter(a => a.fecha === todayStr || a.fecha === '2026-09-12');
  const totalHoy = todayAttendances.length;
  const aTiempo = todayAttendances.filter(a => a.estado === 'presente').length;
  const tardanzas = todayAttendances.filter(a => a.estado === 'tardanza').length;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between max-w-md mx-auto relative shadow-2xl border-x border-slate-900 overflow-x-hidden pb-8">
      
      {/* Mobile Terminal Top Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-black text-sm text-white tracking-tight flex items-center gap-1.5">
              Control Asistencia
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                MÓVIL
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 truncate max-w-[170px]">
              {currentUser.nombres} ({currentUser.cargo || 'Portería'})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href="/"
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Volver a la Página Principal"
          >
            <Home className="w-4 h-4" />
          </Link>
          <Link
            href="/despedida"
            className="p-2 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-400 hover:bg-rose-900/40 transition-colors"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* KPI Counters Banner */}
      <div className="grid grid-cols-3 gap-2 px-3.5 py-2.5 bg-slate-900/60 border-b border-slate-800/80 text-center">
        <div className="p-2 rounded-xl bg-slate-800/70 border border-slate-700/50">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Hoy</span>
          <p className="text-base font-black text-white">{totalHoy}</p>
        </div>
        <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/50">
          <span className="text-[10px] uppercase font-bold text-emerald-400 block">A Tiempo</span>
          <p className="text-base font-black text-emerald-300">{aTiempo}</p>
        </div>
        <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-800/50">
          <span className="text-[10px] uppercase font-bold text-amber-400 block">Tardanzas</span>
          <p className="text-base font-black text-amber-300">{tardanzas}</p>
        </div>
      </div>

      {/* Mode Selector for Scans */}
      <div className="px-3.5 pt-3 pb-1">
        <div className="flex items-center justify-between gap-1.5 p-1 bg-slate-900 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setScanStatusMode('presente')}
            className={`flex-1 py-2 px-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              scanStatusMode === 'presente'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ✓ Presente
          </button>
          <button
            type="button"
            onClick={() => setScanStatusMode('tardanza')}
            className={`flex-1 py-2 px-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              scanStatusMode === 'tardanza'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-1 ring-amber-400/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⏰ Tardanza
          </button>
          <button
            type="button"
            onClick={() => setScanStatusMode('justificado')}
            className={`flex-1 py-2 px-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              scanStatusMode === 'justificado'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📝 Justificado
          </button>
        </div>
      </div>

      {/* Main Scanner Component with Camera controls */}
      <div className="px-3.5 py-2 flex-1">
        <QrScanner statusMode={scanStatusMode} />
      </div>

      {/* Recent Scans Feed */}
      <div className="px-3.5 pt-2">
        <div className="bg-slate-900/80 rounded-3xl border border-slate-800/80 p-3.5 flex flex-col shadow-inner">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              Últimos Ingresos Registrados ({todayAttendances.length})
            </span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
            {todayAttendances.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-4 italic">
                Aún no hay asistencias registradas hoy.
              </p>
            ) : (
              todayAttendances.slice(0, 10).map((att) => {
                const enr = enrollments.find(e => e.id === att.matricula_id);
                const fullName = enr?.estudiante?.profile 
                  ? `${enr.estudiante.profile.apellidos}, ${enr.estudiante.profile.nombres}`
                  : 'Estudiante Registrado';

                return (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-slate-800/60 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-slate-300 shrink-0 text-xs">
                        {fullName[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-200 truncate text-xs leading-tight">
                          {fullName}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {enr?.seccion?.grado?.nombre || '3° Sec'} &quot;{enr?.seccion?.letra || 'A'}&quot; • {att.metodo.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        att.estado === 'presente'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : att.estado === 'tardanza'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {att.estado.toUpperCase()}
                      </span>
                      <p className="text-[10px] font-mono text-slate-500 mt-0.5">{att.hora_registro}</p>
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
