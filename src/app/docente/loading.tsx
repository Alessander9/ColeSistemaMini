'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { SkCard, SkPage, SkStudentAttendanceRow, skRepeat } from '@/components/ui/DocenteSkeletons';

// Carga de "Mi panel diario": saludo, "Mi día" con fichas de clases, asistencia y columna lateral
export default function DocentePanelLoading() {
  return (
    <SkPage label="tu panel diario" wide>
      {/* Saludo + 2 accesos */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="w-72 max-w-full h-9 rounded-xl" />
          <Skeleton variant="text" className="w-48 h-3.5" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="w-40 h-11 rounded-2xl" />
          <Skeleton className="w-36 h-11 rounded-2xl" />
        </div>
      </div>

      {/* Mi día */}
      <SkCard className="overflow-hidden border-2">
        <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center gap-5 bg-slate-50/70 dark:bg-slate-800/30">
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="w-56 h-3 my-0" />
            <Skeleton className="w-72 max-w-full h-12 rounded-xl" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="w-32 h-6 rounded-full" />
              <Skeleton className="w-36 h-5 rounded-lg" />
              <Skeleton className="w-24 h-5 rounded-lg" />
            </div>
          </div>
          <div className="md:w-72 flex items-center gap-3 p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton variant="text" className="w-32 h-4 my-0" />
              <Skeleton variant="text" className="w-40 h-3 my-0" />
            </div>
          </div>
        </div>
        <div className="px-5 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex justify-between">
            <Skeleton variant="text" className="w-36 h-3 my-0" />
            <Skeleton variant="text" className="w-24 h-3 my-0" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            {skRepeat(5).map(i => (
              <div key={i} className="rounded-2xl border-2 border-slate-200 dark:border-slate-700 p-4 space-y-2">
                <Skeleton variant="text" className="w-16 h-4 my-0" />
                <Skeleton variant="text" className="w-32 h-3 my-0" />
                <Skeleton variant="text" className="w-24 h-2.5 my-0" />
              </div>
            ))}
          </div>
        </div>
      </SkCard>


      {/* Pendientes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {skRepeat(3).map(i => (
          <SkCard key={i} className="p-4 flex items-center gap-3 border-2">
            <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton variant="text" className="w-40 h-6 my-0" />
              <Skeleton variant="text" className="w-32 h-3 my-0" />
              <Skeleton variant="text" className="w-24 h-3 my-0" />
            </div>
          </SkCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8 space-y-5">
          {/* Asistencia de hoy */}
          <SkCard className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="w-44 h-6 rounded-lg" />
              <Skeleton variant="text" className="w-72 h-3 hidden sm:block" />
            </div>
            <div className="flex gap-1.5 overflow-hidden">
              {skRepeat(5).map(i => <Skeleton key={i} className="w-40 h-[52px] rounded-2xl shrink-0" />)}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="w-72 h-7 rounded-full" />
              <div className="flex gap-1.5 ml-auto">
                <Skeleton className="w-32 h-8 rounded-xl" />
                <Skeleton className="w-36 h-8 rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {skRepeat(6).map(i => <SkStudentAttendanceRow key={i} compact />)}
            </div>
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Skeleton variant="text" className="w-56 h-3" />
              <Skeleton className="w-60 h-11 rounded-xl" />
            </div>
          </SkCard>
        </div>

        {/* Pendientes y comunicados */}
        <div className="lg:col-span-4 space-y-5">
          {[3].map((rows, b) => (
            <SkCard key={b} className="p-4 space-y-3">
              <Skeleton className="w-32 h-5 rounded-lg" />
              {skRepeat(rows).map(i => (
                <div key={i} className="flex items-center gap-2.5">
                  <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Skeleton variant="text" className="w-3/4 h-3 my-0" />
                    <Skeleton variant="text" className="w-1/2 h-2.5 my-0" />
                  </div>
                </div>
              ))}
            </SkCard>
          ))}
        </div>
      </div>
    </SkPage>
  );
}
