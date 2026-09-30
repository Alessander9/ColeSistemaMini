import { describe, it, expect } from 'vitest';
import { findActiveNavHref } from '../lib/navigation/activeNav';

const adminItems = [
  { href: '/admin' },
  { href: '/admin/academico?tab=cursos' },
  { href: '/admin/academico?tab=grados', defaultForPath: true, matches: ['/admin/secciones'] },
  { href: '/admin/docentes' },
  { href: '/admin/estudiantes' },
  { href: '/asistencia' },
  { href: '/admin/reportes' },
];

describe('Opción activa del menú lateral', () => {
  it('marca el dashboard solo en /admin', () => {
    expect(findActiveNavHref(adminItems, '/admin', '')).toBe('/admin');
  });

  it('no marca el dashboard en otras páginas del admin', () => {
    expect(findActiveNavHref(adminItems, '/admin/docentes', '')).toBe('/admin/docentes');
  });

  it('distingue las pestañas por ?tab=', () => {
    expect(findActiveNavHref(adminItems, '/admin/academico', '?tab=cursos')).toBe('/admin/academico?tab=cursos');
    expect(findActiveNavHref(adminItems, '/admin/academico', '?tab=grados')).toBe('/admin/academico?tab=grados');
  });

  it('sin ?tab= marca la pestaña que se abre por defecto', () => {
    expect(findActiveNavHref(adminItems, '/admin/academico', '')).toBe('/admin/academico?tab=grados');
  });

  it('marca la opción padre en una subpágina', () => {
    expect(findActiveNavHref(adminItems, '/admin/estudiantes/std-1', '')).toBe('/admin/estudiantes');
  });

  it('marca la opción asociada a rutas sin opción propia', () => {
    expect(findActiveNavHref(adminItems, '/admin/secciones/sec-3pri-a', '')).toBe('/admin/academico?tab=grados');
  });

  it('no marca nada si la página no tiene opción', () => {
    expect(findActiveNavHref(adminItems, '/admin/tesoreria', '')).toBeNull();
  });

  it('funciona para los demás portales', () => {
    const docente = [{ href: '/docente' }, { href: '/docente/notas' }];
    expect(findActiveNavHref(docente, '/docente', '')).toBe('/docente');
    expect(findActiveNavHref(docente, '/docente/notas', '?aula=sec-1')).toBe('/docente/notas');
  });
});
