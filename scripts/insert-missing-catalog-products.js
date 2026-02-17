const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

function loadEnv(file = '.env.local') {
  const env = {};
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const i = line.indexOf('=');
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    env[k] = v;
  }
  return env;
}

function loadCsvMap(csvPath) {
  const map = new Map();
  const lines = fs.readFileSync(csvPath, 'utf8').split(/\r?\n/).filter(Boolean).slice(1);
  for (const line of lines) {
    const m = line.match(/^([^,]+),"([^"]+)"$/);
    if (!m) continue;
    map.set(m[1], m[2]);
  }
  return map;
}

const missingItems = [
  { product_id: 'BC089', title_en: 'Avocado Oil', title_te: 'అవకాడో ఆయిల్', image_id: 'Avocado_Oil_wdnceb', unit_value: 50, unit_type: 'ml', mrp: 188, current_price: 150 },
  { product_id: 'BC090', title_en: 'Red Wine', title_te: 'రెడ్ వైన్', image_id: 'Red_Wine_jvsgoj', unit_value: 100, unit_type: 'ml', mrp: 125, current_price: 100 },
  { product_id: 'BC091', title_en: 'Aloe Vera Powder', title_te: 'అలోవెరా పౌడర్', image_id: 'Aloe_Vera_Powder_c4aazs', unit_value: 50, unit_type: 'gm', mrp: 75, current_price: 60 },
  { product_id: 'BC092', title_en: 'Rice Flour', title_te: 'బియ్యం పిండి', image_id: 'Rice_Flour_wgqczq', unit_value: 50, unit_type: 'gm', mrp: 59, current_price: 40 },
  { product_id: 'BC093', title_en: 'Rose Petal Powder', title_te: 'రోజ్ పెటల్ పౌడర్', image_id: 'Rose_Petal_Powder_izkjus', unit_value: 50, unit_type: 'gm', mrp: 75, current_price: 60 },
  { product_id: 'BC094', title_en: 'Hibiscus Leaves Powder', title_te: 'మందారం ఆకుల పౌడర్', image_id: 'Hibiscus_Leaves_Powder_hxbnfl', unit_value: 50, unit_type: 'gm', mrp: 75, current_price: 60 },
  { product_id: 'BC095', title_en: 'Curry Leaves Powder', title_te: 'కరివేపాకు పౌడర్', image_id: 'Curry_Leaves_Powder_vixrqz', unit_value: 50, unit_type: 'gm', mrp: 75, current_price: 60 },
  { product_id: 'BC096', title_en: 'Avarampoo Powder', title_te: 'అవరంపూ పౌడర్', image_id: 'Avarampoo_Powder_jraflc', unit_value: 50, unit_type: 'gm', mrp: 75, current_price: 60 },
  { product_id: 'BC097', title_en: 'Kalonji Seeds', title_te: 'కలోంజీ గింజలు', image_id: 'Kalonji_Seeds_ptbhoh', unit_value: 50, unit_type: 'gm', mrp: 75, current_price: 60 },
];

function specs(item) {
  return `${item.unit_value} ${item.unit_type} | Herbal / cosmetic ingredient`;
}

function desc(item) {
  return `${item.title_en} is a quality ingredient used in skincare, haircare, and personal care formulations.`;
}

function usage() {
  return 'Use as per formulation requirement. Mix in suitable base and adjust quantity based on desired result.';
}

(async () => {
  const env = loadEnv();
  const csvMap = loadCsvMap('c:/Users/yuvak/Downloads/all_cloudinary_images.csv');
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: existing, error: eErr } = await supabase
    .from('products')
    .select('product_id')
    .in('product_id', missingItems.map(i => i.product_id));
  if (eErr) throw eErr;

  const existingSet = new Set((existing || []).map(r => r.product_id));
  const toInsert = missingItems
    .filter(i => !existingSet.has(i.product_id))
    .map(i => ({
      product_id: i.product_id,
      title_en: i.title_en,
      title_te: i.title_te,
      description_en: desc(i),
      description_te: null,
      specifications_en: specs(i),
      specifications_te: null,
      usage_en: usage(),
      usage_te: null,
      image_url: csvMap.get(i.image_id) || null,
      additional_images: null,
      mrp: i.mrp,
      current_price: i.current_price,
      shipping_charges: 70,
      stock_quantity: 100,
      is_active: true,
      is_best_seller: false,
      is_new: true,
      unit_value: i.unit_value,
      unit_type: i.unit_type,
    }));

  if (toInsert.length) {
    const { error: iErr } = await supabase.from('products').insert(toInsert);
    if (iErr) throw iErr;
  }

  console.log(JSON.stringify({ inserted: toInsert.length, skipped_existing: missingItems.length - toInsert.length }, null, 2));
})();
