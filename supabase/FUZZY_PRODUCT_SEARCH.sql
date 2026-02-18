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
  SELECT p.*
  FROM public.products p
  WHERE
    p.is_active = TRUE
    AND (
      lower(coalesce(p.title_en, '')) LIKE '%' || lower(p_query) || '%'
      OR lower(coalesce(p.title_te, '')) LIKE '%' || lower(p_query) || '%'
      OR lower(coalesce(p.description_en, '')) LIKE '%' || lower(p_query) || '%'
      OR lower(coalesce(p.description_te, '')) LIKE '%' || lower(p_query) || '%'
      OR lower(coalesce(p.specifications_en, '')) LIKE '%' || lower(p_query) || '%'
      OR lower(coalesce(p.usage_en, '')) LIKE '%' || lower(p_query) || '%'
      OR lower(coalesce(p.title_en, '')) % lower(p_query)
      OR lower(coalesce(p.title_te, '')) % lower(p_query)
      OR word_similarity(lower(coalesce(p.title_en, '')), lower(p_query)) > 0.24
      OR word_similarity(lower(coalesce(p.description_en, '')), lower(p_query)) > 0.16
      OR word_similarity(lower(coalesce(p.specifications_en, '')), lower(p_query)) > 0.16
      OR word_similarity(lower(coalesce(p.usage_en, '')), lower(p_query)) > 0.16
    )
  ORDER BY
    GREATEST(
      similarity(lower(coalesce(p.title_en, '')), lower(p_query)),
      similarity(lower(coalesce(p.title_te, '')), lower(p_query)),
      word_similarity(lower(coalesce(p.title_en, '')), lower(p_query)),
      word_similarity(lower(coalesce(p.description_en, '')), lower(p_query)),
      word_similarity(lower(coalesce(p.specifications_en, '')), lower(p_query)),
      word_similarity(lower(coalesce(p.usage_en, '')), lower(p_query))
    ) DESC,
    p.created_at DESC
  LIMIT LEAST(GREATEST(coalesce(p_limit, 100), 1), 300);
$$;

GRANT EXECUTE ON FUNCTION public.search_products_fuzzy(TEXT, INTEGER) TO anon, authenticated;
