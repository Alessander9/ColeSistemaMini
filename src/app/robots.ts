import { MetadataRoute } from 'next';
import { DEFAULT_BRANDING_CONFIG } from '@/lib/services/brandingService';

export default function robots(): MetadataRoute.Robots {
  const config = DEFAULT_BRANDING_CONFIG;
  const baseUrl = (config.canonicalUrl || 'https://colesistema.edu.pe').replace(/\/$/, '');

  if (!config.allowRobotsIndex) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
      sitemap: `${baseUrl}/sitemap.xml`,
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login', '/bienvenida', '/manifest.json'],
      disallow: config.disallowedPaths || ['/admin', '/docente', '/estudiante', '/apoderado', '/asistencia', '/api'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
