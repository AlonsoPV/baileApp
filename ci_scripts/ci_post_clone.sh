#!/bin/bash
set -euo pipefail

echo "==> Xcode Cloud post-clone: install deps + generate iOS workspace"

cd "$(dirname "$0")/.."

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

echo "==> Generate iOS native project (Expo prebuild)"
# We intentionally do NOT commit ios/ in repo; Xcode Cloud generates it.
pnpm exec expo prebuild --platform ios --clean --non-interactive --no-install

echo "==> Install CocoaPods (creates .xcworkspace)"
pushd ios >/dev/null
pod install --repo-update
popd >/dev/null

echo "==> Ensure workspace exists at ios/baileApp.xcworkspace (Xcode Cloud workflow expectation)"
if [ -d "ios/baileApp.xcworkspace" ]; then
  echo "Workspace already present: ios/baileApp.xcworkspace"
else
  FIRST_WS="$(ls -1 ios/*.xcworkspace 2>/dev/null | head -n 1 || true)"
  if [ -z "${FIRST_WS}" ]; then
    echo "ERROR: No .xcworkspace found under ios/ after pod install."
    exit 1
  fi
  echo "Found workspace: ${FIRST_WS}"
  echo "Copying to: ios/baileApp.xcworkspace"
  rm -rf ios/baileApp.xcworkspace
  cp -R "${FIRST_WS}" ios/baileApp.xcworkspace
fi

echo "==> Done"


