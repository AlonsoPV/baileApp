# 📋 Configuración de Datos - Dirección de Correo Electrónico - Google Play Console

Respuestas específicas para configurar el tipo de dato "Dirección de correo electrónico" en Google Play Console.

---

## 1. ¿Estos datos se recopilan, se comparten o ambas?

**Seleccionar:**
- ✅ **Recopilados**
- ✅ **Compartidos**

**Justificación:**
- **Recopilados:** El email se envía desde el dispositivo del usuario al desarrollador y se almacena en la base de datos (Supabase Auth y profiles_user)
- **Compartidos:** El email se comparte con:
  - Supabase (proveedor de backend, necesario para autenticación)
  - Google OAuth (solo durante proceso de autenticación OAuth, si el usuario elige usar Google)
  - Servicios de email (Supabase envía emails de autenticación y notificaciones)

**Nota:** El email NO se comparte con usuarios públicos (no se muestra en perfiles públicos).

---

## 2. ¿Estos datos se procesan de forma efímera?

**Respuesta:** ❌ **No, los datos recopilados NO se procesan de forma efímera**

**Justificación:**
- El email se almacena de forma persistente en la base de datos (Supabase PostgreSQL)
- El email se guarda en:
  - `auth.users.email` (Supabase Auth - almacenamiento permanente)
  - `profiles_user.email` (opcional, puede duplicarse del auth)
- El email permanece almacenado mientras el usuario tenga cuenta activa
- El email NO se almacena solo en memoria ni se elimina después de procesar una solicitud
- El email se usa continuamente para:
  - Autenticación (login, recuperación de contraseña)
  - Envío de Magic Links
  - Notificaciones por email
  - Comunicación con el usuario

---

## 3. ¿Estos datos son necesarios para tu app o los usuarios pueden decidir si se recopilan o no?

**Respuesta:** ✅ **La recopilación de datos es necesaria (los usuarios no pueden desactivar esta opción)**

**Justificación:**
- El email es **obligatorio** para crear una cuenta
- El usuario **NO puede** crear una cuenta sin proporcionar un email
- El email es necesario para:
  - Autenticación (login, recuperación de contraseña)
  - Envío de Magic Links (método principal de autenticación)
  - Verificación de cuenta
  - Notificaciones por email
  - Funcionalidades básicas de la app
- El usuario **NO puede** desactivar la recopilación del email, ya que es esencial para el funcionamiento de la app

**Nota:** Aunque el email es obligatorio, el usuario puede elegir qué email usar (puede usar cualquier email válido).

---

## 4. ¿Por qué se recopilan los datos de los usuarios?

**Seleccionar las siguientes opciones:**
- ✅ **Funciones de la app**
- ✅ **Administración de la cuenta**
- ✅ **Comunicaciones del desarrollador**

**Justificación detallada:**

### ✅ Funciones de la app
- El email se usa para habilitar funciones esenciales de la app:
  - Autenticación (login, registro, recuperación de contraseña)
  - Envío de Magic Links (método principal de autenticación sin contraseña)
  - Verificación de cuenta
  - Funcionalidades que requieren identificación del usuario

### ✅ Administración de la cuenta
- El email se usa para configurar y administrar la cuenta:
  - Crear y configurar la cuenta del usuario
  - Identificar la cuenta del usuario de forma única
  - Gestionar autenticación y sesiones
  - Recuperación de cuenta (reset de contraseña, recuperación de PIN)

### ✅ Comunicaciones del desarrollador
- El email se usa para comunicar noticias y notificaciones:
  - Notificaciones sobre actualizaciones de seguridad
  - Notificaciones sobre nuevas funciones
  - Notificaciones sobre actividad en la app (RSVPs, eventos, etc.)
  - Comunicaciones importantes relacionadas con la cuenta

**NO se selecciona:**
- ❌ **Estadísticas** - El email no se usa para estadísticas de uso o rendimiento
- ❌ **Publicidad o marketing** - El email no se usa para publicidad
- ❌ **Seguridad, cumplimiento y prevención de fraudes** - Aunque el email puede ayudar en seguridad, no es el propósito principal de recopilación
- ❌ **Personalización** - El email no se usa para personalizar contenido (se usa el nombre y preferencias para esto)

---

## 5. ¿Para qué se usan y comparten los datos de los usuarios?

**Seleccionar las siguientes opciones:**
- ✅ **Funciones de la app**
- ✅ **Administración de la cuenta**
- ✅ **Comunicaciones del desarrollador**

**Justificación detallada:**

### ✅ Funciones de la app
- **Uso:** El email se usa para habilitar funciones esenciales:
  - Autenticación (login con email/contraseña, Magic Link, OAuth)
  - Verificación de cuenta
  - Funcionalidades que requieren identificación del usuario
- **Compartición:** Se comparte con:
  - Supabase (proveedor de backend, necesario para autenticación)
  - Google OAuth (solo durante autenticación, si el usuario elige usar Google)
  - Servicios de email (para envío de Magic Links y notificaciones)

### ✅ Administración de la cuenta
- **Uso:** El email se usa para configurar y administrar la cuenta:
  - Crear y configurar la cuenta del usuario
  - Identificar la cuenta de forma única
  - Gestionar autenticación y sesiones
  - Recuperación de cuenta
- **Compartición:** Se comparte con Supabase (proveedor de backend) para almacenamiento y gestión de la cuenta

### ✅ Comunicaciones del desarrollador
- **Uso:** El email se usa para comunicar noticias y notificaciones:
  - Notificaciones sobre actividad en la app
  - Actualizaciones importantes
  - Comunicaciones relacionadas con la cuenta
- **Compartición:** Se comparte con servicios de email (a través de Supabase) para envío de comunicaciones

**NO se selecciona:**
- ❌ **Estadísticas** - El email no se usa para análisis de uso o rendimiento
- ❌ **Publicidad o marketing** - El email no se usa para publicidad
- ❌ **Seguridad, cumplimiento y prevención de fraudes** - Aunque puede ayudar, no es el propósito principal
- ❌ **Personalización** - El email no se usa para personalizar contenido

---

## 📋 RESUMEN PARA COPIAR EN GOOGLE PLAY CONSOLE

### Dirección de correo electrónico

1. **¿Estos datos se recopilan, se comparten o ambas?**
   - ✅ Recopilados
   - ✅ Compartidos

2. **¿Estos datos se procesan de forma efímera?**
   - ❌ No, los datos recopilados NO se procesan de forma efímera

3. **¿Estos datos son necesarios para tu app o los usuarios pueden decidir si se recopilan o no?**
   - ✅ La recopilación de datos es necesaria (los usuarios no pueden desactivar esta opción)

4. **¿Por qué se recopilan los datos de los usuarios?**
   - ✅ Funciones de la app
   - ✅ Administración de la cuenta
   - ✅ Comunicaciones del desarrollador

5. **¿Para qué se usan y comparten los datos de los usuarios?**
   - ✅ Funciones de la app
   - ✅ Administración de la cuenta
   - ✅ Comunicaciones del desarrollador

---

## 🔒 NOTAS IMPORTANTES

### Compartición del email:
- **Con Supabase**: Necesario para funcionamiento (almacenamiento, autenticación)
- **Con Google OAuth**: Solo durante autenticación (si el usuario elige usar Google)
- **Con servicios de email**: Para envío de Magic Links y notificaciones
- **Con usuarios públicos**: NO (el email no se muestra en perfiles públicos)
- **Con terceros para publicidad**: NO

### Seguridad:
- El email se almacena de forma segura en Supabase Auth
- El email se transmite encriptado (HTTPS/TLS)
- El email no se muestra públicamente en la app
- Los usuarios pueden solicitar eliminación de su email al eliminar su cuenta

---

**Última actualización:** Enero 2025

