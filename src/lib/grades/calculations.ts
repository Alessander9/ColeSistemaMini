import { GradeLetter, AttendanceStatus } from '@/types';

/**
 * Mapeo oficial de notas cualitativas a valor cuantitativo para cálculo pedagógico
 */
export const GRADE_SCALE: Record<GradeLetter, { value: number; label: string; minScore: number; maxScore: number }> = {
  AD: { value: 4, label: 'Logro Destacado', minScore: 18, maxScore: 20 },
  A:  { value: 3, label: 'Logro Esperado',   minScore: 14, maxScore: 17 },
  B:  { value: 2, label: 'En Proceso',       minScore: 11, maxScore: 13 },
  C:  { value: 1, label: 'En Inicio',        minScore: 0,  maxScore: 10 },
};

/**
 * Convierte una letra de calificación en su valor numérico (1 a 4)
 */
export function gradeToNumber(grade: GradeLetter): number {
  return GRADE_SCALE[grade]?.value ?? 0;
}

/**
 * Convierte un promedio numérico (1.0 a 4.0) a su letra cualitativa oficial
 */
export function numberToGrade(score: number): GradeLetter {
  if (score >= 3.5) return 'AD';
  if (score >= 2.5) return 'A';
  if (score >= 1.5) return 'B';
  return 'C';
}

/**
 * Calcula el promedio de una serie de calificaciones cualitativas
 */
export function calculateAverage(grades: GradeLetter[]): {
  averageLetter: GradeLetter;
  averageScore: number;
  count: number;
} {
  const validGrades = grades.filter((g) => ['AD', 'A', 'B', 'C'].includes(g));
  if (validGrades.length === 0) {
    return { averageLetter: 'C', averageScore: 0, count: 0 };
  }

  const sum = validGrades.reduce((acc, g) => acc + gradeToNumber(g), 0);
  const averageScore = Number((sum / validGrades.length).toFixed(2));
  const averageLetter = numberToGrade(averageScore);

  return { averageLetter, averageScore, count: validGrades.length };
}

/**
 * Calcula el estado final anual según la escala de evaluación escolar
 */
export function calculateAnnualStatus(periodAverages: GradeLetter[]): {
  finalLetter: GradeLetter;
  finalScore: number;
  status: 'PROMOVIDO' | 'RECUPERACIÓN' | 'PERMANECE';
  statusColor: string;
} {
  const { averageLetter, averageScore } = calculateAverage(periodAverages);

  // Criterio pedagógico estándar:
  // Si tiene mayoría de C o el promedio es C => Requiere recuperación o permanece
  // Si promedio >= B => Promovido
  let status: 'PROMOVIDO' | 'RECUPERACIÓN' | 'PERMANECE' = 'PROMOVIDO';
  let statusColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';

  if (averageLetter === 'C') {
    status = 'PERMANECE';
    statusColor = 'text-rose-600 bg-rose-50 border-rose-200';
  } else if (averageLetter === 'B' && periodAverages.includes('C')) {
    status = 'RECUPERACIÓN';
    statusColor = 'text-amber-600 bg-amber-50 border-amber-200';
  }

  return {
    finalLetter: averageLetter,
    finalScore: averageScore,
    status,
    statusColor,
  };
}

/**
 * Estilos visuales y metadatos para UI de Notas
 */
export function getGradeMeta(grade?: GradeLetter | string | null) {
  switch (grade) {
    case 'AD':
      return {
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-500/30',
        badge: 'bg-emerald-600 text-white',
        label: 'AD (Logro Destacado)',
        desc: 'Supera los aprendizajes esperados',
      };
    case 'A':
      return {
        bg: 'bg-blue-500/10 dark:bg-blue-500/20',
        text: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-500/30',
        badge: 'bg-blue-600 text-white',
        label: 'A (Logro Esperado)',
        desc: 'Demuestra el nivel esperado',
      };
    case 'B':
      return {
        bg: 'bg-amber-500/10 dark:bg-amber-500/20',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-500/30',
        badge: 'bg-amber-500 text-white',
        label: 'B (En Proceso)',
        desc: 'Próximo a alcanzar el nivel',
      };
    case 'C':
      return {
        bg: 'bg-rose-500/10 dark:bg-rose-500/20',
        text: 'text-rose-700 dark:text-rose-400',
        border: 'border-rose-500/30',
        badge: 'bg-rose-600 text-white',
        label: 'C (En Inicio)',
        desc: 'Muestra dificultades iniciales',
      };
    default:
      return {
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-500 dark:text-slate-400',
        border: 'border-slate-200 dark:border-slate-700',
        badge: 'bg-slate-400 text-white',
        label: 'Sin Calificar',
        desc: 'Pendiente de registro',
      };
  }
}

/**
 * Estilos visuales para estados de Asistencia
 */
export function getAttendanceMeta(status: AttendanceStatus) {
  switch (status) {
    case 'presente':
      return {
        label: 'Presente',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
        dot: 'bg-emerald-500',
      };
    case 'tardanza':
      return {
        label: 'Tardanza',
        bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
        dot: 'bg-amber-500',
      };
    case 'falta':
      return {
        label: 'Falta',
        bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
        dot: 'bg-rose-500',
      };
    case 'justificado':
      return {
        label: 'Justificado',
        bg: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
        dot: 'bg-sky-500',
      };
  }
}
