/**
 * Admin Layout Component
 * Shared shell for all admin pages.
 */

'use client';

import { ReactNode, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminSecurity } from '@/lib/admin/security';
import { useAuth } from '@/lib/auth/context';

interface AdminLayoutProps {
    children: ReactNode;
    title: string;
    subtitle?: string;
}

interface NavItem {
    href: string;
    label: string;
    icon: string;
}

const navItems: NavItem[] = [
    { href: '/admin', label: 'Dashboard', icon: 'DB' },
    { href: '/admin/orders', label: 'Orders', icon: 'OR' },
    { href: '/admin/products', label: 'Products', icon: 'PR' },
    { href: '/admin/categories', label: 'Categories', icon: 'CT' },
    { href: '/admin/payments', label: 'Payments', icon: 'PY' },
    { href: '/admin/users', label: 'Users', icon: 'US' },
    { href: '/admin/security', label: 'Security', icon: 'SC' },
    { href: '/admin/messages', label: 'Messages', icon: 'MS' },
    { href: '/admin/settings', label: 'App Settings', icon: 'ST' }
];

export function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
    const pathname = usePathname();
    const { signOut } = useAuth();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [verifying, setVerifying] = useState(true);

    useAdminSecurity(setVerifying);

    if (verifying) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
                <div className="mb-6 flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-indigo-100 bg-white shadow-xl">
                    <Image src="/charan-emblem-tight.png" alt="Charan Organics" width={110} height={110} className="h-full w-full scale-125 object-cover" />
                </div>
                <div className="flex flex-col items-center gap-2">
                    <div className="text-xl font-bold text-gray-900">Verifying Admin Access...</div>
                    <div className="text-sm text-gray-500">Please wait while we secure your session</div>
                    <div className="mt-6 flex gap-2">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-600 [animation-delay:-0.3s]" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-600 [animation-delay:-0.15s]" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-600" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="sticky top-0 z-50 bg-gradient-to-r from-indigo-600 to-indigo-700 p-4 text-white shadow-lg lg:hidden">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-indigo-100 bg-white shadow-lg">
                            <Image src="/charan-emblem-tight.png" alt="Charan Organics" width={46} height={46} className="h-full w-full scale-125 object-cover" />
                        </div>
                        <h1 className="text-xl font-bold">Admin Panel</h1>
                    </div>
                    <button
                        onClick={() => setSidebarOpen((value) => !value)}
                        className="rounded-lg p-2 transition-colors hover:bg-white/10"
                        aria-label="Toggle menu"
                    >
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {sidebarOpen && (
                <button
                    type="button"
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Close sidebar"
                />
            )}

            <div className="lg:flex">
                <aside
                    style={{ width: sidebarCollapsed ? '80px' : '256px' }}
                    className={`fixed left-0 top-0 z-50 flex h-full flex-col border-r border-gray-200 bg-white shadow-xl transition-transform duration-300 lg:sticky lg:z-30 lg:h-screen ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                        }`}
                >
                    <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-5">
                        {!sidebarCollapsed ? (
                            <div className="flex items-center gap-3">
                                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-indigo-100 bg-white shadow-lg">
                                    <Image src="/charan-emblem-tight.png" alt="Charan Organics" width={60} height={60} className="h-full w-full scale-125 object-cover" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 leading-tight">Charan Organics</h2>
                                    <p className="text-xs font-semibold text-indigo-600">Admin Panel</p>
                                </div>
                            </div>
                        ) : (
                            <div className="mx-auto flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-indigo-100 bg-white shadow-lg">
                                <Image src="/charan-emblem-tight.png" alt="Charan Organics" width={46} height={46} className="h-full w-full scale-125 object-cover" />
                            </div>
                        )}

                        <button
                            onClick={() => setSidebarCollapsed((value) => !value)}
                            className="hidden rounded-lg p-2 transition-colors hover:bg-white lg:block"
                            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        >
                            <svg
                                className={`h-5 w-5 text-gray-600 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            </svg>
                        </button>
                    </div>

                    <nav className="flex-1 space-y-1 overflow-y-auto p-4">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${isActive
                                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200'
                                        : 'text-gray-700 hover:bg-gray-100'
                                        } ${sidebarCollapsed ? 'justify-center' : ''}`}
                                    title={sidebarCollapsed ? item.label : ''}
                                >
                                    <span className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold ${isActive ? 'bg-white/20' : 'bg-gray-100 text-gray-600'}`}>
                                        {item.icon}
                                    </span>
                                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="shrink-0 space-y-2 border-t border-gray-200 bg-gray-50 p-4">
                        <Link href="/" className="block">
                            <button
                                className={`flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 ${sidebarCollapsed ? 'justify-center' : ''}`}
                                title={sidebarCollapsed ? 'View Website' : ''}
                            >
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-gray-100 text-[10px] font-bold">WB</span>
                                {!sidebarCollapsed && <span>View Website</span>}
                            </button>
                        </Link>
                        <button
                            onClick={() => signOut()}
                            className={`flex w-full items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 shadow-sm transition-all duration-200 hover:bg-red-100 ${sidebarCollapsed ? 'justify-center' : ''}`}
                            title={sidebarCollapsed ? 'Logout' : ''}
                        >
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-red-100 text-[10px] font-bold">LO</span>
                            {!sidebarCollapsed && <span>Logout</span>}
                        </button>
                    </div>
                </aside>

                <div className="min-h-screen flex-1">
                    <main className="min-h-screen min-w-0">
                        <div className="sticky top-0 z-30 border-b border-gray-200 bg-white shadow-sm">
                            <div className="px-4 py-4 sm:px-6 lg:px-8">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <h1 className="truncate text-xl font-bold text-gray-900 sm:text-2xl">{title}</h1>
                                        {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
                                    </div>
                                    <button
                                        onClick={() => setSidebarOpen((value) => !value)}
                                        className="rounded-lg p-2 transition-colors hover:bg-gray-100 lg:hidden"
                                        aria-label="Open sidebar"
                                    >
                                        <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="animate-fade-in p-4 sm:p-6 lg:p-10">{children}</div>
                    </main>
                </div>
            </div>

            <style jsx>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in {
                    animation: fade-in 0.35s ease-out;
                }
            `}</style>
        </div>
    );
}
