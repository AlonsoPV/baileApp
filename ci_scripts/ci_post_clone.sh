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
  
  # Detectar ubicación de Homebrew (puede ser /opt/homebrew o /usr/local)
  BREW_PREFIX=$(brew --prefix)
  echo "==> Homebrew prefix: $BREW_PREFIX"
  
  brew update
  brew install node@20
  
  # node@20 es "keg-only", necesitamos agregarlo al PATH explícitamente
  NODE_PATH="$BREW_PREFIX/opt/node@20/bin"
  export PATH="$NODE_PATH:$PATH"
  
  # Verificar que Node y npm estén disponibles después de agregarlo al PATH
  if ! command -v node >/dev/null 2>&1; then
    echo "ERROR: Node installed but not found in PATH. Tried: $NODE_PATH"
    ls -la "$NODE_PATH" || echo "Directory does not exist: $NODE_PATH"
    exit 1
  fi
  
  if ! command -v npm >/dev/null 2>&1; then
    echo "ERROR: npm not found in PATH after Node installation."
    exit 1
  fi
fi

# Asegurar que Node y npm estén en el PATH (por si acaso)
if command -v brew >/dev/null 2>&1; then
  BREW_PREFIX=$(brew --prefix)
  NODE_PATH="$BREW_PREFIX/opt/node@20/bin"
  if [ -d "$NODE_PATH" ]; then
    export PATH="$NODE_PATH:$PATH"
  fi
fi

echo "==> Node: $(node -v)"
echo "==> npm: $(npm -v)"
echo "==> Node path: $(which node)"
echo "==> npm path: $(which npm)"

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
