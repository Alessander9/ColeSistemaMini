import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, verifySessionToken } from '@/lib/security/sessionToken';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';

const ALLOWED_ROLES = ['admin', 'docente', 'estudiante', 'apoderado', 'asistencia'];

// Modo demo (sin Supabase): el servidor no tiene base de usuarios para comprobar contraseñas, así que
// confía en el rol que envía el navegador. Por eso solo se permite fuera de producción o si se activa a propósito.
function isDemoLoginAllowed(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEMO_LOGIN === 'true';
}

async function resolveIdentity(req: NextRequest): Promise<{ role: string; userId: string } | { error: string; status: number }> {
  if (isSupabaseConfigured()) {
    // El rol sale del perfil del usuario autenticado en Supabase, nunca del cuerpo de la petición
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No hay una sesión de Supabase válida.', status: 401 };

    const { data: profile } = await supabase
      .from('profiles')
      .select('rol, activo')
      .eq('id', user.id)
      .single();

    if (!profile || !ALLOWED_ROLES.includes(profile.rol)) return { error: 'Perfil de usuario no encontrado.', status: 403 };
    if (profile.activo === false) return { error: 'Tu acceso está bloqueado.', status: 403 };
    return { role: profile.rol, userId: user.id };
  }

  if (!isDemoLoginAllowed()) {
    return { error: 'El inicio de sesión de demostración está desactivado en producción. Configura Supabase.', status: 403 };
  }

  const body = await req.json().catch(() => ({}));
  const { role, userId } = body || {};
  if (!role || !ALLOWED_ROLES.includes(role)) {
    return { error: 'Rol inválido o no permitido', status: 400 };
  }
  return { role, userId };
}

export async function POST(req: NextRequest) {
  try {
    const identity = await resolveIdentity(req);
    if ('error' in identity) {
      return NextResponse.json({ success: false, error: identity.error }, { status: identity.status });
    }
    const { role, userId } = identity;

    const token = await createSessionToken({ role, userId });

    const response = NextResponse.json({
      success: true,
      role,
      userId,
    });

    const isProduction = process.env.NODE_ENV === 'production';

    // Establecer la cookie HttpOnly de sesión segura
    response.cookies.set('cole_session_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 86400, // 7 días
    });

    // Mantener cole_user_role solo para renderizado de interfaz de usuario
    response.cookies.set('cole_user_role', role, {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 86400,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Error al iniciar sesión' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get('cole_session_token')?.value;
  const verification = await verifySessionToken(token);

  if (!verification.valid || !verification.payload) {
    return NextResponse.json(
      { authenticated: false, role: null },
      { status: 401 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    role: verification.payload.role,
    userId: verification.payload.userId,
  });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Sesión finalizada' });

  response.cookies.set('cole_session_token', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });

  response.cookies.set('cole_user_role', '', {
    httpOnly: false,
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });

  response.cookies.set('cole_access_token', '', {
    httpOnly: false,
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}
