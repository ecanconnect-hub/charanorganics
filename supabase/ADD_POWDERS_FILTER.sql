-- Adds a unified "Powders" filter section and maps all requested powder products.
-- Safe to run multiple times (idempotent).

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
  'powders',
  'Powders',
  'పౌడర్స్',
  'All powder-based ingredients in one filter',
  'అన్ని పౌడర్ ఉత్పత్తులు ఒకే ఫిల్టర్‌లో',
  'Master powder catalog including herbal powders, clays, and starches for easy selection.',
  'హెర్బల్ పౌడర్స్, క్లేలు, స్టార్చెస్ అన్నీ ఒకే ఫిల్టర్‌లో చూపించే మాస్టర్ కేటగిరీ.',
  15,
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

WITH powders_section AS (
  SELECT id FROM public.sections WHERE section_id = 'powders'
),
powder_codes(product_id, display_order) AS (
  VALUES
    ('BC044',1),('BC056',2),('BC073',3),('BC055',4),('BC138',5),('BC057',6),('BC058',7),('BC039',8),
    ('BC147',9),('BC043',10),('BC093',11),('BC019',12),('BC063',13),('HP002',14),('BC041',15),('BC016',16),
    ('BC091',17),('BC042',18),('HP003',19),('BC040',20),('BC137',21),('BC060',22),('BC059',23),('BC061',24),
    ('BC145',25),('BC146',26),('BC142',27),('BC037',28),('BC080',29),('BC026',30),('BC143',31),('HP001',32),
    ('BC141',33),('BC038',34),('BC133',35),('BC047',36),('BC048',37),('BC049',38),('BC132',39),('BC134',40),
    ('BC135',41),('BC139',42),('BC079',43),('BC054',44),('BC096',45),('BC028',46),('BC027',47),('BC020',48),
    ('BC081',49),('BC078',50),('BC015',51),('BC131',52),('BC136',53),('BC140',54),('BC144',55)
)
INSERT INTO public.product_sections (product_id, section_id, display_order)
SELECT
  p.id,
  s.id,
  pc.display_order
FROM powder_codes pc
JOIN public.products p
  ON p.product_id = pc.product_id
JOIN powders_section s
  ON TRUE
ON CONFLICT (product_id, section_id)
DO UPDATE SET
  display_order = EXCLUDED.display_order;

-- Optional: set section image from Banana Powder if available
UPDATE public.sections s
SET image_url = p.image_url,
    updated_at = NOW()
FROM public.products p
WHERE s.section_id = 'powders'
  AND p.product_id = 'HP001'
  AND p.image_url IS NOT NULL;

COMMIT;

