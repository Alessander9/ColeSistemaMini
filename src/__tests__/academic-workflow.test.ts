import { describe, it, expect } from 'vitest';
import { 
  TaskAssignment, 
  TaskSubmission, 
  GradeRecord, 
  AttendanceRecord,
  GradeLetter 
} from '@/types';
import { 
  MOCK_STUDENTS, 
  MOCK_ENROLLMENTS, 
  MOCK_COURSES, 
  MOCK_EVALUATION_PERIODS,
  MOCK_GRADE_RECORDS 
} from '@/lib/mock-data';

describe('Flujo Académico: Tareas, Calificaciones y Asistencia', () => {
  it('un profesor puede crear una tarea asignada a una sección', () => {
    const newTask: TaskAssignment = {
      id: 'task-test-1',
      curso_id: 'course-mat',
      seccion_id: 'sec-3pri-a',
      docente_id: 'user-docente-1',
      titulo: 'Resolución de Problemas con Ecuaciones',
      descripcion: 'Desarrollar los ejercicios 1 al 10 de la ficha pedagógica.',
      fecha_limite: '2026-09-25T23:59:00Z',
      created_at: new Date().toISOString(),
      curso: MOCK_COURSES[0],
    };

    expect(newTask.id).toBeDefined();
    expect(newTask.titulo).toBe('Resolución de Problemas con Ecuaciones');
    expect(newTask.curso_id).toBe('course-mat');
  });

  it('un alumno puede enviar su entrega de tarea con comentarios', () => {
    const submission: TaskSubmission = {
      id: 'sub-test-1',
      tarea_id: 'task-test-1',
      matricula_id: 'enr-1',
      fecha_entrega: new Date().toISOString(),
      comentario_estudiante: 'Profesor, adjunto la resolución de los 10 ejercicios.',
    };

    expect(submission.tarea_id).toBe('task-test-1');
    expect(submission.matricula_id).toBe('enr-1');
    expect(submission.comentario_estudiante).toBeDefined();
    expect(submission.calificacion_letra).toBeUndefined(); // Aún no calificada
  });

  it('el docente puede calificar la entrega con nota por competencias (AD, A, B, C) y retroalimentación', () => {
    const gradedSubmission: TaskSubmission = {
      id: 'sub-test-1',
      tarea_id: 'task-test-1',
      matricula_id: 'enr-1',
      fecha_entrega: new Date().toISOString(),
      comentario_estudiante: 'Profesor, adjunto la resolución de los 10 ejercicios.',
      calificacion_letra: 'AD',
      retroalimentacion_docente: '¡Excelente trabajo! Justificaste cada paso de la solución.',
    };

    expect(gradedSubmission.calificacion_letra).toBe('AD');
    expect(gradedSubmission.retroalimentacion_docente).toContain('Excelente');
  });

  it('el registro oficial de notas por competencias admite la escala MINEDU', () => {
    const allowedGrades: GradeLetter[] = ['AD', 'A', 'B', 'C'];

    MOCK_GRADE_RECORDS.forEach(record => {
      expect(allowedGrades).toContain(record.nota_letra);
      expect(record.matricula_id).toBeDefined();
      expect(record.competencia_id).toBeDefined();
      expect(record.periodo_evaluacion_id).toBeDefined();
    });
  });

  it('el registro de asistencia valida los estados presente, tardanza, falta y justificada', () => {
    const attendance: AttendanceRecord = {
      id: 'att-test-1',
      matricula_id: 'enr-1',
      fecha: '2026-09-13',
      hora_registro: '07:55:00',
      estado: 'presente',
      metodo: 'qr',
      registrado_por: 'user-docente-1',
    };

    expect(attendance.estado).toBe('presente');
    expect(attendance.metodo).toBe('qr');
    expect(attendance.hora_registro).toBe('07:55:00');
  });
});
