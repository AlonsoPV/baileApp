#!/bin/bash
set -euo pipefail

echo "==> Enable corepack"
corepack enable || true

echo "==> Install JS deps"
pnpm install --no-frozen-lockfile

echo "==> CocoaPods install"
cd ios

# Si CocoaPods no está, instálalo (Xcode Cloud normalmente lo trae, pero por si acaso)
which pod || sudo gem install cocoapods -N

pod repo update
pod install --verbose

echo "==> Pods ready"
ls -la "Pods/Target Support Files/Pods-DondeBailarMX" || true
