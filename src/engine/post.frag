// Renders the offscreen flower buffer as ASCII glyphs, dots or pixel squares. GLSL ES 1.00.
// All px uniforms are CSS px; `dpr` converts gl_FragCoord. Highp is needed for the cell hash.
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform sampler2D flower;
uniform sampler2D atlas;
uniform vec2 res;       // canvas size, CSS px
uniform float dpr;
uniform vec4 rect;      // flower rect: ox, oy, w, h
uniform float grid;     // integer cell size, CSS px
uniform float mode;     // 0 ascii, 1 dots, 2 pixels
uniform float prevMode;
uniform float modeT;
uniform vec4 glitch[8]; // y, h, offset, colourShift
uniform float glitchCount;
uniform float glow;
uniform float time;
uniform float presence;
uniform float falloffX;
uniform float scrim;
uniform vec3 highlight; // x, y, radius (0 = off)
uniform vec4 ripples[4]; // x, y, radius, life
uniform float stars;

const float NGLYPH = 42.0;

float cellHash(vec2 s) { return mod(s.x * 73.0 + s.y * 137.0, 256.0) * 0.00392; }
float hash21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

// Flower layer colour at CSS-px position p (rgb, black where empty).
vec3 scene(vec2 p) {
  float done = step(0.99, modeT);
  float ascii = mode < 0.5 && done > 0.5 ? 1.0 : 0.0;
  float g = ascii > 0.5 ? max(grid, 6.0) : grid;
  vec2 cell = floor(p / g);
  vec2 s = cell * g;                      // legacy sx, sy
  vec2 uv = (s - rect.xy) / rect.zw;
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x >= 1.0 || uv.y >= 1.0) return vec3(0.0);
  vec3 c = texture2D(flower, uv).rgb;
  if ((c.r + c.g + c.b) * 255.0 < 12.0) return vec3(0.0);
  float bright = dot(c, vec3(0.299, 0.587, 0.114)) * 255.0;
  float m = mode;
  if (done < 0.5) m = cellHash(s) < modeT ? mode : prevMode;
  vec2 cc = s + 0.5 * g;
  vec2 d = p - cc;
  float aa = 0.75 / dpr;
  float a = 0.0;
  if (m < 0.5) {
    float fs = floor(g * 1.1 * (0.4 + bright * 0.004));
    float side = max(fs / 0.8, 1.0);      // atlas glyph is 0.8 of its cell
    vec2 l = d / side + 0.5;
    if (l.x < 0.0 || l.y < 0.0 || l.x > 1.0 || l.y > 1.0) return vec3(0.0);
    float gi = mod(floor(bright / 4.0) + floor((s.x * 7.0 + s.y * 13.0) / 8.0), NGLYPH);
    a = texture2D(atlas, vec2((gi + clamp(l.x, 0.001, 0.999)) / NGLYPH, l.y)).a;
  } else if (m < 1.5) {
    float r = g * (0.1 + bright * 0.0033) * 0.5;
    a = 1.0 - smoothstep(r - aa, r + aa, length(d));
  } else {
    float h = g * 0.93 * 0.5;
    vec2 q = abs(d) - h;
    a = 1.0 - smoothstep(-aa, aa, max(q.x, q.y));
  }
  return c * a;
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, res.y * dpr - gl_FragCoord.y) / dpr;

  // glitch: shift the flower layer inside a slice
  float off = 0.0, cs = 0.0;
  for (int i = 0; i < 8; i++) {
    if (float(i) < glitchCount && p.y >= glitch[i].x && p.y < glitch[i].x + glitch[i].y) {
      off = glitch[i].z; cs = glitch[i].w;
    }
  }
  vec3 col;
  if (off == 0.0) col = scene(p);
  else if (cs < 0.5) col = scene(p - vec2(off, 0.0));
  else col = scene(p) + 0.7 * scene(p - vec2(off * 1.5, 0.0)) + 0.45 * scene(p + vec2(off, 0.0));

  // presence, radial falloff to the content column, vertical scrim
  vec2 centre = rect.xy + 0.5 * rect.zw;
  float dim = presence;
  if (falloffX > 0.0) {
    float R = max(abs(falloffX - centre.x), 1.0);
    dim *= 1.0 - smoothstep(0.35, 1.0, length(p - centre) / R);
  }
  dim *= 1.0 - scrim * 0.45 * smoothstep(0.2, 0.7, p.y / res.y);
  col *= dim;

  // glow: one analytic falloff replacing the three legacy gradients
  float R = max(res.x, res.y) * 0.55;
  float t = length(p - centre) / R;
  float gl = 0.70 * (1.0 - smoothstep(0.04, 0.75, t)) + 0.2 * (1.0 - smoothstep(0.28, 1.0, t));
  col += vec3(0.93, 0.60, 0.73) * gl * glow * 0.18 * dim;

  // annotation highlight
  if (highlight.z > 0.0) {
    float k = 1.0 - smoothstep(0.0, highlight.z, length(p - highlight.xy));
    col = col * (1.0 + 1.2 * k) + vec3(1.0, 0.82, 0.92) * 0.06 * k;
  }

  // ripples
  for (int i = 0; i < 4; i++) {
    vec4 r = ripples[i];
    if (r.w > 0.0) {
      float w = max(1.2 * r.w, 0.6);
      float ring = 1.0 - smoothstep(w * 0.5, w * 0.5 + 0.75 / dpr, abs(length(p - r.xy) - r.z));
      col += vec3(1.0, 0.765, 0.824) * ring * r.w * 0.3;
    }
  }

  // stars: one hashed point per 56px cell, slow twinkle
  if (stars > 0.5) {
    vec2 sc = floor(p / 56.0);
    float h = hash21(sc);
    if (h > 0.45) {
      vec2 sp = (sc + 0.15 + 0.7 * vec2(hash21(sc + 3.1), hash21(sc + 7.7))) * 56.0;
      float r = 0.5 + hash21(sc + 1.3) * 0.7;
      float tw = 0.55 + 0.45 * sin(time * (0.3 + h) + h * 40.0);
      float s = (1.0 - smoothstep(r, r + 1.0 / dpr, length(p - sp))) * tw * (0.3 + 0.5 * hash21(sc + 9.9));
      col += vec3(s);
    }
  }
  gl_FragColor = vec4(col, 1.0);
}
