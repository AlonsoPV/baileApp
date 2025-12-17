#!/bin/bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

echo "== Install JS deps =="
corepack enable || true
pnpm --version || true
pnpm install --frozen-lockfile

echo "== Install iOS Pods =="
bash ci_scripts/ensure_pods.sh
