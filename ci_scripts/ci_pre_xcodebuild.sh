#!/bin/bash
set -euo pipefail

echo "==> Xcode Cloud pre-xcodebuild diagnostics"

cd "$(dirname "$0")/.."

export LANG="${LANG:-en_US.UTF-8}"
export LC_ALL="${LC_ALL:-en_US.UTF-8}"

echo "==> Repo root: $(pwd)"
echo "==> Xcode: $(xcodebuild -version | tr '\n' ' ')" || true

echo "==> ios/ listing"
ls -la ios || true

if [ ! -d "ios/baileApp.xcworkspace" ]; then
  echo "ERROR: ios/baileApp.xcworkspace is missing before xcodebuild."
  exit 1
fi

echo "==> Workspace exists: ios/baileApp.xcworkspace"
echo "==> Workspace contents (first 80 lines):"
sed -n '1,80p' ios/baileApp.xcworkspace/contents.xcworkspacedata || true

echo "==> Schemes in workspace:"
xcodebuild -list -workspace ios/baileApp.xcworkspace || true

echo "==> Check CocoaPods artifacts"
echo "Running pod install (forces Podfile.lock/Manifest.lock sync for this CI run)"
pushd ios >/dev/null
pod install
popd >/dev/null

if [ ! -d "ios/Pods/Pods.xcodeproj" ]; then
  echo "ERROR: Pods.xcodeproj missing after pod install."
  exit 1
fi

if [ -f "ios/Pods/Manifest.lock" ]; then
  cp ios/Pods/Manifest.lock ios/Podfile.lock
  echo "Podfile.lock synced from Pods/Manifest.lock"
else
  echo "ERROR: ios/Pods/Manifest.lock missing after pod install."
  exit 1
fi

echo "==> Build settings (filtered)"
# This does not build; it helps surface signing/team/bundle-id mismatches in logs.
xcodebuild -showBuildSettings -workspace ios/baileApp.xcworkspace -scheme DondeBailarMX 2>/dev/null | \
  egrep "PRODUCT_BUNDLE_IDENTIFIER|DEVELOPMENT_TEAM|CODE_SIGN_STYLE|CODE_SIGN_ENTITLEMENTS|PROVISIONING_PROFILE|PROVISIONING_PROFILE_SPECIFIER|MARKETING_VERSION|CURRENT_PROJECT_VERSION" || true

echo "==> Pre-xcodebuild done"


