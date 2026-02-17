-- Fix shop categories so every visible category has related products.
-- Includes: section setup, product activation for requested catalog, mapping, and old-section disable.

BEGIN;

-- 1) Keep only requested category structure enabled
INSERT INTO public.sections (
  section_id, title_en, title_te, subtitle_en, subtitle_te, description_en, description_te, display_order, is_enabled
)
VALUES
  ('soaps','Soaps','సబ్బులు','Soaps collection','సబ్బుల సేకరణ','Skin-cleansing soaps for daily use and gentle care.','ప్రతిరోజూ వాడే చర్మ శుభ్రత కోసం సబ్బులు.',1,TRUE),
  ('carrier-oils','Carrier Oils','క్యారియర్ ఆయిల్స్','Nourishing base oils','పోషక ఆయిల్ బేస్‌లు','Carrier oils used in massage, hair care, and skin formulations.','మసాజ్, హెయిర్ కేర్, స్కిన్ ఫార్ములేషన్స్‌లో ఉపయోగించే ఆయిల్స్.',2,TRUE),
  ('butters','Butters','బట్టర్స్','Rich moisturizing butters','రిచ్ మాయిశ్చరైజింగ్ బట్టర్స్','Butters for creams, balms, and deep nourishment blends.','క్రీమ్స్, బాల్మ్స్, పోషక బ్లెండ్స్ కోసం బట్టర్స్.',3,TRUE),
  ('waxes-emulsifiers','Waxes & Emulsifiers','వాక్సెస్ & ఎమల్సిఫైయర్స్','Structure and emulsification','టెక్స్చర్ మరియు ఎమల్సిఫికేషన్','Wax and emulsifier ingredients used for stable cream and balm textures.','స్థిరమైన క్రీమ్/బాల్మ్ టెక్స్చర్ కోసం వాక్స్ మరియు ఎమల్సిఫైయర్ పదార్థాలు.',4,TRUE),
  ('surfactants-cleansers','Surfactants & Cleansers','సర్ఫాక్టెంట్స్ & క్లీన్సర్స్','Cleansing formulation ingredients','క్లీన్సింగ్ ఫార్ములేషన్ పదార్థాలు','Mild and effective cleansing ingredients for shampoo and wash formulations.','షాంపూ/వాష్ ఫార్ములేషన్స్ కోసం మైల్డ్ క్లీన్సింగ్ పదార్థాలు.',5,TRUE),
  ('liquids-bases','Liquids & Bases','లిక్విడ్స్ & బేసెస్','Liquid ingredients and base systems','లిక్విడ్ పదార్థాలు మరియు బేస్ సిస్టమ్స్','Liquid ingredients and ready bases for product making and blending.','ప్రొడక్ట్ తయారీకి మరియు బ్లెండింగ్‌కి లిక్విడ్ పదార్థాలు మరియు బేస్‌లు.',6,TRUE),
  ('essential-oils','Essential Oils (15ml)','ఎసెన్షియల్ ఆయిల్స్ (15ml)','Concentrated aroma oils','సాంద్రీకృత సువాసన ఆయిల్స్','Concentrated essential oils for fragrance and aromatherapy-style blends.','సువాసన మరియు బ్లెండ్స్ కోసం సాంద్రీకృత ఎసెన్షియల్ ఆయిల్స్.',7,TRUE),
  ('starches-powders','Starches & Powders','స్టార్చెస్ & పౌడర్స్','Fine absorbent powders','సూక్ష్మ శోషణ పౌడర్స్','Starches and fine powders used in masks, dry blends, and texture balancing.','మాస్క్స్, డ్రై బ్లెండ్స్, టెక్స్చర్ బ్యాలెన్స్ కోసం స్టార్చెస్ మరియు పౌడర్స్.',8,TRUE),
  ('herbal-powders','Herbal Powders','హెర్బల్ పౌడర్స్','Traditional herbal ingredients','సాంప్రదాయ హెర్బల్ పదార్థాలు','Herbal powders for skin packs, hair masks, and natural personal care routines.','స్కిన్ ప్యాక్స్, హెయిర్ మాస్క్స్, నేచురల్ కేర్ కోసం హెర్బల్ పౌడర్స్.',9,TRUE)
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

-- Disable all other sections to avoid empty filters
UPDATE public.sections
SET is_enabled = FALSE, updated_at = NOW()
WHERE section_id NOT IN (
  'soaps','carrier-oils','butters','waxes-emulsifiers',
  'surfactants-cleansers','liquids-bases','essential-oils',
  'starches-powders','herbal-powders'
);

-- 2) Ensure requested products are active (so categories are not empty)
UPDATE public.products
SET is_active = TRUE, updated_at = NOW()
WHERE product_id IN (
  '810','811','BC001','BC002','BC005','BC006','BC012','BC023','BC032','BC033','BC034',
  'BC007','BC008','BC009','BC010','BC022',
  'BC013','BC021','BC029','BC035',
  'BC030','BC031','BC017','BC036','BC025','BC003',
  'BC064','EO001','EO002','EO004','EO003','EO005','BC070','BC071','BC072',
  'BC026','BC027','BC028','BC020','BC092',
  'BC015','BC016','BC018','BC019','HP001','BC054','BC055','BC056','BC057','BC058','BC059','BC060','BC061','HP002','BC063',
  'BC073','BC074','BC075','BC076','BC077','BC042','BC043','BC044','BC045','BC047','BC048','BC049','BC050','BC051','BC052',
  'BC037','BC038','BC039','BC094','BC078','BC079','BC080','BC081','BC082','BC083','BC084','BC085','BC046','BC041','BC040'
);

-- 3) Mapping table
CREATE TEMP TABLE desired_mapping (
  product_code TEXT NOT NULL,
  section_code TEXT NOT NULL,
  display_order INTEGER NOT NULL
);

INSERT INTO desired_mapping(product_code, section_code, display_order) VALUES
  ('810','soaps',1), ('811','soaps',2),
  ('BC001','carrier-oils',1), ('BC002','carrier-oils',2), ('BC005','carrier-oils',3), ('BC006','carrier-oils',4), ('BC012','carrier-oils',5), ('BC023','carrier-oils',6), ('BC032','carrier-oils',7), ('BC033','carrier-oils',8), ('BC034','carrier-oils',9),
  ('BC007','butters',1), ('BC008','butters',2),
  ('BC009','waxes-emulsifiers',1), ('BC010','waxes-emulsifiers',2), ('BC022','waxes-emulsifiers',3),
  ('BC013','surfactants-cleansers',1), ('BC021','surfactants-cleansers',2), ('BC029','surfactants-cleansers',3), ('BC035','surfactants-cleansers',4),
  ('BC030','liquids-bases',1), ('BC031','liquids-bases',2), ('BC017','liquids-bases',3), ('BC036','liquids-bases',4), ('BC025','liquids-bases',5), ('BC003','liquids-bases',6),
  ('BC064','essential-oils',1), ('EO001','essential-oils',2), ('EO002','essential-oils',3), ('EO004','essential-oils',4), ('EO003','essential-oils',5), ('EO005','essential-oils',6), ('BC070','essential-oils',7), ('BC071','essential-oils',8), ('BC072','essential-oils',9),
  ('BC026','starches-powders',1), ('BC027','starches-powders',2), ('BC028','starches-powders',3), ('BC020','starches-powders',4), ('BC092','starches-powders',5),
  ('BC015','herbal-powders',1), ('BC016','herbal-powders',2), ('BC018','herbal-powders',3), ('BC019','herbal-powders',4), ('HP001','herbal-powders',5), ('BC054','herbal-powders',6), ('BC055','herbal-powders',7), ('BC056','herbal-powders',8), ('BC057','herbal-powders',9), ('BC058','herbal-powders',10),
  ('BC059','herbal-powders',11), ('BC060','herbal-powders',12), ('BC061','herbal-powders',13), ('HP002','herbal-powders',14), ('BC063','herbal-powders',15), ('BC073','herbal-powders',16), ('BC074','herbal-powders',17), ('BC075','herbal-powders',18), ('BC076','herbal-powders',19), ('BC077','herbal-powders',20),
  ('BC042','herbal-powders',21), ('BC043','herbal-powders',22), ('BC044','herbal-powders',23), ('BC045','herbal-powders',24), ('BC047','herbal-powders',25), ('BC048','herbal-powders',26), ('BC049','herbal-powders',27), ('BC050','herbal-powders',28), ('BC051','herbal-powders',29), ('BC052','herbal-powders',30),
  ('BC037','herbal-powders',31), ('BC038','herbal-powders',32), ('BC039','herbal-powders',33), ('BC094','herbal-powders',34), ('BC078','herbal-powders',35), ('BC079','herbal-powders',36), ('BC080','herbal-powders',37), ('BC081','herbal-powders',38), ('BC082','herbal-powders',39), ('BC083','herbal-powders',40),
  ('BC084','herbal-powders',41), ('BC085','herbal-powders',42), ('BC046','herbal-powders',43), ('BC041','herbal-powders',44), ('BC040','herbal-powders',45);

-- Clear mappings only for enabled sections above
DELETE FROM public.product_sections ps
USING public.sections s
WHERE ps.section_id = s.id
  AND s.section_id IN (
    'soaps','carrier-oils','butters','waxes-emulsifiers',
    'surfactants-cleansers','liquids-bases','essential-oils',
    'starches-powders','herbal-powders'
  );

INSERT INTO public.product_sections (product_id, section_id, display_order)
SELECT p.id, s.id, dm.display_order
FROM desired_mapping dm
JOIN public.products p ON p.product_id = dm.product_code AND p.is_active = TRUE
JOIN public.sections s ON s.section_id = dm.section_code
ON CONFLICT (product_id, section_id) DO UPDATE
SET display_order = EXCLUDED.display_order;

COMMIT;

-- Verify:
-- SELECT s.section_id, s.title_en, COUNT(ps.product_id) AS products_count
-- FROM sections s
-- LEFT JOIN product_sections ps ON ps.section_id = s.id
-- LEFT JOIN products p ON p.id = ps.product_id AND p.is_active = TRUE
-- WHERE s.is_enabled = TRUE
-- GROUP BY s.section_id, s.title_en
-- ORDER BY s.display_order;
