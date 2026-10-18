import type { Student } from '@/types';

/**
 * Lectura del contenido de un QR de carnet y búsqueda del estudiante al que pertenece.
 * Compartido por el kiosco de asistencia y `registerAttendance`, para que ambos
 * reconozcan exactamente al mismo alumno.
 */

/** Extrae el identificador útil de un QR: texto plano, JSON o URL con parámetros. */
export function parseQrPayload(rawInput?: unknown): string {
  let raw = String(rawInput ?? '').replace(/[\r\n\x00]/g, '').trim();
  if (!raw) return '';

  // Hardware scanners or copy-paste may wrap the payload in single or double quotes
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    raw = raw.slice(1, -1).trim();
  }

  if (raw.startsWith('{') && raw.endsWith('}')) {
    try {
      const parsed = JSON.parse(raw);
      const value = parsed.token_qr || parsed.codigo || parsed.codigo_estudiante || parsed.dni || parsed.id;
      return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : raw;
    } catch {
      return raw;
    }
  }

  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      return (
        url.searchParams.get('token') ||
        url.searchParams.get('code') ||
        url.searchParams.get('codigo') ||
        url.searchParams.get('dni') ||
        url.searchParams.get('id') ||
        raw
      ).trim();
    } catch {
      return raw;
    }
  }

  return raw;
}

export function normalizeQrText(value?: string | null): string {
  return value ? value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : '';
}

/** Devuelve la fecha local (Perú) en formato YYYY-MM-DD sin desfases por UTC. */
export function getTodayLocalIso(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Código de estudiante completo (EST-2026-001, EST-2026-123456): el número no puede continuar con otro dígito
const STUDENT_CODE_PATTERN = /EST-\d{4}-\d+(?!\d)/i;
// DNI peruano: exactamente 8 dígitos, sin dígitos pegados
const DNI_PATTERN = /(?<!\d)\d{8}(?!\d)/;

type StudentLike = Pick<Student, 'id' | 'profile_id' | 'token_qr' | 'codigo_estudiante' | 'dni'> & {
  profile?: { dni?: string } | null;
};

/**
 * Busca el estudiante del QR usando solo coincidencias exactas (nunca parciales):
 * un código incompleto o parecido no debe registrar la asistencia de otro alumno.
 */
export function findStudentByQr<T extends StudentLike>(students: T[], rawInput?: unknown): T | undefined {
  const value = parseQrPayload(rawInput);
  if (!value) return undefined;
  const norm = normalizeQrText(value);

  // 1. Coincidencia exacta con token, código, DNI o identificadores
  const exact = students.find(s =>
    (s.token_qr && normalizeQrText(s.token_qr) === norm) ||
    (s.codigo_estudiante && normalizeQrText(s.codigo_estudiante) === norm) ||
    ((s.profile?.dni || s.dni) && normalizeQrText(s.profile?.dni || s.dni) === norm) ||
    s.id === value ||
    (s.profile_id && s.profile_id === value)
  );
  if (exact) return exact;

  // 2. Código de estudiante completo dentro del texto (ej. token "QR-EST-2026-001-LUCAS-MORALES")
  const code = value.match(STUDENT_CODE_PATTERN)?.[0];
  if (code) {
    const normCode = normalizeQrText(code);
    const byCode = students.find(s => s.codigo_estudiante && normalizeQrText(s.codigo_estudiante) === normCode);
    if (byCode) return byCode;
  }

  // 3. DNI completo de 8 dígitos dentro del texto
  const dni = value.match(DNI_PATTERN)?.[0];
  if (dni) {
    return students.find(s => (s.profile?.dni || s.dni) === dni);
  }

  return undefined;
}
