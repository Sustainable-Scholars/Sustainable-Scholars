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
const url = box(G, `left:0;top:745px;width:1000px;text-align:center;font:900 62px/1 ${F.sans};color:#fff;letter-spacing:-2px;opacity:0;white-space:nowrap`, '');
url.innerHTML = `sustainable-scholars<span style="font:italic 400 84px ${F.serif};color:${RED};letter-spacing:0;text-shadow:0 0 18px rgba(255,0,0,.7)">.org</span>`;

// ---------- titles + pills ----------
const titleBox = box(G, `left:0;top:-10px;width:1000px;text-align:center;white-space:nowrap`);
const TITLES = [
  [0.0, 'Work', 'Smarter'], [T('hunting') - 0.1, 'By Hand', 'vs Dishwasher'], [T('absolutely') - 0.3, 'Every Dish,', 'By Hand'], [T('five') - 0.15, '5×', 'As Long'],
  [T("it's") - 0.05, 'Use', 'The Machine'], [T('here') - 0.1, 'Sustainable', 'Scholars'], [T('success') - 0.15, 'The Success', 'Circle'], [T('turn') - 0.1, 'Hours →', 'One Click'], [T('sustainablescholars') - 0.35, 'Your', 'Next Step']];
const tEls = TITLES.map(([t0, a, b]) => { const d = box(titleBox, `left:0;top:0;width:1000px;opacity:0`); d.innerHTML = `<span style="font:800 70px/1 ${F.sans};color:#fff;letter-spacing:-1px">${a} </span><span style="font:italic 400 84px/1 ${F.serif};color:#fff">${b}</span>`; return d; });
const PILLS = [
  [T('exhausted') - 0.05, T('working') - 0.1, 'Exhausted by Plate 3', 250, 95], [T('built') - 0.1, T('here') - 0.15, 'Built to Do the Job Faster', 200, 95], [T('machine', 1) - 0.1, T('turn') - 0.15, '= The Machine', 340, 95],
  [T('streamlines') - 0.1, T('sustainablescholars') - 0.4, 'All Your Hard Work, Streamlined', 150, 95]];
const pEls = PILLS.map(([a, b, txt, x, y]) => box(G, `left:${x}px;top:${y}px;padding:8px 22px;border-radius:8px;background:${RED2};font:800 38px/1.1 ${F.sans};color:#fff;white-space:nowrap;opacity:0;box-shadow:0 0 26px rgba(255,20,20,.55)`, txt));


// ---------- Phase A: words on the full-screen face ----------
const OV = box(stage, `left:0;top:0;width:${W}px;height:${H}px;z-index:9;pointer-events:none`);
const mkW = (css, html) => { const d = box(OV, `left:0;width:${W}px;text-align:center;white-space:nowrap;opacity:0;${css}`); d.innerHTML = html; return d; };
const SH = '-webkit-text-stroke:10px #000;paint-order:stroke fill;text-shadow:0 6px 0 rgba(0,0,0,.5)';
const wA = mkW('top:930px;', `<span style="font:900 118px/1 ${F.sans};color:#fff;${SH}">Work </span><span style="font:italic 400 140px/1 ${F.serif};color:${RED};${SH};filter:drop-shadow(0 0 18px rgba(255,20,20,.8))">Smarter</span>`);
const wB = mkW('top:1075px;', `<span style="font:900 100px/1 ${F.sans};color:#fff;${SH}">Not </span><span id="hd" style="position:relative;font:900 100px/1 ${F.sans};color:#fff;${SH}">Harder<i style="position:absolute;left:-10px;right:-10px;top:52%;height:12px;background:${RED};box-shadow:0 0 16px ${RED};transform-origin:0 50%;transform:scaleX(0)"></i></span>`);
const hdStrike = wB.querySelector('i');
const wC = box(OV, `left:140px;top:1230px;width:800px;height:120px;border-radius:20px;background:#fff;overflow:hidden;opacity:0;box-shadow:0 0 40px rgba(255,20,20,.45)`);
const wCt = box(wC, `left:0;top:0;width:800px;height:120px;text-align:center;font:900 62px/120px ${F.sans};color:#050506;white-space:nowrap`, 'STUDENT LOAN DEBT');
const wCe = box(wC, `top:0;left:0;width:90px;height:120px;background:${RED2};opacity:0`);
const wC0 = box(OV, `left:0;top:1190px;width:${W}px;text-align:center;font:900 190px/1 ${F.serif};color:${RED};${SH};opacity:0;filter:drop-shadow(0 0 24px rgba(255,20,20,.8))`, '$0');

// ---------- Split screen: by hand (pile grows) vs dishwasher ----------
const SPL = box(G, 'left:0;top:105px;width:1000px;height:700px;opacity:0');
box(SPL, `left:497px;top:20px;width:6px;height:620px;background:${RED};box-shadow:0 0 18px ${RED};border-radius:3px`);
box(SPL, `left:20px;top:10px;width:460px;text-align:center;font:900 44px ${F.sans};color:#fff;letter-spacing:3px`, 'BY HAND');
box(SPL, `left:520px;top:10px;width:460px;text-align:center;font:900 44px ${F.sans};color:${RED};letter-spacing:3px;text-shadow:0 0 16px rgba(255,20,20,.7)`, 'DISHWASHER');
const SSV = document.createElementNS(NS, 'svg'); SSV.setAttribute('width', 1000); SSV.setAttribute('height', 700); SSV.setAttribute('viewBox', '0 0 1000 700'); SSV.style.cssText = 'position:absolute;left:0;top:0;overflow:visible'; SPL.appendChild(SSV);
const mkPlate = (par, rx, fill, edge) => { const g = sv(par, 'g', { opacity: 0 }); sv(g, 'ellipse', { cx: 0, cy: 0, rx, ry: rx * 0.29, fill, stroke: edge, 'stroke-width': 2 }); sv(g, 'ellipse', { cx: 0, cy: -rx * 0.05, rx: rx * 0.62, ry: rx * 0.17, fill: 'none', stroke: edge, 'stroke-width': 2 }); return g; };
// left: sink + dirty pile + one sponge
sv(SSV, 'rect', { x: 40, y: 560, width: 420, height: 90, rx: 18, fill: '#2a2a30', stroke: '#555', 'stroke-width': 3 });
const PILEN = 22, pile = Array.from({ length: PILEN }, (_, i) => mkPlate(SSV, 92 - (i % 3) * 10, '#8d7b58', '#4f4330'));
const clean1 = mkPlate(SSV, 70, '#fff', '#aaa');
const sponge = sv(SSV, 'rect', { x: -55, y: -18, width: 110, height: 40, rx: 12, fill: YEL, stroke: '#a88f00', 'stroke-width': 3, opacity: 0 });
const bubs = Array.from({ length: 5 }, () => sv(SSV, 'circle', { r: 9, fill: 'rgba(255,255,255,.7)', opacity: 0 }));
const cntL = box(SPL, `left:20px;top:665px;width:460px;text-align:center;font:800 34px ${F.mono};color:#fff;letter-spacing:2px`, '');
// right: machine
const DWX = 560, DWY = 150;
sv(SSV, 'rect', { x: DWX, y: DWY, width: 380, height: 470, rx: 28, fill: '#15151a', stroke: '#d9dbe3', 'stroke-width': 6 });
sv(SSV, 'rect', { x: DWX + 30, y: DWY + 24, width: 320, height: 46, rx: 10, fill: '#050506', stroke: RED, 'stroke-width': 3 });
const dwLight = sv(SSV, 'circle', { cx: DWX + 62, cy: DWY + 47, r: 10, fill: RED });
const dwInner = sv(SSV, 'rect', { x: DWX + 30, y: DWY + 90, width: 320, height: 340, rx: 16, fill: '#220b0d', stroke: '#5a1a1d', 'stroke-width': 3 });
const dwPl = Array.from({ length: 9 }, (_, i) => mkPlate(SSV, 46, '#fff', '#aaa'));
const door = sv(SSV, 'rect', { x: DWX + 24, y: DWY + 84, width: 332, height: 352, rx: 18, fill: 'rgba(230,236,250,.22)', stroke: '#fff', 'stroke-width': 4, style: 'transform-box:fill-box;transform-origin:50% 100%' });
const doorHandle = sv(SSV, 'rect', { x: DWX + 110, y: DWY + 110, width: 160, height: 12, rx: 6, fill: '#6b7490' });
const spray = Array.from({ length: 10 }, () => sv(SSV, 'circle', { r: 6, fill: '#9fe6ff', opacity: 0 }));
const cntR = box(SPL, `left:520px;top:665px;width:460px;text-align:center;font:800 34px ${F.mono};color:${RED};letter-spacing:2px;text-shadow:0 0 14px rgba(255,20,20,.7)`, '');

// ---------- timing ----------
const tHunt = T('hunting'), tDish = T('dishes'), tMount = T('mountain'), tDW = T('dishwasher'), tAbs = T('absolutely'), tHand2 = T('hand', 1), tFive = T('five'), tExh = T('exhausted'), tThird = T('third');
const tIts = T("it's"), tMach = T('machine', 0), tBuilt = T('built'), tFast = T('faster'), tHere = T('here'), tSucc = T('success'), tMach2 = T('machine', 1), tTurn = T('turn'), tInto = T('into'), tClick = T('click'), tStream = T('streamlines'), tHard = T('hard'), tEnd = T('sustainablescholars') - 0.35;
const tUse = T('using') - 0.1, sA = tAbs - 0.1, sB = tHand2 + 0.1, tSplitA = tHunt - 0.1, tSplitB = tAbs - 0.35;
const FACE = [[-1, tHunt - 0.2], [T('working') - 0.12, tIts - 0.02]];
const FULL = [[T('every') - 0.2, EDIT.cover[0][1] + 0.05], [EDIT.cover[1][0] - 0.1, tTurn - 0.1], [EDIT.cover[2][0] - 0.1, EDIT.cover[2][1] + 0.1], [tEnd, DUR + 1]];
const ZP = [T('smarter'), T('not'), T('erase'), T('working'), T('less'), tFive, tClick];
const wOf = (t, L) => Math.max(0, ...L.map(([a, b]) => win(t, a, b, 0.32)));
const stepT = c => sA + c * ((sB - sA) / NS_);

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

  // ---- Phase A overlay words ----
  { const aO = 1 - clamp(seg(t, tHunt - 0.4, tHunt - 0.15));
    const kA = clamp(pop(t, T('work') - 0.05, 20, 0.6)); wA.style.opacity = (kA * aO).toFixed(2); wA.style.transform = `scale(${(0.7 + 0.3 * kA).toFixed(3)})`;
    const kB = clamp(pop(t, T('not') - 0.05, 20, 0.6)); wB.style.opacity = (kB * aO).toFixed(2); wB.style.transform = `scale(${(0.7 + 0.3 * kB).toFixed(3)})`; hdStrike.style.transform = `scaleX(${easeOut(seg(t, T('harder') - 0.05, T('harder') + 0.2)).toFixed(3)})`;
    const kC = clamp(pop(t, T('colleges') - 0.1, 20, 0.6)); const pe = easeOut(seg(t, T('erase') - 0.05, T('debt') + 0.1));
    wC.style.opacity = (kC * aO * (pe >= 1 ? 0 : 1)).toFixed(2); wC.style.transform = `scale(${(0.8 + 0.2 * kC).toFixed(3)})`; wCt.style.clipPath = `inset(0 0 0 ${(pe * 100).toFixed(1)}%)`; wCe.style.left = (pe * 710) + 'px'; wCe.style.opacity = pe > 0 && pe < 1 ? 1 : 0;
    const kD = clamp(pop(t, T('debt') + 0.12, 18, 0.5)); wC0.style.opacity = (kD * aO).toFixed(2); wC0.style.transform = `scale(${(0.5 + 0.5 * kD).toFixed(3)})`; }
  // ---- Split screen: by hand vs dishwasher ----
  { const so = clamp(seg(t, tSplitA, tSplitA + 0.3)) * (1 - clamp(seg(t, tSplitB - 0.1, tSplitB + 0.15))); SPL.style.opacity = so.toFixed(3);
    const pr = seg(t, tSplitA + 0.25, tSplitB - 0.3), n = Math.floor(pr * PILEN * 1.02);
    pile.forEach((g, i) => { const k = clamp((pr * PILEN - i) / 1), x = 250 + ((i * 53) % 90 - 45) * 0.8 + (i % 2 ? 10 : -10), y = 540 - Math.floor(i / 2) * 22 - (i % 2) * 6; g.setAttribute('opacity', k > 0 ? 1 : 0); g.setAttribute('transform', `translate(${x},${(y - (1 - Math.min(1, k * 1.2)) * 260).toFixed(1)}) rotate(${((i * 7) % 9) - 4})`); });
    const top = 540 - Math.floor(Math.max(0, n - 1) / 2) * 22; const sw = Math.sin(t * 13) * 34;
    sponge.setAttribute('opacity', so > 0.5 ? 1 : 0); sponge.setAttribute('transform', `translate(${250 + sw},${top - 38 + Math.cos(t * 26) * 4}) rotate(${sw / 5})`);
    bubs.forEach((b, i) => { const ph = (((t * 1.2 + i * 0.2) % 1) + 1) % 1; b.setAttribute('opacity', (so * Math.sin(Math.PI * ph) * 0.8).toFixed(2)); b.setAttribute('cx', 200 + i * 28 + Math.sin(t * 5 + i) * 10); b.setAttribute('cy', top - 50 - ph * 90); });
    const w = Math.max(0, Math.floor((t - tSplitA) / 1.9)); clean1.setAttribute('opacity', w > 0 ? 1 : 0); clean1.setAttribute('transform', `translate(${420 - ((t - tSplitA) % 1.9) * 40},${600}) scale(0.5)`);
    cntL.textContent = `CLEAN ${w} · PILE ${n}`; cntL.style.color = n > 14 ? RED : '#fff';
    const tLoad = tSplitA + 0.3, tClose = tSplitA + 2.5, tDone = tSplitA + 5.0;
    const open = t < tClose ? 1 : 1 - easeOut(seg(t, tClose, tClose + 0.35)); door.style.transform = `perspective(900px) rotateX(${(-78 * open).toFixed(1)}deg)`; doorHandle.setAttribute('opacity', 1 - open);
    dwPl.forEach((g, i) => { const k = clamp((t - (tLoad + i * 0.2)) / 0.22), x = DWX + 70 + (i % 3) * 100, y = DWY + 150 + Math.floor(i / 3) * 90; g.setAttribute('opacity', k > 0 ? 1 : 0); g.setAttribute('transform', `translate(${x},${(y - (1 - k) * 200).toFixed(1)})`); g.firstChild.setAttribute('fill', t > tDone ? '#fff' : t > tClose ? '#c9bfa5' : '#8d7b58'); });
    const run = t > tClose && t < tDone; dwLight.setAttribute('fill', t > tDone ? '#3DDC84' : RED);
    spray.forEach((b, i) => { const ph = (((t * 2 + i * 0.1) % 1) + 1) % 1; b.setAttribute('opacity', run ? (0.8 * Math.sin(Math.PI * ph)).toFixed(2) : 0); b.setAttribute('cx', DWX + 40 + (i / 9) * 300); b.setAttribute('cy', DWY + 100 + ph * 320); });
    cntR.textContent = t < tClose ? 'LOADING…' : t < tDone ? 'RUNNING · HANDS FREE' : 'DONE ✓ ALL CLEAN'; cntR.style.color = t > tDone ? '#3DDC84' : RED; }
  // ---- titles / pills ----
  let ti = 0; TITLES.forEach((x, i) => { if (t >= x[0]) ti = i; });
  tEls.forEach((d, i) => { const k = i === ti ? clamp(pop(t, TITLES[i][0], 20, 0.7)) : 0; d.style.opacity = k.toFixed(2); d.style.transform = `translateY(${px((1 - k) * 30)})`; });
  pEls.forEach((d, i) => { const [a, b] = PILLS[i]; const k = t >= a && t < b ? clamp(pop(t, a, 20, 0.5)) * clamp((b - t) / 0.12) : 0; d.style.opacity = k.toFixed(2); d.style.transform = `scale(${(0.6 + 0.4 * Math.min(1, k)).toFixed(3)}) rotate(-2deg)`; });
  // ---- axes ----
  const axO = clamp(seg(t, tSplitB, tSplitB + 0.25)) * (1 - clamp(seg(t, tHere - 0.1, tHere + 0.2)) * 0.85) * (1 - clamp(seg(t, tSucc - 0.2, tSucc))) ;
  const axBack = clamp(seg(t, tTurn - 0.1, tTurn + 0.2)) * (1 - clamp(seg(t, tInto, tInto + 0.3)));
  const axo = Math.max(axO, axBack);
  axX.setAttribute('d', `M${O[0]} ${O[1]} L${lerp(O[0], XM, easeOut(seg(t, tSplitB, tSplitB + 0.4)))} ${O[1]}`); axY.setAttribute('d', `M${O[0]} ${O[1]} L${O[0]} ${lerp(O[1], YT, easeOut(seg(t, tSplitB + 0.1, tSplitB + 0.5)))}`);
  gAxes.setAttribute('opacity', axo.toFixed(3)); labX.style.opacity = labY.style.opacity = (axo * clamp(seg(t, tSplitB + 0.3, tSplitB + 0.55))).toFixed(3);
  // ---- hook ----
  const hookO = 0;
  pHard.setAttribute('d', partial(HARD, easeOut(seg(t, 0.35, T('not'))))); pHard.setAttribute('opacity', (hookO * (t > T('not') + 0.2 ? 0.35 : 1)).toFixed(2));
  pSmart.setAttribute('d', partial(SMART, easeOut(seg(t, T('smarter') - 0.1, T('smarter') + 0.45)))); pSmart.setAttribute('opacity', hookO.toFixed(2));
  tagHard.style.opacity = (hookO * clamp(seg(t, 0.8, 1.0)) * (t > T('not') + 0.2 ? 0.4 : 1)).toFixed(2); tagSmart.style.opacity = (hookO * clamp(seg(t, T('smarter') + 0.3, T('smarter') + 0.5))).toFixed(2);
  const xk = clamp(pop(t, T('not') + 0.15)); xMark.style.opacity = (hookO * xk).toFixed(2); xMark.style.transform = `scale(${(0.4 + 0.6 * xk).toFixed(3)})`;
  const dk = clamp(pop(t, T('colleges') - 0.1)); debt.style.opacity = (hookO * dk).toFixed(2); debt.style.transform = `scale(${(0.8 + 0.2 * dk).toFixed(3)})`; debtStrike.style.width = (360 * easeOut(seg(t, T('erase'), T('debt') + 0.3))) + 'px';
  // ---- staircase + plates ----
  const stairO = clamp(seg(t, sA - 0.05, sA + 0.2)) * (1 - clamp(seg(t, tHere - 0.1, tHere + 0.2))) + axBack * 1;
  const collapse = easeInOut(seg(t, tInto, tInto + 0.45));
  const stretch = easeInOut(seg(t, tFive, tFive + 0.7)) * (1 - easeInOut(seg(t, tTurn - 0.1, tTurn + 0.2)));
  const xs = lerp(1, 1.68, stretch) * (1 - collapse * 0.98), ysq = 1 - collapse * 0.98;
  const nShown = t < sA ? 0 : clamp(Math.floor((t - sA) / ((sB - sA) / NS_)) + 1, 0, NS_);
  const sp = [[O[0], O[1]]]; let x = O[0], y = O[1];
  for (let c = 0; c < NS_; c++) { const vis = t < sB ? c < nShown : true; if (!vis && !(axBack > 0)) break; x += RUN * xs; sp.push([x, y]); y -= RISE * ysq; sp.push([x, y]); }
  pStairs.setAttribute('d', 'M' + sp.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L')); pStairs.setAttribute('opacity', clamp(stairO).toFixed(3));
  const cleanT = c => stepT(c) + 0.05;
  plates.forEach(p => { const cx = O[0] + (p.c + 0.5) * RUN * xs, cy = O[1] - 9 - p.k * 15 * ysq; let o;
    if (p.top) o = clamp((t - stepT(p.c)) / 0.15); else o = clamp((t - (stepT(p.c) + 0.02 * p.k)) / 0.12);
    const flyIn = clamp(seg(t, tStream, tStream + 0.6)); const fx = lerp(cx, 500, easeIn(flyIn)), fy = lerp(cy, 485 * 0.55 + 485 * 0.45, easeIn(flyIn));
    const dirty = false; const hl = t > tExh && p.top && p.c < 3 && t > [tExh + 0.1, tThird - 0.3, tThird][p.c] && t < T('working');
    p.g.setAttribute('transform', `translate(${fx.toFixed(1)},${fy.toFixed(1)}) scale(${(hl ? 1.35 : 1) * (1 - flyIn * 0.6)})`);
    p.g.firstChild.setAttribute('fill', hl ? RED : dirty ? '#8d7b58' : '#fff'); p.g.firstChild.setAttribute('stroke', dirty ? '#5f513a' : '#bbb');
    p.g.setAttribute('opacity', (o * clamp(stairO + flyIn) * (1 - clamp(seg(t, tStream + 0.45, tStream + 0.6)))).toFixed(3)); });
  checks.forEach((c, i) => { const k = clamp(pop(t, cleanT(i))) * (1 - clamp(seg(t, tFive - 0.2, tFive))); const cx = O[0] + (i + 0.5) * RUN * xs; c.style.left = (cx - 12) + 'px'; c.style.top = (O[1] - 9 - (i + 1) * 2 * 15 - 40) + 'px'; c.style.opacity = k.toFixed(2); c.style.transform = `scale(${k.toFixed(2)})`; });
  // ---- dishwasher / machine line ----
  const mDraw = easeOut(seg(t, tUse, tUse + 0.5)), solid = t >= tMach - 0.05;
  const mO = clamp(seg(t, tUse - 0.05, tUse + 0.1)) * (1 - clamp(seg(t, tHere - 0.1, tHere + 0.2)));
  pMach.setAttribute('d', partial([O, MEND], solid ? Math.max(mDraw, 1) : mDraw)); pMach.setAttribute('opacity', mO.toFixed(3));
  pMach.setAttribute('stroke-dasharray', solid ? 'none' : '14 12'); pMach.setAttribute('stroke-width', solid ? 11 : 6); pMach.style.filter = solid ? GLOW : 'none';
  dwIcon.style.opacity = (mO * clamp(seg(t, tUse + 0.3, tUse + 0.5))).toFixed(2);
  const rp = (((t - T('right')) % 0.9) + 0.9) % 0.9 / 0.9; ring.setAttribute('opacity', 0); ring.setAttribute('r', (20 + rp * 50).toFixed(1));
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
