import { describe, it, expect } from 'vitest';
import { getAttendanceWindow, nextClassStart, timeLeftInWords } from '../lib/schedule/attendanceWindow';

const clase = { dia: 'lunes' as const, hora_inicio: '08:00', hora_fin: '08:45' };

describe('Botón "Tomar asistencia" según la hora de la clase', () => {
  it('se habilita desde la hora exacta de inicio', () => {
    expect(getAttendanceWindow(clase, 'lunes', '08:00')).toBe('open');
  });

  it('sigue habilitado durante la clase', () => {
    expect(getAttendanceWindow(clase, 'lunes', '08:30')).toBe('open');
    expect(getAttendanceWindow(clase, 'lunes', '08:44')).toBe('open');
  });

  it('está deshabilitado antes de que empiece la clase', () => {
    expect(getAttendanceWindow(clase, 'lunes', '07:59')).toBe('before');
  });

  it('se deshabilita a la hora exacta en que termina la clase', () => {
    expect(getAttendanceWindow(clase, 'lunes', '08:45')).toBe('after');
    expect(getAttendanceWindow(clase, 'lunes', '13:00')).toBe('after');
  });

  it('está deshabilitado en cualquier otro día, aunque sea la misma hora', () => {
    expect(getAttendanceWindow(clase, 'martes', '08:30')).toBe('other-day');
    expect(getAttendanceWindow(clase, null, '08:30')).toBe('other-day');
  });
});

describe('Cuenta regresiva para la próxima clase', () => {
  // Lunes 28 de septiembre de 2026, 07:30
  const lunes730 = new Date(2026, 8, 28, 7, 30, 0);

  it('si la clase es hoy más tarde, empieza hoy', () => {
    const d = nextClassStart({ dia: 'lunes', hora_inicio: '08:00' }, lunes730);
    expect(d.getDate()).toBe(28);
    expect(d.getHours()).toBe(8);
    expect(d.getMinutes()).toBe(0);
  });

  it('si la clase de hoy ya empezó, la próxima es la otra semana', () => {
    const d = nextClassStart({ dia: 'lunes', hora_inicio: '07:00' }, lunes730);
    expect(d.getDate()).toBe(5); // lunes 5 de octubre
    expect(d.getMonth()).toBe(9);
  });

  it('cuenta los días hasta otro día de la semana', () => {
    const d = nextClassStart({ dia: 'miercoles', hora_inicio: '10:15' }, lunes730);
    expect(d.getDate()).toBe(30);
    expect(d.getHours()).toBe(10);
    expect(d.getMinutes()).toBe(15);
  });

  it('desde el domingo, la clase del lunes es al día siguiente', () => {
    const domingo = new Date(2026, 8, 27, 20, 0, 0);
    expect(nextClassStart({ dia: 'lunes', hora_inicio: '08:00' }, domingo).getDate()).toBe(28);
  });

  it('explica el tiempo que falta en palabras simples', () => {
    expect(timeLeftInWords(30_000)).toBe('menos de un minuto');
    expect(timeLeftInWords(60_000)).toBe('1 minuto');
    expect(timeLeftInWords(45 * 60_000)).toBe('45 minutos');
    expect(timeLeftInWords(60 * 60_000)).toBe('1 hora');
    expect(timeLeftInWords(135 * 60_000)).toBe('2 horas y 15 minutos');
    expect(timeLeftInWords((24 * 60 + 60) * 60_000)).toBe('1 día y 1 hora');
    expect(timeLeftInWords(3 * 24 * 60 * 60_000)).toBe('3 días');
  });
});
