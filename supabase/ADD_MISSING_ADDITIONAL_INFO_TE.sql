-- Fix missing products.additional_info_te column.
-- This prevents admin product save/update failures when payload includes Telugu additional info.

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS additional_info_te TEXT;

-- Backfill existing rows with English value where Telugu value is missing/blank.
UPDATE public.products
SET additional_info_te = additional_info_en
WHERE (additional_info_te IS NULL OR btrim(additional_info_te) = '')
  AND additional_info_en IS NOT NULL;

-- Refresh PostgREST schema cache immediately.
NOTIFY pgrst, 'reload schema';
