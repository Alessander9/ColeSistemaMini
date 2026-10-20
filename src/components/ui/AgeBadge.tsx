'use client';

import React from 'react';
import { calculateAge } from '@/lib/validation/businessRules';
import { EducationalLevel } from '@/types';
import { DEFAULT_ACADEMIC_AGE_RANGES, TEACHER_AGE_RULES } from '@/lib/validation/academicAgeConfig';
import { CheckCircle2, AlertTriangle, Calendar } from 'lucide-react';

interface AgeBadgeProps {
  birthDate?: string | null;
  mode?: 'student' | 'teacher';
  level?: EducationalLevel | null;
  className?: string;
}

export function AgeBadge({ birthDate, mode = 'student', level, className = '' }: AgeBadgeProps) {
  if (!birthDate) return null;

  const ageData = calculateAge(birthDate);

  if (!ageData.isValidDate) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 ${className}`}>
        <Calendar className="w-3 h-3" /> Fecha incompleta
      </span>
    );
  }

  if (ageData.isFuture) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 ${className}`}>
        <AlertTriangle className="w-3 h-3 text-rose-500" /> Fecha futura inválida
      </span>
    );
  }

  // Modo docente (>= 18 años)
  if (mode === 'teacher') {
    const isAdult = ageData.years >= TEACHER_AGE_RULES.minAge;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
          isAdult
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
        } ${className}`}
      >
        {isAdult ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <AlertTriangle className="w-3 h-3 text-rose-600" />}
        {ageData.formattedText} ({isAdult ? 'Mayor de edad' : 'Menor de 18 años'})
      </span>
    );
  }

  // Modo estudiante con nivel educativo
  let isCompatible = true;
  let levelWarning = '';

  if (level && DEFAULT_ACADEMIC_AGE_RANGES[level]) {
    const rule = DEFAULT_ACADEMIC_AGE_RANGES[level];
    const minAllowed = rule.minAge;
    const maxAllowed = level === 'inicial' ? rule.maxAge + 1 : level === 'primaria' ? rule.maxAge + 2 : rule.maxAge + 1;

    if (ageData.years < minAllowed) {
      isCompatible = false;
      levelWarning = `Menor para ${rule.label}`;
    } else if (ageData.years > maxAllowed) {
      isCompatible = false;
      levelWarning = `Mayor para ${rule.label}`;
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${
        isCompatible
          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
          : 'bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-200'
      } ${className}`}
    >
      {isCompatible ? <CheckCircle2 className="w-3 h-3 text-indigo-600" /> : <AlertTriangle className="w-3 h-3 text-amber-600" />}
      <span>Edad: {ageData.formattedText}</span>
      {levelWarning && <span className="opacity-80">· {levelWarning}</span>}
    </span>
  );
}
