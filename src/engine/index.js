// Bloom engine entry: one rAF loop drives a Canvas2D flower buffer and a WebGL (or Canvas2D) post stage.
import { rng, random, lerp, constrain, easeInOutCubic, bloomCurve, BLOOM_DURATION } from './math.js';
import { VARIANTS, ANCHORS, projectAnchor, drawFlower } from './flower.js';
import { buildGlyphAtlas } from './glyphAtlas.js';
import { TIERS, initialTier, createGovernor } from './quality.js';
import { createPost } from './gl.js';
import { createParticles } from './particles.js';
import { sectionState } from './sections.js';

export { sectionState };

const MODE_NAMES = ['ascii', 'dots', 'pixels'];
const MODE_OF = { dots: 1, pixels: 2, ascii: 0 };
const SECTION_NAMES = ['hero', 'about', 'work', 'contact'];
const SAFE_SCALE = 0.82; // flower rect as a fraction of the short viewport side
const GRID_MAX = 20;
const IGNORE = 'a, button, input, summary';

export function createBloom(canvas, opts = {}) {
  const mq = (q) => matchMedia(q).matches;
  const rand = opts.seed != null ? rng(opts.seed) : Math.random;
  const coarse = mq('(pointer: coarse)');

  let post = createPost(canvas, opts.breakShader ? { frag: 'void main(){' } : undefined); // breakShader: test hook
  let tierName = opts.tier ?? initialTier({
    coarse,
    cores: navigator.hardwareConcurrency ?? 4,
    memory: navigator.deviceMemory ?? 8,
    reducedMotion: mq('(prefers-reduced-motion: reduce)'),
    saveData: !!navigator.connection?.saveData,
    webgl: !!post,
  });
  let tier = TIERS[tierName];
  const governor = createGovernor(tierName);

  // Canvas2D fallback target: the main canvas if WebGL never existed, else a sibling (a lost GL canvas can't take a 2d context).
  let fbCanvas = null, ctx2d = null;
  const useFallback = () => {
    if (!fbCanvas && post === null && canvas.dataset.bloomGl) {
      fbCanvas = canvas.cloneNode(false);
      fbCanvas.removeAttribute('data-bloom-gl');
      canvas.after(fbCanvas);
      canvas.style.display = 'none';
    }
    ctx2d = (fbCanvas ?? canvas).getContext('2d');
  };
  if (!post) useFallback();

  const bufCanvas = document.createElement('canvas');
  const bufCtx = bufCanvas.getContext('2d');
  const lowCanvas = document.createElement('canvas');
  const lowCtx = lowCanvas.getContext('2d');
  const overlay = document.createElement('canvas');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none';
  canvas.after(overlay);
  const particles = createParticles(overlay, rand);

  // ---- state
  let W = 1, H = 1, dpr = 1;
  let section = 'hero';
  let sec = sectionState('hero', { desktop: true });
  let active = true, hidden = false, scrolling = false;
  let rafId = 0, destroyed = false;
  let frames = 0, fps = 0, lastScreen = 0, lastBuf = -1e9, lastT = 0;
  let ready = false;
  let layoutOpts = { falloffX: 0, centerX: null };

  let elIdx = 0, phase = 'growing', phaseT = 0;
  let bloom = 0, bloomT = 0, wilt = 0;
  let renderMode = 2, prevMode = 2, modeT = 1;
  let grid = 4, gridTarget = 4, densDir = 1, densTimer = 0;
  let t = 0;
  let autoRotX = 0, autoRotY = 0, autoRotZ = 0, mouseRotX = 0, mouseRotY = 0, rotEaseIn = 0;
  let px = 0, py = 0, prevPx = 0, prevPy = 0, mouseSpeed = 0, lastInput = -1e9;
  let mInfX = 0, mInfY = 0;
  let glowIntensity = 0;
  let glitchTimer = 0, glitchSlices = [];
  let ripples = [];
  let highlightId = null;
  const anchorPos = {};
  let anchorsInit = false;
  const flowerState = { bloom: 0, wilt: 0, rotX: 0, rotY: 0, rotZ: 0, brightBoost: 0, rand, tier: 0 };

  const u = {
    rect: new Float32Array(4), glitch: new Float32Array(32), ripples: new Float32Array(16), highlight: new Float32Array(3),
    grid: 4, mode: 2, prevMode: 2, modeT: 1, glitchCount: 0, glow: 0, time: 0, presence: 1, falloffX: 0, scrim: 0, stars: 1,
  };

  const isStatic = () => tierName === 'static';
  const rectSize = () => Math.min(W, H) * SAFE_SCALE;
  const rectOrigin = () => {
    const s = rectSize();
    return [(layoutOpts.centerX ?? W / 2) - s / 2 + mInfX, (H - s) / 2 + mInfY, s];
  };

  // ---- elements
  function startElement(idx) {
    elIdx = idx;
    bloom = 0; bloomT = 0; wilt = 0; phase = 'growing'; phaseT = 0;
    grid = gridTarget = Math.max(4, tier.gridMin); densDir = 1; densTimer = 0; modeT = 1;
    ripples = [];
    particles.clear();
    opts.onVariant?.(VARIANTS[idx]);
  }

  // ---- layout
  function applyTierBuffers() {
    bufCanvas.width = bufCanvas.height = tier.buffer;
    lastBuf = -1e9;
  }
  function layout() {
    W = window.innerWidth; H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, tier.dpr);
    if (post) post.resize(W, H, dpr);
    else { const c = fbCanvas ?? canvas; c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    particles.resize(W, H);
    anchorsInit = false;
    if (isStatic()) renderStatic();
  }
  let resizeTimer = 0;
  const onResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(layout, 150); };
  let dprMq = null;
  const watchDpr = () => {
    dprMq?.removeEventListener('change', onDprChange);
    dprMq = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    dprMq.addEventListener('change', onDprChange);
  };
  function onDprChange() { watchDpr(); layout(); }

  // ---- glitch
  function triggerGlitch(light = false) {
    if (isStatic()) return;
    const sf = constrain(mouseSpeed / 20, 0, 1);
    let intensity = random(rand, 0.15 + sf * 0.2, 0.45 + sf * 0.45);
    if (light) intensity *= 0.6;
    const [, oy, s] = rectOrigin();
    let n = Math.floor(random(rand, 1 + sf, 3 + sf * 4));
    if (light) n = Math.min(n, 2);
    glitchSlices = [];
    for (let i = 0; i < Math.min(n, 8); i++) {
      const y = random(rand, oy, oy + s);
      glitchSlices.push({
        y, h: Math.min(random(rand, 2, s * 0.06), oy + s - y),
        offset: random(rand, -50, 50) * intensity,
        shift: rand() < 0.25, duration: random(rand, 0.06, 0.18),
      });
    }
  }
  function updateGlitch(dt) {
    if (!glitchSlices.length) return;
    let live = false;
    for (const s of glitchSlices) {
      s.duration -= dt;
      if (s.duration > 0) live = true; else s.offset *= 0.7;
    }
    if (!live) glitchSlices = [];
  }

  // ---- per-frame simulation (ported from p.draw)
  const k60 = (k, dt) => 1 - Math.pow(1 - k, dt * 60);

  function update(dt, now) {
    t += dt;
    sec = sectionState(section, { desktop: W >= 1024 });

    if (now - lastInput > 3000) {
      px += (W / 2 - px) * k60(0.03, dt); py += (H / 2 - py) * k60(0.03, dt);
    }
    mouseSpeed += (Math.hypot(px - prevPx, py - prevPy) - mouseSpeed) * k60(0.25, dt);
    prevPx = px; prevPy = py;

    const proximity = constrain(1 - Math.hypot(px - W / 2, py - H / 2) / (Math.max(W, H) * 0.5), 0.1, 1);
    const target = constrain(proximity + constrain(mouseSpeed * 0.04, 0, 0.5), 0.1, 1);
    glowIntensity += (target - glowIntensity) * dt * 2.2;

    rotEaseIn = Math.min(1, rotEaseIn + dt * 0.08);
    const re = easeInOutCubic(rotEaseIn), rs = sec.rotSpeed;
    autoRotY += dt * 0.3 * re * rs;
    autoRotX += dt * 0.12 * Math.sin(t * 0.15) * re * rs;
    autoRotZ += dt * 0.08 * Math.sin(t * 0.09 + 1.5) * re * rs;
    mouseRotX += ((py - H / 2) / H * 1.2 - mouseRotX) * k60(0.04, dt);
    mouseRotY += ((px - W / 2) / W * 1.8 - mouseRotY) * k60(0.04, dt);

    if (ready && phase === 'growing') {
      bloomT += dt;
      const tn = Math.min(bloomT / BLOOM_DURATION, 1);
      bloom = bloomCurve(tn);
      if (tn >= 1) { bloom = 1; phase = 'interactive'; phaseT = 0; }
    }

    if (sec.cycle) {
      densTimer += dt;
      if (densTimer > Math.max(0.5, 2.5 - mouseSpeed * 0.06)) {
        densTimer = 0;
        if (rand() < 0.5 + mouseSpeed * 0.035) triggerGlitch();
        prevMode = renderMode; renderMode = (renderMode + 1) % 3; modeT = 0;
        gridTarget = densDir === 1 ? GRID_MAX : Math.max(4, tier.gridMin);
        densDir = -densDir;
      }
      if (phase === 'interactive') {
        phaseT += dt;
        if (phaseT > 25) { phase = 'wilting'; phaseT = 0; triggerGlitch(); }
      }
      if (phase === 'wilting') {
        wilt = Math.min(1, wilt + dt * 0.04); phaseT += dt;
        if (wilt > 0.95) { phase = 'waiting'; phaseT = 0; }
      }
      if (phase === 'waiting') {
        phaseT += dt;
        if (phaseT > 0.6) {
          prevMode = renderMode; renderMode = (renderMode + 1) % 3; modeT = 0;
          triggerGlitch();
          startElement((elIdx + 1) % VARIANTS.length);
        }
      }
    } else {
      // other sections hold full bloom; a wilt in progress recovers
      if (wilt > 0) { wilt = Math.max(0, wilt - dt * 0.5); if (wilt === 0) phase = 'interactive'; }
      if (phase === 'waiting' || phase === 'wilting') phase = 'interactive';
      gridTarget = Math.max(6, tier.gridMin) + sec.gridBias;
    }

    grid += (gridTarget - grid) * k60(0.08, dt);
    modeT = Math.min(1, modeT + dt * 4);
    updateGlitch(dt);

    if (phase === 'interactive') {
      mInfX += ((px - W / 2) * 0.08 - mInfX) * k60(0.04, dt);
      mInfY += ((py - H / 2) * 0.08 - mInfY) * k60(0.04, dt);
    } else { mInfX *= 0.95; mInfY *= 0.95; }

    glitchTimer -= dt;
    if (glitchTimer <= 0 && !glitchSlices.length) {
      const idle = Math.max(4, 18 - mouseSpeed * 0.5);
      glitchTimer = random(rand, idle * 0.6, idle);
      if (rand() < constrain(0.12 + mouseSpeed * 0.015, 0.12, 0.4)) triggerGlitch();
    }

    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.life -= dt * 0.8;
      r.radius = Math.min(r.radius + r.maxRadius * dt * 1.1, r.maxRadius);
      if (r.life <= 0) ripples.splice(i, 1);
    }

    const [ox, oy, s] = rectOrigin();
    particles.update(dt, {
      cx: ox + s / 2, cy: oy + s / 2, flowerR: (VARIANTS[elIdx].maxRadius / 800) * s * bloom,
      px, py, speed: mouseSpeed, glow: glowIntensity, max: tier.particles, variant: VARIANTS[elIdx],
    });
    updateAnchors(false);
  }

  function syncFlowerState() {
    Object.assign(flowerState, {
      bloom, wilt, rotX: autoRotX + mouseRotX * easeInOutCubic(rotEaseIn),
      rotY: autoRotY + mouseRotY * easeInOutCubic(rotEaseIn), rotZ: autoRotZ,
      brightBoost: glowIntensity, tier: tierName === 'low' ? 1 : 0,
    });
  }

  // ---- anchors
  function updateAnchors(snap) {
    syncFlowerState();
    const [ox, oy, s] = rectOrigin();
    const first = snap || !anchorsInit;
    for (const id of Object.keys(ANCHORS)) {
      const p = projectAnchor(VARIANTS[elIdx], ANCHORS[id], flowerState, bufCanvas.width);
      const a = (anchorPos[id] ??= { id, x: W / 2, y: H / 2, visible: false });
      if (!p) { a.visible = false; continue; }
      const x = ox + (p.x / bufCanvas.width) * s, y = oy + (p.y / bufCanvas.width) * s;
      a.x = first ? x : lerp(a.x, x, 0.15);
      a.y = first ? y : lerp(a.y, y, 0.15);
      a.visible = p.z <= 0;
    }
    anchorsInit = true;
  }

  // ---- render
  function drawBuffer() {
    syncFlowerState();
    drawFlower(bufCtx, VARIANTS[elIdx], flowerState);
    post?.uploadFlower(bufCanvas);
  }

  function fillUniforms() {
    const [ox, oy, s] = rectOrigin();
    u.rect.set([ox, oy, s, s]);
    u.grid = Math.max(tier.gridMin, Math.round(grid));
    u.mode = renderMode; u.prevMode = prevMode; u.modeT = modeT;
    u.glow = glowIntensity * (1 + Math.sin(t * 0.47) * 0.12);
    u.time = t; u.presence = sec.presence; u.scrim = sec.scrim; u.falloffX = layoutOpts.falloffX;
    u.stars = 1;
    u.glitchCount = glitchSlices.length;
    glitchSlices.forEach((g, i) => u.glitch.set([g.y, g.h, g.offset, g.shift ? 1 : 0], i * 4));
    u.ripples.fill(0);
    ripples.slice(-4).forEach((r, i) => u.ripples.set([r.x, r.y, r.radius, r.life], i * 4));
    const a = highlightId && anchorPos[highlightId];
    u.highlight.set(a && a.visible ? [a.x, a.y, s * 0.14] : [0, 0, 0]);
  }

  // Canvas2D fallback: pixels mode only, via a down-then-up scaled buffer.
  function renderFallback() {
    const [ox, oy, s] = rectOrigin();
    const g = Math.max(tier.gridMin, Math.round(grid));
    const n = Math.max(1, Math.ceil(s / g));
    lowCanvas.width = lowCanvas.height = n;
    lowCtx.drawImage(bufCanvas, 0, 0, n, n);
    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx2d.fillStyle = '#000';
    ctx2d.fillRect(0, 0, W, H);
    ctx2d.imageSmoothingEnabled = false;
    ctx2d.globalAlpha = sec.presence;
    ctx2d.drawImage(lowCanvas, ox, oy, s, s);
    ctx2d.globalAlpha = 1;
  }

  function render() {
    if (post) { fillUniforms(); post.draw(u); } else renderFallback();
    particles.draw();
    frames++;
  }

  function renderStatic() {
    bloom = 1; wilt = 0; renderMode = prevMode = 2; modeT = 1; grid = gridTarget = 8; glowIntensity = 0.5;
    sec = sectionState(section, { desktop: W >= 1024 });
    drawBuffer(); updateAnchors(true); render();
  }

  // ---- loop
  function tick(now) {
    rafId = requestAnimationFrame(tick);
    const interval = 1000 / tier.screenFps;
    if (now - lastScreen < interval - 2) return;
    const dt = Math.min((now - lastScreen) / 1000, 0.1);
    const work0 = performance.now();
    if (lastScreen) fps += (1000 / (now - lastScreen) - fps) * 0.1; else fps = tier.screenFps;
    lastScreen = now;

    update(dt, now);
    const bufInterval = 1000 / (tier.bufferFps * (section === 'hero' ? 1 : 0.5));
    if (now - lastBuf >= bufInterval - 2) { lastBuf = now; drawBuffer(); }
    render();

    if (!ready && frames >= 30) { ready = true; opts.onReady?.(); }
    const next = governor.sample(performance.now() - work0, now);
    if (next !== tierName) {
      tierName = next; tier = TIERS[next];
      applyTierBuffers(); layout();
    }
  }
  function sync() {
    const run = active && !hidden && !scrolling && !isStatic() && !destroyed;
    if (run && !rafId) { lastScreen = 0; rafId = requestAnimationFrame(tick); }
    else if (!run && rafId) { cancelAnimationFrame(rafId); rafId = 0; }
  }

  // ---- input and page events
  const interactive = (e) => e.target?.closest?.(IGNORE);
  const onMove = (e) => { if (!interactive(e)) setPointer(e.clientX, e.clientY); };
  const onDown = (e) => { if (!interactive(e)) setPointer(e.clientX, e.clientY, { down: true }); };
  const onKey = (e) => { if (e.key === 'g' || e.key === 'G') triggerGlitch(); };
  const onVis = () => { hidden = document.visibilityState === 'hidden'; sync(); };
  let scrollTimer = 0;
  const onScroll = () => {
    if (!coarse) return;
    scrolling = true; sync();
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => { scrolling = false; sync(); }, 150);
  };

  function setPointer(x, y, { down = false } = {}) {
    px = x; py = y; lastInput = performance.now();
    if (down && !isStatic()) {
      triggerGlitch();
      ripples.push({ x, y, radius: 0, maxRadius: random(rand, 80, 200), life: 1 });
      if (ripples.length > 4) ripples.shift();
    }
  }

  // ---- WebGL context loss
  function bindPost() {
    post.onLost(() => {
      post.destroy(); post = null;
      useFallback(); layout();
      if (isStatic()) renderStatic();
    });
  }
  const onRestored = () => {
    const p = createPost(canvas);
    if (!p) return;
    post = p; bindPost(); lastBuf = -1e9;
    fbCanvas?.remove(); fbCanvas = null; canvas.style.display = '';
    ctx2d = null;
    post.uploadAtlas(atlas);
    layout();
  };

  // ---- boot
  let atlas = buildGlyphAtlas();
  document.fonts?.ready.then(() => {
    if (destroyed) return;
    atlas = buildGlyphAtlas(); post?.uploadAtlas(atlas);
  });
  applyTierBuffers();
  px = prevPx = window.innerWidth / 2; py = prevPy = window.innerHeight / 2;
  if (post) { bindPost(); post.uploadAtlas(atlas); }
  startElement(0);
  layout();
  if (isStatic()) { renderStatic(); ready = true; queueMicrotask(() => opts.onReady?.()); }

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onDown, { passive: true });
  window.addEventListener('keydown', onKey);
  window.addEventListener('resize', onResize);
  window.addEventListener('scroll', onScroll, { passive: true, capture: true });
  document.addEventListener('visibilitychange', onVis);
  canvas.addEventListener('webglcontextrestored', onRestored);
  watchDpr();
  sync();

  return {
    setActive(a) { active = !!a; sync(); },
    setSection(name) {
      if (!SECTION_NAMES.includes(name) || name === section) return;
      section = name;
      sec = sectionState(section, { desktop: W >= 1024 });
      if (!isStatic()) {
        prevMode = renderMode; modeT = 0; // every section change dissolves
        if (sec.mode !== 'cycle') renderMode = MODE_OF[sec.mode];
      }
      triggerGlitch(true);
      if (isStatic()) renderStatic();
    },
    setPointer,
    triggerGlitch: () => triggerGlitch(),
    setHighlight(id) { highlightId = id; if (isStatic()) renderStatic(); },
    setLayout(l) { layoutOpts = { ...layoutOpts, ...l }; anchorsInit = false; if (isStatic()) renderStatic(); },
    getAnchors() {
      if (!anchorsInit) updateAnchors(true);
      return Object.values(anchorPos).map(({ id, x, y, visible }) => ({ id, x, y, visible }));
    },
    stats: () => ({
      backend: post ? post.backend : 'canvas2d', tier: tierName, frames, fps: Math.round(fps),
      mode: post ? MODE_NAMES[renderMode] : 'pixels', phase, width: W, height: H, modeT,
    }),
    destroy() {
      destroyed = true; sync();
      clearTimeout(resizeTimer); clearTimeout(scrollTimer);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll, { capture: true });
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      dprMq?.removeEventListener('change', onDprChange);
      post?.destroy();
      overlay.remove(); fbCanvas?.remove(); canvas.style.display = '';
    },
  };
}
