-- Set category cover images for Extracts and Creams/Lotions
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

-- 1) Extracts section image
WITH preferred_extract_image AS (
  SELECT p.image_url
  FROM public.products p
  WHERE p.is_active = TRUE
    AND p.image_url IS NOT NULL
    AND NULLIF(trim(p.image_url), '') IS NOT NULL
    AND p.title_en IN (
      'Rosemary Extract',
      'Turmeric Extract',
      'Chamomile Extract',
      'Green Tea Extract',
      'Rose Extract',
      'Neem Extract'
    )
  ORDER BY CASE p.title_en
    WHEN 'Rosemary Extract' THEN 1
    WHEN 'Turmeric Extract' THEN 2
    WHEN 'Chamomile Extract' THEN 3
    WHEN 'Green Tea Extract' THEN 4
    WHEN 'Rose Extract' THEN 5
    WHEN 'Neem Extract' THEN 6
    ELSE 100
  END
  LIMIT 1
)
UPDATE public.sections s
SET image_url = pei.image_url
FROM preferred_extract_image pei
WHERE s.section_id = 'extracts';

-- Fallback static image if no extract product image is found
UPDATE public.sections s
SET image_url = 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1771700788/Rosemary_Extract_delfdp.jpg'
WHERE s.section_id = 'extracts'
  AND (s.image_url IS NULL OR trim(s.image_url) = '');

-- 2) Creams / Lotions category image
WITH preferred_cream_lotion_image AS (
  SELECT p.image_url
  FROM public.products p
  WHERE p.is_active = TRUE
    AND p.image_url IS NOT NULL
    AND NULLIF(trim(p.image_url), '') IS NOT NULL
    AND p.title_en IN (
      'Moisturizing Cream',
      'Facial Body Lotion',
      'Skin Whitening Kojic Acid Cream',
      'Manjista Cream',
      'SPF 50 Cream',
      'Winter Special Moisturizer'
    )
  ORDER BY CASE p.title_en
    WHEN 'Moisturizing Cream' THEN 1
    WHEN 'Facial Body Lotion' THEN 2
    WHEN 'Skin Whitening Kojic Acid Cream' THEN 3
    WHEN 'Manjista Cream' THEN 4
    WHEN 'SPF 50 Cream' THEN 5
    WHEN 'Winter Special Moisturizer' THEN 6
    ELSE 100
  END
  LIMIT 1
)
UPDATE public.sections s
SET image_url = pci.image_url
FROM preferred_cream_lotion_image pci
WHERE s.section_id IN (
  'creams-lotions',
  'creams',
  'lotions',
  'humectants-actives'
);

-- Fallback static image if no cream/lotion product image is found
UPDATE public.sections s
SET image_url = 'https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772639090/Moisturizing_creams_kdbblz.jpg'
WHERE s.section_id IN (
  'creams-lotions',
  'creams',
  'lotions',
  'humectants-actives'
)
  AND (s.image_url IS NULL OR trim(s.image_url) = '');

COMMIT;

-- Optional verification:
-- SELECT section_id, title_en, image_url
-- FROM public.sections
-- WHERE section_id IN ('extracts','creams-lotions','creams','lotions','humectants-actives');
