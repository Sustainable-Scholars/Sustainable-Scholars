/* ===== Effects-reel core: footage + zoom punches + flashes + scene host ===== */
const W = 1080, H = 1920, FPS = 30, N = 1237, DUR = EDIT.duration;
const NAVY = '#13203E', NAVY2 = '#1B2A4A', GOLD = '#C7A44D', CREAM = '#F4EFE3', INK = '#0B0B10', YEL = '#FFE45C', RED = '#E5383B', GRN = '#3DDC84';
const F = { serif: "'Playfair Display',serif", slam: "'Inter Tight',Inter,sans-serif", sans: 'Inter,sans-serif', mono: "'JetBrains Mono',monospace", ital: "'Instrument Serif',serif" };
const stage = document.getElementById('stage');
const box = (p, css, txt) => el('div', 'position:absolute;' + css, p, txt);
const svgEl = (p, html, css) => { const d = box(p, css || ''); d.innerHTML = html; return d; };
const pop = (t, t0, w = 18, z = 0.55) => spring(t - t0, w, z);
const WORDS = EDIT.words.map(w => ({ a: w[0], b: w[1], t: w[2].toLowerCase().replace(/[^a-z0-9'-]/g, '') }));
function T(txt, n = 0) { let k = 0; for (const w of WORDS) if (w.t === txt) { if (k === n) return w.a; k++; } throw new Error('word not found ' + txt + n); }
const vis = (t, a, b, fi = 0.18, fo = 0.14) => clamp(Math.min(easeOut((t - a) / fi), 1 - easeIn((t - (b - fo)) / fo)));
const pad4 = n => String(n).padStart(4, '0');
const head = box(stage, `left:0;top:0;width:${W}px;height:${H}px;overflow:hidden;background:#000;transform-origin:50% 30%`);
const headImg = el('img', `position:absolute;left:0;top:0;width:${W}px;height:${H}px;object-fit:cover`, head);
const broll = box(stage, `left:0;top:0;width:${W}px;height:${H}px;z-index:10`);
const flashEl = box(stage, `left:0;top:0;width:${W}px;height:${H}px;background:#fff;opacity:0;z-index:50`);
const SCENES = [], IMGS = [];
const loadImg = (p, src, css) => { const i = el('img', 'position:absolute;' + (css || ''), p); i.src = src; IMGS.push(i); return i; };
function scene(a, b, opt, build) { const root = box(broll, `left:0;top:0;width:${W}px;height:${H}px;display:none;transform-origin:50% 50%`); if (opt.full) root.style.background = `radial-gradient(ellipse at 50% 35%,${NAVY2},${NAVY} 70%)`; const upd = build(root); SCENES.push({ a, b, opt, root, upd }); return root; }
const ZP = [], FL = [];
let curSrc = '', ready = false;
async function seekAll(t) {
  if (!ready) { ready = true; await Promise.all(IMGS.map(i => i.decode().catch(() => { }))); }
  const idx = clamp(Math.floor(t * FPS + 0.5) + 1, 1, N), src = `frames/${pad4(idx)}.jpg`;
  if (src !== curSrc) { curSrc = src; headImg.src = src; await headImg.decode().catch(() => { }); }
  let z = 1 + 0.03 * (t / DUR), sx = 0, sy = 0;
  ZP.forEach(p => { const dt = t - p; if (dt > -0.12 && dt < 0) z *= 1 - 0.02 * seg(dt, -0.12, 0); if (dt >= 0 && dt < 1.2) { z *= 1 + 0.1 * Math.exp(-dt * 5); sx += Math.sin(dt * 80) * 6 * Math.exp(-dt * 12); } });
  head.style.transform = `translate(${sx.toFixed(1)}px,${sy.toFixed(1)}px) scale(${z.toFixed(4)})`;
  let fo = 0; FL.forEach(f => { const dt = t - f; if (dt >= -0.02 && dt < 0.5) fo = Math.max(fo, dt < 0.04 ? 1 : Math.exp(-(dt - 0.04) * 9)); }); flashEl.style.opacity = fo.toFixed(3);
  SCENES.forEach(s => { const o = vis(t, s.a, s.b, s.opt.fi ?? 0.16, s.opt.fo ?? 0.14); const on = o > 0.001; s.root.style.display = on ? 'block' : 'none'; if (!on) return; s.root.style.opacity = s.opt.full ? '1' : o.toFixed(3); s.root.style.transform = `scale(${(0.97 + 0.03 * easeOut(seg(t, s.a, s.a + 0.3))).toFixed(4)})`; s.upd(t); });
}
window.seekAllRef = seekAll;
