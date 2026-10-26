# Sustainable Scholars explainer videos

Three videos made with the `explainer-default`, `explainer-engaging` and `explainer-high-energy` skills from the real site (sustainable-scholars.org). All wording and numbers (10,000+ verified scholarships, 1,400+ colleges, "free", the 48-hour list, the three tab names) come from the site as read on 2026-10-26. Brand: navy, gold `#C7A44D`, Playfair Display and Inter. The name is set as text; no logo file is used.

| Video | Length | File |
|---|---|---|
| Clean product demo | 60 s | `clean-demo.html` |
| One-take explainer (seamless loop) | 16 s | `one-take.html` |
| High-energy promo, 128 BPM | 16.9 s | `high-energy.html` |

Each HTML file is self-contained (fonts embedded). Open it in a browser to scrub and play it with sound.

## Re-render

```
npm i playwright            # plus: npx playwright install chromium
python3 build.py default    # builds out/default.html from src/ (also: engaging, energy)
node render.mjs out/default.html out/demo.mp4 60 4 4     # fps, motion-blur subframes, workers
node render.mjs out/default.html sheet.png --stills 1,5,9   # contact sheet to check frames
```

Build needs `src/fonts.css` (base64 woff2 of Playfair Display, Inter, Inter Tight, Instrument Serif, JetBrains Mono from the `@fontsource/*` npm packages).

## Notes
- Example listings in the demo (UNCF, A Leap Ahead Foundation, Broadcast Education Association) are real entries from the site's Live Scholarships page; no third-party logos are used.
- To change the text or timings, edit the beat sheet at the top of each `src/*.js` file.
