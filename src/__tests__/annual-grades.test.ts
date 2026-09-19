import { describe, it, expect } from 'vitest';
import {
  calculateAverage,
  calculateCourseBimesterGrade,
  calculateCourseAnnualSummary,
  calculateStudentAnnualReportCard,
  gradeToNumber,
  numberToGrade,
  gradeToVigesimal,
  vigesimalToGrade,
} from '@/lib/grades/calculations';
import { GradeLetter, Course, GradeRecord } from '@/types';
import { MOCK_COURSES, MOCK_EVALUATION_PERIODS, MOCK_GRADE_RECORDS } from '@/lib/mock-data';

describe('Cálculo Oficial Anual de Calificaciones (4 Bimestres - MINEDU / CNEB)', () => {
  it('convierte correctamente las notas cualitativas a escala numérica (1 a 4)', () => {
    expect(gradeToNumber('AD')).toBe(4);
    expect(gradeToNumber('A')).toBe(3);
    expect(gradeToNumber('B')).toBe(2);
    expect(gradeToNumber('C')).toBe(1);
  });

  it('convierte correctamente promedios cuantitativos a letras cualitativas', () => {
    expect(numberToGrade(3.8)).toBe('AD');
    expect(numberToGrade(3.5)).toBe('AD');
    expect(numberToGrade(3.49)).toBe('A');
    expect(numberToGrade(2.5)).toBe('A');
    expect(numberToGrade(2.49)).toBe('B');
    expect(numberToGrade(1.5)).toBe('B');
    expect(numberToGrade(1.49)).toBe('C');
  });

  it('calcula el promedio exacto de los 4 bimestres para un curso', () => {
    const course = MOCK_COURSES[0]; // Matemática
    const bimestersData = [
      { periodId: 'eval-bim-1', bimesterNumber: 1, gradeLetter: 'AD' as GradeLetter, score: 4 },
      { periodId: 'eval-bim-2', bimesterNumber: 2, gradeLetter: 'AD' as GradeLetter, score: 4 },
      { periodId: 'eval-bim-3', bimesterNumber: 3, gradeLetter: 'A' as GradeLetter, score: 3 },
      { periodId: 'eval-bim-4', bimesterNumber: 4, gradeLetter: 'AD' as GradeLetter, score: 4 },
    ];

    const summary = calculateCourseAnnualSummary(course, bimestersData);
    // (4 + 4 + 3 + 4) / 4 = 15 / 4 = 3.75 => 'AD'
    expect(summary.finalGrade).toBe('AD');
    expect(summary.finalScore).toBe(3.75);
    expect(summary.status).toBe('aprobado');
    expect(summary.evaluatedBimestersCount).toBe(4);
  });

  it('determina que un curso con calificación final C pasa a estado desaprobado', () => {
    const course = MOCK_COURSES[0];
    const bimestersData = [
      { periodId: 'eval-bim-1', bimesterNumber: 1, gradeLetter: 'C' as GradeLetter, score: 1 },
      { periodId: 'eval-bim-2', bimesterNumber: 2, gradeLetter: 'C' as GradeLetter, score: 1 },
      { periodId: 'eval-bim-3', bimesterNumber: 3, gradeLetter: 'B' as GradeLetter, score: 2 },
      { periodId: 'eval-bim-4', bimesterNumber: 4, gradeLetter: 'C' as GradeLetter, score: 1 },
    ];

    const summary = calculateCourseAnnualSummary(course, bimestersData);
    // (1 + 1 + 2 + 1) / 4 = 1.25 => 'C'
    expect(summary.finalGrade).toBe('C');
    expect(summary.status).toBe('desaprobado');
  });

  it('calcula la Libreta Final Consolidada y determina PROMOVIDO cuando todos los cursos están aprobados', () => {
    const sampleGrades: GradeRecord[] = [];
    MOCK_COURSES.forEach((course) => {
      course.competencias?.forEach((comp) => {
        MOCK_EVALUATION_PERIODS.forEach((period) => {
          sampleGrades.push({
            id: `gr-${course.id}-${comp.id}-${period.id}`,
            matricula_id: 'enr-1',
            curso_id: course.id,
            competencia_id: comp.id,
            periodo_evaluacion_id: period.id,
            nota_letra: 'AD',
            nota_numerica: 4,
            conclusiones_descriptivas: 'Excelente desempeño.',
            created_at: '2026-03-15',
          });
        });
      });
    });

    const reportCard = calculateStudentAnnualReportCard({
      enrollmentId: 'enr-1',
      studentId: 'student-1',
      studentName: 'Silva Mendoza, Mateo Alejandro',
      studentDni: '44556677',
      studentCode: 'EST-2026-001',
      gradeLevelName: '3° de Primaria',
      sectionLetter: 'A',
      academicYear: 2026,
      courses: MOCK_COURSES,
      grades: sampleGrades,
      evaluationPeriodIds: MOCK_EVALUATION_PERIODS.map((p) => ({ id: p.id, numero_periodo: p.numero_periodo })),
      attendancePercentage: 99,
      conductGrade: 'AD',
    });

    expect(reportCard.courses.length).toBeGreaterThan(0);
    expect(reportCard.finalAcademicStatus).toBe('PROMOVIDO');
    expect(reportCard.statusLabel).toContain('PROMOVIDO');
    expect(reportCard.attendancePercentage).toBe(99);
    expect(reportCard.conductGrade).toBe('AD');
  });
});
