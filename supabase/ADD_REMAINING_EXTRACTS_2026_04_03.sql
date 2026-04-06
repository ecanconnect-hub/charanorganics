-- Add remaining extract products from the client-provided image batch.
-- Idempotent and safe to re-run.
-- Scope: only the extract products listed in this file.

BEGIN;

-- Ensure unit columns exist for older schemas.
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
  section_family TEXT NOT NULL,
  primary_section_code TEXT NOT NULL,
  secondary_section_code TEXT
);

INSERT INTO incoming_products (
  new_product_id,
  title_en,
  image_url,
  unit_value,
  unit_type,
  current_price,
  mrp,
  shipping_charges,
  stock_quantity,
  section_family,
  primary_section_code,
  secondary_section_code
)
VALUES
  ('BC286', 'Hibiscus Extract', 'https://res.cloudinary.com/dur6fkyoz/image/upload/v1775227078/Hibiscus_Extract_nwq1l4.jpg', 100, 'ml', 280, 280, 70, 100, 'extract', 'extracts', 'beauty-care'),
  ('BC287', 'Jatamansi Extract', 'https://res.cloudinary.com/dur6fkyoz/image/upload/v1775227093/Jatamansi_Extract_nj5p94.webp', 100, 'ml', 350, 350, 70, 100, 'extract', 'extracts', 'beauty-care'),
  ('BC288', 'Manjistha Extract', 'https://res.cloudinary.com/dur6fkyoz/image/upload/v1775227097/Manjistha_Extract_ls124t.webp', 100, 'ml', 300, 300, 70, 100, 'extract', 'extracts', 'beauty-care'),
  ('BC289', 'Sandal Extract', 'https://res.cloudinary.com/dur6fkyoz/image/upload/v1775227099/Sandal_Extract_l0wlrw.webp', 100, 'ml', 550, 550, 70, 100, 'extract', 'extracts', 'beauty-care'),
  ('BC290', 'Nagarmotha Extract', 'https://res.cloudinary.com/dur6fkyoz/image/upload/v1775227098/Nagarmotha_Extract_cuvpbq.webp', 100, 'ml', 280, 280, 70, 100, 'extract', 'extracts', 'beauty-care'),
  ('BC291', 'Papaya Extract', 'https://res.cloudinary.com/dur6fkyoz/image/upload/v1775227098/Papaya_Extract_t9z9zy.webp', 100, 'ml', 300, 300, 70, 100, 'extract', 'extracts', 'beauty-care'),
  ('BC292', 'Seabuckthorn Extract', 'https://res.cloudinary.com/dur6fkyoz/image/upload/v1775227100/Seabuckthorn_Extract_wco8la.webp', 100, 'ml', 600, 600, 70, 100, 'extract', 'extracts', 'beauty-care'),
  ('BC293', 'Onion Extract', 'https://res.cloudinary.com/dur6fkyoz/image/upload/v1775227100/Onion_Extract_fehzm3.jpg', 100, 'ml', 350, 350, 70, 100, 'extract', 'extracts', 'beauty-care');

CREATE TEMP TABLE incoming_enriched AS
SELECT
  i.*,
  lower(regexp_replace(trim(i.title_en), '[^a-z0-9]+', '', 'g')) AS norm_title,
  i.title_en || ' is a concentrated botanical extract used in serums, gels, creams, masks, shampoos, and other premium personal care formulations. It helps enrich finished products with plant-based actives and gives customers a clearer ingredient-focused reason to choose performance-driven beauty products.' AS description_en,
  trim(to_char(i.unit_value, 'FM999990.##')) || ' ' || i.unit_type || ' | Botanical extract | Cosmetic use' AS specifications_en,
  'Add to serums, creams, gels, masks, shampoos, or other cosmetic formulations in the recommended percentage and mix thoroughly until evenly blended.' AS usage_en
FROM incoming_products i;

-- Update matching products by normalized title so duplicates are not created.
WITH existing_norm AS (
  SELECT
    p.id,
    lower(regexp_replace(trim(p.title_en), '[^a-z0-9]+', '', 'g')) AS norm_title
  FROM public.products p
)
UPDATE public.products p
SET
  title_en = i.title_en,
  title_te = COALESCE(NULLIF(p.title_te, ''), i.title_en),
  description_en = i.description_en,
  description_te = COALESCE(NULLIF(p.description_te, ''), i.description_en),
  specifications_en = i.specifications_en,
  specifications_te = COALESCE(NULLIF(p.specifications_te, ''), i.specifications_en),
  usage_en = i.usage_en,
  usage_te = COALESCE(NULLIF(p.usage_te, ''), i.usage_en),
  image_url = i.image_url,
  current_price = i.current_price,
  mrp = i.mrp,
  shipping_charges = i.shipping_charges,
  unit_value = i.unit_value,
  unit_type = i.unit_type,
  stock_quantity = COALESCE(NULLIF(p.stock_quantity, 0), i.stock_quantity),
  is_active = TRUE,
  is_new = COALESCE(p.is_new, TRUE),
  updated_at = NOW()
FROM incoming_enriched i
JOIN existing_norm e
  ON e.norm_title = i.norm_title
WHERE p.id = e.id;

-- Insert only products that are still missing by normalized title.
WITH existing_norm AS (
  SELECT lower(regexp_replace(trim(title_en), '[^a-z0-9]+', '', 'g')) AS norm_title
  FROM public.products
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
  is_best_seller,
  is_new,
  unit_value,
  unit_type
)
SELECT
  i.new_product_id,
  i.title_en,
  i.title_en,
  i.description_en,
  i.description_en,
  i.specifications_en,
  i.specifications_en,
  i.usage_en,
  i.usage_en,
  i.image_url,
  i.mrp,
  i.current_price,
  i.shipping_charges,
  i.stock_quantity,
  TRUE,
  FALSE,
  TRUE,
  i.unit_value,
  i.unit_type
FROM incoming_enriched i
LEFT JOIN existing_norm e
  ON e.norm_title = i.norm_title
WHERE e.norm_title IS NULL
ON CONFLICT (product_id)
DO UPDATE SET
  title_en = EXCLUDED.title_en,
  title_te = EXCLUDED.title_te,
  description_en = EXCLUDED.description_en,
  description_te = EXCLUDED.description_te,
  specifications_en = EXCLUDED.specifications_en,
  specifications_te = EXCLUDED.specifications_te,
  usage_en = EXCLUDED.usage_en,
  usage_te = EXCLUDED.usage_te,
  image_url = EXCLUDED.image_url,
  mrp = EXCLUDED.mrp,
  current_price = EXCLUDED.current_price,
  shipping_charges = EXCLUDED.shipping_charges,
  stock_quantity = EXCLUDED.stock_quantity,
  unit_value = EXCLUDED.unit_value,
  unit_type = EXCLUDED.unit_type,
  is_active = TRUE,
  updated_at = NOW();

-- Category mapping so these products show in category filters and section pages.
WITH product_match AS (
  SELECT
    p.id AS product_uuid,
    i.title_en,
    i.primary_section_code,
    i.secondary_section_code
  FROM incoming_enriched i
  JOIN public.products p
    ON lower(regexp_replace(trim(p.title_en), '[^a-z0-9]+', '', 'g')) = i.norm_title
),
desired_pairs AS (
  SELECT product_uuid, title_en, primary_section_code AS section_code, 1 AS section_priority
  FROM product_match
  UNION ALL
  SELECT product_uuid, title_en, secondary_section_code AS section_code, 2 AS section_priority
  FROM product_match
  WHERE secondary_section_code IS NOT NULL
),
resolved_sections AS (
  SELECT
    dp.product_uuid,
    dp.title_en,
    dp.section_priority,
    s.id AS section_uuid
  FROM desired_pairs dp
  JOIN public.sections s
    ON s.section_id = dp.section_code
),
numbered AS (
  SELECT
    rs.product_uuid,
    rs.section_uuid,
    ROW_NUMBER() OVER (
      PARTITION BY rs.section_uuid
      ORDER BY rs.section_priority, rs.title_en
    ) AS row_no
  FROM resolved_sections rs
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
-- WHERE product_id BETWEEN 'BC286' AND 'BC293'
-- ORDER BY product_id;
