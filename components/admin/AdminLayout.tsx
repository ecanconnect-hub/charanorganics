/**
 * Admin Layout Component
 * Secure wrapper for all admin pages with role verification and session management
 */

'use client';

import { useState, ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminSecurity, verifyAdminAccess } from '@/lib/admin/security';
import { useAuth } from '@/lib/auth/context';

interface AdminLayoutProps {
    children: ReactNode;
    title: string;
    subtitle?: string;
}

export function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { signOut } = useAuth();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [verifying, setVerifying] = useState(true);

    // Enable admin security (3-hour timeout, activity logging)
    // Pass verification state setter to sync loading UI
    useAdminSecurity(setVerifying);

    // Verify admin access on mount and path changes is now handled by useAdminSecurity
    // useEffect(() => {
    //     // Removed redundant check - useAdminSecurity handles session validation
    //     setVerifying(false);
    // }, []);

    const navItems = [
        { href: '/admin', label: 'Dashboard', icon: '📊' },
        { href: '/admin/orders', label: 'Orders', icon: '📦' },
        { href: '/admin/products', label: 'Products', icon: '🛍️' },
        { href: '/admin/categories', label: 'Categories', icon: '📁' },
        { href: '/admin/payments', label: 'Payments', icon: '💳' },
        { href: '/admin/users', label: 'Users', icon: '👥' },
        { href: '/admin/security', label: 'Security', icon: '🛡️' },
        { href: '/admin/messages', label: 'Messages', icon: '📨' },
        { href: '/admin/settings', label: 'App Settings', icon: '⚙️' },
    ];

    if (verifying) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-6 animate-bounce overflow-hidden p-3 border border-indigo-100">
                    <img src="/favicon.ico" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div className="flex flex-col items-center gap-2">
                    <div className="text-gray-900 font-bold text-xl animate-pulse">Verifying Admin Access...</div>
                    <div className="text-gray-500 text-sm">Please wait while we secure your session</div>
                    <div className="mt-8 flex gap-2">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile Header */}
            <div className="lg:hidden bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-4 sticky top-0 z-50 shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg overflow-hidden p-1.5 border border-indigo-100">
                            <img src="/favicon.ico" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <h1 className="text-xl font-bold">Admin Panel</h1>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Sidebar Overlay (Mobile) */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar - FIXED POSITION */}
            <aside
                style={{
                    width: sidebarCollapsed ? '80px' : '256px',
                    transition: 'width 0.3s ease-in-out'
                }}
                className={`
                    fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 shadow-xl flex flex-col
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}
            >
                {/* Logo & Collapse Button */}
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 flex items-center justify-between shrink-0">
                    {!sidebarCollapsed ? (
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg overflow-hidden p-2 border border-indigo-100">
                                <img src="/favicon.ico" alt="Logo" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Charan Organics</h2>
                                <p className="text-indigo-600 text-xs font-semibold">Admin Panel</p>
                            </div>
                        </div>
                    ) : (
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg mx-auto overflow-hidden p-2 border border-indigo-100">
                            <img src="/favicon.ico" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                    )}

                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="hidden lg:block p-2 hover:bg-white rounded-lg transition-colors"
                        title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        <svg
                            className={`w-5 h-5 text-gray-600 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path>
                        </svg>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1 flex-1 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`
                                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium shrink-0
                                    ${isActive
                                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200'
                                        : 'text-gray-700 hover:bg-gray-100'
                                    }
                                    ${sidebarCollapsed ? 'justify-center' : ''}
                                `}
                                title={sidebarCollapsed ? item.label : ''}
                            >
                                <span className="text-xl shrink-0">{item.icon}</span>
                                {!sidebarCollapsed && <span className="text-sm truncate">{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-2 shrink-0">
                    <Link href="/">
                        <button
                            className={`
                                w-full flex items-center gap-3 px-4 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-all duration-200 text-gray-700 font-medium shadow-sm
                                ${sidebarCollapsed ? 'justify-center' : ''}
                            `}
                            title={sidebarCollapsed ? "View Website" : ''}
                        >
                            <span className="text-lg">🌐</span>
                            {!sidebarCollapsed && <span className="text-sm">View Website</span>}
                        </button>
                    </Link>
                    <button
                        onClick={() => signOut()}
                        className={`
                            w-full flex items-center gap-3 px-4 py-2 rounded-xl bg-red-50 border border-red-100 hover:bg-red-100 transition-all duration-200 text-red-600 font-medium shadow-sm
                            ${sidebarCollapsed ? 'justify-center' : ''}
                        `}
                        title={sidebarCollapsed ? "Logout" : ''}
                    >
                        <span className="text-lg">🚪</span>
                        {!sidebarCollapsed && <span className="text-sm">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div
                style={{
                    paddingLeft: typeof window !== 'undefined' && window.innerWidth >= 1024 ? (sidebarCollapsed ? '80px' : '256px') : '0px',
                    transition: 'padding-left 0.3s ease-in-out'
                }}
                className="min-h-screen"
            >
                <main className="min-h-screen">
                    <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
                        <div className="px-6 lg:px-8 py-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                                    {subtitle && <p className="text-gray-600 text-sm mt-1">{subtitle}</p>}
                                </div>

                                <button
                                    onClick={() => setSidebarOpen(!sidebarOpen)}
                                    className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 lg:p-10 animate-fade-in">
                        {children}
                    </div>
                </main>
            </div>

            <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.4s ease-out;
                }
            `}</style>
        </div>
    );
}
