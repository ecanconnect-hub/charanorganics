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

export const metadata: Metadata = {
  title: "Charan Organics - Pure Organic & Ayurvedic Products",
  description: "Handcrafted organic and ayurvedic products made with love. Natural, cruelty-free, and delivered with care.",
  keywords: ["organic", "ayurvedic", "natural products", "handmade", "cruelty-free"],
  authors: [{ name: "Charan Organics" }],
  openGraph: {
    title: "Charan Organics - Pure Organic & Ayurvedic Products",
    description: "Handcrafted organic and ayurvedic products made with love",
    type: "website",
  },
};

import Script from 'next/script';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
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
