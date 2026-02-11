/**
 * Admin Products Management - Premium Design
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

export default function AdminProductsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [products, setProducts] = useState<any[]>([]);
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

        fetchProducts();
    };

    const fetchProducts = async () => {
        setLoading(true);
        const { data } = await (supabase
            .from('products') as any)
            .select('*')
            .order('created_at', { ascending: false });

        setProducts(data || []);
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        const { error } = await (supabase
            .from('products') as any)
            .delete()
            .eq('id', id);

        if (error) {
            toast.error('Failed to delete product');
        } else {
            toast.success('Product deleted successfully');
            fetchProducts();
        }
    };

    const toggleActive = async (id: string, currentStatus: boolean) => {
        const { error } = await (supabase
            .from('products') as any)
            .update({ is_active: !currentStatus })
            .eq('id', id);

        if (error) {
            toast.error('Failed to update product');
        } else {
            toast.success(`Product ${!currentStatus ? 'activated' : 'deactivated'}`);
            fetchProducts();
        }
    };

    const handleToggleFlag = async (id: string, field: string, currentValue: boolean) => {
        const { error } = await (supabase
            .from('products') as any)
            .update({ [field]: !currentValue })
            .eq('id', id);

        if (error) {
            toast.error(`Failed to update ${field}`);
        } else {
            toast.success('Status updated');
            fetchProducts();
        }
    };

    if (loading) {
        return (
            <AdminLayout title="Products" subtitle="Manage your product catalog">
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Products" subtitle="Manage your product catalog">
            {/* Add Product Button */}
            <div className="mb-6 flex justify-end animate-fade-in">
                <Link href="/admin/products/new">
                    <Button variant="primary" size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
                        + Add New Product
                    </Button>
                </Link>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product, index) => (
                    <div
                        key={product.id}
                        className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden animate-slide-up"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        {/* Product Image */}
                        <div className="aspect-square bg-gray-100 relative group">
                            {product.image_url ? (
                                <Image
                                    src={product.image_url}
                                    alt={product.title_en}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                                    📦
                                </div>
                            )}
                            {/* Status Badges */}
                            <div className="absolute top-3 left-3 flex flex-col gap-2">
                                <button
                                    onClick={() => handleToggleFlag(product.id, 'is_best_seller', product.is_best_seller)}
                                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg transition-all ${product.is_best_seller
                                        ? 'bg-amber-400 text-white scale-100'
                                        : 'bg-white/50 text-gray-500 scale-90 backdrop-blur-sm'
                                        }`}
                                >
                                    Best Seller
                                </button>
                                <button
                                    onClick={() => handleToggleFlag(product.id, 'is_new', product.is_new)}
                                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg transition-all ${product.is_new
                                        ? 'bg-indigo-500 text-white scale-100'
                                        : 'bg-white/50 text-gray-500 scale-90 backdrop-blur-sm'
                                        }`}
                                >
                                    New
                                </button>
                            </div>
                            <div className="absolute top-3 right-3">
                                <button
                                    onClick={() => toggleActive(product.id, product.is_active)}
                                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${product.is_active
                                        ? 'bg-green-500 text-white'
                                        : 'bg-red-500 text-white'
                                        }`}
                                >
                                    {product.is_active ? 'Active' : 'Inactive'}
                                </button>
                            </div>
                        </div>

                        {/* Product Details */}
                        <div className="p-5 space-y-3">
                            {/* Product ID */}
                            <p className="font-mono text-xs text-indigo-600 font-semibold">
                                #{product.product_id}
                            </p>

                            {/* Title */}
                            <div>
                                <h3 className="font-bold text-gray-900 line-clamp-2 mb-1">
                                    {product.title_en}
                                </h3>
                                <p className="text-sm text-gray-600 line-clamp-1">
                                    {product.title_te}
                                </p>
                                {/* Unit Display */}
                                {product.unit_value && product.unit_type && (
                                    <p className="text-xs text-indigo-600 font-semibold mt-1">
                                        📦 {product.unit_value} {product.unit_type}
                                    </p>
                                )}
                            </div>

                            {/* Price & Stock */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xl font-bold text-indigo-600">
                                        ₹{product.current_price}
                                    </p>
                                    {product.mrp > product.current_price && (
                                        <p className="text-sm text-gray-500 line-through">
                                            ₹{product.mrp}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">Stock</p>
                                    <p className={`font-bold ${product.stock_quantity > 10 ? 'text-green-600' :
                                        product.stock_quantity > 0 ? 'text-yellow-600' :
                                            'text-red-600'
                                        }`}>
                                        {product.stock_quantity}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-3 border-t border-gray-100">
                                <Link href={`/admin/products/edit/${product.id}`} className="flex-1">
                                    <button className="w-full bg-indigo-50 text-indigo-600 font-semibold py-2 rounded-lg hover:bg-indigo-100 transition-colors">
                                        Edit
                                    </button>
                                </Link>
                                <button
                                    onClick={() => handleDelete(product.id)}
                                    className="flex-1 bg-red-50 text-red-600 font-semibold py-2 rounded-lg hover:bg-red-100 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {products.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
                    <div className="text-6xl mb-4">📦</div>
                    <p className="text-xl font-bold text-gray-900 mb-2">No Products Yet</p>
                    <p className="text-gray-600 mb-6">Start adding products to your catalog</p>
                    <Link href="/admin/products/new">
                        <Button variant="primary" size="lg">
                            Add Your First Product
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
