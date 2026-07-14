import type { Product } from '@/types';

export interface Catalog {
  custom: Product[];
  overrides: Record<string, Product>;
  hidden: string[];
}

export const EMPTY_CATALOG: Catalog = { custom: [], overrides: {}, hidden: [] };

// Fetch the shared catalog from the server (Cloudflare KV via Pages Function).
// Returns null on any failure so callers can fall back to local data.
export async function fetchCatalog(): Promise<Catalog | null> {
  try {
    const res = await fetch('/api/products', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      custom: Array.isArray(data.custom) ? data.custom : [],
      overrides: data.overrides && typeof data.overrides === 'object' ? data.overrides : {},
      hidden: Array.isArray(data.hidden) ? data.hidden : [],
    };
  } catch {
    return null;
  }
}

// Save the shared catalog to the server. Returns true on success.
export async function saveCatalog(password: string, data: Catalog): Promise<boolean> {
  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password, data }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
