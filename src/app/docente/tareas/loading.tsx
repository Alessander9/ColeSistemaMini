'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { SkCard, SkFilterBar, SkHeader, SkPage, SkTabs, skRepeat } from '@/components/ui/DocenteSkeletons';

// Carga de "Mis tareas": 4 pestañas, filtro por aula y filas de tareas con avance de entregas
export default function DocenteTareasLoading() {
  return (
    <SkPage label="tus tareas">
      <SkHeader buttonWidth="w-56" />

      <SkCard className="p-4 space-y-3">
        <SkTabs count={4} />
        <SkFilterBar />
      </SkCard>

      <div className="space-y-2.5">
        {skRepeat(4).map(i => (
          <SkCard key={i} className="p-4 flex flex-col md:flex-row md:items-center gap-4">
            <Skeleton variant="rectangular" className="hidden md:block w-2 self-stretch rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="flex gap-1.5">
                <Skeleton className="w-24 h-5 rounded-full" />
                <Skeleton className="w-28 h-5 rounded-full" />
              </div>
              <Skeleton variant="text" className="w-80 max-w-full h-5 my-0" />
              <Skeleton variant="text" className="w-56 h-3.5 my-0" />
            </div>
            <div className="md:w-56 space-y-1.5">
              <Skeleton variant="text" className="w-32 h-3.5 my-0" />
              <Skeleton className="h-2.5 rounded-full" />
              <Skeleton variant="text" className="w-28 h-3 my-0" />
            </div>
            <Skeleton className="md:w-48 h-12 rounded-2xl" />
          </SkCard>
        ))}
      </div>
    </SkPage>
  );
}
