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
              "400 GSM hoodie",
              "French terry hoodie",
              "cotton fleece hoodie",
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
              "cotton denim straight leg jeans",
              "stretch cotton jeans men",
              "straight leg denim pants cotton",
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
              "cotton denim straight leg jeans",
              "stretch cotton jeans men",
              "straight leg denim pants cotton",
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
});
