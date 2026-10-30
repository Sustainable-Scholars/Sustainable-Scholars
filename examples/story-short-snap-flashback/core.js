/* ============ Story short: core (footage layer, snap-burn transition, flashback look, bubble, captions) ============ */
const W = 1080, H = 1920, FPS = 30, N = 1411, DUR = EDIT.duration;
const NAVY = '#13203E', NAVY2 = '#1B2A4A', GOLD = '#C7A44D', CREAM = '#F4EFE3', INK = '#0B0B10';
const F = { serif: "'Playfair Display',serif", slam: "'Inter Tight',Inter,sans-serif", sans: 'Inter,sans-serif', mono: "'JetBrains Mono',monospace", ital: "'Instrument Serif',serif" };
const stage = document.getElementById('stage');
const box = (p, css, txt) => el('div', 'position:absolute;' + css, p, txt);
const WORDS = EDIT.words.map(w => ({ a: w[0], b: w[1], t: w[2].toLowerCase().replace(/[^a-z0-9'-]/g, '') }));
function wd(txt, n = 0) { let k = 0; for (const w of WORDS) if (w.t === txt) { if (k === n) return [w.a, w.b]; k++; } throw new Error('word not found ' + txt + n); }
const SNAP = EDIT.snap_edit;
const vis = (t, a, b, fi = 0.25, fo = 0.2) => clamp(Math.min(easeOut((t - a) / fi), 1 - easeIn((t - (b - fo)) / fo)));
const cvm = document.createElement('canvas').getContext('2d'); const textW = (s, f) => { cvm.font = f; return cvm.measureText(s).width; };

// ---------- footage layer (image sequence) ----------
const pad4 = n => String(n).padStart(4, '0');
const mkImg = (parent, css) => { const i = document.createElement('img'); i.style.cssText = 'position:absolute;left:0;top:0;width:1080px;height:1920px;object-fit:cover;' + (css || ''); if (parent) parent.appendChild(i); return i; };
const head = box(stage, `left:0;top:0;width:${W}px;height:${H}px;overflow:hidden;background:#000;transform-origin:50% 28%`);
const headImg = mkImg(head);
const ghostR = mkImg(stage, 'mix-blend-mode:screen;opacity:0;filter:url(#fxR)'), ghostC = mkImg(stage, 'mix-blend-mode:screen;opacity:0;filter:url(#fxC)');
stage.insertAdjacentHTML('beforeend', '<svg width="0" height="0" style="position:absolute"><filter id="fxR"><feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/></filter><filter id="fxC"><feColorMatrix type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"/></filter></svg>');
const slices = Array.from({ length: 7 }, () => { const d = box(stage, `left:0;top:0;width:${W}px;height:${H}px;overflow:hidden;opacity:0`); return { d, img: mkImg(d) }; });
const bubble = box(stage, 'left:44px;top:150px;width:210px;height:210px;border-radius:50%;overflow:hidden;border:6px solid ' + GOLD + ';box-shadow:0 14px 40px rgba(0,0,0,.45);opacity:0;z-index:20');
const bubImg = mkImg(bubble, 'width:778px;height:1382px;left:-285px;top:-150px;object-fit:fill');
const allImgs = [headImg, ghostR, ghostC, bubImg, ...slices.map(s => s.img)];
let curSrc = '';
async function setFrame(t) {
  const idx = clamp(Math.floor(t * FPS + 0.5) + 1, 1, N), src = `frames/${pad4(idx)}.jpg`;
  if (src === curSrc) return; curSrc = src; allImgs.forEach(i => i.src = src);
  await Promise.all(allImgs.map(i => i.decode().catch(() => { })));
}

// ---------- b-roll host ----------
const broll = box(stage, `left:0;top:0;width:${W}px;height:${H}px;z-index:10`);
const SCENES = [];
function scene(a, b, opt, build) { const root = box(broll, `left:0;top:0;width:${W}px;height:${H}px;display:none;transform-origin:50% 50%`); if (opt.full) root.style.background = `radial-gradient(ellipse at 50% 35%,${NAVY2},${NAVY} 70%)`; const upd = build(root); SCENES.push({ a, b, opt, root, upd }); return root; }

// ---------- flashback furniture ----------
const fb = box(stage, `left:0;top:0;width:${W}px;height:${H}px;pointer-events:none;z-index:30;opacity:0`);
const fbVig = box(fb, `left:0;top:0;width:${W}px;height:${H}px;background:radial-gradient(ellipse at 50% 45%,rgba(0,0,0,0) 38%,rgba(40,18,0,.62) 100%)`);
const fbLeak = box(fb, `left:-200px;top:0;width:700px;height:${H}px;background:linear-gradient(90deg,rgba(255,140,40,.55),rgba(255,90,20,.0));mix-blend-mode:screen`);
const barT = box(fb, `left:0;top:0;width:${W}px;height:100px;background:#0b0704`), barB = box(fb, `left:0;bottom:0;width:${W}px;height:100px;background:#0b0704`);
const spr = side => box(fb, `${side}:0;top:0;width:40px;height:${H}px;background:#0b0704;overflow:hidden`);
const sprL = spr('left'), sprR = spr('right');
const holes = p => { const h = box(p, 'left:10px;top:-60px;width:20px;height:' + (H + 120) + 'px;background:repeating-linear-gradient(180deg,#2c2218 0 30px,transparent 30px 70px);border-radius:3px'); return h; };
const holeL = holes(sprL), holeR = holes(sprR);
const dust = Array.from({ length: 16 }, () => box(fb, 'width:5px;height:5px;border-radius:50%;background:rgba(255,248,230,.8)'));
const scr1 = box(fb, 'top:0;width:2px;height:' + H + 'px;background:rgba(255,240,210,.35)'), scr2 = box(fb, 'top:0;width:1px;height:' + H + 'px;background:rgba(255,240,210,.25)');
const flick = box(fb, `left:0;top:0;width:${W}px;height:${H}px;background:#000;opacity:0`);
const fbTag = box(stage, `left:70px;top:130px;font:600 28px ${F.mono};letter-spacing:5px;color:#FFE7B0;opacity:0;z-index:31;text-shadow:0 2px 8px rgba(0,0,0,.7);white-space:nowrap`);
const grainTiles = [0, 1, 2, 3].map(k => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), d = x.createImageData(256, 256), r = rng(300 + k); for (let i = 0; i < d.data.length; i += 4) { const v = r() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 22; } x.putImageData(d, 0, 0); return c.toDataURL(); });
const grain = box(stage, `left:0;top:0;width:${W}px;height:${H}px;pointer-events:none;z-index:32;opacity:0;background-size:256px 256px;mix-blend-mode:overlay`);

// ---------- snap-burn transition layers ----------
const flash = box(stage, `left:0;top:0;width:${W}px;height:${H}px;pointer-events:none;z-index:60;opacity:0;background:#FFF4E0`);
const ring = box(stage, 'left:0;top:0;width:200px;height:200px;border-radius:50%;pointer-events:none;z-index:59;opacity:0;border:10px solid #FFE3A8;box-shadow:0 0 60px #FFB65A');
const rays = box(stage, `left:0;top:0;width:${W}px;height:${H}px;pointer-events:none;z-index:58;opacity:0`);
rays.innerHTML = '<svg width="1080" height="1920" viewBox="0 0 1080 1920">' + Array.from({ length: 18 }, (_, i) => { const a = i / 18 * 6.283 + 0.1; return `<line x1="${540 + Math.cos(a) * 150}" y1="${900 + Math.sin(a) * 150}" x2="${540 + Math.cos(a) * 1300}" y2="${900 + Math.sin(a) * 1300}" stroke="#FFE9B8" stroke-width="${6 + (i % 3) * 4}" stroke-linecap="round" opacity="${0.5 + (i % 2) * 0.3}"/>`; }).join('') + '</svg>';

// ---------- timeline ----------
const EV = [{ t: SNAP, k: 'in', tag: '◀◀ FLASHBACK' }, { t: 15.28, k: 'jump', tag: '⏩ WEEKS LATER' }, { t: 18.42, k: 'out', tag: 'NOW ▶▶' }, { t: 36.1, k: 'in', tag: '◀◀ FLASHBACK' }, { t: 38.1, k: 'out', tag: 'NOW ▶▶' }];
const FBR = [[SNAP, 18.42], [36.1, 38.1]];
const SEAMS = EDIT.offsets.slice(1);                                       // jump-cut points, alternate punch-in hides them
const fbAmt = t => { let f = 0; FBR.forEach(([a, b]) => { f = Math.max(f, easeOut(seg(t, a, a + 0.35)) * (1 - easeIn(seg(t, b - 0.05, b + 0.25)))); }); return f; };
const seamZoom = t => { let n = 0; SEAMS.forEach(s => { if (t >= s) n++; }); return n % 2 ? 1.1 : 1.0; };

// ---------- captions ----------
const KEY = new Set(['shift', 'nothing', 'randomly', 'completely', 'different', 'target', 'dark', 'circle', 'debt', 'free', 'degree', 'scholarships', 'october', 'first', 'real', 'right']);
const CHUNKS = (() => { const out = []; let cur = []; WORDS.forEach((w, i) => { const nxt = WORDS[i + 1]; cur.push(w); const chars = cur.map(x => x.t).join(' ').length; if (cur.length >= 3 || chars > 13 || (nxt && chars + nxt.t.length > 16) || (nxt && nxt.a - w.b > 0.25)) { out.push(cur); cur = []; } }); if (cur.length) out.push(cur); return out; })();
const capLayer = box(stage, `left:0;top:1230px;width:${W}px;height:300px;z-index:40`);
const capEls = CHUNKS.map(ch => { const d = box(capLayer, `left:0;top:0;width:${W}px;text-align:center;font:900 84px/1.05 ${F.slam};text-transform:uppercase;letter-spacing:-1px;white-space:nowrap;display:none;transform-origin:50% 60%`); const sp = ch.map(w => { const s = el('span', 'display:inline-block;margin:0 20px;color:#fff;-webkit-text-stroke:10px #000;paint-order:stroke fill;text-shadow:0 6px 0 rgba(0,0,0,.55)', d, w.t.replace(/^i$/, 'I')); return s; }); return { d, sp, ch, a: ch[0].a - 0.06, b: ch[ch.length - 1].b + 0.14 }; });
function updCaps(t, boost) { capLayer.style.display='none'; return;
  capEls.forEach(c => { const on = t >= c.a && t < c.b; c.d.style.display = on ? 'block' : 'none'; if (!on) return; const k = spring(t - c.a, 22, 0.6); c.d.style.transform = `scale(${(0.82 + 0.18 * k).toFixed(3)}) translateY(${px((1 - k) * 24)})`; c.d.style.opacity = clamp((t - c.a) / 0.06).toFixed(2);
    c.sp.forEach((s, i) => { const w = c.ch[i], act = t >= w.a && t < w.b + 0.04, key = KEY.has(w.t); s.style.color = act ? GOLD : (key ? '#FFE9A8' : '#fff'); s.style.transform = act ? 'scale(1.14) translateY(-4px)' : 'none'; }); });
}

// ---------- main seek ----------
async function seekAll(t) {
  await setFrame(t);
  // transition parameters (sum of events)
  let flashO = 0, zoom = 1, rgb = 0, tear = 0, leak = 0, ringK = -1, ringT = 0, raysO = 0, tag = '', tagO = 0, shakeX = 0, shakeY = 0, slide = 0;
  EV.forEach(e => { const dt = t - e.t;
    if (dt > -0.3 && dt < 0) zoom *= 1 - 0.035 * seg(dt, -0.3, 0);
    if (dt >= -0.03 && dt < 0.6) { const f = dt < 0.05 ? 1 : Math.exp(-(dt - 0.05) * 11); flashO = Math.max(flashO, f * (e.k === 'jump' ? 0.75 : 1)); }
    if (dt >= 0 && dt < 0.9) { zoom *= 1 + (e.k === 'out' ? 0.18 : 0.30) * Math.exp(-dt * 5.2); rgb = Math.max(rgb, 34 * Math.exp(-dt * 8)); tear = Math.max(tear, dt > 0.02 && dt < 0.5 ? 80 * Math.exp(-dt * 8) : 0); leak = Math.max(leak, 0.9 * Math.exp(-dt * 2.6)); shakeX += Math.sin(dt * 90) * 18 * Math.exp(-dt * 10); shakeY += Math.cos(dt * 70) * 14 * Math.exp(-dt * 10); }
    if (dt >= 0 && dt < 0.7) { ringK = dt / 0.7; ringT = e.k; }
    if (dt >= 0 && dt < 0.4) raysO = Math.max(raysO, (1 - dt / 0.4));
    if (e.k === 'out' && dt >= 0 && dt < 0.55) slide = Math.max(slide, 1 - easeOut(dt / 0.55));
    if (dt >= 0.25 && dt < 2.2) { tag = e.tag; tagO = Math.max(tagO, easeOut(seg(dt, 0.25, 0.5)) * (1 - easeIn(seg(dt, 1.8, 2.2)))); }
  });
  const f = fbAmt(t);
  // footage
  const slow = 1 + 0.012 * (t % 6);
  const wx = f * (rng(Math.floor(t * 12) + 5)() - 0.5) * 3, wy = f * (rng(Math.floor(t * 12) + 99)() - 0.5) * 3;
  const sc = seamZoom(t) * zoom * slow;
  head.style.transform = `translate(${px(shakeX + wx + slide * 90)},${px(shakeY + wy)}) scale(${sc.toFixed(4)})`;
  head.style.filter = f > 0.01 ? `sepia(${(0.78 * f).toFixed(3)}) saturate(${(1 + 0.25 * f).toFixed(3)}) contrast(${(1 + 0.14 * f).toFixed(3)}) brightness(${(1 - 0.07 * f + 0.03 * Math.sin(t * 40) * f).toFixed(3)})` : 'none';
  [ghostR, ghostC].forEach((g, i) => { g.style.opacity = rgb > 0.5 ? (0.55).toFixed(2) : 0; g.style.transform = `translate(${px((i ? 1 : -1) * rgb + shakeX)},${px(shakeY)}) scale(${sc.toFixed(4)})`; g.style.transformOrigin = '50% 28%'; });
  slices.forEach((s, i) => { const on = tear > 1; s.d.style.opacity = on ? 1 : 0; if (!on) return; const y0 = i * (H / 7), r = rng(Math.floor(t * 30) * 7 + i)(); s.d.style.clipPath = `inset(${y0}px 0 ${H - y0 - H / 7}px 0)`; s.d.style.transform = `translateX(${px((r - 0.5) * 2 * tear)})`; s.img.style.transform = `scale(${sc.toFixed(4)})`; s.img.style.transformOrigin = '50% 28%'; s.img.style.filter = head.style.filter; });
  // b-roll
  let bub = 0;
  SCENES.forEach(s => { const o = vis(t, s.a, s.b, s.opt.fi ?? 0.25, s.opt.fo ?? 0.2); const on = o > 0.001; s.root.style.display = on ? 'block' : 'none'; if (!on) return; s.root.style.opacity = o.toFixed(3); s.root.style.transform = `scale(${(0.96 + 0.04 * easeOut(seg(t, s.a, s.a + 0.35))).toFixed(4)})`; s.root.style.filter = s.opt.cold ? `saturate(.75) hue-rotate(-8deg) brightness(${(0.9).toFixed(2)})` : 'none'; if (s.opt.full) bub = Math.max(bub, o); s.upd(t, t - s.a); });
  broll.style.filter = f > 0.01 ? `sepia(${(0.62 * f).toFixed(3)}) contrast(${(1 + 0.1 * f).toFixed(3)})` : 'none';
  bubble.style.display='none'; bubble.style.opacity = '0'; bubble.style.transform = `scale(${(0.85 + 0.15 * bub).toFixed(3)})`;
  bubble.style.filter = f > 0.01 ? `sepia(${(0.78 * f).toFixed(3)})` : 'none';
  // flashback furniture
  fb.style.opacity = f.toFixed(3); barT.style.height = px(100 * f); barB.style.height = px(100 * f);
  holeL.style.transform = holeR.style.transform = `translateY(${px((t * 260) % 70)})`;
  fbLeak.style.transform = `translateX(${px(400 * Math.sin(t * 0.9))})`; fbLeak.style.opacity = (0.25 + 0.2 * Math.sin(t * 2.3) + leak * 0.6).toFixed(3);
  const dr = rng(Math.floor(t * 12) + 1); dust.forEach(d => { d.style.left = px(60 + dr() * 960); d.style.top = px(dr() * H); d.style.opacity = dr() > 0.55 ? 1 : 0; d.style.transform = `scale(${(0.5 + dr() * 1.4).toFixed(2)})`; });
  const sr = rng(Math.floor(t * 8) + 17); scr1.style.left = px(80 + sr() * 920); scr1.style.opacity = sr() > 0.6 ? 1 : 0; scr2.style.left = px(80 + sr() * 920); scr2.style.opacity = sr() > 0.7 ? 1 : 0;
  flick.style.opacity = (0.05 * (0.5 + 0.5 * Math.sin(t * 53)) * f).toFixed(3);
  fbTag.textContent = tag + ((Math.floor(t * 3) % 2 === 0 && tagO > 0.1) ? '  ●' : ''); fbTag.style.opacity = tagO.toFixed(3); fbTag.style.top = px(f > 0.5 ? 130 : 130);
  grain.style.opacity = (0.35 + 0.5 * f).toFixed(2); grain.style.backgroundImage = `url(${grainTiles[Math.floor(t * 12) % 4]})`;
  // transition layers
  flash.style.opacity = flashO.toFixed(3);
  if (ringK >= 0) { const r = 200 + 1500 * easeOut(ringK); ring.style.opacity = (1 - ringK).toFixed(3); ring.style.width = ring.style.height = px(r); ring.style.transform = `translate(${px(700 - r / 2)},${px(760 - r / 2)})`; } else ring.style.opacity = 0;
  rays.style.opacity = (raysO * 0.8).toFixed(3); rays.style.transform = `scale(${(1 + (1 - raysO) * 0.6).toFixed(3)})`;
  updCaps(t);
  await seekExtras(t);
}
async function seekExtras(t) { }
