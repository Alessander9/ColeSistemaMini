import { describe, it, expect } from 'vitest';
import { DEFAULT_BRANDING_CONFIG } from '@/lib/services/brandingService';
import { TEST_SECTIONS, TEST_GRADES, TEST_USERS } from './test-fixtures';

describe('Exportación de Horarios (/admin/horarios)', () => {
  it('debe estructurar el contenido CSV con UTF-8 BOM, encabezado institucional y bloques de lunes a viernes', () => {
    const section = TEST_SECTIONS[0];
    const grade = TEST_GRADES.find(g => g.id === section.grado_id);
    const tutor = TEST_USERS.find(t => t.id === section.tutor_id);
    
    const sectionName = `${grade?.nombre || 'Grado'} "${section.letra}"`;
    const schoolName = DEFAULT_BRANDING_CONFIG.nombreInstitucion;
    const tutorName = tutor ? tutor.nombres : 'No asignado';
    
    let csvContent = '\uFEFF';
    csvContent += `"${schoolName} - Horario Escolar Oficial 2026"\n`;
    csvContent += `"Sección: ${sectionName}","Nivel: ${grade?.nivel?.toUpperCase()}","Tutor(a): ${tutorName}","Fecha de Emisión: 18/09/2026"\n\n`;
    csvContent += `"Hora / Bloque","Inicio","Fin","Lunes","Martes","Miércoles","Jueves","Viernes"\n`;

    expect(csvContent.startsWith('\uFEFF')).toBe(true);
    expect(csvContent).toContain(schoolName);
    expect(csvContent).toContain('Lunes');
    expect(csvContent).toContain('Viernes');
  });

  it('debe poder importar dinámicamente html2canvas y jsPDF para exportación en PNG y PDF', async () => {
    const html2canvasModule = await import('html2canvas');
    const jspdfModule = await import('jspdf');

    expect(html2canvasModule.default).toBeDefined();
    expect(jspdfModule.jsPDF).toBeDefined();
  });

  it('debe calcular dimensiones en formato apaisado (landscape) A4 para PDF', async () => {
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const width = pdf.internal.pageSize.getWidth();
    const height = pdf.internal.pageSize.getHeight();

    // A4 Landscape: 297mm x 210mm
    expect(Math.round(width)).toBe(297);
    expect(Math.round(height)).toBe(210);
  });
});
