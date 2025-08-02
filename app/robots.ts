import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/device-selection/'],
    },
    sitemap: 'https://hackabyte.games/sitemap.xml',
  };
}
