import { describe, it, expect } from 'vitest';
import { NotaCualitativa } from '@/types';
import { TEST_GRADE_RECORDS, TEST_ENROLLMENTS, TEST_PERIODS } from './test-fixtures';

// Helper to determine predominant achievement level
function calculatePredominantGrade(grades: NotaCualitativa[]): NotaCualitativa {
  if (grades.length === 0) return 'A';
  const counts: Record<NotaCualitativa, number> = { AD: 0, A: 0, B: 0, C: 0 };
  grades.forEach(g => { counts[g] = (counts[g] || 0) + 1; });

  if (counts.AD >= counts.A && counts.AD >= counts.B && counts.AD >= counts.C && counts.AD >= 2) return 'AD';
  if (counts.C > counts.A && counts.C > counts.B) return 'C';
  if (counts.B > counts.A) return 'B';
  return 'A';
}

describe('Cálculo de Calificaciones por Competencias (Escala MINEDU)', () => {
  it('calcula correctamente el logro predominante AD cuando hay mayoría de AD', () => {
    const grades: NotaCualitativa[] = ['AD', 'AD', 'A', 'AD'];
    expect(calculatePredominantGrade(grades)).toBe('AD');
  });

  it('calcula logro esperado A cuando el estudiante alcanza las metas previstas', () => {
    const grades: NotaCualitativa[] = ['A', 'A', 'B', 'A'];
    expect(calculatePredominantGrade(grades)).toBe('A');
  });

  it('calcula en proceso B cuando predominan notas de refuerzo', () => {
    const grades: NotaCualitativa[] = ['B', 'B', 'A', 'B'];
    expect(calculatePredominantGrade(grades)).toBe('B');
  });

  it('las notas de los registros de prueba corresponden a matrículas y periodos válidos', () => {
    TEST_GRADE_RECORDS.forEach(gr => {
      const enrollment = TEST_ENROLLMENTS.find(e => e.id === gr.matricula_id);
      const period = TEST_PERIODS.find(p => p.id === gr.periodo_evaluacion_id);

      expect(enrollment).toBeDefined();
      expect(period).toBeDefined();
      expect(['AD', 'A', 'B', 'C']).toContain(gr.nota_cualitativa);
    });
  });
});
