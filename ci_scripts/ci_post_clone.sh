#!/bin/bash
set -euo pipefail

echo "==> CI post-clone start"
echo "PWD: $(pwd)"
ls -la

# 1) Node + deps
corepack enable || true
pnpm -v || true
pnpm install --no-frozen-lockfile

# 2) Pods
cd ios
pod repo update
pod install --verbose

echo "==> CI post-clone done"
