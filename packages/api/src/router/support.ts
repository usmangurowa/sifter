import { Hono } from "hono";
import { z } from "zod";

import { sendSupportEmail } from "@turbo/mail/client";

import type { AppContext } from "../context";
import { authMiddleware } from "../middleware/auth";

const app = new Hono<AppContext>().post("/", authMiddleware, async (c) => {
  const session = c.get("session");

  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json();

  const schema = z.object({
    type: z.enum(["feedback", "issue", "question", "other"]),
    message: z.string().min(10, "Message is too short"),
    metadata: z.record(z.string(), z.unknown()).optional(),
  });

  const parseResult = schema.safeParse(body);

  if (!parseResult.success) {
    return c.json({ error: parseResult.error.format() }, 400);
  }

  const { type, message, metadata } = parseResult.data;

  const result = await sendSupportEmail({
    userEmail: session.user.email,
    userId: session.user.id,
    type,
    message,
    metadata,
  });

  if (!result.success) {
    console.error("[API] Failed to send support email:", result.error);
    return c.json({ error: "Failed to send support email" }, 500);
  }

  return c.json({ success: true });
});

export default app;
