# 📱 Actividad en Apps - Respuestas Detalladas para Google Play Console

Respuestas específicas para las 4 categorías de "Actividad en apps" en Google Play Console para la app "Donde Bailar MX".

---

## 1️⃣ INTERACCIONES EN LA APP

### ¿Estos datos se recopilan, se comparten o ambas?

**Respuesta:**
- ✅ **Recopilados**
- ✅ **Compartidos**

**Justificación detallada:**

**Recopilados:**
- Las interacciones se envían desde el dispositivo del usuario al desarrollador
- Se almacenan en la base de datos Supabase PostgreSQL
- Tipos de interacciones recopiladas:
  - **RSVPs a eventos** (`event_rsvp`): Cuando un usuario marca interés en un evento
  - **Seguimientos** (`follows`): Cuando un usuario sigue a otro usuario
  - **Asistencias a clases** (`clase_asistencias`): Cuando un usuario marca asistencia tentativa a una clase
  - **Notificaciones** (`notifications`): Notificaciones generadas por interacciones
  - **Interacciones con contenido**: Visualizaciones, clics en enlaces, etc.

**Compartidos:**
- **Con Supabase**: SÍ (proveedor de backend, almacenamiento necesario)
- **Con usuarios públicos**: SÍ (algunas interacciones son públicas):
  - RSVPs públicos (contadores de interés en eventos)
  - Seguimientos (listas de seguidores/seguidos en perfiles públicos)
  - Contadores de asistencias a clases
- **Con terceros para publicidad**: NO
- **Con otros servicios**: NO

---

### ¿Estos datos se procesan de forma efímera?

**Respuesta:** ❌ **No, los datos recopilados NO se procesan de forma efímera**

**Justificación:**
- Las interacciones se almacenan de forma persistente en la base de datos Supabase PostgreSQL
- Se guardan en tablas específicas:
  - `event_rsvp` - RSVPs a eventos
  - `follows` - Relaciones de seguimiento
  - `clase_asistencias` - Asistencias a clases
  - `notifications` - Notificaciones
- Los datos permanecen almacenados mientras el usuario tenga la cuenta activa
- Los datos NO se almacenan solo en memoria ni se eliminan después de procesar una solicitud
- Los datos se usan continuamente para mostrar estadísticas, notificaciones y contenido personalizado

---

### ¿Estos datos son necesarios para tu app o los usuarios pueden decidir si se recopilan o no?

**Respuesta:** ✅ **Los usuarios pueden decidir si los datos se recopilan o no**

**Justificación:**
- Las interacciones son **OPCIONALES**
- El usuario **PUEDE** elegir:
  - Marcar interés en eventos o no (RSVP)
  - Seguir a otros usuarios o no
  - Marcar asistencia a clases o no
  - Interactuar con contenido o no
- El usuario puede eliminar sus interacciones en cualquier momento:
  - Eliminar RSVPs
  - Dejar de seguir usuarios
  - Eliminar asistencias a clases
- La app funciona sin que el usuario realice interacciones (solo lectura)

**Nota:** La recopilación de datos se mostrará como opcional en la ficha de Play Store.

---

### ¿Por qué se recopilan los datos de los usuarios?

**Seleccionar las siguientes opciones:**
- ✅ **Funciones de la app**
- ✅ **Personalización**

**Justificación detallada:**

#### ✅ Funciones de la app
- Las interacciones se usan para habilitar funciones específicas:
  - Sistema de RSVPs para eventos (marcar interés)
  - Sistema de seguimiento entre usuarios
  - Sistema de asistencias a clases
  - Sistema de notificaciones basado en interacciones
  - Estadísticas de eventos (contadores de interés)
  - Funcionalidades sociales de la app

#### ✅ Personalización
- Las interacciones se usan para personalizar la experiencia:
  - Mostrar eventos de interés basados en RSVPs previos
  - Recomendaciones basadas en seguimientos
  - Contenido personalizado según interacciones pasadas
  - Notificaciones relevantes basadas en actividad

**NO se selecciona:**
- ❌ **Estadísticas** - Las interacciones no se usan principalmente para estadísticas generales
- ❌ **Comunicaciones del desarrollador** - Las interacciones no se usan para comunicaciones
- ❌ **Publicidad o marketing** - Las interacciones no se usan para publicidad
- ❌ **Seguridad, cumplimiento y prevención de fraudes** - Las interacciones no se usan para estos propósitos
- ❌ **Administración de la cuenta** - Las interacciones no son necesarias para administrar la cuenta

---

### ¿Para qué se usan y comparten los datos de los usuarios?

**Seleccionar las siguientes opciones:**
- ✅ **Funciones de la app**
- ✅ **Personalización**

**Justificación detallada:**

#### ✅ Funciones de la app
- **Uso:** Las interacciones se usan para habilitar funciones específicas:
  - Sistema de RSVPs para eventos
  - Sistema de seguimiento entre usuarios
  - Sistema de asistencias a clases
  - Sistema de notificaciones
  - Estadísticas de eventos y clases
- **Compartición:** Se comparten con:
  - Supabase (proveedor de backend, almacenamiento necesario)
  - Usuarios públicos (RSVPs públicos, contadores, listas de seguidores/seguidos)

#### ✅ Personalización
- **Uso:** Las interacciones se usan para personalizar la experiencia:
  - Mostrar eventos de interés basados en RSVPs previos
  - Recomendaciones basadas en seguimientos
  - Contenido personalizado según interacciones pasadas
- **Compartición:** Se comparten con usuarios públicos para permitir recomendaciones y contenido personalizado

**NO se selecciona:**
- ❌ **Estadísticas** - Las interacciones no se usan para análisis generales
- ❌ **Comunicaciones del desarrollador** - Las interacciones no se usan para comunicaciones
- ❌ **Publicidad o marketing** - Las interacciones no se usan para publicidad
- ❌ **Seguridad, cumplimiento y prevención de fraudes** - Las interacciones no se usan para estos propósitos
- ❌ **Administración de la cuenta** - Las interacciones no son necesarias para administrar la cuenta

---

## 2️⃣ HISTORIAL DE BÚSQUEDA EN LA APP

### ¿Estos datos se recopilan, se comparten o ambas?

**Respuesta:**
- ⚠️ **PARCIALMENTE - Recopilados** (principalmente en localStorage del dispositivo)
- ❌ **NO Compartidos**

**Justificación detallada:**

**Recopilados (PARCIALMENTE):**
- Los filtros de búsqueda se guardan principalmente en **localStorage del dispositivo**
- NO se envían automáticamente al servidor
- Tipos de datos de búsqueda recopilados:
  - **Filtros de exploración** (`ba_explore_filters_v1` en localStorage):
    - Tipo de contenido buscado (eventos, clases, academias, etc.)
    - Texto de búsqueda (query)
    - Ritmos seleccionados
    - Zonas seleccionadas
    - Rangos de fechas
    - Preferencias de visualización
  - **Borradores de formularios** (`baileapp:drafts:v1` en localStorage)
- Los datos se almacenan **solo en el dispositivo del usuario**
- NO se sincronizan automáticamente con el servidor

**Compartidos:**
- ❌ **NO se comparten con terceros**
- ❌ **NO se comparten con el servidor** (excepto cuando el usuario realiza una búsqueda activa, pero el historial en sí no se comparte)
- ❌ **NO se comparten con otros usuarios**

---

### ¿Estos datos se procesan de forma efímera?

**Respuesta:** ⚠️ **PARCIALMENTE - Algunos datos son efímeros, otros se almacenan localmente**

**Justificación:**
- **Datos efímeros**: Cuando el usuario realiza una búsqueda activa, los parámetros se envían al servidor para obtener resultados, pero estos parámetros NO se almacenan en el servidor después de la búsqueda
- **Datos almacenados localmente**: Los filtros de búsqueda se guardan en localStorage del dispositivo para recordar las preferencias del usuario entre sesiones
- Los datos en localStorage permanecen hasta que:
  - El usuario limpia el localStorage manualmente
  - El usuario desinstala la app
  - El navegador/app limpia el almacenamiento local
- Los datos NO se procesan solo en memoria para una solicitud específica, sino que se almacenan localmente para persistencia entre sesiones

**Nota:** Técnicamente, los datos se almacenan localmente (no efímeros), pero NO se comparten con el servidor ni con terceros.

---

### ¿Estos datos son necesarios para tu app o los usuarios pueden decidir si se recopilan o no?

**Respuesta:** ✅ **Los usuarios pueden decidir si los datos se recopilan o no**

**Justificación:**
- El historial de búsqueda es **OPCIONAL**
- El usuario **PUEDE**:
  - Limpiar su localStorage manualmente
  - Desactivar el guardado de filtros (aunque esto requeriría modificar el código)
  - Usar la app sin que se guarden sus búsquedas previas
- La app funciona perfectamente sin guardar el historial de búsqueda
- El guardado de filtros es solo una conveniencia para mejorar la experiencia del usuario

**Nota:** La recopilación de datos se mostrará como opcional en la ficha de Play Store.

---

### ¿Por qué se recopilan los datos de los usuarios?

**Seleccionar la siguiente opción:**
- ✅ **Personalización**

**Justificación detallada:**

#### ✅ Personalización
- El historial de búsqueda se usa para personalizar la experiencia:
  - Recordar filtros preferidos del usuario
  - Restaurar búsquedas previas al volver a la pantalla de exploración
  - Mejorar la experiencia de usuario al mantener preferencias entre sesiones
  - Facilitar búsquedas repetidas con los mismos filtros

**NO se selecciona:**
- ❌ **Funciones de la app** - El historial no es necesario para las funciones básicas de búsqueda
- ❌ **Estadísticas** - El historial no se usa para estadísticas
- ❌ **Comunicaciones del desarrollador** - El historial no se usa para comunicaciones
- ❌ **Publicidad o marketing** - El historial no se usa para publicidad
- ❌ **Seguridad, cumplimiento y prevención de fraudes** - El historial no se usa para estos propósitos
- ❌ **Administración de la cuenta** - El historial no es necesario para administrar la cuenta

---

### ¿Para qué se usan y comparten los datos de los usuarios?

**Seleccionar la siguiente opción:**
- ✅ **Personalización**

**Justificación detallada:**

#### ✅ Personalización
- **Uso:** El historial de búsqueda se usa para personalizar la experiencia:
  - Recordar filtros preferidos del usuario
  - Restaurar búsquedas previas
  - Mejorar la experiencia de usuario
- **Compartición:** ❌ **NO se comparten** con terceros, servidor ni otros usuarios

**NO se selecciona:**
- ❌ **Funciones de la app** - El historial no es necesario para las funciones básicas
- ❌ **Estadísticas** - El historial no se usa para análisis
- ❌ **Comunicaciones del desarrollador** - El historial no se usa para comunicaciones
- ❌ **Publicidad o marketing** - El historial no se usa para publicidad
- ❌ **Seguridad, cumplimiento y prevención de fraudes** - El historial no se usa para estos propósitos
- ❌ **Administración de la cuenta** - El historial no es necesario para administrar la cuenta

---

## 3️⃣ OTRO CONTENIDO GENERADO POR USUARIOS

### ¿Estos datos se recopilan, se comparten o ambas?

**Respuesta:**
- ✅ **Recopilados**
- ✅ **Compartidos**

**Justificación detallada:**

**Recopilados:**
- El contenido generado por usuarios se envía desde el dispositivo del usuario al desarrollador
- Se almacena en la base de datos Supabase PostgreSQL y Supabase Storage
- Tipos de contenido recopilado:
  - **Perfiles de usuario**: Biografías, información personal, preferencias
  - **Perfiles de academia**: Información de academias, horarios, costos
  - **Perfiles de maestro**: Información de maestros, ritmos, zonas
  - **Perfiles de organizador**: Información de organizadores, eventos
  - **Perfiles de marca**: Información de marcas, productos
  - **Eventos**: Títulos, descripciones, fechas, ubicaciones, flyers
  - **Clases**: Información de clases, horarios, instructores
  - **Productos**: Información de productos, precios, imágenes
  - **Comentarios y reseñas**: Comentarios sobre academias, maestros, eventos
  - **Contenido multimedia**: Fotos y videos subidos por usuarios

**Compartidos:**
- **Con Supabase**: SÍ (proveedor de backend, almacenamiento necesario)
- **Con usuarios públicos**: SÍ (el contenido que el usuario decide hacer público):
  - Perfiles públicos (academias, maestros, organizadores, marcas)
  - Eventos públicos
  - Clases públicas
  - Productos públicos
  - Contenido multimedia público
- **Con terceros para publicidad**: NO
- **Con otros servicios**: NO (excepto Supabase como proveedor de infraestructura)

---

### ¿Estos datos se procesan de forma efímera?

**Respuesta:** ❌ **No, los datos recopilados NO se procesan de forma efímera**

**Justificación:**
- El contenido generado por usuarios se almacena de forma persistente en:
  - Base de datos Supabase PostgreSQL (texto, metadatos)
  - Supabase Storage (archivos multimedia: fotos, videos)
- El contenido permanece almacenado mientras:
  - El usuario tenga la cuenta activa
  - El usuario no elimine el contenido manualmente
- Los datos NO se almacenan solo en memoria ni se eliminan después de procesar una solicitud
- El contenido se usa continuamente para:
  - Mostrar perfiles públicos
  - Mostrar eventos y clases
  - Mostrar productos
  - Búsquedas y recomendaciones

---

### ¿Estos datos son necesarios para tu app o los usuarios pueden decidir si se recopilan o no?

**Respuesta:** ✅ **Los usuarios pueden decidir si los datos se recopilan o no**

**Justificación:**
- El contenido generado por usuarios es **OPCIONAL**
- El usuario **PUEDE** elegir:
  - Crear perfiles o no (academia, maestro, organizador, marca)
  - Crear eventos o no
  - Crear clases o no
  - Crear productos o no
  - Subir contenido multimedia o no
  - Hacer su contenido público o privado
- El usuario puede editar o eliminar su contenido en cualquier momento
- La app funciona como plataforma de visualización sin que el usuario genere contenido

**Nota:** La recopilación de datos se mostrará como opcional en la ficha de Play Store.

---

### ¿Por qué se recopilan los datos de los usuarios?

**Seleccionar las siguientes opciones:**
- ✅ **Funciones de la app**
- ✅ **Personalización**

**Justificación detallada:**

#### ✅ Funciones de la app
- El contenido generado por usuarios se usa para habilitar funciones específicas:
  - Creación y gestión de perfiles (academias, maestros, organizadores, marcas)
  - Creación y gestión de eventos
  - Creación y gestión de clases
  - Creación y gestión de productos
  - Sistema de reseñas y comentarios
  - Funcionalidades de publicación y visualización de contenido

#### ✅ Personalización
- El contenido generado por usuarios se usa para personalizar la experiencia:
  - Mostrar contenido relevante basado en preferencias
  - Recomendaciones de eventos, clases, academias basadas en contenido creado
  - Búsquedas y filtros personalizados
  - Contenido personalizado según el perfil del usuario

**NO se selecciona:**
- ❌ **Estadísticas** - El contenido no se usa principalmente para estadísticas
- ❌ **Comunicaciones del desarrollador** - El contenido no se usa para comunicaciones
- ❌ **Publicidad o marketing** - El contenido no se usa para publicidad
- ❌ **Seguridad, cumplimiento y prevención de fraudes** - El contenido no se usa para estos propósitos
- ❌ **Administración de la cuenta** - El contenido no es necesario para administrar la cuenta (aunque los perfiles básicos sí)

---

### ¿Para qué se usan y comparten los datos de los usuarios?

**Seleccionar las siguientes opciones:**
- ✅ **Funciones de la app**
- ✅ **Personalización**

**Justificación detallada:**

#### ✅ Funciones de la app
- **Uso:** El contenido generado por usuarios se usa para habilitar funciones específicas:
  - Creación y gestión de perfiles, eventos, clases, productos
  - Sistema de publicación y visualización de contenido
  - Sistema de reseñas y comentarios
- **Compartición:** Se comparten con:
  - Supabase (proveedor de backend, almacenamiento necesario)
  - Usuarios públicos (contenido que el usuario decide hacer público)

#### ✅ Personalización
- **Uso:** El contenido generado por usuarios se usa para personalizar la experiencia:
  - Mostrar contenido relevante
  - Recomendaciones basadas en contenido creado
  - Búsquedas y filtros personalizados
- **Compartición:** Se comparten con usuarios públicos para permitir búsquedas, recomendaciones y visualización de contenido

**NO se selecciona:**
- ❌ **Estadísticas** - El contenido no se usa para análisis generales
- ❌ **Comunicaciones del desarrollador** - El contenido no se usa para comunicaciones
- ❌ **Publicidad o marketing** - El contenido no se usa para publicidad
- ❌ **Seguridad, cumplimiento y prevención de fraudes** - El contenido no se usa para estos propósitos
- ❌ **Administración de la cuenta** - El contenido no es necesario para administrar la cuenta

---

## 4️⃣ OTRAS ACCIONES

### ¿Estos datos se recopilan, se comparten o ambas?

**Respuesta:**
- ✅ **Recopilados**
- ⚠️ **PARCIALMENTE - Compartidos**

**Justificación detallada:**

**Recopilados:**
- Las acciones del usuario se envían desde el dispositivo del usuario al desarrollador
- Se almacenan en la base de datos Supabase PostgreSQL y Supabase Storage
- Tipos de acciones recopiladas:
  - **Subida de archivos**: Fotos, videos subidos a Supabase Storage
  - **Creación de contenido**: Creación de perfiles, eventos, clases, productos
  - **Navegación**: URLs visitadas, páginas vistas (principalmente en logs del servidor)
  - **Configuraciones**: Preferencias de usuario, configuraciones de perfil
  - **Acciones de edición**: Ediciones de perfiles, eventos, clases
  - **Acciones de eliminación**: Eliminación de contenido

**Compartidos (PARCIALMENTE):**
- **Con Supabase**: SÍ (proveedor de backend, almacenamiento necesario)
- **Con Vercel** (si aplica): SÍ (métricas de navegación, logs de servidor si la app está desplegada en Vercel)
- **Con usuarios públicos**: ⚠️ PARCIALMENTE (solo el contenido resultante de las acciones, no las acciones en sí):
  - Archivos subidos que el usuario hace públicos
  - Contenido creado que el usuario hace público
  - NO se comparten las acciones de navegación privadas
- **Con terceros para publicidad**: NO
- **Con otros servicios**: NO (excepto Supabase y Vercel como proveedores de infraestructura)

---

### ¿Estos datos se procesan de forma efímera?

**Respuesta:** ⚠️ **PARCIALMENTE - Algunos datos son efímeros, otros se almacenan**

**Justificación:**
- **Datos efímeros**:
  - Navegación y URLs visitadas (se registran en logs del servidor, pero no se almacenan permanentemente en la base de datos)
  - Acciones de navegación en tiempo real
- **Datos almacenados**:
  - Archivos subidos (se almacenan de forma persistente en Supabase Storage)
  - Contenido creado (se almacena de forma persistente en la base de datos)
  - Configuraciones (se almacenan de forma persistente en la base de datos)
- Los datos almacenados permanecen hasta que el usuario los elimine o elimine su cuenta
- Los datos de navegación en logs pueden ser efímeros o almacenarse temporalmente según la configuración del servidor

---

### ¿Estos datos son necesarios para tu app o los usuarios pueden decidir si se recopilan o no?

**Respuesta:** ⚠️ **PARCIALMENTE - Algunos datos son necesarios, otros son opcionales**

**Recomendación para Google Play Console:** ✅ **Los usuarios pueden decidir si los datos se recopilan o no**

**Justificación:**
- **Datos necesarios**:
  - Navegación básica (necesaria para el funcionamiento de la app, pero se procesa de forma efímera)
- **Datos opcionales**:
  - Subida de archivos (el usuario puede elegir subir o no)
  - Creación de contenido (el usuario puede elegir crear o no)
  - Configuraciones (el usuario puede elegir configurar o no)
- La mayoría de las acciones son opcionales, por lo que se recomienda seleccionar "Los usuarios pueden decidir si los datos se recopilan o no"

**Nota:** La recopilación de datos se mostrará como opcional en la ficha de Play Store.

---

### ¿Por qué se recopilan los datos de los usuarios?

**Seleccionar las siguientes opciones:**
- ✅ **Funciones de la app**
- ✅ **Estadísticas** (solo para datos de navegación y logs)

**Justificación detallada:**

#### ✅ Funciones de la app
- Las acciones se usan para habilitar funciones específicas:
  - Subida de archivos para perfiles, eventos, clases
  - Creación de contenido (perfiles, eventos, clases, productos)
  - Configuraciones de perfil y preferencias
  - Edición y eliminación de contenido

#### ✅ Estadísticas
- Los datos de navegación y logs se usan para:
  - Supervisar el estado de la app
  - Detectar y corregir errores
  - Mejorar el rendimiento
  - Entender cómo los usuarios utilizan la app

**NO se selecciona:**
- ❌ **Comunicaciones del desarrollador** - Las acciones no se usan para comunicaciones
- ❌ **Publicidad o marketing** - Las acciones no se usan para publicidad
- ❌ **Seguridad, cumplimiento y prevención de fraudes** - Las acciones no se usan principalmente para estos propósitos
- ❌ **Personalización** - Las acciones no se usan principalmente para personalización (aunque el contenido resultante sí)
- ❌ **Administración de la cuenta** - Las acciones no son necesarias para administrar la cuenta (aunque algunas configuraciones sí)

---

### ¿Para qué se usan y comparten los datos de los usuarios?

**Seleccionar las siguientes opciones:**
- ✅ **Funciones de la app**
- ✅ **Estadísticas** (solo para datos de navegación y logs)

**Justificación detallada:**

#### ✅ Funciones de la app
- **Uso:** Las acciones se usan para habilitar funciones específicas:
  - Subida de archivos, creación de contenido, configuraciones
- **Compartición:** Se comparten con:
  - Supabase (proveedor de backend, almacenamiento necesario)
  - Usuarios públicos (solo el contenido resultante de las acciones, no las acciones en sí)

#### ✅ Estadísticas
- **Uso:** Los datos de navegación y logs se usan para:
  - Supervisar el estado de la app
  - Detectar y corregir errores
  - Mejorar el rendimiento
- **Compartición:** Se comparten con:
  - Supabase (logs del servidor)
  - Vercel (métricas de navegación, si aplica)

**NO se selecciona:**
- ❌ **Comunicaciones del desarrollador** - Las acciones no se usan para comunicaciones
- ❌ **Publicidad o marketing** - Las acciones no se usan para publicidad
- ❌ **Seguridad, cumplimiento y prevención de fraudes** - Las acciones no se usan para estos propósitos
- ❌ **Personalización** - Las acciones no se usan principalmente para personalización
- ❌ **Administración de la cuenta** - Las acciones no son necesarias para administrar la cuenta

---

## 📋 RESUMEN RÁPIDO

| Categoría | Recopilados | Compartidos | Efímero | Necesario | Por qué / Para qué |
|-----------|-------------|-------------|---------|-----------|-------------------|
| **Interacciones en la app** | ✅ SÍ | ✅ SÍ | ❌ NO | ⚠️ Opcional | Funciones, Personalización |
| **Historial de búsqueda** | ⚠️ PARCIAL (localStorage) | ❌ NO | ⚠️ PARCIAL | ⚠️ Opcional | Personalización |
| **Otro contenido generado** | ✅ SÍ | ✅ SÍ | ❌ NO | ⚠️ Opcional | Funciones, Personalización |
| **Otras acciones** | ✅ SÍ | ⚠️ PARCIAL | ⚠️ PARCIAL | ⚠️ Opcional | Funciones, Estadísticas |

---

**Última actualización:** Enero 2025

