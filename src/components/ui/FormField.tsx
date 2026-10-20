'use client';

import React from 'react';
import { InputError } from './InputError';

interface FormFieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  badge?: React.ReactNode;
  rightBadge?: React.ReactNode;
  icon?: React.ReactNode;
  id?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  required,
  error,
  hint,
  badge,
  rightBadge,
  icon,
  id,
  className = '',
  children,
}: FormFieldProps) {
  const displayBadge = rightBadge || badge;

  return (
    <div className={`space-y-1 ${className}`}>
      {(label || displayBadge) && (
        <div className="flex items-center justify-between gap-2 mb-1">
          {label && (
            <label
              htmlFor={id}
              className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
            >
              {icon && <span className="text-slate-400 dark:text-slate-500">{icon}</span>}
              <span>{label}</span>
              {required && <span className="text-rose-500 font-black ml-0.5">*</span>}
            </label>
          )}
          {displayBadge && <div className="shrink-0">{displayBadge}</div>}
        </div>
      )}

      <div className="relative">
        {children}
      </div>

      {error ? (
        <InputError message={error} id={id ? `${id}-error` : undefined} />
      ) : hint ? (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{hint}</p>
      ) : null}
    </div>
  );
}
