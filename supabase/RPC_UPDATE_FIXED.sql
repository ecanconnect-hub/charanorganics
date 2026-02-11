-- CORRECT RPC Function for place_secure_order
-- This matches your actual database schema with individual shipping columns

DROP FUNCTION IF EXISTS public.place_secure_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, NUMERIC, NUMERIC, NUMERIC, UUID, TEXT);

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
    -- 1. Create Order
    -- Generate readable ID (e.g., ORD-20240101-XXXX)
    v_readable_id := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substring(md5(random()::text) from 1 for 4));

    INSERT INTO public.orders (
        user_id,
        order_id,
        status,
        total_amount,
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
        p_full_name,
        p_phone,
        p_address,
        p_city,
        p_state,
        p_pincode,
        'pending',
        p_email
    ) RETURNING id INTO v_order_id;

    -- 2. Process Items and update stock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_variant_id := (v_item->>'variant_id')::UUID;
        v_quantity := (v_item->>'quantity')::INTEGER;

        -- Get Product Details
        SELECT title_en, title_te, current_price 
        INTO v_product_title, v_product_title_te, v_product_price
        FROM public.products WHERE id = v_product_id;

        IF v_variant_id IS NOT NULL THEN
            -- Variant Logic
            SELECT price, stock_quantity, label
            INTO v_variant_price, v_current_stock, v_variant_label
            FROM public.product_variants 
            WHERE id = v_variant_id;

            IF v_current_stock < v_quantity THEN
                RAISE EXCEPTION 'Insufficient stock for variant: %', v_variant_label;
            END IF;

            -- Deduct Stock
            UPDATE public.product_variants 
            SET stock_quantity = stock_quantity - v_quantity 
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
            SET stock_quantity = stock_quantity - v_quantity 
            WHERE id = v_product_id;

            v_final_price := v_product_price;
        END IF;

        -- Create Order Item
        INSERT INTO public.order_items (
            order_id,
            product_id,
            variant_id,
            quantity,
            unit_price,
            total_price,
            product_title_en,
            product_title_te,
            variant_label
        ) VALUES (
            v_order_id,
            v_product_id,
            v_variant_id,
            v_quantity,
            v_final_price,
            v_final_price * v_quantity,
            v_product_title,
            v_product_title_te,
            v_variant_label
        );

    END LOOP;

    -- Return success object
    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_readable_id,
        'id', v_order_id
    );

EXCEPTION WHEN OTHERS THEN
    -- Rollback is automatic in PL/pgSQL
    RAISE;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.place_secure_order TO authenticated, service_role, anon;
