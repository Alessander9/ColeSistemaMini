import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateSecurePassword } from '@/lib/auth/generateCredentials';
import { isChildOfParent } from '@/lib/auth/parentChildren';
import { initialsAvatarUrl } from '@/lib/avatar';
import { loginWithCredentials } from '@/lib/services/authService';
import { Student } from '@/types';

describe('Contraseñas aleatorias', () => {
  it('genera claves de 10 caracteres con mayúscula, minúscula y número', () => {
    const pass = generateSecurePassword();
    expect(pass).toHaveLength(10);
    expect(pass).toMatch(/[A-Z]/);
    expect(pass).toMatch(/[a-z]/);
    expect(pass).toMatch(/[2-9]/);
    expect(pass).not.toMatch(/[0O1lI]/);
  });

  it('no repite claves entre llamadas', () => {
    const set = new Set(Array.from({ length: 200 }, () => generateSecurePassword()));
    expect(set.size).toBe(200);
  });
});

describe('Vínculo apoderado-hijo', () => {
  const base: Student = { id: 's1', profile_id: 'p1', codigo_estudiante: 'EST-1', token_qr: 'x' };

  it('usa el vínculo explícito aunque el correo coincida con otro apoderado', () => {
    const student = { ...base, apoderado_id: 'parent-a', email_apoderado: 'b@mail.com' };
    expect(isChildOfParent(student, { id: 'parent-a' })).toBe(true);
    expect(isChildOfParent(student, { id: 'parent-b', email: 'b@mail.com' })).toBe(false);
  });

  it('sin vínculo explícito compara correo o teléfono, nunca el nombre', () => {
    const student = { ...base, email_apoderado: 'Mama@Mail.com', telefono_apoderado: '999111222', nombre_apoderado: 'Carlos Pérez' };
    expect(isChildOfParent(student, { id: 'x', email: 'mama@mail.com' })).toBe(true);
    expect(isChildOfParent(student, { id: 'x', telefono: '999111222' })).toBe(true);
    expect(isChildOfParent(student, { id: 'x', email: 'otro@mail.com', telefono: '000' })).toBe(false);
  });
});

describe('Avatar de iniciales local', () => {
  it('no incluye el nombre completo y escapa caracteres especiales', () => {
    const url = initialsAvatarUrl('<script> Alert');
    const svg = decodeURIComponent(url);
    expect(url.startsWith('data:image/svg+xml')).toBe(true);
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;A</text>');
  });
});

describe('Ruta /api/auth/session sin Supabase', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const postRole = async (role: string) => {
    const { POST } = await import('@/app/api/auth/session/route');
    const { NextRequest } = await import('next/server');
    return POST(new NextRequest('http://localhost/api/auth/session', {
      method: 'POST',
      body: JSON.stringify({ role, userId: 'u1' }),
    }));
  };

  it('en producción rechaza el login demo si no se activó a propósito', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ALLOW_DEMO_LOGIN', '');
    vi.stubEnv('SESSION_SECRET', 'x'.repeat(40));
    const res = await postRole('admin');
    expect(res.status).toBe(403);
  });

  it('en producción sin SESSION_SECRET no emite sesiones', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ALLOW_DEMO_LOGIN', 'true');
    vi.stubEnv('SESSION_SECRET', '');
    const res = await postRole('admin');
    expect(res.status).toBe(500);
  });

  it('en desarrollo emite la cookie firmada', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const res = await postRole('docente');
    expect(res.status).toBe(200);
    expect(res.headers.get('set-cookie')).toContain('cole_session_token=');
  });
});

describe('Inicio de sesión en modo local', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ success: true }), { status: 200 })));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('acepta la contraseña correcta de la cuenta demo', async () => {
    const res = await loginWithCredentials('docente@colegio.edu.pe', 'Colegio2026!');
    expect(res.error).toBeNull();
    expect(res.user?.rol).toBe('docente');
  });

  it('ya no acepta contraseñas comodín de otras cuentas', async () => {
    const res = await loginWithCredentials('docente@colegio.edu.pe', 'admin123');
    expect(res.user).toBeNull();
  });

  it('rechaza cuentas guardadas sin contraseña', async () => {
    localStorage.setItem('colegio_users', JSON.stringify([
      { id: 'u-sin-clave', rol: 'admin', nombres: 'X', apellidos: 'Y', dni: '11112222', email: 'sinclave@colegio.edu.pe', activo: true },
    ]));
    const res = await loginWithCredentials('sinclave@colegio.edu.pe', 'loquesea');
    expect(res.user).toBeNull();
  });

  it('rechaza cuentas bloqueadas', async () => {
    localStorage.setItem('colegio_users', JSON.stringify([
      { id: 'u-bloq', rol: 'docente', nombres: 'X', apellidos: 'Y', dni: '33334444', email: 'bloq@colegio.edu.pe', password: 'Clave123x', activo: false },
    ]));
    const res = await loginWithCredentials('bloq@colegio.edu.pe', 'Clave123x');
    expect(res.user).toBeNull();
    expect(res.error).toMatch(/bloqueado/);
  });

  it('no inicia sesión si el servidor rechaza la sesión', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ success: false, error: 'desactivado' }), { status: 403 })));
    const res = await loginWithCredentials('docente@colegio.edu.pe', 'Colegio2026!');
    expect(res.user).toBeNull();
    expect(res.error).toBe('desactivado');
  });
});
