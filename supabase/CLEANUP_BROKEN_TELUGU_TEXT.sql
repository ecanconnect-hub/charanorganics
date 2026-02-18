-- Cleanup script for broken Telugu text (e.g., "????", garbled placeholders).
-- Safe fallback approach: if Telugu text looks invalid, copy the English value.
-- Run once in Supabase SQL Editor.

-- 1) Product names
UPDATE public.products
SET title_te = title_en
WHERE
  title_te IS NULL
  OR btrim(title_te) = ''
  OR title_te ~ '^\?+$'
  OR title_te ~ '\?'
  OR title_te LIKE '%�%';

-- 2) Section/category names
UPDATE public.sections
SET title_te = title_en
WHERE
  title_te IS NULL
  OR btrim(title_te) = ''
  OR title_te ~ '^\?+$'
  OR title_te ~ '\?'
  OR title_te LIKE '%�%';

-- 3) Optional: section subtitles
UPDATE public.sections
SET subtitle_te = subtitle_en
WHERE
  subtitle_te IS NULL
  OR btrim(subtitle_te) = ''
  OR subtitle_te ~ '^\?+$'
  OR subtitle_te ~ '\?'
  OR subtitle_te LIKE '%�%';
