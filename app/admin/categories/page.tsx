/**
 * Admin Categories Management
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/context';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

type SectionRow = Database['public']['Tables']['sections']['Row'];
type ViewMode = 'grid' | 'list';

export default function AdminCategoriesPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [sections, setSections] = useState<SectionRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [mobileGridCols, setMobileGridCols] = useState<1 | 2>(2);

    useEffect(() => {
        void checkAdmin();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const checkAdmin = async () => {
        if (!user) {
            router.push('/login');
            return;
        }

        const { data: profileData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileData?.role !== 'admin') {
            router.push('/');
            return;
        }

        await fetchSections();
    };

    const fetchSections = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('sections')
            .select('*')
            .order('created_at', { ascending: false });

        setSections((data || []) as SectionRow[]);
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this category?')) return;

        const { error } = await supabase
            .from('sections')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error('Failed to delete category');
            return;
        }

        toast.success('Category deleted successfully');
        await fetchSections();
    };

    const categoriesWithDescriptions = useMemo(
        () => sections.filter((section) => Boolean(section.description_en?.trim())).length,
        [sections]
    );

    if (loading) {
        return (
            <AdminLayout title="Categories" subtitle="Manage product categories">
                <div className="flex items-center justify-center py-20">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Categories" subtitle="Manage product categories">
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="rounded-lg bg-gray-100 px-3 py-1 font-semibold">Total: {sections.length}</span>
                        <span className="rounded-lg bg-indigo-100 px-3 py-1 font-semibold text-indigo-700">With description: {categoriesWithDescriptions}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-white'}`}
                            >
                                Grid
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-white'}`}
                            >
                                List
                            </button>
                        </div>
                        {viewMode === 'grid' && (
                            <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
                                <button
                                    onClick={() => setMobileGridCols(1)}
                                    className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${mobileGridCols === 1 ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-white'}`}
                                >
                                    Single
                                </button>
                                <button
                                    onClick={() => setMobileGridCols(2)}
                                    className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${mobileGridCols === 2 ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-white'}`}
                                >
                                    Double
                                </button>
                            </div>
                        )}
                        <Link href="/admin/categories/new">
                            <Button variant="primary" size="md">+ Add Category</Button>
                        </Link>
                    </div>
                </div>
            </div>

            {viewMode === 'grid' ? (
                <div className={`grid gap-3 md:grid-cols-2 md:gap-6 xl:grid-cols-3 ${mobileGridCols === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {sections.map((section) => (
                        <div key={section.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg">
                            <div className="relative aspect-video bg-gradient-to-br from-indigo-100 to-purple-100">
                                {section.image_url ? (
                                    <Image
                                        src={section.image_url}
                                        alt={section.title_en}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-sm text-indigo-500">No image</div>
                                )}
                            </div>
                            <div className="space-y-2 p-3 md:space-y-3 md:p-5">
                                <p className="font-mono text-xs font-semibold text-indigo-600">#{section.section_id}</p>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 md:text-lg">{section.title_en}</h3>
                                    <p className="text-xs text-gray-600 md:text-sm">{section.title_te}</p>
                                </div>
                                {section.description_en && (
                                    <p className="line-clamp-2 text-xs text-gray-600 md:text-sm">{section.description_en}</p>
                                )}
                                <div className={`border-t border-gray-100 pt-2 ${mobileGridCols === 2 ? 'space-y-2' : 'flex gap-2'}`}>
                                    <Link href={`/admin/categories/edit/${section.id}`} className="flex-1">
                                        <button className="w-full rounded-lg bg-indigo-50 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 md:py-2 md:text-sm">Edit</button>
                                    </Link>
                                    <button
                                        onClick={() => void handleDelete(section.id)}
                                        className={`${mobileGridCols === 2 ? 'w-full' : 'flex-1'} rounded-lg bg-red-50 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 md:py-2 md:text-sm`}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px]">
                            <thead className="border-b border-gray-200 bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Category</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Section ID</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Description</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {sections.map((section) => (
                                    <tr key={section.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="relative h-12 w-16 overflow-hidden rounded-lg bg-gray-100">
                                                    {section.image_url ? (
                                                        <Image src={section.image_url} alt={section.title_en} fill className="object-cover" />
                                                    ) : null}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{section.title_en}</p>
                                                    <p className="text-xs text-gray-600">{section.title_te}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs font-semibold text-indigo-600">#{section.section_id}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{section.description_en || '-'}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <Link href={`/admin/categories/edit/${section.id}`}>
                                                    <button className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600">Edit</button>
                                                </Link>
                                                <button
                                                    onClick={() => void handleDelete(section.id)}
                                                    className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {sections.length === 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white py-20 text-center">
                    <p className="mb-2 text-xl font-bold text-gray-900">No Categories Yet</p>
                    <p className="mb-6 text-gray-600">Start organizing your products into categories</p>
                    <Link href="/admin/categories/new">
                        <Button variant="primary" size="lg">Add Your First Category</Button>
                    </Link>
                </div>
            )}
        </AdminLayout>
    );
}
