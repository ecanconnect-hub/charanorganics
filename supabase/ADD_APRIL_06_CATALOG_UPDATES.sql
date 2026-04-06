-- April 06 catalog updates:
-- - update hair care pricing/units
-- - update Natural Hair Dye to 1 kg
-- - set soap making kit shipping charges to 200
-- - add Baldness Hair Regrowth Serum and Iron Rust (Lokandha Kaat)
-- - add Soap Making Liquid Colours
-- - update/add client-provided soap images
-- Idempotent and safe to re-run.

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
  ('BC173', 'Bridal Soap', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775488959/Bridal_Soap_u9mfxr.jpg', 100, 'gm', 100, 100, 70, 100, 'soap', 'soaps-body-bars', 'beauty-care'),
  ('BC188', 'Banana Soap', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775488958/banana_soap_zk53up.jpg', 100, 'gm', 100, 100, 70, 100, 'soap', 'soaps-body-bars', 'beauty-care'),
  ('BC197', 'Natural Hair Dye', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775488958/Natural_hair_dye_with_herbal_ingredients_vpdtxk.png', 1, 'kg', 1500, 1500, 70, 100, 'hair_dye', 'herbal-powders-hair', 'beauty-care'),
  ('BC219', 'Sunni Pindi Soap', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775488959/sunni_pindi_soap_bsm8u2.jpg', 100, 'gm', 100, 100, 70, 100, 'soap', 'soaps-body-bars', 'beauty-care'),
  ('BC257', 'Herbal Shampoo', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775226994/Herbal_Shampoo_xnygrz.jpg', 100, 'ml', 175, 175, 70, 100, 'shampoo', 'surfactants-cleansers', 'beauty-care'),
  ('BC259', 'Herbal Hair Oil', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775226993/Herbal_Hair_Oil_zb6unc.jpg', 100, 'ml', 250, 250, 70, 100, 'hair_oil', 'carrier-oils', 'beauty-care'),
  ('BC262', 'Amla Shampoo', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775226993/Amla_Shampoo_xnyhfd.jpg', 100, 'ml', 180, 180, 70, 100, 'shampoo', 'surfactants-cleansers', 'beauty-care'),
  ('BC265', 'White Hair Black Oil', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775226992/White_Hair_Black_Oil_zgpagk.webp', 100, 'ml', 250, 250, 70, 100, 'hair_oil', 'carrier-oils', 'beauty-care'),
  ('BC268', 'Rosemary Shampoo', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775226991/Herbal_rosemary_shampoo_on_wooden_surface_eumuja.png', 100, 'ml', 180, 180, 70, 100, 'shampoo', 'surfactants-cleansers', 'beauty-care'),
  ('BC294', 'Baldness Hair Regrowth Serum', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775488958/Baldness_Hair_Regrowth_Serum_zcwt0f.png', 100, 'ml', 300, 300, 70, 100, 'hair_serum', 'humectants-actives', 'beauty-care'),
  ('BC295', 'Iron Rust (Lokandha Kaat)', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775488958/Iron_Rust_Lokandha_Kaat_gdfwy3.png', 50, 'gm', 150, 150, 70, 100, 'mineral_powder', 'clays-minerals', 'beauty-care'),
  ('BC296', 'Red Wine Soap', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775488959/Red_Wine_Soap_vubosz.jpg', 100, 'gm', 100, 100, 70, 100, 'soap', 'soaps-body-bars', 'beauty-care'),
  ('BC297', 'Potato Soap', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775488958/potato_soap_vtnj1v.jpg', 100, 'gm', 100, 100, 70, 100, 'soap', 'soaps-body-bars', 'beauty-care'),
  ('BC298', 'Tomato Red Colour', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775488957/tamato_Red_colou_pu16lo.png', 30, 'ml', 120, 120, 70, 100, 'liquid_colour', 'humectants-actives', 'beauty-care'),
  ('BC299', 'Rose Colour', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775488957/rose_colour_ikica9.png', 30, 'ml', 120, 120, 70, 100, 'liquid_colour', 'humectants-actives', 'beauty-care'),
  ('BC300', 'Pink Colour', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775488956/pink_color_qkushn.png', 30, 'ml', 120, 120, 70, 100, 'liquid_colour', 'humectants-actives', 'beauty-care'),
  ('BC301', 'Yellow Colour', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775488956/yellow_color_rocdk0.png', 30, 'ml', 120, 120, 70, 100, 'liquid_colour', 'humectants-actives', 'beauty-care'),
  ('BC302', 'Orange Colour', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775488957/orange_color_k5tybj.png', 30, 'ml', 120, 120, 70, 100, 'liquid_colour', 'humectants-actives', 'beauty-care'),
  ('BC303', 'Lavender Colour', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775488956/lavender_color_cdp5vb.png', 30, 'ml', 120, 120, 70, 100, 'liquid_colour', 'humectants-actives', 'beauty-care'),
  ('BC304', 'Blue Colour', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775488956/blue_d1mla0.png', 30, 'ml', 120, 120, 70, 100, 'liquid_colour', 'humectants-actives', 'beauty-care'),
  ('BC305', 'Green Colour', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775488956/green_color_bkulhj.png', 30, 'ml', 120, 120, 70, 100, 'liquid_colour', 'humectants-actives', 'beauty-care');

CREATE TEMP TABLE incoming_enriched AS
SELECT
  i.*,
  lower(regexp_replace(trim(i.title_en), '[^a-z0-9]+', '', 'g')) AS norm_title,
  CASE i.section_family
    WHEN 'soap' THEN i.title_en || ' is a ready-to-sell cleansing soap bar prepared for daily skin-care use. It supports a premium bathing routine and helps the customer quickly understand the soap theme, texture story, and personal-care use case.'
    WHEN 'hair_oil' THEN i.title_en || ' is a ready-to-use hair oil for scalp massage, routine nourishment, and regular hair-care use. It fits beauty-focused hair care ranges and supports customers looking for direct-use hair wellness products.'
    WHEN 'shampoo' THEN i.title_en || ' is a ready-to-use shampoo made for regular scalp cleansing, freshness, and practical hair-care use. It suits premium retail presentation and helps customers choose a direct-use hair cleansing product quickly.'
    WHEN 'hair_serum' THEN i.title_en || ' is a concentrated leave-on hair serum developed for targeted scalp care and regrowth-support positioning. It is suitable for premium hair-care ranges where users want a more focused treatment-style product.'
    WHEN 'hair_dye' THEN i.title_en || ' is a herbal hair-colouring product packed for larger quantity use. It supports natural-looking hair coverage routines and is suitable for customers who want bulk-size traditional hair-care preparation.'
    WHEN 'mineral_powder' THEN i.title_en || ' is a specialty mineral ingredient used in traditional cosmetic making, soap making, and formulation-focused raw material applications. It is positioned for ingredient buyers who need a clearly labeled raw material with practical formulation use.'
    WHEN 'liquid_colour' THEN i.title_en || ' is a soap-making liquid colour designed to help makers create visually attractive handmade products. It is suitable for melt-and-pour soap, liquid personal-care formulations, and small-batch handcrafted product presentation.'
    ELSE i.title_en || ' is a premium personal-care product prepared for direct customer use or cosmetic formulation support.'
  END AS description_en,
  CASE i.section_family
    WHEN 'soap' THEN trim(to_char(i.unit_value, 'FM999990.##')) || ' ' || i.unit_type || ' | Soap bar'
    WHEN 'hair_oil' THEN trim(to_char(i.unit_value, 'FM999990.##')) || ' ' || i.unit_type || ' | Hair oil'
    WHEN 'shampoo' THEN trim(to_char(i.unit_value, 'FM999990.##')) || ' ' || i.unit_type || ' | Ready-to-use shampoo'
    WHEN 'hair_serum' THEN trim(to_char(i.unit_value, 'FM999990.##')) || ' ' || i.unit_type || ' | Hair serum'
    WHEN 'hair_dye' THEN trim(to_char(i.unit_value, 'FM999990.##')) || ' ' || i.unit_type || ' | Herbal hair dye'
    WHEN 'mineral_powder' THEN trim(to_char(i.unit_value, 'FM999990.##')) || ' ' || i.unit_type || ' | Raw mineral ingredient'
    WHEN 'liquid_colour' THEN trim(to_char(i.unit_value, 'FM999990.##')) || ' ' || i.unit_type || ' | Soap-making liquid colour'
    ELSE trim(to_char(i.unit_value, 'FM999990.##')) || ' ' || i.unit_type || ' | Personal care product'
  END AS specifications_en,
  CASE i.section_family
    WHEN 'soap' THEN 'Wet the skin, build lather gently, cleanse evenly, and rinse thoroughly. Use regularly as part of a daily bathing routine.'
    WHEN 'hair_oil' THEN 'Apply a suitable quantity to the scalp and hair, massage gently, leave for some time, and wash later if required.'
    WHEN 'shampoo' THEN 'Apply to wet hair, massage into the scalp and hair, work into lather, and rinse thoroughly.'
    WHEN 'hair_serum' THEN 'Apply a small quantity directly to the scalp or target area and massage gently. Use consistently as part of a routine hair-care schedule.'
    WHEN 'hair_dye' THEN 'Prepare and apply according to the intended herbal hair-colouring method. Use suitable mixing liquid and apply evenly over the required area.'
    WHEN 'mineral_powder' THEN 'Use in small formulation-appropriate quantity for traditional cosmetic, soap-making, or ingredient blending purposes.'
    WHEN 'liquid_colour' THEN 'Add drop by drop into soap base or formulation until the required shade is achieved. Mix evenly for uniform colour distribution.'
    ELSE 'Use according to the product type and formulation need.'
  END AS usage_en
FROM incoming_products i;

WITH existing_norm AS (
  SELECT
    p.id,
    p.product_id,
    lower(regexp_replace(trim(p.title_en), '[^a-z0-9]+', '', 'g')) AS norm_title
  FROM public.products p
)
UPDATE public.products p
SET
  product_id = COALESCE(p.product_id, i.new_product_id),
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
  updated_at = NOW()
FROM incoming_enriched i
JOIN existing_norm e
  ON e.norm_title = i.norm_title OR e.product_id = i.new_product_id
WHERE p.id = e.id;

WITH existing_norm AS (
  SELECT
    product_id,
    lower(regexp_replace(trim(title_en), '[^a-z0-9]+', '', 'g')) AS norm_title
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
  ON e.norm_title = i.norm_title OR e.product_id = i.new_product_id
WHERE e.norm_title IS NULL
  AND e.product_id IS NULL
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

-- Client instruction: soap making kit delivery charge should be 200.
UPDATE public.products
SET shipping_charges = 200,
    updated_at = NOW()
WHERE lower(coalesce(title_en, '')) LIKE '%soap making kit%';

WITH product_match AS (
  SELECT
    p.id AS product_uuid,
    i.title_en,
    i.primary_section_code,
    i.secondary_section_code
  FROM incoming_enriched i
  JOIN public.products p
    ON lower(regexp_replace(trim(p.title_en), '[^a-z0-9]+', '', 'g')) = i.norm_title
      OR p.product_id = i.new_product_id
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
-- SELECT product_id, title_en, current_price, mrp, unit_value, unit_type, shipping_charges
-- FROM public.products
-- WHERE product_id IN (
--   'BC173','BC188','BC197','BC219','BC257','BC259','BC262','BC265','BC268',
--   'BC294','BC295','BC296','BC297','BC298','BC299','BC300','BC301','BC302',
--   'BC303','BC304','BC305'
-- )
-- ORDER BY product_id;
