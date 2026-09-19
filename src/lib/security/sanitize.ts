/**
 * Utilidades de Sanitización y Prevención de Inyecciones (XSS / SQLi)
 * Limpia y normaliza cadenas de texto antes de procesarlas o almacenarlas.
 */

/**
 * Escapa caracteres HTML peligrosos para prevenir ataques de Cross-Site Scripting (XSS).
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitiza campos de texto plano (Nombres, DNI, Títulos, Observaciones).
 * Elimina etiquetas HTML, scripts incrustados y caracteres de control no imprimibles.
 */
export function sanitizePlainText(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Elimina etiquetas <script>
    .replace(/<[^>]*>/g, '') // Elimina cualquier etiqueta HTML
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Elimina caracteres de control
    .trim();
}

/**
 * Valida y normaliza direcciones de correo electrónico.
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';
  const clean = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(clean) ? clean : '';
}

/**
 * Valida y limpia números de documento (DNI, Teléfono).
 */
export function sanitizeNumeric(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/\D/g, '');
}
