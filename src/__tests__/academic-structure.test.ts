import { describe, it, expect } from 'vitest';
import { 
  MOCK_GRADE_LEVELS, 
  MOCK_EVALUATION_PERIODS,
  MOCK_COMPETENCIES
} from '@/lib/mock-data';
import { TEST_USERS } from './test-fixtures';

describe('Estructura Académica Escolar (Inicial, Primaria y Secundaria)', () => {
  it('debe contener exclusivamente los 3 niveles educativos oficiales: Inicial (3), Primaria (6) y Secundaria (5)', () => {
    const inicialGrades = MOCK_GRADE_LEVELS.filter(g => g.nivel === 'inicial');
    const primariaGrades = MOCK_GRADE_LEVELS.filter(g => g.nivel === 'primaria');
    const secundariaGrades = MOCK_GRADE_LEVELS.filter(g => g.nivel === 'secundaria');

    expect(inicialGrades.length).toBe(3);
    expect(primariaGrades.length).toBe(6);
    expect(secundariaGrades.length).toBe(5);
    expect(MOCK_GRADE_LEVELS.length).toBe(14);
  });

  it('debe tener los 4 periodos bimestrales oficiales configurados', () => {
    expect(MOCK_EVALUATION_PERIODS.length).toBe(4);
    const bimestres = MOCK_EVALUATION_PERIODS.map(p => p.numero_periodo);
    expect(bimestres).toEqual([1, 2, 3, 4]);
  });

  it('debe incluir las áreas curriculares y competencias esenciales del CNEB', () => {
    expect(MOCK_COMPETENCIES.length).toBeGreaterThan(0);
    const c1 = MOCK_COMPETENCIES.find(c => c.codigo === 'C1');
    expect(c1).toBeDefined();
  });

  it('permite registrar docentes especialistas', () => {
    const teachers = TEST_USERS.filter(u => u.rol === 'docente');
    expect(teachers.length).toBeGreaterThanOrEqual(8);
  });
});
