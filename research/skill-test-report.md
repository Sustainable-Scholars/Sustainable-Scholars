# Skill test report

Run 2026-10-25 on a Linux cloud container (4 CPUs, 16 GB RAM, no GPU, ffmpeg 6.1, Node 22, Python 3.12/3.13). Nothing was tested on macOS or with a GPU. Test media was generated: a synthetic video, plus a 13-second real speech sample (public domain "I have a dream" clip) with a 2-second pause inserted.

## Summary

- **72 skills** checked structurally: frontmatter, name matches folder, linked files exist, all 215 scripts pass syntax checks. Every skill also passes the same strict validator claude.ai uses once packaged with `tools/package_skills.py`.
- **134 script entry points** answered `--help` correctly. The failures were scripts that need real arguments or optional dependencies, not defects.
- **About 25 skills were run end to end** on real media or real tools (below).
- **Six bugs fixed** in the vault copies. **Seven upstream problems** worth knowing about (below).

## Results

**Passed on real media or real tools**

| Skill | What was run | Result |
|---|---|---|
| video-editing-skill | trim, jumpcut, overlay-text, 3 caption styles, whisper transcribe, chained edit | pass (caveat: keyframe cuts, below) |
| video-trim | copy, re-encode, audio-removal trims, thumbnail | pass |
| cut-video | whisper, Montreal Forced Aligner, cut list, trim+concat render | pass: 16.4 s to 10.9 s, no silences left, audio/video within 10 ms |
| clipify | whisper words, opus-style captions burned in, speaker pan, audio alignment, beat detection | pass: pan kept the active speaker in frame; alignment exact to 0.01 s |
| color-grade | frame analysis, LUT fitting (frame, clip, match), preset LUTs, applied with ffmpeg | pass: warm cast B/R 0.55 corrected to 1.00 |
| sound-effects | full sound pass on synthetic video and music | pass: -16.2 LUFS, true peak -5.1 dBFS |
| motion-broll | setup, build, stills, clip render, composite, review pages | pass |
| claude-shorts | preflight, transcribe, content detection, snap, reframe, Remotion caption render, export, validate | pass after dependency fixes (below) |
| hyperframes, hyperframes-cli, hyperframes-registry | init, lint, check, add block, render 1080p MP4, audio, beats (15 beats at 120 BPM, correct), snapshot | pass |
| video-shotcraft | 23 unit tests, template install, 1080p still render | pass |
| remotion-* and remotion-motion-graphics | toolchain: minimal project rendered 60 frames to MP4 | pass (needs a local Chrome here) |
| object-separation | SAM 2 on 8 frames of a moving disc, scored against ground truth | pass: mean IoU 0.994, 2.4 s/frame on CPU |
| video-perception | MCP server started, 6 tools listed, `video_info` returned correct metadata | pass |
| omnicaptions-convert | SRT to VTT, ASS, TTML, JSON, karaoke ASS; round trip identical | pass with a version pin (below) |
| claude-code-video-toolkit (workspace) | `uv sync`, 31 of 32 tools start, template renders a 1080p still | pass (the 32nd needs an optional Google package) |
| caption-engine | loaded through the Skill tool, instructions intact | loads; not scored on output |

**Partly tested**

| Skill | Tested | Not tested |
|---|---|---|
| watch | frame extraction, native captions | local WhisperX install failed on Linux; transcripts need a GROQ, OPENAI or GEMINI key. YouTube video download returned 403 from this server. |
| omnicaptions-download / -transcribe / -translate / -laicut | CLI installs and runs | need Gemini or LattifAI keys, or video downloads (blocked here) |
| higgsfield-* (8) | CLI installs, checksum verified, runs | every command needs a Higgsfield login and workspace |
| media-use | 42 of 45 scripts respond; `hyperframes audio` and `beats` pass | the voiceover, music and avatar paths need keys or whisper-cpp |
| video-editing (vertical), explainer-* (3), figma, slideshow, remotion-to-hyperframes | toolchains verified (HyperFrames and Remotion render) | the creative workflows themselves were not run |

**Prompt-only skills** (kling-ai, audio-editing, shorts, video, superpowers x15, skill-creator, humanizer, content-principles, video-editing agent): structure and links validated; behavior not tested. Their value depends on how Claude follows them, which a script can't measure.

## Fixed in the vault

1. `video`, `video-editing-skill`: description quoted (bare colon was invalid YAML).
2. `color-grade`: `argument-hint` quoted (invalid YAML).
3. `video-editing`, `higgsfield-soul-id`: angle brackets removed from descriptions; `video-editing` description shortened below 1,024 characters.
4. `omnicaptions-LaiCut` renamed `omnicaptions-laicut` (uploads require lowercase names).
5. `claude-shorts`: `requirements.txt` pinned (`av<17`, `mediapipe<0.10.22`, `numpy<2`); `validate.sh` fixed for ffmpeg 6.x.
6. `object-separation`: install line now includes `torchvision`.

For uploads, `tools/package_skills.py` builds clean zips: it strips frontmatter keys claude.ai rejects (`argument-hint`, `version`, `when_to_use`) from the zip copy only.

## Upstream problems still open

- **clipify**: commands use `-hwaccel videotoolbox` (macOS only); it fails on Linux when decoding video.
- **cut-video**: installs conda through Homebrew, so it is macOS-only as written.
- **omnicaptions**: breaks with current `lattifai-captions` (0.4.x); needs `lattifai-captions==0.2.9`.
- **video-editing-skill**: `trim.sh` and `jumpcut.sh` use `-c copy`, which cuts at keyframes; footage with very long keyframe gaps can lose its video track.
- **color-grade**: a relative `--emit` path is written next to the script, not the current folder.
- **watch**: the local WhisperX installer is only verified on Apple Silicon.
- **Remotion** downloads its own Chrome from `remotion.media`, which was unreachable here; point it at an installed Chrome.
