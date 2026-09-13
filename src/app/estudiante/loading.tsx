'use client';

import React from 'react';
import { Skeleton, SkeletonCard, SkeletonTable } from '@/components/ui/Skeleton';

export default function EstudianteLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      
      {/* Student Welcome Banner & QR Preview Skeleton */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-950/70 to-slate-900 border border-slate-800 text-white flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Skeleton variant="circular" className="w-16 h-16 shrink-0 ring-4 ring-slate-800 bg-slate-800" />
          <div className="space-y-2 flex-1">
            <Skeleton variant="rounded" className="w-48 h-7 rounded-xl bg-slate-800" />
            <Skeleton variant="text" className="w-56 h-3 bg-slate-800" />
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Skeleton variant="rounded" className="w-36 h-11 rounded-2xl bg-slate-800" />
          <Skeleton variant="rounded" className="w-32 h-11 rounded-2xl bg-slate-800" />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Course Grades & Homework Highlights Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <SkeletonTable rows={4} cols={4} />
        </div>
        <div className="space-y-4">
          <SkeletonCard className="h-44" />
          <SkeletonCard className="h-44" />
        </div>
      </div>

    </div>
  );
}
