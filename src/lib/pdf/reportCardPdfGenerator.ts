import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
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
  qrDataUrl?: string;
}

export interface BatchReportCardsPdfData {
  items: ReportCardPdfData[];
  sectionName?: string;
  anioLectivo?: string;
}

function hexToRgb(hex?: string, fallback: [number, number, number] = [30, 58, 138]): [number, number, number] {
  if (!hex || !hex.startsWith('#') || (hex.length !== 7 && hex.length !== 4)) return fallback;
  try {
    let clean = hex.slice(1);
    if (clean.length === 3) {
      clean = clean.split('').map(c => c + c).join('');
    }
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return [isNaN(r) ? fallback[0] : r, isNaN(g) ? fallback[1] : g, isNaN(b) ? fallback[2] : b];
  } catch {
    return fallback;
  }
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

  const isLandscape = doc.internal.pageSize.getWidth() > doc.internal.pageSize.getHeight();
  const pageWidth = isLandscape ? 297 : 210;
  const pageHeight = isLandscape ? 210 : 297;
  const marginX = 14;
  const contentW = pageWidth - marginX * 2;
  let y = 11;

  // Custom styling tokens
  const estilo = brandingConfig?.libretaEstilo || 'oficial_minedu';
  const cAccent = hexToRgb(brandingConfig?.libretaColorCabecera || brandingConfig?.primaryColor, [30, 58, 138]);
  const cPrimary = [30, 27, 75]; // Slate dark
  const cDark = [15, 23, 42];
  const cMuted = [71, 85, 105];
  const cBorder = [203, 213, 225];
  const cBgLight = [248, 250, 252];
  const cTableHead = estilo === 'moderno_ejecutivo' ? [238, 242, 255] : estilo === 'academico_elegante' ? [245, 243, 238] : [241, 245, 249];

  // Marco ornamental para estilo 'academico_elegante'
  if (estilo === 'academico_elegante') {
    doc.setDrawColor(cAccent[0], cAccent[1], cAccent[2]);
    doc.setLineWidth(0.8);
    doc.rect(7, 7, pageWidth - 14, pageHeight - 14, 'S');
    doc.setLineWidth(0.25);
    doc.rect(8.5, 8.5, pageWidth - 17, pageHeight - 17, 'S');
  }

  // Watermark / Marca de Agua Institucional (si está configurada)
  if (brandingConfig?.watermarkUrl && brandingConfig.watermarkUrl.startsWith('data:image/')) {
    try {
      const wmSize = isLandscape ? 70 : 65;
      const wmX = (pageWidth - wmSize) / 2;
      const wmY = (pageHeight - wmSize) / 2;
      // @ts-ignore
      if (typeof doc.saveGraphicsState === 'function') {
        // @ts-ignore
        doc.saveGraphicsState();
        // @ts-ignore
        if (typeof doc.setGState === 'function' && doc.GState) {
          // @ts-ignore
          doc.setGState(new doc.GState({ opacity: brandingConfig.watermarkOpacity || 0.08 }));
        }
        doc.addImage(brandingConfig.watermarkUrl, 'PNG', wmX, wmY, wmSize, wmSize);
        // @ts-ignore
        doc.restoreGraphicsState();
      } else {
        doc.addImage(brandingConfig.watermarkUrl, 'PNG', wmX, wmY, wmSize, wmSize);
      }
    } catch {
      // Ignorar fallo de formato en entornos sin soporte gráfico avanzado
    }
  }

  // 1. CABECERA INSTITUCIONAL
  const docTitle = (brandingConfig?.libretaTitulo || 'INFORME DEL PROGRESO DEL APRENDIZAJE DEL ESTUDIANTE').toUpperCase();
  const docSubtitle = brandingConfig?.libretaSubtitulo || 'Currículo Nacional de la Educación Básica (CNEB - MINEDU)';

  doc.setFillColor(cAccent[0], cAccent[1], cAccent[2]);
  doc.rect(marginX, y, contentW, 2.5, 'F');
  y += 5;

  doc.setFillColor(cBgLight[0], cBgLight[1], cBgLight[2]);
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.roundedRect(marginX, y, contentW, 22, estilo === 'moderno_ejecutivo' ? 3 : 1.5, estilo === 'moderno_ejecutivo' ? 3 : 1.5, 'FD');

  const mostrarEscudo = brandingConfig?.libretaMostrarEscudo !== false;
  let textHeaderX = marginX + 4;

  if (mostrarEscudo) {
    let logoDrawn = false;
    if (brandingConfig?.logoUrl && brandingConfig.logoUrl.startsWith('data:image/')) {
      try {
        doc.addImage(brandingConfig.logoUrl, 'PNG', marginX + 3, y + 2.5, 17, 17);
        logoDrawn = true;
      } catch {
        logoDrawn = false;
      }
    }
    if (!logoDrawn) {
      // Escudo con insignia heráldica del colegio
      doc.setFillColor(cAccent[0], cAccent[1], cAccent[2]);
      doc.roundedRect(marginX + 3, y + 2.5, 17, 17, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(brandingConfig?.siglas || 'IE', marginX + 11.5, y + 12.5, { align: 'center' });
    }
    textHeaderX = marginX + 23;
  }

  doc.setTextColor(cPrimary[0], cPrimary[1], cPrimary[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(schoolName.toUpperCase(), textHeaderX, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
  doc.text(`Cód. Modular: ${codigoModular}  |  ${dre}  |  ${ugel}`, textHeaderX, y + 11);
  doc.text(`${docTitle} — ${docSubtitle}`, textHeaderX, y + 16);

  // Badge derecho año lectivo
  const badgeW = 38;
  doc.setFillColor(cAccent[0], cAccent[1], cAccent[2]);
  doc.roundedRect(marginX + contentW - badgeW - 2, y + 3, badgeW, 16, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('AÑO LECTIVO', marginX + contentW - badgeW / 2 - 2, y + 8, { align: 'center' });
  doc.setFontSize(11);
  doc.text(anioLectivo, marginX + contentW - badgeW / 2 - 2, y + 15, { align: 'center' });

  y += 25;

  // 2. FICHA DEL ESTUDIANTE
  const showPhoto = brandingConfig?.libretaMostrarFotoEstudiante !== false;
  const stripH = 16;
  doc.setFillColor(cBgLight[0], cBgLight[1], cBgLight[2]);
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.roundedRect(marginX, y, contentW, stripH, 1.5, 1.5, 'FD');

  let textStartX = marginX + 4;
  if (showPhoto) {
    // Foto o placeholder del estudiante
    doc.setFillColor(226, 232, 240);
    doc.roundedRect(marginX + 3, y + 2.5, 11, 11, 1, 1, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
    const initials = `${student.profile?.nombres?.[0] || student.nombres?.[0] || 'E'}${student.profile?.apellidos?.[0] || student.apellidos?.[0] || ''}`;
    doc.text(initials, marginX + 8.5, y + 9.5, { align: 'center' });
    textStartX = marginX + 18;
  }

  doc.setFontSize(7);
  doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
  doc.setFont('helvetica', 'normal');
  doc.text('ESTUDIANTE:', textStartX, y + 5);
  doc.text('DNI:', textStartX, y + 12);
  doc.text('CÓDIGO:', textStartX + 45, y + 12);
  doc.text('NIVEL:', textStartX + 95, y + 5);
  doc.text('GRADO Y SECCIÓN:', textStartX + 95, y + 12);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(cDark[0], cDark[1], cDark[2]);
  doc.setFontSize(8);
  doc.text(studentName.toUpperCase(), textStartX + 20, y + 5);
  doc.text(studentDni, textStartX + 8, y + 12);
  doc.text(studentCode, textStartX + 58, y + 12);
  doc.text(nivelName, textStartX + 107, y + 5);
  doc.text(`${gradeName} - "${sectionLetter}"`, textStartX + 126, y + 12);

  y += stripH + 3;

  // 3. TABLA DE CALIFICACIONES CNEB
  const showObs = brandingConfig?.libretaMostrarObservaciones !== false;
  const colW = isLandscape
    ? {
        area: 50,
        competencia: 100,
        b1: 15,
        b2: 15,
        b3: 15,
        b4: 15,
        prom: 18,
        conclusion: showObs ? 41 : 0,
      }
    : {
        area: 34,
        competencia: showObs ? 66 : 97,
        b1: 10,
        b2: 10,
        b3: 10,
        b4: 10,
        prom: 11,
        conclusion: showObs ? 31 : 0,
      };

  // Cabecera de la tabla
  doc.setFillColor(cTableHead[0], cTableHead[1], cTableHead[2]);
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.rect(marginX, y, contentW, 8, 'FD');

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
  if (showObs) {
    doc.text('CONCLUSIÓN DESCRIP.', hx + 2, y + 5.5);
  }

  y += 8;

  // Render Cursos y Competencias
  let rowCount = 0;
  courses.forEach(course => {
    const comps = course.competencias || [];
    const courseGrades = grades.filter(g => comps.some(c => c.id === g.competencia_id) && g.matricula_id === enrollment?.id);

    if (comps.length === 0) {
      const isAlt = rowCount % 2 === 1;
      if (isAlt) {
        doc.setFillColor(252, 252, 254);
        doc.rect(marginX, y, contentW, 6, 'F');
      }
      doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
      doc.rect(marginX, y, contentW, 6, 'S');

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
        doc.rect(marginX, y, contentW, rowHeight, 'F');
      }
      doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
      doc.rect(marginX, y, contentW, rowHeight, 'S');

      if (compIdx === 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(cDark[0], cDark[1], cDark[2]);
        const courseLines = doc.splitTextToSize(course.nombre, colW.area - 3);
        doc.text(courseLines[0] || course.nombre, marginX + 2, y + 4.5);
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(cDark[0], cDark[1], cDark[2]);
      const compLines = doc.splitTextToSize(comp.descripcion || comp.codigo, colW.competencia - 3);
      doc.text(compLines[0] || comp.descripcion || '', marginX + colW.area + 2, y + 4.5);

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

        doc.text(letter, bx + (isLandscape ? 6 : 4), y + 5);
        bx += colW.b1;
      });

      const finalLetter = compGradesList.length > 0 ? compGradesList[compGradesList.length - 1] : '-';
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      if (finalLetter === 'AD') doc.setTextColor(22, 101, 52);
      else if (finalLetter === 'A') doc.setTextColor(30, 64, 175);
      else if (finalLetter === 'B') doc.setTextColor(180, 83, 9);
      else if (finalLetter === 'C') doc.setTextColor(220, 38, 38);
      else doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
      doc.text(finalLetter, bx + (isLandscape ? 7 : 4), y + 5);
      bx += colW.prom;

      if (showObs) {
        const latestGradeRec = courseGrades.filter(g => g.competencia_id === comp.id && g.conclusion_descriptiva).pop();
        const concText = latestGradeRec?.conclusion_descriptiva || '';
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(5.5);
        doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
        const concLines = doc.splitTextToSize(concText, colW.conclusion - 3);
        doc.text(concLines[0] || '-', bx + 1.5, y + 4.5);
      }

      y += rowHeight;
      rowCount++;
    });
  });

  y += 4;

  // 4. RESUMEN DE ASISTENCIA (Opcional según branding)
  if (brandingConfig?.libretaMostrarAsistencia !== false) {
    const attPresent = attendances.filter(a => a.estado === 'presente').length;
    const attLate = attendances.filter(a => a.estado === 'tardanza').length;
    const attAbsent = attendances.filter(a => a.estado === 'falta').length;
    const attJustified = attendances.filter(a => a.estado === 'justificado').length;

    doc.setFillColor(cBgLight[0], cBgLight[1], cBgLight[2]);
    doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
    doc.roundedRect(marginX, y, contentW, 9, 1, 1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(cAccent[0], cAccent[1], cAccent[2]);
    doc.text('RESUMEN DE ASISTENCIA:', marginX + 3, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(cDark[0], cDark[1], cDark[2]);
    doc.text(`Asistencias: ${attPresent}   |   Tardanzas: ${attLate}   |   Inasistencias: ${attAbsent}   |   Justificadas: ${attJustified}`, marginX + 42, y + 6);

    y += 12;
  }

  // 5. ESCALA DE CALIFICACIÓN CNEB (Opcional según branding)
  if (brandingConfig?.libretaMostrarEscalaCneb !== false) {
    doc.setFillColor(248, 250, 252);
    doc.rect(marginX, y, contentW, 10, 'F');
    doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
    doc.rect(marginX, y, contentW, 10, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(cAccent[0], cAccent[1], cAccent[2]);
    doc.text('ESCALA DE CALIFICACIÓN DEL CURRÍCULO NACIONAL (CNEB - MINEDU):', marginX + 3, y + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
    doc.text('AD: Logro Destacado  |  A: Logro Esperado  |  B: En Proceso  |  C: En Inicio', marginX + 3, y + 8);

    y += 13;
  }

  // 6. FIRMAS CONFIGURABLES (Director, Tutor, Apoderado) Y SELLO QR DIGITAL
  const signatures: { title: string; subtitle: string; isDirector?: boolean }[] = [];
  if (brandingConfig?.libretaFirmaDirector !== false) {
    signatures.push({ title: directorName, subtitle: 'Director(a) General', isDirector: true });
  }
  if (brandingConfig?.libretaFirmaTutor !== false) {
    signatures.push({ title: customTutorName || 'Docente Tutor de Aula', subtitle: 'Tutor(a) de Aula' });
  }
  if (brandingConfig?.libretaFirmaApoderado !== false) {
    signatures.push({ title: 'Firma del Padre o Apoderado', subtitle: 'Recepción y Conformidad' });
  }

  const mostrarQr = brandingConfig?.libretaMostrarQrVerificacion !== false;

  if (signatures.length > 0 || mostrarQr) {
    const sigY = Math.max(y + 4, pageHeight - 25);
    const numSigs = signatures.length;
    const qrBlockW = mostrarQr ? 24 : 0;
    const availW = contentW - qrBlockW;
    const sigW = numSigs === 3 ? 38 : numSigs === 2 ? 48 : 58;
    const totalSpacing = availW - numSigs * sigW;
    const gap = Math.max(4, totalSpacing / (numSigs + 1));

    signatures.forEach((sig, sIdx) => {
      const sx = marginX + gap * (sIdx + 1) + sigW * sIdx;

      // Estampar firma digital del director si existe
      if (sig.isDirector && brandingConfig?.directorFirmaUrl && brandingConfig.directorFirmaUrl.startsWith('data:image/')) {
        try {
          doc.addImage(brandingConfig.directorFirmaUrl, 'PNG', sx + (sigW - 28) / 2, sigY - 11, 28, 10);
        } catch {
          // Ignorar fallo de carga de imagen
        }
      }

      doc.setDrawColor(cMuted[0], cMuted[1], cMuted[2]);
      doc.line(sx, sigY, sx + sigW, sigY);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(cDark[0], cDark[1], cDark[2]);
      doc.text(sig.title, sx + sigW / 2, sigY + 3.8, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
      doc.text(sig.subtitle, sx + sigW / 2, sigY + 7, { align: 'center' });
    });

    // Render Sello QR de Validación Digital Oficial
    if (mostrarQr) {
      const qx = marginX + contentW - qrBlockW + 2;
      const qy = sigY - 11;
      if (data.qrDataUrl) {
        try {
          doc.addImage(data.qrDataUrl, 'PNG', qx + 2, qy, 16, 16);
        } catch {
          // fallback
        }
      } else {
        doc.setFillColor(cBgLight[0], cBgLight[1], cBgLight[2]);
        doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
        doc.roundedRect(qx + 2, qy, 16, 16, 1, 1, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.5);
        doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
        doc.text('QR', qx + 10, qy + 9, { align: 'center' });
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(4.5);
      doc.setTextColor(22, 101, 52);
      doc.text('VALIDADO SIAGIE', qx + 10, qy + 19, { align: 'center' });
    }
  }

  // 7. PIE DE PÁGINA INSTITUCIONAL / QR DE SEGURIDAD
  const footerText = brandingConfig?.libretaMensajePie || 'Documento Oficial con Valor Legal emitido por el Sistema de Gestión Escolar.';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
  doc.text(footerText, pageWidth / 2, pageHeight - 4, { align: 'center' });
}

export async function generateReportCardPdf(data: ReportCardPdfData): Promise<jsPDF> {
  const isLandscape = data.brandingConfig?.libretaOrientacion === 'horizontal';
  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  if (data.brandingConfig?.libretaMostrarQrVerificacion !== false && !data.qrDataUrl) {
    try {
      const studentCode = data.student.codigo_estudiante || `EST-${data.student.id.slice(-6)}`;
      const canonical = data.brandingConfig?.canonicalUrl || 'https://colesistema.edu.pe';
      const anioLectivo = data.enrollment?.periodo?.nombre || new Date().getFullYear().toString();
      const verificationUrl = `${canonical}/verificar?tipo=libreta&codigo=${studentCode}&anio=${encodeURIComponent(anioLectivo)}`;
      data.qrDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1, width: 120 });
    } catch {
      // Ignorar fallo de generación QR en entornos limitados
    }
  }

  renderReportCardPage(doc, data);
  return doc;
}

export async function generateBatchReportCardsPdf(data: BatchReportCardsPdfData): Promise<jsPDF> {
  const firstBranding = data.items[0]?.brandingConfig;
  const isLandscape = firstBranding?.libretaOrientacion === 'horizontal';
  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  for (let index = 0; index < data.items.length; index++) {
    const item = data.items[index];
    if (index > 0) {
      doc.addPage('a4', isLandscape ? 'landscape' : 'portrait');
    }

    if (item.brandingConfig?.libretaMostrarQrVerificacion !== false && !item.qrDataUrl) {
      try {
        const studentCode = item.student.codigo_estudiante || `EST-${item.student.id.slice(-6)}`;
        const canonical = item.brandingConfig?.canonicalUrl || 'https://colesistema.edu.pe';
        const anioLectivo = data.anioLectivo || item.enrollment?.periodo?.nombre || new Date().getFullYear().toString();
        const verificationUrl = `${canonical}/verificar?tipo=libreta&codigo=${studentCode}&anio=${encodeURIComponent(anioLectivo)}`;
        item.qrDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1, width: 120 });
      } catch {
        // Ignorar fallo de generación QR
      }
    }

    renderReportCardPage(doc, item);
  }

  return doc;
}

export async function downloadBatchReportCardsPdf(data: BatchReportCardsPdfData): Promise<void> {
  const doc = await generateBatchReportCardsPdf(data);
  const sectionName = data.sectionName || 'Seccion';
  doc.save(`Libretas_Consolidado_${sectionName.replace(/\s+/g, '_')}_${data.anioLectivo || '2026'}.pdf`);
}
