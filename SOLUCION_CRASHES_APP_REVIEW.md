# 🔧 Solución: Crashes y Errores en App Review

## 📋 Problemas Reportados por Apple

### 1. Crash al tomar foto
- **Problema**: La app se cae cuando el revisor intenta tomar una foto
- **Dispositivos**: iPad Air 11-inch (M3) y iPhone 17 Pro Max
- **OS**: iPadOS 26.2 y iOS 26.2

### 2. Error en registro de perfil
- **Problema**: Aparece un error al intentar continuar con el registro después de agregar foto y nombre
- **Pasos para reproducir**:
  1. Login en la app
  2. Agregar foto y nombre
  3. Tocar "Continuar"
  4. Aparece mensaje de error

---

## ✅ Correcciones Implementadas

### 1. Permisos de Cámara en Info.plist

**Problema**: Los permisos estaban definidos en `app.config.ts` pero no aparecían en `Info.plist`, causando crashes cuando iOS intentaba acceder a la cámara sin permisos.

**Solución**: Agregados los permisos directamente en `ios/DondeBailarMX/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>Necesitamos acceso a la cámara para tomar fotos de perfil y eventos.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Necesitamos acceso a tu galería para seleccionar fotos de perfil y eventos.</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>Permite guardar fotos en tu galería cuando lo desees.</string>
```

### 2. Manejo Mejorado de Errores en ProfileBasics.tsx

#### 2.1. Manejo de Cancelación de Selección de Foto
- **Antes**: No se manejaba silenciosamente cuando el usuario cancelaba
- **Ahora**: La cancelación se maneja sin mostrar errores al usuario

#### 2.2. Validación de Conexión
- **Agregado**: Verificación de `navigator.onLine` antes de subir imágenes
- **Agregado**: Verificación de conexión antes de actualizar el perfil
- **Mensaje**: "No hay conexión a internet. Por favor verifica tu conexión e intenta de nuevo."

#### 2.3. Mensajes de Error Específicos
- **Errores de autenticación**: "Error de autenticación. Por favor inicia sesión nuevamente."
- **Errores de red**: "Error de conexión. Verifica tu internet e intenta de nuevo."
- **Errores de tamaño**: "La imagen es demasiado grande. Por favor selecciona una imagen más pequeña."
- **Errores de base de datos**:
  - `PGRST301` / `23505`: "Este nombre ya está en uso. Por favor elige otro."
  - `PGRST116` / `23503`: "Error de validación. Por favor verifica los datos e intenta de nuevo."
  - `PGRST204` / `23502`: "Faltan datos requeridos. Por favor completa todos los campos obligatorios."

#### 2.4. Validación de Upload Exitoso
- **Agregado**: Verificación de que `uploadData` existe después del upload
- **Mensaje**: "Error al subir la imagen. No se recibió confirmación del servidor."

---

## 🧪 Pruebas Recomendadas

### Antes de Reenviar a App Review:

1. **Probar en dispositivos físicos iOS**:
   - iPhone con iOS 17+
   - iPad con iPadOS 17+
   - Verificar que los permisos de cámara se solicitan correctamente

2. **Probar flujo completo de registro**:
   - Login
   - Agregar foto (desde cámara y desde galería)
   - Agregar nombre
   - Tocar "Continuar"
   - Verificar que no aparezcan errores

3. **Probar casos de error**:
   - Sin conexión a internet
   - Cancelar selección de foto
   - Imagen demasiado grande
   - Nombre duplicado (si aplica)

4. **Probar en diferentes escenarios**:
   - Primera vez usando la app
   - Después de actualizar la app
   - Con permisos denegados (y luego otorgados)

---

## 📝 Checklist Antes de Reenviar

- [x] Permisos de cámara agregados en `Info.plist`
- [x] Manejo de errores mejorado en `ProfileBasics.tsx`
- [x] Validación de conexión antes de operaciones de red
- [x] Mensajes de error específicos y amigables
- [x] Manejo silencioso de cancelación de selección de foto
- [ ] Probar en dispositivos físicos iOS
- [ ] Probar flujo completo de registro
- [ ] Probar casos de error
- [ ] Verificar que no hay crashes en logs

---

## 🔗 Archivos Modificados

1. `ios/DondeBailarMX/Info.plist` - Permisos de cámara agregados
2. `apps/web/src/screens/onboarding/ProfileBasics.tsx` - Manejo de errores mejorado

---

## ⚠️ Notas Importantes

1. **Los permisos en `app.config.ts` deberían sincronizarse automáticamente**, pero en algunos casos (especialmente en bare workflow) es necesario agregarlos manualmente en `Info.plist`.

2. **El manejo de errores ahora es más robusto** y debería prevenir crashes al:
   - Validar permisos antes de acceder a la cámara
   - Manejar cancelaciones silenciosamente
   - Verificar conexión antes de operaciones de red
   - Proporcionar mensajes de error claros

3. **Después de estos cambios, es crucial probar en dispositivos físicos** antes de reenviar a App Review.

