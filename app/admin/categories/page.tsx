/**
 * Admin Categories Management - Premium Design
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/context';
import { supabase } from '@/lib/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function AdminCategoriesPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [sections, setSections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAdmin();
    }, [user]);

    const checkAdmin = async () => {
        if (!user) {
            router.push('/login');
            return;
        }

        const profileRes: any = await (supabase
            .from('profiles' as any)
            .select('role')
            .eq('id', user.id)
            .single() as any);

        const adminRole = profileRes?.data?.role;

        if (adminRole !== 'admin') {
            router.push('/');
            return;
        }

        fetchSections();
    };

    const fetchSections = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('sections')
            .select('*')
            .order('created_at', { ascending: false });

        setSections(data || []);
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this category?')) return;

        const { error } = await (supabase
            .from('sections' as any) as any)
            .delete()
            .eq('id', id);

        if (error) {
            toast.error('Failed to delete category');
        } else {
            toast.success('Category deleted successfully');
            fetchSections();
        }
    };

    if (loading) {
        return (
            <AdminLayout title="Categories" subtitle="Manage product categories">
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Categories" subtitle="Manage product categories">
            {/* Add Category Button */}
            <div className="mb-6 flex justify-end animate-fade-in">
                <Link href="/admin/categories/new">
                    <Button variant="primary" size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
                        + Add New Category
                    </Button>
                </Link>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sections.map((section, index) => (
                    <div
                        key={section.id}
                        className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden animate-slide-up"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        {/* Category Image */}
                        <div className="aspect-video bg-gradient-to-br from-indigo-100 to-purple-100 relative group">
                            {section.image_url ? (
                                <Image
                                    src={section.image_url}
                                    alt={section.title_en}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-indigo-300 text-5xl">
                                    📁
                                </div>
                            )}
                        </div>

                        {/* Category Details */}
                        <div className="p-6 space-y-4">
                            {/* Section ID */}
                            <p className="font-mono text-xs text-indigo-600 font-semibold">
                                #{section.section_id}
                            </p>

                            {/* Title */}
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg mb-1">
                                    {section.title_en}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {section.title_te}
                                </p>
                            </div>

                            {/* Description */}
                            {section.description_en && (
                                <p className="text-sm text-gray-600 line-clamp-2">
                                    {section.description_en}
                                </p>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 pt-3 border-t border-gray-100">
                                <Link href={`/admin/categories/edit/${section.id}`} className="flex-1">
                                    <button className="w-full bg-indigo-50 text-indigo-600 font-semibold py-2 rounded-lg hover:bg-indigo-100 transition-colors">
                                        Edit
                                    </button>
                                </Link>
                                <button
                                    onClick={() => handleDelete(section.id)}
                                    className="flex-1 bg-red-50 text-red-600 font-semibold py-2 rounded-lg hover:bg-red-100 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {sections.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
                    <div className="text-6xl mb-4">📁</div>
                    <p className="text-xl font-bold text-gray-900 mb-2">No Categories Yet</p>
                    <p className="text-gray-600 mb-6">Start organizing your products into categories</p>
                    <Link href="/admin/categories/new">
                        <Button variant="primary" size="lg">
                            Add Your First Category
                        </Button>
                    </Link>
                </div>
            )}

            <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slide-up {
                    from { 
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out;
                }
                .animate-slide-up {
                    animation: slide-up 0.6s ease-out;
                }
            `}</style>
        </AdminLayout>
    );
}
