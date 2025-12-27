# Script simplificado para actualizar certificados
# Ejecutar como Administrador

Write-Host "Actualizando certificados del sistema..." -ForegroundColor Green

# Verificar si es administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if ($isAdmin) {
    Write-Host "Descargando certificados desde Windows Update..." -ForegroundColor Cyan
    
    # Actualizar certificados raíz
    $rootPath = "$env:TEMP\RootStore.sst"
    certutil -generateSSTFromWU $rootPath 2>&1 | Out-Null
    
    if (Test-Path $rootPath) {
        Import-Certificate -FilePath $rootPath -CertStoreLocation Cert:\LocalMachine\Root -ErrorAction SilentlyContinue | Out-Null
        Remove-Item $rootPath -ErrorAction SilentlyContinue
        Write-Host "Certificados raiz actualizados" -ForegroundColor Green
    }
    
    # Actualizar certificados intermedios
    $intermediatePath = "$env:TEMP\IntermediateStore.sst"
    certutil -generateSSTFromWU $intermediatePath 2>&1 | Out-Null
    
    if (Test-Path $intermediatePath) {
        Import-Certificate -FilePath $intermediatePath -CertStoreLocation Cert:\LocalMachine\CA -ErrorAction SilentlyContinue | Out-Null
        Remove-Item $intermediatePath -ErrorAction SilentlyContinue
        Write-Host "Certificados intermedios actualizados" -ForegroundColor Green
    }
    
    Write-Host "Certificados actualizados correctamente" -ForegroundColor Green
} else {
    Write-Host "Este script requiere permisos de Administrador" -ForegroundColor Yellow
    Write-Host "Ejecuta PowerShell como Administrador y vuelve a ejecutar este script" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Verificando Node.js..." -ForegroundColor Cyan
node --version
npm --version

Write-Host ""
Write-Host "Para actualizar Node.js, descarga la ultima version LTS desde:" -ForegroundColor Cyan
Write-Host "https://nodejs.org/" -ForegroundColor Yellow

