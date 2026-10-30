/* ===== Story-arc split reel: one evolving "effort vs results" diagram, black + red glow ===== */
const W = 1080, H = 1920, FPS = 30, N = 1181, DUR = EDIT.duration;
const RED = '#FF2D2D', RED2 = '#E0121B', YEL = '#FFD400', INK = '#050506', DIM = 'rgba(255,255,255,.35)';
const F = { sans: "'Inter Tight',Inter,sans-serif", serif: "'Instrument Serif',serif", mono: "'JetBrains Mono',monospace", body: 'Inter,sans-serif' };
const GLOW = 'drop-shadow(0 0 6px rgba(255,45,45,.95)) drop-shadow(0 0 22px rgba(255,20,20,.55))';
const stage = document.getElementById('stage');
const box = (p, css, txt) => el('div', 'position:absolute;' + css, p, txt);
const pop = (t, t0, w = 18, z = 0.6) => spring(t - t0, w, z);
const WORDS = EDIT.words.map(w => ({ a: w[0], b: w[1], t: w[2].toLowerCase().replace(/[^a-z0-9'-]/g, '') }));
function T(txt, n = 0) { let k = 0; for (const w of WORDS) if (w.t === txt) { if (k === n) return w.a; k++; } throw new Error('word not found ' + txt + n); }
const NS = 'http://www.w3.org/2000/svg';
const sv = (p, tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); p.appendChild(e); return e; };
const win = (t, a, b, f = 0.3) => easeInOut(clamp(Math.min((t - a) / f, (b - t) / f)));
function easeInOut(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
// partial polyline: first `frac` of its length
function partial(pts, frac) { let L = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; } let rem = L * clamp(frac), s = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`; for (let i = 1; i < pts.length && rem > 0; i++) { const k = Math.min(1, rem / seg[i - 1]); const x = lerp(pts[i - 1][0], pts[i][0], k), y = lerp(pts[i - 1][1], pts[i][1], k); s += ` L${x.toFixed(1)} ${y.toFixed(1)}`; rem -= seg[i - 1]; } return s; }

// ---------- background ----------
stage.style.background = INK;
const bg = box(stage, `left:0;top:0;width:${W}px;height:${H}px;background:radial-gradient(ellipse at 50% 30%,#1a0c0d 0%,#070708 55%,#030303 100%)`);
const grid = box(bg, `left:0;top:0;width:${W}px;height:${H}px;opacity:.5;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:60px 60px`);

// ---------- face ----------
const faceBox = box(stage, `left:0;top:0;overflow:hidden;z-index:5;background:#000`);
const faceImg = el('img', `position:absolute;left:0;top:0;width:${W}px;height:${H}px;transform-origin:50% 25%`, faceBox);
const faceRing = box(stage, 'left:0;top:0;z-index:6;border:3px solid rgba(255,255,255,.14);pointer-events:none');
const WIN = { x: 120, y: 905, w: 840, h: 520, r: 40, ix: -1, iy: -296, iw: 842, ih: 1497 };
const FULLF = { x: 0, y: 0, w: W, h: H, r: 0, ix: 0, iy: 0, iw: W, ih: H };

// ---------- graphic layer G (1000 x 780) ----------
const G = box(stage, `left:40px;top:110px;width:1000px;height:780px;z-index:8;transform-origin:50% 0`);
const svg = sv(G, 'svg', { width: 1000, height: 780, viewBox: '0 0 1000 780', style: 'position:absolute;left:0;top:0;overflow:visible' });
const O = [120, 690], XM = 940, YT = 190;
const gAxes = sv(svg, 'g', {});
const axX = sv(gAxes, 'path', { stroke: '#fff', 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' });
const axY = sv(gAxes, 'path', { stroke: '#fff', 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' });
const labX = box(G, `left:${XM - 260}px;top:${O[1] + 14}px;width:260px;text-align:right;font:600 22px ${F.mono};color:${DIM};letter-spacing:3px`, 'TIME SPENT →');
const labY = box(G, `left:${O[0] - 20}px;top:${YT - 46}px;font:600 22px ${F.mono};color:${DIM};letter-spacing:3px;white-space:nowrap`, '↑ MONEY WON');
// hook lines
const HARD = Array.from({ length: 30 }, (_, i) => [O[0] + i * 28, O[1] - i * 3.2 - Math.sin(i * 1.3) * 6]);
const SMART = Array.from({ length: 30 }, (_, i) => { const u = i / 29; return [O[0] + u * 330, O[1] - (1 - Math.pow(1 - u, 2.2)) * 470]; });
const pHard = sv(svg, 'path', { stroke: 'rgba(255,255,255,.55)', 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round', 'stroke-dasharray': '2 14' });
const pSmart = sv(svg, 'path', { stroke: RED, 'stroke-width': 9, fill: 'none', 'stroke-linecap': 'round', style: `filter:${GLOW}` });
const tagHard = box(G, `left:780px;top:560px;font:700 30px ${F.sans};color:rgba(255,255,255,.7);letter-spacing:2px`, 'HARDER');
const tagSmart = box(G, `left:470px;top:200px;font:800 34px ${F.sans};color:${RED};letter-spacing:2px;text-shadow:0 0 18px rgba(255,0,0,.8)`, 'SMARTER');
const xMark = box(G, `left:800px;top:500px;font:900 120px/1 ${F.sans};color:${RED};text-shadow:0 0 22px rgba(255,0,0,.8);opacity:0`, '×');
const debt = box(G, `left:600px;top:250px;width:340px;text-align:center;font:800 40px/1.15 ${F.sans};color:#fff;opacity:0`, 'STUDENT LOAN DEBT');
const debtStrike = box(debt, `left:-10px;top:42px;height:8px;width:0;background:${RED};box-shadow:0 0 14px ${RED}`);
// staircase of plates (the hand-washing way)
const NS_ = 8, RUN = 60, RISE = 30;
const pStairs = sv(svg, 'path', { stroke: '#fff', 'stroke-width': 5, fill: 'none', 'stroke-linejoin': 'round', opacity: 0 });
const areaSaved = sv(svg, 'path', { fill: 'rgba(255,40,40,.16)', stroke: 'none', opacity: 0 });
const plates = []; for (let c = 0; c < NS_; c++) { const n = (c + 1) * 2; for (let k = 0; k < n; k++) { const g = sv(svg, 'g', { opacity: 0 }); sv(g, 'ellipse', { cx: 0, cy: 0, rx: 26, ry: 7.5, fill: '#fff', stroke: '#bbb', 'stroke-width': 1.5 }); sv(g, 'ellipse', { cx: 0, cy: -1.5, rx: 16, ry: 4, fill: 'none', stroke: '#ccc', 'stroke-width': 1.5 }); plates.push({ g, c, k, top: k === n - 1, idx: plates.length }); } }
const checks = Array.from({ length: NS_ }, (_, c) => box(G, `left:0;top:0;font:900 34px/1 ${F.sans};color:#3DDC84;opacity:0;text-shadow:0 0 12px rgba(61,220,132,.7)`, '✓'));
// machine line
const MEND = [215, 215];
const pMach = sv(svg, 'path', { stroke: RED, 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round', 'stroke-dasharray': '14 12', opacity: 0 });
const machDot = sv(svg, 'circle', { r: 12, fill: '#fff', opacity: 0, style: `filter:${GLOW}` });
const dwIcon = box(G, `left:228px;top:150px;width:220px;opacity:0;font:800 26px ${F.sans};color:#fff;letter-spacing:2px;white-space:nowrap`, '');
dwIcon.innerHTML = `<svg width="54" height="62" viewBox="0 0 54 62" style="vertical-align:middle;margin-right:12px"><rect x="3" y="3" width="48" height="56" rx="8" fill="none" stroke="#fff" stroke-width="4"/><line x1="3" y1="17" x2="51" y2="17" stroke="#fff" stroke-width="4"/><circle cx="14" cy="10" r="2.5" fill="${RED}"/><circle cx="27" cy="38" r="12" fill="none" stroke="${RED}" stroke-width="4"/></svg>DISHWASHER`;
const ring = sv(svg, 'circle', { cx: MEND[0], cy: MEND[1], r: 20, fill: 'none', stroke: RED, 'stroke-width': 4, opacity: 0 });
// 5x bracket + energy bar
const brk = box(G, `left:0;top:${O[1] + 34}px;height:4px;background:${RED};opacity:0;box-shadow:0 0 12px ${RED}`);
const brkTxt = box(G, `left:0;top:${O[1] + 38}px;width:200px;text-align:center;font:900 44px ${F.sans};color:${RED};opacity:0;text-shadow:0 0 16px rgba(255,0,0,.7)`, '5×');
const segs = Array.from({ length: 6 }, (_, i) => box(G, `left:${640 + i * 52}px;top:${YT - 10}px;width:44px;height:18px;border-radius:4px;background:${YEL};opacity:0;box-shadow:0 0 12px rgba(255,212,0,.5)`));
const enLab = box(G, `left:520px;top:${YT - 14}px;font:600 20px ${F.mono};color:${DIM};letter-spacing:3px;opacity:0`, 'ENERGY');
// browser mockup
const mock = box(G, `left:90px;top:170px;width:820px;height:520px;border-radius:22px;background:#0d1426;overflow:hidden;opacity:0;box-shadow:0 0 0 3px rgba(255,45,45,.7),0 0 60px rgba(255,30,30,.35),0 40px 90px rgba(0,0,0,.7)`);
box(mock, 'left:0;top:0;width:820px;height:46px;background:#1b1f2c'); [0, 1, 2].forEach(i => box(mock, `left:${20 + i * 26}px;top:16px;width:14px;height:14px;border-radius:50%;background:${['#ff5f57', '#febc2e', '#28c840'][i]}`)); box(mock, `left:190px;top:9px;width:440px;height:28px;border-radius:14px;background:#0d1426;color:#9fa8c4;font:600 17px/28px ${F.body};text-align:center`, 'sustainable-scholars.org');
const mockImg = el('img', 'position:absolute;left:0;top:46px;width:820px;height:auto', mock); mockImg.src = 'site_desk.jpg';
// success circle
const CC = [500, 485], CR = 215;
const gCirc = sv(svg, 'g', { opacity: 0 });
const pCirc = sv(gCirc, 'circle', { cx: CC[0], cy: CC[1], r: CR, fill: 'none', stroke: RED, 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-dasharray': 2 * Math.PI * CR, 'stroke-dashoffset': 2 * Math.PI * CR, transform: `rotate(-90 ${CC[0]} ${CC[1]})`, style: `filter:${GLOW}` });
const teeth = sv(gCirc, 'g', { opacity: 0 }); for (let i = 0; i < 18; i++) sv(teeth, 'rect', { x: CC[0] - 10, y: CC[1] - CR - 34, width: 20, height: 26, rx: 4, fill: RED, transform: `rotate(${i * 20} ${CC[0]} ${CC[1]})` });
const orb = sv(gCirc, 'circle', { r: 13, fill: '#fff', style: `filter:${GLOW}` });
const NODES = [['YOUR PROFILE', -90], ['MATCHED LIST', 0], ['APPLY', 90], ['WIN', 180]].map(([txt, ang]) => { const a = ang * Math.PI / 180, x = CC[0] + Math.cos(a) * CR, y = CC[1] + Math.sin(a) * CR; const d = sv(gCirc, 'circle', { cx: x, cy: y, r: 16, fill: INK, stroke: '#fff', 'stroke-width': 5 }); const lb = box(G, `left:${x - 130}px;top:${y + (ang === -90 ? -78 : ang === 90 ? 30 : -22)}px;width:260px;text-align:${ang === 0 ? 'left' : ang === 180 ? 'right' : 'center'};font:800 26px ${F.sans};color:#fff;letter-spacing:2px;opacity:0;${ang === 0 ? 'left:' + (x + 32) + 'px' : ''}${ang === 180 ? ';left:' + (x - 292) + 'px' : ''}`, txt); return { d, lb }; });
// click beat
const btn = box(G, `left:180px;top:380px;width:640px;height:120px;border-radius:24px;background:${RED2};text-align:center;font:800 46px/120px ${F.body};color:#fff;opacity:0;box-shadow:0 0 40px rgba(255,20,20,.55)`, 'Start my free match  →');
const cursor = box(G, 'left:0;top:0;opacity:0'); cursor.innerHTML = `<svg width="90" height="104" viewBox="0 0 60 70"><path d="M8 4v52l14-12 10 22 10-5-10-21 18-1z" fill="#fff" stroke="#000" stroke-width="4" stroke-linejoin="round"/></svg>`;
const ripple = box(G, 'left:0;top:0;width:60px;height:60px;border-radius:50%;border:6px solid #fff;opacity:0');
const bigCheck = box(G, `left:0;top:540px;width:1000px;text-align:center;font:900 150px/1 ${F.sans};color:#3DDC84;opacity:0;text-shadow:0 0 30px rgba(61,220,132,.6)`, '✓');
const hrsLab = box(G, `left:600px;top:420px;font:700 28px ${F.mono};color:${DIM};letter-spacing:3px;opacity:0`, 'HOURS OF RESEARCH');
// phone end card
const phone = box(G, `left:330px;top:120px;width:340px;height:600px;border-radius:44px;background:#0d1426;border:7px solid #d9dbe3;overflow:hidden;opacity:0;box-shadow:0 0 70px rgba(255,30,30,.45),0 40px 80px rgba(0,0,0,.7)`);
const phImg = el('img', 'position:absolute;left:0;top:0;width:326px;height:auto', phone); phImg.src = 'site_mobile.jpg';
const url = box(G, `left:0;top:745px;width:1000px;text-align:center;font:900 70px/1 ${F.sans};color:#fff;letter-spacing:-2px;opacity:0;white-space:nowrap`, '');
url.innerHTML = `SustainableScholars<span style="font:italic 400 84px ${F.serif};color:${RED};letter-spacing:0;text-shadow:0 0 18px rgba(255,0,0,.7)">.org</span>`;

// ---------- titles + pills ----------
const titleBox = box(G, `left:0;top:-10px;width:1000px;text-align:center;white-space:nowrap`);
const TITLES = [
  [0.0, 'Work', 'Smarter'], [T('hunting') - 0.1, 'The', 'One-by-One Way'], [T('absolutely') - 0.3, 'Every Dish,', 'By Hand'], [T('five') - 0.15, '5×', 'As Long'],
  [T("it's") - 0.05, 'Use', 'The Machine'], [T('here') - 0.1, 'Sustainable', 'Scholars'], [T('success') - 0.15, 'The Success', 'Circle'], [T('turn') - 0.1, 'Hours →', 'One Click'], [T('sustainablescholars') - 0.35, 'Your', 'Next Step']];
const tEls = TITLES.map(([t0, a, b]) => { const d = box(titleBox, `left:0;top:0;width:1000px;opacity:0`); d.innerHTML = `<span style="font:800 70px/1 ${F.sans};color:#fff;letter-spacing:-1px">${a} </span><span style="font:italic 400 84px/1 ${F.serif};color:#fff">${b}</span>`; return d; });
const PILLS = [
  [T('not') - 0.05, T('hunting') - 0.15, 'Not Harder', 330, 95], [T('mountain') - 0.1, T('dishwasher') - 0.1, 'A Mountain of Dishes', 260, 95], [T('right') - 0.15, T('absolutely') - 0.35, 'Sitting Right There', 270, 95],
  [T('exhausted') - 0.05, T('working') - 0.1, 'Exhausted by Plate 3', 250, 95], [T('built') - 0.1, T('here') - 0.15, 'Built to Do the Job Faster', 200, 95], [T('machine', 1) - 0.1, T('turn') - 0.15, '= The Machine', 340, 95],
  [T('streamlines') - 0.1, T('sustainablescholars') - 0.4, 'All Your Hard Work, Streamlined', 150, 95]];
const pEls = PILLS.map(([a, b, txt, x, y]) => box(G, `left:${x}px;top:${y}px;padding:8px 22px;border-radius:8px;background:${RED2};font:800 38px/1.1 ${F.sans};color:#fff;white-space:nowrap;opacity:0;box-shadow:0 0 26px rgba(255,20,20,.55)`, txt));

// ---------- timing ----------
const tHunt = T('hunting'), tDish = T('dishes'), tMount = T('mountain'), tDW = T('dishwasher'), tAbs = T('absolutely'), tHand2 = T('hand', 1), tFive = T('five'), tExh = T('exhausted'), tThird = T('third');
const tIts = T("it's"), tMach = T('machine', 0), tBuilt = T('built'), tFast = T('faster'), tHere = T('here'), tSucc = T('success'), tMach2 = T('machine', 1), tTurn = T('turn'), tInto = T('into'), tClick = T('click'), tStream = T('streamlines'), tHard = T('hard'), tEnd = T('sustainablescholars') - 0.35;
const FACE = [[T('working') - 0.12, tIts - 0.02]];
const FULL = [[T('every') - 0.2, EDIT.cover[0][1] + 0.05], [EDIT.cover[1][0] - 0.1, tTurn - 0.1], [EDIT.cover[2][0] - 0.1, EDIT.cover[2][1] + 0.1], [tEnd, DUR + 1]];
const ZP = [T('smarter'), T('not'), T('erase'), T('working'), T('less'), tFive, tClick];
const wOf = (t, L) => Math.max(0, ...L.map(([a, b]) => win(t, a, b, 0.32)));
const stepT = c => tHunt + 0.15 + c * ((tMount - 0.1 - tHunt) / NS_);

let curSrc = '', ready = false;
async function seekAll(t) {
  if (!ready) { ready = true; await Promise.all([mockImg, phImg].map(i => i.decode().catch(() => { }))); }
  const idx = clamp(Math.floor(t * FPS + 0.5) + 1, 1, N), src = `frames/${String(idx).padStart(4, '0')}.jpg`;
  if (src !== curSrc) { curSrc = src; faceImg.src = src; await faceImg.decode().catch(() => { }); }
  // ---- layout modes ----
  const wf = wOf(t, FACE), wu = wOf(t, FULL);
  const R = {}; for (const k in WIN) R[k] = lerp(WIN[k], FULLF[k], wf);
  faceBox.style.cssText = `position:absolute;left:${R.x}px;top:${R.y}px;width:${R.w}px;height:${R.h}px;border-radius:${R.r}px;overflow:hidden;z-index:5;background:#000;opacity:${(1 - wu).toFixed(3)}`;
  faceRing.style.cssText = `position:absolute;left:${R.x}px;top:${R.y}px;width:${R.w}px;height:${R.h}px;border-radius:${R.r}px;z-index:6;border:3px solid rgba(255,255,255,${(0.14 * (1 - wf) * (1 - wu)).toFixed(3)})`;
  let z = 1; ZP.forEach(p => { const dt = t - p; if (dt >= 0 && dt < 1.2) z *= 1 + 0.08 * Math.exp(-dt * 5); });
  faceImg.style.left = R.ix + 'px'; faceImg.style.top = R.iy + 'px'; faceImg.style.width = R.iw + 'px'; faceImg.style.height = R.ih + 'px'; faceImg.style.transform = `scale(${z.toFixed(4)})`;
  G.style.opacity = (1 - wf).toFixed(3); G.style.top = lerp(110, 400, wu) + 'px';
  // ---- titles / pills ----
  let ti = 0; TITLES.forEach((x, i) => { if (t >= x[0]) ti = i; });
  tEls.forEach((d, i) => { const k = i === ti ? clamp(pop(t, TITLES[i][0], 20, 0.7)) : 0; d.style.opacity = k.toFixed(2); d.style.transform = `translateY(${px((1 - k) * 30)})`; });
  pEls.forEach((d, i) => { const [a, b] = PILLS[i]; const k = t >= a && t < b ? clamp(pop(t, a, 20, 0.5)) * clamp((b - t) / 0.12) : 0; d.style.opacity = k.toFixed(2); d.style.transform = `scale(${(0.6 + 0.4 * Math.min(1, k)).toFixed(3)}) rotate(-2deg)`; });
  // ---- axes ----
  const axO = clamp(seg(t, 0.05, 0.5)) * (1 - clamp(seg(t, tHere - 0.1, tHere + 0.2)) * 0.85) * (1 - clamp(seg(t, tSucc - 0.2, tSucc))) ;
  const axBack = clamp(seg(t, tTurn - 0.1, tTurn + 0.2)) * (1 - clamp(seg(t, tInto, tInto + 0.3)));
  const axo = Math.max(axO, axBack);
  axX.setAttribute('d', `M${O[0]} ${O[1]} L${lerp(O[0], XM, easeOut(seg(t, 0.05, 0.45)))} ${O[1]}`); axY.setAttribute('d', `M${O[0]} ${O[1]} L${O[0]} ${lerp(O[1], YT, easeOut(seg(t, 0.15, 0.55)))}`);
  gAxes.setAttribute('opacity', axo.toFixed(3)); labX.style.opacity = labY.style.opacity = (axo * clamp(seg(t, 0.4, 0.7))).toFixed(3);
  // ---- hook ----
  const hookO = 1 - clamp(seg(t, tHunt - 0.25, tHunt));
  pHard.setAttribute('d', partial(HARD, easeOut(seg(t, 0.35, T('not'))))); pHard.setAttribute('opacity', (hookO * (t > T('not') + 0.2 ? 0.35 : 1)).toFixed(2));
  pSmart.setAttribute('d', partial(SMART, easeOut(seg(t, T('smarter') - 0.1, T('smarter') + 0.45)))); pSmart.setAttribute('opacity', hookO.toFixed(2));
  tagHard.style.opacity = (hookO * clamp(seg(t, 0.8, 1.0)) * (t > T('not') + 0.2 ? 0.4 : 1)).toFixed(2); tagSmart.style.opacity = (hookO * clamp(seg(t, T('smarter') + 0.3, T('smarter') + 0.5))).toFixed(2);
  const xk = clamp(pop(t, T('not') + 0.15)); xMark.style.opacity = (hookO * xk).toFixed(2); xMark.style.transform = `scale(${(0.4 + 0.6 * xk).toFixed(3)})`;
  const dk = clamp(pop(t, T('colleges') - 0.1)); debt.style.opacity = (hookO * dk).toFixed(2); debt.style.transform = `scale(${(0.8 + 0.2 * dk).toFixed(3)})`; debtStrike.style.width = (360 * easeOut(seg(t, T('erase'), T('debt') + 0.3))) + 'px';
  // ---- staircase + plates ----
  const stairO = clamp(seg(t, tHunt - 0.05, tHunt + 0.2)) * (1 - clamp(seg(t, tHere - 0.1, tHere + 0.2))) + axBack * 1;
  const collapse = easeInOut(seg(t, tInto, tInto + 0.45));
  const stretch = easeInOut(seg(t, tFive, tFive + 0.7)) * (1 - easeInOut(seg(t, tTurn - 0.1, tTurn + 0.2)));
  const xs = lerp(1, 1.68, stretch) * (1 - collapse * 0.98), ysq = 1 - collapse * 0.98;
  const nShown = t < tHunt ? 0 : clamp(Math.floor((t - tHunt - 0.15) / ((tMount - 0.1 - tHunt) / NS_)) + 1, 0, NS_);
  const sp = [[O[0], O[1]]]; let x = O[0], y = O[1];
  for (let c = 0; c < NS_; c++) { const vis = t < tMount ? c < nShown : true; if (!vis && !(axBack > 0)) break; x += RUN * xs; sp.push([x, y]); y -= RISE * ysq; sp.push([x, y]); }
  pStairs.setAttribute('d', 'M' + sp.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L')); pStairs.setAttribute('opacity', clamp(stairO).toFixed(3));
  const cleanT = c => tAbs + 0.1 + c * ((tHand2 + 0.3 - tAbs - 0.1) / NS_);
  plates.forEach(p => { const cx = O[0] + (p.c + 0.5) * RUN * xs, cy = O[1] - 9 - p.k * 15 * ysq; let o;
    if (p.top) o = clamp((t - stepT(p.c)) / 0.15); else o = clamp((t - (tMount + 0.05 + (p.k * 0.05 + p.c * 0.025))) / 0.12);
    const flyIn = clamp(seg(t, tStream, tStream + 0.6)); const fx = lerp(cx, 500, easeIn(flyIn)), fy = lerp(cy, 485 * 0.55 + 485 * 0.45, easeIn(flyIn));
    const dirty = t < cleanT(p.c); const hl = t > tExh && p.top && p.c < 3 && t > [tExh + 0.1, tThird - 0.3, tThird][p.c] && t < T('working');
    p.g.setAttribute('transform', `translate(${fx.toFixed(1)},${fy.toFixed(1)}) scale(${(hl ? 1.35 : 1) * (1 - flyIn * 0.6)})`);
    p.g.firstChild.setAttribute('fill', hl ? RED : dirty ? '#8d7b58' : '#fff'); p.g.firstChild.setAttribute('stroke', dirty ? '#5f513a' : '#bbb');
    p.g.setAttribute('opacity', (o * clamp(stairO + flyIn) * (1 - clamp(seg(t, tStream + 0.45, tStream + 0.6)))).toFixed(3)); });
  checks.forEach((c, i) => { const k = clamp(pop(t, cleanT(i))) * (1 - clamp(seg(t, tFive - 0.2, tFive))); const cx = O[0] + (i + 0.5) * RUN * xs; c.style.left = (cx - 12) + 'px'; c.style.top = (O[1] - 9 - (i + 1) * 2 * 15 - 40) + 'px'; c.style.opacity = k.toFixed(2); c.style.transform = `scale(${k.toFixed(2)})`; });
  // ---- dishwasher / machine line ----
  const mDraw = easeOut(seg(t, tDW, tDW + 0.5)), solid = t >= tMach - 0.05;
  const mO = clamp(seg(t, tDW - 0.05, tDW + 0.1)) * (1 - clamp(seg(t, tHere - 0.1, tHere + 0.2)));
  pMach.setAttribute('d', partial([O, MEND], solid ? Math.max(mDraw, 1) : mDraw)); pMach.setAttribute('opacity', mO.toFixed(3));
  pMach.setAttribute('stroke-dasharray', solid ? 'none' : '14 12'); pMach.setAttribute('stroke-width', solid ? 11 : 6); pMach.style.filter = solid ? GLOW : 'none';
  dwIcon.style.opacity = (mO * clamp(seg(t, tDW + 0.3, tDW + 0.5))).toFixed(2);
  const rp = (((t - T('right')) % 0.9) + 0.9) % 0.9 / 0.9; ring.setAttribute('opacity', t > T('right') - 0.1 && t < tAbs ? ((1 - rp) * mO).toFixed(2) : 0); ring.setAttribute('r', (20 + rp * 50).toFixed(1));
  const dotU = ((t - tFast + 0.1) % 0.45) / 0.45; machDot.setAttribute('opacity', t > tFast - 0.1 && t < tHere ? 1 : 0); machDot.setAttribute('cx', lerp(O[0], MEND[0], dotU)); machDot.setAttribute('cy', lerp(O[1], MEND[1], dotU));
  // hours-saved area between machine line and stairs
  const aO = clamp(seg(t, tBuilt - 0.1, tBuilt + 0.3)) * (1 - clamp(seg(t, tHere - 0.1, tHere + 0.2)));
  areaSaved.setAttribute('d', `M${O[0]} ${O[1]} L${MEND[0]} ${MEND[1]} L${MEND[0]} ${O[1] - NS_ * RISE} ` + sp.slice().reverse().map(p => `L${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') + ' Z'); areaSaved.setAttribute('opacity', aO.toFixed(3));
  // ---- 5x bracket + energy ----
  const bk = clamp(seg(t, tFive + 0.3, tFive + 0.7)) * (1 - clamp(seg(t, T('working') - 0.2, T('working')))); const bx0 = MEND[0], bx1 = O[0] + NS_ * RUN * xs;
  brk.style.left = bx0 + 'px'; brk.style.width = ((bx1 - bx0) * bk) + 'px'; brk.style.opacity = bk; brkTxt.style.left = ((bx0 + bx1) / 2 - 100) + 'px'; brkTxt.style.opacity = bk;
  const eO = clamp(seg(t, tExh - 0.25, tExh)) * (1 - clamp(seg(t, T('working') - 0.2, T('working')))); enLab.style.opacity = eO;
  const lost = t < tExh + 0.1 ? 0 : t < tThird - 0.3 ? 2 : t < tThird ? 4 : 6;
  segs.forEach((s, i) => { const gone = i >= 6 - lost; s.style.opacity = eO.toFixed(2); s.style.background = gone ? (lost === 6 && i === 0 ? RED : 'rgba(255,255,255,.12)') : YEL; s.style.boxShadow = gone ? 'none' : '0 0 12px rgba(255,212,0,.5)'; });
  // ---- site mockup ----
  const mk = clamp(pop(t, tHere - 0.05, 14, 0.7)) * (1 - clamp(seg(t, tSucc - 0.25, tSucc))); mock.style.opacity = mk.toFixed(3); mock.style.transform = `perspective(1600px) rotateX(${(12 * (1 - mk)).toFixed(1)}deg) translateY(${px((1 - mk) * 120)}) scale(${(0.9 + 0.1 * mk).toFixed(3)})`;
  // ---- success circle ----
  const cO = clamp(seg(t, tSucc - 0.2, tSucc)) * (1 - clamp(seg(t, tTurn - 0.15, tTurn + 0.1))) + clamp(seg(t, tStream - 0.1, tStream + 0.2)) * (1 - clamp(seg(t, tEnd - 0.1, tEnd + 0.1)));
  const inClick = t > tTurn; const cs = inClick ? 0.55 : 1;
  gCirc.setAttribute('opacity', clamp(cO).toFixed(3)); gCirc.setAttribute('transform', `translate(${CC[0] * (1 - cs)},${CC[1] * (1 - cs)}) scale(${cs})`);
  const C2 = 2 * Math.PI * CR; pCirc.setAttribute('stroke-dashoffset', (C2 * (1 - easeOut(seg(t, tSucc, T('circle') + 0.35)))).toFixed(1) * (inClick ? 0 : 1));
  const spin = (t - tSucc) * (t > tMach2 ? 140 : 50); const oa = (-90 + spin) * Math.PI / 180; orb.setAttribute('cx', CC[0] + Math.cos(oa) * CR); orb.setAttribute('cy', CC[1] + Math.sin(oa) * CR);
  teeth.setAttribute('opacity', clamp(seg(t, tMach2 - 0.1, tMach2 + 0.2)).toFixed(2)); teeth.setAttribute('transform', `rotate(${(t > tMach2 ? (t - tMach2) * 160 : 0).toFixed(1)} ${CC[0]} ${CC[1]})`);
  NODES.forEach((n, i) => { const k = clamp(pop(t, tSucc + 0.25 + i * 0.22)) * (inClick ? 0 : 1); n.lb.style.opacity = (k * clamp(cO)).toFixed(2); n.d.setAttribute('r', (16 * (0.3 + 0.7 * k)).toFixed(1)); });
  // ---- click beat ----
  hrsLab.style.opacity = (axBack * clamp(seg(t, T('hours') - 0.1, T('hours') + 0.1))).toFixed(2);
  const bk2 = clamp(pop(t, tInto + 0.3, 16, 0.55)) * (1 - clamp(seg(t, tEnd - 0.1, tEnd + 0.1))); const press = t > tClick && t < tClick + 0.16 ? 0.94 : 1;
  btn.style.opacity = bk2.toFixed(2); btn.style.transform = `scale(${((0.6 + 0.4 * bk2) * press).toFixed(3)})`; btn.style.top = (380 + 240 * clamp(seg(t, tStream - 0.1, tStream + 0.3))) + 'px';
  const mv = easeOut(seg(t, tInto + 0.4, tClick)); cursor.style.opacity = (clamp(seg(t, tInto + 0.4, tInto + 0.55)) * (1 - clamp(seg(t, tStream - 0.1, tStream + 0.1)))).toFixed(2); cursor.style.transform = `translate(${px(880 - mv * 330)},${px(720 - mv * 260)})`;
  const rr = clamp((t - tClick) / 0.5); ripple.style.opacity = t >= tClick && rr < 1 ? (1 - rr).toFixed(2) : 0; ripple.style.transform = `translate(${px(530)},${px(440)}) scale(${(1 + rr * 7).toFixed(2)})`;
  const ck = clamp(pop(t, tHard, 16, 0.5)) * (1 - clamp(seg(t, tEnd - 0.1, tEnd + 0.1))); bigCheck.style.opacity = ck.toFixed(2); bigCheck.style.transform = `scale(${ck.toFixed(3)})`; bigCheck.style.top = '20px'; bigCheck.style.left = '330px'; bigCheck.style.width = '340px';
  // ---- end card ----
  const ek = clamp(pop(t, tEnd + 0.05, 14, 0.65)); phone.style.opacity = ek.toFixed(2); phone.style.transform = `translateY(${px((1 - ek) * 200 + Math.sin(t * 2) * 6)}) rotate(${(-3 * (1 - ek)).toFixed(1)}deg)`;
  const uk = clamp(pop(t, T('sustainablescholars'), 16, 0.55)); url.style.opacity = uk.toFixed(2); url.style.transform = `scale(${(0.7 + 0.3 * uk).toFixed(3)})`;
}

async function buildAudio(ctx) {
  const out = A.master(ctx, 0.9);
  const hit = (t, g = 1) => { A.boom(ctx, out, t, 0.3 * g); A.click(ctx, out, t, 0.18 * g, 1600); };
  const sw = (t, g = 0.12) => A.whoosh(ctx, out, t - 0.2, 0.35, true, g);
  TITLES.slice(1).forEach(([t0]) => { sw(t0, 0.11); A.click(ctx, out, t0 + 0.05, 0.12, 2400); });
  PILLS.forEach(([a]) => { hit(a, 0.6); });
  // hook
  A.tone(ctx, out, 0.05, 200, 0.5, { type: 'sawtooth', g: 0.04, f2: 400, lp: 1500 }); A.riser(ctx, out, T('smarter') - 0.1, 0.5, 0.1); A.tone(ctx, out, T('not') + 0.15, 300, 0.3, { type: 'square', g: 0.06, f2: 90, lp: 1200 });
  A.burst(ctx, out, T('erase'), T('debt') + 0.3 - T('erase'), { f: 1800, f2: 800, q: 1, g: 0.1, seed: 8 });
  // stairs / plates
  for (let c = 0; c < NS_; c++) A.tone(ctx, out, stepT(c), 1700 + c * 90, 0.1, { g: 0.09, f2: 1300 });
  for (let i = 0; i < 18; i++) A.tone(ctx, out, tMount + 0.05 + i * 0.04, 1500 + (i % 5) * 140, 0.08, { g: 0.05, f2: 1200 });
  A.riser(ctx, out, tDW - 0.2, 0.5, 0.08); A.chime(ctx, out, T('right'), 660, 0.08);
  for (let c = 0; c < NS_; c++) A.chime(ctx, out, tAbs + 0.1 + c * ((tHand2 + 0.3 - tAbs - 0.1) / NS_), 880 + c * 60, 0.04);
  hit(tFive, 1); for (let t = tFive; t < tExh - 0.2; t += 0.1) A.tick(ctx, out, t, 1100, 0.04);
  [tExh + 0.1, tThird - 0.3, tThird].forEach((t, i) => A.tone(ctx, out, t, 520 - i * 120, 0.25, { type: 'triangle', g: 0.12, f2: 300 - i * 80 }));
  // machine
  A.riser(ctx, out, tMach - 0.4, 0.45, 0.12); hit(tMach, 0.8); for (let t = tFast - 0.1; t < tHere - 0.1; t += 0.11) A.tick(ctx, out, t, 300, 0.05);
  // site + circle
  hit(tHere + 0.1, 0.6); A.riser(ctx, out, tSucc, T('circle') + 0.35 - tSucc, 0.1); A.chime(ctx, out, T('circle') + 0.35, 523, 0.09); for (let i = 0; i < 4; i++) A.click(ctx, out, tSucc + 0.25 + i * 0.22, 0.12, 2200);
  hit(tMach2 - 0.1, 0.9); for (let t = tMach2; t < tTurn - 0.2; t += 0.09) A.tick(ctx, out, t, 240, 0.04);
  // click
  for (let i = 0; i < 6; i++) A.tick(ctx, out, T('hours') + i * 0.09, 1300, 0.06);
  A.whoosh(ctx, out, tInto, 0.45, false, 0.15); hit(tInto + 0.3, 0.6); A.click(ctx, out, tClick, 0.55, 2400); A.tone(ctx, out, tClick, 160, 0.12, { g: 0.2, f2: 70 });
  A.whoosh(ctx, out, tStream, 0.6, true, 0.12); A.chime(ctx, out, tHard, 1046, 0.1); hit(tHard, 0.5);
  // end
  sw(tEnd + 0.05, 0.14); hit(T('sustainablescholars'), 0.8); A.chime(ctx, out, T('org'), 1318, 0.09); A.chime(ctx, out, T('org') + 0.05, 1568, 0.07);
}
boot({ w: W, h: H, duration: DUR, seek: seekAll, buildAudio, bg: INK });
