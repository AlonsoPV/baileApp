#!/bin/bash

# Script de diagnóstico para Error 78 - MobileSoftwareUpdateErrorDomain
# Uso: ./scripts/diagnostico-error-ota-ios.sh

echo "🔍 Diagnóstico: Error 78 - MobileSoftwareUpdateErrorDomain"
echo "=========================================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para verificar si un comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 1. Verificar herramientas disponibles
echo "📋 1. Verificando herramientas disponibles..."
echo ""

if command_exists xcrun; then
    echo -e "${GREEN}✓${NC} xcrun está disponible"
else
    echo -e "${RED}✗${NC} xcrun no está disponible (necesitas Xcode)"
fi

if command_exists log; then
    echo -e "${GREEN}✓${NC} log está disponible"
else
    echo -e "${RED}✗${NC} log no está disponible"
fi

echo ""

# 2. Verificar dispositivo conectado
echo "📱 2. Verificando dispositivos iOS conectados..."
echo ""

if command_exists xcrun; then
    DEVICES=$(xcrun xctrace list devices 2>/dev/null | grep -i "iphone\|ipad" || echo "")
    if [ -z "$DEVICES" ]; then
        echo -e "${YELLOW}⚠${NC} No se encontraron dispositivos iOS conectados"
        echo "   Conecta un dispositivo iOS y vuelve a ejecutar el script"
    else
        echo -e "${GREEN}✓${NC} Dispositivos encontrados:"
        echo "$DEVICES"
    fi
else
    echo -e "${YELLOW}⚠${NC} No se puede verificar dispositivos (xcrun no disponible)"
fi

echo ""

# 3. Buscar logs relacionados con el error
echo "📝 3. Buscando logs relacionados con MobileSoftwareUpdate..."
echo ""

if command_exists log; then
    echo "Buscando logs de las últimas 24 horas..."
    echo ""
    
    # Buscar error 78
    echo "--- Logs con 'error 78' ---"
    log show --predicate 'eventMessage contains "error 78" OR eventMessage contains "MobileSoftwareUpdateErrorDomain"' --last 24h 2>/dev/null | head -20 || echo "No se encontraron logs recientes"
    echo ""
    
    # Buscar "Update finish took too long"
    echo "--- Logs con 'Update finish took too long' ---"
    log show --predicate 'eventMessage contains "Update finish took too long"' --last 24h 2>/dev/null | head -20 || echo "No se encontraron logs recientes"
    echo ""
    
    # Buscar softwareupdateservicesd
    echo "--- Logs de softwareupdateservicesd ---"
    log show --predicate 'process == "softwareupdateservicesd"' --last 24h 2>/dev/null | head -20 || echo "No se encontraron logs recientes"
else
    echo -e "${YELLOW}⚠${NC} El comando 'log' no está disponible"
    echo "   Usa Console.app en macOS para ver los logs manualmente"
fi

echo ""

# 4. Verificar configuración de Expo Updates
echo "⚙️  4. Verificando configuración de Expo Updates..."
echo ""

if [ -f "app.config.ts" ]; then
    echo "Leyendo app.config.ts..."
    UPDATES_ENABLED=$(grep -A 3 '"updates":' app.config.ts | grep '"enabled"' | grep -o 'true\|false' || echo "no encontrado")
    UPDATES_URL=$(grep -A 3 '"updates":' app.config.ts | grep '"url"' | grep -o 'https://[^"]*' || echo "no encontrado")
    
    echo "  enabled: $UPDATES_ENABLED"
    echo "  url: $UPDATES_URL"
    
    if [ "$UPDATES_ENABLED" = "false" ]; then
        echo -e "${YELLOW}⚠${NC} Expo Updates está deshabilitado en app.config.ts"
    fi
else
    echo -e "${RED}✗${NC} app.config.ts no encontrado"
fi

echo ""

if [ -f "ios/DondeBailarMX/Supporting/Expo.plist" ]; then
    echo "Leyendo ios/DondeBailarMX/Supporting/Expo.plist..."
    if command_exists plutil; then
        EX_UPDATES_ENABLED=$(plutil -extract EXUpdatesEnabled raw ios/DondeBailarMX/Supporting/Expo.plist 2>/dev/null || echo "no encontrado")
        EX_UPDATES_URL=$(plutil -extract EXUpdatesURL raw ios/DondeBailarMX/Supporting/Expo.plist 2>/dev/null || echo "no encontrado")
        echo "  EXUpdatesEnabled: $EX_UPDATES_ENABLED"
        echo "  EXUpdatesURL: $EX_UPDATES_URL"
    else
        echo "  (plutil no disponible, revisa el archivo manualmente)"
    fi
else
    echo -e "${YELLOW}⚠${NC} Expo.plist no encontrado"
fi

echo ""

# 5. Verificar espacio en disco (si es posible)
echo "💾 5. Verificando espacio en disco..."
echo ""

if command_exists df; then
    echo "Espacio disponible en el sistema:"
    df -h / | tail -1
    echo ""
    echo -e "${YELLOW}⚠${NC} El log muestra que se necesitan ~9-10 GB para actualizaciones"
    echo "   Asegúrate de tener al menos 15 GB libres en el dispositivo iOS"
else
    echo -e "${YELLOW}⚠${NC} No se puede verificar espacio (revisa manualmente en el dispositivo)"
fi

echo ""

# 6. Información del sistema
echo "🖥️  6. Información del sistema..."
echo ""

if command_exists sw_vers; then
    echo "Versión de macOS:"
    sw_vers
    echo ""
fi

if command_exists xcodebuild; then
    echo "Versión de Xcode:"
    xcodebuild -version 2>/dev/null || echo "Xcode no disponible"
    echo ""
fi

echo ""

# 7. Recomendaciones
echo "💡 7. Recomendaciones..."
echo ""

echo "1. Si el error aparece en logs pero la app funciona:"
echo "   - Puede ser un error del sistema iOS que no afecta tu app"
echo "   - Considera ignorarlo si no hay problemas de funcionalidad"
echo ""

echo "2. Si el error afecta la funcionalidad:"
echo "   - Reinicia el dispositivo iOS"
echo "   - Libera espacio (mínimo 15 GB recomendado)"
echo "   - Verifica actualizaciones del sistema iOS pendientes"
echo "   - Completa cualquier actualización pendiente del sistema"
echo ""

echo "3. Para obtener más detalles:"
echo "   - Usa Console.app en macOS (Aplicaciones > Utilidades)"
echo "   - Conecta el dispositivo iOS y selecciona en la barra lateral"
echo "   - Busca por: 'MobileSoftwareUpdate', 'error 78', 'softwareupdateservicesd'"
echo ""

echo "4. Si planeas habilitar Expo Updates:"
echo "   - Cambia 'enabled: false' a 'enabled: true' en app.config.ts"
echo "   - Regenera archivos nativos: npx expo prebuild --platform ios --clean"
echo "   - Haz un nuevo build: eas build --platform ios"
echo ""

echo "=========================================================="
echo "✅ Diagnóstico completado"
echo ""
echo "📚 Para más información, consulta: DIAGNOSTICO_ERROR_OTA_IOS.md"
echo ""

