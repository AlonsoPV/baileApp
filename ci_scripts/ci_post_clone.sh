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
# 2) pnpm (corepack o npm fallback)
# -----------------------------
echo "==> Setting up pnpm"

# Estrategia: Intentar corepack primero, luego npm como fallback
PNPM_INSTALLED=false

# Buscar corepack en ubicaciones comunes
COREPACK_PATH=""
NODE_DIR="$(dirname "$(which node)")"

# 1. Verificar si corepack está en PATH
if command -v corepack >/dev/null 2>&1; then
  COREPACK_PATH="$(command -v corepack)"
  echo "==> corepack found in PATH: $COREPACK_PATH"
# 2. Verificar en el mismo directorio que node
elif [ -f "$NODE_DIR/corepack" ]; then
  COREPACK_PATH="$NODE_DIR/corepack"
  echo "==> corepack found at: $COREPACK_PATH"
  export PATH="$NODE_DIR:$PATH"
# 3. Verificar ubicaciones comunes de Homebrew
elif [ -f "/usr/local/bin/corepack" ]; then
  COREPACK_PATH="/usr/local/bin/corepack"
  echo "==> corepack found at: $COREPACK_PATH"
  export PATH="/usr/local/bin:$PATH"
elif [ -f "/opt/homebrew/bin/corepack" ]; then
  COREPACK_PATH="/opt/homebrew/bin/corepack"
  echo "==> corepack found at: $COREPACK_PATH"
  export PATH="/opt/homebrew/bin:$PATH"
fi

# Intentar usar corepack si está disponible
if [ -n "$COREPACK_PATH" ] && [ -f "$COREPACK_PATH" ]; then
  echo "==> Attempting to enable corepack and prepare pnpm..."
  if "$COREPACK_PATH" enable 2>&1; then
    echo "==> corepack enabled"
    if "$COREPACK_PATH" prepare pnpm@10.25.0 --activate 2>&1; then
      echo "==> pnpm prepared via corepack"
      # Verificar que pnpm esté disponible
      if command -v pnpm >/dev/null 2>&1; then
        PNPM_INSTALLED=true
        echo "==> ✅ pnpm available via corepack: $(which pnpm)"
      fi
    fi
  fi
fi

# Fallback: instalar pnpm vía npm si corepack no funcionó
if [ "$PNPM_INSTALLED" = false ]; then
  echo "⚠️  corepack not available or failed, installing pnpm via npm..."
  if npm install -g pnpm@10.25.0 2>&1; then
    # Asegurar que el directorio de npm global esté en PATH
    NPM_GLOBAL_BIN="$(npm config get prefix)/bin"
    if [ -d "$NPM_GLOBAL_BIN" ]; then
      export PATH="$NPM_GLOBAL_BIN:$PATH"
    fi
    # Verificar que pnpm esté disponible
    if command -v pnpm >/dev/null 2>&1; then
      PNPM_INSTALLED=true
      echo "==> ✅ pnpm installed via npm: $(which pnpm)"
    fi
  fi
fi

# Verificación final
if ! command -v pnpm >/dev/null 2>&1; then
  echo "ERROR: pnpm not found after setup attempts"
  echo "PATH=$PATH"
  echo "Node directory: $NODE_DIR"
  echo "Checking for pnpm in common locations:"
  which -a pnpm 2>/dev/null || echo "pnpm not found in PATH"
  ls -la "$NODE_DIR/pnpm" 2>/dev/null || echo "pnpm not in node directory"
  ls -la "$(npm config get prefix)/bin/pnpm" 2>/dev/null || echo "pnpm not in npm global bin"
  exit 1
fi

echo "==> pnpm: $(pnpm -v)"
echo "==> pnpm path: $(which pnpm)"

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

# ✅ Debug (safe): confirmar presencia sin exponer secretos completos
echo "==> ENV CHECK (Xcode Cloud)"
if [ -n "$EXPO_PUBLIC_SUPABASE_URL" ]; then
  echo "EXPO_PUBLIC_SUPABASE_URL: present (len=${#EXPO_PUBLIC_SUPABASE_URL})"
else
  echo "EXPO_PUBLIC_SUPABASE_URL: MISSING"
fi
if [ -n "$EXPO_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo "EXPO_PUBLIC_SUPABASE_ANON_KEY: present (len=${#EXPO_PUBLIC_SUPABASE_ANON_KEY})"
  echo "EXPO_PUBLIC_SUPABASE_ANON_KEY prefix: ${EXPO_PUBLIC_SUPABASE_ANON_KEY:0:12}..."
else
  echo "EXPO_PUBLIC_SUPABASE_ANON_KEY: MISSING"
fi

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

# ✅ Configurar CocoaPods para usar repositorio git como fallback si CDN falla
# Esto evita problemas cuando jsdelivr.net no está disponible en Xcode Cloud
if ! pod repo list | grep -q "master"; then
  echo "==> Adding CocoaPods master repo (git fallback)"
  pod repo add master https://github.com/CocoaPods/Specs.git || true
fi

# ✅ Intentar pod install con retry si falla por problemas de red
echo "==> Installing CocoaPods dependencies"
MAX_RETRIES=3
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if pod install --repo-update --verbose; then
    echo "==> ✅ Pod install successful"
    break
  else
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
      echo "==> ⚠️  Pod install failed, retrying ($RETRY_COUNT/$MAX_RETRIES)..."
      sleep 5
      # Intentar usar repositorio git en lugar de CDN
      pod repo update master || true
    else
      echo "==> ❌ Pod install failed after $MAX_RETRIES attempts"
      exit 1
    fi
  fi
done

echo "==> Pods ready"
ls -la "Pods/Target Support Files/Pods-DondeBailarMX" || true

echo "==> Done"
