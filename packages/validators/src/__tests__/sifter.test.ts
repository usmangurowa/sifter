import { describe, expect, it } from "vitest";

import {
  sifterChatRequestSchema,
  sifterChatResponseDataSchema,
} from "../index";

describe("Sifter validators", () => {
  it("trims valid chat requests", () => {
    expect(
      sifterChatRequestSchema.parse({
        message: "  Find me a good hoodie  ",
      }),
    ).toEqual({ message: "Find me a good hoodie" });
  });

  it("rejects empty and oversized chat requests", () => {
    expect(() => sifterChatRequestSchema.parse({ message: "" })).toThrow();
    expect(() =>
      sifterChatRequestSchema.parse({ message: "x".repeat(501) }),
    ).toThrow();
  });

  it("accepts structured response data", () => {
    expect(
      sifterChatResponseDataSchema.parse({
        greeting: "Here are better searches.",
        categories: [
          {
            name: "Heavyweight Hoodies",
            emoji: "H",
            description: "Look for dense cotton fleece.",
            searchTerms: [
              {
                term: "400 GSM hoodie",
                why: "GSM helps filter for real fabric weight.",
              },
              {
                term: "French terry hoodie",
                why: "French terry is a checkable sweat fabric.",
              },
              {
                term: "cotton fleece hoodie",
                why: "Cotton fleece avoids thin polyester-only sweats.",
              },
            ],
            verificationChecks: [
              "Material lists cotton fleece or French terry.",
              "Fabric weight is 400 GSM or heavier.",
              "Customer photos show thick ribbing and structure.",
            ],
            proTip: "Check the weight.",
            avoid: "Avoid thin polyester fleece.",
          },
        ],
        shoppingTips: ["Read materials first.", "Check customer photos."],
        discountCodes: [
          {
            code: "SWZS7",
            description: "Men's and women's sale code.",
            platform: "SHEIN",
          },
        ],
      }),
    ).toMatchObject({ categories: [{ name: "Heavyweight Hoodies" }] });
  });

  it("rejects response categories without verification checks", () => {
    expect(() =>
      sifterChatResponseDataSchema.parse({
        greeting: "Here are better searches.",
        categories: [
          {
            name: "Jeans",
            emoji: "J",
            description: "Look for cotton denim.",
            searchTerms: [
              {
                term: "cotton denim straight leg jeans",
                why: "Broad cotton denim terms find candidates.",
              },
              {
                term: "stretch cotton jeans men",
                why: "Stretch belongs in search; exact ratios belong in checks.",
              },
              {
                term: "straight leg denim pants cotton",
                why: "Fit and cotton are both platform-searchable.",
              },
            ],
            proTip: "Open the listing details.",
            avoid: "Avoid vague cotton blend listings.",
          },
        ],
        shoppingTips: ["Read materials first.", "Check customer photos."],
        discountCodes: [],
      }),
    ).toThrow();
  });

  it("rejects response categories with empty verification checks", () => {
    expect(() =>
      sifterChatResponseDataSchema.parse({
        greeting: "Here are better searches.",
        categories: [
          {
            name: "Jeans",
            emoji: "J",
            description: "Look for cotton denim.",
            searchTerms: [
              {
                term: "cotton denim straight leg jeans",
                why: "Broad cotton denim terms find candidates.",
              },
              {
                term: "stretch cotton jeans men",
                why: "Stretch belongs in search; exact ratios belong in checks.",
              },
              {
                term: "straight leg denim pants cotton",
                why: "Fit and cotton are both platform-searchable.",
              },
            ],
            verificationChecks: [],
            proTip: "Open the listing details.",
            avoid: "Avoid vague cotton blend listings.",
          },
        ],
        shoppingTips: ["Read materials first.", "Check customer photos."],
        discountCodes: [],
      }),
    ).toThrow();
  });

  it("rejects response categories with search terms missing reasons", () => {
    expect(() =>
      sifterChatResponseDataSchema.parse({
        greeting: "Here are better searches.",
        categories: [
          {
            name: "Jeans",
            emoji: "J",
            description: "Look for cotton denim.",
            searchTerms: [
              { term: "cotton denim straight leg jeans", why: "" },
              {
                term: "stretch cotton jeans men",
                why: "Stretch belongs in search.",
              },
              {
                term: "straight leg denim pants cotton",
                why: "Fit and cotton are searchable.",
              },
            ],
            verificationChecks: [
              "Composition is 98-99% cotton.",
              "Stretch uses 1-2% elastane or spandex.",
              "Fit details confirm straight-leg cut.",
            ],
            proTip: "Open the listing details.",
            avoid: "Avoid vague cotton blend listings.",
          },
        ],
        shoppingTips: ["Read materials first.", "Check customer photos."],
        discountCodes: [],
      }),
    ).toThrow();
  });
});
