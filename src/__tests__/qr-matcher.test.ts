import { describe, it, expect } from 'vitest';
import { findStudentByQr, parseQrPayload } from '../lib/attendance/qrMatcher';

const lucas = {
  id: 'student-1',
  profile_id: 'user-student-1',
  token_qr: 'QR-EST-2026-001-Lucas_Morales',
  codigo_estudiante: 'EST-2026-001',
  dni: '70809010',
};
const ana = {
  id: 'student-2',
  profile_id: 'user-student-2',
  token_qr: 'QR-EST-2026-123-ANA-ROJAS',
  codigo_estudiante: 'EST-2026-123',
  dni: '71234567',
};
const beto = {
  id: 'student-3',
  profile_id: 'user-student-3',
  token_qr: 'QR-EST-2026-123456-BETO-SALAS',
  codigo_estudiante: 'EST-2026-123456',
  dni: '72345678',
};
const students = [lucas, ana, beto];

describe('Lectura del QR del carnet (kiosco de asistencia)', () => {
  it('reconoce el token exacto que contiene el QR del carnet', () => {
    expect(findStudentByQr(students, 'QR-EST-2026-001-Lucas_Morales')?.id).toBe('student-1');
  });

  it('ignora mayúsculas, tildes y espacios al leer', () => {
    expect(findStudentByQr(students, '  qr-est-2026-001-lucas_morales  ')?.id).toBe('student-1');
  });

  it('acepta el código del estudiante o su DNI escritos a mano', () => {
    expect(findStudentByQr(students, 'EST-2026-123')?.id).toBe('student-2');
    expect(findStudentByQr(students, '72345678')?.id).toBe('student-3');
  });

  it('acepta QR en formato JSON o URL', () => {
    expect(findStudentByQr(students, JSON.stringify({ codigo: 'EST-2026-123456' }))?.id).toBe('student-3');
    expect(findStudentByQr(students, 'https://colegio.pe/asistencia?token=QR-EST-2026-123-ANA-ROJAS')?.id).toBe('student-2');
    expect(parseQrPayload('{"dni":"70809010"}')).toBe('70809010');
  });

  it('reconoce un token regenerado si trae el código completo del alumno', () => {
    expect(findStudentByQr(students, 'QR-EST-2026-001-LUCAS-MORALES')?.id).toBe('student-1');
  });

  it('no confunde códigos que empiezan igual (EST-2026-123 vs EST-2026-123456)', () => {
    expect(findStudentByQr(students, 'QR-EST-2026-123456-BETO-SALAS')?.id).toBe('student-3');
    expect(findStudentByQr(students, 'EST-2026-123456')?.id).toBe('student-3');
    expect(findStudentByQr(students, 'EST-2026-1234')).toBeUndefined();
  });

  it('no acepta códigos incompletos ni texto que solo se parece', () => {
    expect(findStudentByQr(students, 'EST-2026')).toBeUndefined();
    expect(findStudentByQr(students, '1')).toBeUndefined();
    expect(findStudentByQr(students, 'Lucas')).toBeUndefined();
    expect(findStudentByQr(students, '7080901')).toBeUndefined();
    expect(findStudentByQr(students, '')).toBeUndefined();
  });
});
