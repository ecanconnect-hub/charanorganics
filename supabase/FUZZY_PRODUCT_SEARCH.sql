-- Enable typo-tolerant product search for shop query `q`
-- Run this file once in Supabase SQL editor.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION public.search_products_fuzzy(
  p_query TEXT,
  p_limit INTEGER DEFAULT 100
)
RETURNS SETOF public.products
LANGUAGE sql
STABLE
AS $$
  WITH normalized_query AS (
    SELECT
      lower(coalesce(p_query, '')) AS raw_query,
      lower(regexp_replace(coalesce(p_query, ''), '[^a-z0-9]+', '', 'g')) AS compact_query
  )
  SELECT p.*
  FROM public.products p
  CROSS JOIN normalized_query q
  WHERE
    p.is_active = TRUE
    AND (
      lower(coalesce(p.title_en, '')) LIKE '%' || q.raw_query || '%'
      OR lower(coalesce(p.title_te, '')) LIKE '%' || q.raw_query || '%'
      OR lower(coalesce(p.description_en, '')) LIKE '%' || q.raw_query || '%'
      OR lower(coalesce(p.description_te, '')) LIKE '%' || q.raw_query || '%'
      OR lower(coalesce(p.specifications_en, '')) LIKE '%' || q.raw_query || '%'
      OR lower(coalesce(p.usage_en, '')) LIKE '%' || q.raw_query || '%'
      OR (q.compact_query <> '' AND lower(regexp_replace(coalesce(p.title_en, ''), '[^a-z0-9]+', '', 'g')) LIKE '%' || q.compact_query || '%')
      OR (q.compact_query <> '' AND lower(regexp_replace(coalesce(p.title_te, ''), '[^a-z0-9]+', '', 'g')) LIKE '%' || q.compact_query || '%')
      OR lower(coalesce(p.title_en, '')) % q.raw_query
      OR lower(coalesce(p.title_te, '')) % q.raw_query
      OR similarity(lower(regexp_replace(coalesce(p.title_en, ''), '[^a-z0-9]+', '', 'g')), q.compact_query) > 0.2
      OR similarity(lower(regexp_replace(coalesce(p.title_te, ''), '[^a-z0-9]+', '', 'g')), q.compact_query) > 0.2
      OR word_similarity(lower(coalesce(p.title_en, '')), q.raw_query) > 0.2
      OR word_similarity(lower(coalesce(p.title_te, '')), q.raw_query) > 0.2
      OR word_similarity(lower(coalesce(p.description_en, '')), q.raw_query) > 0.14
      OR word_similarity(lower(coalesce(p.specifications_en, '')), q.raw_query) > 0.14
      OR word_similarity(lower(coalesce(p.usage_en, '')), q.raw_query) > 0.14
    )
  ORDER BY
    GREATEST(
      similarity(lower(coalesce(p.title_en, '')), q.raw_query),
      similarity(lower(coalesce(p.title_te, '')), q.raw_query),
      similarity(lower(regexp_replace(coalesce(p.title_en, ''), '[^a-z0-9]+', '', 'g')), q.compact_query),
      similarity(lower(regexp_replace(coalesce(p.title_te, ''), '[^a-z0-9]+', '', 'g')), q.compact_query),
      word_similarity(lower(coalesce(p.title_en, '')), q.raw_query),
      word_similarity(lower(coalesce(p.title_te, '')), q.raw_query),
      word_similarity(lower(coalesce(p.description_en, '')), q.raw_query),
      word_similarity(lower(coalesce(p.specifications_en, '')), q.raw_query),
      word_similarity(lower(coalesce(p.usage_en, '')), q.raw_query)
    ) DESC,
    p.created_at DESC
  LIMIT LEAST(GREATEST(coalesce(p_limit, 100), 1), 300);
$$;

GRANT EXECUTE ON FUNCTION public.search_products_fuzzy(TEXT, INTEGER) TO anon, authenticated;
