-- Enable and rebuild the Hair Care category with a dedicated cover image.
-- Idempotent and safe to re-run.

BEGIN;

-- Ensure sections.image_url exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sections'
      AND column_name = 'image_url'
  ) THEN
    ALTER TABLE public.sections ADD COLUMN image_url TEXT;
  END IF;
END $$;

-- Create or update the Hair Care section.
INSERT INTO public.sections (
  section_id,
  title_en,
  title_te,
  subtitle_en,
  subtitle_te,
  description_en,
  description_te,
  display_order,
  is_enabled,
  image_url
)
VALUES (
  'hair-care',
  'Hair Care',
  'Hair Care',
  'Hair oils, shampoos, powders, extracts, and care essentials',
  'Hair oils, shampoos, powders, extracts, and care essentials',
  'Dedicated hair care category containing shampoos, conditioners, hair oils, hair-focused extracts, proteins, and traditional herbal powders used for scalp care, cleansing, nourishment, and routine hair wellness.',
  'Dedicated hair care category containing shampoos, conditioners, hair oils, hair-focused extracts, proteins, and traditional herbal powders used for scalp care, cleansing, nourishment, and routine hair wellness.',
  5,
  TRUE,
  'https://res.cloudinary.com/dur6fkyoz/image/upload/v1775226991/Herbal_rosemary_shampoo_on_wooden_surface_eumuja.png'
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

-- Use the client-requested Hair Care category image directly.
UPDATE public.sections s
SET image_url = 'https://res.cloudinary.com/dur6fkyoz/image/upload/v1775226991/Herbal_rosemary_shampoo_on_wooden_surface_eumuja.png',
    updated_at = NOW()
WHERE s.section_id = 'hair-care';

-- Remove old Hair Care mappings so we can rebuild the section cleanly.
DELETE FROM public.product_sections ps
USING public.sections s
WHERE ps.section_id = s.id
  AND s.section_id = 'hair-care';

-- Map relevant hair-related products from active catalog.
WITH hair_section AS (
  SELECT id
  FROM public.sections
  WHERE section_id = 'hair-care'
  LIMIT 1
),
raw_candidates AS (
  SELECT
    p.id AS product_id,
    p.product_id AS product_code,
    p.title_en,
    lower(regexp_replace(trim(p.title_en), '[^a-z0-9]+', '', 'g')) AS norm_title
  FROM public.products p
  LEFT JOIN public.product_sections ps
    ON ps.product_id = p.id
  LEFT JOIN public.sections src
    ON src.id = ps.section_id
  WHERE p.is_active = TRUE
    AND (
      (
        src.section_id IN (
          'carrier-oils',
          'surfactants-cleansers',
          'extracts',
          'herbal-powders-hair',
          'humectants-actives',
          'bases-ready-mixes'
        )
        AND (
          lower(p.title_en) LIKE '%hair%'
          OR lower(p.title_en) LIKE '%shampoo%'
          OR lower(p.title_en) LIKE '%conditioner%'
          OR lower(p.title_en) LIKE '%amla%'
          OR lower(p.title_en) LIKE '%bhringraj%'
          OR lower(p.title_en) LIKE '%hibiscus%'
          OR lower(p.title_en) LIKE '%henna%'
          OR lower(p.title_en) LIKE '%brahmi%'
          OR lower(p.title_en) LIKE '%fenugreek%'
          OR lower(p.title_en) LIKE '%jatamansi%'
          OR lower(p.title_en) LIKE '%reetha%'
          OR lower(p.title_en) LIKE '%shikakai%'
          OR lower(p.title_en) LIKE '%indigo%'
          OR lower(p.title_en) LIKE '%rosemary%'
          OR lower(p.title_en) LIKE '%kalonji%'
          OR lower(p.title_en) LIKE '%triphala%'
          OR lower(p.title_en) LIKE '%onion oil%'
          OR lower(p.title_en) LIKE '%onion extract%'
        )
      )
      OR p.title_en IN (
        'Silk Protein',
        'Rice Protein',
        'Herbal Shampoo',
        'Hair Conditioner',
        'Herbal Hair Oil',
        'Lice Hair Oil',
        'White Hair Black Oil',
        'Volumizing Shampoo',
        'Pearly Shampoo Base'
      )
    )
),
eligible_products AS (
  SELECT product_id, product_code, title_en
  FROM (
    SELECT
      rc.*,
      ROW_NUMBER() OVER (
        PARTITION BY rc.norm_title
        ORDER BY rc.product_code, rc.product_id
      ) AS rn
    FROM raw_candidates rc
  ) ranked
  WHERE rn = 1
),
ordered AS (
  SELECT
    ep.product_id,
    hs.id AS section_id,
    ROW_NUMBER() OVER (
      ORDER BY
        CASE
          WHEN ep.title_en = 'Herbal Hair Oil' THEN 1
          WHEN ep.title_en = 'Hair Conditioner' THEN 2
          WHEN ep.title_en = 'Herbal Shampoo' THEN 3
          WHEN ep.title_en = 'Rosemary Shampoo' THEN 4
          WHEN ep.title_en = 'Amla Shampoo' THEN 5
          WHEN ep.title_en = 'Bhringraj Shampoo' THEN 6
          WHEN ep.title_en = 'Volumizing Shampoo' THEN 7
          WHEN ep.title_en = 'White Hair Black Oil' THEN 8
          WHEN ep.title_en = 'Lice Hair Oil' THEN 9
          ELSE 100
        END,
        ep.title_en,
        ep.product_code
    ) AS display_order
  FROM eligible_products ep
  CROSS JOIN hair_section hs
)
INSERT INTO public.product_sections (product_id, section_id, display_order)
SELECT product_id, section_id, display_order
FROM ordered
ON CONFLICT (product_id, section_id)
DO UPDATE SET
  display_order = EXCLUDED.display_order;

COMMIT;

-- Optional verification:
-- SELECT section_id, title_en, is_enabled, image_url
-- FROM public.sections
-- WHERE section_id = 'hair-care';
--
-- SELECT p.product_id, p.title_en
-- FROM public.product_sections ps
-- JOIN public.sections s ON s.id = ps.section_id
-- JOIN public.products p ON p.id = ps.product_id
-- WHERE s.section_id = 'hair-care'
-- ORDER BY ps.display_order, p.title_en;
