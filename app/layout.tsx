import type { Metadata } from "next";
import { Toaster } from 'react-hot-toast';
import { I18nProvider } from '@/lib/i18n/context';
import { AuthProvider } from '@/lib/auth/context';
import { CartProvider } from '@/lib/cart-context';
import { LayoutWrapper } from '@/components/layout/LayoutWrapper';
import { Outfit, Instrument_Serif } from 'next/font/google';
import "./globals.css";

// Load Premium Google Fonts
const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const instrument = Instrument_Serif({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://charanorganics.com';
const siteName = 'Charan Organics';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} | Organic & Ayurvedic Products`,
    template: `%s | ${siteName}`,
  },
  description: "Shop handcrafted organic and ayurvedic products by Charan Organics. Natural, cruelty-free, and thoughtfully made for daily wellness.",
  keywords: ["organic products", "ayurvedic products", "natural skincare", "herbal wellness", "cruelty-free", "handmade"],
  applicationName: siteName,
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  referrer: 'origin-when-cross-origin',
  openGraph: {
    title: `${siteName} | Organic & Ayurvedic Products`,
    description: "Handcrafted organic and ayurvedic products made with care for natural daily wellness.",
    type: "website",
    url: siteUrl,
    siteName,
    locale: 'en_IN',
    images: [
      {
        url: '/charan-logo.png',
        width: 1200,
        height: 630,
        alt: `${siteName} logo`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteName} | Organic & Ayurvedic Products`,
    description: "Natural and handcrafted wellness products from Charan Organics.",
    images: ['/charan-logo.png'],
  },
};

import Script from 'next/script';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}#organization`,
        name: siteName,
        url: siteUrl,
        logo: `${siteUrl}/charan-logo.png`,
        contactPoint: [{
          '@type': 'ContactPoint',
          telephone: '+91-8247838125',
          contactType: 'customer support',
          areaServed: 'IN',
          availableLanguage: ['en', 'te'],
        }],
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}#website`,
        url: siteUrl,
        name: siteName,
        publisher: {
          '@id': `${siteUrl}#organization`,
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: `${siteUrl}/shop?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'OnlineStore',
        '@id': `${siteUrl}#store`,
        name: siteName,
        url: siteUrl,
      },
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
              `}
            </Script>
          </>
        )}
      </head>
      <body className={`${outfit.variable} ${instrument.variable} antialiased`} suppressHydrationWarning>
        <AuthProvider>
          <I18nProvider initialLocale="en">
            <CartProvider>
              <LayoutWrapper>
                {children}
              </LayoutWrapper>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#fff',
                    color: '#222',
                    border: '1px solid #e5e7eb',
                  },
                  success: {
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </CartProvider>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
