import { GradeLetter } from '@/types';

// Niveles de logro CNEB con colores fuertes y significado en palabras simples (vistas del docente)
export const GRADE_OPTIONS: { letter: GradeLetter; label: string; hint: string; solid: string; soft: string }[] = [
  { letter: 'AD', label: 'Logro destacado', hint: 'Supera lo esperado', solid: 'bg-emerald-600 text-white border-emerald-600', soft: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' },
  { letter: 'A', label: 'Logro esperado', hint: 'Aprendió lo que se esperaba', solid: 'bg-blue-600 text-white border-blue-600', soft: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800' },
  { letter: 'B', label: 'En proceso', hint: 'Está cerca, necesita apoyo', solid: 'bg-amber-500 text-white border-amber-500', soft: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800' },
  { letter: 'C', label: 'En inicio', hint: 'Necesita mucho acompañamiento', solid: 'bg-rose-600 text-white border-rose-600', soft: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800' },
];

export const gradeOption = (g?: GradeLetter | null) => GRADE_OPTIONS.find(o => o.letter === g);
