/**
 * Product Review Submission Page
 * 
 * Allows logged-in users to submit a review for a product
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth/context';
import { useLocale } from '@/lib/i18n/context';
import toast from 'react-hot-toast';

export default function SubmitReviewPage() {
    const router = useRouter();
    const params = useParams();
    const productId = params.id as string;
    const { user } = useAuth();
    const locale = useLocale();

    const [product, setProduct] = useState<any>(null);
    const [rating, setRating] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            toast.error('Please login to write a review');
            router.push('/login');
            return;
        }
        fetchProduct();
    }, [user, productId]);

    const fetchProduct = async () => {
        const { data } = await supabase
            .from('products')
            .select('id, title_en, title_te, product_id')
            .eq('product_id', productId)
            .single();

        if (data) setProduct(data);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (reviewText.length > 200) {
            toast.error('Review must be 200 characters or less');
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await (supabase
                .from('reviews') as any)
                .insert({
                    product_id: product.id, // Use UUID from fetched product data
                    user_id: user?.id,
                    rating,
                    review_text: reviewText
                });

            if (error) throw error;

            toast.success('Review submitted successfully!');
            router.push(`/product/${productId}`);
        } catch (error: any) {
            console.error('Error submitting review:', error);
            toast.error(error.message || 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    const title = locale === 'en' ? product?.title_en : product?.title_te;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Safe top spacing to avoid header overlap */}
            <div className="h-24 md:h-28"></div>
            <div className="py-12">
                <div className="container mx-auto px-4 max-w-2xl">
                    <Link href={`/product/${productId}`} className="text-green-600 hover:underline mb-6 inline-block font-medium">
                        ← Back to Product
                    </Link>

                    <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100">
                        <h1 className="text-3xl font-black mb-2 text-gray-900">Write a Review</h1>
                        <p className="text-gray-500 mb-8 font-medium">Sharing your experience with <span className="text-green-600 font-bold">{title}</span></p>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Star Rating */}
                            <div>
                                <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Your Rating</label>
                                <div className="flex gap-3">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            className={`transition-all duration-200 transform hover:scale-125 ${star <= rating ? 'text-yellow-400' : 'text-gray-200'
                                                }`}
                                        >
                                            <svg className="w-12 h-12 fill-current" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Review Text */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <label className="block text-sm font-bold uppercase tracking-wider text-gray-400">Your Review</label>
                                    <span className={`text-xs font-bold ${reviewText.length > 200 ? 'text-red-500' : 'text-gray-400'}`}>
                                        {reviewText.length}/200
                                    </span>
                                </div>
                                <textarea
                                    value={reviewText}
                                    onChange={(e) => setReviewText(e.target.value)}
                                    placeholder="What did you like or dislike?"
                                    maxLength={200}
                                    required
                                    rows={5}
                                    className="w-full px-6 py-4 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all outline-none text-gray-700 bg-gray-50/50"
                                />
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                fullWidth
                                isLoading={submitting}
                                disabled={reviewText.length > 200}
                                className="py-4 text-lg font-bold shadow-xl shadow-green-100 rounded-2xl h-auto"
                            >
                                Submit Review
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
