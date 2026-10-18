import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Student, Enrollment, GradeLevel, Section, Course, Competency, EvaluationPeriod, GradeRecord, GradeLetter, UserProfile } from '@/types';
import { generateStudentEmail, generateSecurePassword, generateStudentUsername } from '@/lib/auth/generateCredentials';
import { 
  MOCK_GRADE_LEVELS, 
  MOCK_SECTIONS, 
  MOCK_COURSES, 
  MOCK_EVALUATION_PERIODS, 
  MOCK_STUDENTS, 
  MOCK_ENROLLMENTS, 
  MOCK_GRADE_RECORDS 
} from '@/lib/mock-data';

const g = (typeof globalThis !== 'undefined' ? globalThis : global) as any;
if (!g.__coleLocalStudents) g.__coleLocalStudents = [...MOCK_STUDENTS];
if (!g.__coleLocalEnrollments) g.__coleLocalEnrollments = [...MOCK_ENROLLMENTS];
if (!g.__coleLocalGrades) g.__coleLocalGrades = [...MOCK_GRADE_RECORDS];
if (!g.__coleLocalCourses) g.__coleLocalCourses = [...MOCK_COURSES];

function getLocalStudents(): Student[] {
  if (!g.__coleLocalStudents) g.__coleLocalStudents = [...MOCK_STUDENTS];
  return g.__coleLocalStudents;
}

function getLocalEnrollments(): Enrollment[] {
  if (!g.__coleLocalEnrollments) g.__coleLocalEnrollments = [...MOCK_ENROLLMENTS];
  return g.__coleLocalEnrollments;
}

function getLocalGrades(): GradeRecord[] {
  if (!g.__coleLocalGrades) g.__coleLocalGrades = [...MOCK_GRADE_RECORDS];
  return g.__coleLocalGrades;
}

function getLocalCourses(): Course[] {
  if (!g.__coleLocalCourses) g.__coleLocalCourses = [...MOCK_COURSES];
  return g.__coleLocalCourses;
}

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
  const localCourses = getLocalCourses();
  if (!isSupabaseConfigured()) return localCourses;
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('cursos')
      .select('*, competencias(*)');

    if (error || !data) return localCourses;
    return data as Course[];
  } catch {
    return localCourses;
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
  const localStudents = getLocalStudents();
  if (!isSupabaseConfigured()) return localStudents;
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('estudiantes')
      .select('*, profile:profiles(*)');

    if (error || !data) return localStudents;
    const map = new Map<string, Student>();
    (data as Student[]).forEach(s => {
      const enriched: Student = {
        ...s,
        nombres: s.nombres || s.profile?.nombres || '',
        apellidos: s.apellidos || s.profile?.apellidos || '',
        dni: s.dni || s.profile?.dni || '',
      };
      map.set(s.id, enriched);
    });
    localStudents.forEach(s => {
      if (!map.has(s.id)) map.set(s.id, s);
    });
    return Array.from(map.values());
  } catch {
    return localStudents;
  }
}

export async function fetchEnrollments(): Promise<Enrollment[]> {
  const localEnrollments = getLocalEnrollments();
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
    const map = new Map<string, Enrollment>();
    (data as Enrollment[]).forEach(e => map.set(e.id, e));
    localEnrollments.forEach(e => {
      if (!map.has(e.id)) map.set(e.id, e);
    });
    return Array.from(map.values());
  } catch {
    return localEnrollments;
  }
}

export async function fetchGradeRecords(): Promise<GradeRecord[]> {
  const localGrades = getLocalGrades();
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

export function registerStudentServer(student: Student, enrollment?: Enrollment) {
  const students = getLocalStudents();
  const enrollments = getLocalEnrollments();

  const existingIdx = students.findIndex(
    s => s.id === student.id || 
         (student.codigo_estudiante && s.codigo_estudiante === student.codigo_estudiante) || 
         (student.token_qr && s.token_qr === student.token_qr) ||
         (student.dni && (s.dni === student.dni || s.profile?.dni === student.dni))
  );
  if (existingIdx >= 0) {
    students[existingIdx] = { ...students[existingIdx], ...student };
  } else {
    students.unshift(student);
  }

  if (enrollment) {
    const existingEnrIdx = enrollments.findIndex(
      e => e.id === enrollment.id || 
           (enrollment.estudiante_id && e.estudiante_id === enrollment.estudiante_id)
    );
    if (existingEnrIdx >= 0) {
      enrollments[existingEnrIdx] = { ...enrollments[existingEnrIdx], ...enrollment };
    } else {
      enrollments.unshift(enrollment);
    }
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

  const generatedPassword = generateSecurePassword();
  const generatedEmail = generateStudentEmail(data.nombres, data.apellidos);
  const generatedUsername = generateStudentUsername(data.apellidos, data.dni);
  
  const cleanFirst = (data.nombres.trim().split(' ')[0] || 'ALUMNO').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "") || 'ALUMNO';
  const cleanLast = (data.apellidos.trim().split(' ')[0] || 'GENERAL').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "") || 'GENERAL';
  const studentCode = data.studentCode || `EST-2026-${Math.floor(100 + Math.random() * 900)}`;
  const tokenQr = data.tokenQr || `QR-${studentCode}-${cleanFirst}-${cleanLast}`;

  const isUuid = (val?: string) => !!val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

  // 1. Crear Perfil de usuario en Supabase si está disponible
  let profileId: string | null = null;
  let newProfile: UserProfile | null = null;

  if (isSupabaseConfigured()) {
    try {
      // Verificar si ya existe perfil con este DNI
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('dni', data.dni.trim())
        .maybeSingle();

      if (existingProfile) {
        newProfile = existingProfile as UserProfile;
        profileId = existingProfile.id;
      } else {
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
      }
    } catch {
      /* fallback a local */
    }
  }

  // 2. Crear registro de estudiante
  let newStudent: Student | null = null;
  if (isSupabaseConfigured()) {
    try {
      // Verificar si ya existe estudiante por profile_id o codigo_estudiante
      let existingDbStudent: any = null;
      if (profileId && isUuid(profileId)) {
        const { data: sByProf } = await supabase.from('estudiantes').select('*, profile:profiles(*)').eq('profile_id', profileId).maybeSingle();
        existingDbStudent = sByProf;
      }
      if (!existingDbStudent) {
        const { data: sByCode } = await supabase.from('estudiantes').select('*, profile:profiles(*)').eq('codigo_estudiante', studentCode).maybeSingle();
        existingDbStudent = sByCode;
      }

      if (existingDbStudent) {
        newStudent = existingDbStudent as Student;
      } else {
        const insertPayload: Record<string, any> = {
          codigo_estudiante: studentCode,
          fecha_nacimiento: data.fechaNacimiento,
          genero: data.genero || 'No especificado',
          nombre_apoderado: data.nombreApoderado,
          telefono_apoderado: data.telefonoApoderado,
          token_qr: tokenQr,
        };
        // Solo asignar profile_id si es un UUID válido de la tabla profiles
        if (profileId && isUuid(profileId)) {
          insertPayload.profile_id = profileId;
        }

        const { data: dbStudent, error: studentErr } = await supabase
          .from('estudiantes')
          .insert(insertPayload)
          .select('*, profile:profiles(*)')
          .single();

        if (!studentErr && dbStudent) {
          newStudent = dbStudent as Student;
        }
      }
    } catch {
      /* fallback */
    }
  }

  const studentResult: Student = (newStudent as Student) || {
    id: `est-${Date.now()}`,
    profile_id: profileId || `user-estudiante-${Date.now()}`,
    codigo_estudiante: studentCode,
    nombres: data.nombres,
    apellidos: data.apellidos,
    dni: data.dni,
    fecha_nacimiento: data.fechaNacimiento,
    genero: data.genero || 'No especificado',
    nombre_apoderado: data.nombreApoderado,
    telefono_apoderado: data.telefonoApoderado,
    token_qr: tokenQr,
    profile: newProfile || {
      id: profileId || `user-estudiante-${Date.now()}`,
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
  if (isSupabaseConfigured() && newStudent?.id && isUuid(newStudent.id)) {
    try {
      let activePeriodoId = data.periodoId;
      if (!isUuid(activePeriodoId)) {
        const { data: periodos } = await supabase.from('periodos_academicos').select('id').order('anio', { ascending: false }).limit(1);
        if (periodos && periodos.length > 0) {
          activePeriodoId = periodos[0].id;
        }
      }

      let validSecId = data.seccionId;
      if (!isUuid(validSecId)) {
        const { data: dbSec } = await supabase.from('secciones').select('id').limit(1).maybeSingle();
        if (dbSec?.id) {
          validSecId = dbSec.id;
        }
      }

      if (isUuid(activePeriodoId) && isUuid(validSecId)) {
        const { data: existingMat } = await supabase
          .from('matriculas')
          .select('id')
          .eq('estudiante_id', newStudent.id)
          .eq('periodo_id', activePeriodoId)
          .maybeSingle();

        if (!existingMat) {
          await supabase.from('matriculas').insert({
            estudiante_id: newStudent.id,
            periodo_id: activePeriodoId,
            seccion_id: validSecId,
            estado: 'activo',
          });
        }
      }
    } catch {
      /* ignore */
    }
  }

  const enrollmentResult: Enrollment = {
    id: `enr-${Date.now()}`,
    estudiante_id: studentResult.id,
    periodo_id: data.periodoId || 'periodo-2026',
    seccion_id: data.seccionId,
    fecha_matricula: new Date().toISOString().split('T')[0],
    estado: 'activo',
    estudiante: studentResult,
  };

  // Guardar en el store local del servidor
  registerStudentServer(studentResult, enrollmentResult);

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
  const localGrades = getLocalGrades();
  const existingIdx = localGrades.findIndex((g: GradeRecord) => 
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

export async function createCourseInDb(data: {
  nombre: string;
  codigo: string;
  nivel: 'inicial' | 'primaria' | 'secundaria';
  color?: string;
  color_hex?: string;
  area_curricular?: string;
  horas_semanales_sugeridas?: number;
  descripcion?: string;
  competencias?: { codigo: string; descripcion: string }[];
}): Promise<Course> {
  const courseId = `course-${data.codigo.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}`;
  
  const createdCompetencias: Competency[] = (data.competencias || []).map((c, index) => ({
    id: `comp-${courseId}-${index + 1}`,
    curso_id: courseId,
    codigo: c.codigo || `C${index + 1}`,
    descripcion: c.descripcion,
    orden: index + 1,
  }));

  const newCourse: Course = {
    id: courseId,
    nombre: data.nombre.trim(),
    codigo: data.codigo.trim().toUpperCase(),
    nivel: data.nivel,
    color: data.color_hex || data.color || '#4f46e5',
    color_hex: data.color_hex || data.color || '#4f46e5',
    area_curricular: data.area_curricular || 'General',
    horas_semanales_sugeridas: data.horas_semanales_sugeridas || 4,
    descripcion: data.descripcion || '',
    activo: true,
    created_at: new Date().toISOString(),
    competencias: createdCompetencias,
  };

  if (isSupabaseConfigured()) {
    const supabase = createClient();
    try {
      await supabase.from('cursos').insert({
        id: newCourse.id,
        nombre: newCourse.nombre,
        codigo: newCourse.codigo,
        nivel: newCourse.nivel,
        color_hex: newCourse.color_hex,
      });

      if (createdCompetencias.length > 0) {
        await supabase.from('competencias').insert(
          createdCompetencias.map(c => ({
            id: c.id,
            curso_id: c.curso_id,
            codigo: c.codigo,
            descripcion: c.descripcion,
            orden: c.orden,
          }))
        );
      }
    } catch {
      /* ignore */
    }
  }

  const localCourses = getLocalCourses();
  localCourses.push(newCourse);
  return newCourse;
}

export async function updateCourseInDb(
  courseId: string,
  data: Omit<Partial<Course>, 'competencias'> & { competencias?: { codigo: string; descripcion: string; id?: string }[] }
): Promise<Course | null> {
  const localCourses = getLocalCourses();
  const existingIdx = localCourses.findIndex((c: Course) => c.id === courseId);
  if (existingIdx === -1) return null;

  const current = localCourses[existingIdx];
  
  let updatedCompetencias: Competency[] = current.competencias || [];
  if (data.competencias) {
    updatedCompetencias = data.competencias.map((c, idx) => ({
      id: c.id || `comp-${courseId}-${idx + 1}-${Date.now()}`,
      curso_id: courseId,
      codigo: c.codigo || `C${idx + 1}`,
      descripcion: c.descripcion,
      orden: idx + 1,
    }));
  }

  const updatedCourse: Course = {
    ...current,
    ...data,
    competencias: updatedCompetencias,
  };

  localCourses[existingIdx] = updatedCourse;

  if (isSupabaseConfigured()) {
    const supabase = createClient();
    try {
      await supabase.from('cursos').update({
        nombre: updatedCourse.nombre,
        codigo: updatedCourse.codigo,
        nivel: updatedCourse.nivel,
        color_hex: updatedCourse.color_hex,
      }).eq('id', courseId);
    } catch {
      /* ignore */
    }
  }

  return updatedCourse;
}

export async function deleteCourseFromDb(courseId: string): Promise<boolean> {
  const remaining = getLocalCourses().filter((c: Course) => c.id !== courseId);
  g.__coleLocalCourses = remaining;

  if (isSupabaseConfigured()) {
    const supabase = createClient();
    try {
      await supabase.from('cursos').delete().eq('id', courseId);
    } catch {
      /* ignore */
    }
  }

  return true;
}
