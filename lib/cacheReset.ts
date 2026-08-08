// One-time client cache migration.
//
// Some returning users may hold stale cached data in localStorage from an older
// build (e.g. an old cached catalog with categories/products that no longer
// exist). Bump CACHE_VERSION whenever we want every device to drop that cache
// once. Only the *cached catalog* is cleared — it is safely re-fetched from the
// server. User favorites (shuk_liked_ids) and analytics are preserved.

const CACHE_VERSION = '2026-metzion-1';
const VKEY = 'shuk_cache_v';

// Cached copies of the shared catalog — safe to drop, re-fetched on load.
const STALE_KEYS = ['shuk_custom_products', 'shuk_overrides', 'shuk_hidden'];

export function runCacheMigration() {
  if (typeof window === 'undefined') return;
  try {
    if (localStorage.getItem(VKEY) === CACHE_VERSION) return;
    STALE_KEYS.forEach(k => localStorage.removeItem(k));
    localStorage.setItem(VKEY, CACHE_VERSION);
  } catch {
    /* private mode / quota — ignore */
  }
}
