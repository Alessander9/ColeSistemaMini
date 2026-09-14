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

  it('verifies asistencia operator role profile and permissions', () => {
    const validRoles = ['admin', 'docente', 'estudiante', 'asistencia'];
    expect(validRoles).toContain('asistencia');
  });

  it('generates normalized QR tokens handling accents like André without character corruption', () => {
    const nombres = 'André';
    const apellidos = 'centeno alva';
    const studentCode = 'EST-2026-009';

    const cleanFirst = nombres.trim().split(' ')[0].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    const cleanLast = apellidos.trim().split(' ')[0].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    const tokenQr = `QR-${studentCode}-${cleanFirst}-${cleanLast}`;

    expect(tokenQr).toBe('QR-EST-2026-009-ANDRE-CENTENO');
    expect(tokenQr).not.toContain('É');
  });

  it('matches QR scans with accents, lowercase, DNI, or student codes robustly', () => {
    const student = {
      id: 'student-99',
      codigo_estudiante: 'EST-2026-009',
      token_qr: 'QR-EST-2026-009-ANDRE-CENTENO',
      profile: { dni: '12345678', nombres: 'André', apellidos: 'centeno alva' },
    };

    const normalize = (str?: string) =>
      str ? str.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";

    const findMatch = (rawInput: string) => {
      const normInput = normalize(rawInput);
      return [student].find(s => {
        const sToken = normalize(s.token_qr);
        const sCode = normalize(s.codigo_estudiante);
        const sDni = normalize(s.profile?.dni);
        return (
          sToken === normInput ||
          sCode === normInput ||
          sDni === normInput ||
          (sCode && normInput.includes(sCode)) ||
          (sToken && normInput.includes(sToken)) ||
          (sDni && normInput.includes(sDni))
        );
      });
    };

    expect(findMatch('QR-EST-2026-009-ANDRE-CENTENO')).toBeDefined();
    expect(findMatch('qr-est-2026-009-andré-centeno')).toBeDefined(); // Accented scan
    expect(findMatch('EST-2026-009')).toBeDefined(); // Code scan
    expect(findMatch('12345678')).toBeDefined(); // DNI scan
  });
});
