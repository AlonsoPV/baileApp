#!/bin/bash
set -euo pipefail

echo "==> Xcode Cloud post-clone: install deps + generate iOS workspace"

cd "$(dirname "$0")/.."

# CocoaPods can break under non-UTF8 locales.
export LANG="${LANG:-en_US.UTF-8}"
export LC_ALL="${LC_ALL:-en_US.UTF-8}"

echo "==> Enable corepack (pnpm)"
if command -v corepack >/dev/null 2>&1; then
  corepack enable || true
  corepack prepare pnpm@10.25.0 --activate || true
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "==> pnpm not found; installing via npm"
  npm i -g pnpm@10.25.0
fi

echo "==> Install JS dependencies"
pnpm install --frozen-lockfile

echo "==> Install CocoaPods (creates .xcworkspace)"
pushd ios >/dev/null
pod install
popd >/dev/null

echo "==> Replace ios/baileApp.xcworkspace with the Pods-generated workspace"
# Xcode Cloud resolves packages very early (before scripts), so we commit a minimal
# workspace at ios/baileApp.xcworkspace. After `pod install`, we overwrite it with
# the CocoaPods workspace so `xcodebuild archive` builds Pods correctly.
if [ -d "ios/DondeBailarMX.xcworkspace" ]; then
  rm -rf ios/baileApp.xcworkspace
  cp -R ios/DondeBailarMX.xcworkspace ios/baileApp.xcworkspace
  echo "Workspace updated: ios/baileApp.xcworkspace (from DondeBailarMX.xcworkspace)"
else
  echo "WARN: ios/DondeBailarMX.xcworkspace not found after pod install."
  echo "      Archive may fail if CocoaPods integration is required."
fi

echo "==> Ensure Podfile.lock exists and matches Pods/Manifest.lock"
if [ -f "ios/Pods/Manifest.lock" ]; then
  # Make sure the build phase "[CP] Check Pods Manifest.lock" passes.
  cp ios/Pods/Manifest.lock ios/Podfile.lock
  echo "Podfile.lock synced from Pods/Manifest.lock"
else
  echo "WARN: ios/Pods/Manifest.lock not found; Podfile.lock sync skipped"
fi

echo "==> Done"


