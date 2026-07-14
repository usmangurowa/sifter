---
name: premium-ui
description: Design, implement, or audit high-quality web/mobile interfaces while avoiding "AI slop" patterns. Use for UI polish, landing pages, dashboards, chat/product surfaces, component styling, visual QA, responsive layout fixes, theme work, typography/color decisions, and requests that mention premium UI, better design, slop, Impeccable, pols.dev, visual quality, or making an interface feel less AI-generated.
---

# Premium UI

Use this skill to make an interface feel authored, useful, and trustworthy rather
than generated. It distills the Impeccable slop catalog and the pols.dev
anti-slop design law into a practical workflow.

## Operating Standard

Design from product purpose first. Pick one coherent visual world and make every
element serve it. Clean is the floor, not the finish.

Default posture:

1. Prefer the existing design system and accessible primitives.
2. Remove decorative defaults before adding new effects.
3. Use semantic color sparingly: headings, icons, small accents, not whole
   panels unless the surface truly needs it.
4. Keep text readable in every theme and viewport.
5. Verify visually after implementation, especially mobile.

## Before Editing

Read the current UI and answer these questions before changing code:

- What is the primary user job on this screen?
- What is the one signature detail or product-specific element?
- Which existing tokens, components, icons, motion primitives, and spacing
  patterns does the repo already use?
- Which parts feel generic, decorative, or template-like?
- Which parts fail readability, overflow, alignment, or touch ergonomics?

For Sifter-style product tools, favor a calm utility interface over a SaaS
marketing composition. The first screen can be expressive; repeated task
surfaces should be denser, quieter, and easy to scan.

## Avoid These Slop Tells

Treat these as default rejects unless the user explicitly asks for them:

- Purple/blue-purple gradient dominance, gradient text, glowy pill buttons.
- Glassmorphism everywhere, blurred orbs, bokeh blobs, clipped glow.
- Cards inside cards, repeated identical card grids, excessive shadows.
- Extreme card radius, thick side accent bars, hairline border plus wide shadow.
- Huge icons inside colored tiles when the icon is decorative, not functional.
- Eyebrow/pill badges above every hero, repeated kicker labels, "01 / 02 / 03"
  section markers as decoration.
- Fake macOS/code/dashboard windows unless they are real, populated product UI.
- Generic split hero templates with text on one side and a framed card on the
  other.
- Faint full-page graph-paper backgrounds unless crafted as a tight, intentional
  texture.
- Bouncy/elastic motion, hover lift on every card, layout-property animation.
- Entrance animations that hide content at `opacity: 0` before JS runs.
- Low-contrast text, gray text on colored backgrounds, tiny body text.
- Body text touching viewport/container edges, cramped padding, clipped labels.
- Overwritten copy: buzzwords, aphorisms, theater framing, decorative em dashes.
- Handwritten SVG icons when the project already has an icon library.

## Premium Moves

Use only the few moves that fit the product:

- One signature artifact: a real product surface, crafted mark, useful data
  object, domain-specific visual, or distinctive interaction.
- Cohesive palette: usually neutral base plus one brand hue and restrained
  semantic colors.
- Strong type hierarchy: body text readable first; display scale only where a
  true hero needs it.
- Authored microinteraction: clear hover/focus/pressed states, purposeful sheet
  transitions, subtle scroll or state motion that never hides content.
- Real specificity: concrete labels, real product terms, real data, truthful
  disclosures.
- Layered depth only when useful: overlap, bleed, and atmosphere must support
  the product, not decorate an empty page.
- Neutral, scan-friendly repeated items: cards can exist, but avoid nested
  panels and template sameness.

## Implementation Rules

- Use the repo icon library before drawing icons. In this repo, prefer
  HugeIcons for app icons and `@turbo/ui` primitives for controls.
- Use existing component variants before hand-rolling controls. Art-direct via
  classes, not by replacing accessible behavior.
- Keep radii moderate. Use large radius only for chat bubbles, sheets, or
  deliberate brand geometry.
- Keep layout stable: set widths, min-widths, wrapping, and responsive
  constraints so text, chips, buttons, and icons do not resize or overflow.
- Make touch targets at least comfortable mobile size. Do not make icon buttons
  tiny to satisfy a screenshot.
- Do not use animation as a content gate. Content must render visible without
  animation completing.
- Respect theme modes. Check light and dark text contrast independently.
- Use direct copy. A command button should say the action, not explain the
  product.
- Be transparent about commercial or affiliate content.

## Audit Checklist

Before final response, inspect the changed UI against this checklist:

- Purpose: the screen makes the primary action obvious.
- Cohesion: colors, icon style, radius, borders, typography, and motion belong
  to one system.
- Specificity: no generic placeholder visuals or vague marketing copy.
- Density: task surfaces are compact enough to scan without feeling cramped.
- Contrast: text is readable in light and dark mode.
- Mobile: no overlap, clipped text, horizontal overflow, or tiny controls.
- Cards: no unnecessary nested cards; repeated items do not look like a
  generated grid.
- Color: semantic color is local to labels/icons/accent lines unless a whole
  state surface needs it.
- Motion: no bounce, no layout-jank animation, no hidden initial content.
- Assets: images/icons render, are not broken, and are not decorative filler.
- Accessibility: headings do not skip levels, controls have labels, focus is
  visible, external/commercial links are honest.

## Validation

Run the smallest relevant checks for the touched surface:

- Type/lint/build for the app package.
- Unit tests when shared constants, URL builders, validators, or contracts
  changed.
- Browser or screenshot verification when visual layout, responsive behavior, or
  animation changed.

If a visual issue is subjective, summarize the tradeoff and show the exact files
changed.
