import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Student, Enrollment, Section, SystemBrandingConfig } from '@/types';

export interface EnrollmentFichaPdfData {
  student: Student;
  enrollment?: Enrollment | null;
  section?: Section | null;
  credentials?: {
    username: string;
    password: string;
    email?: string;
  } | null;
  parentCredentials?: {
    username: string;
    password: string;
    email?: string;
  } | null;
  parentName?: string;
  parentDni?: string;
  parentPhone?: string;
  parentEmail?: string;
  parentRelationship?: string;
  brandingConfig?: SystemBrandingConfig | null;
}

export async function generateEnrollmentFichaPdf(data: EnrollmentFichaPdfData): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const {
    student,
    enrollment,
    section,
    credentials,
    parentCredentials,
    parentName = student.nombre_apoderado || 'No especificado',
    parentDni,
    parentPhone = student.telefono_apoderado || 'No especificado',
    parentEmail = student.email_apoderado || 'No especificado',
    parentRelationship = 'Apoderado Legal',
    brandingConfig,
  } = data;

  const schoolName = brandingConfig?.nombreInstitucion || 'COLEGIO SAN MARTÍN DE PORRES';
  const modularCode = '0458921';
  const ugel = 'UGEL 03 - LIMA METROPOLITANA';
  const anioLectivo = '2026';
  const studentCode = student.codigo_estudiante || `EST-2026-${student.id.slice(-6)}`;
  const studentName = `${student.profile?.apellidos || student.apellidos || ''}, ${student.profile?.nombres || student.nombres || ''}`.trim();
  const studentDni = student.profile?.dni || student.dni || 'Sin DNI';
  const studentEmail = credentials?.email || student.profile?.email || `${studentCode.toLowerCase()}@colegio.edu.pe`;
  const studentUsername = credentials?.username || student.profile?.username || studentDni;
  const studentPassword = credentials?.password || student.profile?.password || 'Solicitar en Dirección';

  const gradeName = section?.grado?.nombre || '3° de Primaria';
  const sectionLetter = section?.letra || 'A';
  const levelName = (section?.grado?.nivel || 'primaria').toUpperCase();
  const aulaName = section?.aula || 'Aula 102 - Pabellón A';
  const enrollmentDate = enrollment?.fecha_matricula || new Date().toISOString().split('T')[0];

  const parentUser = parentCredentials?.username || parentDni || parentPhone || 'DNI del Apoderado';
  const parentPass = parentCredentials?.password || 'Solicitar en Dirección';

  // ── Margins & Palette ──
  const marginX = 14;
  let y = 14;

  // Primary: Indigo #312E81 / #4338CA, Accent: Emerald #059669, Dark text: #0F172A, Slate: #475569
  const cPrimary = [67, 56, 202]; // #4338CA
  const cPrimaryDark = [30, 27, 75]; // #1E1B4B
  const cSecondary = [5, 150, 105]; // #059669
  const cDark = [15, 23, 42]; // #0F172A
  const cMuted = [71, 85, 105]; // #475569
  const cBgLight = [248, 250, 252]; // #F8FAFC
  const cBorder = [226, 232, 240]; // #E2E8F0

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. INSTITUTIONAL HEADER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Top decorative bar
  doc.setFillColor(cPrimary[0], cPrimary[1], cPrimary[2]);
  doc.rect(marginX, y, 182, 3, 'F');
  y += 6;

  // Header Box
  doc.setFillColor(cBgLight[0], cBgLight[1], cBgLight[2]);
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.roundedRect(marginX, y, 182, 24, 2, 2, 'FD');

  // School Emblem / Acronym Box
  doc.setFillColor(cPrimaryDark[0], cPrimaryDark[1], cPrimaryDark[2]);
  doc.roundedRect(marginX + 3, y + 3, 18, 18, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('CSM', marginX + 12, y + 14, { align: 'center' });

  // School Info
  doc.setTextColor(cDark[0], cDark[1], cDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(schoolName.toUpperCase(), marginX + 25, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
  doc.text(`${ugel}  |  CÓDIGO MODULAR: ${modularCode}`, marginX + 25, y + 13);
  doc.text(`Sistema de Gestión Educativa Integral • Año Académico ${anioLectivo}`, marginX + 25, y + 18);

  // Badge Estado Oficial
  doc.setFillColor(236, 253, 245); // light emerald
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(marginX + 142, y + 4, 37, 16, 2, 2, 'FD');
  doc.setTextColor(cSecondary[0], cSecondary[1], cSecondary[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('MATRÍCULA ACTIVA', marginX + 160.5, y + 10, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(`REG. ${studentCode}`, marginX + 160.5, y + 15, { align: 'center' });

  y += 28;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. DOCUMENT TITLE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  doc.setFillColor(cPrimary[0], cPrimary[1], cPrimary[2]);
  doc.rect(marginX, y, 182, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('FICHA OFICIAL DE MATRÍCULA Y CONSTANCIA DE ACCESO A LA PLATAFORMA', marginX + 91, y + 5.5, { align: 'center' });

  y += 11;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. SECTIONS: ESTUDIANTE & ASIGNACIÓN ACADÉMICA (2 COLUMNS)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const colW = 89;
  const colGap = 4;

  // ── Left Column: Datos del Estudiante ──
  doc.setFillColor(cBgLight[0], cBgLight[1], cBgLight[2]);
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.roundedRect(marginX, y, colW, 46, 2, 2, 'FD');

  // Section Banner
  doc.setFillColor(238, 242, 255); // light indigo
  doc.rect(marginX, y, colW, 6, 'F');
  doc.setTextColor(cPrimary[0], cPrimary[1], cPrimary[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('1. DATOS DEL ESTUDIANTE', marginX + 3, y + 4.2);

  let ly = y + 10;
  const renderRow = (label: string, val: string, startX: number, width: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
    doc.text(label, startX + 3, ly);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(cDark[0], cDark[1], cDark[2]);
    doc.text(val, startX + 28, ly);
    ly += 5.5;
  };

  renderRow('Apellidos:', student.profile?.apellidos || student.apellidos || '-', marginX, colW);
  renderRow('Nombres:', student.profile?.nombres || student.nombres || '-', marginX, colW);
  renderRow('DNI / Doc:', studentDni, marginX, colW);
  renderRow('Cód. Alumno:', studentCode, marginX, colW);
  renderRow('F. Nacimiento:', student.fecha_nacimiento || 'No registrada', marginX, colW);
  renderRow('Género:', student.genero || 'No especificado', marginX, colW);

  // ── Right Column: Asignación Académica ──
  const col2X = marginX + colW + colGap;
  doc.setFillColor(cBgLight[0], cBgLight[1], cBgLight[2]);
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.roundedRect(col2X, y, colW, 46, 2, 2, 'FD');

  doc.setFillColor(238, 242, 255);
  doc.rect(col2X, y, colW, 6, 'F');
  doc.setTextColor(cPrimary[0], cPrimary[1], cPrimary[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('2. ASIGNACIÓN ACADÉMICA 2026', col2X + 3, y + 4.2);

  ly = y + 10;
  renderRow('Nivel:', levelName, col2X, colW);
  renderRow('Grado:', gradeName, col2X, colW);
  renderRow('Sección:', `Sección "${sectionLetter}"`, col2X, colW);
  renderRow('Aula:', aulaName, col2X, colW);
  renderRow('F. Matrícula:', enrollmentDate, col2X, colW);
  renderRow('Condición:', 'Promovido / Regular', col2X, colW);

  y += 50;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. DATOS DEL APODERADO / TUTOR LEGAL
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  doc.setFillColor(cBgLight[0], cBgLight[1], cBgLight[2]);
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.roundedRect(marginX, y, 182, 23, 2, 2, 'FD');

  doc.setFillColor(238, 242, 255);
  doc.rect(marginX, y, 182, 6, 'F');
  doc.setTextColor(cPrimary[0], cPrimary[1], cPrimary[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('3. DATOS DEL APODERADO Y CONTACTO DE EMERGENCIA', marginX + 3, y + 4.2);

  const rowY = y + 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
  doc.text('Apoderado:', marginX + 3, rowY);
  doc.text('Parentesco:', marginX + 80, rowY);
  doc.text('Teléfono:', marginX + 130, rowY);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(cDark[0], cDark[1], cDark[2]);
  doc.text(parentName, marginX + 22, rowY);
  doc.text(parentRelationship, marginX + 98, rowY);
  doc.text(parentPhone, marginX + 145, rowY);

  const row2Y = y + 18;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
  doc.text('Correo:', marginX + 3, row2Y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(cDark[0], cDark[1], cDark[2]);
  doc.text(parentEmail, marginX + 18, row2Y);

  y += 27;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. CREDENCIALES DE ACCESO A LA PLATAFORMA (PREMIUM HIGHLIGHT BOX)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  doc.setFillColor(245, 243, 255); // Indigo light tint
  doc.setDrawColor(165, 180, 252); // Indigo border
  doc.roundedRect(marginX, y, 182, 45, 3, 3, 'FD');

  // Header banner for credentials (no emojis to prevent mojibake in jsPDF)
  doc.setFillColor(cPrimaryDark[0], cPrimaryDark[1], cPrimaryDark[2]);
  doc.rect(marginX, y, 182, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('CREDENCIALES OFICIALES DE ACCESO AL SISTEMA WEB INSTITUCIONAL', marginX + 91, y + 4.8, { align: 'center' });

  // Web portal URL line
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(cPrimary[0], cPrimary[1], cPrimary[2]);
  const portalAccessText = `Portal Web del Colegio: Acceso Oficial 24/7 para Estudiantes y Familias desde PC, Tablet o Móvil`;
  doc.text(portalAccessText, marginX + 4, y + 12);

  // Two sub-cards for credentials: Left -> Estudiante, Right -> Apoderado
  const credCardW = 86;

  // Subcard Estudiante
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(marginX + 3, y + 15, credCardW, 26, 2, 2, 'FD');

  doc.setFillColor(224, 231, 255);
  doc.rect(marginX + 3, y + 15, credCardW, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(cPrimary[0], cPrimary[1], cPrimary[2]);
  doc.text('CUENTA DEL ESTUDIANTE (Notas, Tareas, Asistencias)', marginX + 6, y + 18.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
  doc.text('Usuario / Correo:', marginX + 6, y + 25);
  doc.text('Contraseña:', marginX + 6, y + 31);
  doc.text('Rol Asignado:', marginX + 6, y + 37);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(cDark[0], cDark[1], cDark[2]);
  doc.text(studentEmail, marginX + 32, y + 25);
  doc.setFont('courier', 'bold');
  doc.setTextColor(cPrimary[0], cPrimary[1], cPrimary[2]);
  doc.text(studentPassword, marginX + 25, y + 31);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(cSecondary[0], cSecondary[1], cSecondary[2]);
  doc.text('Estudiante', marginX + 27, y + 37);

  // Subcard Apoderado
  const credCard2X = marginX + credCardW + 7;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(credCard2X, y + 15, credCardW, 26, 2, 2, 'FD');

  doc.setFillColor(254, 243, 199); // Amber tint
  doc.rect(credCard2X, y + 15, credCardW, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(180, 83, 9); // Amber-700
  doc.text('CUENTA DEL APODERADO (Monitoreo y Comunicados)', credCard2X + 4, y + 18.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
  doc.text('Usuario / DNI:', credCard2X + 4, y + 25);
  doc.text('Contraseña:', credCard2X + 4, y + 31);
  doc.text('Rol Asignado:', credCard2X + 4, y + 37);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(cDark[0], cDark[1], cDark[2]);
  doc.text(parentUser, credCard2X + 26, y + 25);
  doc.setFont('courier', 'bold');
  doc.setTextColor(cPrimary[0], cPrimary[1], cPrimary[2]);
  doc.text(parentPass, credCard2X + 23, y + 31);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 83, 9);
  doc.text('Apoderado / Tutor', credCard2X + 25, y + 37);

  y += 48;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 6. CÓDIGO QR DE ASISTENCIA & FIRMAS INSTITUCIONALES (SIDE BY SIDE)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Generate QR Data URL
  const qrToken = student.token_qr || `QR-${studentCode}-${studentName.replace(/\s+/g, '_')}`;
  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(qrToken, {
      margin: 1,
      width: 256,
      color: {
        dark: '#1e1b4b',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.warn('Error generating QR code data URL:', err);
  }

  // Left Box: QR Escolar
  const qrBoxW = 52;
  doc.setFillColor(cBgLight[0], cBgLight[1], cBgLight[2]);
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.roundedRect(marginX, y, qrBoxW, 54, 2, 2, 'FD');

  doc.setFillColor(238, 242, 255);
  doc.rect(marginX, y, qrBoxW, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(cPrimary[0], cPrimary[1], cPrimary[2]);
  doc.text('QR ASISTENCIA DIARIA', marginX + qrBoxW / 2, y + 3.8, { align: 'center' });

  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', marginX + 8, y + 7, 36, 36);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(cPrimaryDark[0], cPrimaryDark[1], cPrimaryDark[2]);
  doc.text(studentCode, marginX + qrBoxW / 2, y + 45, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
  doc.text('Presentar en portería escolar', marginX + qrBoxW / 2, y + 49, { align: 'center' });
  doc.text('para control de ingreso.', marginX + qrBoxW / 2, y + 52, { align: 'center' });

  // Right Box: Firmas, Sellos y Compromiso Institucional
  const sigBoxX = marginX + qrBoxW + 4;
  const sigBoxW = 182 - qrBoxW - 4;
  doc.setFillColor(cBgLight[0], cBgLight[1], cBgLight[2]);
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.roundedRect(sigBoxX, y, sigBoxW, 54, 2, 2, 'FD');

  doc.setFillColor(238, 242, 255);
  doc.rect(sigBoxX, y, sigBoxW, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(cPrimary[0], cPrimary[1], cPrimary[2]);
  doc.text('COMPROMISO Y CONFORMIDAD INSTITUCIONAL', sigBoxX + 4, y + 3.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
  doc.text('El suscrito declara bajo juramento la veracidad de los datos consignados en la presente ficha', sigBoxX + 4, y + 9);
  doc.text('y asume el compromiso de respetar el Reglamento Interno y velar por el cumplimiento escolar.', sigBoxX + 4, y + 13);

  // Signatures Lines
  const sigLineY = y + 38;
  const sigColW = (sigBoxW - 12) / 2;

  // Render Director signature image if available
  if (brandingConfig?.directorFirmaUrl) {
    try {
      doc.addImage(brandingConfig.directorFirmaUrl, 'PNG', sigBoxX + 10, sigLineY - 14, 30, 13);
    } catch {
      /* ignore image error */
    }
  }

  // Signature Director
  doc.setDrawColor(148, 163, 184);
  doc.line(sigBoxX + 6, sigLineY, sigBoxX + 6 + sigColW, sigLineY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(cDark[0], cDark[1], cDark[2]);
  const directorTitle = brandingConfig?.directorNombre || 'DIRECCIÓN GENERAL';
  doc.text(directorTitle.toUpperCase(), sigBoxX + 6 + sigColW / 2, sigLineY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
  doc.text('Sello y Firma Digital Autorizada', sigBoxX + 6 + sigColW / 2, sigLineY + 7.5, { align: 'center' });

  // Signature Apoderado
  doc.line(sigBoxX + 12 + sigColW, sigLineY, sigBoxX + 12 + sigColW * 2, sigLineY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(cDark[0], cDark[1], cDark[2]);
  doc.text('FIRMA DEL PADRE / APODERADO', sigBoxX + 12 + sigColW * 1.5, sigLineY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
  doc.text(`DNI: ${parentDni || '___________________'}`, sigBoxX + 12 + sigColW * 1.5, sigLineY + 7.5, { align: 'center' });

  // Footer note inside signature box
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(5.5);
  doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
  doc.text(`Emisión: ${new Date().toLocaleDateString('es-PE')} • Código de Verificación Segura: ${studentCode}-VER-${Date.now().toString().slice(-4)}`, sigBoxX + 4, y + 51);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 7. BOTTOM SYSTEM FOOTER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text('Documento oficial generado automáticamente por ColeSistema Mini • Validez legal e institucional según normativa MINEDU.', marginX + 91, 286, { align: 'center' });

  return doc;
}

export async function downloadEnrollmentFichaPdf(data: EnrollmentFichaPdfData): Promise<void> {
  const doc = await generateEnrollmentFichaPdf(data);
  const studentCode = data.student.codigo_estudiante || 'ALUMNO';
  const cleanLastName = (data.student.profile?.apellidos || data.student.apellidos || 'ESTUDIANTE').replace(/\s+/g, '_');
  const filename = `Ficha_Matricula_${studentCode}_${cleanLastName}.pdf`;
  doc.save(filename);
}
