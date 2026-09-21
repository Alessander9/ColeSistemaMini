/**
 * Servicio de Exportación Oficial para SIAGIE (MINEDU)
 * Genera plantillas CSV/Excel compatibles con el sistema oficial del Ministerio de Educación del Perú.
 */

import { Section, Course, Competency, Enrollment, Student, GradeRecord, EvaluationPeriod } from '@/types';

export interface SiagieExportParams {
  seccion: Section;
  curso: Course;
  competencias: Competency[];
  matriculas: Enrollment[];
  estudiantes: Student[];
  calificaciones: GradeRecord[];
  periodo: EvaluationPeriod;
  nivelNombre?: string;
  gradoNombre?: string;
}

export function exportSiagieGradesCsv({
  seccion,
  curso,
  competencias,
  matriculas,
  estudiantes,
  calificaciones,
  periodo,
  nivelNombre = 'Primaria',
  gradoNombre = '3ro'
}: SiagieExportParams): void {
  // Encabezados oficiales de SIAGIE MINEDU
  const headers = [
    'N°',
    'DNI / Doc. Identidad',
    'Código Estudiante',
    'Apellidos y Nombres',
    'Nivel',
    'Grado',
    'Sección',
    'Área Curricular',
    'Periodo / Bimestre',
    ...competencias.map((c, idx) => `Comp_${idx + 1}_Nota [${c.descripcion.substring(0, 30)}...]`),
    ...competencias.map((c, idx) => `Comp_${idx + 1}_Conclusion_Descriptiva`),
    'Calificacion_Final_Periodo'
  ];

  const rows: string[][] = [];

  // Ordenar matrículas alfabéticamente por apellidos
  const sortedMatriculas = [...matriculas].sort((a, b) => {
    const sA = estudiantes.find(s => s.id === a.estudiante_id);
    const sB = estudiantes.find(s => s.id === b.estudiante_id);
    const nameA = `${sA?.apellidos || ''} ${sA?.nombres || ''}`;
    const nameB = `${sB?.apellidos || ''} ${sB?.nombres || ''}`;
    return nameA.localeCompare(nameB);
  });

  sortedMatriculas.forEach((mat, index) => {
    const student = estudiantes.find(s => s.id === mat.estudiante_id);
    const studentGrades = calificaciones.filter(
      g => g.matricula_id === mat.id && g.periodo_evaluacion_id === periodo.id
    );

    const compNotas: string[] = [];
    const compConclusiones: string[] = [];

    competencias.forEach(comp => {
      const g = studentGrades.find(grade => grade.competencia_id === comp.id);
      compNotas.push(g?.nota_letra || g?.nota_numerica?.toString() || '-');
      compConclusiones.push(g?.conclusion_descriptiva ? `"${g.conclusion_descriptiva.replace(/"/g, '""')}"` : '""');
    });

    // Calcular resumen
    const hasGrades = compNotas.filter(n => n !== '-');
    const calFinal = hasGrades.length > 0 ? (hasGrades.includes('C') ? 'B' : (hasGrades.includes('B') ? 'A' : (hasGrades.every(n => n === 'AD') ? 'AD' : 'A'))) : '-';

    const row = [
      (index + 1).toString(),
      student?.dni || '',
      student?.codigo_estudiante || '',
      `"${student?.apellidos || ''}, ${student?.nombres || ''}"`,
      nivelNombre,
      gradoNombre,
      seccion.letra,
      `"${curso.nombre}"`,
      periodo.nombre,
      ...compNotas,
      ...compConclusiones,
      calFinal
    ];

    rows.push(row);
  });

  // Generar CSV con BOM UTF-8 para compatibilidad perfecta con Excel en Windows
  const csvContent = '\uFEFF' + [
    headers.join(';'),
    ...rows.map(r => r.join(';'))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  
  const cleanCourseName = curso.nombre.replace(/[^a-zA-Z0-9]/g, '_');
  const cleanPeriod = periodo.nombre.replace(/[^a-zA-Z0-9]/g, '_');
  link.setAttribute('download', `SIAGIE_${gradoNombre}_${seccion.letra}_${cleanCourseName}_${cleanPeriod}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
