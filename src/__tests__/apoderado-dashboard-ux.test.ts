import { describe, it, expect } from 'vitest';
import { GradeLetter } from '@/types';

describe('Apoderado Dashboard UX Enhancements (1-3-4-5-6-7)', () => {
  // ── 1. Pulso en Vivo & Horario Escolar ──
  it('determines school hours correctly for live status pulse', () => {
    const isSchoolHours = (hour: number) => hour >= 7 && hour < 15;

    expect(isSchoolHours(8)).toBe(true);
    expect(isSchoolHours(12)).toBe(true);
    expect(isSchoolHours(14)).toBe(true);
    expect(isSchoolHours(6)).toBe(false);
    expect(isSchoolHours(18)).toBe(false);
  });

  // ── 3. Clasificación de Tareas por Semáforo de Urgencia ──
  it('segments tasks into urgent, upcoming, and completed categories', () => {
    const mockTasks = [
      { id: '1', titulo: 'Matemática Ficha 1', fecha_limite: '2026-10-18T23:59:00Z', sub: null, overdue: false }, // due today
      { id: '2', titulo: 'Comunicación Ensayo', fecha_limite: '2026-10-16T23:59:00Z', sub: null, overdue: true }, // overdue
      { id: '3', titulo: 'Ciencias Proyecto', fecha_limite: '2026-10-25T23:59:00Z', sub: null, overdue: false }, // upcoming
      { id: '4', titulo: 'Historia Resumen', fecha_limite: '2026-10-15T23:59:00Z', sub: { id: 's1', calificacion_letra: 'AD' as GradeLetter }, overdue: false }, // completed
    ];

    const urgentTasks = mockTasks.filter(t => !t.sub && (t.overdue || t.fecha_limite.startsWith('2026-10-18')));
    const upcomingTasks = mockTasks.filter(t => !t.sub && !t.overdue && !t.fecha_limite.startsWith('2026-10-18'));
    const completedTasks = mockTasks.filter(t => !!t.sub);

    expect(urgentTasks).toHaveLength(2); // IDs 1 and 2
    expect(upcomingTasks).toHaveLength(1); // ID 3
    expect(completedTasks).toHaveLength(1); // ID 4
  });

  it('correctly filters displayed tasks and returns empty array for urgentes when none exist', () => {
    const filterTasks = (filter: 'urgentes' | 'semana' | 'entregadas' | 'todas', urgents: any[], upcomings: any[], completeds: any[], all: any[]) => {
      if (filter === 'urgentes') return urgents;
      if (filter === 'semana') return upcomings;
      if (filter === 'entregadas') return completeds;
      return all;
    };

    const emptyUrgents: any[] = [];
    const someAll = [{ id: '1' }, { id: '2' }];

    // When urgentes is active and none exist, it should return [] so the UI can show the reassuring empty state
    const result = filterTasks('urgentes', emptyUrgents, [], [], someAll);
    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  // ── 4. Línea de Tiempo de Asistencia Semanal (Lunes a Viernes) ──
  it('calculates the 5 school days (Monday to Friday) accurately', () => {
    const baseDate = new Date('2026-10-21T12:00:00Z'); // Wednesday
    const dayOfWeek = baseDate.getDay(); // 3 = Wednesday
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() + distanceToMonday);

    const weekDays = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      weekDays.push({ iso, day: d.getDay() });
    }

    expect(weekDays).toHaveLength(5);
    expect(weekDays[0].day).toBe(1); // Monday
    expect(weekDays[1].day).toBe(2); // Tuesday
    expect(weekDays[2].day).toBe(3); // Wednesday
    expect(weekDays[3].day).toBe(4); // Thursday
    expect(weekDays[4].day).toBe(5); // Friday
  });

  it('formats weekly range text accurately even when spanning two different months', () => {
    const formatRange = (start: Date, end: Date) => {
      return start.getMonth() === end.getMonth()
        ? `${start.getDate()} al ${end.getDate()} de ${start.toLocaleDateString('es-PE', { month: 'long' })}`
        : `${start.getDate()} de ${start.toLocaleDateString('es-PE', { month: 'short' }).replace('.', '')} al ${end.getDate()} de ${end.toLocaleDateString('es-PE', { month: 'short' }).replace('.', '')}`;
    };

    const sameMonthStart = new Date('2026-10-12T12:00:00');
    const sameMonthEnd = new Date('2026-10-16T12:00:00');
    expect(formatRange(sameMonthStart, sameMonthEnd)).toContain('12 al 16');

    const crossMonthStart = new Date('2026-10-26T12:00:00');
    const crossMonthEnd = new Date('2026-11-02T12:00:00');
    const crossText = formatRange(crossMonthStart, crossMonthEnd);
    expect(crossText).toContain('26 de');
    expect(crossText).toContain('2 de');
  });

  // ── 5. Escala CNEB Oficial y Detección de Apoyo Pedagógico ──
  it('maps CNEB grades and accurately flags courses needing pedagogical reinforcement', () => {
    const courseEvaluations: { curso: string; letter: GradeLetter }[] = [
      { curso: 'Matemática', letter: 'C' },
      { curso: 'Comunicación', letter: 'A' },
      { curso: 'Inglés', letter: 'B' },
      { curso: 'Arte', letter: 'AD' },
    ];

    const coursesInC = courseEvaluations.filter(c => c.letter === 'C');
    expect(coursesInC).toHaveLength(1);
    expect(coursesInC[0].curso).toBe('Matemática');

    const CNEB_MEANINGS: Record<GradeLetter, string> = {
      AD: 'Logro Destacado (18-20)',
      A: 'Logro Esperado (14-17)',
      B: 'En Proceso (11-13)',
      C: 'En Inicio (0-10)',
    };

    expect(CNEB_MEANINGS.AD).toContain('18-20');
    expect(CNEB_MEANINGS.C).toContain('0-10');
  });

  // ── 6. Armonización con el Branding del Colegio ──
  it('provides sensible institutional color fallbacks when brandingConfig is partial', () => {
    const partialBranding = {
      primaryColor: '#059669',
      // secondary and accent omitted
    };

    const primary = partialBranding.primaryColor || '#2563eb';
    const secondary = (partialBranding as any).secondaryColor || '#4f46e5';
    const accent = (partialBranding as any).accentColor || '#ec4899';

    expect(primary).toBe('#059669');
    expect(secondary).toBe('#4f46e5');
    expect(accent).toBe('#ec4899');
  });
});
