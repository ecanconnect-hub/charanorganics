const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnv(file = '.env.local') {
  const env = {};
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const i = line.indexOf('=');
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    env[line.slice(0, i).trim()] = v;
  }
  return env;
}

const EXTRACT_TITLES = [
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

async function main() {
  const env = loadEnv();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const sectionPayload = {
    section_id: 'extracts',
    title_en: 'Extracts',
    title_te: '????????????????',
    subtitle_en: 'Concentrated botanical actives for formulations',
    subtitle_te: '????????????? ???? ?????????? ??????? ????????????????',
    description_en:
      'Botanical extracts used in shampoos, serums, creams, and treatment blends. These ingredients are typically added in measured percentages to improve product performance and targeted care outcomes.',
    description_te:
      '?????, ?????, ???????? ????? ??????????? ???????????? ????????? ??????? ????????????????. ??????????? ????????? ???? ???????? ????? ??????.',
    display_order: 7,
    is_enabled: true,
  };

  let { data: upsertedSection, error: secUpsertErr } = await supabase
    .from('sections')
    .upsert(sectionPayload, { onConflict: 'section_id' })
    .select('id,section_id,title_en')
    .single();
  if (secUpsertErr) throw secUpsertErr;

  const { data: extractProducts, error: prodErr } = await supabase
    .from('products')
    .select('id,product_id,title_en,is_active,image_url')
    .in('title_en', EXTRACT_TITLES)
    .eq('is_active', true)
    .order('title_en');
  if (prodErr) throw prodErr;

  const mappingRows = extractProducts.map((p, idx) => ({
    product_id: p.id,
    section_id: upsertedSection.id,
    display_order: idx + 1,
  }));

  if (mappingRows.length) {
    const { error: psUpsertErr } = await supabase
      .from('product_sections')
      .upsert(mappingRows, { onConflict: 'product_id,section_id' });
    if (psUpsertErr) throw psUpsertErr;
  }

  const { data: humSection, error: humErr } = await supabase
    .from('sections')
    .select('id,section_id')
    .eq('section_id', 'humectants-actives')
    .maybeSingle();
  if (humErr) throw humErr;

  let removedFromHumectants = 0;
  if (humSection && extractProducts.length) {
    const ids = extractProducts.map((p) => p.id);
    const { data: beforeRows, error: beforeErr } = await supabase
      .from('product_sections')
      .select('id')
      .eq('section_id', humSection.id)
      .in('product_id', ids);
    if (beforeErr) throw beforeErr;

    if (beforeRows && beforeRows.length) {
      const { error: delErr } = await supabase
        .from('product_sections')
        .delete()
        .eq('section_id', humSection.id)
        .in('product_id', ids);
      if (delErr) throw delErr;
      removedFromHumectants = beforeRows.length;
    }
  }

  const firstImage = extractProducts.find((p) => !!p.image_url)?.image_url || null;
  if (firstImage) {
    const { error: imgErr } = await supabase
      .from('sections')
      .update({ image_url: firstImage, updated_at: new Date().toISOString() })
      .eq('id', upsertedSection.id);
    if (imgErr) throw imgErr;
  }

  const { count: mappedCount, error: countErr } = await supabase
    .from('product_sections')
    .select('*', { count: 'exact', head: true })
    .eq('section_id', upsertedSection.id);
  if (countErr) throw countErr;

  const report = {
    timestamp: new Date().toISOString(),
    section: { id: upsertedSection.id, section_id: upsertedSection.section_id, title_en: upsertedSection.title_en },
    extracted_products_found: extractProducts.length,
    mapped_to_extracts: mappingRows.length,
    removed_from_humectants_actives: removedFromHumectants,
    extracts_section_total_mappings: mappedCount || 0,
    product_codes: extractProducts.map((p) => p.product_id),
    products_without_images: extractProducts.filter((p) => !p.image_url).map((p) => ({ product_id: p.product_id, title_en: p.title_en })),
  };

  const out = path.resolve(process.cwd(), 'supabase', 'extracts_category_creation_report.json');
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error('Failed:', e.message);
  process.exit(1);
});
