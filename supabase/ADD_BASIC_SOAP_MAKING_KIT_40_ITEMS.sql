-- Add or update Basic Soap Making Kit (40 items)
-- Safe to run multiple times.
-- This script avoids duplicate rows by matching both product_id and normalized title.

BEGIN;

-- 1) Ensure kits category exists so the product can appear in storefront filters.
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

-- 2) Ensure kits category exists so the product can appear in storefront filters.
INSERT INTO public.sections (
  section_id,
  title_en,
  title_te,
  subtitle_en,
  subtitle_te,
  description_en,
  description_te,
  display_order,
  is_enabled
)
VALUES (
  'kits-containers',
  'Kits & Containers',
  'Kits & Containers',
  'DIY kits, packs, and storage accessories',
  'DIY kits, packs, and storage accessories',
  'Training kits, soap-making kits, starter bundles, and storage accessories used in DIY cosmetic and personal care preparation workflows.',
  'Training kits, soap-making kits, starter bundles, and storage accessories used in DIY cosmetic and personal care preparation workflows.',
  16,
  TRUE
)
ON CONFLICT (section_id)
DO UPDATE SET
  title_en = EXCLUDED.title_en,
  title_te = EXCLUDED.title_te,
  subtitle_en = EXCLUDED.subtitle_en,
  subtitle_te = EXCLUDED.subtitle_te,
  description_en = EXCLUDED.description_en,
  description_te = EXCLUDED.description_te,
  display_order = EXCLUDED.display_order,
  is_enabled = EXCLUDED.is_enabled,
  updated_at = NOW();

CREATE TEMP TABLE incoming_kit (
  product_id TEXT PRIMARY KEY,
  title_en TEXT NOT NULL,
  title_te TEXT,
  description_en TEXT NOT NULL,
  specifications_en TEXT NOT NULL,
  usage_en TEXT NOT NULL,
  image_url TEXT NOT NULL,
  unit_value NUMERIC NOT NULL,
  unit_type TEXT NOT NULL,
  mrp NUMERIC NOT NULL,
  current_price NUMERIC NOT NULL,
  shipping_charges NUMERIC NOT NULL,
  stock_quantity INTEGER NOT NULL
);

INSERT INTO incoming_kit (
  product_id,
  title_en,
  title_te,
  description_en,
  specifications_en,
  usage_en,
  image_url,
  unit_value,
  unit_type,
  mrp,
  current_price,
  shipping_charges,
  stock_quantity
)
VALUES (
  'BC191',
  'Basic Soap Making Kit',
  'Basic Soap Making Kit',
  'Basic Soap Making Kit is a 40-item starter bundle prepared for DIY soap making, beginner learning, and small-batch handmade product preparation. Confirmed items inside this kit include Soap Base 1 kg, Shampoo Base 500 g, Steam Distilled Rose Water 100 ml, Aloe Vera Gel 100 g, Red Wine 50 ml, Kalonji Oil 25 ml, and Vegetable Glycerine 100 ml. The remaining kit contents are supplied as additional powder ingredients packed in 50 g units, making this a practical all-in-one combo for customers who want multiple ingredients in one box.',
  '1 kit | 40 items total | Confirmed contents: Soap Base 1 kg, Shampoo Base 500 g, Steam Distilled Rose Water 100 ml, Aloe Vera Gel 100 g, Red Wine 50 ml, Kalonji Oil 25 ml, Vegetable Glycerine 100 ml | Remaining powder items packed in 50 g units.',
  'Use this kit as a ready starter set for learning and making handmade soaps. Melt the soap base as required, use the shampoo base and liquids according to your formulation, and add the included powders one by one based on the type of soap or care product you want to prepare. Mix well, pour into moulds, and allow the batch to set fully before use or packing.',
  'https://res.cloudinary.com/dur6fkyoz/image/upload/v1775050324/Basic_soap_making_kit_2_yrwesv.png',
  3.48,
  'kg',
  3000,
  3000,
  200,
  100
);

-- 2) Update the canonical existing row if the product is already present.
WITH normalized_target AS (
  SELECT
    ik.*,
    lower(regexp_replace(trim(ik.title_en), '[^a-z0-9]+', '', 'g')) AS norm_title
  FROM incoming_kit ik
),
matched_products AS (
  SELECT
    p.id,
    p.product_id,
    ROW_NUMBER() OVER (
      ORDER BY
        CASE WHEN p.product_id = nt.product_id THEN 0 ELSE 1 END,
        p.created_at NULLS LAST,
        p.id
    ) AS rn
  FROM public.products p
  CROSS JOIN normalized_target nt
  WHERE p.product_id = nt.product_id
     OR lower(regexp_replace(trim(COALESCE(p.title_en, '')), '[^a-z0-9]+', '', 'g')) = nt.norm_title
),
canonical_product AS (
  SELECT id
  FROM matched_products
  WHERE rn = 1
)
UPDATE public.products p
SET
  title_en = ik.title_en,
  title_te = COALESCE(NULLIF(p.title_te, ''), ik.title_te),
  description_en = ik.description_en,
  specifications_en = ik.specifications_en,
  usage_en = ik.usage_en,
  image_url = ik.image_url,
  unit_value = ik.unit_value,
  unit_type = ik.unit_type,
  mrp = ik.mrp,
  current_price = ik.current_price,
  shipping_charges = ik.shipping_charges,
  stock_quantity = ik.stock_quantity,
  is_active = TRUE,
  is_best_seller = COALESCE(p.is_best_seller, FALSE),
  is_new = COALESCE(p.is_new, TRUE),
  updated_at = NOW()
FROM incoming_kit ik
WHERE p.id IN (SELECT id FROM canonical_product);

-- 3) Insert the product only if it does not already exist by title or product_id.
WITH normalized_target AS (
  SELECT
    ik.*,
    lower(regexp_replace(trim(ik.title_en), '[^a-z0-9]+', '', 'g')) AS norm_title
  FROM incoming_kit ik
)
INSERT INTO public.products (
  product_id,
  title_en,
  title_te,
  description_en,
  specifications_en,
  usage_en,
  image_url,
  unit_value,
  unit_type,
  mrp,
  current_price,
  shipping_charges,
  stock_quantity,
  is_active,
  is_best_seller,
  is_new
)
SELECT
  nt.product_id,
  nt.title_en,
  nt.title_te,
  nt.description_en,
  nt.specifications_en,
  nt.usage_en,
  nt.image_url,
  nt.unit_value,
  nt.unit_type,
  nt.mrp,
  nt.current_price,
  nt.shipping_charges,
  nt.stock_quantity,
  TRUE,
  FALSE,
  TRUE
FROM normalized_target nt
WHERE NOT EXISTS (
  SELECT 1
  FROM public.products p
  WHERE p.product_id = nt.product_id
     OR lower(regexp_replace(trim(COALESCE(p.title_en, '')), '[^a-z0-9]+', '', 'g')) = nt.norm_title
)
ON CONFLICT (product_id)
DO UPDATE SET
  title_en = EXCLUDED.title_en,
  title_te = EXCLUDED.title_te,
  description_en = EXCLUDED.description_en,
  specifications_en = EXCLUDED.specifications_en,
  usage_en = EXCLUDED.usage_en,
  image_url = EXCLUDED.image_url,
  unit_value = EXCLUDED.unit_value,
  unit_type = EXCLUDED.unit_type,
  mrp = EXCLUDED.mrp,
  current_price = EXCLUDED.current_price,
  shipping_charges = EXCLUDED.shipping_charges,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = TRUE,
  updated_at = NOW();

-- 4) Map the kit to Kits & Containers.
WITH normalized_target AS (
  SELECT lower(regexp_replace(trim(title_en), '[^a-z0-9]+', '', 'g')) AS norm_title
  FROM incoming_kit
),
target_product AS (
  SELECT p.id
  FROM public.products p
  CROSS JOIN normalized_target nt
  WHERE p.product_id = 'BC191'
     OR lower(regexp_replace(trim(COALESCE(p.title_en, '')), '[^a-z0-9]+', '', 'g')) = nt.norm_title
  ORDER BY CASE WHEN p.product_id = 'BC191' THEN 0 ELSE 1 END, p.created_at NULLS LAST, p.id
  LIMIT 1
),
kit_section AS (
  SELECT id
  FROM public.sections
  WHERE section_id = 'kits-containers'
  LIMIT 1
)
INSERT INTO public.product_sections (product_id, section_id, display_order)
SELECT
  tp.id,
  ks.id,
  COALESCE(
    (
      SELECT MAX(ps.display_order) + 1
      FROM public.product_sections ps
      WHERE ps.section_id = ks.id
    ),
    1
  )
FROM target_product tp
CROSS JOIN kit_section ks
ON CONFLICT (product_id, section_id)
DO NOTHING;

-- 5) Also map to Beauty Care if that section already exists.
WITH normalized_target AS (
  SELECT lower(regexp_replace(trim(title_en), '[^a-z0-9]+', '', 'g')) AS norm_title
  FROM incoming_kit
),
target_product AS (
  SELECT p.id
  FROM public.products p
  CROSS JOIN normalized_target nt
  WHERE p.product_id = 'BC191'
     OR lower(regexp_replace(trim(COALESCE(p.title_en, '')), '[^a-z0-9]+', '', 'g')) = nt.norm_title
  ORDER BY CASE WHEN p.product_id = 'BC191' THEN 0 ELSE 1 END, p.created_at NULLS LAST, p.id
  LIMIT 1
),
beauty_section AS (
  SELECT id
  FROM public.sections
  WHERE section_id = 'beauty-care'
  LIMIT 1
)
INSERT INTO public.product_sections (product_id, section_id, display_order)
SELECT
  tp.id,
  bs.id,
  COALESCE(
    (
      SELECT MAX(ps.display_order) + 1
      FROM public.product_sections ps
      WHERE ps.section_id = bs.id
    ),
    1
  )
FROM target_product tp
CROSS JOIN beauty_section bs
ON CONFLICT (product_id, section_id)
DO NOTHING;

COMMIT;

-- Optional verification:
-- SELECT p.product_id, p.title_en, p.current_price, p.image_url, p.is_active
-- FROM public.products p
-- WHERE p.product_id = 'BC191' OR p.title_en = 'Basic Soap Making Kit';
--
-- SELECT s.section_id, p.product_id, p.title_en
-- FROM public.product_sections ps
-- JOIN public.products p ON p.id = ps.product_id
-- JOIN public.sections s ON s.id = ps.section_id
-- WHERE p.product_id = 'BC191' OR p.title_en = 'Basic Soap Making Kit'
-- ORDER BY s.section_id;
