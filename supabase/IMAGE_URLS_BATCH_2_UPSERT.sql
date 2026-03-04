-- Batch-2 image URL sync from user-provided Cloudinary list
-- Creates missing products, updates existing ones, applies offered/original prices,
-- and maps to practical sections.
-- Safe to run multiple times.

BEGIN;

-- 1) Ensure helper sections exist
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
    'kits-containers',
    'Kits & Containers',
    'కిట్స్ & కంటైనర్స్',
    'DIY kits, packs, and storage accessories',
    'DIY కిట్స్, ప్యాక్స్, స్టోరేజ్ యాక్సెసరీస్',
    'Training kits, soap-making kits, and packaging/storage containers used in product preparation workflows.',
    'ట్రైనింగ్ కిట్స్, సోప్-మేకింగ్ కిట్స్ మరియు ప్రొడక్ట్ తయారీకి అవసరమైన స్టోరేజ్ కంటైనర్స్.',
    16,
    TRUE
  ),
  (
    'home-care-cleaners',
    'Home Care & Cleaners',
    'హోమ్ కేర్ & క్లీనర్స్',
    'Dish, laundry, and utility cleaning products',
    'డిష్, లాండ్రీ, యుటిలిటీ క్లీనింగ్ ఉత్పత్తులు',
    'Household cleaning products including dish wash, laundry liquids, and utility cleaning solutions.',
    'డిష్ వాష్, లాండ్రీ లిక్విడ్ మరియు హౌస్‌హోల్డ్ క్లీనింగ్ సొల్యూషన్స్.',
    17,
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

-- 2) Incoming mapping (URL -> product)
CREATE TEMP TABLE incoming_assets (
  product_id TEXT PRIMARY KEY,
  title_en TEXT NOT NULL,
  image_url TEXT NOT NULL,
  category_tag TEXT NOT NULL, -- soap | cream | powder | oil | cleanser | additive | kit | container | home-cleaner
  offered_price NUMERIC NOT NULL,
  original_price NUMERIC NOT NULL,
  shipping_charges NUMERIC NOT NULL DEFAULT 70,
  stock_quantity INTEGER NOT NULL DEFAULT 100
);

INSERT INTO incoming_assets (
  product_id, title_en, image_url, category_tag, offered_price, original_price, shipping_charges, stock_quantity
)
VALUES
  -- Existing products updated
  ('811','Kids Special Soap','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772639133/kids_spicial_soaps_gonb14.jpg','soap',100,150,70,100),
  ('BC058','Red Sandal Powder','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772639084/Redsandal_powder_vq8uoj.jpg','powder',150,200,70,100),
  ('BC054','Cinnamon Powder','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772639073/cinnamon_powder_kskqdi.jpg','powder',40,60,70,100),
  ('BC096','Avarampoo Powder','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772638865/Avarampoo_powder_ghc8hy.jpg','powder',40,80,70,100),
  ('BC023','Calendula Oil','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772639058/Calendula_oil_vovjtt.jpg','oil',150,200,70,100),
  ('BC048','Kaolin Clay','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772639055/Kaolin_clay_pwaezo.jpg','powder',40,60,70,100),
  ('BC029','Decyl Glucoside','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772639064/Decyl_glucoside_mcldus.jpg','cleanser',120,180,70,100),
  ('BC099','CAPB (Foaming Agent)','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772639058/Capb_foaming_agents_v3webe.jpg','cleanser',80,120,70,100),
  ('BC132','Bentonite Clay','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772556382/F_Bentonite_Clay_lxyxwr.jpg','powder',60,120,70,100),
  ('BC149','Red Wine Face Gel','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772638902/Redwine_face_gel_uvc36v.jpg','cream',180,200,70,100),
  ('BC148','Hand Wash Soap','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772639081/grape_shape_hand_wash_soap_jaakvs.jpg','soap',200,300,70,100),
  ('BC155','Kumkumadi Oil','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772554577/kunkumadhi_thilam_qgivc5.jpg','oil',250,300,70,100),

  -- New products
  ('BC169','Skin Allergy Soap Making Kit','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772639094/Skin_allergy_soap_making_kit_ri0bjj.png','kit',650,700,70,100),
  ('BC170','Kojic Acid Powder','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772639091/kolic_acid_powder_pky6qa.jpg','powder',200,250,70,100),
  ('BC171','Moisturizing Cream','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772639090/Moisturizing_creams_kdbblz.jpg','cream',180,200,70,100),
  ('BC172','Manjista Soap Making Kit','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772639089/Manjista_soap_making_material_sessjp.jpg','kit',500,700,70,100),
  ('BC173','Bridal Soap','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772639087/Bridal_soap_instent_skin_glowing_soaps_icldul.jpg','soap',120,150,70,100),
  ('BC174','Saffron Face Wash','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772639086/Saffron_face_wash_skywil.jpg','cleanser',150,200,70,100),
  ('BC175','Potato Powder','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772639085/Pototo_powder_b4h79j.jpg','powder',60,100,70,100),
  ('BC176','Herbal Hair Oil (30 Herbs)','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772639085/Herbal_hair_oil_30_Herbs_infused_fk0k5d.jpg','oil',2500,2800,70,100),
  ('BC177','Pithambari Liquid','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772639084/pithambra_liquid_n8qo5q.jpg','home-cleaner',200,250,70,100),
  ('BC178','Niacinamide Vitamin Powder','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772639084/Niacinamide_vitamin_powder_kljb8e.jpg','powder',200,250,70,100),
  ('BC179','Herbal Hair Oil','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772639083/herbal_hair_regrowth_oil_i1m43g.jpg','oil',400,600,70,100),
  ('BC180','Baby Tears Free Shampoo','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772639083/Baby_tears_free_shampoo_avmaip.jpg','cleanser',200,250,70,100),
  ('BC181','Chemical Free Pithambari Powder','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772639081/Chemicals_free_pithambra_powder_smaftt.png','powder',100,200,70,100),
  ('BC182','Dish Wash Liquid','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772639081/Dish_wash_liquid_dousge.jpg','home-cleaner',200,250,70,100),
  ('BC183','Vitamin C Powder','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772639077/Vitamin_c_powder_yyycyo.jpg','powder',130,150,70,100),
  ('BC184','Unwanted Hair Removal Wax','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772639077/Unwanted_hair_uuzlro.jpg','cream',200,250,70,100),
  ('BC185','Cream Storage Boxes','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772639076/Creams_storage_boxs_jhpjbx.jpg','container',30,40,70,100),
  ('BC186','Dark Neck Blackness Removal Cream','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772639075/Dark_neck_blackness_removel_cream_nwuvll.png','cream',180,200,70,100),
  ('BC187','D-Panthenol','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772639075/D._panthnol_pentxa.jpg','additive',150,200,70,100),
  ('BC188','Banana Soap','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772639075/Banana_soaps_jr6cqc.jpg','soap',100,150,70,100),
  ('BC189','Eyeliner Containers','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772639074/Eye_liner_continears_tjwdly.jpg','container',40,50,70,100),
  ('BC190','Neem Gel','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772639072/neem_gel_osi8ud.jpg','cream',180,200,70,100),
  ('BC191','Basic Soap Making Kit','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772639073/Basic_soap_making_kit_bg62ta.jpg','kit',3500,4500,70,100),
  ('BC192','Baby Talcum Powder','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772639070/Baby_talcum_powder_pr7ret.jpg','powder',150,200,70,100),
  ('BC193','Winter Special Foot Cream','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772639068/Winter_special_foot_cream_vybcrk.jpg','cream',150,200,70,100),
  ('BC194','Gold Facial Bombs','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772639064/Gold_facial_bombs_j4mwbr.jpg','cream',50,100,70,100),
  ('BC195','Body Butter','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772639063/Baby_to_adults_body_butter_qhc2py.jpg','cream',200,250,70,100),
  ('BC196','Acne Removal Soap','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772639062/Acne_removal_soap_sbmohy.jpg','soap',120,150,70,100),
  ('BC197','Natural Hair Dye','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772639062/Natural_hair_dye_instent_g6lor5.jpg','powder',120,200,70,100),
  ('BC198','CCTG','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772639053/CCTG_body_lotion_pritgd.jpg','additive',120,150,70,100),
  ('BC199','Manjista Cream','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772638921/Manjista_cream_ilmmpi.jpg','cream',150,200,70,100),
  ('BC200','Acne Prone Soap','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772638913/Acne_prone_soap_dteyqz.jpg','soap',120,150,70,100),
  ('BC201','De-Tan Soap','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772638913/D_-_tan_soap_fdpg7z.jpg','soap',80,100,70,100),
  ('BC202','Aloe Vera Soap','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772638913/Alovera_soaps_afv0iv.jpg','soap',120,150,70,100),
  ('BC203','Skin Allergy Soap','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772638896/skin_alllllergy_soaps_xfszsq.jpg','soap',120,200,70,100),
  ('BC204','Unwanted Hair Removal Cream','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772638891/Unwanted_hair_removal_cream_lsnnz5.jpg','cream',200,250,70,100),
  ('BC205','Wrinkles Removal Soap','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772638888/Wrinkles_removal_soap_nawfyw.jpg','soap',120,200,70,100),
  ('BC206','Skin Whitening Kojic Acid Cream','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772638887/Skin_whitening_Kojic_acid_cream_ne8ysd.jpg','cream',180,200,70,100),
  ('BC207','Homemade Natural Soap','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772638886/Home_made_natural_soap_base_my_making_rggwuq.jpg','soap',330,400,70,100),
  ('BC208','Transparent Aloe Vera Gel','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772638884/Transparent_alovera_gel_home_made_jwqpph.jpg','cream',100,160,70,100),
  ('BC209','Organic Lip Balm (Beetroot)','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772638880/Organic_lipbalm_beetroot_carrot_strawberry_c2xzei.jpg','cream',100,150,70,100),
  ('BC210','Tears Free Shampoo','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772638879/Tears_free_shampoo_xicj7j.jpg','cleanser',750,1000,70,100),
  ('BC211','Winter Special Moisturizer','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772638868/Winter_special_moisturizer_soap_lglskc.jpg','cream',130,150,70,100),
  ('BC212','Washing Machine Liquid','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772638865/Washing_machine_liquid_slxvzc.jpg','home-cleaner',200,300,70,100),
  ('BC213','Baby Care Class Material Kit','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772638829/Baby_care_class_materials_k8cfoi.jpg','kit',3000,4500,70,100),
  ('BC214','Face Serum','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772638824/skin_britainng_face_serium_ozlhdf.jpg','cream',180,200,70,100),
  ('BC215','Skin Whitening Glutathione Cream','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772638821/Skin_whitening_Glutathione_cream_zqc0pd.jpg','cream',180,200,70,100),
  ('BC216','Skin Brightening Niacinamide Cream','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772638817/Skin_brightening_niacinamide_cream_wa4cf9.jpg','cream',180,250,70,100),
  ('BC217','Manjista Soap','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772638815/Manjista_soap_zttvdj.jpg','soap',150,200,70,100),
  ('BC218','Dish Wash Liquid (Plant Based)','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772638796/Dish_wash_liquid_plant_based_yl5mkm.jpg','home-cleaner',250,350,70,100),
  ('BC219','Sunni Pindi Soap','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772638785/Sunni_pindi_soaps_v2a8fv.jpg','soap',120,150,70,100),
  ('BC220','Mango Butter','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772638767/mango_butter_iiuojo.jpg','cream',100,120,70,100),
  ('BC221','Salicylic Acid Powder','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772638748/Salicylic_acid_powder_fxxptj.jpg','powder',150,200,70,100),
  ('BC222','Sandal Soap','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772638743/Sandal_soaps_wtn52p.jpg','soap',120,150,70,100),
  ('BC223','Eyebrow Regrowth Hair Oil','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772638738/Eyebrow_regrowth_hair_oil_ilib1k.jpg','oil',150,200,70,100),
  ('BC224','Lipstick Containers','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772638720/lipstic_continers_eyawcf.jpg','container',40,60,70,100),
  ('BC225','SPF 50 Cream','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772638694/SPF_50_cream_jd9h1a.jpg','cream',180,200,70,100),
  ('BC226','Green Tea Gel','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772638682/green_tea_gel_hfqkkl.jpg','cream',180,200,70,100),
  ('BC227','Homemade Organic Lip Balm','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772638869/glossy_lipsticks_a4zohp.jpg','cream',150,250,70,100),
  ('BC228','SPF 45 / 50 / 70 Cream','https://res.cloudinary.com/dur6fkyoz/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1772638719/SPF_50_sun_protection_fces82.jpg','cream',200,250,70,100);

-- 3) Upsert products
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
  CASE
    WHEN i.title_en = 'Kojic Acid Powder'
      THEN 'Kojic Acid Powder is a premium active ingredient used in professional skin-brightening formulations. Commonly used in anti-pigmentation blends for uneven tone support.'
    WHEN i.title_en = 'Salicylic Acid Powder'
      THEN 'Salicylic Acid Powder is a targeted active used in acne-care formulations. Helps support pore-cleansing routines and clarifying leave-on or wash-off products.'
    WHEN i.title_en = 'Niacinamide Vitamin Powder'
      THEN 'Niacinamide Vitamin Powder is a high-value active ingredient for brightening, barrier support, and tone-evening cosmetic formulations.'
    WHEN i.title_en = 'Vitamin C Powder'
      THEN 'Vitamin C Powder is a premium antioxidant active used in glow-focused and dullness-care formulations for fresh-looking skin.'
    WHEN i.title_en = 'Kumkumadi Oil'
      THEN 'Kumkumadi Oil is a premium facial oil blend designed for glow support, tone-refining routines, and overnight nourishment care.'
    WHEN i.title_en IN ('SPF 50 Cream', 'SPF 45 / 50 / 70 Cream')
      THEN i.title_en || ' is a premium sun-care cream for daily broad-spectrum protection and daytime skin comfort.'
    WHEN i.category_tag = 'soap'
      THEN i.title_en || ' is a premium cleansing bar designed for daily hygiene, smooth skin feel, and consistent wash performance.'
    WHEN i.category_tag = 'cream'
      THEN i.title_en || ' is a premium topical formulation for hydration, repair support, and visible skin-finish improvement.'
    WHEN i.category_tag = 'powder'
      THEN i.title_en || ' is a premium grade powder suitable for masks, packs, and formulation blends in skin and hair care.'
    WHEN i.category_tag = 'oil'
      THEN i.title_en || ' is a premium oil for blend-based application in skin, scalp, or targeted care routines.'
    WHEN i.category_tag = 'cleanser'
      THEN i.title_en || ' is a premium cleansing product for controlled foam, effective cleaning, and routine-safe use.'
    WHEN i.category_tag = 'additive'
      THEN i.title_en || ' is a premium formulation additive used to improve structure, feel, and performance in finished cosmetics.'
    WHEN i.category_tag = 'home-cleaner'
      THEN i.title_en || ' is a premium home-care cleaner for reliable daily cleaning with efficient soil removal.'
    WHEN i.category_tag IN ('kit','container')
      THEN i.title_en || ' is a premium utility product designed for structured DIY production, storage, and workflow use.'
    ELSE
      i.title_en || ' is a premium product for daily practical use.'
  END,
  CASE
    WHEN i.title_en = 'Herbal Hair Oil (30 Herbs)'
      THEN 'Pack Size: 1 litre | Form: Herbal infused oil | Category: Hair care treatment | Use: Scalp and hair application'
    WHEN i.title_en = 'Tears Free Shampoo'
      THEN 'Pack Size: 500 g | Form: Mild shampoo | Suitable For: Baby and sensitive users | Use: Routine wash'
    WHEN i.title_en = 'Kumkumadi Oil'
      THEN 'Pack Size: 15 ml | Form: Facial oil | Category: Premium skin care | Suggested Use: Night routine'
    WHEN i.category_tag = 'soap'
      THEN 'Net Weight: 100 g | Form: Solid bar | Application: Body/face wash | Usage: Daily cleansing'
    WHEN i.category_tag = 'cream'
      THEN 'Pack Size: 50 g | Form: Cream/Gel | Category: Topical care | Usage: Daily or targeted routine'
    WHEN i.category_tag = 'powder'
      THEN 'Net Weight: 100 g | Form: Fine powder | Grade: Cosmetic use | Usage: Masks, packs, and blends'
    WHEN i.category_tag = 'oil'
      THEN 'Pack Size: 100 ml | Form: Liquid oil | Category: Carrier/Treatment oil | Usage: Topical blend support'
    WHEN i.category_tag = 'cleanser'
      THEN 'Pack Size: 100 ml | Form: Liquid cleanser | Category: Wash care | Usage: Routine cleansing'
    WHEN i.category_tag = 'additive'
      THEN 'Pack Size: 100 g | Form: Functional additive | Category: Cosmetic ingredient | Usage: Formulation support'
    WHEN i.category_tag = 'home-cleaner'
      THEN 'Pack Size: 500 ml | Form: Liquid cleaner | Category: Home care | Usage: Dish/laundry/surface cleaning'
    WHEN i.category_tag = 'container'
      THEN 'Pack Size: 1 piece | Category: Packaging accessory | Usage: Storage and filling support'
    WHEN i.category_tag = 'kit'
      THEN 'Pack Size: 1 kit | Category: DIY/Training material | Usage: Guided production workflows'
    ELSE
      'Standard pack'
  END,
  CASE
    WHEN i.category_tag = 'soap'
      THEN 'Step 1: Wet skin. Step 2: Work into rich lather. Step 3: Massage gently for 20-30 seconds. Step 4: Rinse thoroughly. Use once or twice daily.'
    WHEN i.category_tag = 'cream'
      THEN 'Apply a small quantity on clean, dry skin and massage until absorbed. Use twice daily or as part of your treatment routine. Patch test before first use.'
    WHEN i.category_tag = 'powder'
      THEN 'Mix required quantity with water, hydrosol, gel, or suitable base to form a smooth paste. Apply evenly, leave for 10-15 minutes, then rinse.'
    WHEN i.category_tag = 'oil'
      THEN 'Apply required drops on target area and massage gently for 2-3 minutes. Use regularly based on routine and product type.'
    WHEN i.category_tag = 'cleanser'
      THEN 'Use on wet skin or hair, lather gently, and rinse completely with clean water. Repeat if needed for deep cleanse.'
    WHEN i.category_tag = 'additive'
      THEN 'Use only in recommended formulation percentage. Pre-dissolve or add in correct phase as per product design and stability requirement.'
    WHEN i.category_tag = 'home-cleaner'
      THEN 'Dilute as needed or apply directly on target surface. Scrub lightly and rinse/wipe clean. Keep away from eyes and children.'
    WHEN i.category_tag = 'container'
      THEN 'Clean and dry container before filling. Use with hygienic handling and close cap tightly after every use.'
    WHEN i.category_tag = 'kit'
      THEN 'Follow included process sequence step by step. Measure accurately, maintain hygiene, and store outputs in clean containers.'
    ELSE
      'Use as directed in product workflow or daily routine.'
  END,
  i.image_url,
  i.original_price,
  i.offered_price,
  i.shipping_charges,
  i.stock_quantity,
  TRUE
FROM incoming_assets i
ON CONFLICT (product_id)
DO UPDATE SET
  title_en = EXCLUDED.title_en,
  title_te = EXCLUDED.title_te,
  description_en = EXCLUDED.description_en,
  specifications_en = EXCLUDED.specifications_en,
  usage_en = EXCLUDED.usage_en,
  image_url = EXCLUDED.image_url,
  mrp = EXCLUDED.mrp,
  current_price = EXCLUDED.current_price,
  shipping_charges = EXCLUDED.shipping_charges,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = TRUE,
  updated_at = NOW();

-- 4) Map to sections
WITH section_resolver AS (
  SELECT 'soap'::TEXT AS category_tag,
    COALESCE(
      (SELECT id FROM public.sections WHERE section_id='soaps-body-bars' LIMIT 1),
      (SELECT id FROM public.sections WHERE section_id='soaps' LIMIT 1)
    ) AS section_id
  UNION ALL
  SELECT 'cream',
    COALESCE(
      (SELECT id FROM public.sections WHERE section_id='creams-lotions' LIMIT 1),
      (SELECT id FROM public.sections WHERE section_id='humectants-actives' LIMIT 1)
    )
  UNION ALL
  SELECT 'powder',
    COALESCE(
      (SELECT id FROM public.sections WHERE section_id='powders' LIMIT 1),
      (SELECT id FROM public.sections WHERE section_id='herbal-powders' LIMIT 1),
      (SELECT id FROM public.sections WHERE section_id='herbal-powders-skin' LIMIT 1)
    )
  UNION ALL
  SELECT 'oil',
    COALESCE(
      (SELECT id FROM public.sections WHERE section_id='carrier-oils' LIMIT 1),
      (SELECT id FROM public.sections WHERE section_id='oils-liquids' LIMIT 1)
    )
  UNION ALL
  SELECT 'cleanser',
    COALESCE(
      (SELECT id FROM public.sections WHERE section_id='surfactants-cleansers' LIMIT 1),
      (SELECT id FROM public.sections WHERE section_id='liquids-bases' LIMIT 1)
    )
  UNION ALL
  SELECT 'additive',
    COALESCE(
      (SELECT id FROM public.sections WHERE section_id='surfactants-cleansers' LIMIT 1),
      (SELECT id FROM public.sections WHERE section_id='surfactants-additives' LIMIT 1)
    )
  UNION ALL
  SELECT 'kit',
    COALESCE(
      (SELECT id FROM public.sections WHERE section_id='kits-containers' LIMIT 1),
      (SELECT id FROM public.sections WHERE section_id='miscellaneous' LIMIT 1)
    )
  UNION ALL
  SELECT 'container',
    COALESCE(
      (SELECT id FROM public.sections WHERE section_id='kits-containers' LIMIT 1),
      (SELECT id FROM public.sections WHERE section_id='miscellaneous' LIMIT 1)
    )
  UNION ALL
  SELECT 'home-cleaner',
    COALESCE(
      (SELECT id FROM public.sections WHERE section_id='home-care-cleaners' LIMIT 1),
      (SELECT id FROM public.sections WHERE section_id='miscellaneous' LIMIT 1)
    )
)
INSERT INTO public.product_sections (product_id, section_id, display_order)
SELECT
  p.id,
  s.section_id,
  ROW_NUMBER() OVER (PARTITION BY i.category_tag ORDER BY p.product_id)
FROM incoming_assets i
JOIN public.products p
  ON p.product_id = i.product_id
JOIN section_resolver s
  ON s.category_tag = i.category_tag
WHERE s.section_id IS NOT NULL
ON CONFLICT (product_id, section_id)
DO UPDATE SET
  display_order = EXCLUDED.display_order;

COMMIT;

-- Validation:
-- SELECT product_id, title_en, current_price, mrp, image_url
-- FROM public.products
-- WHERE product_id IN (SELECT product_id FROM incoming_assets)
-- ORDER BY product_id;
