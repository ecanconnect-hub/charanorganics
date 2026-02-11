-- Add unit/weight fields to products table
-- This allows products to specify their quantity (e.g., 100ml, 500gm, 1kg, etc.)

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS unit_value DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS unit_type TEXT CHECK (unit_type IN ('gm', 'kg', 'ml', 'l', 'pcs'));

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_unit_type ON public.products(unit_type);

-- Add comments
COMMENT ON COLUMN public.products.unit_value IS 'Numeric value of the unit (e.g., 100 for 100ml)';
COMMENT ON COLUMN public.products.unit_type IS 'Type of unit: gm (grams), kg (kilograms), ml (milliliters), l (liters), pcs (pieces)';
