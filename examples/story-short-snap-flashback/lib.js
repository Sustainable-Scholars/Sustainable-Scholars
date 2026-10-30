// ===== shared helpers (from the explainer skills) =====
function spring(t, w = 14, z = 0.82) {
  if (t <= 0) return 0;
  if (z >= 1) return 1 - Math.exp(-w * t) * (1 + w * t);
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + (z * w / wd) * Math.sin(wd * t));
}
const track = (v0, keys) => t => { let v = v0, p = v0; for (const [tk, val, w, z] of keys) { v += (val - p) * spring(t - tk, w, z); p = val; } return v; };
const kf = keys => t => { if (t <= keys[0][0]) return keys[0][1]; for (let i = 1; i < keys.length; i++) { const [a, va] = keys[i - 1], [b, vb, e = ease] = keys[i]; if (t <= b) return lerp(va, vb, e((t - a) / (b - a))); } return keys[keys.length - 1][1]; };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = x => (x = clamp(x), x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const lerp = (a, b, k) => a + (b - a) * k;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const rng = s => () => (s = (s + 0x6D2B79F5) | 0, s = Math.imul(s ^ (s >>> 15), 1 | s), s ^= s + Math.imul(s ^ (s >>> 7), 61 | s), ((s ^ (s >>> 14)) >>> 0) / 4294967296);
// extra helpers
const easeOut = x => 1 - Math.pow(1 - clamp(x), 3);
const easeIn = x => Math.pow(clamp(x), 3);
const easeOutQuint = x => 1 - Math.pow(1 - clamp(x), 5);
const easeOutBack = (x, s = 1.70158) => { x = clamp(x); return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); };
const typed = (full, t, t0, cps = 25) => full.slice(0, Math.min(full.length, Math.floor(Math.max(0, t - t0) * cps)));
const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, k) => { const A = hex2rgb(a), B = hex2rgb(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], k))).join(',')})`; };
// make a DOM element: el('div', 'css text', parent, 'text')
function el(tag, css, parent, text) { const e = document.createElement(tag); if (css) e.style.cssText = css; if (text != null) e.textContent = text; if (parent) parent.appendChild(e); return e; }
const px = v => v.toFixed(2) + 'px';

// ===== stage + preview player =====
function boot({ w, h, duration, seek: seekFn, buildAudio, bg = '#000' }) {
  const isRender = location.search.includes('render');
  const stage = document.getElementById('stage');
  document.documentElement.style.cssText = 'margin:0;height:100%;background:' + (isRender ? bg : '#111');
  document.body.style.cssText = 'margin:0;overflow:hidden;height:100%;';
  stage.style.cssText += `position:absolute;left:0;top:0;width:${w}px;height:${h}px;overflow:hidden;background:${bg};transform-origin:0 0;`;
  window.VIDEO = { w, h, duration };
  window.seek = t => seekFn(t);
  if (buildAudio) window.buildAudio = buildAudio;
  seekFn(0);
  if (isRender) return;
  const bar = el('div', 'position:fixed;left:0;right:0;bottom:0;height:46px;background:#000c;color:#ddd;display:flex;align-items:center;gap:12px;padding:0 14px;font:13px system-ui;z-index:9');
  document.body.appendChild(bar);
  const btn = el('button', 'width:70px;height:28px;border-radius:6px;border:0;background:#fff;color:#000;font-weight:600;cursor:pointer', bar, 'Play');
  const rangeEl = el('input', 'flex:1', bar); rangeEl.type = 'range'; rangeEl.min = 0; rangeEl.max = duration; rangeEl.step = 0.01; rangeEl.value = 0;
  const lab = el('span', 'width:90px;text-align:right;font-variant-numeric:tabular-nums', bar, '0.00s');
  function fit() { const k = Math.min(innerWidth / w, (innerHeight - 46) / h); stage.style.transform = `translate(${(innerWidth - w * k) / 2}px,${(innerHeight - 46 - h * k) / 2}px) scale(${k})`; }
  addEventListener('resize', fit); fit();
  let buf, ac, src, startAt = 0, offset = 0, playing = false;
  async function play() {
    ac ??= new AudioContext();
    if (!buf && buildAudio) { const off = new OfflineAudioContext(2, Math.ceil(48000 * duration), 48000); await buildAudio(off); buf = await off.startRendering(); }
    if (buf) { src = ac.createBufferSource(); src.buffer = buf; src.connect(ac.destination); src.start(0, offset % duration); }
    startAt = ac.currentTime; playing = true; btn.textContent = 'Pause';
  }
  function pause() { if (!playing) return; offset += ac.currentTime - startAt; if (src) src.stop(); playing = false; btn.textContent = 'Play'; }
  const now = () => playing ? (offset + ac.currentTime - startAt) % duration : offset;
  btn.onclick = () => playing ? pause() : play();
  rangeEl.oninput = () => { const was = playing; if (was) pause(); offset = +rangeEl.value; if (was) play(); };
  (function loop() { const t = now(); seekFn(t); if (playing) { rangeEl.value = t; } lab.textContent = t.toFixed(2) + 's'; requestAnimationFrame(loop); })();
}

// ===== sound kit (works on any AudioContext / OfflineAudioContext) =====
const A = {
  master(ctx, gain = 0.9) {
    const g = ctx.createGain(); g.gain.value = gain;
    const c = ctx.createDynamicsCompressor(); c.threshold.value = -14; c.ratio.value = 3; c.attack.value = 0.005; c.release.value = 0.2;
    g.connect(c); c.connect(ctx.destination); return g;
  },
  noise(ctx, secs, seed = 1) { const n = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * secs), ctx.sampleRate); const d = n.getChannelData(0), r = rng(seed); for (let i = 0; i < d.length; i++) d[i] = r() * 2 - 1; return n; },
  env(g, t, a, peak, d, end = 0.0001) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(end, t + a + d); },
  tone(ctx, out, t, f, dur, { type = 'sine', g = 0.15, a = 0.004, f2 = null, lp = null } = {}) {
    const o = ctx.createOscillator(), gn = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    A.env(gn, t, a, g, dur);
    let node = o; if (lp) { const l = ctx.createBiquadFilter(); l.type = 'lowpass'; l.frequency.value = lp; o.connect(l); node = l; }
    node.connect(gn); gn.connect(out); o.start(t); o.stop(t + dur + a + 0.05);
  },
  burst(ctx, out, t, dur, { type = 'bandpass', f = 2000, q = 1, g = 0.2, seed = 3, f2 = null, a = 0.002 } = {}) {
    const s = ctx.createBufferSource(); s.buffer = A.noise(ctx, dur + 0.1, seed);
    const flt = ctx.createBiquadFilter(); flt.type = type; flt.frequency.setValueAtTime(f, t); if (f2) flt.frequency.exponentialRampToValueAtTime(f2, t + dur); flt.Q.value = q;
    const gn = ctx.createGain(); A.env(gn, t, a, g, dur);
    s.connect(flt); flt.connect(gn); gn.connect(out); s.start(t); s.stop(t + dur + 0.1);
  },
  kick(ctx, out, t, g = 0.9) { A.tone(ctx, out, t, 150, 0.22, { g, f2: 42, a: 0.002 }); A.burst(ctx, out, t, 0.02, { type: 'highpass', f: 3000, g: g * 0.15 }); },
  clap(ctx, out, t, g = 0.4) { for (let i = 0; i < 3; i++) A.burst(ctx, out, t + i * 0.011, 0.09, { f: 1500, q: 0.8, g: g * (i === 2 ? 1 : 0.6), seed: 7 + i }); },
  hat(ctx, out, t, g = 0.1, open = false) { A.burst(ctx, out, t, open ? 0.16 : 0.04, { type: 'highpass', f: 7500, g, seed: 11 }); },
  click(ctx, out, t, g = 0.12, f = 3200) { A.burst(ctx, out, t, 0.012, { f, q: 3, g, seed: 5 }); },
  pluck(ctx, out, t, f, dur = 0.5, g = 0.13) { A.tone(ctx, out, t, f, dur, { type: 'triangle', g, lp: 2600 }); A.tone(ctx, out, t, f * 2, dur * 0.5, { type: 'sine', g: g * 0.3 }); },
  pad(ctx, out, t, notes, dur, g = 0.05) { notes.forEach(f => { const o = ctx.createOscillator(), o2 = ctx.createOscillator(), gn = ctx.createGain(), l = ctx.createBiquadFilter(); o.type = 'sawtooth'; o2.type = 'sawtooth'; o.frequency.value = f; o2.frequency.value = f * 1.004; l.type = 'lowpass'; l.frequency.value = 1100; gn.gain.setValueAtTime(0.0001, t); gn.gain.linearRampToValueAtTime(g, t + dur * 0.3); gn.gain.linearRampToValueAtTime(0.0001, t + dur); o.connect(l); o2.connect(l); l.connect(gn); gn.connect(out); o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05); }); },
  bass(ctx, out, t, f, dur, g = 0.28) { A.tone(ctx, out, t, f, dur, { type: 'sine', g }); A.tone(ctx, out, t, f * 2, dur * 0.6, { type: 'triangle', g: g * 0.2 }); },
  whoosh(ctx, out, t, dur = 0.5, up = true, g = 0.16) { A.burst(ctx, out, t, dur, { f: up ? 300 : 3500, f2: up ? 3500 : 300, q: 0.9, g, a: dur * 0.5, seed: 21 }); },
  riser(ctx, out, t, dur, g = 0.18) { const s = ctx.createBufferSource(); s.buffer = A.noise(ctx, dur + 0.1, 31); const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(7000, t + dur); const gn = ctx.createGain(); gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(g, t + dur); gn.gain.linearRampToValueAtTime(0.0001, t + dur + 0.02); s.connect(f); f.connect(gn); gn.connect(out); s.start(t); s.stop(t + dur + 0.1); },
  boom(ctx, out, t, g = 0.9) { A.tone(ctx, out, t, 90, 0.9, { g, f2: 28 }); A.burst(ctx, out, t, 0.5, { type: 'lowpass', f: 1800, f2: 120, g: g * 0.5, seed: 41 }); },
  chime(ctx, out, t, f, g = 0.1) { [1, 2.01, 3.02, 4.2].forEach((m, i) => A.tone(ctx, out, t, f * m, 1.8 / (i + 1), { g: g / (i + 1), a: 0.003 })); },
  tick(ctx, out, t, f = 900, g = 0.08) { A.tone(ctx, out, t, f, 0.05, { type: 'square', g, lp: 4000 }); },
  note: m => 440 * Math.pow(2, (m - 69) / 12)
};
