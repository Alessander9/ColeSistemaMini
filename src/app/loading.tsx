'use client';

import React from 'react';
import { GraduationCap, Loader2 } from 'lucide-react';

export default function RootLoading() {
  return (
    <div className="min-h-[70vh] w-full flex flex-col items-center justify-center p-6 select-none animate-in fade-in duration-200">
      <div className="relative flex flex-col items-center space-y-5">
        
        {/* Glowing Brand Icon */}
        <div className="relative">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-emerald-500 flex items-center justify-center shadow-xl shadow-blue-500/25 animate-pulse">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <div className="absolute -inset-2 rounded-3xl border border-indigo-500/20 animate-ping pointer-events-none" />
        </div>

        {/* Text and Spinner */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <h3 className="text-base font-black text-slate-800 dark:text-white tracking-tight">
              Cargando ColeSistema
            </h3>
            <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
          </div>
          <p className="text-xs text-slate-400 font-medium">
            Sincronizando información académica y asistencias...
          </p>
        </div>

        {/* Subtle Progress Bar */}
        <div className="w-48 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="w-full h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-500 rounded-full animate-shimmer" />
        </div>

      </div>
    </div>
  );
}
