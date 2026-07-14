import { describe, expect, it } from "vitest";

import {
  buildSheinSearchUrl,
  buildSifterQualityKnowledgePrompt,
  buildTemuSearchUrl,
  SIFTER_DISCOUNT_CODE_GROUPS,
  SIFTER_QUALITY_CATEGORIES,
  SIFTER_REALITY_CHECKS,
  SIFTER_SALE_KEYWORDS,
  SIFTER_SUGGESTIONS,
} from "../sifter";

describe("Sifter shared helpers", () => {
  it("builds encoded Temu search URLs", () => {
    expect(buildTemuSearchUrl("280 GSM cotton hoodie")).toBe(
      "https://www.temu.com/search_result.html?search_key=280%20GSM%20cotton%20hoodie",
    );
  });

  it("builds encoded SHEIN search URLs", () => {
    expect(buildSheinSearchUrl("925 silver earrings")).toBe(
      "https://www.shein.com/sr/index.php?keywords=925%20silver%20earrings",
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
  });

  it("keeps expanded quality knowledge available for the AI prompt", () => {
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

    const prompt = buildSifterQualityKnowledgePrompt();

    expect(prompt).toContain("400 GSM French terry hoodie");
    expect(prompt).toContain("acetate satin midi dress");
    expect(prompt).toContain("Sort by most orders or best selling");
  });
});
