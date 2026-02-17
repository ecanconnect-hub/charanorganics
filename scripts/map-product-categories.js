const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnv(file = '.env.local') {
  const env = {};
  if (!fs.existsSync(file)) return env;
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

const CATALOG = {
  oils_liquids: ['BC001','BC002','BC006','BC005','BC089','BC032','BC033','BC034','BC012','BC023','BC030','BC024','BC036','BC090'],
  soap_shampoo_bases: ['BC025','BC035'],
  surfactants_additives: ['BC013','BC021','BC029','BC003','BC031','BC017','BC091','BC052','BC051'],
  butters_waxes_binders: ['BC007','BC008','BC022','BC010','BC077'],
  clays_starches_flours: ['BC020','BC026','BC027','BC028','BC092','BC047','BC048','BC049'],
  herbal_skin_soap: ['BC050','BC054','HP001','BC055','BC056','BC057','BC073','BC059','BC060','HP003','BC045','BC074','BC075','BC058','BC061','BC093','HP002','BC063','BC076','BC083'],
  herbal_hair_shampoo: ['BC039','BC094','BC037','BC095','BC096','BC038','BC097','BC019','BC078','BC079','BC080','BC042','BC043','BC081','BC082','BC046','BC041','BC040','BC084','BC085','BC044'],
  essential_oils_all: ['BC064','EO001','EO002','EO004','EO003','EO005','BC070','BC071','BC072']
};

const TARGET_SECTIONS = [
  { section_id: 'oils-liquids', title_en: 'Oils & Liquids', title_te: '??????? & ??????????', display_order: 1 },
  { section_id: 'soap-shampoo-bases', title_en: 'Soap, Shampoo & Bases', title_te: '????, ????? & ??????', display_order: 2 },
  { section_id: 'surfactants-additives', title_en: 'Surfactants & Additives', title_te: '?????????????? & ??????????', display_order: 3 },
  { section_id: 'butters-waxes-binders', title_en: 'Butters, Waxes & Binders', title_te: '????????, ???????? & ????????', display_order: 4 },
  { section_id: 'clays-starches-flours', title_en: 'Clays, Starches & Flours', title_te: '??????, ?????????? & ????????', display_order: 5 },
  { section_id: 'herbal-powders-skin-soap', title_en: 'Herbal Powders - Skin & Soap', title_te: '??????? ??????? - ?????? & ????', display_order: 6 },
  { section_id: 'herbal-powders-hair-shampoo', title_en: 'Herbal Powders - Hair & Shampoo', title_te: '??????? ??????? - ?????? & ?????', display_order: 7 },
  { section_id: 'essential-oils', title_en: 'Essential Oils', title_te: '?????????? ???????', display_order: 8 },
  { section_id: 'miscellaneous', title_en: 'Miscellaneous', title_te: '??????', display_order: 99 },
];

async function main() {
  const env = loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials');

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  // Upsert target sections
  const { error: upsertSecErr } = await supabase
    .from('sections')
    .upsert(TARGET_SECTIONS.map(s => ({
      section_id: s.section_id,
      title_en: s.title_en,
      title_te: s.title_te,
      is_enabled: true,
      display_order: s.display_order,
    })), { onConflict: 'section_id' });
  if (upsertSecErr) throw upsertSecErr;

  const { data: sections, error: secErr } = await supabase
    .from('sections')
    .select('id,section_id,title_en')
    .in('section_id', [...new Set([...TARGET_SECTIONS.map(s => s.section_id), 'hair-care'])]);
  if (secErr) throw secErr;

  const sectionIdBySlug = new Map(sections.map(s => [s.section_id, s.id]));

  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('id,product_id,title_en,is_active')
    .eq('is_active', true);
  if (prodErr) throw prodErr;

  const productUuidByCode = new Map(products.map(p => [p.product_id, p.id]));

  const mappingRows = [];
  const missingProducts = [];

  function addGroup(productIds, sectionSlug) {
    const sectionUuid = sectionIdBySlug.get(sectionSlug);
    if (!sectionUuid) return;
    for (const productCode of productIds) {
      const productUuid = productUuidByCode.get(productCode);
      if (!productUuid) {
        missingProducts.push({ product_id: productCode, section: sectionSlug });
        continue;
      }
      mappingRows.push({ product_id: productUuid, section_id: sectionUuid, source_product_id: productCode, source_section: sectionSlug });
    }
  }

  addGroup(CATALOG.oils_liquids, 'oils-liquids');
  addGroup(CATALOG.soap_shampoo_bases, 'soap-shampoo-bases');
  addGroup(CATALOG.surfactants_additives, 'surfactants-additives');
  addGroup(CATALOG.butters_waxes_binders, 'butters-waxes-binders');
  addGroup(CATALOG.clays_starches_flours, 'clays-starches-flours');
  addGroup(CATALOG.herbal_skin_soap, 'herbal-powders-skin-soap');
  addGroup(CATALOG.herbal_hair_shampoo, 'herbal-powders-hair-shampoo');
  addGroup(CATALOG.essential_oils_all, 'essential-oils');

  // Multi-category support: hair powders also appear in general hair-care category.
  if (sectionIdBySlug.get('hair-care')) {
    const hairCareUuid = sectionIdBySlug.get('hair-care');
    for (const productCode of CATALOG.herbal_hair_shampoo) {
      const productUuid = productUuidByCode.get(productCode);
      if (!productUuid) continue;
      mappingRows.push({ product_id: productUuid, section_id: hairCareUuid, source_product_id: productCode, source_section: 'hair-care' });
    }
  }

  // Remove existing mappings for products in our known catalog before reinsert.
  const targetProductUuids = [...new Set(mappingRows.map(r => r.product_id))];
  if (targetProductUuids.length) {
    const { error: delErr } = await supabase
      .from('product_sections')
      .delete()
      .in('product_id', targetProductUuids);
    if (delErr) throw delErr;
  }

  // De-duplicate mapping rows and add display order per section.
  const unique = new Map();
  for (const row of mappingRows) {
    unique.set(`${row.product_id}|${row.section_id}`, row);
  }
  const deduped = [...unique.values()];

  const groupedBySection = new Map();
  for (const row of deduped) {
    if (!groupedBySection.has(row.section_id)) groupedBySection.set(row.section_id, []);
    groupedBySection.get(row.section_id).push(row);
  }

  const finalInsertRows = [];
  for (const [sectionUuid, rows] of groupedBySection.entries()) {
    rows.sort((a, b) => a.source_product_id.localeCompare(b.source_product_id));
    rows.forEach((r, idx) => finalInsertRows.push({
      product_id: r.product_id,
      section_id: sectionUuid,
      display_order: idx + 1,
    }));
  }

  if (finalInsertRows.length) {
    const { error: insErr } = await supabase
      .from('product_sections')
      .upsert(finalInsertRows, { onConflict: 'product_id,section_id' });
    if (insErr) throw insErr;
  }

  // Fallback: any active product still without category -> miscellaneous
  const miscSection = sectionIdBySlug.get('miscellaneous');
  let miscAssigned = 0;
  if (miscSection) {
    const { data: allPS, error: psErr } = await supabase
      .from('product_sections')
      .select('product_id');
    if (psErr) throw psErr;
    const hasSection = new Set((allPS || []).map(p => p.product_id));

    const miscRows = products
      .filter(p => !hasSection.has(p.id))
      .map((p, idx) => ({ product_id: p.id, section_id: miscSection, display_order: idx + 1 }));

    if (miscRows.length) {
      const { error: miscErr } = await supabase
        .from('product_sections')
        .upsert(miscRows, { onConflict: 'product_id,section_id' });
      if (miscErr) throw miscErr;
      miscAssigned = miscRows.length;
    }
  }

  const report = {
    timestamp: new Date().toISOString(),
    active_products: products.length,
    target_sections_upserted: TARGET_SECTIONS.length,
    catalog_mappings_attempted: mappingRows.length,
    catalog_mappings_inserted_unique: finalInsertRows.length,
    missing_catalog_products: missingProducts,
    miscellaneous_assigned: miscAssigned,
  };

  const out = path.resolve(process.cwd(), 'supabase', 'product_category_mapping_report.json');
  fs.writeFileSync(out, JSON.stringify(report, null, 2));

  console.log('Category mapping complete');
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error('Failed:', e.message);
  process.exit(1);
});
