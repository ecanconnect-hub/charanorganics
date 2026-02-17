import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://charanorganics.com';
    const disallow = ['/admin/', '/account/', '/checkout/', '/api/'];

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow,
            },
            {
                userAgent: ['GPTBot', 'ChatGPT-User', 'Google-Extended'],
                allow: '/',
                disallow,
            },
        ],
        host: baseUrl,
        sitemap: [`${baseUrl}/sitemap.xml`],
    }
}
