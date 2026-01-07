# 🔧 Solución: Error de Sincronización de Capacidades

## ❌ Error Encontrado

```
Failed to patch capabilities: [ { capabilityType: 'APPLE_ID_AUTH', option: 'OFF' } ]
✖ Failed to sync capabilities com.tuorg.dondebailarmx
There is a problem with the request entity - The bundle 'DK633DXY6A' cannot be deleted. 
Delete all the Apps related to this bundle to proceed.
```

## 🔍 Causa

EAS está intentando sincronizar automáticamente las capacidades del Bundle ID (`com.tuorg.dondebailarmx`), pero hay un conflicto porque:

1. Ya existe una app en App Store Connect relacionada con este Bundle ID
2. EAS intenta modificar/eliminar capacidades que están en uso
3. Apple no permite eliminar capacidades si hay apps activas

## ✅ Solución Implementada

Se ha agregado la variable de entorno `EXPO_NO_CAPABILITY_SYNC=1` en los perfiles de build de iOS en `eas.json`.

Esto deshabilita la sincronización automática de capacidades, permitiendo que el build continúe sin intentar modificar las capacidades del Bundle ID.

### Cambios en `eas.json`

```json
{
  "build": {
    "preview": {
      "ios": {
        "env": {
          "EXPO_NO_CAPABILITY_SYNC": "1"
        }
      }
    },
    "production": {
      "ios": {
        "env": {
          "EXPO_NO_CAPABILITY_SYNC": "1"
        }
      }
    }
  }
}
```

## 🚀 Próximos Pasos

Ahora puedes generar el build sin problemas:

```bash
# Generar build de producción
pnpm build:prod:ios

# O build de preview
pnpm build:preview:ios
```

## 📝 Notas Importantes

1. **Capacidades manuales**: Si necesitas modificar capacidades del Bundle ID (como Sign in with Apple, Push Notifications, etc.), hazlo manualmente en:
   - [Apple Developer Console](https://developer.apple.com/account/resources/identifiers/bundleId/edit/DK633DXY6A)

2. **No afecta el build**: Esta configuración NO afecta la funcionalidad del build, solo deshabilita la sincronización automática de capacidades.

3. **Seguridad**: Las capacidades existentes en tu Bundle ID se mantienen intactas. Solo se evita que EAS intente modificarlas automáticamente.

## 🔍 Verificación

Después de generar el build, verifica que:

- ✅ El build se completa exitosamente
- ✅ No aparecen errores de sincronización de capacidades
- ✅ El `.ipa` se genera correctamente
- ✅ Puedes subirlo a TestFlight/App Store

---

**Última actualización**: Enero 2025

