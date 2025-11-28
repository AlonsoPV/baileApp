# 📋 Análisis de Datos Recabados y Manejo de Información

Este documento lista todos los datos que se recaban en la aplicación, cómo se manejan, y los puntos relevantes para el aviso de privacidad.

---

## 1. 📊 DATOS RECABADOS

### A) Datos Proporcionados Directamente por el Usuario

#### **1.1 Autenticación y Cuenta**
- **Correo electrónico** (requerido)
- **Contraseña** (requerida, almacenada encriptada en Supabase Auth)
- **Nombre completo** (opcional, puede obtenerse de OAuth)
- **Fotografía/Avatar** (opcional, subida a Supabase Storage)

#### **1.2 Perfil de Usuario (`profiles_user`)**
- `display_name` - Nombre público
- `bio` - Biografía del usuario
- `avatar_url` - URL de la foto de perfil
- `rol_baile` - Rol de baile: 'lead', 'follow', 'ambos'
- `ritmos` - Array de IDs de ritmos seleccionados
- `ritmos_seleccionados` - Array de slugs de ritmos
- `zonas` - Array de IDs de zonas (solo una para usuarios)
- `email` - Correo electrónico (opcional en perfil)
- `respuestas` (JSONB):
  - `redes` - Redes sociales:
    - `instagram` - URL o handle de Instagram
    - `tiktok` - URL o handle de TikTok
    - `youtube` - URL o handle de YouTube
    - `facebook` - URL o handle de Facebook
    - `whatsapp` - Número de WhatsApp
  - `dato_curioso` - Dato curioso sobre el usuario
  - `gusta_bailar` - Por qué le gusta bailar
- `premios` - Array de premios/logros
- `media` - Array de elementos multimedia (imágenes/videos)

#### **1.3 Perfil de Maestro (`profiles_teacher`)**
- `nombre_publico` - Nombre público del maestro
- `bio` - Biografía
- `ritmos_seleccionados` - Ritmos que enseña
- `ritmos` - IDs de ritmos
- `zonas` - Zonas donde enseña
- `cronograma` - Horarios de clases
- `costos` - Información de precios
- `promociones` - Promociones activas
- `ubicaciones` - Ubicaciones donde enseña
- `redes_sociales` - Redes sociales (Instagram, Facebook, WhatsApp, TikTok, YouTube, Email, Web, Telegram)
- `respuestas` - Respuestas a preguntas frecuentes
- `faq` - Preguntas frecuentes
- `reseñas` - Reseñas recibidas
- `cuenta_bancaria` - Datos bancarios (para pagos)

#### **1.4 Perfil de Academia (`profiles_academy`)**
- `nombre` - Nombre de la academia
- `bio` - Descripción
- `ubicacion` - Ubicación física
- `ritmos` - Ritmos que enseña
- `zonas` - Zonas donde opera
- `redes_sociales` - Redes sociales
- `horarios` - Horarios de operación
- `costos` - Información de precios
- `media` - Galería de imágenes/videos

#### **1.5 Perfil de Organizador (`profiles_organizer`)**
- `nombre` - Nombre del organizador
- `bio` - Descripción
- `redes_sociales` - Redes sociales
- `media` - Galería de eventos

#### **1.6 Perfil de Marca (`profiles_brand`)**
- `nombre` - Nombre de la marca
- `bio` - Descripción
- `redes_sociales` - Redes sociales
- `media` - Galería de productos/promociones

#### **1.7 Formulario "Quiero Formar Parte" (`JoinCommunityForm`)**
- `nombre` - Nombre completo
- `correo` - Correo electrónico
- `celular` - Teléfono (opcional)
- `roles` - Roles de interés (array)
- `tipoPerfil` - Tipo de perfil deseado
- `redesSociales` - Redes sociales (texto libre)
- `datosInteres` - Otros datos de interés (texto libre)
- **Nota**: Este formulario se envía por `mailto:` a `alpeva96@gmail.com`, no se almacena en base de datos

#### **1.8 Actividad del Usuario**
- **RSVPs a eventos** (`eventos_interesados`):
  - `event_id` - ID del evento
  - `user_id` - ID del usuario
  - `created_at` - Fecha de registro
- **Asistencias tentativas a clases** (`clase_asistencias`):
  - `class_id` - ID de la clase
  - `academy_id` - ID de la academia
  - `role_baile` - Rol de baile del usuario
  - `zona_tag_id` - Zona relacionada
  - `status` - Estado (tentative, confirmed, etc.)
- **Notificaciones** (`notifications`):
  - `user_id` - ID del usuario
  - `type` - Tipo de notificación
  - `title` - Título
  - `body` - Contenido
  - `is_read` - Estado de lectura
  - `created_at` - Fecha de creación

### B) Datos Recabados Automáticamente

#### **2.1 Datos Técnicos del Dispositivo**
- **Dirección IP** - Recabada automáticamente por Supabase y el servidor
- **Tipo de dispositivo** - Detectado por el navegador
- **Navegador y versión** - User-Agent
- **Sistema operativo** - Detectado por el navegador
- **Identificadores únicos de dispositivo** - Si se usan en la app móvil

#### **2.2 Datos de Navegación y Actividad**
- **URLs visitadas** - Historial de navegación dentro de la app
- **Clases vistas** - Eventos/clases que el usuario ha visualizado
- **Clases agregadas al calendario** - Eventos marcados como interesados
- **Interacciones** - Clicks, búsquedas, filtros aplicados
- **Tiempo de sesión** - Duración de la sesión activa

#### **2.3 Datos de Autenticación (Supabase Auth)**
- **Tokens de sesión** - Almacenados localmente (ver sección de almacenamiento)
- **Refresh tokens** - Para renovar sesiones automáticamente
- **Fecha de último acceso** - Timestamp de última actividad
- **Proveedor de autenticación** - Email/password, Google, Facebook, etc.

### C) Datos Obtenidos mediante Terceros

#### **3.1 OAuth (Google, Facebook)**
Cuando el usuario inicia sesión con OAuth, se recaba:
- **Correo electrónico** - Del perfil de OAuth
- **Nombre** - Del perfil de OAuth
- **Foto de perfil** - URL de la foto de OAuth
- **ID del proveedor** - ID único en el proveedor OAuth

#### **3.2 Supabase (Proveedor de Backend)**
Supabase puede recabar:
- **Logs de acceso** - Registros de todas las peticiones a la API
- **Métricas de uso** - Estadísticas de uso de la plataforma
- **Datos de almacenamiento** - Información sobre archivos subidos

---

## 2. 💾 ALMACENAMIENTO Y PERSISTENCIA

### A) Base de Datos (Supabase PostgreSQL)

#### **Tablas Principales:**
- `auth.users` - Usuarios autenticados (manejado por Supabase Auth)
- `profiles_user` - Perfiles de usuarios
- `profiles_teacher` - Perfiles de maestros
- `profiles_academy` - Perfiles de academias
- `profiles_organizer` - Perfiles de organizadores
- `profiles_brand` - Perfiles de marcas
- `tags` - Catálogo de ritmos y zonas
- `eventos_interesados` - RSVPs a eventos
- `clase_asistencias` - Asistencias tentativas a clases
- `notifications` - Notificaciones del usuario

#### **Políticas de Seguridad (RLS):**
- **Row Level Security (RLS)** habilitado en todas las tablas
- Los usuarios solo pueden ver/editar sus propios datos
- Los datos públicos (perfiles públicos) son accesibles para lectura

### B) Almacenamiento de Archivos (Supabase Storage)

#### **Buckets Utilizados:**
- `media` - Archivos multimedia generales:
  - `avatars/` - Fotos de perfil de usuarios
  - `academy/{academyId}/` - Media de academias
  - `media/organizer-media/{orgId}/` - Media de organizadores
  - `media/event-media/{eventId}/` - Media de eventos
  - `{userId}/` - Media de usuarios
- `org-media` - Media de organizadores (event-dates):
  - `event-dates/{dateId}/` - Flyers y media de fechas de eventos

#### **Tipos de Archivos:**
- **Imágenes**: Avatar, galerías, flyers de eventos
- **Videos**: Videos promocionales, clases, etc.

### C) Almacenamiento Local (Navegador)

#### **localStorage:**
- `baileapp:drafts:v1` - Borradores de formularios (Zustand persist)
- `ba_profile_mode` - Modo de perfil activo (usuario, teacher, academy, etc.)
- `default_profile_{userId}` - Perfil por defecto del usuario
- `explore_filters` - Filtros guardados en la pantalla de exploración
- **Supabase Auth Session** - Tokens de autenticación (manejado por Supabase SDK con `persistSession: true`)

#### **sessionStorage:**
- `ba_pin_verified_v1` - Verificación de PIN por usuario (Mapa: userId -> timestamp)
- `ba_pin_needs_verify_v1` - Flag de necesidad de verificación de PIN

#### **Cookies:**
- **Supabase Auth Cookies** - Cookies de sesión creadas por Supabase SDK
  - Nombre: `sb-{project-ref}-auth-token`
  - Contiene: Tokens de acceso y refresh
  - Duración: Según configuración de Supabase (típicamente sesión o persistente)
  - HttpOnly: Sí (seguro)
  - Secure: Sí (solo HTTPS)
  - SameSite: Lax o Strict

---

## 3. 🔄 MANEJO DE LA INFORMACIÓN

### A) Procesamiento de Datos

#### **Normalización:**
- **Redes sociales**: URLs normalizadas a formato estándar
- **Ritmos**: Convertidos de slugs a IDs y viceversa
- **Zonas**: Validación contra catálogo de tags
- **Medios**: Optimización de URLs de imágenes (resize, quality)

#### **Validación:**
- **Nombres**: Validación de formato (2-50 caracteres, caracteres permitidos)
- **Emails**: Validación de formato de correo
- **Teléfonos**: Validación de formato (opcional)
- **URLs**: Validación de formato para redes sociales

#### **Merge Inteligente:**
- Los perfiles se actualizan mediante `merge_profiles_user` (RPC)
- Solo se actualizan los campos modificados
- Se preservan datos existentes no modificados

### B) Compartimiento de Datos

#### **Datos Públicos:**
- **Perfiles públicos**: Nombres, biografías, avatares, ritmos, zonas (visibles para todos)
- **Eventos**: Información pública de eventos y clases
- **Academias/Maestros**: Perfiles públicos visibles en exploración

#### **Datos Privados:**
- **Información de autenticación**: Nunca compartida
- **Datos bancarios**: Solo accesibles por el usuario
- **RSVPs y asistencias**: Solo visibles para el usuario y organizadores del evento
- **Notificaciones**: Solo visibles para el usuario

#### **Terceros:**
- **Supabase**: Proveedor de backend, almacena todos los datos
- **Proveedores OAuth** (Google, Facebook): Solo durante el proceso de autenticación
- **Servicios de email**: Para envío de correos (formulario "Quiero formar parte" usa `mailto:`)

### C) Retención de Datos

#### **Datos de Usuario:**
- Se conservan mientras el usuario tenga cuenta activa
- Al eliminar cuenta, se eliminan datos personales (según políticas de Supabase)
- Los datos pueden conservarse por razones legales o de seguridad

#### **Logs y Métricas:**
- Los logs de Supabase se conservan según sus políticas
- Las métricas de uso pueden conservarse para análisis

---

## 4. 🍪 COOKIES Y TECNOLOGÍAS SIMILARES

### A) Cookies Utilizadas

#### **Cookies de Supabase Auth:**
- **Propósito**: Mantener sesión de usuario autenticado
- **Tipo**: Técnica/Necesaria
- **Duración**: Sesión o persistente (según configuración)
- **HttpOnly**: Sí
- **Secure**: Sí (solo HTTPS)
- **SameSite**: Lax/Strict

#### **Cookies de Terceros:**
- **Google OAuth**: Cookies de Google durante proceso de autenticación
- **Facebook OAuth**: Cookies de Facebook durante proceso de autenticación

### B) LocalStorage y SessionStorage

#### **LocalStorage:**
- **Persistencia**: Permanente hasta que el usuario limpie datos del navegador
- **Datos almacenados**:
  - Borradores de formularios
  - Preferencias de perfil
  - Filtros guardados
  - Tokens de autenticación (manejado por Supabase)

#### **SessionStorage:**
- **Persistencia**: Solo durante la sesión del navegador
- **Datos almacenados**:
  - Verificación de PIN
  - Flags de verificación

### C) Tecnologías de Tracking

#### **Actual:**
- **No se utiliza Google Analytics** actualmente
- **No se utiliza Facebook Pixel** actualmente
- **No se utiliza ningún servicio de analytics de terceros**

#### **Futuro (si se implementa):**
- Si se implementa analytics, debe notificarse en el aviso de privacidad
- Debe obtenerse consentimiento del usuario

---

## 5. 🔐 SEGURIDAD Y PROTECCIÓN

### A) Medidas de Seguridad

#### **Autenticación:**
- **Contraseñas**: Almacenadas encriptadas (bcrypt) en Supabase Auth
- **Tokens**: Tokens JWT firmados y encriptados
- **Refresh Tokens**: Renovación automática de sesiones
- **OAuth**: Autenticación segura mediante proveedores externos

#### **Autorización:**
- **Row Level Security (RLS)**: Políticas de seguridad a nivel de fila
- **Políticas de acceso**: Usuarios solo acceden a sus propios datos
- **Validación de permisos**: Verificación en cada operación

#### **Comunicación:**
- **HTTPS**: Toda la comunicación es encriptada
- **WebSockets**: Conexiones Realtime encriptadas (WSS)

### B) Protección de Datos Personales

#### **Encriptación:**
- **En tránsito**: HTTPS/TLS
- **En reposo**: Encriptación de base de datos (Supabase)
- **Contraseñas**: Hash bcrypt (no se almacenan en texto plano)

#### **Acceso:**
- **Solo personal autorizado** tiene acceso a la base de datos
- **Logs de acceso** para auditoría
- **Backups encriptados**

---

## 6. 📧 COMUNICACIONES

### A) Correos Electrónicos

#### **Enviados por la Aplicación:**
- **Confirmación de registro** (si está configurado en Supabase)
- **Recuperación de contraseña** (si está configurado)
- **Notificaciones de cuenta** (si está configurado)

#### **Formulario "Quiero Formar Parte":**
- **Método**: `mailto:` (no se almacena en BD, se envía directamente)
- **Destinatario**: `alpeva96@gmail.com`
- **Datos incluidos**: Nombre, correo, teléfono, roles, tipo de perfil, redes sociales, otros datos

### B) Notificaciones In-App

#### **Sistema de Notificaciones:**
- **Notificaciones en tiempo real** mediante Supabase Realtime
- **Almacenadas en BD** (`notifications` table)
- **Solo visibles para el usuario** destinatario

---

## 7. 🎯 FINALIDADES DEL TRATAMIENTO

### A) Finalidades Primarias (Necesarias)

1. **Crear y administrar cuenta de usuario**
2. **Autenticación y autorización**
3. **Funcionalidades principales**:
   - Búsqueda de clases de baile
   - Registro de clases preferidas
   - Guardado de filtros y preferencias
   - Gestión de calendario tentativo
   - RSVPs a eventos
4. **Mejora de funcionalidad y rendimiento**
5. **Comunicación sobre cuenta y seguridad**

### B) Finalidades Secundarias (Opcionales)

1. **Recomendaciones personalizadas** de clases, academias o ritmos
2. **Notificaciones y promociones** (con consentimiento)
3. **Análisis estadísticos y métricas de uso**
4. **Personalización de experiencia de usuario**

---

## 8. ⚠️ PUNTOS IMPORTANTES PARA EL AVISO DE PRIVACIDAD

### A) Información que Debe Incluirse

1. **Responsable del tratamiento**: Donde Bailar MX
2. **Datos recabados**: Lista completa de datos (ver sección 1)
3. **Finalidades**: Primarias y secundarias (ver sección 7)
4. **Base legal**: Consentimiento, ejecución de contrato, interés legítimo
5. **Compartimiento**: Con quién se comparten datos (Supabase, OAuth providers)
6. **Derechos ARCO**: Acceso, Rectificación, Cancelación, Oposición
7. **Cookies**: Información sobre cookies utilizadas
8. **Almacenamiento**: Dónde se almacenan los datos (Supabase, localStorage)
9. **Retención**: Cuánto tiempo se conservan los datos
10. **Seguridad**: Medidas de seguridad implementadas

### B) Consentimiento

#### **Consentimiento Explícito Requerido Para:**
- Finalidades secundarias (marketing, promociones)
- Uso de cookies no esenciales (si se implementan en el futuro)
- Compartimiento con terceros para marketing

#### **Consentimiento Implícito:**
- Finalidades primarias (necesarias para el funcionamiento)
- Cookies técnicas necesarias

### C) Derechos del Usuario

1. **Acceso**: Solicitar información sobre datos personales
2. **Rectificación**: Corregir datos incorrectos
3. **Cancelación**: Eliminar cuenta y datos personales
4. **Oposición**: Oponerse al tratamiento de datos
5. **Portabilidad**: Solicitar exportación de datos
6. **Revocación**: Revocar consentimiento en cualquier momento

---

## 9. 📝 RECOMENDACIONES

### A) Actualizaciones al Aviso de Privacidad

1. **Incluir información sobre localStorage/sessionStorage**
2. **Especificar cookies de Supabase Auth**
3. **Mencionar almacenamiento en Supabase (ubicación: servidores de Supabase)**
4. **Detallar datos recabados en formularios específicos**
5. **Incluir información sobre Realtime/WebSockets**
6. **Mencionar que el formulario "Quiero formar parte" usa mailto: (no se almacena en BD)**

### B) Mejoras Futuras

1. **Implementar banner de cookies** si se agregan servicios de analytics
2. **Panel de preferencias de privacidad** para que usuarios gestionen sus datos
3. **Exportación de datos** (formato JSON)
4. **Eliminación de cuenta** con confirmación y eliminación de todos los datos
5. **Logs de actividad** visibles para el usuario

---

## 10. 📞 CONTACTO

Para ejercer derechos ARCO o consultas sobre privacidad:
- **Email**: `info@dondebailar.com.mx`
- **Sitio web**: `https://dondebailar.com.mx`
- **Ruta de aviso de privacidad**: `/aviso-de-privacidad`

---

**Última actualización**: Enero 2025
**Versión del documento**: 1.0

