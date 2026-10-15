import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, verifySessionToken } from '@/lib/security/sessionToken';

const ALLOWED_ROLES = ['admin', 'docente', 'estudiante', 'apoderado', 'asistencia'];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { role, userId } = body;

    if (!role || !ALLOWED_ROLES.includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Rol inválido o no permitido' },
        { status: 400 }
      );
    }

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
