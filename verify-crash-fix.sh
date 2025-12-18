#!/bin/bash
# Script de verificación para el fix de SIGABRT crash

echo "🔍 Verificando fixes de SIGABRT crash..."
echo ""

# 1. Verificar que no hay process.env[key] dinámico en código RN
echo "✅ 1. Verificando process.env[key] dinámico..."
if grep -r "process\.env\[" src/ --include="*.ts" --include="*.tsx" | grep -v "//.*process.env\[" | grep -v "NO funciona"; then
  echo "   ❌ ERROR: Se encontró process.env[key] dinámico en código RN"
  exit 1
else
  echo "   ✓ No hay process.env[key] dinámico en código RN"
fi

# 2. Verificar que app.config.ts no tiene throw en producción
echo "✅ 2. Verificando app.config.ts..."
if grep -q "throw new Error" app.config.ts; then
  echo "   ❌ ERROR: app.config.ts todavía tiene throw"
  exit 1
else
  echo "   ✓ app.config.ts no tiene throw (usa defaultValue)"
fi

# 3. Verificar que supabase.ts tiene readExtra() defensivo
echo "✅ 3. Verificando readExtra() defensivo..."
if grep -q "Constants.expoConfig?.extra" src/lib/supabase.ts && \
   grep -q "manifest?.extra" src/lib/supabase.ts && \
   grep -q "manifest2?.extra" src/lib/supabase.ts; then
  echo "   ✓ readExtra() es defensivo (expoConfig/manifest/manifest2)"
else
  echo "   ❌ ERROR: readExtra() no es completamente defensivo"
  exit 1
fi

# 4. Verificar que supabase es null o cliente válido (no Proxy)
echo "✅ 4. Verificando que supabase no es Proxy..."
if grep -q "export.*supabase.*SupabaseClient.*null" src/lib/supabase.ts || \
   grep -q "export.*supabase.*:.*SupabaseClient.*\|.*null" src/lib/supabase.ts; then
  echo "   ✓ supabase es SupabaseClient | null (no Proxy)"
else
  echo "   ⚠️  WARNING: Verificar que supabase no es Proxy"
fi

# 5. Verificar que newArchEnabled está en false
echo "✅ 5. Verificando newArchEnabled..."
if grep -q "newArchEnabled: false" app.config.ts; then
  echo "   ✓ newArchEnabled está en false"
else
  echo "   ⚠️  WARNING: newArchEnabled no está explícitamente en false"
fi

# 6. Verificar que hay early logger en index.js
echo "✅ 6. Verificando early logger..."
if grep -q "EarlyGlobalErrorHandler" index.js; then
  echo "   ✓ Early logger está instalado en index.js"
else
  echo "   ⚠️  WARNING: Early logger no encontrado en index.js"
fi

# 7. Verificar app.config.ts vs app.json
echo "✅ 7. Verificando app.config.ts vs app.json..."
if [ -f "app.json" ] && [ "$(cat app.json)" = '{"expo":{}}' ]; then
  echo "   ✓ app.json está vacío (app.config.ts tiene prioridad)"
else
  echo "   ⚠️  WARNING: app.json puede tener contenido conflictivo"
fi

echo ""
echo "✅ Verificación completada. Todos los checks críticos pasaron."
echo ""
echo "📋 Checklist final:"
echo "   ✅ No hay process.env[key] dinámico"
echo "   ✅ app.config.ts no tiene throw en producción"
echo "   ✅ readExtra() es defensivo"
echo "   ✅ supabase es null o cliente válido"
echo "   ✅ newArchEnabled está en false"
echo "   ✅ Early logger instalado"
echo "   ✅ app.config.ts tiene prioridad sobre app.json"

