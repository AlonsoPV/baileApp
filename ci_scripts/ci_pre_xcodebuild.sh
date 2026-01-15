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

echo "==> Ensure iOS AppIcon asset has applicable content"
# Xcode will fail (exit 65) if ASSETCATALOG_COMPILER_APPICON_NAME points to an
# AppIcon.appiconset that doesn't contain any *applicable* idioms/sizes.
# In this repo we keep a single 1024x1024 source PNG and generate all required
# sizes at CI time to avoid committing many binary files.
ICONSET_DIR="ios/DondeBailarMX/Images.xcassets/AppIcon.appiconset"
SRC_ICON="$ICONSET_DIR/App-Icon-1024x1024@1x.png"
OPAQUE_SRC="$ICONSET_DIR/AppIcon-1024-opaque.png"

if [ -d "$ICONSET_DIR" ] && [ -f "$SRC_ICON" ]; then
  echo "Using source icon: $SRC_ICON"

  # App Store Connect rejects app icons with alpha/transparency.
  # Always (re)generate an opaque 1024 PNG via a JPEG round-trip (JPEG has no alpha).
  # This avoids stale icons in CI caches causing "Missing app icon" / transparency rejections.
  TMP_JPG="$ICONSET_DIR/.tmp_appicon_opaque.jpg"
  echo "Generating opaque base icon (overwrite): $(basename "$OPAQUE_SRC")"
  /usr/bin/sips -s format jpeg "$SRC_ICON" --out "$TMP_JPG" >/dev/null
  /usr/bin/sips -s format png "$TMP_JPG" --out "$OPAQUE_SRC" >/dev/null
  rm -f "$TMP_JPG" || true

  gen_icon() {
    local px="$1"
    local out="$2"
    if [ -f "$out" ]; then
      return 0
    fi
    echo "Generating $(basename "$out") (${px}x${px})"
    /usr/bin/sips -Z "$px" "$OPAQUE_SRC" --out "$out" >/dev/null
  }

  # iPad
  gen_icon 20  "$ICONSET_DIR/AppIcon-20@1x.png"
  gen_icon 29  "$ICONSET_DIR/AppIcon-29@1x.png"
  gen_icon 40  "$ICONSET_DIR/AppIcon-40@1x.png"
  gen_icon 76  "$ICONSET_DIR/AppIcon-76@1x.png"
  gen_icon 152 "$ICONSET_DIR/AppIcon-76@2x.png"
  gen_icon 167 "$ICONSET_DIR/AppIcon-83.5@2x.png"

  # Shared / iPhone (also covers many iPad @2x)
  gen_icon 40  "$ICONSET_DIR/AppIcon-20@2x.png"
  gen_icon 60  "$ICONSET_DIR/AppIcon-20@3x.png"
  gen_icon 58  "$ICONSET_DIR/AppIcon-29@2x.png"
  gen_icon 87  "$ICONSET_DIR/AppIcon-29@3x.png"
  gen_icon 80  "$ICONSET_DIR/AppIcon-40@2x.png"
  gen_icon 120 "$ICONSET_DIR/AppIcon-40@3x.png"
  gen_icon 120 "$ICONSET_DIR/AppIcon-60@2x.png"
  gen_icon 180 "$ICONSET_DIR/AppIcon-60@3x.png"

  echo "AppIcon generation done. Contents:"
  ls -la "$ICONSET_DIR" || true
else
  echo "WARN: AppIcon source not found at $SRC_ICON (skipping icon generation)"
fi

echo "==> Check CocoaPods artifacts"
echo "Running ensure_pods.sh (pod install + xcconfig verification)"

# Asegurar que los scripts sean ejecutables y existan
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENSURE_NODE="$REPO_ROOT/ci_scripts/ensure_node.sh"
ENSURE_PODS="$REPO_ROOT/ci_scripts/ensure_pods.sh"

if [ ! -f "$ENSURE_NODE" ]; then
  echo "ERROR: ensure_node.sh not found at $ENSURE_NODE"
  exit 1
fi

if [ ! -f "$ENSURE_PODS" ]; then
  echo "ERROR: ensure_pods.sh not found at $ENSURE_PODS"
  exit 1
fi

# Hacer los scripts ejecutables (por si acaso)
chmod +x "$ENSURE_NODE" "$ENSURE_PODS" || true

# Ejecutar los scripts usando su shebang
"$ENSURE_NODE"
"$ENSURE_PODS"

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


