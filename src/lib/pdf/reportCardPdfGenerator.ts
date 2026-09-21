import { jsPDF } from 'jspdf';
import { 
  Student, 
  Enrollment, 
  Course, 
  GradeRecord, 
  EvaluationPeriod, 
  AttendanceRecord, 
  SystemBrandingConfig,
  GradeLetter 
} from '@/types';
import { calculateCoursePeriodAverage } from '@/lib/grades/calculations';

export interface ReportCardPdfData {
  student: Student;
  enrollment?: Enrollment | null;
  courses: Course[];
  grades: GradeRecord[];
  periods?: EvaluationPeriod[];
  evaluationPeriods?: EvaluationPeriod[];
  attendances?: AttendanceRecord[];
  activePeriodId?: string;
  brandingConfig?: SystemBrandingConfig | null;
  tutorName?: string;
}

export interface BatchReportCardsPdfData {
  items: ReportCardPdfData[];
  sectionName?: string;
  anioLectivo?: string;
}

export function renderReportCardPage(doc: jsPDF, data: ReportCardPdfData): void {
  const {
    student,
    enrollment,
    courses,
    grades,
    periods: passedPeriods,
    evaluationPeriods: passedEvalPeriods,
    attendances = [],
    brandingConfig,
    tutorName: customTutorName,
  } = data;

  const periods = passedPeriods || passedEvalPeriods || [];

  const schoolName = brandingConfig?.nombreInstitucion || 'INSTITUCIÓN EDUCATIVA SAN JOSÉ';
  const ugel = brandingConfig?.ugel || 'UGEL 03 - LIMA METROPOLITANA';
  const dre = brandingConfig?.dre || 'DRE LIMA';
  const codigoModular = brandingConfig?.codigoModular || '0458921';
  const directorName = brandingConfig?.directorNombre || 'Lic. Carlos Mendoza Ramos';
  const anioLectivo = '2026';

  const studentName = `${student.profile?.apellidos || student.apellidos || ''}, ${student.profile?.nombres || student.nombres || ''}`.trim();
  const studentCode = student.codigo_estudiante || `EST-2026-${student.id.slice(-6)}`;
  const studentDni = student.profile?.dni || student.dni || 'Sin DNI';
  const gradeName = enrollment?.seccion?.grado?.nombre || '3° de Primaria';
  const sectionLetter = enrollment?.seccion?.letra || 'A';
  const nivelName = (enrollment?.seccion?.grado?.nivel || 'primaria').toUpperCase();

  const marginX = 14;
  let y = 12;

  // Colors
  const cPrimary = [30, 27, 75]; // Slate dark
  const cAccent = [67, 56, 202]; // Indigo
  const cDark = [15, 23, 42];
  const cMuted = [71, 85, 105];
  const cBorder = [203, 213, 225];
  const cBgLight = [248, 250, 252];
  const cTableHead = [238, 242, 255];

  // 1. INSTITUTIONAL HEADER
  doc.setFillColor(cAccent[0], cAccent[1], cAccent[2]);
  doc.rect(marginX, y, 182, 2.5, 'F');
  y += 5;

  doc.setFillColor(cBgLight[0], cBgLight[1], cBgLight[2]);
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.roundedRect(marginX, y, 182, 22, 1.5, 1.5, 'FD');

  doc.setTextColor(cPrimary[0], cPrimary[1], cPrimary[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(schoolName.toUpperCase(), marginX + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
  doc.text(`Cód. Modular: ${codigoModular}  |  ${dre}  |  ${ugel}`, marginX + 4, y + 11);
  doc.text(`MINISTERIO DE EDUCACIÓN — INFORME DE PROGRESO DEL APRENDIZAJE (CNEB)`, marginX + 4, y + 16);

  // Badge right
  doc.setFillColor(cAccent[0], cAccent[1], cAccent[2]);
  doc.roundedRect(196 - 40, y + 3, 36, 15, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('AÑO LECTIVO', 196 - 22, y + 8, { align: 'center' });
  doc.setFontSize(12);
  doc.text(anioLectivo, 196 - 22, y + 15, { align: 'center' });

  y += 25;

  // 2. STUDENT DATA STRIP
  doc.setFillColor(cBgLight[0], cBgLight[1], cBgLight[2]);
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.roundedRect(marginX, y, 182, 16, 1.5, 1.5, 'FD');

  doc.setFontSize(7);
  doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
  doc.setFont('helvetica', 'normal');
  doc.text('ESTUDIANTE:', marginX + 4, y + 5);
  doc.text('DNI:', marginX + 4, y + 12);
  doc.text('CÓDIGO:', marginX + 50, y + 12);
  doc.text('NIVEL:', marginX + 90, y + 5);
  doc.text('GRADO Y SECCIÓN:', marginX + 90, y + 12);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(cDark[0], cDark[1], cDark[2]);
  doc.setFontSize(8.5);
  doc.text(studentName.toUpperCase(), marginX + 22, y + 5);
  doc.text(studentDni, marginX + 12, y + 12);
  doc.text(studentCode, marginX + 63, y + 12);
  doc.text(nivelName, marginX + 102, y + 5);
  doc.text(`${gradeName} - "${sectionLetter}"`, marginX + 120, y + 12);

  y += 19;

  // 3. MAIN GRADES TABLE (CNEB by Competency)
  const colW = {
    area: 34,
    competencia: 66,
    b1: 10,
    b2: 10,
    b3: 10,
    b4: 10,
    prom: 11,
    conclusion: 31,
  };

  // Table Header
  doc.setFillColor(cTableHead[0], cTableHead[1], cTableHead[2]);
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.rect(marginX, y, 182, 8, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(cAccent[0], cAccent[1], cAccent[2]);

  let hx = marginX;
  doc.text('ÁREA CURRICULAR', hx + 2, y + 5.5);
  hx += colW.area;
  doc.text('COMPETENCIA EVALUADA (CNEB)', hx + 2, y + 5.5);
  hx += colW.competencia;
  doc.text('B1', hx + 3, y + 5.5);
  hx += colW.b1;
  doc.text('B2', hx + 3, y + 5.5);
  hx += colW.b2;
  doc.text('B3', hx + 3, y + 5.5);
  hx += colW.b3;
  doc.text('B4', hx + 3, y + 5.5);
  hx += colW.b4;
  doc.text('FINAL', hx + 2, y + 5.5);
  hx += colW.prom;
  doc.text('CONCLUSIÓN DESCRIP.', hx + 2, y + 5.5);

  y += 8;

  // Render Courses and Competencies
  let rowCount = 0;
  courses.forEach(course => {
    const comps = course.competencias || [];
    const courseGrades = grades.filter(g => comps.some(c => c.id === g.competencia_id) && g.matricula_id === enrollment?.id);

    if (comps.length === 0) {
      // Single course row without competencies
      const isAlt = rowCount % 2 === 1;
      if (isAlt) {
        doc.setFillColor(252, 252, 254);
        doc.rect(marginX, y, 182, 6, 'F');
      }
      doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
      doc.rect(marginX, y, 182, 6, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(cDark[0], cDark[1], cDark[2]);
      doc.text(course.nombre, marginX + 2, y + 4.2);

      y += 6;
      rowCount++;
      return;
    }

    comps.forEach((comp, compIdx) => {
      const isAlt = rowCount % 2 === 1;
      const rowHeight = 7.5;

      if (isAlt) {
        doc.setFillColor(252, 252, 254);
        doc.rect(marginX, y, 182, rowHeight, 'F');
      }
      doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
      doc.rect(marginX, y, 182, rowHeight, 'S');

      // Course name (only on first competency row)
      if (compIdx === 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(cDark[0], cDark[1], cDark[2]);
        const courseLines = doc.splitTextToSize(course.nombre, colW.area - 3);
        doc.text(courseLines[0] || course.nombre, marginX + 2, y + 4.5);
      }

      // Competency name
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(cDark[0], cDark[1], cDark[2]);
      const compLines = doc.splitTextToSize(comp.descripcion || comp.codigo, colW.competencia - 3);
      doc.text(compLines[0] || comp.descripcion || '', marginX + colW.area + 2, y + 4.5);

      // Bimestre grades
      let bx = marginX + colW.area + colW.competencia;
      const bKeys = ['eval-b1', 'eval-b2', 'eval-b3', 'eval-b4'];
      const compGradesList: GradeLetter[] = [];

      bKeys.forEach(periodId => {
        const gradeRec = courseGrades.find(g => g.competencia_id === comp.id && g.periodo_evaluacion_id === periodId);
        const letter = gradeRec?.nota_letra || '-';
        if (gradeRec?.nota_letra) compGradesList.push(gradeRec.nota_letra);

        doc.setFont('helvetica', letter === '-' ? 'normal' : 'bold');
        doc.setFontSize(7);
        if (letter === 'AD') doc.setTextColor(22, 101, 52);
        else if (letter === 'A') doc.setTextColor(30, 64, 175);
        else if (letter === 'B') doc.setTextColor(180, 83, 9);
        else if (letter === 'C') doc.setTextColor(220, 38, 38);
        else doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);

        doc.text(letter, bx + 4, y + 5);
        bx += 10;
      });

      // Final Grade for this competency
      const finalLetter = compGradesList.length > 0 ? compGradesList[compGradesList.length - 1] : '-';
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      if (finalLetter === 'AD') doc.setTextColor(22, 101, 52);
      else if (finalLetter === 'A') doc.setTextColor(30, 64, 175);
      else if (finalLetter === 'B') doc.setTextColor(180, 83, 9);
      else if (finalLetter === 'C') doc.setTextColor(220, 38, 38);
      else doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
      doc.text(finalLetter, bx + 4, y + 5);
      bx += colW.prom;

      // Descriptive conclusion snippet
      const latestGradeRec = courseGrades.filter(g => g.competencia_id === comp.id && g.conclusion_descriptiva).pop();
      const concText = latestGradeRec?.conclusion_descriptiva || '';
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(5.5);
      doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
      const concLines = doc.splitTextToSize(concText, colW.conclusion - 3);
      doc.text(concLines[0] || '-', bx + 1.5, y + 4.5);

      y += rowHeight;
      rowCount++;
    });
  });

  y += 4;

  // 4. ATTENDANCE STRIP
  const attPresent = attendances.filter(a => a.estado === 'presente').length;
  const attLate = attendances.filter(a => a.estado === 'tardanza').length;
  const attAbsent = attendances.filter(a => a.estado === 'falta').length;
  const attJustified = attendances.filter(a => a.estado === 'justificado').length;

  doc.setFillColor(cBgLight[0], cBgLight[1], cBgLight[2]);
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.roundedRect(marginX, y, 182, 10, 1, 1, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(cAccent[0], cAccent[1], cAccent[2]);
  doc.text('RESUMEN DE ASISTENCIA:', marginX + 3, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(cDark[0], cDark[1], cDark[2]);
  doc.text(`Asistencias: ${attPresent}   |   Tardanzas: ${attLate}   |   Inasistencias: ${attAbsent}   |   Justificadas: ${attJustified}`, marginX + 42, y + 6.5);

  y += 14;

  // 5. ESCALA DE CALIFICACIÓN CNEB
  doc.setFillColor(248, 250, 252);
  doc.rect(marginX, y, 182, 11, 'F');
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.rect(marginX, y, 182, 11, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(cAccent[0], cAccent[1], cAccent[2]);
  doc.text('ESCALA DE CALIFICACIÓN DEL CURRÍCULO NACIONAL (CNEB - MINEDU):', marginX + 3, y + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
  doc.text('AD: Logro Destacado  |  A: Logro Esperado  |  B: En Proceso  |  C: En Inicio', marginX + 3, y + 8.5);

  y += 16;

  // 6. SIGNATURES
  const sigY = Math.max(y, 255);
  const sigW = 55;

  // Director
  doc.setDrawColor(cMuted[0], cMuted[1], cMuted[2]);
  doc.line(marginX + 20, sigY, marginX + 20 + sigW, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(cDark[0], cDark[1], cDark[2]);
  doc.text(directorName, marginX + 20 + sigW / 2, sigY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
  doc.text('Director General', marginX + 20 + sigW / 2, sigY + 7.5, { align: 'center' });

  // Tutor
  doc.line(196 - marginX - sigW - 20, sigY, 196 - marginX - 20, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(cDark[0], cDark[1], cDark[2]);
  doc.text(customTutorName || 'Docente Tutor de Aula', 196 - marginX - 20 - sigW / 2, sigY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
  doc.text(customTutorName ? 'Docente Tutor de Aula' : 'Firma del Tutor', 196 - marginX - 20 - sigW / 2, sigY + 7.5, { align: 'center' });
}

export async function generateReportCardPdf(data: ReportCardPdfData): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  renderReportCardPage(doc, data);
  return doc;
}

export async function generateBatchReportCardsPdf(data: BatchReportCardsPdfData): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  data.items.forEach((item, index) => {
    if (index > 0) {
      doc.addPage('a4', 'portrait');
    }
    renderReportCardPage(doc, item);
  });

  return doc;
}

export async function downloadBatchReportCardsPdf(data: BatchReportCardsPdfData): Promise<void> {
  const doc = await generateBatchReportCardsPdf(data);
  const sectionName = data.sectionName || 'Seccion';
  doc.save(`Libretas_Consolidado_${sectionName.replace(/\s+/g, '_')}_${data.anioLectivo || '2026'}.pdf`);
}
