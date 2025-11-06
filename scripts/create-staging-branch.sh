#!/bin/bash
# ========================================
# 🌿 Script para crear branch de staging
# ========================================

set -e # Exit on error

echo "🌿 Creando branch de staging..."

# 1. Verificar que estamos en una ubicación limpia
if ! git diff-index --quiet HEAD --; then
  echo "⚠️  Advertencia: Tienes cambios sin commitear"
  read -p "¿Deseas continuar? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Operación cancelada"
    exit 1
  fi
fi

# 2. Asegurar que estamos en main
echo "📍 Cambiando a branch main..."
git checkout main

# 3. Pull latest changes
echo "📥 Obteniendo últimos cambios..."
git pull origin main

# 4. Crear branch staging
echo "🌿 Creando branch staging..."
git checkout -b staging

# 5. Push a remoto
echo "⬆️  Subiendo staging a remoto..."
git push -u origin staging

# 6. Verificar branches
echo ""
echo "✅ Branch staging creado exitosamente!"
echo ""
echo "📊 Branches actuales:"
git branch -a | grep -E "(main|staging)"

echo ""
echo "🎯 Próximos pasos:"
echo "1. Configura tu proyecto Supabase staging (ver STAGING_SETUP_INSTRUCTIONS.md)"
echo "2. Crea .env.staging.local con tus credenciales"
echo "3. Configura Vercel para auto-deploy de branch staging"
echo ""
echo "💡 Usa 'npm run dev:staging' para ejecutar en modo staging localmente"

