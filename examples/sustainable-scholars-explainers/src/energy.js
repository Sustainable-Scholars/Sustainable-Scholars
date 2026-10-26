/* ============ Sustainable Scholars: high-energy promo (16.875 s = 9 bars @ 128 BPM) ============
 beat = 0.46875 s. Scene starts: S1 0 | S2 1.875 | S3 3.75 | S4 7.97 | S5 10.78 | S6 13.59
 S1 SPARK   gold dot pulses on the beat -> stretches to a line (label "SCHOLARSHIP SEARCH") -> wobbles -> expands into a full gold flood     [kick, riser, boom on flood]
 S2 BRAND   INTRODUCING / SUSTAINABLE SCHOLARS. (masked letters) / italic "find your scholarship"; the full stop detaches and grows into S3's cream bg   [clap, whoosh]
 S3 TYPE    SEARCH. | MATCH. | PLAN. | debt-free.  (two beats each, last three; the site's own verbs) hard swaps on the beat       [blip per word]
 S4 DATA    ring of 700 dots condenses; "10,000+ verified scholarships", "1,400+ colleges" (the site's numbers); burst; ring collapses to a dot -> navy flood
 S5 PRODUCT tilted card + 2 ghost cards: grade, state, "Start my free match", toast "Your list arrives by email within 48 hours."          [clicks]
 S6 END     gold flood from the button; name, italic tagline, URL typed letter by letter, hairline rule                                    [riser, boom, chime]
*/
const W = 1920, H = 1080, BPM = 128, B = 60 / BPM, DUR = 36 * B;
const INK = '#0B0B10', GOLD = '#C7A44D', CREAM = '#EDEBE4', NAVY = '#17203A', WHITE = '#FFFFFF', RED = '#FF3B30';
const F = { name: "'Playfair Display',serif", slam: "'Inter Tight',Inter,sans-serif", ital: "'Instrument Serif',serif", mono: "'JetBrains Mono',monospace", sans: 'Inter,sans-serif' };
const SC = [0, 4 * B, 8 * B, 17 * B, 23 * B, 29 * B, DUR];                  // scene boundaries
const stage = document.getElementById('stage');
const box = (parent, css, text) => el('div', `position:absolute;${css}`, parent, text);
const full = (parent, css = '') => box(parent, `left:0;top:0;width:${W}px;height:${H}px;${css}`);
const win = (t, a, b) => t >= a && t < b;
const beatPulse = t => Math.exp(-((t / B) % 1) * 5);                          // 1 on each beat, decays

const cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.style.cssText = 'position:absolute;left:0;top:0'; stage.appendChild(cv); const g = cv.getContext('2d');
const cvm = document.createElement('canvas').getContext('2d'); const textW = (s, f) => { cvm.font = f; return cvm.measureText(s).width; };

// ---------- S2: brand slam text ----------
const S2 = full(stage);
const kick2 = box(S2, `left:0;top:300px;width:${W}px;text-align:center;font:500 22px ${F.mono};letter-spacing:9px;color:${INK}`, 'INTRODUCING');
function slamLine(text, top, size) { const row = box(S2, `left:0;top:${top}px;width:${W}px;text-align:center;font:900 ${size}px/1 ${F.name};color:${INK};white-space:nowrap;letter-spacing:-4px`); const cells = [...text].map(ch => { const c = el('span', 'display:inline-block;overflow:hidden;vertical-align:top;height:1.12em;line-height:1.12', row); const i = el('span', 'display:inline-block;will-change:transform', c, ch); return { c, i, ch }; }); return { row, cells }; }
const L1 = slamLine('SUSTAINABLE', 345, 190), L2 = slamLine('SCHOLARS.', 535, 190);
const ital = box(S2, `left:0;top:790px;width:${W}px;text-align:center;font:italic 400 76px ${F.ital};color:${INK}`, 'find your scholarship');
const periodSpan = L2.cells[L2.cells.length - 1].c;

// ---------- S3: kinetic words ----------
const S3 = full(stage); const wordLayers = [];
function wordLayer(bg, extra) { const L = full(S3, `background:${bg};`); extra && extra(L); return L; }
const w1 = wordLayer(CREAM), w2 = wordLayer(INK, L => { for (let r = 0; r < 7; r++) box(L, `left:${-300 + (r % 2) * -260}px;top:${-30 + r * 160}px;white-space:nowrap;font:900 150px/1 ${F.slam};color:transparent;-webkit-text-stroke:2px ${GOLD};opacity:.22`, 'MATCH. MATCH. MATCH. MATCH. MATCH. MATCH.'); }), w3 = wordLayer(NAVY, L => {
  const br = (css) => box(L, `width:70px;height:70px;border:5px solid ${GOLD};${css}`);
  br('left:90px;top:90px;border-right:0;border-bottom:0'); br(`right:90px;top:90px;border-left:0;border-bottom:0`); br('left:90px;bottom:90px;border-right:0;border-top:0'); br('right:90px;bottom:90px;border-left:0;border-top:0');
  box(L, `left:0;width:${W}px;top:140px;text-align:center;font:500 20px ${F.mono};letter-spacing:6px;color:${GOLD}`, '1920 × 1080'); }), w4 = wordLayer(CREAM);
const word = (L, txt, color) => { const wrap = box(L, `left:0;top:0;width:${W}px;height:${H}px;display:flex;align-items:center;justify-content:center`); return el('span', `font:900 380px/1 ${F.slam};color:${color};letter-spacing:-8px;white-space:nowrap;display:inline-block`, wrap, txt); };
const wt1 = word(w1, 'SEARCH.', INK), wt2 = word(w2, 'MATCH.', GOLD), wt3 = word(w3, 'PLAN.', WHITE);
const w4Wrap = box(w4, `left:0;top:0;width:${W}px;height:${H}px;display:flex;align-items:center;justify-content:center`);
const wt4 = el('span', `font:italic 400 430px/1 ${F.ital};color:${INK};white-space:nowrap;display:inline-block;clip-path:inset(-20% 100% -20% 0);transform:rotate(-4deg)`, w4Wrap, 'debt-free.');
const wipe3 = box(S3, `left:0;top:0;height:${H}px;width:0px;background:${INK};z-index:5`);
const wordsT = [[SC[2], SC[2] + 2 * B], [SC[2] + 2 * B, SC[2] + 4 * B], [SC[2] + 4 * B, SC[2] + 6 * B], [SC[2] + 6 * B, SC[3]]];
const wordEl = [wt1, wt2, wt3, wt4], layers = [w1, w2, w3, w4];

// ---------- S4: data labels ----------
const S4 = full(stage);
const lab1 = box(S4, `left:0;top:80px;width:${W}px;text-align:center;font:500 22px ${F.mono};letter-spacing:7px;color:${GOLD}`, 'VERIFIED SCHOLARSHIPS');
const cnt1 = box(S4, `left:0;top:424px;width:${W}px;text-align:center;font:900 190px/1 ${F.name};color:#fff;letter-spacing:-3px;white-space:nowrap`, '0');
const lab2 = box(S4, `left:0;top:640px;width:${W}px;text-align:center;font:500 30px ${F.mono};letter-spacing:6px;color:${CREAM};white-space:nowrap`, '');

// ---------- S5: tilted card ----------
const S5 = full(stage); const stack = box(S5, `left:${W / 2 - 400}px;top:${H / 2 - 270}px;width:800px;height:540px;transform-style:preserve-3d`);
const ghost = (dx, dy, o) => box(stack, `left:${dx}px;top:${dy}px;width:800px;height:540px;border-radius:26px;background:#1E2538;border:2px solid #343C52;opacity:${o}`);
const gh2 = ghost(80, -70, 0.35), gh1 = ghost(40, -35, 0.6);
const front = box(stack, `left:0;top:0;width:800px;height:540px;border-radius:26px;background:#222839;border:2px solid #3A4259;box-shadow:0 40px 90px rgba(0,0,0,.5)`);
box(front, `left:44px;top:38px;font:700 44px ${F.name};color:#fff;white-space:nowrap`, 'Get your top 3 matches, free'); box(front, `left:44px;top:100px;font:400 22px ${F.sans};color:#98A0B5`, 'No account needed. Your list arrives by email within 48 hours.');
box(front, `left:44px;top:170px;font:600 16px ${F.sans};color:#98A0B5`, 'Grade'); box(front, `left:420px;top:170px;font:600 16px ${F.sans};color:#98A0B5`, 'Home state');
const selB = (l) => { const b = box(front, `left:${l}px;top:198px;width:336px;height:74px;border-radius:14px;background:#141A28;border:2px solid #343C52`); return { b, t: box(b, `left:22px;top:20px;font:500 25px ${F.sans};color:#fff;white-space:nowrap`, 'Choose') }; };
const sg = selB(44), ss = selB(420);
const infoR = box(front, `left:44px;top:304px;width:712px;height:96px;border-radius:16px;background:#1A2030;border:2px solid #343C52`); box(infoR, `left:22px;top:16px;font:700 44px ${F.name};color:${GOLD}`, 'Over 10,000'); box(infoR, `left:312px;top:30px;font:500 23px ${F.sans};color:#fff`, 'verified scholarships');
const goBtn = box(front, `left:44px;top:428px;width:712px;height:78px;border-radius:16px;background:${GOLD};text-align:center;font:700 27px/78px ${F.sans};color:#0A0F1A;box-shadow:0 8px 0 #8E7432`, 'Start my free match  →');
const toast = box(S5, `left:${W - 760}px;top:120px;width:640px;height:84px;border-radius:42px;background:#10141F;border:3px solid ${GOLD};color:#fff;font:600 24px/78px ${F.sans};text-align:center;opacity:0`, 'Your list arrives by email within 48 hours.');
const cur = box(S5, 'left:0;top:0;width:34px;height:40px;z-index:30;filter:drop-shadow(0 3px 5px rgba(0,0,0,.5))'); cur.innerHTML = '<svg width="34" height="40" viewBox="0 0 34 40"><path d="M3 2 L3 30 L10.5 23.5 L16 36 L21.5 33.5 L16 21.5 L26 21.5 Z" fill="#fff" stroke="#111" stroke-width="2.2" stroke-linejoin="round"/></svg>';

// ---------- S6: end card ----------
const S6 = full(stage);
const nameCells = (() => { const row = box(S6, `left:0;top:395px;width:${W}px;text-align:center;font:900 132px/1 ${F.name};color:${INK};white-space:nowrap;letter-spacing:-2px`); return [...'Sustainable Scholars'].map(ch => { const c = el('span', 'display:inline-block;overflow:hidden;vertical-align:top;height:1.2em;white-space:pre', row); const i = el('span', 'display:inline-block;white-space:pre', c, ch); return i; }); })();
const dotEnd = box(S6, `left:${W / 2 + 580}px;top:480px;width:22px;height:22px;border-radius:50%;background:${INK}`);
const tag6 = box(S6, `left:0;top:560px;width:${W}px;text-align:center;font:italic 400 70px ${F.ital};color:${INK}`, 'Find your scholarship.');
const url6 = box(S6, `left:0;top:690px;width:${W}px;text-align:center;font:500 28px ${F.mono};letter-spacing:8px;color:${INK}`);
const rule6 = box(S6, `left:${W / 2 - 200}px;top:765px;width:400px;height:2px;background:${INK};transform-origin:0 50%`);

// ---------- HUD / texture ----------
const HUD = full(stage, 'pointer-events:none;z-index:50'); const brk = [0, 1, 2, 3].map(i => box(HUD, `width:38px;height:38px;border:2px solid #fff;opacity:.5;${i < 2 ? 'top:40px;' : 'bottom:40px;'}${i % 2 ? 'right:40px;border-left:0;' : 'left:40px;border-right:0;'}${i < 2 ? 'border-bottom:0;' : 'border-top:0;'}`));
const hudScene = box(HUD, `right:96px;top:46px;font:500 14px ${F.mono};letter-spacing:2px;color:#fff;opacity:.5`), hudCat = box(HUD, `left:96px;bottom:46px;font:500 14px ${F.mono};letter-spacing:2px;color:#fff;opacity:.5`), hudTC = box(HUD, `right:96px;bottom:46px;font:500 14px ${F.mono};letter-spacing:2px;color:#fff;opacity:.5`);
const hudDot = box(HUD, `right:218px;bottom:50px;width:9px;height:9px;border-radius:50%;background:${RED}`);
const CATS = ['SPARK', 'BRAND', 'KINETIC TYPE', 'DATA', 'PRODUCT', 'END CARD'], HUDLIGHT = [1, 0, 0, 1, 1, 0];
const vign = full(stage, 'pointer-events:none;background:radial-gradient(ellipse at center,rgba(0,0,0,0) 55%,rgba(0,0,0,.34) 100%);z-index:45');
const grainTiles = [0, 1, 2, 3].map(k => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), d = x.createImageData(256, 256), r = rng(100 + k); for (let i = 0; i < d.data.length; i += 4) { const v = r() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 15; } x.putImageData(d, 0, 0); return c.toDataURL(); });
const grain = full(stage, 'pointer-events:none;z-index:46;opacity:.9;background-size:256px 256px;mix-blend-mode:overlay');

// ---------- canvas backgrounds + shapes ----------
const gp = (() => { const r = rng(21); return Array.from({ length: 700 }, () => ({ sx: r() * W, sy: r() * H, a: r() * 6.283, rad: 330 + (r() - 0.5) * 22, dx: r() - 0.5, dy: r() - 0.5, sp: 700 + r() * 1700, ph: r() })); })();
function drawBG(t) {
  g.clearRect(0, 0, W, H);
  // base
  let base = INK;
  if (t >= SC[1] && t < SC[2]) base = GOLD; else if (t >= SC[2] && t < SC[3]) base = [CREAM, INK, NAVY, CREAM][clamp(Math.floor((t - SC[2]) / (2 * B)), 0, 3)]; else if (t >= SC[3] && t < SC[4]) base = INK; else if (t >= SC[4] && t < SC[5]) base = NAVY; else if (t >= SC[5]) base = GOLD;
  g.fillStyle = base; g.fillRect(0, 0, W, H);
  // S1 spark: grid, dot, line, flood
  if (t < SC[1]) {
    g.strokeStyle = 'rgba(255,255,255,.05)'; g.lineWidth = 1; for (let x = 0; x <= W; x += 80) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y <= H; y += 80) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    const appear = spring(t - 0.12, 18, 0.6), stretch = ease(seg(t, 0.85, 1.25)), wob = Math.sin((t - 1.25) * 26) * 14 * Math.exp(-(t - 1.25) * 7) * (t > 1.25 ? 1 : 0), fl = easeIn(seg(t, 1.5, SC[1]));
    const hw = lerp(10 + 7 * beatPulse(t) * (1 - stretch), W / 2, stretch) * appear, hh = lerp(10 + 7 * beatPulse(t), 2, stretch);
    g.fillStyle = GOLD; if (fl > 0) { const hgt = lerp(4, H, fl); g.fillRect(0, H / 2 - hgt / 2 + wob * (1 - fl), W, hgt); } else { g.beginPath(); g.ellipse(W / 2, H / 2 + wob, Math.max(0.1, hw), Math.max(0.1, hh), 0, 0, 6.283); g.fill(); }
  }
  // S2 period flood (cream)
  if (t >= SC[1] && t < SC[2]) { const k = easeIn(seg(t, SC[2] - 0.5, SC[2] - 0.02)); if (k > 0) { const pr = periodSpan.getBoundingClientRect(), stg = stage.getBoundingClientRect(), sc = W / stg.width; const px0 = (pr.left + pr.width / 2 - stg.left) * sc, py0 = (pr.top + pr.height * 0.82 - stg.top) * sc; g.fillStyle = CREAM; g.beginPath(); g.arc(px0, py0, 10 + k * 2400, 0, 6.283); g.fill(); } }
  // S3 -> S4 ink bar wipe
  if (t >= SC[2] && t < SC[3]) { const k = easeIn(seg(t, SC[3] - 0.34, SC[3])); if (k > 0) { g.fillStyle = INK; g.fillRect(0, 0, W * k, H); } }
  // S4 particles
  if (t >= SC[3] && t < SC[4]) {
    const T0 = SC[3], conv = ease(seg(t, T0 + 0.05, T0 + 1.1)), burstT = SC[3] + 4 * B, collapse = ease(seg(t, burstT + 0.55, burstT + 0.85)), rot = t * 0.35;
    g.fillStyle = GOLD; gp.forEach(p => { let x, y; const ang = p.a + rot, rx = W / 2 + Math.cos(ang) * p.rad * (1 + 0.04 * Math.sin(t * 6 + p.a * 5) * (t > T0 + 1.1 ? 1 : 0)), ry = H / 2 + Math.sin(ang) * p.rad * (1 + 0.04 * Math.sin(t * 6 + p.a * 5) * (t > T0 + 1.1 ? 1 : 0));
      if (t < burstT) { x = lerp(p.sx, rx, conv); y = lerp(p.sy, ry, conv); } else { const d = t - burstT, ux = Math.cos(ang), uy = Math.sin(ang); x = rx + ux * d * p.sp; y = ry + uy * d * p.sp; }
      const al = t < burstT ? 0.35 + 0.65 * conv : 1 - seg(t, burstT, burstT + 0.55); if (al <= 0.01) return; g.globalAlpha = al; g.beginPath(); g.arc(x, y, 3.2, 0, 6.283); g.fill(); }); g.globalAlpha = 1;
    // ring stroke appears after burst and collapses to a dot
    const rr = lerp(330, 6, collapse); if (t >= burstT + 0.05) { g.strokeStyle = GOLD; g.lineWidth = lerp(3, 12, collapse); g.globalAlpha = 1; g.beginPath(); g.arc(W / 2, H / 2, rr, 0, 6.283); g.stroke(); }
    const fl = easeIn(seg(t, SC[4] - 0.3, SC[4])); if (fl > 0) { g.fillStyle = NAVY; g.beginPath(); g.arc(W / 2, H / 2, 6 + fl * 1700, 0, 6.283); g.fill(); }
  }
  // S5 -> S6 gold flood from the button
  if (t >= SC[4] && t < SC[5]) { const k = easeIn(seg(t, SC[5] - 0.45, SC[5] - 0.02)); if (k > 0) { g.fillStyle = GOLD; g.beginPath(); g.arc(W / 2 - 40, H / 2 + 160, 10 + k * 2300, 0, 6.283); g.fill(); } }
}

// ---------- the seek ----------
const showL = (e, o) => { e.style.opacity = o.toFixed(3); e.style.display = o <= 0.001 ? 'none' : 'block'; };
function seekAll(t) {
  drawBG(t);
  // S2
  const on2 = win(t, SC[1], SC[2] - 0.02) ? 1 : 0; showL(S2, on2);
  if (on2) { const t0 = SC[1] + 0.06; [L1, L2].forEach((L, li) => L.cells.forEach((c, i) => { const k = easeOutBack(seg(t, t0 + li * 0.35 + i * 0.045, t0 + li * 0.35 + i * 0.045 + 0.2), 1.2); c.i.style.transform = `translateY(${px((1 - k) * 120)})`; }));
    kick2.style.opacity = easeOut(seg(t, SC[1] + 0.02, SC[1] + 0.3)).toFixed(2); const ik = easeOut(seg(t, SC[1] + 6 * B * 0 + 3 * B, SC[1] + 3 * B + 0.3)); ital.style.opacity = ik.toFixed(3); ital.style.transform = `translateY(${px((1 - ik) * 28)})`; }
  // S3
  const on3 = win(t, SC[2], SC[3]) ? 1 : 0; showL(S3, on3);
  if (on3) { wordsT.forEach(([a, b], i) => { const vis = t >= a && t < b; layers[i].style.display = vis ? 'block' : 'none'; if (!vis) return; const dt = t - a, k = spring(dt, 22, 0.6), bl = 1 - clamp(dt / 0.14), e = wordEl[i];
      if (i < 3) { e.style.transform = `translateX(${px((1 - k) * -260 * (i === 1 ? -1 : 1))}) scale(${(0.94 + 0.06 * k).toFixed(3)})`; e.style.filter = bl > 0.02 ? `blur(${(bl * 16).toFixed(1)}px)` : 'none'; e.style.opacity = clamp(dt / 0.06).toFixed(2); }
      else { e.style.clipPath = `inset(-20% ${((1 - easeOut(seg(dt, 0.05, 0.95))) * 100).toFixed(1)}% -20% 0)`; } }); }
  wipe3.style.width = px(W * easeIn(seg(t, SC[3] - 0.34, SC[3])));
  // S4
  const on4 = win(t, SC[3] + 0.1, SC[4] - 0.3) ? 1 : 0; showL(S4, on4);
  if (on4) { const t0 = SC[3]; const k1 = ease(seg(t, t0 + 0.5, t0 + 1.7)), k2 = ease(seg(t, t0 + 1.1, t0 + 2.1)); cnt1.textContent = Math.round(10000 * k1).toLocaleString('en-US') + (k1 > 0.995 ? '+' : ''); cnt1.style.filter = k1 < 0.99 ? `blur(${((1 - k1) * 5).toFixed(1)}px)` : 'none';
    lab1.style.opacity = easeOut(seg(t, t0 + 0.3, t0 + 0.7)).toFixed(2); lab2.textContent = Math.round(1400 * k2).toLocaleString('en-US') + (k2 > 0.995 ? '+' : '') + ' COLLEGES'; lab2.style.opacity = easeOut(seg(t, t0 + 1.0, t0 + 1.4)).toFixed(2);
    const burst = SC[3] + 4 * B, fo = 1 - seg(t, burst, burst + 0.3); S4.style.opacity = (fo * 1).toFixed(3); }
  // S5
  const on5 = win(t, SC[4] - 0.02, SC[5] - 0.05) ? 1 : 0; showL(S5, on5 * (1 - seg(t, SC[5] - 0.4, SC[5] - 0.05)));
  if (on5) { const t0 = SC[4]; const k = easeOutQuint(seg(t, t0 + 0.05, t0 + 0.7)); const ry = lerp(-40, -14, k) + Math.sin(t * 1.3) * 1.5, rx = lerp(20, 8, k);
    stack.style.transform = `perspective(2000px) rotateY(${ry.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg) scale(${(0.82 + 0.18 * k).toFixed(3)})`; stack.style.opacity = clamp(seg(t, t0, t0 + 0.2)).toFixed(2);
    const press = (t > t0 + 1.62 && t < t0 + 1.82) ? 0.97 : 1; goBtn.style.transform = `translateY(${press < 1 ? 6 : 0}px)`; goBtn.style.boxShadow = `0 ${press < 1 ? 2 : 8}px 0 #8E7432`; goBtn.style.filter = t > t0 + 1.7 && t < t0 + 2.1 ? 'brightness(1.14)' : 'none';
    sg.t.textContent = t >= t0 + 0.78 ? '12th Grade (Senior)' : 'Choose'; sg.b.style.borderColor = t >= t0 + 0.78 && t < t0 + 1.3 ? GOLD : '#343C52'; ss.t.textContent = t >= t0 + 1.16 ? 'Michigan' : 'Choose'; ss.b.style.borderColor = t >= t0 + 1.16 && t < t0 + 1.6 ? GOLD : '#343C52';
    const tk = easeOutBack(seg(t, t0 + 1.7, t0 + 2.05)); toast.style.opacity = clamp(tk).toFixed(2); toast.style.transform = `translateX(${px((1 - clamp(tk)) * 220)})`;
    const cx = kf([[t0 + 0.3, W / 2 + 300], [t0 + 0.75, W / 2 - 110], [t0 + 1.12, W / 2 + 260], [t0 + 1.6, W / 2 - 40]])(t), cy = kf([[t0 + 0.3, H / 2 + 220], [t0 + 0.75, H / 2 - 30], [t0 + 1.12, H / 2 - 30], [t0 + 1.6, H / 2 + 150]])(t); cur.style.transform = `translate(${px(cx)},${px(cy)}) scale(${(Math.abs(t - (t0 + 0.8)) < 0.07 || Math.abs(t - (t0 + 1.18)) < 0.07 || Math.abs(t - (t0 + 1.66)) < 0.07) ? 0.82 : 1})`; cur.style.opacity = clamp(seg(t, t0 + 0.3, t0 + 0.45) * (1 - seg(t, t0 + 2.2, t0 + 2.4))).toFixed(2); }
  // S6
  const on6 = t >= SC[5] + 0.05 ? 1 : 0; showL(S6, on6);
  if (on6) { const t0 = SC[5]; nameCells.forEach((c, i) => { const k = easeOutBack(seg(t, t0 + 0.12 + i * 0.03, t0 + 0.12 + i * 0.03 + 0.2), 1.1); c.style.transform = `translateY(${px((1 - k) * 160)})`; });
    dotEnd.style.display = 'none'; const tg = easeOut(seg(t, t0 + 0.7, t0 + 1.1)); tag6.style.opacity = tg.toFixed(2); tag6.style.transform = `translateY(${px((1 - tg) * 20)})`;
    const u = 'SUSTAINABLE-SCHOLARS.ORG', n = Math.floor(clamp((t - (t0 + 1.0)) / 0.9) * u.length); url6.textContent = u.slice(0, n); rule6.style.transform = `scaleX(${easeOut(seg(t, t0 + 0.9, t0 + 1.6)).toFixed(3)})`; }
  // HUD
  const si = SC.findIndex((s, i) => t >= s && t < SC[i + 1]); const idx = clamp(si, 0, 5), light = HUDLIGHT[idx] ? '#fff' : INK;
  [hudScene, hudCat, hudTC].forEach(e => e.style.color = light); brk.forEach(b => b.style.borderColor = light);
  hudScene.textContent = `SCENE 0${idx + 1} / 06`; hudCat.textContent = CATS[idx]; const fr = Math.floor(t * 24), p2 = n => String(n).padStart(2, '0'); hudTC.textContent = `00:00:${p2(Math.floor(t))}:${p2(fr % 24)}`; hudDot.style.opacity = (Math.floor(t * 2) % 2 === 0) ? 0.85 : 0.2;
  grain.style.backgroundImage = `url(${grainTiles[Math.floor(t * 24) % 4]})`;
}

// ---------- sound (128 BPM) ----------
async function buildAudio(ctx) {
  const out = A.master(ctx, 0.9); const roots = { 1: 33, 2: 33, 3: 36, 4: 31, 5: 33, 6: 36 };
  for (let b = 0; b < 36; b++) { const t = b * B, sc = SC.findIndex((s, i) => t >= s - 1e-6 && t < SC[i + 1] - 1e-6); A.kick(ctx, out, t, b < 4 ? 0.3 : 0.55); if (b >= 4) { A.hat(ctx, out, t + B / 2, 0.07); if (b % 2 === 1) A.clap(ctx, out, t, 0.2); }
    if (b >= 4) { const r = roots[sc + 1] || 33; A.bass(ctx, out, t + B / 2, A.note(r + 12), B * 0.45, 0.2); A.bass(ctx, out, t, A.note(r), B * 0.9, 0.2); } }
  A.riser(ctx, out, 0.3, SC[1] - 0.3, 0.12); A.boom(ctx, out, SC[1], 0.8); A.whoosh(ctx, out, SC[1] - 0.3, 0.45, true, 0.2);
  // brand slam letters
  for (let i = 0; i < 11; i++) A.click(ctx, out, SC[1] + 0.06 + i * 0.045, 0.1, 2200 + i * 150);
  A.chime(ctx, out, SC[1] + 3 * B, A.note(79), 0.08); A.whoosh(ctx, out, SC[2] - 0.55, 0.5, true, 0.18); A.boom(ctx, out, SC[2], 0.45);
  // kinetic words: a blip each
  [[0, 76], [2, 79], [4, 83], [6, 88]].forEach(([bb, n]) => { const t = SC[2] + bb * B; A.tone(ctx, out, t, A.note(n), 0.28, { type: 'square', g: 0.07, lp: 3200 }); A.tone(ctx, out, t, A.note(n - 12), 0.35, { type: 'sine', g: 0.1 }); A.burst(ctx, out, t, 0.08, { f: 2600, q: 2, g: 0.12 }); });
  A.whoosh(ctx, out, SC[3] - 0.4, 0.4, true, 0.2); A.riser(ctx, out, SC[3], 1.0, 0.1);
  for (let t = SC[3] + 0.5, i = 0; t < SC[3] + 1.7; t += 0.06, i++) A.tick(ctx, out, t, 500 + i * 35, 0.045);
  A.boom(ctx, out, SC[3] + 4 * B, 0.7); A.whoosh(ctx, out, SC[3] + 4 * B, 0.7, false, 0.2); A.whoosh(ctx, out, SC[4] - 0.4, 0.4, true, 0.16);
  const t5 = SC[4]; [0.8, 1.18, 1.66].forEach(d => { A.click(ctx, out, t5 + d, 0.2, 1800); A.tone(ctx, out, t5 + d, 900, 0.07, { type: 'triangle', g: 0.06 }); }); A.chime(ctx, out, t5 + 1.72, A.note(88), 0.1);
  A.riser(ctx, out, SC[5] - 1.1, 1.05, 0.12); A.boom(ctx, out, SC[5], 0.85); A.whoosh(ctx, out, SC[5] - 0.45, 0.45, true, 0.2);
  for (let i = 0; i < 24; i++) A.click(ctx, out, SC[5] + 1.0 + i * (0.9 / 24), 0.07, 3000);
  A.chime(ctx, out, SC[5] + 1.0, A.note(84), 0.1); A.chime(ctx, out, SC[5] + 1.25, A.note(88), 0.08); A.pad(ctx, out, SC[5], [57, 60, 64, 69].map(A.note), 3.4, 0.045);
}
boot({ w: W, h: H, duration: DUR, seek: seekAll, buildAudio, bg: INK });
