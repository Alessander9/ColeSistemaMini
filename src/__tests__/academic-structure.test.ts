import { describe, it, expect } from 'vitest';
import { 
  MOCK_GRADES, 
  MOCK_SECTIONS, 
  MOCK_COURSES, 
  MOCK_USERS, 
  MOCK_EVALUATION_PERIODS 
} from '@/lib/mock-data';

describe('Estructura Académica Escolar (Inicial, Primaria y Secundaria)', () => {
  it('debe contener exclusivamente los 3 niveles educativos oficiales: Inicial (3), Primaria (6) y Secundaria (5)', () => {
    const inicialGrades = MOCK_GRADES.filter(g => g.nivel === 'inicial');
    const primariaGrades = MOCK_GRADES.filter(g => g.nivel === 'primaria');
    const secundariaGrades = MOCK_GRADES.filter(g => g.nivel === 'secundaria');

    expect(inicialGrades.length).toBe(3);
    expect(primariaGrades.length).toBe(6);
    expect(secundariaGrades.length).toBe(5);
    expect(MOCK_GRADES.length).toBe(14);
  });

  it('debe contar con 2 secciones por grado (A y B) para un total de 28 secciones', () => {
    expect(MOCK_SECTIONS.length).toBe(28);

    MOCK_GRADES.forEach(grade => {
      const gradeSections = MOCK_SECTIONS.filter(s => s.grado_id === grade.id);
      expect(gradeSections.length).toBe(2);
      
      const letters = gradeSections.map(s => s.letra).sort();
      expect(letters).toEqual(['A', 'B']);
    });
  });

  it('debe tener los 4 periodos bimestrales oficiales configurados', () => {
    expect(MOCK_EVALUATION_PERIODS.length).toBe(4);
    const bimestres = MOCK_EVALUATION_PERIODS.map(p => p.numero_periodo);
    expect(bimestres).toEqual([1, 2, 3, 4]);
  });

  it('debe incluir las áreas curriculares esenciales del CNEB con sus competencias', () => {
    const courseCodes = MOCK_COURSES.map(c => c.codigo);
    
    expect(courseCodes.some(c => c.startsWith('MAT'))).toBe(true);
    expect(courseCodes.some(c => c.startsWith('COM'))).toBe(true);
    expect(courseCodes.some(c => c.startsWith('CTA'))).toBe(true);
    expect(courseCodes.some(c => c.startsWith('ING'))).toBe(true);
    expect(courseCodes.some(c => c.startsWith('SOC'))).toBe(true);

    MOCK_COURSES.forEach(course => {
      expect(course.competencias).toBeDefined();
      expect(course.competencias!.length).toBeGreaterThan(0);
    });
  });

  it('debe contar con docentes especialistas registrados', () => {
    const teachers = MOCK_USERS.filter(u => u.rol === 'docente');
    expect(teachers.length).toBeGreaterThanOrEqual(8);
  });
});
