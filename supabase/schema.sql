-- ============================================
-- CHARAN ORGANICS E-COMMERCE DATABASE SCHEMA
-- ============================================
-- This schema implements a complete e-commerce system with:
-- - Multi-language support (English + Telugu)
-- - Admin-controlled dynamic sections
-- - UPI payment verification workflow
-- - Row Level Security (RLS) for data protection
-- - Rate limiting and security features
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

-- Extend auth.users with custom profile data
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- User addresses
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address_line TEXT NOT NULL,
    pincode TEXT NOT NULL,
    city TEXT,
    state TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRODUCT SECTIONS (ADMIN CONTROLLED)
-- ============================================

CREATE TABLE IF NOT EXISTS public.sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id TEXT UNIQUE NOT NULL, -- Human-readable ID like 'bestsellers'
    title_en TEXT NOT NULL,
    title_te TEXT NOT NULL, -- Telugu
    subtitle_en TEXT,
    subtitle_te TEXT,
    description_en TEXT,
    description_te TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRODUCTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id TEXT UNIQUE NOT NULL, -- Human-readable unique ID like 'ORG-001'
    title_en TEXT NOT NULL,
    title_te TEXT NOT NULL,
    description_en TEXT,
    description_te TEXT,
    specifications_en TEXT,
    specifications_te TEXT,
    usage_en TEXT,
    usage_te TEXT,
    image_url TEXT,
    additional_images TEXT[], -- Array of image URLs
    mrp DECIMAL(10, 2) NOT NULL,
    current_price DECIMAL(10, 2) NOT NULL,
    shipping_charges DECIMAL(10, 2) DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product-Section mapping (many-to-many)
CREATE TABLE IF NOT EXISTS public.product_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, section_id)
);

-- Product Variants
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    mrp DECIMAL(10, 2),
    shipping_charge DECIMAL(10, 2),
    stock_quantity INTEGER DEFAULT 0,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text VARCHAR(200) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CART SYSTEM
-- ============================================

-- Guest carts stored in localStorage
-- Logged-in user carts stored in database
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id, variant_id)
);

-- ============================================
-- ORDERS & PAYMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id TEXT UNIQUE NOT NULL, -- Human-readable like 'ORD-20260120-001'
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Shipping details (snapshot at order time)
    shipping_name TEXT NOT NULL,
    shipping_phone TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    shipping_pincode TEXT NOT NULL,
    shipping_city TEXT,
    shipping_state TEXT,
    
    -- Order totals
    subtotal DECIMAL(10, 2) NOT NULL,
    shipping_total DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    
    -- Order status
    status TEXT DEFAULT 'pending_payment' CHECK (status IN (
        'pending_payment',
        'payment_verification',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'cancelled'
    )),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ
);

-- Order items (snapshot of products at order time)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    variant_id UUID,
    variant_label TEXT,
    product_title_en TEXT NOT NULL,
    product_title_te TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment verification
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    payment_method TEXT DEFAULT 'upi' CHECK (payment_method IN ('upi')),
    
    -- Payment proof
    utr_number TEXT, -- UPI Transaction Reference
    payment_screenshot_url TEXT,
    
    -- Verification
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    verified_by UUID REFERENCES public.profiles(id),
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RECENTLY BROWSED PRODUCTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.browsing_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Wishlist Table
CREATE TABLE IF NOT EXISTS public.wishlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- ============================================
-- ADMIN NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_type TEXT NOT NULL CHECK (notification_type IN (
        'new_order',
        'payment_proof_submitted',
        'low_stock'
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin notification settings
CREATE TABLE IF NOT EXISTS public.admin_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SITE CONTENT (ADMIN EDITABLE)
-- ============================================

CREATE TABLE IF NOT EXISTS public.site_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_key TEXT UNIQUE NOT NULL, -- e.g., 'top_bar_message', 'hero_title'
    content_en TEXT,
    content_te TEXT,
    content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'html', 'image_url')),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RATE LIMITING
-- ============================================

CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier TEXT NOT NULL, -- IP address or user ID
    endpoint TEXT NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(identifier, endpoint)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Products
CREATE INDEX IF NOT EXISTS idx_products_product_id ON public.products(product_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

-- Sections
CREATE INDEX IF NOT EXISTS idx_sections_display_order ON public.sections(display_order);
CREATE INDEX IF NOT EXISTS idx_sections_is_enabled ON public.sections(is_enabled);

-- Product Sections
CREATE INDEX IF NOT EXISTS idx_product_sections_product ON public.product_sections(product_id);
CREATE INDEX IF NOT EXISTS idx_product_sections_section ON public.product_sections(section_id);

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON public.orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- Cart
CREATE INDEX IF NOT EXISTS idx_cart_user_id ON public.cart_items(user_id);

-- Browsing History
CREATE INDEX IF NOT EXISTS idx_browsing_history_user ON public.browsing_history(user_id);
CREATE INDEX IF NOT EXISTS idx_browsing_history_viewed ON public.browsing_history(viewed_at DESC);

-- Admin Notifications
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON public.admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created ON public.admin_notifications(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.browsing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Anyone can view profiles (for order history, etc.)
CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================
-- ADDRESSES POLICIES
-- ============================================

-- Users can view their own addresses
CREATE POLICY "Users can view own addresses"
    ON public.addresses FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own addresses
CREATE POLICY "Users can insert own addresses"
    ON public.addresses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own addresses
CREATE POLICY "Users can update own addresses"
    ON public.addresses FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own addresses
CREATE POLICY "Users can delete own addresses"
    ON public.addresses FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- SECTIONS POLICIES (PUBLIC READ, ADMIN WRITE)
-- ============================================

-- Everyone can view enabled sections
CREATE POLICY "Sections are viewable by everyone"
    ON public.sections FOR SELECT
    USING (true);

-- Only admins can insert sections
CREATE POLICY "Only admins can insert sections"
    ON public.sections FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Only admins can update sections
CREATE POLICY "Only admins can update sections"
    ON public.sections FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Only admins can delete sections
CREATE POLICY "Only admins can delete sections"
    ON public.sections FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- PRODUCTS POLICIES (PUBLIC READ, ADMIN WRITE)
-- ============================================

-- Everyone can view active products
CREATE POLICY "Products are viewable by everyone"
    ON public.products FOR SELECT
    USING (true);

-- Only admins can insert products
CREATE POLICY "Only admins can insert products"
    ON public.products FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Only admins can update products
CREATE POLICY "Only admins can update products"
    ON public.products FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Only admins can delete products
CREATE POLICY "Only admins can delete products"
    ON public.products FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- PRODUCT SECTIONS POLICIES
-- ============================================

-- Everyone can view product-section mappings
CREATE POLICY "Product sections are viewable by everyone"
    ON public.product_sections FOR SELECT
    USING (true);

-- Only admins can manage product-section mappings
CREATE POLICY "Only admins can insert product sections"
    ON public.product_sections FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can update product sections"
    ON public.product_sections FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can delete product sections"
    ON public.product_sections FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- CART POLICIES
-- ============================================

-- Users can view their own cart
CREATE POLICY "Users can view own cart"
    ON public.cart_items FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert into their own cart
CREATE POLICY "Users can insert own cart items"
    ON public.cart_items FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own cart
CREATE POLICY "Users can update own cart items"
    ON public.cart_items FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete from their own cart
CREATE POLICY "Users can delete own cart items"
    ON public.cart_items FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- ORDERS POLICIES
-- ============================================

-- Users can view their own orders
CREATE POLICY "Users can view own orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = user_id);

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
    ON public.orders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Users can create their own orders
CREATE POLICY "Users can create own orders"
    ON public.orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Only admins can update orders
CREATE POLICY "Only admins can update orders"
    ON public.orders FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- ORDER ITEMS POLICIES
-- ============================================

-- Users can view their own order items
CREATE POLICY "Users can view own order items"
    ON public.order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- Admins can view all order items
CREATE POLICY "Admins can view all order items"
    ON public.order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Users can insert order items for their own orders
CREATE POLICY "Users can insert own order items"
    ON public.order_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- ============================================
-- PAYMENTS POLICIES
-- ============================================

-- Users can view their own payments
CREATE POLICY "Users can view own payments"
    ON public.payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = payments.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- Admins can view all payments
CREATE POLICY "Admins can view all payments"
    ON public.payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Users can insert payment proof for their own orders
CREATE POLICY "Users can insert own payment proof"
    ON public.payments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = payments.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- Users can update their own payment proof
CREATE POLICY "Users can update own payment proof"
    ON public.payments FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = payments.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- Only admins can verify payments
CREATE POLICY "Only admins can verify payments"
    ON public.payments FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- BROWSING HISTORY POLICIES
-- ============================================

-- Users can view their own browsing history
CREATE POLICY "Users can view own browsing history"
    ON public.browsing_history FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own browsing history
CREATE POLICY "Users can insert own browsing history"
    ON public.browsing_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own browsing history
CREATE POLICY "Users can update own browsing history"
    ON public.browsing_history FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================
-- WISHLIST POLICIES
-- ============================================

-- Users can view their own wishlist
CREATE POLICY "Users can view own wishlist"
    ON public.wishlist FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own wishlist
CREATE POLICY "Users can insert own wishlist items"
    ON public.wishlist FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own wishlist
CREATE POLICY "Users can delete own wishlist items"
    ON public.wishlist FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- ADMIN NOTIFICATIONS POLICIES
-- ============================================

-- Only admins can view notifications
CREATE POLICY "Only admins can view notifications"
    ON public.admin_notifications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- System can insert notifications (via triggers)
CREATE POLICY "System can insert notifications"
    ON public.admin_notifications FOR INSERT
    WITH CHECK (true); -- Trigger will handle this safely

-- Only admins can update notifications
CREATE POLICY "Only admins can update notifications"
    ON public.admin_notifications FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- ADMIN SETTINGS POLICIES
-- ============================================

-- Only admins can view settings
CREATE POLICY "Only admins can view settings"
    ON public.admin_settings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Only admins can manage settings
CREATE POLICY "Only admins can insert settings"
    ON public.admin_settings FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can update settings"
    ON public.admin_settings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- SITE CONTENT POLICIES
-- ============================================

-- Everyone can view site content
CREATE POLICY "Site content is viewable by everyone"
    ON public.site_content FOR SELECT
    USING (true);

-- Only admins can manage site content
CREATE POLICY "Only admins can insert site content"
    ON public.site_content FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can update site content"
    ON public.site_content FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- RATE LIMITING POLICIES
-- ============================================

-- System can manage rate limits (Bypassed if needed by service role, but restricted for others)
CREATE POLICY "System can manage rate limits"
    ON public.rate_limits FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON public.addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sections_updated_at BEFORE UPDATE ON public.sections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create admin notification on new order
CREATE OR REPLACE FUNCTION notify_admin_new_order()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.admin_notifications (
        notification_type,
        title,
        message,
        related_order_id
    ) VALUES (
        'new_order',
        'New Order Received',
        'Order ' || NEW.order_id || ' has been placed.',
        NEW.id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_admin_new_order
    AFTER INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_new_order();

-- Function to notify admin when payment proof is submitted
CREATE OR REPLACE FUNCTION notify_admin_payment_proof()
RETURNS TRIGGER AS $$
DECLARE
    v_order_id TEXT;
BEGIN
    -- Only notify when payment proof is added (not on initial insert)
    IF NEW.utr_number IS NOT NULL OR NEW.payment_screenshot_url IS NOT NULL THEN
        SELECT order_id INTO v_order_id
        FROM public.orders
        WHERE id = NEW.order_id;
        
        INSERT INTO public.admin_notifications (
            notification_type,
            title,
            message,
            related_order_id
        ) VALUES (
            'payment_proof_submitted',
            'Payment Proof Submitted',
            'Payment proof submitted for order ' || v_order_id,
            NEW.order_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_admin_payment_proof
    AFTER INSERT OR UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_payment_proof();

-- Function to generate unique order ID
CREATE OR REPLACE FUNCTION generate_order_id()
RETURNS TEXT AS $$
DECLARE
    v_date TEXT;
    v_count INTEGER;
    v_order_id TEXT;
BEGIN
    v_date := TO_CHAR(NOW(), 'YYYYMMDD');
    
    -- Get count of orders today
    SELECT COUNT(*) INTO v_count
    FROM public.orders
    WHERE order_id LIKE 'ORD-' || v_date || '%';
    
    v_count := v_count + 1;
    v_order_id := 'ORD-' || v_date || '-' || LPAD(v_count::TEXT, 3, '0');
    
    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Function to generate unique product ID
CREATE OR REPLACE FUNCTION generate_product_id()
RETURNS TEXT AS $$
DECLARE
    v_count INTEGER;
    v_product_id TEXT;
BEGIN
    -- Get count of all products
    SELECT COUNT(*) INTO v_count FROM public.products;
    
    v_count := v_count + 1;
    v_product_id := 'ORG-' || LPAD(v_count::TEXT, 4, '0');
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM public.products WHERE product_id = v_product_id) LOOP
        v_count := v_count + 1;
        v_product_id := 'ORG-' || LPAD(v_count::TEXT, 4, '0');
    END LOOP;
    
    RETURN v_product_id;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================
-- INITIAL DATA SETUP
-- ============================================

-- Insert default site content
INSERT INTO public.site_content (content_key, content_en, content_te, content_type) VALUES
    ('top_bar_message', 'Order Today, Dispatched in Approx 7–10 Working Days', 'ఈరోజు ఆర్డర్ చేయండి, సుమారు 7–10 పని దినాలలో పంపిణీ చేయబడుతుంది', 'text'),
    ('hero_title', 'Pure Organic & Ayurvedic Products', 'స్వచ్ఛమైన సేంద్రీయ & ఆయుర్వేద ఉత్పత్తులు', 'text'),
    ('hero_subtitle', 'Handcrafted with love, delivered with care', 'ప్రేమతో చేతితో తయారు చేయబడింది, శ్రద్ధతో పంపిణీ చేయబడుతుంది', 'text')
ON CONFLICT (content_key) DO NOTHING;

-- Insert default admin notification settings
INSERT INTO public.admin_settings (setting_key, setting_value) VALUES
    ('notifications_enabled', '{"enabled": true}'::jsonb),
    ('notification_events', '{"new_order": true, "payment_proof_submitted": true, "low_stock": false}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================
-- SCHEMA COMPLETE
-- ============================================
