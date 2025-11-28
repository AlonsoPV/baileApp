# 📋 Configuración Completa de Todas las Categorías - Google Play Console

Respuestas específicas para todas las categorías de datos en Google Play Console para la app "Donde Bailar MX".

---

## 📍 UBICACIÓN - Ubicación aproximada

### 1. ¿Estos datos se recopilan, se comparten o ambas?
**Respuesta:** ❌ **NO se recopila**

**Justificación:**
- La app **NO accede** a la ubicación GPS del dispositivo
- La app **NO solicita** permisos de ubicación
- La app **NO utiliza** servicios de geolocalización
- Los usuarios solo seleccionan una "zona" geográfica de un catálogo predefinido (ej: "Ciudad de México"), que NO es ubicación GPS

**Nota:** Si el usuario crea un perfil de academia o maestro, puede proporcionar una dirección física (texto), pero esto NO es ubicación GPS aproximada.

---

## 📧 MENSAJES - Correos electrónicos

### 1. ¿Estos datos se recopilan, se comparten o ambas?
**Respuesta:** ✅ **Recopilados** | ✅ **Compartidos**

**Justificación:**
- El email se recopila durante el registro (obligatorio)
- Se almacena en Supabase Auth y profiles_user
- Se comparte con:
  - Supabase (proveedor de backend)
  - Google OAuth (solo durante autenticación, si aplica)
  - Servicios de email (para envío de Magic Links y notificaciones)

### 2. ¿Estos datos se procesan de forma efímera?
**Respuesta:** ❌ **No, los datos recopilados NO se procesan de forma efímera**

### 3. ¿Estos datos son necesarios para tu app o los usuarios pueden decidir si se recopilan o no?
**Respuesta:** ✅ **La recopilación de datos es necesaria (los usuarios no pueden desactivar esta opción)**

### 4. ¿Por qué se recopilan los datos de los usuarios?
**Seleccionar:**
- ✅ Funciones de la app
- ✅ Administración de la cuenta
- ✅ Comunicaciones del desarrollador

### 5. ¿Para qué se usan y comparten los datos de los usuarios?
**Seleccionar:**
- ✅ Funciones de la app
- ✅ Administración de la cuenta
- ✅ Comunicaciones del desarrollador

---

## 📸 FOTOS Y VIDEOS - Fotos

### 1. ¿Estos datos se recopilan, se comparten o ambas?
**Respuesta:** ✅ **Recopilados** | ✅ **Compartidos**

**Justificación:**
- Las fotos se suben desde el dispositivo del usuario
- Se almacenan en Supabase Storage
- Se comparten con:
  - Supabase (proveedor de almacenamiento)
  - Usuarios públicos (fotos en perfiles públicos, eventos, clases)

**Tipos de fotos recopiladas:**
- Foto de perfil (avatar)
- Fotos de galería de usuario
- Fotos de eventos (flyers)
- Fotos de productos (marcas)
- Fotos de academias y maestros

### 2. ¿Estos datos se procesan de forma efímera?
**Respuesta:** ❌ **No, los datos recopilados NO se procesan de forma efímera**

Las fotos se almacenan de forma persistente en Supabase Storage.

### 3. ¿Estos datos son necesarios para tu app o los usuarios pueden decidir si se recopilan o no?
**Respuesta:** ✅ **Los usuarios pueden decidir si los datos se recopilan o no**

Las fotos son opcionales, excepto la foto de perfil que se recomienda pero no es estrictamente obligatoria.

### 4. ¿Por qué se recopilan los datos de los usuarios?
**Seleccionar:**
- ✅ Funciones de la app
- ✅ Personalización

### 5. ¿Para qué se usan y comparten los datos de los usuarios?
**Seleccionar:**
- ✅ Funciones de la app
- ✅ Personalización

---

## 🎥 FOTOS Y VIDEOS - Videos

### 1. ¿Estos datos se recopilan, se comparten o ambas?
**Respuesta:** ✅ **Recopilados** | ✅ **Compartidos**

**Justificación:**
- Los videos se suben desde el dispositivo del usuario
- Se almacenan en Supabase Storage
- Se comparten con:
  - Supabase (proveedor de almacenamiento)
  - Usuarios públicos (videos en perfiles públicos, eventos, clases)

**Tipos de videos recopilados:**
- Videos de baile del usuario
- Videos promocionales de eventos
- Videos de clases
- Videos de productos (marcas)

### 2. ¿Estos datos se procesan de forma efímera?
**Respuesta:** ❌ **No, los datos recopilados NO se procesan de forma efímera**

Los videos se almacenan de forma persistente en Supabase Storage.

### 3. ¿Estos datos son necesarios para tu app o los usuarios pueden decidir si se recopilan o no?
**Respuesta:** ✅ **Los usuarios pueden decidir si los datos se recopilan o no**

Los videos son completamente opcionales.

### 4. ¿Por qué se recopilan los datos de los usuarios?
**Seleccionar:**
- ✅ Funciones de la app
- ✅ Personalización

### 5. ¿Para qué se usan y comparten los datos de los usuarios?
**Seleccionar:**
- ✅ Funciones de la app
- ✅ Personalización

---

## 📅 CALENDARIO - Eventos del calendario

### 1. ¿Estos datos se recopilan, se comparten o ambas?
**Respuesta:** ⚠️ **PARCIALMENTE - La app NO accede al calendario del dispositivo**

**Justificación:**
- La app **NO lee** eventos del calendario del dispositivo
- La app **NO accede** al calendario nativo del dispositivo
- La app **NO solicita** permisos de calendario
- La app **permite** a los usuarios agregar eventos a su calendario (exportar archivos .ics), pero NO lee el calendario

**Nota:** Los usuarios pueden exportar eventos de la app a su calendario (Apple Calendar, Google Calendar, etc.) mediante archivos .ics, pero la app NO accede a los eventos existentes en el calendario del dispositivo.

**Respuesta para Google Play Console:** ❌ **NO se recopila** (la app no lee el calendario del dispositivo)

---

## 📊 INFORMACIÓN DE LA APP Y RENDIMIENTO

### Registros de fallas

#### 1. ¿Estos datos se recopilan, se comparten o ambas?
**Respuesta:** ⚠️ **PARCIALMENTE - Recopilados** | ⚠️ **PARCIALMENTE - Compartidos**

**Justificación:**
- Los logs de errores se recopilan automáticamente por Supabase y el servidor
- Se comparten con Supabase (proveedor de backend) y Vercel (si está desplegado allí)
- NO se utiliza un servicio dedicado de crash reporting como Sentry

#### 2. ¿Estos datos se procesan de forma efímera?
**Respuesta:** ⚠️ **PARCIALMENTE - Algunos logs son efímeros, otros se almacenan**

#### 3. ¿Estos datos son necesarios para tu app o los usuarios pueden decidir si se recopilan o no?
**Respuesta:** ✅ **La recopilación de datos es necesaria (los usuarios no pueden desactivar esta opción)**

#### 4. ¿Por qué se recopilan los datos de los usuarios?
**Seleccionar:**
- ✅ Estadísticas

#### 5. ¿Para qué se usan y comparten los datos de los usuarios?
**Seleccionar:**
- ✅ Estadísticas

---

### Otros datos de rendimiento de la app

#### 1. ¿Estos datos se recopilan, se comparten o ambas?
**Respuesta:** ✅ **Recopilados** | ✅ **Compartidos**

**Justificación:**
- Métricas de rendimiento se recopilan automáticamente
- Se comparten con Supabase y Vercel (si aplica)

#### 2. ¿Estos datos se procesan de forma efímera?
**Respuesta:** ⚠️ **PARCIALMENTE - Algunos datos son efímeros, otros se almacenan**

#### 3. ¿Estos datos son necesarios para tu app o los usuarios pueden decidir si se recopilan o no?
**Respuesta:** ✅ **La recopilación de datos es necesaria (los usuarios no pueden desactivar esta opción)**

#### 4. ¿Por qué se recopilan los datos de los usuarios?
**Seleccionar:**
- ✅ Estadísticas

#### 5. ¿Para qué se usan y comparten los datos de los usuarios?
**Seleccionar:**
- ✅ Estadísticas

---

## 📁 ARCHIVOS Y DOCUMENTOS

### 1. ¿Estos datos se recopilan, se comparten o ambas?
**Respuesta:** ⚠️ **PARCIALMENTE - Solo archivos multimedia (fotos/videos)**

**Justificación:**
- La app recopila archivos multimedia (fotos y videos) subidos por el usuario
- NO se recopilan documentos tradicionales (PDFs, Word, Excel, etc.)
- Los archivos se almacenan en Supabase Storage
- Se comparten con Supabase (proveedor de almacenamiento) y usuarios públicos (si el contenido es público)

**Tipos de archivos recopilados:**
- Imágenes (fotos de perfil, galerías, flyers)
- Videos (videos de baile, promocionales)

**NO se recopilan:**
- Documentos PDF
- Documentos de Office (Word, Excel, PowerPoint)
- Archivos de texto
- Otros tipos de documentos

### 2. ¿Estos datos se procesan de forma efímera?
**Respuesta:** ❌ **No, los datos recopilados NO se procesan de forma efímera**

Los archivos se almacenan de forma persistente en Supabase Storage.

### 3. ¿Estos datos son necesarios para tu app o los usuarios pueden decidir si se recopilan o no?
**Respuesta:** ✅ **Los usuarios pueden decidir si los datos se recopilan o no**

Los archivos multimedia son opcionales.

### 4. ¿Por qué se recopilan los datos de los usuarios?
**Seleccionar:**
- ✅ Funciones de la app
- ✅ Personalización

### 5. ¿Para qué se usan y comparten los datos de los usuarios?
**Seleccionar:**
- ✅ Funciones de la app
- ✅ Personalización

---

## 📱 ACTIVIDAD EN APPS

### Interacciones en la app

#### 1. ¿Estos datos se recopilan, se comparten o ambas?
**Respuesta:** ✅ **Recopilados** | ⚠️ **PARCIALMENTE - Compartidos** (solo datos públicos)

**Justificación:**
- Se recopilan: RSVPs, asistencias, seguimientos, notificaciones
- Se comparten con Supabase (proveedor de backend)
- Algunos datos se comparten con usuarios públicos (RSVPs públicos, seguimientos)

#### 2. ¿Estos datos se procesan de forma efímera?
**Respuesta:** ❌ **No, los datos recopilados NO se procesan de forma efímera**

#### 3. ¿Estos datos son necesarios para tu app o los usuarios pueden decidir si se recopilan o no?
**Respuesta:** ✅ **Los usuarios pueden decidir si los datos se recopilan o no**

Los usuarios pueden elegir participar o no en interacciones.

#### 4. ¿Por qué se recopilan los datos de los usuarios?
**Seleccionar:**
- ✅ Funciones de la app
- ✅ Personalización

#### 5. ¿Para qué se usan y comparten los datos de los usuarios?
**Seleccionar:**
- ✅ Funciones de la app
- ✅ Personalización

---

### Historial de búsqueda en la app

#### 1. ¿Estos datos se recopilan, se comparten o ambas?
**Respuesta:** ⚠️ **PARCIALMENTE - Recopilados** (principalmente en localStorage) | ❌ **NO Compartidos**

**Justificación:**
- Los filtros de búsqueda se guardan principalmente en localStorage del dispositivo
- NO se comparten con terceros
- NO siempre se sincronizan con el servidor

#### 2. ¿Estos datos se procesan de forma efímera?
**Respuesta:** ⚠️ **PARCIALMENTE - Algunos datos son efímeros (localStorage), otros pueden almacenarse**

#### 3. ¿Estos datos son necesarios para tu app o los usuarios pueden decidir si se recopilan o no?
**Respuesta:** ✅ **Los usuarios pueden decidir si los datos se recopilan o no**

Los usuarios pueden limpiar su localStorage si lo desean.

#### 4. ¿Por qué se recopilan los datos de los usuarios?
**Seleccionar:**
- ✅ Personalización

#### 5. ¿Para qué se usan y comparten los datos de los usuarios?
**Seleccionar:**
- ✅ Personalización

---

### Otro contenido generado por usuarios

#### 1. ¿Estos datos se recopilan, se comparten o ambas?
**Respuesta:** ✅ **Recopilados** | ✅ **Compartidos**

**Justificación:**
- Se recopilan: Perfiles, eventos, clases, productos, comentarios, biografías
- Se comparten con Supabase (proveedor de backend) y usuarios públicos (contenido que el usuario decide hacer público)

#### 2. ¿Estos datos se procesan de forma efímera?
**Respuesta:** ❌ **No, los datos recopilados NO se procesan de forma efímera**

#### 3. ¿Estos datos son necesarios para tu app o los usuarios pueden decidir si se recopilan o no?
**Respuesta:** ✅ **Los usuarios pueden decidir si los datos se recopilan o no**

El usuario puede elegir crear contenido o no.

#### 4. ¿Por qué se recopilan los datos de los usuarios?
**Seleccionar:**
- ✅ Funciones de la app
- ✅ Personalización

#### 5. ¿Para qué se usan y comparten los datos de los usuarios?
**Seleccionar:**
- ✅ Funciones de la app
- ✅ Personalización

---

### Otras acciones

#### 1. ¿Estos datos se recopilan, se comparten o ambas?
**Respuesta:** ✅ **Recopilados** | ⚠️ **PARCIALMENTE - Compartidos**

**Justificación:**
- Se recopilan: Subida de archivos, creación de contenido, navegación, configuraciones
- Se comparten con Supabase (proveedor de backend)
- Algunos datos se comparten con Vercel (métricas de navegación, si aplica)

#### 2. ¿Estos datos se procesan de forma efímera?
**Respuesta:** ⚠️ **PARCIALMENTE - Algunos datos son efímeros (navegación), otros se almacenan (archivos, contenido)**

#### 3. ¿Estos datos son necesarios para tu app o los usuarios pueden decidir si se recopilan o no?
**Respuesta:** ⚠️ **PARCIALMENTE - Algunos datos son necesarios (navegación básica), otros son opcionales (subida de archivos)**

**Recomendación:** Seleccionar "Los usuarios pueden decidir si los datos se recopilan o no" ya que la mayoría de las acciones son opcionales.

#### 4. ¿Por qué se recopilan los datos de los usuarios?
**Seleccionar:**
- ✅ Funciones de la app
- ✅ Estadísticas (solo para datos de navegación)

#### 5. ¿Para qué se usan y comparten los datos de los usuarios?
**Seleccionar:**
- ✅ Funciones de la app
- ✅ Estadísticas (solo para datos de navegación)

---

## 📱 DISPOSITIVO U OTROS IDs

### 1. ¿Estos datos se recopilan, se comparten o ambas?
**Respuesta:** ✅ **Recopilados** | ✅ **Compartidos**

**Justificación:**
- Se recopila: ID de usuario (UUID generado por Supabase Auth)
- Se comparte con Supabase (proveedor de backend, necesario para funcionamiento)

**NO se recopilan:**
- ID de dispositivo físico
- ID de instalación
- ID de publicidad
- IMEI, Serial Number, MAC Address

### 2. ¿Estos datos se procesan de forma efímera?
**Respuesta:** ❌ **No, los datos recopilados NO se procesan de forma efímera**

El ID de usuario se almacena de forma persistente.

### 3. ¿Estos datos son necesarios para tu app o los usuarios pueden decidir si se recopilan o no?
**Respuesta:** ✅ **La recopilación de datos es necesaria (los usuarios no pueden desactivar esta opción)**

El ID de usuario se genera automáticamente y es necesario para el funcionamiento.

### 4. ¿Por qué se recopilan los datos de los usuarios?
**Seleccionar:**
- ✅ Funciones de la app
- ✅ Administración de la cuenta
- ✅ Seguridad, cumplimiento y prevención de fraudes

### 5. ¿Para qué se usan y comparten los datos de los usuarios?
**Seleccionar:**
- ✅ Funciones de la app
- ✅ Administración de la cuenta
- ✅ Seguridad, cumplimiento y prevención de fraudes

---

## 📋 RESUMEN RÁPIDO POR CATEGORÍA

| Categoría | Recopilados | Compartidos | Efímero | Necesario | Por qué / Para qué |
|-----------|-------------|-------------|---------|-----------|-------------------|
| **Ubicación aproximada** | ❌ NO | ❌ NO | - | - | - |
| **Mensajes - Correos** | ✅ SÍ | ✅ SÍ | ❌ NO | ✅ Necesario | Funciones, Admin, Comunicaciones |
| **Fotos** | ✅ SÍ | ✅ SÍ | ❌ NO | ⚠️ Opcional | Funciones, Personalización |
| **Videos** | ✅ SÍ | ✅ SÍ | ❌ NO | ⚠️ Opcional | Funciones, Personalización |
| **Calendario** | ❌ NO | ❌ NO | - | - | - |
| **Registros de fallas** | ⚠️ PARCIAL | ⚠️ PARCIAL | ⚠️ PARCIAL | ✅ Necesario | Estadísticas |
| **Otros datos rendimiento** | ✅ SÍ | ✅ SÍ | ⚠️ PARCIAL | ✅ Necesario | Estadísticas |
| **Archivos y documentos** | ⚠️ PARCIAL | ⚠️ PARCIAL | ❌ NO | ⚠️ Opcional | Funciones, Personalización |
| **Interacciones en app** | ✅ SÍ | ⚠️ PARCIAL | ❌ NO | ⚠️ Opcional | Funciones, Personalización |
| **Historial búsqueda** | ⚠️ PARCIAL | ❌ NO | ⚠️ PARCIAL | ⚠️ Opcional | Personalización |
| **Otro contenido usuarios** | ✅ SÍ | ✅ SÍ | ❌ NO | ⚠️ Opcional | Funciones, Personalización |
| **Otras acciones** | ✅ SÍ | ⚠️ PARCIAL | ⚠️ PARCIAL | ⚠️ Opcional | Funciones, Estadísticas |
| **Dispositivo u otros IDs** | ✅ SÍ | ✅ SÍ | ❌ NO | ✅ Necesario | Funciones, Admin, Seguridad |

---

**Última actualización:** Enero 2025

