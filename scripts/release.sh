#!/usr/bin/env bash
# Release script: bumps version, builds both browsers, and packages everything.
# Usage: bash scripts/release.sh <version>
# Example: bash scripts/release.sh 0.2.0
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: $0 <version>"
  echo "Example: $0 0.2.0"
  exit 1
fi

VERSION="$1"

# Validate semver-ish format
if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Error: version must be in X.Y.Z format (e.g. 0.2.0)"
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Bumping version to $VERSION"

# Update package.json
node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  pkg.version = '$VERSION';
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

# Update manifest files
for manifest in manifest.chrome.json manifest.firefox.json; do
  node -e "
    const fs = require('fs');
    const m = JSON.parse(fs.readFileSync('$manifest', 'utf8'));
    m.version = '$VERSION';
    fs.writeFileSync('$manifest', JSON.stringify(m, null, 2) + '\n');
  "
  echo "    Updated $manifest"
done

echo ""
echo "==> Building Chrome extension"
npm run build:chrome

CHROME_ZIP="hill-chart-${VERSION}-chrome.zip"
(cd dist && zip -r "../${CHROME_ZIP}" .)
echo "    Created $CHROME_ZIP"

echo ""
echo "==> Building Firefox extension"
npm run build:firefox

FIREFOX_ZIP="hill-chart-${VERSION}-firefox.zip"
(cd dist-firefox && zip -r "../${FIREFOX_ZIP}" .)
echo "    Created $FIREFOX_ZIP"

echo ""
echo "==> Packing source for Firefox review"
bash scripts/pack-source.sh
SOURCE_ZIP="hill-chart-${VERSION}-source.zip"

echo ""
echo "==> Moving artifacts to release/"
mkdir -p release
mv "$CHROME_ZIP" release/
mv "$FIREFOX_ZIP" release/
mv "$SOURCE_ZIP" release/

echo ""
echo "Done! Release artifacts in release/:"
ls -lh release/
echo ""
echo "Next steps:"
echo "  1. Upload release/${CHROME_ZIP} to Chrome Web Store"
echo "  2. Upload release/${FIREFOX_ZIP} to AMO (addons.mozilla.org)"
echo "  3. Upload release/${SOURCE_ZIP} as source code for AMO review"
