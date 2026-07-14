# Skill: Premium UI

## When to use

Use this when designing, implementing, or auditing UI quality for web or mobile
surfaces, especially when the request mentions premium UI, polish, visual
quality, "AI slop", responsive layout issues, theme contrast, icon usage,
landing pages, dashboards, chat surfaces, or product UI refinement.

## Prerequisite context to load

- `AGENTS.md` — universal rules
- `.ai/context/tech-stack.md` — installed UI stack and icon library
- `.ai/context/conventions.md` — repository UI conventions
- `.agents/skills/premium-ui/SKILL.md` — deep premium UI workflow

## Step-by-step procedure

1. Read `.agents/skills/premium-ui/SKILL.md`.
2. Inspect the existing surface before editing: components, tokens, icons,
   motion, spacing, theme behavior, and mobile layout.
3. Prefer `@turbo/ui` primitives and HugeIcons before introducing custom
   controls or hand-drawn icons.
4. Remove generic decoration before adding new visual effects.
5. Keep repeated task surfaces calm, readable, compact, and stable across light,
   dark, desktop, and mobile.
6. Validate the touched surface with the smallest relevant type, lint, build,
   and visual checks.

## Validation checklist

- [ ] UI uses existing components, tokens, and icon libraries where practical
- [ ] Text is readable in light and dark mode
- [ ] Mobile has no clipped text, overlap, horizontal overflow, or tiny controls
- [ ] Motion does not hide critical content or create layout jank
- [ ] Commercial or affiliate UI is transparent
- [ ] `.ai/context/conventions.md` is updated if a new UI convention was added
