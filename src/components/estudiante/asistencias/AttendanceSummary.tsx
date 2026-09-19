import React from 'react';
import { CheckCircle2, UserCheck, Clock, XCircle, TrendingUp } from 'lucide-react';

interface AttendanceSummaryProps {
  totalRecords: number;
  presentCount: number;
  tardanzaCount: number;
  faltaCount: number;
  attendancePct: number;
}

export function AttendanceSummary({
  presentCount,
  tardanzaCount,
  faltaCount,
  attendancePct,
}: AttendanceSummaryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {/* KPI 1: ASISTENCIA GLOBAL */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/60 shrink-0">
            <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              ASISTENCIA GLOBAL
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {attendancePct}%
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
              Índice de permanencia
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200/50">
            <TrendingUp className="w-2.5 h-2.5" /> +0%
          </span>
          <span className="text-[9px] text-slate-400 block mt-0.5">vs. mes anterior</span>
        </div>
      </div>

      {/* KPI 2: PUNTUALES */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-800/60 shrink-0">
            <UserCheck className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              PUNTUALES
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {presentCount}
              </span>
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block">
              Ingresos a tiempo
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
            {presentCount > 0 ? `${Math.round((presentCount / (presentCount + tardanzaCount + faltaCount || 1)) * 100)}%` : '0%'}
          </span>
          <span className="text-[9px] text-slate-400 block mt-0.5">vs. mes anterior</span>
        </div>
      </div>

      {/* KPI 3: TARDANZAS */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-800/60 shrink-0">
            <Clock className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              TARDANZAS
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-amber-500 dark:text-amber-400 tracking-tight">
                {tardanzaCount}
              </span>
            </div>
            <span className="text-[11px] text-amber-500 dark:text-amber-400 font-bold block">
              Ingresos demorados
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
            {tardanzaCount > 0 ? `${Math.round((tardanzaCount / (presentCount + tardanzaCount + faltaCount || 1)) * 100)}%` : '0%'}
          </span>
          <span className="text-[9px] text-slate-400 block mt-0.5">vs. mes anterior</span>
        </div>
      </div>

      {/* KPI 4: INASISTENCIAS */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-800/60 shrink-0">
            <XCircle className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              INASISTENCIAS
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-rose-500 dark:text-rose-400 tracking-tight">
                {faltaCount}
              </span>
            </div>
            <span className="text-[11px] text-rose-500 dark:text-rose-400 font-bold block">
              Faltas acumuladas
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
            {faltaCount > 0 ? `${Math.round((faltaCount / (presentCount + tardanzaCount + faltaCount || 1)) * 100)}%` : '0%'}
          </span>
          <span className="text-[9px] text-slate-400 block mt-0.5">vs. mes anterior</span>
        </div>
      </div>
    </div>
  );
}
