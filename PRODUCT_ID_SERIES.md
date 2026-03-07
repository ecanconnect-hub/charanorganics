# Product ID Series (product_id)

This project uses manual `product_id` values stored in `public.products.product_id` (TEXT, UNIQUE, NOT NULL). There is no trigger that auto-generates these IDs by default, so they are set by seed scripts or admin inserts.

## Series Found In This Repo

Based on values found under `supabase/*.sql` and `supabase/*.json`:

1. `BC###`  
   Primary catalog series used for most products. Examples: `BC001` through `BC228`.  
   References: `supabase/PRODUCT_CATALOG_SYNC.sql`, `supabase/IMAGE_URL_AND_NEW_PRODUCTS_SYNC.sql`, `supabase/IMAGE_URLS_BATCH_2_UPSERT.sql`.

2. `EO###`  
   Essential oils series. Examples: `EO001` to `EO005`.  
   References: `supabase/PRODUCT_CATALOG_SYNC.sql`.

3. `HP###`  
   Herbal powders series. Examples: `HP001`, `HP002`.  
   References: `supabase/PRODUCT_CATALOG_SYNC.sql`, `supabase/active_products_snapshot.json`.

4. Numeric-only IDs  
   Legacy IDs like `810`, `811`.  
   References: `supabase/PRODUCT_CATALOG_SYNC.sql`, `supabase/IMAGE_URL_AND_NEW_PRODUCTS_SYNC.sql`, `supabase/IMAGE_URLS_BATCH_2_UPSERT.sql`.

## Optional Generator (Not Auto-Used)

`supabase/schema.sql` defines a function `generate_product_id()` that creates IDs like `ORG-0001`, `ORG-0002`, etc., by counting existing products and incrementing until unique.  
This function exists but is **not** automatically called; there is no trigger that sets `product_id`.

## Important Note About Categories

The `product_id` prefix does **not** control storefront categories.  
Categories are controlled by `sections` and `product_sections` mappings.

## Practical Guidance

If you want to keep using the existing pattern:

- For a new catalog item, continue the next number in the same series (`BC`, `EO`, `HP`).
- For legacy numeric items, keep the numeric pattern only if you need compatibility.
- If you prefer the `ORG-####` style, you must call `generate_product_id()` yourself when inserting.

