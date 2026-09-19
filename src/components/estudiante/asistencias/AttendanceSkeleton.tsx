import React from 'react';

export function AttendanceSkeleton() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-2">
            <div className="w-56 h-7 rounded-xl bg-slate-200 dark:bg-slate-800" />
            <div className="w-80 h-4 rounded-lg bg-slate-100 dark:bg-slate-800/60" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-48 h-10 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="w-36 h-10 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="w-20 h-3 rounded bg-slate-100 dark:bg-slate-800" />
              <div className="w-16 h-6 rounded-lg bg-slate-200 dark:bg-slate-800" />
              <div className="w-24 h-3 rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Container Card Skeleton */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-48 h-6 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="w-40 h-8 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="w-full h-10 rounded-2xl bg-slate-100 dark:bg-slate-800" />
        <div className="space-y-2 pt-2">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/60" />
          ))}
        </div>
      </div>
    </div>
  );
}
