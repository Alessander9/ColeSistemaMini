'use client';

import React from 'react';
import { GradeLetter } from '@/types';
import { getGradeMeta } from '@/lib/grades/calculations';

interface GradeBadgeProps {
  grade?: GradeLetter | string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
}

export function GradeBadge({ grade, size = 'md', showLabel = false }: GradeBadgeProps) {
  const meta = getGradeMeta(grade);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 min-w-[28px]',
    md: 'text-sm px-2.5 py-1 min-w-[34px]',
    lg: 'text-base font-bold px-3.5 py-1.5 min-w-[44px]',
    xl: 'text-xl font-black px-4 py-2 min-w-[56px]',
  };

  return (
    <div className="inline-flex items-center gap-1.5" title={`${meta.label} — ${meta.desc}`}>
      <span
        className={`inline-flex items-center justify-center font-black rounded-lg border shadow-sm transition-all select-none ${meta.bg} ${meta.text} ${meta.border} ${sizeClasses[size]}`}
      >
        {grade || '-'}
      </span>
      {showLabel && (
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {meta.label}
        </span>
      )}
    </div>

  );
}
