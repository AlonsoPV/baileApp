#!/bin/bash
set -euo pipefail

# Ensures CocoaPods artifacts exist for iOS builds (CI + local automation).
# This script is intentionally self-contained so different CI systems can call it.
# For Android builds, this script will exit successfully without doing anything.

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

if [[ ! -d "ios" || ! -f "ios/Podfile" ]]; then
  echo "==> No ios/Podfile found; skipping CocoaPods (this is expected for Android builds)"
  exit 0
fi

export LANG="${LANG:-en_US.UTF-8}"
export LC_ALL="${LC_ALL:-en_US.UTF-8}"

echo "==> Ensuring CocoaPods is available"
pushd ios >/dev/null

if ! command -v pod >/dev/null 2>&1; then
  echo "CocoaPods (pod) not found; installing via 'gem install --user-install'"
  gem install cocoapods -N --user-install
  USER_GEM_DIR="$(ruby -r rubygems -e 'print Gem.user_dir')"
  export PATH="$USER_GEM_DIR/bin:$PATH"
fi

echo "==> Running pod install"
# Avoid `pod repo update` in CI (slow + may require network); the CDN is enough for most cases.
pod install

popd >/dev/null

XC="ios/Pods/Target Support Files/Pods-DondeBailarMX/Pods-DondeBailarMX.release.xcconfig"
if [[ ! -f "$XC" ]]; then
  echo "ERROR: Missing expected CocoaPods xcconfig: $XC"
  echo "== Debug: ios/Pods/Target Support Files (top) =="
  ls -la "ios/Pods/Target Support Files" || true
  echo "== Debug: ios/Pods/Target Support Files/Pods-DondeBailarMX =="
  ls -la "ios/Pods/Target Support Files/Pods-DondeBailarMX" || true
  exit 1
fi

echo "OK: Found $XC"


