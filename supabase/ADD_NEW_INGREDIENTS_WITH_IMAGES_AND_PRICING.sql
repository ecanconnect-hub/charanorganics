-- Add missing ingredient products with provided Cloudinary images and fixed pricing.
-- Idempotent and safe to re-run.
-- Scope: only incoming product set in this file.

BEGIN;

-- Ensure unit columns exist (some old schemas may not have these yet).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'unit_value'
  ) THEN
    ALTER TABLE public.products ADD COLUMN unit_value DECIMAL(10, 2);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'unit_type'
  ) THEN
    ALTER TABLE public.products ADD COLUMN unit_type TEXT;
  END IF;
END $$;

CREATE TEMP TABLE incoming_products (
  new_product_id TEXT PRIMARY KEY,
  title_en TEXT NOT NULL,
  image_url TEXT NOT NULL,
  unit_value DECIMAL(10, 2),
  unit_type TEXT,
  current_price DECIMAL(10, 2) NOT NULL,
  mrp DECIMAL(10, 2) NOT NULL,
  shipping_charges DECIMAL(10, 2) NOT NULL DEFAULT 70,
  stock_quantity INTEGER NOT NULL DEFAULT 100,
  section_family TEXT NOT NULL -- base | wax | surfactant | active | color
);

INSERT INTO incoming_products (
  new_product_id, title_en, image_url, unit_value, unit_type, current_price, mrp, shipping_charges, stock_quantity, section_family
)
VALUES
  ('BC230', 'Candelilla Wax', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1773507265/Candelilla-Wax_zodp92.webp', 50, 'gm', 200, 200, 70, 100, 'wax'),
  ('BC231', 'Lipstick Colour - Red (Mica)', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1773507266/Lipstick_Colour_Red_Mica_e0rkar.jpg', 10, 'gm', 200, 200, 70, 100, 'color'),
  ('BC232', 'Lipstick Colour - Pink (Mica)', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1773507264/Lipstick_Colour_Pink_Mica_irluvk.jpg', 10, 'gm', 200, 200, 70, 100, 'color'),
  ('BC233', 'Lipstick Colour - Orange (Mica)', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1773507265/Lipstick_Colour_Orange_Mica_qko1of.jpg', 10, 'gm', 200, 200, 70, 100, 'color'),
  ('BC234', 'Lipstick Colour - Maroon (Mica)', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1773507264/Lipstick_Colour_Maroon_Mica_rpbvwb.webp', 10, 'gm', 200, 200, 70, 100, 'color'),
  ('BC235', 'Goat Milk Soap Base', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1773507268/Goat_Milk_Soap_Base_pdjitb.jpg', 1, 'kg', 350, 350, 70, 100, 'base'),
  ('BC236', 'Coconut Milk Soap Base', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1773507268/Coconut_Milk_Soap_Base_z6jrys.jpg', 1, 'kg', 330, 330, 70, 100, 'base'),
  ('BC237', 'Shea Butter Soap Base', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1773507267/Shea_Butter_Soap_Base_koa5ty.jpg', 1, 'kg', 350, 350, 70, 100, 'base'),
  ('BC238', 'Epsom Salt', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1773507268/Epsom_Salt_tgs4yl.jpg', 100, 'gm', 70, 70, 70, 100, 'active'),
  ('BC239', 'Coco Di', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1773507267/Coco_Di_etete0.jpg', 100, 'ml', 70, 70, 70, 100, 'surfactant'),
  ('BC240', 'Polysorbate', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1773507268/Polysorbate_tb1nae.jpg', 100, 'gm', 70, 70, 70, 100, 'surfactant'),
  ('BC241', 'Polyquaternium', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1773507267/Polyquaternium_d3s93c.webp', 50, 'gm', 550, 550, 70, 100, 'active'),
  ('BC242', 'D-Panthenol', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1773507266/D-Panthenol_wir3qs.webp', 50, 'gm', 150, 150, 70, 100, 'active'),
  ('BC243', 'Lemon Salt', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1773507266/Lemon_Salt_jsfmdu.jpg', 100, 'gm', 70, 70, 70, 100, 'active'),
  ('BC244', 'Olivem 100', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1773507267/Olivem_100_ml2sav.webp', 50, 'gm', 300, 300, 70, 100, 'wax'),
  ('BC245', 'Cocomono', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1773507266/Cocomono_y3ea8h.webp', 50, 'gm', 80, 80, 70, 100, 'surfactant'),
  ('BC246', 'BTMS', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1773507267/BTMS_cnoivx.jpg', 50, 'gm', 180, 180, 70, 100, 'wax'),
  ('BC247', 'Niacinamide', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1773507266/Niacinamide_da3v9b.webp', 50, 'gm', 150, 150, 70, 100, 'active'),
  ('BC248', 'Kojic Acid', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1773507265/Kojic_Acid_gyvz2w.webp', 25, 'gm', 150, 150, 70, 100, 'active'),
  ('BC249', 'Sodium Lactate', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1773507265/Sodium_Lactate_dlqbd1.webp', 100, 'gm', 150, 150, 70, 100, 'active'),
  ('BC250', 'Vitamin C', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1773507265/Vitamin_C_onf1kt.jpg', 50, 'gm', 150, 150, 70, 100, 'active'),
  ('BC251', 'Alpha Arbutin', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1773507265/Alpha_Arbutin_quboan.webp', 100, 'gm', 300, 300, 70, 100, 'active');

-- Normalize helper for duplicate-safe matching by title.
WITH existing_norm AS (
  SELECT
    p.id,
    p.product_id,
    lower(regexp_replace(trim(p.title_en), '[^a-z0-9]+', '', 'g')) AS norm_title
  FROM public.products p
),
incoming_norm AS (
  SELECT
    i.*,
    lower(regexp_replace(trim(i.title_en), '[^a-z0-9]+', '', 'g')) AS norm_title
  FROM incoming_products i
)
UPDATE public.products p
SET
  title_en = i.title_en,
  title_te = COALESCE(NULLIF(p.title_te, ''), i.title_en),
  image_url = i.image_url,
  description_en = COALESCE(
    NULLIF(p.description_en, ''),
    CASE
      WHEN i.section_family = 'base' THEN i.title_en || ' is a ready-to-use base ingredient for batch production and DIY personal care formulations.'
      WHEN i.section_family = 'wax' THEN i.title_en || ' is a premium structuring ingredient used to build stability, texture, and consistency in creams, balms, and bars.'
      WHEN i.section_family = 'surfactant' THEN i.title_en || ' is a functional cleansing/solubilizing ingredient used in shampoos, face wash, and rinse-off systems.'
      WHEN i.section_family = 'color' THEN i.title_en || ' is a high-impact cosmetic color additive suitable for lip care and decorative cosmetic formulations.'
      ELSE i.title_en || ' is an active formulation ingredient used for targeted cosmetic performance and product enhancement.'
    END
  ),
  specifications_en = COALESCE(
    NULLIF(p.specifications_en, ''),
    trim(to_char(i.unit_value, 'FM999990.##')) || ' ' || COALESCE(i.unit_type, '') || ' | Cosmetic grade'
  ),
  usage_en = COALESCE(
    NULLIF(p.usage_en, ''),
    CASE
      WHEN i.section_family = 'base' THEN 'Melt or process as required and blend with fragrance/color/additives before pouring into moulds.'
      WHEN i.section_family = 'wax' THEN 'Heat with oil phase and mix uniformly to achieve stable texture and emulsification.'
      WHEN i.section_family = 'surfactant' THEN 'Use at formulation-appropriate percentage in rinse-off cleanser systems.'
      WHEN i.section_family = 'color' THEN 'Disperse in suitable base and add gradually to achieve the desired color intensity.'
      ELSE 'Add in recommended percentage during formulation and mix until fully dispersed.'
    END
  ),
  unit_value = i.unit_value,
  unit_type = i.unit_type,
  mrp = i.mrp,
  current_price = i.current_price,
  shipping_charges = i.shipping_charges,
  stock_quantity = COALESCE(NULLIF(p.stock_quantity, 0), i.stock_quantity),
  is_active = TRUE,
  updated_at = NOW()
FROM incoming_norm i
JOIN existing_norm e
  ON e.norm_title = i.norm_title
WHERE p.id = e.id;

-- Insert only those not already present (by normalized title).
WITH existing_norm AS (
  SELECT lower(regexp_replace(trim(title_en), '[^a-z0-9]+', '', 'g')) AS norm_title
  FROM public.products
),
incoming_norm AS (
  SELECT
    i.*,
    lower(regexp_replace(trim(i.title_en), '[^a-z0-9]+', '', 'g')) AS norm_title
  FROM incoming_products i
)
INSERT INTO public.products (
  product_id,
  title_en,
  title_te,
  description_en,
  description_te,
  specifications_en,
  specifications_te,
  usage_en,
  usage_te,
  image_url,
  mrp,
  current_price,
  shipping_charges,
  stock_quantity,
  is_active,
  unit_value,
  unit_type
)
SELECT
  i.new_product_id,
  i.title_en,
  i.title_en,
  CASE
    WHEN i.section_family = 'base' THEN i.title_en || ' is a ready-to-use base ingredient for batch production and DIY personal care formulations.'
    WHEN i.section_family = 'wax' THEN i.title_en || ' is a premium structuring ingredient used to build stability, texture, and consistency in creams, balms, and bars.'
    WHEN i.section_family = 'surfactant' THEN i.title_en || ' is a functional cleansing/solubilizing ingredient used in shampoos, face wash, and rinse-off systems.'
    WHEN i.section_family = 'color' THEN i.title_en || ' is a high-impact cosmetic color additive suitable for lip care and decorative cosmetic formulations.'
    ELSE i.title_en || ' is an active formulation ingredient used for targeted cosmetic performance and product enhancement.'
  END,
  i.title_en,
  trim(to_char(i.unit_value, 'FM999990.##')) || ' ' || COALESCE(i.unit_type, '') || ' | Cosmetic grade',
  trim(to_char(i.unit_value, 'FM999990.##')) || ' ' || COALESCE(i.unit_type, '') || ' | Cosmetic grade',
  CASE
    WHEN i.section_family = 'base' THEN 'Melt or process as required and blend with fragrance/color/additives before pouring into moulds.'
    WHEN i.section_family = 'wax' THEN 'Heat with oil phase and mix uniformly to achieve stable texture and emulsification.'
    WHEN i.section_family = 'surfactant' THEN 'Use at formulation-appropriate percentage in rinse-off cleanser systems.'
    WHEN i.section_family = 'color' THEN 'Disperse in suitable base and add gradually to achieve the desired color intensity.'
    ELSE 'Add in recommended percentage during formulation and mix until fully dispersed.'
  END,
  CASE
    WHEN i.section_family = 'base' THEN 'Melt or process as required and blend with fragrance/color/additives before pouring into moulds.'
    WHEN i.section_family = 'wax' THEN 'Heat with oil phase and mix uniformly to achieve stable texture and emulsification.'
    WHEN i.section_family = 'surfactant' THEN 'Use at formulation-appropriate percentage in rinse-off cleanser systems.'
    WHEN i.section_family = 'color' THEN 'Disperse in suitable base and add gradually to achieve the desired color intensity.'
    ELSE 'Add in recommended percentage during formulation and mix until fully dispersed.'
  END,
  i.image_url,
  i.mrp,
  i.current_price,
  i.shipping_charges,
  i.stock_quantity,
  TRUE,
  i.unit_value,
  i.unit_type
FROM incoming_norm i
LEFT JOIN existing_norm e
  ON e.norm_title = i.norm_title
WHERE e.norm_title IS NULL
ON CONFLICT (product_id)
DO UPDATE SET
  title_en = EXCLUDED.title_en,
  title_te = EXCLUDED.title_te,
  image_url = EXCLUDED.image_url,
  mrp = EXCLUDED.mrp,
  current_price = EXCLUDED.current_price,
  shipping_charges = EXCLUDED.shipping_charges,
  stock_quantity = EXCLUDED.stock_quantity,
  unit_value = EXCLUDED.unit_value,
  unit_type = EXCLUDED.unit_type,
  is_active = TRUE,
  updated_at = NOW();

-- Category mapping so products are visible under filters.
WITH incoming_norm AS (
  SELECT
    i.title_en,
    i.section_family,
    lower(regexp_replace(trim(i.title_en), '[^a-z0-9]+', '', 'g')) AS norm_title
  FROM incoming_products i
),
product_match AS (
  SELECT
    p.id AS product_uuid,
    i.title_en,
    i.section_family
  FROM incoming_norm i
  JOIN public.products p
    ON lower(regexp_replace(trim(p.title_en), '[^a-z0-9]+', '', 'g')) = i.norm_title
),
resolved_sections AS (
  SELECT
    pm.*,
    CASE pm.section_family
      WHEN 'base' THEN COALESCE(
        (SELECT id FROM public.sections WHERE section_id = 'bases-ready-mixes' AND is_enabled = TRUE LIMIT 1),
        (SELECT id FROM public.sections WHERE section_id = 'soap-shampoo-bases' AND is_enabled = TRUE LIMIT 1),
        (SELECT id FROM public.sections WHERE section_id = 'bases-ready-mixes' LIMIT 1),
        (SELECT id FROM public.sections WHERE section_id = 'soap-shampoo-bases' LIMIT 1)
      )
      WHEN 'wax' THEN COALESCE(
        (SELECT id FROM public.sections WHERE section_id = 'waxes-emulsifiers' AND is_enabled = TRUE LIMIT 1),
        (SELECT id FROM public.sections WHERE section_id = 'butters-waxes-binders' AND is_enabled = TRUE LIMIT 1),
        (SELECT id FROM public.sections WHERE section_id = 'waxes-emulsifiers' LIMIT 1),
        (SELECT id FROM public.sections WHERE section_id = 'butters-waxes-binders' LIMIT 1)
      )
      WHEN 'surfactant' THEN COALESCE(
        (SELECT id FROM public.sections WHERE section_id = 'surfactants-cleansers' AND is_enabled = TRUE LIMIT 1),
        (SELECT id FROM public.sections WHERE section_id = 'surfactants-additives' AND is_enabled = TRUE LIMIT 1),
        (SELECT id FROM public.sections WHERE section_id = 'surfactants-cleansers' LIMIT 1),
        (SELECT id FROM public.sections WHERE section_id = 'surfactants-additives' LIMIT 1)
      )
      ELSE COALESCE(
        (SELECT id FROM public.sections WHERE section_id = 'humectants-actives' AND is_enabled = TRUE LIMIT 1),
        (SELECT id FROM public.sections WHERE section_id = 'surfactants-additives' AND is_enabled = TRUE LIMIT 1),
        (SELECT id FROM public.sections WHERE section_id = 'humectants-actives' LIMIT 1),
        (SELECT id FROM public.sections WHERE section_id = 'surfactants-additives' LIMIT 1)
      )
    END AS section_uuid
  FROM product_match pm
),
numbered AS (
  SELECT
    rs.product_uuid,
    rs.section_uuid,
    ROW_NUMBER() OVER (PARTITION BY rs.section_uuid ORDER BY rs.title_en) AS row_no
  FROM resolved_sections rs
  WHERE rs.section_uuid IS NOT NULL
),
base_order AS (
  SELECT
    n.section_uuid,
    COALESCE(MAX(ps.display_order), 0) AS start_order
  FROM numbered n
  LEFT JOIN public.product_sections ps
    ON ps.section_id = n.section_uuid
  GROUP BY n.section_uuid
)
INSERT INTO public.product_sections (product_id, section_id, display_order)
SELECT
  n.product_uuid,
  n.section_uuid,
  bo.start_order + n.row_no
FROM numbered n
JOIN base_order bo
  ON bo.section_uuid = n.section_uuid
ON CONFLICT (product_id, section_id)
DO NOTHING;

COMMIT;

-- Optional verification:
-- SELECT product_id, title_en, current_price, unit_value, unit_type, image_url
-- FROM public.products
-- WHERE product_id BETWEEN 'BC230' AND 'BC251'
-- ORDER BY product_id;
