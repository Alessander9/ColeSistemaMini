import type { DayOfWeek, ScheduleSlot } from '@/types';

export type AttendanceWindowState = 'open' | 'before' | 'after' | 'other-day';

/**
 * Indica si ya se puede tomar la asistencia de una clase:
 * solo el mismo día de la clase y entre su hora de inicio (incluida) y su hora de fin (excluida).
 * `nowHHMM` y las horas del horario usan el formato "HH:MM" de 24 horas.
 */
export function getAttendanceWindow(
  slot: Pick<ScheduleSlot, 'dia' | 'hora_inicio' | 'hora_fin'>,
  todayKey: DayOfWeek | null,
  nowHHMM: string
): AttendanceWindowState {
  if (slot.dia !== todayKey) return 'other-day';
  if (nowHHMM < slot.hora_inicio) return 'before';
  if (nowHHMM >= slot.hora_fin) return 'after';
  return 'open';
}

const WEEK_ORDER: DayOfWeek[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];

export type SectionClassStatus =
  | { kind: 'open'; slot: ScheduleSlot }                          // hay clase ahora: se puede tomar asistencia
  | { kind: 'later-today'; slot: ScheduleSlot }                   // tiene clase más tarde hoy
  | { kind: 'next-day'; slot: ScheduleSlot; hadClassToday: boolean } // la próxima clase es otro día
  | { kind: 'no-schedule' };                                      // el aula no tiene clases en el horario

/**
 * Estado de la clase de un aula para el docente, según la hora actual.
 * Se usa en "Mi panel diario" y en "Tomar asistencia" para habilitar o no la asistencia.
 */
export function getSectionClassStatus(
  teacherSlots: ScheduleSlot[],
  sectionId: string,
  todayKey: DayOfWeek | null,
  nowHHMM: string
): SectionClassStatus {
  const sectionSlots = teacherSlots.filter(s => s.seccion_id === sectionId);
  const byStart = (a: ScheduleSlot, b: ScheduleSlot) => a.hora_inicio.localeCompare(b.hora_inicio);
  const today = sectionSlots.filter(s => s.dia === todayKey).sort(byStart);

  const open = today.find(s => getAttendanceWindow(s, todayKey, nowHHMM) === 'open');
  if (open) return { kind: 'open', slot: open };

  const later = today.find(s => getAttendanceWindow(s, todayKey, nowHHMM) === 'before');
  if (later) return { kind: 'later-today', slot: later };

  const start = todayKey ? WEEK_ORDER.indexOf(todayKey) + 1 : 0;
  for (let i = 0; i < WEEK_ORDER.length; i++) {
    const day = WEEK_ORDER[(start + i) % WEEK_ORDER.length];
    const first = sectionSlots.filter(s => s.dia === day).sort(byStart)[0];
    if (first) return { kind: 'next-day', slot: first, hadClassToday: today.length > 0 };
  }
  return { kind: 'no-schedule' };
}

const DAY_NUMBER: Record<DayOfWeek, number> = { lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5 } as Record<DayOfWeek, number>;

/**
 * Fecha y hora exacta en que empieza la próxima vez esta clase (desde `now`).
 * Si hoy es el día de la clase y aún no empieza, es hoy; si ya empezó o pasó, es la próxima semana.
 */
export function nextClassStart(slot: Pick<ScheduleSlot, 'dia' | 'hora_inicio'>, now: Date): Date {
  const [h, m] = slot.hora_inicio.split(':').map(Number);
  const target = new Date(now);
  target.setHours(h, m || 0, 0, 0);
  let daysAhead = ((DAY_NUMBER[slot.dia] ?? 1) - now.getDay() + 7) % 7;
  if (daysAhead === 0 && target.getTime() <= now.getTime()) daysAhead = 7;
  target.setDate(target.getDate() + daysAhead);
  return target;
}

/** Tiempo en palabras simples: "2 días y 3 horas", "1 hora y 5 minutos", "menos de un minuto" */
export function timeLeftInWords(ms: number): string {
  if (ms < 60_000) return 'menos de un minuto';
  const totalMin = Math.floor(ms / 60_000);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  const part = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  if (days > 0) return hours > 0 ? `${part(days, 'día', 'días')} y ${part(hours, 'hora', 'horas')}` : part(days, 'día', 'días');
  if (hours > 0) return mins > 0 ? `${part(hours, 'hora', 'horas')} y ${part(mins, 'minuto', 'minutos')}` : part(hours, 'hora', 'horas');
  return part(mins, 'minuto', 'minutos');
}
