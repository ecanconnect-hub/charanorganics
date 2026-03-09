import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = 'https://charanorganics.com';
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
