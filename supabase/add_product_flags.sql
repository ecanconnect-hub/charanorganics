-- Add is_best_seller and is_new columns to products table
-- These flags are used to highlight special products on the frontend

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT FALSE;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_is_best_seller ON public.products(is_best_seller) WHERE is_best_seller = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_is_new ON public.products(is_new) WHERE is_new = TRUE;

-- Add comment
COMMENT ON COLUMN public.products.is_best_seller IS 'Flag to mark product as best seller';
COMMENT ON COLUMN public.products.is_new IS 'Flag to mark product as new arrival';
