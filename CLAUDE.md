# Skills Vault

This repository is the user's **master vault for Claude skills**: every new skill
they create, and every outside skill they want to keep for future use, lives here.

## Rules for Claude

- New skills go in `.claude/skills/<skill-name>/SKILL.md` (kebab-case folder name).
  Claude Code loads skills from this folder automatically in any session on this repo.
- Start from `.claude/skills/_template/SKILL.md`. The frontmatter `name` must match
  the folder name, and `description` must say what the skill does **and when to use it**.
- Supporting files (scripts, references, examples) go inside that skill's own folder.
- Every time a skill is added, changed or removed, update the table in `SKILLS.md`.
- When the user pastes or links a skill from elsewhere, read it fully before saving,
  keep its original intent, normalize it to the layout above, and note its source.
- Commit and push after each change: cloud sessions are ephemeral, and anything
  not pushed is lost.
