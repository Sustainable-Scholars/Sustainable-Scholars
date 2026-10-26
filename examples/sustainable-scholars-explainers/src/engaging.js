/* ============ Sustainable Scholars: one-take explainer (16 s seamless loop, 120 BPM = 8 bars) ============
 HERO: the white ball. It starts as the knob of a "Verified" toggle and travels through the workflow:
 0.0  lands on the toggle slot (seam)                                         tick
 0.5  cursor clicks, ball rolls to ON; toggle fills gold; caption "Filter · Verified"
 1.0  hop to slider; 1.5 lands; rolls 1.5-3.5, tooltip counts to "10,000+" (the site's number)
 3.5  falls off the end; bounces down three notification cards: 4.0 National Programs, 4.5 College Awards, 5.0 State & Local (the site's own tabs)
 5.0  falls to the keyboard; 6.0 A, 6.5 P, 7.0 P, 7.5 L, 8.0 Y types "apply"
 8.5  lands on the gold "Start my free match" button; 8.75 launched; toast "Your list arrives by email within 48 hours." (site wording)
 8.75-9.5 payoff hold; 9.5-10.7 camera pulls out (tilted) to the whole course; stations reset 10.5-12.0 while ball arcs overhead in slow motion
 13.0-15.7 dive back to the toggle; 16.0 ball lands = t 0
*/
const W = 1920, H = 1080, DUR = 16, G = 4500, R = 28;
const C = { bg: '#14161E', grid: '#262B3A', s1: '#222839', s2: '#2E3548', line: '#3A4259', txt: '#F2F2F7', dim: '#98A0B5', gold: '#C7A44D', ok: '#5CC68F' };
const F = { serif: "'Playfair Display',serif", sans: "Inter,system-ui,sans-serif" };
const stage = document.getElementById('stage');
const box = (parent, css, text) => el('div', `position:absolute;${css}`, parent, text);

// ---------------- stations (fixed world positions) ----------------
const TG = { x: 596, y: 500, xOn: 694 };                   // toggle knob slot positions
const SL = { x0: 1330, x1: 2300, y: 500 };                 // slider track
const CARDS = [{ x: 2640, top: 745, t: 4.0, lab: 'National Programs' }, { x: 2050, top: 1045, t: 4.5, lab: 'College Awards' }, { x: 1460, top: 1345, t: 5.0, lab: 'State & Local' }];
const KEYS = [{ x: 700, ch: 'A', t: 6.0 }, { x: 830, ch: 'P', t: 6.5 }, { x: 960, ch: 'P', t: 7.0 }, { x: 1090, ch: 'L', t: 7.5 }, { x: 1220, ch: 'Y', t: 8.0 }];
const KEYTOP = 1850, BTN = { x: 1850, top: 1850 };
const TOAST_T = 8.55, LAUNCH = 8.75;

const gridBg = `radial-gradient(${C.grid} 3.2px, transparent 3.8px)`;
const world = box(stage, `left:0;top:0;width:3400px;height:2500px;transform-origin:0 0;background-image:${gridBg};background-size:72px 72px;background-position:-200px -200px;will-change:transform`);
// toggle station
const tgCard = box(world, `left:220px;top:430px;width:600px;height:140px;border-radius:26px;background:${C.s1};border:2px solid ${C.line}`);
box(tgCard, `left:34px;top:42px;font:600 40px ${F.sans};color:${C.txt}`, 'Verified');
const tgTrack = box(world, `left:${TG.x - 36}px;top:${TG.y - 41}px;width:182px;height:82px;border-radius:41px;background:#2E3548;border:2px solid ${C.line}`);
const tgSlot = box(world, `left:${TG.x - R + 2}px;top:${TG.y - R}px;width:${2 * R - 4}px;height:${2 * R - 4}px;border-radius:50%;border:2px dashed #4A5370;margin:2px`);
const tgCap = box(world, `left:220px;top:372px;font:600 24px ${F.sans};color:${C.dim};letter-spacing:.3px;white-space:nowrap`);
// slider station
const slCard = box(world, `left:1230px;top:400px;width:1170px;height:200px;border-radius:26px;background:${C.s1};border:2px solid ${C.line}`);
for (let x = SL.x0; x <= SL.x1; x += 97) box(world, `left:${x - 1}px;top:${SL.y + 24}px;width:2px;height:14px;background:#4A5370`);
const slTrack = box(world, `left:${SL.x0}px;top:${SL.y - 6}px;width:${SL.x1 - SL.x0}px;height:12px;border-radius:6px;background:#3A4259`);
const slFill = box(world, `left:${SL.x0}px;top:${SL.y - 6}px;width:0px;height:12px;border-radius:6px;background:${C.gold}`);
const slTip = box(world, `left:0;top:${SL.y - 100}px;width:150px;height:48px;border-radius:12px;background:#fff;color:#111;text-align:center;font:700 26px/48px ${F.sans};opacity:0`);
const slCap = box(world, `left:1230px;top:342px;font:600 24px ${F.sans};color:${C.dim};white-space:nowrap`);
// notification cards
const cardEls = CARDS.map(c => { const d = box(world, `left:${c.x - 260}px;top:${c.top}px;width:520px;height:112px;border-radius:22px;background:#2A3145;border:2px solid ${C.line};opacity:0;transform-origin:50% 100%`); box(d, `left:22px;top:24px;width:62px;height:62px;border-radius:15px;background:${C.gold}`).innerHTML = `<svg width="62" height="62" viewBox="0 0 62 62" fill="none" stroke="#111" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 32l9 9 17-19"/></svg>`; box(d, `left:106px;top:20px;font:700 25px ${F.sans};color:#fff`, 'Matched'); box(d, `left:106px;top:56px;font:400 22px ${F.sans};color:${C.dim};white-space:nowrap`, c.lab); box(d, `right:24px;top:22px;font:400 18px ${F.sans};color:${C.dim}`, 'now'); return d; });
const mCap = box(world, `left:1180px;top:690px;font:600 24px ${F.sans};color:${C.dim};white-space:nowrap;opacity:0`, 'Matched · programs you qualify for');
// input + keyboard + button
const inp = box(world, `left:610px;top:1625px;width:720px;height:96px;border-radius:20px;background:#1B2130;border:2px solid ${C.line}`);
const inpTxt = box(inp, `left:30px;top:22px;font:500 42px ${F.sans};color:#fff;white-space:nowrap`);
const inpPh = box(inp, `left:30px;top:26px;font:400 36px ${F.sans};color:#5D6680;white-space:nowrap`, 'Search scholarships');
const inpCaret = box(inp, `left:30px;top:22px;width:3px;height:50px;background:${C.gold}`);
const kCap = box(world, `left:610px;top:1560px;font:600 24px ${F.sans};color:${C.dim};white-space:nowrap`, 'Search · type to match');
const keyEls = KEYS.map(k => { const d = box(world, `left:${k.x - 55}px;top:${KEYTOP}px;width:110px;height:110px;border-radius:20px;background:${C.s2};box-shadow:0 10px 0 #1A1F2C;text-align:center;font:700 46px/110px ${F.sans};color:#fff`, k.ch); return d; });
const btn = box(world, `left:${BTN.x - 280}px;top:${BTN.top}px;width:560px;height:112px;border-radius:24px;background:${C.gold};box-shadow:0 10px 0 #8E7432;text-align:center;font:700 36px/112px ${F.sans};color:#0A0F1A`, 'Start my free match  →');
const toast = box(world, `left:${BTN.x - 400}px;top:1700px;width:800px;height:96px;border-radius:48px;background:#10141F;border:3px solid #C7A44D;color:#fff;font:600 28px/90px ${F.sans};text-align:center;opacity:0;transform-origin:50% 100%`, 'Your list arrives by email within 48 hours.');
// hero + halo + cursor
const halo = box(world, 'left:0;top:0;width:360px;height:360px;border-radius:50%;background:radial-gradient(rgba(199,164,77,.55),rgba(199,164,77,0) 68%);opacity:0;pointer-events:none');
const hero = box(world, `left:0;top:0;width:${2 * R}px;height:${2 * R}px;border-radius:50%;background:#fff;box-shadow:0 6px 18px rgba(0,0,0,.45);z-index:30`);
const curEl = box(world, 'left:0;top:0;width:34px;height:40px;z-index:40;filter:drop-shadow(0 3px 5px rgba(0,0,0,.5))'); curEl.innerHTML = '<svg width="34" height="40" viewBox="0 0 34 40"><path d="M3 2 L3 30 L10.5 23.5 L16 36 L21.5 33.5 L16 21.5 L26 21.5 Z" fill="#fff" stroke="#111" stroke-width="2.2" stroke-linejoin="round"/></svg>';
const ripple = box(world, `left:0;top:0;width:90px;height:90px;border-radius:50%;border:3px solid ${C.gold};opacity:0;z-index:39`);

// ---------------- hero path ----------------
const ballistic = (t, t0, t1, x0, y0, x1, y1) => { const T = t1 - t0, u = (t - t0), vy0 = (y1 - y0) / T - 0.5 * G * T; return [lerp(x0, x1, u / T), y0 + vy0 * u + 0.5 * G * u * u]; };
const rollEase = (t, t0, t1, x0, y0, x1, y1) => { const k = ease((t - t0) / (t1 - t0)); return [lerp(x0, x1, k), lerp(y0, y1, k)]; };
const SY = KEYTOP - R, BY = BTN.top - R;
const SEGS = [
  [0.5, 1.0, rollEase, TG.x, TG.y, TG.xOn, TG.y], [1.0, 1.5, ballistic, TG.xOn, TG.y, SL.x0, SL.y], [1.5, 3.5, rollEase, SL.x0, SL.y, SL.x1, SL.y],
  [3.5, 4.0, ballistic, SL.x1, SL.y, CARDS[0].x, CARDS[0].top - R], [4.0, 4.5, ballistic, CARDS[0].x, CARDS[0].top - R, CARDS[1].x, CARDS[1].top - R], [4.5, 5.0, ballistic, CARDS[1].x, CARDS[1].top - R, CARDS[2].x, CARDS[2].top - R],
  [5.0, 6.0, ballistic, CARDS[2].x, CARDS[2].top - R, KEYS[0].x, SY], [6.0, 6.5, ballistic, KEYS[0].x, SY, KEYS[1].x, SY], [6.5, 7.0, ballistic, KEYS[1].x, SY, KEYS[2].x, SY], [7.0, 7.5, ballistic, KEYS[2].x, SY, KEYS[3].x, SY], [7.5, 8.0, ballistic, KEYS[3].x, SY, KEYS[4].x, SY],
  [8.0, 8.5, ballistic, KEYS[4].x, SY, BTN.x, BY]];
// launch: physical ballistic arc, retimed so it is slowest at the top
const LX0 = BTN.x, LY0 = BY + 18, LX1 = TG.x, LY1 = TG.y, APEX = 90;
const vy0 = -Math.sqrt(2 * G * (LY0 - APEX)), tUp = -vy0 / G, tDn = Math.sqrt(2 * (LY1 - APEX) / G), Tp = tUp + tDn;
const sp = s => 1 - 0.9 * Math.pow(Math.sin(Math.PI * s), 0.6);
const TAU = (() => { const n = 4000, a = [0]; for (let i = 1; i <= n; i++) a.push(a[i - 1] + 1 / sp((i - 0.5) / n) / n); const tot = a[n]; return a.map(v => v / tot); })();
const sOfTau = tau => { let lo = 0, hi = TAU.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; (TAU[m] < tau ? (lo = m) : (hi = m)); } const f = (tau - TAU[lo]) / (TAU[hi] - TAU[lo] || 1); return (lo + f) / (TAU.length - 1); };
function heroPos(t) {
  t = ((t % DUR) + DUR) % DUR;
  if (t < SEGS[0][0]) return [TG.x, TG.y];
  for (const [a, b, f, x0, y0, x1, y1] of SEGS) if (t < b) return f(t, a, b, x0, y0, x1, y1);
  if (t < LAUNCH) return [BTN.x, BY + 18 * easeOut(seg(t, 8.5, LAUNCH))];                // pressed into the button
  const s = sOfTau((t - LAUNCH) / (DUR - LAUNCH)), pt = s * Tp;
  return [lerp(LX0, LX1, s), LY0 + vy0 * pt + 0.5 * G * pt * pt];
}
const CONTACTS = [0, 1.5, 4.0, 4.5, 5.0, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5];
function squash(t) { let q = 0; CONTACTS.concat([DUR]).forEach(c => { const dt = t - c; if (dt >= 0 && dt < 0.2) q = Math.max(q, Math.sin(Math.PI * dt / 0.2)); }); return q; }

// ---------------- anchors + baked camera ----------------
const ANCH = { x: kf([[0, 645], [1.0, 645], [1.4, 1800], [3.4, 1800], [4.0, 2350], [4.9, 1750], [5.9, 960], [8.0, 1300], [8.5, 1750], [9.5, 1750]]),
  y: kf([[0, 500], [1.0, 500], [1.4, 500], [3.4, 500], [4.0, 880], [4.9, 1180], [5.9, 1830], [9.5, 1830]]),
  s: kf([[0, 1.2], [1.0, 1.2], [1.5, 0.95], [3.4, 0.95], [4.0, 1.0], [5.2, 1.0], [6.0, 0.95], [8.0, 0.88], [8.7, 0.9], [9.5, 0.9]]),
  wgt: kf([[0, 1], [0.9, 0.85], [1.0, 0.2], [1.5, 0.7], [3.4, 0.7], [3.6, 0.15], [4.0, 0.5], [5.0, 0.3], [5.4, 0.15], [6.0, 0.65], [8.0, 0.65], [8.4, 0.75], [9.5, 0.85]]) };
const BAKE_END = 9.6, DT = 1 / 240, camTab = [];
(function () {
  let x = 645, y = 500, vx = 0, vy = 0, s = 1.2; const w = 6;
  for (let t = 0; t <= BAKE_END + 0.01; t += DT) {
    const hp = heroPos(t), hq = heroPos(t + 0.02), hvx = (hq[0] - hp[0]) / 0.02, hvy = (hq[1] - hp[1]) / 0.02, k = ANCH.wgt(t);
    const tx = lerp(hp[0] + 0.15 * hvx, ANCH.x(t), k), ty = lerp(hp[1] + 0.15 * hvy, ANCH.y(t), k);
    const ax = w * w * (tx - x) - 2 * w * vx, ay = w * w * (ty - y) - 2 * w * vy; vx += ax * DT; vy += ay * DT; x += vx * DT; y += vy * DT;
    s += (ANCH.s(t) - s) * (1 - Math.exp(-8 * DT)); camTab.push([x, y, s]);
  }
})();
const camBaked = t => { const f = clamp(t / DT, 0, camTab.length - 1), i = Math.floor(f), j = Math.min(camTab.length - 1, i + 1), k = f - i; return camTab[i].map((v, n) => lerp(v, camTab[j][n], k)); };
const WIDE = [1560, 1130, 0.52], TOGGLE = [645, 500, 1.2];
function camera(t) { // [fx, fy, scale, tilt]
  if (t <= BAKE_END) { const c = camBaked(t); return [c[0], c[1], c[2], 0]; }
  const b = camBaked(BAKE_END);
  if (t < 13.0) { const k = ease(seg(t, BAKE_END, 10.9)); return [lerp(b[0], WIDE[0], k), lerp(b[1], WIDE[1], k), lerp(b[2], WIDE[2], k), 19 * k]; }
  const k = ease(seg(t, 13.0, 15.7)); return [lerp(WIDE[0], TOGGLE[0], k), lerp(WIDE[1], TOGGLE[1], k), lerp(WIDE[2], TOGGLE[2], k * k * (3 - 2 * k)), 19 * (1 - k)];
}

// ---------------- station state + draw ----------------
const resetK = (t, a, b) => seg(t, a, b);
const persp = box(stage, `left:0;top:0;width:${W}px;height:${H}px;perspective:2200px;perspective-origin:50% 50%;`); persp.appendChild(world);
function seekAll(t) {
  const [fx, fy, s, tilt] = camera(t);
  world.style.transform = `translate(${W / 2}px,${H / 2}px) rotateX(${tilt.toFixed(2)}deg) scale(${s.toFixed(4)}) translate(${(-fx).toFixed(2)}px,${(-fy).toFixed(2)}px)`;
  world.style.transformOrigin = '0 0';
  // hero
  const [hx, hy] = heroPos(t); const q = squash(t); const sx = 1 + 0.28 * q, sy = 1 - 0.22 * q; const big = kf([[9.4, 1], [10.9, 2.3], [14.6, 2.3], [15.8, 1]])(t) * 1;
  hero.style.transform = `translate(${px(hx - R)},${px(hy - R)}) scale(${(sx * big).toFixed(3)},${(sy * big).toFixed(3)})`; hero.style.transformOrigin = '50% 100%';
  const hv = clamp(seg(t, 10.0, 11.0) * (1 - seg(t, 15.0, 15.9)));
  halo.style.opacity = hv.toFixed(3); halo.style.transform = `translate(${px(hx - 180)},${px(hy - 180)}) scale(${(0.7 + 0.5 * hv).toFixed(3)})`;
  // toggle
  const on = easeOut(seg(t, 0.62, 1.0)) * (1 - easeIn(seg(t, 10.5, 11.0)));
  tgTrack.style.background = mix('#2E3548', C.gold, on); tgTrack.style.borderColor = mix('#3A4259', C.gold, on);
  tgSlot.style.opacity = '0.9';
  tgSlot.style.left = px(lerp(TG.x, TG.xOn, on) - R + 2); tgCap.textContent = on > 0.5 ? 'Filter · Verified' : 'Filter · All';
  // slider
  const p = ease(seg(t, 1.5, 3.5)) * (1 - ease(seg(t, 11.0, 11.8)));
  const tx = lerp(SL.x0, SL.x1, p); slFill.style.width = px(tx - SL.x0);
  const tipO = Math.max(Math.min(seg(t, 1.45, 1.8), 1 - seg(t, 3.9, 4.3)), t > 10.5 ? Math.min(seg(t, 10.5, 10.7), 1 - seg(t, 11.6, 11.9)) : 0); slTip.style.opacity = clamp(tipO).toFixed(2);
  slTip.style.transform = `translate(${px(tx - 75)},0)`; slTip.textContent = (Math.round(p * 100) >= 99 ? '10,000+' : Math.round(p * 10000).toLocaleString('en-US'));
  slCap.textContent = p > 0.97 ? 'Search · 10,000+ verified scholarships' : 'Search · 1,400+ colleges'; slCap.style.opacity = (0.5 + 0.5 * p).toFixed(2);
  // cards
  cardEls.forEach((d, i) => { const c = CARDS[i], pop = spring(t - c.t, 16, 0.55), dis = easeIn(seg(t, 10.7 + i * 0.25, 11.2 + i * 0.25)); const k = clamp(pop) * (1 - dis); d.style.opacity = clamp(Math.max(seg(t, c.t - 0.05, c.t + 0.1), 0) * (1 - dis)).toFixed(3); d.style.transform = `translateY(${px(11 * Math.max(0, 1 - Math.abs(t - c.t - 0.06) / 0.14) + (1 - clamp(pop)) * 14)}) scale(${(0.9 + 0.1 * clamp(pop)).toFixed(3)})`; });
  mCap.style.opacity = clamp(seg(t, 4.2, 4.8) * (1 - seg(t, 10.7, 11.2))).toFixed(2);
  // keys + input
  let typedN = 0; KEYS.forEach((k, i) => { if (t >= k.t) typedN = i + 1; const dt = t - k.t, dip = dt >= 0 && dt < 0.25 ? Math.sin(Math.PI * dt / 0.25) : 0; keyEls[i].style.transform = `translateY(${px(10 * dip)})`; keyEls[i].style.boxShadow = `0 ${px(10 - 8 * dip)} 0 #1A1F2C`; keyEls[i].style.background = mix('#2E3548', C.gold, dip * 0.6); });
  const clr = seg(t, 12.0, 12.5); const shown = 'apply'.slice(0, Math.max(0, Math.round(typedN * (1 - clr)))); inpTxt.textContent = shown; inpPh.style.opacity = shown.length ? 0 : 1;
  inpCaret.style.left = px(30 + textW(shown, `500 42px ${F.sans}`) + 2); inpCaret.style.opacity = (t > 5.4 && t < 12.6 && Math.floor(t * 3) % 2 === 0) ? 1 : 0;
  kCap.style.opacity = (0.4 + 0.6 * clamp(seg(t, 5.0, 6.0))).toFixed(2);
  // button + toast
  const press = (t > 8.45 && t < LAUNCH + 0.1) ? easeOut(seg(t, 8.45, 8.6)) * (1 - seg(t, LAUNCH, LAUNCH + 0.12)) : 0;
  btn.style.transform = `translateY(${px(10 * press)})`; btn.style.boxShadow = `0 ${px(10 - 9 * press)} 0 #8E7432`;
  const tk = easeOutBack(seg(t, TOAST_T, TOAST_T + 0.4)) * (1 - easeIn(seg(t, 10.9, 11.4)));
  toast.style.opacity = clamp(tk).toFixed(3); toast.style.transform = `translateY(${px((1 - clamp(tk)) * 24)}) scale(${(0.85 + 0.15 * clamp(tk)).toFixed(3)})`;
  // cursor: clicks the toggle at 0.5, then leaves
  const cx0 = kf([[0, TG.x + 260], [0.25, TG.x + 40], [0.5, TG.x + 8], [1.1, TG.x + 160], [1.6, TG.x + 420]])(t), cy0 = kf([[0, 640], [0.25, 560], [0.5, 520], [1.1, 600], [1.6, 760]])(t);
  const cOp = (t < 1.6 ? 1 : 0) * (1 - seg(t, 1.1, 1.6)) * easeOut(seg(t, 0, 0.15)) + 0;
  const cd = (t > 0.42 && t < 0.62) ? 1 - 0.2 * Math.sin(Math.PI * (t - 0.42) / 0.2) : 1;
  curEl.style.opacity = cOp.toFixed(3); curEl.style.transform = `translate(${px(cx0)},${px(cy0)}) scale(${cd.toFixed(3)})`; curEl.style.transformOrigin = '3px 2px';
  const rk = seg(t, 0.5, 1.05); ripple.style.opacity = t > 0.5 && t < 1.05 ? (0.8 * (1 - rk)).toFixed(3) : 0; ripple.style.transform = `translate(${px(TG.x + 8 - 45)},${px(520 - 45)}) scale(${(0.25 + rk * 1.6).toFixed(3)})`;
}
const cvs = document.createElement('canvas'), cx2 = cvs.getContext('2d'); const textW = (s2, font) => { cx2.font = font; return cx2.measureText(s2).width; };

// ---------------- sound: rendered into its own longer context, tail folded back onto the start (seamless loop) ----------------
async function buildAudio(ctx) {
  const sr = ctx.sampleRate, EXT = 2.5; const oc = new OfflineAudioContext(2, Math.ceil(sr * (DUR + EXT)), sr); const out = A.master(oc, 0.9);
  const beat = 0.5, roots = [36, 33, 29, 31], pent = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84, 86];
  for (let t = 0; t < DUR + 1; t += beat) { A.kick(oc, out, t, t < 3.4 ? 0.28 : 0.4); A.hat(oc, out, t + beat / 2, 0.05); if (Math.round(t / beat) % 4 === 3) A.clap(oc, out, t, 0.07); }
  for (let b = 0; b < 9; b++) { const t = b * 2, r = roots[b % 4]; A.bass(oc, out, t, A.note(r + 12), 0.45, 0.2); A.bass(oc, out, t + 0.75, A.note(r + 12), 0.3, 0.14); A.bass(oc, out, t + 1.5, A.note(r + 19), 0.4, 0.14); }
  // hero contacts are the instrument; pitch rises with the story
  CONTACTS.concat([DUR]).forEach((c, i) => { const n = pent[Math.min(i, pent.length - 1)]; A.tone(oc, out, c, A.note(n), 0.5, { type: 'sine', g: 0.2, a: 0.002 }); A.tone(oc, out, c, A.note(n + 12), 0.25, { type: 'triangle', g: 0.07 }); A.click(oc, out, c, 0.1, 1800); });
  A.click(oc, out, 0.5, 0.2, 1500); A.tone(oc, out, 0.5, 700, 0.12, { type: 'triangle', g: 0.07 });
  for (let t = 1.55, i = 0; t < 3.5; t += 0.32 - 0.2 * ((t - 1.5) / 2), i++) A.tick(oc, out, t, 500 + i * 40, 0.045);
  CARDS.forEach((c, i) => { A.burst(oc, out, c.t, 0.09, { f: 700 + i * 120, q: 4, g: 0.18, seed: 17 + i }); A.tone(oc, out, c.t + 0.01, A.note(81 + i * 2), 0.35, { g: 0.07 }); });
  KEYS.forEach((k, i) => A.click(oc, out, k.t, 0.2, 2400 + i * 200));
  A.tone(oc, out, 8.5, 120, 0.2, { g: 0.2, f2: 70 }); A.chime(oc, out, TOAST_T + 0.05, A.note(88), 0.1); A.chime(oc, out, TOAST_T + 0.2, A.note(91), 0.07);
  A.whoosh(oc, out, LAUNCH, 1.1, true, 0.22); A.whoosh(oc, out, 13.0, 2.2, false, 0.2); A.riser(oc, out, 13.0, 3.0, 0.07);
  const r = await oc.startRendering(); const N = Math.ceil(sr * DUR), buf = ctx.createBuffer(2, N, sr);
  for (let ch = 0; ch < 2; ch++) { const src = r.getChannelData(ch), dst = buf.getChannelData(ch); for (let i = 0; i < N; i++) dst[i] = src[i]; for (let i = N; i < src.length; i++) dst[i - N] += src[i]; }
  const s = ctx.createBufferSource(); s.buffer = buf; s.connect(ctx.destination); s.start(0);
}
boot({ w: W, h: H, duration: DUR, seek: seekAll, buildAudio, bg: C.bg });
