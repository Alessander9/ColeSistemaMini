'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { SkCard, SkHeader, SkPage, skRepeat } from '@/components/ui/DocenteSkeletons';

// Carga de "Mi horario": clase destacada, pestañas de días y línea de tiempo del día
export default function DocenteHorarioLoading() {
  return (
    <SkPage label="tu horario">
      <SkHeader buttonWidth="w-32" />

      {/* Ahora / próxima clase */}
      <SkCard className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <Skeleton className="w-20 h-20 rounded-2xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-44 h-3.5 my-0" />
          <Skeleton variant="text" className="w-72 max-w-full h-6 my-0" />
          <Skeleton variant="text" className="w-56 h-3.5 my-0" />
        </div>
        <Skeleton className="w-full sm:w-48 h-12 rounded-2xl" />
      </SkCard>

      {/* Pestañas lunes a viernes */}
      <div className="grid grid-cols-5 gap-2">
        {skRepeat(5).map(i => (
          <div key={i} className="px-2 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 flex flex-col items-center gap-1.5">
            <Skeleton variant="text" className="w-16 h-4 my-0" />
            <Skeleton variant="text" className="w-12 h-2.5 my-0" />
          </div>
        ))}
      </div>

      {/* Línea de tiempo del día */}
      <SkCard className="p-4 space-y-2">
        <Skeleton className="w-48 h-6 rounded-lg mb-1" />
        {skRepeat(7).map(i => (
          i === 3 ? (
            <Skeleton key={i} className="h-9 rounded-2xl opacity-60" />
          ) : (
            <div key={i} className="flex items-stretch gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <Skeleton variant="rectangular" className="w-2.5 shrink-0" />
              <div className="w-24 py-3 space-y-1 shrink-0">
                <Skeleton variant="text" className="w-16 h-4 my-0" />
                <Skeleton variant="text" className="w-12 h-2.5 my-0" />
              </div>
              <div className="flex-1 py-3 space-y-1.5">
                <Skeleton variant="text" className="w-40 h-4 my-0" />
                <Skeleton variant="text" className="w-56 max-w-full h-3 my-0" />
              </div>
              <Skeleton className="hidden sm:block w-40 h-10 rounded-xl self-center mr-3" />
            </div>
          )
        ))}
      </SkCard>

      <Skeleton className="w-56 h-11 rounded-2xl mx-auto" />
    </SkPage>
  );
}
