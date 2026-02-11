/**
 * Database Type Definitions
 * 
 * Generate these types from your Supabase schema using:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/database.types.ts
 * 
 * For now, we'll define the core types manually
 */

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    phone: string | null
                    role: 'customer' | 'admin'
                    created_at: string
                    updated_at: string
                    last_login: string | null
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    phone?: string | null
                    role?: 'customer' | 'admin'
                    created_at?: string
                    updated_at?: string
                    last_login?: string | null
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    phone?: string | null
                    role?: 'customer' | 'admin'
                    created_at?: string
                    updated_at?: string
                    last_login?: string | null
                }
            }
            addresses: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    phone: string
                    address_line: string
                    pincode: string
                    city: string | null
                    state: string | null
                    is_default: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    phone: string
                    address_line: string
                    pincode: string
                    city?: string | null
                    state?: string | null
                    is_default?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    phone?: string
                    address_line?: string
                    pincode?: string
                    city?: string | null
                    state?: string | null
                    is_default?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            sections: {
                Row: {
                    id: string
                    section_id: string
                    title_en: string
                    title_te: string
                    subtitle_en: string | null
                    subtitle_te: string | null
                    description_en: string | null
                    description_te: string | null
                    display_order: number
                    is_enabled: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    section_id: string
                    title_en: string
                    title_te: string
                    subtitle_en?: string | null
                    subtitle_te?: string | null
                    description_en?: string | null
                    description_te?: string | null
                    display_order?: number
                    is_enabled?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    section_id?: string
                    title_en?: string
                    title_te?: string
                    subtitle_en?: string | null
                    subtitle_te?: string | null
                    description_en?: string | null
                    description_te?: string | null
                    display_order?: number
                    is_enabled?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            products: {
                Row: {
                    id: string
                    product_id: string
                    title_en: string
                    title_te: string
                    description_en: string | null
                    description_te: string | null
                    specifications_en: string | null
                    specifications_te: string | null
                    usage_en: string | null
                    usage_te: string | null
                    additional_info_en: string | null
                    additional_info_te: string | null
                    image_url: string | null
                    additional_images: string[] | null
                    mrp: number
                    current_price: number
                    shipping_charges: number
                    stock_quantity: number
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    product_id: string
                    title_en: string
                    title_te: string
                    description_en?: string | null
                    description_te?: string | null
                    specifications_en?: string | null
                    specifications_te?: string | null
                    usage_en?: string | null
                    usage_te?: string | null
                    additional_info_en?: string | null
                    additional_info_te?: string | null
                    image_url?: string | null
                    additional_images?: string[] | null
                    mrp: number
                    current_price: number
                    shipping_charges?: number
                    stock_quantity?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    product_id?: string
                    title_en?: string
                    title_te?: string
                    description_en?: string | null
                    description_te?: string | null
                    specifications_en?: string | null
                    specifications_te?: string | null
                    usage_en?: string | null
                    usage_te?: string | null
                    additional_info_en?: string | null
                    additional_info_te?: string | null
                    image_url?: string | null
                    additional_images?: string[] | null
                    mrp?: number
                    current_price?: number
                    shipping_charges?: number
                    stock_quantity?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            product_variants: {
                Row: {
                    id: string
                    product_id: string
                    label: string
                    price: number
                    mrp: number | null
                    shipping_charge: number | null
                    stock_quantity: number | null
                    enabled: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    product_id: string
                    label: string
                    price: number
                    mrp?: number | null
                    shipping_charge?: number | null
                    stock_quantity?: number | null
                    enabled?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    product_id?: string
                    label?: string
                    price?: number
                    mrp?: number | null
                    shipping_charge?: number | null
                    stock_quantity?: number | null
                    enabled?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            product_sections: {
                Row: {
                    id: string
                    product_id: string
                    section_id: string
                    display_order: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    product_id: string
                    section_id: string
                    display_order?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    product_id?: string
                    section_id?: string
                    display_order?: number
                    created_at?: string
                }
            }
            cart_items: {
                Row: {
                    id: string
                    user_id: string
                    product_id: string
                    variant_id: string | null
                    quantity: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    product_id: string
                    variant_id?: string | null
                    quantity?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    product_id?: string
                    variant_id?: string | null
                    quantity?: number
                    created_at?: string
                    updated_at?: string
                }
            }
            reviews: {
                Row: {
                    id: string
                    product_id: string
                    user_id: string
                    rating: number | null
                    review_text: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    product_id: string
                    user_id: string
                    rating?: number | null
                    review_text: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    product_id?: string
                    user_id?: string
                    rating?: number | null
                    review_text?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            orders: {
                Row: {
                    id: string
                    order_id: string
                    user_id: string
                    shipping_name: string
                    shipping_phone: string
                    shipping_address: string
                    shipping_pincode: string
                    shipping_city: string | null
                    shipping_state: string | null
                    subtotal: number
                    shipping_total: number
                    total_amount: number
                    status: 'pending_payment' | 'payment_verification' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
                    created_at: string
                    updated_at: string
                    confirmed_at: string | null
                    shipped_at: string | null
                    delivered_at: string | null
                }
                Insert: {
                    id?: string
                    order_id: string
                    user_id: string
                    shipping_name: string
                    shipping_phone: string
                    shipping_address: string
                    shipping_pincode: string
                    shipping_city?: string | null
                    shipping_state?: string | null
                    subtotal: number
                    shipping_total: number
                    total_amount: number
                    status?: 'pending_payment' | 'payment_verification' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
                    created_at?: string
                    updated_at?: string
                    confirmed_at?: string | null
                    shipped_at?: string | null
                    delivered_at?: string | null
                }
                Update: {
                    id?: string
                    order_id?: string
                    user_id?: string
                    shipping_name?: string
                    shipping_phone?: string
                    shipping_address?: string
                    shipping_pincode?: string
                    shipping_city?: string | null
                    shipping_state?: string | null
                    subtotal?: number
                    shipping_total?: number
                    total_amount?: number
                    status?: 'pending_payment' | 'payment_verification' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
                    created_at?: string
                    updated_at?: string
                    confirmed_at?: string | null
                    shipped_at?: string | null
                    delivered_at?: string | null
                }
            }
            order_items: {
                Row: {
                    id: string
                    order_id: string
                    product_id: string
                    variant_id: string | null
                    variant_label: string | null
                    product_title_en: string
                    product_title_te: string
                    quantity: number
                    unit_price: number
                    total_price: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    order_id: string
                    product_id: string
                    variant_id?: string | null
                    variant_label?: string | null
                    product_title_en: string
                    product_title_te: string
                    quantity: number
                    unit_price: number
                    total_price: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    order_id?: string
                    product_id?: string
                    variant_id?: string | null
                    variant_label?: string | null
                    product_title_en?: string
                    product_title_te?: string
                    quantity?: number
                    unit_price?: number
                    total_price?: number
                    created_at?: string
                }
            }
            payments: {
                Row: {
                    id: string
                    order_id: string
                    payment_method: 'upi'
                    utr_number: string | null
                    payment_screenshot_url: string | null
                    status: 'pending' | 'verified' | 'rejected'
                    verified_by: string | null
                    verified_at: string | null
                    rejection_reason: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    order_id: string
                    payment_method?: 'upi'
                    utr_number?: string | null
                    payment_screenshot_url?: string | null
                    status?: 'pending' | 'verified' | 'rejected'
                    verified_by?: string | null
                    verified_at?: string | null
                    rejection_reason?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    order_id?: string
                    payment_method?: 'upi'
                    utr_number?: string | null
                    payment_screenshot_url?: string | null
                    status?: 'pending' | 'verified' | 'rejected'
                    verified_by?: string | null
                    verified_at?: string | null
                    rejection_reason?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            browsing_history: {
                Row: {
                    id: string
                    user_id: string
                    product_id: string
                    viewed_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    product_id: string
                    viewed_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    product_id?: string
                    viewed_at?: string
                }
            }
            admin_notifications: {
                Row: {
                    id: string
                    notification_type: 'new_order' | 'payment_proof_submitted' | 'low_stock'
                    title: string
                    message: string
                    related_order_id: string | null
                    is_read: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    notification_type: 'new_order' | 'payment_proof_submitted' | 'low_stock'
                    title: string
                    message: string
                    related_order_id?: string | null
                    is_read?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    notification_type?: 'new_order' | 'payment_proof_submitted' | 'low_stock'
                    title?: string
                    message?: string
                    related_order_id?: string | null
                    is_read?: boolean
                    created_at?: string
                }
            }
            admin_settings: {
                Row: {
                    id: string
                    setting_key: string
                    setting_value: Json
                    updated_at: string
                }
                Insert: {
                    id?: string
                    setting_key: string
                    setting_value: Json
                    updated_at?: string
                }
                Update: {
                    id?: string
                    setting_key?: string
                    setting_value?: Json
                    updated_at?: string
                }
            }
            site_content: {
                Row: {
                    id: string
                    content_key: string
                    content_en: string | null
                    content_te: string | null
                    content_type: 'text' | 'html' | 'image_url'
                    updated_at: string
                }
                Insert: {
                    id?: string
                    content_key: string
                    content_en?: string | null
                    content_te?: string | null
                    content_type?: 'text' | 'html' | 'image_url'
                    updated_at?: string
                }
                Update: {
                    id?: string
                    content_key?: string
                    content_en?: string | null
                    content_te?: string | null
                    content_type?: 'text' | 'html' | 'image_url'
                    updated_at?: string
                }
            }
            rate_limits: {
                Row: {
                    id: string
                    identifier: string
                    endpoint: string
                    request_count: number
                    window_start: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    identifier: string
                    endpoint: string
                    request_count?: number
                    window_start?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    identifier?: string
                    endpoint?: string
                    request_count?: number
                    window_start?: string
                    created_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            generate_order_id: {
                Args: Record<string, never>
                Returns: string
            }
            generate_product_id: {
                Args: Record<string, never>
                Returns: string
            }
        }
        Enums: {
            [_ in never]: never
        }
    }
}
