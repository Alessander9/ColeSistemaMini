'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { SkCard, SkHeader, SkPage, SkStudentAttendanceRow, skRepeat } from '@/components/ui/DocenteSkeletons';

// Carga de "Tomar asistencia": aulas, estado de la clase, herramientas y lista del aula
export default function DocenteAsistenciaLoading() {
  return (
    <SkPage label="la asistencia">
      <SkHeader buttonWidth="w-48" />

      {/* Aulas en cuadrícula */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        {skRepeat(5).map(i => (
          <div key={i} className="rounded-2xl border-2 border-slate-200 dark:border-slate-700 px-3 py-2.5 space-y-1.5">
            <Skeleton variant="text" className="w-28 h-4 my-0" />
            <Skeleton variant="text" className="w-20 h-3 my-0" />
          </div>
        ))}
      </div>

      {/* Estado de la clase */}
      <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-700 px-4 py-3 flex items-start gap-3">
        <Skeleton className="w-6 h-6 rounded-full shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton variant="text" className="w-64 max-w-full h-4 my-0" />
          <Skeleton variant="text" className="w-80 max-w-full h-3 my-0" />
        </div>
      </div>

      {/* Herramientas: lista / lector, todos presentes y buscador */}
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="w-80 max-w-full h-11 rounded-2xl" />
        <Skeleton className="w-40 h-11 rounded-2xl" />
        <Skeleton className="w-48 h-11 rounded-2xl ml-auto" />
      </div>

      {/* Lista del aula */}
      <SkCard className="p-4 space-y-2">
        <div className="flex flex-wrap gap-2 pb-2">
          {skRepeat(4).map(i => <Skeleton key={i} className="w-32 h-8 rounded-full" />)}
        </div>
        {skRepeat(6).map(i => <SkStudentAttendanceRow key={i} />)}
      </SkCard>

      {/* Guardar */}
      <div className="flex items-center justify-between gap-3">
        <Skeleton variant="text" className="w-60 h-4" />
        <Skeleton className="w-64 h-14 rounded-2xl" />
      </div>
    </SkPage>
  );
}
