'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface InputErrorProps {
  message?: string;
  className?: string;
  id?: string;
}

export function InputError({ message, className = '', id }: InputErrorProps) {
  if (!message) return null;

  return (
    <div
      id={id}
      role="alert"
      aria-live="polite"
      className={`flex items-start gap-1.5 mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium animate-in fade-in slide-in-from-top-1 duration-150 ${className}`}
    >
      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
      <span className="leading-tight">{message}</span>
    </div>
  );
}
