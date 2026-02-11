-- ========================================================
-- 🛡️ CHARAN ORGANICS - PAYMENT INTEGRITY HARDENING
-- ========================================================
-- Prevents duplicate payment submissions and spam.

-- 1. Add Unique constraint to prevent same UTR being used multiple times
-- (This also helps prevent double-submission by the Same user)
ALTER TABLE public.payments 
DROP CONSTRAINT IF EXISTS unique_utr_per_payment;

ALTER TABLE public.payments 
ADD CONSTRAINT unique_utr_per_payment UNIQUE (utr_number);

-- 2. Add Index for performance
CREATE INDEX IF NOT EXISTS idx_payments_utr ON public.payments(utr_number);

-- 3. Hardening verification function (search_path)
CREATE OR REPLACE FUNCTION public.submit_payment_details_v3(
    p_order_uuid UUID,
    p_utr TEXT,
    p_screenshot_url TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Validate if UTR already exists to avoid generic DB error for user
    IF EXISTS (SELECT 1 FROM public.payments WHERE utr_number = p_utr) THEN
        RAISE EXCEPTION 'Transaction ID (UTR) already submitted. If this is an error, please contact support.';
    END IF;

    -- 1. Insert Payment Record
    INSERT INTO public.payments (order_id, utr_number, payment_screenshot_url, status)
    VALUES (p_order_uuid, p_utr, p_screenshot_url, 'pending');

    -- 2. Update Order Status
    UPDATE public.orders
    SET status = 'payment_verification'
    WHERE id = p_order_uuid;
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION public.submit_payment_details_v3 TO authenticated, anon;

-- ========================================================
-- ✅ PAYMENT INTEGRITY HARDENED
-- ========================================================
