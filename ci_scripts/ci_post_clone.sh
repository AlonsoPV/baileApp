#!/bin/bash
set -euo pipefail

echo "==> CI POST CLONE (running)"

# Xcode Cloud usually checks out to $CI_WORKSPACE (often /Volumes/workspace/repository).
# Make this script resilient to being invoked from a different working directory.
cd "${CI_WORKSPACE:-/Volumes/workspace/repository}" 2>/dev/null || cd "$(dirname "$0")/.." || pwd

echo "==> Repo root: $(pwd)"

# 1) Node + deps
corepack enable || true
pnpm -v || true
pnpm install --no-frozen-lockfile

# 2) Pods
echo "==> Ensuring CocoaPods artifacts"
bash ci_scripts/ensure_pods.sh

echo "==> CI POST CLONE (done)"
