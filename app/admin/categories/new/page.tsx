/**
 * Add New Category
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ImageCropper } from '@/components/admin/ImageCropper';
import toast from 'react-hot-toast';

// Fixed category image dimensions
const CATEGORY_IMAGE_WIDTH = 1600;
const CATEGORY_IMAGE_HEIGHT = 1200;

export default function NewCategoryPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showCropper, setShowCropper] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState('');
    const [formData, setFormData] = useState({
        section_id: '',
        title_en: '',
        title_te: '',
        subtitle_en: '',
        subtitle_te: '',
        description_en: '',
        description_te: '',
        display_order: 0,
        image_url: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Auto-generate ID from English title
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const title = e.target.value;
        const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        setFormData(prev => ({
            ...prev,
            title_en: title,
            section_id: id
        }));
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
        setFormData(prev => ({ ...prev, image_url: croppedImage }));
        setShowCropper(false);
        toast.success('Image cropped successfully!');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!formData.section_id || !formData.title_en || !formData.title_te) {
                throw new Error('Please fill in all required fields (ID, English Title, Telugu Title)');
            }

            const { error } = await supabase
                .from('sections' as any)
                .insert([{
                    ...formData,
                    is_enabled: true
                }]);

            if (error) throw error;

            toast.success('Category created successfully!');
            router.push('/admin/categories');
        } catch (error: any) {
            console.error('Error:', error);
            toast.error(error.message || 'Failed to create category');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <h1 className="text-2xl font-bold mb-6">Add New Category</h1>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-md">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Input
                            label="Category Title (English) *"
                            name="title_en"
                            value={formData.title_en}
                            onChange={handleTitleChange}
                            required
                        />
                    </div>
                    <div>
                        <Input
                            label="Category ID *"
                            name="section_id"
                            value={formData.section_id}
                            onChange={handleChange}
                            required
                            placeholder="e.g. hair-care"
                        />
                    </div>
                </div>

                <div>
                    <Input
                        label="Category Title (Telugu) *"
                        name="title_te"
                        value={formData.title_te}
                        onChange={handleChange}
                        required
                        placeholder="e.g. కేశ సంరక్షణ"
                    />
                </div>

                {/* Descriptions */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description (English)</label>
                        <textarea
                            name="description_en"
                            value={formData.description_en}
                            onChange={handleChange}
                            rows={3}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description (Telugu)</label>
                        <textarea
                            name="description_te"
                            value={formData.description_te}
                            onChange={handleChange}
                            rows={3}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        />
                    </div>
                </div>

                {/* Subtitles (Optional) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Subtitle (English)"
                        name="subtitle_en"
                        value={formData.subtitle_en}
                        onChange={handleChange}
                    />
                    <Input
                        label="Subtitle (Telugu)"
                        name="subtitle_te"
                        value={formData.subtitle_te}
                        onChange={handleChange}
                    />
                </div>

                {/* Order & Image */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                        <input
                            type="number"
                            name="display_order"
                            value={formData.display_order}
                            onChange={handleChange}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category Image (Required) *</label>
                        <p className="text-xs text-gray-500 mb-2">
                            Recommended size: {CATEGORY_IMAGE_WIDTH}x{CATEGORY_IMAGE_HEIGHT}px (3:2 ratio)
                        </p>

                        {/* Image URL Input */}
                        <div>
                            <Input
                                name="image_url"
                                value={formData.image_url}
                                onChange={handleChange}
                                placeholder="https://example.com/image.jpg"
                            />
                            <p className="text-xs text-gray-400 mt-1">Paste a direct link to an image.</p>
                            {formData.image_url && !formData.image_url.includes('data:') && (
                                <>
                                    <Button
                                        type="button"
                                        variant="primary"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedImageUrl(formData.image_url);
                                            setShowCropper(true);
                                        }}
                                        className="mt-2"
                                    >
                                        Crop This Image
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setFormData(prev => ({ ...prev, image_url: '' }));
                                        }}
                                        className="mt-2 ml-2"
                                    >
                                        Remove Image
                                    </Button>
                                    <div className="mt-2">
                                        <p className="text-xs text-gray-500 mb-1">Preview:</p>
                                        <img src={formData.image_url} alt="Preview" className="h-20 w-auto inline-block object-cover rounded border" />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Image Cropper Modal */}
                {showCropper && (
                    <ImageCropper
                        image={selectedImageUrl}
                        width={CATEGORY_IMAGE_WIDTH}
                        height={CATEGORY_IMAGE_HEIGHT}
                        onCropComplete={handleCropComplete}
                        onCancel={() => {
                            setShowCropper(false);
                            URL.revokeObjectURL(selectedImageUrl);
                        }}
                    />
                )}

                <div className="flex justify-end gap-4 pt-4 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={loading || uploading}
                    >
                        {loading ? 'Creating...' : 'Create Category'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
