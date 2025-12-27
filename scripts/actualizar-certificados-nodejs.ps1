# Script para actualizar certificados del sistema y verificar Node.js
# Ejecutar como Administrador para mejores resultados

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Actualización de Certificados y Node.js" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si se ejecuta como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  Advertencia: Este script se ejecuta mejor como Administrador" -ForegroundColor Yellow
    Write-Host "   Algunas funciones pueden requerir permisos elevados" -ForegroundColor Yellow
    Write-Host ""
}

# Paso 1: Verificar versión actual de Node.js
Write-Host "📋 Paso 1: Verificando versión actual de Node.js..." -ForegroundColor Green
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Host "   ✅ Node.js: $nodeVersion" -ForegroundColor Green
    Write-Host "   ✅ npm: $npmVersion" -ForegroundColor Green
    
    # Extraer versión mayor
    $majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($majorVersion -lt 20) {
        Write-Host "   ⚠️  Versión antigua detectada. Se recomienda actualizar a Node.js 20 LTS o superior" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Node.js no está instalado o no está en el PATH" -ForegroundColor Red
    Write-Host "   Por favor instala Node.js desde https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Paso 2: Verificar última versión LTS disponible
Write-Host "📋 Paso 2: Verificando última versión LTS de Node.js..." -ForegroundColor Green
try {
    $latestLTS = (Invoke-RestMethod -Uri "https://nodejs.org/dist/index.json" -UseBasicParsing | 
        Where-Object { $_.lts -ne $false } | 
        Select-Object -First 1).version
    
    Write-Host "   ℹ️  Última versión LTS disponible: $latestLTS" -ForegroundColor Cyan
    Write-Host "   📥 Descarga desde: https://nodejs.org/" -ForegroundColor Cyan
    
    if ($nodeVersion -ne $latestLTS) {
        Write-Host "   ⚠️  Tu versión ($nodeVersion) no coincide con la última LTS ($latestLTS)" -ForegroundColor Yellow
        Write-Host "   💡 Se recomienda actualizar Node.js" -ForegroundColor Yellow
    } else {
        Write-Host "   ✅ Ya tienes la última versión LTS instalada" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  No se pudo verificar la última versión (problema de conexión)" -ForegroundColor Yellow
    Write-Host "   Puedes verificar manualmente en https://nodejs.org/" -ForegroundColor Yellow
}
Write-Host ""

# Paso 3: Actualizar certificados del sistema (solo si es administrador)
if ($isAdmin) {
    Write-Host "📋 Paso 3: Actualizando certificados del sistema..." -ForegroundColor Green
    try {
        # Actualizar certificados raíz desde Windows Update
        Write-Host "   🔄 Descargando certificados raíz desde Windows Update..." -ForegroundColor Cyan
        $rootStorePath = "$env:TEMP\RootStore.sst"
        certutil -generateSSTFromWU $rootStorePath 2>&1 | Out-Null
        
        if (Test-Path $rootStorePath) {
            Write-Host "   ✅ Certificados raíz descargados" -ForegroundColor Green
            Import-Certificate -FilePath $rootStorePath -CertStoreLocation Cert:\LocalMachine\Root -ErrorAction SilentlyContinue | Out-Null
            Write-Host "   ✅ Certificados raíz actualizados" -ForegroundColor Green
            Remove-Item $rootStorePath -ErrorAction SilentlyContinue
        }
        
        # Actualizar certificados intermedios
        Write-Host "   🔄 Descargando certificados intermedios desde Windows Update..." -ForegroundColor Cyan
        $intermediateStorePath = "$env:TEMP\IntermediateStore.sst"
        certutil -generateSSTFromWU $intermediateStorePath 2>&1 | Out-Null
        
        if (Test-Path $intermediateStorePath) {
            Write-Host "   ✅ Certificados intermedios descargados" -ForegroundColor Green
            Import-Certificate -FilePath $intermediateStorePath -CertStoreLocation Cert:\LocalMachine\CA -ErrorAction SilentlyContinue | Out-Null
            Write-Host "   ✅ Certificados intermedios actualizados" -ForegroundColor Green
            Remove-Item $intermediateStorePath -ErrorAction SilentlyContinue
        }
        
        Write-Host "   ✅ Certificados del sistema actualizados correctamente" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  Error al actualizar certificados: $_" -ForegroundColor Yellow
        Write-Host "   Puedes actualizar Windows manualmente desde Configuración → Windows Update" -ForegroundColor Yellow
    }
} else {
    Write-Host "📋 Paso 3: Actualización de certificados (requiere permisos de administrador)" -ForegroundColor Yellow
    Write-Host "   ⚠️  Ejecuta este script como Administrador para actualizar certificados automáticamente" -ForegroundColor Yellow
    Write-Host "   O actualiza Windows manualmente desde Configuración → Windows Update" -ForegroundColor Yellow
}
Write-Host ""

# Paso 4: Verificar configuración de npm
Write-Host "📋 Paso 4: Verificando configuración de npm..." -ForegroundColor Green
$strictSSL = npm config get strict-ssl
Write-Host "   ℹ️  strict-ssl: $strictSSL" -ForegroundColor Cyan

if ($strictSSL -eq "false") {
    Write-Host "   ⚠️  strict-ssl está deshabilitado" -ForegroundColor Yellow
    Write-Host "   💡 Después de actualizar certificados, puedes habilitarlo con: npm config set strict-ssl true" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ strict-ssl está habilitado" -ForegroundColor Green
}
Write-Host ""

# Paso 5: Probar conexión con EAS
Write-Host "📋 Paso 5: Probando conexión con EAS..." -ForegroundColor Green
try {
    $env:NODE_TLS_REJECT_UNAUTHORIZED = $null  # Asegurar que no está configurado
    $easTest = eas whoami 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Conexión con EAS exitosa" -ForegroundColor Green
        Write-Host "   ✅ No necesitas usar NODE_TLS_REJECT_UNAUTHORIZED=0" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Error de conexión con EAS" -ForegroundColor Yellow
        Write-Host "   💡 Puede ser necesario actualizar Node.js o Windows" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  EAS CLI no está instalado o no está en el PATH" -ForegroundColor Yellow
    Write-Host "   💡 Instala EAS CLI con: npm install -g eas-cli@latest" -ForegroundColor Yellow
}
Write-Host ""

# Resumen
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Resumen" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Verificaciones completadas" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos pasos:" -ForegroundColor Yellow
Write-Host "   1. Si Node.js está desactualizado, descarga la última LTS desde https://nodejs.org/" -ForegroundColor White
Write-Host "   2. Actualiza Windows desde Configuración → Windows Update" -ForegroundColor White
Write-Host "   3. Reinicia el equipo después de actualizar Windows" -ForegroundColor White
Write-Host "   4. Prueba el build sin variables temporales: pnpm build:prod:android" -ForegroundColor White
Write-Host ""
Write-Host "📚 Para más información, consulta: ACTUALIZAR_NODEJS_WINDOWS.md" -ForegroundColor Cyan
Write-Host ""

