import { describe, it, expect } from "vitest";
import { normalizeSchemeForCatalog } from "./catalog";

describe("normalizeSchemeForCatalog", () => {
  it("keeps real saved scheme data with slug, title, summary and images", () => {
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
