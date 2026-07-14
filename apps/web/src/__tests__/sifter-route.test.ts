import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@turbo/ai", () => ({
  generateObject: vi.fn(),
}));

vi.mock("@turbo/ai/client", () => ({
  createGroqModel: vi.fn(() => "groq-model"),
}));

const { POST } = await import("../app/api/[[...route]]/route");

const postSifterChat = (body: unknown) =>
  POST(
    new Request("http://localhost:3000/api/sifter/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

describe("Sifter Next API route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("mounts /api/sifter/chat and rejects empty messages", async () => {
    const response = await postSifterChat({ message: "" });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Enter a request under 500 characters.",
    });
  });

  it("returns the Sifter configuration error through the Next route", async () => {
    vi.stubEnv("GROQ_API_KEY", "");

    const response = await postSifterChat({
      message: "Find a heavyweight hoodie",
    });

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Sifter AI is not configured yet. Add GROQ_API_KEY and try again.",
    });
  });
});
