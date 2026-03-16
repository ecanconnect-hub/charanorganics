/**
 * Cart Management Utilities
 * 
 * Handles both guest (localStorage) and authenticated user (database) carts
 */

import { supabase } from '@/lib/supabase/client';

export interface CartItem {
    id?: string;
    product_id: string;
    variant_id?: string | null;
    variant_label?: string | null;
    quantity: number;
    product?: {
        id: string;
        product_id: string;
        title_en: string;
        title_te: string;
        image_url: string | null;
        current_price: number;
        mrp: number;
        shipping_charges: number;
    };
}

const CART_STORAGE_KEY = 'guest_cart';
let hasLoggedUserCartNetworkWarning = false;

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

/**
 * Get cart items for guest users (from localStorage)
 */
export const getGuestCart = (): CartItem[] => {
    if (typeof window === 'undefined') return [];

    try {
        const cart = localStorage.getItem(CART_STORAGE_KEY);
        return cart ? JSON.parse(cart) : [];
    } catch (error) {
        console.error('Error reading guest cart:', error);
        return [];
    }
};

/**
 * Save cart items for guest users (to localStorage)
 */
export const saveGuestCart = (cart: CartItem[]): void => {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
        console.error('Error saving guest cart:', error);
    }
};

/**
 * Add item to guest cart
 */
export const addToGuestCart = (productId: string, variantId?: string | null, quantity: number = 1): void => {
    const cart = getGuestCart();
    const existingItem = cart.find(item =>
        item.product_id === productId &&
        (variantId ? item.variant_id === variantId : !item.variant_id)
    );

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ product_id: productId, variant_id: variantId || null, quantity });
    }

    saveGuestCart(cart);
};

/**
 * Remove item from guest cart
 */
export const removeFromGuestCart = (productId: string, variantId?: string | null): void => {
    const cart = getGuestCart();
    const updatedCart = cart.filter(item =>
        !(item.product_id === productId && (variantId ? item.variant_id === variantId : !item.variant_id))
    );
    saveGuestCart(updatedCart);
};

/**
 * Update item quantity in guest cart
 */
export const updateGuestCartQuantity = (productId: string, variantId: string | null | undefined, quantity: number): void => {
    if (quantity <= 0) {
        removeFromGuestCart(productId, variantId);
        return;
    }

    const cart = getGuestCart();
    const item = cart.find(item =>
        item.product_id === productId &&
        (variantId ? item.variant_id === variantId : !item.variant_id)
    );

    if (item) {
        item.quantity = quantity;
        saveGuestCart(cart);
    }
};

/**
 * Clear guest cart
 */
export const clearGuestCart = (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(CART_STORAGE_KEY);
};

/**
 * Get cart items for authenticated users (from database)
 */
export const getUserCart = async (userId: string): Promise<CartItem[]> => {
    try {
        if (!userId) return [];

        const { data, error } = await supabase
            .from('cart_items')
            .select(`
                id,
                product_id,
                variant_id,
                quantity,
                product:products (
                    id,
                    product_id,
                    title_en,
                    title_te,
                    image_url,
                    current_price,
                    mrp,
                    shipping_charges
                ),
                variant:product_variants (
                    id,
                    label,
                    price,
                    mrp,
                    shipping_charge
                )
            `)
            .eq('user_id', userId);

        if (error) {
            // Handle specific Supabase errors
            if (error.message?.includes('fetch') || error.code === 'PGRSTH') {
                console.error('Supabase connection error. The project might be paused or there is a network issue.');
            }
            throw error;
        }

        hasLoggedUserCartNetworkWarning = false;

        // Transform to include variant info in the items
        const transformedItems = (data || []).map((item: any) => {
            const resolvedPrice = toFiniteNumber(item.variant?.price ?? item.product?.current_price);
            const resolvedMrp = toFiniteNumber(item.variant?.mrp ?? item.product?.mrp);
            const resolvedShipping = toFiniteNumber(item.variant?.shipping_charge ?? item.product?.shipping_charges);

            return {
                ...item,
                variant_label: item.variant?.label,
                // If variant exists, override price/mrp/shipping from variant
                product: item.product ? {
                    ...item.product,
                    current_price: resolvedPrice ?? item.product.current_price,
                    mrp: resolvedMrp ?? item.product.mrp,
                    shipping_charges: resolvedShipping ?? item.product.shipping_charges,
                } : item.product
            };
        });

        const invalidItemIds = transformedItems
            .filter((item: any) => !hasFiniteNumber(item.product?.current_price))
            .map((item: any) => item.id)
            .filter((id: unknown): id is string => typeof id === 'string');

        if (invalidItemIds.length > 0) {
            await supabase
                .from('cart_items')
                .delete()
                .in('id', invalidItemIds);
        }

        return transformedItems.filter((item: any) => hasFiniteNumber(item.product?.current_price));
    } catch (error: any) {
        const message = getErrorMessage(error);
        const isLikelyEmptyObjectError =
            !message && typeof error === 'object' && error !== null && Object.keys(error as object).length === 0;

        if (isNetworkError(message) || isLikelyEmptyObjectError) {
            if (!hasLoggedUserCartNetworkWarning) {
                console.warn('User cart sync is temporarily unavailable due to Supabase connectivity.');
                hasLoggedUserCartNetworkWarning = true;
            }
            return [];
        }

        // Enhanced error logging to diagnose issues
        console.error('Failed to fetch user cart:', {
            message: error?.message || 'Unknown error',
            code: error?.code,
            hint: error?.hint,
            details: error?.details,
            userId,
        });

        // Log specific error types
        if (error?.message?.includes('JWT')) {
            console.error('Authentication error - user session may be invalid');
        } else if (error?.message?.includes('permission') || error?.code === '42501') {
            console.error('Permission denied - check RLS policies on cart_items table');
        } else if (error?.message?.includes('relation') || error?.code === '42P01') {
            console.error('Table not found - cart_items table may not exist');
        } else if (!error?.message) {
            console.error('Empty error object - possible network or CORS issue');
        }

        return [];
    }
};

/**
 * Add item to user cart (database)
 */
export const addToUserCart = async (userId: string, productId: string, variantId?: string | null, quantity: number = 1): Promise<boolean> => {
    try {
        if (!userId) return false;

        // Check if item already exists with same variant
        const query = supabase
            .from('cart_items')
            .select('id, quantity')
            .eq('user_id', userId)
            .eq('product_id', productId);

        if (variantId) {
            query.eq('variant_id', variantId);
        } else {
            query.is('variant_id', null);
        }

        const { data: existing, error: fetchError } = await query.maybeSingle();

        if (fetchError) throw fetchError;

        if (existing) {
            // Update quantity
            const { error: updateError } = await (supabase
                .from('cart_items') as any)
                .update({ quantity: (existing as any).quantity + quantity })
                .eq('id', (existing as any).id);

            if (updateError) throw updateError;
        } else {
            // Insert new item
            const { error: insertError } = await (supabase
                .from('cart_items') as any)
                .insert({ user_id: userId, product_id: productId, variant_id: variantId || null, quantity });

            if (insertError) throw insertError;
        }

        return true;
    } catch (error: any) {
        console.error('Error adding to user cart:', {
            message: error?.message || error,
            code: error?.code,
            details: error?.details,
            userId,
            productId,
            variantId
        });
        return false;
    }
};

/**
 * Remove item from user cart
 */
export const removeFromUserCart = async (userId: string, productId: string, variantId?: string | null): Promise<boolean> => {
    try {
        const query = supabase
            .from('cart_items')
            .delete()
            .eq('user_id', userId)
            .eq('product_id', productId);

        if (variantId) {
            query.eq('variant_id', variantId);
        } else {
            query.is('variant_id', null);
        }

        const { error } = await query;

        if (error) throw error;
        return true;
    } catch (error: any) {
        console.error('Error removing from user cart:', error?.message || error);
        return false;
    }
};

/**
 * Update item quantity in user cart
 */
export const updateUserCartQuantity = async (userId: string, productId: string, variantId: string | null | undefined, quantity: number): Promise<boolean> => {
    if (quantity <= 0) {
        return removeFromUserCart(userId, productId, variantId);
    }

    try {
        const query = (supabase
            .from('cart_items') as any)
            .update({ quantity })
            .eq('user_id', userId)
            .eq('product_id', productId);

        if (variantId) {
            query.eq('variant_id', variantId);
        } else {
            query.is('variant_id', null);
        }

        const { error } = await query;

        if (error) throw error;
        return true;
    } catch (error: any) {
        console.error('Error updating user cart quantity:', error?.message || error);
        return false;
    }
};

/**
 * Clear user cart
 */
export const clearUserCart = async (userId: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', userId);

        if (error) throw error;
        return true;
    } catch (error: any) {
        console.error('Error clearing user cart:', error?.message || error);
        return false;
    }
};

/**
 * Migrate guest cart to user cart after login
 */
export const migrateGuestCartToUser = async (
    userId: string
): Promise<{ migrated: number; failed: number }> => {
    const guestCart = getGuestCart();

    if (!userId || guestCart.length === 0) {
        return { migrated: 0, failed: 0 };
    }

    let migrated = 0;
    const failedItems: CartItem[] = [];

    for (const item of guestCart) {
        const ok = await addToUserCart(userId, item.product_id, item.variant_id, item.quantity);
        if (ok) {
            migrated += 1;
        } else {
            // Keep items locally so the user doesn't lose their cart due to transient failures.
            failedItems.push(item);
        }
    }

    if (failedItems.length === 0) {
        clearGuestCart();
    } else {
        saveGuestCart(failedItems);
    }

    return { migrated, failed: failedItems.length };
};

/**
 * Calculate cart totals
 */
export const calculateCartTotals = (cart: CartItem[]) => {
    let subtotal = 0;
    let shippingTotal = 0;

    cart.forEach(item => {
        if (item.product) {
            subtotal += item.product.current_price * item.quantity;
            shippingTotal += item.product.shipping_charges * item.quantity;
        }
    });

    const total = subtotal + shippingTotal;

    return { subtotal, shippingTotal, total };
};

