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

function normalize(t = '') {
  return t.toLowerCase();
}

function category(title) {
  const t = normalize(title);
  if (t.includes('essential oil')) return 'essential_oil';
  if (t.includes(' oil')) return 'carrier_oil';
  if (t.includes('soap') || t.includes('sops')) return 'soap';
  if (t.includes('base')) return 'base';
  if (t.includes('starch') || t.includes('flour')) return 'starch';
  if (t.includes('clay') || t.includes('mitti')) return 'clay';
  if (t.includes('butter')) return 'butter';
  if (t.includes('wax') || t.includes('cetyl')) return 'wax_emulsifier';
  if (t.includes('glucoside') || t.includes('betaine') || t.includes('peg')) return 'surfactant';
  if (t.includes('glycerin') || t.includes('aloe vera gel') || t.includes('vitamin e') || t.includes('honey') || t.includes('witch hazel')) return 'active_humectant';
  if (t.includes('water') || t.includes('wine')) return 'liquid';
  if (t.includes('powder') || t.includes('seeds') || t.includes('leaves') || t.includes('dalchini') || t.includes('ratnajot') || t.includes('gond katira')) return 'herbal';
  return 'general';
}

function buildDescription(title, cat) {
  const common = `\n\nWhy users buy this:\n- Easy to use in DIY and small-batch formulations\n- Good for regular personal-care routines\n- Works well with other ingredients in blends`;

  if (cat === 'essential_oil') return `${title} is a concentrated aromatic oil that adds a premium fragrance profile to skincare, haircare, soaps, and diffuser blends.\nUse in very small quantity for best results, because essential oils are highly potent.\nIt helps improve product appeal, sensory experience, and blend character for premium handmade products.${common}`;

  if (cat === 'carrier_oil') return `${title} is a nourishing carrier oil used in massage oils, skin moisturizers, hair oil blends, and daily personal-care routines.\nIts smooth texture helps improve spreadability and makes herbal/essential oil blends gentler on skin.\nIt is suitable for DIY body oils, scalp massage oils, and natural cosmetic formulations.${common}`;

  if (cat === 'soap') return `${title} is made for daily cleansing while keeping skin feeling fresh, soft, and comfortable.\nIt helps remove dirt and excess oil without making skin feel heavy after wash.\nA practical choice for regular bathing routines and family use.${common}`;

  if (cat === 'base') return `${title} is a ready base that makes product making faster and easier, even for beginners.\nYou can customize it with fragrance, color, extracts, or active ingredients based on your formula goal.\nIdeal for creating consistent batches with less formulation complexity.${common}`;

  if (cat === 'surfactant') return `${title} is a formulation ingredient used to support cleansing performance and foam behavior in liquid products.\nIt helps improve wash feel and contributes to balanced cleansing when combined correctly in formulas.\nUseful in shampoo, face wash, and body wash development.${common}`;

  if (cat === 'starch') return `${title} is a fine powder used to improve dry touch, absorb excess oil, and support smooth product texture.\nIt is commonly used in dry masks, powder blends, and skin-friendly cosmetic formulations.\nHelpful where lightweight feel and non-greasy finish are required.${common}`;

  if (cat === 'clay') return `${title} is a mineral-rich absorbent ingredient used in face packs and cleansing blends.\nIt helps remove excess oil and supports a clean, refreshed skin feel after use.\nA popular ingredient for detox-style packs and oil-control formulations.${common}`;

  if (cat === 'butter') return `${title} is a rich emollient butter used in creams, balms, and body-care products for deep nourishment.\nIt improves product body, softness, and after-feel in moisture-focused formulations.\nUseful for creating protective and conditioning skincare textures.${common}`;

  if (cat === 'wax_emulsifier') return `${title} helps build structure, thickness, and stability in creams, balms, and emulsified products.\nIt supports smoother texture and better consistency across batches.\nAn important ingredient for clean, stable, and professional-looking formulations.${common}`;

  if (cat === 'active_humectant') return `${title} is used to improve hydration support, skin comfort, and formulation performance.\nIt blends well in products focused on softness, moisture retention, and daily care.\nA practical ingredient for improving user experience in skincare and haircare blends.${common}`;

  if (cat === 'liquid') return `${title} is a versatile liquid ingredient used as a base phase or functional component in cosmetic formulations.\nIt helps improve blend flow, dilution balance, and overall product usability.\nSuitable for toners, masks, cleansers, and formulation prep stages.${common}`;

  if (cat === 'herbal') return `${title} is a traditional herbal ingredient used in skin packs, hair masks, and natural care formulations.\nIt can be blended with water, oils, gels, or other powders based on your use case.\nA good choice for users who prefer plant-based and customizable personal-care routines.${common}`;

  return `${title} is a useful personal-care formulation ingredient suitable for multiple DIY and professional use cases.\nIt can be combined with compatible ingredients to achieve specific texture, cleansing, or care goals.\nSuitable for users looking to build practical and customizable routines.${common}`;
}

function buildUsage(title, cat) {
  if (cat === 'essential_oil') return `How to use:\n1. Add 1-2 drops to your oil, cream, soap, or diffuser blend.\n2. Mix thoroughly and test on a small batch first.\n3. Always dilute before direct skin application.\n\nPopular uses:\n- Aroma blends and diffuser mixes\n- Fragrance for soaps and creams\n- Premium sensory touch in handmade products`;

  if (cat === 'carrier_oil') return `How to use:\n1. Apply directly for massage or skin moisturizing.\n2. Blend with essential oils for custom oil formulas.\n3. Use in hair oil mixes for scalp and strand care.\n\nPopular uses:\n- Massage oils\n- Hair oil blends\n- Skin nourishment routines`;

  if (cat === 'soap') return `How to use:\n1. Wet skin with water.\n2. Apply soap, lather gently, and massage.\n3. Rinse well and pat dry.\n\nPopular uses:\n- Daily bath use\n- Family use skincare hygiene\n- Routine cleansing`;

  if (cat === 'base') return `How to use:\n1. Measure required quantity of base.\n2. Add color, fragrance, or active ingredients as needed.\n3. Mix uniformly and finalize your product batch.\n\nPopular uses:\n- Beginner-friendly soap making\n- Fast shampoo base customization\n- Consistent small-batch production`;

  if (cat === 'surfactant') return `How to use:\n1. Add in recommended percentage during formulation.\n2. Mix with water phase and supporting ingredients.\n3. Check foam, viscosity, and skin feel before final fill.\n\nPopular uses:\n- Shampoo and body wash\n- Face cleanser bases\n- Gentle liquid wash systems`;

  if (cat === 'starch' || cat === 'clay' || cat === 'herbal') return `How to use:\n1. Mix with water, rose water, aloe gel, curd, or oils to form a paste.\n2. Apply on target area (skin/scalp/hair) based on recipe.\n3. Leave for 10-15 minutes and rinse well.\n\nPopular uses:\n- Face packs and herbal masks\n- Hair/scalp packs\n- Powder blend formulations`;

  if (cat === 'butter' || cat === 'wax_emulsifier') return `How to use:\n1. Melt in controlled heat as per formulation stage.\n2. Blend with oil/water phases as required.\n3. Mix until smooth and stable before cooling/filling.\n\nPopular uses:\n- Creams and balms\n- Body butters\n- Texture-rich formulations`;

  if (cat === 'active_humectant' || cat === 'liquid') return `How to use:\n1. Add to suitable phase in your formula.\n2. Mix thoroughly for uniform distribution.\n3. Test final feel and adjust percentage if needed.\n\nPopular uses:\n- Hydration-focused formulas\n- Toners and gels\n- Skin/hair support products`;

  return `How to use:\n1. Use according to your formulation requirement.\n2. Start with a small trial batch.\n3. Adjust quantity based on final texture and performance.`;
}

async function main() {
  const env = loadEnv();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: products, error } = await supabase
    .from('products')
    .select('id,product_id,title_en,description_en,usage_en,is_active')
    .eq('is_active', true);
  if (error) throw error;

  let updated = 0;
  const touched = [];

  for (const p of products) {
    const cat = category(p.title_en || '');
    const description_en = buildDescription(p.title_en || 'Product', cat);
    const usage_en = buildUsage(p.title_en || 'Product', cat);

    const { error: upErr } = await supabase
      .from('products')
      .update({ description_en, usage_en, updated_at: new Date().toISOString() })
      .eq('id', p.id);

    if (upErr) throw upErr;
    updated += 1;
    touched.push({ product_id: p.product_id, title_en: p.title_en, category: cat });
  }

  const report = {
    timestamp: new Date().toISOString(),
    active_products_updated: updated,
    sample: touched.slice(0, 20)
  };

  fs.writeFileSync('supabase/product_copy_enhancement_report.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error('Failed:', e.message);
  process.exit(1);
});
