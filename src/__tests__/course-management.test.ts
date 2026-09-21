import { describe, it, expect } from 'vitest';
import { 
  createCourseInDb, 
  updateCourseInDb, 
  deleteCourseFromDb, 
  fetchCourses 
} from '@/lib/services/academicService';
import { MOCK_COURSES } from '@/lib/mock-data';

describe('Gestión de Cursos y Asignaturas Escolares (Inicial, Primaria, Secundaria)', () => {
  it('debe contener los cursos base del catálogo académico', async () => {
    const courses = await fetchCourses();
    expect(courses.length).toBeGreaterThanOrEqual(MOCK_COURSES.length);
    expect(courses.some(c => c.codigo.startsWith('MAT'))).toBe(true);
  });

  it('debe registrar un nuevo curso con código, nivel y competencias CNEB', async () => {
    const newCourse = await createCourseInDb({
      nombre: 'Robótica y Pensamiento Computacional',
      codigo: 'ROB-SEC',
      nivel: 'secundaria',
      color_hex: '#0891b2',
      area_curricular: 'Computación, TIC & Robótica',
      horas_semanales_sugeridas: 4,
      descripcion: 'Taller práctico de diseño de algoritmos, sensores y microcontroladores.',
      competencias: [
        { codigo: 'C1', descripcion: 'Diseña y programa prototipos robóticos' },
        { codigo: 'C2', descripcion: 'Resuelve problemas lógicos mediante algoritmos' }
      ]
    });

    expect(newCourse).toBeDefined();
    expect(newCourse.nombre).toBe('Robótica y Pensamiento Computacional');
    expect(newCourse.codigo).toBe('ROB-SEC');
    expect(newCourse.nivel).toBe('secundaria');
    expect(newCourse.competencias?.length).toBe(2);
    expect(newCourse.competencias?.[0].codigo).toBe('C1');
    expect(newCourse.competencias?.[1].codigo).toBe('C2');
  });

  it('permite actualizar los datos y las competencias de una asignatura existente', async () => {
    const course = await createCourseInDb({
      nombre: 'Taller de Arte y Expresión',
      codigo: 'ART-INI',
      nivel: 'inicial',
      competencias: [{ codigo: 'C1', descripcion: 'Explora y experimenta los lenguajes del arte' }]
    });

    const updated = await updateCourseInDb(course.id, {
      nombre: 'Taller de Arte, Música y Danza',
      horas_semanales_sugeridas: 3,
      competencias: [
        { codigo: 'C1', descripcion: 'Explora y experimenta los lenguajes del arte' },
        { codigo: 'C2', descripcion: 'Aplica procesos creativos grupales' }
      ]
    });

    expect(updated).not.toBeNull();
    expect(updated?.nombre).toBe('Taller de Arte, Música y Danza');
    expect(updated?.horas_semanales_sugeridas).toBe(3);
    expect(updated?.competencias?.length).toBe(2);
  });

  it('permite eliminar un curso del catálogo de forma segura', async () => {
    const tempCourse = await createCourseInDb({
      nombre: 'Curso Temporal de Prueba',
      codigo: 'TMP-TEST',
      nivel: 'primaria',
    });

    const deleted = await deleteCourseFromDb(tempCourse.id);
    expect(deleted).toBe(true);

    const allCourses = await fetchCourses();
    expect(allCourses.some(c => c.id === tempCourse.id)).toBe(false);
  });
});
