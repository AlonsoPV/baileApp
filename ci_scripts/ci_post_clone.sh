#!/bin/bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

echo "== Install JS deps =="
echo "Node: $(command -v node || echo 'not found')"
node -v || true
echo "npm:  $(command -v npm || echo 'not found')"
npm -v || true

if command -v corepack >/dev/null 2>&1; then
  corepack enable || true
else
  echo "corepack not found; will attempt to install pnpm without corepack"
fi

if ! command -v pnpm >/dev/null 2>&1; then
  if command -v npm >/dev/null 2>&1; then
    echo "pnpm not found; installing pnpm (user prefix)"
    npm config set prefix "$HOME/.npm-global"
    export PATH="$HOME/.npm-global/bin:$PATH"
    npm install -g pnpm
  else
    echo "ERROR: pnpm not found and npm not available to install it."
    exit 1
  fi
fi

pnpm install --frozen-lockfile

echo "== Install iOS Pods =="
bash ci_scripts/ensure_pods.sh
