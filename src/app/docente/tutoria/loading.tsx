'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { SkAulaButtons, SkCard, SkHeader, SkPage, SkTabs, skRepeat } from '@/components/ui/DocenteSkeletons';

// Carga de "Tutoría": aulas, 3 tarjetas de resumen, pestañas y tarjetas de alumnos con contacto del apoderado
export default function DocenteTutoriaLoading() {
  return (
    <SkPage label="la tutoría">
      <SkHeader buttonWidth="w-64" />

      <SkAulaButtons />

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {skRepeat(3).map(i => (
          <SkCard key={i} className="p-4 space-y-2">
            <Skeleton className="w-10 h-9 rounded-lg" />
            <Skeleton variant="text" className="w-44 h-4 my-0" />
            <Skeleton variant="text" className="w-32 h-3 my-0" />
          </SkCard>
        ))}
      </div>

      <SkTabs count={3} withHint={false} />

      {/* Filtro + buscador */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex gap-2">
          <Skeleton className="w-24 h-9 rounded-xl" />
          <Skeleton className="w-44 h-9 rounded-xl" />
        </div>
        <Skeleton className="sm:ml-auto sm:w-64 h-10 rounded-xl" />
      </div>

      {/* Alumnos */}
      <div className="space-y-2.5">
        {skRepeat(4).map(i => (
          <SkCard key={i} className="p-4 flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex items-start gap-3 flex-1">
              <Skeleton className="w-11 h-11 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Skeleton variant="text" className="w-44 h-4 my-0" />
                  <Skeleton className="w-28 h-5 rounded-full" />
                </div>
                <Skeleton variant="text" className="w-56 max-w-full h-3.5 my-0" />
                <Skeleton variant="text" className="w-72 max-w-full h-3 my-0" />
              </div>
            </div>
            <div className="lg:w-72 space-y-1.5">
              <Skeleton variant="text" className="w-40 h-3 my-0" />
              <div className="flex gap-1.5">
                <Skeleton className="w-20 h-8 rounded-xl" />
                <Skeleton className="w-24 h-8 rounded-xl" />
                <Skeleton className="w-20 h-8 rounded-xl" />
              </div>
            </div>
          </SkCard>
        ))}
      </div>
    </SkPage>
  );
}
