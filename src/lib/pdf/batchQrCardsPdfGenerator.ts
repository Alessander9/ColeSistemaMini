import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Student, Enrollment, Section, SystemBrandingConfig } from '@/types';

export interface BatchQrCardItem {
  student: Student;
  enrollment?: Enrollment | null;
  section?: Section | null;
}

export interface BatchQrCardsPdfData {
  items: BatchQrCardItem[];
  brandingConfig?: SystemBrandingConfig | null;
  sectionName?: string;
  anioLectivo?: string;
}

export async function generateBatchQrCardsPdf(data: BatchQrCardsPdfData): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const { items, brandingConfig, sectionName = 'AULA REGULAR', anioLectivo = '2026' } = data;
  const schoolName = brandingConfig?.nombreInstitucion || 'COLEGIO SAN MARTÍN DE PORRES';
  const primaryColor = brandingConfig?.primaryColor || '#1e3a8a';

  // A4 dimensions: 210 x 297 mm
  // 2 columns x 4 rows = 8 cards per page
  const cardWidth = 90; // mm
  const cardHeight = 62; // mm
  const marginX = 10;
  const marginY = 12;
  const gapX = 10;
  const gapY = 8;

  for (let index = 0; index < items.length; index++) {
    const pageIndex = Math.floor(index / 8);
    const posOnPage = index % 8;

    if (posOnPage === 0 && pageIndex > 0) {
      doc.addPage('a4', 'portrait');
    }

    const col = posOnPage % 2;
    const row = Math.floor(posOnPage / 2);

    const x = marginX + col * (cardWidth + gapX);
    const y = marginY + row * (cardHeight + gapY);

    const item = items[index];
    const student = item.student;
    const fullName = `${student.profile?.apellidos || student.apellidos || ''}, ${student.profile?.nombres || student.nombres || ''}`.trim();
    const studentCode = student.codigo_estudiante || `EST-${student.id.slice(-6)}`;
    const dni = student.profile?.dni || student.dni || 'Sin DNI';
    const aulaStr = item.section ? `${item.section.grado?.nombre || 'Grado'} "${item.section.letra}"` : sectionName;
    const qrToken = student.codigo_estudiante || dni;

    // Generate QR Code data URL
    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(qrToken, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 140,
        color: { dark: '#0f172a', light: '#ffffff' },
      });
    } catch {
      // Fallback if QR generation fails
    }

    // Card border / container
    doc.setDrawColor(203, 213, 225); // Slate 300
    doc.setLineWidth(0.4);
    doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'S');

    // Header strip
    doc.setFillColor(30, 41, 59); // Slate 800
    doc.roundedRect(x, y, cardWidth, 12, 3, 3, 'F');
    doc.rect(x, y + 8, cardWidth, 4, 'F'); // Square bottom of header

    // School Name in header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(schoolName.toUpperCase().slice(0, 38), x + cardWidth / 2, y + 5.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(203, 213, 225);
    doc.text(`CARNET ESTUDIANTIL OFICIAL · AÑO ${anioLectivo}`, x + cardWidth / 2, y + 9.5, { align: 'center' });

    // QR Code on Left side
    if (qrDataUrl) {
      doc.addImage(qrDataUrl, 'PNG', x + 3, y + 14, 28, 28);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(studentCode, x + 17, y + 45, { align: 'center' });

    // Student Info on Right side
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42); // Slate 900
    const nameLines = doc.splitTextToSize(fullName || 'ESTUDIANTE', 52);
    doc.text(nameLines.slice(0, 2), x + 34, y + 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(`DNI: ${dni}`, x + 34, y + 27);
    doc.text(`Aula: ${aulaStr}`, x + 34, y + 32);
    doc.text(`Nivel: ${item.section?.grado?.nivel ? item.section.grado.nivel.toUpperCase() : 'EDUCACIÓN BÁSICA'}`, x + 34, y + 37);

    // Bottom decorative bar with security text
    doc.setFillColor(241, 245, 249);
    doc.rect(x + 0.4, y + cardHeight - 8, cardWidth - 0.8, 7.6, 'F');

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Documento de control y asistencia escolar · MINEDU', x + cardWidth / 2, y + cardHeight - 3, { align: 'center' });

    // Cutting guide dotted lines around cards
    doc.setDrawColor(180, 180, 180);
    doc.setLineDashPattern([1.5, 2], 0);
    doc.line(x - 2, y - 2, x + cardWidth + 2, y - 2);
    doc.line(x - 2, y + cardHeight + 2, x + cardWidth + 2, y + cardHeight + 2);
    doc.line(x - 2, y - 2, x - 2, y + cardHeight + 2);
    doc.line(x + cardWidth + 2, y - 2, x + cardWidth + 2, y + cardHeight + 2);
    doc.setLineDashPattern([], 0); // Reset dash
  }

  return doc;
}
