-- Image sync + missing product creation from provided Cloudinary URLs
-- Also applies requested pricing rules:
-- 1) Creams: 50 g = 180, 100 g = 350 (via variants)
-- 2) Soaps (listed + core soap SKUs): 100
-- 3) Kumkumadi oil 15 ml: 250
--
-- Safe to run multiple times.

BEGIN;

-- 1) Ensure required sections exist (do not disable other sections)
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
    'soaps-body-bars',
    'Soaps & Body Bars',
    'సబ్బులు & బాడీ బార్స్',
    'Daily cleansing bars and soap products',
    'రోజువారీ శుభ్రత కోసం సబ్బులు',
    'Handmade and treatment-oriented soaps for cleansing, freshness, and targeted skin-care routines.',
    'శుభ్రత, తాజాదనం మరియు ప్రత్యేక చర్మ సంరక్షణ కోసం హ్యాండ్‌మేడ్ మరియు ట్రీట్‌మెంట్ సబ్బులు.',
    1,
    TRUE
  ),
  (
    'creams-lotions',
    'Creams & Lotions',
    'క్రీమ్స్ & లోషన్స్',
    'Topical care for targeted skin support',
    'ప్రత్యేక చర్మ సంరక్షణ కోసం టాపికల్ ఉత్పత్తులు',
    'Creams, gels, and lotions for moisturizing, skin-tone support, repair care, and daily topical routines.',
    'మాయిశ్చరైజింగ్, స్కిన్ టోన్ సపోర్ట్, రిపేర్ కేర్ మరియు రోజువారీ టాపికల్ వినియోగం కోసం క్రీమ్స్, జెల్స్, లోషన్స్.',
    2,
    TRUE
  ),
  (
    'carrier-oils',
    'Carrier Oils',
    'క్యారియర్ ఆయిల్స్',
    'Base oils for skin and blend routines',
    'స్కిన్ మరియు బ్లెండ్స్ కోసం బేస్ ఆయిల్స్',
    'Carrier and treatment oils used in face care, massage, glow routines, and blend-based application.',
    'ఫేస్ కేర్, మసాజ్, గ్లో రొటీన్ మరియు బ్లెండ్ వినియోగంలో ఉపయోగించే క్యారియర్/ట్రీట్‌మెంట్ ఆయిల్స్.',
    3,
    TRUE
  ),
  (
    'powders',
    'Powders',
    'పౌడర్స్',
    'All powder ingredients in one filter',
    'అన్ని పౌడర్ పదార్థాలు ఒకే ఫిల్టర్‌లో',
    'Unified powder catalog including herbal powders, clays, and scrub powders.',
    'హెర్బల్ పౌడర్స్, క్లేలు, స్క్రబ్ పౌడర్స్ కలిగిన యూనిఫైడ్ కేటగిరీ.',
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

-- 2) Incoming image/product map
CREATE TEMP TABLE incoming_assets (
  product_id TEXT PRIMARY KEY,
  title_en TEXT NOT NULL,
  image_url TEXT NOT NULL,
  category_tag TEXT NOT NULL,        -- powder | soap | cream | oil
  base_mrp NUMERIC NOT NULL,
  base_price NUMERIC NOT NULL,
  shipping_charges NUMERIC NOT NULL DEFAULT 70,
  stock_quantity INTEGER NOT NULL DEFAULT 100,
  description_en TEXT,
  specifications_en TEXT,
  usage_en TEXT
);

INSERT INTO incoming_assets (
  product_id, title_en, image_url, category_tag, base_mrp, base_price, shipping_charges, stock_quantity,
  description_en, specifications_en, usage_en
)
VALUES
  -- Existing powder/clay products (image update; inserted only if missing)
  ('BC145','Tomato Powder','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772554586/BC145_Tomato_Powder_osjb73.png','powder',60,40,70,100,NULL,NULL,NULL),
  ('BC134','Dead Sea Mud','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772554573/BC134_Dead_Sea_Mud_x3pf2b.webp','powder',120,60,70,100,NULL,NULL,NULL),
  ('BC135','Green Clay','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772554572/BC135_Green_Clay_z4zfzh.jpg','powder',120,60,70,100,NULL,NULL,NULL),
  ('BC137','Indigo Powder','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772554570/BC137_Indigo_Powder_fgvyrs.jpg','powder',120,60,70,100,NULL,NULL,NULL),
  ('BC139','Kuppipakku Powder','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772554570/BC139_Kuppipakku_Powder_vf6uo2.webp','powder',120,60,70,100,NULL,NULL,NULL),
  ('BC136','Hartal Works Powder','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772554569/BC136_Hartal_Works_Powder_ani83c.webp','powder',300,150,70,100,NULL,NULL,NULL),
  ('BC138','Karakkaya Powder','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772554568/BC138_Karakkaya_Powder_brihcw.jpg','powder',120,60,70,100,NULL,NULL,NULL),
  ('BC144','Shankapushpi','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772554567/BC144_Shankapushpi_givnwm.jpg','powder',140,70,70,100,NULL,NULL,NULL),
  ('BC140','Limestone','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772554566/BC140_Limestone_rxlbjs.jpg','powder',140,70,70,100,NULL,NULL,NULL),
  ('BC141','Lotus Powder','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772554565/BC141_Lotus_Powder_fwgclh.jpg','powder',150,75,70,100,NULL,NULL,NULL),
  ('BC142','Moringa Powder','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772554565/BC142_Moringa_Powder_nxacsb.webp','powder',100,50,70,100,NULL,NULL,NULL),
  ('BC143','Papaya Powder','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772554564/BC143_Papaya_Powder_o5j0yl.webp','powder',120,60,70,100,NULL,NULL,NULL),
  ('BC147','Walnut Shell Powder','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772554562/BC147_Walnut_Shell_Powder_vzxkhy.jpg','powder',80,40,70,100,NULL,NULL,NULL),
  ('BC146','Ubtan Powder','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772554562/BC146_Ubtan_Powder_irj7lq.jpg','powder',150,75,70,100,NULL,NULL,NULL),
  ('BC132','Bentonite Clay','https://res.cloudinary.com/dur6fkyoz/image/upload/v1772556382/F_Bentonite_Clay_lxyxwr.jpg','powder',120,60,70,100,NULL,NULL,NULL),
  ('BC133','Charcoal Powder','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772554581/charcoal-250x250_sptpoj.webp','powder',120,60,70,100,NULL,NULL,NULL),
  ('BC131','Badam Charcoal','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772554580/bhadham_charcoal-250x250_1_gd2zsa.webp','powder',150,75,70,100,NULL,NULL,NULL),

  -- Existing soap SKU image update
  ('810','Skin Whitening Soaps','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772554569/skin_whiteing_soap_y7rwju.jpg','soap',100,100,70,100,NULL,NULL,NULL),

  -- New products from provided images
  ('BC148','Grape Shape Hand Wash Soap','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772554582/hand_wash_soap_grape_shape_bxtqdn.jpg','soap',100,100,70,100,'Hand wash soap for daily cleansing with rich foam and skin-friendly feel.','100 g | Hand wash soap','Apply on wet hands, lather for 20 seconds, rinse with clean water.'),
  ('BC149','Red Wine Gel','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772554582/red_wine_gel_ujvxgv.jpg','cream',180,180,70,100,'Topical gel designed for hydration support and smooth-looking skin texture.','50 g | Cosmetic gel','Apply a thin layer on clean skin and massage gently until absorbed.'),
  ('BC150','Dark Neck Removal Cream','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772554582/dark_neck_emoval_cream_q1algb.jpg','cream',180,180,70,100,'Targeted care cream for uneven skin tone zones such as neck and folds.','50 g | Topical cream','Apply on clean, dry area once or twice daily and massage gently.'),
  ('BC151','Sunscreen Cream','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772554580/sun_screem_crem_rznmgq.jpg','cream',180,180,70,100,'Daily-use sunscreen cream for outdoor skin protection and moisture support.','50 g | Day-care cream','Apply evenly on exposed skin 15-20 minutes before sun exposure.'),
  ('BC152','Charcoal Soap','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772554579/chark_coal_soap_sgfc5x.jpg','soap',100,100,70,100,'Activated-charcoal soap bar for deep cleansing and daily freshness.','100 g | Handmade soap bar','Wet skin, work into lather, cleanse gently, and rinse well.'),
  ('BC153','Hand Wash Soap','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772554579/hand_wash_sopas_qk8vy4.jpg','soap',100,100,70,100,'Liquid-style hand wash soap product for regular hygiene routine.','100 g | Hand wash soap','Use on wet hands, lather, and rinse thoroughly.'),
  ('BC154','Facial Body Lotion','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772554577/faciyal_body_loshan_ipakgy.jpg','cream',180,180,70,100,'Face and body lotion for daily moisturization and smooth skin feel.','50 g | Skin lotion','Apply after bath or whenever skin feels dry; massage until absorbed.'),
  ('BC155','Kumkumadi Thailam','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772554577/kunkumadhi_thilam_qgivc5.jpg','oil',250,250,70,100,'Traditional facial oil blend used for glow-focused night skin-care routines.','15 ml | Facial oil','Use 2-3 drops on clean face at night and massage gently.'),
  ('BC156','Foot Cream','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772554577/foot_cream_otgks1.jpg','cream',180,180,70,100,'Repair-focused foot cream for rough, dry, and cracked heel care.','50 g | Foot care cream','Apply on clean feet, especially heels, and massage before sleep.'),
  ('BC157','Ubtan Soap','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772554576/uptan_soap_px3kq8.jpg','soap',100,100,70,100,'Ubtan-inspired soap for cleansing and bright-finish bathing routine.','100 g | Herbal soap bar','Use daily on wet skin, lather, cleanse, and rinse.'),
  ('BC158','Ubtan Soap (Square Shape)','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772554574/ubtansoap_squar_shape_jhemyq.jpg','soap',100,100,70,100,'Square-shape ubtan soap bar for regular skin cleansing and care.','100 g | Handmade soap bar','Use with water to form lather and rinse after cleansing.'),
  ('BC159','Skin Allergy Soap','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772554574/skin_allegry_soap_mg5hsh.jpg','soap',100,100,70,100,'Gentle soap bar intended for sensitive skin cleansing routine.','100 g | Gentle soap bar','Patch test first. Use gently on wet skin and rinse completely.'),
  ('BC160','Goat Milk Soap','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772554571/goat_mil_soap_welahc.jpg','soap',100,100,70,100,'Goat milk soap for mild cleansing and soft skin feel.','100 g | Goat milk soap bar','Use daily during bath and rinse thoroughly.'),
  ('BC161','Red Sandal Soap','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772554567/red_sandel_soap_iawqd6.jpg','soap',100,100,70,100,'Red sandal soap for traditional herbal cleansing and skin care.','100 g | Herbal soap bar','Lather with water, apply on skin, and rinse well.'),
  ('BC162','Skin Whitening Soap (Blue & Orange)','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772554567/skin_whitaing_blue_and_orgence_coloer_soap_vr9xof.jpg','soap',100,100,70,100,'Two-tone soap bar for daily cleansing and glow-support routine.','100 g | Handmade soap bar','Use on wet skin, massage as lather, then rinse.'),
  ('BC163','Papaya Soap','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772554566/papaya_soap_fkhcuf.jpg','soap',100,100,70,100,'Papaya-based cleansing soap for daily skin refresh and bright look.','100 g | Papaya soap bar','Use daily while bathing and rinse thoroughly.'),
  ('BC164','Multani Mitti Soap','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772554565/multhani_mitti_soap_dange3.jpg','soap',100,100,70,100,'Multani mitti soap for oil-control cleansing and clean skin finish.','100 g | Clay soap bar','Lather gently on wet skin and rinse well.'),
  ('BC165','Manjistha Soap','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772554564/manjistra_saop_chsuhc.jpg','soap',100,100,70,100,'Manjistha herbal soap for daily cleansing and smooth skin feel.','100 g | Herbal soap bar','Use daily as bath soap and rinse with water.'),
  ('BC166','Bhringraj Soap','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772554564/brindhal_soap_ka37xo.jpg','soap',100,100,70,100,'Bhringraj soap for mild cleansing and herbal care routine.','100 g | Herbal soap bar','Use with water to create lather and rinse thoroughly.'),
  ('BC167','Badam Soap','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772554563/bhadam_soap_a2fmjo.jpg','soap',100,100,70,100,'Badam (almond) soap for smooth cleansing and moisturized feel.','100 g | Almond soap bar','Apply on wet skin, massage gently, and rinse.'),
  ('BC168','D-Tan Soap','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772554563/d_tan_soap_mnb3sx.jpg','soap',100,100,70,100,'D-Tan soap for everyday cleansing and tan-care support routine.','100 g | D-Tan soap bar','Use regularly during bath for best results.');

-- 3) Insert missing products, or update image for existing products
INSERT INTO public.products (
  product_id,
  title_en,
  title_te,
  description_en,
  specifications_en,
  usage_en,
  image_url,
  mrp,
  current_price,
  shipping_charges,
  stock_quantity,
  is_active
)
SELECT
  i.product_id,
  i.title_en,
  i.title_en,
  COALESCE(
    i.description_en,
    CASE
      WHEN i.category_tag = 'soap' THEN 'Handcrafted cleansing soap product for daily skin-care routine.'
      WHEN i.category_tag = 'cream' THEN 'Topical cream/gel for moisturization and targeted care.'
      WHEN i.category_tag = 'oil' THEN 'Traditional cosmetic oil for glow-focused facial care.'
      ELSE 'Natural powder ingredient for face packs, scrub blends, and formulation use.'
    END
  ),
  COALESCE(
    i.specifications_en,
    CASE
      WHEN i.category_tag = 'soap' THEN '100 g | Soap product'
      WHEN i.category_tag = 'cream' THEN '50 g | Topical care product'
      WHEN i.category_tag = 'oil' THEN '15 ml | Cosmetic oil'
      ELSE '50 g | Powder ingredient'
    END
  ),
  COALESCE(
    i.usage_en,
    CASE
      WHEN i.category_tag = 'soap' THEN 'Use with water, lather gently, and rinse thoroughly.'
      WHEN i.category_tag = 'cream' THEN 'Apply on clean skin and massage gently until absorbed.'
      WHEN i.category_tag = 'oil' THEN 'Use 2-3 drops on clean skin and massage gently.'
      ELSE 'Mix with suitable liquid and use as pack/blend ingredient.'
    END
  ),
  i.image_url,
  i.base_mrp,
  i.base_price,
  i.shipping_charges,
  i.stock_quantity,
  TRUE
FROM incoming_assets i
ON CONFLICT (product_id)
DO UPDATE SET
  image_url = EXCLUDED.image_url,
  is_active = TRUE,
  updated_at = NOW();

-- 3b) Deactivate duplicate active titles for newly introduced products
WITH canonical_titles(product_id, title_en) AS (
  VALUES
    ('BC148','Grape Shape Hand Wash Soap'),
    ('BC149','Red Wine Gel'),
    ('BC150','Dark Neck Removal Cream'),
    ('BC151','Sunscreen Cream'),
    ('BC152','Charcoal Soap'),
    ('BC153','Hand Wash Soap'),
    ('BC154','Facial Body Lotion'),
    ('BC155','Kumkumadi Thailam'),
    ('BC156','Foot Cream'),
    ('BC157','Ubtan Soap'),
    ('BC158','Ubtan Soap (Square Shape)'),
    ('BC159','Skin Allergy Soap'),
    ('BC160','Goat Milk Soap'),
    ('BC161','Red Sandal Soap'),
    ('BC162','Skin Whitening Soap (Blue & Orange)'),
    ('BC163','Papaya Soap'),
    ('BC164','Multani Mitti Soap'),
    ('BC165','Manjistha Soap'),
    ('BC166','Bhringraj Soap'),
    ('BC167','Badam Soap'),
    ('BC168','D-Tan Soap')
)
UPDATE public.products p
SET
  is_active = FALSE,
  updated_at = NOW()
FROM canonical_titles c
WHERE lower(trim(p.title_en)) = lower(trim(c.title_en))
  AND p.product_id <> c.product_id
  AND p.is_active = TRUE;

-- 4) Requested pricing rules
-- 4a) Soaps -> 100
UPDATE public.products
SET
  current_price = 100,
  mrp = 100,
  is_active = TRUE,
  updated_at = NOW()
WHERE product_id IN (
  '810', '811',
  'BC148', 'BC152', 'BC153', 'BC157', 'BC158', 'BC159', 'BC160',
  'BC161', 'BC162', 'BC163', 'BC164', 'BC165', 'BC166', 'BC167', 'BC168'
);

-- 4b) Cream base price -> 50 g price 180
UPDATE public.products
SET
  current_price = 180,
  mrp = 180,
  is_active = TRUE,
  updated_at = NOW()
WHERE product_id IN ('BC149', 'BC150', 'BC151', 'BC154', 'BC156');

-- 4c) Kumkumadi oil 15 ml -> 250
UPDATE public.products
SET
  current_price = 250,
  mrp = 250,
  is_active = TRUE,
  updated_at = NOW()
WHERE product_id = 'BC155';

-- 5) Cream size variants (replace existing variants for these cream SKUs)
DELETE FROM public.product_variants pv
USING public.products p
WHERE pv.product_id = p.id
  AND p.product_id IN ('BC149', 'BC150', 'BC151', 'BC154', 'BC156');

INSERT INTO public.product_variants (
  product_id,
  label,
  price,
  mrp,
  shipping_charge,
  stock_quantity,
  enabled
)
SELECT
  p.id,
  v.label,
  v.price,
  v.mrp,
  70,
  100,
  TRUE
FROM public.products p
CROSS JOIN (
  VALUES
    ('50 g', 180::NUMERIC, 180::NUMERIC),
    ('100 g', 350::NUMERIC, 350::NUMERIC)
) AS v(label, price, mrp)
WHERE p.product_id IN ('BC149', 'BC150', 'BC151', 'BC154', 'BC156');

-- 6) Map all listed products to suitable categories
WITH resolved_sections AS (
  SELECT 'soap'::TEXT AS category_tag,
    COALESCE(
      (SELECT id FROM public.sections WHERE section_id = 'soaps-body-bars' AND is_enabled = TRUE LIMIT 1),
      (SELECT id FROM public.sections WHERE section_id = 'soaps' AND is_enabled = TRUE LIMIT 1),
      (SELECT id FROM public.sections WHERE section_id = 'soaps-body-bars' LIMIT 1),
      (SELECT id FROM public.sections WHERE section_id = 'soaps' LIMIT 1)
    ) AS section_uuid
  UNION ALL
  SELECT 'cream'::TEXT AS category_tag,
    COALESCE(
      (SELECT id FROM public.sections WHERE section_id = 'creams-lotions' LIMIT 1),
      (SELECT id FROM public.sections WHERE section_id = 'humectants-actives' LIMIT 1)
    ) AS section_uuid
  UNION ALL
  SELECT 'oil'::TEXT AS category_tag,
    COALESCE(
      (SELECT id FROM public.sections WHERE section_id = 'carrier-oils' AND is_enabled = TRUE LIMIT 1),
      (SELECT id FROM public.sections WHERE section_id = 'oils-liquids' AND is_enabled = TRUE LIMIT 1),
      (SELECT id FROM public.sections WHERE section_id = 'carrier-oils' LIMIT 1),
      (SELECT id FROM public.sections WHERE section_id = 'oils-liquids' LIMIT 1)
    ) AS section_uuid
  UNION ALL
  SELECT 'powder'::TEXT AS category_tag,
    COALESCE(
      (SELECT id FROM public.sections WHERE section_id = 'powders' AND is_enabled = TRUE LIMIT 1),
      (SELECT id FROM public.sections WHERE section_id = 'powders' LIMIT 1),
      (SELECT id FROM public.sections WHERE section_id = 'herbal-powders-skin' LIMIT 1),
      (SELECT id FROM public.sections WHERE section_id = 'herbal-powders' LIMIT 1),
      (SELECT id FROM public.sections WHERE section_id = 'clays-minerals' LIMIT 1),
      (SELECT id FROM public.sections WHERE section_id = 'starches-powders' LIMIT 1)
    ) AS section_uuid
)
INSERT INTO public.product_sections (product_id, section_id, display_order)
SELECT
  p.id,
  s.section_uuid,
  ROW_NUMBER() OVER (PARTITION BY i.category_tag ORDER BY p.product_id)
FROM incoming_assets i
JOIN public.products p
  ON p.product_id = i.product_id
JOIN resolved_sections s
  ON s.category_tag = i.category_tag
WHERE s.section_uuid IS NOT NULL
ON CONFLICT (product_id, section_id)
DO UPDATE SET
  display_order = EXCLUDED.display_order;

COMMIT;

-- Optional validation queries:
-- 1) Check created/updated products from this payload:
-- SELECT product_id, title_en, current_price, image_url
-- FROM public.products
-- WHERE product_id IN (SELECT product_id FROM incoming_assets)
-- ORDER BY product_id;
--
-- 2) Verify cream variants:
-- SELECT p.product_id, p.title_en, v.label, v.price, v.enabled
-- FROM public.product_variants v
-- JOIN public.products p ON p.id = v.product_id
-- WHERE p.product_id IN ('BC149','BC150','BC151','BC154','BC156')
-- ORDER BY p.product_id, v.price;
--
-- 3) Verify section mapping:
-- SELECT s.section_id, COUNT(*) AS mapped_count
-- FROM public.product_sections ps
-- JOIN public.sections s ON s.id = ps.section_id
-- JOIN public.products p ON p.id = ps.product_id
-- WHERE p.product_id IN (SELECT product_id FROM incoming_assets)
-- GROUP BY s.section_id
-- ORDER BY s.section_id;
