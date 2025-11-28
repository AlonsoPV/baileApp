# 📋 Información Personal Recopilada - Google Play Console

Respuestas a las categorías de información personal que recopila la app "Donde Bailar MX".

---

## ✅ Información Personal Recopilada

### 1. **Nombre** ✅
**SÍ se recopila**

- **Campo:** `display_name` (nombre público)
- **Ubicación:** Tabla `profiles_user`
- **Requerido:** Sí (obligatorio durante onboarding)
- **Uso:** Se muestra públicamente en el perfil del usuario
- **Opcional:** No, es obligatorio para crear una cuenta

---

### 2. **Dirección de correo electrónico** ✅
**SÍ se recopila**

- **Campo:** `email`
- **Ubicación:** 
  - `auth.users` (Supabase Auth - requerido para autenticación)
  - `profiles_user.email` (opcional, puede duplicarse del auth)
- **Requerido:** Sí (obligatorio para crear cuenta)
- **Uso:** 
  - Autenticación (login, recuperación de contraseña)
  - Envío de Magic Links
  - Notificaciones por email
  - Comunicación con el usuario
- **Opcional:** No, es obligatorio para crear una cuenta

---

### 3. **ID de usuario** ✅
**SÍ se recopila (automáticamente)**

- **Campo:** `user_id` (UUID)
- **Ubicación:** 
  - `auth.users.id` (generado automáticamente por Supabase)
  - `profiles_user.user_id` (clave foránea)
- **Requerido:** Sí (generado automáticamente)
- **Uso:** 
  - Identificación única del usuario en el sistema
  - Relaciones con otros datos (perfiles, eventos, RSVPs, etc.)
- **Opcional:** No, se genera automáticamente al crear la cuenta

---

### 4. **Dirección** ⚠️
**PARCIALMENTE se recopila (solo para ciertos perfiles)**

- **Campos:** 
  - `ubicacion` (para academias)
  - `ubicaciones` (array, para maestros)
  - `direccion` (dentro de ubicaciones)
- **Ubicación:** 
  - `profiles_academy.ubicacion`
  - `profiles_teacher.ubicaciones[]`
- **Requerido:** No (opcional)
- **Uso:** 
  - Mostrar ubicación física de academias y maestros
  - Búsqueda y filtrado geográfico
  - Información de contacto para clases/eventos
- **Opcional:** Sí, solo se recopila si el usuario crea un perfil de academia o maestro y decide proporcionarla
- **Nota:** Los usuarios regulares NO proporcionan dirección física, solo seleccionan una "zona" geográfica (ej: "Ciudad de México", "Guadalajara") de un catálogo predefinido

---

### 5. **Número de teléfono** ⚠️
**PARCIALMENTE se recopila (solo como WhatsApp, opcional)**

- **Campo:** `whatsapp` (dentro de `redes_sociales` o `respuestas.redes`)
- **Ubicación:** 
  - `profiles_user.respuestas.redes.whatsapp`
  - `profiles_teacher.redes_sociales.whatsapp`
  - `profiles_brand.whatsapp_number`
- **Requerido:** No (opcional)
- **Uso:** 
  - Contacto a través de WhatsApp
  - Enlaces de WhatsApp para productos (marcas)
- **Opcional:** Sí, el usuario puede elegir proporcionarlo o no
- **Nota:** No se recopila número de teléfono tradicional, solo número de WhatsApp si el usuario decide compartirlo

---

### 6. **Raza y etnia** ❌
**NO se recopila**

- La app NO solicita ni almacena información sobre raza o etnia de los usuarios.

---

### 7. **Creencias políticas y religiosas** ❌
**NO se recopila**

- La app NO solicita ni almacena información sobre creencias políticas o religiosas de los usuarios.

---

### 8. **Orientación sexual** ❌
**NO se recopila**

- La app NO solicita ni almacena información sobre orientación sexual de los usuarios.

---

### 9. **Otra información** ✅
**SÍ se recopila (varios tipos)**

#### 9.1 Información del Perfil
- **Biografía (`bio`)**: Texto libre sobre el usuario (opcional)
- **Foto de perfil (`avatar_url`)**: Imagen subida por el usuario (opcional)
- **Rol de baile (`rol_baile`)**: 'lead', 'follow', o 'ambos' (opcional)
- **Ritmos preferidos (`ritmos`, `ritmos_seleccionados`)**: Array de ritmos de baile seleccionados (requerido al menos uno)
- **Zona geográfica (`zonas`)**: Una zona seleccionada de un catálogo predefinido (requerido)

#### 9.2 Redes Sociales (opcional)
- Instagram (URL o handle)
- TikTok (URL o handle)
- YouTube (URL o handle)
- Facebook (URL o handle)
- WhatsApp (número, opcional)

#### 9.3 Información Adicional (opcional)
- **Dato curioso (`dato_curioso`)**: Texto libre
- **Por qué le gusta bailar (`gusta_bailar`)**: Texto libre
- **Premios/logros (`premios`)**: Array de logros (opcional)
- **Media (`media`)**: Fotos y videos subidos por el usuario (opcional)

#### 9.4 Actividad del Usuario
- **RSVPs a eventos**: Eventos en los que el usuario ha marcado interés
- **Asistencias a clases**: Clases a las que el usuario ha mostrado interés
- **Notificaciones**: Historial de notificaciones recibidas

#### 9.5 Datos Técnicos (automáticos)
- **Dirección IP**: Recabada automáticamente por Supabase
- **Tipo de dispositivo**: Detectado por el navegador
- **Navegador y versión**: User-Agent
- **Sistema operativo**: Detectado por el navegador
- **Tokens de sesión**: Almacenados localmente para autenticación
- **Fecha de último acceso**: Timestamp de última actividad

#### 9.6 Datos de OAuth (si se usa Google OAuth)
- **Nombre completo**: Del perfil de Google (opcional)
- **Foto de perfil**: URL de la foto de Google (opcional)
- **ID del proveedor**: ID único en Google (automático)

---

## 📊 Resumen para Google Play Console

### Información Personal Recopilada:
- ✅ **Nombre** (obligatorio)
- ✅ **Dirección de correo electrónico** (obligatorio)
- ✅ **ID de usuario** (automático)
- ⚠️ **Dirección** (opcional, solo para academias/maestros)
- ⚠️ **Número de teléfono** (opcional, solo como WhatsApp)
- ❌ **Raza y etnia** (NO se recopila)
- ❌ **Creencias políticas y religiosas** (NO se recopila)
- ❌ **Orientación sexual** (NO se recopila)
- ✅ **Otra información** (biografía, foto, preferencias de baile, redes sociales, actividad, datos técnicos)

---

## 🔒 Privacidad y Seguridad

- Todos los datos se almacenan en Supabase (PostgreSQL) con Row Level Security (RLS) habilitado
- Los datos se transmiten encriptados (HTTPS/TLS)
- Los usuarios pueden editar o eliminar su información personal en cualquier momento
- Los usuarios pueden solicitar la eliminación completa de su cuenta y datos en: `https://dondebailar.com.mx/eliminar-cuenta`

---

**Última actualización:** Enero 2025

