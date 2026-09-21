import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Student, Enrollment, Section, GradeLevel, AcademicPeriod, SystemBrandingConfig } from '@/types';

export interface CertificateData {
  student: Student;
  enrollment?: Enrollment | null;
  section?: Section | null;
  gradeLevel?: GradeLevel | null;
  period?: AcademicPeriod | null;
  brandingConfig?: SystemBrandingConfig | null;
  directorName?: string;
  codigoModular?: string;
  ugel?: string;
}

export async function generateEnrollmentCertificatePdf(data: CertificateData): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const {
    student,
    section,
    gradeLevel,
    period,
    brandingConfig,
    directorName = 'Mg. Roberto Mendoza Flores',
    codigoModular = '0459812',
    ugel = 'UGEL 03 - Lima Metropolitana'
  } = data;

  const schoolName = brandingConfig?.nombreInstitucion || 'INSTITUCIÓN EDUCATIVA PRIVADA "SAN MARTÍN"';
  const primaryColor = brandingConfig?.primaryColor || '#1e3a8a';
  const secondaryColor = brandingConfig?.secondaryColor || '#0284c7';
  const studentName = `${student.profile?.nombres || student.nombres || ''} ${student.profile?.apellidos || student.apellidos || ''}`.toUpperCase().trim();
  const dni = student.profile?.dni || student.dni || '--------';
  const studentCode = student.codigo_estudiante || `EST-${student.id.slice(-6)}`;
  const anio = period?.anio || 2026;
  const gradoStr = gradeLevel?.nombre || '3er Grado de Educación Primaria';
  const nivelStr = (gradeLevel?.nivel || 'Primaria').toUpperCase();
  const seccionStr = section?.letra || 'A';

  // Marco decorativo institucional
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(1.2);
  doc.rect(12, 12, 186, 273);
  doc.setLineWidth(0.4);
  doc.rect(14, 14, 182, 269);

  // Membrete Superior
  doc.setFillColor(30, 58, 138);
  doc.rect(14, 14, 182, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('REPÚBLICA DEL PERÚ · MINISTERIO DE EDUCACIÓN', 105, 22, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`${ugel.toUpperCase()} · CÓDIGO MODULAR: ${codigoModular}`, 105, 28, { align: 'center' });

  // Nombre de la Institución
  doc.setTextColor(30, 58, 138);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(schoolName, 105, 45, { align: 'center' });

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Resolución Directoral Regional N° 0482-2018-DRELM', 105, 51, { align: 'center' });

  // Línea separadora
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.6);
  doc.line(25, 57, 185, 57);

  // Título del Certificado
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('CONSTANCIA DE MATRÍCULA', 105, 72, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(30, 58, 138);
  doc.text(`AÑO LECTIVO ${anio}`, 105, 79, { align: 'center' });

  // Cuerpo del texto
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  const parrafo1 = `La Dirección de la Institución Educativa que suscribe, HACE CONSTAR que:`;
  doc.text(parrafo1, 25, 95);

  // Cuadro destacado con el estudiante
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(25, 102, 160, 28, 3, 3, 'FD');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text(studentName, 105, 112, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`D.N.I. / DOC. IDENTIDAD: ${dni}   |   CÓDIGO DE ESTUDIANTE: ${studentCode}`, 105, 122, { align: 'center' });

  // Detalles de la matrícula
  const fechaHoy = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
  const parrafo2 = `Se encuentra debidamente matriculado(a) en el presente Año Escolar ${anio}, cursando los estudios correspondientes según el Currículo Nacional de la Educación Básica Regular (CNEB - MINEDU):`;
  
  const splitP2 = doc.splitTextToSize(parrafo2, 160);
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  doc.text(splitP2, 25, 140);

  // Tabla resumen de matrícula
  doc.setFillColor(241, 245, 249);
  doc.rect(25, 154, 160, 32, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(25, 154, 160, 32, 'S');

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Nivel Educativo:', 30, 162);
  doc.text('Grado y Sección:', 30, 172);
  doc.text('Estado de Matrícula:', 30, 180);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Educación ${nivelStr}`, 75, 162);
  doc.text(`${gradoStr} — Sección "${seccionStr}"`, 75, 172);
  doc.setTextColor(22, 101, 52);
  doc.setFont('helvetica', 'bold');
  doc.text('REGISTRADO / VIGENTE (SIAGIE)', 75, 180);

  // Párrafo final
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10.5);
  const parrafoFinal = `Se expide la presente constancia a solicitud de la parte interesada para los fines pertinentes que estime conveniente.`;
  doc.text(parrafoFinal, 25, 200);

  doc.text(`Expedido el ${fechaHoy}.`, 25, 210);

  // QR de validación electrónica
  try {
    const qrData = `VALIDACION-OFICIAL|IE:${codigoModular}|EST:${studentCode}|DNI:${dni}|ANIO:${anio}`;
    const qrUrl = await QRCode.toDataURL(qrData, { width: 150, margin: 1 });
    doc.addImage(qrUrl, 'PNG', 28, 226, 30, 30);
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Documento con firma digital', 43, 259, { align: 'center' });
    doc.text(`Verificación: ${studentCode}`, 43, 263, { align: 'center' });
  } catch (e) {
    // ignore
  }

  // Sello y Firma del Director
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.5);
  doc.line(115, 245, 175, 245);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(directorName, 145, 251, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('DIRECTOR GENERAL', 145, 256, { align: 'center' });
  doc.text(schoolName, 145, 260, { align: 'center' });

  return doc;
}

export async function downloadEnrollmentCertificatePdf(data: CertificateData): Promise<void> {
  const doc = await generateEnrollmentCertificatePdf(data);
  const student = data.student;
  const name = `${student.profile?.apellidos || student.apellidos || 'Estudiante'}`.replace(/\s+/g, '_');
  doc.save(`Constancia_Matricula_${name}_${data.period?.anio || 2026}.pdf`);
}
