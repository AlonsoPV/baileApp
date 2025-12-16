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
echo "==> Ensuring CocoaPods artifacts"
bash ci_scripts/ensure_pods.sh

echo "==> CI post-clone done"
