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
              "400 GSM French terry hoodie",
              "heavyweight cotton fleece hoodie",
              "thick winter pullover hoodie",
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
              "400 GSM French terry hoodie",
              "heavyweight cotton fleece hoodie",
              "thick winter pullover hoodie",
            ],
          },
        ],
      },
    });
    expect(generateObject).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining("Expanded quality knowledge:"),
      }),
    );
    expect(generateObject).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining("acetate satin midi dress"),
      }),
    );
    expect(generateObject).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining("Keywords narrow the pool"),
      }),
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
