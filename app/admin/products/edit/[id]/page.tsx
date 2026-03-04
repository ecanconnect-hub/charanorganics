/**
 * Edit Product Page (Admin)
 * 
 * Form to edit existing products
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ImageCropper } from '@/components/admin/ImageCropper';
import toast from 'react-hot-toast';

// Fixed product image dimensions
const PRODUCT_IMAGE_WIDTH = 1600;
const PRODUCT_IMAGE_HEIGHT = 1200;

const isMissingAdditionalInfoTeColumn = (error: unknown): boolean => {
    if (!error || typeof error !== 'object') return false;
    const candidate = error as { code?: string; message?: string };
    return candidate.code === '42703' && (candidate.message || '').toLowerCase().includes('additional_info_te');
};

export default function EditProductPage() {
    const router = useRouter();
    const params = useParams();
    const productId = params.id as string;

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showCropper, setShowCropper] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState('');

    // Form fields
    const [titleEn, setTitleEn] = useState('');
    const [titleTe, setTitleTe] = useState('');
    const [descriptionEn, setDescriptionEn] = useState('');
    const [descriptionTe, setDescriptionTe] = useState('');
    const [mrp, setMrp] = useState('');
    const [currentPrice, setCurrentPrice] = useState('');
    const [stockQuantity, setStockQuantity] = useState('');
    const [shippingCharges, setShippingCharges] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [specificationsEn, setSpecificationsEn] = useState('');
    const [usageEn, setUsageEn] = useState('');
    const [additionalInfoEn, setAdditionalInfoEn] = useState('');
    const [additionalInfoTe, setAdditionalInfoTe] = useState('');

    // Variants
    const [variants, setVariants] = useState<any[]>([]);

    // Categories
    const [sections, setSections] = useState<any[]>([]);
    const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([]);

    useEffect(() => {
        if (productId) {
            fetchAllData();
        }
    }, [productId]);

    const fetchAllData = async () => {
        try {
            // Fetch All Sections
            const { data: allSections } = await supabase.from('sections' as any).select('id, title_en').order('display_order');
            if (allSections) setSections(allSections);

            // Fetch Product
            const { data: product, error } = await supabase
                .from('products' as any)
                .select('*')
                .eq('id', productId)
                .single();

            if (error) throw error;

            if (product) {
                const p = product as any;
                setTitleEn(p.title_en || '');
                setTitleTe(p.title_te || '');
                setDescriptionEn(p.description_en || '');
                setDescriptionTe(p.description_te || '');
                setMrp(p.mrp?.toString() || '');
                setCurrentPrice(p.current_price?.toString() || '');
                setStockQuantity(p.stock_quantity?.toString() || '');
                setShippingCharges(p.shipping_charges?.toString() || '');
                setImageUrl(p.image_url || '');
                setSpecificationsEn(p.specifications_en || '');
                setUsageEn(p.usage_en || '');
                setAdditionalInfoEn(p.additional_info_en || '');
                setAdditionalInfoTe(p.additional_info_te || '');
            }

            // Fetch Assigned Sections
            const { data: assignedSections } = await supabase
                .from('product_sections' as any)
                .select('section_id')
                .eq('product_id', productId);

            if (assignedSections) {
                setSelectedSectionIds(assignedSections.map((s: any) => s.section_id));
            }

            // Fetch Variants
            const { data: variantData } = await supabase
                .from('product_variants')
                .select('*')
                .eq('product_id', productId)
                .order('price', { ascending: true });

            if (variantData) {
                setVariants(variantData.map((v: any) => ({
                    ...v,
                    price: v.price.toString(),
                    mrp: v.mrp?.toString() || '',
                    shipping_charge: v.shipping_charge?.toString() || '',
                    stock_quantity: v.stock_quantity?.toString() || ''
                })));
            }

        } catch (error: any) {
            console.error('Error:', error);
            toast.error('Failed to load product data');
        } finally {
            setFetching(false);
        }
    };

    const addVariant = () => {
        setVariants([...variants, { id: null, label: '', price: '', mrp: '', shipping_charge: '', stock_quantity: '', enabled: true }]);
    };

    const removeVariant = (index: number) => {
        setVariants(variants.filter((_, i) => i !== index));
    };

    const updateVariant = (index: number, field: string, value: any) => {
        const newVariants = [...variants];
        newVariants[index][field] = value;
        setVariants(newVariants);
    };

    const handleCropComplete = async (croppedImage: string) => {
        // Use the base64 image directly without uploading
        setImageUrl(croppedImage);
        setShowCropper(false);
        toast.success('Image cropped successfully!');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validate variants
            for (const v of variants) {
                if (!v.label || !v.price) {
                    throw new Error('All variants must have label and price');
                }
            }

            // Update Product
            const productPayload = {
                title_en: titleEn,
                title_te: titleTe || titleEn,
                description_en: descriptionEn,
                description_te: descriptionTe || descriptionEn,
                specifications_en: specificationsEn,
                usage_en: usageEn,
                additional_info_en: additionalInfoEn,
                additional_info_te: additionalInfoTe || additionalInfoEn,
                mrp: parseFloat(mrp),
                current_price: parseFloat(currentPrice),
                stock_quantity: parseInt(stockQuantity),
                shipping_charges: parseFloat(shippingCharges),
                image_url: imageUrl,
            };

            let { error } = await (supabase.from('products') as any)
                .update(productPayload as any)
                .eq('id', productId);

            if (error && isMissingAdditionalInfoTeColumn(error)) {
                const fallbackPayload = { ...productPayload } as Record<string, unknown>;
                delete fallbackPayload.additional_info_te;
                const retry = await (supabase.from('products') as any)
                    .update(fallbackPayload as any)
                    .eq('id', productId);
                error = retry.error;
            }

            if (error) throw error;

            // Update Categories: Delete all existing and insert new
            await supabase
                .from('product_sections' as any)
                .delete()
                .eq('product_id', productId);

            if (selectedSectionIds.length > 0) {
                const sectionsToInsert = selectedSectionIds.map(sectionId => ({
                    product_id: productId,
                    section_id: sectionId
                }));

                await supabase
                    .from('product_sections' as any)
                    .insert(sectionsToInsert as any);
            }

            // Update Variants: Delete all existing and insert new
            await supabase
                .from('product_variants' as any)
                .delete()
                .eq('product_id', productId);

            if (variants.length > 0) {
                const variantsToInsert = variants.map(v => ({
                    product_id: productId,
                    label: v.label,
                    price: parseFloat(v.price),
                    mrp: v.mrp ? parseFloat(v.mrp) : null,
                    shipping_charge: v.shipping_charge ? parseFloat(v.shipping_charge) : null,
                    stock_quantity: v.stock_quantity ? parseInt(v.stock_quantity) : null,
                    enabled: v.enabled
                }));

                await supabase
                    .from('product_variants' as any)
                    .insert(variantsToInsert as any);
            }

            toast.success('Product updated successfully!');
            router.push('/admin/products');
        } catch (error: any) {
            console.error('Error:', error);
            toast.error(error.message || 'Failed to update product');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/products">
                            <Button variant="outline" size="sm">
                                ← Back to Products
                            </Button>
                        </Link>
                        <h1 className="text-2xl font-bold">Edit Product</h1>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-4xl">
                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Title English */}
                        <Input
                            label="Title (English) *"
                            value={titleEn}
                            onChange={(e) => setTitleEn(e.target.value)}
                            required
                        />

                        {/* Title Telugu */}
                        <Input
                            label="Title (Telugu)"
                            value={titleTe}
                            onChange={(e) => setTitleTe(e.target.value)}
                        />

                        {/* Categories Selection */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Categories (Select Multiple)
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border border-gray-200 p-4 rounded-lg bg-gray-50 max-h-48 overflow-y-auto">
                                {sections.map((section) => (
                                    <label key={section.id} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-white rounded transition">
                                        <input
                                            type="checkbox"
                                            checked={selectedSectionIds.includes(section.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedSectionIds(prev => [...prev, section.id]);
                                                } else {
                                                    setSelectedSectionIds(prev => prev.filter(id => id !== section.id));
                                                }
                                            }}
                                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                        />
                                        <span className="text-sm text-gray-700">{section.title_en}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Description English */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description (English) *
                            </label>
                            <textarea
                                value={descriptionEn}
                                onChange={(e) => setDescriptionEn(e.target.value)}
                                required
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        {/* Description Telugu */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description (Telugu)
                            </label>
                            <textarea
                                value={descriptionTe}
                                onChange={(e) => setDescriptionTe(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        {/* Base MRP & Price */}
                        <Input
                            type="number"
                            label="Base MRP (₹) *"
                            value={mrp}
                            onChange={(e) => setMrp(e.target.value)}
                            required
                            step="0.01"
                        />

                        <Input
                            type="number"
                            label="Base Selling Price (₹) *"
                            value={currentPrice}
                            onChange={(e) => setCurrentPrice(e.target.value)}
                            required
                            step="0.01"
                        />

                        {/* Stock & Shipping */}
                        <Input
                            type="number"
                            label="Default Stock Quantity *"
                            value={stockQuantity}
                            onChange={(e) => setStockQuantity(e.target.value)}
                            required
                        />

                        <Input
                            type="number"
                            label="Default Shipping Charges (₹) *"
                            value={shippingCharges}
                            onChange={(e) => setShippingCharges(e.target.value)}
                            required
                            step="0.01"
                        />

                        {/* Variants Management */}
                        <div className="md:col-span-2 border-t pt-6 mt-2">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold">Product Variants / Sizes (Optional)</h3>
                                <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                                    + Add Variant
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {variants.map((v, index) => (
                                    <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 relative">
                                        <div className="md:col-span-2">
                                            <Input
                                                label="Label *"
                                                value={v.label}
                                                onChange={(e) => updateVariant(index, 'label', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Input
                                                type="number"
                                                label="Price *"
                                                value={v.price}
                                                onChange={(e) => updateVariant(index, 'price', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Input
                                                type="number"
                                                label="MRP"
                                                value={v.mrp}
                                                onChange={(e) => updateVariant(index, 'mrp', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Input
                                                type="number"
                                                label="Stock"
                                                value={v.stock_quantity}
                                                onChange={(e) => updateVariant(index, 'stock_quantity', e.target.value)}
                                            />
                                        </div>
                                        <div className="flex items-end pb-2">
                                            <Button type="button" variant="outline" size="sm" onClick={() => removeVariant(index)} className="text-red-500 border-red-200 hover:bg-red-50 w-full">
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Image Section */}
                        <div className="md:col-span-2 border-t pt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Product Image (Required) *</label>
                            <Input
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                required
                            />
                            {imageUrl && (
                                <div className="mt-2 flex gap-4 items-end">
                                    <img src={imageUrl} alt="Preview" className="h-24 w-24 object-cover rounded border" />
                                    <Button type="button" variant="outline" size="sm" onClick={() => setShowCropper(true)}>Crop Image</Button>
                                </div>
                            )}
                        </div>

                        {/* Additional Info */}
                        <div className="md:col-span-2 border-t pt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Additional Information (English)</label>
                            <textarea
                                value={additionalInfoEn}
                                onChange={(e) => setAdditionalInfoEn(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Additional Information (Telugu)</label>
                            <textarea
                                value={additionalInfoTe}
                                onChange={(e) => setAdditionalInfoTe(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        {/* Specifications & Usage */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Specifications</label>
                            <textarea
                                value={specificationsEn}
                                onChange={(e) => setSpecificationsEn(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">How to Use</label>
                            <textarea
                                value={usageEn}
                                onChange={(e) => setUsageEn(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Image Cropper Modal */}
                    {showCropper && (
                        <ImageCropper
                            image={selectedImageUrl}
                            width={PRODUCT_IMAGE_WIDTH}
                            height={PRODUCT_IMAGE_HEIGHT}
                            onCropComplete={handleCropComplete}
                            onCancel={() => setShowCropper(false)}
                        />
                    )}

                    {/* Submit Buttons */}
                    <div className="mt-8 flex gap-4">
                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            isLoading={loading}
                            className="flex-1"
                        >
                            Update Product
                        </Button>
                        <Link href="/admin/products" className="flex-1">
                            <Button variant="outline" size="lg" fullWidth>Cancel</Button>
                        </Link>
                    </div>
                </form>
            </main>
        </div>
    );
}
