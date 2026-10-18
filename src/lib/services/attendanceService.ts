import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { AttendanceRecord, AttendanceStatus, AttendanceMethod } from '@/types';
import { MOCK_ATTENDANCES, MOCK_ENROLLMENTS } from '@/lib/mock-data';

const g = (typeof globalThis !== 'undefined' ? globalThis : global) as any;
if (!g.__coleLocalAttendances) g.__coleLocalAttendances = [...MOCK_ATTENDANCES];

function getLocalAttendances(): AttendanceRecord[] {
  if (!g.__coleLocalAttendances) g.__coleLocalAttendances = [...MOCK_ATTENDANCES];
  return g.__coleLocalAttendances;
}

export async function fetchAttendances(): Promise<AttendanceRecord[]> {
  const localAttendances = getLocalAttendances();
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
    const map = new Map<string, AttendanceRecord>();
    (data as AttendanceRecord[]).forEach(a => map.set(a.id, a));
    localAttendances.forEach(a => {
      if (!map.has(a.id)) map.set(a.id, a);
    });
    return Array.from(map.values());
  } catch {
    return localAttendances;
  }
}

const isUuid = (val?: string) => !!val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

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
  const localAttendances = getLocalAttendances();
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

    if (isSupabaseConfigured() && isUuid(localExisting.id)) {
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

  // 2. Verificación remota en Supabase (para evitar duplicados entre múltiples terminales físicas)
  if (isSupabaseConfigured() && isUuid(params.matriculaId)) {
    try {
      const supabase = createClient();
      const { data: dbExisting } = await supabase
        .from('asistencias')
        .select('*')
        .eq('matricula_id', params.matriculaId)
        .eq('fecha', todayStr)
        .maybeSingle();

      if (dbExisting) {
        if (params.metodo === 'qr') {
          return {
            record: dbExisting as AttendanceRecord,
            error: `El alumno ya cuenta con asistencia registrada hoy a las ${dbExisting.hora_registro}`,
            duplicate: true,
          };
        }
        if (isUuid(dbExisting.id)) {
          await supabase
            .from('asistencias')
            .update({
              estado: params.estado,
              metodo: params.metodo,
              observacion: params.observacion || dbExisting.observacion,
              hora_registro: currentTimeStr,
            })
            .eq('id', dbExisting.id);
        }
        return { record: dbExisting as AttendanceRecord, error: null };
      }
    } catch {
      /* ignore */
    }
  }

  // 3. Insertar nuevo registro
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

  if (isSupabaseConfigured() && isUuid(params.matriculaId)) {
    try {
      const supabase = createClient();
      await supabase.from('asistencias').insert({
        matricula_id: params.matriculaId,
        fecha: todayStr,
        hora_registro: currentTimeStr,
        estado: params.estado,
        metodo: params.metodo,
        observacion: params.observacion,
        registrado_por: isUuid(params.registradoPorId) ? params.registradoPorId : null,
      });
    } catch {
      /* ignore */
    }
  }

  return { record: newRecord, error: null };
}
