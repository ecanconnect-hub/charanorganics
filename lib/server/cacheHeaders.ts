import 'server-only';

export const NO_STORE_HEADERS = {
    'Cache-Control': 'no-store',
};

export const PUBLIC_CATALOG_CACHE_HEADERS = {
    'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600',
};

export const PUBLIC_SEARCH_CACHE_HEADERS = {
    'Cache-Control': 'public, max-age=30, s-maxage=120, stale-while-revalidate=600',
};
