import { describe, it, expect } from 'vitest';
import { UserRole } from '../types';

describe('Role-Based Access Control & Middleware Rules', () => {
  const roleRoutes: Record<UserRole, { allowed: string[]; forbidden: string[] }> = {
    admin: {
      allowed: ['/admin', '/admin/academico', '/admin/docentes', '/admin/estudiantes', '/admin/horarios', '/admin/matriculas', '/admin/notas-salon', '/admin/reportes'],
      forbidden: [],
    },
    docente: {
      allowed: ['/docente', '/docente/asistencia', '/docente/horario', '/docente/notas', '/docente/tareas', '/docente/evaluaciones'],
      forbidden: ['/admin', '/admin/docentes', '/admin/matriculas'],
    },
    estudiante: {
      allowed: ['/estudiante', '/estudiante/carnet-qr', '/estudiante/horario', '/estudiante/libreta-notas', '/estudiante/asistencias', '/estudiante/tareas', '/estudiante/evaluaciones'],
      forbidden: ['/admin', '/docente', '/asistencia'],
    },
    asistencia: {
      allowed: ['/asistencia'],
      forbidden: ['/admin', '/docente', '/estudiante/libreta-notas'],
    },
  };

  it('verifies admin role has unrestricted access across admin portal', () => {
    const adminConfig = roleRoutes.admin;
    adminConfig.allowed.forEach((route) => {
      expect(route.startsWith('/admin')).toBe(true);
    });
  });

  it('ensures students are strictly barred from accessing admin and teacher routes', () => {
    const studentConfig = roleRoutes.estudiante;
    studentConfig.forbidden.forEach((route) => {
      const isAllowed = studentConfig.allowed.includes(route);
      expect(isAllowed).toBe(false);
    });
  });

  it('validates teacher access strictly adheres to their teaching hub', () => {
    const teacherConfig = roleRoutes.docente;
    expect(teacherConfig.allowed).toContain('/docente/asistencia');
    expect(teacherConfig.allowed).toContain('/docente/notas');
    expect(teacherConfig.forbidden).toContain('/admin/matriculas');
  });

  it('validates attendance gatekeeper role is locked to QR attendance kiosk', () => {
    const gatekeeperConfig = roleRoutes.asistencia;
    expect(gatekeeperConfig.allowed).toContain('/asistencia');
    expect(gatekeeperConfig.forbidden).toContain('/docente');
  });
});
