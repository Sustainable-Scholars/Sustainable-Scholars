Imported from https://github.com/AgriciDaniel/claude-shorts
Commit a369fad9d84287edbb8fa3ab515f268e770f683b (2026-04-10)
License: MIT
Copied unchanged unless noted below. To update, re-copy from upstream.
Changed: frontmatter name 'shorts' -> 'claude-shorts' (avoids clash with the norstack 'shorts' skill). Dropped install.sh/uninstall scripts and repo docs. Run setup.sh once on a machine to build its Python/Node environment.
Changed (tested 2026-10-25):
- requirements.txt: added av>=11,<17 (PyAV 19 breaks faster-whisper), mediapipe<0.10.22 (1.x removed the mp.solutions API used by detect_content.py), numpy<2 (required by that mediapipe).
- scripts/validate.sh: stream-level ffprobe calls now use -of default=noprint_wrappers=1:nokey=1 (ffmpeg 6.x csv output has a trailing comma, so every file failed the resolution/codec check).
