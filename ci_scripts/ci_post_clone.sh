#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> Xcode Cloud CI post-clone"
echo "PWD: $(pwd)"

# -----------------------------
# 1) Node (garantizar que exista)
# -----------------------------
if ! command -v node >/dev/null 2>&1; then
  echo "==> Node not found. Installing via Homebrew..."
  if ! command -v brew >/dev/null 2>&1; then
    echo "ERROR: brew not found; cannot install Node automatically."
    exit 1
  fi
  brew update
  brew install node@20
  export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
fi

echo "==> Node: $(node -v)"

# -----------------------------
# 2) pnpm (corepack)
# -----------------------------
echo "==> Enable corepack"
corepack enable || true

# Si corepack no deja pnpm listo, lo activamos explícitamente
corepack prepare pnpm@10.25.0 --activate || true

echo "==> pnpm: $(pnpm -v)"

# -----------------------------
# 3) Instalar deps JS
# -----------------------------
echo "==> Install JS deps"
pnpm install --no-frozen-lockfile

# -----------------------------
# 4) Expo prebuild (IMPORTANTE)
#    Esto genera/actualiza iOS config usando app.config.ts + ENV vars.
# -----------------------------
echo "==> Expo prebuild (ios)"
# Nota: esto NO corre el simulador; solo genera/ajusta carpeta ios y config
pnpm exec expo prebuild --platform ios --no-install

# -----------------------------
# 5) CocoaPods
# -----------------------------
echo "==> CocoaPods install"
cd ios

# CocoaPods (sin perder tiempo con repo update)
if ! command -v pod >/dev/null 2>&1; then
  echo "==> CocoaPods not found. Installing..."
  sudo gem install cocoapods -N
fi

echo "==> pod: $(pod --version)"

# Recomendación: NO usar "pod repo update" (demasiado lento)
pod install --repo-update --verbose

echo "==> Pods ready"
ls -la "Pods/Target Support Files/Pods-DondeBailarMX" || true

echo "==> Done"
