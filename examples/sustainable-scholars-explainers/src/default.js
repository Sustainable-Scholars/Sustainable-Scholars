/* ============ Sustainable Scholars: clean product demo (60 s, 16:9) ============
 BEAT SHEET (all text is the site's own wording; all numbers are the site's own)
 0.0  "Introducing" fades up                                   [air pad]
 1.9  brand gradient sweeps in, name "Sustainable Scholars"     [riser, soft pluck]
 5.6  CH1 title "Find your scholarship." typed, push-in, highlight "scholarship"
 9.4  UI1 search types "University of Michigan merit aid"; form: grade, state, "Over 10,000", Start my free match + click   [key ticks, clicks]
 19.2 CH2 title "Every listing is checked against its official source."  highlight "official source"
 22.4 UI2 three listing cards slide in; spinner -> Verified; far cards blur; pull-back to "Live Scholarships"
 31.2 CH3 title "Answer a few questions. Get a personalized list."
 34.2 UI3 intake: student, grade, state, Continue; pull-back
 44.4 PROOF "Over 10,000 verified scholarships at 1,400+ colleges." count-ups over dotted globe
 50.0 CLOSER on gradient: three lines, then tagline "Find your scholarship."
 56.6 END CARD name + sustainable-scholars.org                  [chime]
*/
const W = 1920, H = 1080, DUR = 60;
const C = { canvas: '#F6F4EE', ink: '#1B2A4A', sec: '#7B8196', gold: '#C7A44D', card: '#222839', line: '#343C52', txt: '#ECEDF2', dim: '#98A0B5', green: '#1D6B4F', ok: '#5CC68F' };
const F = { serif: "'Playfair Display',serif", sans: "Inter,system-ui,sans-serif" };
const stage = document.getElementById('stage');
const layer = (parent = stage, css = '') => el('div', `position:absolute;left:0;top:0;width:${W}px;height:${H}px;${css}`, parent);
const cvs = document.createElement('canvas'); const cx2 = cvs.getContext('2d');
const textW = (s, font) => { cx2.font = font; return cx2.measureText(s).width; };
const vis = (t, a, b, f = 0.4) => clamp(Math.min(easeOut((t - a) / f), 1 - easeIn((t - (b - f)) / f)));
const sceneStyle = (root, o, blurK = 7) => { root.style.opacity = o.toFixed(3); root.style.filter = (o < 0.999 && o > 0) ? `blur(${((1 - o) * blurK).toFixed(2)}px)` : 'none'; root.style.display = o <= 0.001 ? 'none' : 'block'; };
const camTf = (s, fx, fy) => `translate(${W / 2}px,${H / 2}px) scale(${s.toFixed(4)}) translate(${(-fx).toFixed(2)}px,${(-fy).toFixed(2)}px)`;

// ---------- brand gradient (silk bands, drawn once) ----------
const grad = document.createElement('canvas'); grad.width = 2600; grad.height = 1500;
(function () {
  const g = grad.getContext('2d'), r = rng(5);
  const bg = g.createLinearGradient(0, 0, 2600, 1500); bg.addColorStop(0, '#FFFFFF'); bg.addColorStop(0.5, '#F3EAD0'); bg.addColorStop(1, '#D8BC6A'); g.fillStyle = bg; g.fillRect(0, 0, 2600, 1500);
  for (let i = 0; i < 9; i++) {
    const x0 = -600 + i * 330 + r() * 80, wd = 260 + r() * 360, a = 0.10 + r() * 0.16;
    const lg = g.createLinearGradient(x0, 0, x0 + wd, 0); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, `rgba(${i % 2 ? '255,250,235' : '199,164,77'},${a})`); lg.addColorStop(1, 'rgba(255,255,255,0)');
    g.save(); g.translate(1300, 750); g.rotate(-0.55); g.translate(-1300, -750); g.fillStyle = lg; g.fillRect(x0, -800, wd, 3100); g.restore();
  }
})();
const gradLayer = layer(stage); grad.style.cssText = 'position:absolute;left:-340px;top:-210px;width:2600px;height:1500px;'; gradLayer.appendChild(grad);

// ---------- cursor + click ripples ----------
const arrowSvg = '<svg width="34" height="40" viewBox="0 0 34 40"><path d="M3 2 L3 30 L10.5 23.5 L16 36 L21.5 33.5 L16 21.5 L26 21.5 Z" fill="#fff" stroke="#111" stroke-width="2.2" stroke-linejoin="round"/></svg>';
function makeCursor(world, pts, rippleColor) { // pts: [[t,x,y,click?]]
  const fx = kf(pts.map(p => [p[0], p[1]])), fy = kf(pts.map(p => [p[0], p[2]]));
  const clicks = pts.filter(p => p[3]).map(p => p[0]);
  const rip = clicks.map(() => el('div', `position:absolute;left:0;top:0;width:90px;height:90px;border-radius:50%;border:3px solid ${rippleColor};z-index:40;opacity:0`, world));
  const cur = el('div', 'position:absolute;left:0;top:0;width:34px;height:40px;z-index:50;filter:drop-shadow(0 3px 5px rgba(0,0,0,.35));transform-origin:3px 2px', world); cur.innerHTML = arrowSvg;
  return { clicks, update(t, t0, t1) {
    const x = fx(t), y = fy(t); const show = t > t0 && t < t1;
    let d = 1; clicks.forEach(c => { const dt = t - c; if (dt > -0.08 && dt < 0.2) d = 1 - 0.2 * Math.sin(clamp((dt + 0.08) / 0.28) * Math.PI); });
    cur.style.display = show ? 'block' : 'none'; cur.style.transform = `translate(${px(x)},${px(y)}) scale(${d.toFixed(3)})`;
    rip.forEach((r, i) => { const dt = t - clicks[i], k = seg(dt, 0, 0.6); r.style.opacity = (dt > 0 && dt < 0.6) ? (0.8 * (1 - k)).toFixed(3) : 0; r.style.left = px(fx(clicks[i]) - 45); r.style.top = px(fy(clicks[i]) - 45); r.style.transform = `scale(${(0.25 + k * 1.5).toFixed(3)})`; });
  } };
}

// =================== SCENE A: open ===================
const aWord = el('div', `position:absolute;left:0;width:${W}px;top:490px;text-align:center;font:500 30px ${F.sans};color:${C.sec};letter-spacing:.5px`, stage, 'Introducing');
const aName = el('div', `position:absolute;left:0;width:${W}px;top:478px;text-align:center;font:700 70px ${F.serif};color:${C.ink};letter-spacing:-1px;white-space:nowrap`, stage, 'Sustainable Scholars');

// =================== title scenes ===================
function titleScene(text, hl, a, b, scaleTo) { // visible a..b ; push in during a+0.6..b-0.5
  const root = layer(); const cam = layer(root); cam.style.transformOrigin = '50% 50%';
  const font = `500 30px ${F.sans}`; const full = textW(text, font), left = (W - full) / 2;
  const hi = hl ? text.indexOf(hl) : -1;
  const box = hi >= 0 ? el('div', `position:absolute;left:${left + textW(text.slice(0, hi), font) - 8}px;top:${H / 2 - 20}px;height:46px;width:${textW(hl, font) + 16}px;border-radius:9px;background:${C.gold};opacity:.32;transform-origin:0 50%`, cam) : null;
  const line = el('div', `position:absolute;left:0;width:${W}px;top:${H / 2 - 22}px;text-align:center;font:${font};color:${C.ink};white-space:nowrap;letter-spacing:-.2px`, cam);
  const spans = text.split(' ').map(w => el('span', 'display:inline-block;white-space:pre', line, w + ' '));
  return { update(t) {
    sceneStyle(root, vis(t, a, b));
    spans.forEach((s, i) => { const k = easeOut(seg(t, a + 0.15 + i * 0.16, a + 0.5 + i * 0.16)); s.style.opacity = k.toFixed(3); s.style.transform = `translateY(${px((1 - k) * 9)})`; });
    cam.style.transform = `scale(${kf([[a + 0.7, 1], [b - 0.45, scaleTo]])(t).toFixed(4)})`;
    if (box) box.style.transform = `scaleX(${easeOut(seg(t, b - 1.7, b - 0.85)).toFixed(3)})`;
  } };
}
const T1 = titleScene('Find your scholarship.', 'scholarship', 5.5, 9.9, 4.3);
const T2 = titleScene('Every listing is checked against its official source.', 'official source', 19.0, 23.0, 1.7);
const T3 = titleScene('Answer a few questions. Get a personalized list.', 'personalized list', 31.0, 34.8, 1.75);

// =================== UI helpers ===================
const box = (parent, css, text) => el('div', `position:absolute;${css}`, parent, text);

// =================== SCENE B: UI 1 (search + form) ===================
const U1 = layer(); const w1 = layer(U1); w1.style.transformOrigin = '0 0';
const BAR = { l: 460, t: 262, w: 1000, h: 78 };
const bar = box(w1, `left:${BAR.l}px;top:${BAR.t}px;width:${BAR.w}px;height:${BAR.h}px;border-radius:16px;background:#2A3042;border:2px solid #3B445C;box-shadow:0 20px 50px rgba(20,30,60,.25)`);
box(bar, 'left:26px;top:22px;width:30px;height:30px;').innerHTML = `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="${C.gold}" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>`;
const SQ = 'University of Michigan merit aid';
const qTxt = box(bar, `left:84px;top:20px;font:400 31px ${F.sans};color:${C.txt};white-space:nowrap`);
const qCaret = box(bar, `left:84px;top:18px;width:3px;height:40px;background:${C.gold}`);
const CARD = { l: 520, t: 410, w: 880, h: 560 };
const card = box(w1, `left:${CARD.l}px;top:${CARD.t}px;width:${CARD.w}px;height:${CARD.h}px;border-radius:22px;background:${C.card};border:2px solid ${C.line};box-shadow:0 30px 70px rgba(20,30,60,.30)`);
box(card, `left:36px;top:28px;font:700 38px ${F.serif};color:#fff;white-space:nowrap`, 'Get your top 3 matches, free');
box(card, `left:36px;top:84px;width:800px;font:400 21px/1.4 ${F.sans};color:${C.dim}`, 'No account needed. Your list arrives by email within 48 hours.');
box(card, `left:36px;top:156px;font:600 16px ${F.sans};color:${C.dim}`, 'Grade'); box(card, `left:460px;top:156px;font:600 16px ${F.sans};color:${C.dim}`, 'Home state');
const sel = (l, ph) => { const b = box(card, `left:${l}px;top:186px;width:384px;height:74px;border-radius:14px;background:#141A28;border:2px solid ${C.line}`); const t = box(b, `left:22px;top:20px;font:500 25px ${F.sans};color:#fff;white-space:nowrap`, ph); box(b, 'right:22px;top:26px;width:20px;height:20px;').innerHTML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="${C.dim}" stroke-width="2" stroke-linecap="round"><path d="M4 7l6 6 6-6"/></svg>`; return { b, t }; };
const gSel = sel(36, 'Choose'), sSel = sel(460, 'Choose');
const info = box(card, `left:36px;top:290px;width:806px;height:112px;border-radius:16px;background:#1A2030;border:2px solid ${C.line}`);
const infoBig = box(info, `left:24px;top:18px;font:700 46px ${F.serif};color:${C.gold};white-space:nowrap`);
box(info, `left:300px;top:34px;font:500 24px ${F.sans};color:#fff;white-space:nowrap`, 'verified scholarships');
box(info, `left:24px;top:76px;font:400 17px ${F.sans};color:${C.dim};white-space:nowrap`, 'Pick your state to see how many are in our database for you.');
const btn1 = box(card, `left:36px;top:428px;width:806px;height:82px;border-radius:16px;background:${C.gold};text-align:center;font:700 27px/82px ${F.sans};color:#0A0F1A`, 'Start my free match  →');
const cur1 = makeCursor(w1, [[9.6, 1230, 400], [12.2, 1230, 560], [12.85, 790, 640, 1], [13.5, 800, 640], [13.8, 1190, 640, 1], [14.6, 1230, 760], [15.8, 1200, 860], [16.3, 1050, 866, 1], [17.2, 1060, 880]], C.gold);
const camU1 = { s: kf([[9.4, 1.4], [11.6, 1.4], [12.6, 1.5], [14.1, 1.45], [15.5, 1.6], [17.0, 1.6], [18.4, 1.0]]), fx: null, fy: null };
const caretX = t => 84 + textW(typed(SQ, t, 10.2, 25), `400 31px ${F.sans}`);
camU1.fx = t => lerp(kf([[9.4, 760], [11.6, 760], [12.6, 960], [18.4, 960]])(t), 0, 0) + 0; // base
const camFx1 = t => kf([[9.4, 930], [11.7, 930], [12.7, 960], [18.4, 960]])(t);
const camFx1old = t => { const base = kf([[9.4, 760], [11.7, 760], [12.7, 960], [18.4, 960]])(t); const follow = (BAR.l + caretX(t)) - 140; const fw = 1 - seg(t, 11.3, 12.0); return lerp(base, Math.max(760, follow * 0.55 + 480 * 0.45 + 120), fw * seg(t, 10.0, 10.3)); };
const camFy1 = kf([[9.4, 320], [11.7, 320], [12.7, 640], [14.2, 700], [15.6, 840], [17.0, 840], [18.4, 630]]);
function updU1(t) {
  sceneStyle(U1, vis(t, 9.2, 19.4, 0.45), 6);
  w1.style.transform = camTf(camU1.s(t), camFx1(t), camFy1(t));
  const s = typed(SQ, t, 10.2, 25); qTxt.textContent = s; qTxt.style.display = t > 10.1 ? 'block' : 'none';
  qCaret.style.left = px(caretX(t) + 86); qCaret.style.opacity = (t > 9.8 && Math.floor(t * 2.2) % 2 === 0) || (t > 10.2 && t < 11.7) ? 1 : 0;
  qCaret.style.opacity = t < 12.2 && t > 9.8 && (t < 11.7 || Math.floor(t * 2.2) % 2 === 0) ? 1 : 0;
  gSel.t.textContent = t >= 12.95 ? '12th Grade (Senior)' : 'Choose'; gSel.b.style.borderColor = t >= 12.95 && t < 14 ? C.gold : C.line;
  sSel.t.textContent = t >= 13.85 ? 'Michigan' : 'Choose'; sSel.b.style.borderColor = t >= 13.85 && t < 15 ? C.gold : C.line;
  infoBig.textContent = 'Over 10,000'; infoBig.style.filter = (t > 14.4 && t < 15.6) ? `brightness(${(1 + 0.35 * Math.sin(seg(t, 14.4, 15.6) * Math.PI)).toFixed(3)})` : 'none';
  const press = (t > 16.22 && t < 16.5) ? 0.975 : 1; btn1.style.transform = `scale(${press})`; btn1.style.filter = t > 16.3 && t < 16.8 ? 'brightness(1.12)' : 'none';
  cur1.update(t, 9.6, 18.3);
}

// =================== SCENE C: UI 2 (verified listing cards) ===================
const U2 = layer(); const w2 = layer(U2); w2.style.transformOrigin = '0 0';
const LST = [
  { t: 'The Frederick Douglass Bicentennial Scholarship Program', o: 'UNCF', a: '$10,000', d: 'Full-time rising seniors at accredited four-year HBCUs with 3.5 GPA, leadership, service, and need.', cx: 380, at: 22.7 },
  { t: 'A Flight Away Scholarship', o: 'A Leap Ahead Foundation', a: '$2,000', d: 'Students attending college outside their home state.', cx: 960, at: 24.1 },
  { t: 'Abe Voron Award', o: 'Broadcast Education Association', a: '$3,000', d: "Bachelor's students in broadcasting or electronic media.", cx: 1540, at: 25.5 }];
const hdr = box(w2, `left:0;top:150px;width:${W}px;text-align:center`);
box(hdr, `left:0;top:0;width:${W}px;font:600 17px ${F.sans};letter-spacing:3px;color:${C.sec}`, 'VERIFIED SCHOLARSHIPS YOU CAN APPLY TO NOW.');
box(hdr, `left:0;top:34px;width:${W}px;font:700 66px ${F.serif};color:${C.ink}`, 'Live Scholarships');
const LC = LST.map(L => {
  const c = box(w2, `left:${L.cx - 270}px;top:400px;width:540px;height:350px;border-radius:20px;background:${C.card};border:2px solid ${C.line};box-shadow:0 28px 60px rgba(20,30,60,.28);will-change:transform,filter`);
  box(c, `left:30px;top:26px;font:600 15px ${F.sans};color:${C.gold}`, 'Open to most');
  const ver = box(c, 'right:30px;top:22px;width:130px;height:26px;'); ver.innerHTML = `<svg class="sp" width="22" height="22" viewBox="0 0 22 22" style="position:absolute;right:78px;top:2px" fill="none" stroke="${C.dim}" stroke-width="2.4" stroke-linecap="round"><path d="M11 3a8 8 0 1 1-8 8"/></svg><svg class="ck" width="22" height="22" viewBox="0 0 22 22" style="position:absolute;left:0;top:2px" fill="none" stroke="${C.ok}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="9"/><path class="cp" d="M6.5 11.5l3 3 6-6.5" stroke-dasharray="14" stroke-dashoffset="14"/></svg><span class="vt" style="position:absolute;left:30px;top:2px;font:600 15px ${F.sans};color:${C.ok}"></span>`;
  box(c, `left:30px;top:66px;width:480px;font:700 ${L.t.length > 40 ? 26 : 30}px/1.18 ${F.serif};color:#fff`, L.t);
  box(c, `left:30px;top:${L.t.length > 40 ? 146 : 112}px;font:400 16px ${F.sans};color:${C.dim}`, L.o);
  box(c, `left:30px;top:${L.t.length > 40 ? 176 : 146}px;font:700 36px ${F.serif};color:${C.gold}`, L.a);
  box(c, `left:30px;top:${L.t.length > 40 ? 228 : 198}px;width:480px;font:400 18px/1.4 ${F.sans};color:#D4D8E4`, L.d);
  box(c, 'left:30px;right:30px;top:282px;height:1px;background:#343C52');
  const ap = box(c, `right:30px;top:294px;width:118px;height:42px;border-radius:9px;background:${C.gold};text-align:center;font:700 17px/42px ${F.sans};color:#0A0F1A`, 'Apply  ↗');
  return { c, ver, ap, sp: ver.querySelector('.sp'), ck: ver.querySelector('.ck'), cp: ver.querySelector('.cp'), vt: ver.querySelector('.vt') };
});
const cur2 = makeCursor(w2, [[23.2, 1000, 900], [25.6, 960, 880], [26.7, 900, 750], [27.1, 893, 747, 1], [28.3, 960, 800]], C.gold);
const camU2 = { s: kf([[22.4, 1.5], [24.0, 1.5], [25.4, 1.5], [26.5, 1.55], [28.4, 1.55], [29.9, 1.0]]),
  fx: kf([[22.4, 380], [23.5, 380], [24.5, 960], [25.8, 1540], [26.6, 960], [28.4, 960]]), fy: kf([[22.4, 575], [28.4, 575], [29.9, 470]]) };
function updU2(t) {
  sceneStyle(U2, vis(t, 22.2, 31.6, 0.45), 6);
  const s = camU2.s(t), fx = camU2.fx(t); w2.style.transform = camTf(s, fx, camU2.fy(t));
  hdr.style.opacity = easeOut(seg(t, 29.0, 29.9)).toFixed(3);
  LC.forEach((o, i) => {
    const L = LST[i], k = easeOutQuint(seg(t, L.at, L.at + 0.7)); const dist = Math.abs(L.cx - fx), blur = s > 1.2 ? clamp((dist - 300) / 1100) * 5 : 0;
    o.c.style.opacity = k.toFixed(3); o.c.style.transform = `translateY(${px((1 - k) * 90)}) scale(${(1 - 0.05 * clamp(dist / 1500)).toFixed(3)})`; o.c.style.filter = blur > 0.1 ? `blur(${blur.toFixed(2)}px)` : 'none';
    const vt = L.at + 1.0, spin = t < vt, done = easeOut(seg(t, vt, vt + 0.35));
    o.sp.style.opacity = spin && t > L.at + 0.3 ? 1 : 0; o.sp.style.transform = `rotate(${(t * 520) % 360}deg)`; o.sp.style.transformOrigin = '11px 11px';
    o.ck.style.opacity = done.toFixed(3); o.cp.style.strokeDashoffset = (14 * (1 - easeOut(seg(t, vt + 0.1, vt + 0.5)))).toFixed(2); o.vt.textContent = done > 0.05 ? 'Verified' : '';
    o.vt.style.opacity = done.toFixed(3);
  });
  LC[1].ap.style.filter = (t > 26.9 && t < 27.5) ? 'brightness(1.15)' : 'none'; LC[1].ap.style.transform = (t > 27.05 && t < 27.3) ? 'scale(.96)' : 'none';
  cur2.update(t, 23.2, 29.6);
}

// =================== SCENE D: UI 3 (intake) ===================
const U3 = layer(); const w3 = layer(U3); w3.style.transformOrigin = '0 0';
const PN = { l: 460, t: 20, w: 1000, h: 1120 };
const pn = box(w3, `left:${PN.l}px;top:${PN.t}px;width:${PN.w}px;height:${PN.h}px;border-radius:26px;background:#F7F6F1;border:2px solid #E2DFD3;box-shadow:0 40px 90px rgba(27,42,74,.22);overflow:hidden`);
const gb = box(pn, `left:0;top:0;width:${PN.w}px;height:88px;background:${C.green}`);
box(gb, `left:46px;top:22px;font:700 34px ${F.serif};color:#fff;white-space:nowrap`, 'Scholarship Blueprint');
box(gb, `right:46px;top:30px;font:400 21px ${F.sans};color:#E9F2EC;white-space:nowrap`).innerHTML = '<b style="font-weight:700;color:#fff">10K+</b> Scholarships &nbsp;&nbsp;&nbsp;<b style="font-weight:700;color:#fff">48h</b> Blueprint delivery';
box(pn, `left:50px;top:126px;font:700 15px ${F.sans};letter-spacing:2.5px;color:${C.green}`, 'STEP 1 OF 7'); box(pn, `right:50px;top:126px;font:400 16px ${F.sans};color:${C.sec}`, '14% complete');
box(pn, 'left:50px;right:50px;top:160px;height:6px;border-radius:3px;background:#E6E3D8'); box(pn, `left:50px;top:160px;width:${(PN.w - 100) * 0.14}px;height:6px;border-radius:3px;background:${C.green}`);
box(pn, `left:50px;top:196px;font:700 56px ${F.serif};color:${C.ink};white-space:nowrap`, 'A few basics');
box(pn, `left:50px;top:274px;font:400 21px ${F.sans};color:${C.sec};white-space:nowrap`, 'Quick taps, short answers. Your answers are private and only used for matching.');
box(pn, `left:50px;top:340px;width:900px;height:650px;border-radius:24px;background:#fff;border:2px solid ${C.ink}`);
const qL = (top, txt) => box(pn, `left:84px;top:${top}px;font:700 13px ${F.sans};letter-spacing:2.5px;color:${C.green}`, txt);
const qT = (top, txt) => box(pn, `left:84px;top:${top}px;font:600 26px ${F.sans};color:${C.ink};white-space:nowrap`, txt);
qL(372, 'QUESTION 1'); qT(396, 'Who is completing this form?');
const choice = (l, txt) => { const b = box(pn, `left:${l}px;top:450px;width:404px;height:68px;border-radius:14px;background:#fff;border:2px solid #CFCDC0;text-align:center;font:500 24px/64px ${F.sans};color:${C.ink}`, txt); return b; };
const chS = choice(84, "I'm the student"), chP = choice(512, "I'm a parent");
qL(556, 'QUESTION 2'); qT(580, 'Grade level / year');
const sel3 = (top, ph) => { const b = box(pn, `left:84:px;left:84px;top:${top}px;width:832px;height:72px;border-radius:14px;background:#fff;border:2px solid #CFCDC0`); const tx = box(b, `left:22px;top:19px;font:400 25px ${F.sans};color:${C.ink};white-space:nowrap`, ph); box(b, 'right:22px;top:25px;width:20px;height:20px;').innerHTML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="${C.ink}" stroke-width="2" stroke-linecap="round"><path d="M4 7l6 6 6-6"/></svg>`; return { b, tx }; };
const gS3 = sel3(632, 'Select grade or year…');
qL(742, 'QUESTION 3'); qT(766, 'State of residence'); box(pn, `left:84px;top:808px;font:400 17px ${F.sans};color:${C.sec}`, 'Used to match state-specific scholarship programs.');
const sS3 = sel3(846, 'Select your state…');
box(pn, `left:50px;top:1030px;font:500 21px ${F.sans};color:${C.sec}`, '←   Back');
const cont = box(pn, `right:50px;top:1010px;width:200px;height:62px;border-radius:12px;background:${C.green};text-align:center;font:700 22px/62px ${F.sans};color:#fff`, 'Continue  →');
const P = (rx, ry) => [PN.l + rx, PN.t + ry];
const cur3 = makeCursor(w3, [[34.6, ...P(900, 300)], [35.9, ...P(300, 484)], [36.2, ...P(300, 484), 1], [37.5, ...P(520, 670)], [38.4, ...P(520, 668), 1], [39.4, ...P(560, 880)], [40.55, ...P(560, 882), 1], [41.8, ...P(850, 1040)], [42.8, ...P(850, 1042), 1], [43.8, ...P(900, 1000)]], C.green);
const camU3 = { s: kf([[34.2, 1.3], [35.2, 1.3], [35.9, 1.5], [41.2, 1.5], [42.2, 1.55], [43.2, 1.55], [44.3, 0.86]]),
  fy: kf([[34.2, 300], [35.2, 300], [36.0, 470], [37.0, 470], [37.9, 650], [38.9, 650], [39.7, 840], [41.0, 840], [41.9, 1010], [43.1, 1010], [44.3, 590]]) };
function updU3(t) {
  sceneStyle(U3, vis(t, 34.0, 44.9, 0.45), 6);
  w3.style.transform = camTf(camU3.s(t), 960, camU3.fy(t));
  const sel = t >= 36.2; chS.style.borderColor = sel ? C.green : '#CFCDC0'; chS.style.background = sel ? '#E8F2EC' : '#fff'; chS.style.color = sel ? C.green : C.ink; chS.style.fontWeight = sel ? 700 : 500;
  gS3.tx.textContent = t >= 38.45 ? '12th Grade (Senior)' : 'Select grade or year…'; gS3.tx.style.color = t >= 38.45 ? C.ink : '#8A8A94'; gS3.b.style.borderColor = t >= 38.45 && t < 40 ? C.green : '#CFCDC0';
  sS3.tx.textContent = t >= 40.6 ? 'Michigan' : 'Select your state…'; sS3.tx.style.color = t >= 40.6 ? C.ink : '#8A8A94'; sS3.b.style.borderColor = t >= 40.6 && t < 42 ? C.green : '#CFCDC0';
  cont.style.transform = (t > 42.78 && t < 43.05) ? 'scale(.96)' : 'none'; cont.style.filter = t > 42.85 && t < 43.4 ? 'brightness(1.15)' : 'none';
  cur3.update(t, 34.6, 44.2);
}

// =================== SCENE E: proof ===================
const PR = layer(); const globe = document.createElement('canvas'); globe.width = W; globe.height = H; globe.style.cssText = 'position:absolute;left:0;top:0;'; PR.appendChild(globe); const gx = globe.getContext('2d');
const gp = (() => { const r = rng(11), a = []; for (let i = 0; i < 520; i++) { const u = r() * 2 - 1, th = r() * Math.PI * 2, s = Math.sqrt(1 - u * u); a.push([s * Math.cos(th), u, s * Math.sin(th)]); } return a; })();
const prLine = box(PR, `left:0;top:440px;width:${W}px;text-align:center;font:500 50px/1.25 ${F.sans};color:${C.ink};white-space:nowrap;letter-spacing:-.3px`);
const hlSpan = (fs, k) => `<span class="hl${k}" style="display:inline-block;padding:0 14px;margin:0 4px;border-radius:10px;font:700 ${fs}px ${F.serif};background:linear-gradient(${C.gold}55,${C.gold}55) no-repeat 0 0/0% 100%"><span class="n${k}">0</span></span>`;
prLine.innerHTML = `Over ${hlSpan(88, 1)} verified scholarships<br>at ${hlSpan(88, 2)} colleges.`;
const pH1 = prLine.querySelector('.hl1'), pN1 = prLine.querySelector('.n1'), pH2 = prLine.querySelector('.hl2'), pN2 = prLine.querySelector('.n2');
function updPR(t) {
  sceneStyle(PR, vis(t, 44.3, 50.4, 0.5), 8);
  gx.clearRect(0, 0, W, H); const rot = t * 0.22; const cs = Math.cos(rot), sn = Math.sin(rot);
  gp.forEach(p => { const x = p[0] * cs + p[2] * sn, z = -p[0] * sn + p[2] * cs, y = p[1], f = 560 / (560 + z * 120); const X = W / 2 + x * 470 * f, Y = H / 2 + y * 470 * f; gx.globalAlpha = 0.18 + 0.62 * (z + 1) / 2; gx.fillStyle = C.gold; gx.beginPath(); gx.arc(X, Y, 3.6 * f, 0, 6.3); gx.fill(); });
  gx.globalAlpha = 1;
  const k1 = easeOut(seg(t, 45.0, 46.7)), k2 = easeOut(seg(t, 45.3, 46.9));
  pN1.textContent = Math.round(10000 * k1).toLocaleString('en-US'); pN2.textContent = Math.round(1400 * k2).toLocaleString('en-US') + (k2 > 0.995 ? '+' : '');
  pH1.style.backgroundSize = (easeOut(seg(t, 45.0, 46.2)) * 100).toFixed(1) + '% 100%'; pH2.style.backgroundSize = (easeOut(seg(t, 45.4, 46.6)) * 100).toFixed(1) + '% 100%';
  const kk = easeOut(seg(t, 44.6, 45.3)); prLine.style.opacity = kk.toFixed(3); prLine.style.transform = `translateY(${px((1 - kk) * 16)}) scale(${(1 + 0.012 * (t - 44.6)).toFixed(4)})`;
}

// =================== SCENE F: closer + end card ===================
const CL = layer(); const phr = [
  { a: 50.3, b: 52.0, pre: 'Search ', key: 'verified scholarships', post: '.' },
  { a: 51.9, b: 53.6, pre: 'Get ', key: 'matched', post: ' to awards you qualify for.' },
  { a: 53.5, b: 55.2, pre: 'Plan a ', key: 'debt-free degree', post: '.' }].map(p => { const d = box(CL, `left:0;top:470px;width:${W}px;text-align:center;font:500 62px ${F.sans};color:${C.ink};white-space:nowrap;letter-spacing:-.5px`); d.innerHTML = `${p.pre}<span class="k" style="padding:0 14px;margin:0 -10px;border-radius:12px;background:linear-gradient(${C.gold}66,${C.gold}66) no-repeat 0 0/0% 100%">${p.key}</span>${p.post}`; p.d = d; p.k = d.querySelector('.k'); return p; });
const tag = box(CL, `left:0;top:446px;width:${W}px;text-align:center;font:700 104px ${F.serif};color:${C.ink};white-space:nowrap;letter-spacing:-1.5px`); tag.innerHTML = `Find your <span class="k" style="padding:0 18px;margin:0 -12px;border-radius:14px;background:linear-gradient(${C.gold}77,${C.gold}77) no-repeat 0 0/0% 100%">scholarship</span>.`; const tagK = tag.querySelector('.k');
const endUrl = box(stage, `left:0;top:600px;width:${W}px;text-align:center;font:500 30px ${F.sans};color:${C.ink};letter-spacing:1px;opacity:0`, 'sustainable-scholars.org');

function seekAll(t) {
  // open
  const gOp = Math.max(vis(t, 1.9, 6.1, 0.9), clamp(easeOut((t - 49.8) / 0.7))); gradLayer.style.opacity = gOp.toFixed(3); gradLayer.style.display = gOp < 0.001 ? 'none' : 'block'; grad.style.transform = `translateX(${px(-t * 3)})`;
  const wo = easeOut(seg(t, 0.3, 1.3)) * (1 - easeIn(seg(t, 1.5, 2.2))); aWord.style.opacity = wo.toFixed(3); aWord.style.filter = t > 1.5 && t < 2.2 ? `blur(${(seg(t, 1.5, 2.2) * 8).toFixed(1)}px)` : 'none'; aWord.style.transform = `translateY(${px((1 - easeOut(seg(t, 0.3, 1.3))) * 10)})`; aWord.style.display = t > 2.3 ? 'none' : 'block';
  const nm = easeOut(seg(t, 2.3, 3.3)) * (1 - easeIn(seg(t, 5.2, 5.9))); aName.style.opacity = (t < 56.4 ? nm : easeOut(seg(t, 56.6, 57.5))).toFixed(3);
  aName.style.transform = t < 56.4 ? `scale(${(0.965 + 0.035 * easeOut(seg(t, 2.3, 3.6))).toFixed(4)})` : `translateY(${px(-40 * easeOut(seg(t, 56.6, 57.6)) - 0)}) scale(1.0)`; aName.style.top = t < 56.4 ? '478px' : '470px';
  T1.update(t); updU1(t); T2.update(t); updU2(t); T3.update(t); updU3(t); updPR(t);
  // closer
  phr.forEach(p => { const o = vis(t, p.a, p.b, 0.3); p.d.style.opacity = o.toFixed(3); p.d.style.display = o <= 0.001 ? 'none' : 'block'; p.d.style.transform = `translateY(${px((1 - easeOut(seg(t, p.a, p.a + 0.4))) * 26 - easeIn(seg(t, p.b - 0.3, p.b)) * 26)})`; p.d.style.filter = o < 0.98 ? `blur(${((1 - o) * 6).toFixed(1)}px)` : 'none'; p.k.style.backgroundSize = (easeOut(seg(t, p.a + 0.35, p.a + 0.85)) * 100).toFixed(1) + '% 100%'; });
  const tg = easeOut(seg(t, 55.3, 56.0)) * (1 - easeIn(seg(t, 56.2, 56.7))); tag.style.opacity = tg.toFixed(3); tag.style.display = tg <= 0.001 ? 'none' : 'block'; tag.style.transform = `translateY(${px((1 - easeOut(seg(t, 55.3, 56.0))) * 24)})`; tagK.style.backgroundSize = (easeOut(seg(t, 55.7, 56.2)) * 100).toFixed(1) + '% 100%';
  endUrl.style.opacity = easeOut(seg(t, 57.2, 58.0)).toFixed(3); endUrl.style.transform = `translateY(${px((1 - easeOut(seg(t, 57.2, 58.0))) * 12)})`;
}

// =================== SOUND ===================
async function buildAudio(ctx) {
  const out = A.master(ctx, 0.9); const bpm = 104, beat = 60 / bpm, bar = beat * 4;
  const chords = [[60, 64, 67, 71], [57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67]], roots = [36, 33, 29, 31];
  for (let b = 0; b * bar < 56.7; b++) { const t = b * bar, ch = chords[b % 4], lift = t > 49.8 ? 1.6 : 1; A.pad(ctx, out, t, ch.map(A.note), bar * 1.08, 0.03 * lift); if (t > 5.4 && t < 56.5) A.bass(ctx, out, t, A.note(roots[b % 4] + 12), bar * 0.9, 0.2 * lift); }
  for (let t = 5.5, i = 0; t < 56.5; t += beat / 2, i++) { const ch = chords[Math.floor(t / bar) % 4], idx = [0, 1, 2, 3, 2, 1, 3, 2][i % 8]; A.pluck(ctx, out, t, A.note(ch[idx] + 12), 0.45, t > 49.8 ? 0.085 : 0.06); }
  for (let t = 5.8; t < 56.4; t += beat) { const lift = t > 49.8 ? 1.5 : 1; if (t < 9.3) { A.kick(ctx, out, t, 0.18); continue; } A.kick(ctx, out, t, 0.32 * lift); A.hat(ctx, out, t + beat / 2, 0.045 * lift); }
  for (let t = 9.4 + beat; t < 56.4; t += beat * 2) A.clap(ctx, out, t, 0.12 * (t > 49.8 ? 1.6 : 1));
  // intro + transitions
  A.riser(ctx, out, 1.0, 1.4, 0.07); A.chime(ctx, out, 2.4, A.note(72), 0.07);
  [5.5, 9.2, 19.0, 22.2, 31.0, 34.0, 44.2, 49.8].forEach(t => A.whoosh(ctx, out, t, 0.55, true, 0.1));
  A.riser(ctx, out, 48.0, 1.8, 0.09);
  // typing, clicks, verifies, counters
  for (let i = 0; i < SQ.length; i++) if (SQ[i] !== ' ') A.click(ctx, out, 10.2 + i / 25, 0.06, 2600 + (i % 5) * 220);
  [12.85, 13.8, 16.3, 27.1, 36.2, 38.4, 40.55, 42.8].forEach(t => { A.click(ctx, out, t, 0.16, 1700); A.tone(ctx, out, t, 880, 0.07, { g: 0.05, type: 'triangle' }); });
  LST.forEach(L => A.tone(ctx, out, L.at + 1.05, 1320, 0.14, { g: 0.06, type: 'triangle' }));
  [14.5, 15.7].forEach(() => 0); for (let t = 14.5, i = 0; t < 15.7; t += 0.07, i++) A.tick(ctx, out, t, 700 + i * 28, 0.04);
  for (let t = 45.0, i = 0; t < 46.8; t += 0.07, i++) A.tick(ctx, out, t, 600 + i * 22, 0.04);
  A.chime(ctx, out, 56.7, A.note(76), 0.09); A.chime(ctx, out, 56.95, A.note(79), 0.07); A.pad(ctx, out, 56.6, [60, 64, 67, 72].map(A.note), 3.6, 0.04);
}
boot({ w: W, h: H, duration: DUR, seek: seekAll, buildAudio, bg: C.canvas });
