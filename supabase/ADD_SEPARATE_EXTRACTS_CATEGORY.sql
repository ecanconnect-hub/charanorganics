-- Add dedicated Extracts category and map extract products into it.
-- Idempotent and safe to re-run.

BEGIN;

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
  'extracts',
  'Extracts',
  'ఎక్స్‌ట్రాక్ట్స్',
  'Concentrated botanical active extracts',
  'ఫార్ములేషన్స్ కోసం కేంద్రీకృత హెర్బల్ ఎక్స్‌ట్రాక్ట్స్',
  'Botanical extracts used in shampoos, serums, creams, and treatment blends for targeted formulation outcomes.',
  'షాంపూ, సీరమ్, క్రీమ్స్ మరియు ట్రీట్మెంట్ బ్లెండ్స్‌లో ఉపయోగించే హెర్బల్ ఎక్స్‌ట్రాక్ట్స్. ఫార్ములేషన్ అవసరానికి తగ్గ మోతాదులో కలిపి వాడాలి.',
  7,
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

WITH extract_titles(title_en) AS (
  VALUES
    ('Turmeric Extract'),
    ('Rosemary Extract'),
    ('Bhringraj Extract'),
    ('Moringa Extract'),
    ('Neem Extract'),
    ('Tulasi Extract'),
    ('Tea Tree Extract'),
    ('Jasmine Extract'),
    ('Green Tea Extract'),
    ('Lotus Extract'),
    ('Pomegranate Extract'),
    ('Licorice Extract'),
    ('Cucumber Extract'),
    ('Rose Extract'),
    ('Chamomile Extract'),
    ('Ginger Extract'),
    ('Sweet Marjoram Extract')
),
extract_section AS (
  SELECT id FROM public.sections WHERE section_id = 'extracts'
),
extract_products AS (
  SELECT p.id, p.title_en
  FROM public.products p
  JOIN extract_titles t ON t.title_en = p.title_en
  WHERE p.is_active = TRUE
),
ordered_extracts AS (
  SELECT
    ep.id AS product_id,
    es.id AS section_id,
    ROW_NUMBER() OVER (ORDER BY ep.title_en) AS display_order
  FROM extract_products ep
  CROSS JOIN extract_section es
)
INSERT INTO public.product_sections (product_id, section_id, display_order)
SELECT product_id, section_id, display_order
FROM ordered_extracts
ON CONFLICT (product_id, section_id)
DO UPDATE SET
  display_order = EXCLUDED.display_order;

DELETE FROM public.product_sections ps
USING public.sections s, public.products p
WHERE ps.section_id = s.id
  AND ps.product_id = p.id
  AND s.section_id = 'humectants-actives'
  AND p.title_en IN (
    'Turmeric Extract',
    'Rosemary Extract',
    'Bhringraj Extract',
    'Moringa Extract',
    'Neem Extract',
    'Tulasi Extract',
    'Tea Tree Extract',
    'Jasmine Extract',
    'Green Tea Extract',
    'Lotus Extract',
    'Pomegranate Extract',
    'Licorice Extract',
    'Cucumber Extract',
    'Rose Extract',
    'Chamomile Extract',
    'Ginger Extract',
    'Sweet Marjoram Extract'
  );

COMMIT;

