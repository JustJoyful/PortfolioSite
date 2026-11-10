// Peony geometry ported from the original p5 sketch (removed in Task 1.9) to raw Canvas2D. No DOM at import time.
import { lerp, map, constrain, easeInOutCubic, easeOutQuart } from './math.js';

const { sin, cos, PI, atan2, abs, max, min, floor } = Math;
const TWO_PI = PI * 2, HALF_PI = PI / 2;
const FOCAL = 420;
export const FLOWER_BUFFER_SCALE = 0.48;

export const VARIANTS = [
  { c1: [230, 130, 170], c2: [255, 210, 235], c3: [170, 60, 100], stemC: [55, 85, 40], layers: 14, petalsPerLayer: 9, maxRadius: 155, ruffleAmt: 12, sepals: 5 },
  { c1: [240, 170, 190], c2: [255, 230, 240], c3: [190, 90, 130], stemC: [55, 88, 42], layers: 15, petalsPerLayer: 10, maxRadius: 150, ruffleAmt: 14, sepals: 6 },
  { c1: [200, 100, 180], c2: [245, 185, 225], c3: [150, 45, 110], stemC: [50, 80, 38], layers: 13, petalsPerLayer: 9, maxRadius: 158, ruffleAmt: 13, sepals: 5 },
];

// UI accent: per-channel mean of the variant's two main petal colours.
export const accentFor = (v) => `rgb(${v.c1.map((x, i) => Math.round((x + v.c2[i]) / 2)).join(' ')})`;

// Outer-layer petals facing the viewer (z <= 0 at zero rotation) in every variant, spread around the bloom.
// layer is absolute: 13 and 12 are within the outer three layers of all variants.
export const ANCHORS = {
  ai: { layer: 13, index: 23 }, // upper-left
  research: { layer: 13, index: 27 }, // right
  inference: { layer: 12, index: 21 }, // left, lower
  project: { layer: 13, index: 25 }, // upper-right
};

const col = (r, g, b, a = 255) =>
  `rgba(${Math.round(constrain(r, 0, 255))},${Math.round(constrain(g, 0, 255))},${Math.round(constrain(b, 0, 255))},${constrain(a, 0, 255) / 255})`;

function rot3D(s, x, y, z) {
  const cY = cos(s.rotY), sY = sin(s.rotY);
  const rx = x * cY + z * sY;
  const rz = -x * sY + z * cY;
  const cX = cos(s.rotX), sX = sin(s.rotX);
  const ry = y * cX - rz * sX;
  const rz2 = y * sX + rz * cX;
  const cZ = cos(s.rotZ), sZ = sin(s.rotZ);
  return [rx * cZ - ry * sZ, rx * sZ + ry * cZ, rz2];
}

const ellipse = (ctx, x, y, w, h) => { ctx.beginPath(); ctx.ellipse(x, y, w / 2, h / 2, 0, 0, TWO_PI); ctx.fill(); };

function drawLeaf(ctx, x, y, side, sz, sc) {
  if (sz < 2) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(side * 0.65);
  ctx.fillStyle = col(sc[0] * 0.85, sc[1] * 1.15, sc[2] * 0.75);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(sz * 0.35 * side, -sz * 0.38, sz * 0.85 * side, -sz * 0.22, sz * 1.35 * side, 0);
  ctx.bezierCurveTo(sz * 0.85 * side, sz * 0.22, sz * 0.35 * side, sz * 0.38, 0, 0);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = col(sc[0] * 1.1, sc[1] * 1.4, sc[2] * 1.0, 60);
  ctx.beginPath();
  ctx.moveTo(sz * 0.1 * side, 0);
  ctx.bezierCurveTo(sz * 0.4 * side, -sz * 0.15, sz * 0.7 * side, -sz * 0.08, sz * 1.0 * side, 0);
  ctx.bezierCurveTo(sz * 0.7 * side, sz * 0.08, sz * 0.4 * side, sz * 0.15, sz * 0.1 * side, 0);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = col(sc[0] * 1.3, sc[1] * 1.5, sc[2] * 1.2, 70);
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(sz * 1.15 * side, 0);
  for (let i = 1; i <= 3; i++) {
    const vx = sz * 0.3 * i * side;
    ctx.moveTo(vx, 0); ctx.lineTo(vx + sz * 0.2 * side, -sz * 0.12);
    ctx.moveTo(vx, 0); ctx.lineTo(vx + sz * 0.2 * side, sz * 0.12);
  }
  ctx.stroke();
  ctx.restore();
}

function drawStem(ctx, f, progress, wl, cy) {
  const stemLen = 800 * 0.42, stemX = 400, stemTop = cy, stemBot = stemTop + stemLen;
  const visibleTop = stemBot - stemLen * easeOutQuart(progress);
  for (let y = visibleTop; y < stemBot; y += 3) {
    const tt = (y - stemTop) / stemLen;
    const sw = lerp(15, 8, tt);
    const wiltBend = wl * 45 * (1 - tt) * sin((1 - tt) * PI);
    const curveX = sin(tt * PI * 0.3) * 22 + sin(tt * PI * 0.8) * 8 + wiltBend;
    let r = lerp(f.stemC[0], f.stemC[0] * 0.5, tt);
    let gc = lerp(f.stemC[1], f.stemC[1] * 0.5, tt);
    let b = lerp(f.stemC[2], f.stemC[2] * 0.5, tt);
    if (wl > 0) {
      r = lerp(r, r * 0.4 + 30, wl * 0.5);
      gc = lerp(gc, gc * 0.3 + 15, wl * 0.5);
      b = lerp(b, b * 0.25 + 8, wl * 0.5);
    }
    ctx.fillStyle = col(r, gc, b);
    ellipse(ctx, stemX + curveX, y, sw, 5);
    ctx.fillStyle = col(r * 1.4, gc * 1.4, b * 1.3, 50);
    ellipse(ctx, stemX + curveX - 2, y, sw * 0.2, 3);
  }
  for (const [after, span, at, side, size] of [[0.3, 0.4, 0.22, -1, 48], [0.5, 0.4, 0.50, 1, 42], [0.7, 0.3, 0.35, -1, 35]]) {
    if (progress > after) {
      const leafP = constrain((progress - after) / span, 0, 1);
      drawLeaf(ctx, stemX + sin(at * PI * 0.3) * 22, stemTop + stemLen * at, side, size * leafP, f.stemC);
    }
  }
}

// One petal's projected state (original p5 items.push 'p'), or null if culled. Shared by drawing and projectAnchor.
function petalAt(f, s, layer, i, bl, wl, brightBoost) {
  const lr = layer / f.layers;
  const layerDelay = (1 - lr) * 0.35;
  const ebl = easeInOutCubic(constrain((bl - layerDelay) / (1 - layerDelay), 0, 1));
  if (ebl < 0.01) return null;
  const layerFall = constrain((wl * 1.4 - (1 - lr) * 0.4) / 0.6, 0, 1);
  if (layerFall > 0.9) return null;
  const innerBoost = 1 - lr;
  const np = f.petalsPerLayer + floor(layer * 1.5) + floor(innerBoost * 5);
  const baseR = lerp(10, f.maxRadius, lr);
  let tiltAngle = lerp(PI * 0.42, PI * 0.04, ebl) + layerFall * PI * 0.22;
  tiltAngle -= innerBoost * 0.15 * ebl;
  const cosTilt = cos(tiltAngle), sinTilt = sin(tiltAngle);
  const wiltTilt = wl * 0.18, cosW = cos(wiltTilt), sinW = sin(wiltTilt);

  const petalHash = ((i * 73 + layer * 137) & 0xFF) / 255;
  if (wl > 0.1 && petalHash < (wl - 0.1) * 1.3) return null;
  let angle = (TWO_PI / np) * i + layer * 0.42 + sin(layer * 2.1) * 0.12;
  angle += petalHash * 0.15;
  const droopAmt = layerFall * 0.5 * (0.4 + lr * 0.6);
  const shrink = 1 - layerFall * 0.35;
  const dist = baseR * ebl * (0.35 + lr * 0.25);
  let x3 = cos(angle) * dist * cosTilt, z3 = sin(angle) * dist * cosTilt, y3 = -sinTilt * dist + droopAmt * 28;
  if (wiltTilt > 0.001) {
    const ny = y3 * cosW - x3 * sinW * 0.3;
    x3 = x3 + y3 * sinW * 0.3; y3 = ny;
  }
  const [rx, ry, rz] = rot3D(s, x3, y3, z3);
  const ps = FOCAL / (FOCAL + rz);
  const viewAngle = atan2(ry, rx);
  const faceVis = max(FOCAL / (FOCAL + abs(rz)), 0.12);
  const [, , lnz] = rot3D(s, cos(angle) * cosTilt, -sinTilt, sin(angle) * cosTilt);
  const lightMod = map(constrain(-lnz, -1, 1), -1, 1, 0.32, 1.25 + brightBoost * 0.4);
  const cupFactor = (1 - lr) * (1 - ebl * 0.5) * 0.35;
  const pl = baseR * (0.2 + 0.8 * ebl) * (1.15 + innerBoost * 0.3) * shrink * ps;
  const pw = baseR * (0.15 + 0.85 * ebl) * 0.55 * shrink * ps * faceVis * (1 + cupFactor);
  const rPhase = i * 1.7 + layer * 0.9;
  const rAmt = f.ruffleAmt * ebl * (1 + layerFall * 2 + innerBoost * 0.5) * ps;
  const cm = map(sin(angle + layer * 0.5), -1, 1, 0.45, 1.2) * map(layer, 0, f.layers, 0.35, 1.0) * (0.4 + 0.6 * ebl) * lightMod;
  let r = constrain(lerp(f.c1[0], f.c2[0], lr) * cm, 0, 255);
  let gr = constrain(lerp(f.c1[1], f.c2[1], lr) * cm, 0, 255);
  let b = constrain(lerp(f.c1[2], f.c2[2], lr) * cm, 0, 255);
  if (wl > 0) {
    const wf = min(1, layerFall * 1.3);
    r = lerp(r, r * 0.5 + 55, wf);
    gr = lerp(gr, gr * 0.28 + 22, wf);
    b = lerp(b, b * 0.12 + 6, wf);
  }
  const hR = constrain(lerp(r, f.c2[0], 0.55) + 16 * lightMod, 0, 255);
  const hG = constrain(lerp(gr, f.c2[1], 0.55) + 10 * lightMod, 0, 255);
  const hB = constrain(lerp(b, f.c2[2], 0.55) + 8 * lightMod, 0, 255);
  const hA = constrain((40 + innerBoost * 45 + (1 - faceVis) * 30) * (1 - wl), 0, 120);
  const gA = constrain((10 + innerBoost * 35 + lightMod * 12) * (1 - wl), 0, 80);
  return { rz, tp: 'p', sx: rx * ps, sy: ry * ps, sa: viewAngle, pl, pw, rPhase, rAmt, r, gr, b, cup: cupFactor, hR, hG, hB, hA, gA };
}

const numPetals = (f, layer) => f.petalsPerLayer + floor(layer * 1.5) + floor((1 - layer / f.layers) * 5);

function drawPeony3D(ctx, f, s, bl, wl, cx, cy) {
  const tier = s.tier || 0;
  const items = [];

  if (f.sepals && bl < 0.7) {
    const openAng = easeInOutCubic(bl) * HALF_PI * 0.9;
    let sepalAlpha = map(constrain(bl, 0, 0.7), 0, 0.7, 255, 0);
    if (wl) sepalAlpha *= 1 - wl;
    if (sepalAlpha > 5) {
      for (let i = 0; i < f.sepals; i++) {
        const a = (TWO_PI / f.sepals) * i;
        const sTilt = HALF_PI * 0.35 - openAng;
        const ct = cos(sTilt), st = sin(sTilt);
        const [rx, ry, rz] = rot3D(s, cos(a) * 50 * ct, -st * 50, sin(a) * 50 * ct);
        const ps = FOCAL / (FOCAL + rz);
        const fv = max(FOCAL / (FOCAL + abs(rz)), 0.15);
        items.push({ rz, tp: 's', sx: rx * ps, sy: ry * ps, sa: atan2(ry, rx), sLen: 80 * ps, sW: 25 * ps * fv, sAlpha: sepalAlpha, sc: f.stemC });
      }
    }
  }

  const cAlpha = constrain((bl - 0.45) / 0.3, 0, 1) * (1 - wl);
  if (cAlpha > 0) items.push({ rz: 0, tp: 'c', alpha: cAlpha });

  // Low tier skips the innermost layers (heavily occluded, high petal count)
  const layerEnd = tier === 1 ? min(4, floor(f.layers * 0.28)) : 0;
  for (let layer = f.layers; layer >= layerEnd; layer--) {
    const np = numPetals(f, layer);
    for (let i = 0; i < np; i++) {
      const it = petalAt(f, s, layer, i, bl, wl, s.brightBoost || 0);
      if (it) items.push(it);
    }
  }

  items.sort((a, b) => a.rz - b.rz);

  for (const it of items) {
    if (it.tp === 'c') {
      ctx.save(); ctx.translate(cx, cy);
      const [cnx, cny, cnz] = rot3D(s, 0, -1, 0);
      const cps = FOCAL / (FOCAL + cnz * 15);
      const csx = cnx * 15 * cps, csy = cny * 15 * cps;
      for (let r = 28; r > 0; r -= 3) {
        const ratio = r / 28, a = it.alpha || 1;
        ctx.fillStyle = col(
          lerp(f.c3[0] * 0.1, f.c3[0] * 0.7, ratio) * a,
          lerp(f.c3[1] * 0.1, f.c3[1] * 0.7, ratio) * a,
          lerp(f.c3[2] * 0.1, f.c3[2] * 0.7, ratio) * a);
        ellipse(ctx, csx, csy, r * 2.2 * cps, r * 2.2 * cps);
      }
      if (bl > 0.65) {
        const sa2 = constrain((bl - 0.65) / 0.25, 0, 1) * (1 - wl);
        for (let i = 0; i < 22; i++) {
          const a = (TWO_PI / 22) * i, d = 6 + (i % 5) * 3;
          const [srx, sry, srz] = rot3D(s, cos(a) * d * sa2, -3, sin(a) * d * sa2);
          const stP = FOCAL / (FOCAL + srz);
          ctx.fillStyle = col(f.c2[0] * 0.7, f.c2[1] * 0.5, f.c2[2] * 0.3, 140 * sa2);
          ellipse(ctx, srx * stP, sry * stP, 2.5 * stP, 2.5 * stP);
        }
      }
      ctx.restore();
    } else if (it.tp === 's') {
      if (!it.sW || it.sW < 1) continue;
      ctx.save(); ctx.translate(cx + it.sx, cy + it.sy); ctx.rotate(it.sa);
      ctx.fillStyle = col(it.sc[0] * 0.7, it.sc[1] * 1.0, it.sc[2] * 0.6, it.sAlpha);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(it.sLen * 0.3, -it.sW * 0.6, it.sLen * 0.7, -it.sW * 0.4, it.sLen, 0);
      ctx.bezierCurveTo(it.sLen * 0.7, it.sW * 0.4, it.sLen * 0.3, it.sW * 0.6, 0, 0);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    } else {
      if (!it.pw || it.pw < 0.5) continue;
      const { pl, pw, rPhase, rAmt } = it, cup = it.cup || 0;
      const edge = (tt, k, ph, cupK) => [tt * pl, k * sin(tt * PI) * (pw + cup * pw * cupK) + sin(tt * 8 + rPhase + ph) * rAmt * tt];
      ctx.save(); ctx.translate(cx + it.sx, cy + it.sy); ctx.rotate(it.sa);
      ctx.fillStyle = col(it.r, it.gr, it.b);
      ctx.beginPath();
      let first = true;
      const v = (x, y) => { if (Number.isNaN(x) || Number.isNaN(y)) return; if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y); };
      for (let tt = 0; tt <= 1; tt += 0.07) v(...edge(tt, 1, 0, 0.6));
      for (let tt = 1; tt >= 0; tt -= 0.07) v(...edge(tt, -1, PI, 0.4));
      ctx.closePath(); ctx.fill();

      if (tier === 0) { // petal sheen
        ctx.strokeStyle = col(it.hR, it.hG, it.hB, it.hA);
        ctx.lineWidth = max(0.4, pw * 0.055);
        ctx.beginPath(); first = true;
        for (let tt = 0.08; tt <= 0.98; tt += 0.09) {
          const [x, y] = edge(tt, 1, 0, 0.55);
          v(x, y - pw * 0.08);
        }
        ctx.stroke();

        ctx.fillStyle = col(it.hR, it.hG, it.hB, it.gA);
        ctx.beginPath(); first = true;
        for (let tt = 0.06; tt <= 0.98; tt += 0.1) {
          v(tt * pl, sin(tt * PI) * pw * 0.72 + sin(tt * 8 + rPhase + 0.55) * rAmt * tt * 0.45 + sin(tt * PI) * cup * pw * 0.45);
        }
        for (let tt = 0.98; tt >= 0.06; tt -= 0.1) {
          v(tt * pl, -sin(tt * PI) * pw * 0.28 + sin(tt * 8 + rPhase + PI + 0.55) * rAmt * tt * 0.2 - sin(tt * PI) * cup * pw * 0.2);
        }
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
  }
}

const bloomParts = (bl) => ({ stemP: constrain(bl * 3, 0, 1), flowerBl: constrain((bl - 0.15) / 0.85, 0, 1) });

// state = { bloom, wilt, rotX, rotY, rotZ, brightBoost, rand, tier? }
export function drawFlower(ctx, variant, state) {
  const size = ctx.canvas.width;
  const wl = state.wilt || 0;
  const { stemP, flowerBl } = bloomParts(state.bloom);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, size, ctx.canvas.height);
  ctx.save();
  ctx.scale(FLOWER_BUFFER_SCALE * size / 400, FLOWER_BUFFER_SCALE * size / 400);
  const cy = 800 * 0.48 + wl * 55;
  drawStem(ctx, variant, stemP, wl, cy);
  drawPeony3D(ctx, variant, state, flowerBl, wl, 400, cy);
  ctx.restore();
}

// Petal-tip position in buffer pixels; z > 0 is behind the flower. Same math as the drawn petal.
export function projectAnchor(variant, anchor, state, size) {
  const wl = state.wilt || 0;
  const it = petalAt(variant, state, anchor.layer, anchor.index, bloomParts(state.bloom).flowerBl, wl, state.brightBoost || 0);
  if (!it) return null;
  const k = FLOWER_BUFFER_SCALE * size / 400;
  return {
    x: (400 + it.sx + it.pl * cos(it.sa)) * k,
    y: (800 * 0.48 + wl * 55 + it.sy + it.pl * sin(it.sa)) * k,
    z: it.rz,
  };
}

// Projected tips of the two outermost layers (every 2nd petal) pushed into `out` (cleared first), for dynamic annotation anchors.
export function outerTips(variant, state, size, out = []) {
  out.length = 0;
  for (const layer of [variant.layers, variant.layers - 1]) {
    const np = numPetals(variant, layer);
    for (let index = 0; index < np; index += 2) {
      const p = projectAnchor(variant, { layer, index }, state, size);
      if (p) out.push(p);
    }
  }
  return out;
}
