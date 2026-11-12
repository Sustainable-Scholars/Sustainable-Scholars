---
name: phone-video-editor
description: Edit videos for a user who only has a phone and works entirely inside the chat app. Asks 3 questions first, edits in Claude's own workspace with ffmpeg and Whisper, never changes the original, removes retakes and pauses over 0.5s, applies the saved brand style, exports 9:16 at top quality and returns a new file. Use when the user sends a video to edit, asks for captions, a Reel, TikTok or Short, or says they only have a phone.
---

# Phone Video Editor

The user is the director. Everything happens in this chat. Never ask them to do anything technical.

## Rules (from Janae)

1. **Before every edit, ask exactly 3 questions:**
   - Where is this video going: Instagram, TikTok or YouTube?
   - What should the viewer do at the end?
   - Captions and graphics, or a clean cut?
   (If the user already answered some of these, only ask the rest.)
2. **Use your own workspace.** Run `scripts/setup.sh`. It checks ffmpeg, caption burn-in, Whisper and fonts, and installs what is missing. Do not make the user install anything.
3. **Never change the original.** Always write a new file with a new name (for example `name_edit_v1.mp4`). `scripts/caption_clip.py` refuses to overwrite its input.
4. **Retakes and pauses.** Transcribe with Whisper (`scripts/caption_clip.py` does this when no words file is given). If Whisper cannot run, ask the user to paste the auto captions from Instagram, TikTok or CapCut and use those instead. Keep only the best take of each sentence and cut every pause longer than 0.5 seconds.
5. **Brand style.** Colors and font live in `brand.json`. Ask for 2 brand colors and a font only once, save them there, and never ask again. Current saved style: navy `#13203E`, gold `#C7A44D`, Playfair Display (from sustainable-scholars.org). If `confirmed_by_user` is false, mention it once and ask them to confirm or change it, then set it to true.
6. **Export** vertical 9:16 (1080x1920) for Reels and TikTok, at the highest quality the source allows (`crf 14`, slow preset, 256k audio).
7. **File too big to upload?** Explain simply: in the phone's photo/video editor, trim the clip or split it into shorter parts first. Short clips work best.
8. **Be honest.** If the video is too dark or the audio too rough, say so and say whether reshooting would look better. Check frames and listen to levels before promising anything.
9. **Finish** by sending the video back so they can download it, and remind them to watch it once before posting.

## Workflow
1. Ask the 3 questions. 2. `scripts/setup.sh`. 3. Look at frames and check audio. 4. Transcribe, drop retakes and long pauses (see the `cut-video` skill for aligned cuts). 5. Captions: `python3 scripts/caption_clip.py IN OUT [--start S --dur D --words words.json --pos 0.62]` (white words, active word in the accent color, navy outline, placed at 62% of the height so app UI stays clear). 6. Graphics only if they chose them (see `reel-framework`, `hyperframes`, `remotion-*`). 7. Export and send.

## Notes
- Captions sit at 62% of the screen height by default. Lower `--pos` value moves them up.
- Pair with `reel-framework` for story structure and `content-principles` for hooks.
