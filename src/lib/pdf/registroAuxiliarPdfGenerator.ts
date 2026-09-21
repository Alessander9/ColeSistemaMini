import { jsPDF } from 'jspdf';
import { Student, Enrollment, Section, Course, SystemBrandingConfig } from '@/types';

export interface RegistroAuxiliarPdfData {
  section: Section;
  course?: Course | null;
  teacherName?: string;
  periodName?: string;
  students: Student[];
  enrollments: Enrollment[];
  brandingConfig?: SystemBrandingConfig | null;
  anioLectivo?: string;
}

export function generateRegistroAuxiliarPdf(data: RegistroAuxiliarPdfData): jsPDF {
  // Landscape A4: 297 x 210 mm
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const {
    section,
    course,
    teacherName = 'Docente no asignado',
    periodName = 'I BIMESTRE',
    students,
    enrollments,
    brandingConfig,
    anioLectivo = '2026',
  } = data;

  const schoolName = brandingConfig?.nombreInstitucion || 'COLEGIO SAN MARTÍN DE PORRES';
  const gradeStr = section.grado?.nombre || 'Grado';
  const aulaStr = `${gradeStr} "${section.letra}" (${section.grado?.nivel ? section.grado.nivel.toUpperCase() : 'PRIMARIA'})`;
  const courseStr = course?.nombre || 'ÁREA CURRICULAR GENERAL';

  // Header Box
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(10, 8, 277, 18, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(schoolName.toUpperCase(), 14, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`REGISTRO AUXILIAR OFICIAL DE EVALUACIÓN Y ASISTENCIA · AÑO ${anioLectivo}`, 14, 21);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`PERIODO: ${periodName.toUpperCase()}`, 280, 15, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`NIVEL: ${section.grado?.nivel ? section.grado.nivel.toUpperCase() : 'BÁSICA'}`, 280, 21, { align: 'right' });

  // Sub-header details
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.rect(10, 28, 277, 10, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(10, 28, 277, 10, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`AULA: `, 14, 34);
  doc.setFont('helvetica', 'normal');
  doc.text(aulaStr, 25, 34);

  doc.setFont('helvetica', 'bold');
  doc.text(`CURSO / ÁREA: `, 85, 34);
  doc.setFont('helvetica', 'normal');
  doc.text(courseStr, 110, 34);

  doc.setFont('helvetica', 'bold');
  doc.text(`DOCENTE: `, 185, 34);
  doc.setFont('helvetica', 'normal');
  doc.text(teacherName, 203, 34);

  // Table Structure
  // Col 1: N° (8mm)
  // Col 2: Apellidos y Nombres (60mm)
  // Col 3: Competencia 1 (30mm: 4 casillas)
  // Col 4: Competencia 2 (30mm: 4 casillas)
  // Col 5: Competencia 3 (30mm: 4 casillas)
  // Col 6: Promedio CNEB (14mm)
  // Col 7: Asistencia Diaria (15 casillas x 5mm = 75mm)
  // Col 8: Total Asist / Faltas (30mm)

  const startY = 41;
  const rowHeight = 6.2;

  // Header Table row 1
  doc.setFillColor(51, 65, 85); // Slate 700
  doc.rect(10, startY, 277, 9, 'F');
  doc.setDrawColor(148, 163, 184);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);

  doc.text('N°', 14, startY + 5.5, { align: 'center' });
  doc.text('APELLIDOS Y NOMBRES', 45, startY + 5.5, { align: 'center' });
  doc.text('COMPETENCIA 1', 93, startY + 5.5, { align: 'center' });
  doc.text('COMPETENCIA 2', 123, startY + 5.5, { align: 'center' });
  doc.text('COMPETENCIA 3', 153, startY + 5.5, { align: 'center' });
  doc.text('LOGRO', 175, startY + 5.5, { align: 'center' });
  doc.text('CONTROL DE ASISTENCIA DIARIA (1 al 15)', 217, startY + 5.5, { align: 'center' });
  doc.text('RESUMEN', 268, startY + 5.5, { align: 'center' });

  // Get active section students sorted alphabetically
  const sectionEnrollments = enrollments.filter(e => e.seccion_id === section.id && e.estado === 'activo');
  const sectionStudents = sectionEnrollments
    .map(e => students.find(s => s.id === e.estudiante_id))
    .filter(Boolean) as Student[];

  sectionStudents.sort((a, b) => {
    const nameA = `${a.profile?.apellidos || a.apellidos || ''} ${a.profile?.nombres || a.nombres || ''}`;
    const nameB = `${b.profile?.apellidos || b.apellidos || ''} ${b.profile?.nombres || b.nombres || ''}`;
    return nameA.localeCompare(nameB);
  });

  // Render rows
  const maxRows = Math.max(sectionStudents.length, 22);
  let currentY = startY + 9;

  for (let i = 0; i < maxRows; i++) {
    const isEven = i % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(10, currentY, 277, rowHeight, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(10, currentY, 277, rowHeight, 'S');

    const student = sectionStudents[i];
    const name = student
      ? `${student.profile?.apellidos || student.apellidos || ''}, ${student.profile?.nombres || student.nombres || ''}`.trim()
      : '';

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(30, 41, 59);

    // Number
    doc.text(`${i + 1}`, 14, currentY + 4.2, { align: 'center' });
    // Student Name
    doc.text(name.slice(0, 32), 20, currentY + 4.2);

    // Vertical column grid dividers
    // Name border
    doc.line(78, currentY, 78, currentY + rowHeight);
    // Comp 1 (4 subcolumns)
    for (let c = 1; c <= 4; c++) doc.line(78 + c * 7.5, currentY, 78 + c * 7.5, currentY + rowHeight);
    // Comp 2 (4 subcolumns)
    for (let c = 1; c <= 4; c++) doc.line(108 + c * 7.5, currentY, 108 + c * 7.5, currentY + rowHeight);
    // Comp 3 (4 subcolumns)
    for (let c = 1; c <= 4; c++) doc.line(138 + c * 7.5, currentY, 138 + c * 7.5, currentY + rowHeight);
    // Logro final
    doc.line(182, currentY, 182, currentY + rowHeight);
    // Attendance 15 day ticks
    for (let d = 1; d <= 15; d++) doc.line(182 + d * 5.4, currentY, 182 + d * 5.4, currentY + rowHeight);
    // Resumen
    doc.line(263, currentY, 263, currentY + rowHeight);
    doc.line(275, currentY, 275, currentY + rowHeight);

    currentY += rowHeight;
  }

  // Footer note
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('Escala Cualitativa CNEB: AD (Logro Destacado) · A (Logro Esperado) · B (En Proceso) · C (En Inicio) | Asistencia: P (Presente) · T (Tardanza) · F (Falta) · J (Justificada)', 10, currentY + 5);

  return doc;
}
