import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/account/', '/checkout/', '/api/'],
        },
        sitemap: 'https://charanorganics.com/sitemap.xml', // Replace with actual domain
    }
}
