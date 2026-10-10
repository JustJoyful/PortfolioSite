# Portfolio Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the redesign in `DESIGN_UPDATE.md`: p5 replaced by a WebGL "bloom engine", a token-based design system, the four-project Work section, a real mobile layout, all within the stated performance budgets.

**Architecture:** Six phases, each on its own branch and PR, each leaving the site deployable (spec §8). The peony is drawn with raw Canvas2D into a small offscreen buffer, uploaded as a texture, and turned into ASCII, dots or pixels by one fragment shader. React sections read `src/data/content.js`. An annotation overlay in the DOM follows anchor points the engine projects.

**Tech Stack:** React 19, Vite 8, Tailwind 3 (no migration), raw WebGL (GLSL ES 1.00, so one source covers WebGL1 and WebGL2), `node --test` for unit tests, the installed `playwright` library for browser tests. No new runtime dependencies.

**Spec:** `DESIGN_UPDATE.md` (section numbers below, such as §3.6, refer to it).

## Global Constraints

- Budgets (§9): initial JS **< 120 KB gz** · first-load transfer **< 350 KB** · LCP **< 1.5 s** (mobile, 4G, mid-tier) · CLS **< 0.02** · TBT **< 150 ms** · Lighthouse perf **≥ 90 mobile / ≥ 98 desktop** · Lighthouse a11y **100** · **60 fps and < 4 ms main thread per frame** desktop 1080p · **≥ 30 fps** low-end Android.
- No new runtime dependencies. Dev-time `npx` one-offs (lighthouse, axe) are fine. Stack stays React 19 / Vite 8 / Tailwind 3.
- Fonts: Instrument Serif (display, ≥ 40 px only, no italics), Geist 400/500 (UI and body), Geist Mono (see Design review R2). Self-hosted WOFF2, Latin subset, `font-display: swap`, preload the display and body files only.
- Type scale: `xs 12 · sm 14 · base 16 · lg 20 · xl 28 · 2xl 40 · display clamp(48px, 9vw, 120px)`. Nothing below 12 px.
- Colour tokens, exact: `--bg #000` · `--surface #0b0a0b` · `--line rgb(255 255 255 / .12)` · `--text rgb(255 255 255 / .92)` · `--text-muted rgb(255 255 255 / .64)` (minimum for body copy) · `--text-faint rgb(255 255 255 / .45)` (labels ≥ 12 px only) · `--bloom #ee99bb` · `--bloom-deep #cc7777` · `--stem #5a8a46` · `--ember #ffd2eb`.
- Spacing: 4 px scale `4 8 12 16 24 32 48 64 96 128`. Tailwind's default spacing already is this (`1 2 3 4 6 8 12 16 24 32`), so no config.
- Breakpoints: desktop **≥ 1024** uses `grid-template-columns: 38vw 1fr`, content max ~680 px. Tablet 768–1023 and mobile < 768 are single column with the flower as a dimmed background; gutters 48 px tablet, 20 px mobile; only the hero is `min-h` screen-tall.
- Copy (§2.0): professional, numbers over adjectives, first person only in the bio. "Think. Then Build." removed. No internships line. Phone number never published. No résumé link (`resumeUrl: null`). Status labels exactly `Active`, `Complete`, `Hackathon`.
- Touch targets ≥ 44×44 px. Chips ≥ 32 px high with 8 px gaps.
- Motion: transform and opacity only, never animated `filter: blur`. `prefers-reduced-motion`: one static bloomed frame, no glitch, no parallax, instant reveals. No content waits on animation.
- The `g` key glitch stays and is never mentioned on the page.
- Deploy: plain static Vite build on Vercel. No Edge Functions or Image Optimization.
- `src/data/content.js` and every `src/engine/*.js` module except `gl.js` and `index.js` must stay importable by plain Node (no Vite-only imports), so unit tests can load them.

## Review Focus

1. **WebGL context loss** (mobile tab backgrounded, GPU reset): the flower must come back or fall back to Canvas2D, never a black screen. Test in Task 1.6.
2. **Rotation and resize** (phone turned to landscape, window dragged to a different-DPR monitor): the canvas re-sizes, the flower stays centred, anchors stay on their petals. Test in Task 1.6.
3. **Fonts fail or arrive late** (offline, 404): the hero title is still readable and layout shift stays < 0.02. Test in Task 2.1.
4. **Clipboard unavailable or denied** (plain http, older iOS): the copy button must not show the success check. Test in Task 3.6.
5. **Project image missing** (S.P.E.A.K./VGC screenshots not taken yet, or a 404): the card keeps its ASCII placeholder at the same height, never a broken-image icon. Test in Task 3.5.

## Design review (taste and frontend-design checks against the brief)

The brief fixes the direction, type, palette and section layout, so the taste skill's direction draw is skipped (its own "existing brand" rule). The skill's house rules were checked against the brief. Where they conflict, the brief's **decided** items stand unless you accept a recommendation below. The plan's tasks use the **recommended** column. Each row is one line to revert.

| # | Brief says | Recommendation (used in tasks) | Why |
|---|---|---|---|
| R1 | Section label `02 Work`; annotation labels `01 AI engineering` | Drop the numbers. Section heading is just "Work"; annotation is the focus-area name | Neither is a sequence, so the number encodes nothing. It is the commonest generated-page tell. |
| R2 | Geist Mono for all metadata, tags and skill labels | Geist Mono **only** for the ASCII placeholders and the canvas glyph atlas, where fixed-width alignment is real. Metadata in Geist with `font-variant-numeric: tabular-nums` | Mono labels read as costume. Leaves two faces in the visible UI. **Reverses decision #1 in part, so it needs your yes.** |
| R3 | Glass allowed on the nav bar and featured card (desktop) | No `backdrop-filter` anywhere; solid `--surface` | Same look on black, zero GPU cost, one rule everywhere. |
| R4 | 1 px `--line` border on cards and portrait | Separate surfaces by the `--bg` → `--surface` tone step. Keep 1 px lines only where they carry information: annotation leader lines and the project table's rows | Borders around everything flatten the hierarchy. |
| R5 | Phase 5: "glitch section-label accents" | Skip | §2.6 says glitch belongs to the canvas, never to text. This would be an ornament on headings. |
| R6 | "Featured" / "Research" frame titles in the §4.3 wireframe | Not rendered as labels. Position and size say which is featured; the research title already says "study" | Labels above content are an eyebrow by another name. |

The taste inspector (`~/.claude/skills/design-taste-frontend/scripts/inspect.mjs`) is a gate from Phase 3 on, run with `--allow hairline` (leader lines and the table are deliberate). Add `--allow mono` only if R2 is declined.

---

## Shared test harness (built in Task 0.1, used by every phase)

- Unit: `tests/unit/*.test.js`, run with `npm test` → `node --test "tests/unit/**/*.test.js"`.
- Browser: `tests/e2e/*.test.js`, run with `npm run test:e2e` → `vite build && node --test --test-concurrency=1 "tests/e2e/**/*.test.js"`.
- `tests/e2e/harness.js` exports:
  - `startPreview() → Promise<{ url: string, close(): Promise<void> }>`, using Vite's `preview()` API on a free port.
  - `openPage(url, { width, height = 900, reducedMotion = false, mobile = false }) → Promise<{ page, browser }>`. Chromium from `playwright`; `mobile` sets `isMobile` + `hasTouch`.
- Engine debug hook (from Task 1.6): when the URL has `?debug`, `window.__bloom = engine`. Tests read `__bloom.stats()`.
- `.measure/` and `.parity/` hold local measurement output and are git-ignored.

---

## Phase 0: Baseline and cleanup (branch `phase-0-baseline`)

### Task 0.0: Fix the uncommitted sketch bug and commit the WIP

**Files:**
- Modify: `src/sketch/flowerSketch.js:866,871`

The working tree replaced `gEff` with an undefined `renderStep` in the dots and pixels branches of `renderToScreen`, so those modes throw a ReferenceError on every frame.

- [ ] **Step 1:** Run `npm run dev -- --port 5174`, then `node get_logs.cjs` once the sketch has cycled to dots (about 10 s). Expected: `ReferenceError: renderStep is not defined`.
- [ ] **Step 2:** Replace `renderStep` with `gEff` on lines 866 and 871. Keep the rest of the WIP as it is.
- [ ] **Step 3:** Re-run `node get_logs.cjs`. Expected: no ReferenceError. `npm run lint` passes.
- [ ] **Step 4:** Commit:
```bash
git add src/sketch/flowerSketch.js DESIGN_UPDATE.md docs/superpowers/plans/
git commit -m "fix(sketch): size dots and pixels by gEff; add overhaul spec and plan"
```

### Task 0.1: Test harness, budget script, baseline measurements

**Files:**
- Create: `tests/e2e/harness.js`, `tests/e2e/smoke.test.js`, `scripts/check-budget.mjs`, `scripts/measure.mjs`
- Modify: `package.json` (scripts `test`, `test:e2e`, `budget`, `measure`), `.gitignore` (`.measure/`, `.parity/`, `.taste-skill/`), `DESIGN_UPDATE.md` §9 "Before" column

**Interfaces:**
- Produces: the harness above. `node scripts/check-budget.mjs` prints `initial JS gz` (sum of gzipped JS that `dist/index.html` loads through `<script>` and `modulepreload`) and exits 1 when it is ≥ 120 KB. `node scripts/measure.mjs --label <name>` prints JSON `{ fps1440, fps390Throttled, longTasks }`: fps is counted from rAF over 5 s, the 390 run uses CDP `Emulation.setCPUThrottlingRate { rate: 4 }`, and a 10 s Chromium trace is written to `.measure/trace-<label>.json`.

- [ ] **Step 1:** Write `tests/e2e/smoke.test.js`: `test('page loads without console errors')`. Collect `page.on('pageerror')` and `console` type `error` during 12 s at width 1440, then `assert.deepEqual(errors, [])`. The 12 s covers a full mode cycle, which would have caught Task 0.0.
- [ ] **Step 2:** Implement `harness.js`. Run `npm run test:e2e`. Expected: PASS.
- [ ] **Step 3:** Implement `check-budget.mjs` and `measure.mjs`. Run `npm run budget`. Expected: FAIL (exit 1), because p5 is still bundled. Record the number.
- [ ] **Step 4:** Lighthouse baseline: `CHROME_PATH=$(node -e "import('playwright').then(m=>console.log(m.chromium.executablePath()))") npx -y lighthouse@12 <preview url> --quiet --chrome-flags=--headless=new --output=json --output-path=.measure/lh-mobile-before.json`, then the same with `--preset=desktop`. Run `npm run measure -- --label before`.
- [ ] **Step 5:** Fill §9's "Before" column with the measured JS gz, transfer, LCP, CLS, TBT, Lighthouse scores and fps. Commit: `chore: test harness, budget script, baseline numbers`.

### Task 0.2: Delete template leftovers and unused dependencies

**Files:**
- Delete: `src/App.css`, `src/assets/hero.png`, `src/assets/react.svg`, `src/assets/vite.svg`, `public/icons.svg`
- Modify: `package.json` (remove `lucide-react`, `clsx`, `tailwind-merge`), `tailwind.config.js` (remove the `cursive` font family)

- [ ] **Step 1:** `grep -rnE "lucide-react|clsx|tailwind-merge|App\.css|assets/(hero|react|vite)|icons\.svg|font-cursive" src index.html`. Expected: no output. If anything matches, remove that use first.
- [ ] **Step 2:** Delete the files. Run `npm uninstall lucide-react clsx tailwind-merge`.
- [ ] **Step 3:** `npm run lint && npm run build && npm run test:e2e`. Expected: all pass. Commit: `chore: remove template leftovers and unused deps`.

### Task 0.3: Optimise and rename the portrait

**Files:**
- Create: `public/portrait-320.avif`, `public/portrait-640.avif`, `public/portrait-320.webp`, `public/portrait-640.webp`, `tests/unit/content.test.js`
- Delete: `public/potrait.png`
- Modify: `src/data/content.js` (`about.portrait`), `src/sections/About.jsx` (the `<img>` at ~line 73 becomes `<picture>`)

**Interfaces:**
- Produces: `about.portrait = { avif: '/portrait-320.avif 320w, /portrait-640.avif 640w', webp: '/portrait-320.webp 320w, /portrait-640.webp 640w', src: '/portrait-640.webp', width: 320, height: 426, alt: 'Portrait of Joydeep Das' }`. Phase 3 keeps this shape.

- [ ] **Step 1:** Failing test `test('portrait files exist and are each under 40 KB')`. For every URL in `avif` and `webp`, `statSync('public' + path).size < 40_000`.
- [ ] **Step 2:** `npm test`. Expected: FAIL (ENOENT).
- [ ] **Step 3:** Encode: `magick public/potrait.png -resize 320x426^ -gravity center -extent 320x426 -quality 70 public/portrait-320.webp`, the same at 640x852, and the AVIF versions with `-quality 50`. If a file is over 40 KB, lower the quality. Delete `potrait.png`.
- [ ] **Step 4:** Render `<picture>` with an AVIF `<source>`, a WebP `<source>`, `sizes="160px"` (the current display size), and `width`/`height` attributes so it doesn't shift the layout. `npm test`. Expected: PASS. Commit: `perf: portrait as 320/640 AVIF+WebP`.

### Task 0.4: Title, meta, favicon, noscript

**Files:**
- Modify: `index.html`, `public/favicon.svg` (replaced)
- Test: `tests/e2e/meta.test.js`

- [ ] **Step 1:** Failing test. `document.title === 'Joydeep Das: AI Engineering and ML Research'`. `meta[name=description]` content is non-empty and ≤ 160 chars. `meta[name=theme-color]` is `#000000`. Fetching `/favicon.svg` returns text that does not contain `vite`.
- [ ] **Step 2:** Implement. Description: "Joydeep Das: AI engineering and ML research. Local-first retrieval and agent systems, and controlled studies of video quality models." Favicon: a plain `JD` lettermark SVG (`#ee99bb` on black). Add `<noscript>`: name, "AI Engineering · ML Research", and links to GitHub, LinkedIn and email. OG tags wait for Task 5.1, which makes the image.
- [ ] **Step 3:** `npm run test:e2e`. Expected: PASS. Commit: `feat: real title, meta, favicon, noscript`.

### Task 0.5: Mobile full width, no full-page blur

**Files:**
- Modify: `src/sections/About.jsx:41,45`, `src/sections/Projects.jsx:79,83`, `src/sections/Contact.jsx:56,60`, `src/App.jsx:22,52,66`
- Test: `tests/e2e/layout.test.js`

- [ ] **Step 1:** Failing tests, each at widths 320, 390 and 768:
  - `no horizontal scroll`: `document.documentElement.scrollWidth <= innerWidth`.
  - `content uses full width`: for `#about`, `#projects` and `#contact`, the first child's `getBoundingClientRect().left <= 48` and `.width >= innerWidth - 96`.
  - `no backdrop blur on content`: every element under the content column has computed `backdropFilter === 'none'`.
- [ ] **Step 2:** `npm run test:e2e`. Expected: FAIL (left is 148 at 390).
- [ ] **Step 3:** Replace the three `style={{ paddingLeft: 'clamp(1.5rem, 38vw, 48vw)' }}` with `className="px-5 md:px-12 lg:pl-[38vw] lg:pr-12"`. Change `min-h-screen` on those sections to `lg:min-h-screen`. In `App.jsx`, `window.innerWidth < 768` becomes `< 1024`, `md:opacity-100` becomes `lg:opacity-100`, and the content wrapper becomes `bg-black/40 lg:bg-transparent` (no `backdrop-blur-*`).
- [ ] **Step 4:** `npm run test:e2e`, then `npm run measure -- --label phase0`. Expected: PASS. Commit: `fix(mobile): full-width content, drop full-page blur`. Open the Phase 0 PR.

---

## Phase 1: Bloom engine (branch `phase-1-bloom-engine`)

### Task 1.1: `math.js`

**Files:** Create `src/engine/math.js`, `tests/unit/math.test.js`

**Interfaces:**
- Produces: `rng(seed: number) → () => number` (mulberry32, [0,1)) · `random(r, a, b)` · `lerp(a, b, t)` · `map(v, a1, b1, a2, b2)` · `constrain(v, lo, hi)` · `cellHash(sx, sy) → number` = `((sx*73 + sy*137) & 0xFF) * 0.00392` · `easeInOutCubic(x)` · `easeOutQuart(x)` · `bloomCurve(t)` (ported verbatim from `flowerSketch.js:67-80`) · `BLOOM_DURATION = 5.0`.

- [ ] **Step 1:** Failing tests. Same seed gives the same first 10 values; different seeds differ. `bloomCurve(0) === 0`; `bloomCurve(0.45) ≈ 0.18`, `bloomCurve(0.75) ≈ 0.80` (±1e-9); `bloomCurve(1) === 1`; non-decreasing over 1000 samples. `cellHash(10, 20)` equals the inline legacy formula.
- [ ] **Step 2:** `npm test`. Expected: FAIL (module not found).
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `npm test`. Expected: PASS. Commit: `feat(engine): math helpers`.

### Task 1.2: `flower.js`, the petal geometry on raw Canvas2D

**Files:** Create `src/engine/flower.js`, `tests/unit/flower.test.js`

**Interfaces:**
- Consumes: `math.js`.
- Produces:
  - `VARIANTS`: the 3 objects from `flowerSketch.js:106-108`, unchanged.
  - `drawFlower(ctx, variant, state)`, where `state = { bloom, wilt, rotX, rotY, rotZ, brightBoost, rand }`. It draws into the square `ctx.canvas` in the legacy virtual 800×800 space, scaled by `FLOWER_BUFFER_SCALE * size / 400` (`FLOWER_BUFFER_SCALE = 0.48`), so a 400 px buffer matches legacy exactly.
  - `ANCHORS = { ai, research, inference, project }`, each `{ layer, index }`, chosen from front-facing petals of the outer two layers.
  - `projectAnchor(variant, anchor, state, size) → { x, y, z }` in buffer pixels. `z > 0` means the anchor is behind the flower.

Port `drawFlowerToBuffer`, `drawStem`, `drawLeaf`, `rot3D` and `drawPeony3D` (`flowerSketch.js:357-675`). Rotation goes through `state` instead of closure variables. Mapping: `p.ellipse(x,y,w,h)` → `ctx.ellipse(x,y,w/2,h/2,0,0,2π)`; `beginShape/vertex/endShape(CLOSE)` → `beginPath/moveTo/lineTo/closePath`; `bezierVertex` → `bezierCurveTo`; p5 0–255 alpha → `/255` in `rgba()`; `push/pop` → `save/restore`; `p.random` → `random(state.rand, …)`.

- [ ] **Step 1:** Failing tests, using a recording stub ctx (a `Proxy` that logs method calls and accepts any property set, with `canvas: { width: 400, height: 400 }`):
  - `drawFlower` does not throw for bloom ∈ {0, 0.5, 1} × wilt ∈ {0, 1} on each variant.
  - At bloom 1, `fill` is called at least `layers * petalsPerLayer` times.
  - `projectAnchor` at zero rotation gives `z <= 0` for every `ANCHORS` entry, and gives `z > 0` after `rotY += Math.PI`.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Port.
- [ ] **Step 4:** `npm test`. Expected: PASS. Commit: `feat(engine): port peony geometry to Canvas2D`.

### Task 1.3: `glyphAtlas.js`

**Files:** Create `src/engine/glyphAtlas.js`, `tests/unit/glyphAtlas.test.js`

**Interfaces:**
- Produces: `GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*'` (42) · `glyphIndex(bright, sx, sy)` = `((bright >> 2) + ((sx*7 + sy*13) >> 3)) % 42`, the legacy formula from `renderToScreen` · `buildGlyphAtlas(cellPx = 32, font = "'Geist Mono', 'Courier New', monospace") → HTMLCanvasElement` (42 cells in one row, white glyphs on transparent; browser only). `index.js` builds it at start and rebuilds it once on `document.fonts.ready`.

- [ ] **Step 1:** Failing test: `glyphIndex` matches the inline legacy formula for 1,000 random `(bright, sx, sy)` triples; the result is always in `[0, 42)`.
- [ ] **Step 2–4:** Implement, `npm test` PASS, commit `feat(engine): glyph atlas`.

### Task 1.4: Post-process shader and `gl.js`

**Files:** Create `src/engine/post.vert`, `src/engine/post.frag`, `src/engine/gl.js`

**Interfaces:**
- Consumes: `cellHash` and `glyphIndex` (the shader mirrors both formulas exactly).
- Produces: `createPost(canvas) → null | { backend: 'webgl2'|'webgl', resize(w, h, dpr), uploadFlower(srcCanvas), uploadAtlas(atlasCanvas), draw(u), onLost(cb), destroy() }`. It returns `null` when neither context is available. Shaders are imported with `?raw`.
- Uniform object `u` (the names are the contract with Task 1.6): `rect` [ox, oy, w, h] in px · `grid` · `mode`, `prevMode` (0 ascii, 1 dots, 2 pixels) · `modeT` · `glitch` (8 × vec4: y, h, offset, colourShift) · `glitchCount` · `glow` · `time` · `presence` (1 hero, 0.55 desktop after hero, 0.27 below 1024) · `falloffX` (px, where the radial dim reaches 0, i.e. the content column's left edge) · `scrim` (0/1, the vertical scrim behind text below 1024) · `highlight` [x, y, radius] (radius 0 = off) · `ripples` (4 × vec4: x, y, radius, life) · `stars` (0/1).

Shader rules, copied from `renderToScreen`: skip the cell when `r+g+b < 12/255`; brightness `0.299r + 0.587g + 0.114b` (0–255 scale); the ASCII cell is `max(grid, 6)` once the ASCII mode has settled; glyph size `1.1·cell·(0.4 + bright·0.004)`; dot diameter `cell·(0.1 + bright·0.0033)` as an SDF circle; pixel squares `0.93·cell`; dissolve picks `mode` when `cellHash < modeT`, otherwise `prevMode`. The three radial gradients from `drawBackgroundAtmosphere` (`flowerSketch.js:676-708`) become one analytic radial falloff scaled by `glow`. Stars are hash-based with a slow twinkle, which replaces `StarField`.

- [ ] **Step 1:** Write the shaders and `gl.js`. There is no Node-side test, because a GL context doesn't exist outside the browser; Task 1.6's e2e tests cover it.
- [ ] **Step 2:** Commit `feat(engine): post-process shader`.

### Task 1.5: `quality.js`

**Files:** Create `src/engine/quality.js`, `tests/unit/quality.test.js`

**Interfaces:**
- Produces:
  - `TIERS`, exactly §3.2: `high { buffer: 400, bufferFps: 30, screenFps: 60, gridMin: 4, particles: 100, dpr: 2, budgetMs: 10 }` · `medium { 320, 30, 60, 6, 60, 1.5, 16.7 }` · `low { 256, 20, 30, 8, 30, 1, 33.3 }` · `static { 256, 0, 0, 8, 0, 1 }`.
  - `initialTier({ coarse, cores, memory, reducedMotion, saveData, webgl }) → 'high'|'medium'|'low'|'static'`.
  - `createGovernor(tier) → { sample(frameMs, nowMs) → tier }`.

Rules: `reducedMotion || saveData` → static; `!webgl && cores <= 4` → static; `coarse` → low; `cores <= 4 || memory <= 4` → medium; otherwise high. The governor keeps a rolling 1 s average. It drops one tier after 2 s continuously above the tier's `budgetMs`. It rises one tier after 10 s continuously below `0.7 ×` the higher tier's `budgetMs`. It never enters or leaves `static`.

- [ ] **Step 1:** Failing tests: one per `initialTier` rule; `sample(14, t)` every 16 ms for 2.1 s drops high → medium; 1.9 s does not; recovery takes 10 s at 5 ms; `static` never changes.
- [ ] **Step 2–4:** Implement, `npm test` PASS, commit `feat(engine): quality tiers and governor`.

### Task 1.6: `index.js`, `createBloom`

**Files:**
- Create: `src/engine/index.js`, `src/engine/particles.js`, `tests/unit/sections.test.js`, `tests/e2e/engine.test.js`
- Modify: `src/components/BackgroundSketch.jsx`. Temporarily, `?engine=bloom` mounts `createBloom` instead of p5; Task 1.7 makes bloom the default.

**Interfaces:**
- Consumes: Tasks 1.1–1.5.
- Produces:
  - `createBloom(canvas, { tier?, seed?, onReady?, onVariant? }) → engine`, where `engine = { setActive(bool), setSection('hero'|'about'|'work'|'contact'), setPointer(x, y, { down? }), triggerGlitch(), setHighlight(anchorId | null), getAnchors() → [{ id, x, y, visible }], stats() → { backend: 'webgl2'|'webgl'|'canvas2d', tier, frames, fps, mode, phase, width, height }, destroy() }`.
  - `onVariant(variant)` fires on every `startElement`.
  - `sectionState(section, { desktop }) → { mode: 'cycle'|'dots'|'pixels'|'ascii', rotSpeed, cycle, presence, gridBias, scrim }` (pure, exported).

Behaviour to port from `p.draw` (`flowerSketch.js:159-300`): the mode timer, density oscillation, glitch timers, pointer influence, and the phases `growing → interactive → wilting → waiting` over the 3 variants. New behaviour:
- **One rAF loop.** The buffer redraws at the tier's `bufferFps` (15 desktop / 10 mobile once past the hero). The screen draws at `screenFps`.
- **Sections, per §3.6.** Hero is `cycle` with presence 1. About is `dots`, Work is `pixels` with `rotSpeed` 0.7, Contact is `ascii` with `rotSpeed` 0.5 and `gridBias` +2. Every section after the hero has presence 0.55 on desktop and 0.27 with `scrim: 1` when not desktop. The wilt cycle runs only in the hero; other sections hold bloom 1. Each section change runs one dissolve plus one light glitch.
- **Pause.** On `visibilitychange` hidden, stop the loop. With a coarse pointer, also stop while scrolling and resume 150 ms after the last scroll event.
- **Pointer.** It starts at canvas centre and eases back to centre after 3 s without input. Listen on `window`, and ignore events whose target is inside `a, button, input, summary`.
- **Ripples** go to the `ripples` uniform. **Particles** go to `particles.js`, an overlay canvas at DPR 1 capped at the tier's `particles`, cleared only if the previous frame drew some.
- **`getAnchors()`** lerps positions by 0.15 per frame and returns `visible: false` when `z > 0`.
- **Static tier.** Draw one frame at bloom 1 in pixels mode, then stop.
- **No WebGL.** Use the Canvas2D fallback: pixels mode only, `drawImage` the buffer down to `renderW / grid` and back up with `imageSmoothingEnabled = false`.
- **Context loss.** On `webglcontextlost`, switch to the Canvas2D fallback. On `webglcontextrestored`, rebuild the post stage.
- **Sizing.** On resize, re-size to `innerWidth × innerHeight × min(devicePixelRatio, tier.dpr)`, debounced 150 ms. Also listen for `matchMedia('(resolution: <current>dppx)')` changes.
- **`?debug`** sets `window.__bloom`. **`seed`** seeds `rng`, so parity screenshots repeat.

- [ ] **Step 1:** Failing unit test: `sectionState` returns the table above for all 4 sections × `desktop` true/false.
- [ ] **Step 2:** Failing e2e tests on `?engine=bloom&debug`:
  - `renders with WebGL`: `backend` is `'webgl2'` or `'webgl'`, and `frames` grows over 500 ms.
  - `setSection('about')` → `stats().mode === 'dots'` within 1.5 s.
  - `hidden tab stops frames`: dispatch `visibilitychange` with a stubbed `document.visibilityState = 'hidden'`, then `frames` stays the same for 500 ms.
  - `reduced motion is static`: `tier === 'static'` and `frames <= 2` after 1 s.
  - `context loss falls back` (Review Focus 1): `getExtension('WEBGL_lose_context').loseContext()` on the canvas's context, then within 1 s `frames` keeps growing and `backend` is `'canvas2d'`, and it goes back to WebGL after `restoreContext()`.
  - `rotation re-sizes` (Review Focus 2): `setViewportSize` 390×844 → 844×390, then within 500 ms `stats().width === 844`, and every `getAnchors()` point with `visible: true` lies inside the viewport.
- [ ] **Step 3:** Implement. Run `npm test && npm run test:e2e`. Expected: PASS. Commit `feat(engine): createBloom scheduler, sections, fallbacks`.

### Task 1.7: Wire the engine into the app

**Files:**
- Modify: `src/components/BackgroundSketch.jsx` (rewrite), `src/App.jsx`, `src/components/LeftRail.jsx`, `src/components/CustomCursor.jsx` (rewrite), `src/sections/Hero.jsx`, `src/sections/Projects.jsx` (`id="projects"` → `id="work"`), `src/index.css`, `tests/e2e/layout.test.js` (`#projects` → `#work`)
- Create: `src/hooks/useActiveSection.js`, `src/engine/handle.js`
- Delete: `src/components/StarField.jsx`
- Test: `tests/e2e/app.test.js`

**Interfaces:**
- Produces:
  - `useActiveSection(ids: string[]) → string`: one shared `IntersectionObserver` at threshold 0.4. LeftRail and App both use it. App calls `engine.setSection` when it changes.
  - `handle.js` exports `setEngine(engine)` and `getEngine() → engine | null`. Phase 3's annotation overlay reads the engine from here.

Changes:
- **`BackgroundSketch`** renders `<canvas aria-hidden="true" style="touch-action: pan-y">` straight away. Its opacity goes 0 → 1 over 600 ms after `onReady`. The engine loads with `import('../engine/index.js')` inside `requestIdleCallback(…, { timeout: 300 })`. `?engine=legacy` imports `p5` and `../sketch/flowerSketch.js` instead, so p5 becomes a lazy chunk.
- **Removed:** the loader and monogram, the framer `delay`s in Hero (2.4 s, 4 s) and LeftRail (3 s), and the `sketchPaused` state in App.
- **Scroll choreography.** `@supports (animation-timeline: scroll())` runs a `translateX(0 → -31vw)` keyframe over `animation-range: 0 100vh` with `cubic-bezier(0.65, 0, 0.35, 1)`, at ≥ 1024 only. Otherwise the existing JS handler runs, with no React state. The same timeline adds the §2.6 parallax: the flower container also moves `translateY(0 → -12px)` per 100vh. Reduced motion turns both off.
- **`CustomCursor`** only mounts when `matchMedia('(pointer: fine)').matches`. It moves with `el.style.transform = translate3d(...)` and runs rAF only until the eased position settles after a `pointermove`.

- [ ] **Step 1:** Failing e2e tests:
  - `hero text visible immediately`: hero text has opacity 1 at 300 ms after `domcontentloaded`.
  - `no loader`: no `fixed inset-0 z-50` element.
  - `canvas is aria-hidden`.
  - `no cursor on touch`: `.custom-cursor` count is 0 with `mobile: true`.
  - `p5 not in initial bundle`: no initial JS response body contains `p5.js`.
  - `legacy route still works`: `?engine=legacy` throws no `pageerror` in 5 s.
- [ ] **Step 2:** Implement. Run `npm run test:e2e && npm run budget`. Expected: e2e PASS; budget prints the new initial JS gz. Commit `feat: bloom engine replaces p5 at runtime; legacy behind ?engine=legacy`.

### Task 1.8: Parity and performance sign-off

**Files:** Create `scripts/compare-engines.mjs`

- [ ] **Step 1:** Implement. It opens `?engine=legacy` and `?engine=bloom&seed=7` at 1440×900 and 390×844, and screenshots both at 2 s, 5 s and 9 s into `.parity/<engine>-<width>-<t>.png`. Bloom is seeded. Legacy uses `Math.random`, so the comparison is about the same look, not identical pixels.
- [ ] **Step 2:** Run it. **Human gate:** you compare the pairs (mode, density, colour, glow, stars). Visual parity must be signed off before Task 1.9.
- [ ] **Step 3:** `npm run measure -- --label phase1`. Expected: `fps1440 ≥ 58`, and main thread < 4 ms per frame in the trace (DevTools → Performance → Load the trace). Real low-end Android over `chrome://inspect` with `?debug`: `__bloom.stats().fps >= 30`. Record both in §9.

### Task 1.9: Remove p5 and the legacy sketch

**Files:** Delete `src/sketch/flowerSketch.js`. Modify `src/components/BackgroundSketch.jsx` (drop the legacy branch), `package.json` (`npm uninstall p5`), `CLAUDE.md` (architecture section: engine instead of p5), `.github/copilot-instructions.md`

- [ ] **Step 1:** Change the `legacy route` test into `test('?engine=legacy falls back to bloom')`.
- [ ] **Step 2:** Delete and uninstall. Run `npm run lint && npm test && npm run test:e2e && npm run budget`. Expected: all pass, initial JS < 120 KB gz. Commit `chore: remove p5 and the legacy sketch`. Open the Phase 1 PR.

---

## Phase 2: Design system (branch `phase-2-design-system`)

### Task 2.1: Self-hosted fonts

**Files:** Create `public/fonts/` (`instrument-serif-400.woff2`, `geist-400.woff2`, `geist-500.woff2`, `geist-mono-400.woff2`), `src/styles/tokens.css`, `tests/e2e/fonts.test.js`. Modify `index.html` (two `<link rel="preload" as="font" type="font/woff2" crossorigin>`), `src/index.css` (drop the Google `@import` and the Courier body), `src/main.jsx` (import `tokens.css`)

Source: the Latin-subset WOFF2 files that the Google Fonts CSS2 API serves for each family (all OFL, already subset). Each `@font-face` has `font-display: swap`. Add a metric-matched fallback face (`size-adjust`, `ascent-override`) for Instrument Serif and Geist against local Georgia and Arial, to hold CLS < 0.02.

- [ ] **Step 1:** Failing tests:
  - `fonts load`: `document.fonts.check('16px Geist')` and `check('48px "Instrument Serif"')` are true after `document.fonts.ready`.
  - `no Google Fonts requests`: no request to `fonts.googleapis.com` or `fonts.gstatic.com`.
  - `survives font failure` (Review Focus 3): with `page.route('**/fonts/**', r => r.abort())`, the hero title is visible, and a `PerformanceObserver` with `layout-shift` (`buffered: true`) sums to < 0.02.
- [ ] **Step 2–3:** Implement. `npm run test:e2e` PASS. Commit `feat(design): self-hosted fonts`.

### Task 2.2: Tokens and Tailwind mapping

**Files:** Modify `src/styles/tokens.css`, `tailwind.config.js`, `src/engine/flower.js` (add `accentFor`), `src/components/BackgroundSketch.jsx` (`onVariant` → `--bloom`). Test: `tests/unit/accent.test.js`

**Interfaces:**
- Produces Tailwind names used from here on:
  - colours `bg`, `surface`, `line`, `text`, `text-muted`, `text-faint`, `bloom`, `bloom-deep`, `stem`, `ember`, all `var(--…)`;
  - `fontSize` `xs sm base lg xl 2xl display`, with the global-constraint values and line heights (display 0.95, text 1.5);
  - `fontFamily` `display`, `sans`, `mono`.
- The `glass`, `glass-border`, `accent-*`, `cursive`, `fade-in` and `slide-up` tokens are removed.
- **Accent follows the flower:** `accentFor(variant) → 'rgb(r g b)'` is the per-channel `Math.round` mean of `c1` and `c2`. `onVariant(v)` sets `--bloom` on `:root` to it. `--bloom-deep` stays static.

- [ ] **Step 1:** Failing unit tests: `accentFor(VARIANTS[0]) === 'rgb(243 170 203)'`; every variant's accent has contrast ≥ 4.5 against `#000` (WCAG relative-luminance formula inline in the test).
- [ ] **Step 2–3:** Implement. `npm test && npm run build` PASS. Commit `feat(design): tokens mapped into Tailwind; accent follows the flower`.

### Task 2.3: Shared primitives and `<Reveal>`

**Files:** Create `src/components/ui/SectionHeading.jsx`, `src/components/ui/Reveal.jsx`, `src/components/ui/Chip.jsx`, `src/components/ui/ExternalLink.jsx`, `src/hooks/useReducedMotion.js`, `src/hooks/useInView.js`. Modify every section to use them in place of the copied `Label`, `Tag`, `fadeUp` and `Reveal` code. Test: `tests/e2e/reveal.test.js`

**Interfaces:**
- `<SectionHeading id title />` renders `<h2 id={id}>`. The section uses `aria-labelledby={id}`. There is no number (R1) and no eyebrow.
- `<Reveal as="div" stagger={0|1|2…}>` uses one module-level `IntersectionObserver` from `useInView` and fires once. CSS: `opacity 0 → 1`, `translateY(14px → 0)`, 700 ms `cubic-bezier(0.16, 1, 0.3, 1)`, 70 ms × `stagger`. The hidden start state applies only under `html.js`, which an inline script in `index.html` sets, so content can't stay hidden if the script fails. Headings use `<Reveal variant="lines">` (a line mask: each line `translateY(100%) → 0` inside `overflow: hidden`).
- `<ExternalLink href>` adds `target="_blank" rel="noopener noreferrer"` and an underline that draws left to right (`background-size` 0 → 100%, 300 ms).
- `useQualityTier` from §7 is skipped: no UI reads the tier.

- [ ] **Step 1:** Failing tests:
  - `reduced motion shows everything`: with `reducedMotion: true`, every `[data-reveal]` has opacity 1 on load.
  - `reveals settle`: after scrolling to the bottom and waiting 1.2 s, every `[data-reveal]` has opacity 1.
  - `no filter animations`: no stylesheet rule has `transition` or `animation` touching `filter`.
- [ ] **Step 2–3:** Implement. `npm run test:e2e` PASS. Commit `refactor(ui): shared primitives and one reveal`.

### Task 2.4: Type specimen (human gate)

**Files:** Create `public/specimen.html` (static; loads `/fonts/*` and inlines the token values)

- [ ] **Step 1:** Build two columns. Left: Instrument Serif + Geist. Right: all Geist (500, tracking -0.03em, for display). Each column shows the hero (name at display size, the two lines, the sentence), the AxiomLM featured card and the 4-row table, using the real copy.
- [ ] **Step 2:** **Human gate:** you pick. If all Geist wins, `fontFamily.display` becomes Geist 500 and Instrument Serif is removed from `public/fonts`. Record the choice in §10 decision #1. Commit `docs: type specimen and decision`.

### Task 2.5: Remove inline type, fix contrast, rewrite DESIGN.md

**Files:** Modify every file in `src/sections/` and `src/components/`, and `DESIGN.md`

- [ ] **Step 1:** `grep -rnE "fontSize|fontFamily|letterSpacing|text-white/(1|2|3|4|5)[0-9]?\b" src/sections src/components`. Expected after the change: no output.
- [ ] **Step 2:** Replace each match with a token class. Body copy is `text-text` or `text-text-muted`; `text-text-faint` is for labels ≥ 12 px only.
- [ ] **Step 3:** Run Lighthouse mobile. Expected: a11y has no contrast failures. Rewrite `DESIGN.md` to describe the shipped tokens, type and motion (drop cursive names and glass panels). Commit `refactor(design): tokens everywhere, AA contrast, DESIGN.md matches`. Open the Phase 2 PR.

---

## Phase 3: Sections (branch `phase-3-sections`)

### Task 3.1: Content schema and copy

**Files:** Modify `src/data/content.js`, `tests/unit/content.test.js`

**Interfaces:**
- Produces:
  ```js
  PORTFOLIO_DATA = {
    resumeUrl: null,
    hero: { name, role: 'AI Engineering · ML Research', degree, sentence },
    about: { portrait, bio, focus: [{ id: 'ai'|'research'|'inference', label, text, projects: [ids] }], currently, skills: [{ label, items: [] }] },
    projects: [{ id, title, oneLiner, result, details: [], status: 'active'|'complete'|'hackathon', year, kind: 'ai'|'research'|'backend', featured?, pinned?: 'research', stack: [], links: { source, demo?, model? }, fact, image: { src, width, height, alt } | null, figure?: { src, alt } }],
    contact: { github, githubUrl, linkedin, linkedinUrl, emailPersonal, emailStudent, sourceUrl },
  }
  ```
- Copy: hero from §4.1, bio, focus, currently and skills from §4.2, projects from the §4.3 table (ids `axiomlm`, `testcard`, `speak`, `vgc-telemetry`).

- [ ] **Step 1:** Failing tests:
  - ids are exactly those four, in that order;
  - exactly one `featured` and it is `axiomlm`; exactly one `pinned: 'research'` and it is `testcard`;
  - every `status` is in the set; `fact`, `oneLiner` and `result` are non-empty; `stack.length >= 3`; `links.source` starts with `https://github.com/`;
  - every non-null `image.src` and `figure.src` exists under `public/`; `image` may be null only for `speak` and `vgc-telemetry`;
  - `JSON.stringify(PORTFOLIO_DATA)` does not match `/2nd semester|Think\. Then Build|internship|\+91|\b\d{10}\b/i`;
  - `resumeUrl === null`;
  - the `fact` strings equal §4.3's four key facts exactly.
- [ ] **Step 2–3:** Implement. `npm test` PASS. Commit `feat(content): four projects and refreshed copy`.

### Task 3.2: Project images and the ASCII placeholder script

**Files:** Create `public/work/axiomlm.webp`, `public/work/testcard.webp`, `public/work/testcard-heads.svg`, `scripts/ascii-placeholders.mjs`, `src/data/placeholders.json`, `tests/unit/ascii.test.js`

**Interfaces:**
- Produces: `toAscii(gray: Uint8Array, w, h, ramp = ' .:-=+*#%@') → string` (`h` lines of `w` chars; darkest → `ramp[0]`). The script runs `magick <src> -resize 72x30! -colorspace gray -depth 8 gray:-` per image (portrait included) and writes `{ [id]: string }` to `src/data/placeholders.json`.
- The JSON is committed. Run the script by hand when an image changes, because Vercel's build has no `magick`.

- [ ] **Step 1:** Failing tests: all-zero input gives only spaces; all-255 input gives only `@`; output has `h` lines of exactly `w` chars.
- [ ] **Step 2:** Implement. Convert the sources: `magick ../AxiomLM/docs/screenshots/tui-study.png -resize 1440x -quality 78 public/work/axiomlm.webp`, and the same for `../VQA/results/phase4b/browser/desktop-real-result.png` → `testcard.webp`. Copy `../VQA/results/figures/head_comparison.svg` and swap its fills and strokes to the `--text`, `--text-muted` and `--bloom` values. Run the script. `npm test` PASS. Commit `feat(work): images and ASCII placeholders`.

### Task 3.3: Hero

**Files:** Modify `src/sections/Hero.jsx`. Test: `tests/e2e/hero.test.js`

The `<h1>` holds the name at the `display` size. Under it: the role line (`lg`, `text-text`), the degree line (`sm`, `text-text-muted`) and the sentence. Then text links `Work` (`#work`) and `Contact` (`#contact`), and GitHub and LinkedIn as inline SVG icons with an `aria-label`. On desktop the block sits right of the flower's centre column; below 1024 it sits under the flower, which is sized `min(92vw, 70svh)`. If `resumeUrl` is set, a `Résumé` link renders next to Contact. There is no scroll cue, no hint text and no tagline.

- [ ] **Step 1:** Failing tests: exactly one `h1`, with text `Joydeep Das`, visible within 1.2 s at 1440, 768 and 390; the page has no text "Think. Then Build."; the h1 fits on ≤ 2 lines at every width (`height / lineHeight <= 2`).
- [ ] **Step 2–3:** Implement. PASS. Commit `feat(hero): name, role, links`.

### Task 3.4: About

**Files:** Modify `src/sections/About.jsx`

Two columns at ≥ 1024 (portrait, then the bio column), stacked below. The portrait `<picture>` sits on top of its `placeholders.portrait` `<pre>` (Geist Mono, `aria-hidden`), which fades out on the image's `load` event. The frame is the `--surface` tone step (R4). Focus areas are a `<dl>`, and each `<div data-focus={id}>` reports hover and focus to the overlay on `pointerenter` and `focusin` (Task 3.7). "Currently" is one line. Skills are a two-column `<dl>`.

- [ ] **Step 1:** Implement. Verify with Task 3.8's inspector run, and by reading the 1440 and 390 screenshots. Commit `feat(about): bio, focus areas, skills`.

### Task 3.5: Work: featured card, research card, table

**Files:** Create `src/sections/work/FeaturedCard.jsx`, `src/sections/work/ResearchCard.jsx`, `src/sections/work/ProjectTable.jsx`, `src/sections/work/ProjectMedia.jsx`. Replace `src/sections/Projects.jsx` with `src/sections/Work.jsx`; update `App.jsx`. Test: `tests/e2e/work.test.js`

**Interfaces:**
- `<ProjectMedia project />` stacks the placeholder `<pre>` and the `<img loading="lazy" decoding="async">`. The image fades in (ASCII → image dissolve, 400 ms opacity) only after `load`. If `image` is null or the image fires `error`, the `<pre>` stays and no `<img>` remains in the DOM.
- **Featured** = the project with `featured: true`. **Research** = the one with `pinned: 'research'`, unless it is also featured. On desktop, a table row's `pointerenter` or `focusin` swaps which project the featured card shows. The swap only changes content, not layout. Leaving the table restores the featured project.
- **Demo clip:** `<video muted playsinline loop preload="none">`. `src` is set only on the first hover or tap of the media.
- **Below 1024:** each row is a `<button aria-expanded aria-controls>` that opens an in-place panel with details, stack and links, and the `fact` is shown as a plain line (no annotations on mobile).

- [ ] **Step 1:** Failing tests:
  - `table has four rows` with titles in content order;
  - `keyboard swaps featured`: focusing the Testcard row at 1440 changes the featured card's heading to `Testcard`;
  - `accordion at 390`: tapping the S.P.E.A.K. row sets `aria-expanded="true"` and its stack is visible; tapping again collapses it;
  - `no video on load`: no request ending `.webm` or `.mp4` before interaction;
  - `missing image keeps placeholder` (Review Focus 5): with `page.route('**/work/*.webp', r => r.abort())`, every media box shows its `<pre>`, no `img` is visible with `naturalWidth === 0`, and the box height equals the height without the abort (±2 px);
  - `rows are tap-sized`: every row button is ≥ 44 px high at 390.
- [ ] **Step 2–3:** Implement. PASS. Commit `feat(work): featured, research and table`.

### Task 3.6: Contact and footer

**Files:** Modify `src/sections/Contact.jsx`. Test: `tests/e2e/contact.test.js`

Heading "Contact", then the sentence "The best way to reach me is email." Rows: personal email, student email, GitHub, LinkedIn. Addresses use `overflow-wrap: anywhere` (no `truncate`). The copy button sits beside each email (`aria-label="Copy <address>"`). On success its icon is a check for 1.5 s and an `aria-live="polite"` sr-only node says "Copied". On rejection, or when `navigator.clipboard` is missing, it selects the address text instead and shows no check. Footer: `© {new Date().getFullYear()} Joydeep Das` and a `Source` link to `contact.sourceUrl`.

- [ ] **Step 1:** Failing tests:
  - `copy works`: with clipboard permission granted, click → `navigator.clipboard.readText()` equals the address, and the check shows;
  - `copy failure is honest` (Review Focus 4): `navigator.clipboard.writeText = () => Promise.reject()` → no check, `getSelection().toString()` equals the address;
  - `addresses not truncated at 320`: each email element's `scrollWidth <= clientWidth`;
  - `footer year` equals the current year.
- [ ] **Step 2–3:** Implement. PASS. Commit `feat(contact): copy buttons, wrapping, footer`.

### Task 3.7: Annotation overlay

**Files:** Create `src/components/annotations.js` (pure), `src/components/Annotations.jsx`, `tests/unit/annotations.test.js`

**Interfaces:**
- Consumes: `getEngine().getAnchors()` and `setHighlight` (Task 1.6), `useActiveSection`, and `PORTFOLIO_DATA`.
- Produces: `pickAnnotations(section, { hoveredFocus, hoveredProject }) → [{ anchorId, text, highlighted }]`, capped at 3.
  - `about`: three entries `ai`, `research`, `inference`, with the focus labels (no numbers, R1) and `highlighted` on the hovered one.
  - `work` with no hover: `[]`.
  - `work` hovering project `p`: `[{ anchorId: 'project', text: p.fact, highlighted: true }]`.
  - `hero` and `contact`: `[]`.

`Annotations.jsx` mounts only at ≥ 1024. It is one SVG plus absolutely positioned label `<p>`s. One rAF loop moves them with `transform`, and lines run from anchor to a margin slot. Labels enter with `stroke-dashoffset` over 400 ms and leave the same way. A highlighted label's line uses `--bloom` and calls `setHighlight(anchorId)`; others use 40% white. A `visible: false` anchor fades its label out. Reduced motion: no line draw. Hovering a label highlights the matching `data-focus` item too (two-way, §3.6).

- [ ] **Step 1:** Failing unit tests: one per `pickAnnotations` case above; the Testcard text is `SRCC 0.644 · cross-dataset`.
- [ ] **Step 2–3:** Implement. `npm test` PASS. Manual check at 1440: hover each focus area and each row. Commit `feat: annotated specimen overlay`.

### Task 3.8: Navigation, semantics, framer-motion removal, gate

**Files:** Modify `src/components/LeftRail.jsx`, `src/App.jsx`, `package.json`. Create `src/components/MobileNav.jsx`. Test: `tests/e2e/nav.test.js`

- **LeftRail (≥ 1024):** ticks become `<a href="#id" aria-label={name}>`. The name label shows on hover and focus. The current year replaces `©2025`.
- **MobileNav (< 1024):** a `<header>` bar with `JD` (link to `#hero`) and the four section links. It hides on scroll-down and shows on scroll-up (`transform` only), with `padding-top: env(safe-area-inset-top)` and a solid `--bg` (R3). Plus a 1 px `--bloom` progress line, `transform: scaleX(progress)`.
- **Shell:** `<a href="#main" class="sr-only focus:not-sr-only">Skip to content</a>` · `<main id="main">` · each section `aria-labelledby` · one `<footer>` · `:focus-visible` outline 2 px `--bloom`.
- **Desktop grid (§2.4):** at ≥ 1024, each section after the hero is `grid-template-columns: 38vw 1fr` with its content in column 2 at `max-width: 680px`. This replaces Phase 0's `lg:pl-[38vw]`; Task 0.5's layout test still passes.
- **framer-motion:** `grep -rn framer-motion src` gives no output, then `npm uninstall framer-motion`.

- [ ] **Step 1:** Failing tests:
  - `rail links scroll`: clicking the About tick at 1440 puts `#about` at `top <= 10`;
  - `mobile nav hides and shows`: at 390, after scrolling down 400 px the header translateY is < 0, and after scrolling up 50 px it is 0;
  - `landmarks`: one `main`, one `h1`, ≥ 4 `section[aria-labelledby]`, a skip link that comes first in tab order;
  - `keyboard reach`: tabbing through the page reaches every `a` and `button` and each has a visible outline.
- [ ] **Step 2:** Implement. Run `npm run lint && npm test && npm run test:e2e && npm run budget`. Expected: all pass.
- [ ] **Step 3:** Taste gate on the production build: `npx vite preview --port 4173 &`, then `node ~/.claude/skills/design-taste-frontend/scripts/lint.mjs src` and `node ~/.claude/skills/design-taste-frontend/scripts/inspect.mjs http://localhost:4173 --allow hairline --out .taste-skill/phase3`. Expected: 0 FAIL. Every WARN is fixed or defended in one sentence in the PR.
- [ ] **Step 4:** Critique: read every screenshot in `.taste-skill/phase3/`, write a critique following `~/.claude/skills/design-taste-frontend/references/critique.md` §4 into the PR description, and fix the top three problems. At most 3 rounds.
- [ ] **Step 5:** Tick the §6 checklist items that are now done. Commit `feat: navigation and semantics; drop framer-motion`. Open the Phase 3 PR.

---

## Phase 4: Mobile pass (branch `phase-4-mobile`)

### Task 4.1: Touch controls on the flower

**Files:** Modify `src/engine/index.js`. Test: extend `tests/e2e/engine.test.js`

Pointer events on `window` (target filter as in Task 1.6):
- **Drag rotates.** A `pointerType === 'touch'` drag rotates the flower at 0.005 rad/px, easing back after release. This replaces pointer-position rotation for touch.
- **Tap.** Under 10 px of movement and under 250 ms gives a ripple + glitch.
- **Scroll.** With `touch-action: pan-y`, vertical scroll keeps working. Multi-touch is ignored.
- **Skipped:** `deviceorientation` tilt. §5 lists it as optional and it needs an iOS permission prompt.

`stats()` gains `rotY` and `glitchCount`.

- [ ] **Step 1:** Failing tests with `mobile: true`:
  - `drag rotates`: a horizontal `touchscreen` drag of 100 px changes `stats().rotY` by more than 0.3;
  - `tap glitches`: a tap raises `stats().glitchCount`;
  - `vertical swipe scrolls`: a 300 px vertical swipe changes `scrollY`.
- [ ] **Step 2–3:** Implement. PASS. Commit `feat(engine): touch drag and tap`.

### Task 4.2: Device matrix

**Files:** Create `tests/e2e/devices.test.js`

- [ ] **Step 1:** Write tests for each Playwright device descriptor: `iPhone SE`, `iPhone 15`, `Pixel 7`, `iPad (gen 7)`, `iPad (gen 7) landscape`, `iPhone 15 landscape`, plus a bare 320×640. Each asserts:
  - no horizontal scroll;
  - every `a, button` in `header`, `#work` and `#contact` has a bounding box ≥ 44×44, and chips are ≥ 32 px high with ≥ 8 px gaps;
  - every text node has computed `font-size >= 12px`; body paragraphs `>= 16px`;
  - no screen-tall empty section other than the hero: each section's height is ≤ its content height + 2 × 128 px;
  - the hero's `h1` is in the first viewport.
- [ ] **Step 2:** Run it and fix each failure in the component it names. Run Lighthouse mobile. Expected: perf ≥ 90.
- [ ] **Step 3:** Manual: a real low-end Android over `chrome://inspect`, `?debug`, `__bloom.stats().fps >= 30` while scrolling the whole page. Record in §9. Run the taste inspector again (as in Task 3.8) into `.taste-skill/phase4`. Expected: 0 FAIL. Commit `test: device matrix; mobile fixes`. Open the Phase 4 PR.

---

## Phase 5: Polish and ship (branch `phase-5-ship`)

### Task 5.1: OG image and social meta

**Files:** Create `scripts/og-image.mjs`, `public/og.png`. Modify `index.html`

The script:
1. Opens `?engine=bloom&seed=7&debug` at 1200×630.
2. Waits for full bloom (`stats().phase === 'interactive'`).
3. Overlays the name at display size and "AI Engineering · ML Research".
4. Screenshots to `public/og.png` and runs `magick public/og.png -strip -quality 85 public/og.png`. The file must stay under 150 KB.

Meta tags: `og:title`, `og:description`, `og:image` (absolute URL), `og:type website`, `twitter:card summary_large_image`.

- [ ] **Step 1:** Extend `meta.test.js`: every tag is present, and `/og.png` returns 200 and is under 150 KB.
- [ ] **Step 2–3:** Implement. PASS. Commit `feat: OG image and social meta`.

### Task 5.2: Accessibility audit

- [ ] **Step 1:** `npx -y @axe-core/cli <preview url> --exit` at desktop width and at 390. Expected: 0 violations. Fix each one in its component.
- [ ] **Step 2:** Lighthouse a11y = 100 on mobile and desktop. Commit `fix(a11y): axe findings`.

### Task 5.3: Vercel headers and CI

**Files:** Create `vercel.json`, `.github/workflows/ci.yml`

- **`vercel.json`:** `Cache-Control: public, max-age=31536000, immutable` for `/assets/(.*)` and `/fonts/(.*)`. On `/(.*)`: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, and `Content-Security-Policy: default-src 'self'; img-src 'self' data:; media-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'`. `'unsafe-inline'` covers the `html.js` inline script; it can switch to a hash once that script is final.
- **CI:** Node 22, `npm ci`, `npm run lint`, `npm test`, `npm run build`, `npm run budget`, `npx playwright install --with-deps chromium`, `npm run test:e2e`, then upload `.parity/` and the device screenshots as artifacts.

- [ ] **Step 1:** Push the branch. Expected: CI is green and the Vercel preview deploys. `curl -sI <preview>/assets/<any>.js` shows the immutable cache header.
- [ ] **Step 2:** Commit `ci: lint, tests, budget, e2e; vercel headers`.

### Task 5.4: README and final numbers

**Files:** Modify `README.md`, `DESIGN_UPDATE.md` §9 (the "After" column)

- [ ] **Step 1:** Write the README: what the site is, a screenshot from `.taste-skill/phase4/`, `npm` scripts, the engine architecture in one paragraph, and how to swap `featured`.
- [ ] **Step 2:** Run the final Lighthouse and `npm run measure -- --label final`, and fill §9. Every budget must be met; any miss is listed in the PR with its cause.
- [ ] **Step 3:** Commit `docs: README and final measurements`. Open the Phase 5 PR, merge, and confirm the production deploy.

---

## Still open (from §10, not blocking)

- S.P.E.A.K. and VGC-Telemetry screenshots (1440×900, dark UI, WebP). Until then their `image` is `null` and the ASCII-only placeholder shows. Dropping a file into `public/work/` and re-running `scripts/ascii-placeholders.mjs` completes them.
- The AxiomLM 10–15 s demo clip (WebM, < 1.5 MB). Until it exists the "Demo video" link is not rendered.
