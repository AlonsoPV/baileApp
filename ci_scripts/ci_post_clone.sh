#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> Xcode Cloud CI post-clone"
echo "PWD: $(pwd)"

# -----------------------------
# 1) Node (garantizar que exista)
# -----------------------------
# Usar ensure_node.sh que tiene fallback a descarga directa si Homebrew falla
# Este script intenta: 1) Homebrew, 2) Descarga directa desde nodejs.org
echo "==> Ensuring Node.js is available"
if [ -f "ci_scripts/ensure_node.sh" ]; then
  bash ci_scripts/ensure_node.sh
else
  echo "ERROR: ensure_node.sh not found"
  exit 1
fi

# Verificar que Node esté disponible después de ensure_node.sh
if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js installation failed or not found in PATH"
  echo "PATH=$PATH"
  exit 1
fi

# Asegurar que Node y npm estén en el PATH (por si acaso)
# ensure_node.sh ya exporta PATH, pero verificamos por seguridad
if command -v brew >/dev/null 2>&1; then
  BREW_PREFIX=$(brew --prefix)
  NODE_PATH="$BREW_PREFIX/opt/node@20/bin"
  if [ -d "$NODE_PATH" ]; then
    export PATH="$NODE_PATH:$PATH"
  fi
  # También verificar node (sin @20) que puede estar en /opt/homebrew/bin
  NODE_PATH_GENERIC="$BREW_PREFIX/bin"
  if [ -d "$NODE_PATH_GENERIC" ] && [ -f "$NODE_PATH_GENERIC/node" ]; then
    export PATH="$NODE_PATH_GENERIC:$PATH"
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
# 4) Variables de entorno (IMPORTANTE)
#    Exportar variables de entorno necesarias para app.config.ts
#    Estas deben estar configuradas en Xcode Cloud environment variables
# -----------------------------
echo "==> Setting up environment variables"

# Variables de entorno requeridas por app.config.ts
# Si no están disponibles, usar valores por defecto vacíos para permitir el build
# (las variables reales deben estar configuradas en Xcode Cloud)
export EXPO_PUBLIC_SUPABASE_URL="${EXPO_PUBLIC_SUPABASE_URL:-}"
export EXPO_PUBLIC_SUPABASE_ANON_KEY="${EXPO_PUBLIC_SUPABASE_ANON_KEY:-}"

# Verificar si las variables están configuradas (solo warning, no fallar)
if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ]; then
  echo "⚠️  WARNING: EXPO_PUBLIC_SUPABASE_URL not set. Configure it in Xcode Cloud environment variables."
fi

if [ -z "$EXPO_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo "⚠️  WARNING: EXPO_PUBLIC_SUPABASE_ANON_KEY not set. Configure it in Xcode Cloud environment variables."
fi

# -----------------------------
# 5) Expo prebuild (IMPORTANTE)
#    Esto genera/actualiza iOS config usando app.config.ts + ENV vars.
# -----------------------------
echo "==> Expo prebuild (ios)"
# Nota: esto NO corre el simulador; solo genera/ajusta carpeta ios y config
pnpm exec expo prebuild --platform ios --no-install

# -----------------------------
# 6) CocoaPods
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
