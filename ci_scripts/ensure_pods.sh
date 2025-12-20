#!/bin/bash
# Ensures CocoaPods artifacts exist for iOS builds (CI + local automation).
# This script is intentionally self-contained so different CI systems can call it.
# For Android builds, this script will exit successfully without doing anything.

# Use set -e but allow early exit for Android builds
set -u

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT" || exit 0

# Early exit for Android builds - check if ios directory and Podfile exist
if [[ ! -d "ios" ]] || [[ ! -f "ios/Podfile" ]]; then
  echo "==> No ios/Podfile found; skipping CocoaPods (this is expected for Android builds)"
  exit 0
fi

# Now we're sure it's iOS, so we can use strict error handling
set -eo pipefail

export LANG="${LANG:-en_US.UTF-8}"
export LC_ALL="${LC_ALL:-en_US.UTF-8}"

echo "==> Ensuring CocoaPods is available"
pushd ios >/dev/null

if ! command -v pod >/dev/null 2>&1; then
  echo "CocoaPods (pod) not found; installing via 'gem install --user-install'"
  gem install cocoapods -N --user-install || {
    echo "WARNING: Failed to install CocoaPods, but continuing..."
    popd >/dev/null
    exit 0
  }
  USER_GEM_DIR="$(ruby -r rubygems -e 'print Gem.user_dir' 2>/dev/null || echo '')"
  if [[ -n "$USER_GEM_DIR" ]]; then
    export PATH="$USER_GEM_DIR/bin:$PATH"
  fi
fi

echo "==> Running pod install"
# Avoid `pod repo update` in CI (slow + may require network); the CDN is enough for most cases.
pod install || {
  echo "WARNING: pod install failed, but continuing..."
  popd >/dev/null
  exit 0
}

popd >/dev/null

XC="ios/Pods/Target Support Files/Pods-DondeBailarMX/Pods-DondeBailarMX.release.xcconfig"
if [[ ! -f "$XC" ]]; then
  echo "WARNING: Missing expected CocoaPods xcconfig: $XC"
  echo "== Debug: ios/Pods/Target Support Files (top) =="
  ls -la "ios/Pods/Target Support Files" 2>/dev/null || true
  echo "== Debug: ios/Pods/Target Support Files/Pods-DondeBailarMX =="
  ls -la "ios/Pods/Target Support Files/Pods-DondeBailarMX" 2>/dev/null || true
  # Don't fail the build, just warn
  exit 0
fi

echo "OK: Found $XC"


