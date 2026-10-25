Imported from https://github.com/louisedesadeleer/clipify
Commit 5f6b75e6c0bfdce3cc9c78b850a67e23d65d9783 (2026-08-24)
License: MIT
Copied unchanged. To update, re-copy from upstream.
Tested 2026-10-25 (whisper, build_ass, speaker pan, audio_align all pass). Note: the ffmpeg commands use -hwaccel videotoolbox (macOS only); on Linux/Windows it fails when decoding video, so remove that flag there.
