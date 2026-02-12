#!/bin/bash
# Preflight: verify Node, NODE_ENV, and Expo config evaluation before iOS build.
# Run from repo root (e.g. from ci_post_clone.sh) or from ios/ (script dir).
# Fails with a clear message if app.config.ts throws or Node is missing.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# Repo root: ios/scripts -> ios -> repo
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

echo "[preflight] PATH=$PATH"
echo "[preflight] NODE_BINARY=${NODE_BINARY:-}(empty)"
echo "[preflight] NODE_ENV=${NODE_ENV:-}(empty)"

# Ensure Node is available (reuse .xcode.env logic if present)
if [[ -f "ios/.xcode.env" ]]; then
  set +e
  source "ios/.xcode.env"
  set -e
fi

if ! command -v node >/dev/null 2>&1; then
  echo "[preflight] ERROR: node not found in PATH."
  echo "[preflight] PATH=$PATH"
  exit 1
fi

echo "[preflight] Node: $(node -v) at $(command -v node)"

# Optional: set NODE_ENV for config eval if unset (safe default for CI/Archive)
export NODE_ENV="${NODE_ENV:-production}"
echo "[preflight] NODE_ENV=$NODE_ENV"

# Evaluate Expo config and fail with clear message if it throws (e.g. TDZ in app.config.ts)
if ! npx expo config --type public >/dev/null 2>&1; then
  echo "[preflight] ERROR: expo config evaluation failed (app.config.ts may throw or Node/env issue)."
  echo "[preflight] Run manually: npx expo config --type public"
  npx expo config --type public 2>&1 || true
  echo "[preflight] If you see 'Cannot access before initialization', fix app.config.ts: define required() before first use."
  exit 1
fi

echo "[preflight] OK: expo config evaluated"
echo "[preflight] OK: preflight passed."
