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

echo "==> Install CocoaPods (creates .xcworkspace)"
pushd ios >/dev/null
pod install --repo-update
popd >/dev/null

echo "==> Done"


