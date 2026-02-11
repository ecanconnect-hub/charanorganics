'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';

export default function DiagnosticPage() {
    const { user, loading } = useAuth();
    const [results, setResults] = useState<any>({
        supabaseConnection: null,
        profileFetch: null,
        cartFetch: null,
        productsFetch: null,
    });
    const [testing, setTesting] = useState(false);

    const runDiagnostics = async () => {
        setTesting(true);
        const diagnostics: any = {};

        // Test 1: Supabase Connection
        try {
            const { data, error } = await supabase.from('products').select('count').limit(1);
            diagnostics.supabaseConnection = {
                status: error ? 'FAILED' : 'SUCCESS',
                error: error ? {
                    message: error.message,
                    code: error.code,
                    hint: error.hint,
                    details: error.details
                } : null,
                data: data
            };
        } catch (err: any) {
            diagnostics.supabaseConnection = {
                status: 'ERROR',
                error: err.message || 'Unknown error',
                fullError: err
            };
        }

        // Test 2: Profile Fetch (if logged in)
        if (user) {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .maybeSingle();

                diagnostics.profileFetch = {
                    status: error ? 'FAILED' : 'SUCCESS',
                    error: error ? {
                        message: error.message,
                        code: error.code,
                        hint: error.hint,
                        details: error.details
                    } : null,
                    data: data,
                    userId: user.id,
                    userEmail: user.email
                };
            } catch (err: any) {
                diagnostics.profileFetch = {
                    status: 'ERROR',
                    error: err.message || 'Unknown error',
                    fullError: err
                };
            }

            // Test 3: Cart Fetch (if logged in)
            try {
                const { data, error } = await supabase
                    .from('cart_items')
                    .select('*')
                    .eq('user_id', user.id);

                diagnostics.cartFetch = {
                    status: error ? 'FAILED' : 'SUCCESS',
                    error: error ? {
                        message: error.message,
                        code: error.code,
                        hint: error.hint,
                        details: error.details
                    } : null,
                    data: data,
                    count: data?.length || 0
                };
            } catch (err: any) {
                diagnostics.cartFetch = {
                    status: 'ERROR',
                    error: err.message || 'Unknown error',
                    fullError: err
                };
            }
        }

        // Test 4: Products Fetch
        try {
            const { data, error } = await supabase
                .from('products')
                .select('id, product_id, title_en')
                .limit(5);

            diagnostics.productsFetch = {
                status: error ? 'FAILED' : 'SUCCESS',
                error: error ? {
                    message: error.message,
                    code: error.code,
                    hint: error.hint,
                    details: error.details
                } : null,
                data: data,
                count: data?.length || 0
            };
        } catch (err: any) {
            diagnostics.productsFetch = {
                status: 'ERROR',
                error: err.message || 'Unknown error',
                fullError: err
            };
        }

        setResults(diagnostics);
        setTesting(false);
    };

    useEffect(() => {
        if (!loading) {
            runDiagnostics();
        }
    }, [loading, user]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SUCCESS': return 'text-green-600 bg-green-50';
            case 'FAILED': return 'text-red-600 bg-red-50';
            case 'ERROR': return 'text-orange-600 bg-orange-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">🔍 System Diagnostics</h1>
                    <p className="text-gray-600 mb-6">
                        This page tests all Supabase connections and identifies issues.
                    </p>

                    <div className="flex gap-4 mb-8">
                        <button
                            onClick={runDiagnostics}
                            disabled={testing}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50"
                        >
                            {testing ? 'Running Tests...' : 'Run Diagnostics'}
                        </button>

                        <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-lg">
                            <span className="font-bold text-gray-700">User Status:</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${user ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                                {loading ? 'Loading...' : user ? `Logged in as ${user.email}` : 'Not logged in'}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Supabase Connection */}
                        <DiagnosticCard
                            title="1. Supabase Connection"
                            description="Tests if we can connect to Supabase at all"
                            status={results.supabaseConnection?.status}
                            error={results.supabaseConnection?.error}
                            data={results.supabaseConnection?.data}
                            getStatusColor={getStatusColor}
                        />

                        {/* Profile Fetch */}
                        {user && (
                            <DiagnosticCard
                                title="2. Profile Fetch"
                                description="Tests if we can fetch your profile from the database"
                                status={results.profileFetch?.status}
                                error={results.profileFetch?.error}
                                data={results.profileFetch?.data}
                                getStatusColor={getStatusColor}
                                extra={
                                    <div className="mt-2 text-sm text-gray-600">
                                        <div><strong>User ID:</strong> {results.profileFetch?.userId}</div>
                                        <div><strong>Email:</strong> {results.profileFetch?.userEmail}</div>
                                    </div>
                                }
                            />
                        )}

                        {/* Cart Fetch */}
                        {user && (
                            <DiagnosticCard
                                title="3. Cart Fetch"
                                description="Tests if we can fetch your cart items"
                                status={results.cartFetch?.status}
                                error={results.cartFetch?.error}
                                data={results.cartFetch?.data}
                                getStatusColor={getStatusColor}
                                extra={
                                    <div className="mt-2 text-sm text-gray-600">
                                        <strong>Cart Items:</strong> {results.cartFetch?.count || 0}
                                    </div>
                                }
                            />
                        )}

                        {/* Products Fetch */}
                        <DiagnosticCard
                            title="4. Products Fetch"
                            description="Tests if we can fetch products (should work for everyone)"
                            status={results.productsFetch?.status}
                            error={results.productsFetch?.error}
                            data={results.productsFetch?.data}
                            getStatusColor={getStatusColor}
                            extra={
                                <div className="mt-2 text-sm text-gray-600">
                                    <strong>Products Found:</strong> {results.productsFetch?.count || 0}
                                </div>
                            }
                        />
                    </div>

                    {/* Environment Info */}
                    <div className="mt-8 p-6 bg-gray-50 rounded-xl">
                        <h3 className="font-bold text-gray-900 mb-4">Environment Info</h3>
                        <div className="space-y-2 text-sm font-mono">
                            <div><strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}</div>
                            <div><strong>Anon Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DiagnosticCard({
    title,
    description,
    status,
    error,
    data,
    getStatusColor,
    extra
}: any) {
    return (
        <div className="border border-gray-200 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                    <p className="text-gray-600 text-sm">{description}</p>
                </div>
                {status && (
                    <span className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(status)}`}>
                        {status}
                    </span>
                )}
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <h4 className="font-bold text-red-900 mb-2">❌ Error Details:</h4>
                    <pre className="text-xs text-red-800 overflow-auto">
                        {JSON.stringify(error, null, 2)}
                    </pre>
                </div>
            )}

            {data && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-bold text-green-900 mb-2">✅ Data Retrieved:</h4>
                    <pre className="text-xs text-green-800 overflow-auto max-h-40">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                </div>
            )}

            {extra}
        </div>
    );
}
