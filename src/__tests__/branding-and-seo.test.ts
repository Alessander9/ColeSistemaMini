import { describe, it, expect } from 'vitest';
import { 
  DEFAULT_BRANDING_CONFIG, 
  generateRobotsTxt, 
  generateSitemapXml, 
  hexToHsl, 
  THEME_PRESETS 
} from '../lib/services/brandingService';

describe('Branding, Themes, SEO, Robots.txt & Sitemap.xml Services', () => {
  it('has default branding configuration with all required institutional and SEO fields', () => {
    expect(DEFAULT_BRANDING_CONFIG.nombreInstitucion).toBeDefined();
    expect(DEFAULT_BRANDING_CONFIG.siglas).toBeDefined();
    expect(DEFAULT_BRANDING_CONFIG.primaryColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(DEFAULT_BRANDING_CONFIG.metaTitle).toContain('ColeSistema');
    expect(DEFAULT_BRANDING_CONFIG.allowRobotsIndex).toBe(true);
    expect(DEFAULT_BRANDING_CONFIG.sitemapIncludedPaths.length).toBeGreaterThan(0);
  });

  it('converts HEX colors accurately to HSL triplet for dynamic CSS variables', () => {
    // Pure Red #ff0000 -> 0 100% 50%
    const redHsl = hexToHsl('#ff0000');
    expect(redHsl).toBe('0 100% 50%');

    // Indigo preset #4f46e5
    const indigoHsl = hexToHsl('#4f46e5');
    expect(indigoHsl).toContain('%');
    expect(indigoHsl.split(' ').length).toBe(3);
  });

  it('verifies all theme presets have valid primary, secondary and accent colors', () => {
    expect(THEME_PRESETS.length).toBeGreaterThanOrEqual(6);
    THEME_PRESETS.forEach((preset) => {
      expect(preset.id).toBeTruthy();
      expect(preset.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(preset.secondary).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(preset.accent).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  it('generates a compliant robots.txt with disallow rules and dynamic sitemap reference', () => {
    const robots = generateRobotsTxt(DEFAULT_BRANDING_CONFIG);
    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Allow: /');
    expect(robots).toContain('Disallow: /admin');
    expect(robots).toContain('Disallow: /docente');
    expect(robots).toContain('Disallow: /estudiante');
    expect(robots).toContain('Sitemap: https://colesistema.edu.pe/sitemap.xml');
  });

  it('generates a blocked robots.txt when allowRobotsIndex is set to false', () => {
    const blockedConfig = {
      ...DEFAULT_BRANDING_CONFIG,
      allowRobotsIndex: false,
    };
    const robots = generateRobotsTxt(blockedConfig);
    expect(robots).toContain('Disallow: /');
    expect(robots).not.toContain('Allow: /login');
  });

  it('generates a valid XML sitemap with correct urlset schemas and priority values', () => {
    const sitemap = generateSitemapXml(DEFAULT_BRANDING_CONFIG);
    expect(sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(sitemap).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(sitemap).toContain('<loc>https://colesistema.edu.pe</loc>');
    expect(sitemap).toContain('<changefreq>daily</changefreq>');
    expect(sitemap).toContain('<priority>1.0</priority>');
    expect(sitemap).toContain('</urlset>');
  });

  it('validates official document SIAGIE fields, director stamp, and white-label settings', () => {
    expect(DEFAULT_BRANDING_CONFIG.codigoModular).toBeDefined();
    expect(DEFAULT_BRANDING_CONFIG.ugel).toBeDefined();
    expect(DEFAULT_BRANDING_CONFIG.directorNombre).toBeDefined();
    expect(DEFAULT_BRANDING_CONFIG.fontFamily).toBe('Plus Jakarta Sans');
    expect(DEFAULT_BRANDING_CONFIG.mostrarPoweredBy).toBe(true);
    expect(DEFAULT_BRANDING_CONFIG.whatsappSoporteNumero).toBeTruthy();
    expect(DEFAULT_BRANDING_CONFIG.brevoActivarEnvioAsistencia).toBe(true);
    expect(DEFAULT_BRANDING_CONFIG.brevoSenderEmail).toBeDefined();
    expect(DEFAULT_BRANDING_CONFIG.brevoPlantillaAsunto).toContain('[ESTADO]');
  });
});

describe('Brevo Email Notification Service & Template Builder', () => {
  it('builds an institutional HTML email template with student attendance info and brand styling', async () => {
    const { buildAttendanceEmailHtml } = await import('../lib/services/brevoService');

    const html = buildAttendanceEmailHtml({
      parentEmail: 'apoderado.test@gmail.com',
      parentName: 'Juan Carlos Torres',
      studentName: 'Mateo Torres Mendoza',
      studentCode: 'EST-2026-0099',
      gradeSection: '5to Secundaria "B"',
      fecha: '2026-09-18',
      horaRegistro: '07:45:00',
      estado: 'presente',
      metodo: 'qr',
      branding: {
        nombreInstitucion: 'Colegio San Agustín',
        siglas: 'CSA',
        primaryColor: '#4f46e5',
        contactoEmail: 'contacto@sanagustin.edu.pe',
      }
    });

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Colegio San Agustín');
    expect(html).toContain('Mateo Torres Mendoza');
    expect(html).toContain('EST-2026-0099');
    expect(html).toContain('PRESENTE - PUNTUAL');
    expect(html).toContain('07:45:00');
    expect(html).toContain('Terminal Kiosco QR - Puerta Principal');
    expect(html).toContain('contacto@sanagustin.edu.pe');
  });

  it('renders distinct badges and descriptions for tardanza and falta states', async () => {
    const { buildAttendanceEmailHtml } = await import('../lib/services/brevoService');

    const htmlTardanza = buildAttendanceEmailHtml({
      parentEmail: 'padre@gmail.com',
      studentName: 'Lucía Quispe',
      fecha: '2026-09-18',
      horaRegistro: '08:25:00',
      estado: 'tardanza',
      metodo: 'qr',
    });

    expect(htmlTardanza).toContain('TARDANZA REGISTRADA');
    expect(htmlTardanza).toContain('08:25:00');

    const htmlFalta = buildAttendanceEmailHtml({
      parentEmail: 'padre@gmail.com',
      studentName: 'Lucía Quispe',
      fecha: '2026-09-18',
      horaRegistro: '--:--',
      estado: 'falta',
      metodo: 'manual',
    });

    expect(htmlFalta).toContain('INASISTENCIA / FALTA');
  });
});

