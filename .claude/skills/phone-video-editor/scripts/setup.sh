#!/usr/bin/env bash
# Checks the editing tools and installs anything missing. Safe to run every time.
set -u
ok(){ echo "OK   $1"; }; miss(){ echo "MISS $1 -> installing"; }
if command -v ffmpeg >/dev/null && command -v ffprobe >/dev/null; then ok ffmpeg; else miss ffmpeg; (apt-get install -y -q ffmpeg >/dev/null 2>&1 || pip install -q imageio-ffmpeg >/dev/null 2>&1); fi
if ffmpeg -hide_banner -filters 2>/dev/null | grep -q " ass "; then ok "caption burn-in (libass)"; else echo "WARN ffmpeg has no libass; captions need another ffmpeg build"; fi
if python3 -c "import faster_whisper" 2>/dev/null || command -v whisper >/dev/null; then ok whisper; else miss whisper; pip install -q faster-whisper >/dev/null 2>&1 && ok whisper || echo "WARN whisper unavailable -> ask user to paste auto captions (Instagram/TikTok/CapCut)"; fi
python3 -c "import fontTools" 2>/dev/null && ok fonttools || pip install -q fonttools >/dev/null 2>&1
