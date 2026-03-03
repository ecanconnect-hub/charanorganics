-- Powder catalog size-pricing migration
-- Adds/updates products, creates 50g/100g/250g/500g variants, maps categories.
-- Idempotent: safe to run multiple times.

BEGIN;

CREATE TEMP TABLE tmp_powder_pricing (
  title_en TEXT PRIMARY KEY,
  aliases_en TEXT[] NOT NULL DEFAULT '{}',
  section_slug TEXT NOT NULL,
  price_50 NUMERIC(10,2) NOT NULL,
  price_100 NUMERIC(10,2) NOT NULL,
  price_250 NUMERIC(10,2) NOT NULL,
  price_500 NUMERIC(10,2) NOT NULL
);

INSERT INTO tmp_powder_pricing (title_en, aliases_en, section_slug, price_50, price_100, price_250, price_500) VALUES
('Triphala Powder', '{}', 'herbal-powders-skin', 60, 120, 250, 350),
('Licorice Powder', '{}', 'herbal-powders-skin', 60, 120, 200, 350),
('Arjuna Powder', '{}', 'herbal-powders-skin', 60, 120, 200, 350),
('Manjistha Powder', '{}', 'herbal-powders-skin', 60, 120, 200, 350),
('Karakkaya Powder', '{}', 'herbal-powders-skin', 60, 120, 200, 350),
('Sandal Powder', '{"Sandalwood Powder"}', 'herbal-powders-skin', 75, 150, 300, 550),
('Red Sandal Powder', '{"Red Sandalwood Powder"}', 'herbal-powders-skin', 150, 250, 500, 1000),
('Hibiscus Powder', '{"Hibiscus Flower Powder"}', 'herbal-powders-hair', 80, 150, 300, 600),
('Walnut Shell Powder', '{}', 'herbal-powders-skin', 40, 80, 150, 250),
('Fenugreek Powder', '{}', 'herbal-powders-hair', 40, 80, 180, 250),
('Rose Petal Powder', '{}', 'herbal-powders-skin', 80, 160, 350, 450),
('Bhringraj Powder', '{}', 'herbal-powders-hair', 60, 120, 300, 450),
('Lemon Peel Powder', '{}', 'herbal-powders-skin', 120, 200, 350, 450),
('Orange Peel Powder', '{}', 'herbal-powders-skin', 40, 120, 250, 350),
('Reetha Powder', '{"Reetha (Soapnut) Powder"}', 'herbal-powders-hair', 50, 80, 150, 250),
('Ashwagandha Powder', '{"Ashwagandha"}', 'herbal-powders-hair', 60, 120, 200, 450),
('Aloe Vera Powder', '{}', 'herbal-powders-skin', 50, 100, 200, 450),
('Brahmi Powder', '{}', 'herbal-powders-hair', 60, 120, 200, 450),
('Neem Powder', '{}', 'herbal-powders-skin', 40, 80, 150, 250),
('Shikakai Powder', '{}', 'herbal-powders-hair', 40, 80, 150, 250),
('Indigo Powder', '{}', 'herbal-powders-hair', 60, 120, 250, 450),
('Tulasi Powder', '{}', 'herbal-powders-skin', 40, 80, 150, 250),
('Kasturi Pasupu', '{"Kasthuri Pasupu","Kasthuri Turmeric"}', 'herbal-powders-skin', 40, 80, 200, 400),
('Beetroot Powder', '{}', 'herbal-powders-skin', 40, 80, 200, 350),
('Tomato Powder', '{}', 'herbal-powders-skin', 40, 80, 200, 300),
('Ubtan Powder', '{}', 'herbal-powders-skin', 75, 150, 200, 350),
('Moringa Powder', '{}', 'herbal-powders-skin', 50, 100, 200, 400),
('Henna Powder', '{}', 'herbal-powders-hair', 40, 80, 200, 350),
('Jatamansi Powder', '{}', 'herbal-powders-hair', 150, 250, 350, 500),
('Arrowroot Powder', '{}', 'starches-flours', 40, 80, 120, 400),
('Papaya Powder', '{}', 'herbal-powders-skin', 60, 120, 200, 350),
('Banana Powder', '{}', 'herbal-powders-skin', 100, 180, 300, 650),
('Lotus Powder', '{}', 'herbal-powders-skin', 75, 150, 200, 400),
('Amla Powder', '{}', 'herbal-powders-hair', 80, 150, 300, 450),
('Charcoal Powder', '{}', 'herbal-powders-skin', 60, 120, 300, 350),
('Multani Mitti', '{}', 'clays-minerals', 40, 80, 120, 200),
('Kaolin Clay', '{}', 'clays-minerals', 40, 80, 120, 200),
('Rose Clay', '{}', 'clays-minerals', 60, 120, 200, 300),
('Bentonite Clay', '{}', 'clays-minerals', 60, 120, 200, 300),
('Dead Sea Mud', '{}', 'clays-minerals', 60, 120, 200, 300),
('Green Clay', '{}', 'clays-minerals', 60, 120, 200, 300),
('Kuppipakku Powder', '{}', 'herbal-powders-skin', 60, 120, 250, 450),
('Vattiveru Powder', '{"Vetiver (Vattiveru) Powder","Vetiver Powder"}', 'herbal-powders-hair', 60, 120, 250, 450),
('Cinnamon Powder', '{}', 'herbal-powders-skin', 60, 120, 250, 450),
('Avarampoo', '{"Avarampoo Powder"}', 'herbal-powders-hair', 60, 120, 250, 450),
('Rice Starch', '{}', 'starches-flours', 60, 120, 250, 450),
('Potato Starch', '{}', 'starches-flours', 60, 120, 250, 450),
('Corn Starch', '{}', 'starches-flours', 60, 120, 250, 450),
('Gaddi Chamanthi Powder', '{}', 'herbal-powders-hair', 60, 120, 250, 450),
('Rosemary Leaves', '{}', 'herbal-powders-hair', 100, 200, 350, 650),
('Ratanjot', '{"Ratnajot"}', 'herbal-powders-skin', 60, 120, 250, 450),
('Badam Charcoal', '{}', 'herbal-powders-skin', 75, 150, 300, 450),
('Hartal Works Powder', '{"Hartal Warki Powder"}', 'herbal-powders-skin', 150, 300, 500, 1000),
('Limestone', '{}', 'clays-minerals', 70, 140, 300, 500),
('Shankapushpi', '{}', 'herbal-powders-hair', 70, 140, 300, 500);

DO $$
DECLARE
  r RECORD;
  picked_product_id UUID;
  picked_product_code TEXT;
  picked_title_te TEXT;
  sec_id UUID;
  next_bc INTEGER;
  generated_code TEXT;
  has_unit_columns BOOLEAN;
BEGIN
  SELECT COALESCE(MAX((SUBSTRING(product_id FROM 3))::INT), 0) + 1
  INTO next_bc
  FROM public.products
  WHERE product_id ~ '^BC[0-9]+$';

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'unit_value'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'unit_type'
  )
  INTO has_unit_columns;

  FOR r IN SELECT * FROM tmp_powder_pricing ORDER BY title_en LOOP
    picked_product_id := NULL;
    picked_product_code := NULL;
    picked_title_te := NULL;

    SELECT p.id, p.product_id, p.title_te
      INTO picked_product_id, picked_product_code, picked_title_te
    FROM public.products p
    WHERE regexp_replace(lower(coalesce(p.title_en, '')), '[^a-z0-9]+', ' ', 'g') = ANY (
      SELECT regexp_replace(lower(x), '[^a-z0-9]+', ' ', 'g')
      FROM unnest(array_prepend(r.title_en, r.aliases_en)) AS x
    )
    ORDER BY p.is_active DESC, p.created_at ASC
    LIMIT 1;

    IF picked_product_id IS NULL THEN
      generated_code := 'BC' || lpad(next_bc::TEXT, 3, '0');
      next_bc := next_bc + 1;

      INSERT INTO public.products (
        product_id,
        title_en,
        title_te,
        description_en,
        description_te,
        specifications_en,
        specifications_te,
        usage_en,
        usage_te,
        image_url,
        additional_images,
        mrp,
        current_price,
        shipping_charges,
        stock_quantity,
        is_active
      )
      VALUES (
        generated_code,
        r.title_en,
        r.title_en,
        r.title_en || ' is a premium powder ingredient used in herbal cosmetic and personal-care formulations.',
        r.title_en,
        'Available sizes: 50 g, 100 g, 250 g, 500 g',
        NULL,
        'Mix with suitable liquids based on formulation needs and use as required.',
        NULL,
        NULL,
        NULL,
        r.price_500,
        r.price_50,
        70,
        100,
        TRUE
      )
      RETURNING id, product_id, title_te
      INTO picked_product_id, picked_product_code, picked_title_te;
    ELSE
      UPDATE public.products p
      SET
        title_en = r.title_en,
        title_te = COALESCE(p.title_te, r.title_en),
        current_price = r.price_50,
        mrp = r.price_500,
        is_active = TRUE,
        description_en = COALESCE(p.description_en, r.title_en || ' is a premium powder ingredient used in herbal cosmetic and personal-care formulations.'),
        specifications_en = COALESCE(p.specifications_en, 'Available sizes: 50 g, 100 g, 250 g, 500 g'),
        usage_en = COALESCE(p.usage_en, 'Mix with suitable liquids based on formulation needs and use as required.'),
        updated_at = NOW()
      WHERE p.id = picked_product_id;
    END IF;

    IF has_unit_columns THEN
      EXECUTE 'UPDATE public.products SET unit_value = 50, unit_type = ''gm'', updated_at = NOW() WHERE id = $1'
      USING picked_product_id;
    END IF;

    -- Upsert required variants
    PERFORM 1 FROM public.product_variants
    WHERE product_id = picked_product_id
      AND lower(trim(label)) = lower(trim('50 g'));
    IF FOUND THEN
      UPDATE public.product_variants
      SET
        label = '50 g',
        price = r.price_50,
        mrp = r.price_50,
        shipping_charge = 70,
        stock_quantity = 100,
        enabled = TRUE,
        updated_at = NOW()
      WHERE product_id = picked_product_id
        AND lower(trim(label)) = lower(trim('50 g'));
    ELSE
      INSERT INTO public.product_variants (product_id, label, price, mrp, shipping_charge, stock_quantity, enabled)
      VALUES (picked_product_id, '50 g', r.price_50, r.price_50, 70, 100, TRUE);
    END IF;

    PERFORM 1 FROM public.product_variants
    WHERE product_id = picked_product_id
      AND lower(trim(label)) = lower(trim('100 g'));
    IF FOUND THEN
      UPDATE public.product_variants
      SET
        label = '100 g',
        price = r.price_100,
        mrp = r.price_100,
        shipping_charge = 70,
        stock_quantity = 100,
        enabled = TRUE,
        updated_at = NOW()
      WHERE product_id = picked_product_id
        AND lower(trim(label)) = lower(trim('100 g'));
    ELSE
      INSERT INTO public.product_variants (product_id, label, price, mrp, shipping_charge, stock_quantity, enabled)
      VALUES (picked_product_id, '100 g', r.price_100, r.price_100, 70, 100, TRUE);
    END IF;

    PERFORM 1 FROM public.product_variants
    WHERE product_id = picked_product_id
      AND lower(trim(label)) = lower(trim('250 g'));
    IF FOUND THEN
      UPDATE public.product_variants
      SET
        label = '250 g',
        price = r.price_250,
        mrp = r.price_250,
        shipping_charge = 70,
        stock_quantity = 100,
        enabled = TRUE,
        updated_at = NOW()
      WHERE product_id = picked_product_id
        AND lower(trim(label)) = lower(trim('250 g'));
    ELSE
      INSERT INTO public.product_variants (product_id, label, price, mrp, shipping_charge, stock_quantity, enabled)
      VALUES (picked_product_id, '250 g', r.price_250, r.price_250, 70, 100, TRUE);
    END IF;

    PERFORM 1 FROM public.product_variants
    WHERE product_id = picked_product_id
      AND lower(trim(label)) = lower(trim('500 g'));
    IF FOUND THEN
      UPDATE public.product_variants
      SET
        label = '500 g',
        price = r.price_500,
        mrp = r.price_500,
        shipping_charge = 70,
        stock_quantity = 100,
        enabled = TRUE,
        updated_at = NOW()
      WHERE product_id = picked_product_id
        AND lower(trim(label)) = lower(trim('500 g'));
    ELSE
      INSERT INTO public.product_variants (product_id, label, price, mrp, shipping_charge, stock_quantity, enabled)
      VALUES (picked_product_id, '500 g', r.price_500, r.price_500, 70, 100, TRUE);
    END IF;

    -- Disable other variants for these products to enforce clean size selector
    UPDATE public.product_variants
    SET enabled = FALSE, updated_at = NOW()
    WHERE product_id = picked_product_id
      AND lower(trim(label)) NOT IN ('50 g', '100 g', '250 g', '500 g')
      AND enabled = TRUE;

    -- Section mapping
    SELECT id INTO sec_id
    FROM public.sections
    WHERE section_id = r.section_slug
    LIMIT 1;

    IF sec_id IS NOT NULL THEN
      INSERT INTO public.product_sections (product_id, section_id, display_order)
      VALUES (
        picked_product_id,
        sec_id,
        COALESCE((SELECT MAX(ps.display_order) + 1 FROM public.product_sections ps WHERE ps.section_id = sec_id), 1)
      )
      ON CONFLICT (product_id, section_id)
      DO NOTHING;
    END IF;
  END LOOP;
END $$;

COMMIT;

-- Verification queries
-- 1) All requested products present
-- SELECT t.title_en, p.product_id, p.current_price, p.mrp
-- FROM tmp_powder_pricing t
-- LEFT JOIN public.products p
--   ON regexp_replace(lower(p.title_en), '[^a-z0-9]+', ' ', 'g') = regexp_replace(lower(t.title_en), '[^a-z0-9]+', ' ', 'g')
-- ORDER BY t.title_en;

-- 2) Variant count and prices for requested products
-- SELECT p.title_en, v.label, v.price
-- FROM public.products p
-- JOIN public.product_variants v ON v.product_id = p.id
-- WHERE p.title_en IN (SELECT title_en FROM tmp_powder_pricing)
-- ORDER BY p.title_en, v.price;

