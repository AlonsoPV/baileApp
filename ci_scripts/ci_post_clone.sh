#!/bin/bash
set -euo pipefail

echo "== Install JS deps =="
corepack enable || true
pnpm --version
pnpm install --frozen-lockfile

echo "== Install iOS Pods =="
cd ios
pod install --repo-update
