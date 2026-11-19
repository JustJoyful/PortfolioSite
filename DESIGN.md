# Design System

A black page with a generative peony in WebGL behind it, and quiet, high-contrast type in front. The system is small on purpose: a handful of tokens, one scale, one reveal. All of it lives in `src/styles/tokens.css` and `tailwind.config.js`; sections use token classes only.

## Colour

| Token (Tailwind) | Value | Use |
|---|---|---|
| `bg` | `#000` | Page |
| `surface` | `#0b0a0b` | Gallery arrow buttons and the picture viewer's letterbox: a tone step instead of a border |
| `text` | `rgb(255 255 255 / .92)` | Headings, primary copy |
| `text-muted` | `rgb(255 255 255 / .64)` | Body copy minimum, secondary copy |
| `text-faint` | `rgb(255 255 255 / .45)` | Labels at 12 px or larger, never body copy |
| `bloom` `#ee99bb` · `bloom-deep` `#cc7777` · `stem` `#5a8a46` · `ember` `#ffd2eb` | | Flower palette; the accent follows the flower. `bloom` (pink) is for interactive and selected states only: it fills the one primary button ("See the work", `ember` on hover), marks the current project tab and thumbnail, link hovers, the focus ring, the highlighted annotation line and the hovered focus area |
| `leaf` `#bcc583` | | Triad of `bloom`: +120° on the OKLCH hue wheel at L 0.80; facts and data only: project figures, activity grid, active status dot, mobile progress line; computed per variant in `leafFor` (`src/engine/flower.js`). The static value is used before the engine reports a variant, under reduced motion and without WebGL. Text and small marks only: no fills, borders or glows, never on anything clickable |

Contrast is WCAG AA: `text-muted` and `text` pass on `bg` and `surface`; `text-faint` is reserved for >= 12 px labels. No `text-white/NN` classes anywhere.

## Type

Self-hosted WOFF2, Latin subset, `font-display: swap`, with metric-matched fallbacks. Only the name's file (`bricolage-600-opsz96`) and the body file are preloaded. The static instances replace the variable font (about 56 KB with its two axes) and have no optical-size axis to follow.

| Family (Tailwind) | Face | Use |
|---|---|---|
| `font-display` | Bricolage Grotesque (SIL OFL 1.1, credited in the footer): 600 at optical size 96 for the name (tracking -0.045em), 500 at optical size 32 for section headings (-0.035em), project titles and sub-headings (-0.02em). Two static Latin instances, 18.9 KB each | The name, section headings and project titles |
| `font-sans` | Geist 400 / 500 | All UI and body copy; metadata uses `tabular-nums` |
| `font-mono` | Geist Mono 400 | ASCII placeholders and the engine's glyph atlas only |

Scale: `xs 12 · sm 14 · base 16 · lg 20 · xl 28 · 2xl 40 · section clamp(40px, 6vw, 88px) · hero`. `hero` is the name only: `--hero-size` in `tokens.css`, `clamp(64px, 23vw, 140px)` below 1024 and `clamp(64px, 14vw, 280px)` from 1024, line-height 0.88, so two lines are 1.76 sizes tall.  `section` the section headings, `2xl` project titles, `xl` statements and sub-headings. Running text is full `text`; `text-muted` is for metadata, labels and the stack line. Nothing is smaller than 12 px. Labels are sentence case at `text-sm` / `text-xs`; there are no tracked uppercase labels and no inline font styles.

## Layout

- Desktop (>= 1024): About and Contact use a `38vw 1fr` grid with content in the right column (`lg:pr-24`); the flower sits in the left field. Work is full width (`lg:px-24`) and the flower dims to presence 0.2 behind it (`src/engine/sections.js`).
- Work is a horizontal gallery: one project per slide on a native scroll-snap track (swipe, trackpad, tabs, arrow buttons, arrow keys). Each slide is a 16:10 viewer (the demo loop first, then the project's pictures), a six-up thumbnail strip, and the write-up in a `22rem` column. Inactive slides are `inert`.
- Hero (desktop): the name is two lines, right-aligned at 48 px from the right edge, top at 22vh. The sentence and buttons sit under it on its left edge (`--hero-x`, measured). The flower stays on the left, bigger, and **its rim covers about one-third of the J, nothing else**: the layout measures the J's box and places the bloom head from it (`src/engine/heroLayout.js`, `HEADS` per variant), never from fixed percentages.
- Hero (tablet and mobile): the name is stacked left-aligned at 20 px / 48 px gutters, 40svh from the top; the bloom head (no stem) sits above it with R = 0.45 x width and its lower rim crossing the top 20% of the first line's cap height. Buttons stay above the fold from 390 x 844.
- Tablet (768-1023) and mobile after the hero: single column, 48 px / 20 px gutters, flower as a dimmed background. Only the hero is screen-tall.
- Spacing is Tailwind's 4 px scale. Touch targets are at least 44 x 44 px; chips are at least 32 px high with 8 px gaps.
- Sections: `hero`, `about`, `work`, `contact`. Section padding is `py-24` / `lg:py-28`, so sections sit about 220 px apart on desktop. The fixed `LeftRail` (`hidden lg:flex`) shows the name, section indicators and year.
- No glass panels, no blur, no cards with 1 px borders: separation comes from tone steps (`surface`) and spacing.

## Motion

- One reveal: `Reveal` (`src/components/ui/Reveal.jsx`). Elements fade up 14 px over 700 ms on `cubic-bezier(0.16, 1, 0.3, 1)`, staggered 70 ms per step; headings use a line-mask variant. Transform and opacity only.
- `prefers-reduced-motion` disables all reveals and puts the engine in its static tier. Without JS, content stays visible.
- Desktop scroll: the engine eases the flower from the hero layout to the About/Work column layout over the first viewport (`setScroll`, `cubic-bezier(0.65, 0, 0.35, 1)`, centre and scale, so cells stay crisp; reduced motion jumps at the end). The container also drifts up 12 px via a CSS scroll timeline.
- The Work track scrolls smoothly between slides (instantly under reduced motion). Demo loops play only while at least half on screen and on the shown slide, never under reduced motion or Save-Data, and have a Pause button. External links get an underline that draws in over 300 ms.
- The bloom engine cycles ASCII, dots and pixels with glitch transitions; it adapts its quality tier to frame time (`src/engine/quality.js`).

## Layers

Back to front: **Sky** (`Sky.jsx`, fixed 2D canvas of stars, redrawn at 10 fps, z 0) -> **name** (`HeroName.jsx`, the page's only `h1`, absolute so it scrolls away, z 1) -> **flower** (`#flower`, the WebGL canvas, transparent outside the bloom and its glow, plus the embers overlay, z 2) -> **content** (`<main>`, z 10). The shader outputs premultiplied RGBA, so the pink glow tints the letters behind the flower; the stars moved out of the shader into `Sky`.

## Primitives (`src/components/ui/`)

`SectionHeading` (display heading with line reveal), `Reveal`, `ExternalLink` (new tab, `noopener noreferrer`, draw-in underline).

## Rules

1. Colour, size and family come from tokens. If a style is missing, add a token, not an inline value.
2. Copy is professional and numerical; first person only in About.
3. Pink marks what you can act on; leaf marks facts. Never both on one element.
4. Check with `grep -rnE "fontSize|fontFamily|letterSpacing|text-white/(1|2|3|4|5)[0-9]?\b" src/sections src/components`, which must return nothing.
