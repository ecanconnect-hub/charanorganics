-- Add new beauty, extract, hair care, gel, wax, and additive products
-- from the client-provided Cloudinary image batch.
-- Idempotent and safe to re-run.
-- Scope: only the products listed in this file.

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
  ('BC252', 'Carrot Extract', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775227065/Carrot_Extract_qdtiww.webp', 100, 'ml', 350, 350, 70, 100, 'extract', 'extracts', 'beauty-care'),
  ('BC253', 'Beetroot Extract', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775227051/Beetroot_Extract_r4o9zf.webp', 100, 'ml', 300, 300, 70, 100, 'extract', 'extracts', 'beauty-care'),
  ('BC254', 'Amla Extract', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775226995/Amla_Extract_bw8h3e.webp', 100, 'ml', 300, 300, 70, 100, 'extract', 'extracts', 'beauty-care'),
  ('BC255', 'Fenugreek Extract', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775226994/Fenugreek_Extract_mak9lg.jpg', 100, 'ml', 330, 330, 70, 100, 'extract', 'extracts', 'beauty-care'),
  ('BC256', 'Aloe Vera Extract', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775226994/Aloe_Vera_Extract_xjt3zd.webp', 100, 'ml', 330, 330, 70, 100, 'extract', 'extracts', 'beauty-care'),
  ('BC257', 'Herbal Shampoo', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775226994/Herbal_Shampoo_xnygrz.jpg', 100, 'ml', 175, 175, 70, 100, 'shampoo', 'surfactants-cleansers', 'beauty-care'),
  ('BC258', 'Hair Conditioner', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775226993/Hair_Conditioner_zdwfgf.webp', 100, 'ml', 200, 200, 70, 100, 'conditioner', 'surfactants-cleansers', 'beauty-care'),
  ('BC259', 'Herbal Hair Oil', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775226993/Herbal_Hair_Oil_zb6unc.jpg', 100, 'ml', 200, 200, 70, 100, 'hair_oil', 'carrier-oils', 'beauty-care'),
  ('BC260', 'Lice Hair Oil', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775226993/Lice_Hair_Oil_om0hbu.jpg', 100, 'ml', 200, 200, 70, 100, 'hair_oil', 'carrier-oils', 'beauty-care'),
  ('BC261', 'Bhringraj Shampoo', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775226993/Bhringraj_shampoo_and_herbs_arrangement_k7guaf.png', 100, 'ml', 250, 250, 70, 100, 'shampoo', 'surfactants-cleansers', 'beauty-care'),
  ('BC262', 'Amla Shampoo', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775226993/Amla_Shampoo_xnyhfd.jpg', 100, 'ml', 250, 250, 70, 100, 'shampoo', 'surfactants-cleansers', 'beauty-care'),
  ('BC263', 'Silk Protein', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775226992/Silk_Protein_nbur3q.webp', 100, 'ml', 300, 300, 70, 100, 'protein_active', 'humectants-actives', 'beauty-care'),
  ('BC264', 'Rice Protein', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775226992/Rice_Protein_t85n7c.jpg', 100, 'ml', 300, 300, 70, 100, 'protein_active', 'humectants-actives', 'beauty-care'),
  ('BC265', 'White Hair Black Oil', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775226992/White_Hair_Black_Oil_zgpagk.webp', 200, 'ml', 250, 250, 70, 100, 'hair_oil', 'carrier-oils', 'beauty-care'),
  ('BC266', 'Strawberry Flavor Oil', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775226992/Strawberry_Flavor_Oil_xaatg8.jpg', 50, 'ml', 280, 280, 70, 100, 'flavor', 'humectants-actives', 'beauty-care'),
  ('BC267', 'Carnauba Wax', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775226992/Carnauba_Wax_uswn0w.webp', 100, 'gm', 250, 250, 70, 100, 'wax', 'waxes-emulsifiers', 'beauty-care'),
  ('BC268', 'Rosemary Shampoo', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775226991/Herbal_rosemary_shampoo_on_wooden_surface_eumuja.png', 100, 'ml', 250, 250, 70, 100, 'shampoo', 'surfactants-cleansers', 'beauty-care'),
  ('BC269', 'Chocolate Flavor Oil', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775226991/Chocolate_Flavor_Oil_y2bxo4.webp', 50, 'ml', 150, 150, 70, 100, 'flavor', 'humectants-actives', 'beauty-care'),
  ('BC270', 'Soy Wax', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775226991/Soy_Wax_g76yai.webp', 100, 'gm', 70, 70, 70, 100, 'wax', 'waxes-emulsifiers', 'beauty-care'),
  ('BC271', 'Kokum Butter', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775226991/Kokum_Butter_mbn3fg.jpg', 100, 'gm', 180, 180, 70, 100, 'butter', 'butters-lipids', 'beauty-care'),
  ('BC272', 'Clove Buds', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775226991/Clove_Buds_b3bkj2.jpg', 100, 'gm', 200, 200, 70, 100, 'dry_botanical', 'humectants-actives', 'beauty-care'),
  ('BC273', 'Cucumber Gel', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775226991/Cucumber_Gel_uuiogm.jpg', 100, 'gm', 150, 150, 70, 100, 'gel', 'creams-lotions', 'beauty-care'),
  ('BC274', 'Baking Soda', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775226991/Baking_Soda_f8fgib.jpg', 100, 'gm', 80, 80, 70, 100, 'chemical_additive', 'humectants-actives', 'beauty-care'),
  -- Assumption: the client-provided "Natural beauty for fuller hair" image is intended for Volumizing Shampoo.
  ('BC275', 'Volumizing Shampoo', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775226990/Natural_beauty_for_fuller_hair_jukpit.png', 100, 'ml', 300, 300, 70, 100, 'shampoo', 'surfactants-cleansers', 'beauty-care'),
  ('BC276', 'SPF Gel', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775226990/Cooling_SPF_gel_with_natural_ingredients_ds7njm.png', 100, 'gm', 150, 150, 70, 100, 'gel', 'creams-lotions', 'beauty-care'),
  ('BC277', 'Aloe Vera Liquid', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775226990/Aloe_Vera_Liquid_acglin.jpg', 100, 'gm', 200, 200, 70, 100, 'liquid_active', 'humectants-actives', 'beauty-care'),
  ('BC278', 'Lip Balm Base', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775226990/Lip_Balm_Base_lg4x0u.jpg', 100, 'gm', 200, 200, 70, 100, 'base', 'bases-ready-mixes', 'beauty-care'),
  ('BC279', 'Stearic Acid', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775226990/Stearic_Acid_ytvb7u.jpg', 50, 'gm', 100, 100, 70, 100, 'chemical_additive', 'waxes-emulsifiers', 'beauty-care'),
  ('BC280', 'Lemongrass', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775226989/Lemongrass_sf1jvq.jpg', 100, 'gm', 200, 200, 70, 100, 'dry_botanical', 'humectants-actives', 'beauty-care'),
  ('BC281', 'Coffee Gel', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775226989/Coffee_Gel_ekhrqe.png', 100, 'gm', 150, 150, 70, 100, 'gel', 'creams-lotions', 'beauty-care'),
  ('BC282', 'Saffron Gel', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775226989/Saffron_Gel_ka3twl.jpg', 100, 'gm', 150, 150, 70, 100, 'gel', 'creams-lotions', 'beauty-care'),
  ('BC283', 'Camphor', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775226988/Camphor_wyhent.jpg', 100, 'gm', 200, 200, 70, 100, 'chemical_additive', 'humectants-actives', 'beauty-care'),
  ('BC284', 'Neem Gel', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775226988/Neem_Gel_2_sxey55.webp', 100, 'gm', 150, 150, 70, 100, 'gel', 'creams-lotions', 'beauty-care'),
  ('BC285', 'Calendula', 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1775226988/Calendula_qqvu5i.jpg', 100, 'gm', 200, 200, 70, 100, 'dry_botanical', 'humectants-actives', 'beauty-care');

CREATE TEMP TABLE incoming_enriched AS
SELECT
  i.*,
  lower(regexp_replace(trim(i.title_en), '[^a-z0-9]+', '', 'g')) AS norm_title,
  CASE i.section_family
    WHEN 'extract' THEN i.title_en || ' is a concentrated botanical extract used in serums, creams, gels, masks, shampoos, and premium skin care or hair care formulations. It helps enrich finished products with plant-based actives while supporting a stronger premium formulation story for regular beauty routines.'
    WHEN 'gel' THEN i.title_en || ' is a ready-to-use skin care gel designed for daily hydration, soothing care, and treatment-focused beauty routines. It spreads smoothly on the skin and fits both direct-use retail products and salon-oriented care ranges.'
    WHEN 'shampoo' THEN i.title_en || ' is a ready-to-use shampoo created for routine scalp cleansing, hair freshness, and beauty-focused hair care. It is suitable for regular use and supports a clean, premium presentation in retail or professional personal care lines.'
    WHEN 'conditioner' THEN i.title_en || ' is a ready-to-use hair conditioner designed to improve softness, manageability, and a smoother finish after cleansing. It supports premium hair care routines and works well in both personal and salon-style care ranges.'
    WHEN 'hair_oil' THEN i.title_en || ' is a targeted hair oil used for scalp massage, nourishment, and traditional hair care routines. It supports regular oiling practices and fits premium hair wellness and beauty care product lines.'
    WHEN 'protein_active' THEN i.title_en || ' is a concentrated hair care active used to improve the performance of shampoos, conditioners, masks, serums, and treatment formulas. It helps position finished formulations as more functional, premium, and result-oriented.'
    WHEN 'wax' THEN i.title_en || ' is a premium structuring ingredient used to build hardness, consistency, gloss, and professional texture in balms, lip care, sticks, polishes, candles, and solid cosmetic formulations.'
    WHEN 'butter' THEN i.title_en || ' is a rich emollient butter used to improve body, glide, nourishment, and a smooth skin-feel in creams, body butters, balms, lip care, and hair care formulations.'
    WHEN 'flavor' THEN i.title_en || ' is a cosmetic-grade flavor ingredient used to add an appealing profile to lip care, glosses, balms, and handcrafted beauty products. It is ideal for premium presentation where fragrance or flavor plays an important customer-facing role.'
    WHEN 'dry_botanical' THEN i.title_en || ' is a dry botanical ingredient suitable for infusions, herbal blends, masks, oil preparations, bath products, and DIY personal care use. It adds a natural and traditional value story to handcrafted beauty formulations.'
    WHEN 'liquid_active' THEN i.title_en || ' is a versatile cosmetic liquid ingredient used in gels, lotions, masks, cleansers, and personal care formulations. It helps improve formulation story, usability, and flexibility for a wide range of beauty products.'
    WHEN 'base' THEN i.title_en || ' is a ready-to-use base that helps create premium lip care products quickly and consistently. It is suitable for customized formulations where oils, colors, flavors, and actives need to be blended into a stable base.'
    ELSE i.title_en || ' is a functional cosmetic ingredient used to support formulation performance, stability, texture, or practical product making in personal care applications.'
  END AS description_en,
  CASE i.section_family
    WHEN 'extract' THEN trim(to_char(i.unit_value, 'FM999990.##')) || ' ' || i.unit_type || ' | Botanical extract | Cosmetic use'
    WHEN 'gel' THEN trim(to_char(i.unit_value, 'FM999990.##')) || ' ' || i.unit_type || ' | Ready-to-use skin gel'
    WHEN 'shampoo' THEN trim(to_char(i.unit_value, 'FM999990.##')) || ' ' || i.unit_type || ' | Ready-to-use shampoo'
    WHEN 'conditioner' THEN trim(to_char(i.unit_value, 'FM999990.##')) || ' ' || i.unit_type || ' | Ready-to-use hair conditioner'
    WHEN 'hair_oil' THEN trim(to_char(i.unit_value, 'FM999990.##')) || ' ' || i.unit_type || ' | Ready-to-use hair oil'
    WHEN 'protein_active' THEN trim(to_char(i.unit_value, 'FM999990.##')) || ' ' || i.unit_type || ' | Hair care active | Cosmetic use'
    WHEN 'wax' THEN trim(to_char(i.unit_value, 'FM999990.##')) || ' ' || i.unit_type || ' | Premium wax | Cosmetic and craft use'
    WHEN 'butter' THEN trim(to_char(i.unit_value, 'FM999990.##')) || ' ' || i.unit_type || ' | Rich cosmetic butter'
    WHEN 'flavor' THEN trim(to_char(i.unit_value, 'FM999990.##')) || ' ' || i.unit_type || ' | Cosmetic flavor oil'
    WHEN 'dry_botanical' THEN trim(to_char(i.unit_value, 'FM999990.##')) || ' ' || i.unit_type || ' | Dried botanical ingredient'
    WHEN 'liquid_active' THEN trim(to_char(i.unit_value, 'FM999990.##')) || ' ' || i.unit_type || ' | Cosmetic liquid ingredient'
    WHEN 'base' THEN trim(to_char(i.unit_value, 'FM999990.##')) || ' ' || i.unit_type || ' | Ready-to-use lip care base'
    ELSE trim(to_char(i.unit_value, 'FM999990.##')) || ' ' || i.unit_type || ' | Cosmetic formulation ingredient'
  END AS specifications_en,
  CASE i.section_family
    WHEN 'extract' THEN 'Add to serums, creams, gels, masks, shampoos, or other cosmetic formulations in the recommended percentage and mix well until uniformly blended.'
    WHEN 'gel' THEN 'Apply a suitable amount on clean skin and spread evenly. Use as part of a daily skin care routine or as directed for the product application.'
    WHEN 'shampoo' THEN 'Apply to wet hair, massage gently into the scalp and hair, work into lather, and rinse thoroughly. Use regularly as needed.'
    WHEN 'conditioner' THEN 'Apply to clean wet hair after shampooing, spread through lengths, leave for a short time, and rinse well for a smoother finish.'
    WHEN 'hair_oil' THEN 'Massage a suitable quantity into the scalp and hair, leave for some time or overnight if preferred, and wash later if required.'
    WHEN 'protein_active' THEN 'Use in shampoos, conditioners, masks, serums, or other hair care formulations in the recommended percentage and mix thoroughly.'
    WHEN 'wax' THEN 'Melt with the oil phase or formulation base and blend uniformly to build structure, stability, hardness, or gloss in the final product.'
    WHEN 'butter' THEN 'Melt or soften as required and blend into creams, balms, body butters, lip care, or hair care formulations for added richness and body.'
    WHEN 'flavor' THEN 'Add in small quantity to lip care and related cosmetic products to achieve the desired flavor profile without overpowering the formulation.'
    WHEN 'dry_botanical' THEN 'Use in herbal infusions, oil preparations, masks, bath blends, sachets, or DIY personal care products as required by the formulation.'
    WHEN 'liquid_active' THEN 'Blend into gels, lotions, masks, cleansers, or DIY personal care products in the required quantity and mix until evenly dispersed.'
    WHEN 'base' THEN 'Melt gently if required, blend with oils, colors, flavors, or actives, and fill into suitable containers to prepare finished lip care products.'
    ELSE 'Use in the recommended quantity during formulation and mix thoroughly for consistent performance in the final product.'
  END AS usage_en
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

-- Category mapping so products show correctly in filters and category sections.
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
-- WHERE product_id BETWEEN 'BC252' AND 'BC285'
-- ORDER BY product_id;
--
-- SELECT s.section_id, p.product_id, p.title_en
-- FROM public.product_sections ps
-- JOIN public.products p ON p.id = ps.product_id
-- JOIN public.sections s ON s.id = ps.section_id
-- WHERE p.product_id BETWEEN 'BC252' AND 'BC285'
-- ORDER BY s.section_id, p.title_en;
