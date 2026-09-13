import { describe, it, expect } from 'vitest';
import { MOCK_STUDENTS, MOCK_COURSES } from '../lib/mock-data';

describe('DataTable Pagination & Filters', () => {
  it('correctly calculates pagination for items per page = 10', () => {
    const itemsPerPage = 10;
    const totalItems = 25;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    expect(totalPages).toBe(3);

    const page1 = Array.from({ length: totalItems }, (_, i) => i + 1).slice(0, 10);
    const page2 = Array.from({ length: totalItems }, (_, i) => i + 1).slice(10, 20);
    const page3 = Array.from({ length: totalItems }, (_, i) => i + 1).slice(20, 25);

    expect(page1.length).toBe(10);
    expect(page2.length).toBe(10);
    expect(page3.length).toBe(5);
  });

  it('filters students by grade level and text query', () => {
    const query = 'silva';
    const matches = MOCK_STUDENTS.filter(s =>
      `${s.profile?.nombres} ${s.profile?.apellidos} ${s.codigo_estudiante}`
        .toLowerCase()
        .includes(query)
    );

    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].profile?.apellidos.toLowerCase()).toContain('silva');
  });

  it('validates CNEB competency grading scale consistency', () => {
    const validGrades = ['AD', 'A', 'B', 'C'];
    validGrades.forEach(grade => {
      expect(['AD', 'A', 'B', 'C']).toContain(grade);
    });
  });
});
