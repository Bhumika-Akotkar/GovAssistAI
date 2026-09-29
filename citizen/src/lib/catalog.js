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

import bundled from "../data/schemes/index.json";
import pmKisan from "../data/schemes/pm-kisan.json";
import ayushman from "../data/schemes/ayushman-bharat-pmjay.json";
import pmAwas from "../data/schemes/pm-awas-yojana.json";
import rationCard from "../data/schemes/ration-card-nfsa.json";
import aadhaar from "../data/schemes/aadhaar-services.json";
import scholarships from "../data/schemes/student-scholarships.json";
import ujjwala from "../data/schemes/ujjwala-yojana.json";
import mgnrega from "../data/schemes/mgnrega.json";

const BY_SLUG = new Map(
  [
    pmKisan,
    ayushman,
    pmAwas,
    rationCard,
    aadhaar,
    scholarships,
    ujjwala,
    mgnrega,
  ].map((s) => [s.slug, s]),
);

function slugify(value) {
  return (
    String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "scheme"
  );
}

const CATEGORY_ICONS = {
  Agriculture: "🌾",
  "Health & Wellness": "🏥",
  Housing: "🏠",
  "Public Distribution": "🪪",
  Education: "🎓",
  Energy: "🔥",
  Employment: "👷",
  Women: "👩",
  Youth: "🎯",
  Skill: "🛠️",
  Finance: "💰",
  default: "🏛️",
};

const CATEGORY_ACCENTS = {
  Agriculture: "forest",
  "Health & Wellness": "terra",
  Housing: "sky",
  "Public Distribution": "mustard",
  Education: "plum",
  Energy: "forest",
  Employment: "sky",
  Women: "plum",
  Youth: "mustard",
  Skill: "terra",
  Finance: "forest",
  default: "forest",
};

export function normalizeSchemeForCatalog(raw) {
  if (!raw) return null;

  const derivedName = raw.name || raw.title?.en || raw.summary?.en || "Scheme";
  const slug = raw.slug || slugify(raw.name || derivedName);
  const title =
    raw.title && typeof raw.title === "object"
      ? raw.title
      : { en: derivedName };
  if (!title.en) title.en = derivedName;

  const description =
    raw.description || raw.summary?.en || raw.summary || "Government scheme";
  const summary =
    raw.summary && typeof raw.summary === "object"
      ? raw.summary
      : { en: description };
  if (!summary.en) summary.en = description;

  const images = Array.isArray(raw.images)
    ? raw.images.filter((item) => typeof item === "string" && item.trim())
    : [];

  const category = raw.category || raw.sector || "General";
  const sector = raw.sector || category;

  return {
    ...raw,
    id: raw.id || slug,
    slug,
    name: derivedName,
    title,
    summary,
    description,
    category,
    sector,
    icon: raw.icon || CATEGORY_ICONS[category] || CATEGORY_ICONS.default,
    accent:
      raw.accent || CATEGORY_ACCENTS[category] || CATEGORY_ACCENTS.default,
    officialUrl: raw.officialUrl || raw.siteUrl || "#",
    siteUrl: raw.siteUrl || raw.officialUrl || "#",
    images,
    estimatedDays: raw.estimatedDays || 30,
  };
}

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
  const incoming = Array.isArray(remote) ? remote : remote?.schemes;
  if (!Array.isArray(incoming) || incoming.length === 0) return false;

  const nextVersion = remote?.version || "remote";
  if (nextVersion === cache.version) return false;

  cache = {
    version: nextVersion,
    schemes: incoming.map(normalizeSchemeForCatalog).filter(Boolean),
  };
  return true;
}

export async function refreshCatalog(signal) {
  try {
    const endpoints = ["/api/schemes", "/api/services/catalog"];

    for (const endpoint of endpoints) {
      const res = await fetch(endpoint, {
        signal,
        headers: { Accept: "application/json" },
      });
      if (!res.ok) continue;

      const data = await res.json();
      return applyRemoteCatalog(data);
    }

    console.log("Catalog refresh endpoint unavailable, using bundled catalog");
    return false;
  } catch (error) {
    console.log(
      "Catalog refresh failed, using bundled catalog:",
      error.message,
    );
    return false;
  }
}
