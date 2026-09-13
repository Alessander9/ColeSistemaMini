'use client';

import React from 'react';
import { GradeLetter } from '@/types';

interface GradeSelectorProps {
  value?: GradeLetter;
  onChange: (grade: GradeLetter) => void;
  disabled?: boolean;
}

const OPTIONS: { letter: GradeLetter; label: string; activeClass: string; inactiveClass: string }[] = [
  {
    letter: 'AD',
    label: 'Destacado',
    activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20 ring-2 ring-emerald-500/50',
    inactiveClass: 'hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700',
  },
  {
    letter: 'A',
    label: 'Esperado',
    activeClass: 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 ring-2 ring-blue-500/50',
    inactiveClass: 'hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700',
  },
  {
    letter: 'B',
    label: 'En Proceso',
    activeClass: 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20 ring-2 ring-amber-500/50',
    inactiveClass: 'hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700',
  },
  {
    letter: 'C',
    label: 'En Inicio',
    activeClass: 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/20 ring-2 ring-rose-500/50',
    inactiveClass: 'hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700',
  },
];

export function GradeSelector({ value, onChange, disabled = false }: GradeSelectorProps) {
  return (
    <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 gap-1">
      {OPTIONS.map((opt) => {
        const isSelected = value === opt.letter;
        return (
          <button
            key={opt.letter}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.letter)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              isSelected ? opt.activeClass : opt.inactiveClass
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
            title={`${opt.letter}: ${opt.label}`}
          >
            <span>{opt.letter}</span>
          </button>
        );
      })}
    </div>
  );
}
