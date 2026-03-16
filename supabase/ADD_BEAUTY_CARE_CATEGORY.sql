-- Create a separate Beauty Care category (skin + hair focused)
-- and map relevant products from existing categories.
-- Idempotent and safe to re-run.

BEGIN;

-- 1) Create / update Beauty Care section
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
  'beauty-care',
  'Beauty Care',
  'Beauty Care',
  'Skin, Hair, and Personal Care Essentials',
  'Skin, Hair, and Personal Care Essentials',
  'Curated beauty category containing products used for skin care, hair care, glow routines, cleansing, hydration, and cosmetic formulation support.',
  'Curated beauty category containing products used for skin care, hair care, glow routines, cleansing, hydration, and cosmetic formulation support.',
  4,
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

-- 2) Map products from relevant source sections into Beauty Care
WITH beauty_section AS (
  SELECT id FROM public.sections WHERE section_id = 'beauty-care' LIMIT 1
),
source_sections AS (
  SELECT id
  FROM public.sections
  WHERE section_id IN (
    'creams-lotions',
    'soaps-body-bars',
    'carrier-oils',
    'essential-oils',
    'extracts',
    'humectants-actives',
    'herbal-powders-skin',
    'herbal-powders-hair'
  )
),
candidate_products AS (
  SELECT DISTINCT p.id AS product_id, p.title_en
  FROM public.products p
  JOIN public.product_sections ps
    ON ps.product_id = p.id
  JOIN source_sections ss
    ON ss.id = ps.section_id
  WHERE p.is_active = TRUE
),
ordered AS (
  SELECT
    cp.product_id,
    bs.id AS section_id,
    ROW_NUMBER() OVER (ORDER BY cp.title_en) AS display_order
  FROM candidate_products cp
  CROSS JOIN beauty_section bs
)
INSERT INTO public.product_sections (product_id, section_id, display_order)
SELECT product_id, section_id, display_order
FROM ordered
ON CONFLICT (product_id, section_id)
DO UPDATE SET
  display_order = EXCLUDED.display_order;

-- 3) Set fixed category image requested by client
UPDATE public.sections s
SET image_url = 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1773507265/Lipstick_Colour_Orange_Mica_qko1of.jpg'
WHERE s.section_id = 'beauty-care';

COMMIT;

-- Optional validation:
-- SELECT s.section_id, s.title_en, s.is_enabled, s.image_url
-- FROM public.sections s
-- WHERE s.section_id = 'beauty-care';
--
-- SELECT COUNT(*) AS mapped_products
-- FROM public.product_sections ps
-- JOIN public.sections s ON s.id = ps.section_id
-- WHERE s.section_id = 'beauty-care';
