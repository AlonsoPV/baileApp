#!/bin/bash
set -euo pipefail

echo "==> Xcode Cloud pre-xcodebuild diagnostics"

cd "$(dirname "$0")/.."

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
if [ -d "ios/Pods/Pods.xcodeproj" ]; then
  echo "Pods.xcodeproj exists ✅"
else
  echo "Pods.xcodeproj missing — running pod install"
  pushd ios >/dev/null
  pod install --repo-update
  popd >/dev/null

  if [ ! -d "ios/Pods/Pods.xcodeproj" ]; then
    echo "ERROR: Pods.xcodeproj still missing after pod install."
    exit 1
  fi
fi

echo "==> Build settings (filtered)"
# This does not build; it helps surface signing/team/bundle-id mismatches in logs.
xcodebuild -showBuildSettings -workspace ios/baileApp.xcworkspace -scheme DondeBailarMX 2>/dev/null | \
  egrep "PRODUCT_BUNDLE_IDENTIFIER|DEVELOPMENT_TEAM|CODE_SIGN_STYLE|CODE_SIGN_ENTITLEMENTS|PROVISIONING_PROFILE|PROVISIONING_PROFILE_SPECIFIER|MARKETING_VERSION|CURRENT_PROJECT_VERSION" || true

echo "==> Pre-xcodebuild done"


