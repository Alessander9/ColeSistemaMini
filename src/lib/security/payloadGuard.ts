import { sanitizePlainText } from './sanitize';

/**
 * Deep Payload Sanitizer & Prototype Pollution Guard
 * Bloquea inyecciones de objetos maliciosos (__proto__, constructor, $where, script tags).
 */

const DANGEROUS_KEYS = ['__proto__', 'constructor', 'prototype', '$where', '$regex', '$ne', '$gt', '$lt'];

/**
 * Sanitiza recursivamente un objeto o arreglo antes de procesarlo en backend o guardarlo.
 */
export function sanitizeDeep<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === 'string') {
    return sanitizePlainText(input) as unknown as T;
  }

  if (Array.isArray(input)) {
    return input.map(item => sanitizeDeep(item)) as unknown as T;
  }

  if (typeof input === 'object') {
    const cleanObject: Record<string, any> = {};
    for (const [key, value] of Object.entries(input)) {
      // Bloquear claves peligrosas (Prototype Pollution / NoSQL injection)
      if (DANGEROUS_KEYS.includes(key.toLowerCase()) || key.startsWith('$')) {
        continue;
      }
      cleanObject[sanitizePlainText(key)] = sanitizeDeep(value);
    }
    return cleanObject as T;
  }

  return input;
}

/**
 * Valida el tamaño de una carga útil (Payload Size Limit) para evitar ataques de agotamiento de memoria.
 */
export function validatePayloadSize(payload: string | Buffer | object, maxSizeBytes: number = 2097152): boolean {
  if (!payload) return true;
  let size = 0;
  if (typeof payload === 'string') {
    size = Buffer.byteLength(payload, 'utf8');
  } else if (Buffer.isBuffer(payload)) {
    size = payload.length;
  } else if (typeof payload === 'object') {
    try {
      size = Buffer.byteLength(JSON.stringify(payload), 'utf8');
    } catch {
      return false;
    }
  }
  return size <= maxSizeBytes;
}
