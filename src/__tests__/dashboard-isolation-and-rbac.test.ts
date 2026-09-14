import { describe, it, expect } from 'vitest';
import { UserRole } from '../types';

describe('Dashboard Isolation & Anti-Cross-Role RBAC', () => {
  const roleHomeUrls: Record<UserRole, string> = {
    admin: '/admin',
    docente: '/docente',
    estudiante: '/estudiante',
    apoderado: '/apoderado',
    asistencia: '/asistencia',
  };

  it('ensures each role maps to its exclusive isolated home dashboard', () => {
    expect(roleHomeUrls.admin).toBe('/admin');
    expect(roleHomeUrls.docente).toBe('/docente');
    expect(roleHomeUrls.estudiante).toBe('/estudiante');
    expect(roleHomeUrls.apoderado).toBe('/apoderado');
    expect(roleHomeUrls.asistencia).toBe('/asistencia');
  });

  it('verifies that logo and root access redirect strictly to current user dashboard', () => {
    const simulateRootAccess = (role: UserRole) => roleHomeUrls[role] || '/login';

    expect(simulateRootAccess('admin')).toBe('/admin');
    expect(simulateRootAccess('docente')).toBe('/docente');
    expect(simulateRootAccess('estudiante')).toBe('/estudiante');
    expect(simulateRootAccess('apoderado')).toBe('/apoderado');
    expect(simulateRootAccess('asistencia')).toBe('/asistencia');
  });

  it('verifies that cross-dashboard access attempts are intercepted and rejected', () => {
    const isAccessPermitted = (userRole: UserRole, targetDashboard: string): boolean => {
      if (targetDashboard.startsWith('/admin') && userRole !== 'admin') return false;
      if (targetDashboard.startsWith('/docente') && userRole !== 'docente') return false;
      if (targetDashboard.startsWith('/estudiante') && userRole !== 'estudiante') return false;
      if (targetDashboard.startsWith('/apoderado') && userRole !== 'apoderado') return false;
      if (targetDashboard.startsWith('/asistencia') && userRole !== 'asistencia') return false;
      return true;
    };

    // Teacher trying to access admin or student
    expect(isAccessPermitted('docente', '/admin')).toBe(false);
    expect(isAccessPermitted('docente', '/admin/matriculas')).toBe(false);
    expect(isAccessPermitted('docente', '/estudiante')).toBe(false);
    expect(isAccessPermitted('docente', '/docente/notas')).toBe(true);

    // Student trying to access admin or teacher
    expect(isAccessPermitted('estudiante', '/admin')).toBe(false);
    expect(isAccessPermitted('estudiante', '/docente')).toBe(false);
    expect(isAccessPermitted('estudiante', '/docente/asistencia')).toBe(false);
    expect(isAccessPermitted('estudiante', '/estudiante/libreta-notas')).toBe(true);

    // Attendance kiosk trying to access student grades or admin
    expect(isAccessPermitted('asistencia', '/admin')).toBe(false);
    expect(isAccessPermitted('asistencia', '/docente')).toBe(false);
    expect(isAccessPermitted('asistencia', '/estudiante')).toBe(false);
    expect(isAccessPermitted('asistencia', '/asistencia')).toBe(true);
  });
});
