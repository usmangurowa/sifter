import { afterEach, describe, expect, it, vi } from "vitest";

describe("Groq AI client", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("@ai-sdk/groq");
    vi.unstubAllEnvs();
  });

  it("creates the Groq provider with GROQ_API_KEY", async () => {
    const provider = vi.fn(() => "mock-model");
    const createGroq = vi.fn(() => provider);

    vi.stubEnv("GROQ_API_KEY", "test-groq-key");
    vi.doMock("@ai-sdk/groq", () => ({ createGroq }));

    await import("../client");

    expect(createGroq).toHaveBeenCalledWith({ apiKey: "test-groq-key" });
  });

  it("uses the default Groq model id when no model id is passed", async () => {
    const provider = vi.fn(() => "mock-model");
    const createGroq = vi.fn(() => provider);

    vi.stubEnv("GROQ_API_KEY", "test-groq-key");
    vi.doMock("@ai-sdk/groq", () => ({ createGroq }));

    const { DEFAULT_GROQ_MODEL_ID, createGroqModel } =
      await import("../client");

    expect(createGroqModel()).toBe("mock-model");
    expect(provider).toHaveBeenLastCalledWith(DEFAULT_GROQ_MODEL_ID);
    expect(DEFAULT_GROQ_MODEL_ID).toBe("openai/gpt-oss-20b");
  });
});
