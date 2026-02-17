-- Category creation + product mapping (supports multi-category products)
-- This script is idempotent: safe to run multiple times.

BEGIN;

-- 1) Create/Update sections with clear descriptions
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
VALUES
  (
    'oils-liquids',
    'Oils & Liquids',
    'ఆయిల్స్ & లిక్విడ్స్',
    'Carrier oils, hydrosols, and liquid ingredients',
    'క్యారియర్ ఆయిల్స్, హైడ్రోసోల్స్, లిక్విడ్ పదార్థాలు',
    'This category includes carrier oils, floral waters, and liquid cosmetic ingredients used in skin care, hair care, massage blends, and formulation bases. These products are commonly used directly or as blend components in DIY and professional personal-care formulations.',
    'ఈ కేటగిరీలో క్యారియర్ ఆయిల్స్, ఫ్లోరల్ వాటర్స్, మరియు లిక్విడ్ కాస్మెటిక్ పదార్థాలు ఉంటాయి. ఇవి స్కిన్ కేర్, హెయిర్ కేర్, మసాజ్ బ్లెండ్స్, మరియు ఫార్ములేషన్‌లలో ఉపయోగపడతాయి.',
    1,
    TRUE
  ),
  (
    'soap-shampoo-bases',
    'Soap, Shampoo & Bases',
    'సోప్, షాంపూ & బేసెస్',
    'Ready-to-use bases for fast product making',
    'సులభంగా తయారీకి రెడీ బేస్ పదార్థాలు',
    'This section contains melt-and-pour soap bases and shampoo bases used to create customized finished products. Add fragrance, color, or actives as needed and use these as stable base systems for production.',
    'ఈ విభాగంలో సోప్ మరియు షాంపూ తయారీకి రెడీ-టు-యూజ్ బేస్‌లు ఉంటాయి. అవసరాన్ని బట్టి ఫ్రాగ్రెన్స్, కలర్, లేదా యాక్టివ్స్ కలిపి ఫైనల్ ప్రొడక్ట్ తయారు చేయవచ్చు.',
    2,
    TRUE
  ),
  (
    'surfactants-additives',
    'Surfactants & Additives',
    'సర్ఫాక్టెంట్స్ & యాడిటివ్స్',
    'Cleansing agents and performance boosters',
    'క్లీన్సింగ్ మరియు పనితీరు మెరుగుపరిచే పదార్థాలు',
    'Products in this category improve cleansing, texture, moisture retention, preservation, and stability in personal care formulations. Typical usage includes shampoos, body wash, gels, creams, and liquid cleanser systems.',
    'ఈ కేటగిరీలో ఉన్న పదార్థాలు క్లీన్సింగ్, టెక్స్చర్, తేమ నిల్వ, ప్రిజర్వేషన్ మరియు స్టెబిలిటీ మెరుగుపరుస్తాయి. షాంపూ, బాడీవాష్, జెల్స్, క్రీమ్స్ వంటి ఫార్ములేషన్స్‌లో వాడుతారు.',
    3,
    TRUE
  ),
  (
    'butters-waxes-binders',
    'Butters, Waxes & Binders',
    'బట్టర్స్, వాక్సెస్ & బైండర్స్',
    'Structure, richness, and thickening support',
    'నిర్మాణం, రిచ్ టెక్స్చర్, థిక్నెస్ కోసం',
    'This section includes butters, waxes, and binders used to build product body, thickness, and protective feel in balms, creams, solid bars, and ointments.',
    'ఈ విభాగంలో బట్టర్స్, వాక్సెస్, బైండర్స్ ఉంటాయి. బాల్మ్స్, క్రీమ్స్, సాలిడ్ బార్స్‌లో బాడీ, థిక్నెస్, మరియు టెక్స్చర్ కోసం వీటిని వాడుతారు.',
    4,
    TRUE
  ),
  (
    'clays-starches-flours',
    'Clays, Starches & Flours',
    'క్లేస్, స్టార్చెస్ & ఫ్లవర్స్',
    'Absorbent powders for packs and blends',
    'ప్యాక్స్ మరియు బ్లెండ్స్ కోసం శోషించే పౌడర్స్',
    'These ingredients are used in face packs, dry blends, and cleansing systems to absorb excess oil, improve texture, and provide a smooth skin-feel.',
    'ఈ పదార్థాలు ఫేస్ ప్యాక్స్, డ్రై బ్లెండ్స్, క్లీన్సింగ్ సిస్టమ్స్‌లో ఉపయోగిస్తారు. అదనపు ఆయిల్ శోషణ, మంచి టెక్స్చర్, స్మూత్ ఫీల్ కోసం వీటి ఉపయోగం ఉంటుంది.',
    5,
    TRUE
  ),
  (
    'herbal-powders-skin-soap',
    'Herbal Powders - Skin & Soap',
    'హెర్బల్ పౌడర్స్ - స్కిన్ & సోప్',
    'Herbal ingredients for skin packs and soap making',
    'స్కిన్ ప్యాక్స్, సోప్ తయారీకి హెర్బల్ పదార్థాలు',
    'This category covers herbal powders mainly used in skin-care packs, scrub blends, and soap formulations. These ingredients are selected for cleansing support, smoothness, glow-focused blends, and traditional care routines.',
    'ఈ కేటగిరీలో స్కిన్ కేర్ ప్యాక్స్, స్క్రబ్ బ్లెండ్స్, సోప్ ఫార్ములేషన్స్‌లో ఉపయోగించే హెర్బల్ పౌడర్స్ ఉంటాయి. చర్మ శుభ్రత, మృదుత్వం, గ్లో మరియు సంప్రదాయ సంరక్షణ కోసం వీటిని వాడుతారు.',
    6,
    TRUE
  ),
  (
    'herbal-powders-hair-shampoo',
    'Herbal Powders - Hair & Shampoo',
    'హెర్బల్ పౌడర్స్ - హెయిర్ & షాంపూ',
    'Traditional herbal powders for scalp and hair care',
    'స్కాల్ప్ మరియు హెయిర్ కేర్ కోసం హెర్బల్ పౌడర్స్',
    'This section includes herbal powders commonly used in hair masks, scalp packs, and natural shampoo blends. They are used to support scalp cleanliness, hair texture, and traditional herbal hair routines.',
    'ఈ విభాగంలో హెయిర్ మాస్క్స్, స్కాల్ప్ ప్యాక్స్, నేచురల్ షాంపూ బ్లెండ్స్‌లో ఉపయోగించే హెర్బల్ పౌడర్స్ ఉంటాయి. స్కాల్ప్ క్లీన్, హెయిర్ టెక్స్చర్, సంప్రదాయ హెయిర్ కేర్ కోసం వీటిని వాడుతారు.',
    7,
    TRUE
  ),
  (
    'essential-oils',
    'Essential Oils',
    'ఎసెన్షియల్ ఆయిల్స్',
    'Concentrated aroma oils for blends',
    'బ్లెండ్స్ కోసం సాంద్రీకృత సువాసన ఆయిల్స్',
    'Essential oils are concentrated aromatic ingredients used in soaps, oils, creams, and diffuser blends. Use in low quantity and dilute properly before topical application.',
    'ఎసెన్షియల్ ఆయిల్స్ సాంద్రీకృత సువాసన పదార్థాలు. సోప్స్, ఆయిల్ బ్లెండ్స్, క్రీమ్స్, డిఫ్యూజర్ మిక్స్‌లలో తక్కువ మోతాదులో వాడాలి. చర్మానికి నేరుగా వాడితే తప్పనిసరిగా డైల్యూట్ చేయాలి.',
    8,
    TRUE
  ),
  (
    'miscellaneous',
    'Miscellaneous',
    'ఇతరాలు',
    'Fallback section for uncategorized products',
    'వర్గీకరణలో లేని ప్రొడక్ట్స్ కోసం',
    'Any active product not explicitly mapped to a primary business category is placed here to avoid missing items in storefront filters.',
    'ప్రధాన కేటగిరీలలో మాపింగ్ కాలేని యాక్టివ్ ప్రొడక్ట్స్ ఈ విభాగంలో ఉంచబడతాయి, షాప్ ఫిల్టర్స్‌లో ప్రొడక్ట్ మిస్సవకుండా ఉండేందుకు.',
    99,
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

-- 2) Build desired mapping table (multi-category supported by multiple rows per product)
CREATE TEMP TABLE desired_mapping (
  product_code TEXT NOT NULL,
  section_code TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0
);

INSERT INTO desired_mapping (product_code, section_code, display_order) VALUES
  -- Oils & Liquids
  ('BC001','oils-liquids',1), ('BC002','oils-liquids',2), ('BC006','oils-liquids',3), ('BC005','oils-liquids',4),
  ('BC089','oils-liquids',5), ('BC032','oils-liquids',6), ('BC033','oils-liquids',7), ('BC034','oils-liquids',8),
  ('BC012','oils-liquids',9), ('BC023','oils-liquids',10), ('BC030','oils-liquids',11), ('BC024','oils-liquids',12),
  ('BC036','oils-liquids',13), ('BC090','oils-liquids',14),

  -- Soap, Shampoo & Bases
  ('BC025','soap-shampoo-bases',1), ('BC035','soap-shampoo-bases',2),

  -- Surfactants & Additives
  ('BC013','surfactants-additives',1), ('BC021','surfactants-additives',2), ('BC029','surfactants-additives',3),
  ('BC003','surfactants-additives',4), ('BC031','surfactants-additives',5), ('BC017','surfactants-additives',6),
  ('BC091','surfactants-additives',7), ('BC052','surfactants-additives',8), ('BC051','surfactants-additives',9),

  -- Butters, Waxes & Binders
  ('BC007','butters-waxes-binders',1), ('BC008','butters-waxes-binders',2), ('BC022','butters-waxes-binders',3),
  ('BC010','butters-waxes-binders',4), ('BC077','butters-waxes-binders',5),

  -- Clays, Starches & Flours
  ('BC020','clays-starches-flours',1), ('BC026','clays-starches-flours',2), ('BC027','clays-starches-flours',3),
  ('BC028','clays-starches-flours',4), ('BC092','clays-starches-flours',5), ('BC047','clays-starches-flours',6),
  ('BC048','clays-starches-flours',7), ('BC049','clays-starches-flours',8),

  -- Herbal Powders - Skin & Soap
  ('BC050','herbal-powders-skin-soap',1), ('BC054','herbal-powders-skin-soap',2), ('HP001','herbal-powders-skin-soap',3),
  ('BC055','herbal-powders-skin-soap',4), ('BC056','herbal-powders-skin-soap',5), ('BC057','herbal-powders-skin-soap',6),
  ('BC073','herbal-powders-skin-soap',7), ('BC059','herbal-powders-skin-soap',8), ('BC060','herbal-powders-skin-soap',9),
  ('HP003','herbal-powders-skin-soap',10), ('BC045','herbal-powders-skin-soap',11), ('BC074','herbal-powders-skin-soap',12),
  ('BC075','herbal-powders-skin-soap',13), ('BC058','herbal-powders-skin-soap',14), ('BC061','herbal-powders-skin-soap',15),
  ('BC093','herbal-powders-skin-soap',16), ('HP002','herbal-powders-skin-soap',17), ('BC063','herbal-powders-skin-soap',18),
  ('BC076','herbal-powders-skin-soap',19), ('BC083','herbal-powders-skin-soap',20),

  -- Herbal Powders - Hair & Shampoo
  ('BC039','herbal-powders-hair-shampoo',1), ('BC094','herbal-powders-hair-shampoo',2), ('BC037','herbal-powders-hair-shampoo',3),
  ('BC095','herbal-powders-hair-shampoo',4), ('BC096','herbal-powders-hair-shampoo',5), ('BC038','herbal-powders-hair-shampoo',6),
  ('BC097','herbal-powders-hair-shampoo',7), ('BC019','herbal-powders-hair-shampoo',8), ('BC078','herbal-powders-hair-shampoo',9),
  ('BC079','herbal-powders-hair-shampoo',10), ('BC080','herbal-powders-hair-shampoo',11), ('BC042','herbal-powders-hair-shampoo',12),
  ('BC043','herbal-powders-hair-shampoo',13), ('BC081','herbal-powders-hair-shampoo',14), ('BC082','herbal-powders-hair-shampoo',15),
  ('BC046','herbal-powders-hair-shampoo',16), ('BC041','herbal-powders-hair-shampoo',17), ('BC040','herbal-powders-hair-shampoo',18),
  ('BC084','herbal-powders-hair-shampoo',19), ('BC085','herbal-powders-hair-shampoo',20), ('BC044','herbal-powders-hair-shampoo',21),

  -- Essential Oils
  ('BC064','essential-oils',1), ('EO001','essential-oils',2), ('EO002','essential-oils',3), ('EO004','essential-oils',4),
  ('EO003','essential-oils',5), ('EO005','essential-oils',6), ('BC070','essential-oils',7), ('BC071','essential-oils',8),
  ('BC072','essential-oils',9),

  -- Multi-category example: essential oils also appear in oils/liquids
  ('BC064','oils-liquids',101), ('EO001','oils-liquids',102), ('EO002','oils-liquids',103), ('EO004','oils-liquids',104),
  ('EO003','oils-liquids',105), ('EO005','oils-liquids',106), ('BC070','oils-liquids',107), ('BC071','oils-liquids',108),
  ('BC072','oils-liquids',109);

-- 3) Clear old mappings for target sections and apply fresh mapping
DELETE FROM public.product_sections ps
USING public.sections s
WHERE ps.section_id = s.id
  AND s.section_id IN (
    'oils-liquids',
    'soap-shampoo-bases',
    'surfactants-additives',
    'butters-waxes-binders',
    'clays-starches-flours',
    'herbal-powders-skin-soap',
    'herbal-powders-hair-shampoo',
    'essential-oils',
    'miscellaneous'
  );

INSERT INTO public.product_sections (product_id, section_id, display_order)
SELECT
  p.id,
  s.id,
  dm.display_order
FROM desired_mapping dm
JOIN public.products p
  ON p.product_id = dm.product_code
  AND p.is_active = TRUE
JOIN public.sections s
  ON s.section_id = dm.section_code
ON CONFLICT (product_id, section_id)
DO UPDATE SET
  display_order = EXCLUDED.display_order;

-- 4) Fallback mapping: any active product not in any category -> Miscellaneous
INSERT INTO public.product_sections (product_id, section_id, display_order)
SELECT
  p.id AS product_id,
  s_misc.id AS section_id,
  ROW_NUMBER() OVER (ORDER BY p.product_id) AS display_order
FROM public.products p
JOIN public.sections s_misc
  ON s_misc.section_id = 'miscellaneous'
LEFT JOIN public.product_sections ps
  ON ps.product_id = p.id
WHERE p.is_active = TRUE
  AND ps.id IS NULL
ON CONFLICT (product_id, section_id)
DO NOTHING;

COMMIT;

-- Optional checks:
-- 1) Products with no category (should return 0 rows)
-- SELECT p.product_id, p.title_en
-- FROM public.products p
-- LEFT JOIN public.product_sections ps ON ps.product_id = p.id
-- WHERE p.is_active = TRUE AND ps.id IS NULL;
--
-- 2) Multi-category products
-- SELECT p.product_id, p.title_en, COUNT(*) AS categories_count
-- FROM public.product_sections ps
-- JOIN public.products p ON p.id = ps.product_id
-- WHERE p.is_active = TRUE
-- GROUP BY p.product_id, p.title_en
-- HAVING COUNT(*) > 1
-- ORDER BY categories_count DESC, p.product_id;
