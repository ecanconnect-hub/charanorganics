import 'server-only';

// ---------------------------------------------------------------------------
// Private / sensitive data — never cache
// ---------------------------------------------------------------------------
export const NO_STORE_HEADERS = {
    'Cache-Control': 'no-store',
};

// ---------------------------------------------------------------------------
// Public read-only product catalog
// CDN caches for 5 min; browsers revalidate at 1 min.
// stale-while-revalidate gives 1 hr of graceful stale serving.
// ---------------------------------------------------------------------------
export const PUBLIC_CATALOG_CACHE_HEADERS = {
    'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600',
};

// ---------------------------------------------------------------------------
// Search results — shorter TTL to surface new products quickly
// ---------------------------------------------------------------------------
export const PUBLIC_SEARCH_CACHE_HEADERS = {
    'Cache-Control': 'public, max-age=30, s-maxage=120, stale-while-revalidate=600',
};

// ---------------------------------------------------------------------------
// Filter/facet metadata — changes rarely, can be cached longer
// ---------------------------------------------------------------------------
export const PUBLIC_FILTER_CACHE_HEADERS = {
    'Cache-Control': 'public, max-age=120, s-maxage=600, stale-while-revalidate=7200',
};

// ---------------------------------------------------------------------------
// Home / site-level aggregations (featured products, banners, etc.)
// ---------------------------------------------------------------------------
export const PUBLIC_HOME_CACHE_HEADERS = {
    'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600',
};

// ---------------------------------------------------------------------------
// Sitemap / robots — very long CDN cache, short browser cache
// ---------------------------------------------------------------------------
export const SITEMAP_CACHE_HEADERS = {
    'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
};

// ---------------------------------------------------------------------------
// User-session-specific data (cart, account) — always private
// ---------------------------------------------------------------------------
export const PRIVATE_CACHE_HEADERS = {
    'Cache-Control': 'private, no-store, must-revalidate',
};
