import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { checkAdaptiveRateLimit, getClientIp } from '@/lib/security/rateLimiter';
import { logSecurityEvent } from '@/lib/security/securityLogger';
import { verifySessionToken, type VerifySessionResult } from '@/lib/security/sessionToken';

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

  // 2. Omitir verificación en assets estáticos, llamadas públicas y lectura de branding
  const isPublicRoute =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    /\.(jpg|jpeg|png|webp|svg|ico|gif|avif|json|js|css|woff2?|ttf|eot)$/i.test(pathname) ||
    PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`)) ||
    (pathname === '/api/branding' && request.method === 'GET');

  if (isPublicRoute) {
    // Si el usuario ya cuenta con un token de sesión firmado válido e intenta ir a /login, redirigir a su panel
    const sessionToken = request.cookies.get('cole_session_token')?.value;
    const verified = sessionToken ? await verifySessionToken(sessionToken) : { valid: false };
    if (pathname === '/login' && verified.valid && verified.payload?.role) {
      const redirectMap: Record<string, string> = {
        admin: '/admin',
        docente: '/docente',
        estudiante: '/estudiante',
        apoderado: '/apoderado',
        asistencia: '/asistencia',
      };
      const dest = redirectMap[verified.payload.role] || '/admin';
      return NextResponse.redirect(new URL(dest, request.url));
    }
    return NextResponse.next();
  }

  // 3. Verificar sesión de Supabase Auth o token criptográfico firmado (cole_session_token)
  // Refresca las cookies de Supabase (si está configurado) para mantener viva su sesión
  const { response } = await updateSession(request);
  const sessionToken = request.cookies.get('cole_session_token')?.value;
  const verifiedSession: VerifySessionResult = sessionToken ? await verifySessionToken(sessionToken) : { valid: false };

  // La sesión válida es siempre el token firmado: el servidor solo lo emite tras verificar la identidad
  // (en modo Supabase, con el perfil del usuario). Una sesión de Supabase sin token no indica el rol.
  const isAuthenticated = verifiedSession.valid && !!verifiedSession.payload?.role;

  // 4. Si no está autenticado, bloquear acceso (401 en APIs, redirección en páginas)
  if (!isAuthenticated) {
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ success: false, error: 'No autenticado. Token de sesión requerido o inválido.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // 5. Determinar rol a partir del token verificado (nunca de una cookie de texto plano no firmada)
  const role = verifiedSession.payload!.role;

  const roleDashboardMap: Record<string, string> = {
    admin: '/admin',
    docente: '/docente',
    estudiante: '/estudiante',
    apoderado: '/apoderado',
    asistencia: '/asistencia',
  };

  // 6. Redirección de la raíz '/' al dashboard del rol activo
  if (pathname === '/') {
    const targetDashboard = roleDashboardMap[role] || '/login';
    return NextResponse.redirect(new URL(targetDashboard, request.url));
  }

  // 7. Control de Acceso Estricto Basado en Roles (RBAC) - Bloqueo de Intercambio
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
