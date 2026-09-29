// Scheme catalog access.
//
// The catalog must work with the network switched off, so it is *bundled*:
// `import.meta.glob(..., { eager: true })` inlines every scheme file into the
// JS chunk, which the service worker precaches with the app shell. A `fetch`
// against `/data/schemes/*.json` is only ever a refresh path, never the source
// of truth for first paint.
//
// `GET /api/services/catalog` is the third path: it re-reads the same JSON from
// disk on the server and returns it with an ETag derived from the version, so a
// deploy that edits a scheme is picked up without a client release.

import bundled from '../data/schemes/index.json';
import pmKisan from '../data/schemes/pm-kisan.json';
import ayushman from '../data/schemes/ayushman-bharat-pmjay.json';
import pmAwas from '../data/schemes/pm-awas-yojana.json';
import rationCard from '../data/schemes/ration-card-nfsa.json';
import aadhaar from '../data/schemes/aadhaar-services.json';
import scholarships from '../data/schemes/student-scholarships.json';
import ujjwala from '../data/schemes/ujjwala-yojana.json';
import mgnrega from '../data/schemes/mgnrega.json';

const BY_SLUG = new Map(
  [pmKisan, ayushman, pmAwas, rationCard, aadhaar, scholarships, ujjwala, mgnrega].map(
    (s) => [s.slug, s],
  ),
);

const CATALOG = {
  version: bundled.version,
  schemes: bundled.schemes.map((slug) => BY_SLUG.get(slug)).filter(Boolean),
};

// Exposed so the server can be asked for a newer copy without a redeploy.
export const BUNDLED_VERSION = CATALOG.version;

let cache = CATALOG;

export function getCatalog() {
  return cache;
}

export function getCatalogVersion() {
  return cache.version;
}

export function getScheme(slug) {
  return cache.schemes.find((s) => s.slug === slug) || null;
}

/**
 * Replaces the bundled catalog with a server copy when one arrives. Only called
 * after an explicit refresh; a failed refresh must leave the bundled catalog
 * in place, because that is the version guaranteed to work offline.
 */
export function applyRemoteCatalog(remote) {
  if (!remote || !Array.isArray(remote.schemes) || remote.schemes.length === 0) return false;
  if (remote.version === cache.version) return false;
  cache = { version: remote.version, schemes: remote.schemes };
  return true;
}

export async function refreshCatalog(signal) {
  try {
    const res = await fetch('/api/services/catalog', { signal, headers: { Accept: 'application/json' } });
    if (!res.ok) {
      console.log(`Catalog refresh endpoint returned ${res.status}, using bundled catalog`);
      return false;
    }
    const data = await res.json();
    return applyRemoteCatalog(data);
  } catch (error) {
    console.log('Catalog refresh failed, using bundled catalog:', error.message);
    return false;
  }
}
