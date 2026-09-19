import React from 'react';
import { Calendar, RotateCcw } from 'lucide-react';

interface EmptyAttendanceStateProps {
  onExpandDateRange: () => void;
  onClearFilters: () => void;
}

export function EmptyAttendanceState({ onExpandDateRange, onClearFilters }: EmptyAttendanceStateProps) {
  return (
    <div className="py-14 px-6 flex flex-col items-center justify-center text-center max-w-md mx-auto animate-in fade-in-50">
      {/* Icon Illustration matching image: Clipboard with clock */}
      <div className="relative mb-5">
        <div className="w-20 h-24 rounded-2xl bg-blue-50/80 dark:bg-slate-800 border-2 border-blue-200 dark:border-slate-700 flex flex-col items-center pt-3 shadow-inner">
          {/* Clipboard top clip */}
          <div className="w-8 h-2.5 rounded-full bg-blue-300 dark:bg-slate-600 mb-2" />
          {/* Horizontal lines representing sheet */}
          <div className="w-12 h-1 rounded bg-blue-200/80 dark:bg-slate-700 mb-1.5" />
          <div className="w-10 h-1 rounded bg-blue-200/80 dark:bg-slate-700 mb-1.5" />
          <div className="w-8 h-1 rounded bg-blue-200/80 dark:bg-slate-700" />
        </div>

        {/* Small clock badge floating at the bottom right */}
        <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-white dark:bg-slate-900 border-2 border-blue-400 dark:border-blue-500 flex items-center justify-center shadow-md">
          <div className="w-4 h-4 rounded-full border border-blue-500 relative flex items-center justify-center">
            <div className="w-1.5 h-0.5 bg-blue-600 absolute top-1.5 right-1" />
            <div className="w-0.5 h-1.5 bg-blue-600 absolute bottom-1" />
          </div>
        </div>

        {/* Subtle decorative sparkles */}
        <div className="absolute -top-1 -left-2 text-blue-300 text-xs font-black">✦</div>
        <div className="absolute -top-1 -right-2 text-blue-300 text-xs font-black">✦</div>
      </div>

      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
        No hay registros de asistencia
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm leading-relaxed">
        Aún no se encontraron registros en el rango de fechas seleccionado.
      </p>

      {/* Buttons Stack */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5 mt-5 w-full sm:w-auto">
        <button
          onClick={onExpandDateRange}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Ampliar rango de fechas</span>
        </button>

        <button
          onClick={onClearFilters}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Limpiar filtros</span>
        </button>
      </div>
    </div>
  );
}
