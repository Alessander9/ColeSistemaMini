import { describe, it, expect } from 'vitest';
import { MOCK_USERS, MOCK_SECTION_COURSES, MOCK_SECTIONS, MOCK_COURSES } from '../lib/mock-data';

describe('Gestión de Docentes & Asignación de Materias y Salones', () => {
  it('debe contener la lista de 8 docentes especialistas activos', () => {
    const teachers = MOCK_USERS.filter(u => u.rol === 'docente');
    expect(teachers.length).toBe(8);
    
    // Verificar que cada profesor tiene DNI, correo institucional y especialidad
    teachers.forEach(teacher => {
      expect(teacher.dni).toBeDefined();
      expect(teacher.dni.length).toBe(8);
      expect(teacher.email).toContain('@colegio.edu.pe');
      expect(teacher.activo).toBe(true);
    });
  });

  it('debe validar la asignación de materias a salones con carga horaria semanal', () => {
    expect(MOCK_SECTION_COURSES.length).toBeGreaterThan(0);

    const assignment = MOCK_SECTION_COURSES[0];
    expect(assignment.seccion_id).toBeDefined();
    expect(assignment.curso_id).toBeDefined();
    expect(assignment.docente_id).toBeDefined();
    expect(assignment.horas_semanales).toBeGreaterThan(0);
    expect(assignment.aula_defecto).toBeDefined();
  });

  it('debe permitir asignar múltiples materias y salones a un mismo docente', () => {
    const carlosMendoza = MOCK_USERS.find(u => u.id === 'user-docente-1');
    expect(carlosMendoza).toBeDefined();

    const assignments = MOCK_SECTION_COURSES.filter(sca => sca.docente_id === carlosMendoza?.id);
    // Carlos Mendoza enseña en 3° Primaria A, 3° Primaria B y 1° Secundaria A
    expect(assignments.length).toBeGreaterThanOrEqual(3);

    const sectionsTaught = assignments.map(a => a.seccion_id);
    expect(sectionsTaught).toContain('sec-3pri-a');
    expect(sectionsTaught).toContain('sec-3pri-b');
    expect(sectionsTaught).toContain('sec-1sec-a');
  });

  it('debe calcular la carga horaria total acumulada del profesor', () => {
    const patriciaGarcia = MOCK_USERS.find(u => u.id === 'user-docente-2');
    const assignments = MOCK_SECTION_COURSES.filter(sca => sca.docente_id === patriciaGarcia?.id);
    const totalHours = assignments.reduce((sum, a) => sum + (a.horas_semanales || 0), 0);

    expect(totalHours).toBeGreaterThan(0);
    expect(totalHours).toBeLessThanOrEqual(30); // Carga docente realista dentro del límite escolar
  });
});
