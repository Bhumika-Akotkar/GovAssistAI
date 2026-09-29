/**
 * Vitest suite for the translation helper and the bundled catalog.
 *
 * A missing translation must degrade to English *visibly*, not to a blank
 * space, and the catalog must be complete and self-consistent because it is the
 * only source of scheme information when the network is off.
 */

import { describe, expect, test } from "vitest";
import { translate, isFallback, missingLanguagesFor } from "../src/lib/i18n";
import {
  getCatalog,
  getScheme,
  BUNDLED_VERSION,
  normalizeSchemeForCatalog,
} from "../src/lib/catalog";

const LOCALES = [
  "en",
  "hi",
  "mr",
  "ta",
  "te",
  "bn",
  "gu",
  "kn",
  "ml",
  "pa",
  "or",
  "as",
];

describe("translate", () => {
  test("returns the requested language when present", () => {
    expect(translate({ en: "Scheme", hi: "योजना" }, "hi")).toBe("योजना");
  });

  test("falls back to English when the language is missing", () => {
    expect(translate({ en: "Scheme", hi: "योजना" }, "ta")).toBe("Scheme");
  });

  test("falls back to the first available key when English is absent", () => {
    expect(translate({ hi: "योजना" }, "ta")).toBe("योजना");
  });

  test("passes plain strings through unchanged", () => {
    expect(translate("Free", "ta")).toBe("Free");
  });

  test("returns an empty string for null or undefined", () => {
    expect(translate(null, "hi")).toBe("");
    expect(translate(undefined, "hi")).toBe("");
  });

  test("never returns undefined, so a UI can always render it", () => {
    for (const locale of LOCALES) {
      expect(translate({ en: "x" }, locale)).toBeTypeOf("string");
      expect(translate({}, locale)).toBeTypeOf("string");
    }
  });
});

describe("isFallback", () => {
  test("is true when English is being shown in place of a translation", () => {
    expect(isFallback({ en: "Scheme" }, "ta")).toBe(true);
  });

  test("is false when the language is authored", () => {
    expect(isFallback({ en: "Scheme", ta: "திட்டம்" }, "ta")).toBe(false);
  });

  test("is false for English, which is never a fallback", () => {
    expect(isFallback({ en: "Scheme" }, "en")).toBe(false);
  });
});

describe("missingLanguagesFor", () => {
  test("lists languages with no authored value", () => {
    const scheme = { title: { en: "A", hi: "B" } };
    const missing = missingLanguagesFor(scheme, ["en", "hi", "ta", "bn"]);
    expect(missing.has("ta")).toBe(true);
    expect(missing.has("bn")).toBe(true);
    expect(missing.has("hi")).toBe(false);
    expect(missing.has("en")).toBe(false);
  });

  test("handles a scheme with no localizable values", () => {
    expect(missingLanguagesFor(null, LOCALES).size).toBe(0);
    expect(missingLanguagesFor({}, LOCALES).size).toBe(0);
  });
});

describe("normalizeSchemeForCatalog", () => {
  test("maps database records into the same card-friendly shape as the bundled catalog", () => {
    const raw = {
      id: "scheme-123",
      name: "PM Kisan Samman Nidhi",
      description: "Income support for eligible farmers.",
      sector: "Agriculture",
      images: ["https://example.com/card.png"],
      siteUrl: "https://pmkisan.gov.in",
      isActive: true,
    };

    const normalized = normalizeSchemeForCatalog(raw);

    expect(normalized.slug).toBe("pm-kisan-samman-nidhi");
    expect(normalized.title.en).toBe("PM Kisan Samman Nidhi");
    expect(normalized.summary.en).toBe("Income support for eligible farmers.");
    expect(normalized.images).toEqual(["https://example.com/card.png"]);
    expect(normalized.officialUrl).toBe("https://pmkisan.gov.in");
  });
});

describe("bundled catalog", () => {
  const catalog = getCatalog();

  test("is available synchronously, with no network required", () => {
    expect(catalog.schemes.length).toBeGreaterThan(0);
    expect(catalog.version).toBe(BUNDLED_VERSION);
  });

  test("ships the eight Phase 1 schemes", () => {
    const slugs = catalog.schemes.map((s) => s.slug).sort();
    expect(slugs).toEqual([
      "aadhaar-services",
      "ayushman-bharat-pmjay",
      "mgnrega",
      "pm-awas-yojana",
      "pm-kisan",
      "ration-card-nfsa",
      "student-scholarships",
      "ujjwala-yojana",
    ]);
  });

  test("every scheme has a slug, icon, category, authority and official URL", () => {
    for (const scheme of catalog.schemes) {
      expect(scheme.slug, "slug").toBeTruthy();
      expect(scheme.icon, `${scheme.slug} icon`).toBeTruthy();
      expect(scheme.category, `${scheme.slug} category`).toBeTruthy();
      expect(scheme.authority, `${scheme.slug} authority`).toBeTruthy();
      expect(scheme.officialUrl, `${scheme.slug} officialUrl`).toMatch(
        /^https:\/\//,
      );
    }
  });

  test("every scheme has at least three ordered steps", () => {
    for (const scheme of catalog.schemes) {
      expect(
        scheme.steps.length,
        `${scheme.slug} steps`,
      ).toBeGreaterThanOrEqual(3);
      const numbers = scheme.steps.map((s) => s.n);
      expect(numbers, `${scheme.slug} step numbering`).toEqual(
        [...numbers].sort((a, b) => a - b),
      );
    }
  });

  test("every step states where, what it costs and how long it takes", () => {
    // The offline promise is that a citizen can act on this without asking
    // anyone, so these three fields are the minimum viable instruction.
    for (const scheme of catalog.schemes) {
      for (const step of scheme.steps) {
        expect(step.where, `${scheme.slug} step ${step.n} where`).toBeTruthy();
        expect(step.cost, `${scheme.slug} step ${step.n} cost`).toBeTruthy();
        expect(step.time, `${scheme.slug} step ${step.n} time`).toBeTruthy();
      }
    }
  });

  test("every scheme has a document list with required flags", () => {
    for (const scheme of catalog.schemes) {
      expect(
        scheme.documents.length,
        `${scheme.slug} documents`,
      ).toBeGreaterThan(0);
      for (const doc of scheme.documents) {
        expect(doc.id, `${scheme.slug} doc id`).toBeTruthy();
        expect(
          typeof doc.required,
          `${scheme.slug} doc ${doc.id} required`,
        ).toBe("boolean");
        expect(
          doc.label?.en,
          `${scheme.slug} doc ${doc.id} label`,
        ).toBeTruthy();
      }
    }
  });

  test("document ids are unique within a scheme", () => {
    for (const scheme of catalog.schemes) {
      const ids = scheme.documents.map((d) => d.id);
      expect(new Set(ids).size, `${scheme.slug} duplicate doc id`).toBe(
        ids.length,
      );
    }
  });

  test("every scheme has eligibility criteria and an English summary", () => {
    for (const scheme of catalog.schemes) {
      expect(
        scheme.eligibility.length,
        `${scheme.slug} eligibility`,
      ).toBeGreaterThan(0);
      expect(scheme.title.en, `${scheme.slug} English title`).toBeTruthy();
      expect(scheme.summary.en, `${scheme.slug} English summary`).toBeTruthy();
    }
  });

  test("every localized field resolves to non-empty text in every language it claims", () => {
    // Catches a translation object that is present but empty, which renders as
    // a blank card rather than falling back.
    for (const scheme of catalog.schemes) {
      for (const locale of Object.keys(scheme.title)) {
        const title = translate(scheme.title, locale);
        expect(title.trim(), `${scheme.slug} title for ${locale}`).not.toBe("");
        const summary = translate(scheme.summary, locale);
        expect(summary.trim(), `${scheme.slug} summary for ${locale}`).not.toBe(
          "",
        );
      }
    }
  });

  test("slugs are unique", () => {
    const slugs = catalog.schemes.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  test("getScheme resolves a known slug and returns null for an unknown one", () => {
    expect(getScheme("pm-kisan")?.title.en).toBe("PM-KISAN");
    expect(getScheme("does-not-exist")).toBeNull();
  });
});
