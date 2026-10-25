#!/usr/bin/env python3
"""Build upload-ready zips (claude.ai / Cowork) for skills in .claude/skills.

Usage: python3 tools/package_skills.py OUT_DIR [skill ...]
With no skill names, every skill is packaged. The vault copies are never changed:
frontmatter keys claude.ai does not accept (argument-hint, version, when_to_use, ...)
are removed from the copy inside the zip only.
"""
import os, re, sys, zipfile

ALLOWED = {"name", "description", "license", "allowed-tools", "metadata", "compatibility"}
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".claude", "skills")

def clean_frontmatter(text):
    m = re.match(r"(---\r?\n)(.*?)(\r?\n---\r?\n)", text, re.S)
    if not m:
        return text
    kept, keep = [], True
    for line in m.group(2).split("\n"):
        k = re.match(r"^([A-Za-z0-9_-]+):", line)
        if k:
            keep = k.group(1) in ALLOWED
        if keep:
            kept.append(line)
    return m.group(1) + "\n".join(kept) + m.group(3) + text[m.end():]

def package(name, out_dir):
    src = os.path.join(ROOT, name)
    out = os.path.join(out_dir, name + ".zip")
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for dp, dn, fn in os.walk(src):
            dn[:] = [d for d in dn if d not in (".git", "node_modules")]
            for f in fn:
                p = os.path.join(dp, f)
                arc = os.path.join(name, os.path.relpath(p, src))
                if os.path.relpath(p, src) == "SKILL.md":
                    z.writestr(arc, clean_frontmatter(open(p, encoding="utf-8").read()))
                else:
                    z.write(p, arc)
    return out

if __name__ == "__main__":
    out_dir = sys.argv[1]
    os.makedirs(out_dir, exist_ok=True)
    names = sys.argv[2:] or sorted(d for d in os.listdir(ROOT) if os.path.isfile(os.path.join(ROOT, d, "SKILL.md")) and d != "_template")
    for n in names:
        print(os.path.getsize(package(n, out_dir)), n)
