# 🔒 Solución: App Tracking Transparency (ATT) - Rechazo Apple

## 📋 Resumen del Problema

Apple rechazó la app porque:
- En App Store Connect se marcó que la app recopila datos **"para rastrear al usuario"**
- Pero la app **NO está usando App Tracking Transparency (ATT)** para solicitar permiso

## ✅ Análisis de la Situación

### La app NO rastrea usuarios para publicidad:
- ❌ No usa Google Analytics
- ❌ No usa Facebook Pixel
- ❌ No usa servicios de publicidad de terceros
- ❌ No usa identificadores de publicidad (IDFA)
- ❌ No rastrea entre apps/sitios web

### La app SÍ recopila datos para funcionalidad básica:
- ✅ Autenticación (Supabase Auth)
- ✅ RSVPs a eventos
- ✅ Asistencias a clases
- ✅ Perfiles de usuario
- ✅ Contenido generado por usuarios

**Estos datos NO se usan para rastreo entre apps/sitios web.**

---

## 🎯 Solución Recomendada: Opción 1 (Actualizar App Store Connect)

### Paso 1: Actualizar Información de Privacidad en App Store Connect

1. Ve a **App Store Connect** → Tu app → **App Privacy**
2. Para cada categoría de datos que marcaste como "SÍ":
   - Busca la pregunta: **"¿Se usa para rastrear al usuario?"**
   - Cambia la respuesta a: **"NO"**
3. Específicamente, verifica estas categorías:
   - ✅ **Other User Content** → NO se usa para rastrear
   - ✅ **Product Interaction** → NO se usa para rastrear
   - ✅ **Other Usage Data** → NO se usa para rastrear
   - ✅ **Other Diagnostic Data** → NO se usa para rastrear
   - ✅ **Email Address** → NO se usa para rastrear
   - ✅ **Name** → NO se usa para rastrear
   - ✅ **Search History** → NO se usa para rastrear
   - ✅ **Customer Support** → NO se usa para rastrear
   - ✅ **Purchase History** → NO se usa para rastrear
   - ✅ **User ID** → NO se usa para rastrear
   - ✅ **Performance Data** → NO se usa para rastrear
   - ✅ **Crash Data** → NO se usa para rastrear
   - ✅ **Other Contact Info** → NO se usa para rastrear

### Paso 2: Responder al Rechazo en App Store Connect

1. Ve a **App Store Connect** → Tu app → **App Review** → **Resolution Center**
2. Responde al rechazo con este mensaje:

```
Estimado equipo de App Review,

Hemos actualizado la información de privacidad en App Store Connect. 
La app NO rastrea usuarios entre apps o sitios web para publicidad.

Los datos recopilados se usan únicamente para:
- Funcionalidad básica de la app (autenticación, perfiles)
- Gestión de RSVPs y asistencias a eventos/clases
- Comunicación con usuarios
- Diagnóstico técnico

La app NO utiliza:
- Identificadores de publicidad (IDFA)
- Servicios de analytics de terceros para publicidad
- Rastreo entre apps o sitios web

Por lo tanto, NO es necesario implementar App Tracking Transparency (ATT).

Hemos actualizado la información de privacidad para reflejar que estos datos 
NO se usan para rastreo.

Gracias por su revisión.
```

### Paso 3: Reenviar para Revisión

1. Asegúrate de que la información de privacidad esté actualizada
2. Reenvía la app para revisión
3. En las **Review Notes**, menciona:
   ```
   La app NO rastrea usuarios. La información de privacidad ha sido 
   actualizada en App Store Connect para reflejar que los datos recopilados 
   NO se usan para rastreo entre apps o sitios web.
   ```

---

## 🔧 Solución Alternativa: Opción 2 (Si Apple Insiste en ATT)

Si Apple insiste en que se está rastreando (aunque no sea cierto), puedes implementar ATT de forma preventiva:

### Paso 1: Instalar el paquete

```bash
pnpm add expo-tracking-transparency
```

### Paso 2: Agregar permiso en Info.plist

Agregar en `ios/DondeBailarMX/Info.plist`:

```xml
<key>NSUserTrackingUsageDescription</key>
<string>Esta app no rastrea usuarios. Este permiso se solicita por cumplimiento con políticas de Apple, pero no se utiliza para rastreo.</string>
```

### Paso 3: Implementar ATT (opcional, solo si es necesario)

Crear `apps/web/src/utils/trackingTransparency.ts`:

```typescript
import * as TrackingTransparency from 'expo-tracking-transparency';

export async function requestTrackingPermission(): Promise<boolean> {
  try {
    // Solo solicitar en iOS
    if (Platform.OS !== 'ios') {
      return true;
    }

    const { status } = await TrackingTransparency.requestTrackingPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.warn('Error requesting tracking permission:', error);
    return false;
  }
}
```

**Nota:** Esta implementación es opcional y solo necesaria si Apple insiste en ATT. La solución recomendada es la Opción 1.

---

## 📝 Verificación

### Checklist antes de reenviar:

- [ ] Información de privacidad actualizada en App Store Connect
- [ ] Todas las categorías marcadas como "NO se usa para rastreo"
- [ ] Respuesta enviada en Resolution Center
- [ ] Review Notes actualizadas
- [ ] App reenviada para revisión

---

## 🔗 Referencias

- [Apple App Tracking Transparency](https://developer.apple.com/documentation/apptrackingtransparency)
- [App Store Connect Privacy](https://developer.apple.com/app-store/app-privacy-details/)
- [Documentación de Privacidad de la App](./apps/web/DECLARACION_PRIVACIDAD_APPLE.md)

---

## ⚠️ Nota Importante

**La app NO rastrea usuarios.** La solución correcta es actualizar la información de privacidad en App Store Connect, NO implementar ATT. Solo implementa ATT si Apple insiste después de actualizar la información de privacidad.

