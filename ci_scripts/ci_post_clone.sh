#!/bin/bash
set -euo pipefail

echo "== Install JS deps =="
corepack enable || true
pnpm --version
pnpm install --frozen-lockfile

echo "== Install iOS Pods =="
cd ios
pod install --repo-update

echo "== Verify Pods xcconfig =="
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
