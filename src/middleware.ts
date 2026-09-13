import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Rutas públicas que no requieren autenticación
const PUBLIC_PATHS = [
  '/login',
  '/despedida',
  '/bienvenida',
  '/manifest.json',
  '/sw.js',
  '/favicon.ico',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-192.svg',
  '/icon-512.svg',
  '/login-illustration.jpg',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Omitir verificación en assets estáticos y llamadas internas de Next.js
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
  ) {
    // Si el usuario ya está autenticado e intenta ir a /login, redirigir a su panel
    const sessionCookie = request.cookies.get('cole_user_role')?.value;
    if (pathname === '/login' && sessionCookie) {
      const redirectMap: Record<string, string> = {
        admin: '/admin',
        docente: '/docente',
        estudiante: '/estudiante',
        asistencia: '/asistencia',
      };
      const dest = redirectMap[sessionCookie] || '/admin';
      return NextResponse.redirect(new URL(dest, request.url));
    }
    return NextResponse.next();
  }

  // 2. Verificar sesión de Supabase Auth y cookie de sesión segura
  const { user, response } = await updateSession(request);
  const userRole = request.cookies.get('cole_user_role')?.value;
  const isAuthenticated = !!user || !!userRole;

  // 3. Si no está autenticado, redirigir a /login guardando la URL previa
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  const role = userRole || 'admin';

  // 4. Control de Acceso Basado en Roles (RBAC)
  if (pathname.startsWith('/admin') && role !== 'admin') {
    // Redirigir al portal que le corresponde al usuario
    const redirectMap: Record<string, string> = {
      docente: '/docente',
      estudiante: '/estudiante',
      asistencia: '/asistencia',
    };
    return NextResponse.redirect(new URL(redirectMap[role] || '/login', request.url));
  }

  if (pathname.startsWith('/docente') && role !== 'docente' && role !== 'admin') {
    return NextResponse.redirect(new URL(role === 'estudiante' ? '/estudiante' : '/asistencia', request.url));
  }

  if (pathname.startsWith('/estudiante') && role !== 'estudiante' && role !== 'admin') {
    return NextResponse.redirect(new URL(role === 'docente' ? '/docente' : '/admin', request.url));
  }

  if (pathname.startsWith('/asistencia') && role !== 'asistencia' && role !== 'admin') {
    return NextResponse.redirect(new URL(role === 'docente' ? '/docente' : '/estudiante', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Coincidir con todas las rutas excepto:
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico (icono del navegador)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
