-- ============================================
-- VERIFIED PURCHASE REVIEW SYSTEM
-- ============================================
-- Ensures only users who received delivered products can leave reviews

-- Step 1: Create function to check if user has purchased product
CREATE OR REPLACE FUNCTION public.has_purchased_product(
    p_user_id UUID,
    p_product_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user has any DELIVERED orders containing this product
    -- Only delivered orders count as verified purchases
    RETURN EXISTS (
        SELECT 1
        FROM public.orders o
        INNER JOIN public.order_items oi ON oi.order_id = o.id
        WHERE o.user_id = p_user_id
        AND oi.product_id = p_product_id
        AND o.status = 'delivered'  -- CRITICAL: Only delivered orders
    );
END;
$$;

COMMENT ON FUNCTION public.has_purchased_product IS 'Checks if user has received a delivered product (verified purchase)';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.has_purchased_product TO authenticated;

-- Step 2: Drop existing review insert policy if it exists
DROP POLICY IF EXISTS "Users can insert own reviews" ON public.reviews;

-- Step 3: Create NEW policy that requires verified purchase
CREATE POLICY "Only verified buyers can review"
    ON public.reviews
    FOR INSERT
    WITH CHECK (
        -- User must be authenticated
        auth.uid() = user_id
        -- AND user must have purchased and received the product
        AND public.has_purchased_product(auth.uid(), product_id) = TRUE
    );

-- Step 4: Add verified_purchase column to reviews table (optional but recommended)
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS verified_purchase BOOLEAN DEFAULT FALSE;

-- Step 5: Create trigger to automatically mark reviews as verified
CREATE OR REPLACE FUNCTION public.mark_review_as_verified()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Automatically set verified_purchase flag
    NEW.verified_purchase := public.has_purchased_product(NEW.user_id, NEW.product_id);
    RETURN NEW;
END;
$$;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS set_verified_purchase ON public.reviews;

-- Create trigger
CREATE TRIGGER set_verified_purchase
    BEFORE INSERT ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.mark_review_as_verified();

-- Step 6: Add index for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_verified ON public.reviews(verified_purchase) WHERE verified_purchase = TRUE;

-- Add comments
COMMENT ON COLUMN public.reviews.verified_purchase IS 'TRUE if reviewer has received delivered product';
COMMENT ON TRIGGER set_verified_purchase ON public.reviews IS 'Automatically marks reviews from verified buyers';

-- ============================================
-- SUMMARY
-- ============================================
-- ✅ Only users with DELIVERED orders can review
-- ✅ Payment alone is NOT enough
-- ✅ Automatic verification badge on reviews
-- ✅ RLS policy enforces at database level
-- ✅ Cannot be bypassed from frontend
