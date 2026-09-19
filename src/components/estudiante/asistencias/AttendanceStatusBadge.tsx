import React from 'react';
import { AttendanceStatus } from '@/types';
import { CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';

interface AttendanceStatusBadgeProps {
  estado: AttendanceStatus;
  className?: string;
  showIcon?: boolean;
}

export function AttendanceStatusBadge({ estado, className = '', showIcon = true }: AttendanceStatusBadgeProps) {
  switch (estado) {
    case 'presente':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide border transition-all ${
            'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 shadow-sm shadow-emerald-500/10'
          } ${className}`}
        >
          {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.5]" />}
          <span>✓ A tiempo</span>
        </span>
      );

    case 'tardanza':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide border transition-all ${
            'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 shadow-sm shadow-amber-500/10'
          } ${className}`}
        >
          {showIcon && <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 stroke-[2.5]" />}
          <span>⚠ Tardanza</span>
        </span>
      );

    case 'falta':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide border transition-all ${
            'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 shadow-sm shadow-rose-500/10'
          } ${className}`}
        >
          {showIcon && <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0 stroke-[2.5]" />}
          <span>✕ Falta</span>
        </span>
      );

    case 'justificado':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide border transition-all ${
            'bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800 shadow-sm shadow-sky-500/10'
          } ${className}`}
        >
          {showIcon && <AlertCircle className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0 stroke-[2.5]" />}
          <span>ℹ Justificado</span>
        </span>
      );
  }
}
