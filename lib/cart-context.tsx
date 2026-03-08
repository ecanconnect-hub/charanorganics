'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { CartItem, getGuestCart, getUserCart, addToGuestCart, addToUserCart, removeFromGuestCart, removeFromUserCart, saveGuestCart, updateGuestCartQuantity, updateUserCartQuantity } from '@/lib/utils/cart';
import { useAuth } from '@/lib/auth/context';

interface CartContextType {
    items: CartItem[];
    isOpen: boolean;
    openCart: () => void;
    closeCart: () => void;
    addItem: (productId: string, variantId?: string | null, quantity?: number) => Promise<void>;
    removeItem: (productId: string, variantId?: string | null) => Promise<void>;
    updateQuantity: (productId: string, variantId: string | null | undefined, quantity: number) => Promise<void>;
    refreshCart: () => Promise<void>;
    isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    if (typeof error === 'object' && error !== null && 'message' in error) {
        const value = (error as { message?: unknown }).message;
        if (typeof value === 'string') return value;
    }
    return '';
}

function isNetworkError(message: string): boolean {
    const normalized = message.toLowerCase();
    return (
        normalized.includes('failed to fetch') ||
        normalized.includes('fetch failed') ||
        normalized.includes('network') ||
        normalized.includes('timeout') ||
        normalized.includes('abort')
    );
}

function hasFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

function toFiniteNumber(value: unknown): number | null {
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
}

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { user, loading: authLoading } = useAuth();
    const hasShownNetworkWarningRef = useRef(false);

    const openCart = () => setIsOpen(true);
    const closeCart = () => setIsOpen(false);

    const fetchItems = useCallback(async (userId?: string, silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            if (userId) {
                const userItems = await getUserCart(userId);
                setItems(userItems);
                hasShownNetworkWarningRef.current = false;
            } else {
                const guestItems = getGuestCart();
                if (guestItems.length > 0) {
                    const productIds = Array.from(new Set(guestItems.map(item => item.product_id)));
                    const variantIds = Array.from(new Set(guestItems.map(item => item.variant_id).filter(Boolean))) as string[];

                    const [{ data: products, error: productsError }, { data: variants, error: variantsError }] = await Promise.all([
                        supabase
                            .from('products')
                            .select('id, product_id, title_en, title_te, image_url, current_price, mrp, shipping_charges')
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

                    type VariantRow = {
                        id: string;
                        label: string | null;
                        price: number | null;
                        mrp: number | null;
                        shipping_charge: number | null;
                    };
                    type ProductRow = NonNullable<CartItem['product']>;

                    const typedProducts = (Array.isArray(products) ? products : []) as ProductRow[];
                    const productMap = new Map(typedProducts.map(product => [product.id, product]));
                    const typedVariants = (Array.isArray(variants) ? variants : []) as VariantRow[];
                    const variantMap = new Map(typedVariants.map(variant => [variant.id, variant]));

                    const enrichedItems: CartItem[] = guestItems.flatMap(item => {
                        const product = productMap.get(item.product_id);
                        if (!product) return [];

                        const variant = item.variant_id ? variantMap.get(item.variant_id) : undefined;
                        const resolvedPrice = toFiniteNumber(variant?.price ?? product.current_price);
                        if (resolvedPrice === null) {
                            return [];
                        }

                        const resolvedMrp = toFiniteNumber(variant?.mrp ?? product.mrp);
                        const resolvedShipping = toFiniteNumber(variant?.shipping_charge ?? product.shipping_charges);

                        return [{
                            ...item,
                            variant_label: variant?.label ?? null,
                            product: {
                                ...product,
                                current_price: resolvedPrice,
                                mrp: resolvedMrp ?? product.mrp,
                                shipping_charges: resolvedShipping ?? product.shipping_charges,
                            }
                        }];
                    });

                    if (enrichedItems.length !== guestItems.length) {
                        const enrichedKeys = new Set(
                            enrichedItems.map((item) => `${item.product_id}:${item.variant_id || 'no_variant'}`)
                        );
                        const cleanedGuestItems = guestItems.filter((item) =>
                            enrichedKeys.has(`${item.product_id}:${item.variant_id || 'no_variant'}`)
                        );
                        saveGuestCart(cleanedGuestItems);
                    }

                    setItems(enrichedItems);
                    hasShownNetworkWarningRef.current = false;
                } else {
                    setItems([]);
                    hasShownNetworkWarningRef.current = false;
                }
            }
        } catch (error) {
            const message = getErrorMessage(error);
            const isLikelyEmptyObjectError =
                !message && typeof error === 'object' && error !== null && Object.keys(error as object).length === 0;

            if (isNetworkError(message) || isLikelyEmptyObjectError) {
                if (!hasShownNetworkWarningRef.current) {
                    console.warn('Cart data sync is temporarily unavailable due to Supabase connectivity.');
                    hasShownNetworkWarningRef.current = true;
                }

                if (!userId) {
                    setItems((prevItems) =>
                        prevItems.filter((item) => hasFiniteNumber(item.product?.current_price))
                    );
                }
                return;
            }

            console.error('Error in fetchItems:', error);
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!authLoading) {
            fetchItems(user?.id);
        }
    }, [user?.id, authLoading, fetchItems]);

    // Sync items when localStorage changes (for guest cart)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'guest_cart' && !user) {
                fetchItems();
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [fetchItems, user]);

    const addItem = async (productId: string, variantId?: string | null, quantity: number = 1) => {
        if (user) {
            await addToUserCart(user.id, productId, variantId, quantity);
            await fetchItems(user.id, true);
        } else {
            addToGuestCart(productId, variantId, quantity);
            await fetchItems(undefined, true);
        }
    };

    const removeItem = async (productId: string, variantId?: string | null) => {
        if (user) {
            await removeFromUserCart(user.id, productId, variantId);
            await fetchItems(user.id, true);
        } else {
            removeFromGuestCart(productId, variantId);
            await fetchItems(undefined, true);
        }
    };

    const updateQuantity = async (productId: string, variantId: string | null | undefined, quantity: number) => {
        if (user) {
            await updateUserCartQuantity(user.id, productId, variantId, quantity);
            await fetchItems(user.id, true);
        } else {
            updateGuestCartQuantity(productId, variantId, quantity);
            await fetchItems(undefined, true);
        }
    };

    const refreshCart = async () => {
        await fetchItems(user?.id);
    };

    return (
        <CartContext.Provider value={{
            items,
            isOpen,
            openCart,
            closeCart,
            addItem,
            removeItem,
            updateQuantity,
            refreshCart,
            isLoading
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
