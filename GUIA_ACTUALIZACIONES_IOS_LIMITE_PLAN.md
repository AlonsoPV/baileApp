# 📱 Guía: Actualizaciones iOS con Límites de Plan Expo

## ⚠️ Situación Actual

- **OTA Updates habilitado** en `app.config.ts` (`updates.enabled: true`)
- **Límite del plan Expo alcanzado** - Las actualizaciones OTA pueden no funcionar
- **Alternativa:** Usar builds completos cuando el plan no permita OTA

---

## 🔄 Estrategias de Actualización

### Opción 1: Actualización OTA (Cuando el plan lo permita)

#### Para cambios en JavaScript/React:
```bash
# Actualizar solo iOS
pnpm update:ios

# O actualizar todas las plataformas
pnpm update
```

**Ventajas:**
- ✅ Rápido (segundos/minutos)
- ✅ Sin rebuild necesario
- ✅ Sin nueva versión en App Store
- ✅ Los usuarios reciben la actualización automáticamente

**Limitaciones:**
- ⚠️ Solo funciona para cambios en JavaScript/React
- ⚠️ Requiere plan de Expo con límites adecuados
- ⚠️ Si el plan está al límite, fallará silenciosamente

**Verificar si funcionó:**
```bash
# Ver lista de actualizaciones publicadas
npx eas-cli update:list --platform ios
```

---

### Opción 2: Build Completo (Cuando OTA no está disponible)

#### Para cambios nativos, nueva versión, o cuando OTA falla:

```bash
# 1. Crear el build en EAS (15-30 minutos)
pnpm build:prod:ios

# 2. Subir automáticamente a App Store Connect
pnpm submit:ios
```

**Ventajas:**
- ✅ Funciona siempre (no depende del plan)
- ✅ Para cualquier tipo de cambio (nativo, JS, config)
- ✅ Nueva versión en App Store/TestFlight

**Desventajas:**
- ⏱️ Más lento (15-30 minutos de build)
- 📱 Requiere aprobación en TestFlight/App Store
- 🔨 Rebuild completo necesario

---

## 📊 Cuándo Usar Cada Opción

| Tipo de Cambio | Método Recomendado | Comando |
|----------------|-------------------|---------|
| Cambios en React/JavaScript | OTA (si plan permite) | `pnpm update:ios` |
| Cambios en React/JavaScript | Build completo (si OTA falla) | `pnpm build:prod:ios` → `pnpm submit:ios` |
| Cambios nativos | Build completo | `pnpm build:prod:ios` → `pnpm submit:ios` |
| Cambios en `app.config.ts` | Build completo | `pnpm build:prod:ios` → `pnpm submit:ios` |
| Nueva versión | Build completo | `pnpm build:prod:ios` → `pnpm submit:ios` |

---

## 🔍 Verificar Estado del Plan Expo

### 1. Verificar límites actuales:
```bash
# Ver información de tu cuenta
npx eas-cli whoami

# Ver uso de actualizaciones
npx eas-cli update:list --platform ios --limit 10
```

### 2. Verificar en el Dashboard:
- Ve a: https://expo.dev/accounts/[tu-cuenta]/projects/[tu-proyecto]
- Revisa la sección "Updates" para ver el uso actual
- Verifica los límites de tu plan

---

## 🛠️ Solución Temporal: Builds Completos

Si el plan de Expo está al límite, **usa builds completos** como solución temporal:

### Proceso Recomendado:

1. **Hacer cambios en el código**
2. **Commit y push:**
   ```bash
   git add .
   git commit -m "Descripción de cambios"
   git push
   ```

3. **Crear build y subir:**
   ```bash
   # Build + Submit en un solo proceso
   pnpm build:prod:ios
   pnpm submit:ios
   ```

4. **Aprobar en TestFlight:**
   - Ve a App Store Connect
   - TestFlight → Tu app → Builds
   - Aprobar el nuevo build para testers internos/externos

---

## 📝 Notas Importantes

### Sobre OTA Updates:
- ✅ **Habilitado** en `app.config.ts` (`updates.enabled: true`)
- ⚠️ **Requiere plan de Expo** con límites adecuados
- ⚠️ Si falla silenciosamente, el plan probablemente está al límite
- ✅ **Solo funciona para cambios en JavaScript/React**

### Sobre Builds Completos:
- ✅ **Siempre funciona** (no depende del plan)
- ✅ **Para cualquier tipo de cambio**
- ⏱️ **Más lento** pero más confiable
- 📱 **Requiere aprobación** en TestFlight/App Store

### Recomendación:
- **Usa OTA** para cambios rápidos en JS/React cuando el plan lo permita
- **Usa builds completos** cuando:
  - El plan está al límite
  - Necesitas cambios nativos
  - Necesitas una nueva versión
  - OTA falla o no está disponible

---

## 🔄 Actualizar el Plan de Expo (Opcional)

Si quieres usar OTA más frecuentemente:

1. **Ve a:** https://expo.dev/accounts/[tu-cuenta]/settings/billing
2. **Revisa los planes disponibles:**
   - **Free:** Límites básicos
   - **Production:** Más actualizaciones OTA
   - **Enterprise:** Sin límites
3. **Actualiza según tus necesidades**

---

## ✅ Checklist para Actualizaciones

### Para OTA (JavaScript/React):
- [ ] Verificar que `updates.enabled: true` en `app.config.ts`
- [ ] Verificar que el plan de Expo tiene límites disponibles
- [ ] Hacer cambios solo en JavaScript/React
- [ ] Ejecutar `pnpm update:ios`
- [ ] Verificar con `npx eas-cli update:list --platform ios`

### Para Build Completo:
- [ ] Hacer cambios (cualquier tipo)
- [ ] Commit y push a Git
- [ ] Ejecutar `pnpm build:prod:ios`
- [ ] Esperar a que termine el build (15-30 min)
- [ ] Ejecutar `pnpm submit:ios`
- [ ] Aprobar en TestFlight/App Store Connect

---

## 📚 Referencias

- [Expo Updates Documentation](https://docs.expo.dev/versions/latest/sdk/updates/)
- [EAS Update Limits](https://docs.expo.dev/eas-update/introduction/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)

