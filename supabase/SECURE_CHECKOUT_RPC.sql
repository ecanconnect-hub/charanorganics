-- ========================================================
-- 🛡️ CHARAN ORGANICS - SECURE CHECKOUT & STOCK ALLOCATION
-- ========================================================
-- This script implements a secure, atomic checkout function that:
-- 1. Validates stock levels
-- 2. Deducts stock (preventing race conditions)
-- 3. Creates order and items
-- 4. Handles guest and authenticated users
-- ========================================================

-- Create a type for cart items to simplify the RPC
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_item_input') THEN
        CREATE TYPE order_item_input AS (
            product_id UUID,
            variant_id UUID,
            quantity INTEGER
        );
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.place_secure_order(
    p_full_name TEXT,
    p_phone TEXT,
    p_address TEXT,
    p_city TEXT,
    p_state TEXT,
    p_pincode TEXT,
    p_items order_item_input[],
    p_subtotal DECIMAL,
    p_shipping_total DECIMAL,
    p_total_amount DECIMAL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order_id TEXT;
    v_order_uuid UUID;
    v_item order_item_input;
    v_current_stock INTEGER;
    v_out_of_stock_titles TEXT := '';
BEGIN
    -- 1. Generate Order ID
    v_order_id := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || LPAD(floor(random() * 10000)::text, 4, '0');

    -- 2. Validate and Deduct Stock for each item
    -- We loop through items to lock the rows and check stock
    FOREACH v_item IN ARRAY p_items
    LOOP
        -- If variant is specified, check variant stock
        IF v_item.variant_id IS NOT NULL THEN
            SELECT stock_quantity INTO v_current_stock
            FROM product_variants
            WHERE id = v_item.variant_id
            FOR UPDATE; -- LOCK ROW FOR TRANSACTION

            IF v_current_stock < v_item.quantity THEN
                v_out_of_stock_titles := v_out_of_stock_titles || ' (Variant ID: ' || v_item.variant_id || ')';
            ELSE
                UPDATE product_variants
                SET stock_quantity = stock_quantity - v_item.quantity
                WHERE id = v_item.variant_id;
            END IF;
        ELSE
            -- Check base product stock
            SELECT stock_quantity INTO v_current_stock
            FROM products
            WHERE id = v_item.product_id
            FOR UPDATE; -- LOCK ROW FOR TRANSACTION

            IF v_current_stock < v_item.quantity THEN
                v_out_of_stock_titles := v_out_of_stock_titles || ' (Product ID: ' || v_item.product_id || ')';
            ELSE
                UPDATE products
                SET stock_quantity = stock_quantity - v_item.quantity
                WHERE id = v_item.product_id;
            END IF;
        END IF;
    END LOOP;

    -- 3. If any item was out of stock, rollback
    IF v_out_of_stock_titles <> '' THEN
        RAISE EXCEPTION 'Insufficient stock for items: %', v_out_of_stock_titles;
    END IF;

    -- 4. Create Order Record
    INSERT INTO orders (
        user_id,
        order_id,
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
        auth.uid(),
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
    FOREACH v_item IN ARRAY p_items
    LOOP
        INSERT INTO order_items (
            order_id,
            product_id,
            variant_id,
            quantity,
            unit_price,
            total_price,
            product_title_en,
            product_title_te
        )
        SELECT 
            v_order_uuid,
            p.id,
            v_item.variant_id,
            v_item.quantity,
            COALESCE(v.price, p.current_price),
            v_item.quantity * COALESCE(v.price, p.current_price),
            p.title_en,
            p.title_te
        FROM products p
        LEFT JOIN product_variants v ON v.id = v_item.variant_id
        WHERE p.id = v_item.product_id;
    END LOOP;

    -- 6. Clear user's cart if logged in
    IF auth.uid() IS NOT NULL THEN
        DELETE FROM cart_items WHERE user_id = auth.uid();
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'id', v_order_uuid
    );

EXCEPTION WHEN OTHERS THEN
    -- Transaction automatically rolls back on RAISE EXCEPTION
    RAISE EXCEPTION '%', SQLERRM;
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION public.place_secure_order TO authenticated, anon;

-- ========================================================
-- ✅ SECURE CHECKOUT RPC CREATED
-- ========================================================
