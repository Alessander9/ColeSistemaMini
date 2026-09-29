'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

/*
 * Piezas de carga para el portal docente.
 * Cada sección arma su propio esqueleto con estas piezas, imitando cómo se ve la página real.
 */

const card = 'rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800';
const repeat = (n: number) => Array.from({ length: n }, (_, i) => i);

/** Página contenedora: aviso accesible + ancho máximo de la sección */
export function SkPage({ label, wide = false, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={`space-y-4 ${wide ? 'max-w-7xl' : 'max-w-6xl'} mx-auto pb-10 overflow-hidden [&_*]:max-w-full animate-in fade-in duration-200`} role="status" aria-live="polite">
      <span className="sr-only">Cargando {label}…</span>
      {children}
    </div>
  );
}

/** Título + descripción, con botón principal a la derecha (opcional) */
export function SkHeader({ button = true, buttonWidth = 'w-52' }: { button?: boolean; buttonWidth?: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="space-y-2">
        <Skeleton className="w-56 h-8 rounded-xl" />
        <Skeleton variant="text" className="w-80 max-w-full h-3.5" />
      </div>
      {button && <Skeleton className={`${buttonWidth} h-12 rounded-2xl`} />}
    </div>
  );
}

/** Fila de botones de aula (título "Elige el aula" opcional) */
export function SkAulaButtons({ count = 5, big = true, framed = true, title = true }: { count?: number; big?: boolean; framed?: boolean; title?: boolean }) {
  const body = (
    <>
      {title && <Skeleton variant="text" className="w-28 h-4" />}
      <div className="flex flex-wrap gap-2">
        {repeat(count).map(i => (
          <div key={i} className={`${big ? 'w-40 h-[58px]' : 'w-28 h-9'} rounded-2xl border-2 border-slate-200 dark:border-slate-700 p-2.5 space-y-1.5`}>
            <Skeleton variant="text" className={`${big ? 'w-28 h-4' : 'w-16 h-3'} my-0`} />
            {big && <Skeleton variant="text" className="w-16 h-2.5 my-0" />}
          </div>
        ))}
      </div>
    </>
  );
  return framed ? <div className={`${card} p-4 space-y-2`}>{body}</div> : <div className="space-y-2">{body}</div>;
}

/** Pestañas grandes con número (Por calificar / Abiertas / …) */
export function SkTabs({ count = 3, withHint = true }: { count?: number; withHint?: boolean }) {
  const cols = count === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3';
  return (
    <div className={`grid ${cols} gap-2`}>
      {repeat(count).map(i => (
        <div key={i} className="px-4 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Skeleton variant="text" className="w-20 h-4 my-0" />
            <Skeleton className="w-7 h-5 rounded-full" />
          </div>
          {withHint && <Skeleton variant="text" className="w-28 h-2.5 my-0 hidden sm:block" />}
        </div>
      ))}
    </div>
  );
}

/** Filtro por aula en chips pequeños + buscador */
export function SkFilterBar({ chips = 6 }: { chips?: number }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-1.5 flex-1 overflow-hidden">
        <Skeleton variant="text" className="w-10 h-4 my-0 shrink-0" />
        {repeat(chips).map(i => <Skeleton key={i} className={`${i === 0 ? 'w-16' : 'w-28'} h-9 rounded-xl shrink-0`} />)}
      </div>
      <Skeleton className="md:w-64 h-10 rounded-xl" />
    </div>
  );
}

/** Tarjeta blanca genérica */
export function SkCard({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`${card} ${className}`}>{children}</div>;
}

/** Fila de alumno con 4 botones P/T/F/J */
export function SkStudentAttendanceRow({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-2 ${compact ? 'p-2.5' : 'p-3'} rounded-2xl border border-slate-200 dark:border-slate-700`}>
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <Skeleton className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} rounded-xl shrink-0`} />
        <div className="space-y-1 flex-1">
          <Skeleton variant="text" className="w-40 max-w-full h-3.5 my-0" />
          <Skeleton variant="text" className="w-20 h-2.5 my-0" />
        </div>
      </div>
      <div className="flex gap-1 shrink-0">
        {repeat(4).map(i => <Skeleton key={i} className={`${compact ? 'w-8 h-8' : 'w-11 h-11'} rounded-xl`} />)}
      </div>
    </div>
  );
}

export { repeat as skRepeat };
