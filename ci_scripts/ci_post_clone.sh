#!/bin/bash
set -euo pipefail

echo "==> Post-clone: install JS deps"
corepack enable || true

# Ensure pnpm is available (corepack may not auto-provide without packageManager field)
if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm not found; installing globally via npm"
  npm i -g pnpm
fi

pnpm --version
pnpm install --frozen-lockfile

echo "==> Post-clone: install iOS pods"
cd ios

# CocoaPods: avoid sudo in CI. If missing, install to user gems and add to PATH.
if ! command -v pod >/dev/null 2>&1; then
  echo "CocoaPods (pod) not found; installing via 'gem install --user-install'"
  gem install cocoapods -N --user-install
  USER_GEM_DIR="$(ruby -r rubygems -e 'print Gem.user_dir')"
  export PATH="$USER_GEM_DIR/bin:$PATH"
fi

pod --version

# Prefer fast install; only update specs if needed.
if ! pod install; then
  echo "pod install failed; retrying with --repo-update"
  pod install --repo-update
fi

echo "==> Verify Pods xcconfig"
XC="Pods/Target Support Files/Pods-DondeBailarMX/Pods-DondeBailarMX.release.xcconfig"
if [ ! -f "$XC" ]; then
  echo "ERROR: Missing $XC"
  echo "== Debug: listing Pods/Target Support Files =="
  ls -la "Pods/Target Support Files" || true
  echo "== Debug: listing Pods-DondeBailarMX dir =="
  ls -la "Pods/Target Support Files/Pods-DondeBailarMX" || true
  exit 1
fi
echo "OK: Found $XC"
