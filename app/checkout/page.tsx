/**
 * Checkout Page
 * 
 * Guest or logged-in checkout: collect shipping address and create order.
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
import { migrateGuestCartToUser } from '@/lib/utils/cart';
import { getEmailTypoSuggestion, isProbablyValidEmail, normalizeEmail } from '@/lib/utils/email';
import toast from 'react-hot-toast';

type ProfilePolicyRow = Pick<Database['public']['Tables']['profiles']['Row'], 'privacy_policy_accepted'>;

type GuestSavedAddress = {
    fullName: string;
    phone: string;
    email: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    pincode: string;
};

const GUEST_ADDRESS_STORAGE_KEY = 'guest_checkout_address_v1';

const toFiniteNumber = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }

    return null;
};

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
    const [email, setEmail] = useState('');
    const [addressLine1, setAddressLine1] = useState('');
    const [addressLine2, setAddressLine2] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [pincode, setPincode] = useState('');
    const [saveAddressOnDevice, setSaveAddressOnDevice] = useState(false);
    const [hasSavedGuestAddress, setHasSavedGuestAddress] = useState(false);

    const supportWhatsappPhone = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_PHONE || '';
    const supportWhatsappDigits = supportWhatsappPhone.replace(/\D/g, '');

    const loadGuestSavedAddress = () => {
        try {
            const raw = localStorage.getItem(GUEST_ADDRESS_STORAGE_KEY);
            if (!raw) {
                setHasSavedGuestAddress(false);
                return;
            }

            const parsed = JSON.parse(raw) as Partial<GuestSavedAddress> | null;
            if (!parsed || typeof parsed !== 'object') {
                localStorage.removeItem(GUEST_ADDRESS_STORAGE_KEY);
                setHasSavedGuestAddress(false);
                setSaveAddressOnDevice(false);
                return;
            }

            const normalize = (value: unknown, maxLen: number) =>
                typeof value === 'string' ? value.slice(0, maxLen) : '';

            const saved: GuestSavedAddress = {
                fullName: normalize(parsed.fullName, 100),
                phone: normalize(parsed.phone, 20),
                email: normalize(parsed.email, 254),
                addressLine1: normalize(parsed.addressLine1, 200),
                addressLine2: normalize(parsed.addressLine2, 200),
                city: normalize(parsed.city, 100),
                state: normalize(parsed.state, 100),
                pincode: normalize(parsed.pincode, 12),
            };

            const formIsEmpty = [fullName, phone, email, addressLine1, addressLine2, city, state, pincode].every(
                (value) => !value
            );

            setHasSavedGuestAddress(true);
            setSaveAddressOnDevice(true);

            if (formIsEmpty) {
                setFullName(saved.fullName);
                setPhone(saved.phone);
                setEmail(saved.email);
                setAddressLine1(saved.addressLine1);
                setAddressLine2(saved.addressLine2);
                setCity(saved.city);
                setState(saved.state);
                setPincode(saved.pincode);
            }
        } catch (error) {
            console.warn('Failed to load saved guest address:', error);
            setHasSavedGuestAddress(false);
            setSaveAddressOnDevice(false);
        }
    };

    const persistGuestSavedAddress = () => {
        const address: GuestSavedAddress = {
            fullName,
            phone,
            email: normalizeEmail(email),
            addressLine1,
            addressLine2,
            city,
            state,
            pincode,
        };

        try {
            localStorage.setItem(GUEST_ADDRESS_STORAGE_KEY, JSON.stringify(address));
            setHasSavedGuestAddress(true);
        } catch (error) {
            console.warn('Failed to save guest address:', error);
        }
    };

    const clearGuestSavedAddress = () => {
        try {
            localStorage.removeItem(GUEST_ADDRESS_STORAGE_KEY);
        } catch (error) {
            console.warn('Failed to clear saved guest address:', error);
        } finally {
            setHasSavedGuestAddress(false);
            setSaveAddressOnDevice(false);
            toast.success('Saved address cleared.');
        }
    };

    useEffect(() => {
        const initialization = async () => {
            if (user) {
                await migrateGuestCartToUser(user.id);
                await fetchCart();
                await fetchSavedAddresses();
                await loadSavedAddress();
            } else if (!authLoading) {
                loadGuestSavedAddress();
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

        if (error) {
            console.error('Failed to fetch cart:', error);
            return;
        }

        if (data) {
            const invalidIds: string[] = [];
            const enriched = (data as any[]).flatMap(item => {
                const resolvedPrice = toFiniteNumber(item.variant?.price ?? item.product?.current_price);
                if (resolvedPrice === null) {
                    if (typeof item.id === 'string') invalidIds.push(item.id);
                    return [];
                }

                const resolvedMrp = toFiniteNumber(item.variant?.mrp ?? item.product?.mrp);
                const resolvedShipping = toFiniteNumber(item.variant?.shipping_charge ?? item.product?.shipping_charges);

                return [{
                    ...item,
                    product: item.product ? {
                        ...item.product,
                        current_price: resolvedPrice,
                        mrp: resolvedMrp ?? item.product.mrp,
                        shipping_charges: resolvedShipping ?? item.product.shipping_charges,
                    } : item.product
                }];
            });

            if (invalidIds.length > 0) {
                await supabase.from('cart_items').delete().in('id', invalidIds);
                toast.error('Unavailable items were removed from your cart.');
            }

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
                const resolvedPrice = toFiniteNumber(variant?.price ?? product.current_price);
                if (resolvedPrice === null) return [];

                const resolvedMrp = toFiniteNumber(variant?.mrp ?? product.mrp);
                const resolvedShipping = toFiniteNumber(variant?.shipping_charge ?? product.shipping_charges);

                return [{
                    ...item,
                    variant: variant ?? null,
                    variant_label: variant?.label ?? null,
                    product: {
                        ...product,
                        current_price: resolvedPrice,
                        mrp: resolvedMrp ?? product.mrp,
                        shipping_charges: resolvedShipping ?? product.shipping_charges,
                    },
                }];
            });

            if (items.length !== guestCart.length) {
                const itemKeys = new Set(
                    items.map((item: any) => `${item.product_id}:${item.variant_id || 'no_variant'}`)
                );
                const cleaned = guestCart.filter((item: any) =>
                    itemKeys.has(`${item.product_id}:${item.variant_id || 'no_variant'}`)
                );
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

        if (!user) {
            const normalized = normalizeEmail(email);
            if (!isProbablyValidEmail(normalized)) {
                const suggestion = getEmailTypoSuggestion(normalized);
                toast.error(suggestion ? `Please enter a valid email. Did you mean ${suggestion}?` : 'Please enter a valid email address.');
                return;
            }

            const typoSuggestion = getEmailTypoSuggestion(normalized);
            if (typoSuggestion && typoSuggestion !== normalized) {
                toast.error(`Did you mean ${typoSuggestion}?`);
                return;
            }
        }

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

            if (!user && saveAddressOnDevice) {
                persistGuestSavedAddress();
            }

            const payload: any = {
                fullName,
                phone,
                email: !user ? normalizeEmail(email) : undefined,
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

            if (!user) {
                if (!result.guestAccessToken) {
                    toast.error('Unable to start guest payment session. Please retry checkout.');
                    return;
                }
                sessionStorage.setItem(`guest_payment_token:${result.orderId}`, result.guestAccessToken);
                sessionStorage.setItem(
                    `guest_track_token:${result.orderId}`,
                    result.guestTrackingToken || result.guestAccessToken
                );
            } else {
                sessionStorage.removeItem(`guest_payment_token:${result.orderId}`);
                sessionStorage.removeItem(`guest_track_token:${result.orderId}`);
            }

            router.push(`/payment/${result.orderId}`);
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

    const handleWhatsappOrder = () => {
        try {
            if (!supportWhatsappDigits) {
                toast.error('WhatsApp support is not configured.');
                return;
            }

            if (cartItems.length === 0) {
                toast.error('Your cart is empty.');
                return;
            }

            const lines: string[] = [];
            lines.push('Hi Charan Organics, I want to place an order.');
            lines.push('');
            lines.push('Items:');

            for (const item of cartItems) {
                const title = item?.product?.title_en || 'Product';
                const variantLabel = item?.variant?.label || item?.variant_label || '';
                const unitPrice = toFiniteNumber(item?.product?.current_price);
                const qty = typeof item?.quantity === 'number' ? item.quantity : 1;
                const lineTotal = unitPrice === null ? null : unitPrice * qty;

                lines.push(
                    `- ${title}${variantLabel ? ` (${variantLabel})` : ''} x${qty}${lineTotal === null ? '' : ` - Rs.${lineTotal.toFixed(0)}`}`
                );
            }

            lines.push('');
            lines.push(`Subtotal: Rs.${subtotal.toFixed(0)}`);
            lines.push(`Shipping: Rs.${shipping.toFixed(0)}`);
            lines.push(`Total: Rs.${total.toFixed(0)}`);
            lines.push('');
            lines.push('Delivery Address:');
            if (fullName) lines.push(`Name: ${fullName}`);
            if (phone) lines.push(`Phone: ${phone}`);
            if (addressLine1 || addressLine2) {
                lines.push(`Address: ${[addressLine1, addressLine2].filter(Boolean).join(', ')}`);
            }
            if (city || state) {
                lines.push(`City/State: ${[city, state].filter(Boolean).join(', ')}`);
            }
            if (pincode) lines.push(`Pincode: ${pincode}`);
            lines.push('');
            lines.push(`From: ${window.location.origin}`);

            const href = `https://wa.me/${supportWhatsappDigits}?text=${encodeURIComponent(lines.join('\n'))}`;
            window.open(href, '_blank', 'noopener,noreferrer');
        } catch (error) {
            console.error('WhatsApp order error:', error);
            toast.error('Unable to start WhatsApp');
        }
    };

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
                        <p className="text-gray-500 mb-8">It looks like you don&apos;t have any items to checkout.</p>
                        <Link href="/shop" className="inline-block">
                            <Button variant="primary" size="lg" className="rounded-xl">
                                Continue Shopping
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handlePlaceOrder}>
                        {!user && (
                            <div className="mb-8 bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2">Checkout Options</p>
                                        <p className="text-lg font-black text-gray-900">Continue as Guest</p>
                                        <p className="text-sm text-gray-600 font-medium leading-relaxed">
                                            No account required. You can place your order now. Login to use saved addresses and view order history.
                                        </p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <Link href="/login?returnTo=/checkout" className="block">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="h-12 rounded-2xl font-bold"
                                            >
                                                Login
                                            </Button>
                                        </Link>
                                        <Link href="/signup" className="block">
                                            <Button
                                                type="button"
                                                variant="primary"
                                                className="h-12 rounded-2xl font-black"
                                            >
                                                Create Account
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                                <p className="mt-4 text-xs text-gray-500 font-medium">
                                    Guest orders can be tracked using your Order ID, phone number, and pincode.
                                </p>
                            </div>
                        )}
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

                                        {!user && (
                                            <div className="md:col-span-2">
                                                <Input
                                                    label="Email"
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                    placeholder="name@example.com"
                                                    helperText="Order confirmation and updates will be sent to this email."
                                                    className="rounded-xl h-14"
                                                />
                                            </div>
                                        )}
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

                                    {!user && (
                                        <div className="mt-8 pt-6 border-t border-gray-100">
                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={saveAddressOnDevice}
                                                    onChange={(e) => setSaveAddressOnDevice(e.target.checked)}
                                                    className="w-5 h-5 mt-0.5 text-green-600 border-gray-300 rounded-lg focus:ring-green-500 transition-all cursor-pointer"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-gray-900">Save this address on this device</p>
                                                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                                        For faster checkout next time. Saved only in this browser.
                                                    </p>
                                                </div>
                                                {hasSavedGuestAddress && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="rounded-xl text-xs font-bold whitespace-nowrap px-3 py-2"
                                                        onClick={clearGuestSavedAddress}
                                                    >
                                                        Clear
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    )}
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
                                                    {item.variant_label && (
                                                        <p className="text-[10px] font-bold text-gray-500 mt-0.5">Size: {item.variant_label}</p>
                                                    )}
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

                                     <Button
                                         type="button"
                                         variant="outline"
                                         size="md"
                                         fullWidth
                                         disabled={!supportWhatsappDigits}
                                         onClick={handleWhatsappOrder}
                                         className="mt-3 h-12 rounded-2xl font-black uppercase tracking-widest text-[11px]"
                                     >
                                         WhatsApp Order / Help
                                     </Button>
                                     {!supportWhatsappDigits && (
                                         <p className="mt-2 text-center text-[11px] text-white/70 font-medium">
                                             WhatsApp support not configured
                                         </p>
                                     )}
 
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
