'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { supabase } from '@/lib/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        checkAdmin();
    }, [user]);

    const checkAdmin = async () => {
        if (!user) {
            router.push('/login');
            return;
        }

        const { data: profile } = await supabase
            .from('profiles' as any)
            .select('role')
            .eq('id', user.id)
            .single() as { data: any, error: any };

        if (profile?.role !== 'admin') {
            router.push('/');
            return;
        }

        fetchProfiles();
    };

    const fetchProfiles = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            toast.error('Failed to fetch users');
        } else {
            setProfiles(data || []);
        }
        setLoading(false);
    };

    const toggleRole = async (profileId: string, currentRole: string) => {
        const newRole = currentRole === 'admin' ? 'customer' : 'admin';

        // Prevent self-demotion
        if (profileId === user?.id && currentRole === 'admin') {
            toast.error("You cannot remove your own admin access.");
            return;
        }

        const confirmed = confirm(`Change this user's role to ${newRole.toUpperCase()}?`);
        if (!confirmed) return;

        const { error } = await (supabase as any)
            .from('profiles')
            .update({ role: newRole })
            .eq('id', profileId);

        if (error) {
            toast.error('Failed to update role. Make sure you have run the security SQL script.');
            console.error(error);
        } else {
            toast.success(`User role updated to ${newRole}`);
            fetchProfiles();
        }
    };

    const filteredProfiles = profiles.filter(p =>
        p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading && profiles.length === 0) {
        return (
            <AdminLayout title="User Management" subtitle="Manage permissions and roles">
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="User Management" subtitle="Manage permissions and roles">
            <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:w-96">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                    />
                </div>
                <div className="text-sm text-gray-500 font-medium">
                    Total Users: {profiles.length}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 font-bold text-gray-700 text-sm">User Details</th>
                            <th className="px-6 py-4 font-bold text-gray-700 text-sm">Role</th>
                            <th className="px-6 py-4 font-bold text-gray-700 text-sm">Joined On</th>
                            <th className="px-6 py-4 font-bold text-gray-700 text-sm">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredProfiles.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">{p.full_name || 'No Name'}</div>
                                    <div className="text-xs text-gray-500">{p.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${p.role === 'admin'
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {p.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {new Date(p.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => toggleRole(p.id, p.role)}
                                        className={`text-sm font-bold transition-colors ${p.role === 'admin'
                                            ? 'text-red-600 hover:text-red-700'
                                            : 'text-indigo-600 hover:text-indigo-700'
                                            }`}
                                    >
                                        {p.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredProfiles.length === 0 && (
                    <div className="py-20 text-center text-gray-500">
                        No users found matching your search.
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
