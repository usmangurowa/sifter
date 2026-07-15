import { beforeEach, describe, expect, it, vi } from "vitest";

import { createPublicApp } from "../public";

vi.mock("@turbo/ai", () => ({
  generateObject: vi.fn(),
}));

vi.mock("@turbo/ai/client", () => ({
  createGroqModel: vi.fn(() => "groq-model"),
}));

const { generateObject } = vi.mocked(await import("@turbo/ai"));

const app = createPublicApp({
  security: {
    allowedOrigins: ["http://localhost:3000"],
    rateLimit: 100,
    rateLimitWindow: 60 * 1000,
  },
});

describe("Sifter API", () => {
  beforeEach(() => {
    generateObject.mockReset();
  });

  it("rejects empty messages before provider configuration", async () => {
    const response = await app.request("/sifter/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Enter a request under 500 characters.",
    });
  });

  it("rejects oversized messages before provider configuration", async () => {
    const response = await app.request("/sifter/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "x".repeat(501) }),
    });

    expect(response.status).toBe(400);
  });

  it("returns a configuration error when GROQ_API_KEY is missing", async () => {
    const originalApiKey = process.env.GROQ_API_KEY;
    delete process.env.GROQ_API_KEY;

    const response = await app.request("/sifter/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "Find a heavyweight hoodie" }),
    });

    if (originalApiKey) {
      process.env.GROQ_API_KEY = originalApiKey;
    } else {
      delete process.env.GROQ_API_KEY;
    }

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Sifter AI is not configured yet. Add GROQ_API_KEY and try again.",
    });
  });

  it("returns structured results from the provider", async () => {
    const originalApiKey = process.env.GROQ_API_KEY;
    process.env.GROQ_API_KEY = "test-key";
    generateObject.mockResolvedValue({
      object: {
        greeting: "Here are stronger search terms.",
        categories: [
          {
            name: "Heavyweight hoodie",
            emoji: "hoodie",
            description: "Dense cotton fleece options.",
            searchTerms: [
              {
                term: "400 GSM French terry hoodie",
                why: "GSM helps filter for real fabric weight.",
              },
              {
                term: "heavyweight cotton fleece hoodie",
                why: "Cotton fleece is a checkable sweat fabric.",
              },
              {
                term: "thick winter pullover hoodie",
                why: "Thick winter wording finds warmer candidates.",
              },
            ],
            verificationChecks: [
              "Listing mentions 400 GSM or heavier.",
              "Fabric is French terry or cotton fleece.",
              "Customer photos show thick ribbing.",
            ],
            proTip: "Check product weight and customer photos.",
            avoid: "Avoid unclear polyester fleece listings.",
          },
        ],
        shoppingTips: [
          "Read the material composition.",
          "Check customer photos before buying.",
        ],
        discountCodes: [],
      },
    } as Awaited<ReturnType<typeof generateObject>>);

    const response = await app.request("/sifter/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "Find a heavyweight hoodie" }),
    });

    if (originalApiKey) {
      process.env.GROQ_API_KEY = originalApiKey;
    } else {
      delete process.env.GROQ_API_KEY;
    }

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        categories: [
          {
            searchTerms: [
              {
                term: "400 GSM French terry hoodie",
                why: "GSM helps filter for real fabric weight.",
              },
              {
                term: "heavyweight cotton fleece hoodie",
                why: "Cotton fleece is a checkable sweat fabric.",
              },
              {
                term: "thick winter pullover hoodie",
                why: "Thick winter wording finds warmer candidates.",
              },
            ],
            verificationChecks: [
              "Listing mentions 400 GSM or heavier.",
              "Fabric is French terry or cotton fleece.",
              "Customer photos show thick ribbing.",
            ],
          },
        ],
      },
    });

    const systemPrompt = generateObject.mock.calls[0]?.[0].system;
    expect(systemPrompt).toContain("Expanded quality knowledge:");
    expect(systemPrompt).toContain("400 GSM French terry hoodie");
    expect(systemPrompt).toContain("verificationChecks");
    expect(systemPrompt).toContain("term, why");
    expect(systemPrompt).toContain("Buy the fabric, not the photo");
    expect(systemPrompt).toContain("Verification checks:");
    expect(systemPrompt).not.toContain("acetate satin midi dress");
    expect(systemPrompt).toContain("Keywords narrow the pool");
  });

  it("grounds jeans prompts with broad searches and exact verification checks", async () => {
    const originalApiKey = process.env.GROQ_API_KEY;
    process.env.GROQ_API_KEY = "test-key";
    generateObject.mockResolvedValue({
      object: {
        greeting: "Here are better jeans searches.",
        categories: [
          {
            name: "Cotton denim jeans",
            emoji: "J",
            description: "Find cotton denim candidates, then verify details.",
            searchTerms: [
              {
                term: "cotton denim straight leg jeans",
                why: "Broad cotton denim terms find better candidates.",
              },
              {
                term: "stretch cotton jeans men",
                why: "Stretch is searchable; exact ratios need verification.",
              },
              {
                term: "straight leg denim pants cotton",
                why: "Fit and cotton are both platform-searchable.",
              },
            ],
            verificationChecks: [
              "Composition is 98-99% cotton.",
              "Stretch uses 1-2% elastane or spandex.",
              "Fit details confirm straight-leg cut.",
            ],
            proTip: "Open listing details before buying.",
            avoid: "Avoid vague cotton blend listings.",
          },
        ],
        shoppingTips: [
          "Read the material composition.",
          "Check customer photos before buying.",
        ],
        discountCodes: [],
      },
    } as Awaited<ReturnType<typeof generateObject>>);

    const response = await app.request("/sifter/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "Premium denim jeans for men" }),
    });

    if (originalApiKey) {
      process.env.GROQ_API_KEY = originalApiKey;
    } else {
      delete process.env.GROQ_API_KEY;
    }

    expect(response.status).toBe(200);

    const systemPrompt = generateObject.mock.calls[0]?.[0].system;
    expect(systemPrompt).toContain("cotton denim straight leg jeans");
    expect(systemPrompt).toContain("Composition is 98-99% cotton");
    expect(systemPrompt).toContain("1-2% elastane or spandex");
    expect(systemPrompt).toContain(
      "use broad cotton denim or drape-oriented search terms",
    );
  });

  it("returns a provider error when generation fails or output is invalid", async () => {
    const originalApiKey = process.env.GROQ_API_KEY;
    process.env.GROQ_API_KEY = "test-key";
    generateObject.mockRejectedValue(new Error("invalid output"));

    const response = await app.request("/sifter/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "Find a heavyweight hoodie" }),
    });

    if (originalApiKey) {
      process.env.GROQ_API_KEY = originalApiKey;
    } else {
      delete process.env.GROQ_API_KEY;
    }

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "I could not generate search terms right now. Try again.",
    });
  });
});
