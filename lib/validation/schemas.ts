/**
 * Input Validation Schemas using Zod
 * 
 * Provides type-safe validation for all user inputs
 * Follows OWASP best practices for input validation
 */

import { z } from 'zod';

// ============================================
// AUTHENTICATION SCHEMAS
// ============================================

export const loginSchema = z.object({
    email: z.string().email('Invalid email address').max(255),
    password: z.string().min(6, 'Password must be at least 6 characters').max(100),
});

export const signupSchema = z.object({
    email: z.string().email('Invalid email address').max(255),
    password: z.string().min(8, 'Password must be at least 8 characters').max(100),
    fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
    phone: z.string().regex(/^[0-9]{10}$/, 'Phone number must be 10 digits'),
});

// ============================================
// ADDRESS SCHEMAS
// ============================================

export const addressSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    phone: z.string().regex(/^[0-9]{10}$/, 'Phone number must be 10 digits'),
    addressLine: z.string().min(10, 'Address must be at least 10 characters').max(500),
    pincode: z.string().regex(/^[0-9]{6}$/, 'Pincode must be 6 digits'),
    city: z.string().min(2).max(100).optional(),
    state: z.string().min(2).max(100).optional(),
});

// ============================================
// PRODUCT SCHEMAS
// ============================================

export const productSchema = z.object({
    productId: z.string().min(1).max(50),
    titleEn: z.string().min(1, 'English title is required').max(200),
    titleTe: z.string().min(1, 'Telugu title is required').max(200),
    descriptionEn: z.string().max(5000).optional(),
    descriptionTe: z.string().max(5000).optional(),
    specificationsEn: z.string().max(5000).optional(),
    specificationsTe: z.string().max(5000).optional(),
    usageEn: z.string().max(5000).optional(),
    usageTe: z.string().max(5000).optional(),
    additionalInfoEn: z.string().max(5000).optional(),
    additionalInfoTe: z.string().max(5000).optional(),
    imageUrl: z.string().url().optional(),
    additionalImages: z.array(z.string().url()).optional(),
    mrp: z.number().positive('MRP must be positive'),
    currentPrice: z.number().positive('Price must be positive'),
    shippingCharges: z.number().nonnegative('Shipping charges cannot be negative'),
    stockQuantity: z.number().int().nonnegative('Stock cannot be negative'),
    isActive: z.boolean().optional(),
});

export const variantSchema = z.object({
    label: z.string().min(1, 'Label is required').max(50),
    price: z.number().positive('Price must be positive'),
    mrp: z.number().positive('MRP must be positive').optional(),
    shippingCharge: z.number().nonnegative('Shipping charge cannot be negative').optional(),
    stockQuantity: z.number().int().nonnegative('Stock cannot be negative').optional(),
    enabled: z.boolean().optional().default(true),
});

export const reviewSchema = z.object({
    productId: z.string().uuid('Invalid product ID'),
    rating: z.number().int().min(1).max(5).optional(),
    reviewText: z.string().min(1, 'Review text is required').max(200, 'Review text cannot exceed 200 characters'),
});

// ============================================
// SECTION SCHEMAS
// ============================================

export const sectionSchema = z.object({
    sectionId: z.string().min(1).max(50),
    titleEn: z.string().min(1, 'English title is required').max(200),
    titleTe: z.string().min(1, 'Telugu title is required').max(200),
    subtitleEn: z.string().max(500).optional(),
    subtitleTe: z.string().max(500).optional(),
    descriptionEn: z.string().max(2000).optional(),
    descriptionTe: z.string().max(2000).optional(),
    displayOrder: z.number().int().nonnegative(),
    isEnabled: z.boolean().optional(),
});

// ============================================
// CART SCHEMAS
// ============================================

export const addToCartSchema = z.object({
    productId: z.string().uuid('Invalid product ID'),
    variantId: z.string().uuid('Invalid variant ID').optional(),
    quantity: z.number().int().positive('Quantity must be positive').max(99, 'Maximum quantity is 99'),
});

export const updateCartSchema = z.object({
    productId: z.string().uuid('Invalid product ID'),
    variantId: z.string().uuid('Invalid variant ID').optional(),
    quantity: z.number().int().nonnegative('Quantity cannot be negative').max(99, 'Maximum quantity is 99'),
});

// ============================================
// ORDER SCHEMAS
// ============================================

export const createOrderSchema = z.object({
    shippingName: z.string().min(2).max(100),
    shippingPhone: z.string().regex(/^[0-9]{10}$/, 'Phone number must be 10 digits'),
    shippingAddress: z.string().min(10).max(500),
    shippingPincode: z.string().regex(/^[0-9]{6}$/, 'Pincode must be 6 digits'),
    shippingCity: z.string().min(2).max(100).optional(),
    shippingState: z.string().min(2).max(100).optional(),
});

// ============================================
// PAYMENT SCHEMAS
// ============================================

export const paymentProofSchema = z.object({
    orderId: z.string().uuid('Invalid order ID'),
    utrNumber: z.string().min(1).max(50).optional(),
    paymentScreenshotUrl: z.string().url().optional(),
}).refine(
    (data) => data.utrNumber || data.paymentScreenshotUrl,
    {
        message: 'Either UTR number or payment screenshot is required',
    }
);

export const verifyPaymentSchema = z.object({
    paymentId: z.string().uuid('Invalid payment ID'),
    status: z.enum(['verified', 'rejected']),
    rejectionReason: z.string().max(500).optional(),
});

// ============================================
// SEARCH SCHEMA
// ============================================

export const searchSchema = z.object({
    query: z.string().min(1).max(100),
    limit: z.number().int().positive().max(50).optional(),
});

// ============================================
// ADMIN SCHEMAS
// ============================================

export const updateOrderStatusSchema = z.object({
    orderId: z.string().uuid('Invalid order ID'),
    status: z.enum(['pending_payment', 'payment_verification', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
});

export const siteContentSchema = z.object({
    contentKey: z.string().min(1).max(100),
    contentEn: z.string().max(10000).optional(),
    contentTe: z.string().max(10000).optional(),
    contentType: z.enum(['text', 'html', 'image_url']),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type VariantInput = z.infer<typeof variantSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type SectionInput = z.infer<typeof sectionSchema>;
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartInput = z.infer<typeof updateCartSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type PaymentProofInput = z.infer<typeof paymentProofSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type SiteContentInput = z.infer<typeof siteContentSchema>;
