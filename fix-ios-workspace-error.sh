#!/bin/bash

# Script para diagnosticar y arreglar el error del workspace de iOS
# Ejecutar desde la raíz del proy ecto en macOS

set -e

echo "🔍 Diagnóstico del error de workspace iOS"
echo "=========================================="
echo ""

# 1. Verificar estructura del proyecto
echo "1. Verificando estructura del proyecto..."
if [ -d "ios" ]; then
    echo "   ⚠️  Carpeta ios/ existe localmente"
    echo "   📁 Contenido:"
    ls -la ios/ | head -10
    echo ""
    echo "   🔍 Buscando workspace..."
    if [ -f "ios/baileApp.xcworkspace" ] || [ -d "ios/baileApp.xcworkspace" ]; then
        echo "   ✅ Encontrado: ios/baileApp.xcworkspace"
    else
        echo "   ❌ NO encontrado: ios/baileApp.xcworkspace"
        echo "   🔍 Buscando otros workspaces..."
        find ios -name "*.xcworkspace" 2>/dev/null || echo "   No hay workspaces"
    fi
else
    echo "   ✅ Carpeta ios/ NO existe (correcto para managed workflow)"
fi
echo ""

# 2. Verificar .gitignore
echo "2. Verificando .gitignore..."
if grep -q "^/ios$" .gitignore || grep -q "^ios$" .gitignore; then
    echo "   ✅ ios/ está en .gitignore"
else
    echo "   ⚠️  ios/ NO está en .gitignore"
    echo "   🔧 Agregando a .gitignore..."
    echo "/ios" >> .gitignore
    echo "/android" >> .gitignore
    echo "   ✅ Agregado"
fi
echo ""

# 3. Verificar configuración de Expo
echo "3. Verificando configuración de Expo..."
if [ -f "app.config.ts" ]; then
    echo "   ✅ app.config.ts existe"
    echo "   📋 Nombre del proyecto:"
    grep -A 1 '"name":' app.config.ts | head -2 || grep "name:" app.config.ts | head -1
    echo "   📋 Slug:"
    grep -A 1 '"slug":' app.config.ts | head -2 || grep "slug:" app.config.ts | head -1
else
    echo "   ❌ app.config.ts NO existe"
fi
echo ""

# 4. Verificar lockfile
echo "4. Verificando lockfile (eas-cli)..."
if [ -f "pnpm-lock.yaml" ]; then
    echo "   ✅ pnpm-lock.yaml existe"
    echo "   📋 Versión de eas-cli en lockfile:"
    grep -A 2 "eas-cli:" pnpm-lock.yaml | head -3
else
    echo "   ⚠️  pnpm-lock.yaml NO existe"
fi
echo ""

# 5. Verificar package.json
echo "5. Verificando package.json..."
if grep -q "eas-cli" package.json; then
    echo "   ✅ eas-cli está en package.json"
    echo "   📋 Versión:"
    grep "eas-cli" package.json
else
    echo "   ❌ eas-cli NO está en package.json"
fi
echo ""

# 6. Verificar proyecto EAS
echo "6. Verificando proyecto EAS..."
if command -v eas-cli &> /dev/null || npx eas-cli --version &> /dev/null; then
    echo "   ✅ EAS CLI disponible"
    echo "   📋 Información del proyecto:"
    npx eas-cli project:info 2>/dev/null || echo "   ⚠️  No se pudo obtener información (puede requerir login)"
else
    echo "   ⚠️  EAS CLI no disponible"
fi
echo ""

# 7. Resumen y recomendaciones
echo "=========================================="
echo "📋 Resumen y Recomendaciones:"
echo ""

if [ -d "ios" ]; then
    echo "⚠️  PROBLEMA DETECTADO:"
    echo "   - La carpeta ios/ existe localmente"
    echo "   - Esto puede causar que EAS Build busque un workspace existente"
    echo ""
    echo "🔧 SOLUCIÓN:"
    echo "   1. Eliminar la carpeta ios/ localmente:"
    echo "      rm -rf ios"
    echo ""
    echo "   2. Asegurar que está en .gitignore (ya verificado arriba)"
    echo ""
    echo "   3. Regenerar lockfile si es necesario:"
    echo "      pnpm install"
    echo ""
    echo "   4. Hacer commit de los cambios:"
    echo "      git add .gitignore pnpm-lock.yaml"
    echo "      git commit -m 'fix: ensure iOS folder is ignored and lockfile synced'"
    echo "      git push origin main"
else
    echo "✅ ESTRUCTURA CORRECTA:"
    echo "   - La carpeta ios/ NO existe (correcto para managed workflow)"
    echo "   - EAS Build debería generar los archivos automáticamente"
    echo ""
    echo "🔍 Si el error persiste, puede ser:"
    echo "   1. Configuración en el dashboard de EAS"
    echo "   2. Problema con la detección automática del tipo de proyecto"
    echo ""
    echo "🔧 VERIFICAR EN EAS DASHBOARD:"
    echo "   - Ve a: https://expo.dev/accounts/[tu-cuenta]/projects/[tu-proyecto]/settings"
    echo "   - Verifica que no haya configuración que fuerce 'bare workflow'"
    echo "   - Asegura que el proyecto esté configurado como 'managed workflow'"
fi

echo ""
echo "✅ Diagnóstico completado"
