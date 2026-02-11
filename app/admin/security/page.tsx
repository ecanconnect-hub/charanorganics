'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import toast from 'react-hot-toast';

type SecurityLog = {
    id: string;
    user_id: string;
    action_type: string;
    resource_type: string;
    ip_address: string;
    description: string;
    created_at: string;
    success: boolean;
    failure_reason: string;
    metadata: any;
    profile: {
        email: string;
        full_name: string;
    };
};

export default function SecurityLogsPage() {
    const [logs, setLogs] = useState<SecurityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchLogs();
    }, [filter]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            let query = (supabase
                .from('security_audit_log_view' as any) as any)
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (filter === 'blocked') {
                query = query.eq('success', false);
            } else if (filter === 'admin') {
                query = query.in('action_type', ['admin_access', 'admin_action']);
            }

            const { data, error } = await query;

            if (error) throw error;
            setLogs(data || []);
        } catch (error) {
            console.error('Error fetching logs:', error);
            toast.error('Failed to load security logs');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (success: boolean) => {
        return success
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800';
    };

    return (
        <AdminLayout title="Security Logs" subtitle="Monitor system access and potential threats">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Header & Filters */}
                <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all'
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            All Events
                        </button>
                        <button
                            onClick={() => setFilter('blocked')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'blocked'
                                ? 'bg-red-600 text-white'
                                : 'bg-red-50 text-red-600 hover:bg-red-100'
                                }`}
                        >
                            🚫 Blocked Attempts
                        </button>
                        <button
                            onClick={() => setFilter('admin')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'admin'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                                }`}
                        >
                            👮 Admin Activity
                        </button>
                    </div>
                    <button
                        onClick={fetchLogs}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                        title="Refresh Logs"
                    >
                        🔄
                    </button>
                </div>

                {/* Logs Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3">Timestamp</th>
                                <th className="px-6 py-3">User</th>
                                <th className="px-6 py-3">Action</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin mb-2"></div>
                                        <p>Loading security events...</p>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No security events found matching your filter.
                                    </td>

                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900">
                                                    {(log as any).full_name || 'Unknown User'}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {(log as any).email || log.user_id}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded border border-gray-200">
                                                {log.action_type}
                                            </span>
                                            <div className="text-xs text-gray-500 mt-1">
                                                Resource: {log.resource_type}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.success)}`}>
                                                {log.success ? 'SUCCESS' : 'BLOCKED'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs truncate text-gray-600">
                                            {log.failure_reason ? (
                                                <span className="text-red-600">{log.failure_reason}</span>
                                            ) : (
                                                JSON.stringify(log.metadata)
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
