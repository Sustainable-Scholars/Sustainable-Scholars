Imported from https://github.com/6missedcalls/video-editing-skill
Commit 7dc6e1da66f43eff44c3692d4b84e06aef6590b6 (2026-02-27)
License: MIT
Copied unchanged. To update, re-copy from upstream.
Note: upstream SKILL.md had no frontmatter; name/description frontmatter added here. Body unchanged.
Changed: frontmatter description wrapped in quotes (contained ': ').
Tested 2026-10-25 (trim, jumpcut, caption styles, overlay, transcribe, chained edit all pass). Caveat: trim.sh and jumpcut.sh use ffmpeg -c copy, which cuts only at keyframes; on footage with very long keyframe gaps (some screen recordings) the output can lose its video track. Re-encode first if that happens.
