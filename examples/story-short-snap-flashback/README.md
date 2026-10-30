# Story short: snap-to-flashback edit

Vertical 1080x1920 short built from a raw talking-head take (not included, too large).
- Pipeline: whisper + Montreal Forced Aligner word timing -> ffmpeg tighten (edit_map.json) -> JPEG frame sequence -> HTML page (pure function of time) -> Playwright render + WebAudio SFX -> ffmpeg mix (-14 LUFS).
- Signature effect: finger snap triggers a "snap burn" (flash, zoom punch, RGB split, tear slices) into a sepia film flashback; "NOW" snaps back.
- Rebuild: `python3 build.py` then `node render2.mjs short.html out/short.mp4 30 3 4` (needs frames/ folder of the footage).
