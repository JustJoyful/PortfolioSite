# DESIGN_UPDATE — Portfolio overhaul plan

> Status: **planning** · Written against commit `a5bc092` ("refine flower depth and safe framing")
> Scope: content refresh · visual design overhaul · animation optimisation · portfolio/projects redesign · mobile
> `DESIGN.md` stays as the original brief; this file replaces it as the source of truth once Phase 2 lands.

---

## 0. TL;DR

The peony is the site's identity and it stays. What changes:

1. **Engine:** drop p5.js. The flower is still drawn in Canvas2D into a small offscreen buffer, but the ASCII / dot / pixel rendering, the glitch, the glow and the stars move into **one WebGL fragment shader**. That replaces ~20–50k draw calls per frame with a single quad, and removes the per-frame GPU→CPU `loadPixels()` stall. It also cuts roughly 1 MB of minified JS.
2. **Design:** turn the ad-hoc inline styles into a real token system (type scale, colour, spacing). Bring the peony palette into the UI, fix contrast, and put your name in the hero.
3. **Work section:** replace the one-project carousel plus "coming soon" card with a featured card, a research card and a clean project table for **AxiomLM, Testcard, S.P.E.A.K. and VGC-Telemetry**. Real screenshots are the default. A build-time ASCII render of each one appears only as the loading placeholder, so the site keeps its look without getting in the way of the work. **Positioning: AI engineering and ML research, stated plainly.** Three of the four are AI systems (LLM agent + RAG, an NR-VQA study, speech + NER), and those three run fully on local hardware. **AxiomLM is the featured project**, with Testcard pinned right after it as the research highlight (§4.3).
4. **Mobile:** fix the 38vw left padding that currently squeezes mobile content into ~60% of the screen. Remove the full-page backdrop-blur. The flower stays full brightness in the hero and becomes a dimmed full-page background after it, with touch controls and a 30 fps cap.
5. **Content:** the bio still says "2nd semester". Only one project is listed. The favicon and `<title>` are still Vite defaults. The 1.2 MB portrait is shown at 160 px.

Targets: **initial JS < 120 KB gz**, **page weight < 350 KB**, **LCP < 1.5 s** on mid-tier mobile/4G, **Lighthouse mobile perf ≥ 90**, steady **60 fps desktop / ≥ 30 fps mobile**.

---

## 1. Audit — what's there now

### 1.1 Stack
React 19 · Vite 8 · Tailwind 3 · framer-motion 12.38 · p5 1.9.3. Single page: `Hero → About → Projects → Contact`, plus fixed layers (`BackgroundSketch`, `StarField`, `LeftRail`, `CustomCursor`).

### 1.2 Performance problems (ranked by impact)

| # | Where | Problem | Why it hurts |
|---|---|---|---|
| P1 | `flowerSketch.js › renderToScreen` | One draw call **per grid cell, per frame**. At `grid=4` on 1080p the flower area is ~886 px², about 49k cells. Dots and pixels go through `p.ellipse` / `p.rect` (plus `rectMode` on every call). ASCII builds a `fillStyle` string and calls `fillText` per cell. | This is the main cost: tens of thousands of Canvas2D calls every frame, all on the main thread. |
| P2 | `drawFlowerToBuffer` → `buf.loadPixels()` | Full `getImageData` readback every frame. The `willReadFrequently` fix doesn't work: `getContext('2d', {willReadFrequently:true})` runs **after** p5 has already created the context, and context attributes are locked on the first call. | Forces a GPU→CPU sync stall every frame. |
| P3 | `drawPeony3D` | About 320–380 petals depending on the variant, each drawn as 3 paths of ~30 vertices (body, sheen stroke, inner wash), plus a sort, redrawn at 60 fps. The flower turns slowly enough that 30 fps of buffer updates would look the same. | Wasted CPU. Much of the sheen detail disappears after ASCII quantisation anyway. |
| P4 | `drawBackgroundAtmosphere` | 3 full-screen radial gradients filled every frame at full viewport resolution. | Fill-rate heavy, worst on high-res phones. |
| P5 | `App.jsx` (mobile) | `backdrop-blur-md` over the **whole scrolling content column**, on top of a canvas that's animating. | On mobile GPUs this means a full-screen blur recomputed every frame. Probably the main cause of mobile jank. |
| P6 | p5 itself | p5 1.9 is ~1 MB minified (~250 KB+ gz). The sketch only uses the basic 2D API, `random`/`map`/`lerp`/`constrain`, and mouse input. | The largest single chunk in the bundle, blocking first render. |
| P7 | Loader gate | `BackgroundSketch` covers **the whole page** with a black loader until 60 warm-up frames have rendered. After that the hero tagline waits 2.4 s, the left rail 3 s and the scroll cue 4 s. | Nothing readable shows for ~1–4 s. LCP and first impression both suffer. |
| P8 | `CustomCursor` | `setPos` runs every rAF frame **forever**, so React re-renders 60×/s even when the mouse is still. Position uses `left/top` (layout), not `transform`. The loop also runs on touch devices, where the cursor is hidden by CSS. | Constant re-renders and layout work. |
| P9 | `StarField` | A second fullscreen canvas with its own rAF loop that never pauses. Not DPR-aware. The wrap check `star.y + scrollDrift % height > height` has an operator-precedence bug, so stars don't wrap the way intended. | Extra compositing layer and a second loop. |
| P10 | framer-motion reveals | Every tag, bio line and contact row animates `filter: blur(8px)` with its own `whileInView` observer. Label, Tag, fadeUp and Reveal code is copy-pasted across 3 files. | Animating `filter` is expensive, and there are dozens of observers. Full `motion` is loaded where `LazyMotion` + `m` would do. |
| P11 | Pause logic | The sketch freezes at `scrollY > 2.8vh`, but on desktop the flower is **still visible** on the left in About/Projects/Contact, so it freezes mid-frame where people can see it. Doesn't respond to `visibilitychange` or `prefers-reduced-motion`. | Looks broken where it pauses, and wastes battery where it doesn't. |
| P12 | Assets | `public/potrait.png` is **1.2 MB**, 775×1034 RGBA, shown at 160×213. | About 1.2 MB of a page that should weigh ~300 KB. |
| P13 | Fonts | Google Fonts loaded via CSS `@import` (render-blocking chain). The body is set to **Courier New**, which Android and most Linux systems don't have, so it falls back to whatever `monospace` is. `Dancing Script` is in the Tailwind config but never loaded. | Text looks different from device to device, and fonts load late. |

### 1.3 Mobile problems
- **Content is squeezed.** Every section uses `paddingLeft: clamp(1.5rem, 38vw, 48vw)`. On a 390 px phone that's **148 px** of left padding, since the preferred 38vw sits inside the clamp range. Content gets about 220 px of width.
- **Flower tilts at load.** p5's `mouseX/mouseY` start at `0,0`, so on touch devices the mouse-rotation target begins at the top-left corner (≈ −0.6 / −0.9 rad) until the user touches the screen.
- **No navigation.** `LeftRail` is `hidden md:flex`, and nothing replaces it on mobile.
- **Touch targets too small.** Project arrows are 28×28 px (minimum is 44). The project pager has no swipe.
- **Text too small and low contrast.** Lots of 9–11 px text at `white/20–/50`. Labels, footers and the "coming soon" card fail WCAG AA.
- Contact rows `truncate`, so email addresses get cut off on small screens.
- `min-h-screen` on every section leaves large empty gaps on phones.
- Hover-only states (tags turning white) don't exist on touch.
- The flower sits at 30% opacity behind a blurred scrim. It costs full price and you can barely see it.

### 1.4 Design/content debt
- **Your name isn't in the hero.** The hero shows only an 11 px tagline. The name first appears in About as a 22–36 px light heading.
- The accent colours `#e9b` / `#c77` are defined but almost never used. The UI is white at varying opacities.
- About 40 different inline `fontSize` values (9, 10, 11, 13, 14, 15 px, plus several clamps). There's no type scale.
- `DESIGN.md` promises cursive names and glass panels that were never built, so the docs and the site disagree.
- **Outdated:** bio says "currently in my 2nd semester". Only AxiomLM is listed. `©2025` is hard-coded. The "More coming soon" card makes the section look empty.
- **Template leftovers:** `src/App.css` (Vite counter/hero CSS, unused), `src/assets/{hero.png,react.svg,vite.svg}`, `public/icons.svg`, `public/favicon.svg` (Vite logo), `<title>portfolio-app</title>`, two-line README.
- **Unused deps:** `lucide-react`, `clsx`, `tailwind-merge`.
- No `<main>`, no `<nav>`, no `<h1>` in the hero, no meta description or OG tags. The 'g' key glitch is harmless; keep it, but don't advertise it.

---

## 2. Design direction

### 2.0 Tone: professional words, striking visuals
The goal is a proper portfolio that's also an attractive site people remember. Two rules, kept separate:

**Words: professional, no exceptions**
- No corny lines, slogans, puns, jokes, "in the making", "let's build something", fake shell prompts, cute status labels or playful toasts.
- State what a project does, how it does it and what it achieved. Numbers over adjectives ("SRCC 0.644 cross-dataset", "runs offline on a 6 GB GPU").
- First person only in the bio paragraph.

**Visuals: as polished and striking as we can make them**
- The generative peony leads, and the hero should look great, with its full grow-in, mode cycling and glitch transitions.
- The rest of the UI carries the same quality: confident display type, a strong grid, deep blacks with the peony accent, smooth scroll choreography, and hover/focus states with real detail (image dissolves, underline draws, subtle depth).
- Effects are allowed when they're **well-made and consistent with the flower's visual language**. They're not allowed when they read as a gag (bouncy emoji-style motion, novelty cursors, on-screen "try this" prompts).
- Reference bar: high-end studio and product sites (Linear, Vercel, Rauno Freiberg, Locomotive-style scroll work, Awwwards "Site of the Day" portfolios), with copy as clean as a research engineer's personal page.

### 2.1 Visual concept
An organic peony rendered through a machine (ASCII, dots, pixels) is the signature, and it carries through the whole page rather than staying in the hero:

- **Hero:** the flower at full scale, performing.
- **Scroll:** the flower slides into the left column and changes rendering mode at each section boundary with a short dissolve + glitch (§3.6), so moving through the site feels like one continuous piece.
- **Content:** images arrive through an ASCII → image dissolve (build-time placeholder, §4.3). Accents and highlights pick up the current peony's colour. Metadata is set in mono, headings in a confident display face, on a strict grid with generous spacing.

Status labels are plain: `Active`, `Complete`, `Hackathon`.

### 2.2 Typography (self-hosted, subset, `font-display: swap`)

| Role | Proposal | Alternative | Notes |
|---|---|---|---|
| Display (name, section titles) | **Instrument Serif** (regular) | Geist 500, tight tracking | A high-contrast serif next to the generative peony gives the editorial-meets-technical look of top studio portfolios. Large sizes only (≥ 40 px). No italics, no script faces. |
| UI / body | **Geist** 400/500 | Inter | Clean, modern and very legible. Replaces Space Grotesk, which is overused and a bit quirky for body text. |
| Mono (metadata, tags, ASCII) | **Geist Mono** | JetBrains Mono | Pairs exactly with Geist. Replaces Courier New, so it looks the same on every device and the ASCII placeholders line up. Metadata only, never body text. |

**Decided:** Instrument Serif + Geist + Geist Mono (all OFL, self-hosted). In Phase 2, build a one-page type specimen showing the hero, a project card and the table in this pairing and in the all-Geist fallback, and pick from the real render.

Type scale (fluid via `clamp`, rem-based): `xs 12 · sm 14 · base 16 · lg 20 · xl 28 · 2xl 40 · display clamp(48, 9vw, 120)`. Nothing below 12 px.

### 2.3 Colour tokens (CSS variables, mapped into Tailwind)

```
--bg            #000
--surface       #0b0a0b          (cards; replaces most glass)
--line          rgb(255 255 255 / .12)
--text          rgb(255 255 255 / .92)
--text-muted    rgb(255 255 255 / .64)   ← minimum for body copy (AA)
--text-faint    rgb(255 255 255 / .45)   ← labels ≥ 12 px only
--bloom         #ee99bb  (≈ #e9b, links/active/focus)
--bloom-deep    #cc7777  (≈ #c77, hover/pressed)
--stem          #5a8a46  (from stemC; "Active" status dot)
--ember         #ffd2eb  (c2; highlights, selection)
```
The flower's three colour variants already define the palette, so UI accents can shift subtly with whichever peony is currently blooming. That's one CSS variable updated from the engine on `startElement`.

### 2.4 Spacing & layout
- 4 px base scale (`4 8 12 16 24 32 48 64 96 128`).
- **Desktop ≥ 1024:** keep the current choreography where the flower slides left as you scroll and content sits on the right. Use a CSS grid (`grid-template-columns: 38vw 1fr`) instead of the padding hack. Max content width ~680 px.
- **Tablet 768–1023:** same as mobile: the flower becomes a dimmed full-page background after the hero (§2.7); content full width with 48 px gutters.
- **Mobile < 768:** single column, 20 px gutters, content-height sections (no `min-h-screen` except the hero).

### 2.5 Glass: use less of it
`backdrop-filter` only on small surfaces (nav bar, the featured project card) and only on desktop. Everywhere else, solid `--surface` with a 1 px `--line` border. Same look, much cheaper.

### 2.7 Flower presence: full in the hero, dimmed and integrated after it
**Desktop ≥ 1024**
- **Hero:** full brightness, centred, the performance.
- **After the hero:** the flower slides into the left column as it does now, then **dims to about 55%** brightness with a soft radial falloff. It fades out towards the content column's edge, so there's no hard boundary between flower and content. It reads as part of the page background rather than a separate panel.
- **Integration:** when an annotation is active (§3.6), the area around its anchor goes back to full brightness, so the flower "lights up" exactly where the content points. Accents in the UI follow the current peony colour.
- The dimming happens inside the shader (one `u_presence` uniform plus a falloff mask), not with CSS opacity or filters, so it costs nothing extra and stays sharp.

**Mobile & tablet < 1024**
- **Hero:** full brightness, centred, sized to `min(92vw, 70svh)`.
- **After the hero:** the flower stays as a **dimmed full-page background** (about 25–30%), centred behind the content, with a vertical scrim (shader-side gradient) where text sits so body copy keeps AA contrast.
- No `backdrop-filter` anywhere. The dimming and scrim are done in the shader, which also fixes the main source of mobile jank (§1.2 P5).
- Runs on the Low tier (§3.2): buffer 20 fps, screen 30 fps, grid ≥ 8, particles off once the hero has scrolled past.

### 2.6 Motion principles
- **One reveal primitive** (`<Reveal>`): opacity plus 12–16 px translate on an expo-out curve, staggered per group. Headings can use a line-mask reveal (each line slides up from behind a clip). That's cheap (transform only) and looks high-end. No `filter: blur`.
- **Scroll choreography:** the existing flower slide-left stays, joined by section-boundary mode changes (§3.6), a parallax offset of a few px between the flower and the content column, and a subtle progress tick in the rail.
- **Hover detail:** project images dissolve from their ASCII render into the screenshot, links get an underline that draws from left to right, and project rows lift slightly with an accent rule that slides in. All transform/opacity, 200–400 ms.
- **Glitch** belongs to the canvas and to transitions between sections. It's never applied to body text, so copy stays readable.
- No content waits on the animation. Text shows immediately, and the flower grows in behind it.
- `prefers-reduced-motion`: one static bloomed frame, no glitch, no parallax, instant reveals.

---

## 3. Animation engine rewrite ("bloom engine")

Goal: **looks the same** (or better), at a fraction of the cost.

### 3.1 Architecture

```
┌──────────────────────────────┐   texImage2D (GPU→GPU,   ┌────────────────────────────────────┐
│ Flower buffer  (Canvas2D)    │   no CPU readback)       │ Post-process (WebGL, 1 fullscreen  │
│ 320–400 px, petals/stem/leaf │ ───────────────────────► │ quad, fragment shader)             │
│ updated at 30 fps (adaptive) │                          │  • cell grid (size uniform)        │
│ (optional: OffscreenCanvas   │                          │  • mode: ascii | dots | pixels     │
│  in a Web Worker)            │                          │  • dissolve between modes (hash<t) │
└──────────────────────────────┘                          │  • glitch slices (uniform array)   │
                                                          │  • glow / halo / vignette          │
  Glyph atlas (canvas, built once at                      │  • stars (hash-based, twinkle)     │
  startup: 42 chars × brightness)  ─────────────────────► │                                    │
                                                          └────────────────────────────────────┘
  Particles + ripples: small Canvas2D overlay (≤ 60 particles) or GL points
```

- **Port the petal code from p5 to raw `CanvasRenderingContext2D`.** It's almost entirely `fill/ellipse/beginShape/vertex/bezierVertex/push/pop/translate/rotate`, which maps directly onto `ctx.*`. Replace `p.random/map/lerp/constrain` with a ~20-line `math.js`.
- **The shader replaces `renderToScreen`, `drawGlitchOverlay`, `drawBackgroundAtmosphere` and `StarField`.** Per-pixel cost stays flat whatever the grid size, so `GRID_MIN` can stay at 4 on desktop.
  - *ASCII:* sample the buffer at the cell centre → brightness → index into a glyph-atlas texture → tint with the sampled colour. Same output as today's `fillText`.
  - *Dots:* SDF circle with radius `∝ brightness` (same formula as now: `0.1 + bright·0.0033`).
  - *Pixels:* square at 0.93 of the cell.
  - *Dissolve:* the existing `hash(sx,sy) < modeT` trick works per cell in the shader.
  - *Glitch:* up to 8 slices in a `vec4[8]` uniform (y, h, offset, colourShift), applied as a UV offset plus RGB split.
- **Fallback** (no WebGL2/WebGL1, rare): Canvas2D "pixels" mode only. Downscale the buffer with `drawImage` to `renderW/grid`, then upscale with `imageSmoothingEnabled=false` (2 draw calls).
- Rotation, bloom/wilt cycle, mouse influence and the per-element colour logic **stay the same**, ported unchanged.

### 3.2 Scheduling & quality tiers

| Tier | When | Buffer | Buffer fps | Screen fps | Grid min | Particles | DPR |
|---|---|---|---|---|---|---|---|
| High | desktop, frame time < 10 ms | 400 | 30 | 60 | 4 | 100 | min(dpr, 2) |
| Medium | laptop on battery / slower | 320 | 30 | 60 | 6 | 60 | 1.5 |
| Low | mobile / frame time > 20 ms | 256 | 20 | 30 | 8 | 30 | 1 |
| Static | `prefers-reduced-motion`, `saveData`, no WebGL+slow | one bloomed frame, pixels mode | – | – | 8 | 0 | 1 |

- Start the tier from `matchMedia('(pointer:coarse)')`, `navigator.hardwareConcurrency` and `deviceMemory`. Then adjust it with a rolling frame-time average (drop a tier after 2 s over budget; go back up only after 10 s comfortably under).
- **Pause rules:** `visibilitychange` hidden → stop. Since the flower stays visible as a dimmed background on every screen size, it never freezes in view. Past the hero it drops to an **ambient mode** instead (buffer 15 fps desktop / 10 fps mobile, particles off, glitch only at section boundaries). It also pauses fully while the user is actively scroll-flinging on mobile and resumes 150 ms after scrolling stops, which keeps scrolling smooth on low-end phones.
- Initialise the pointer at the **canvas centre** (fixes the mobile tilt). Lerp back to centre after 3 s without pointer input.

### 3.3 Load sequence (no gate)
1. HTML + CSS paint the hero text immediately (name, role line, nav). **That's the LCP element.**
2. The engine module is `import()`-ed after first paint (`requestIdleCallback`, with a 300 ms timeout fallback).
3. The canvas fades in at `bloom = 0` and the flower **grows on screen**. The growing animation becomes the intro, replacing the loader. The 60-frame warm-up goes away.
4. The JD monogram loader is removed.

### 3.4 Other components
- **CustomCursor:** move it with a ref (`el.style.transform = translate3d(...)`), only run the rAF loop while the pointer moves, and don't mount it at all when `(pointer: coarse)`. Optional: grow into a ring over `[data-cursor]` cards.
- **StarField:** delete it; stars move into the shader. Fallback: a static CSS radial-gradient star layer.
- **Scroll handler in `App.jsx`:** keep the eased `translateX` choreography, but drive it with a CSS scroll-driven animation (`animation-timeline: scroll()`), with the current JS as fallback for Firefox/Safari < 26. Remove the React state update on every scroll.

### 3.5 Keeping the look honest
During Phase 1, keep the old sketch behind `?engine=legacy`. Use Playwright (already a devDependency) to take screenshots of both engines at fixed seeds/timestamps and compare them side by side. Use Chrome DevTools performance traces for frame-time before and after.

---

### 3.6 Flower ↔ page integration: annotated specimen
Right now the flower runs on its own timer and has no idea what's on the page. It should respond to where you are, but in a refined, editorial style (think labelled technical illustration), not a sci-fi HUD. No "data nodes" popping in, no blinking dots, no fake telemetry.

**The device: anchored annotations**
- A few **anchor points** sit on specific petals (fixed `(layer, index)` pairs chosen from front-facing petals). The engine projects them every frame, so they turn with the flower in 3D.
- From each anchor, a **1 px leader line** (`--line`, about 40% white) runs out to a **label** in the margin: a small mono index (`01`) plus a short, real piece of content in body text. Only one line wraps.
- **At most 3 labels at once.** They come in with a short line-draw (stroke-dashoffset, 400 ms) and fade out the same way. No bounce, no glow.
- Labels are **DOM/SVG**, not canvas, so the text renders sharp, can be selected and uses the site's type system. The engine just reports anchor screen positions (`engine.getAnchors() → [{id, x, y, visible}]`), and one rAF loop moves the overlay with `transform`.
- An anchor that rotates behind the flower (`rz > 0`) fades its label out, and it comes back when the anchor faces forward again. The anchor positions are smoothed (lerp 0.15) so the lines don't jitter.

**Section states** (driven by the IntersectionObserver that already powers the left rail)

| Section | Flower | Render | Annotations |
|---|---|---|---|
| Hero | centred, full grow-in, slow auto-rotate | cycles modes as now (the one place it performs) | none: the hero stays clean |
| About | slides left (existing choreography), **holds full bloom** | settles on **dots** | 3 labels, one per focus area: `01 AI engineering`, `02 ML research`, `03 Efficient inference`. Hovering a focus area in the text highlights its label (line goes to `--bloom`), and the reverse. |
| Work | holds bloom, rotates a little slower | settles on **pixels** | Hovering or focusing a project row draws **one** label with that project's key fact: AxiomLM → `Runs offline · 6 GB GPU`, Testcard → `SRCC 0.644 · cross-dataset`, S.P.E.A.K. → `PII masked on-device`, VGC-Telemetry → `Immutable data snapshots`. Nothing shows when no row is active. |
| Contact | holds bloom, lower density, slowest rotation | **ASCII** | none. Calm end state. |

- **Mode changes happen at section boundaries, not on a random timer** (outside the hero). Each change uses the existing per-cell dissolve, plus a single light glitch, so moving between sections feels like the figure redrawing itself.
- **The wilt → next-flower cycle runs in the hero only.** Elsewhere the flower holds full bloom, so anchors never sit on falling petals. The cycle resumes when you scroll back up.
- The accent colour (`--bloom`) follows the current flower variant (§2.3), so label highlights always match the petals.

**Mobile:** the flower is a dimmed background there (§2.7), so annotations are off. The same short facts appear as plain metadata lines in the project rows.
**Reduced motion:** labels appear without the line-draw, and anchors stay fixed on one static frame.
**Cost:** ≤ 3 projected points per frame plus ≤ 3 DOM transforms, which is negligible. The per-section render mode actually lowers average cost, since dots and pixels are cheaper than ASCII.

**Why this and not floating nodes:** the labels carry real information from the page (focus areas, project metrics), so the flower becomes part of the content rather than decoration. It also matches the display + mono type, and looks premium rather than gimmicky.

## 4. Section-by-section redesign

### 4.0 Navigation
- **Desktop:** keep the left rail (vertical name + section ticks). Make the ticks clickable links with labels on hover, and replace `©2025` with the current year.
- **Mobile:** a slim top bar (`JD` monogram left, section links or a "menu" right) that hides on scroll-down and shows on scroll-up. Optional 1 px scroll-progress line in the accent colour.

### 4.1 Hero (`#hero`)
- **Name as the headline** (`<h1>`, Instrument Serif, display size), placed beside the flower on desktop and below it on mobile.
- Under the name, two plain lines *(approved)*:
  - **AI Engineering · ML Research** (Geist, lg, `--text`)
  - B.Tech Computer Science & Engineering, Netaji Subhash Engineering College, Kolkata (sm, `--text-muted`)
- One short sentence of substance, optional: *"I build retrieval and agent systems that run on local hardware, and evaluate them carefully."* This is where local-first comes in, as a fact rather than a slogan.
- "Think. Then Build." is **dropped** from the site entirely.
- Text links, not buttons: `Work` and `Contact`. Plus GitHub/LinkedIn icons. No résumé link for now. The layout leaves a slot so it can be added later in one line (`content.js › resumeUrl`).
- No interaction hints on screen.

### 4.2 About (`#about`)
- Two columns on desktop (portrait card + bio), stacked on mobile.
- Portrait: the **real photo**, cleanly framed (thin `--line` border, no effects). Its ASCII render shows only as the placeholder until the image loads (see 4.3).
- Bio rewritten without dates that go stale. Draft, built from the résumé: *"I'm a B.Tech Computer Science student at Netaji Subhash Engineering College, Kolkata, working toward AI engineering. I build retrieval and agent systems that run on local hardware, and I run controlled experiments to find out what actually drives model performance. Outside of that, I spend time on hardware, electronics and Linux."*
- **Focus areas** (definition list, label in mono, description in body text):
  - *AI engineering*: retrieval-augmented generation, tool-using agents, evaluation. (AxiomLM, S.P.E.A.K.)
  - *ML research*: controlled comparisons of representations and model components. (Testcard)
  - *Efficient inference*: running models on consumer GPUs and CPU-only machines. (AxiomLM, Testcard, S.P.E.A.K.)
- **Currently**: one line, e.g. "Developing AxiomLM, with a focus on retrieval quality and evaluation."
- **Skills**, taken from the résumé and laid out as a two-column definition grid (label in mono, items in body text). No chip clouds:
  - *LLMs & retrieval*: Ollama, agents, tool calling, RAG, late chunking, Jina embeddings, ChromaDB, BM25
  - *ML, vision & speech*: PyTorch, DINOv2, ResNet, Mamba, NumPy, SciPy, FFmpeg, faster-whisper, MinerU
  - *Evaluation*: SRCC/PLCC/KRCC, k-fold CV, paired bootstrap, Holm correction, ablations
  - *Backend & web*: FastAPI, Pydantic, WebSockets, React, Vite, Supabase, Tailwind CSS
  - *Cloud & DevOps*: Docker, Terraform, AWS (Lambda, DynamoDB, S3), GitHub Actions, pytest, Git, Linux
  - *Languages*: Python, C, SQL, JavaScript, HTML/CSS
  - *Spoken*: English, Hindi, Bengali
- The "Evaluation" row is uncommon for a student portfolio and backs up the "ML research" line in the hero.

### 4.3 Work: the portfolio redesign (`#work`)
Replaces the paged carousel and the "coming soon" card.

**Layout**
```
02  Work

┌─ Featured ──────────────────────────────────────────────────────────────┐
│ [ screenshot: AxiomLM TUI ]  │ AxiomLM                      Active · 2026 │
│                             │ Local study assistant for STEM textbooks.  │
│                             │ Hybrid retrieval (dense + BM25), a bounded │
│                             │ tool-using agent with sandboxed symbolic   │
│                             │ math and independent verification, and a   │
│                             │ labelled evaluation harness. Runs offline  │
│                             │ on a 6 GB GPU.                             │
│                             │ Python · Ollama · RAG · SymPy · Textual    │
│                             │                    Source ↗   Demo video ▶ │
└─────────────────────────────────────────────────────────────────────────┘

┌─ Research ──────────────────────────────────────────────────────────────┐
│ Testcard: Cached features versus temporal heads for no-reference video  │
│ quality assessment                                     Complete · 2026  │
│ No temporal head (Bi-GRU, Transformer, Mamba) beat mean pooling; the    │
│ choice of backbone features moved SRCC by ~0.06. DINOv2 block-6         │
│ features: SRCC 0.824 (KoNViD-1k), 0.727 cross-dataset (LIVE-VQC).      │
│ [ figure: head comparison ]          Write-up ↗   Model ↗   Demo ↗      │
└─────────────────────────────────────────────────────────────────────────┘

  Project          Description                                   Area      Year
  ─────────────────────────────────────────────────────────────────────────────
  AxiomLM          Local RAG study assistant with a verified agent   AI        2026
  Testcard         No-reference video quality assessment study       Research  2026
  S.P.E.A.K.       Clinical dictation to de-identified FHIR records  AI        2026
  VGC-Telemetry    Tournament data API and analytics explorer        Backend   2026
  ─────────────────────────────────────────────────────────────────────────────
```
- **Featured card** (`featured: true` in `content.js`, **AxiomLM**): screenshot, title, a one-line pitch, a **one-line result**, status + year, stack chips, links. Needs a **10–15 s demo clip** (asciinema or a WebM screen capture of one question → cited answer), because visitors can't run it without Linux + Ollama. Load the clip on hover/tap only, never on page load.
- **Research card** (`pinned: 'research'`, **Testcard**): a smaller full-width card with the title, the finding in one sentence, the headline numbers and one results figure (`results/figures/head_comparison.svg`, already an SVG, so it can be recoloured to the site palette). Gives the "research" side its own visible spot without a whole section.
- **Swap in one line:** when applying somewhere research-first (e.g. a video-quality lab), set `featured` on Testcard instead and the two cards trade places.
- **Project table** for all four: one row per project, with clean columns. On desktop, hovering a row swaps the featured card to that project (cheap: just change which pre-rendered `<pre>` and text are shown). On mobile, tapping a row expands it in place (accordion: description, stack, links).
- No filter chips with four projects. Add them only past ~8.

**Project content (from the résumé and repos; this is the copy source for `content.js`)**

| | AxiomLM | Testcard | S.P.E.A.K. | VGC-Telemetry |
|---|---|---|---|---|
| One-liner | Offline, tool-using study agent for STEM textbooks on a local 4B LLM. | Controlled study of where video-quality signal lives: backbone features or temporal head. | Offline pipeline turning live clinical dictation into validated FHIR R4 records. | Tournament data API and web explorer with consistent, immutable snapshots. |
| Detail (2–3 points) | Bounded agent (≤ 6 model calls / 120 s): book search, sandboxed SymPy checked by an independent verifier. Document-vision router sends scans to GPU OCR, digital PDFs to direct extraction, with physical-page citations. Hybrid retrieval: late chunking (Jina v5) + BM25; RRF kept off after held-out evaluation. | Frozen ResNet-50 / DINOv2 features, parameter-matched mean-pool, Bi-GRU, Transformer and Mamba heads; KoNViD-1k 5-fold × 5 seeds, cross-dataset on LIVE-VQC. Paired bootstrap CIs, Holm-adjusted tests against a predeclared margin. CPU FastAPI + Docker demo, model card on Hugging Face, 250+ tests. | AudioWorklet → WebSocket → int8 faster-whisper on CPU, gated by Silero VAD. 4-layer hallucination suppression; GLiNER + regex PII masking before any text leaves the machine. AES-256-GCM records in a SQLite outbox that syncs once online. | Rate-limit-aware ingestion; immutable snapshots keep paginated reads consistent; DynamoDB single-table + versioned S3. Terraform for AWS, multi-stage Docker, GitHub Actions CI with 400+ tests; one-command local stack. |
| Key fact (annotation) | Runs offline · 6 GB GPU | SRCC 0.644 · cross-dataset | PII masked on-device | Immutable data snapshots |
| Stack | Python, PyTorch, Ollama, MinerU, Jina v5, Textual | PyTorch, DINOv2, Mamba, FFmpeg, Docker | FastAPI, React, faster-whisper, GLiNER, SQLite | FastAPI, DynamoDB, S3, Docker, Terraform, GitHub Actions |
| Status · year | Active · 2026– | Complete · 2026 | Hackathon · 2026 (SIH, Team OPSEC) | Complete · 2026 |
| Links | Source · demo video | Source · Hugging Face model · demo | Source | Source |
| Image | `docs/screenshots/tui-study.png` | `results/phase4b/browser/desktop-real-result.png` + `figures/head_comparison.svg` | UI screenshot *(needs taking)* | Meta Explorer screenshot *(needs taking)* |

AxiomLM and Testcard already have good images in their repos. S.P.E.A.K. and VGC-Telemetry each need one clean screenshot (1440×900, dark UI if possible, so it sits well on the black page).

### 4.4 Contact (`#contact`)
- Heading: **Contact**, with one plain sentence under it: "The best way to reach me is email."
- Contact rows with a small copy button next to each email (icon changes to a check for 1.5 s; no toast) and full addresses that wrap instead of truncating.
- Links: GitHub, LinkedIn, personal email, student email. The phone number from the résumé stays **off** the site (spam/scraping risk). No résumé link for now.
- Footer: `© <year> Joydeep Das` and a small "Source" link to this repo.

---

## 5. Mobile plan (summary of everything mobile-specific)

| Area | Change |
|---|---|
| Layout | Remove `paddingLeft: clamp(…38vw…)` on mobile, use grid columns on `lg+` only. 20 px gutters. Content-height sections. |
| Flower | Full brightness in the hero, then a dimmed full-page background (~25–30%) with a shader-side scrim behind text (§2.7). Low tier (buffer 20 fps, screen 30 fps, grid ≥ 8, DPR 1), particles off after the hero, short pause during fling-scrolls. |
| Touch | Drag = rotate (replaces mouse rotation), tap = ripple + glitch, two-finger = nothing (don't block scroll; `touch-action: pan-y`). Optional: `deviceorientation` tilt, opt-in only (iOS needs a permission prompt). |
| Scrim | No full-page `backdrop-blur`. Content after the hero sits on solid black, so there's nothing to blur. |
| Nav | Top bar + progress line (4.0). |
| Targets | All interactive elements ≥ 44×44 px, chips ≥ 32 px high with 8 px gaps. |
| Type | Minimum 12 px, body 16 px (no iOS zoom on inputs), body contrast ≥ `/.64`. |
| Work | Table rows → tap-to-expand accordion. Image shown above the text. |
| Safe areas | `env(safe-area-inset-*)` padding on the top bar and footer. `100svh/dvh` for the hero (already `dvh`). |
| Test matrix | iPhone SE (375), iPhone 15 (393), Pixel 7 (412), Galaxy A-series (low-end Android, the real perf test), iPad (768/1024), landscape phone. |

---

## 6. Content update checklist

- [ ] Bio: review the draft in §4.2 (built from the résumé).
- [ ] AxiomLM demo clip (10–15 s) + Testcard results figure exported for the research card.
- [ ] Projects: AxiomLM, Testcard, S.P.E.A.K., VGC-Telemetry. Copy is in the §4.3 table. Screenshots needed for S.P.E.A.K. and VGC-Telemetry (WebP, ~1440 px wide).
- [x] Skills: taken from the résumé (§4.2).
- [ ] Portrait: re-export as AVIF + WebP at 320×426 and 640×852 (target < 40 KB), rename `potrait` → `portrait`.
- [ ] `content.js` schema extended: `{ id, title, oneLiner, result, status: 'active'|'complete'|'hackathon', year, kind: 'ai'|'research'|'backend', pinned?: 'research', stack[], links: {source, demo, model}, fact, image, featured }`, plus a top-level `resumeUrl: null`.

---

## 7. Technical housekeeping

- **Delete:** `src/App.css`, `src/assets/{hero.png,react.svg,vite.svg}`, `public/icons.svg`, Vite `favicon.svg`.
- **Remove deps:** `p5`, `lucide-react`, `clsx`, `tailwind-merge`. Switch framer-motion to `LazyMotion` + `domAnimation` + `m.*`, or drop it if `<Reveal>` ends up as CSS + one shared IntersectionObserver (likely).
- **Shared primitives:** `components/ui/{SectionLabel, Reveal, Chip, ExternalLink}`, `hooks/{useReducedMotion, useInView, useQualityTier}`, `styles/tokens.css`.
- **Engine module:** `src/engine/{index.js, flower.js (petal geometry), post.frag, post.vert, glyphAtlas.js, quality.js, math.js}` behind one API: `createBloom(canvas, { tier, onReady }) → { setActive, setPointer, triggerGlitch, destroy }`.
- **Fonts:** self-hosted WOFF2 in `public/fonts`, subset to Latin, `<link rel="preload">` for the display + body files only.
- **`index.html`:** real `<title>`, meta description, `theme-color #000`, OG/Twitter card (OG image = a still frame of the peony with your name and "AI Engineering · ML Research"), new favicon (a simple pixel peony or plain JD lettermark), `<noscript>` text version.
- **Semantics/a11y:** `<header><nav><main><section aria-labelledby><footer>`. One `<h1>` (hero). The canvas gets `aria-hidden="true"`. Visible `:focus-visible` rings in `--bloom`. Skip link. Keyboard alternatives for every interaction (the 'g' shortcut stays, unadvertised).
- **Deploy:** stays on **Vercel**. Add `vercel.json` with `Cache-Control: public, max-age=31536000, immutable` for `/assets/*` and fonts, plus security headers. Keep the site a plain static Vite build (no Vercel-only features like Edge Functions or Image Optimization), so moving to Netlify, Cloudflare Pages or GitHub Pages later only means swapping the headers file. Preview deploys on every PR are the review loop for each phase.
- **CI (light):** `npm run lint && npm run build` plus a bundle-size check (`size-limit` or a simple script failing over budget) and Playwright screenshots at 375/768/1440.

---

## 8. Phases

Each phase is a separate branch/PR and leaves the site deployable.

| Phase | Deliverable | Done when |
|---|---|---|
| **0 · Baseline & cleanup** | Measure (`vite build` sizes, Lighthouse mobile+desktop, 10 s perf trace). Delete template leftovers and unused deps. Optimise portrait. Fix `<title>`/meta/favicon. Fix the mobile padding bug and remove the full-page blur. | Numbers recorded in §9. Mobile content uses full width. Page weight drops by ~1.2 MB. |
| **1 · Bloom engine** | p5 removed. Canvas2D buffer + WebGL post shader. Quality tiers, pause rules, reduced-motion static frame. No loader gate. Cursor and stars rewritten. Section states + annotation API (`getAnchors`), §3.6. `?engine=legacy` for comparison. | Visual parity signed off from screenshots. Desktop ≥ 60 fps at grid 4. Low-end Android ≥ 30 fps. Main-thread time per frame < 4 ms desktop. |
| **2 · Design system** | `tokens.css`, fonts self-hosted, type scale, shared UI primitives, `<Reveal>`. `DESIGN.md` rewritten to match. | No inline `fontSize`/`fontFamily` left in sections. Contrast passes AA. |
| **3 · Sections** | New Hero, About, Work (featured + index + ASCII placeholder script), Contact. Annotation overlay wired to About focus areas and Work rows. Desktop rail + mobile nav. | Content checklist (§6) filled. All links work. |
| **4 · Mobile pass** | Everything in §5 + touch controls on the flower. | Test matrix passes. Lighthouse mobile ≥ 90. No horizontal scroll at 320 px. |
| **5 · Polish & ship** | Glitch section-label accents, OG image, a11y audit (axe), CI checks, deploy, README rewrite with a screenshot/GIF. | Production deploy. Budgets in CI. |

Suggested order: 0 → 1 → 2 → 3 → 4 → 5. Phase 0 alone already fixes most of the visible mobile problems, so it's worth shipping straight away.

---

## 9. Budgets & measurements

| Metric | Before (Phase 0 measures) | After (Phase 5, final) | Target |
|---|---|---|---|
| Initial JS (gz) | 351.2 KB | 70.7 KB, index chunk (`npm run budget`). Met. The engine chunk (8.8 KB gz) loads on idle and is outside this figure | **< 120 KB** |
| Total transfer, first load | 1,575 KiB (Lighthouse total byte weight) | 170.2 KB (390 px, DPR 3, 5 s after load, 11 responses; text gzipped with zlib level 9, images and fonts raw). Met. Lighthouse 13.6 mobile total byte weight: 251 KiB (same method as the Before row: 1,575 KiB) | **< 350 KB** |
| LCP (mobile, 4G, mid-tier) | 3.6 s (Lighthouse mobile; desktop 1.0 s) | 2.0 s (Lighthouse 13.6 mobile, simulated slow 4G). **Miss**: above the 1.5 s target | **< 1.5 s** |
| CLS | 0 | 0 (Lighthouse 13.6, mobile and desktop). Met | **< 0.02** |
| TBT (mobile) | 300 ms | 150 ms (Lighthouse 13.6 mobile). At the limit, not below it | **< 150 ms** |
| Animation, desktop 1080p | 34.6 fps at 1440x900, headless software GL; main thread/frame not measured | Real GPU (Chromium `--use-angle=gl`, 1440x900): Intel UHD GT0.5 bloom 57.4–60.2 fps, 2.7–3.4 ms main thread/frame (after bufferFps 20) vs legacy 48.4 fps / 20 ms; RTX 3050 bloom 60.6 fps / 3.0 ms vs legacy 49.8 fps / 20.2 ms (measured before the 1.8b fixes). Headless SwiftShader (software GL only, not the desktop figure): 12 fps. Headless `npm run measure -- --label final` on 2026-11-13 (software GL, tracing on): 18.6 fps at 1440x900 | **60 fps, < 4 ms main thread/frame** |
| Animation, low-end Android | 18.6 fps (390 px, 4x CPU throttle, desktop Chromium proxy) | 30 fps, tier `low`, 390 px, 6x CPU-throttled Chromium (Phase 4 measurement, `__bloom.stats()`; not a real device, real-device check not done). Met at the substitute only. Headless `npm run measure -- --label final` on 2026-11-13 at 4x throttle: 57 fps (software GL, not comparable with the 6x figure) | **≥ 30 fps** |
| Lighthouse perf mobile / desktop | 77 / 98 | Mobile **94**, meets ≥ 90 (Lighthouse 13.6; 97 on Lighthouse 12 in Phase 4). Desktop on hardware GPU (Chromium `--use-angle=gl`, Intel UHD): **100**, TBT 0 ms, LCP 0.4 s. Met. Headless SwiftShader run: 73–74, TBT ~780 ms, a software-GL artefact, not a page problem | **≥ 90 / ≥ 98** |
| Lighthouse a11y | 93 (mobile and desktop) | 100 mobile and desktop (Lighthouse 13.6); axe 0 violations. Met | **100** |

---

## 10. Decisions log

| # | Topic | Decision |
|---|---|---|
| 1 | Type | Instrument Serif (display) + Geist (body) + Geist Mono (metadata). Confirmed from a specimen page in Phase 2 (§2.2). Confirmed from the specimen (Task 2.4): Instrument Serif display + Geist; Geist Mono only for ASCII placeholders and the glyph atlas (R2). |
| 2 | Hero wording | Name → "AI Engineering · ML Research" → degree line → one factual sentence. Approved. |
| 3 | Featured | AxiomLM featured, Testcard as the research card. Approved. |
| 4 | Tagline | "Think. Then Build." dropped. |
| 5 | Hosting | Vercel for now; build kept host-agnostic (§7). |
| 6 | Résumé link | Not on the site for now; slot reserved via `resumeUrl`. |
| 7 | Flower presence | Mobile: dimmed full-page background. Desktop: dimmed and integrated after the hero, brightening where annotations point (§2.7). |
| 8 | Engine | WebGL shader rewrite (§3). |
| 9 | Annotations | Approved, with the four project facts in §4.3. |
| 10 | Projects | Four projects. FlashDrop left out (abandoned). |
| 11 | Contact | Emails + GitHub + LinkedIn; phone number not published. |
| 12 | Internships | No "open to internships" line anywhere on the site. |

**Still open:**
- Screenshots for S.P.E.A.K. and VGC-Telemetry.
### 9.x Phase 4 mobile measurements

- Low-end Android substitute: **6x CPU-throttled Chromium, not a real device**. 390x844 mobile emulation, DPR 3, `?debug`, scrolled the whole page, `__bloom.stats()`: **30 fps, tier `low`, WebGL2**. A real device check over `chrome://inspect` is still open.
- Lighthouse 12, mobile, production build, headless Chromium (SwiftShader WebGL): **performance 97**; FCP 1.5 s, LCP 2.0 s, TBT 150 ms, CLS 0, Speed Index 2.2 s. LCP is above the 1.5 s budget on Lighthouse's simulated slow 4G; the engine loads on idle (300 ms timeout) and is not on the critical path.
