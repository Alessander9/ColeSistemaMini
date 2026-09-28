import { describe, it, expect } from 'vitest';
import { gradeToNumber, numberToGrade, calculateAverage, calculateAnnualStatus } from '../lib/grades/calculations';
import { generateStudentEmail, generateStudentPassword, generateStudentUsername } from '../lib/auth/generateCredentials';
import { MOCK_COURSES, MOCK_SECTIONS, MOCK_GRADE_RECORDS, MOCK_STUDENTS } from '../lib/mock-data';
import { GradeLetter } from '../types';

describe('API Endpoints & Academic Services Suite', () => {
  it('correctly maps CNEB letter grades to pedagogical numerical values 1 to 4', () => {
    expect(gradeToNumber('AD')).toBe(4);
    expect(gradeToNumber('A')).toBe(3);
    expect(gradeToNumber('B')).toBe(2);
    expect(gradeToNumber('C')).toBe(1);
  });

  it('calculates competency averages accurately using official scale', () => {
    const grades: GradeLetter[] = ['AD', 'AD', 'A'];
    const result = calculateAverage(grades);
    expect(['AD', 'A']).toContain(result.averageLetter);
    expect(result.averageScore).toBeGreaterThanOrEqual(3.5);
    expect(result.count).toBe(3);
  });

  it('returns no average letter (instead of C) when there are no grades yet', () => {
    const result = calculateAverage([]);
    expect(result.averageLetter).toBeNull();
    expect(result.averageScore).toBe(0);
    expect(result.count).toBe(0);
  });

  it('determines annual student promotion status', () => {
    const annual = calculateAnnualStatus(['AD', 'A', 'AD', 'A']);
    expect(annual.status).toBe('PROMOVIDO');
    expect(annual.finalLetter).toBe('AD');
  });

  it('generates compliant and safe student credentials', () => {
    const pass = generateStudentPassword('Sebastián', 'Vargas Huamán', '2015-08-20');
    expect(pass).toMatch(/^[A-Z][a-z]{2}[a-z]{3}\d{6}$/);

    const email = generateStudentEmail('Sebastián', 'Vargas Huamán');
    expect(email).toBe('sebastian.vargas@colegio.edu.pe');

    const username = generateStudentUsername('Vargas Huamán', '78945612');
    expect(username).toBe('vargas612');
  });

  it('validates mock curricular catalog structure and integrity', () => {
    expect(MOCK_COURSES.length).toBeGreaterThanOrEqual(4);
    expect(MOCK_SECTIONS.length).toBeGreaterThanOrEqual(4);
    expect(Array.isArray(MOCK_STUDENTS)).toBe(true);

    MOCK_COURSES.forEach((course) => {
      expect(course.nombre).toBeTruthy();
      expect(course.competencias).toBeDefined();
    });
  });

  it('validates grade record references and constraints', () => {
    MOCK_GRADE_RECORDS.forEach((grade) => {
      expect(grade.matricula_id).toBeTruthy();
      expect(grade.competencia_id).toBeTruthy();
      expect(['AD', 'A', 'B', 'C']).toContain(grade.nota_letra);
      expect(grade.nota_numerica).toBeGreaterThanOrEqual(1);
      expect(grade.nota_numerica).toBeLessThanOrEqual(4);
    });
  });
});
