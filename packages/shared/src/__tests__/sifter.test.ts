import { describe, expect, it } from "vitest";

import {
  buildSheinSearchUrl,
  buildSifterQualityKnowledgePrompt,
  buildTemuSearchUrl,
  selectSifterQualityCategories,
  SIFTER_DISCOUNT_CODE_GROUPS,
  SIFTER_QUALITY_CATEGORIES,
  SIFTER_REALITY_CHECKS,
  SIFTER_SALE_KEYWORDS,
  SIFTER_SUGGESTIONS,
  SIFTER_TEMU_COUPON_GROUPS,
} from "../sifter";

describe("Sifter shared helpers", () => {
  it("builds encoded Temu search URLs", () => {
    expect(buildTemuSearchUrl("280 GSM cotton hoodie")).toBe(
      "https://www.temu.com/search_result.html?search_key=280%20GSM%20cotton%20hoodie",
    );
  });

  it("builds encoded SHEIN search URLs", () => {
    expect(buildSheinSearchUrl("925 silver earrings")).toBe(
      "https://www.shein.com/pdsearch/925%20silver%20earrings/",
    );
  });

  it("keeps launch suggestions and discount data populated", () => {
    expect(SIFTER_SUGGESTIONS.length).toBe(6);
    expect(SIFTER_SALE_KEYWORDS).toContain("Flash sale");
    expect(
      SIFTER_DISCOUNT_CODE_GROUPS.some((group) =>
        group.codes.some((code) => code.code === "SWZS7"),
      ),
    ).toBe(true);
    expect(
      SIFTER_TEMU_COUPON_GROUPS.some((group) =>
        group.entries.some((entry) => entry.copyValue.includes("Temu")),
      ),
    ).toBe(true);
  });

  it("keeps expanded quality knowledge available for Sifter prompts", () => {
    expect(SIFTER_QUALITY_CATEGORIES.length).toBeGreaterThanOrEqual(15);
    expect(SIFTER_QUALITY_CATEGORIES.map((category) => category.name)).toEqual(
      expect.arrayContaining([
        "T-shirts",
        "Jeans",
        "Hoodies and sweats",
        "Office trousers and blazers",
        "Bags and leather goods",
      ]),
    );
    expect(SIFTER_REALITY_CHECKS).toContain(
      "Keywords narrow the pool; they do not prove quality.",
    );
    expect(
      SIFTER_QUALITY_CATEGORIES.every(
        (category) => category.verificationChecks.length >= 3,
      ),
    ).toBe(true);
  });

  it("selects hoodie quality knowledge for hoodie queries", () => {
    const categories = selectSifterQualityCategories(
      "Find a heavyweight hoodie",
    );

    expect(categories.map((category) => category.name)).toContain(
      "Hoodies and sweats",
    );

    const prompt = buildSifterQualityKnowledgePrompt(
      "Find a heavyweight hoodie",
    );

    expect(prompt).toContain("400 GSM French terry hoodie");
    expect(prompt).toContain("Listing mentions 400 GSM or heavier");
    expect(prompt).not.toContain("acetate satin midi dress");
    expect(prompt).toContain("Sort by most orders or best selling");
  });

  it("keeps GSM in shirt searches while separating jeans composition checks", () => {
    const shirtPrompt = buildSifterQualityKnowledgePrompt(
      "Find a thick cotton t-shirt",
    );
    const jeansPrompt = buildSifterQualityKnowledgePrompt(
      "Premium denim jeans for men",
    );

    expect(shirtPrompt).toContain("250 GSM cotton t-shirt");
    expect(shirtPrompt).toContain(
      "Keep GSM in search terms for shirts, hoodies, and sweats",
    );
    expect(jeansPrompt).toContain("cotton denim straight leg jeans");
    expect(jeansPrompt).not.toContain(
      "Candidate search terms: 98% cotton 2% elastane straight-leg jeans",
    );
    expect(jeansPrompt).toContain("Composition is 98-99% cotton");
    expect(jeansPrompt).toContain("1-2% elastane or spandex");
  });

  it("keeps jewelry material terms searchable but still verified", () => {
    const prompt = buildSifterQualityKnowledgePrompt(
      "Gold chains that won't fade or tarnish",
    );

    expect(prompt).toContain("316L stainless steel Cuban chain");
    expect(prompt).toContain("925 sterling silver hoop earrings");
    expect(prompt).toContain("Reviews mention tarnish resistance");
  });

  it("selects multiple relevant categories for broad outfit queries", () => {
    const categories = selectSifterQualityCategories(
      "Build me a casual outfit with jeans, sneakers, and a hoodie",
    );

    expect(categories.map((category) => category.name)).toEqual(
      expect.arrayContaining(["Jeans", "Hoodies and sweats", "Sneakers"]),
    );
    expect(categories.length).toBeGreaterThanOrEqual(3);
  });

  it("uses fallback quality knowledge and reality checks for unknown queries", () => {
    const prompt = buildSifterQualityKnowledgePrompt(
      "Find something for a birthday gift",
    );

    expect(prompt).toContain("Bonus wardrobe staples");
    expect(prompt).toContain("240-300 GSM");
    expect(prompt).toContain("Reality checks:");
    expect(prompt).toContain("Keywords narrow the pool");
    expect(prompt).toContain("searchTerms are marketplace candidate-finding");
  });
});
