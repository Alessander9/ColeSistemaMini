import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { ScheduleSlot, SectionCourseAssignment, ClassSessionLog, DayOfWeek, ScheduleConflict } from '@/types';
import { 
  MOCK_SECTION_COURSES, 
  MOCK_SCHEDULE_SLOTS, 
  MOCK_CLASS_SESSIONS, 
  MOCK_COURSES, 
  MOCK_SECTIONS, 
  MOCK_TEACHERS 
} from '@/lib/mock-data';

let localSectionCourses: SectionCourseAssignment[] = [...MOCK_SECTION_COURSES];
let localScheduleSlots: ScheduleSlot[] = [...MOCK_SCHEDULE_SLOTS];
let localClassSessions: ClassSessionLog[] = [...MOCK_CLASS_SESSIONS];

export async function fetchSectionCourses(): Promise<SectionCourseAssignment[]> {
  if (!isSupabaseConfigured()) return localSectionCourses;
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('asignaciones_docente')
      .select('*, curso:cursos(*), seccion:secciones(*, grado:grados(*)), docente:profiles(*)');

    if (error || !data) return localSectionCourses;
    return data as SectionCourseAssignment[];
  } catch {
    return localSectionCourses;
  }
}

export async function fetchScheduleSlots(): Promise<ScheduleSlot[]> {
  if (!isSupabaseConfigured()) return localScheduleSlots;
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('horarios')
      .select('*, curso:cursos(*), seccion:secciones(*, grado:grados(*)), docente:profiles(*)');

    if (error || !data) return localScheduleSlots;
    return data as ScheduleSlot[];
  } catch {
    return localScheduleSlots;
  }
}

export async function fetchClassSessions(): Promise<ClassSessionLog[]> {
  if (!isSupabaseConfigured()) return localClassSessions;
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('sesiones_clase')
      .select('*, curso:cursos(*), seccion:secciones(*)');

    if (error || !data) return localClassSessions;
    return data as ClassSessionLog[];
  } catch {
    return localClassSessions;
  }
}

export async function addScheduleSlotInDb(slot: {
  seccionId: string;
  cursoId: string;
  docenteId: string;
  dia: DayOfWeek;
  horaInicio: string;
  horaFin: string;
  aula?: string;
}): Promise<ScheduleSlot | null> {
  const course = MOCK_COURSES.find(c => c.id === slot.cursoId);
  const section = MOCK_SECTIONS.find(s => s.id === slot.seccionId);
  const teacher = MOCK_TEACHERS.find(t => t.id === slot.docenteId);

  const newSlot: ScheduleSlot = {
    id: `slot-${Date.now()}`,
    seccion_id: slot.seccionId,
    curso_id: slot.cursoId,
    docente_id: slot.docenteId,
    dia: slot.dia,
    hora_inicio: slot.horaInicio,
    hora_fin: slot.horaFin,
    aula: slot.aula || 'Aula Principal',
    curso: course,
    seccion: section,
    docente: teacher,
  };

  localScheduleSlots.push(newSlot);

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      await supabase.from('horarios').insert({
        seccion_id: slot.seccionId,
        curso_id: slot.cursoId,
        docente_id: slot.docenteId,
        dia: slot.dia,
        hora_inicio: slot.horaInicio,
        hora_fin: slot.horaFin,
        aula: slot.aula || 'Aula Principal',
      });
    } catch {
      /* ignore */
    }
  }

  return newSlot;
}

export async function removeScheduleSlotFromDb(slotId: string): Promise<boolean> {
  localScheduleSlots = localScheduleSlots.filter(s => s.id !== slotId);

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      await supabase.from('horarios').delete().eq('id', slotId);
    } catch {
      /* ignore */
    }
  }
  return true;
}
