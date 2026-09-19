import { MetadataRoute } from 'next';
import { DEFAULT_BRANDING_CONFIG } from '@/lib/services/brandingService';

export default function sitemap(): MetadataRoute.Sitemap {
  const config = DEFAULT_BRANDING_CONFIG;
  const baseUrl = (config.canonicalUrl || 'https://colesistema.edu.pe').replace(/\/$/, '');

  const routes: MetadataRoute.Sitemap = (config.sitemapIncludedPaths || []).map((item) => ({
    url: item.url === '/' ? baseUrl : `${baseUrl}${item.url.startsWith('/') ? '' : '/'}${item.url}`,
    lastModified: item.lastmod ? new Date(item.lastmod) : new Date(),
    changeFrequency: item.changefreq as any,
    priority: item.priority,
  }));

  return routes;
}
