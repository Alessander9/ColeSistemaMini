'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { SkAulaButtons, SkCard, SkHeader, SkPage, skRepeat } from '@/components/ui/DocenteSkeletons';

// Carga de "Notas": 3 pasos (aula, curso, bimestre) y la tabla de notas por competencia
export default function DocenteNotasLoading() {
  return (
    <SkPage label="las notas">
      <SkHeader buttonWidth="w-60" />

      {/* Pasos 1, 2 y 3 */}
      <SkCard className="p-4 sm:p-5 space-y-4">
        <SkAulaButtons framed={false} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          {[2, 4].map((n, b) => (
            <div key={b} className="space-y-2">
              <Skeleton variant="text" className="w-32 h-4" />
              <div className="flex flex-wrap gap-2">
                {skRepeat(n).map(i => <Skeleton key={i} className={`${b === 0 ? 'w-32 h-11' : 'w-24 h-12'} rounded-2xl`} />)}
              </div>
            </div>
          ))}
        </div>
      </SkCard>

      {/* Tabla de notas */}
      <SkCard className="overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1.5">
              <Skeleton className="w-72 max-w-full h-6 rounded-lg" />
              <Skeleton variant="text" className="w-52 h-3 my-0" />
            </div>
            <Skeleton className="w-44 h-8 rounded-xl hidden sm:block" />
          </div>
          <Skeleton className="h-2.5 rounded-full" />
          <div className="flex flex-wrap gap-2">
            {skRepeat(4).map(i => <Skeleton key={i} className="w-32 h-7 rounded-xl" />)}
          </div>
        </div>

        <div className="overflow-hidden">
          {/* Encabezado: alumno + 4 competencias + promedio */}
          <div className="grid grid-cols-[220px_repeat(4,minmax(120px,1fr))_110px] gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800/60">
            <Skeleton variant="text" className="w-16 h-4 my-0 self-center" />
            {skRepeat(4).map(i => (
              <div key={i} className="flex flex-col items-center gap-1">
                <Skeleton variant="text" className="w-24 h-3.5 my-0" />
                <Skeleton variant="text" className="w-28 h-2.5 my-0" />
                <Skeleton className="w-24 h-6 rounded-lg" />
              </div>
            ))}
            <Skeleton variant="text" className="w-16 h-4 my-0 self-center justify-self-center" />
          </div>
          {skRepeat(6).map(r => (
            <div key={r} className="grid grid-cols-[220px_repeat(4,minmax(120px,1fr))_110px] gap-2 px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 items-center">
              <div className="flex items-center gap-2.5">
                <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                <div className="space-y-1 flex-1">
                  <Skeleton variant="text" className="w-32 h-3.5 my-0" />
                  <Skeleton variant="text" className="w-20 h-2.5 my-0" />
                </div>
              </div>
              {skRepeat(4).map(i => <Skeleton key={i} className="w-[88px] h-10 rounded-xl justify-self-center" />)}
              <Skeleton className="w-[52px] h-10 rounded-xl justify-self-center" />
            </div>
          ))}
        </div>
      </SkCard>
    </SkPage>
  );
}
