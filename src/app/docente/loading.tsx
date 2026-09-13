'use client';

import React from 'react';
import { Skeleton, SkeletonCard, SkeletonTable } from '@/components/ui/Skeleton';

export default function DocenteLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      
      {/* Teacher Profile Banner Skeleton */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-blue-900/60 to-slate-900 border border-slate-800 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skeleton variant="circular" className="w-16 h-16 shrink-0 ring-4 ring-slate-800 bg-slate-800" />
          <div className="space-y-2">
            <Skeleton variant="rounded" className="w-48 h-7 rounded-xl bg-slate-800" />
            <Skeleton variant="text" className="w-64 h-3 bg-slate-800" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton variant="rounded" className="w-32 h-10 rounded-2xl bg-slate-800" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Active Class & Quick QR Bar Skeleton */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton variant="rounded" className="w-44 h-6 rounded-xl" />
          <Skeleton variant="rounded" className="w-24 h-6 rounded-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Skeleton variant="rounded" className="h-20 rounded-2xl" />
          <Skeleton variant="rounded" className="h-20 rounded-2xl" />
          <Skeleton variant="rounded" className="h-20 rounded-2xl" />
          <Skeleton variant="rounded" className="h-20 rounded-2xl" />
        </div>
      </div>

      {/* Course Table Skeleton */}
      <SkeletonTable rows={5} cols={4} />

    </div>
  );
}
