/**
 * Módulo Criptográfico de Sesión Segura (HMAC SHA-256)
 * Genera y valida tokens de sesión firmados usando la Web Crypto API estándar.
 * Compatible con Node.js, Edge Runtime (Next.js Middleware) y navegadores.
 */

const SESSION_SECRET = process.env.SESSION_SECRET || 'colesistema_mini_hmac_secret_key_2026_enterprise_secure_token';

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getHmacKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export interface SessionPayload {
  role: string;
  userId?: string;
  iat?: number;
  exp?: number;
}

export interface VerifySessionResult {
  valid: boolean;
  payload?: SessionPayload;
  error?: string;
}

/**
 * Genera un token de sesión firmado criptográficamente con HMAC-SHA256
 */
export async function createSessionToken(payload: { role: string; userId?: string; expSeconds?: number }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (payload.expSeconds || 7 * 86400); // 7 días por defecto
  
  const tokenData: SessionPayload = {
    role: payload.role,
    userId: payload.userId || 'usr_anonymous',
    iat: now,
    exp,
  };

  const enc = new TextEncoder();
  const payloadJson = JSON.stringify(tokenData);
  const payloadB64 = base64UrlEncode(enc.encode(payloadJson));

  const key = await getHmacKey();
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(payloadB64));
  const signatureB64 = base64UrlEncode(new Uint8Array(signatureBuffer));

  return `${payloadB64}.${signatureB64}`;
}

/**
 * Valida la autenticidad, integridad y expiración del token de sesión
 */
export async function verifySessionToken(token?: string | null): Promise<VerifySessionResult> {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token no proporcionado' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Formato de token inválido' };
  }

  const [payloadB64, signatureB64] = parts;

  try {
    const key = await getHmacKey();
    const enc = new TextEncoder();
    const signatureBytes = base64UrlDecode(signatureB64);

    const isValidSig = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes as unknown as BufferSource,
      enc.encode(payloadB64)
    );

    if (!isValidSig) {
      return { valid: false, error: 'Firma criptográfica inválida o manipulada' };
    }

    const payloadBytes = base64UrlDecode(payloadB64);
    const payloadJson = new TextDecoder().decode(payloadBytes);
    const payload = JSON.parse(payloadJson) as SessionPayload;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'Token expirado' };
    }

    return { valid: true, payload };
  } catch (err: any) {
    return { valid: false, error: err?.message || 'Error al validar token' };
  }
}
