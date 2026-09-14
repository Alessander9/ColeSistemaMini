import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Student, Enrollment, GradeLevel, Section, Course, Competency, EvaluationPeriod, GradeRecord, GradeLetter, UserProfile } from '@/types';
import { generateStudentEmail, generateStudentPassword, generateStudentUsername } from '@/lib/auth/generateCredentials';
import { 
  MOCK_GRADE_LEVELS, 
  MOCK_SECTIONS, 
  MOCK_COURSES, 
  MOCK_EVALUATION_PERIODS, 
  MOCK_STUDENTS, 
  MOCK_ENROLLMENTS, 
  MOCK_GRADE_RECORDS 
} from '@/lib/mock-data';

let localStudents = [...MOCK_STUDENTS];
let localEnrollments = [...MOCK_ENROLLMENTS];
let localGrades: GradeRecord[] = [...MOCK_GRADE_RECORDS];

export async function fetchGradeLevels(): Promise<GradeLevel[]> {
  if (!isSupabaseConfigured()) return MOCK_GRADE_LEVELS;
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('grados')
      .select('*')
      .order('numero_grado', { ascending: true });

    if (error || !data) return MOCK_GRADE_LEVELS;
    return data as GradeLevel[];
  } catch {
    return MOCK_GRADE_LEVELS;
  }
}

export async function fetchSections(): Promise<Section[]> {
  if (!isSupabaseConfigured()) return MOCK_SECTIONS;
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('secciones')
      .select('*, grado:grados(*)')
      .order('letra', { ascending: true });

    if (error || !data) return MOCK_SECTIONS;
    return data as Section[];
  } catch {
    return MOCK_SECTIONS;
  }
}

export async function fetchCourses(): Promise<Course[]> {
  if (!isSupabaseConfigured()) return MOCK_COURSES;
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('cursos')
      .select('*, competencias(*)');

    if (error || !data) return MOCK_COURSES;
    return data as Course[];
  } catch {
    return MOCK_COURSES;
  }
}

export async function fetchEvaluationPeriods(): Promise<EvaluationPeriod[]> {
  if (!isSupabaseConfigured()) return MOCK_EVALUATION_PERIODS;
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('periodos_evaluacion')
      .select('*')
      .order('numero_periodo', { ascending: true });

    if (error || !data) return MOCK_EVALUATION_PERIODS;
    return data as EvaluationPeriod[];
  } catch {
    return MOCK_EVALUATION_PERIODS;
  }
}

export async function fetchStudents(): Promise<Student[]> {
  if (!isSupabaseConfigured()) return localStudents;
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('estudiantes')
      .select('*, profile:profiles(*)');

    if (error || !data) return localStudents;
    return data as Student[];
  } catch {
    return localStudents;
  }
}

export async function fetchEnrollments(): Promise<Enrollment[]> {
  if (!isSupabaseConfigured()) return localEnrollments;
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('matriculas')
      .select(`
        *,
        estudiante:estudiantes(*, profile:profiles(*)),
        seccion:secciones(*, grado:grados(*)),
        periodo:periodos_academicos(*)
      `);

    if (error || !data) return localEnrollments;
    return data as Enrollment[];
  } catch {
    return localEnrollments;
  }
}

export async function fetchGradeRecords(): Promise<GradeRecord[]> {
  if (!isSupabaseConfigured()) return localGrades;
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('calificaciones')
      .select('*, competencia:competencias(*)');

    if (error || !data) return localGrades;
    return data as GradeRecord[];
  } catch {
    return localGrades;
  }
}

export async function createStudentInDb(data: {
  nombres: string;
  apellidos: string;
  dni: string;
  fechaNacimiento: string;
  seccionId: string;
  nombreApoderado: string;
  telefonoApoderado: string;
  genero?: string;
  periodoId?: string;
  avatar_url?: string;
  studentCode?: string;
  tokenQr?: string;
}): Promise<{ student: Student; credentials: { username: string; password: string; email: string } }> {
  const supabase = createClient();

  const generatedPassword = generateStudentPassword(data.nombres, data.apellidos, data.fechaNacimiento);
  const generatedEmail = generateStudentEmail(data.nombres, data.apellidos);
  const generatedUsername = generateStudentUsername(data.apellidos, data.dni);
  
  const cleanFirst = data.nombres.trim().split(' ')[0].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  const cleanLast = data.apellidos.trim().split(' ')[0].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  const studentCode = data.studentCode || `EST-2026-${Math.floor(100 + Math.random() * 900)}`;
  const tokenQr = data.tokenQr || `QR-${studentCode}-${cleanFirst}-${cleanLast}`;

  // 1. Crear Perfil de usuario en Supabase
  let profileId = `user-estudiante-${Date.now()}`;
  let newProfile: UserProfile | null = null;

  if (isSupabaseConfigured()) {
    try {
      const { data: dbProfile, error: profileErr } = await supabase
        .from('profiles')
        .insert({
          rol: 'estudiante',
          nombres: data.nombres.trim(),
          apellidos: data.apellidos.trim(),
          dni: data.dni.trim(),
          email: generatedEmail,
          telefono: data.telefonoApoderado,
          avatar_url: data.avatar_url || `https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80`,
          activo: true,
        })
        .select()
        .single();

      if (!profileErr && dbProfile) {
        newProfile = dbProfile as UserProfile;
        profileId = dbProfile.id;
      }
    } catch {
      /* fallback a local */
    }
  }

  // 2. Crear registro de estudiante
  let newStudent: Student | null = null;
  if (isSupabaseConfigured()) {
    try {
      const { data: dbStudent, error: studentErr } = await supabase
        .from('estudiantes')
        .insert({
          profile_id: profileId,
          codigo_estudiante: studentCode,
          fecha_nacimiento: data.fechaNacimiento,
          genero: data.genero || 'No especificado',
          nombre_apoderado: data.nombreApoderado,
          telefono_apoderado: data.telefonoApoderado,
          token_qr: tokenQr,
        })
        .select('*, profile:profiles(*)')
        .single();

      if (!studentErr && dbStudent) {
        newStudent = dbStudent as Student;
      }
    } catch {
      /* fallback */
    }
  }

  const studentResult: Student = (newStudent as Student) || {
    id: `est-${Date.now()}`,
    profile_id: profileId,
    codigo_estudiante: studentCode,
    fecha_nacimiento: data.fechaNacimiento,
    genero: data.genero || 'No especificado',
    nombre_apoderado: data.nombreApoderado,
    telefono_apoderado: data.telefonoApoderado,
    token_qr: tokenQr,
    profile: newProfile || {
      id: profileId,
      rol: 'estudiante',
      nombres: data.nombres,
      apellidos: data.apellidos,
      dni: data.dni,
      email: generatedEmail,
      avatar_url: data.avatar_url || `https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80`,
      activo: true,
    },
  };

  // 3. Matricular en la sección indicada
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('matriculas').insert({
        estudiante_id: studentResult.id,
        periodo_id: data.periodoId || 'periodo-2026',
        seccion_id: data.seccionId,
        estado: 'activo',
      });
    } catch {
      /* ignore */
    }
  }

  // Guardar en el store local
  localStudents.push(studentResult);
  localEnrollments.push({
    id: `enr-${Date.now()}`,
    estudiante_id: studentResult.id,
    periodo_id: data.periodoId || 'periodo-2026',
    seccion_id: data.seccionId,
    fecha_matricula: new Date().toISOString().split('T')[0],
    estado: 'activo',
    estudiante: studentResult,
  });

  return {
    student: studentResult,
    credentials: {
      username: generatedUsername,
      password: generatedPassword,
      email: generatedEmail,
    },
  };
}

export async function saveGradeInDb(params: {
  matriculaId: string;
  competenciaId: string;
  periodoEvaluacionId: string;
  notaLetra: GradeLetter;
  conclusionDescriptiva?: string;
}): Promise<void> {
  const letterToNum: Record<GradeLetter, number> = { AD: 20, A: 16, B: 13, C: 10 };
  const numericGrade = letterToNum[params.notaLetra] || 16;

  if (isSupabaseConfigured()) {
    const supabase = createClient();
    try {
      await supabase.from('calificaciones').upsert(
        {
          matricula_id: params.matriculaId,
          competencia_id: params.competenciaId,
          periodo_evaluacion_id: params.periodoEvaluacionId,
          nota_letra: params.notaLetra,
          nota_numerica: numericGrade,
          conclusion_descriptiva: params.conclusionDescriptiva || '',
        },
        { onConflict: 'matricula_id,competencia_id,periodo_evaluacion_id' }
      );
    } catch {
      /* ignore */
    }
  }

  // Actualizar store local
  const existingIdx = localGrades.findIndex(g => 
    g.matricula_id === params.matriculaId && 
    g.competencia_id === params.competenciaId && 
    g.periodo_evaluacion_id === params.periodoEvaluacionId
  );

  const newRecord: GradeRecord = {
    id: existingIdx >= 0 ? localGrades[existingIdx].id : `grade-${Date.now()}`,
    matricula_id: params.matriculaId,
    competencia_id: params.competenciaId,
    periodo_evaluacion_id: params.periodoEvaluacionId,
    nota_letra: params.notaLetra,
    nota_numerica: numericGrade,
    conclusion_descriptiva: params.conclusionDescriptiva || '',
  };

  if (existingIdx >= 0) {
    localGrades[existingIdx] = newRecord;
  } else {
    localGrades.push(newRecord);
  }
}
