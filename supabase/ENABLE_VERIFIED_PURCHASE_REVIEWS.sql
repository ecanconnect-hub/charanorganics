-- ========================================================
-- ENABLE VERIFIED PURCHASE REVIEWS
-- ========================================================
-- Goal:
-- - Only customers who have a DELIVERED order for a product can submit a review.
-- - Public can read reviews.
-- - Reviews get a verified_purchase flag for UI badges.
--
-- Notes:
-- - Review submission is done from the client (authenticated user), so RLS must enforce this.
-- - This migration is idempotent and safe to re-run.
-- ========================================================

-- Ensure UUID generation is available (Supabase usually has this)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 0) Ensure reviews table exists (some DBs may not have it yet)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'reviews'
  ) THEN
    CREATE TABLE public.reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
      user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
      rating INTEGER CHECK (rating >= 1 AND rating <= 5),
      review_text VARCHAR(200) NOT NULL,
      verified_purchase BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    RAISE NOTICE 'Created table public.reviews.';
  ELSE
    RAISE NOTICE 'Table public.reviews already exists.';
  END IF;
END $$;

-- 1) Ensure reviews has verified_purchase flag
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS verified_purchase BOOLEAN DEFAULT FALSE;

-- 2) Helper: check if current logged-in user has a delivered order for a product
-- Uses auth.uid() (no user_id parameter) to avoid leaking other users' purchase history.
CREATE OR REPLACE FUNCTION public.has_delivered_product(p_product_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.orders o
    INNER JOIN public.order_items oi ON oi.order_id = o.id
    WHERE o.user_id = auth.uid()
      AND o.status = 'delivered'
      AND oi.product_id = p_product_id
  );
$$;

REVOKE ALL ON FUNCTION public.has_delivered_product(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_delivered_product(UUID) TO authenticated;

-- 3) Keep verified_purchase accurate even if the row is updated
CREATE OR REPLACE FUNCTION public.sync_review_verified_purchase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.verified_purchase := public.has_delivered_product(NEW.product_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_verified_purchase ON public.reviews;
CREATE TRIGGER set_verified_purchase
BEFORE INSERT OR UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.sync_review_verified_purchase();

-- 4) Enable RLS (required for Supabase security)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 5) Policies (drop old ones by known names)
DROP POLICY IF EXISTS "Public read reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admin can delete any review" ON public.reviews;
DROP POLICY IF EXISTS "Users can insert own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Only verified buyers can review" ON public.reviews;
DROP POLICY IF EXISTS "Verified buyers can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Verified buyers can update own reviews" ON public.reviews;

-- Public can read
CREATE POLICY "Public read reviews"
  ON public.reviews
  FOR SELECT
  USING (true);

-- Only delivered buyers can insert
CREATE POLICY "Verified buyers can insert reviews"
  ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND public.has_delivered_product(product_id) = true
  );

-- Only delivered buyers can update their own reviews
CREATE POLICY "Verified buyers can update own reviews"
  ON public.reviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND public.has_delivered_product(product_id) = true
  );

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews"
  ON public.reviews
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin can delete any review
CREATE POLICY "Admin can delete any review"
  ON public.reviews
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );

-- 6) Backfill existing rows (so badge is correct for older reviews)
UPDATE public.reviews r
SET verified_purchase = EXISTS (
  SELECT 1
  FROM public.orders o
  INNER JOIN public.order_items oi ON oi.order_id = o.id
  WHERE o.user_id = r.user_id
    AND o.status = 'delivered'
    AND oi.product_id = r.product_id
);

-- 7) Performance indexes
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_verified ON public.reviews(verified_purchase) WHERE verified_purchase = TRUE;

NOTIFY pgrst, 'reload schema';
