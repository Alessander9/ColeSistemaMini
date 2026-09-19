import { SystemBrandingConfig, SitemapUrlEntry } from '@/types';

export const FONT_OPTIONS = [
  { id: 'Plus Jakarta Sans', name: 'Plus Jakarta Sans (Moderna & Tecnológica)', category: 'sans-serif' },
  { id: 'Inter', name: 'Inter (Limpia & Minimalista)', category: 'sans-serif' },
  { id: 'Poppins', name: 'Poppins (Amigable & Geométrica)', category: 'sans-serif' },
  { id: 'Outfit', name: 'Outfit (Vanguardista & EdTech)', category: 'sans-serif' },
  { id: 'Montserrat', name: 'Montserrat (Elegante & Corporativa)', category: 'sans-serif' },
  { id: 'Roboto', name: 'Roboto (Estándar & Neutra)', category: 'sans-serif' },
  { id: 'Merriweather', name: 'Merriweather (Clásica & Universitaria)', category: 'serif' },
];

export const THEME_PRESETS = [
  {
    id: 'indigo',
    name: 'Índigo Moderno',
    primary: '#4f46e5',
    secondary: '#10b981',
    accent: '#3b82f6',
    description: 'Elegante y tecnológico, ideal para colegios innovadores',
  },
  {
    id: 'emerald',
    name: 'Esmeralda Académico',
    primary: '#059669',
    secondary: '#0d9488',
    accent: '#3b82f6',
    description: 'Fresco y armónico con enfoque en crecimiento estudiantil',
  },
  {
    id: 'blue',
    name: 'Azul Institucional',
    primary: '#2563eb',
    secondary: '#0284c7',
    accent: '#10b981',
    description: 'Clásico, formal y de máxima confiabilidad',
  },
  {
    id: 'violet',
    name: 'Violeta Imperial',
    primary: '#7c3aed',
    secondary: '#ec4899',
    accent: '#3b82f6',
    description: 'Vibrante, creativo y estimulante',
  },
  {
    id: 'ruby',
    name: 'Rubí Educativo',
    primary: '#dc2626',
    secondary: '#f97316',
    accent: '#4f46e5',
    description: 'Enérgico, dinámico y con carácter',
  },
  {
    id: 'amber',
    name: 'Ámbar Solar',
    primary: '#d97706',
    secondary: '#16a34a',
    accent: '#2563eb',
    description: 'Cálido, acogedor e inspirador',
  },
  {
    id: 'cyan',
    name: 'Cyan Tecnológico',
    primary: '#0891b2',
    secondary: '#6366f1',
    accent: '#10b981',
    description: 'Moderno, digital y futurista',
  },
  {
    id: 'slate',
    name: 'Slate Ejecutivo',
    primary: '#334155',
    secondary: '#475569',
    accent: '#3b82f6',
    description: 'Sobrio, minimalista y profesional',
  },
];

export const DEFAULT_BRANDING_CONFIG: SystemBrandingConfig = {
  nombreInstitucion: 'ColeSistema Mini',
  siglas: 'CS',
  slogan: 'Gestión Escolar Inteligente & Asistencia QR',
  descripcion: 'Sistema escolar modular con asistencia QR, calificaciones por competencias (AD, A, B, C) y dashboards para Admin, Docente y Estudiante.',
  logoUrl: '',
  faviconUrl: '/favicon.ico',
  primaryColor: '#4f46e5',
  secondaryColor: '#10b981',
  accentColor: '#3b82f6',
  themePreset: 'indigo',
  borderRadius: '1rem',
  fontFamily: 'Plus Jakarta Sans',
  metaTitle: 'ColeSistema Mini – Gestión Escolar & Asistencia QR',
  metaDescription: 'Sistema escolar modular con asistencia QR, calificaciones por competencias (AD, A, B, C) y dashboards para Admin, Docente y Estudiante.',
  metaKeywords: 'colegio, notas cneb, asistencia qr, educacion, libreta digital, matricula, portal escolar, siagie, minedu',
  ogImageUrl: '/estudiantesTodosBanner.jpg',
  canonicalUrl: 'https://colesistema.edu.pe',
  twitterHandle: '@colesistema',
  contactoEmail: 'contacto@colegio.edu.pe',
  telefono: '+51 987 654 321',
  direccion: 'Av. Los Educadores 123, Lima, Perú',
  allowRobotsIndex: true,
  allowRobotsFollow: true,
  disallowedPaths: ['/admin', '/docente', '/estudiante', '/apoderado', '/asistencia', '/api'],
  customRobotsTxt: '',
  sitemapIncludedPaths: [
    { url: '/', changefreq: 'daily', priority: 1.0 },
    { url: '/login', changefreq: 'weekly', priority: 0.8 },
    { url: '/bienvenida', changefreq: 'monthly', priority: 0.6 },
    { url: '/despedida', changefreq: 'monthly', priority: 0.4 },
  ],
  
  // Documentos Oficiales & Sello Digital
  codigoModular: '0482910',
  ugel: 'UGEL 03 - Lima Centro',
  dre: 'DRE Lima Metropolitana',
  ruc: '20489123451',
  directorNombre: 'Mg. Carlos Alberto Mendoza',
  directorFirmaUrl: '',
  mostrarMembreteEnPdf: true,
  watermarkUrl: '',
  watermarkOpacity: 0.12,
  documentSecurityFooterText: 'Documento Oficial de Valor Legal emitido electrónicamente según normativa vigente del MINEDU.',

  // Diseñador de Carnet Escolar QR
  carnetColorBorde: '#4f46e5',
  carnetFondoUrl: '',
  carnetOrientacion: 'vertical',
  carnetFranjaNivelColor: '#4f46e5',
  carnetReversoNormas: '1. Portar el carnet obligatoriamente.\n2. Carnet personal e intransferible.\n3. En caso de pérdida reportar a secretaría.',
  carnetReversoEmergencia: 'Atención Médica: Tópico Central',
  carnetReversoTelefono: '+51 987 654 321',
  carnetSelloHolografico: true,

  // UI Global & Estilos del Sistema
  borderRadiusMode: 'modern',
  sidebarStyle: 'dark',
  defaultTheme: 'system',
  splashScreenActivo: true,
  splashScreenTexto: 'Iniciando Plataforma de Gestión Escolar...',

  // Diplomas & Certificados de Honor
  diplomaBordeEstilo: 'oro_clasico',
  diplomaFirmaDirector: true,
  diplomaFirmaTutor: true,
  diplomaTextoPredeterminado: 'Por su destacado rendimiento académico y ejemplar compromiso con los valores institucionales durante el Año Lectivo 2026.',

  // Sonido Institucional del Kiosco QR
  kioskSoundPreset: 'chime',

  // Pantalla de Login & White-Label
  loginBannerUrl: '/login-illustration.jpg',
  loginBienvenidaTitulo: '¡Bienvenidos a nuestra Comunidad Educativa!',
  loginBienvenidaMensaje: 'Accede a tus calificaciones, control de asistencia en tiempo real y aula virtual con los más altos estándares educativos.',
  mostrarPoweredBy: true,
  whiteLabelFooterTexto: '© 2026 Todos los derechos reservados.',

  // PWA & Canales de Soporte
  pwaShortName: 'ColeSistema',
  pwaThemeColor: '#4f46e5',
  whatsappSoporteNumero: '51987654321',
  whatsappSoporteMensaje: 'Hola, deseo información sobre las matrículas y servicios escolares.',
  mostrarWhatsappFlotante: true,
  googleAnalyticsId: '',
  metaPixelId: '',

  // BREVO (Exclusivo: Asistencias Diarias en Tiempo Real)
  brevoApiKey: '',
  brevoSenderEmail: 'asistencias@colegio.edu.pe',
  brevoSenderName: 'ColeSistema - Control de Asistencia',
  brevoActivarEnvioAsistencia: true,
  brevoPlantillaAsunto: '[ESTADO] Control de Asistencia: [ALUMNO] - [HORA] | [COLEGIO]',

  // RESEND (Exclusivo: Libretas Bimestrales, Matrícula & Tesorería)
  resendApiKey: '',
  resendSenderEmail: 'comunicados@colegio.edu.pe',
  resendSenderName: 'ColeSistema - Notificaciones Institucionales',
  resendPlantillaLibretaAsunto: '📊 Libreta Oficial de Calificaciones [BIMESTRE]: [ALUMNO] | [COLEGIO]',
  resendPlantillaBienvenidaAsunto: '🎉 ¡Bienvenido(a) al Año Escolar 2026!: [ALUMNO] | [COLEGIO]',
  resendPlantillaPensionAsunto: '💳 Aviso de Pensión Escolar - Mes de [MES]: [ALUMNO] | [COLEGIO]',

  updatedAt: new Date().toISOString(),
};

const STORAGE_KEY = 'cole_system_branding_config_v1';

/**
 * Convierte color HEX a HSL format (h s% l%) para CSS variables
 */
export function hexToHsl(hex: string): string {
  let c = hex.trim().replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  if (c.length !== 6) return '234 89% 60%';

  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  const hDeg = Math.round(h * 360);
  const sPct = Math.round(s * 100);
  const lPct = Math.round(l * 100);

  return `${hDeg} ${sPct}% ${lPct}%`;
}

/**
 * Obtiene la configuración de branding guardada en LocalStorage o devuelve la por defecto
 */
export function getStoredBranding(): SystemBrandingConfig {
  if (typeof window === 'undefined') return DEFAULT_BRANDING_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_BRANDING_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_BRANDING_CONFIG,
      ...parsed,
      sitemapIncludedPaths: Array.isArray(parsed.sitemapIncludedPaths) && parsed.sitemapIncludedPaths.length > 0
        ? parsed.sitemapIncludedPaths
        : DEFAULT_BRANDING_CONFIG.sitemapIncludedPaths,
      disallowedPaths: Array.isArray(parsed.disallowedPaths)
        ? parsed.disallowedPaths
        : DEFAULT_BRANDING_CONFIG.disallowedPaths,
    };
  } catch (err) {
    console.error('Error leyendo branding de localStorage:', err);
    return DEFAULT_BRANDING_CONFIG;
  }
}

/**
 * Guarda la configuración de branding en LocalStorage
 */
export function saveStoredBranding(config: SystemBrandingConfig): void {
  if (typeof window === 'undefined') return;
  try {
    const toSave = {
      ...config,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (err) {
    console.error('Error guardando branding en localStorage:', err);
  }
}

/**
 * Restablece la configuración de branding a los valores por defecto
 */
export function resetStoredBranding(): SystemBrandingConfig {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
  }
  return DEFAULT_BRANDING_CONFIG;
}

/**
 * Aplica en tiempo real los estilos CSS variables, fuentes, el título y los meta tags en el documento HTML
 */
export function applyBrandingToDOM(config: SystemBrandingConfig): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const root = document.documentElement;

  // 1. Aplicar CSS Variables de Color y Curvatura
  if (config.primaryColor) {
    const hslPrimary = hexToHsl(config.primaryColor);
    root.style.setProperty('--primary', hslPrimary);
    root.style.setProperty('--primary-color', config.primaryColor);
    root.style.setProperty('--secondary-color', config.secondaryColor || '#10b981');
    root.style.setProperty('--accent-color', config.accentColor || '#3b82f6');
    
    // Gradientes dinámicos
    const gradAdmin = `linear-gradient(135deg, ${config.primaryColor} 0%, ${config.accentColor || '#3b82f6'} 50%, ${config.secondaryColor || '#10b981'} 100%)`;
    root.style.setProperty('--grad-admin', gradAdmin);
    root.style.setProperty('--glow-blue', `0 0 40px ${config.primaryColor}26`);
  }

  if (config.borderRadius) {
    root.style.setProperty('--border-radius-custom', config.borderRadius);
  }

  // 2. Aplicar Tipografía Dinámica (Google Fonts)
  if (config.fontFamily) {
    const fontName = config.fontFamily;
    const fontOption = FONT_OPTIONS.find(f => f.id === fontName);
    const category = fontOption?.category || 'sans-serif';

    // Cargar link de Google Fonts si no está presente
    const fontUrlParam = fontName.replace(/ /g, '+');
    const fontLinkId = `google-font-${fontName.toLowerCase().replace(/\s+/g, '-')}`;
    
    if (!document.getElementById(fontLinkId)) {
      const link = document.createElement('link');
      link.id = fontLinkId;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${fontUrlParam}:wght@300;400;500;600;700;800;900&display=swap`;
      document.head.appendChild(link);
    }

    document.body.style.fontFamily = `'${fontName}', ${category}, system-ui, -apple-system, sans-serif`;
  }

  // 3. Aplicar Document Title
  if (config.metaTitle) {
    document.title = config.metaTitle;
  }

  // 4. Helper para actualizar o crear meta tag
  const setMetaTag = (attrName: 'name' | 'property', attrValue: string, content: string) => {
    let meta = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attrName, attrValue);
      document.head.appendChild(meta);
    }
    meta.content = content;
  };

  // SEO Básico
  if (config.metaDescription) {
    setMetaTag('name', 'description', config.metaDescription);
  }
  if (config.metaKeywords) {
    setMetaTag('name', 'keywords', config.metaKeywords);
  }

  // Robots
  const robotsDirectives = [
    config.allowRobotsIndex ? 'index' : 'noindex',
    config.allowRobotsFollow ? 'follow' : 'nofollow',
  ].join(', ');
  setMetaTag('name', 'robots', robotsDirectives);
  setMetaTag('name', 'googlebot', robotsDirectives);

  // Open Graph (WhatsApp / Facebook / LinkedIn)
  if (config.metaTitle) setMetaTag('property', 'og:title', config.metaTitle);
  if (config.metaDescription) setMetaTag('property', 'og:description', config.metaDescription);
  if (config.ogImageUrl) setMetaTag('property', 'og:image', config.ogImageUrl);
  if (config.canonicalUrl) setMetaTag('property', 'og:url', config.canonicalUrl);
  setMetaTag('property', 'og:site_name', config.nombreInstitucion || 'ColeSistema');
  setMetaTag('property', 'og:type', 'website');

  // Twitter Card
  setMetaTag('name', 'twitter:card', 'summary_large_image');
  if (config.metaTitle) setMetaTag('name', 'twitter:title', config.metaTitle);
  if (config.metaDescription) setMetaTag('name', 'twitter:description', config.metaDescription);
  if (config.ogImageUrl) setMetaTag('name', 'twitter:image', config.ogImageUrl);
  if (config.twitterHandle) setMetaTag('name', 'twitter:site', config.twitterHandle);

  // Favicon Dinámico
  if (config.faviconUrl) {
    let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = config.faviconUrl;
  }
}

/**
 * Genera el contenido en texto plano para robots.txt
 */
export function generateRobotsTxt(config: SystemBrandingConfig): string {
  if (config.customRobotsTxt && config.customRobotsTxt.trim().length > 0) {
    return config.customRobotsTxt.trim();
  }

  const lines: string[] = [
    '# =========================================',
    `# Robots.txt - ${config.nombreInstitucion || 'ColeSistema Mini'}`,
    `# Generado automáticamente: ${new Date().toLocaleDateString('es-PE')}`,
    '# =========================================',
    '',
    'User-agent: *',
  ];

  if (!config.allowRobotsIndex) {
    lines.push('Disallow: /');
  } else {
    // Rutas permitidas públicas
    lines.push('Allow: /');
    lines.push('Allow: /login');
    lines.push('Allow: /bienvenida');
    lines.push('Allow: /manifest.json');
    lines.push('');

    // Rutas protegidas
    if (config.disallowedPaths && config.disallowedPaths.length > 0) {
      lines.push('# Rutas privadas y paneles internos');
      config.disallowedPaths.forEach(p => {
        if (p.trim()) lines.push(`Disallow: ${p.trim()}`);
      });
      lines.push('');
    }
  }

  const sitemapUrl = config.canonicalUrl 
    ? `${config.canonicalUrl.replace(/\/$/, '')}/sitemap.xml`
    : 'https://colesistema.edu.pe/sitemap.xml';

  lines.push(`# Mapa del sitio XML`);
  lines.push(`Sitemap: ${sitemapUrl}`);

  return lines.join('\n');
}

/**
 * Genera el documento XML para sitemap.xml
 */
export function generateSitemapXml(config: SystemBrandingConfig): string {
  const baseUrl = (config.canonicalUrl || 'https://colesistema.edu.pe').replace(/\/$/, '');
  const today = new Date().toISOString().split('T')[0];

  const entries = (config.sitemapIncludedPaths || []).map((entry) => {
    const loc = entry.url === '/' ? baseUrl : `${baseUrl}${entry.url.startsWith('/') ? '' : '/'}${entry.url}`;
    const lastmod = entry.lastmod || today;
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${entry.changefreq || 'weekly'}</changefreq>
    <priority>${entry.priority.toFixed(1)}</priority>
  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`.trim();
}
