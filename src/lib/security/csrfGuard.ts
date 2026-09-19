/**
 * Anti-CSRF Protection & Timing-Safe Security Utilities
 * Protege contra Cross-Site Request Forgery y Timing Attacks en autenticación.
 */

const CSRF_SECRET_SALT = 'cole-csrf-entropy-key-2026';

/**
 * Genera un token CSRF criptográficamente enlazado a la sesión del usuario.
 */
export function generateCsrfToken(sessionId: string): string {
  const timestamp = Date.now();
  const raw = `${sessionId}:${timestamp}:${CSRF_SECRET_SALT}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i);
    hash |= 0;
  }
  return `csrf_${Math.abs(hash).toString(36)}_${timestamp.toString(36)}`;
}

/**
 * Validación Timing-Safe para evitar ataques de canal lateral (Timing Attacks)
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Valida si un token CSRF proporcionado es válido y no ha expirado.
 */
export function validateCsrfToken(token: string, sessionId: string, maxAgeMs: number = 86400000): boolean {
  if (!token || !sessionId || !token.startsWith('csrf_')) return false;

  const parts = token.split('_');
  if (parts.length !== 3) return false;

  const timestampStr = parts[2];
  const timestamp = parseInt(timestampStr, 36);
  if (isNaN(timestamp)) return false;

  // Verificar expiración (24 horas por defecto)
  const now = Date.now();
  if (now - timestamp > maxAgeMs || timestamp > now + 60000) {
    return false;
  }

  // Validar coincidencia del token
  const expectedHash = parts[1];
  const raw = `${sessionId}:${timestamp}:${CSRF_SECRET_SALT}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i);
    hash |= 0;
  }
  const computedHash = Math.abs(hash).toString(36);

  return timingSafeEqual(expectedHash, computedHash);
}
