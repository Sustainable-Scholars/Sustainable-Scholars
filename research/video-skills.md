# Video skills: research and install plan

Researched 2026-10-25 from the list at aashishpahwa.com/bio/top-skills-to-create-edit-videos.

**What was checked:** all 30 entries. For each one I traced it to its source, cloned the repo, and read the README, `SKILL.md` frontmatter, install scripts and dependency files. I also grep-scanned all scripts for risky patterns (pipe-to-shell, eval, hidden instructions, odd outbound hosts). Directory pages (mcpmarket, skillselion, claudecowork.im, tella.com) were traced back to the real repo behind them.

**What was not done:** none of the tools were run. I did not read every line of every script in the large repos (HyperFrames has about 9,000 files). No malware or prompt-injection was found, but treat this as a pattern scan, not an audit.

## How things get installed

| Method | What it does | Fits our vault? |
|---|---|---|
| **Vendor** | Copy the skill folder into `.claude/skills/<name>/`, add `SOURCE.md`, update `SKILLS.md`, push | Yes. This is how Humanizer and Content Principles were added. |
| `npx skills add <repo>` | Installs onto the machine running it, not into the vault | Only as a way to fetch files, then vendor them |
| `/plugin marketplace add` | Claude Code plugin install, per machine | Same: per machine, not versioned in the vault |
| Zip upload | Settings > Skills in claude.ai, for Cowork and chat | Works for any skill; skills that call ffmpeg, whisper or Node only work where those tools exist (not verified for Cowork) |

Skills that need local tools (ffmpeg, whisper, Node) only run on a machine that has them. Prompt-only skills run anywhere.

## Already covered

- **#18 Watch Video** is already in your account as `anthropic-skills:watch` (same description and same author repo).
- **#30 Skill Creator** is already in your account as `anthropic-skills:skill-creator`.
- **#25 Higgsfield**: the Higgsfield connector is already attached to this session. The skills add prompt recipes on top.
- **HyperFrames by HeyGen** (#6) also has a connector attached. It only works from the Claude app, not from Claude Code.

## All 30

Verdicts: **Install** = vendor it. **Key** = good, but needs a paid account or API key. **Optional** = situational. **Skip** = don't.

| # | Skill | Source | License | Last update | Needs | Install | Verdict |
|---|---|---|---|---|---|---|---|
| 1 | video-use | browser-use/video-use | MIT | 2026-10-08 | ffmpeg, Python (uv), **ElevenLabs API key** (transcription) | clone; keep `SKILL.md` and `helpers/` together | **Key** |
| 2 | Video Editing Skill | 6missedcalls/video-editing-skill | MIT | 2026-02-27 | ffmpeg, openai-whisper (pure Bash, no API) | copy folder | **Install** |
| 3 | Cut Video (Tella) | louisedesadeleer/cut-video | MIT | 2026-07-09 | ffmpeg, whisper, Montreal Forced Aligner (auto-created conda env on first run) | `git clone` to `~/.claude/skills/cut-video` | **Install** |
| 4 | Video Trimmer | infquest/vibe-ops-plugin, `skills/video-trim` | none | 2026-01-19 | ffmpeg | n/a | **Skip** (duplicates #2 and #3, no license) |
| 5 | Video Editor | jeremylongshore/claude-code-plugins-plus-skills, `video-editor.md` | MIT | 2026-10-25 | generic prompt; the listing itself says "low confidence" | it is a subagent file, not a skill | **Skip** |
| 6 | HyperFrames | heygen-com/hyperframes | Apache-2.0 | 2026-10-25 | Node, ffmpeg | `npx skills add heygen-com/hyperframes --skill <name>`. Real skills are in `skills/`: hyperframes, hyperframes-cli, hyperframes-registry, media-use, remotion-to-hyperframes, figma, slideshow. The `.claude/skills/` ones (changelog-video, etc.) are HeyGen's own house style. | **Install** |
| 7 | Remotion Motion Graphics | haidrrrry/claude-remotion-skill | MIT | 2026-08-12 | Node, Remotion | copy `remotion-motion-graphics/`; repo also ships a ready `.skill` zip | **Install** (see Remotion licence note) |
| 8 | Video Shotcraft | Vincentwei1021/video-shotcraft | Apache-2.0 | 2026-10-18 | Node, Remotion; optional upload-post API | `npx skills add Vincentwei1021/video-shotcraft` | **Optional** (66 MB repo; product videos from web pages) |
| 9 | Vertical Video Editing | nopefallacy/vertical-video-editing-skills | MIT | 2026-06-22 | HyperFrames CLI, ffmpeg | the npx installer only copies `skills/video-editing/`, so copy that folder directly | **Install** (after #6) |
| 10 | Remotion Agent Skills | remotion-dev/skills | no root license file | 2026-10-22 | Node, Remotion | `npx skills add remotion-dev/skills` (12 skills) | **Install** if we use Remotion |
| 11 | Clipify | louisedesadeleer/clipify | MIT | 2026-08-24 | ffmpeg (libx264), whisper, numpy; written for macOS, so `-hwaccel videotoolbox` flags need removing on Linux | `git clone` to `~/.claude/skills/clipify` | **Install** |
| 12 | Shorts Video Creator | ronnnerr/norstack, `skills/shorts` | MIT | 2026-08-28 | depends on the sibling `video` skill in the same repo | clone the repo | **Optional** (overlaps #11) |
| 13 | Claude Shorts | AgriciDaniel/claude-shorts | MIT | 2026-04-10 | Python venv (faster-whisper, mediapipe, PyTorch), Node/Remotion, ffmpeg, jq; Unix or WSL | `setup.sh` then `install.sh` | **Optional** (heavy install, overlaps #11) |
| 14 | Motion Graphics | Barty-Bart/motion-graphics | MIT | 2026-10-13 | HyperFrames or Remotion; SAM 2 for object-separation | `npx skills add Barty-Bart/motion-graphics` (6 skills) | **Optional**; `motion-broll` and `sound-effects` are the useful ones |
| 15 | B-Roll Overlay | novoads/agent-skills, `shared/skills/broll-overlay` | MIT | 2026-10-17 | ffmpeg 7.1+, **NOVOADS_API_KEY** (paid credits, it prices a job before spending) | clone | **Key** |
| 16 | Thumbnail Skills | greg-prospyr/thumbcraft-skills | MIT | 2026-02-08 | **Thumbnail Creator (thumbcraft.io) account and API key**, MCP connector | `npx skills add greg-prospyr/thumbcraft-skills` plus MCP config | **Key** (paid SaaS) |
| 17 | Claude Video Vision | jordanrendric/claude-video-vision | MIT | 2026-10-06 | MCP server via `npm -g`, whisper-cpp, yt-dlp; optional Gemini or OpenAI key | `/plugin marketplace add` | **Skip** (overlaps #18) |
| 18 | Watch Video | bradautomates/claude-video | MIT | 2026-09-25 | python, ffmpeg, yt-dlp; optional Gemini/OpenAI/Groq keys | already available as `anthropic-skills:watch` | **Already have** |
| 19 | Caption Clip | kwindla/skill-caption-clip | none | 2026-01-27 | yt-dlp, ffmpeg, **DEEPGRAM_API_KEY** | `cp -r` | **Skip** (no license, 3 files) |
| 20 | Omni Captions | lattifai/omni-captions-skills | MIT | 2026-02-06 | yt-dlp, ffmpeg; translation uses Claude; Gemini and LattifAI optional | `/plugin marketplace add lattifai/omni-captions-skills` | **Install** (5 skills: transcribe, translate, convert, download, LaiCut align) |
| 21 | Caption Engine | robcressy.com/caption-skill | not stated | n/a | none; it is skill text to paste, for writing Reels/TikTok captions from a transcript | I can save the text from the page | **Optional** (writing help, not a video tool; overlaps Content Principles) |
| 22 | Color Grade AI | isaacrowntree/color-grade-ai | MIT | 2026-08-03 | python3, Pillow, numpy, PyYAML | `git clone` to `~/.claude/skills/color-grade` | **Install** (makes .cube LUTs for Resolve and Premiere) |
| 23 | Audio Editing | guia-matthieu/clawfu-skills, `skills/audio/audio-editing` | MIT | 2026-10-01 | none; advice only (noise reduction, then compression, then EQ) | copy folder | **Optional** (generic knowledge, no tooling) |
| 24 | Pexo Agent | pexoai/pexo-skills | MIT | 2026-08-20 | **PEXO_API_KEY**, paid hosted service (pexo.ai) | `npx skills add ... --skill pexo-agent` | **Skip** unless we want Pexo; overlaps Higgsfield. Its `videoagent-*` skills send requests to unvetted third-party Vercel proxies. |
| 25 | Higgsfield Skills | higgsfield-ai/skills | MIT | 2026-09-26 | Higgsfield account and CLI (the setup script installs and authenticates it) | `npx skills add higgsfield-ai/skills` | **Install** (8 skills: generate, soul-id, product-photoshoot, brandkit, video-explainer, youtube-thumbnail, more) |
| 26 | Kling AI Skills | maciejdzierzek/kling-ai-prompt-generator | MIT | 2026-08-14 | none (prompt-only) | copy `skills/kling-ai/` | **Install** |
| 27 | Video Producer | arozumenko/video-producer (README now points to elitea-ai/video-producer, so it moved) | none | 2026-03-17 | Playwright, ffmpeg, ElevenLabs key | clone | **Skip** (no license, narrow: product demo videos) |
| 28 | Claude Code Video Toolkit | digitalsamba/claude-code-video-toolkit | MIT | 2026-10-22 | uv, Node, Remotion; optional ElevenLabs and cloud GPUs | clone as a project template and run `/setup` | **Optional** (a whole workspace, not a skill; its `ffmpeg`, `moviepy` and `playwright-recording` skills are the portable parts) |
| 29 | Superpowers | obra/superpowers | MIT | 2026-10-21 | none | `/plugin install superpowers@claude-plugins-official` | **Skip in the vault**: not video, and its `using-superpowers` skill makes every conversation invoke skills first, which would change how every session on this repo behaves |
| 30 | Skill Creator | anthropics/skills | Apache-2.0 | 2026-10-09 | none | already available as `anthropic-skills:skill-creator` | **Already have** |

## Things to know before installing

- **Licensing.** No license means no right to copy or share: #4, #19, #27, and the Remotion skills repo (#10) have none at the root. Personal use only if we keep them. In `anthropics/skills`, docx/pdf/pptx/xlsx are proprietary ("all rights reserved"); only the Apache-licensed ones are reusable.
- **Remotion itself** (#7, #8, #10, #13, #28) is not free for larger companies. Check remotion.dev's license page before using it for Sustainable Scholars work.
- **Data leaving the machine.** #1 sends audio to ElevenLabs, #15 to Novoads, #16 to thumbcraft.io, #19 to Deepgram, #24 to Pexo. Optional Gemini, OpenAI or Groq keys in #17 and #18 send audio or frames to those providers. Everything else runs locally.
- **Installs that run extra software.** Cut Video (#3) creates a conda environment and downloads a model on first run. Higgsfield's `./setup` (#25) installs a CLI. The video toolkit (#28) documents an optional `curl | sh` for `uv`. None of these are hidden; they are in the READMEs.
- **Vault size.** Vendoring whole repos would bloat this vault (video-shotcraft 66 MB, toolkit 34 MB, motion-graphics 28 MB, color-grade 26 MB, HyperFrames 22 MB). Copy only the skill folders and leave out demo videos and test media.

## Recommended install

1. **Editing, no keys:** #3 Cut Video, #11 Clipify, #2 Video Editing Skill.
2. **Motion graphics:** #6 HyperFrames (framework skills only), #9 Vertical Video Editing, #10 Remotion skills.
3. **Captions and color:** #20 Omni Captions, #22 Color Grade AI.
4. **AI video generation:** #25 Higgsfield, #26 Kling.
5. **Hold until you want a paid service:** #1 video-use (ElevenLabs), #15 B-Roll (Novoads), #16 Thumbcraft.
