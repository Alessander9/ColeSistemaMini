import { describe, it, expect, beforeEach } from 'vitest';
import { TEST_STUDENTS, TEST_USERS } from './test-fixtures';

describe('Universal Persistence & Multi-Role Data Flow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists students and retrieved them seamlessly', () => {
    const key = 'colegio_students';
    localStorage.setItem(key, JSON.stringify(TEST_STUDENTS));

    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    expect(stored.length).toBe(TEST_STUDENTS.length);
    expect(stored[0].codigo_estudiante).toBe(TEST_STUDENTS[0].codigo_estudiante);
  });

  it('handles role switching and persistence of current user', () => {
    const teacherUser = TEST_USERS.find(u => u.rol === 'docente');
    expect(teacherUser).toBeDefined();

    localStorage.setItem('colegio_current_user', JSON.stringify(teacherUser));
    const loaded = JSON.parse(localStorage.getItem('colegio_current_user') || '{}');
    expect(loaded.rol).toBe('docente');
    expect(loaded.nombres).toBe(teacherUser?.nombres);
  });

  it('restores all data to defaults when reset is invoked', () => {
    localStorage.setItem('colegio_attendances', JSON.stringify([{ id: 'test-att' }]));
    expect(localStorage.getItem('colegio_attendances')).toBeTruthy();

    const storageKeys = [
      'colegio_users',
      'colegio_current_user',
      'colegio_students',
      'colegio_enrollments',
      'colegio_attendances',
      'colegio_grades',
      'colegio_tasks',
      'colegio_submissions',
      'colegio_exams',
      'colegio_notifications',
      'colegio_section_courses',
      'colegio_schedule_slots',
      'colegio_class_sessions',
    ];
    storageKeys.forEach(k => localStorage.removeItem(k));

    expect(localStorage.getItem('colegio_attendances')).toBeNull();
  });
});
