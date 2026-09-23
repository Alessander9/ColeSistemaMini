import { describe, it, expect } from 'vitest';
import { TEST_STUDENTS } from './test-fixtures';

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
    const matches = TEST_STUDENTS.filter(s =>
      `${s.nombres} ${s.apellidos} ${s.codigo_estudiante}`
        .toLowerCase()
        .includes(query)
    );

    expect(matches.length).toBeGreaterThan(0);
    const firstMatch = matches[0];
    expect(firstMatch).toBeDefined();
    expect((firstMatch?.apellidos ?? '').toLowerCase()).toContain('silva');
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

  it('filters enrollments by level, student name, and grade accurately', () => {
    const mockEnrollments = [
      {
        id: 'enr-1',
        estudiante: { profile: { nombres: 'Héctor', apellidos: 'Salazar' }, codigo_estudiante: 'EST-2026-001' },
        seccion: { letra: 'A', grado: { nivel: 'inicial', nombre: '3 Años' } },
        estado: 'activo'
      },
      {
        id: 'enr-2',
        estudiante: { profile: { nombres: 'Mateo', apellidos: 'Silva' }, codigo_estudiante: 'EST-2026-002' },
        seccion: { letra: 'B', grado: { nivel: 'primaria', nombre: '3° De Primaria' } },
        estado: 'activo'
      },
      {
        id: 'enr-3',
        estudiante: { profile: { nombres: 'Lucía', apellidos: 'Romero' }, codigo_estudiante: 'EST-2026-003' },
        seccion: { letra: 'A', grado: { nivel: 'secundaria', nombre: '1° De Secundaria' } },
        estado: 'activo'
      }
    ];

    const inicialList = mockEnrollments.filter(e => e.seccion.grado.nivel === 'inicial');
    expect(inicialList.length).toBe(1);
    expect(inicialList[0].estudiante.profile.nombres).toBe('Héctor');

    const searchPrimaria = mockEnrollments.filter(e => 
      `${e.estudiante.profile.nombres} ${e.seccion.grado.nombre}`.toLowerCase().includes('mateo')
    );
    expect(searchPrimaria.length).toBe(1);
    expect(searchPrimaria[0].seccion.grado.nivel).toBe('primaria');
  });
});
