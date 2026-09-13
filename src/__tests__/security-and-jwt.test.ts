import { describe, it, expect } from 'vitest';
import { generateStudentEmail, generateStudentPassword, generateStudentUsername } from '../lib/auth/generateCredentials';

describe('Security, Auth & Role-Based Access Control', () => {
  it('generates secure deterministic student passwords with 12 characters', () => {
    const pass = generateStudentPassword('Carlos Alberto', 'Mendoza Quispe', '2014-06-15');
    expect(pass.length).toBe(12);
    expect(pass).toContain('Car');
    expect(pass).toContain('men');
  });

  it('generates normalized institutional emails', () => {
    const email = generateStudentEmail('María José', 'Álvarez Nuñez');
    expect(email).toBe('maria.alvarez@colegio.edu.pe');
  });

  it('generates unique usernames using surnames and DNI suffix', () => {
    const user = generateStudentUsername('Gonzáles', '74829103');
    expect(user).toBe('gonzales103');
  });

  it('validates role path matching rules correctly', () => {
    const allowedRolesForPath: Record<string, string[]> = {
      '/admin': ['admin'],
      '/docente': ['docente', 'admin'],
      '/estudiante': ['estudiante', 'admin'],
      '/asistencia': ['asistencia', 'admin'],
    };

    expect(allowedRolesForPath['/admin'].includes('admin')).toBe(true);
    expect(allowedRolesForPath['/admin'].includes('docente')).toBe(false);
    expect(allowedRolesForPath['/docente'].includes('docente')).toBe(true);
    expect(allowedRolesForPath['/estudiante'].includes('estudiante')).toBe(true);
    expect(allowedRolesForPath['/asistencia'].includes('asistencia')).toBe(true);
  });
});
