# 🗄️ Supabase Database Setup Guide

## Step 1: Access Supabase SQL Editor

1. Go to your Supabase project: https://supabase.com/dashboard/project/frdkhfuarrgmulppqzis
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

## Step 2: Run the Complete Schema

1. Open the file: `supabase/schema.sql`
2. **Copy the ENTIRE contents** of the file
3. Paste into the SQL Editor
4. Click **Run** or press `Ctrl+Enter`

This will create:
- ✅ All 14 database tables
- ✅ Row Level Security (RLS) policies
- ✅ Triggers for auto-notifications
- ✅ Functions for unique ID generation
- ✅ Performance indexes
- ✅ Initial site content

## Step 3: Verify Tables Created

Run this query to check:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see these tables:
- addresses
- admin_notifications
- admin_settings
- browsing_history
- cart_items
- order_items
- orders
- payments
- product_sections
- products
- profiles
- rate_limits
- sections
- site_content

## Step 4: Create Your Admin Account

### 4a. Sign Up on the Website

1. Go to http://localhost:3000
2. Click **Login** (will be created soon, or you can sign up via Supabase Auth)
3. For now, go to Supabase Dashboard → **Authentication** → **Users**
4. Click **Add User** → **Create new user**
5. Enter your email and password
6. Click **Create User**

### 4b. Make Yourself Admin

Run this SQL query (replace with your email):

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

## Step 5: Add Sample Data (Optional but Recommended)

### Add a Product Section

```sql
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
) VALUES (
  'bestsellers',
  'Best Sellers',
  'బెస్ట్ సెల్లర్స్',
  'Our Most Popular Products',
  'మా అత్యంత ప్రజాదరణ పొందిన ఉత్పత్తులు',
  'Discover our customers'' favorite organic and ayurvedic products',
  'మా కస్టమర్ల ఇష్టమైన సేంద్రీయ మరియు ఆయుర్వేద ఉత్పత్తులను కనుగొనండి',
  1,
  true
);
```

### Add Sample Products

```sql
-- Product 1: Organic Neem Powder
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
  mrp,
  current_price,
  shipping_charges,
  stock_quantity,
  is_active
) VALUES (
  'ORG-0001',
  'Organic Neem Powder',
  'సేంద్రీయ వేప పొడి',
  'Pure organic neem powder for skin and hair care. Made from naturally dried neem leaves.',
  'చర్మం మరియు జుట్టు సంరక్షణ కోసం స్వచ్ఛమైన సేంద్రీయ వేప పొడి. సహజంగా ఎండబెట్టిన వేప ఆకుల నుండి తయారు చేయబడింది.',
  'Weight: 100g | Shelf Life: 12 months | Ingredients: 100% Organic Neem Leaves',
  'బరువు: 100గ్రా | షెల్ఫ్ లైఫ్: 12 నెలలు | పదార్థాలు: 100% సేంద్రీయ వేప ఆకులు',
  'Mix 1-2 teaspoons with water to form a paste. Apply on skin or hair. Leave for 15-20 minutes and wash off.',
  '1-2 టీస్పూన్లను నీటితో కలిపి పేస్ట్ చేయండి. చర్మం లేదా జుట్టుపై రాయండి. 15-20 నిమిషాలు ఉంచి కడగండి.',
  299.00,
  249.00,
  40.00,
  100,
  true
);

-- Product 2: Organic Turmeric Powder
INSERT INTO public.products (
  product_id,
  title_en,
  title_te,
  description_en,
  description_te,
  mrp,
  current_price,
  shipping_charges,
  stock_quantity,
  is_active
) VALUES (
  'ORG-0002',
  'Organic Turmeric Powder',
  'సేంద్రీయ పసుపు పొడి',
  'Premium quality organic turmeric powder with high curcumin content.',
  'అధిక కర్కుమిన్ కంటెంట్ కలిగిన ప్రీమియం నాణ్యత సేంద్రీయ పసుపు పొడి.',
  349.00,
  299.00,
  40.00,
  150,
  true
);

-- Product 3: Organic Amla Powder
INSERT INTO public.products (
  product_id,
  title_en,
  title_te,
  description_en,
  description_te,
  mrp,
  current_price,
  shipping_charges,
  stock_quantity,
  is_active
) VALUES (
  'ORG-0003',
  'Organic Amla Powder',
  'సేంద్రీయ ఉసిరికాయ పొడి',
  'Rich in Vitamin C, perfect for hair and skin health.',
  'విటమిన్ సి సమృద్ధిగా ఉంది, జుట్టు మరియు చర్మ ఆరోగ్యానికి సరైనది.',
  279.00,
  229.00,
  40.00,
  80,
  true
);

-- Product 4: Organic Shikakai Powder
INSERT INTO public.products (
  product_id,
  title_en,
  title_te,
  description_en,
  description_te,
  mrp,
  current_price,
  shipping_charges,
  stock_quantity,
  is_active
) VALUES (
  'ORG-0004',
  'Organic Shikakai Powder',
  'సేంద్రీయ శికాకాయ పొడి',
  'Natural hair cleanser and conditioner. Promotes hair growth.',
  'సహజ జుట్టు క్లెన్సర్ మరియు కండిషనర్. జుట్టు పెరుగుదలను ప్రోత్సహిస్తుంది.',
  259.00,
  219.00,
  40.00,
  90,
  true
);
```

### Link Products to Section

```sql
-- Get the section ID
DO $$
DECLARE
  section_uuid UUID;
BEGIN
  SELECT id INTO section_uuid FROM public.sections WHERE section_id = 'bestsellers';
  
  -- Link all 4 products to the bestsellers section
  INSERT INTO public.product_sections (product_id, section_id, display_order)
  SELECT id, section_uuid, ROW_NUMBER() OVER (ORDER BY product_id)
  FROM public.products
  WHERE product_id IN ('ORG-0001', 'ORG-0002', 'ORG-0003', 'ORG-0004');
END $$;
```

## Step 6: Verify Everything Works

### Check Products

```sql
SELECT product_id, title_en, current_price, stock_quantity
FROM public.products
WHERE is_active = true;
```

### Check Sections

```sql
SELECT section_id, title_en, is_enabled
FROM public.sections
ORDER BY display_order;
```

### Check Product-Section Mapping

```sql
SELECT 
  s.title_en as section,
  p.product_id,
  p.title_en as product
FROM public.product_sections ps
JOIN public.sections s ON ps.section_id = s.id
JOIN public.products p ON ps.product_id = p.id
ORDER BY s.display_order, ps.display_order;
```

## Step 7: Test on Website

1. Go to http://localhost:3000
2. You should see:
   - ✅ Hero section with title and buttons
   - ✅ Trust badges (100% Organic, Cruelty-Free, Handmade)
   - ✅ "Best Sellers" section with 4 products
   - ✅ Product cards with images (placeholder), prices, and "Add to Cart" buttons

## 🎉 Success!

Your database is now fully set up and ready to use!

## 🔧 Troubleshooting

### Issue: "relation does not exist"
**Solution**: Make sure you ran the entire `schema.sql` file

### Issue: "permission denied"
**Solution**: Check that RLS policies are created. Run:
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

### Issue: Products not showing
**Solution**: 
1. Check products are active: `SELECT * FROM products WHERE is_active = true;`
2. Check section is enabled: `SELECT * FROM sections WHERE is_enabled = true;`
3. Check mapping exists: `SELECT * FROM product_sections;`

### Issue: Can't add to cart
**Solution**: Check browser console for errors. Make sure Supabase keys are correct in `.env.local`

## 📞 Need Help?

- Check Supabase logs: Dashboard → Logs
- Check browser console: F12 → Console
- Review `README.md` for more details

---

**Next**: Continue building authentication, cart, checkout, and admin panel!
