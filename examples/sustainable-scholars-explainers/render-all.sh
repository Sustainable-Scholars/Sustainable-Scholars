#!/bin/bash
# Queue renders one after another. Usage: ./render-all.sh [video ...]
# Videos: default (clean demo, ~10 min), engaging (one-take, ~3 min), energy (high-energy, ~5 min).
# With no arguments, all three are rendered shortest first. Output: out/Sustainable-Scholars_<name>.mp4
# Quality knobs (env): FPS=60 SUB=4 WORKERS=4 (set FPS=30 SUB=2 for a fast draft).
set -e
cd "$(dirname "$0")"; mkdir -p out
FPS=${FPS:-60}; SUB=${SUB:-4}; WORKERS=${WORKERS:-$(nproc)}
[ -d node_modules/playwright ] || { echo "installing playwright..."; echo '{"private":true,"type":"module"}' > package.json; npm i --no-audit --no-fund playwright; npx playwright install chromium; }
declare -A NAME=( [default]=demo [engaging]=one-take [energy]=high-energy )
LIST=${@:-engaging energy default}
for v in $LIST; do
  python3 build.py "$v"
  echo "START ${NAME[$v]} $(date +%T)" | tee -a render.log
  node render.mjs "out/$v.html" "out/Sustainable-Scholars_${NAME[$v]}.mp4" "$FPS" "$SUB" "$WORKERS"
  echo "DONE ${NAME[$v]} $(date +%T)" | tee -a render.log
done
echo "ALL DONE"
