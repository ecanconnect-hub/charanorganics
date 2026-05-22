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
    { href: '/admin/utr', label: 'UTR Desk', icon: 'UT' },
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
    const [authorized, setAuthorized] = useState(false);

    useAdminSecurity(setVerifying, setAuthorized);

    if (verifying) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
                <div className="mb-6 flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-indigo-100 bg-white shadow-xl !p-0">
                    <Image src="/charan-emblem-tight.png" alt="Charan Organics" width={110} height={110} className="h-full w-full scale-[1] object-cover object-center" />
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

    if (!authorized) {
        return null;
    }

    return (
        <div className="admin-shell min-h-screen bg-[#f6f8f4] text-slate-900">
            <div className="sticky top-0 z-50 border-b border-emerald-900/10 bg-white/95 !p-3 text-slate-900 shadow-sm backdrop-blur lg:hidden">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-emerald-100 bg-white shadow-sm ring-4 ring-emerald-50 !p-1.5">
                            <Image src="/charan-emblem.png" alt="Charan Organics" width={36} height={36} className="h-full w-full object-contain" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-base font-semibold leading-tight">Charan Organics</h1>
                            <p className="text-xs text-slate-500">Admin Panel</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setSidebarOpen((value) => !value)}
                        className="rounded-md !p-2 transition-colors hover:bg-emerald-50"
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
                    className="fixed inset-0 z-40 bg-slate-950/45 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Close sidebar"
                />
            )}

            <div className="lg:flex">
                <aside
                    style={{ width: sidebarCollapsed ? '80px' : '288px' }}
                    className={`fixed left-0 top-0 z-50 flex h-full flex-col border-r border-emerald-900/10 bg-white shadow-xl shadow-slate-200/70 transition-transform duration-300 lg:sticky lg:z-30 lg:h-screen ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                        }`}
                >
                    <div className="relative shrink-0 overflow-hidden border-b border-emerald-900/10 bg-[#fbfcf8] !px-4 !py-4">
                        {!sidebarCollapsed ? (
                            <div className="flex min-w-0 flex-col items-center text-center">
                                <div className="mb-3 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-emerald-100 bg-white shadow-sm ring-4 ring-emerald-50 !p-2">
                                    <Image src="/charan-emblem.png" alt="Charan Organics" width={34} height={34} className="h-full w-full object-contain" />
                                </div>
                                <div className="min-w-0 max-w-full">
                                    <div className="whitespace-nowrap text-[18px] font-semibold leading-tight text-slate-950 sm:text-[19px]">
                                        Charan Organics
                                    </div>
                                    <p className="mt-1 text-xs font-medium text-emerald-700">Admin Panel</p>
                                </div>
                            </div>
                        ) : (
                            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-emerald-100 bg-white shadow-sm ring-4 ring-emerald-50 !p-1.5">
                                <Image src="/charan-emblem.png" alt="Charan Organics" width={36} height={36} className="h-full w-full object-contain" />
                            </div>
                        )}

                        <button
                            onClick={() => setSidebarCollapsed((value) => !value)}
                            className={`${sidebarCollapsed ? 'mx-auto mt-3' : 'absolute right-3 top-3'} hidden rounded-md !p-2 transition-colors hover:bg-emerald-50 lg:block`}
                            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        >
                            <svg
                                className={`h-5 w-5 text-slate-500 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            </svg>
                        </button>
                    </div>

                    <nav className="flex-1 space-y-1 overflow-y-auto !p-3">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center gap-3 rounded-md !px-3 !py-2.5 text-sm font-medium transition-all duration-200 ${isActive
                                        ? 'bg-emerald-700 text-white shadow-sm'
                                        : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-900'
                                        } ${sidebarCollapsed ? 'justify-center' : ''}`}
                                    title={sidebarCollapsed ? item.label : ''}
                                >
                                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${isActive ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                        {item.icon}
                                    </span>
                                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="shrink-0 space-y-2 border-t border-emerald-900/10 bg-[#fbfcf8] !p-3">
                        <Link href="/" className="block">
                            <button
                                className={`flex w-full items-center gap-3 rounded-md border border-slate-200 bg-white !px-3 !py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 ${sidebarCollapsed ? 'justify-center' : ''}`}
                                title={sidebarCollapsed ? 'View Website' : ''}
                            >
                                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded bg-slate-100 text-[10px] font-bold">WB</span>
                                {!sidebarCollapsed && <span>View Website</span>}
                            </button>
                        </Link>
                        <button
                            onClick={() => signOut()}
                            className={`flex w-full items-center gap-3 rounded-md border border-red-100 bg-red-50 !px-3 !py-2.5 text-sm font-medium text-red-700 shadow-sm transition-all duration-200 hover:bg-red-100 ${sidebarCollapsed ? 'justify-center' : ''}`}
                            title={sidebarCollapsed ? 'Logout' : ''}
                        >
                            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded bg-red-100 text-[10px] font-bold">LO</span>
                            {!sidebarCollapsed && <span>Logout</span>}
                        </button>
                    </div>
                </aside>

                <div className="min-h-screen flex-1">
                    <main className="min-h-screen min-w-0">
                        <div className="sticky top-0 z-30 border-b border-emerald-900/10 bg-white/95 shadow-sm backdrop-blur">
                            <div className="!px-4 !py-4 sm:!px-6 lg:!px-8">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <h1 className="truncate text-xl font-semibold leading-tight text-slate-950 sm:text-2xl">{title}</h1>
                                        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
                                    </div>

                                </div>
                            </div>
                        </div>

                        <div className="animate-fade-in !p-4 sm:!p-6 lg:!p-8">{children}</div>
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
