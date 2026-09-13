'use client';

import React from 'react';
import { Skeleton, SkeletonCard, SkeletonTable, SkeletonChart } from '@/components/ui/Skeleton';

export default function AdminLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      
      {/* Top Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
        <div className="space-y-2">
          <Skeleton variant="rounded" className="w-56 h-8 rounded-xl" />
          <Skeleton variant="text" className="w-80 h-4" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton variant="rounded" className="w-32 h-10 rounded-2xl" />
          <Skeleton variant="rounded" className="w-28 h-10 rounded-2xl" />
        </div>
      </div>

      {/* KPI Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Analytics & Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SkeletonChart />
        </div>
        <div>
          <SkeletonCard className="h-full flex flex-col justify-between" />
        </div>
      </div>

      {/* Main Table Skeleton */}
      <SkeletonTable rows={6} cols={5} />

    </div>
  );
}
