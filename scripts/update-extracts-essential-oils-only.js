const fs = require('fs');
const path = require('path');
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

const norm = (s = '') => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const extracts = [
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
  'Sweet Marjoram Extract',
];

const essentialOils = [
  'Thamala Paulu Essential Oil',
  'Rose Essential Oil',
  'Rosemary Essential Oil',
  'Lavender Essential Oil',
  'Ylang Ylang Essential Oil',
  'Frankincense Essential Oil',
  'Lemongrass Essential Oil',
  'Peppermint Essential Oil',
  'Thyme Essential Oil',
  'Camphor Essential Oil',
  'Bergamot Essential Oil',
  'Clary Sage Essential Oil',
  'Patchouli Essential Oil',
  'Geranium Essential Oil',
  'Tangerine Essential Oil',
  'Roman Chamomile Essential Oil',
  'German Chamomile Essential Oil',
  'Sandal Essential Oil',
  'Jasmine Essential Oil',
];

const aliases = {
  'Tulasi Extract': ['Thulasi Extract'],
  'Green Tea Extract': ['Green Tree Extract'],
  'Licorice Extract': ['Likoric Extract'],
  'Chamomile Extract': ['Camomile Extract'],
  'Frankincense Essential Oil': ['Frankensense Essential Oil'],
  'Thyme Essential Oil': ['Thyme E Oil'],
  'Camphor Essential Oil': ['Camphor E Oil'],
  'Bergamot Essential Oil': ['Bergamot E Oil'],
  'Clary Sage Essential Oil': ['Clary Sage E Oil'],
  'Patchouli Essential Oil': ['Patchouli E Oil'],
  'Roman Chamomile Essential Oil': ['Roman Camomile', 'Roman Camomile Essential Oil'],
  'German Chamomile Essential Oil': ['German Camomile', 'German Camomile Essential Oil'],
  'Sandal Essential Oil': ['Sandalwood Essential Oil'],
  'Jasmine Essential Oil': ['Jasmine Oil'],
};

function allNamesFor(canonical) {
  const arr = [canonical, ...(aliases[canonical] || [])];
  return Array.from(new Set(arr.map((x) => x.trim())));
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
    .select('id,product_id,title_en,title_te,is_active,current_price,mrp,unit_value,unit_type,created_at')
    .order('created_at', { ascending: true });
  if (pErr) throw pErr;

  const existingCodes = products.map((p) => p.product_id);

  const byNormTitle = new Map();
  for (const p of products) {
    const k = norm(p.title_en);
    if (!byNormTitle.has(k)) byNormTitle.set(k, []);
    byNormTitle.get(k).push(p);
  }

  const upserted = [];
  const inserted = [];
  const renamed = [];
  const deduped = [];

  async function findOrCreate(canonical, type) {
    const candidateNames = allNamesFor(canonical);
    const candidates = [];
    for (const n of candidateNames) {
      const hit = byNormTitle.get(norm(n)) || [];
      candidates.push(...hit);
    }

    let record = null;
    if (candidates.length) {
      const uniqueById = Array.from(new Map(candidates.map((c) => [c.id, c])).values());
      uniqueById.sort((a, b) => {
        if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
        const aEO = /^EO\d+$/i.test(a.product_id);
        const bEO = /^EO\d+$/i.test(b.product_id);
        if (aEO !== bEO) return aEO ? -1 : 1;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
      record = uniqueById[0];

      // Deactivate same-title duplicates to keep one canonical active entry.
      const others = uniqueById.slice(1).filter((x) => x.is_active);
      if (others.length) {
        const { error: deErr } = await supabase
          .from('products')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .in('id', others.map((x) => x.id));
        if (deErr) throw deErr;
        deduped.push({ canonical: record.product_id, title: canonical, deactivated: others.map((x) => x.product_id) });
      }

      // Update canonical record
      const updatePayload = {
        title_en: canonical,
        title_te: record.title_te || canonical,
        current_price: type === 'essential' ? 200 : 300,
        unit_value: type === 'essential' ? 15 : 100,
        unit_type: 'ml',
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      const { error: uErr } = await supabase.from('products').update(updatePayload).eq('id', record.id);
      if (uErr) throw uErr;

      if (record.title_en !== canonical) {
        renamed.push({ product_id: record.product_id, from: record.title_en, to: canonical });
      }

      upserted.push({ product_id: record.product_id, title_en: canonical, action: 'updated' });
      return { ...record, ...updatePayload };
    }

    const product_id = nextProductCode(existingCodes);
    existingCodes.push(product_id);

    const payload = {
      product_id,
      title_en: canonical,
      title_te: canonical,
      description_en: `${canonical} for cosmetic and personal-care formulations.`,
      description_te: `${canonical} for cosmetic use.`,
      specifications_en: `${type === 'essential' ? 15 : 100} ml`,
      specifications_te: null,
      usage_en: 'Use as per formulation requirement. Patch test before direct skin use.',
      usage_te: null,
      image_url: null,
      additional_images: null,
      mrp: type === 'essential' ? 200 : 300,
      current_price: type === 'essential' ? 200 : 300,
      shipping_charges: 70,
      stock_quantity: 100,
      is_active: true,
      is_best_seller: false,
      is_new: true,
      unit_value: type === 'essential' ? 15 : 100,
      unit_type: 'ml',
    };

    const { data: ins, error: iErr } = await supabase
      .from('products')
      .insert(payload)
      .select('id,product_id,title_en,is_active,unit_value,unit_type,current_price,mrp')
      .single();
    if (iErr) throw iErr;

    inserted.push(ins);
    upserted.push({ product_id: ins.product_id, title_en: canonical, action: 'inserted' });
    return ins;
  }

  const processed = [];
  for (const t of extracts) processed.push(await findOrCreate(t, 'extract'));
  for (const t of essentialOils) processed.push(await findOrCreate(t, 'essential'));

  // Map to categories if available
  const { data: sections, error: sErr } = await supabase
    .from('sections')
    .select('id,section_id')
    .in('section_id', ['essential-oils', 'extracts', 'humectants-actives']);
  if (sErr) throw sErr;

  const sectionMap = new Map((sections || []).map((s) => [s.section_id, s.id]));
  const essentialSection = sectionMap.get('essential-oils');
  // Prefer dedicated extracts section; fallback keeps backward compatibility.
  const extractSection = sectionMap.get('extracts') || sectionMap.get('humectants-actives');

  const psRows = [];
  let orderEss = 1;
  let orderExt = 1;

  for (const p of processed) {
    const isEssential = essentialOils.some((n) => norm(n) === norm(p.title_en));
    if (isEssential && essentialSection) psRows.push({ product_id: p.id, section_id: essentialSection, display_order: orderEss++ });
    if (!isEssential && extractSection) psRows.push({ product_id: p.id, section_id: extractSection, display_order: orderExt++ });
  }

  if (psRows.length) {
    const { error: psErr } = await supabase
      .from('product_sections')
      .upsert(psRows, { onConflict: 'product_id,section_id' });
    if (psErr) throw psErr;
  }

  // Final verification for requested set
  const requestedNames = [...extracts, ...essentialOils].map((x) => norm(x));
  const { data: finalRows, error: fErr } = await supabase
    .from('products')
    .select('product_id,title_en,current_price,unit_value,unit_type,is_active,image_url')
    .order('title_en');
  if (fErr) throw fErr;

  const requested = finalRows.filter((r) => requestedNames.includes(norm(r.title_en)));

  const invalidEss = requested.filter((r) => essentialOils.some((x) => norm(x) === norm(r.title_en)) && !(Number(r.current_price) === 200 && Number(r.unit_value) === 15 && (r.unit_type || '').toLowerCase() === 'ml'));
  const invalidExt = requested.filter((r) => extracts.some((x) => norm(x) === norm(r.title_en)) && !(Number(r.current_price) === 300 && Number(r.unit_value) === 100 && (r.unit_type || '').toLowerCase() === 'ml'));

  const report = {
    timestamp: new Date().toISOString(),
    scope: 'extracts_and_essential_oils_only',
    inserted_count: inserted.length,
    inserted_products: inserted.map((x) => ({ product_id: x.product_id, title_en: x.title_en })),
    updated_or_inserted_count: upserted.length,
    renamed: renamed,
    dedupe_deactivated: deduped,
    essential_oils_config_ok: invalidEss.length === 0,
    extracts_config_ok: invalidExt.length === 0,
    invalid_essential_rows: invalidEss,
    invalid_extract_rows: invalidExt,
    requested_products_without_images: requested.filter((r) => !r.image_url).map((r) => ({ product_id: r.product_id, title_en: r.title_en })),
    requested_products: requested,
  };

  const out = path.resolve(process.cwd(), 'supabase', 'extracts_essential_oils_update_report.json');
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error('Failed:', e.message);
  process.exit(1);
});
