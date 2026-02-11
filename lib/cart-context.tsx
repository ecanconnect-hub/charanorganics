'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { CartItem, getGuestCart, getUserCart, addToGuestCart, addToUserCart, removeFromGuestCart, removeFromUserCart, updateGuestCartQuantity, updateUserCartQuantity } from '@/lib/utils/cart';
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

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { user, loading: authLoading } = useAuth();

    const openCart = () => setIsOpen(true);
    const closeCart = () => setIsOpen(false);

    const fetchItems = useCallback(async (userId?: string, silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            if (userId) {
                const userItems = await getUserCart(userId);
                setItems(userItems);
            } else {
                const guestItems = getGuestCart();
                if (guestItems.length > 0) {
                    const productIds = Array.from(new Set(guestItems.map(item => item.product_id)));
                    const variantIds = Array.from(new Set(guestItems.map(item => item.variant_id).filter(Boolean))) as string[];

                    const [{ data: products }, { data: variants }] = await Promise.all([
                        supabase
                            .from('products')
                            .select('id, product_id, title_en, title_te, image_url, current_price, mrp, shipping_charges')
                            .in('id', productIds),
                        variantIds.length > 0 ?
                            supabase
                                .from('product_variants')
                                .select('*')
                                .in('id', variantIds) : { data: [] }
                    ]);

                    if (products) {
                        const enrichedItems = guestItems.map(item => {
                            const product = (products as any[]).find(p => p.id === item.product_id);
                            const variant = (variants as any[]).find(v => v.id === item.variant_id);

                            return {
                                ...item,
                                variant_label: variant?.label,
                                product: product ? {
                                    ...product,
                                    current_price: variant?.price ?? product.current_price,
                                    mrp: variant?.mrp ?? product.mrp,
                                    shipping_charges: variant?.shipping_charge ?? product.shipping_charges,
                                } : product
                            };
                        });
                        setItems(enrichedItems);
                    } else {
                        setItems(guestItems);
                    }
                } else {
                    setItems([]);
                }
            }
        } catch (error) {
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
