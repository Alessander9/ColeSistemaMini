import { describe, it, expect } from 'vitest';
import { TEST_USERS, TEST_SECTION_COURSES } from './test-fixtures';

describe('Gestión de Docentes & Asignación de Materias y Salones', () => {
  it('debe contener la lista de 8 docentes especialistas activos', () => {
    const teachers = TEST_USERS.filter(u => u.rol === 'docente');
    expect(teachers.length).toBe(8);
    
    // Verificar que cada profesor tiene DNI, correo institucional y especialidad
    teachers.forEach(teacher => {
      expect(teacher.dni).toBeDefined();
      expect(teacher.dni?.length).toBe(8);
      expect(teacher.email).toContain('@colegio.edu.pe');
      expect(teacher.activo).toBe(true);
    });
  });

  it('debe validar la asignación de materias a salones con carga horaria semanal', () => {
    expect(TEST_SECTION_COURSES.length).toBeGreaterThan(0);

    const assignment = TEST_SECTION_COURSES[0];
    expect(assignment.seccion_id).toBeDefined();
    expect(assignment.curso_id).toBeDefined();
    expect(assignment.docente_id).toBeDefined();
    expect(assignment.horas_semanales).toBeGreaterThan(0);
  });

  it('debe permitir asignar materias y salones a un docente', () => {
    const carlosMendoza = TEST_USERS.find(u => u.id === 'user-docente-1');
    expect(carlosMendoza).toBeDefined();

    const assignments = TEST_SECTION_COURSES.filter(sca => sca.docente_id === carlosMendoza?.id);
    expect(assignments.length).toBeGreaterThanOrEqual(1);
  });

  it('debe calcular la carga horaria total acumulada del profesor', () => {
    const patriciaGarcia = TEST_USERS.find(u => u.id === 'user-docente-2');
    const assignments = TEST_SECTION_COURSES.filter(sca => sca.docente_id === patriciaGarcia?.id);
    const totalHours = assignments.reduce((sum, a) => sum + (a.horas_semanales || 0), 0);

    expect(totalHours).toBeGreaterThan(0);
    expect(totalHours).toBeLessThanOrEqual(30);
  });
});
