// Ember particles on a DPR-1 overlay canvas. Ported from flowerSketch.js updateParticles/drawParticles.
import { random, constrain } from './math.js';

export function createParticles(canvas, rand) {
  const ctx = canvas.getContext('2d');
  let list = [];
  let acc = 0;
  let drew = false;

  return {
    resize(w, h) { canvas.width = w; canvas.height = h; drew = false; },
    // f = { cx, cy, flowerR, px, py, speed, glow, max, variant }
    update(dt, f) {
      const spawnRate = (10 + f.speed * 0.15 + f.glow * 6) * (f.max >= 60 ? 1 : 0.5);
      acc += spawnRate * dt;
      const innerR = Math.max(8, f.flowerR * 0.12);
      const outerR = Math.max(24, f.flowerR * 1.05);
      while (acc > 1 && list.length < f.max) {
        acc -= 1;
        const angle = random(rand, 0, Math.PI * 2);
        const dist = random(rand, innerR, outerR);
        const speed = random(rand, 0.08, 0.4);
        const life = random(rand, 0.7, 1.8);
        const col = f.variant[rand() < 0.55 ? 'c1' : 'c2'];
        list.push({
          x: f.cx + Math.cos(angle) * dist, y: f.cy + Math.sin(angle) * dist * 0.8,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed * 0.6 - random(rand, 0.05, 0.25),
          life, maxLife: life, size: random(rand, 1, 3.2),
          r: constrain(col[0] + random(rand, -25, 25), 0, 255),
          g: constrain(col[1] + random(rand, -25, 25), 0, 255),
          b: constrain(col[2] + random(rand, -25, 25), 0, 255),
          sparkle: rand() < 0.1,
        });
      }
      if (list.length > f.max) list.length = f.max;
      // 60 fps-equivalent steps: legacy velocities are per frame
      const k = dt * 60;
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        p.life -= dt * 0.55;
        if (p.life <= 0) { list.splice(i, 1); continue; }
        const mdx = f.px - p.x, mdy = f.py - p.y, md = Math.hypot(mdx, mdy);
        if (md < 160 && md > 0.5) {
          const force = (1 - md / 160) * 0.25;
          p.vx += (mdx / md) * force * dt; p.vy += (mdy / md) * force * dt;
        }
        p.vx *= 0.985; p.vy *= 0.985; p.vy -= 0.015 * dt;
        p.x += p.vx * k; p.y += p.vy * k;
      }
    },
    draw() {
      if (!list.length && !drew) return; // clear only if the previous frame drew
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drew = list.length > 0;
      for (const p of list) {
        const a = p.life / p.maxLife;
        if (a < 0.01) continue;
        ctx.fillStyle = `rgba(${p.r | 0},${p.g | 0},${p.b | 0},${p.sparkle ? Math.min(1, a * 1.4) : a})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, (p.sparkle ? p.size * 1.5 : p.size) / 2, 0, Math.PI * 2); ctx.fill();
        if (p.sparkle) {
          ctx.fillStyle = `rgba(${p.r | 0},${p.g | 0},${p.b | 0},${a * 0.25})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 1.75, 0, Math.PI * 2); ctx.fill();
        }
      }
    },
    clear() { list = []; acc = 0; },
  };
}
