import { UserRole } from '@/types';

/**
 * Token Session Guard & Role Verification
 * Proporciona firmas de verificación para evitar la manipulación de roles en el cliente.
 */

const SESSION_SALT = 'cole-sistema-secret-v1-2026';

/**
 * Genera una firma simple basada en el rol y el ID para validar la integridad de la sesión.
 */
export function generateSessionSignature(userId: string, role: UserRole): string {
  const payload = `${userId}:${role}:${SESSION_SALT}`;
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `sig_${Math.abs(hash).toString(36)}`;
}

/**
 * Verifica si una firma coincide con los datos de rol del usuario.
 */
export function verifySessionSignature(userId: string, role: UserRole, signature: string): boolean {
  if (!signature || !userId || !role) return false;
  const expected = generateSessionSignature(userId, role);
  return signature === expected;
}
