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
# Source of truth for the app icon:
# - Prefer repo-wide Expo icon at assets/adaptive-icon.png
# - Fallback to the existing AppIcon source inside the asset catalog
REPO_ICON_SRC="assets/adaptive-icon.png"
SRC_ICON="$ICONSET_DIR/App-Icon-1024x1024@1x.png"
OPAQUE_SRC="$ICONSET_DIR/AppIcon-1024-opaque.png"

if [ -d "$ICONSET_DIR" ]; then
  # If the repo icon exists, copy/normalize it into the asset catalog source slot.
  # This makes CI deterministic even if the repo has multiple icon files.
  if [ -f "$REPO_ICON_SRC" ]; then
    echo "Using repo icon source: $REPO_ICON_SRC"
    echo "Normalizing to 1024x1024 into: $SRC_ICON"
    # Ensure 1024x1024 PNG (sips will keep aspect ratio; for square icons it will be exact)
    /usr/bin/sips -s format png -Z 1024 "$REPO_ICON_SRC" --out "$SRC_ICON" >/dev/null
  fi

  if [ ! -f "$SRC_ICON" ]; then
    echo "WARN: AppIcon source not found at $SRC_ICON (and no $REPO_ICON_SRC). Skipping icon generation."
  else
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
  fi
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

echo "==> Ensure build number increases for App Store Connect"
# App Store Connect requires CFBundleVersion (build number) to be strictly increasing.
# In this project, CFBundleVersion is driven by CURRENT_PROJECT_VERSION (apple-generic).
#
# Strategy:
# - In Xcode Cloud, use CI_BUILD_NUMBER as the monotonically increasing run number.
# - Add an offset (default: current repo build number) so that cloud builds don't start at 1
#   and accidentally go below an already-uploaded build (e.g. 113).
#
# You can override the default behavior by setting:
# - BUILD_NUMBER_OFFSET: integer offset to add to CI_BUILD_NUMBER
if [ -n "${CI_BUILD_NUMBER:-}" ]; then
  if [[ "${CI_BUILD_NUMBER}" =~ ^[0-9]+$ ]]; then
    pushd ios >/dev/null

    # Get current repo build number (terse output is usually a single integer).
    REPO_BUILD_NUMBER="$(/usr/bin/xcrun agvtool what-version -terse 2>/dev/null | /usr/bin/tail -n 1 || true)"
    OFFSET="${BUILD_NUMBER_OFFSET:-$REPO_BUILD_NUMBER}"

    if [[ "${OFFSET}" =~ ^[0-9]+$ ]]; then
      NEW_BUILD_NUMBER=$((OFFSET + CI_BUILD_NUMBER))
      echo "Setting CURRENT_PROJECT_VERSION to ${NEW_BUILD_NUMBER} (offset=${OFFSET} + CI_BUILD_NUMBER=${CI_BUILD_NUMBER})"
      /usr/bin/xcrun agvtool new-version -all "${NEW_BUILD_NUMBER}"
    else
      echo "WARN: Could not determine numeric offset (BUILD_NUMBER_OFFSET='${BUILD_NUMBER_OFFSET:-}', repo='${REPO_BUILD_NUMBER}')."
      echo "Falling back to CURRENT_PROJECT_VERSION=CI_BUILD_NUMBER (${CI_BUILD_NUMBER})."
      /usr/bin/xcrun agvtool new-version -all "${CI_BUILD_NUMBER}"
    fi

    popd >/dev/null
  else
    echo "WARN: CI_BUILD_NUMBER is not numeric: '${CI_BUILD_NUMBER}'. Skipping build number update."
  fi
else
  echo "CI_BUILD_NUMBER not set. Skipping build number update."
fi

echo "==> Build settings (filtered)"
# This does not build; it helps surface signing/team/bundle-id mismatches in logs.
xcodebuild -showBuildSettings -workspace "$WORKSPACE_PATH" -scheme DondeBailarMX 2>/dev/null | \
  egrep "PRODUCT_BUNDLE_IDENTIFIER|DEVELOPMENT_TEAM|CODE_SIGN_STYLE|CODE_SIGN_ENTITLEMENTS|PROVISIONING_PROFILE|PROVISIONING_PROFILE_SPECIFIER|MARKETING_VERSION|CURRENT_PROJECT_VERSION" || true

echo "==> Google Sign-In (iOS) configuration guardrails"
# Native Google Sign-In needs:
# - iOS Client ID (xxxx.apps.googleusercontent.com) to configure the SDK
# - Reversed scheme (com.googleusercontent.apps.xxxx) in CFBundleURLSchemes
# - (Recommended for Supabase) Web Client ID as serverClientID so idToken audience matches Supabase config
INFO_PLIST="ios/DondeBailarMX/Info.plist"
if [ ! -f "$INFO_PLIST" ]; then
  echo "ERROR: Info.plist not found at $INFO_PLIST"
  exit 1
fi

IOS_CLIENT_ID="${EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID:-${GOOGLE_IOS_CLIENT_ID:-}}"
WEB_CLIENT_ID="${EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID:-${GOOGLE_WEB_CLIENT_ID:-}}"

if [ -z "$IOS_CLIENT_ID" ]; then
  echo "ERROR: Missing EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID (required for native Google Sign-In)."
  exit 1
fi

if [[ "$IOS_CLIENT_ID" != *".apps.googleusercontent.com" ]]; then
  echo "ERROR: EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID does not look like an iOS client id (*.apps.googleusercontent.com)."
  echo "Got: $IOS_CLIENT_ID"
  exit 1
fi

PREFIX="${IOS_CLIENT_ID%%.apps.googleusercontent.com}"
DERIVED_REVERSED="com.googleusercontent.apps.${PREFIX}"

# Prefer explicit GOOGLE_REVERSED_CLIENT_ID if provided; otherwise derive from iOS client id.
GOOGLE_REVERSED_CLIENT_ID="${GOOGLE_REVERSED_CLIENT_ID:-$DERIVED_REVERSED}"
export GOOGLE_REVERSED_CLIENT_ID

if [ -z "$WEB_CLIENT_ID" ]; then
  echo "ERROR: Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID."
  echo "Supabase Google provider expects the Web Client ID as the token audience."
  exit 1
fi

echo "iOS Client ID: ${IOS_CLIENT_ID:0:12}..."
echo "Web Client ID: ${WEB_CLIENT_ID:0:12}..."
echo "Reversed scheme: ${GOOGLE_REVERSED_CLIENT_ID}"

echo "==> Ensuring GIDClientID / GIDServerClientID in Info.plist"
/usr/libexec/PlistBuddy -c "Set :GIDClientID $IOS_CLIENT_ID" "$INFO_PLIST" 2>/dev/null || \
  /usr/libexec/PlistBuddy -c "Add :GIDClientID string $IOS_CLIENT_ID" "$INFO_PLIST"
/usr/libexec/PlistBuddy -c "Set :GIDServerClientID $WEB_CLIENT_ID" "$INFO_PLIST" 2>/dev/null || \
  /usr/libexec/PlistBuddy -c "Add :GIDServerClientID string $WEB_CLIENT_ID" "$INFO_PLIST"

echo "==> Ensuring GOOGLE_REVERSED_CLIENT_ID in CFBundleURLSchemes"
# Get the current schemes array as a list
SCHEMES_COUNT=$(/usr/libexec/PlistBuddy -c "Print :CFBundleURLTypes:0:CFBundleURLSchemes" "$INFO_PLIST" 2>/dev/null | grep -c "string" || echo "0")

# Find the index of the entry with $(GOOGLE_REVERSED_CLIENT_ID) placeholder
FOUND_INDEX=""
for i in $(seq 0 $((SCHEMES_COUNT - 1))); do
  SCHEME_VALUE=$(/usr/libexec/PlistBuddy -c "Print :CFBundleURLTypes:0:CFBundleURLSchemes:$i" "$INFO_PLIST" 2>/dev/null || echo "")
  if [ "$SCHEME_VALUE" = "\$(GOOGLE_REVERSED_CLIENT_ID)" ]; then
    FOUND_INDEX=$i
    break
  fi
done

if [ -n "$FOUND_INDEX" ]; then
  echo "Found placeholder at index $FOUND_INDEX, replacing with actual value"
  /usr/libexec/PlistBuddy -c "Set :CFBundleURLTypes:0:CFBundleURLSchemes:$FOUND_INDEX $GOOGLE_REVERSED_CLIENT_ID" "$INFO_PLIST"
else
  # Add if missing
  VERIFY=$(/usr/libexec/PlistBuddy -c "Print :CFBundleURLTypes:0:CFBundleURLSchemes" "$INFO_PLIST" 2>/dev/null | grep -F "$GOOGLE_REVERSED_CLIENT_ID" || echo "")
  if [ -z "$VERIFY" ]; then
    echo "Adding reversed scheme to CFBundleURLSchemes"
    /usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0:CFBundleURLSchemes: string $GOOGLE_REVERSED_CLIENT_ID" "$INFO_PLIST" 2>/dev/null || true
  fi
fi

echo "==> Verifying Google Sign-In Info.plist contents"
SCHEMES=$(/usr/libexec/PlistBuddy -c "Print :CFBundleURLTypes:0:CFBundleURLSchemes" "$INFO_PLIST" 2>/dev/null || true)
echo "$SCHEMES" | grep -F "$GOOGLE_REVERSED_CLIENT_ID" >/dev/null 2>&1 || {
  echo "ERROR: Info.plist is missing Google reversed URL scheme: $GOOGLE_REVERSED_CLIENT_ID"
  echo "Current CFBundleURLSchemes:"
  echo "$SCHEMES"
  exit 1
}

GID_CLIENT_ID=$(/usr/libexec/PlistBuddy -c "Print :GIDClientID" "$INFO_PLIST" 2>/dev/null || echo "")
GID_SERVER_CLIENT_ID=$(/usr/libexec/PlistBuddy -c "Print :GIDServerClientID" "$INFO_PLIST" 2>/dev/null || echo "")
if [ "$GID_CLIENT_ID" != "$IOS_CLIENT_ID" ]; then
  echo "ERROR: GIDClientID mismatch in Info.plist."
  echo "Expected: $IOS_CLIENT_ID"
  echo "Found:    $GID_CLIENT_ID"
  exit 1
fi
if [ "$GID_SERVER_CLIENT_ID" != "$WEB_CLIENT_ID" ]; then
  echo "ERROR: GIDServerClientID mismatch in Info.plist."
  echo "Expected: $WEB_CLIENT_ID"
  echo "Found:    $GID_SERVER_CLIENT_ID"
  exit 1
fi

echo "==> App Store Connect guardrails (version/build)"
MARKETING_VERSION="$(xcodebuild -showBuildSettings -workspace "$WORKSPACE_PATH" -scheme DondeBailarMX 2>/dev/null | awk -F' = ' '/MARKETING_VERSION/ {print $2; exit}')"
CURRENT_PROJECT_VERSION="$(xcodebuild -showBuildSettings -workspace "$WORKSPACE_PATH" -scheme DondeBailarMX 2>/dev/null | awk -F' = ' '/CURRENT_PROJECT_VERSION/ {print $2; exit}')"
echo "MARKETING_VERSION=$MARKETING_VERSION"
echo "CURRENT_PROJECT_VERSION=$CURRENT_PROJECT_VERSION"

# Fail early if the release train is still the closed one.
if [[ "$MARKETING_VERSION" == "1.0.2" ]]; then
  echo "ERROR: MARKETING_VERSION is still 1.0.2 (App Store Connect train is closed). Bump to 1.0.3+."
  exit 1
fi

echo "==> Pre-xcodebuild done"


