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

# Detectar el nombre del workspace (puede ser DondeBailarMX.xcworkspace o baileApp.xcworkspace)
WORKSPACE_NAME=""
if [ -d "ios/DondeBailarMX.xcworkspace" ]; then
  WORKSPACE_NAME="DondeBailarMX.xcworkspace"
elif [ -d "ios/baileApp.xcworkspace" ]; then
  WORKSPACE_NAME="baileApp.xcworkspace"
else
  echo "ERROR: No se encontró workspace en ios/"
  echo "Buscando workspaces disponibles:"
  find ios -name "*.xcworkspace" -type d 2>/dev/null || echo "No se encontraron workspaces"
  exit 1
fi

WORKSPACE_PATH="ios/$WORKSPACE_NAME"
echo "==> Workspace encontrado: $WORKSPACE_PATH"

if [ ! -d "$WORKSPACE_PATH" ]; then
  echo "ERROR: $WORKSPACE_PATH is missing before xcodebuild."
  exit 1
fi

echo "==> Workspace exists: $WORKSPACE_PATH"
echo "==> Workspace contents (first 80 lines):"
sed -n '1,80p' "$WORKSPACE_PATH/contents.xcworkspacedata" || true

echo "==> Schemes in workspace:"
xcodebuild -list -workspace "$WORKSPACE_PATH" || true

echo "==> Check CocoaPods artifacts"
echo "Running ensure_pods.sh (pod install + xcconfig verification)"
bash ci_scripts/ensure_node.sh
bash ci_scripts/ensure_pods.sh

if [ -f "ios/Pods/Manifest.lock" ]; then
  cp ios/Pods/Manifest.lock ios/Podfile.lock
  echo "Podfile.lock synced from Pods/Manifest.lock"
else
  echo "ERROR: ios/Pods/Manifest.lock missing after pod install."
  exit 1
fi

echo "==> Build settings (filtered)"
# This does not build; it helps surface signing/team/bundle-id mismatches in logs.
xcodebuild -showBuildSettings -workspace "$WORKSPACE_PATH" -scheme DondeBailarMX 2>/dev/null | \
  egrep "PRODUCT_BUNDLE_IDENTIFIER|DEVELOPMENT_TEAM|CODE_SIGN_STYLE|CODE_SIGN_ENTITLEMENTS|PROVISIONING_PROFILE|PROVISIONING_PROFILE_SPECIFIER|MARKETING_VERSION|CURRENT_PROJECT_VERSION" || true

echo "==> Pre-xcodebuild done"


