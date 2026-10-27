# Prompts for re-making or changing these videos

Open a Claude Code session on the `Sustainable-Scholars` repo (the vault). The skills `explainer-default`, `explainer-engaging` and `explainer-high-energy` load automatically. Claude reads this folder, so you do not need to explain anything twice.

## 1. Re-render the same three videos, unchanged

> Re-render the three Sustainable Scholars explainer videos from `examples/sustainable-scholars-explainers` at full quality using `render-all.sh`, run it in the background, and send me the MP4s when they finish.

Takes about 20 minutes on a 4-core cloud session. For a quick draft: "...as a fast draft (`FPS=30 SUB=2`)".

## 2. Change something small (text, timing, colours)

> In `examples/sustainable-scholars-explainers`, change the clean demo so that [what to change]. Rebuild it, show me a contact sheet of the changed scenes first, and only render the final after I approve.

Examples of "what to change": "the closing line says X", "feature 2 shows the pricing page instead of listings", "make the one-take loop 20 seconds with a sixth station", "swap gold for teal".

## 3. A new video in the same style (different product, page or launch)

> Use the `explainer-high-energy` skill (or `explainer-default` / `explainer-engaging`) to make a new video for [product or page URL]. Read the live site first and use only its real wording and numbers. Brand: use the website. Length: [N] seconds. Format: 16:9 (or 9:16). Start from the code in `examples/sustainable-scholars-explainers` as the reference for quality. Check stills first, then render a draft, then wait for my OK before the final.

## 4. A new cut of an existing video (vertical, shorter, new ending)

> Make a 9:16 (1080x1920) version of the high-energy promo, 12 seconds, ending on [new call to action]. Keep the same beat grid. Show stills, then render.

## Tips
- Say which of the three styles you want. If you do not, Claude picks one and tells you.
- Say "ask me before the final render". Finals are the slow, expensive step.
- If a session is fresh, the first render installs Playwright and Chromium (about a minute). Claude handles it.
- Videos are not stored in the repo (too large). Ask Claude to send them, or tell it to upload to Drive.
