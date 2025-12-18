#!/bin/bash

# Script para hacer rebuild limpio de iOS después de desactivar New Architecture
# Uso: ./scripts/rebuild-ios-clean.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "🧹 Limpiando build de iOS para desactivar New Architecture..."
echo ""

# 1. Eliminar carpeta ios (se regenerará con expo prebuild)
echo "📁 Eliminando carpeta ios/..."
rm -rf ios

# 2. Regenerar con expo prebuild (limpio)
echo "🔨 Regenerando iOS con expo prebuild (clean)..."
npx expo prebuild --clean --platform ios

# 3. Instalar pods
echo "📦 Instalando CocoaPods..."
cd ios
pod install

echo ""
echo "✅ Rebuild limpio completado!"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Abre el proyecto en Xcode: open ios/DondeBailarMX.xcworkspace"
echo "   2. Compila y prueba localmente"
echo "   3. Si funciona, sube a TestFlight"
echo ""
echo "⚠️  Nota: New Architecture está deshabilitada (newArchEnabled: false)"
echo "   Esto debería resolver el crash de TurboModules en iOS 18.1"

