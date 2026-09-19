import { describe, it, expect } from 'vitest';
import { 
  TEST_SECTIONS, 
  TEST_GRADES, 
  TEST_SECTION_COURSES, 
  TEST_SCHEDULE_SLOTS 
} from './test-fixtures';

describe('Navegación y Consultas por Sección Escolar', () => {
  it('cada sección debe estar asociada a un grado válido existente', () => {
    TEST_SECTIONS.forEach(sec => {
      const parentGrade = TEST_GRADES.find(g => g.id === sec.grado_id);
      expect(parentGrade).toBeDefined();
      expect(['inicial', 'primaria', 'secundaria']).toContain(parentGrade!.nivel);
    });
  });

  it('permite consultar las materias asignadas a una sección específica', () => {
    const targetSeccionId = 'sec-g-pri-1-a';
    const assignedCourses = TEST_SECTION_COURSES.filter(sc => sc.seccion_id === targetSeccionId);

    expect(assignedCourses.length).toBeGreaterThan(0);
    assignedCourses.forEach(ac => {
      expect(ac.seccion_id).toBe(targetSeccionId);
      expect(ac.docente_id).toBeDefined();
      expect(ac.horas_semanales).toBeGreaterThan(0);
    });
  });

  it('permite obtener la malla horaria semanal completa de una sección', () => {
    const targetSeccionId = 'sec-g-pri-1-a';
    const sectionSlots = TEST_SCHEDULE_SLOTS.filter(s => s.seccion_id === targetSeccionId);

    expect(sectionSlots.length).toBeGreaterThan(0);
    
    sectionSlots.forEach(slot => {
      expect(slot.dia).toBeGreaterThanOrEqual(1);
      expect(slot.hora_inicio).toMatch(/^[0-1][0-9]:[0-5][0-9]$/);
      expect(slot.hora_fin).toMatch(/^[0-1][0-9]:[0-5][0-9]$/);
    });
  });
});
