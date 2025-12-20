# Evaluación: APIs Obsoletas Edge-to-Edge en Android 15

## 📋 Resumen del Problema

Google Play Console está reportando que tu app usa APIs obsoletas relacionadas con edge-to-edge que fueron deprecadas en Android 15:

### APIs Obsoletas Detectadas:
- `android.view.Window.getStatusBarColor`
- `android.view.Window.setStatusBarColor`
- `android.view.Window.setNavigationBarColor`
- `android.view.Window.getNavigationBarColor`
- `LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES`
- `LAYOUT_IN_DISPLAY_CUTOUT_MODE_DEFAULT`

### Ubicaciones del Problema:
1. **React Native Core** (`StatusBarModule`)
2. **react-native-screens** (`ScreenWindowTraits`)
3. **Material Design Components** (BottomSheetDialog, SheetDialog)
4. **React Native View** (`WindowUtilKt`)

---

## 🔍 Análisis del Impacto

### Estado Actual del Proyecto:
- ✅ **Expo SDK**: 54.0.30
- ✅ **React Native**: 0.81.4
- ✅ **react-native-screens**: 4.16.0
- ✅ **expo-status-bar**: 3.0.9
- ⚠️ **edgeToEdgeEnabled**: `true` en `app.config.ts`

### Componentes Afectados:
1. **`App.tsx`**: Usa `<StatusBar style="auto" />` de `expo-status-bar` ✅ (OK)
2. **`src/components/Header.tsx`**: Usa `StatusBar` de `react-native` ⚠️ (PROBLEMA)
3. **`src/components/OffCanvasMenu.tsx`**: Usa `StatusBar` de `react-native` ⚠️ (PROBLEMA)

### Impacto en Usuarios:
- **Android 14 y anteriores**: ✅ Funciona normalmente
- **Android 15**: ⚠️ Advertencia en Play Console, pero la app sigue funcionando
- **Android 16+ (futuro)**: ❌ Posible que estas APIs sean removidas completamente

---

## ✅ Soluciones Recomendadas

### Opción 1: Migrar a `expo-status-bar` (RECOMENDADO)

**Ventajas:**
- ✅ Ya está instalado y actualizado
- ✅ Compatible con Android 15+
- ✅ Maneja automáticamente edge-to-edge
- ✅ Menos código nativo

**Pasos:**
1. Reemplazar `StatusBar` de `react-native` por `expo-status-bar` en todos los componentes
2. Ajustar props según la API de `expo-status-bar`

### Opción 2: Actualizar Dependencias

**Ventajas:**
- ✅ Solución a largo plazo
- ✅ Mejoras de rendimiento y seguridad

**Desventajas:**
- ⚠️ Puede requerir cambios en el código
- ⚠️ Necesita testing exhaustivo

**Dependencias a actualizar:**
- `react-native-screens`: 4.16.0 → 4.17.0+ (tiene fixes para Android 15)
- Considerar actualizar Expo SDK si hay una versión más reciente

### Opción 3: Deshabilitar Edge-to-Edge Temporalmente

**Solo si no es crítico para tu UX:**
- Cambiar `edgeToEdgeEnabled: false` en `app.config.ts`
- **NO RECOMENDADO** si ya estás usando edge-to-edge en producción

---

## 🚀 Plan de Acción Recomendado

### Fase 1: Migración Inmediata (Alto Impacto, Bajo Esfuerzo)
1. ✅ Reemplazar `StatusBar` de React Native por `expo-status-bar` en:
   - `src/components/Header.tsx`
   - `src/components/OffCanvasMenu.tsx`
2. ✅ Verificar que `App.tsx` ya usa `expo-status-bar` (✅ ya está correcto)

### Fase 2: Actualización de Dependencias (Medio Plazo)
1. Actualizar `react-native-screens` a la última versión compatible con Expo 54
2. Verificar changelog para fixes de Android 15

### Fase 3: Monitoreo
1. Probar en Android 15 (emulador o dispositivo físico)
2. Verificar que Play Console ya no muestre advertencias
3. Monitorear crash reports después del despliegue

---

## 📝 Notas Técnicas

### Diferencias entre APIs:

**React Native `StatusBar` (antes):**
```typescript
import { StatusBar } from 'react-native';
<StatusBar 
  barStyle="light-content" 
  backgroundColor="#000" 
/>
```

**expo-status-bar (ahora):**
```typescript
import { StatusBar } from 'expo-status-bar';
<StatusBar style="light" /> // o "auto" | "dark"
```

### Edge-to-Edge en Android 15:
- Android 15 introduce nuevas APIs para manejar edge-to-edge
- Las APIs antiguas (`setStatusBarColor`, etc.) siguen funcionando pero están deprecadas
- Google recomienda migrar a las nuevas APIs para evitar problemas futuros

---

## ⚠️ Advertencias

1. **No deshabilites edge-to-edge** si ya lo estás usando en producción sin testing
2. **Prueba en Android 15** antes de desplegar a producción
3. **Mantén un backup** de la versión anterior por si hay regresiones

---

## 📚 Referencias

- [Android 15 Edge-to-Edge Migration Guide](https://developer.android.com/develop/ui/views/layout/edge-to-edge)
- [Expo StatusBar Documentation](https://docs.expo.dev/versions/latest/sdk/status-bar/)
- [React Native Screens Changelog](https://github.com/software-mansion/react-native-screens/releases)

