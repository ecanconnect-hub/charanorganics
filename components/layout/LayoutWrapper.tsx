'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { TopBar } from './TopBar';
import { Header } from './Header';
import { Footer } from './Footer';

/**
 * NavbarWrapper Component
 * 
 * Conditionally renders layout elements like Header and Footer based on the current route.
 */
export function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');
    const isAuthPage = ['/login', '/signup', '/forgot-password', '/reset-password'].includes(pathname);

    if (isAdmin || isAuthPage) {
        return (
            <main className="min-h-screen flex flex-col">
                {children}
            </main>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <TopBar />
            <Suspense fallback={null}>
                <Header />
            </Suspense>
            <main className="flex-1 pt-16 md:pt-32">
                {children}
            </main>
            <Footer />
        </div>
    );
}
