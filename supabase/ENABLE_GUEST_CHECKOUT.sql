-- ========================================================
-- ENABLE GUEST CHECKOUT (ALLOW NULL orders.user_id)
-- ========================================================
-- Fixes:
-- - Guest checkout failing with: "User ID is required for order placement."
-- - Orders table requiring user_id (NOT NULL) which blocks guest orders.
--
-- What this script does:
-- 1) Makes public.orders.user_id nullable (guest orders supported)
-- 2) Drops ALL existing overloads of public.place_secure_order
-- 3) Recreates public.place_secure_order to allow NULL user_id (guest)
-- 4) Locks down RPC execution to service_role (server-only)
-- ========================================================

-- 1) Allow guest orders by making orders.user_id nullable
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'user_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;
    RAISE NOTICE 'orders.user_id is now nullable (guest checkout enabled).';
  ELSE
    RAISE NOTICE 'orders.user_id is already nullable.';
  END IF;
END $$;

-- 2) Ensure the composite type exists for RPC input
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'order_item_input'
  ) THEN
    CREATE TYPE public.order_item_input AS (
      product_id UUID,
      variant_id UUID,
      quantity INTEGER
    );
    RAISE NOTICE 'Created type public.order_item_input.';
  ELSE
    RAISE NOTICE 'Type public.order_item_input already exists.';
  END IF;
END $$;

-- 3) Drop ALL existing versions of place_secure_order to avoid overload ambiguity
DO $$
DECLARE
  func_record RECORD;
BEGIN
  FOR func_record IN
    SELECT pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'place_secure_order'
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS public.place_secure_order(%s) CASCADE', func_record.args);
    RAISE NOTICE 'Dropped function: place_secure_order(%).', func_record.args;
  END LOOP;
END $$;

-- 4) Recreate RPC (guest-safe)
CREATE OR REPLACE FUNCTION public.place_secure_order(
  p_full_name TEXT,
  p_phone TEXT,
  p_address TEXT,
  p_city TEXT,
  p_state TEXT,
  p_pincode TEXT,
  p_items public.order_item_input[],
  p_subtotal NUMERIC,
  p_shipping_total NUMERIC,
  p_total_amount NUMERIC,
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
  -- Determine the user ID to use:
  -- - Auth context: auth.uid()
  -- - Server-side: p_user_id
  -- - Guest: NULL
  v_final_user_id := COALESCE(auth.uid(), p_user_id);

  -- Basic input validation (defense in depth; API already validates)
  IF p_full_name IS NULL OR length(trim(p_full_name)) < 2 THEN
    RAISE EXCEPTION 'Invalid full name';
  END IF;

  IF p_phone IS NULL OR length(regexp_replace(p_phone, '[^0-9]', '', 'g')) < 10 THEN
    RAISE EXCEPTION 'Invalid phone';
  END IF;

  IF p_address IS NULL OR length(trim(p_address)) < 5 THEN
    RAISE EXCEPTION 'Invalid address';
  END IF;

  IF p_pincode IS NULL OR length(regexp_replace(p_pincode, '[^0-9]', '', 'g')) < 4 THEN
    RAISE EXCEPTION 'Invalid pincode';
  END IF;

  IF p_items IS NULL OR array_length(p_items, 1) IS NULL OR array_length(p_items, 1) < 1 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  -- 1. Generate Order ID (Format: ORD-YYYYMMDD-XXXX)
  v_order_id := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || LPAD(floor(random() * 10000)::text, 4, '0');

  -- 2. Validate and Deduct Stock for each item
  FOREACH v_item IN ARRAY p_items
  LOOP
    IF v_item.quantity IS NULL OR v_item.quantity <= 0 OR v_item.quantity > 100 THEN
      RAISE EXCEPTION 'Invalid quantity';
    END IF;

    IF v_item.variant_id IS NOT NULL THEN
      -- Check VARIANT stock
      SELECT stock_quantity, (SELECT title_en FROM products WHERE id = product_variants.product_id)
      INTO v_current_stock, v_title
      FROM product_variants
      WHERE id = v_item.variant_id
      FOR UPDATE; -- lock row

      IF v_current_stock IS NULL THEN
        RAISE EXCEPTION 'Variant not found: %', v_item.variant_id;
      END IF;

      IF v_current_stock < v_item.quantity THEN
        v_out_of_stock_titles := v_out_of_stock_titles || v_title || ' (Variant), ';
      ELSE
        UPDATE product_variants
        SET stock_quantity = stock_quantity - v_item.quantity,
            updated_at = NOW()
        WHERE id = v_item.variant_id;
      END IF;
    ELSE
      -- Check PRODUCT stock
      SELECT stock_quantity, title_en
      INTO v_current_stock, v_title
      FROM products
      WHERE id = v_item.product_id
      FOR UPDATE; -- lock row

      IF v_current_stock IS NULL THEN
        RAISE EXCEPTION 'Product not found: %', v_item.product_id;
      END IF;

      IF v_current_stock < v_item.quantity THEN
        v_out_of_stock_titles := v_out_of_stock_titles || v_title || ', ';
      ELSE
        UPDATE products
        SET stock_quantity = stock_quantity - v_item.quantity,
            updated_at = NOW()
        WHERE id = v_item.product_id;
      END IF;
    END IF;
  END LOOP;

  -- 3. If any item was out of stock, rollback transaction via exception
  IF length(v_out_of_stock_titles) > 0 THEN
    RAISE EXCEPTION 'Insufficient stock for items: %', trim(trailing ', ' from v_out_of_stock_titles);
  END IF;

  -- 4. Create Order Record (user_id can be NULL for guest orders)
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

  -- 5. Create Order Items (snapshot)
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
          COALESCE(v.price, p.current_price) as final_price,
          v.label as variant_label
        FROM products p
        LEFT JOIN product_variants v ON v.id = item_variant_id
        WHERE p.id = item_product_id
      LOOP
        INSERT INTO order_items (
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
          v_order_uuid,
          item_product_id,
          item_variant_id,
          rec.variant_label,
          item_qty,
          rec.final_price,
          rec.final_price * item_qty,
          rec.title_en,
          rec.title_te
        );
      END LOOP;
    END LOOP;
  END;

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

-- 5) Lock down permissions (server-only). Your Next.js /api/checkout uses service_role.
REVOKE ALL ON FUNCTION public.place_secure_order(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, public.order_item_input[],
  NUMERIC, NUMERIC, NUMERIC, UUID
) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.place_secure_order(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, public.order_item_input[],
  NUMERIC, NUMERIC, NUMERIC, UUID
) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.place_secure_order(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, public.order_item_input[],
  NUMERIC, NUMERIC, NUMERIC, UUID
) TO service_role;

NOTIFY pgrst, 'reload schema';
