const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnv(file = '.env.local') {
  const env = {};
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const idx = line.indexOf('=');
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

function norm(s = '') {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

const SIZE_LABELS = ['50 g', '100 g', '250 g', '500 g'];

const CATALOG = [
  { title: 'Triphala Powder', prices: { '50 g': 60, '100 g': 120, '250 g': 250, '500 g': 350 }, section: 'herbal-powders-skin', aliases: [] },
  { title: 'Licorice Powder', prices: { '50 g': 60, '100 g': 120, '250 g': 200, '500 g': 350 }, section: 'herbal-powders-skin', aliases: [] },
  { title: 'Arjuna Powder', prices: { '50 g': 60, '100 g': 120, '250 g': 200, '500 g': 350 }, section: 'herbal-powders-skin', aliases: [] },
  { title: 'Manjistha Powder', prices: { '50 g': 60, '100 g': 120, '250 g': 200, '500 g': 350 }, section: 'herbal-powders-skin', aliases: [] },
  { title: 'Karakkaya Powder', prices: { '50 g': 60, '100 g': 120, '250 g': 200, '500 g': 350 }, section: 'herbal-powders-skin', aliases: [] },
  { title: 'Sandal Powder', prices: { '50 g': 75, '100 g': 150, '250 g': 300, '500 g': 550 }, section: 'herbal-powders-skin', aliases: ['Sandalwood Powder'] },
  { title: 'Red Sandal Powder', prices: { '50 g': 150, '100 g': 250, '250 g': 500, '500 g': 1000 }, section: 'herbal-powders-skin', aliases: ['Red Sandalwood Powder'] },
  { title: 'Hibiscus Powder', prices: { '50 g': 80, '100 g': 150, '250 g': 300, '500 g': 600 }, section: 'herbal-powders-hair', aliases: ['Hibiscus Flower Powder'] },
  { title: 'Walnut Shell Powder', prices: { '50 g': 40, '100 g': 80, '250 g': 150, '500 g': 250 }, section: 'herbal-powders-skin', aliases: [] },
  { title: 'Fenugreek Powder', prices: { '50 g': 40, '100 g': 80, '250 g': 180, '500 g': 250 }, section: 'herbal-powders-hair', aliases: [] },
  { title: 'Rose Petal Powder', prices: { '50 g': 80, '100 g': 160, '250 g': 350, '500 g': 450 }, section: 'herbal-powders-skin', aliases: [] },
  { title: 'Bhringraj Powder', prices: { '50 g': 60, '100 g': 120, '250 g': 300, '500 g': 450 }, section: 'herbal-powders-hair', aliases: [] },
  { title: 'Lemon Peel Powder', prices: { '50 g': 120, '100 g': 200, '250 g': 350, '500 g': 450 }, section: 'herbal-powders-skin', aliases: [] },
  { title: 'Orange Peel Powder', prices: { '50 g': 40, '100 g': 120, '250 g': 250, '500 g': 350 }, section: 'herbal-powders-skin', aliases: [] },
  { title: 'Reetha Powder', prices: { '50 g': 50, '100 g': 80, '250 g': 150, '500 g': 250 }, section: 'herbal-powders-hair', aliases: ['Reetha (Soapnut) Powder'] },
  { title: 'Ashwagandha Powder', prices: { '50 g': 60, '100 g': 120, '250 g': 200, '500 g': 450 }, section: 'herbal-powders-hair', aliases: ['Ashwagandha'] },
  { title: 'Aloe Vera Powder', prices: { '50 g': 50, '100 g': 100, '250 g': 200, '500 g': 450 }, section: 'herbal-powders-skin', aliases: [] },
  { title: 'Brahmi Powder', prices: { '50 g': 60, '100 g': 120, '250 g': 200, '500 g': 450 }, section: 'herbal-powders-hair', aliases: [] },
  { title: 'Neem Powder', prices: { '50 g': 40, '100 g': 80, '250 g': 150, '500 g': 250 }, section: 'herbal-powders-skin', aliases: [] },
  { title: 'Shikakai Powder', prices: { '50 g': 40, '100 g': 80, '250 g': 150, '500 g': 250 }, section: 'herbal-powders-hair', aliases: [] },
  { title: 'Indigo Powder', prices: { '50 g': 60, '100 g': 120, '250 g': 250, '500 g': 450 }, section: 'herbal-powders-hair', aliases: [] },
  { title: 'Tulasi Powder', prices: { '50 g': 40, '100 g': 80, '250 g': 150, '500 g': 250 }, section: 'herbal-powders-skin', aliases: [] },
  { title: 'Kasturi Pasupu', prices: { '50 g': 40, '100 g': 80, '250 g': 200, '500 g': 400 }, section: 'herbal-powders-skin', aliases: ['Kasthuri Pasupu', 'Kasthuri Turmeric'] },
  { title: 'Beetroot Powder', prices: { '50 g': 40, '100 g': 80, '250 g': 200, '500 g': 350 }, section: 'herbal-powders-skin', aliases: [] },
  { title: 'Tomato Powder', prices: { '50 g': 40, '100 g': 80, '250 g': 200, '500 g': 300 }, section: 'herbal-powders-skin', aliases: [] },
  { title: 'Ubtan Powder', prices: { '50 g': 75, '100 g': 150, '250 g': 200, '500 g': 350 }, section: 'herbal-powders-skin', aliases: [] },
  { title: 'Moringa Powder', prices: { '50 g': 50, '100 g': 100, '250 g': 200, '500 g': 400 }, section: 'herbal-powders-skin', aliases: [] },
  { title: 'Henna Powder', prices: { '50 g': 40, '100 g': 80, '250 g': 200, '500 g': 350 }, section: 'herbal-powders-hair', aliases: [] },
  { title: 'Jatamansi Powder', prices: { '50 g': 150, '100 g': 250, '250 g': 350, '500 g': 500 }, section: 'herbal-powders-hair', aliases: [] },
  { title: 'Arrowroot Powder', prices: { '50 g': 40, '100 g': 80, '250 g': 120, '500 g': 400 }, section: 'starches-flours', aliases: [] },
  { title: 'Papaya Powder', prices: { '50 g': 60, '100 g': 120, '250 g': 200, '500 g': 350 }, section: 'herbal-powders-skin', aliases: [] },
  { title: 'Banana Powder', prices: { '50 g': 100, '100 g': 180, '250 g': 300, '500 g': 650 }, section: 'herbal-powders-skin', aliases: [] },
  { title: 'Lotus Powder', prices: { '50 g': 75, '100 g': 150, '250 g': 200, '500 g': 400 }, section: 'herbal-powders-skin', aliases: [] },
  { title: 'Amla Powder', prices: { '50 g': 80, '100 g': 150, '250 g': 300, '500 g': 450 }, section: 'herbal-powders-hair', aliases: [] },
  { title: 'Charcoal Powder', prices: { '50 g': 60, '100 g': 120, '250 g': 300, '500 g': 350 }, section: 'herbal-powders-skin', aliases: [] },
  { title: 'Multani Mitti', prices: { '50 g': 40, '100 g': 80, '250 g': 120, '500 g': 200 }, section: 'clays-minerals', aliases: [] },
  { title: 'Kaolin Clay', prices: { '50 g': 40, '100 g': 80, '250 g': 120, '500 g': 200 }, section: 'clays-minerals', aliases: [] },
  { title: 'Rose Clay', prices: { '50 g': 60, '100 g': 120, '250 g': 200, '500 g': 300 }, section: 'clays-minerals', aliases: [] },
  { title: 'Bentonite Clay', prices: { '50 g': 60, '100 g': 120, '250 g': 200, '500 g': 300 }, section: 'clays-minerals', aliases: [] },
  { title: 'Dead Sea Mud', prices: { '50 g': 60, '100 g': 120, '250 g': 200, '500 g': 300 }, section: 'clays-minerals', aliases: [] },
  { title: 'Green Clay', prices: { '50 g': 60, '100 g': 120, '250 g': 200, '500 g': 300 }, section: 'clays-minerals', aliases: [] },
  { title: 'Kuppipakku Powder', prices: { '50 g': 60, '100 g': 120, '250 g': 250, '500 g': 450 }, section: 'herbal-powders-skin', aliases: [] },
  { title: 'Vattiveru Powder', prices: { '50 g': 60, '100 g': 120, '250 g': 250, '500 g': 450 }, section: 'herbal-powders-hair', aliases: ['Vetiver (Vattiveru) Powder', 'Vetiver Powder'] },
  { title: 'Cinnamon Powder', prices: { '50 g': 60, '100 g': 120, '250 g': 250, '500 g': 450 }, section: 'herbal-powders-skin', aliases: [] },
  { title: 'Avarampoo', prices: { '50 g': 60, '100 g': 120, '250 g': 250, '500 g': 450 }, section: 'herbal-powders-hair', aliases: ['Avarampoo Powder'] },
  { title: 'Rice Starch', prices: { '50 g': 60, '100 g': 120, '250 g': 250, '500 g': 450 }, section: 'starches-flours', aliases: [] },
  { title: 'Potato Starch', prices: { '50 g': 60, '100 g': 120, '250 g': 250, '500 g': 450 }, section: 'starches-flours', aliases: [] },
  { title: 'Corn Starch', prices: { '50 g': 60, '100 g': 120, '250 g': 250, '500 g': 450 }, section: 'starches-flours', aliases: [] },
  { title: 'Gaddi Chamanthi Powder', prices: { '50 g': 60, '100 g': 120, '250 g': 250, '500 g': 450 }, section: 'herbal-powders-hair', aliases: [] },
  { title: 'Rosemary Leaves', prices: { '50 g': 100, '100 g': 200, '250 g': 350, '500 g': 650 }, section: 'herbal-powders-hair', aliases: [] },
  { title: 'Ratanjot', prices: { '50 g': 60, '100 g': 120, '250 g': 250, '500 g': 450 }, section: 'herbal-powders-skin', aliases: ['Ratnajot'] },
  { title: 'Badam Charcoal', prices: { '50 g': 75, '100 g': 150, '250 g': 300, '500 g': 450 }, section: 'herbal-powders-skin', aliases: [] },
  { title: 'Hartal Works Powder', prices: { '50 g': 150, '100 g': 300, '250 g': 500, '500 g': 1000 }, section: 'herbal-powders-skin', aliases: ['Hartal Warki Powder'] },
  { title: 'Limestone', prices: { '50 g': 70, '100 g': 140, '250 g': 300, '500 g': 500 }, section: 'clays-minerals', aliases: [] },
  { title: 'Shankapushpi', prices: { '50 g': 70, '100 g': 140, '250 g': 300, '500 g': 500 }, section: 'herbal-powders-hair', aliases: [] },
];

const TARGET_SECTIONS = ['herbal-powders-skin', 'herbal-powders-hair', 'clays-minerals', 'starches-flours'];

function detectKind(title) {
  const t = title.toLowerCase();
  if (t.includes('clay') || t.includes('mud') || t.includes('mitti') || t.includes('limestone')) return 'clay/mineral';
  if (t.includes('starch') || t.includes('arrowroot')) return 'starch/flour';
  if (t.includes('powder') || t.includes('pasupu') || t.includes('ubtan') || t.includes('shankapushpi')) return 'herbal powder';
  return 'cosmetic ingredient';
}

function buildDescription(title) {
  const kind = detectKind(title);
  return `${title} is a premium ${kind} ingredient used in cosmetic, personal-care, and DIY formulation blends. It is suitable for face packs, hair packs, soap-making additives, and traditional herbal routines based on formulation needs.`;
}

function buildUsage(title) {
  const kind = detectKind(title);
  if (kind === 'clay/mineral') {
    return 'Mix with water, rose water, or hydrosol to make a smooth paste. Apply as required and rinse after use. For formulation use, add as per batch requirement.';
  }
  if (kind === 'starch/flour') {
    return 'Use in dry blends and powder formulations to improve texture and absorbency. Mix with compatible ingredients according to your formula.';
  }
  return 'Mix with suitable liquids (water, hydrosol, curd, or oils) based on product purpose. Use in packs, masks, or formulation blends as required.';
}

function nextProductCode(existingCodes) {
  const nums = existingCodes
    .filter((x) => /^BC\d+$/.test(x))
    .map((x) => parseInt(x.slice(2), 10))
    .filter((n) => Number.isFinite(n));

  let n = (nums.length ? Math.max(...nums) : 0) + 1;
  let code = '';
  const set = new Set(existingCodes);
  do {
    code = `BC${String(n).padStart(3, '0')}`;
    n += 1;
  } while (set.has(code));
  return code;
}

async function main() {
  const env = loadEnv();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: products, error: pErr } = await supabase
    .from('products')
    .select('id,product_id,title_en,title_te,description_en,specifications_en,usage_en,current_price,mrp,unit_value,unit_type,stock_quantity,is_active,created_at')
    .order('created_at', { ascending: true });
  if (pErr) throw pErr;

  const existingCodes = products.map((p) => p.product_id);

  const byNorm = new Map();
  for (const p of products) {
    const k = norm(p.title_en);
    if (!byNorm.has(k)) byNorm.set(k, []);
    byNorm.get(k).push(p);
  }

  const { data: sections, error: sErr } = await supabase
    .from('sections')
    .select('id,section_id')
    .in('section_id', TARGET_SECTIONS);
  if (sErr) throw sErr;
  const sectionIdBySlug = new Map((sections || []).map((s) => [s.section_id, s.id]));

  const report = {
    timestamp: new Date().toISOString(),
    requested_products: CATALOG.length,
    created_products: [],
    updated_products: [],
    mapped_sections: [],
    section_missing: [],
    variants_inserted: 0,
    variants_updated: 0,
    variants_disabled: 0,
    unresolved_products: [],
  };

  for (const item of CATALOG) {
    const nameOptions = [item.title, ...(item.aliases || [])];
    const candidates = [];
    for (const n of nameOptions) {
      const list = byNorm.get(norm(n)) || [];
      for (const row of list) candidates.push(row);
    }
    const uniqCandidates = Array.from(new Map(candidates.map((x) => [x.id, x])).values());
    uniqCandidates.sort((a, b) => {
      if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    let product = uniqCandidates[0] || null;

    if (!product) {
      const product_id = nextProductCode(existingCodes);
      existingCodes.push(product_id);
      const payload = {
        product_id,
        title_en: item.title,
        title_te: item.title,
        description_en: buildDescription(item.title),
        description_te: item.title,
        specifications_en: 'Available sizes: 50 g, 100 g, 250 g, 500 g',
        specifications_te: null,
        usage_en: buildUsage(item.title),
        usage_te: null,
        image_url: null,
        additional_images: null,
        mrp: item.prices['500 g'],
        current_price: item.prices['50 g'],
        shipping_charges: 70,
        stock_quantity: 100,
        is_active: true,
        is_best_seller: false,
        is_new: true,
        unit_value: 50,
        unit_type: 'gm',
      };
      const { data: inserted, error: iErr } = await supabase
        .from('products')
        .insert(payload)
        .select('id,product_id,title_en,title_te,description_en,specifications_en,usage_en,current_price,mrp,unit_value,unit_type,stock_quantity,is_active,created_at')
        .single();
      if (iErr) throw iErr;
      product = inserted;
      report.created_products.push({ product_id: inserted.product_id, title_en: inserted.title_en });
    } else {
      const updatePayload = {
        title_en: item.title,
        current_price: item.prices['50 g'],
        mrp: item.prices['500 g'],
        unit_value: 50,
        unit_type: 'gm',
        is_active: true,
        updated_at: new Date().toISOString(),
      };
      if (!product.description_en) updatePayload.description_en = buildDescription(item.title);
      if (!product.specifications_en) updatePayload.specifications_en = 'Available sizes: 50 g, 100 g, 250 g, 500 g';
      if (!product.usage_en) updatePayload.usage_en = buildUsage(item.title);

      const { error: uErr } = await supabase.from('products').update(updatePayload).eq('id', product.id);
      if (uErr) throw uErr;
      report.updated_products.push({ product_id: product.product_id, title_en: item.title });
    }

    const { data: variants, error: vErr } = await supabase
      .from('product_variants')
      .select('id,label,enabled')
      .eq('product_id', product.id);
    if (vErr) throw vErr;

    const variantsByLabel = new Map((variants || []).map((v) => [norm(v.label), v]));
    for (const label of SIZE_LABELS) {
      const existing = variantsByLabel.get(norm(label));
      const price = item.prices[label];
      if (!Number.isFinite(price)) continue;
      if (existing) {
        const { error: vuErr } = await supabase
          .from('product_variants')
          .update({
            label,
            price,
            mrp: price,
            shipping_charge: 70,
            stock_quantity: 100,
            enabled: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        if (vuErr) throw vuErr;
        report.variants_updated += 1;
      } else {
        const { error: viErr } = await supabase.from('product_variants').insert({
          product_id: product.id,
          label,
          price,
          mrp: price,
          shipping_charge: 70,
          stock_quantity: 100,
          enabled: true,
        });
        if (viErr) throw viErr;
        report.variants_inserted += 1;
      }
    }

    const allowedNorm = new Set(SIZE_LABELS.map((x) => norm(x)));
    const disableIds = (variants || [])
      .filter((v) => !allowedNorm.has(norm(v.label)) && v.enabled)
      .map((v) => v.id);
    if (disableIds.length > 0) {
      const { error: vdErr } = await supabase
        .from('product_variants')
        .update({ enabled: false, updated_at: new Date().toISOString() })
        .in('id', disableIds);
      if (vdErr) throw vdErr;
      report.variants_disabled += disableIds.length;
    }

    const sectionUuid = sectionIdBySlug.get(item.section);
    if (sectionUuid) {
      const { error: psErr } = await supabase
        .from('product_sections')
        .upsert([{ product_id: product.id, section_id: sectionUuid, display_order: 0 }], {
          onConflict: 'product_id,section_id',
        });
      if (psErr) throw psErr;
      report.mapped_sections.push({ product_id: product.product_id, section_id: item.section });
    } else {
      report.section_missing.push({ title_en: item.title, section_id: item.section });
    }
  }

  const out = path.resolve(process.cwd(), 'supabase', 'powder_size_pricing_report.json');
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error('FAILED:', e.message || e);
  process.exit(1);
});

