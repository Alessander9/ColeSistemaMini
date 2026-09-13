import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { AttendanceRecord, AttendanceStatus, AttendanceMethod } from '@/types';
import { MOCK_ATTENDANCES, MOCK_ENROLLMENTS } from '@/lib/mock-data';

let localAttendances: AttendanceRecord[] = [...MOCK_ATTENDANCES];

export async function fetchAttendances(): Promise<AttendanceRecord[]> {
  if (!isSupabaseConfigured()) return localAttendances;
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('asistencias')
      .select(`
        *,
        matricula:matriculas(
          *,
          estudiante:estudiantes(*, profile:profiles(*)),
          seccion:secciones(*, grado:grados(*))
        )
      `)
      .order('fecha', { ascending: false })
      .order('hora_registro', { ascending: false });

    if (error || !data) return localAttendances;
    return data as AttendanceRecord[];
  } catch {
    return localAttendances;
  }
}

export async function recordAttendanceInDb(params: {
  matriculaId: string;
  estado: AttendanceStatus;
  metodo: AttendanceMethod;
  observacion?: string;
  registradoPorId?: string;
}): Promise<{ record: AttendanceRecord | null; error: string | null; duplicate?: boolean }> {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentTimeStr = now.toLocaleTimeString('es-PE', { hour12: false });

  // 1. Manejo Local
  const localExisting = localAttendances.find(a => a.matricula_id === params.matriculaId && a.fecha === todayStr);

  if (localExisting) {
    if (params.metodo === 'qr') {
      return {
        record: localExisting,
        error: `El alumno ya cuenta con asistencia registrada hoy a las ${localExisting.hora_registro}`,
        duplicate: true,
      };
    }

    localExisting.estado = params.estado;
    localExisting.metodo = params.metodo;
    localExisting.hora_registro = currentTimeStr;
    if (params.observacion) localExisting.observacion = params.observacion;

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await supabase
          .from('asistencias')
          .update({
            estado: params.estado,
            metodo: params.metodo,
            observacion: params.observacion || localExisting.observacion,
            hora_registro: currentTimeStr,
          })
          .eq('id', localExisting.id);
      } catch {
        /* ignore */
      }
    }

    return { record: localExisting, error: null };
  }

  // 2. Insertar nuevo registro
  const enr = MOCK_ENROLLMENTS.find(e => e.id === params.matriculaId);
  const newRecord: AttendanceRecord = {
    id: `asist-${Date.now()}`,
    matricula_id: params.matriculaId,
    fecha: todayStr,
    hora_registro: currentTimeStr,
    estado: params.estado,
    metodo: params.metodo,
    observacion: params.observacion,
    registrado_por: params.registradoPorId,
    matricula: enr,
  };

  localAttendances.unshift(newRecord);

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      await supabase.from('asistencias').insert({
        matricula_id: params.matriculaId,
        fecha: todayStr,
        hora_registro: currentTimeStr,
        estado: params.estado,
        metodo: params.metodo,
        observacion: params.observacion,
        registrado_por: params.registradoPorId,
      });
    } catch {
      /* ignore */
    }
  }

  return { record: newRecord, error: null };
}
