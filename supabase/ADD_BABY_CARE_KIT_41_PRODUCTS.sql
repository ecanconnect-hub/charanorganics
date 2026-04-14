-- Add or update Baby Care Kit (41 Products)
-- Safe to run multiple times.
-- Uses BC213 to update the existing baby-care kit product if it is already present.

BEGIN;

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
  'BC213',
  'Baby Care Kit (41 Products)',
  'Baby Care Kit (41 Products)',
  'Baby Care Kit (41 Products) is a premium baby-care formulation bundle prepared for training, product practice, and small-batch development work. This kit contains 41 ingredients: Triphala, Kasthuri Turmeric, Avaram Flower Powder, Potato Powder, Ashwagandha, Vetiver, Aloe Vera Powder, Ratanjot, E-Wax, Lodhra Powder, Kaolin Clay, Arrowroot, Neem, Beeswax, Corn Starch, Bhringraj Powder, Red Sandalwood, Rose Petals, Rice Starch, Cetyl Alcohol, Cocoa Butter, Shea Butter, Aloe Vera Gel, Sweet Almond Oil, Coco Glucoside, Sorbitol, Vegetable Glycerin, CCTG (Fractionated Coconut Oil), Sodium Lactate, Olive Oil, Avocado Oil, Jojoba Oil, Iscagu + PEG, Cucumber Extract, Castor Oil, Marula Oil, Grapeseed Oil, Coco Caprylate, Rose Water, CAPB (Cocamidopropyl Betaine), and Witch Hazel. Each ingredient is supplied in 50 g pack size, making this kit a complete option for baby-care learning and formulation preparation.',
  '1 kit | 41 products total | Net shipping weight: 4 kg | Shipping charge: Rs.220 | Selling price: Rs.3199 | MRP: Rs.3499 | Included ingredients: Triphala, Kasthuri Turmeric, Avaram Flower Powder, Potato Powder, Ashwagandha, Vetiver, Aloe Vera Powder, Ratanjot, E-Wax, Lodhra Powder, Kaolin Clay, Arrowroot, Neem, Beeswax, Corn Starch, Bhringraj Powder, Red Sandalwood, Rose Petals, Rice Starch, Cetyl Alcohol, Cocoa Butter, Shea Butter, Aloe Vera Gel, Sweet Almond Oil, Coco Glucoside, Sorbitol, Vegetable Glycerin, CCTG, Sodium Lactate, Olive Oil, Avocado Oil, Jojoba Oil, Iscagu + PEG, Cucumber Extract, Castor Oil, Marula Oil, Grapeseed Oil, Coco Caprylate, Rose Water, CAPB, Witch Hazel.',
  'Use this kit for baby-care product training, ingredient study, and small-batch formulation work. Select the required ingredients based on the formula you want to prepare, measure carefully, maintain strict hygiene, and combine powders, butters, oils, surfactants, emulsifiers, gels, and extracts only in formulation-appropriate percentages. This kit is suitable for preparing baby-care concepts such as mild soaps, cleansers, gentle gels, creams, oils, and practice formulations. Always patch-test finished products and follow baby-safe formulation standards before direct use.',
  'https://res.cloudinary.com/dur6fkyoz/image/upload/v1776184041/baby_care_kit_40_Items_zw6bgm.png',
  4,
  'kg',
  3499,
  3199,
  220,
  100
);

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
        CASE
          WHEN p.product_id = nt.product_id THEN 0
          WHEN lower(regexp_replace(trim(COALESCE(p.title_en, '')), '[^a-z0-9]+', '', 'g')) = 'babycareclassmaterialkit' THEN 1
          ELSE 2
        END,
        p.created_at NULLS LAST,
        p.id
    ) AS rn
  FROM public.products p
  CROSS JOIN normalized_target nt
  WHERE p.product_id = nt.product_id
     OR lower(regexp_replace(trim(COALESCE(p.title_en, '')), '[^a-z0-9]+', '', 'g')) IN (
       nt.norm_title,
       'babycareclassmaterialkit',
       'babycarekit',
       'babycarekit41products'
     )
),
canonical_product AS (
  SELECT id
  FROM matched_products
  WHERE rn = 1
)
UPDATE public.products p
SET
  product_id = ik.product_id,
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
  updated_at = NOW()
FROM incoming_kit ik
WHERE p.id IN (SELECT id FROM canonical_product);

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
  is_active
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
  TRUE
FROM normalized_target nt
WHERE NOT EXISTS (
  SELECT 1
  FROM public.products p
  WHERE p.product_id = nt.product_id
     OR lower(regexp_replace(trim(COALESCE(p.title_en, '')), '[^a-z0-9]+', '', 'g')) IN (
       nt.norm_title,
       'babycareclassmaterialkit',
       'babycarekit',
       'babycarekit41products'
     )
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

WITH normalized_target AS (
  SELECT lower(regexp_replace(trim(title_en), '[^a-z0-9]+', '', 'g')) AS norm_title
  FROM incoming_kit
),
target_product AS (
  SELECT p.id
  FROM public.products p
  CROSS JOIN normalized_target nt
  WHERE p.product_id = 'BC213'
     OR lower(regexp_replace(trim(COALESCE(p.title_en, '')), '[^a-z0-9]+', '', 'g')) IN (
       nt.norm_title,
       'babycareclassmaterialkit',
       'babycarekit',
       'babycarekit41products'
     )
  ORDER BY CASE WHEN p.product_id = 'BC213' THEN 0 ELSE 1 END, p.created_at NULLS LAST, p.id
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

WITH normalized_target AS (
  SELECT lower(regexp_replace(trim(title_en), '[^a-z0-9]+', '', 'g')) AS norm_title
  FROM incoming_kit
),
target_product AS (
  SELECT p.id
  FROM public.products p
  CROSS JOIN normalized_target nt
  WHERE p.product_id = 'BC213'
     OR lower(regexp_replace(trim(COALESCE(p.title_en, '')), '[^a-z0-9]+', '', 'g')) IN (
       nt.norm_title,
       'babycareclassmaterialkit',
       'babycarekit',
       'babycarekit41products'
     )
  ORDER BY CASE WHEN p.product_id = 'BC213' THEN 0 ELSE 1 END, p.created_at NULLS LAST, p.id
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
-- SELECT p.product_id, p.title_en, p.current_price, p.mrp, p.shipping_charges, p.unit_value, p.unit_type
-- FROM public.products p
-- WHERE p.product_id = 'BC213' OR lower(regexp_replace(trim(COALESCE(p.title_en, '')), '[^a-z0-9]+', '', 'g')) IN ('babycarekit41products','babycareclassmaterialkit');
