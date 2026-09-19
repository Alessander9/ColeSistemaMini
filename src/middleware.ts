import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { checkAdaptiveRateLimit, getClientIp } from '@/lib/security/rateLimiter';
import { logSecurityEvent } from '@/lib/security/securityLogger';

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
  '/banerprimaria.jpg',
  '/banersecundaria.jpg',
  '/primariaBanner.png',
  '/secundariaBaner.png',
  '/inicial_banner.png',
  '/estudiantesTodosBanner.jpg',
  '/estudiantesTodosBanner.png',
  '/robots.txt',
  '/sitemap.xml',
  '/api/branding',
  '/api/notifications/brevo',
  '/api/notifications/resend',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const clientIp = getClientIp(request.headers);

  // 1. Adaptive Rate Limiting & Anti-DDoS / Anti-Bruteforce
  if (pathname === '/login' || pathname.startsWith('/api/')) {
    const isLogin = pathname === '/login';
    const rateLimit = checkAdaptiveRateLimit(`ip_${clientIp}_${isLogin ? 'auth' : 'api'}`, {
      maxRequests: isLogin ? 30 : 120, // Límite estándar por minuto
      windowMs: 60000,
      burstLimit: isLogin ? 8 : 25,    // Límite en ráfaga (5 seg)
      burstWindowMs: 5000,
      maxViolationsBeforeJail: 3,
      jailDurationMs: 900000,         // 15 minutos en cuarentena
    });

    if (!rateLimit.allowed) {
      logSecurityEvent({
        type: rateLimit.isJailed ? 'ip_jailed' : 'rate_limit_violation',
        ip: clientIp,
        path: pathname,
        details: `Razón: ${rateLimit.reason} - Reset en: ${Math.ceil(rateLimit.resetTimeMs / 1000)}s`,
        severity: rateLimit.isJailed ? 'high' : 'medium',
      });

      const statusCode = rateLimit.isJailed ? 403 : 429;
      return new NextResponse(
        JSON.stringify({
          error: rateLimit.isJailed
            ? 'IP temporalmente suspendida por actividad sospechosa repetida.'
            : 'Demasiadas solicitudes. Por favor espera un momento.',
          retryAfterSec: Math.ceil(rateLimit.resetTimeMs / 1000),
          isJailed: rateLimit.isJailed,
        }),
        {
          status: statusCode,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil(rateLimit.resetTimeMs / 1000)),
            'X-Frame-Options': 'SAMEORIGIN',
            'X-Content-Type-Options': 'nosniff',
          },
        }
      );
    }
  }

  // 2. Omitir verificación en assets estáticos, imágenes y llamadas internas de Next.js
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    /\.(jpg|jpeg|png|webp|svg|ico|gif|avif|json|js|css|woff2?|ttf|eot)$/i.test(pathname) ||
    PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
  ) {
    // Si el usuario ya está autenticado e intenta ir a /login, redirigir a su panel
    const sessionCookie = request.cookies.get('cole_user_role')?.value;
    if (pathname === '/login' && sessionCookie) {
      const redirectMap: Record<string, string> = {
        admin: '/admin',
        docente: '/docente',
        estudiante: '/estudiante',
        apoderado: '/apoderado',
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
  const roleDashboardMap: Record<string, string> = {
    admin: '/admin',
    docente: '/docente',
    estudiante: '/estudiante',
    apoderado: '/apoderado',
    asistencia: '/asistencia',
  };

  // 4. Redirección de la raíz '/' al dashboard del rol activo
  if (pathname === '/') {
    const targetDashboard = roleDashboardMap[role] || '/login';
    return NextResponse.redirect(new URL(targetDashboard, request.url));
  }

  // 5. Control de Acceso Estricto Basado en Roles (RBAC) - Bloqueo de Intercambio
  if (pathname.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL(roleDashboardMap[role] || '/login', request.url));
  }

  if (pathname.startsWith('/docente') && role !== 'docente') {
    return NextResponse.redirect(new URL(roleDashboardMap[role] || '/login', request.url));
  }

  if (pathname.startsWith('/estudiante') && role !== 'estudiante' && role !== 'apoderado') {
    return NextResponse.redirect(new URL(roleDashboardMap[role] || '/login', request.url));
  }

  if (pathname.startsWith('/apoderado') && role !== 'apoderado' && role !== 'admin') {
    return NextResponse.redirect(new URL(roleDashboardMap[role] || '/login', request.url));
  }

  if (pathname.startsWith('/asistencia') && role !== 'asistencia' && role !== 'admin') {
    return NextResponse.redirect(new URL(roleDashboardMap[role] || '/login', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Coincidir con todas las rutas excepto:
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico, sitemap.xml, robots.txt
     * - archivos con extensiones estáticas (.jpg, .png, .css, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|json|js|css|woff2?|ttf|eot)$).*)',
  ],
};
