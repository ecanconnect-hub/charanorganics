/**
 * Admin Products Management
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

type ProductRow = Database['public']['Tables']['products']['Row'];
type ProductViewRow = ProductRow & {
    is_best_seller?: boolean | null;
    is_new?: boolean | null;
};
type ProfileRoleRow = Pick<Database['public']['Tables']['profiles']['Row'], 'role'>;
type ViewMode = 'grid' | 'list';

const formatCurrency = (value: number) => `Rs. ${Number(value || 0).toFixed(2)}`;

export default function AdminProductsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [products, setProducts] = useState<ProductViewRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [mobileGridCols, setMobileGridCols] = useState<1 | 2>(2);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        void checkAdmin();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const checkAdmin = async () => {
        if (!user) {
            router.push('/login');
            return;
        }

        const { data } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const profileData = data as ProfileRoleRow | null;

        if (profileData?.role !== 'admin') {
            router.push('/');
            return;
        }

        await fetchProducts();
    };

    const fetchProducts = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        setProducts((data || []) as ProductViewRow[]);
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error('Failed to delete product');
            return;
        }

        toast.success('Product deleted successfully');
        await fetchProducts();
    };

    const toggleActive = async (id: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('products')
            .update({ is_active: !currentStatus } as never)
            .eq('id', id);

        if (error) {
            toast.error('Failed to update product');
            return;
        }

        toast.success(`Product ${!currentStatus ? 'activated' : 'deactivated'}`);
        await fetchProducts();
    };

    const handleToggleFlag = async (
        id: string,
        field: 'is_best_seller' | 'is_new',
        currentValue: boolean | null | undefined
    ) => {
        const { error } = await supabase
            .from('products')
            .update({ [field]: !currentValue } as never)
            .eq('id', id);

        if (error) {
            toast.error(`Failed to update ${field}`);
            return;
        }

        toast.success('Status updated');
        await fetchProducts();
    };

    const totalActive = useMemo(() => products.filter((p) => p.is_active).length, [products]);
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();

    const visibleProducts = useMemo(() => {
        const sortedProducts = [...products].sort((a, b) => {
            const aKey = (a.title_en || a.title_te || a.product_id || '').toLowerCase();
            const bKey = (b.title_en || b.title_te || b.product_id || '').toLowerCase();
            return aKey.localeCompare(bKey, undefined, { sensitivity: 'base' });
        });

        if (!normalizedSearchQuery) {
            return sortedProducts;
        }

        return sortedProducts.filter((product) => {
            const searchableText = [
                product.product_id,
                product.title_en,
                product.title_te,
                product.description_en,
                product.description_te,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return searchableText.includes(normalizedSearchQuery);
        });
    }, [products, normalizedSearchQuery]);

    const activeVisible = useMemo(() => visibleProducts.filter((p) => p.is_active).length, [visibleProducts]);

    if (loading) {
        return (
            <AdminLayout title="Products" subtitle="Manage your product catalog">
                <div className="flex items-center justify-center py-20">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Products" subtitle="Manage your product catalog">
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="rounded-lg bg-gray-100 px-3 py-1 font-semibold">Total: {products.length}</span>
                        <span className="rounded-lg bg-green-100 px-3 py-1 font-semibold text-green-700">Active: {totalActive}</span>
                        <span className="rounded-lg bg-indigo-100 px-3 py-1 font-semibold text-indigo-700">Showing: {visibleProducts.length}</span>
                        {searchQuery.trim() && (
                            <span className="rounded-lg bg-teal-100 px-3 py-1 font-semibold text-teal-700">Active in view: {activeVisible}</span>
                        )}
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
                        <Link href="/admin/products/new">
                            <Button variant="primary" size="md">+ Add Product</Button>
                        </Link>
                    </div>
                </div>
                <div className="mt-4">
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search products by ID, English, Telugu, or description"
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                </div>
            </div>

            {viewMode === 'grid' ? (
                <div className={`grid gap-3 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3 2xl:grid-cols-4 ${mobileGridCols === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {visibleProducts.map((product) => (
                        <div key={product.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg">
                            <div className="relative aspect-square bg-gray-100">
                                {product.image_url ? (
                                    <Image
                                        src={product.image_url}
                                        alt={product.title_en}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">No image</div>
                                )}
                                <div className="absolute left-2 top-2 flex flex-col gap-1">
                                    <button
                                        onClick={() => void handleToggleFlag(product.id, 'is_best_seller', product.is_best_seller)}
                                        className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wide ${product.is_best_seller ? 'bg-amber-400 text-white' : 'bg-white/80 text-gray-600'}`}
                                    >
                                        Best Seller
                                    </button>
                                    <button
                                        onClick={() => void handleToggleFlag(product.id, 'is_new', product.is_new)}
                                        className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wide ${product.is_new ? 'bg-indigo-500 text-white' : 'bg-white/80 text-gray-600'}`}
                                    >
                                        New
                                    </button>
                                </div>
                                <button
                                    onClick={() => void toggleActive(product.id, product.is_active)}
                                    className={`absolute right-2 top-2 rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wide ${product.is_active ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
                                >
                                    {product.is_active ? 'Active' : 'Inactive'}
                                </button>
                            </div>

                            <div className="space-y-2 p-3 sm:space-y-3 sm:p-4">
                                <p className="font-mono text-xs font-semibold text-indigo-600">#{product.product_id}</p>
                                <div>
                                    <h3 className="line-clamp-2 text-sm font-bold text-gray-900 sm:text-base">{product.title_en}</h3>
                                    <p className="line-clamp-1 text-xs text-gray-600 sm:text-sm">{product.title_te}</p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-indigo-600 sm:text-lg">{formatCurrency(product.current_price)}</p>
                                        {product.mrp > product.current_price && (
                                            <p className="text-xs text-gray-500 line-through">{formatCurrency(product.mrp)}</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">Stock</p>
                                        <p className={`font-bold ${product.stock_quantity > 10 ? 'text-green-600' : product.stock_quantity > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                                            {product.stock_quantity}
                                        </p>
                                    </div>
                                </div>
                                <div className={`border-t border-gray-100 pt-2 ${mobileGridCols === 2 ? 'space-y-2' : 'flex gap-2'}`}>
                                    <Link href={`/admin/products/edit/${product.id}`} className="flex-1">
                                        <button className="w-full rounded-lg bg-indigo-50 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 sm:py-2 sm:text-sm">Edit</button>
                                    </Link>
                                    <button
                                        onClick={() => void handleDelete(product.id)}
                                        className={`${mobileGridCols === 2 ? 'w-full' : 'flex-1'} rounded-lg bg-red-50 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 sm:py-2 sm:text-sm`}
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
                        <table className="w-full min-w-[980px]">
                            <thead className="border-b border-gray-200 bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Product</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Price</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Stock</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Flags</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {visibleProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-gray-100">
                                                    {product.image_url ? (
                                                        <Image src={product.image_url} alt={product.title_en} fill className="object-cover" />
                                                    ) : null}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{product.title_en}</p>
                                                    <p className="font-mono text-xs text-indigo-600">#{product.product_id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatCurrency(product.current_price)}</td>
                                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{product.stock_quantity}</td>
                                        <td className="px-4 py-3 text-xs text-gray-700">
                                            {product.is_best_seller ? 'Best Seller ' : ''}
                                            {product.is_new ? 'New' : ''}
                                            {!product.is_best_seller && !product.is_new ? '-' : ''}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => void toggleActive(product.id, product.is_active)}
                                                className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${product.is_active ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
                                            >
                                                {product.is_active ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <Link href={`/admin/products/edit/${product.id}`}>
                                                    <button className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600">Edit</button>
                                                </Link>
                                                <button
                                                    onClick={() => void handleDelete(product.id)}
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

            {products.length === 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white py-20 text-center">
                    <p className="mb-2 text-xl font-bold text-gray-900">No Products Yet</p>
                    <p className="mb-6 text-gray-600">Start adding products to your catalog</p>
                    <Link href="/admin/products/new">
                        <Button variant="primary" size="lg">Add Your First Product</Button>
                    </Link>
                </div>
            )}
            {products.length > 0 && visibleProducts.length === 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center">
                    <p className="mb-2 text-xl font-bold text-gray-900">No matching products</p>
                    <p className="text-gray-600">Try a different search term.</p>
                </div>
            )}
        </AdminLayout>
    );
}
