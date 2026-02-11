-- ========================================================
-- ⚠️ SECURE CHECKOUT RPC REPAIR - V3 (FINAL)
-- ========================================================
-- This script fixes the "function not found" error by ensuring
-- the function signature EXACTLY matches what the API calls.
-- ========================================================

-- 1. First, drop any existing versions of the function to avoid ambiguity
DROP FUNCTION IF EXISTS public.place_secure_order;
DROP FUNCTION IF EXISTS public.place_secure_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, public.order_item_input[], DECIMAL, DECIMAL, DECIMAL);
DROP FUNCTION IF EXISTS public.place_secure_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, public.order_item_input[], DECIMAL, DECIMAL, DECIMAL, UUID);

-- 2. Ensure the order_item_input type exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_item_input') THEN
        CREATE TYPE public.order_item_input AS (
            product_id UUID,
            variant_id UUID,
            quantity INTEGER
        );
    END IF;
END $$;

-- 3. Re-create the function with all required parameters
-- Note: We default p_user_id to NULL so it's optional but still part of the signature
CREATE OR REPLACE FUNCTION public.place_secure_order(
    p_full_name TEXT,
    p_phone TEXT,
    p_address TEXT,
    p_city TEXT,
    p_state TEXT,
    p_pincode TEXT,
    p_items public.order_item_input[],
    p_subtotal DECIMAL,
    p_shipping_total DECIMAL,
    p_total_amount DECIMAL,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with owner privileges (bypassing RLS for stock checks)
SET search_path = public -- Security best practice
AS $$
DECLARE
    v_order_id TEXT;
    v_order_uuid UUID;
    v_item public.order_item_input;
    v_current_stock INTEGER;
    v_title TEXT;
    v_out_of_stock_titles TEXT := '';
    v_final_user_id UUID;
BEGIN
    -- Determine the user ID to use:
    -- 1. If called from an authenticated context (client-side), use auth.uid()
    -- 2. If called from server-side (service role) with p_user_id, use that
    -- 3. Otherwise, treat as guest (NULL)
    v_final_user_id := COALESCE(auth.uid(), p_user_id);
    
    -- GUEST CHECK: If no user ID is found, we typically need a guest user or similar mechanism.
    -- For now, if your schema REQUIRES user_id on orders, this will fail for guests unless you handle it.
    -- Assumption: Your `orders` table has `user_id` as NOT NULL.
    -- If you support Guest Checkout without accounts, you need a placeholder user or allow NULL.
    -- Based on your schema: `user_id UUID NOT NULL REFERENCES public.profiles(id)`
    -- This means GUEST CHECKOUT IS NOT NATIVELY SUPPORTED in DB without a user record.
    
    IF v_final_user_id IS NULL THEN
        RAISE EXCEPTION 'User ID is required for order placement. Guest checkout without account is not currently supported by DB schema.';
    END IF;

    -- 1. Generate Order ID (Format: ORD-YYYYMMDD-XXXX)
    v_order_id := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || LPAD(floor(random() * 10000)::text, 4, '0');

    -- 2. Validate and Deduct Stock for each item
    FOREACH v_item IN ARRAY p_items
    LOOP
        IF v_item.variant_id IS NOT NULL THEN
            -- Check VARIANT stock
            SELECT stock_quantity, (SELECT title_en FROM products WHERE id = product_variants.product_id) 
            INTO v_current_stock, v_title
            FROM product_variants
            WHERE id = v_item.variant_id
            FOR UPDATE; -- LOCK ROW

            IF v_current_stock IS NULL THEN
                 RAISE EXCEPTION 'Variant not found: %', v_item.variant_id;
            END IF;

            IF v_current_stock < v_item.quantity THEN
                v_out_of_stock_titles := v_out_of_stock_titles || v_title || ' (Variant), ';
            ELSE
                UPDATE product_variants
                SET stock_quantity = stock_quantity - v_item.quantity
                WHERE id = v_item.variant_id;
            END IF;
        ELSE
            -- Check PRODUCT stock
            SELECT stock_quantity, title_en 
            INTO v_current_stock, v_title
            FROM products
            WHERE id = v_item.product_id
            FOR UPDATE; -- LOCK ROW

            IF v_current_stock IS NULL THEN
                 RAISE EXCEPTION 'Product not found: %', v_item.product_id;
            END IF;

            IF v_current_stock < v_item.quantity THEN
                v_out_of_stock_titles := v_out_of_stock_titles || v_title || ', ';
            ELSE
                UPDATE products
                SET stock_quantity = stock_quantity - v_item.quantity
                WHERE id = v_item.product_id;
            END IF;
        END IF;
    END LOOP;

    -- 3. If any item was out of stock, rollback transaction via exception
    IF length(v_out_of_stock_titles) > 0 THEN
        RAISE EXCEPTION 'Insufficient stock for items: %', trim(trailing ', ' from v_out_of_stock_titles);
    END IF;

    -- 4. Create Order Record
    INSERT INTO orders (
        user_id,
        order_id,    -- Verified from schema: column is `order_id`
        shipping_name,
        shipping_phone,
        shipping_address,
        shipping_city,
        shipping_state,
        shipping_pincode,
        subtotal,
        shipping_total,
        total_amount,
        status
    ) VALUES (
        v_final_user_id,
        v_order_id,
        p_full_name,
        p_phone,
        p_address,
        p_city,
        p_state,
        p_pincode,
        p_subtotal,
        p_shipping_total,
        p_total_amount,
        'pending_payment'
    ) RETURNING id INTO v_order_uuid;

    -- 5. Create Order Items
    DECLARE
        item_product_id UUID;
        item_variant_id UUID;
        item_qty INTEGER;
        rec RECORD;
    BEGIN
        FOREACH v_item IN ARRAY p_items
        LOOP
            item_product_id := v_item.product_id;
            item_variant_id := v_item.variant_id;
            item_qty := v_item.quantity;

            FOR rec IN 
                SELECT 
                    p.id as pid,
                    p.title_en,
                    p.title_te,
                    COALESCE(v.price, p.current_price) as final_price
                FROM products p
                LEFT JOIN product_variants v ON v.id = item_variant_id
                WHERE p.id = item_product_id
            LOOP
                INSERT INTO order_items (
                    order_id,
                    product_id,
                    variant_id,
                    quantity,
                    unit_price,
                    total_price,
                    product_title_en,  -- Verified from schema: `product_title_en`
                    product_title_te   -- Verified from schema: `product_title_te`
                ) VALUES (
                    v_order_uuid,
                    item_product_id,
                    item_variant_id,
                    item_qty,
                    rec.final_price,
                    rec.final_price * item_qty,
                    rec.title_en,
                    rec.title_te
                );
            END LOOP;
        END LOOP;
    END;

    -- 6. Clear user's cart if logged in
    IF v_final_user_id IS NOT NULL THEN
        DELETE FROM cart_items WHERE user_id = v_final_user_id;
    END IF;
    
    -- 7. Trigger Notification (Handled by Trigger on Table, essentially automatic)

    -- Return success
    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'id', v_order_uuid
    );

EXCEPTION WHEN OTHERS THEN
    -- Transaction automatically rolls back
    RAISE EXCEPTION 'Order placement failed: %', SQLERRM;
END;
$$;

-- Grant permissions explicitly
GRANT EXECUTE ON FUNCTION public.place_secure_order TO authenticated, service_role, anon;

-- Force schema cache refresh recommendation
NOTIFY pgrst, 'reload schema';
