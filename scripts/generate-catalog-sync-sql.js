const fs = require('fs');
const path = require('path');

const csvPath = 'c:/Users/yuvak/Downloads/all_cloudinary_images.csv';
const csvLines = fs.readFileSync(csvPath, 'utf8').split(/\r?\n/).filter(Boolean);
const csvMap = new Map();
for (const line of csvLines.slice(1)) {
  const m = line.match(/^([^,]+),"([^"]+)"$/);
  if (!m) continue;
  csvMap.set(m[1], m[2]);
}

const CATEGORIES = {
  oil_liquid: {
    desc: (t) => `${t} is a high-quality ingredient for skincare, haircare, and personal care formulations. It blends well in daily use products and DIY recipes.`,
    usage: 'Use directly or blend with other ingredients as required. For topical use, apply a small amount and adjust as needed.',
  },
  base: {
    desc: (t) => `${t} is a ready-to-use base designed for simple and consistent product making. Ideal for customized soaps and cleansers.`,
    usage: 'Measure required quantity, add fragrance/color/actives as needed, mix thoroughly, and use in final formulation.',
  },
  surfactant_additive: {
    desc: (t) => `${t} is a reliable formulation ingredient used to improve cleansing, texture, moisture balance, or stability in personal care products.`,
    usage: 'Use in formulation phase as required. Start with small percentages and adjust based on product performance.',
  },
  butter_wax_binder: {
    desc: (t) => `${t} is commonly used to improve richness, structure, and skin feel in creams, balms, and solid formulations.`,
    usage: 'Melt or disperse as required in formulation. Blend uniformly for smooth texture and stable finish.',
  },
  clay_starch_flour: {
    desc: (t) => `${t} is used in powders, packs, and cleansing blends to improve texture, absorb excess oil, and support a smooth finish.`,
    usage: 'Mix with water, rose water, aloe gel, or other base ingredients to prepare face packs, masks, or powder blends.',
  },
  herbal_skin_soap: {
    desc: (t) => `${t} is a versatile herbal ingredient for skin packs, soaps, and natural care formulations. Helps improve overall formulation quality.`,
    usage: 'Mix with suitable liquid to make a paste or add to soap/pack formulations. Use regularly for best results.',
  },
  herbal_hair: {
    desc: (t) => `${t} is a traditional herbal ingredient used in hair masks, herbal cleansers, and scalp care formulations.`,
    usage: 'Blend with water, curd, aloe gel, or oils to prepare hair packs and herbal treatments. Apply and rinse after use.',
  },
  essential_oil: {
    desc: (t) => `${t} is a concentrated aromatic essential oil used in soaps, skincare blends, and fragrance formulations.`,
    usage: 'Use 1-2 drops in blends, soaps, creams, or diffusers. Always dilute before direct skin application.',
  },
};

const items = [
  { product_id: 'BC001', title: 'Marula Oil', unit_value: 10, unit_type: 'ml', category: 'oil_liquid', image: 'marulaoel-kaltgepresst-heess-247x296_btdods' },
  { product_id: 'BC002', title: 'Olive Oil', unit_value: 50, unit_type: 'ml', category: 'oil_liquid', image: 'oliveoil_1200x1200_tkz0x9' },
  { product_id: 'BC006', title: 'Sweet Almond Oil', unit_value: 100, unit_type: 'ml', category: 'oil_liquid', image: 'Sweet_Almond_Oill-500x500-1-247x296_phqgmu' },
  { product_id: 'BC005', title: 'Jojoba Oil', unit_value: 50, unit_type: 'ml', category: 'oil_liquid', image: 'Jojoba_Oil_j6vhih' },
  { product_id: 'BC089', title: 'Avocado Oil', unit_value: 50, unit_type: 'ml', category: 'oil_liquid', image: 'Avocado_Oil_wdnceb', insert_mrp: 188, insert_price: 150 },
  { product_id: 'BC032', title: 'Coconut Oil', unit_value: 50, unit_type: 'ml', category: 'oil_liquid', image: 'Coconut_Oil_lnj84f' },
  { product_id: 'BC033', title: 'Castor Oil', unit_value: 50, unit_type: 'ml', category: 'oil_liquid', image: 'Castor_Oil_saoxa7' },
  { product_id: 'BC034', title: 'Black Sesame Oil', unit_value: 50, unit_type: 'ml', category: 'oil_liquid', image: 'Black_Sesame_Oil_tpiuis' },
  { product_id: 'BC012', title: 'Grapeseed Oil', unit_value: 50, unit_type: 'ml', category: 'oil_liquid', image: 'Grapeseed_Oil_uzou5w' },
  { product_id: 'BC023', title: 'Calendula Oil', unit_value: 20, unit_type: 'ml', category: 'oil_liquid', image: 'Calendula-Oil-247x296_jmejmk' },
  { product_id: 'BC030', title: 'Steam Distilled Rose Water', unit_value: 100, unit_type: 'ml', category: 'oil_liquid', image: 'Steam_Distilled_rose_water_uxipwo' },
  { product_id: 'BC024', title: 'Witch Hazel', unit_value: 20, unit_type: 'ml', category: 'oil_liquid', image: 'witchhazel-247x296_w8y0p4' },
  { product_id: 'BC036', title: 'De-Mineralized Water', unit_value: 1, unit_type: 'l', category: 'oil_liquid', image: 'De-Mineralized_Water_narng3' },
  { product_id: 'BC090', title: 'Red Wine', unit_value: 100, unit_type: 'ml', category: 'oil_liquid', image: 'Red_Wine_jvsgoj', insert_mrp: 125, insert_price: 100 },

  { product_id: 'BC025', title: 'Soap Base (Melt & Pour)', unit_value: 1, unit_type: 'kg', category: 'base', image: 'Soap_Base_Melt_Pour_tz3ggv' },
  { product_id: 'BC035', title: 'Pearly Shampoo Base', unit_value: 1, unit_type: 'kg', category: 'base', image: 'Pearly_Shampoo_Base_svhqxv' },

  { product_id: 'BC013', title: 'Coco Glucoside', unit_value: 100, unit_type: 'gm', category: 'surfactant_additive', image: 'Coco_Glucoside_x5jwv5' },
  { product_id: 'BC021', title: 'Coco Betaine', unit_value: 100, unit_type: 'ml', category: 'surfactant_additive', image: 'Coco_Betaine_k1kxwv' },
  { product_id: 'BC029', title: 'Decyl Glucoside', unit_value: 100, unit_type: 'gm', category: 'surfactant_additive', image: 'Decyl_Glucoside_waaq8n' },
  { product_id: 'BC003', title: 'Iscaguard PEG', unit_value: 50, unit_type: 'ml', category: 'surfactant_additive', image: 'Iscaguard_PEG_n5x94y' },
  { product_id: 'BC031', title: 'Vegetable Glycerin', unit_value: 100, unit_type: 'ml', category: 'surfactant_additive', image: 'Vegetable_Glycerin_vhzkyd' },
  { product_id: 'BC017', title: 'Aloe Vera Gel', unit_value: 100, unit_type: 'gm', category: 'surfactant_additive', image: 'Aloe_Vera_Gel_uikihn' },
  { product_id: 'BC091', title: 'Aloe Vera Powder', unit_value: 50, unit_type: 'gm', category: 'surfactant_additive', image: 'Aloe_Vera_Powder_c4aazs', insert_mrp: 75, insert_price: 60 },
  { product_id: 'BC052', title: 'Vitamin E Capsules', unit_value: 10, unit_type: 'pcs', category: 'surfactant_additive', image: 'Vitamin_E_Capsules_g7lo3w' },
  { product_id: 'BC051', title: 'Honey', unit_value: 100, unit_type: 'gm', category: 'surfactant_additive', image: 'Honey_wyatjj' },

  { product_id: 'BC007', title: 'Cocoa Butter', unit_value: 50, unit_type: 'gm', category: 'butter_wax_binder', image: 'Cocoa_Butter_j7zgzo' },
  { product_id: 'BC008', title: 'Avocado Butter', unit_value: 50, unit_type: 'gm', category: 'butter_wax_binder', image: 'Avocado_Butter_mtl8nj' },
  { product_id: 'BC022', title: 'Beeswax', unit_value: 50, unit_type: 'gm', category: 'butter_wax_binder', image: 'Beeswax_me4tva' },
  { product_id: 'BC010', title: 'Emulsifying Wax (E-Wax)', unit_value: 50, unit_type: 'gm', category: 'butter_wax_binder', image: 'Emulsifying_Wax_E-Wax_zadp1u' },
  { product_id: 'BC077', title: 'Gond Katira', unit_value: 50, unit_type: 'gm', category: 'butter_wax_binder', image: 'Gond_Katira_grhwtr' },

  { product_id: 'BC020', title: 'Corn Starch', unit_value: 50, unit_type: 'gm', category: 'clay_starch_flour', image: 'Corn_Starch_oyyrzt' },
  { product_id: 'BC026', title: 'Arrowroot Powder', unit_value: 50, unit_type: 'gm', category: 'clay_starch_flour', image: 'Arrowroot_Powder_vt394q' },
  { product_id: 'BC027', title: 'Potato Starch', unit_value: 50, unit_type: 'gm', category: 'clay_starch_flour', image: 'Potato_Starch_hl6zmv' },
  { product_id: 'BC028', title: 'Rice Starch', unit_value: 50, unit_type: 'gm', category: 'clay_starch_flour', image: 'Rice_Starch_c05vov' },
  { product_id: 'BC092', title: 'Rice Flour', unit_value: 50, unit_type: 'gm', category: 'clay_starch_flour', image: 'Rice_Flour_wgqczq', insert_mrp: 59, insert_price: 40 },
  { product_id: 'BC047', title: 'Multani Mitti', unit_value: 50, unit_type: 'gm', category: 'clay_starch_flour', image: 'Multani_Mitti_xlkqhu' },
  { product_id: 'BC048', title: 'Kaolin Clay', unit_value: 50, unit_type: 'gm', category: 'clay_starch_flour', image: 'Kaolin_Clay_ldjyo0' },
  { product_id: 'BC049', title: 'Rose Clay', unit_value: 50, unit_type: 'gm', category: 'clay_starch_flour', image: 'Rose_Clay_w1u91p' },

  { product_id: 'BC050', title: 'Coffee Powder', unit_value: 50, unit_type: 'gm', category: 'herbal_skin_soap', image: 'Coffee_Powder_xkott9' },
  { product_id: 'BC054', title: 'Cinnamon Powder', unit_value: 50, unit_type: 'gm', category: 'herbal_skin_soap', image: 'Cinnamon_Powder_gpzvdf' },
  { product_id: 'HP001', title: 'Banana Powder', unit_value: 50, unit_type: 'gm', category: 'herbal_skin_soap', image: 'Banana_Powder_gy53jh' },
  { product_id: 'BC055', title: 'Manjistha Powder', unit_value: 50, unit_type: 'gm', category: 'herbal_skin_soap', image: 'Manjistha_Powder_ae1an3' },
  { product_id: 'BC056', title: 'Licorice Powder', unit_value: 50, unit_type: 'gm', category: 'herbal_skin_soap', image: 'Licorice_Powder_wfayvn' },
  { product_id: 'BC057', title: 'Sandalwood Powder', unit_value: 50, unit_type: 'gm', category: 'herbal_skin_soap', image: 'Sandalwood_Powder_i5zykt' },
  { product_id: 'BC073', title: 'Arjuna Powder', unit_value: 50, unit_type: 'gm', category: 'herbal_skin_soap', image: 'Arjuna_Powder_my7y4z' },
  { product_id: 'BC059', title: 'Kasthuri Pasupu', unit_value: 50, unit_type: 'gm', category: 'herbal_skin_soap', image: 'Kasthuri_Pasupu_ylo2cp' },
  { product_id: 'BC060', title: 'Tulasi Powder', unit_value: 50, unit_type: 'gm', category: 'herbal_skin_soap', image: 'Tulasi_Powder_wsc5ni' },
  { product_id: 'HP003', title: 'Neem Powder', unit_value: 50, unit_type: 'gm', category: 'herbal_skin_soap', image: 'Neem_Powder_v4tan0' },
  { product_id: 'BC045', title: 'Neem Leaves Powder', unit_value: 50, unit_type: 'gm', category: 'herbal_skin_soap', image: 'Neem_Leaves_Powder_v5kit9' },
  { product_id: 'BC074', title: 'Kuppintaaku Powder', unit_value: 50, unit_type: 'gm', category: 'herbal_skin_soap', image: 'Kuppintaaku_Powder_e0o0cx' },
  { product_id: 'BC075', title: 'Pomegranate Seeds Powder', unit_value: 50, unit_type: 'gm', category: 'herbal_skin_soap', image: 'Pomegranate_Seeds_Powder_w9yjc7' },
  { product_id: 'BC058', title: 'Red Sandal Powder', unit_value: 50, unit_type: 'gm', category: 'herbal_skin_soap', image: 'Red_Sandal_Powder_rwi78s' },
  { product_id: 'BC061', title: 'Beetroot Powder', unit_value: 50, unit_type: 'gm', category: 'herbal_skin_soap', image: 'Beetroot_Powder_txfoqc' },
  { product_id: 'BC093', title: 'Rose Petal Powder', unit_value: 50, unit_type: 'gm', category: 'herbal_skin_soap', image: 'Rose_Petal_Powder_izkjus', insert_mrp: 75, insert_price: 60 },
  { product_id: 'HP002', title: 'Orange Peel Powder', unit_value: 50, unit_type: 'gm', category: 'herbal_skin_soap', image: 'Orange_Peel_Powder_we45ce' },
  { product_id: 'BC063', title: 'Lemon Peel Powder', unit_value: 50, unit_type: 'gm', category: 'herbal_skin_soap', image: 'Lemon_Peel_Powder_mwnb6x' },
  { product_id: 'BC076', title: 'Red Toor Dal', unit_value: 50, unit_type: 'gm', category: 'herbal_skin_soap', image: 'Red_Toor_Dal_wq44kw' },
  { product_id: 'BC083', title: 'Sambar Onions', unit_value: 100, unit_type: 'gm', category: 'herbal_skin_soap', image: 'Sambar_Onions_lcvvl1' },

  { product_id: 'BC039', title: 'Hibiscus Flower Powder', unit_value: 50, unit_type: 'gm', category: 'herbal_hair', image: 'Hibiscus_Flower_Powder_ztwvuq' },
  { product_id: 'BC094', title: 'Hibiscus Leaves Powder', unit_value: 50, unit_type: 'gm', category: 'herbal_hair', image: 'Hibiscus_Leaves_Powder_hxbnfl', insert_mrp: 75, insert_price: 60 },
  { product_id: 'BC037', title: 'Henna Powder', unit_value: 50, unit_type: 'gm', category: 'herbal_hair', image: 'Henna_Powder_ld7hd8' },
  { product_id: 'BC095', title: 'Curry Leaves Powder', unit_value: 50, unit_type: 'gm', category: 'herbal_hair', image: 'Curry_Leaves_Powder_vixrqz', insert_mrp: 75, insert_price: 60 },
  { product_id: 'BC096', title: 'Avarampoo Powder', unit_value: 50, unit_type: 'gm', category: 'herbal_hair', image: 'Avarampoo_Powder_jraflc', insert_mrp: 75, insert_price: 60 },
  { product_id: 'BC038', title: 'Amla Powder', unit_value: 50, unit_type: 'gm', category: 'herbal_hair', image: 'Amla_Powder_vmrnvw' },
  { product_id: 'BC097', title: 'Kalonji Seeds', unit_value: 50, unit_type: 'gm', category: 'herbal_hair', image: 'Kalonji_Seeds_ptbhoh', insert_mrp: 75, insert_price: 60 },
  { product_id: 'BC019', title: 'Bhringraj Powder', unit_value: 50, unit_type: 'gm', category: 'herbal_hair', image: 'Bhringraj_Powder_qtr6sw' },
  { product_id: 'BC078', title: 'Rosemary Leaves', unit_value: 50, unit_type: 'gm', category: 'herbal_hair', image: 'Rosemary_Leaves_ytsay3' },
  { product_id: 'BC079', title: 'Vetiver (Vattiveru) Powder', unit_value: 50, unit_type: 'gm', category: 'herbal_hair', image: 'Vetiver_Vattiveru_Powder_ua3ky0' },
  { product_id: 'BC080', title: 'Jatamansi Powder', unit_value: 50, unit_type: 'gm', category: 'herbal_hair', image: 'Jatamansi_Powder_e71rv7' },
  { product_id: 'BC042', title: 'Brahmi Powder', unit_value: 50, unit_type: 'gm', category: 'herbal_hair', image: 'Brahmi_Powder_twhuf0' },
  { product_id: 'BC043', title: 'Fenugreek Powder', unit_value: 50, unit_type: 'gm', category: 'herbal_hair', image: 'Fenugreek_Powder_mhuru0' },
  { product_id: 'BC081', title: 'Gaddi Chamanthi Powder', unit_value: 50, unit_type: 'gm', category: 'herbal_hair', image: 'Gaddi_Chamanthi_Powder_xuwxft' },
  { product_id: 'BC082', title: 'Tangedu Aakula Powder', unit_value: 50, unit_type: 'gm', category: 'herbal_hair', image: 'Tangedu_Aakula_Powder_ahkwoo' },
  { product_id: 'BC046', title: 'Custard Apple Seeds Powder', unit_value: 50, unit_type: 'gm', category: 'herbal_hair', image: 'Custard_Apple_Seeds_Powder_s66fsk' },
  { product_id: 'BC041', title: 'Reetha (Soapnut) Powder', unit_value: 50, unit_type: 'gm', category: 'herbal_hair', image: 'Reetha_Soapnut_Powder_wbijkc' },
  { product_id: 'BC040', title: 'Shikakai Powder', unit_value: 50, unit_type: 'gm', category: 'herbal_hair', image: 'Shikakai_Powder_oednji' },
  { product_id: 'BC084', title: 'Flax Seeds Powder', unit_value: 50, unit_type: 'gm', category: 'herbal_hair', image: 'Flax_Seeds_Powder_sqrx4i' },
  { product_id: 'BC085', title: 'Maredu Gujju Powder', unit_value: 50, unit_type: 'gm', category: 'herbal_hair', image: 'Maredu_Gujju_Powder_zqnwdr' },
  { product_id: 'BC044', title: 'Triphala Powder', unit_value: 50, unit_type: 'gm', category: 'herbal_hair', image: 'Triphala_Powder_hn9hlh' },

  { product_id: 'BC064', title: 'Lavender Essential Oil', unit_value: 15, unit_type: 'ml', category: 'essential_oil', image: 'Lavender_Essential_Oil_o2wsgy' },
  { product_id: 'EO001', title: 'Rose Essential Oil', unit_value: 15, unit_type: 'ml', category: 'essential_oil', image: 'Rose_Essential_Oil_wfvqhp' },
  { product_id: 'EO002', title: 'Jasmine Essential Oil', unit_value: 15, unit_type: 'ml', category: 'essential_oil', image: 'Jasmine_Essential_Oil_hnlntp' },
  { product_id: 'EO004', title: 'Ylang Ylang Essential Oil', unit_value: 15, unit_type: 'ml', category: 'essential_oil', image: 'Ylang_Ylang_Essential_Oil_o68e8t' },
  { product_id: 'EO003', title: 'Tea Tree Essential Oil', unit_value: 15, unit_type: 'ml', category: 'essential_oil', image: 'Tea_Tree_Essential_Oil_nalemt' },
  { product_id: 'EO005', title: 'Cedarwood Essential Oil', unit_value: 15, unit_type: 'ml', category: 'essential_oil', image: 'Cedarwood_Essential_Oil_fjcokp' },
  { product_id: 'BC070', title: 'Wintergreen Essential Oil', unit_value: 15, unit_type: 'ml', category: 'essential_oil', image: 'Wintergreen_Essential_Oil_gts5ic' },
  { product_id: 'BC071', title: 'Lemon Essential Oil', unit_value: 15, unit_type: 'ml', category: 'essential_oil', image: 'Lemon_Essential_Oil_sgcebz' },
  { product_id: 'BC072', title: 'Peppermint Essential Oil', unit_value: 15, unit_type: 'ml', category: 'essential_oil', image: 'Peppermint_Essential_Oil_wh1fby' },
];

function sqlString(s) {
  if (s === null || s === undefined) return 'NULL';
  return `'${String(s).replace(/'/g, "''")}'`;
}

function buildSpecs(item) {
  const unit = `${item.unit_value} ${item.unit_type}`;
  if (item.category === 'essential_oil') return `${unit} | Concentrated aromatic oil`;
  if (item.category === 'oil_liquid') return `${unit} | Premium cosmetic ingredient`;
  if (item.category === 'base') return `${unit} | Ready-to-use base`;
  if (item.category === 'surfactant_additive') return `${unit} | Formulation ingredient`;
  if (item.category === 'butter_wax_binder') return `${unit} | Rich texture and structure aid`;
  if (item.category === 'clay_starch_flour') return `${unit} | Fine-grade powder`;
  return `${unit} | Herbal powder`;
}

const missingImages = items.filter((i) => !csvMap.get(i.image));
if (missingImages.length) {
  console.error('Missing image IDs in CSV:', missingImages.map((x) => `${x.product_id}:${x.image}`).join(', '));
  process.exit(1);
}

const deactivatedIds = ['810', '811', 'BC004', 'BC009', 'BC011', 'BC014', 'BC015', 'BC016', 'BC018'];

const rowsSql = items.map((item) => {
  const category = CATEGORIES[item.category];
  const description = category.desc(item.title);
  const usage = category.usage;
  const specs = buildSpecs(item);
  const imageUrl = csvMap.get(item.image);
  const insertMrp = item.insert_mrp ?? (item.category === 'essential_oil' ? 269 : (item.category === 'oil_liquid' ? 188 : 75));
  const insertPrice = item.insert_price ?? (item.category === 'essential_oil' ? 200 : (item.category === 'oil_liquid' ? 150 : 60));
  return `  (${sqlString(item.product_id)}, ${sqlString(item.title)}, ${sqlString(imageUrl)}, ${sqlString(description)}, ${sqlString(specs)}, ${sqlString(usage)}, ${item.unit_value}, ${sqlString(item.unit_type)}, ${insertMrp}, ${insertPrice}, 70, 100, ${sqlString(item.category)})`;
});

const sql = `-- Auto-generated catalog sync (titles + images + SEO text)
-- Source image CSV: c:/Users/yuvak/Downloads/all_cloudinary_images.csv
-- Generated at: ${new Date().toISOString()}

BEGIN;

CREATE TEMP TABLE desired_catalog (
  product_id TEXT PRIMARY KEY,
  title_en TEXT NOT NULL,
  image_url TEXT NOT NULL,
  description_en TEXT NOT NULL,
  specifications_en TEXT NOT NULL,
  usage_en TEXT NOT NULL,
  unit_value NUMERIC,
  unit_type TEXT,
  insert_mrp NUMERIC NOT NULL,
  insert_price NUMERIC NOT NULL,
  shipping_charges NUMERIC NOT NULL,
  stock_quantity INTEGER NOT NULL,
  category_key TEXT NOT NULL
);

INSERT INTO desired_catalog (
  product_id, title_en, image_url, description_en, specifications_en, usage_en,
  unit_value, unit_type, insert_mrp, insert_price, shipping_charges, stock_quantity, category_key
)
VALUES
${rowsSql.join(',\n')}
;

-- 1) Update existing products to exact target title/image/content
UPDATE public.products p
SET
  title_en = d.title_en,
  image_url = d.image_url,
  description_en = d.description_en,
  specifications_en = d.specifications_en,
  usage_en = d.usage_en,
  unit_value = d.unit_value,
  unit_type = d.unit_type,
  shipping_charges = COALESCE(p.shipping_charges, d.shipping_charges),
  is_active = TRUE,
  updated_at = NOW()
FROM desired_catalog d
WHERE p.product_id = d.product_id;

-- 2) Insert missing products from target catalog
INSERT INTO public.products (
  product_id, title_en, description_en, specifications_en, usage_en,
  image_url, mrp, current_price, shipping_charges, stock_quantity,
  is_active, is_best_seller, is_new, unit_value, unit_type
)
SELECT
  d.product_id, d.title_en, d.description_en, d.specifications_en, d.usage_en,
  d.image_url, d.insert_mrp, d.insert_price, d.shipping_charges, d.stock_quantity,
  TRUE, FALSE, TRUE, d.unit_value, d.unit_type
FROM desired_catalog d
LEFT JOIN public.products p ON p.product_id = d.product_id
WHERE p.id IS NULL;

-- 3) Deactivate non-catalog / duplicate products to prevent UI mismatch
UPDATE public.products
SET is_active = FALSE, updated_at = NOW()
WHERE product_id IN (${deactivatedIds.map(sqlString).join(', ')});

-- 4) Safety check: no duplicate active titles in this catalog
-- SELECT title_en, COUNT(*) FROM public.products WHERE is_active = TRUE GROUP BY title_en HAVING COUNT(*) > 1;

COMMIT;
`;

const out = path.resolve(process.cwd(), 'supabase', 'PRODUCT_CATALOG_SYNC.sql');
fs.writeFileSync(out, sql);
console.log('Wrote', out);
console.log('Catalog rows:', items.length);
console.log('Will deactivate:', deactivatedIds.length);
