# 📋 Cómo se Utilizan y Manejan los Datos - Google Play Console

Respuestas sobre recopilación y compartición de datos para la app "Donde Bailar MX".

---

## 📊 INFORMACIÓN PERSONAL

### 1. **Nombre** ✅

**Recopilados:** ✅ SÍ
- Se envía desde el dispositivo del usuario al desarrollador
- Se almacena en la base de datos (Supabase)
- Se recopila durante el proceso de registro/onboarding

**Compartidos:** ⚠️ PARCIALMENTE
- **Con Supabase**: SÍ (proveedor de backend, almacenamiento necesario)
- **Con usuarios públicos**: SÍ (el nombre público se muestra en perfiles públicos)
- **Con terceros para publicidad**: NO
- **Con otros servicios**: NO

**Uso:**
- Identificación del usuario en la plataforma
- Mostrar nombre en perfil público
- Personalización de experiencia
- Comunicación con el usuario

---

### 2. **Dirección de correo electrónico** ✅

**Recopilados:** ✅ SÍ
- Se envía desde el dispositivo del usuario al desarrollador
- Se almacena en la base de datos (Supabase Auth y profiles_user)
- Se recopila durante el proceso de registro

**Compartidos:** ⚠️ PARCIALMENTE
- **Con Supabase**: SÍ (proveedor de backend, necesario para autenticación)
- **Con proveedores OAuth (Google)**: SÍ (solo durante proceso de autenticación OAuth, si el usuario elige usar Google)
- **Con servicios de email**: SÍ (Supabase envía emails de autenticación y notificaciones)
- **Con usuarios públicos**: NO (el email no se muestra públicamente)
- **Con terceros para publicidad**: NO
- **Con otros servicios**: NO

**Uso:**
- Autenticación (login, recuperación de contraseña)
- Envío de Magic Links
- Notificaciones por email
- Comunicación con el usuario
- Verificación de cuenta

---

### 3. **ID de usuario** ✅

**Recopilados:** ✅ SÍ
- Se genera automáticamente en el servidor (Supabase)
- Se almacena en la base de datos
- Se asocia con el dispositivo cuando el usuario inicia sesión

**Compartidos:** ⚠️ PARCIALMENTE
- **Con Supabase**: SÍ (proveedor de backend, necesario para funcionamiento)
- **Con usuarios públicos**: NO (el ID no se muestra públicamente)
- **Con terceros para publicidad**: NO
- **Con otros servicios**: NO

**Uso:**
- Identificación única del usuario en el sistema
- Relaciones con otros datos (perfiles, eventos, RSVPs)
- Autenticación y autorización
- Gestión de sesiones

---

### 4. **Dirección** ⚠️

**Recopilados:** ⚠️ PARCIALMENTE (solo para ciertos perfiles)
- Se envía desde el dispositivo del usuario al desarrollador (solo si el usuario crea perfil de academia o maestro)
- Se almacena en la base de datos (Supabase)
- Es opcional: el usuario puede elegir proporcionarla o no

**Compartidos:** ⚠️ PARCIALMENTE
- **Con Supabase**: SÍ (proveedor de backend, almacenamiento necesario)
- **Con usuarios públicos**: SÍ (la ubicación se muestra en perfiles públicos de academias/maestros)
- **Con terceros para publicidad**: NO
- **Con otros servicios**: NO

**Uso:**
- Mostrar ubicación física de academias y maestros
- Búsqueda y filtrado geográfico
- Información de contacto para clases/eventos

**Nota:** Los usuarios regulares NO proporcionan dirección física, solo seleccionan una "zona" geográfica de un catálogo predefinido.

---

### 5. **Número de teléfono** ⚠️

**Recopilados:** ⚠️ PARCIALMENTE (solo como WhatsApp, opcional)
- Se envía desde el dispositivo del usuario al desarrollador (solo si el usuario decide compartirlo)
- Se almacena en la base de datos (Supabase)
- Es opcional: el usuario puede elegir proporcionarlo o no

**Compartidos:** ⚠️ PARCIALMENTE
- **Con Supabase**: SÍ (proveedor de backend, almacenamiento necesario)
- **Con usuarios públicos**: SÍ (el número de WhatsApp se muestra en perfiles públicos si el usuario lo proporciona)
- **Con WhatsApp**: SÍ (indirectamente, cuando los usuarios hacen clic en enlaces de WhatsApp)
- **Con terceros para publicidad**: NO
- **Con otros servicios**: NO

**Uso:**
- Contacto a través de WhatsApp
- Enlaces de WhatsApp para productos (marcas)
- Comunicación directa entre usuarios

**Nota:** No se recopila número de teléfono tradicional, solo número de WhatsApp si el usuario decide compartirlo.

---

### 6. **Otra información** ✅

**Recopilados:** ✅ SÍ
- Se envía desde el dispositivo del usuario al desarrollador
- Se almacena en la base de datos (Supabase) y Supabase Storage (archivos multimedia)

**Tipos de datos incluidos:**
- Biografía, foto de perfil, preferencias de baile (ritmos, zonas)
- Redes sociales (Instagram, TikTok, YouTube, Facebook, WhatsApp)
- Contenido multimedia (fotos, videos)
- Actividad del usuario (RSVPs, asistencias, notificaciones)
- Datos técnicos (IP, User-Agent, tokens de sesión)

**Compartidos:** ⚠️ PARCIALMENTE
- **Con Supabase**: SÍ (proveedor de backend y almacenamiento, necesario para funcionamiento)
- **Con usuarios públicos**: SÍ (perfiles públicos, eventos, clases - información que el usuario decide hacer pública)
- **Con proveedores OAuth (Google)**: SÍ (solo durante proceso de autenticación OAuth, si el usuario elige usar Google)
- **Con servicios de hosting (Vercel)**: SÍ (métricas de rendimiento y logs, si está desplegado allí)
- **Con terceros para publicidad**: NO
- **Con otros servicios**: NO

**Uso:**
- Personalización de experiencia del usuario
- Mostrar contenido público creado por usuarios
- Mejora del rendimiento de la app
- Análisis de uso (logs y métricas técnicas)

---

## 🔄 RESUMEN DE COMPARTICIÓN CON TERCEROS

### Terceros con los que se comparten datos:

#### 1. **Supabase** (Proveedor de Backend)
- **Datos compartidos**: Todos los datos recopilados
- **Propósito**: Almacenamiento, autenticación, base de datos, almacenamiento de archivos
- **Tipo de compartición**: Necesario para el funcionamiento de la app
- **Ubicación**: Estados Unidos / Región configurada en Supabase
- **Política de privacidad**: https://supabase.com/privacy

#### 2. **Google OAuth** (Solo si el usuario elige usar Google)
- **Datos compartidos**: Email, nombre, foto de perfil (solo durante autenticación)
- **Propósito**: Autenticación con cuenta de Google
- **Tipo de compartición**: Solo durante el proceso de autenticación
- **Política de privacidad**: https://policies.google.com/privacy

#### 3. **Vercel** (Si la app está desplegada allí)
- **Datos compartidos**: Logs de acceso, métricas de rendimiento, direcciones IP
- **Propósito**: Hosting y análisis de rendimiento
- **Tipo de compartición**: Necesario para hosting y monitoreo técnico
- **Política de privacidad**: https://vercel.com/legal/privacy-policy

#### 4. **Servicios de Email** (a través de Supabase)
- **Datos compartidos**: Email del usuario
- **Propósito**: Envío de emails de autenticación y notificaciones
- **Tipo de compartición**: Necesario para funcionalidad de autenticación

---

## 📋 TABLA RESUMEN PARA GOOGLE PLAY CONSOLE

| Tipo de Dato | Recopilados | Compartidos | Con Quién se Comparte |
|--------------|-------------|-------------|----------------------|
| **Nombre** | ✅ SÍ | ⚠️ PARCIALMENTE | Supabase, usuarios públicos |
| **Dirección de correo electrónico** | ✅ SÍ | ⚠️ PARCIALMENTE | Supabase, Google OAuth (si aplica), servicios de email |
| **ID de usuario** | ✅ SÍ | ⚠️ PARCIALMENTE | Supabase |
| **Dirección** | ⚠️ PARCIALMENTE | ⚠️ PARCIALMENTE | Supabase, usuarios públicos |
| **Número de teléfono** | ⚠️ PARCIALMENTE | ⚠️ PARCIALMENTE | Supabase, usuarios públicos, WhatsApp (indirectamente) |
| **Otra información** | ✅ SÍ | ⚠️ PARCIALMENTE | Supabase, usuarios públicos, Google OAuth (si aplica), Vercel (si aplica) |

---

## 🔒 NOTAS IMPORTANTES

### Datos NO compartidos para publicidad:
- ❌ NO se comparten datos con redes publicitarias
- ❌ NO se utilizan servicios de publicidad de terceros
- ❌ NO se venden datos a terceros
- ❌ NO se utilizan datos para publicidad personalizada de terceros

### Datos compartidos solo con consentimiento:
- ✅ Los usuarios deciden qué información hacer pública en sus perfiles
- ✅ Los usuarios pueden editar o eliminar su información en cualquier momento
- ✅ Los usuarios pueden solicitar eliminación completa de datos

### Seguridad de datos:
- ✅ Todos los datos se transmiten encriptados (HTTPS/TLS)
- ✅ Row Level Security (RLS) habilitado en base de datos
- ✅ Los usuarios solo pueden acceder a sus propios datos privados
- ✅ Tokens de autenticación almacenados de forma segura

---

## 📝 DECLARACIÓN PARA GOOGLE PLAY CONSOLE

**Recopilación de datos:**
- Los datos se recopilan desde el dispositivo del usuario y se envían al desarrollador
- Los datos se almacenan en servidores de Supabase (proveedor de backend)
- Los datos se procesan en tiempo real y se almacenan de forma persistente

**Compartición de datos:**
- Los datos se comparten con Supabase (proveedor de backend necesario para funcionamiento)
- Los datos públicos se comparten con otros usuarios de la plataforma (contenido que el usuario decide hacer público)
- Los datos se comparten con Google OAuth solo durante autenticación (si el usuario elige usar Google)
- Los datos NO se comparten con terceros para publicidad
- Los datos NO se venden a terceros

**Control del usuario:**
- Los usuarios pueden editar su información en cualquier momento
- Los usuarios pueden eliminar su cuenta y datos en: https://dondebailar.com.mx/eliminar-cuenta
- Los usuarios controlan qué información hacer pública en sus perfiles

---

**Última actualización:** Enero 2025

