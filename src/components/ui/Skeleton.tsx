'use client';

import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'rounded' | 'text';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className = '',
  variant = 'rounded',
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  const variantStyles = {
    rectangular: 'rounded-none',
    circular: 'rounded-full',
    rounded: 'rounded-2xl',
    text: 'rounded-md h-4 my-1',
  };

  const customStyle: React.CSSProperties = {
    ...style,
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
  };

  return (
    <div
      className={`relative overflow-hidden bg-slate-200/80 dark:bg-slate-800/80 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/25 dark:before:via-white/5 before:to-transparent ${variantStyles[variant]} ${className}`}
      style={customStyle}
      aria-hidden="true"
      {...props}
    />
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3.5 ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton variant="rounded" className="w-10 h-10 rounded-xl" />
        <Skeleton variant="rounded" className="w-14 h-5 rounded-full" />
      </div>
      <div className="space-y-1.5">
        <Skeleton variant="text" className="w-24 h-3" />
        <Skeleton variant="text" className="w-36 h-7" />
      </div>
      <Skeleton variant="text" className="w-48 h-3 pt-1" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className = '' }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={`rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm p-4 sm:p-6 space-y-4 ${className}`}>
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <Skeleton variant="rounded" className="w-48 h-6 rounded-xl" />
        <div className="flex items-center gap-2">
          <Skeleton variant="rounded" className="w-28 h-8 rounded-xl" />
          <Skeleton variant="rounded" className="w-20 h-8 rounded-xl" />
        </div>
      </div>

      {/* Table Rows */}
      <div className="space-y-3 pt-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100/80 dark:border-slate-800/60">
            <Skeleton variant="circular" className="w-9 h-9 shrink-0" />
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 items-center">
              <Skeleton variant="text" className="w-3/4 h-4" />
              <Skeleton variant="text" className="w-1/2 h-3 hidden sm:block" />
              <Skeleton variant="rounded" className="w-20 h-5 rounded-full" />
              <Skeleton variant="rounded" className="w-16 h-7 rounded-xl justify-self-end" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonChart({ className = '' }: { className?: string }) {
  return (
    <div className={`p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton variant="text" className="w-36 h-5" />
          <Skeleton variant="text" className="w-24 h-3" />
        </div>
        <Skeleton variant="rounded" className="w-20 h-6 rounded-full" />
      </div>

      {/* Chart Bars simulation */}
      <div className="h-44 flex items-end justify-between gap-3 pt-4 px-2">
        {[45, 75, 60, 90, 65, 80, 50, 95, 70].map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <Skeleton variant="rounded" className="w-full rounded-t-xl" style={{ height: `${h}%` }} />
            <Skeleton variant="text" className="w-6 h-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonProfile({ className = '' }: { className?: string }) {
  return (
    <div className={`p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 shadow-xl space-y-4 ${className}`}>
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" className="w-16 h-16 shrink-0 ring-4 ring-slate-800" />
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" className="w-40 h-5 bg-slate-700" />
          <Skeleton variant="text" className="w-28 h-3 bg-slate-700" />
          <Skeleton variant="rounded" className="w-20 h-4 rounded-full bg-slate-800" />
        </div>
      </div>
    </div>
  );
}
