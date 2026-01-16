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

echo "==> Checking Podfile.lock local :path references (pnpm symlinks can change)"
# With pnpm, CocoaPods may record local pod :path entries that include a specific
# node_modules/.pnpm/... folder name. If JS deps changed and Pods weren't reinstalled,
# those paths can go stale and Xcode fails with lstat(...PrivacyInfo.xcprivacy): No such file.
if [[ -f "Podfile.lock" ]]; then
  # If any local :path reference is missing on disk, force a clean install.
  if grep -E '^[[:space:]]*:path:' Podfile.lock >/dev/null 2>&1; then
    while IFS= read -r line; do
      # Extract the quoted path value (YAML style): :path: "../node_modules/..."
      p="$(echo "$line" | sed -E 's/^[[:space:]]*:path:[[:space:]]*"([^"]+)".*$/\1/')"
      if [[ -n "$p" && ! -e "$p" ]]; then
        echo "==> Missing local pod path referenced in Podfile.lock: $p"
        echo "==> Cleaning Pods + Podfile.lock to regenerate with current node_modules layout"
        rm -rf Pods Podfile.lock
        break
      fi
    done < <(grep -E '^[[:space:]]*:path:' Podfile.lock || true)
  fi
fi

echo "==> Checking Pods vs npm versions (expo / expo-updates)"
NPM_EXPO_VERSION="$(node -p 'require("expo/package.json").version' 2>/dev/null || echo '')"
NPM_UPDATES_VERSION="$(node -p 'require("expo-updates/package.json").version' 2>/dev/null || echo '')"

LOCK_EXPO_VERSION="$(ruby -e 's=File.exist?("Podfile.lock") ? File.read("Podfile.lock") : ""; m=s.match(/- Expo \(([^\)]+)\):/); puts(m ? m[1] : "")' 2>/dev/null || echo '')"
LOCK_UPDATES_VERSION="$(ruby -e 's=File.exist?("Podfile.lock") ? File.read("Podfile.lock") : ""; m=s.match(/- EXUpdates \(([^\)]+)\):/); puts(m ? m[1] : "")' 2>/dev/null || echo '')"

if [[ -n "$NPM_EXPO_VERSION" && -n "$LOCK_EXPO_VERSION" && "$NPM_EXPO_VERSION" != "$LOCK_EXPO_VERSION" ]]; then
  echo "==> Detected Expo version mismatch (npm=$NPM_EXPO_VERSION, pods=$LOCK_EXPO_VERSION). Cleaning Pods to resync."
  rm -rf Pods Podfile.lock
fi

if [[ -n "$NPM_UPDATES_VERSION" && -n "$LOCK_UPDATES_VERSION" && "$NPM_UPDATES_VERSION" != "$LOCK_UPDATES_VERSION" ]]; then
  echo "==> Detected EXUpdates version mismatch (npm=$NPM_UPDATES_VERSION, pods=$LOCK_UPDATES_VERSION). Cleaning Pods to resync."
  rm -rf Pods Podfile.lock
fi

echo "==> Running pod install"
pod install || {
  echo "WARNING: pod install failed. Retrying with --repo-update..."
  pod install --repo-update || {
    echo "WARNING: pod install still failed, but continuing..."
    popd >/dev/null
    exit 0
  }
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


