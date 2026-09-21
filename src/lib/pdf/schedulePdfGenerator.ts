import { jsPDF } from 'jspdf';
import { ScheduleSlot, Section, UserProfile, SystemBrandingConfig, DayOfWeek } from '@/types';

export interface SchedulePdfData {
  title: string;
  subtitle: string;
  type: 'section' | 'teacher';
  section?: Section | null;
  teacher?: UserProfile | null;
  slots: ScheduleSlot[];
  brandingConfig?: SystemBrandingConfig | null;
}

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'lunes', label: 'Lunes' },
  { key: 'martes', label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves', label: 'Jueves' },
  { key: 'viernes', label: 'Viernes' },
];

const TIME_BLOCKS = [
  { start: '08:00', end: '08:45', label: '1° Hora' },
  { start: '08:45', end: '09:30', label: '2° Hora' },
  { start: '09:30', end: '10:15', label: '3° Hora' },
  { start: '10:15', end: '10:45', label: 'RECREO', isBreak: true },
  { start: '10:45', end: '11:30', label: '4° Hora' },
  { start: '11:30', end: '12:15', label: '5° Hora' },
  { start: '12:15', end: '13:00', label: '6° Hora' },
  { start: '13:00', end: '13:45', label: '7° Hora' },
];

export async function generateSchedulePdf(data: SchedulePdfData): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const { title, subtitle, type, section, teacher, slots, brandingConfig } = data;
  const schoolName = brandingConfig?.nombreInstitucion || 'INSTITUCIÓN EDUCATIVA SAN JOSÉ';
  const ugel = brandingConfig?.ugel || 'UGEL 03 - MINEDU';
  const year = 'Año Escolar 2026';

  const marginX = 14;
  let y = 12;

  // Colors
  const cPrimary = [49, 46, 129]; // Indigo dark
  const cAccent = [67, 56, 202]; // Indigo accent
  const cDark = [15, 23, 42];
  const cMuted = [100, 116, 139];
  const cBorder = [203, 213, 225];
  const cBgHeader = [241, 245, 249];
  const cBreak = [254, 243, 199];

  // Header Banner
  doc.setFillColor(cPrimary[0], cPrimary[1], cPrimary[2]);
  doc.rect(marginX, y, 269, 18, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(schoolName.toUpperCase(), marginX + 6, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`${ugel}  |  ${year}  |  Horario Oficial`, marginX + 6, y + 13);

  // Info Tag Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(title.toUpperCase(), 283 - marginX, y + 7, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(subtitle, 283 - marginX, y + 13, { align: 'right' });

  y += 22;

  // Details Strip
  doc.setFillColor(cBgHeader[0], cBgHeader[1], cBgHeader[2]);
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.roundedRect(marginX, y, 269, 10, 1.5, 1.5, 'FD');

  doc.setTextColor(cDark[0], cDark[1], cDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);

  if (type === 'section') {
    const tutorText = section?.tutor_id ? `Tutor: Docente Asignado` : 'Tutor: Por Designar';
    const aulaText = section?.aula || 'Aula Principal';
    doc.text(`Grado y Sección: ${section?.grado?.nombre || ''} "${section?.letra || ''}"`, marginX + 4, y + 6.5);
    doc.text(`Aula Física: ${aulaText}`, marginX + 90, y + 6.5);
    doc.text(tutorText, marginX + 175, y + 6.5);
  } else {
    doc.text(`Docente: ${teacher?.nombres || ''} ${teacher?.apellidos || ''}`, marginX + 4, y + 6.5);
    doc.text(`Especialidad: ${teacher?.especialidad || 'Educación General'}`, marginX + 110, y + 6.5);
    doc.text(`DNI: ${teacher?.dni || 'N/A'}`, marginX + 210, y + 6.5);
  }

  y += 14;

  // Schedule Table Grid
  const timeColWidth = 32;
  const dayColWidth = (269 - timeColWidth) / 5; // 47.4mm each

  // Table Headers
  doc.setFillColor(cAccent[0], cAccent[1], cAccent[2]);
  doc.rect(marginX, y, timeColWidth, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('HORA', marginX + timeColWidth / 2, y + 5.5, { align: 'center' });

  DAYS.forEach((day, idx) => {
    const xPos = marginX + timeColWidth + idx * dayColWidth;
    doc.setFillColor(cAccent[0], cAccent[1], cAccent[2]);
    doc.rect(xPos, y, dayColWidth, 8, 'F');
    doc.text(day.label.toUpperCase(), xPos + dayColWidth / 2, y + 5.5, { align: 'center' });
  });

  y += 8;

  // Rows
  const rowHeight = 15;
  const breakRowHeight = 7;

  TIME_BLOCKS.forEach(block => {
    const isBreak = !!block.isBreak;
    const currentHeight = isBreak ? breakRowHeight : rowHeight;

    // Time column cell
    if (isBreak) {
      doc.setFillColor(cBreak[0], cBreak[1], cBreak[2]);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
    doc.rect(marginX, y, timeColWidth, currentHeight, 'FD');

    doc.setTextColor(isBreak ? 180 : cDark[0], isBreak ? 83 : cDark[1], isBreak ? 9 : cDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`${block.start} - ${block.end}`, marginX + timeColWidth / 2, y + (isBreak ? 4.5 : 6), { align: 'center' });

    if (!isBreak) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
      doc.text(block.label, marginX + timeColWidth / 2, y + 10.5, { align: 'center' });
    }

    if (isBreak) {
      // Recreo across all days
      const totalDaysWidth = dayColWidth * 5;
      doc.setFillColor(cBreak[0], cBreak[1], cBreak[2]);
      doc.rect(marginX + timeColWidth, y, totalDaysWidth, currentHeight, 'FD');
      doc.setTextColor(180, 83, 9);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('★ RECREO Y DESCANSO PEDAGÓGICO ★', marginX + timeColWidth + totalDaysWidth / 2, y + 4.8, { align: 'center' });
    } else {
      // Slot per day
      DAYS.forEach((day, idx) => {
        const xPos = marginX + timeColWidth + idx * dayColWidth;
        const matchingSlot = slots.find(s => s.dia === day.key && s.hora_inicio === block.start);

        doc.setFillColor(matchingSlot ? 248 : 255, matchingSlot ? 250 : 255, matchingSlot ? 252 : 255);
        doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
        doc.rect(xPos, y, dayColWidth, currentHeight, 'FD');

        if (matchingSlot) {
          // Left accent bar
          doc.setFillColor(cAccent[0], cAccent[1], cAccent[2]);
          doc.rect(xPos, y, 2, currentHeight, 'F');

          // Course Name
          doc.setTextColor(cDark[0], cDark[1], cDark[2]);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          const courseName = matchingSlot.curso?.nombre || 'Curso';
          doc.text(courseName.length > 24 ? courseName.substring(0, 22) + '...' : courseName, xPos + 4, y + 5);

          // Subtitle: Teacher or Section & Room
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.8);
          doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);

          if (type === 'section') {
            const prof = matchingSlot.docente?.nombres ? `Prof. ${matchingSlot.docente.nombres.split(' ')[0]}` : 'Por asignar';
            doc.text(prof, xPos + 4, y + 9.5);
          } else {
            const secName = matchingSlot.seccion?.grado?.nombre ? `${matchingSlot.seccion.grado.nombre} "${matchingSlot.seccion.letra}"` : 'Sección';
            doc.text(secName, xPos + 4, y + 9.5);
          }

          // Aula tag
          const aula = matchingSlot.aula || 'Aula General';
          doc.setFontSize(6);
          doc.setTextColor(cAccent[0], cAccent[1], cAccent[2]);
          doc.text(`[${aula}]`, xPos + 4, y + 13);
        }
      });
    }

    y += currentHeight;
  });

  // Footer
  y += 5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
  doc.text(`Documento generado el ${new Date().toLocaleDateString('es-PE')} a las ${new Date().toLocaleTimeString('es-PE')} — Sistema de Gestión Escolar CNEB`, marginX, y);

  return doc;
}
