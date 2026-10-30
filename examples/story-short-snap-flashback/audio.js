/* ============ SFX only (no music). The voice track is mixed in afterwards. ============ */
async function buildAudio(ctx) {
  const out = A.master(ctx, 0.9), S = SNAP;
  const snap = (t, g = 1) => { A.click(ctx, out, t, 0.5 * g, 4800); A.burst(ctx, out, t, 0.06, { f: 6500, q: 1.2, g: 0.38 * g, seed: 9 }); A.tone(ctx, out, t, 220, 0.14, { g: 0.22 * g, f2: 70 }); };
  const rewind = (t, g = 1) => { for (let i = 0; i < 14; i++) A.tone(ctx, out, t + i * 0.035, 1500 - i * 85, 0.05, { type: 'square', g: 0.05 * g, lp: 3000 }); A.whoosh(ctx, out, t, 0.6, false, 0.16 * g); };
  // 1. hook
  [1.6, 1.78, 1.96, 2.14].forEach((t, i) => A.tone(ctx, out, t, 520 + i * 90, 0.12, { g: 0.1, f2: 880 + i * 90 }));
  [2.6, 2.82, 3.04, 3.3].forEach((t, i) => A.tone(ctx, out, t, 300 + i * 40, 0.3, { type: 'triangle', g: 0.13, f2: 600 + i * 60 }));
  const one = wd('one', 0)[0], sh = wd('shift', 0)[0];
  [one, sh].forEach((t, i) => { A.boom(ctx, out, t, 0.32 + i * 0.1); A.click(ctx, out, t, 0.2, 1500); });
  A.whoosh(ctx, out, one - 0.3, 0.3, true, 0.12);
  // snap moment
  A.riser(ctx, out, S - 0.8, 0.8, 0.12); A.tone(ctx, out, S - 0.8, 90, 0.8, { g: 0.09, f2: 140 });
  snap(S); A.boom(ctx, out, S + 0.02, 0.5); A.whoosh(ctx, out, S + 0.02, 0.6, true, 0.2); rewind(S + 0.08, 1);
  for (let t = S + 0.5; t < 18.3; t += 1 / 12) A.click(ctx, out, t, 0.012, 1100 + ((t * 100) % 7) * 40);
  // 4 crowd
  for (let r = 0; r < 7; r++) for (let c = 0; c < 6; c++) if ((r + c) % 2 === 0) A.tone(ctx, out, 7.35 + (r + c) * 0.045, 500 + (r + c) * 22, 0.07, { g: 0.04, type: 'triangle' });
  // 5 search typing
  const s0 = wd('scholarships', 1)[0], s1 = wd('seniors', 0)[1], q = 'scholarships for high school seniors';
  for (let i = 0; i < q.length; i++) if (q[i] !== ' ') A.click(ctx, out, s0 - 0.05 + (i / q.length) * (s1 - s0 + 0.1), 0.07, 2400 + (i % 5) * 200);
  for (let i = 0; i < 5; i++) A.tone(ctx, out, s1 - 0.5 + i * 0.12, 700 + i * 60, 0.08, { g: 0.05, type: 'triangle' });
  // 6 forms
  [13.3, 13.85, 14.4, 14.95].forEach(t => { A.tone(ctx, out, t + 0.12, 95, 0.2, { g: 0.3, f2: 50 }); A.burst(ctx, out, t + 0.1, 0.08, { f: 900, q: 1, g: 0.22 }); A.whoosh(ctx, out, t - 0.15, 0.25, false, 0.07); A.burst(ctx, out, t + 0.2, 0.08, { type: 'lowpass', f: 600, g: 0.25, seed: 4 }); });
  // jump (weeks later)
  A.tone(ctx, out, 15.28, 140, 0.4, { g: 0.2, f2: 60 }); A.whoosh(ctx, out, 15.2, 0.5, true, 0.2); snap(15.28, 0.5);
  for (let t = 15.5; t < 18.1; t += 0.5) { A.click(ctx, out, t, 0.18, 900); A.tone(ctx, out, t, 180, 0.08, { g: 0.1, type: 'square', lp: 900 }); }
  for (let t = 15.35; t < 18.3; t += 0.25) A.tick(ctx, out, t, (Math.floor(t * 4) % 2) ? 700 : 560, 0.03);
  A.tone(ctx, out, 16.7, 140, 0.35, { g: 0.22, type: 'sawtooth', f2: 90, lp: 700 }); A.tone(ctx, out, 16.7, 100, 0.35, { g: 0.12, type: 'square', f2: 70, lp: 500 });
  // return: the real shift
  A.riser(ctx, out, 17.9, 0.5, 0.1); A.whoosh(ctx, out, 18.3, 0.5, false, 0.22); A.boom(ctx, out, 18.42, 0.75); snap(18.42, 0.7); A.chime(ctx, out, 18.5, A.note(84), 0.1); A.chime(ctx, out, 18.65, A.note(88), 0.08);
  const rl = wd('real', 0)[0]; [rl - 0.35, rl].forEach(t => { A.boom(ctx, out, t, 0.25); A.whoosh(ctx, out, t - 0.12, 0.2, true, 0.1); });
  A.boom(ctx, out, wd('shift', 1)[0], 0.5);
  // 9 random
  for (let i = 0; i < 16; i++) A.whoosh(ctx, out, 20.0 + i * 0.14, 0.25, i % 2 === 0, 0.04);
  const rd = wd('randomly', 0)[0]; A.boom(ctx, out, rd, 0.45); A.burst(ctx, out, rd + 0.45, 0.2, { f: 2500, f2: 600, q: 1, g: 0.2 }); A.burst(ctx, out, rd + 0.62, 0.2, { f: 2500, f2: 600, q: 1, g: 0.2 });
  // 10 profile
  A.whoosh(ctx, out, 22.35, 0.4, true, 0.12); [22.7, 22.85, 23.0, 23.15].forEach((t, i) => A.tone(ctx, out, t, 700 + i * 100, 0.1, { g: 0.07, type: 'triangle' }));
  const sc = wd('schools', 0)[0], rec = wd('recruiting', 0)[0], pr = wd('profile', 0)[1]; [0, 1, 2].forEach(i => { A.whoosh(ctx, out, sc + 0.1 + i * 0.18, 0.3, true, 0.07); A.chime(ctx, out, rec + i * 0.2, A.note(79 + i * 3), 0.05); A.chime(ctx, out, pr - 0.6 + i * 0.12, A.note(84 + i * 2), 0.07); }); A.boom(ctx, out, pr - 0.55, 0.3);
  // 11 bars
  const same = wd('same', 0)[0], cd = wd('completely', 0)[0]; A.tone(ctx, out, same - 0.1, 200, 0.6, { g: 0.12, f2: 400 }); A.tone(ctx, out, same + 0.5, 400, 0.12, { g: 0.1 }); A.tone(ctx, out, cd, 150, 0.9, { type: 'sawtooth', g: 0.1, f2: 900, lp: 2500 }); A.whoosh(ctx, out, cd, 0.9, true, 0.2); A.chime(ctx, out, cd + 0.9, A.note(88), 0.12);
  // 12 target
  const aim = wd('aiming', 0)[0]; for (let i = 0; i < 5; i++) A.tone(ctx, out, aim - 0.3 + i * 0.08, 600 + i * 120, 0.08, { g: 0.06, type: 'triangle' }); for (let t = aim + 0.1; t < 35.0; t += 0.18) A.tick(ctx, out, t, 1400, 0.03);
  A.whoosh(ctx, out, 35.0, 0.4, true, 0.2); A.boom(ctx, out, 35.38, 0.6); A.burst(ctx, out, 35.38, 0.1, { f: 1800, q: 1, g: 0.3 }); A.chime(ctx, out, 35.45, A.note(86), 0.12);
  // 12b dark
  A.tone(ctx, out, 36.1, 80, 1.9, { g: 0.2, f2: 50, type: 'sawtooth', lp: 300 }); snap(36.1, 0.8); A.boom(ctx, out, 36.1, 0.45); rewind(36.18, 0.8);
  for (let i = 0; i < 7; i++) { A.whoosh(ctx, out, 36.35 + i * 0.22, 0.3, i % 2 === 0, 0.08); A.burst(ctx, out, 36.55 + i * 0.22, 0.05, { type: 'lowpass', f: 500, g: 0.16, seed: i }); }
  A.whoosh(ctx, out, 37.9, 0.4, false, 0.2); A.boom(ctx, out, 38.1, 0.6); snap(38.1, 0.6); A.chime(ctx, out, 38.2, A.note(84), 0.1);
  // 13 circle
  A.tone(ctx, out, 38.5, 220, 3.1, { g: 0.1, f2: 880, lp: 2500 }); [wd('foundation', 0)[0], wd('success', 0)[0] - 0.05, wd('circle', 0)[0] - 0.05].forEach((t, i) => { A.boom(ctx, out, t, 0.25); A.chime(ctx, out, t + 0.02, A.note(79 + i * 3), 0.08); }); A.whoosh(ctx, out, wd('sustainable', 0)[0] - 0.1, 0.4, true, 0.1);
  // 14 cta
  A.whoosh(ctx, out, 43.3, 0.4, true, 0.15); A.boom(ctx, out, wd('apply', 0)[0], 0.4); A.tone(ctx, out, wd('october', 0)[0], 400, 0.15, { g: 0.12 }); for (let i = 0; i < 6; i++) A.burst(ctx, out, wd('october', 0)[0] + 0.35 + i * 0.1, 0.1, { f: 2200 - i * 150, q: 1, g: 0.09 });
  const df = wd('debt', 0)[0]; A.whoosh(ctx, out, df - 0.3, 0.4, true, 0.15); A.boom(ctx, out, df + 0.05, 0.55); A.chime(ctx, out, df + 0.1, A.note(84), 0.1); A.chime(ctx, out, wd('degree', 0)[0], A.note(91), 0.1); A.chime(ctx, out, 46.55, A.note(96), 0.07);
}
boot({ w: W, h: H, duration: DUR, seek: seekAll, buildAudio, bg: '#000' });
