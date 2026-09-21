import { GradeLetter, AttendanceStatus, GradeRecord, Competency, Course } from '@/types';

/**
 * Mapeo oficial de notas cualitativas a valor cuantitativo para cálculo pedagógico
 */
export const GRADE_SCALE: Record<GradeLetter, { value: number; label: string; minScore: number; maxScore: number; defaultNumeric: number }> = {
  AD: { value: 4, label: 'Logro Destacado', minScore: 18, maxScore: 20, defaultNumeric: 19 },
  A:  { value: 3, label: 'Logro Esperado',   minScore: 14, maxScore: 17, defaultNumeric: 16 },
  B:  { value: 2, label: 'En Proceso',       minScore: 11, maxScore: 13, defaultNumeric: 12 },
  C:  { value: 1, label: 'En Inicio',        minScore: 0,  maxScore: 10, defaultNumeric: 8 },
};

/**
 * Convierte una letra de calificación en su valor numérico (1 a 4)
 */
export function gradeToNumber(grade: GradeLetter): number {
  return GRADE_SCALE[grade]?.value ?? 0;
}

/**
 * Convierte un promedio numérico (1.0 a 4.0) a su letra cualitativa oficial
 */
export function numberToGrade(score: number): GradeLetter {
  if (score >= 3.5) return 'AD';
  if (score >= 2.5) return 'A';
  if (score >= 1.5) return 'B';
  return 'C';
}

/**
 * Convierte una nota cualitativa a escala vigesimal (0 a 20)
 */
export function gradeToVigesimal(grade: GradeLetter): number {
  return GRADE_SCALE[grade]?.defaultNumeric ?? 0;
}

/**
 * Convierte un puntaje vigesimal (0 a 20) a letra cualitativa
 */
export function vigesimalToGrade(score: number): GradeLetter {
  if (score >= 17.5) return 'AD';
  if (score >= 13.5) return 'A';
  if (score >= 10.5) return 'B';
  return 'C';
}

/**
 * Calcula el promedio de una serie de calificaciones cualitativas
 */
export function calculateAverage(grades: GradeLetter[]): {
  averageLetter: GradeLetter;
  averageScore: number;
  count: number;
} {
  const validGrades = grades.filter((g) => ['AD', 'A', 'B', 'C'].includes(g));
  if (validGrades.length === 0) {
    return { averageLetter: 'C', averageScore: 0, count: 0 };
  }

  const sum = validGrades.reduce((acc, g) => acc + gradeToNumber(g), 0);
  const averageScore = Number((sum / validGrades.length).toFixed(2));
  const averageLetter = numberToGrade(averageScore);

  return { averageLetter, averageScore, count: validGrades.length };
}

/**
 * Calcula el promedio cualitativo de un conjunto de registros de notas
 */
export function calculateCoursePeriodAverage(gradeRecords: GradeRecord[]): {
  letra: GradeLetter | null;
  score: number | null;
  totalEvaluated: number;
} {
  const letters = gradeRecords
    .map((g) => g.nota_letra)
    .filter((l): l is GradeLetter => ['AD', 'A', 'B', 'C'].includes(l as string));

  if (letters.length === 0) {
    return { letra: null, score: null, totalEvaluated: 0 };
  }

  const avg = calculateAverage(letters);
  return {
    letra: avg.averageLetter,
    score: avg.averageScore,
    totalEvaluated: letters.length,
  };
}

/**
 * Calcula la calificación de un curso en un bimestre específico
 * a partir de las competencias registradas.
 */
export function calculateCourseBimesterGrade(
  grades: GradeRecord[],
  enrollmentId: string,
  competencies: Competency[],
  bimesterPeriodId: string
): {
  gradeLetter: GradeLetter | null;
  numericScore: number | null;
  competenciesCount: number;
  evaluatedCount: number;
} {
  const compIds = competencies.map((c) => c.id);
  const bimesterGrades = grades.filter(
    (g) =>
      g.matricula_id === enrollmentId &&
      g.periodo_evaluacion_id === bimesterPeriodId &&
      compIds.includes(g.competencia_id)
  );

  if (bimesterGrades.length === 0) {
    return {
      gradeLetter: null,
      numericScore: null,
      competenciesCount: competencies.length,
      evaluatedCount: 0,
    };
  }

  const letters = bimesterGrades.map((g) => g.nota_letra);
  const avg = calculateAverage(letters);

  return {
    gradeLetter: avg.averageLetter,
    numericScore: avg.averageScore,
    competenciesCount: competencies.length,
    evaluatedCount: bimesterGrades.length,
  };
}

/**
 * Resumen anual de un curso basado en los 4 bimestres
 */
export interface AnnualCourseSummary {
  courseId: string;
  courseName: string;
  courseCode: string;
  colorHex?: string;
  bimesters: {
    periodId: string;
    bimesterNumber: number;
    gradeLetter: GradeLetter | null;
    score: number | null;
  }[];
  finalGrade: GradeLetter;
  finalScore: number;
  vigesimalScore: number;
  status: 'aprobado' | 'desaprobado';
  evaluatedBimestersCount: number;
  annualConclusion: string;
}

/**
 * Calcula la nota final anual de un curso promediando los 4 bimestres
 */
export function calculateCourseAnnualSummary(
  course: Course,
  bimestersData: { periodId: string; bimesterNumber: number; gradeLetter: GradeLetter | null; score: number | null }[],
  recordedDescriptiveConclusion?: string
): AnnualCourseSummary {
  const validGrades = bimestersData
    .map((b) => b.gradeLetter)
    .filter((g): g is GradeLetter => Boolean(g) && ['AD', 'A', 'B', 'C'].includes(g as string));

  let finalGrade: GradeLetter = 'C';
  let finalScore = 0;

  if (validGrades.length > 0) {
    const avg = calculateAverage(validGrades);
    finalGrade = avg.averageLetter;
    finalScore = avg.averageScore;
  }

  const vigesimalScore = Number((finalScore * 5).toFixed(1)); // Scale 1..4 -> 5..20 approx
  const status: 'aprobado' | 'desaprobado' = finalGrade === 'C' ? 'desaprobado' : 'aprobado';

  let annualConclusion = recordedDescriptiveConclusion || '';
  if (!annualConclusion) {
    if (finalGrade === 'AD') {
      annualConclusion = 'Demostró un desempeño sobresaliente en todas las competencias del área a lo largo de los cuatro bimestres.';
    } else if (finalGrade === 'A') {
      annualConclusion = 'Alcanzó satisfactoriamente los aprendizajes esperados demostrando solvencia y autonomía.';
    } else if (finalGrade === 'B') {
      annualConclusion = 'En proceso de consolidar aprendizajes. Se recomienda afianzar hábitos de estudio y repaso.';
    } else {
      annualConclusion = 'Presenta dificultades en los aprendizajes previstos. Requiere participar en el Programa de Recuperación Pedagógica.';
    }
  }

  return {
    courseId: course.id,
    courseName: course.nombre,
    courseCode: course.codigo,
    colorHex: course.color_hex,
    bimesters: bimestersData,
    finalGrade,
    finalScore,
    vigesimalScore,
    status,
    evaluatedBimestersCount: validGrades.length,
    annualConclusion,
  };
}

/**
 * Estructura completa de la Libreta Final Anual Oficial (Informe de Progreso Anual)
 */
export interface StudentAnnualReportCard {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  studentDni: string;
  studentCode: string;
  gradeLevelName: string;
  sectionLetter: string;
  academicYear: number;
  tutorName: string;
  courses: AnnualCourseSummary[];
  generalAverageGrade: GradeLetter;
  generalAverageScore: number;
  generalVigesimalScore: number;
  totalCourses: number;
  passedCourses: number;
  failedCourses: number;
  attendancePercentage: number;
  conductGrade: GradeLetter;
  finalAcademicStatus: 'PROMOVIDO' | 'RECUPERACIÓN' | 'PERMANECE';
  statusLabel: string;
  statusColor: string;
  isCompleteYear: boolean;
}

/**
 * Calcula la Libreta Final Oficial de Fin de Año de un estudiante
 */
export function calculateStudentAnnualReportCard(params: {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  studentDni: string;
  studentCode: string;
  gradeLevelName: string;
  sectionLetter: string;
  academicYear: number;
  tutorName?: string;
  courses: Course[];
  grades: GradeRecord[];
  evaluationPeriodIds: { id: string; numero_periodo: number }[];
  attendancePercentage?: number;
  conductGrade?: GradeLetter;
}): StudentAnnualReportCard {
  const {
    enrollmentId,
    studentId,
    studentName,
    studentDni,
    studentCode,
    gradeLevelName,
    sectionLetter,
    academicYear,
    tutorName = 'Docente Tutor Institucional',
    courses,
    grades,
    evaluationPeriodIds,
    attendancePercentage = 98,
    conductGrade = 'AD',
  } = params;

  // Sorted periods 1..4
  const sortedPeriods = [...evaluationPeriodIds].sort((a, b) => a.numero_periodo - b.numero_periodo);

  // Filter or compute all course summaries
  const courseSummaries: AnnualCourseSummary[] = courses.map((course) => {
    const competencies = course.competencias || [];
    const bimestersData = sortedPeriods.map((p) => {
      const bim = calculateCourseBimesterGrade(grades, enrollmentId, competencies, p.id);
      return {
        periodId: p.id,
        bimesterNumber: p.numero_periodo,
        gradeLetter: bim.gradeLetter,
        score: bim.numericScore,
      };
    });

    return calculateCourseAnnualSummary(course, bimestersData);
  });

  // Evaluated courses (those that have at least 1 evaluated bimester)
  const evaluatedCourses = courseSummaries.filter((c) => c.evaluatedBimestersCount > 0);
  const effectiveCourses = evaluatedCourses.length > 0 ? evaluatedCourses : courseSummaries;

  const allFinalGrades = effectiveCourses.map((c) => c.finalGrade);
  const avg = calculateAverage(allFinalGrades);

  const totalCourses = effectiveCourses.length;
  const passedCourses = effectiveCourses.filter((c) => c.status === 'aprobado').length;
  const failedCourses = effectiveCourses.filter((c) => c.status === 'desaprobado').length;

  // CNEB Promotion Rules:
  // - Promovido: 0 failed courses (or all passed)
  // - Recuperación: 1 to 3 failed courses
  // - Permanece: 4 or more failed courses
  let finalAcademicStatus: 'PROMOVIDO' | 'RECUPERACIÓN' | 'PERMANECE' = 'PROMOVIDO';
  let statusLabel = 'PROMOVIDO(A) DE GRADO';
  let statusColor = 'bg-emerald-600 text-white border-emerald-500';

  if (failedCourses >= 4) {
    finalAcademicStatus = 'PERMANECE';
    statusLabel = 'PERMANECE EN EL GRADO (REPITENCIA)';
    statusColor = 'bg-rose-600 text-white border-rose-500';
  } else if (failedCourses >= 1) {
    finalAcademicStatus = 'RECUPERACIÓN';
    statusLabel = 'REQUIERE RECUPERACIÓN PEDAGÓGICA (ENERO - FEBRERO)';
    statusColor = 'bg-amber-500 text-white border-amber-400';
  }

  const isCompleteYear = effectiveCourses.every((c) => c.evaluatedBimestersCount >= 4);

  return {
    enrollmentId,
    studentId,
    studentName,
    studentDni,
    studentCode,
    gradeLevelName,
    sectionLetter,
    academicYear,
    tutorName,
    courses: effectiveCourses,
    generalAverageGrade: avg.averageLetter,
    generalAverageScore: avg.averageScore,
    generalVigesimalScore: Number((avg.averageScore * 5).toFixed(1)),
    totalCourses,
    passedCourses,
    failedCourses,
    attendancePercentage,
    conductGrade,
    finalAcademicStatus,
    statusLabel,
    statusColor,
    isCompleteYear,
  };

}

/**
 * Calcula el estado final anual según la escala de evaluación escolar
 */
export function calculateAnnualStatus(periodAverages: GradeLetter[]): {
  finalLetter: GradeLetter;
  finalScore: number;
  status: 'PROMOVIDO' | 'RECUPERACIÓN' | 'PERMANECE';
  statusColor: string;
} {
  const { averageLetter, averageScore } = calculateAverage(periodAverages);

  let status: 'PROMOVIDO' | 'RECUPERACIÓN' | 'PERMANECE' = 'PROMOVIDO';
  let statusColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';

  if (averageLetter === 'C') {
    status = 'PERMANECE';
    statusColor = 'text-rose-600 bg-rose-50 border-rose-200';
  } else if (averageLetter === 'B' && periodAverages.includes('C')) {
    status = 'RECUPERACIÓN';
    statusColor = 'text-amber-600 bg-amber-50 border-amber-200';
  }

  return {
    finalLetter: averageLetter,
    finalScore: averageScore,
    status,
    statusColor,
  };
}

/**
 * Estilos visuales y metadatos para UI de Notas
 */
export function getGradeMeta(grade?: GradeLetter | string | null) {
  switch (grade) {
    case 'AD':
      return {
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-500/30',
        badge: 'bg-emerald-600 text-white',
        label: 'AD (Logro Destacado)',
        desc: 'Supera los aprendizajes esperados',
      };
    case 'A':
      return {
        bg: 'bg-blue-500/10 dark:bg-blue-500/20',
        text: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-500/30',
        badge: 'bg-blue-600 text-white',
        label: 'A (Logro Esperado)',
        desc: 'Demuestra el nivel esperado',
      };
    case 'B':
      return {
        bg: 'bg-amber-500/10 dark:bg-amber-500/20',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-500/30',
        badge: 'bg-amber-500 text-white',
        label: 'B (En Proceso)',
        desc: 'Próximo a alcanzar el nivel',
      };
    case 'C':
      return {
        bg: 'bg-rose-500/10 dark:bg-rose-500/20',
        text: 'text-rose-700 dark:text-rose-400',
        border: 'border-rose-500/30',
        badge: 'bg-rose-600 text-white',
        label: 'C (En Inicio)',
        desc: 'Muestra dificultades iniciales',
      };
    default:
      return {
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-500 dark:text-slate-400',
        border: 'border-slate-200 dark:border-slate-700',
        badge: 'bg-slate-400 text-white',
        label: 'Sin Calificar',
        desc: 'Pendiente de registro',
      };
  }
}

/**
 * Estilos visuales para estados de Asistencia
 */
export function getAttendanceMeta(status: AttendanceStatus) {
  switch (status) {
    case 'presente':
      return {
        label: 'Presente',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
        dot: 'bg-emerald-500',
      };
    case 'tardanza':
      return {
        label: 'Tardanza',
        bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
        dot: 'bg-amber-500',
      };
    case 'falta':
      return {
        label: 'Falta',
        bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
        dot: 'bg-rose-500',
      };
    case 'justificado':
      return {
        label: 'Justificado',
        bg: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
        dot: 'bg-sky-500',
      };
  }
}

