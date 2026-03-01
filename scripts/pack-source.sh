#!/usr/bin/env bash
# Pack source code for AMO (addons.mozilla.org) review.
# Produces a zip that lets a reviewer run `npm install && npm run build:firefox`
# to reproduce the exact dist-firefox/ output.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VERSION=$(node -p "require('./package.json').version")
OUT="hill-chart-${VERSION}-source.zip"

rm -f "$OUT"

zip -r "$OUT" . \
  -x ".git/*" \
  -x "node_modules/*" \
  -x "dist/*" \
  -x "dist-firefox/*" \
  -x "dist-ssr/*" \
  -x "test-results/*" \
  -x ".claude/*" \
  -x ".DS_Store" \
  -x "*.local" \
  -x "*.sw?" \
  -x "*.xpi" \
  -x "$OUT"

echo ""
echo "Created $OUT ($(du -h "$OUT" | cut -f1))"
echo ""
echo "A reviewer can reproduce the build with:"
echo "  unzip $OUT -d hill-chart-source"
echo "  cd hill-chart-source"
echo "  npm install"
echo "  npm run build:firefox"
