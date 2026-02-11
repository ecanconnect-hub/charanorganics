/**
 * Payment Page
 * 
 * Display UPI QR code (desktop) or deep link (mobile)
 * Upload payment screenshot
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/auth/context';
import { supabase } from '@/lib/supabase/client';
import { generateUPILink, generateUPIQRCode, isMobileDevice, openUPIApp } from '@/lib/utils/upi';
import toast from 'react-hot-toast';

export default function PaymentPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const orderId = params.orderId as string;

    const [order, setOrder] = useState<any>(null);
    const [qrCode, setQRCode] = useState('');
    const [uploading, setUploading] = useState(false);
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [utrNumber, setUtrNumber] = useState('');
    const [phone, setPhone] = useState('');
    const [step, setStep] = useState(1); // 1 = Pay, 2 = Confirm (UTR/Screen)
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setIsMobile(isMobileDevice());
        const searchParams = new URLSearchParams(window.location.search);
        const phoneFromUrl = searchParams.get('phone') || '';
        setPhone(phoneFromUrl);
        if (orderId) {
            fetchOrder(phoneFromUrl);
        }
    }, [orderId]);

    // Re-generate QR once order data is fetched
    useEffect(() => {
        if (order) {
            generateQR();
        }
    }, [order]);

    const fetchOrder = async (phoneValue?: string) => {
        try {
            const response = await fetch('/api/payment/details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId,
                    phone: phoneValue || phone || undefined
                })
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error('Order not found or already paid');
                return;
            }

            setOrder({
                id: data.id,
                total_amount: data.totalAmount,
                status: data.status,
                order_id: data.orderId
            });
        } catch (err) {
            console.error('Fetch order error:', err);
        }
    };

    const generateQR = async () => {
        const upiId = process.env.NEXT_PUBLIC_UPI_ID!;
        const upiName = process.env.NEXT_PUBLIC_UPI_NAME!;

        if (!order) return;

        const qr = await generateUPIQRCode({
            upiId,
            name: upiName,
            amount: order.total_amount,
            transactionNote: `Order ${orderId}`,
            transactionRef: orderId
        });
        setQRCode(qr);
    };

    const handlePayNow = () => {
        const upiId = process.env.NEXT_PUBLIC_UPI_ID!;
        const upiName = process.env.NEXT_PUBLIC_UPI_NAME!;
        const amount = order?.total_amount || 0;

        // Automatically move to confirmation step
        setStep(2);

        openUPIApp({
            upiId,
            name: upiName,
            amount,
            transactionNote: `Order ${orderId}`,
            transactionRef: orderId
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // 1. Validate File Type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                toast.error('Please upload a valid image (JPG, PNG, or WEBP)');
                return;
            }

            // 2. Validate File Size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB');
                return;
            }

            setScreenshot(file);
        }
    };

    const handleSubmitProof = async () => {
        if (!screenshot && !utrNumber) {
            toast.error('Please enter UTR number or upload a screenshot');
            return;
        }

        setUploading(true);

        try {
            let publicUrl = '';

            // Upload Screenshot if provided
            if (screenshot) {
                const fileExt = screenshot.name.split('.').pop()?.toLowerCase();
                const fileName = `${orderId}-${Date.now()}.${fileExt}`;

                // Guests use 'guest-uploads' folder, users use their ID
                const filePath = user
                    ? `${user.id}/${fileName}`
                    : `guest-uploads/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('payments')
                    .upload(filePath, screenshot);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage
                    .from('payments')
                    .getPublicUrl(filePath);

                publicUrl = data.publicUrl;
            }

            const submitResponse = await fetch('/api/payment/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId,
                    phone: phone || undefined,
                    utr: utrNumber || undefined,
                    screenshotUrl: publicUrl || undefined
                })
            });

            const submitResult = await submitResponse.json();
            if (!submitResponse.ok) {
                throw new Error(submitResult.error || 'Failed to submit payment details');
            }

            // Send order confirmation email
            try {
                await fetch('/api/send-order-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderId, phone: phone || undefined })
                });
            } catch (emailError) {
                // Don't fail the submission if email fails
                console.error('Failed to send confirmation email:', emailError);
            }

            toast.success('Payment details submitted! We will verify and confirm your order soon.');
            router.push(`/order-confirmation/${orderId}`);
        } catch (error: any) {
            console.error('Submission error:', error);
            toast.error('Failed to submit: ' + (error.message || 'Check connection'));
        } finally {
            setUploading(false);
        }
    };

    if (!order) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <main className="section-padding bg-gray-50 min-h-screen">
            <div className="h-24 md:h-28"></div> {/* Header spacing */}

            <div className="container mx-auto px-4 max-w-2xl">
                {/* Progress Tracker */}
                <div className="flex items-center justify-center mb-10 gap-4">
                    <div className={`flex items-center gap-2 transition-colors ${step >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 transition-all ${step >= 1 ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-gray-200'}`}>1</span>
                        <span className="font-black uppercase tracking-widest text-[10px] italic">Pay Now</span>
                    </div>
                    <div className={`w-12 h-0.5 transition-colors ${step >= 2 ? 'bg-green-600' : 'bg-gray-200'}`}></div>
                    <div className={`flex items-center gap-2 transition-colors ${step >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 transition-all ${step >= 2 ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-gray-200'}`}>2</span>
                        <span className="font-black uppercase tracking-widest text-[10px] italic">Confirm</span>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-gray-100">
                    {/* Header Summary */}
                    <div className="bg-gray-900 p-8 text-center text-white">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2">Checkout Verification</p>
                        <h1 className="text-2xl font-black tracking-tight uppercase italic mb-2">
                            {step === 1 ? 'Complete Payment' : 'Confirm Proof'}
                        </h1>
                        <div className="flex justify-center items-center gap-6 mt-4">
                            <div className="text-left">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Order ID</p>
                                <p className="font-black text-sm">#{orderId}</p>
                            </div>
                            <div className="w-px h-8 bg-gray-700"></div>
                            <div className="text-left">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Amount Due</p>
                                <p className="font-black text-2xl tracking-tighter text-green-400">₹{order.total_amount.toFixed(0)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        {step === 1 ? (
                            /* Step 1: Make Payment */
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <h2 className="text-lg font-black text-gray-900 uppercase italic tracking-tight underline underline-offset-8 decoration-green-600/30">Instructions</h2>
                                    <p className="text-gray-600 text-sm leading-relaxed font-medium">
                                        Please pay exactly <span className="font-black text-gray-900">₹{order.total_amount.toFixed(0)}</span> using any UPI app. Once paid, come back here to submit your proof.
                                    </p>
                                </div>

                                {isMobile ? (
                                    <div className="space-y-6">
                                        <Button
                                            variant="primary"
                                            size="lg"
                                            fullWidth
                                            onClick={handlePayNow}
                                            className="h-20 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-green-900/20 gap-3"
                                        >
                                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z" />
                                            </svg>
                                            Pay Now with UPI
                                        </Button>
                                        <p className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            This will open your preferred UPI app (PhonePe, GPay, etc.)
                                        </p>
                                    </div>
                                ) : (
                                    <div className="text-center space-y-6">
                                        <div className="inline-block p-6 bg-white border-4 border-gray-50 rounded-[2rem] shadow-inner">
                                            {qrCode ? (
                                                <Image
                                                    src={qrCode}
                                                    alt="UPI QR Code"
                                                    width={260}
                                                    height={260}
                                                    className="rounded-xl"
                                                />
                                            ) : (
                                                <div className="w-[260px] h-[260px] bg-gray-50 rounded-xl flex items-center justify-center">
                                                    <span className="animate-pulse text-gray-300">Generating QR...</span>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-gray-900 uppercase italic">Scan QR with any app</p>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">GPay • PhonePe • Paytm • Amazon Pay</p>
                                        </div>

                                        {/* UPI ID with Copy Button */}
                                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                                            <div className="flex-1">
                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">UPI ID</p>
                                                <p className="text-sm font-black text-gray-900 tracking-tight">8247838125@ybl</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText('8247838125@ybl');
                                                    toast.success('UPI ID copied!', {
                                                        icon: '📋',
                                                        style: {
                                                            borderRadius: '8px',
                                                            background: '#2cdea3ff',
                                                            color: '#fff',
                                                            fontWeight: '600',
                                                            fontSize: '13px'
                                                        }
                                                    });
                                                }}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-xs uppercase tracking-wide transition-colors flex items-center gap-2 shadow-sm"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                                Copy
                                            </button>
                                        </div>

                                        <Button
                                            variant="primary"
                                            size="lg"
                                            fullWidth
                                            onClick={() => setStep(2)}
                                            className="h-16 rounded-2xl font-black uppercase tracking-widest text-xs"
                                        >
                                            I have paid, Proceed to Confirm
                                        </Button>
                                    </div>
                                )}

                                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex gap-4">
                                    <span className="text-xl">🛡️</span>
                                    <div>
                                        <p className="text-xs font-black text-blue-900 uppercase tracking-tight">Safe & Secure Environment</p>
                                        <p className="text-[10px] text-blue-700 font-bold leading-tight mt-0.5">Your payment is direct via UPI. We do not store your банковские данные.</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Step 2: Confirm Proof */
                            <div className="space-y-8">
                                <button
                                    onClick={() => setStep(1)}
                                    className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors flex items-center gap-1 mb-4"
                                >
                                    ← Back to Payment
                                </button>

                                <div className="space-y-4">
                                    <h2 className="text-lg font-black text-gray-900 uppercase italic tracking-tight underline underline-offset-8 decoration-green-600/30">Confirmation Details</h2>
                                    <p className="text-gray-600 text-sm leading-relaxed font-medium">
                                        Almost there! Please provide your UTR number or upload a screenshot so we can verify your payment manually.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <Input
                                        label="UPI Reference ID (UTR)"
                                        value={utrNumber}
                                        onChange={(e) => setUtrNumber(e.target.value)}
                                        placeholder="Enter the 12-digit UTR number"
                                        className="rounded-2xl h-14 font-bold"
                                    />

                                    <div className="relative py-4">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-gray-100"></div>
                                        </div>
                                        <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">
                                            <span className="bg-white px-4 italic">OR UPLOAD PROOF</span>
                                        </div>
                                    </div>

                                    <div className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all ${screenshot ? 'border-green-600 bg-green-50/50' : 'border-gray-100 hover:border-green-600 bg-gray-50/30'}`}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="space-y-3">
                                            <div className="text-4xl text-gray-300">📸</div>
                                            {screenshot ? (
                                                <p className="text-sm font-bold text-green-700 uppercase tracking-wider">{screenshot.name}</p>
                                            ) : (
                                                <>
                                                    <p className="text-xs font-black text-gray-900 uppercase tracking-widest">Select Payment Screenshot</p>
                                                    <p className="text-[10px] text-gray-400 font-bold">Tap here to select from your gallery</p>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <Button
                                        variant="primary"
                                        size="lg"
                                        fullWidth
                                        onClick={handleSubmitProof}
                                        disabled={(!screenshot && !utrNumber) || uploading}
                                        isLoading={uploading}
                                        className="h-16 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-green-900/20"
                                    >
                                        Verify & Complete Order
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Support Footer */}
                    <div className="bg-gray-50 p-6 border-t border-gray-100 text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Need help or stuck?</p>
                        <a href="https://wa.me/918247838125" className="text-xs font-black text-green-600 hover:text-green-700 transition-colors italic underline decoration-green-600/30 underline-offset-4">
                            WhatsApp support: +91 824 783 8125
                        </a>
                    </div>
                </div>
            </div>
        </main>
    );
}
