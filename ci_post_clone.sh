#!/bin/bash
set -euo pipefail

echo "==> Node & pnpm"
node -v || true
corepack enable || true

echo "==> Install JS deps"
pnpm install --no-frozen-lockfile

echo "==> Install CocoaPods"
cd ios

# Limpieza defensiva
rm -rf Pods
rm -f Podfile.lock || true

# Vuelve a generar lock + Pods consistentes
pod repo update
pod install --verbose

echo "==> Done"
