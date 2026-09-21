import { jsPDF } from 'jspdf';
import { 
  Section, 
  Enrollment, 
  Course, 
  GradeRecord, 
  EvaluationPeriod, 
  SystemBrandingConfig 
} from '@/types';
import { calculateCoursePeriodAverage } from '@/lib/grades/calculations';

export interface ConsolidadoSalonPdfData {
  section: Section;
  period: EvaluationPeriod;
  enrollments: Enrollment[];
  courses: Course[];
  grades: GradeRecord[];
  brandingConfig?: SystemBrandingConfig | null;
}

export async function generateConsolidadoSalonPdf(data: ConsolidadoSalonPdfData): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const { section, period, enrollments, courses, grades, brandingConfig } = data;
  const schoolName = brandingConfig?.nombreInstitucion || 'INSTITUCIÓN EDUCATIVA SAN JOSÉ';
  const ugel = brandingConfig?.ugel || 'UGEL 03';
  const anioLectivo = '2026';

  const marginX = 12;
  let y = 10;

  // Colors
  const cPrimary = [30, 27, 75];
  const cAccent = [67, 56, 202];
  const cDark = [15, 23, 42];
  const cMuted = [100, 116, 139];
  const cBorder = [203, 213, 225];
  const cTableHead = [238, 242, 255];

  // Header Banner
  doc.setFillColor(cPrimary[0], cPrimary[1], cPrimary[2]);
  doc.rect(marginX, y, 273, 16, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(schoolName.toUpperCase(), marginX + 5, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`ACTA CONSOLIDADA DE EVALUACIÓN CNEB — ${period.nombre.toUpperCase()} ${anioLectivo} — ${ugel}`, marginX + 5, y + 12);

  doc.setFont('helvetica', 'bold');
  doc.text(`GRADO Y SECCIÓN: ${section.grado?.nombre || ''} "${section.letra}"`, 285 - marginX, y + 6, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Matriculados: ${enrollments.length}`, 285 - marginX, y + 12, { align: 'right' });

  y += 20;

  // Columns config
  const numColW = 8;
  const dniColW = 20;
  const nameColW = 60;
  const condColW = 24;

  const totalCourseWidth = 273 - (numColW + dniColW + nameColW + condColW);
  const maxCoursesToShow = Math.min(courses.length, 10);
  const courseColW = totalCourseWidth / (maxCoursesToShow || 1);

  // Table Header
  doc.setFillColor(cTableHead[0], cTableHead[1], cTableHead[2]);
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.rect(marginX, y, 273, 8, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(cDark[0], cDark[1], cDark[2]);

  doc.text('N°', marginX + 4, y + 5.5, { align: 'center' });
  doc.text('DNI', marginX + numColW + 2, y + 5.5);
  doc.text('APELLIDOS Y NOMBRES', marginX + numColW + dniColW + 2, y + 5.5);

  const displayedCourses = courses.slice(0, maxCoursesToShow);
  displayedCourses.forEach((c, idx) => {
    const xPos = marginX + numColW + dniColW + nameColW + idx * courseColW;
    const shortName = c.codigo || c.nombre.substring(0, 4);
    doc.text(shortName.toUpperCase(), xPos + courseColW / 2, y + 5.5, { align: 'center' });
  });

  doc.text('CONDICIÓN', marginX + numColW + dniColW + nameColW + displayedCourses.length * courseColW + condColW / 2, y + 5.5, { align: 'center' });

  y += 8;

  // Table Rows per Student
  const rowH = 6;
  const sortedEnrollments = [...enrollments].sort((a, b) => {
    const nameA = `${a.estudiante?.profile?.apellidos || a.estudiante?.apellidos || ''}`;
    const nameB = `${b.estudiante?.profile?.apellidos || b.estudiante?.apellidos || ''}`;
    return nameA.localeCompare(nameB);
  });

  sortedEnrollments.forEach((enr, sIdx) => {
    if (y + rowH > 190) {
      doc.addPage();
      y = 12;
    }

    doc.setFillColor(sIdx % 2 === 0 ? 255 : 248, sIdx % 2 === 0 ? 255 : 250, sIdx % 2 === 0 ? 255 : 252);
    doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
    doc.rect(marginX, y, 273, rowH, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(cDark[0], cDark[1], cDark[2]);

    // #
    doc.text(String(sIdx + 1), marginX + 4, y + 4.2, { align: 'center' });
    // DNI
    doc.text(enr.estudiante?.profile?.dni || enr.estudiante?.dni || '—', marginX + numColW + 2, y + 4.2);
    // Name
    const sName = `${enr.estudiante?.profile?.apellidos || enr.estudiante?.apellidos || ''}, ${enr.estudiante?.profile?.nombres || enr.estudiante?.nombres || ''}`;
    doc.text(sName.length > 35 ? sName.substring(0, 33) + '...' : sName, marginX + numColW + dniColW + 2, y + 4.2);

    let hasCGrade = false;

    // Course Grades
    displayedCourses.forEach((c, idx) => {
      const xPos = marginX + numColW + dniColW + nameColW + idx * courseColW;
      const compIds = (c.competencias || []).map(comp => comp.id);
      const studentCourseGrades = grades.filter(
        g => g.matricula_id === enr.id && compIds.includes(g.competencia_id) && g.periodo_evaluacion_id === period.id
      );

      const calculated = calculateCoursePeriodAverage(studentCourseGrades);
      const letter = calculated.letra || '—';

      if (letter === 'C') hasCGrade = true;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      if (letter === 'AD') doc.setTextColor(5, 150, 105);
      else if (letter === 'A') doc.setTextColor(2, 132, 199);
      else if (letter === 'B') doc.setTextColor(217, 119, 6);
      else if (letter === 'C') doc.setTextColor(220, 38, 38);
      else doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);

      doc.text(letter, xPos + courseColW / 2, y + 4.2, { align: 'center' });
    });

    // Condición Column
    const condX = marginX + numColW + dniColW + nameColW + displayedCourses.length * courseColW;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    if (hasCGrade) {
      doc.setTextColor(217, 119, 6);
      doc.text('RECUPERACIÓN', condX + condColW / 2, y + 4.2, { align: 'center' });
    } else {
      doc.setTextColor(5, 150, 105);
      doc.text('PROMOVIDO', condX + condColW / 2, y + 4.2, { align: 'center' });
    }

    y += rowH;
  });

  // Footer & Signatures
  y += 8;
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
  doc.text(`Acta oficial emitida el ${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE')} — Sistema ColeSistemaMini CNEB`, marginX, y);

  return doc;
}
