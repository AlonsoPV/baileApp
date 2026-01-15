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
export EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID="${EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID:-}"
export GOOGLE_REVERSED_CLIENT_ID="${GOOGLE_REVERSED_CLIENT_ID:-}"

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

if [ -n "$EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID" ]; then
  echo "EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: present (len=${#EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID})"
else
  echo "EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: MISSING"
fi

if [ -n "$GOOGLE_REVERSED_CLIENT_ID" ]; then
  echo "GOOGLE_REVERSED_CLIENT_ID: present (len=${#GOOGLE_REVERSED_CLIENT_ID})"
else
  echo "GOOGLE_REVERSED_CLIENT_ID: MISSING"
fi

# Verificar si las variables están configuradas (solo warning, no fallar)
if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ]; then
  echo "⚠️  WARNING: EXPO_PUBLIC_SUPABASE_URL not set. Configure it in Xcode Cloud environment variables."
fi

if [ -z "$EXPO_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo "⚠️  WARNING: EXPO_PUBLIC_SUPABASE_ANON_KEY not set. Configure it in Xcode Cloud environment variables."
fi

if [ -z "$EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID" ]; then
  echo "⚠️  WARNING: EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID not set. Google native sign-in will fail."
fi

if [ -z "$GOOGLE_REVERSED_CLIENT_ID" ]; then
  echo "⚠️  WARNING: GOOGLE_REVERSED_CLIENT_ID not set. Google URL callback scheme may be missing."
fi

# -----------------------------
# 5) Expo prebuild (solo si NO tienes ios/ commiteado)
# -----------------------------
if [ ! -d "ios" ] || [ ! -f "ios/Podfile" ]; then
  echo "==> Expo prebuild (ios) (ios/ no encontrado o sin Podfile)"
  pnpm exec expo prebuild --platform ios --no-install
else
  echo "==> Skipping expo prebuild (ios/ already committed)"
fi

# -----------------------------
# 6) CocoaPods
# -----------------------------
echo "==> CocoaPods install"
cd ios

export COCOAPODS_DISABLE_STATS=1
export COCOAPODS_SKIP_STATS=1

echo "==> Debug: PATH=$PATH"
echo "==> Debug: node in ios/: $(command -v node || echo '<missing>')"
echo "==> Debug: node -v: $(node -v 2>/dev/null || echo '<node failed>')"
echo "==> Debug: expo package resolve:"
node --print "require.resolve('expo/package.json')" 2>&1 || true
echo "==> Debug: react-native package resolve:"
node --print "require.resolve('react-native/package.json')" 2>&1 || true

# CocoaPods: evitar sudo en Xcode Cloud (instalar en user-install si hiciera falta)
echo "==> Ensuring CocoaPods via RubyGems (prefer over Homebrew pod)"
USER_GEM_DIR="$(ruby -r rubygems -e 'print Gem.user_dir' 2>/dev/null || echo '')"
if [ -n "$USER_GEM_DIR" ]; then
  # Put user gem bin FIRST so we don't accidentally pick up /usr/local/Cellar/.../pod
  export PATH="$USER_GEM_DIR/bin:$PATH"
fi

# Install the exact CocoaPods version pinned by Podfile.lock (best reproducibility)
PINNED_PODS_VER="$(ruby -e 'begin; lock = File.read("Podfile.lock"); m = lock.match(/^COCOAPODS:\\s+([0-9.]+)\\s*$/); puts(m ? m[1] : ""); rescue; puts(""); end' 2>/dev/null || echo '')"
if [ -z "$PINNED_PODS_VER" ]; then
  PINNED_PODS_VER="1.16.2"
fi
echo "==> CocoaPods pinned version: $PINNED_PODS_VER"

if ! command -v pod >/dev/null 2>&1; then
  echo "==> pod not found, installing cocoapods..."
  gem install cocoapods -N --user-install -v "$PINNED_PODS_VER"
else
  # If pod exists but is broken (common with Homebrew Ruby mismatch), reinstall via gems and prefer it
  if ! pod --version >/dev/null 2>&1; then
    echo "==> pod exists but is not runnable; reinstalling cocoapods via gems..."
    gem install cocoapods -N --user-install -v "$PINNED_PODS_VER"
  fi
fi

# Final sanity: show which pod we're using
echo "==> pod path: $(command -v pod || echo '<missing>')"
if command -v pod >/dev/null 2>&1; then
  echo "==> pod --version: $(pod --version || true)"
else
  echo "ERROR: pod still missing after gem install"
  exit 1
fi

echo "==> pod: $(pod --version)"
echo "==> ruby: $(ruby -v || true)"
echo "==> gem: $(gem -v || true)"
echo "==> pod env:"
pod env || true

echo "==> Installing CocoaPods dependencies"

# Helper: run pod install and always print last lines of output on failure (Xcode Cloud truncates logs).
run_pod_install() {
  local label="$1"
  shift
  local log="/tmp/pod_install_${label}.log"
  echo "==> pod install ($label): pod install $*"
  set +e
  pod install "$@" 2>&1 | tee "$log"
  local code="${PIPESTATUS[0]}"
  set -e
  if [ "$code" -ne 0 ]; then
    echo "==> ❌ pod install failed ($label) exit=$code"
    echo "==> Last 200 lines of $log:"
    tail -n 200 "$log" || true
    return "$code"
  fi
  echo "==> ✅ pod install successful ($label)"
  return 0
}

# 1) Intento rápido: NO repo update (más estable en CI)
if run_pod_install "no_repo_update" --verbose --no-repo-update; then
  true
else
  echo "==> ⚠️  pod install failed (no-repo-update). Retrying with --repo-update..."
  if run_pod_install "repo_update" --verbose --repo-update; then
    true
  else
    echo "==> ⚠️  pod install failed (repo-update). One last retry after cleaning cache..."
    pod cache clean --all || true
    run_pod_install "repo_update_after_cache_clean" --verbose --repo-update || {
      echo "==> ❌ Pod install failed after 3 attempts"
      exit 1
    }
  fi
fi

echo "==> Pods ready"
ls -la "Pods/Target Support Files/Pods-DondeBailarMX" || true

echo "==> Done"
