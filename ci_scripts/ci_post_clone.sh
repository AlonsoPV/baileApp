#!/bin/zsh
set -euo pipefail

echo "==> Xcode Cloud: post-clone start"
cd "${CI_WORKSPACE:-$(pwd)}"

echo "==> Enable corepack"
corepack enable || true

echo "==> Install pnpm (if needed)"
if ! command -v pnpm >/dev/null 2>&1; then
  npm i -g pnpm
fi

echo "==> Install JS deps"
pnpm install --no-frozen-lockfile

echo "==> Install CocoaPods"
cd ios

# Use gem without sudo (avoids CI permission issues)
export GEM_HOME="$HOME/.gem"
export PATH="$GEM_HOME/bin:$PATH"
command -v pod >/dev/null 2>&1 || gem install cocoapods -N --user-install || true

echo "==> pod install"
pod repo update
pod install --repo-update

echo "==> Verify xcconfig exists"
ls -la "Pods/Target Support Files/Pods-DondeBailarMX/Pods-DondeBailarMX.release.xcconfig"
echo "==> Xcode Cloud: post-clone done"
