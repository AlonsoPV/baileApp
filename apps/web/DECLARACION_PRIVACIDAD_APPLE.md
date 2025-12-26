# 📋 Declaración de Privacidad - Apple App Store Connect

Mapeo de categorías de datos de Apple con los datos que recopila "Donde Bailar MX".

---

## ✅ DATOS RECOPILADOS

### 📞 Recopilación de datos
#### Datos de contacto

**✅ Nombre**
- **SÍ se recopila**
- Campo: `display_name` (nombre público)
- Ubicación: `profiles_user.display_name`
- Requerido: Sí (obligatorio durante onboarding)
- Uso: Se muestra públicamente en el perfil del usuario

**✅ Dirección de correo electrónico**
- **SÍ se recopila**
- Campo: `email`
- Ubicación: 
  - `auth.users.email` (Supabase Auth - requerido)
  - `profiles_user.email` (opcional)
- Requerido: Sí (obligatorio para crear cuenta)
- Uso: Autenticación, Magic Links, notificaciones, comunicación

**⚠️ Número de teléfono**
- **PARCIALMENTE se recopila**
- Campo: `telefono_contacto`, `whatsapp` (en redes sociales), `celular` (formulario "Quiero formar parte")
- Ubicación:
  - `events_date.telefono_contacto` (opcional, para eventos)
  - `profiles_user.respuestas.redes.whatsapp` (opcional, en perfil de usuario)
  - `profiles_teacher.redes_sociales.whatsapp` (opcional, en perfil de maestro)
  - Formulario "Quiero formar parte" (no se almacena en BD, se envía por email)
- Requerido: No (opcional)
- Nota: Solo para ciertos perfiles (maestros, organizadores) y en formularios opcionales

**⚠️ Dirección física**
- **PARCIALMENTE se recopila**
- Campos: `ubicacion`, `direccion`, `ciudad`
- Ubicación:
  - `profiles_academy.ubicacion` (para academias)
  - `profiles_teacher.ubicaciones[]` (array de ubicaciones para maestros)
  - `events_date.direccion`, `events_date.lugar` (para eventos)
- Requerido: No (opcional)
- Uso: Mostrar ubicación de academias, maestros y eventos

**✅ Otros datos de contacto del usuario**
- **SÍ se recopila**
- Campos: Redes sociales (Instagram, Facebook, TikTok, YouTube, WhatsApp)
- Ubicación: `profiles_user.respuestas.redes`, `profiles_teacher.redes_sociales`, etc.
- Uso: Mostrar enlaces de contacto en perfiles públicos

---

### ❌ Salud y forma física

**❌ Salud**
- **NO se recopila**

**❌ Forma física**
- **NO se recopila**

---

### 💰 Información financiera

**⚠️ Información de pago**
- **NO se recopila directamente por la app**
- La app utiliza Stripe como procesador de pagos
- Stripe procesa la información de pago externamente
- La app NO tiene acceso a números de tarjeta completos
- Solo se almacenan identificadores de cuenta Stripe (`stripe_account_id`, `stripe_customer_id`)
- **Nota para Apple**: Según las políticas de Apple, si la información de pago se introduce fuera de la app y el desarrollador nunca tiene acceso a ella, NO debe incluirse en las respuestas.

**❌ Información sobre crédito**
- **NO se recopila**

**❌ Otra información financiera**
- **NO se recopila** (solo se muestran precios de clases/eventos, pero no se almacenan datos financieros del usuario)

---

### 📍 Ubicación

**⚠️ Ubicación exacta**
- **NO se recopila directamente**
- La app NO accede a GPS o servicios de ubicación del dispositivo
- Solo se recopilan direcciones físicas proporcionadas manualmente por el usuario (para academias/maestros/eventos)

**⚠️ Ubicación aproximada**
- **NO se recopila directamente**
- La app NO accede a servicios de ubicación del dispositivo
- Solo se recopilan zonas/ciudades seleccionadas manualmente por el usuario en preferencias

---

### ❌ Datos sensibles

**❌ Datos sensibles**
- **NO se recopila explícitamente**
- La app NO solicita datos étnicos, raciales, orientación sexual, información médica, etc.
- Si un usuario decide compartir información sensible voluntariamente en campos abiertos (bio, respuestas), lo hace bajo su propia responsabilidad, pero la app no solicita ni categoriza estos datos

---

### ❌ Contactos

**❌ Contactos**
- **NO se recopila**
- La app NO accede a la agenda del teléfono, contactos o gráfico de red social del dispositivo

---

### 📸 Contenido del usuario

**✅ Correos electrónicos o mensajes de texto**
- **NO se recopila** (la app no gestiona correos/mensajes directamente)

**✅ Fotos o vídeos**
- **SÍ se recopila**
- Campos: `avatar_url`, `media` (array de fotos/videos), `portada_url`
- Ubicación:
  - `profiles_user.avatar_url`, `profiles_user.media`
  - `profiles_teacher.media`
  - `profiles_academy.media`
  - `events_parent.media`, `events_date.media`
- Requerido: No (opcional)
- Uso: Perfiles de usuario, galerías de academias/maestros, eventos

**❌ Datos de audio**
- **NO se recopila** (la app no graba audio)

**❌ Actividad en juegos**
- **NO se recopila**

**✅ Atención al cliente**
- **SÍ se recopila**
- Datos: Mensajes y solicitudes enviadas a través de formularios de contacto
- Ubicación: Formularios "Quiero formar parte", contactos
- Uso: Responder solicitudes de usuarios

**✅ Otro contenido del usuario**
- **SÍ se recopila**
- Campos: `bio`, `respuestas`, reseñas, comentarios
- Ubicación: 
  - `profiles_user.bio`, `profiles_user.respuestas`
  - Reseñas en perfiles de maestros/academias
- Uso: Mostrar información en perfiles públicos

**❌ Historial de navegación**
- **NO se recopila** (no se rastrea navegación fuera de la app)

**✅ Historial de búsqueda**
- **SÍ se recopila (implícitamente)**
- Datos: Búsquedas y filtros aplicados en la app
- Ubicación: Filtros de exploración (ritmos, zonas, fechas)
- Uso: Mejorar recomendaciones y funcionalidad de búsqueda
- Nota: Este dato es principalmente local y no se almacena permanentemente en la mayoría de casos

---

### 🆔 Identificadores

**✅ ID de usuario**
- **SÍ se recopila (automáticamente)**
- Campo: `user_id` (UUID)
- Ubicación: `auth.users.id`, `profiles_user.user_id`
- Requerido: Sí (generado automáticamente)
- Uso: Identificación única del usuario, relaciones con otros datos

**⚠️ ID del dispositivo**
- **NO se recopila directamente**
- La app utiliza servicios de terceros (Supabase, Expo) que pueden recopilar identificadores de dispositivo para funciones técnicas (autenticación, analytics)
- La app en sí NO solicita ni almacena identificadores de publicidad del dispositivo

---

### 🛒 Compras

**⚠️ Compras o tendencias de compra**
- **PARCIALMENTE se recopila**
- Datos: RSVPs a eventos, asistencias a clases
- Ubicación: 
  - `eventos_interesados` (RSVPs)
  - `clase_asistencias` (asistencias tentativas)
- Uso: Gestionar asistencia a eventos/clases
- Nota: No se rastrea si el usuario realizó un pago, solo su intención de asistir

---

### 📊 Datos de uso

**✅ Interacción con el producto**
- **SÍ se recopila**
- Datos: Lanzamientos de app, clics, navegación, visualizaciones
- Ubicación: Logs de actividad (implícitos en el uso de la app)
- Uso: Mejorar funcionalidad y experiencia de usuario
- Nota: Principalmente para funcionalidad básica de la app

**❌ Datos de publicidad**
- **NO se recopila** (la app no muestra publicidad de terceros)

**✅ Otros datos de uso**
- **SÍ se recopila**
- Datos: Actividad general del usuario en la app
- Uso: Funcionalidad de la app, personalización

---

### 🔧 Diagnósticos

**⚠️ Datos de errores**
- **SÍ se recopila (potencialmente)**
- La app puede recopilar logs de errores para diagnóstico
- Servicios utilizados: Supabase (logs del servidor), posiblemente servicios de Expo
- Uso: Diagnóstico técnico y resolución de problemas

**⚠️ Datos de rendimiento**
- **SÍ se recopila (potencialmente)**
- Datos: Tiempo de lanzamiento, tasas de error
- Servicios utilizados: Servicios de terceros (Expo, Supabase)
- Uso: Optimización de rendimiento

**⚠️ Otros datos de diagnóstico**
- **SÍ se recopila (potencialmente)**
- Servicios de terceros pueden recopilar datos técnicos
- Uso: Mantenimiento y diagnóstico técnico

---

### ❌ Entorno

**❌ Escaneo ambiental**
- **NO se recopila**

---

### ❌ Cuerpo

**❌ Manos**
- **NO se recopila**

**❌ Cabeza**
- **NO se recopila**

---

## 📝 RESUMEN PARA APP STORE CONNECT

### ✅ Marca estas categorías como "SÍ":

1. **Recopilación de datos → Datos de contacto:**
   - ✅ Nombre
   - ✅ Dirección de correo electrónico
   - ⚠️ Número de teléfono (opcional, solo para ciertos perfiles)
   - ⚠️ Dirección física (opcional, solo para academias/maestros/eventos)
   - ✅ Otros datos de contacto del usuario

2. **Contenido del usuario:**
   - ✅ Fotos o vídeos
   - ✅ Atención al cliente
   - ✅ Otro contenido del usuario
   - ✅ Historial de búsqueda

3. **Identificadores:**
   - ✅ ID de usuario

4. **Compras:**
   - ⚠️ Compras o tendencias de compra (RSVPs, asistencias)

5. **Datos de uso:**
   - ✅ Interacción con el producto
   - ✅ Otros datos de uso

6. **Diagnósticos:**
   - ⚠️ Datos de errores
   - ⚠️ Datos de rendimiento
   - ⚠️ Otros datos de diagnóstico

### ❌ Marca estas categorías como "NO":

- Salud y forma física
- Información de pago (Stripe procesa externamente, la app no tiene acceso)
- Ubicación exacta/aproximada (no se accede a GPS)
- Datos sensibles
- Contactos
- Correos electrónicos o mensajes de texto
- Datos de audio
- Actividad en juegos
- Historial de navegación
- ID del dispositivo (no directamente)
- Datos de publicidad
- Entorno
- Cuerpo

---

## 🔒 Finalidades del tratamiento (para cada categoría marcada como SÍ)

Para cada categoría que marques como "SÍ", deberás indicar las finalidades. Las principales son:

- **Funcionalidad de la app** (todas las categorías)
- **Personalización** (datos de uso, historial de búsqueda)
- **Análisis** (datos de uso, diagnósticos)
- **Comunicación con el usuario** (datos de contacto, atención al cliente)
- **Publicidad o marketing** (NO aplica - la app no muestra publicidad)
- **Desarrollo de producto** (datos de uso, diagnósticos)
- **Otras finalidades** (según corresponda)

---

## 🔗 Enlaces relevantes

- Aviso de Privacidad completo: `apps/web/src/screens/static/LegalScreen.tsx`
- Documentación detallada: `apps/web/DATOS_PRIVACIDAD.md`
- Declaración Google Play: `apps/web/INFORMACION_PERSONAL_GOOGLE_PLAY.md`

