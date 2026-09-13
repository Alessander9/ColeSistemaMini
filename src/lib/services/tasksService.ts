import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { TaskAssignment, TaskSubmission, EvaluationExam, GradeLetter } from '@/types';
import { MOCK_TASKS, MOCK_SUBMISSIONS, MOCK_EXAMS, MOCK_COURSES } from '@/lib/mock-data';

let localTasks: TaskAssignment[] = [...MOCK_TASKS];
let localSubmissions: TaskSubmission[] = [...MOCK_SUBMISSIONS];
let localExams: EvaluationExam[] = [...MOCK_EXAMS];

export async function fetchTasks(): Promise<TaskAssignment[]> {
  if (!isSupabaseConfigured()) return localTasks;
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('tareas')
      .select('*, curso:cursos(*), competencia:competencias(*)');

    if (error || !data) return localTasks;
    return data as TaskAssignment[];
  } catch {
    return localTasks;
  }
}

export async function fetchSubmissions(): Promise<TaskSubmission[]> {
  if (!isSupabaseConfigured()) return localSubmissions;
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('entregas_tareas')
      .select('*, tarea:tareas(*)');

    if (error || !data) return localSubmissions;
    return data as TaskSubmission[];
  } catch {
    return localSubmissions;
  }
}

export async function fetchExams(): Promise<EvaluationExam[]> {
  if (!isSupabaseConfigured()) return localExams;
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('evaluaciones')
      .select('*, curso:cursos(*), competencia:competencias(*)');

    if (error || !data) return localExams;
    return data as EvaluationExam[];
  } catch {
    return localExams;
  }
}

export async function addTaskInDb(task: {
  cursoId: string;
  seccionId: string;
  docenteId: string;
  titulo: string;
  descripcion: string;
  fechaLimite: string;
  competenciaId?: string;
}): Promise<TaskAssignment | null> {
  const course = MOCK_COURSES.find(c => c.id === task.cursoId);
  const newTask: TaskAssignment = {
    id: `task-${Date.now()}`,
    curso_id: task.cursoId,
    seccion_id: task.seccionId,
    docente_id: task.docenteId,
    titulo: task.titulo,
    descripcion: task.descripcion,
    fecha_limite: task.fechaLimite,
    competencia_id: task.competenciaId || undefined,
    curso: course,
    created_at: new Date().toISOString(),
  };

  localTasks.push(newTask);

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      await supabase.from('tareas').insert({
        curso_id: task.cursoId,
        seccion_id: task.seccionId,
        docente_id: task.docenteId,
        titulo: task.titulo,
        descripcion: task.descripcion,
        fecha_limite: task.fechaLimite,
        competencia_id: task.competenciaId || null,
      });
    } catch {
      /* ignore */
    }
  }

  return newTask;
}

export async function submitTaskInDb(params: {
  tareaId: string;
  matriculaId: string;
  comentarioEstudiante?: string;
}): Promise<TaskSubmission | null> {
  const task = localTasks.find(t => t.id === params.tareaId);
  const existingIdx = localSubmissions.findIndex(s => s.tarea_id === params.tareaId && s.matricula_id === params.matriculaId);

  const newSub: TaskSubmission = {
    id: existingIdx >= 0 ? localSubmissions[existingIdx].id : `sub-${Date.now()}`,
    tarea_id: params.tareaId,
    matricula_id: params.matriculaId,
    comentario_estudiante: params.comentarioEstudiante || '',
    fecha_entrega: new Date().toISOString(),
    tarea: task,
  };

  if (existingIdx >= 0) {
    localSubmissions[existingIdx] = newSub;
  } else {
    localSubmissions.push(newSub);
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      await supabase
        .from('entregas_tareas')
        .upsert(
          {
            tarea_id: params.tareaId,
            matricula_id: params.matriculaId,
            comentario_estudiante: params.comentarioEstudiante || '',
            fecha_entrega: new Date().toISOString(),
          },
          { onConflict: 'tarea_id,matricula_id' }
        );
    } catch {
      /* ignore */
    }
  }

  return newSub;
}

export async function gradeTaskInDb(params: {
  tareaId: string;
  matriculaId: string;
  calificacionLetra: GradeLetter;
  retroalimentacion?: string;
  docenteId?: string;
}): Promise<void> {
  const sub = localSubmissions.find(s => s.tarea_id === params.tareaId && s.matricula_id === params.matriculaId);
  if (sub) {
    sub.calificacion_letra = params.calificacionLetra;
    sub.retroalimentacion_docente = params.retroalimentacion || '';
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      await supabase
        .from('entregas_tareas')
        .update({
          calificacion_letra: params.calificacionLetra,
          retroalimentacion_docente: params.retroalimentacion || '',
          calificado_por: params.docenteId,
          calificado_en: new Date().toISOString(),
        })
        .eq('tarea_id', params.tareaId)
        .eq('matricula_id', params.matriculaId);
    } catch {
      /* ignore */
    }
  }
}
