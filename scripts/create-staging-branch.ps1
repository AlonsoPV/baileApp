# ========================================
# 🌿 Script PowerShell para crear branch de staging
# ========================================
# Para Windows

Write-Host "🌿 Creando branch de staging..." -ForegroundColor Cyan

# 1. Verificar que estamos en una ubicación limpia
$status = git status --porcelain
if ($status) {
  Write-Host "⚠️  Advertencia: Tienes cambios sin commitear" -ForegroundColor Yellow
  $continue = Read-Host "¿Deseas continuar? (y/n)"
  if ($continue -ne "y") {
    Write-Host "❌ Operación cancelada" -ForegroundColor Red
    exit 1
  }
}

# 2. Asegurar que estamos en main
Write-Host "📍 Cambiando a branch main..." -ForegroundColor Cyan
git checkout main

# 3. Pull latest changes
Write-Host "📥 Obteniendo últimos cambios..." -ForegroundColor Cyan
git pull origin main

# 4. Crear branch staging
Write-Host "🌿 Creando branch staging..." -ForegroundColor Cyan
git checkout -b staging

# 5. Push a remoto
Write-Host "⬆️  Subiendo staging a remoto..." -ForegroundColor Cyan
git push -u origin staging

# 6. Verificar branches
Write-Host ""
Write-Host "✅ Branch staging creado exitosamente!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Branches actuales:" -ForegroundColor Cyan
git branch -a | Select-String -Pattern "(main|staging)"

Write-Host ""
Write-Host "🎯 Próximos pasos:" -ForegroundColor Yellow
Write-Host "1. Configura tu proyecto Supabase staging (ver STAGING_SETUP_INSTRUCTIONS.md)"
Write-Host "2. Crea .env.staging.local con tus credenciales"
Write-Host "3. Configura Vercel para auto-deploy de branch staging"
Write-Host ""
Write-Host "💡 Usa 'npm run dev:staging' para ejecutar en modo staging localmente" -ForegroundColor Cyan

