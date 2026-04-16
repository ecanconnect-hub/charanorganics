/**
 * Edit Category
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ImageCropper } from '@/components/admin/ImageCropper';
import toast from 'react-hot-toast';

// Fixed category image dimensions
const CATEGORY_IMAGE_WIDTH = 1600;
const CATEGORY_IMAGE_HEIGHT = 1200;

export default function EditCategoryPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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

    const fetchCategory = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('sections' as any)
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                setFormData({
                    section_id: (data as any).section_id,
                    title_en: (data as any).title_en,
                    title_te: (data as any).title_te,
                    subtitle_en: (data as any).subtitle_en || '',
                    subtitle_te: (data as any).subtitle_te || '',
                    description_en: (data as any).description_en || '',
                    description_te: (data as any).description_te || '',
                    display_order: (data as any).display_order || 0,
                    image_url: (data as any).image_url || '',
                });
            }
        } catch (error) {
            console.error('Error fetching category:', error);
            toast.error('Failed to load category');
            router.push('/admin/categories');
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        if (id) {
            void fetchCategory();
        }
    }, [fetchCategory, id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!e.target.files || e.target.files.length === 0) return;

            const file = e.target.files[0];
            setUploading(true);

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `categories/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('products')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, image_url: publicUrl }));
            toast.success('Image uploaded!');
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error('Failed to upload image. Try pasting a URL instead.');
        } finally {
            setUploading(false);
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
        setSaving(true);

        try {
            console.log('Updating category with data:', formData);

            const { data, error } = await (supabase
                .from('sections' as any) as any)
                .update({
                    section_id: formData.section_id,
                    title_en: formData.title_en,
                    title_te: formData.title_te,
                    subtitle_en: formData.subtitle_en,
                    subtitle_te: formData.subtitle_te,
                    description_en: formData.description_en,
                    description_te: formData.description_te,
                    display_order: formData.display_order,
                    image_url: formData.image_url
                })
                .eq('id', id)
                .select();

            console.log('Update result:', { data, error });

            if (error) throw error;

            toast.success('Category updated successfully!');
            router.push('/admin/categories');
        } catch (error: any) {
            console.error('Error updating category:', error);
            toast.error(error.message || 'Failed to update category');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <h1 className="text-2xl font-bold mb-6">Edit Category</h1>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-md">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Input
                            label="Category Title (English) *"
                            name="title_en"
                            value={formData.title_en}
                            onChange={handleChange}
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

                        <Input
                            name="image_url"
                            value={formData.image_url || ''}
                            onChange={handleChange}
                            placeholder="https://example.com/image.jpg"
                        />
                        <p className="text-xs text-gray-500 mt-1">Paste a direct link to an image.</p>

                        {formData.image_url && !formData.image_url.includes('data:') && (
                            <div className="mt-2">
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
                                <div className="mt-2">
                                    <p className="text-xs text-gray-500 mb-1">Preview:</p>
                                    <img src={formData.image_url} alt="Preview" className="h-20 w-auto inline-block object-cover rounded border" />
                                </div>
                            </div>
                        )}
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
                        disabled={saving || uploading}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
