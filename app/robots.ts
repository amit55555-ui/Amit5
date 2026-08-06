import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

// Tell search engines they may index everything except the admin panel,
// and point them at the sitemap.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/admin' },
    sitemap: 'https://metzion.co.il/sitemap.xml',
    host: 'https://metzion.co.il',
  };
}
