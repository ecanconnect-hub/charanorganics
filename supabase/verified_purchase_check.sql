-- Function to check if user has purchased a product
-- Returns TRUE only if user has a delivered order containing the product

CREATE OR REPLACE FUNCTION public.has_purchased_product(
    p_user_id UUID,
    p_product_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user has any delivered orders containing this product
    RETURN EXISTS (
        SELECT 1
        FROM public.orders o
        INNER JOIN public.order_items oi ON oi.order_id = o.id
        WHERE o.user_id = p_user_id
        AND oi.product_id = p_product_id
        AND o.status = 'delivered'
    );
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.has_purchased_product IS 'Checks if a user has purchased and received a specific product';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.has_purchased_product TO authenticated;
