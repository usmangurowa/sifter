import type { ContentfulStatusCode } from "hono/utils/http-status";
import { Hono } from "hono";
import { z } from "zod";

import type { AppContext } from "../context";
import { authMiddleware } from "../middleware/auth";

const githubRouter = new Hono<AppContext>();

// Schema for commit response
const CommitSchema = z.object({
  sha: z.string(),
  commit: z.object({
    author: z.object({
      name: z.string(),
      email: z.string(),
      date: z.string(),
    }),
    message: z.string(),
  }),
  html_url: z.string(),
});

// GET /github/commits
// Fetch commits for a specific repository on behalf of the user
githubRouter.get("/commits", authMiddleware, async (c) => {
  const session = c.get("session");
  // Auth middleware ensures session exists, but typescript might need help
  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const user = session.user;
  const db = c.get("db");

  const owner = c.req.query("owner");
  const repo = c.req.query("repo");
  const since = c.req.query("since");
  const until = c.req.query("until");

  if (!owner || !repo) {
    return c.json({ error: "Missing owner or repo query parameters" }, 400);
  }

  // 1. Get User's GitHub Token from database
  // We look for an account linked to this user with provider_id="github"
  const linkedAccount = await db.query.account.findFirst({
    where: (table, { and, eq }) =>
      and(eq(table.userId, user.id), eq(table.providerId, "github")),
  });

  if (!linkedAccount?.accessToken) {
    return c.json(
      { error: "No linked GitHub account found. Please sign in with GitHub." },
      401,
    );
  }

  // 2. Call GitHub API
  try {
    const params = new URLSearchParams();
    if (since) params.append("since", since);
    if (until) params.append("until", until);
    params.append("per_page", "100");

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${linkedAccount.accessToken}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Kodo-App",
        },
      },
    );

    if (!response.ok) {
      if (response.status === 401) {
        return c.json({ error: "GitHub token expired or invalid" }, 401);
      }
      if (response.status === 404) {
        return c.json({ error: "Repository not found or access denied" }, 404);
      }
      const errorText = await response.text();
      return c.json(
        { error: `GitHub API error: ${response.status} ${errorText}` },
        response.status as ContentfulStatusCode,
      );
    }

    const data = await response.json();
    // Validate/Parse partial data to ensure structure
    const commits = z.array(CommitSchema).parse(data);

    return c.json({ success: true, commits });
  } catch (error) {
    console.error("[GitHub API] Error fetching commits:", error);
    return c.json({ error: "Internal server error fetching commits" }, 500);
  }
});

export default githubRouter;
