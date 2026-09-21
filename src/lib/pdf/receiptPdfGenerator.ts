import { jsPDF } from 'jspdf';
import { PaymentRecord, Student, Enrollment, SystemBrandingConfig } from '@/types';

export interface ReceiptPdfData {
  payment: PaymentRecord;
  student?: Student | null;
  enrollment?: Enrollment | null;
  brandingConfig?: SystemBrandingConfig | null;
}

export async function generateReceiptPdf(data: ReceiptPdfData): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5', // A5 receipt format
  });

  const { payment, student, enrollment, brandingConfig } = data;
  const schoolName = brandingConfig?.nombreInstitucion || 'INSTITUCIÓN EDUCATIVA SAN JOSÉ';
  const ruc = brandingConfig?.ruc || '20584918231';
  const address = brandingConfig?.direccion || 'Av. Los Educadores 450, Lima, Perú';
  const phone = brandingConfig?.telefono || '(01) 485-9920';

  const sName = student 
    ? `${student.profile?.apellidos || student.apellidos || ''}, ${student.profile?.nombres || student.nombres || ''}`.trim()
    : 'Estudiante Registrado';
  const sCode = student?.codigo_estudiante || 'EST-2026';
  const sDni = student?.profile?.dni || student?.dni || '—';
  const gradeSec = enrollment?.seccion?.grado?.nombre 
    ? `${enrollment.seccion.grado.nombre} "${enrollment.seccion.letra}"` 
    : 'Grado Regular';

  const marginX = 10;
  let y = 10;

  // Colors
  const cPrimary = [30, 27, 75];
  const cAccent = [5, 150, 105]; // Emerald for money
  const cDark = [15, 23, 42];
  const cMuted = [100, 116, 139];
  const cBorder = [203, 213, 225];
  const cBg = [248, 250, 252];

  // Top decorative bar
  doc.setFillColor(cAccent[0], cAccent[1], cAccent[2]);
  doc.rect(marginX, y, 128, 2, 'F');
  y += 4;

  // Header Box
  doc.setFillColor(cBg[0], cBg[1], cBg[2]);
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.roundedRect(marginX, y, 128, 20, 1.5, 1.5, 'FD');

  doc.setTextColor(cPrimary[0], cPrimary[1], cPrimary[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(schoolName.toUpperCase(), marginX + 3, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
  doc.text(`R.U.C. N° ${ruc}  |  Teléfono: ${phone}`, marginX + 3, y + 9.5);
  doc.text(address, marginX + 3, y + 13.5);
  doc.text('COMPROBANTE ELECTRÓNICO DE PAGO / PENSIÓN ESCOLAR', marginX + 3, y + 17.5);

  // Receipt Number Box Right
  doc.setFillColor(cPrimary[0], cPrimary[1], cPrimary[2]);
  doc.roundedRect(138 - 32, y + 2, 30, 16, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('RECIBO DE CAJA', 138 - 17, y + 6.5, { align: 'center' });
  doc.setFontSize(8);
  const receiptNum = payment.id.replace('pay-', 'REC-').toUpperCase();
  doc.text(receiptNum.length > 14 ? receiptNum.slice(0, 14) : receiptNum, 138 - 17, y + 12.5, { align: 'center' });

  y += 24;

  // Student Details
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.roundedRect(marginX, y, 128, 22, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(cDark[0], cDark[1], cDark[2]);
  doc.text('ALUMNO:', marginX + 3, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(sName.toUpperCase(), marginX + 20, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.text('CÓDIGO:', marginX + 85, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(sCode, marginX + 100, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.text('DNI:', marginX + 3, y + 10.5);
  doc.setFont('helvetica', 'normal');
  doc.text(sDni, marginX + 12, y + 10.5);

  doc.setFont('helvetica', 'bold');
  doc.text('GRADO / SECC:', marginX + 45, y + 10.5);
  doc.setFont('helvetica', 'normal');
  doc.text(gradeSec, marginX + 70, y + 10.5);

  doc.setFont('helvetica', 'bold');
  doc.text('FECHA EMISIÓN:', marginX + 3, y + 16);
  doc.setFont('helvetica', 'normal');
  doc.text(payment.fecha_pago || payment.created_at?.split('T')[0] || new Date().toISOString().split('T')[0], marginX + 28, y + 16);

  doc.setFont('helvetica', 'bold');
  doc.text('ESTADO:', marginX + 70, y + 16);
  doc.setFont('helvetica', 'bold');
  if (payment.estado === 'pagado') {
    doc.setTextColor(5, 150, 105);
    doc.text('PAGADO (CANCELADO)', marginX + 85, y + 16);
  } else {
    doc.setTextColor(217, 119, 6);
    doc.text(payment.estado.toUpperCase(), marginX + 85, y + 16);
  }

  y += 26;

  // Concept Table
  doc.setFillColor(cBg[0], cBg[1], cBg[2]);
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.rect(marginX, y, 128, 6, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(cDark[0], cDark[1], cDark[2]);
  doc.text('DESCRIPCIÓN DEL CONCEPTO', marginX + 3, y + 4.2);
  doc.text('MÉTODO', marginX + 75, y + 4.2);
  doc.text('IMPORTE', marginX + 110, y + 4.2);

  y += 6;

  // Table row
  doc.setFillColor(255, 255, 255);
  doc.rect(marginX, y, 128, 12, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(cDark[0], cDark[1], cDark[2]);
  doc.text(payment.concepto, marginX + 3, y + 5);
  doc.setFontSize(6);
  doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
  doc.text(`Vencimiento: ${payment.fecha_vencimiento} | Op: ${payment.numero_operacion || 'Efectivo/Caja'}`, marginX + 3, y + 9.5);

  doc.setFontSize(7);
  doc.setTextColor(cDark[0], cDark[1], cDark[2]);
  doc.text((payment.metodo_pago || 'Caja Directa').toUpperCase(), marginX + 75, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(cAccent[0], cAccent[1], cAccent[2]);
  doc.text(`S/ ${payment.total.toFixed(2)}`, marginX + 110, y + 6);

  y += 16;

  // Total Summary
  doc.setFillColor(cBg[0], cBg[1], cBg[2]);
  doc.roundedRect(marginX + 70, y, 58, 14, 1, 1, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(cDark[0], cDark[1], cDark[2]);
  doc.text('TOTAL RECIBIDO:', marginX + 73, y + 5.5);
  doc.setFontSize(9.5);
  doc.setTextColor(cAccent[0], cAccent[1], cAccent[2]);
  doc.text(`S/ ${payment.total.toFixed(2)}`, marginX + 124, y + 5.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
  doc.text('Moneda: Soles (PEN)', marginX + 73, y + 10.5);

  y += 24;

  // Seal / Signatures
  doc.setDrawColor(cMuted[0], cMuted[1], cMuted[2]);
  doc.line(marginX + 15, y + 8, marginX + 55, y + 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(cDark[0], cDark[1], cDark[2]);
  doc.text('TESORERÍA / CAJA', marginX + 35, y + 12, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
  doc.text('Firma y Sello Autorizado', marginX + 35, y + 15, { align: 'center' });

  doc.line(marginX + 73, y + 8, marginX + 113, y + 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(cDark[0], cDark[1], cDark[2]);
  doc.text('PADRE / APODERADO', marginX + 93, y + 12, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
  doc.text('Firma de Conformidad', marginX + 93, y + 15, { align: 'center' });

  return doc;
}
