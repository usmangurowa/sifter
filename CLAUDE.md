# Claude Code Instructions

See `AGENTS.md` for universal agent rules and `.ai/skills/` for task-specific procedures.

## Quick Start

1. Read `AGENTS.md` before starting any task.
2. Find the matching skill in `.ai/skills/00-index.md`.
3. Read `ARCHITECTURE.md` and `ROADMAP_AI.md` before writing code.
4. Follow the step-by-step procedure in the skill file.
5. For non-trivial work, create/update a spec with `.ai/skills/feature-spec.md`.
6. Update `.ai/` files if you introduce new patterns (see `.ai/skills/update-ai-memory.md`).

## Commands

- `.claude/commands/commit.md` — Generate a commit message
- `.claude/commands/new-package.md` — Scaffold a new package
- `.claude/commands/review.md` — Review code changes
- `pnpm ai:contracts` — Refresh generated AI contract snapshots

---

## Marketing Skills

This repository also ships the full [coreyhaines31/marketingskills](https://skills.sh/coreyhaines31/marketingskills) pack in `.agents/skills/` (symlinked into `.claude/skills/` and `.github/skills/`). Use these whenever the task is marketing-related rather than engineering-related.

Start here:

- `product-marketing-context` — run this FIRST for any marketing work: it reads the codebase/product and produces the positioning, ICP, and messaging context the other skills consume.

Then pick the matching skill, e.g.: `copywriting`, `copy-editing`, `social`, `ad-creative`, `ads`, `emails`, `cold-email`, `launch`, `landing-pages` (via `cro`), `seo-audit`, `ai-seo`, `programmatic-seo`, `schema`, `content-strategy`, `marketing-ideas`, `marketing-psychology`, `image`, `video`, `analytics`, `ab-testing`, `pricing`, `paywalls`, `onboarding`, `referrals`, `churn-prevention`, `competitor-profiling`, `competitors`, `customer-research`, `positioning`, `messaging`, and more — each skill's `SKILL.md` frontmatter describes exactly when to use it.

Rules:

- For flyers/graphics use `image`; for promo videos use `video`; for social posts use `social`; for ad copy use `ad-creative`.
- Always ground marketing output in `product-marketing-context` results so copy reflects what the product actually does.
