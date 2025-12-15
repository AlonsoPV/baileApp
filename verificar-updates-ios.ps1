# Script para verificar las claves de Expo Updates en iOS (PowerShell)

Write-Host "🔍 Buscando archivos .plist en iOS..." -ForegroundColor Cyan
Write-Host ""

# Buscar archivos .plist
if (Test-Path ios) {
    $plistFiles = Get-ChildItem -Path ios -Recurse -Filter "*.plist" -ErrorAction SilentlyContinue
    
    if ($null -eq $plistFiles -or $plistFiles.Count -eq 0) {
        Write-Host "❌ No se encontraron archivos .plist" -ForegroundColor Red
        Write-Host "   El directorio ios/ existe pero no contiene archivos .plist." -ForegroundColor Yellow
        Write-Host "   Ejecuta: eas build --profile developmentClient --platform ios" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "✅ Archivos .plist encontrados:" -ForegroundColor Green
    $plistFiles | ForEach-Object { Write-Host "   $($_.FullName)" }
    Write-Host ""
    
    # Verificar claves en cada archivo
    foreach ($plist in $plistFiles) {
        Write-Host "📄 Verificando: $($plist.Name)" -ForegroundColor Cyan
        
        # Leer contenido del plist (requiere plutil en Mac o herramienta alternativa)
        # En Windows, necesitarías una herramienta externa para leer plist
        Write-Host "   ⚠️  Para verificar las claves, abre el archivo manualmente:" -ForegroundColor Yellow
        Write-Host "      $($plist.FullName)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   Busca estas claves:" -ForegroundColor Yellow
        Write-Host "      - EXUpdatesURL (o EXUpdatesUrl)" -ForegroundColor White
        Write-Host "      - EXUpdatesRuntimeVersion" -ForegroundColor White
        Write-Host "      - EXUpdatesEnabled" -ForegroundColor White
        Write-Host ""
    }
} else {
    Write-Host "❌ El directorio ios/ no existe" -ForegroundColor Red
    Write-Host "   Los archivos nativos iOS no se han generado aún." -ForegroundColor Yellow
    Write-Host "   Ejecuta: eas build --profile developmentClient --platform ios" -ForegroundColor Yellow
    exit 1
}

Write-Host "✨ Verificación completada" -ForegroundColor Green

