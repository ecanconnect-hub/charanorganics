-- ============================================
-- SECURITY MIGRATION: PUBLIC TOKENS
-- ============================================
-- This migration adds public tokens to sensitive tables
-- to prevent IDOR (Insecure Direct Object Reference) attacks
-- 
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. ADD PUBLIC TOKENS TO ORDERS
-- ============================================

-- Add public_token column
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS public_token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_orders_public_token ON public.orders(public_token);

-- Backfill existing records with unique tokens
UPDATE public.orders 
SET public_token = gen_random_uuid() 
WHERE public_token IS NULL;

-- Add constraint to ensure uniqueness
ALTER TABLE public.orders 
ADD CONSTRAINT orders_public_token_unique UNIQUE (public_token);

-- ============================================
-- 2. ADD PUBLIC TOKENS TO ADDRESSES
-- ============================================

ALTER TABLE public.addresses 
ADD COLUMN IF NOT EXISTS public_token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL;

CREATE INDEX IF NOT EXISTS idx_addresses_public_token ON public.addresses(public_token);

UPDATE public.addresses 
SET public_token = gen_random_uuid() 
WHERE public_token IS NULL;

ALTER TABLE public.addresses 
ADD CONSTRAINT addresses_public_token_unique UNIQUE (public_token);

-- ============================================
-- 3. ADD PUBLIC TOKENS TO PAYMENTS
-- ============================================

ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS public_token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_public_token ON public.payments(public_token);

UPDATE public.payments 
SET public_token = gen_random_uuid() 
WHERE public_token IS NULL;

ALTER TABLE public.payments 
ADD CONSTRAINT payments_public_token_unique UNIQUE (public_token);

-- ============================================
-- 4. TRIGGER TO AUTO-GENERATE TOKENS
-- ============================================

-- Function to ensure public token is set
CREATE OR REPLACE FUNCTION ensure_public_token()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.public_token IS NULL THEN
        NEW.public_token := gen_random_uuid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for orders
DROP TRIGGER IF EXISTS ensure_orders_public_token ON public.orders;
CREATE TRIGGER ensure_orders_public_token
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION ensure_public_token();

-- Trigger for addresses
DROP TRIGGER IF EXISTS ensure_addresses_public_token ON public.addresses;
CREATE TRIGGER ensure_addresses_public_token
    BEFORE INSERT ON public.addresses
    FOR EACH ROW
    EXECUTE FUNCTION ensure_public_token();

-- Trigger for payments
DROP TRIGGER IF EXISTS ensure_payments_public_token ON public.payments;
CREATE TRIGGER ensure_payments_public_token
    BEFORE INSERT ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION ensure_public_token();

-- ============================================
-- 5. HELPER FUNCTIONS FOR TOKEN RESOLUTION
-- ============================================

-- Function to get order by public token with ownership check
CREATE OR REPLACE FUNCTION get_order_by_token(
    p_public_token UUID,
    p_user_id UUID
) RETURNS TABLE (
    id UUID,
    order_id TEXT,
    status TEXT,
    total_amount DECIMAL,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.order_id,
        o.status,
        o.total_amount,
        o.created_at
    FROM public.orders o
    WHERE o.public_token = p_public_token
    AND o.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get address by public token with ownership check
CREATE OR REPLACE FUNCTION get_address_by_token(
    p_public_token UUID,
    p_user_id UUID
) RETURNS TABLE (
    id UUID,
    name TEXT,
    phone TEXT,
    address_line TEXT,
    pincode TEXT,
    city TEXT,
    state TEXT,
    is_default BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.name,
        a.phone,
        a.address_line,
        a.pincode,
        a.city,
        a.state,
        a.is_default
    FROM public.addresses a
    WHERE a.public_token = p_public_token
    AND a.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify all orders have public tokens
DO $$
DECLARE
    missing_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO missing_count
    FROM public.orders
    WHERE public_token IS NULL;
    
    IF missing_count > 0 THEN
        RAISE NOTICE 'WARNING: % orders are missing public tokens', missing_count;
    ELSE
        RAISE NOTICE 'SUCCESS: All orders have public tokens';
    END IF;
END $$;

-- Verify all addresses have public tokens
DO $$
DECLARE
    missing_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO missing_count
    FROM public.addresses
    WHERE public_token IS NULL;
    
    IF missing_count > 0 THEN
        RAISE NOTICE 'WARNING: % addresses are missing public tokens', missing_count;
    ELSE
        RAISE NOTICE 'SUCCESS: All addresses have public tokens';
    END IF;
END $$;

-- Verify all payments have public tokens
DO $$
DECLARE
    missing_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO missing_count
    FROM public.payments
    WHERE public_token IS NULL;
    
    IF missing_count > 0 THEN
        RAISE NOTICE 'WARNING: % payments are missing public tokens', missing_count;
    ELSE
        RAISE NOTICE 'SUCCESS: All payments have public tokens';
    END IF;
END $$;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Public token migration completed successfully';
    RAISE NOTICE '📝 Next steps:';
    RAISE NOTICE '   1. Update frontend to use public_token instead of id in URLs';
    RAISE NOTICE '   2. Update API routes to resolve tokens server-side';
    RAISE NOTICE '   3. Add ownership verification to all sensitive endpoints';
    RAISE NOTICE '   4. Test IDOR prevention by attempting cross-user access';
END $$;
