'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { SkCard, SkFilterBar, SkHeader, SkPage, SkTabs, skRepeat } from '@/components/ui/DocenteSkeletons';

// Carga de "Mis evaluaciones": 3 pestañas, filtro por aula y filas con fecha tipo calendario
export default function DocenteEvaluacionesLoading() {
  return (
    <SkPage label="tus evaluaciones">
      <SkHeader buttonWidth="w-60" />

      <SkCard className="p-4 space-y-3">
        <SkTabs count={3} />
        <SkFilterBar />
      </SkCard>

      <div className="space-y-2.5">
        {skRepeat(4).map(i => (
          <SkCard key={i} className="p-4 flex flex-col md:flex-row md:items-center gap-4">
            {/* Hoja de calendario */}
            <div className="w-20 shrink-0 rounded-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
              <Skeleton variant="rectangular" className="h-5" />
              <div className="flex flex-col items-center gap-1 py-1.5">
                <Skeleton variant="text" className="w-8 h-7 my-0" />
                <Skeleton variant="text" className="w-7 h-2.5 my-0" />
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex gap-1.5">
                <Skeleton className="w-32 h-5 rounded-full" />
                <Skeleton className="w-24 h-5 rounded-full" />
                <Skeleton className="w-28 h-5 rounded-full" />
              </div>
              <Skeleton variant="text" className="w-80 max-w-full h-5 my-0" />
              <Skeleton variant="text" className="w-64 max-w-full h-3.5 my-0" />
              <Skeleton variant="text" className="w-72 max-w-full h-3 my-0" />
            </div>
            <div className="md:w-52 space-y-2">
              <Skeleton className="h-11 rounded-2xl" />
              <div className="flex gap-2">
                <Skeleton className="flex-1 h-9 rounded-xl" />
                <Skeleton className="w-12 h-9 rounded-xl" />
              </div>
            </div>
          </SkCard>
        ))}
      </div>
    </SkPage>
  );
}
