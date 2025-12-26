# 📋 Resumen de Respuestas para App Review - Apple

Este documento resume las respuestas a los tres problemas reportados por Apple App Review.

---

## 1. Guideline 5.1.2 - Privacy - Data Use and Sharing (Tracking)

### Problema
Apple indica que la app recopila datos para tracking pero no usa App Tracking Transparency.

### Solución
**La app NO rastrea usuarios.** La solución es actualizar la información de privacidad en App Store Connect.

### Acciones Requeridas:

1. **En App Store Connect → App Privacy:**
   - Para cada categoría de datos marcada como "SÍ":
     - Cambiar "¿Se usa para rastrear al usuario?" → **"NO"**
   - Categorías a actualizar:
     - Other User Content
     - Product Interaction
     - Other Usage Data
     - Other Diagnostic Data
     - Email Address
     - Name
     - Search History
     - Customer Support
     - Purchase History
     - User ID
     - Performance Data
     - Crash Data
     - Other Contact Info

2. **Responder en Resolution Center:**
   - Usar el mensaje de `APP_REVIEW_REPLY_5_1_2_TRACKING.md`
   - Explicar que la app NO rastrea usuarios
   - Indicar que la información de privacidad ha sido actualizada

3. **Review Notes al reenviar:**
   ```
   La app NO rastrea usuarios. La información de privacidad ha sido 
   actualizada en App Store Connect para reflejar que los datos recopilados 
   NO se usan para rastreo entre apps o sitios web.
   ```

### Documentos de Referencia:
- `APP_REVIEW_REPLY_5_1_2_TRACKING.md`
- `SOLUCION_APP_TRACKING_TRANSPARENCY.md`
- `DECLARACION_PRIVACIDAD_APPLE.md`

---

## 2. Guideline 4.8 - Design - Login Services

### Problema
Apple indica que la app usa un servicio de login de terceros pero no ofrece una alternativa equivalente (como Sign in with Apple).

### Solución
**La app YA incluye Sign in with Apple.** Solo necesitamos informar a Apple.

### Acciones Requeridas:

1. **Verificar que Sign in with Apple esté visible:**
   - ✅ Ya implementado en `Login.tsx`
   - ✅ Botón "Continuar con Apple" visible en pantalla de login
   - ✅ Funcionalidad completa implementada

2. **Responder en Resolution Center:**
   - Usar el mensaje de `APP_REVIEW_REPLY_4_8_LOGIN.md`
   - Indicar que Sign in with Apple ya está disponible
   - Explicar dónde encontrarlo (pantalla de login)
   - Detallar cómo cumple con los requisitos

3. **Review Notes al reenviar:**
   ```
   La app incluye Sign in with Apple como opción de login equivalente.
   Puede encontrarse en la pantalla de login como "Continuar con Apple".
   Cumple con todos los requisitos de Guideline 4.8.
   ```

### Documentos de Referencia:
- `APP_REVIEW_REPLY_4_8_LOGIN.md`
- `SIGN_IN_WITH_APPLE_SETUP.md`
- `APP_REVIEW_REPLY_4_8.md`

---

## 3. Guideline 1.5 - Safety (Support URL)

### Problema
La URL de soporte (`https://dondebailar.com.mx/soporte`) no funciona o muestra error.

### Solución
**La página de soporte ya existe y está funcional.** Verificar que la URL esté correctamente configurada.

### Acciones Requeridas:

1. **Verificar que la página funcione:**
   - ✅ Ruta configurada: `/soporte`
   - ✅ Componente: `SupportScreen.tsx`
   - ✅ URL: `https://dondebailar.com.mx/soporte`
   - ✅ Accesible desde web y móvil

2. **Actualizar Support URL en App Store Connect (si es necesario):**
   - App Store Connect → App Information → Support URL
   - Verificar que sea: `https://dondebailar.com.mx/soporte`

3. **Responder en Resolution Center:**
   - Usar el mensaje de `APP_REVIEW_REPLY_1_5_SUPPORT.md`
   - Confirmar que la URL está funcional
   - Proporcionar detalles de la página de soporte

4. **Review Notes al reenviar:**
   ```
   La URL de soporte (https://dondebailar.com.mx/soporte) está funcional 
   y accesible. Incluye información de contacto, email y WhatsApp.
   ```

### Documentos de Referencia:
- `APP_REVIEW_REPLY_1_5_SUPPORT.md`
- `apps/web/src/screens/static/SupportScreen.tsx`

---

## 📝 Checklist Final Antes de Reenviar

### Guideline 5.1.2 (Tracking):
- [ ] Información de privacidad actualizada en App Store Connect
- [ ] Todas las categorías marcadas como "NO se usa para rastreo"
- [ ] Respuesta enviada en Resolution Center
- [ ] Review Notes actualizadas

### Guideline 4.8 (Login Services):
- [ ] Verificado que Sign in with Apple está visible en login
- [ ] Respuesta enviada en Resolution Center explicando la ubicación
- [ ] Review Notes actualizadas

### Guideline 1.5 (Support URL):
- [ ] Verificado que `/soporte` funciona correctamente
- [ ] Support URL actualizada en App Store Connect (si necesario)
- [ ] Respuesta enviada en Resolution Center
- [ ] Review Notes actualizadas

### General:
- [ ] Todos los documentos de respuesta creados
- [ ] App reenviada para revisión
- [ ] Review Notes incluyen referencias a los cambios

---

## 🚀 Próximos Pasos

1. **Actualizar App Store Connect:**
   - App Privacy → Marcar todas las categorías como "NO se usa para rastreo"
   - App Information → Verificar Support URL

2. **Responder en Resolution Center:**
   - Copiar y pegar las respuestas de los archivos `.md` correspondientes
   - Personalizar si es necesario

3. **Reenviar para Revisión:**
   - Incluir todas las Review Notes mencionadas
   - Asegurarse de que la versión incluya todos los cambios

---

**Última actualización:** Enero 2025

