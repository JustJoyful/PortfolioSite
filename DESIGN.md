# Design System

A black page with a generative peony in WebGL behind it, and quiet, high-contrast type in front. The system is small on purpose: a handful of tokens, one scale, one reveal. All of it lives in `src/styles/tokens.css` and `tailwind.config.js`; sections use token classes only.

## Colour

| Token (Tailwind) | Value | Use |
|---|---|---|
| `bg` | `#000` | Page |
| `surface` | `#0b0a0b` | Chips, buttons, portrait slot: a tone step instead of a border |
| `line` | `rgb(255 255 255 / .12)` | Hairline rules only (section dividers, the project rule) |
| `text` | `rgb(255 255 255 / .92)` | Headings, primary copy |
| `text-muted` | `rgb(255 255 255 / .64)` | Body copy minimum, secondary copy |
| `text-faint` | `rgb(255 255 255 / .45)` | Labels at 12 px or larger, never body copy |
| `bloom` `#ee99bb` · `bloom-deep` `#cc7777` · `stem` `#5a8a46` · `ember` `#ffd2eb` | | Flower palette; the accent follows the flower |

Contrast is WCAG AA: `text-muted` and `text` pass on `bg` and `surface`; `text-faint` is reserved for >= 12 px labels. No `text-white/NN` classes anywhere.

## Type

Self-hosted WOFF2, Latin subset, `font-display: swap`, with metric-matched fallbacks. Only the display and body files are preloaded.

| Family (Tailwind) | Face | Use |
|---|---|---|
| `font-display` | Clash Grotesk 400 (ITF Free Font License, credited in the footer) | The name, section headings and project titles; tracking -0.02 to -0.03em |
| `font-sans` | Geist 400 / 500 | All UI and body copy; metadata uses `tabular-nums` |
| `font-mono` | Geist Mono 400 | ASCII placeholders and the engine's glyph atlas only |

Scale: `xs 12 · sm 14 · base 16 · lg 20 · xl 28 · 2xl 40 · display clamp(48px, 9vw, 120px)`. Nothing is smaller than 12 px. Labels are sentence case at `text-sm` / `text-xs`; there are no tracked uppercase labels and no inline font styles.

## Layout

- Desktop (>= 1024): `38vw 1fr` grid feel, content on the right with ~680 px measure (`lg:pl-[38vw] lg:pr-12`). The flower sits in the left field.
- Tablet (768-1023) and mobile: single column, 48 px / 20 px gutters, flower as a dimmed background. Only the hero is screen-tall.
- Spacing is Tailwind's 4 px scale. Touch targets are at least 44 x 44 px; chips are at least 32 px high with 8 px gaps.
- Sections: `hero`, `about`, `work`, `contact`. The fixed `LeftRail` (`hidden lg:flex`) shows the name, section indicators and year.
- No glass panels, no blur, no cards with 1 px borders: separation comes from tone steps (`surface`) and spacing.

## Motion

- One reveal: `Reveal` (`src/components/ui/Reveal.jsx`). Elements fade up 14 px over 700 ms on `cubic-bezier(0.16, 1, 0.3, 1)`, staggered 70 ms per step; headings use a line-mask variant. Transform and opacity only.
- `prefers-reduced-motion` disables all reveals and puts the engine in its static tier. Without JS, content stays visible.
- Desktop scroll slide: the flower container moves left (-31vw) and up 12 px over the first viewport via a CSS scroll timeline; a small JS handler is the fallback when `animation-timeline` is unsupported.
- Projects use `AnimatePresence` for a 200 ms slide between cards. External links get an underline that draws in over 300 ms.
- The bloom engine cycles ASCII, dots and pixels with glitch transitions; it adapts its quality tier to frame time (`src/engine/quality.js`).

## Primitives (`src/components/ui/`)

`SectionHeading` (display heading with line reveal), `Reveal`, `ExternalLink` (new tab, `noopener noreferrer`, draw-in underline).

## Rules

1. Colour, size and family come from tokens. If a style is missing, add a token, not an inline value.
2. Copy is professional and numerical; first person only in the bio.
3. Check with `grep -rnE "fontSize|fontFamily|letterSpacing|text-white/(1|2|3|4|5)[0-9]?\b" src/sections src/components`, which must return nothing.
