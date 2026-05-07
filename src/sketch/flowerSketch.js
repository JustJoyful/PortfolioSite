import p5 from "p5";

export const createSketch = (onReady) => {
  return function (p) {
    const BUF_W = 400, BUF_H = 400;
    let buf;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*'.split('');
    let ctx;

    let elements = [];
    let curEl = 0;

    let phase = 'growing';
    let phaseT = 0;

    let bloom = 0;
    let bloomTarget = 1;
    let _lastBloom = -1;

    let renderMode = 0, prevMode = 0, modeT = 1;

    let grid = 4, gridTarget = 4;
    const GRID_MIN = 4, GRID_MAX = 20;
    let densDir = 1, densTimer = 0;

    let mInfX = 0, mInfY = 0;
    let t = 0;

    let rotX = 0, rotY = 0, rotZ = 0;
    let autoRotX = 0, autoRotY = 0, autoRotZ = 0;
    let mouseRotX = 0, mouseRotY = 0;
    let targetMouseRotX = 0, targetMouseRotY = 0;
    let rotEaseIn = 0;

    let active = true;
    let loadingPhase = true;
    let warmFrames = 0;
    const WARM_TARGET = 60;

    let glitchTimer = 0;
    let glitchActive = false;
    let glitchIntensity = 0;
    let glitchSlices = [];

    let wilt = 0;
    let _lastWilt = -1;

    // Atmospheric effects
    let particles = [];
    const PARTICLE_MAX = 100;
    let ripples = [];
    let glowIntensity = 0;
    let targetGlowIntensity = 0;
    let prevMouseX = 0, prevMouseY = 0;
    let mouseSpeed = 0;
    let particleSpawnAccum = 0;

    const easeInOutCubic = (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4);

    p.setup = function () {
      p.createCanvas(p.windowWidth, p.windowHeight);
      p.pixelDensity(1);
      p.textFont('Courier New, monospace');
      p.textAlign(p.CENTER, p.CENTER);
      p.noStroke();

      buf = p.createGraphics(BUF_W, BUF_H);
      buf.pixelDensity(1);
      // @ts-ignore
      buf.noSmooth();
      // @ts-ignore
      buf.canvas.getContext('2d', { willReadFrequently: true });

      // @ts-ignore
      ctx = p.drawingContext;

      elements = [
        { c1: [230, 130, 170], c2: [255, 210, 235], c3: [170, 60, 100], stemC: [55, 85, 40], layers: 14, petalsPerLayer: 9, maxRadius: 155, ruffleAmt: 12, sepals: 5 },
        { c1: [240, 170, 190], c2: [255, 230, 240], c3: [190, 90, 130], stemC: [55, 88, 42], layers: 15, petalsPerLayer: 10, maxRadius: 150, ruffleAmt: 14, sepals: 6 },
        { c1: [200, 100, 180], c2: [245, 185, 225], c3: [150, 45, 110], stemC: [50, 80, 38], layers: 13, petalsPerLayer: 9, maxRadius: 158, ruffleAmt: 13, sepals: 5 },
      ];

      startElement(0);
      particles = [];
      ripples = [];
      glowIntensity = 0;
      targetGlowIntensity = 0;
      prevMouseX = p.mouseX;
      prevMouseY = p.mouseY;
      mouseSpeed = 0;
      particleSpawnAccum = 0;
    };

    function startElement(idx) {
      curEl = idx;
      bloom = 0;
      bloomTarget = 1;
      _lastBloom = -1;
      _lastWilt = -1;
      wilt = 0;
      phase = 'growing';
      phaseT = 0;
      grid = GRID_MIN;
      gridTarget = GRID_MIN;
      densDir = 1;
      densTimer = 0;
      modeT = 1;
      particles = [];
      ripples = [];
      particleSpawnAccum = 0;
    }

    // @ts-ignore
    p.startExperience = function () {
      loadingPhase = false;
    };

    p.setActive = function (a) {
      if (a === active) return;
      active = a;
      if (a) {
        p.loop();
      } else {
        p.noLoop();
      }
    };

    p.draw = function () {
      if (!active && !loadingPhase) return;
      const dt = Math.min((p.deltaTime || 16) / 1000, 0.1);
      const f = elements[curEl];

      if (loadingPhase) {
        p.background(0);
        bloom = p.min(0.5, warmFrames / WARM_TARGET * 0.5);
        drawFlowerToBuffer(f, bloom, 0);
        warmFrames++;
        if (warmFrames >= WARM_TARGET) {
          onReady();
          // @ts-ignore
          p.startExperience();
        }
        return;
      }

      p.background(0);
      t += 0.016;

      // Mouse speed tracking
      const rawSpeed = p.dist(p.mouseX, p.mouseY, prevMouseX, prevMouseY);
      mouseSpeed += (rawSpeed - mouseSpeed) * 0.25;
      prevMouseX = p.mouseX;
      prevMouseY = p.mouseY;

      // Mouse-reactive glow: proximity + speed additive, with breath pulse
      const mouseDist = p.dist(p.mouseX, p.mouseY, p.width / 2, p.height / 2);
      const maxDist = Math.max(p.width, p.height) * 0.5;
      const proximity = p.constrain(1.0 - mouseDist / maxDist, 0.1, 1.0);
      const speedBoost = p.constrain(mouseSpeed * 0.04, 0, 0.5);
      targetGlowIntensity = p.constrain(proximity + speedBoost, 0.1, 1.0);
      glowIntensity += (targetGlowIntensity - glowIntensity) * dt * 2.2;
      const breathPulse = 1 + Math.sin(t * 0.47) * 0.12;
      const activeGlow = glowIntensity * breathPulse;

      drawBackgroundAtmosphere(f, activeGlow);

      rotEaseIn = p.min(1, rotEaseIn + dt * 0.08);
      const re = easeInOutCubic(rotEaseIn);

      autoRotY += dt * 0.3 * re;
      autoRotX += dt * 0.12 * p.sin(t * 0.15) * re;
      autoRotZ += dt * 0.08 * p.sin(t * 0.09 + 1.5) * re;

      targetMouseRotX = (p.mouseY - p.height / 2) / p.height * 1.2;
      targetMouseRotY = (p.mouseX - p.width / 2) / p.width * 1.8;
      mouseRotX += (targetMouseRotX - mouseRotX) * 0.04;
      mouseRotY += (targetMouseRotY - mouseRotY) * 0.04;

      rotX = autoRotX + mouseRotX * re;
      rotY = autoRotY + mouseRotY * re;
      rotZ = autoRotZ;

      if (phase === 'growing') {
        bloom += (bloomTarget - bloom) * 0.006;
        phaseT += dt;
        if (bloom > 0.98) { bloom = 1; phase = 'interactive'; phaseT = 0; }
      }

      densTimer += dt;
      // Speed-responsive interval: idle = slow/calm, fast mouse = rapid cycling
      const modeInterval = Math.max(0.5, 2.5 - mouseSpeed * 0.06);
      if (densTimer > modeInterval) {
        densTimer = 0;
        // 45% base chance at idle (~every 5-6s), scales up with mouse speed
        if (p.random() < 0.50 + mouseSpeed * 0.035) triggerGlitch();
        prevMode = renderMode;
        renderMode = (renderMode + 1) % 3;
        modeT = 0;
        if (densDir === 1) { gridTarget = GRID_MAX; densDir = -1; }
        else { gridTarget = GRID_MIN; densDir = 1; }
      }

      if (phase === 'interactive') {
        phaseT += dt;
        if (phaseT > 25) { phase = 'wilting'; phaseT = 0; triggerGlitch(); }
      }

      if (phase === 'wilting') {
        wilt = p.min(1, wilt + dt * 0.04);
        phaseT += dt;
        if (wilt > 0.95) { phase = 'waiting'; phaseT = 0; }
      }

      if (phase === 'waiting') {
        phaseT += dt;
        if (phaseT > 0.6) {
          prevMode = renderMode;
          renderMode = (renderMode + 1) % 3;
          modeT = 0;
          triggerGlitch();
          startElement((curEl + 1) % elements.length);
        }
      }

      grid += (gridTarget - grid) * 0.08;
      modeT = p.min(1, modeT + dt * 4.0);

      updateGlitch(dt);

      if (phase === 'interactive') {
        mInfX += ((p.mouseX - p.width / 2) * 0.08 - mInfX) * 0.04;
        mInfY += ((p.mouseY - p.height / 2) * 0.08 - mInfY) * 0.04;
      } else {
        mInfX *= 0.95;
        mInfY *= 0.95;
      }

      updateParticles(dt, f);
      updateRipples(dt);

      drawFlowerToBuffer(f, bloom, wilt, glowIntensity);

      glitchTimer -= dt;
      if (glitchTimer <= 0 && !glitchActive) {
        // Longer intervals: 8–18s idle, shorter when moving fast
        const idleInterval = Math.max(4, 18 - mouseSpeed * 0.5);
        glitchTimer = p.random(idleInterval * 0.6, idleInterval);
        // 12% base chance, rises to 40% only during fast mouse movement
        const glitchChance = p.constrain(0.12 + mouseSpeed * 0.015, 0.12, 0.4);
        if (p.random() < glitchChance) triggerGlitch();
      }

      renderToScreen();
      drawGlitchOverlay();
      drawParticles();
      drawRipples();
      drawFPS();
    };

    function triggerGlitch() {
      glitchActive = true;
      // Intensity and slice count scale with mouse speed — subtle at idle, sharp when provoked
      const speedFactor = p.constrain(mouseSpeed / 20, 0, 1);
      glitchIntensity = p.random(0.15 + speedFactor * 0.2, 0.45 + speedFactor * 0.45);
      glitchSlices = [];
      const scaleF = p.min(p.width / BUF_W, p.height / BUF_H) * 0.85;
      const rW = BUF_W * scaleF, rH = BUF_H * scaleF;
      const fOx = (p.width - rW) / 2 + mInfX;
      const fOy = (p.height - rH) / 2 + mInfY;
      // Fewer slices at idle (1–3), more when shaking the mouse (2–7)
      const numSlices = p.floor(p.random(1 + speedFactor * 1, 3 + speedFactor * 4));
      for (let i = 0; i < numSlices; i++) {
        const sy = p.random(fOy, fOy + rH);
        const sh = p.min(p.random(2, rH * 0.06), fOy + rH - sy);
        glitchSlices.push({
          y: sy, h: sh, fx: fOx, fw: rW,
          offset: p.random(-50, 50) * glitchIntensity,
          colorShift: p.random() < 0.25,
          duration: p.random(0.06, 0.18)
        });
      }
    }

    function updateGlitch(dt) {
      if (!glitchActive) return;
      let allDone = true;
      for (const s of glitchSlices) {
        s.duration -= dt;
        if (s.duration > 0) allDone = false;
        else s.offset *= 0.7;
      }
      if (allDone) { glitchActive = false; glitchSlices = []; }
    }

    function drawGlitchOverlay() {
      if (!glitchActive || !glitchSlices.length) return;
      for (const s of glitchSlices) {
        if (p.abs(s.offset) < 0.5) continue;
        const sx = p.floor(s.fx), sy = p.floor(s.y), sw = p.floor(s.fw), sh = p.floor(s.h);
        if (sw < 1 || sh < 1) continue;
        if (s.colorShift) {
          ctx.save();
          ctx.globalAlpha = 0.7;
          ctx.globalCompositeOperation = 'lighter';
          ctx.drawImage(ctx.canvas, sx, sy, sw, sh, sx + s.offset * 1.5, sy, sw, sh);
          ctx.globalAlpha = 0.45;
          ctx.drawImage(ctx.canvas, sx, sy, sw, sh, sx - s.offset, sy, sw, sh);
          ctx.restore();
        } else {
          ctx.drawImage(ctx.canvas, sx, sy, sw, sh, sx + s.offset, sy, sw, sh);
        }
      }
    }

    function drawFlowerToBuffer(f, bl, wl, brightBoost = 0) {
      buf.background(0);
      buf.noStroke();
      wl = wl || 0;
      const stemProgress = p.constrain(bl * 3, 0, 1);
      const flowerBloom = p.constrain((bl - 0.15) / 0.85, 0, 1);
      const wiltDroop = wl * 55;

      buf.push();
      // The math assumes an 800x800 space, but our optimized buffer is 400x400.
      // Scale it down so it fits perfectly without clipping.
      buf.scale(0.5);

      const virtualCX = 800 / 2;
      const virtualCY = 800 * 0.48 + wiltDroop;

      drawStem(buf, f, stemProgress, wl, virtualCX, virtualCY);
      drawPeony3D(buf, f, flowerBloom, wl, virtualCX, virtualCY, brightBoost);

      buf.pop();
      buf.loadPixels();
    }

    function drawStem(g, f, progress, wl, _cx, cy) {
      wl = wl || 0;
      const stemLen = 800 * 0.42; // Math uses virtual 800 height
      const stemX = 800 / 2;      // Math uses virtual 800 width
      const stemTop = cy;
      const stemBot = stemTop + stemLen;
      const visibleLen = stemLen * easeOutQuart(progress);
      const visibleTop = stemBot - visibleLen;
      for (let y = visibleTop; y < stemBot; y += 3) {
        const tt = (y - stemTop) / stemLen;
        const sw = p.lerp(15, 8, tt);
        const wiltBend = wl * 45 * (1 - tt) * p.sin((1 - tt) * p.PI);
        const curveX = p.sin(tt * p.PI * 0.3) * 22 + p.sin(tt * p.PI * 0.8) * 8 + wiltBend;
        let r = p.lerp(f.stemC[0], f.stemC[0] * 0.5, tt);
        let gc = p.lerp(f.stemC[1], f.stemC[1] * 0.5, tt);
        let b = p.lerp(f.stemC[2], f.stemC[2] * 0.5, tt);
        if (wl > 0) {
          r = p.lerp(r, r * 0.4 + 30, wl * 0.5);
          gc = p.lerp(gc, gc * 0.3 + 15, wl * 0.5);
          b = p.lerp(b, b * 0.25 + 8, wl * 0.5);
        }
        g.fill(r, gc, b);
        g.ellipse(stemX + curveX, y, sw, 5);
        g.fill(r * 1.4, gc * 1.4, b * 1.3, 50);
        g.ellipse(stemX + curveX - 2, y, sw * 0.2, 3);
      }
      if (progress > 0.3) {
        const leafP = p.constrain((progress - 0.3) / 0.4, 0, 1);
        const ly = stemTop + stemLen * 0.22;
        const lx = stemX + p.sin(0.22 * p.PI * 0.3) * 22;
        drawLeaf(g, lx, ly, -1, 48 * leafP, f.stemC);
      }
      if (progress > 0.5) {
        const leafP = p.constrain((progress - 0.5) / 0.4, 0, 1);
        const ly = stemTop + stemLen * 0.50;
        const lx = stemX + p.sin(0.50 * p.PI * 0.3) * 22;
        drawLeaf(g, lx, ly, 1, 42 * leafP, f.stemC);
      }
      if (progress > 0.7) {
        const leafP = p.constrain((progress - 0.7) / 0.3, 0, 1);
        const ly = stemTop + stemLen * 0.35;
        const lx = stemX + p.sin(0.35 * p.PI * 0.3) * 22;
        drawLeaf(g, lx, ly, -1, 35 * leafP, f.stemC);
      }
    }

    function drawLeaf(g, x, y, side, sz, sc) {
      if (sz < 2) return;
      g.push(); g.translate(x, y); g.rotate(side * 0.65);
      g.fill(sc[0] * 0.85, sc[1] * 1.15, sc[2] * 0.75);
      g.beginShape();
      g.vertex(0, 0);
      g.bezierVertex(sz * 0.35 * side, -sz * 0.38, sz * 0.85 * side, -sz * 0.22, sz * 1.35 * side, 0);
      g.bezierVertex(sz * 0.85 * side, sz * 0.22, sz * 0.35 * side, sz * 0.38, 0, 0);
      g.endShape(p.CLOSE);
      g.fill(sc[0] * 1.1, sc[1] * 1.4, sc[2] * 1.0, 60);
      g.beginShape();
      g.vertex(sz * 0.1 * side, 0);
      g.bezierVertex(sz * 0.4 * side, -sz * 0.15, sz * 0.7 * side, -sz * 0.08, sz * 1.0 * side, 0);
      g.bezierVertex(sz * 0.7 * side, sz * 0.08, sz * 0.4 * side, sz * 0.15, sz * 0.1 * side, 0);
      g.endShape(p.CLOSE);
      g.stroke(sc[0] * 1.3, sc[1] * 1.5, sc[2] * 1.2, 70);
      g.strokeWeight(0.8);
      g.line(0, 0, sz * 1.15 * side, 0);
      for (let i = 1; i <= 3; i++) {
        const vx = sz * 0.3 * i * side;
        g.line(vx, 0, vx + sz * 0.2 * side, -sz * 0.12);
        g.line(vx, 0, vx + sz * 0.2 * side, sz * 0.12);
      }
      g.noStroke(); g.pop();
    }

    function rot3D(x, y, z) {
      const cY = p.cos(rotY), sY = p.sin(rotY);
      const rx = x * cY + z * sY;
      const rz = -x * sY + z * cY;
      const cX = p.cos(rotX), sX = p.sin(rotX);
      const ry = y * cX - rz * sX;
      const rz2 = y * sX + rz * cX;
      const cZ = p.cos(rotZ), sZ = p.sin(rotZ);
      const fx = rx * cZ - ry * sZ;
      const fy = rx * sZ + ry * cZ;
      return [fx, fy, rz2];
    }

    function drawPeony3D(g, f, bl, wl, cx, cy, brightBoost = 0) {
      wl = wl || 0;
      const focal = 420;
      const wiltTilt = wl * 0.18;
      const cosW = p.cos(wiltTilt), sinW = p.sin(wiltTilt);
      const items = [];

      if (f.sepals && bl < 0.7) {
        const numS = f.sepals;
        const openAng = easeInOutCubic(bl) * p.HALF_PI * 0.9;
        let sepalAlpha = p.map(p.constrain(bl, 0, 0.7), 0, 0.7, 255, 0);
        if (wl) sepalAlpha *= (1 - wl);
        if (sepalAlpha > 5) {
          for (let i = 0; i < numS; i++) {
            const a = (p.TWO_PI / numS) * i;
            const sTilt = p.HALF_PI * 0.35 - openAng;
            const dist = 50;
            const ct = p.cos(sTilt), st = p.sin(sTilt);
            const x3 = p.cos(a) * dist * ct, z3 = p.sin(a) * dist * ct, y3 = -st * dist;
            const [rx, ry, rz] = rot3D(x3, y3, z3);
            const ps = focal / (focal + rz);
            const sepAng = p.atan2(ry, rx);
            const fv = p.max(focal / (focal + p.abs(rz)), 0.15);
            items.push({
              rz, tp: 's', sx: rx * ps, sy: ry * ps, sa: sepAng,
              sLen: 80 * ps, sW: 25 * ps * fv, sAlpha: sepalAlpha, sc: f.stemC
            });
          }
        }
      }

      const cAlpha = p.constrain((bl - 0.45) / 0.3, 0, 1) * (1 - wl);
      if (cAlpha > 0) items.push({ rz: 0, tp: 'c', sx: 0, sy: 0, sa: 0, alpha: cAlpha });

      for (let layer = f.layers; layer >= 0; layer--) {
        const lr = layer / f.layers;
        const layerDelay = (1 - lr) * 0.35;
        const layerBl = p.constrain((bl - layerDelay) / (1 - layerDelay), 0, 1);
        const ebl = easeInOutCubic(layerBl);
        if (ebl < 0.01) continue;
        const layerFall = p.constrain((wl * 1.4 - (1 - lr) * 0.4) / 0.6, 0, 1);
        if (layerFall > 0.9) continue;
        const innerBoost = (1 - lr);
        const np = f.petalsPerLayer + p.floor(layer * 1.5) + p.floor(innerBoost * 5);
        const baseR = p.lerp(10, f.maxRadius, lr);
        let tiltAngle = p.lerp(p.PI * 0.42, p.PI * 0.04, ebl) + layerFall * p.PI * 0.22;
        tiltAngle -= innerBoost * 0.15 * ebl;
        const cosTilt = p.cos(tiltAngle), sinTilt = p.sin(tiltAngle);

        for (let i = 0; i < np; i++) {
          const petalHash = ((i * 73 + layer * 137) & 0xFF) / 255;
          if (wl > 0.1 && petalHash < (wl - 0.1) * 1.3) continue;
          let angle = (p.TWO_PI / np) * i + layer * 0.42 + p.sin(layer * 2.1) * 0.12;
          angle += petalHash * 0.15;
          const droopAmt = layerFall * 0.5 * (0.4 + lr * 0.6);
          const shrink = 1 - layerFall * 0.35;
          const dist = baseR * ebl * (0.35 + lr * 0.25);
          let x3 = p.cos(angle) * dist * cosTilt, z3 = p.sin(angle) * dist * cosTilt, y3 = -sinTilt * dist + droopAmt * 28;
          if (wiltTilt > 0.001) {
            const ny = y3 * cosW - x3 * sinW * 0.3;
            x3 = x3 + y3 * sinW * 0.3; y3 = ny;
          }
          const [rx, ry, rz] = rot3D(x3, y3, z3);
          const ps = focal / (focal + rz);
          const sx = rx * ps, sy = ry * ps;
          const viewAngle = p.atan2(ry, rx);
          const depthFactor = focal / (focal + p.abs(rz));
          const faceVis = p.max(depthFactor, 0.12);
          const nx3 = p.cos(angle) * cosTilt, ny3 = -sinTilt, nz3 = p.sin(angle) * cosTilt;
          const [, , lnz] = rot3D(nx3, ny3, nz3);
          const lightDot = p.constrain(-lnz, -1, 1);
          const lightMod = p.map(lightDot, -1, 1, 0.32, 1.25 + brightBoost * 0.4);
          const cupFactor = (1 - lr) * (1 - ebl * 0.5) * 0.35;
          const pl = baseR * (0.2 + 0.8 * ebl) * (1.15 + innerBoost * 0.3) * shrink * ps;
          let pw = baseR * (0.15 + 0.85 * ebl) * 0.55 * shrink * ps * faceVis;
          pw *= (1 + cupFactor);
          const rPhase = i * 1.7 + layer * 0.9;
          const rAmt = f.ruffleAmt * ebl * (1 + layerFall * 2 + innerBoost * 0.5) * ps;
          const lA = p.sin(angle + layer * 0.5);
          const dM = p.map(layer, 0, f.layers, 0.35, 1.0);
          const bB = 0.4 + 0.6 * ebl;
          const cm = p.map(lA, -1, 1, 0.45, 1.2) * dM * bB * lightMod;
          let r = p.constrain(p.lerp(f.c1[0], f.c2[0], lr) * cm, 0, 255);
          let gr = p.constrain(p.lerp(f.c1[1], f.c2[1], lr) * cm, 0, 255);
          let b = p.constrain(p.lerp(f.c1[2], f.c2[2], lr) * cm, 0, 255);
          if (wl > 0) {
            const wf = p.min(1, layerFall * 1.3);
            r = p.lerp(r, r * 0.5 + 55, wf);
            gr = p.lerp(gr, gr * 0.28 + 22, wf);
            b = p.lerp(b, b * 0.12 + 6, wf);
          }
          items.push({ rz, tp: 'p', sx, sy, sa: viewAngle, pl, pw, rPhase, rAmt, r, gr, b, cup: cupFactor });
        }
      }

      items.sort((a, b) => a.rz - b.rz);

      for (const it of items) {
        if (it.tp === 'c') {
          g.push(); g.translate(cx, cy);
          const [cnx, cny, cnz] = rot3D(0, -1, 0);
          const cps = focal / (focal + cnz * 15);
          const csx = cnx * 15 * cps, csy = cny * 15 * cps;
          for (let r = 28; r > 0; r -= 3) {
            const ratio = r / 28;
            g.fill(
              p.lerp(f.c3[0] * 0.1, f.c3[0] * 0.7, ratio) * (it.alpha || 1),
              p.lerp(f.c3[1] * 0.1, f.c3[1] * 0.7, ratio) * (it.alpha || 1),
              p.lerp(f.c3[2] * 0.1, f.c3[2] * 0.7, ratio) * (it.alpha || 1)
            );
            g.ellipse(csx, csy, r * 2.2 * cps, r * 2.2 * cps);
          }
          if (bl > 0.65) {
            const sa2 = p.constrain((bl - 0.65) / 0.25, 0, 1) * (1 - wl);
            for (let i = 0; i < 22; i++) {
              const a = (p.TWO_PI / 22) * i;
              const d = 6 + (i % 5) * 3;
              const stX = p.cos(a) * d * sa2, stZ = p.sin(a) * d * sa2, stY = -3;
              const [srx, sry, srz] = rot3D(stX, stY, stZ);
              const stP = focal / (focal + srz);
              g.fill(f.c2[0] * 0.7, f.c2[1] * 0.5, f.c2[2] * 0.3, 140 * sa2);
              g.ellipse(srx * stP, sry * stP, 2.5 * stP, 2.5 * stP);
            }
          }
          g.pop();

        } else if (it.tp === 's') {
          if (!it.sW || it.sW < 1) continue;
          g.push(); g.translate(cx + it.sx, cy + it.sy); g.rotate(it.sa);
          g.fill(it.sc[0] * 0.7, it.sc[1] * 1.0, it.sc[2] * 0.6, it.sAlpha);
          g.beginShape();
          g.vertex(0, 0);
          g.bezierVertex(it.sLen * 0.3, -it.sW * 0.6, it.sLen * 0.7, -it.sW * 0.4, it.sLen, 0);
          g.bezierVertex(it.sLen * 0.7, it.sW * 0.4, it.sLen * 0.3, it.sW * 0.6, 0, 0);
          g.endShape(p.CLOSE);
          g.pop();

        } else {
          if (!it.pw || it.pw < 0.5) continue;
          g.push(); g.translate(cx + it.sx, cy + it.sy); g.rotate(it.sa);
          g.fill(it.r, it.gr, it.b);
          g.beginShape();
          for (let tt = 0; tt <= 1; tt += 0.07) {
            const px = tt * it.pl;
            const bW = p.sin(tt * p.PI) * it.pw;
            const cup = p.sin(tt * p.PI) * (it.cup || 0) * it.pw * 0.6;
            const ruf = p.sin(tt * 8 + it.rPhase) * it.rAmt * tt;
            if (!Number.isNaN(px) && !Number.isNaN(bW + ruf + cup)) {
              g.vertex(px, bW + ruf + cup);
            }
          }
          for (let tt = 1; tt >= 0; tt -= 0.07) {
            const px = tt * it.pl;
            const bW = p.sin(tt * p.PI) * it.pw;
            const cup = p.sin(tt * p.PI) * (it.cup || 0) * it.pw * 0.4;
            const ruf = p.sin(tt * 8 + it.rPhase + p.PI) * it.rAmt * tt;
            if (!Number.isNaN(px) && !Number.isNaN(-bW + ruf - cup)) {
              g.vertex(px, -bW + ruf - cup);
            }
          }
          g.endShape(p.CLOSE);
          g.pop();
        }
      }
    }

    function drawBackgroundAtmosphere(f, gi) {
      const ctx = p.drawingContext;
      if (!ctx) return;
      const cx = p.width / 2 + mInfX;
      const cy = p.height / 2 + mInfY;
      const r = Math.max(p.width, p.height) * 0.55;
      try {
        const grad = ctx.createRadialGradient(cx, cy, r * 0.06, cx, cy, r);
        const alpha = gi * 0.18; // was 0.045 — boosted to be visually present
        grad.addColorStop(0, 'rgba(' + f.c1[0] + ',' + Math.floor(f.c1[1] * 0.65) + ',' + Math.floor(f.c1[2] * 0.75) + ',' + alpha + ')');
        grad.addColorStop(0.45, 'rgba(' + Math.floor(f.c1[0] * 0.35) + ',' + Math.floor(f.c1[1] * 0.25) + ',' + Math.floor(f.c1[2] * 0.25) + ',' + alpha * 0.25 + ')');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, p.width, p.height);
      } catch (e) { /* ignore */ }
    }

    function updateParticles(dt, f) {
      const cx = p.width / 2 + mInfX;
      const cy = p.height / 2 + mInfY;
      const spawnRate = 10 + mouseSpeed * 0.15 + glowIntensity * 6;
      particleSpawnAccum += spawnRate * dt;

      // Scale spawn radius to actual flower screen size so particles hug petals.
      // Buffer is 400px drawn at 0.5x scale, then composited at scaleF.
      const scaleF = Math.min(p.width / BUF_W, p.height / BUF_H) * 0.85;
      const flowerScreenR = (f.maxRadius / 800) * BUF_W * scaleF * bloom;
      const innerR = Math.max(8, flowerScreenR * 0.12);
      const outerR = Math.max(24, flowerScreenR * 1.05);

      while (particleSpawnAccum > 1 && particles.length < PARTICLE_MAX) {
        particleSpawnAccum -= 1;
        const angle = p.random(p.TWO_PI);
        const dist = p.random(innerR, outerR);
        const sx = cx + Math.cos(angle) * dist;
        const sy = cy + Math.sin(angle) * dist * 0.8;
        // Radially outward velocity — embers off petals
        const speed = p.random(0.08, 0.4);
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed * 0.6 - p.random(0.05, 0.25);
        const life = p.random(0.7, 1.8);
        const size = p.random(1, 3.2);
        const colKey = p.random() < 0.55 ? 'c1' : 'c2';
        const col = f[colKey];
        particles.push({
          x: sx, y: sy, vx, vy, life, maxLife: life, size,
          r: p.constrain(col[0] + p.random(-25, 25), 0, 255),
          g: p.constrain(col[1] + p.random(-25, 25), 0, 255),
          b: p.constrain(col[2] + p.random(-25, 25), 0, 255),
          sparkle: p.random() < 0.1,
        });
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.life -= dt * 0.55;
        if (pt.life <= 0) { particles.splice(i, 1); continue; }

        const mdx = p.mouseX - pt.x;
        const mdy = p.mouseY - pt.y;
        const md = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < 160 && md > 0.5) {
          const force = (1 - md / 160) * 0.25;
          pt.vx += (mdx / md) * force * dt;
          pt.vy += (mdy / md) * force * dt;
        }

        pt.vx *= 0.985;
        pt.vy *= 0.985;
        pt.vy -= 0.015 * dt;
        pt.x += pt.vx;
        pt.y += pt.vy;
      }
    }

    function drawParticles() {
      p.noStroke();
      for (const pt of particles) {
        if (pt.life <= 0) continue;
        const alpha = (pt.life / pt.maxLife) * 255;
        if (alpha < 2) continue;
        if (pt.sparkle) {
          p.fill(pt.r, pt.g, pt.b, p.min(255, alpha * 1.4));
          p.ellipse(pt.x, pt.y, pt.size * 1.5, pt.size * 1.5);
          p.fill(pt.r, pt.g, pt.b, alpha * 0.25);
          p.ellipse(pt.x, pt.y, pt.size * 3.5, pt.size * 3.5);
        } else {
          p.fill(pt.r, pt.g, pt.b, alpha);
          p.ellipse(pt.x, pt.y, pt.size, pt.size);
        }
      }
    }

    function updateRipples(dt) {
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.life -= dt * 0.8; // was 2.2 — now lasts ~1.25s so ripple fully expands
        // Linear expansion instead of lerp — reaches maxRadius before dying
        const expandSpeed = rp.maxRadius * dt * 1.1;
        rp.radius = Math.min(rp.radius + expandSpeed, rp.maxRadius);
        if (rp.life <= 0) ripples.splice(i, 1);
      }
    }

    function drawRipples() {
      if (!ripples.length) return;
      const ctx = p.drawingContext;
      if (!ctx) return;
      for (const rp of ripples) {
        if (rp.life <= 0) continue;
        const alpha = rp.life * 0.3;
        ctx.save();
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,195,210,' + alpha + ')';
        ctx.lineWidth = 1.2 * rp.life;
        ctx.stroke();
        ctx.restore();
      }
    }

    function renderToScreen() {
      // @ts-ignore
      const px = buf.pixels;
      const g = p.max(4, p.round(grid));
      const asciiG = p.max(g, 6);
      const scaleF = p.min(p.width / BUF_W, p.height / BUF_H) * 0.85;
      const invScale = 1 / scaleF;
      const renderW = BUF_W * scaleF, renderH = BUF_H * scaleF;
      const ox = (p.width - renderW) / 2 + mInfX;
      const oy = (p.height - renderH) / 2 + mInfY;
      const curM = renderMode, prevM = prevMode, mt = modeT;
      const transitionDone = mt >= 0.99;
      const useNative = (curM === 0) || (!transitionDone && prevM === 0);
      if (useNative) { ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; }
      const gEff = (curM === 0 && transitionDone) ? asciiG : g;
      const halfG = gEff * 0.5;
      const yStart = p.max(0, p.floor(oy / gEff) * gEff);
      const yEnd = p.min(p.height, oy + renderH);
      const xStart = p.max(0, p.floor(ox / gEff) * gEff);
      const xEnd = p.min(p.width, ox + renderW);
      const asciiSize = gEff * 1.1;
      let lastFontStr = '';

      for (let sy = yStart; sy < yEnd; sy += gEff) {
        const byBase = p.floor((sy - oy) * invScale);
        if (byBase < 0 || byBase >= BUF_H) continue;
        const rowOff = byBase * BUF_W;
        for (let sx = xStart; sx < xEnd; sx += gEff) {
          const bx = p.floor((sx - ox) * invScale);
          if (bx < 0 || bx >= BUF_W) continue;
          const idx = (rowOff + bx) * 4;
          const r = px[idx], gr = px[idx + 1], b = px[idx + 2];
          if ((r + gr + b) < 12) continue;
          const bright = r * 0.299 + gr * 0.587 + b * 0.114;
          const cx = sx + halfG, cy = sy + halfG;
          let mode;
          if (transitionDone) {
            mode = curM;
          } else {
            const hash = ((sx * 73 + sy * 137) & 0xFF) * 0.00392;
            mode = hash < mt ? curM : prevM;
          }
          if (mode === 0) {
            const fontSz = p.floor(asciiSize * (0.4 + bright * 0.004));
            const fontStr = fontSz + 'px Courier New';
            if (fontStr !== lastFontStr) { ctx.font = fontStr; lastFontStr = fontStr; }
            ctx.fillStyle = 'rgb(' + r + ',' + gr + ',' + b + ')';
            const ci = ((bright >> 2) + ((sx * 7 + sy * 13) >> 3)) % chars.length;
            ctx.fillText(chars[ci], cx, cy);
          } else if (mode === 1) {
            p.fill(r, gr, b);
            const d = gEff * (0.1 + bright * 0.0033);
            p.ellipse(cx, cy, d, d);
          } else {
            p.fill(r, gr, b);
            p.rectMode(p.CENTER);
            p.rect(cx, cy, gEff * 0.93, gEff * 0.93);
          }
        }
      }
    }

    function drawFPS() {
      // Removed FPS overlay for production aesthetic
    }

    p.mousePressed = function () {
      if (loadingPhase) return;
      triggerGlitch();
      ripples.push({
        x: p.mouseX, y: p.mouseY,
        radius: 0, maxRadius: p.random(80, 200), life: 1,
      });
    };

    p.keyPressed = function () {
      if (p.key === 'g' || p.key === 'G') triggerGlitch();
    };

    let _resizeTimeout;
    p.windowResized = function () {
      clearTimeout(_resizeTimeout);
      _resizeTimeout = setTimeout(() => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
      }, 200);
    };
  };
};
