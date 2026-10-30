async function buildAudio(ctx) {
  const out = A.master(ctx, 0.9);
  const hit = (t, g = 1) => { A.boom(ctx, out, t, 0.34 * g); A.click(ctx, out, t, 0.2 * g, 1800); };
  const woosh = (t, up = true, g = 0.16) => A.whoosh(ctx, out, t, 0.4, up, g);
  const pingf = (t, f = 900, g = 0.1) => A.tone(ctx, out, t, f, 0.12, { type: 'triangle', g, f2: f * 1.5 });
  FL.forEach(f => { A.burst(ctx, out, f - 0.02, 0.18, { type: 'highpass', f: 2500, g: 0.2, seed: 4 }); woosh(f - 0.25, true, 0.14); A.boom(ctx, out, f, 0.22); });
  ZP.forEach(z => { A.click(ctx, out, z, 0.22, 1400); A.tone(ctx, out, z, 180, 0.1, { g: 0.12, f2: 60 }); });
  // stickers / slams
  [T('work'), T('not'), T('smarter', 1), T('isn\'t'), T('absolutely')].forEach((t, i) => { woosh(t - 0.15, true, 0.1); hit(t, 0.6); });
  A.tone(ctx, out, T('not') + 0.25, 400, 0.25, { type: 'sawtooth', g: 0.06, f2: 150, lp: 1800 }); A.tone(ctx, out, T('less') - 0.05, 400, 0.25, { type: 'sawtooth', g: 0.06, f2: 150, lp: 1800 });
  // colleges letters + erase
  for (let i = 0; i < 8; i++) A.click(ctx, out, T('colleges') + i * 0.05, 0.12, 2000 + i * 120);
  A.burst(ctx, out, T('erase') - 0.05, T('debt') - T('erase') + 0.3, { f: 1800, f2: 900, q: 1, g: 0.14, seed: 8 }); A.chime(ctx, out, T('debt') + 0.2, 880, 0.12); hit(T('debt') + 0.2, 0.7);
  // dishes stacking
  { const a = T('hunting') - 0.1, dishes = T('dishes'), span = dishes - a - 0.2; for (let i = 0; i < 16; i++) { const t = a + 0.25 + i * (span / 16) + 0.22; A.tone(ctx, out, t, 1800 + (i % 4) * 160, 0.12, { g: 0.1, f2: 1400 }); A.click(ctx, out, t, 0.14, 2600); } for (let t = a + 0.6; t < T('dishwasher') - 0.1; t += 0.14) A.burst(ctx, out, t, 0.08, { f: 3000, q: 0.8, g: 0.04, seed: 12 + (t * 10 | 0) % 5 }); }
  woosh(T('dishwasher') - 0.1, true, 0.12); A.tone(ctx, out, T('dishwasher'), 300, 0.4, { type: 'sawtooth', g: 0.05, f2: 120, lp: 900 }); for (let i = 0; i < 9; i++) pingf(T('dishwasher') + 0.2 + i * 0.05, 1200 + i * 90, 0.06); hit(T('there') - 0.2, 0.9); A.chime(ctx, out, T('there') - 0.2, 660, 0.08);
  // five times / battery
  hit(T('five'), 1.1); for (let t = T('five'); t < T('exhausted') - 0.2; t += 0.12) A.tick(ctx, out, t, 1100, 0.05);
  for (let i = 0; i < 6; i++) A.tone(ctx, out, T('exhausted') + i * 0.18, 520 - i * 70, 0.2, { type: 'triangle', g: 0.1, f2: 380 - i * 60 });
  [T('exhausted') + 0.1, T('third') - 0.35, T('third')].forEach(t => pingf(t, 700, 0.1));
  // machine
  for (let t = T('machine', 0) - 0.4; t < T('faster'); t += 0.11) A.tick(ctx, out, t, 220 + ((t * 10 | 0) % 3) * 40, 0.05);
  A.riser(ctx, out, T('faster') - 0.7, 0.7, 0.12); hit(T('faster') - 0.05, 1);
  // site + circle
  woosh(T('here') - 0.1, true, 0.14); hit(T('here') + 0.15, 0.6); A.chime(ctx, out, T('success'), 523, 0.09);
  A.riser(ctx, out, T('success'), T('machine', 1) - T('success'), 0.1); hit(T('machine', 1) - 0.1, 0.8); A.chime(ctx, out, T('machine', 1) - 0.1, 784, 0.1);
  // hours -> click
  for (let i = 0; i < 5; i++) A.tick(ctx, out, T('hours') + i * 0.11, 1300, 0.08);
  A.whoosh(ctx, out, T('into') - 0.05, 0.4, false, 0.16); hit(T('into') + 0.05, 0.6);
  A.click(ctx, out, T('click'), 0.6, 2400); A.tone(ctx, out, T('click'), 160, 0.12, { g: 0.2, f2: 70 }); A.chime(ctx, out, T('click') + 0.05, 1046, 0.1);
  for (let i = 0; i < 6; i++) A.burst(ctx, out, T('streamlines') + i * 0.05, 0.1, { f: 2500 + i * 300, q: 1, g: 0.08, seed: 6 });
  A.chime(ctx, out, T('hard') + 0.1, 1318, 0.1); hit(T('hard') + 0.1, 0.5);
  // end
  woosh(T('sustainablescholars') - 0.4, true, 0.14); hit(T('sustainablescholars'), 0.8); hit(T('org'), 0.8); A.chime(ctx, out, T('org') + 0.05, 1568, 0.09); A.chime(ctx, out, T('org') + 0.05, 1046, 0.08);
}
boot({ w: W, h: H, duration: DUR, seek: seekAll, buildAudio, bg: '#000' });
