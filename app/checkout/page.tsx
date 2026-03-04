/**
 * Checkout Page
 * 
 * Requires login, collect shipping address, create order
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/auth/context';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';
import toast from 'react-hot-toast';

type ProfilePolicyRow = Pick<Database['public']['Tables']['profiles']['Row'], 'privacy_policy_accepted'>;

export default function CheckoutPage() {
    const router = useRouter();
    const { user, session, loading: authLoading } = useAuth();
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [policyBlocked, setPolicyBlocked] = useState(false);
    const [savedAddresses, setSavedAddresses] = useState<any[]>([]);

    // Address fields
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [addressLine1, setAddressLine1] = useState('');
    const [addressLine2, setAddressLine2] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [pincode, setPincode] = useState('');

    useEffect(() => {
        const initialization = async () => {
            if (user) {
                await fetchCart();
                await fetchSavedAddresses();
                await loadSavedAddress();
            } else if (!authLoading) {
                await fetchGuestCart();
            }
        };
        initialization();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, authLoading]);

    const fetchCart = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('cart_items')
            .select(`
                *, 
                product:products (*),
                variant:product_variants (*)
            `)
            .eq('user_id', user.id);

        if (data) {
            const enriched = (data as any[]).map(item => ({
                ...item,
                product: item.product ? {
                    ...item.product,
                    current_price: item.variant?.price ?? item.product.current_price,
                    mrp: item.variant?.mrp ?? item.product.mrp,
                    shipping_charges: item.variant?.shipping_charge ?? item.product.shipping_charges,
                } : item.product
            }));
            setCartItems(enriched);
        }
    };

    const fetchGuestCart = async () => {
        try {
            const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
            const productIds = Array.from(new Set(guestCart.map((item: any) => item.product_id)));
            const variantIds = Array.from(new Set(guestCart.map((item: any) => item.variant_id).filter(Boolean))) as string[];

            if (productIds.length === 0) {
                setCartItems([]);
                return;
            }

            const [{ data: products, error: productsError }, { data: variants, error: variantsError }] = await Promise.all([
                supabase
                    .from('products')
                    .select('*')
                    .in('id', productIds),
                variantIds.length > 0 ?
                    supabase
                        .from('product_variants')
                        .select('*')
                        .in('id', variantIds) : Promise.resolve({ data: [], error: null })
            ]);

            if (productsError || variantsError) {
                throw productsError || variantsError;
            }

            const productMap = new Map(((products as any[]) || []).map((product) => [product.id, product]));
            const variantMap = new Map(((variants as any[]) || []).map((variant) => [variant.id, variant]));

            const items = guestCart.flatMap((item: any) => {
                const product = productMap.get(item.product_id);
                if (!product) return [];

                const variant = item.variant_id ? variantMap.get(item.variant_id) : undefined;
                return [{
                    ...item,
                    product: {
                        ...product,
                        current_price: variant?.price ?? product.current_price,
                        mrp: variant?.mrp ?? product.mrp,
                        shipping_charges: variant?.shipping_charge ?? product.shipping_charges,
                    },
                }];
            });

            if (items.length !== guestCart.length) {
                const cleaned = guestCart.filter((item: any) => productMap.has(item.product_id));
                localStorage.setItem('guest_cart', JSON.stringify(cleaned));
            }

            setCartItems(items);
        } catch (error) {
            console.error('Guest cart error:', error);
        }
    };

    const applyAddressToForm = (addr: any) => {
        if (!addr) return;
        setFullName(addr.full_name || addr.name || '');
        setPhone(addr.phone || '');
        setAddressLine1(addr.address_line1 || addr.address_line || '');
        setAddressLine2(addr.address_line2 || '');
        setCity(addr.city || '');
        setState(addr.state || '');
        setPincode(addr.pincode || '');
    };

    const fetchSavedAddresses = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('addresses' as any)
            .select('*')
            .eq('user_id', user.id)
            .order('is_default', { ascending: false });

        setSavedAddresses((data as any[]) || []);
    };

    const loadSavedAddress = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('addresses' as any)
            .select('*')
            .eq('user_id', user.id)
            .eq('is_default', true)
            .single();

        if (data) {
            applyAddressToForm(data as any);
        }
    };

    const handlePlaceOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;

        setLoading(true);
        setPolicyBlocked(false);

        try {
            if (user) {
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('privacy_policy_accepted')
                    .eq('id', user.id)
                    .single();

                if (profileError) {
                    toast.error('Unable to verify policy acceptance. Please try again.');
                    return;
                }

                const profilePolicy = profileData as ProfilePolicyRow | null;
                if (profilePolicy?.privacy_policy_accepted === false) {
                    setPolicyBlocked(true);
                    toast.error('Please accept policy in Account > Security to confirm your order.');
                    return;
                }
            }

            const payload: any = {
                fullName,
                phone,
                addressLine1,
                addressLine2,
                city,
                state,
                pincode,
            };

            // If guest, send cart items in body
            if (!user) {
                payload.cartItems = cartItems.map(item => ({
                    product_id: item.product_id,
                    variant_id: item.variant_id,
                    quantity: item.quantity
                }));
            }

            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(session ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok) {
                if (result.details) {
                    const firstError = Object.values(result.details).flat()[0] as any;
                    toast.error(firstError?.message || result.error);
                } else if (result.message) {
                    toast.error(result.message);
                } else {
                    throw new Error(result.error || 'Failed to place order');
                }
                return;
            }

            // Clear guest cart on success
            // MOVED TO PAYMENT PAGE: Only clear cart after payment proof is submitted
            // if (!user) {
            //     localStorage.removeItem('guest_cart');
            // }

            const params = new URLSearchParams();
            params.set('phone', phone);
            router.push(`/payment/${result.orderId}?${params.toString()}`);
        } catch (error: any) {
            console.error('Order error:', error);
            toast.error(error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    const subtotal = cartItems.reduce(
        (sum, item) => sum + (item.product?.current_price || 0) * item.quantity,
        0
    );
    const calculatedShipping = cartItems.length > 0
        ? Math.max(...cartItems.map(item => item.product?.shipping_charges || 0))
        : 0;
    const shipping = subtotal >= 2000 ? 0 : calculatedShipping;
    const total = subtotal + shipping;

    return (
        <div className="bg-background py-12">
            {/* Safe top spacing to avoid header overlap */}
            <div className="h-24 md:h-28"></div>

            <div className="container mx-auto px-4">
                <h1 className="text-4xl font-black text-gray-900 mb-8 tracking-tighter uppercase italic">Checkout</h1>

                {cartItems.length === 0 && !loading ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <div className="text-6xl mb-6">🛒</div>
                        <h2 className="text-2xl font-black text-gray-900 mb-4">Your cart is empty</h2>
                        <p className="text-gray-500 mb-8">It looks like you don't have any items to checkout.</p>
                        <Link href="/shop" className="inline-block">
                            <Button variant="primary" size="lg" className="rounded-xl">
                                Continue Shopping
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handlePlaceOrder}>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Shipping Address */}
                            <div className="lg:col-span-2">
                                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                                    <h2 className="text-2xl font-black text-gray-900 mb-8 tracking-tight uppercase italic">Shipping Address</h2>

                                    {user && savedAddresses.length > 0 && (
                                        <div className="mb-6">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Saved Addresses</h3>
                                                <Link href="/account/addresses" className="text-xs font-bold text-green-700 hover:text-green-600">
                                                    Manage Addresses
                                                </Link>
                                            </div>

                                            <div className="space-y-3">
                                                {savedAddresses.slice(0, 3).map((addr, idx) => (
                                                    <div key={addr.id || idx} className="rounded-xl border border-gray-200 bg-gray-50 p-3 flex items-start justify-between gap-4">
                                                        <div className="text-xs text-gray-700 leading-relaxed">
                                                            <p className="font-bold text-gray-900">
                                                                {addr.name}
                                                                {addr.is_default ? <span className="ml-2 text-[10px] text-green-700 font-black uppercase">Default</span> : null}
                                                            </p>
                                                            <p>{addr.phone}</p>
                                                            <p>{addr.address_line}</p>
                                                            <p>{addr.city}, {addr.state} - {addr.pincode}</p>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            className="rounded-lg text-xs font-bold whitespace-nowrap"
                                                            onClick={() => applyAddressToForm(addr)}
                                                        >
                                                            Use This
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Input
                                            label="Full Name"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            required
                                            className="rounded-xl h-14"
                                        />
                                        <Input
                                            label="Phone"
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            required
                                            className="rounded-xl h-14"
                                        />
                                        <div className="md:col-span-2">
                                            <Input
                                                label="Address Line 1"
                                                value={addressLine1}
                                                onChange={(e) => setAddressLine1(e.target.value)}
                                                required
                                                className="rounded-xl h-14"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <Input
                                                label="Address Line 2 (Optional)"
                                                value={addressLine2}
                                                onChange={(e) => setAddressLine2(e.target.value)}
                                                className="rounded-xl h-14"
                                            />
                                        </div>
                                        <Input
                                            label="City"
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                            required
                                            className="rounded-xl h-14"
                                        />
                                        <Input
                                            label="State"
                                            value={state}
                                            onChange={(e) => setState(e.target.value)}
                                            required
                                            className="rounded-xl h-14"
                                        />
                                        <Input
                                            label="Pincode"
                                            value={pincode}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '');
                                                setPincode(val);
                                                if (val.length === 6) {
                                                    // Auto-fetch details
                                                    fetch(`https://api.postalpincode.in/pincode/${val}`)
                                                        .then(res => res.json())
                                                        .then(data => {
                                                            if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
                                                                const details = data[0].PostOffice[0];
                                                                if (details.District) setCity(details.District);
                                                                if (details.State) setState(details.State);
                                                                if (!addressLine2 && details.Block && details.Block !== 'NA') {
                                                                    setAddressLine2(details.Block + ' Mandal');
                                                                }
                                                                toast.success('Address details found!');
                                                            }
                                                        })
                                                        .catch(() => { });
                                                }
                                            }}
                                            required
                                            maxLength={6}
                                            className="rounded-xl h-14"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="lg:col-span-1">
                                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm mb-6">
                                    <h2 className="text-xl font-black text-gray-900 mb-6 tracking-tight uppercase italic">Order Items</h2>
                                    <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {cartItems.map((item, idx) => (
                                            <div key={idx} className="flex gap-4 items-center">
                                                <div className="w-16 h-16 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100">
                                                    {item.product?.image_url ? (
                                                        <img src={item.product.image_url} alt={item.product.title_en} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xl">🌿</div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold text-gray-900 text-xs line-clamp-1">{item.product?.title_en}</p>
                                                    <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mt-0.5">Qty: {item.quantity}</p>
                                                </div>
                                                <p className="font-black text-gray-900 text-sm">₹{(item.product?.current_price * item.quantity).toFixed(0)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-[2.5rem] p-8 text-white shadow-2xl sticky top-32" style={{ backgroundColor: '#4B5563' }}>
                                    <h2 className="text-xl font-black mb-8 tracking-tight uppercase italic">Order Totals</h2>

                                    <div className="space-y-4 mb-8">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-white font-medium">Subtotal</span>
                                            <span className="font-bold">₹{subtotal.toFixed(0)}</span>
                                        </div>
                                        {subtotal < 2000 ? (
                                            <p className="text-[10px] text-white font-bold bg-white/20 px-2 py-1 rounded inline-block self-end">
                                                Add ₹{(2000 - subtotal).toFixed(2)} more for FREE shipping
                                            </p>
                                        ) : (
                                            <p className="text-[10px] text-white font-black uppercase tracking-widest bg-green-500/80 px-2 py-1 rounded inline-block self-end animate-pulse">
                                                🎉 Free Shipping Applied!
                                            </p>
                                        )}
                                        <div className="flex justify-between text-sm">
                                            <span className="text-white font-medium">Shipping Charge</span>
                                            {subtotal >= 2000 ? (
                                                <span className="text-green-400 font-bold uppercase tracking-widest text-[10px]">Free Shipping</span>
                                            ) : (
                                                <span className="font-bold">₹{shipping.toFixed(0)}</span>
                                            )}
                                        </div>
                                        <div className="border-t border-white/10 pt-6 flex justify-between items-end">
                                            <span className="text-xs font-black uppercase tracking-[0.2em] text-white">Total Amount</span>
                                            <span className="text-3xl font-black tracking-tighter">₹{total.toFixed(0)}</span>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="lg"
                                        fullWidth
                                        isLoading={loading}
                                        className="h-16 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-green-900/20"
                                    >
                                        Confirm Order
                                    </Button>

                                    {policyBlocked && (
                                        <div className="mt-4 rounded-xl bg-amber-100/90 border border-amber-300 px-4 py-3">
                                            <p className="text-xs font-bold text-amber-900 mb-2">
                                                Please accept policy in Account Security to continue.
                                            </p>
                                            <Link href="/account/security" className="inline-block">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="rounded-lg text-xs font-bold"
                                                >
                                                    Go to Account Security
                                                </Button>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
