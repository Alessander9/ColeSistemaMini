import { describe, it, expect } from 'vitest';
import { 
  DEFAULT_BRANDING_CONFIG 
} from '../lib/services/brandingService';
import { 
  buildReportCardEmailHtml, 
  buildWelcomeEnrollmentEmailHtml, 
  buildTuitionReminderEmailHtml 
} from '../lib/services/resendService';

describe('Suite Avanzada de Branding Institucional & Resend Mailer', () => {
  
  it('validates default extended branding config with watermark, carnet, UI and Resend defaults', () => {
    // Watermark
    expect(DEFAULT_BRANDING_CONFIG.watermarkOpacity).toBeGreaterThan(0);
    expect(DEFAULT_BRANDING_CONFIG.documentSecurityFooterText).toBeTruthy();

    // Carnet
    expect(DEFAULT_BRANDING_CONFIG.carnetOrientacion).toBe('vertical');
    expect(DEFAULT_BRANDING_CONFIG.carnetSelloHolografico).toBe(true);
    expect(DEFAULT_BRANDING_CONFIG.carnetReversoNormas).toBeTruthy();

    // UI Global & Sounds
    expect(DEFAULT_BRANDING_CONFIG.borderRadiusMode).toBe('modern');
    expect(DEFAULT_BRANDING_CONFIG.sidebarStyle).toBe('dark');
    expect(DEFAULT_BRANDING_CONFIG.kioskSoundPreset).toBe('chime');
    expect(DEFAULT_BRANDING_CONFIG.splashScreenActivo).toBe(true);

    // Resend configuration
    expect(DEFAULT_BRANDING_CONFIG.resendSenderEmail).toBe('comunicados@colegio.edu.pe');
    expect(DEFAULT_BRANDING_CONFIG.resendPlantillaLibretaAsunto).toContain('[BIMESTRE]');
    expect(DEFAULT_BRANDING_CONFIG.resendPlantillaBienvenidaAsunto).toContain('[ALUMNO]');
    expect(DEFAULT_BRANDING_CONFIG.resendPlantillaPensionAsunto).toContain('[MES]');
  });

  it('generates an official report card email via Resend template builder with grade badges and download button', () => {
    const html = buildReportCardEmailHtml({
      type: 'libreta_notas',
      recipientEmail: 'padre@gmail.com',
      recipientName: 'Familia Mendoza',
      studentName: 'Mateo Alejandro Torres',
      studentCode: 'EST-2026-0042',
      gradeSection: '5to Secundaria "A"',
      bimestre: 'I Bimestre 2026',
      promedioLetra: 'AD',
      puestoMerito: '1er Puesto',
      pdfDownloadUrl: 'https://colegio.edu.pe/libretas/mateo.pdf',
      branding: {
        nombreInstitucion: 'Colegio San Agustín',
        siglas: 'CSA',
      }
    });

    expect(html).toContain('Colegio San Agustín');
    expect(html).toContain('Mateo Alejandro Torres');
    expect(html).toContain('I Bimestre 2026');
    expect(html).toContain('AD - Logro Destacado');
    expect(html).toContain('1er Puesto');
    expect(html).toContain('Descargar Libreta Oficial en PDF');
  });

  it('generates a welcome enrollment email via Resend template builder with student credentials', () => {
    const html = buildWelcomeEnrollmentEmailHtml({
      type: 'bienvenida_matricula',
      recipientEmail: 'padre@gmail.com',
      studentName: 'Lucía Quispe Flores',
      studentCode: 'EST-2026-0088',
      gradeSection: '3ro Primaria "B"',
      anioLectivo: '2026',
      loginUsername: '72384910',
      loginUrl: 'https://colegio.edu.pe/login',
      branding: {
        nombreInstitucion: 'Insignia Imperial School',
      }
    });

    expect(html).toContain('Insignia Imperial School');
    expect(html).toContain('Lucía Quispe Flores');
    expect(html).toContain('72384910');
    expect(html).toContain('EST-2026-0088');
    expect(html).toContain('Ingresar a la Intranet Escolar');
  });

  it('generates a tuition reminder email via Resend template builder with bank accounts and amount in Soles', () => {
    const html = buildTuitionReminderEmailHtml({
      type: 'recordatorio_pension',
      recipientEmail: 'padre@gmail.com',
      studentName: 'Lucía Quispe Flores',
      studentCode: 'EST-2026-0088',
      gradeSection: '3ro Primaria "B"',
      mes: 'Octubre 2026',
      montoSoles: 520.00,
      fechaVencimiento: '31 de Octubre de 2026',
      branding: {
        nombreInstitucion: 'Colegio San Martín',
      }
    });

    expect(html).toContain('Colegio San Martín');
    expect(html).toContain('Octubre 2026');
    expect(html).toContain('S/ 520.00');
    expect(html).toContain('31 de Octubre de 2026');
    expect(html).toContain('Realizar Pago Online');
  });

  it('validates default report card branding settings in DEFAULT_BRANDING_CONFIG', () => {
    expect(DEFAULT_BRANDING_CONFIG.libretaEstilo).toBe('oficial_minedu');
    expect(DEFAULT_BRANDING_CONFIG.libretaColorCabecera).toBe('#1e3a8a');
    expect(DEFAULT_BRANDING_CONFIG.libretaTitulo).toContain('INFORME DEL PROGRESO');
    expect(DEFAULT_BRANDING_CONFIG.libretaSubtitulo).toContain('CNEB - MINEDU');
    expect(DEFAULT_BRANDING_CONFIG.libretaMostrarEscudo).toBe(true);
    expect(DEFAULT_BRANDING_CONFIG.libretaMostrarFotoEstudiante).toBe(true);
    expect(DEFAULT_BRANDING_CONFIG.libretaMostrarAsistencia).toBe(true);
    expect(DEFAULT_BRANDING_CONFIG.libretaMostrarEscalaCneb).toBe(true);
    expect(DEFAULT_BRANDING_CONFIG.libretaMostrarObservaciones).toBe(true);
    expect(DEFAULT_BRANDING_CONFIG.libretaMostrarQrVerificacion).toBe(true);
    expect(DEFAULT_BRANDING_CONFIG.libretaFirmaDirector).toBe(true);
    expect(DEFAULT_BRANDING_CONFIG.libretaFirmaTutor).toBe(true);
    expect(DEFAULT_BRANDING_CONFIG.libretaFirmaApoderado).toBe(true);
    expect(DEFAULT_BRANDING_CONFIG.libretaOrientacion).toBe('vertical');
    expect(DEFAULT_BRANDING_CONFIG.libretaMensajePie).toBeTruthy();
  });

  it('generates report card PDF with custom style, orientation and branding configurations', async () => {
    const { generateReportCardPdf } = await import('../lib/pdf/reportCardPdfGenerator');

    const sampleStudent = {
      id: 'student-test',
      codigo: 'EST-TEST-01',
      nombres: 'Andrea',
      apellidos: 'García',
      dni: '78912345',
      grado_id: 'g1',
      seccion_id: 's1',
      genero: 'F' as const,
      estado: 'activo' as const,
    };

    const docPortrait = await generateReportCardPdf({
      student: sampleStudent as any,
      courses: [{ id: 'c1', nombre: 'Matemática', area: 'Matemática', nivel: 'secundaria' as const, grado_id: 'g1' }] as any,
      grades: [],
      brandingConfig: {
        ...DEFAULT_BRANDING_CONFIG,
        libretaEstilo: 'moderno_ejecutivo',
        libretaColorCabecera: '#059669',
        libretaOrientacion: 'vertical',
      },
    });

    expect(docPortrait).toBeDefined();
    expect(docPortrait.getNumberOfPages()).toBe(1);

    const docLandscape = await generateReportCardPdf({
      student: sampleStudent as any,
      courses: [{ id: 'c1', nombre: 'Matemática', area: 'Matemática', nivel: 'secundaria' as const, grado_id: 'g1' }] as any,
      grades: [],
      brandingConfig: {
        ...DEFAULT_BRANDING_CONFIG,
        libretaEstilo: 'academico_elegante',
        libretaOrientacion: 'horizontal',
      },
    });

    expect(docLandscape).toBeDefined();
    expect(docLandscape.getNumberOfPages()).toBe(1);
  });
});
