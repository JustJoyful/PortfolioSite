// WebGL post stage. Browser only. WebGL2 context running GLSL ES 1.00, falling back to WebGL1.
import vert from './post.vert?raw';
import frag from './post.frag?raw';

const FLOATS = ['grid', 'mode', 'prevMode', 'modeT', 'glitchCount', 'glow', 'time', 'presence', 'falloffX', 'scrim', 'stars'];

export function createPost(canvas, { frag: fragSrc = frag } = {}) {
  const opts = { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'high-performance' };
  let gl = canvas.getContext('webgl2', opts);
  let backend = 'webgl2';
  if (!gl) { gl = canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts); backend = 'webgl'; }
  if (!gl) return null;
  canvas.dataset.bloomGl = '1'; // the canvas can no longer take a 2d context

  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  let prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vert));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fragSrc));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (e) {
    console.warn('bloom: shader failed', e);
    return null;
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const U = {};
  const uni = (n) => (U[n] ??= gl.getUniformLocation(prog, n));
  const makeTex = (unit, filter) => {
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };
  const flowerTex = makeTex(0, gl.NEAREST);
  const atlasTex = makeTex(1, gl.LINEAR);
  gl.uniform1i(uni('flower'), 0);
  gl.uniform1i(uni('atlas'), 1);

  let W = 1, H = 1, dpr = 1, lost = false;
  const upload = (unit, tex, src) => {
    if (lost) return;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
  };
  const lostHandlers = [];
  const onLostEvt = (e) => { e.preventDefault(); lost = true; lostHandlers.forEach((cb) => cb()); };
  canvas.addEventListener('webglcontextlost', onLostEvt);

  return {
    backend,
    resize(w, h, d) {
      W = w; H = h; dpr = d;
      canvas.width = Math.max(1, Math.round(w * d));
      canvas.height = Math.max(1, Math.round(h * d));
      gl.viewport(0, 0, canvas.width, canvas.height);
    },
    uploadFlower: (src) => upload(0, flowerTex, src),
    uploadAtlas: (src) => upload(1, atlasTex, src),
    draw(u) {
      if (lost) return;
      gl.uniform2f(uni('res'), W, H);
      gl.uniform1f(uni('dpr'), dpr);
      gl.uniform4fv(uni('rect'), u.rect);
      gl.uniform3fv(uni('highlight'), u.highlight);
      gl.uniform4fv(uni('glitch[0]'), u.glitch);
      gl.uniform4fv(uni('ripples[0]'), u.ripples);
      for (const n of FLOATS) gl.uniform1f(uni(n), u[n]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    onLost: (cb) => lostHandlers.push(cb),
    destroy() {
      canvas.removeEventListener('webglcontextlost', onLostEvt);
      if (lost) return;
      gl.deleteTexture(flowerTex); gl.deleteTexture(atlasTex);
      gl.deleteBuffer(buf); gl.deleteProgram(prog);
    },
  };
}
