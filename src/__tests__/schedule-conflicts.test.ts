import { describe, it, expect } from 'vitest';
import { ScheduleSlot, DayOfWeek, ScheduleConflict } from '@/types';
import { MOCK_SCHEDULE_SLOTS, MOCK_SECTIONS, MOCK_COURSES, MOCK_USERS } from '@/lib/mock-data';

// Helper conflict function matching AppContext logic
function checkTeacherConflict(
  slots: ScheduleSlot[],
  docenteId: string,
  dia: DayOfWeek,
  horaInicio: string,
  ignoreSlotId?: string
): ScheduleConflict {
  const existingSlot = slots.find(
    slot =>
      slot.docente_id === docenteId &&
      slot.dia === dia &&
      slot.hora_inicio === horaInicio &&
      slot.id !== ignoreSlotId
  );

  if (existingSlot) {
    const sec = existingSlot.seccion || MOCK_SECTIONS.find(s => s.id === existingSlot.seccion_id);
    const crs = existingSlot.curso || MOCK_COURSES.find(c => c.id === existingSlot.curso_id);
    const doc = existingSlot.docente || MOCK_USERS.find(u => u.id === existingSlot.docente_id);

    return {
      hasConflict: true,
      conflictingSlot: { ...existingSlot, seccion: sec, curso: crs, docente: doc },
      message: `El Prof. ${doc?.nombres.split(' ')[0]} ya tiene asignado ${crs?.nombre} en ${sec?.grado?.nombre} "${sec?.letra}" el día ${dia} a las ${horaInicio}.`
    };
  }

  return { hasConflict: false };
}

function auditScheduleIntegrity(slots: ScheduleSlot[]) {
  const conflicts: { slotA: ScheduleSlot; slotB: ScheduleSlot }[] = [];

  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i];
      const b = slots[j];

      if (
        a.docente_id === b.docente_id &&
        a.dia === b.dia &&
        a.hora_inicio === b.hora_inicio &&
        a.seccion_id !== b.seccion_id
      ) {
        conflicts.push({ slotA: a, slotB: b });
      }
    }
  }

  return {
    totalSlots: slots.length,
    conflictsCount: conflicts.length,
    conflicts,
  };
}

describe('Validación Anti-Cruce y Horarios Escolares', () => {
  it('la malla horaria inicial no debe tener ningún cruce de docentes (0 conflictos)', () => {
    const audit = auditScheduleIntegrity(MOCK_SCHEDULE_SLOTS);
    expect(audit.conflictsCount).toBe(0);
    expect(audit.conflicts).toEqual([]);
    expect(audit.totalSlots).toBeGreaterThan(0);
  });

  it('debe detectar conflicto cuando se intenta asignar al mismo docente en dos salones a la misma hora', () => {
    const docenteId = 'user-docente-1'; // Prof. Carlos Mendoza
    const dia: DayOfWeek = 'lunes';
    const horaInicio = '08:00';

    // In MOCK_SCHEDULE_SLOTS, Prof. Carlos Mendoza teaches Matemática on Monday 08:00
    const conflict = checkTeacherConflict(MOCK_SCHEDULE_SLOTS, docenteId, dia, horaInicio);

    expect(conflict.hasConflict).toBe(true);
    expect(conflict.conflictingSlot).toBeDefined();
    expect(conflict.message).toContain('Carlos');
  });

  it('no debe marcar conflicto si el docente está libre en ese bloque horario', () => {
    const docenteId = 'user-docente-1';
    const dia: DayOfWeek = 'lunes';
    const horaInicio = '13:00'; // Libre

    const conflict = checkTeacherConflict(MOCK_SCHEDULE_SLOTS, docenteId, dia, horaInicio);
    expect(conflict.hasConflict).toBe(false);
  });

  it('debe ignorar el slot actual cuando se está editando la misma clase', () => {
    const firstSlot = MOCK_SCHEDULE_SLOTS[0];
    const conflict = checkTeacherConflict(
      MOCK_SCHEDULE_SLOTS, 
      firstSlot.docente_id, 
      firstSlot.dia, 
      firstSlot.hora_inicio, 
      firstSlot.id
    );

    expect(conflict.hasConflict).toBe(false);
  });
});
