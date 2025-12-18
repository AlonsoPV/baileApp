#!/bin/bash
set -euo pipefail

echo "==> Xcode Cloud post-xcodebuild diagnostics"

cd "$(dirname "$0")/.."

export LANG="${LANG:-en_US.UTF-8}"
export LC_ALL="${LC_ALL:-en_US.UTF-8}"

echo "==> Repo root: $(pwd)"
echo "==> CI_XCODEBUILD_ACTION: ${CI_XCODEBUILD_ACTION:-<unset>}"
echo "==> CI_ARCHIVE_PATH: ${CI_ARCHIVE_PATH:-<unset>}"
echo "==> CI_RESULT_BUNDLE_PATH: ${CI_RESULT_BUNDLE_PATH:-<unset>}"

echo "==> ios/ listing (top-level)"
ls -la ios || true

echo "==> Done (post-xcodebuild)"


