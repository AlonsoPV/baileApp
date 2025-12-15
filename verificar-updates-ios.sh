#!/bin/bash
# Script para verificar las claves de Expo Updates en iOS

echo "🔍 Buscando archivos .plist en iOS..."
echo ""

# Buscar archivos .plist
PLIST_FILES=$(find ios -name "*.plist" -type f 2>/dev/null)

if [ -z "$PLIST_FILES" ]; then
    echo "❌ No se encontraron archivos .plist"
    echo "   El directorio ios/ no existe o no se han generado los archivos nativos."
    echo "   Ejecuta: eas build --profile developmentClient --platform ios"
    exit 1
fi

echo "✅ Archivos .plist encontrados:"
echo "$PLIST_FILES"
echo ""

# Verificar claves en cada archivo
for plist in $PLIST_FILES; do
    echo "📄 Verificando: $plist"
    
    # Verificar EXUpdatesURL
    if plutil -extract EXUpdatesURL raw "$plist" 2>/dev/null || plutil -extract EXUpdatesUrl raw "$plist" 2>/dev/null; then
        URL=$(plutil -extract EXUpdatesURL raw "$plist" 2>/dev/null || plutil -extract EXUpdatesUrl raw "$plist" 2>/dev/null)
        echo "   ✅ EXUpdatesURL: $URL"
    else
        echo "   ❌ EXUpdatesURL: NO ENCONTRADO"
    fi
    
    # Verificar EXUpdatesRuntimeVersion
    if plutil -extract EXUpdatesRuntimeVersion raw "$plist" 2>/dev/null; then
        VERSION=$(plutil -extract EXUpdatesRuntimeVersion raw "$plist" 2>/dev/null)
        echo "   ✅ EXUpdatesRuntimeVersion: $VERSION"
    else
        echo "   ❌ EXUpdatesRuntimeVersion: NO ENCONTRADO"
    fi
    
    # Verificar EXUpdatesEnabled
    if plutil -extract EXUpdatesEnabled raw "$plist" 2>/dev/null; then
        ENABLED=$(plutil -extract EXUpdatesEnabled raw "$plist" 2>/dev/null)
        echo "   ✅ EXUpdatesEnabled: $ENABLED"
    else
        echo "   ❌ EXUpdatesEnabled: NO ENCONTRADO"
    fi
    
    echo ""
done

echo "✨ Verificación completada"

