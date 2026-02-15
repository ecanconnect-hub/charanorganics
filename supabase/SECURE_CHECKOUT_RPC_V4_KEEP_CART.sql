-- ========================================================
-- ⚠️ SECURE CHECKOUT RPC - V4 (KEEP CART ITEMS) - FIX
-- ========================================================
-- This version removes the ambiguous DROP command.
-- It explicitly drops known signatures before re-creating.
-- ========================================================

-- 1. Drop ALL potential existing signatures explicitly to avoid ambiguity errors
DROP FUNCTION IF EXISTS public.place_secure_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, public.order_item_input[], DECIMAL, DECIMAL, DECIMAL, UUID);
DROP FUNCTION IF EXISTS public.place_secure_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, public.order_item_input[], DECIMAL, DECIMAL, DECIMAL);

-- 2. Re-create the function WITHOUT cart clearing
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
SECURITY DEFINER
SET search_path = public
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
    v_final_user_id := COALESCE(auth.uid(), p_user_id);
    
    IF v_final_user_id IS NULL THEN
        RAISE EXCEPTION 'User ID is required for order placement.';
    END IF;

    -- 1. Generate Order ID
    v_order_id := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || LPAD(floor(random() * 10000)::text, 4, '0');

    -- 2. Validate and Deduct Stock
    FOREACH v_item IN ARRAY p_items
    LOOP
        IF v_item.variant_id IS NOT NULL THEN
            SELECT stock_quantity, (SELECT title_en FROM products WHERE id = product_variants.product_id) 
            INTO v_current_stock, v_title
            FROM product_variants
            WHERE id = v_item.variant_id
            FOR UPDATE;

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
            SELECT stock_quantity, title_en 
            INTO v_current_stock, v_title
            FROM products
            WHERE id = v_item.product_id
            FOR UPDATE;

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

    IF length(v_out_of_stock_titles) > 0 THEN
        RAISE EXCEPTION 'Insufficient stock for items: %', trim(trailing ', ' from v_out_of_stock_titles);
    END IF;

    -- 3. Create Order
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

    -- 4. Create Order Items
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
                    product_title_en,
                    product_title_te
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

    -- 5. DO NOT Clear user's cart here (Removed)
    
    -- Return success
    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'id', v_order_uuid
    );

EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Order placement failed: %', SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION public.place_secure_order TO authenticated, service_role, anon;
NOTIFY pgrst, 'reload schema';
