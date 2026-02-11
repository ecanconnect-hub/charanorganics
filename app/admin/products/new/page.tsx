/**
 * Add New Product Page (Admin)
 * 
 * Form to add new products
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ImageCropper } from '@/components/admin/ImageCropper';
import toast from 'react-hot-toast';

// Fixed product image dimensions
const PRODUCT_IMAGE_WIDTH = 1600;
const PRODUCT_IMAGE_HEIGHT = 1200;

export default function AddProductPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showCropper, setShowCropper] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState('');
    const [sections, setSections] = useState<any[]>([]);
    const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([]);

    useEffect(() => {
        fetchSections();
    }, []);

    const fetchSections = async () => {
        const { data } = await supabase.from('sections' as any).select('id, title_en, section_id').order('display_order');
        if (data) setSections(data);
    };

    // Form fields
    const [productId, setProductId] = useState('');
    const [titleEn, setTitleEn] = useState('');
    const [titleTe, setTitleTe] = useState('');
    const [unitValue, setUnitValue] = useState('');
    const [unitType, setUnitType] = useState('ml');
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

    // Variants state
    const [variants, setVariants] = useState<any[]>([]);

    const addVariant = () => {
        setVariants([...variants, { label: '', price: '', mrp: '', shipping_charge: '', stock_quantity: '', enabled: true }]);
    };

    const removeVariant = (index: number) => {
        setVariants(variants.filter((_, i) => i !== index));
    };

    const updateVariant = (index: number, field: string, value: any) => {
        const newVariants = [...variants];
        newVariants[index][field] = value;
        setVariants(newVariants);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!e.target.files || e.target.files.length === 0) return;

            const file = e.target.files[0];

            // Create temporary URL for preview and cropping
            const tempUrl = URL.createObjectURL(file);
            setSelectedImageUrl(tempUrl);
            setShowCropper(true);
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error('Failed to load image');
        }
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
                    throw new Error('All variants must have a label and price');
                }
            }

            const { data: productData, error } = await supabase.from('products' as any).insert({
                product_id: productId,
                title_en: titleEn,
                title_te: titleTe || titleEn,
                unit_value: unitValue ? parseFloat(unitValue) : null,
                unit_type: unitValue ? unitType : null,
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
                is_active: true,
            } as any).select();

            if (error) throw error;

            const dbProductId = (productData[0] as any).id;

            // Save Sections
            if (productData && productData[0] && selectedSectionIds.length > 0) {
                const sectionsToInsert = selectedSectionIds.map(sectionId => ({
                    product_id: dbProductId,
                    section_id: sectionId
                }));

                const { error: sectionError } = await supabase
                    .from('product_sections' as any)
                    .insert(sectionsToInsert as any);

                if (sectionError) console.error('Error adding sections:', sectionError);
            }

            // Save Variants
            if (variants.length > 0) {
                const variantsToInsert = variants.map(v => ({
                    product_id: dbProductId,
                    label: v.label,
                    price: parseFloat(v.price),
                    mrp: v.mrp ? parseFloat(v.mrp) : null,
                    shipping_charge: v.shipping_charge ? parseFloat(v.shipping_charge) : null,
                    stock_quantity: v.stock_quantity ? parseInt(v.stock_quantity) : null,
                    enabled: v.enabled
                }));

                const { error: variantError } = await supabase
                    .from('product_variants' as any)
                    .insert(variantsToInsert as any);

                if (variantError) throw variantError;
            }

            toast.success('Product added successfully!');
            router.push('/admin/products');
        } catch (error: any) {
            console.error('Error:', error);
            toast.error(error.message || 'Failed to add product');
        } finally {
            setLoading(false);
        }
    };

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
                        <h1 className="text-2xl font-bold">Add New Product</h1>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-4xl">
                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Product ID */}
                        <div className="md:col-span-2">
                            <Input
                                label="Product ID *"
                                value={productId}
                                onChange={(e) => setProductId(e.target.value)}
                                placeholder="e.g., PROD001"
                                required
                                helperText="Unique identifier for the product"
                            />
                        </div>

                        {/* Title English */}
                        <Input
                            label="Title (English) *"
                            value={titleEn}
                            onChange={(e) => setTitleEn(e.target.value)}
                            placeholder="e.g., Organic Turmeric Powder"
                            required
                        />

                        {/* Title Telugu */}
                        <Input
                            label="Title (Telugu)"
                            value={titleTe}
                            onChange={(e) => setTitleTe(e.target.value)}
                            placeholder="e.g., సేంద్రీయ పసుపు పొడి"
                        />

                        {/* Unit/Weight Section */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Product Unit/Weight (Optional)
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    value={unitValue}
                                    onChange={(e) => setUnitValue(e.target.value)}
                                    placeholder="100"
                                    step="0.01"
                                    className="flex-1"
                                />
                                <select
                                    value={unitType}
                                    onChange={(e) => setUnitType(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                                >
                                    <option value="ml">ml (milliliters)</option>
                                    <option value="l">L (liters)</option>
                                    <option value="gm">gm (grams)</option>
                                    <option value="kg">kg (kilograms)</option>
                                    <option value="pcs">pcs (pieces)</option>
                                </select>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">e.g., 100 ml or 500 gm</p>
                        </div>

                        <div></div> {/* Empty div for grid spacing */}

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
                                placeholder="Product description..."
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
                                placeholder="Product description in Telugu..."
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
                            placeholder="299"
                            required
                            step="0.01"
                        />

                        <Input
                            type="number"
                            label="Base Selling Price (₹) *"
                            value={currentPrice}
                            onChange={(e) => setCurrentPrice(e.target.value)}
                            placeholder="249"
                            required
                            step="0.01"
                        />

                        {/* Stock & Shipping */}
                        <Input
                            type="number"
                            label="Default Stock Quantity *"
                            value={stockQuantity}
                            onChange={(e) => setStockQuantity(e.target.value)}
                            placeholder="100"
                            required
                        />

                        <Input
                            type="number"
                            label="Default Shipping Charges (₹) *"
                            value={shippingCharges}
                            onChange={(e) => setShippingCharges(e.target.value)}
                            placeholder="40"
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

                            {variants.length > 0 ? (
                                <div className="space-y-4">
                                    {variants.map((v, index) => (
                                        <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 relative">
                                            <div className="md:col-span-2">
                                                <Input
                                                    label="Label (e.g. 100g) *"
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
                            ) : (
                                <p className="text-sm text-gray-500 italic">No variants added. Product will use base price.</p>
                            )}
                        </div>

                        {/* Image Section */}
                        <div className="md:col-span-2 border-t pt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Product Image (Required) *</label>
                            <p className="text-xs text-gray-500 mb-2">Recommended size: {PRODUCT_IMAGE_WIDTH}x{PRODUCT_IMAGE_HEIGHT}px</p>
                            <Input
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="https://example.com/image.jpg"
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Additional Information (English)
                            </label>
                            <textarea
                                value={additionalInfoEn}
                                onChange={(e) => setAdditionalInfoEn(e.target.value)}
                                placeholder="More details about the product..."
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Additional Information (Telugu)
                            </label>
                            <textarea
                                value={additionalInfoTe}
                                onChange={(e) => setAdditionalInfoTe(e.target.value)}
                                placeholder="Additional details in Telugu..."
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
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">How to Use</label>
                            <textarea
                                value={usageEn}
                                onChange={(e) => setUsageEn(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="mt-8 flex gap-4">
                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            isLoading={loading}
                            className="flex-1"
                        >
                            Add Product
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
