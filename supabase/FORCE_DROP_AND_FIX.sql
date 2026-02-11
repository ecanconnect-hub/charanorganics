-- ============================================
-- FORCE DROP ALL VERSIONS OF place_secure_order
-- ============================================
-- This script manually drops all possible versions of the function
-- ============================================

-- Drop all known variations of place_secure_order function
-- We'll try multiple signatures to catch all versions

-- Version 1: With order_item_input[] array type
DROP FUNCTION IF EXISTS public.place_secure_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, public.order_item_input[], DECIMAL, DECIMAL, DECIMAL, UUID) CASCADE;

-- Version 2: With JSONB items
DROP FUNCTION IF EXISTS public.place_secure_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, NUMERIC, NUMERIC, NUMERIC, UUID) CASCADE;

-- Version 3: With JSONB items and email
DROP FUNCTION IF EXISTS public.place_secure_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, NUMERIC, NUMERIC, NUMERIC, UUID, TEXT) CASCADE;

-- Version 4: Any other variations
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT 
            p.proname,
            pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'place_secure_order'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS public.place_secure_order(%s) CASCADE', func_record.args);
        RAISE NOTICE 'Dropped function: place_secure_order(%)', func_record.args;
    END LOOP;
END $$;

-- ============================================
-- Now add the columns if needed
-- ============================================

DO $$ 
BEGIN
    -- Add payment_status column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'orders' 
        AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE public.orders 
        ADD COLUMN payment_status TEXT DEFAULT 'pending' 
        CHECK (payment_status IN ('pending', 'verified', 'rejected'));
        
        RAISE NOTICE '✓ payment_status column added';
    ELSE
        RAISE NOTICE '✓ payment_status column already exists';
    END IF;

    -- Add email column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'orders' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE public.orders 
        ADD COLUMN email TEXT;
        
        RAISE NOTICE '✓ email column added';
    ELSE
        RAISE NOTICE '✓ email column already exists';
    END IF;
END $$;

-- Create index
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);

-- ============================================
-- Create the CORRECT function
-- ============================================

CREATE OR REPLACE FUNCTION public.place_secure_order(
    p_full_name TEXT,
    p_phone TEXT,
    p_address TEXT,
    p_city TEXT,
    p_state TEXT,
    p_pincode TEXT,
    p_items JSONB,
    p_subtotal NUMERIC,
    p_shipping_total NUMERIC,
    p_total_amount NUMERIC,
    p_user_id UUID,
    p_email TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order_id UUID;
    v_readable_id TEXT;
    v_item JSONB;
    v_product_id UUID;
    v_variant_id UUID;
    v_quantity INTEGER;
    v_current_stock INTEGER;
    v_product_price NUMERIC;
    v_variant_price NUMERIC;
    v_final_price NUMERIC;
    v_product_title TEXT;
    v_product_title_te TEXT;
    v_variant_label TEXT;
BEGIN
    -- Generate readable Order ID
    v_readable_id := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substring(md5(random()::text) from 1 for 4));

    -- Create Order Record
    INSERT INTO public.orders (
        user_id,
        order_id,
        status,
        total_amount,
        subtotal,
        shipping_total,
        shipping_name,
        shipping_phone,
        shipping_address,
        shipping_city,
        shipping_state,
        shipping_pincode,
        payment_status,
        email
    ) VALUES (
        p_user_id,
        v_readable_id,
        'pending_payment',
        p_total_amount,
        p_subtotal,
        p_shipping_total,
        p_full_name,
        p_phone,
        p_address,
        p_city,
        p_state,
        p_pincode,
        'pending',
        p_email
    ) RETURNING id INTO v_order_id;

    -- Process Items and update stock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_variant_id := NULLIF(v_item->>'variant_id', '')::UUID;
        v_quantity := (v_item->>'quantity')::INTEGER;

        -- Get Product Details
        SELECT title_en, title_te, current_price 
        INTO v_product_title, v_product_title_te, v_product_price
        FROM public.products WHERE id = v_product_id;

        IF v_product_title IS NULL THEN
            RAISE EXCEPTION 'Product not found: %', v_product_id;
        END IF;

        IF v_variant_id IS NOT NULL THEN
            -- Variant Logic
            SELECT price, stock_quantity, label
            INTO v_variant_price, v_current_stock, v_variant_label
            FROM public.product_variants 
            WHERE id = v_variant_id;

            IF v_current_stock IS NULL THEN
                RAISE EXCEPTION 'Variant not found: %', v_variant_id;
            END IF;

            IF v_current_stock < v_quantity THEN
                RAISE EXCEPTION 'Insufficient stock for variant: %', v_variant_label;
            END IF;

            -- Deduct Stock
            UPDATE public.product_variants 
            SET stock_quantity = stock_quantity - v_quantity,
                updated_at = NOW()
            WHERE id = v_variant_id;

            v_final_price := v_variant_price;
        ELSE
            -- Base Product Logic
            SELECT stock_quantity 
            INTO v_current_stock 
            FROM public.products 
            WHERE id = v_product_id;

            IF v_current_stock < v_quantity THEN
                RAISE EXCEPTION 'Insufficient stock for product: %', v_product_title;
            END IF;

            -- Deduct Stock
            UPDATE public.products 
            SET stock_quantity = stock_quantity - v_quantity,
                updated_at = NOW()
            WHERE id = v_product_id;

            v_final_price := v_product_price;
        END IF;

        -- Create Order Item
        INSERT INTO public.order_items (
            order_id,
            product_id,
            variant_id,
            variant_label,
            quantity,
            unit_price,
            total_price,
            product_title_en,
            product_title_te
        ) VALUES (
            v_order_id,
            v_product_id,
            v_variant_id,
            v_variant_label,
            v_quantity,
            v_final_price,
            v_final_price * v_quantity,
            v_product_title,
            v_product_title_te
        );

    END LOOP;

    -- Clear user's cart if logged in
    IF p_user_id IS NOT NULL THEN
        DELETE FROM public.cart_items WHERE user_id = p_user_id;
    END IF;

    -- Return success
    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_readable_id,
        'id', v_order_id
    );

EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Order placement failed: %', SQLERRM;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.place_secure_order TO authenticated, service_role, anon;

-- ============================================
-- COMPLETE ✓
-- ============================================
