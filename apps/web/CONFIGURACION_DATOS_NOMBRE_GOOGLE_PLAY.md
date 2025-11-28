# 📋 Configuración de Datos - Nombre - Google Play Console

Respuestas específicas para configurar el tipo de dato "Nombre" en Google Play Console.

---

## 1. ¿Estos datos se recopilan, se comparten o ambas?

**Seleccionar:**
- ✅ **Recopilados**
- ✅ **Compartidos**

**Justificación:**
- **Recopilados:** El nombre se envía desde el dispositivo del usuario al desarrollador y se almacena en la base de datos (Supabase)
- **Compartidos:** El nombre se comparte con:
  - Supabase (proveedor de backend, almacenamiento necesario)
  - Usuarios públicos (el nombre se muestra en perfiles públicos de la app)

---

## 2. ¿Estos datos se procesan de forma efímera?

**Respuesta:** ❌ **No, los datos recopilados NO se procesan de forma efímera**

**Justificación:**
- El nombre se almacena de forma persistente en la base de datos (Supabase PostgreSQL)
- El nombre se guarda en la tabla `profiles_user.display_name`
- El nombre permanece almacenado mientras el usuario tenga cuenta activa
- El nombre NO se almacena solo en memoria ni se elimina después de procesar una solicitud
- El nombre se usa continuamente para mostrar en perfiles, notificaciones, y otras funciones de la app

---

## 3. ¿Estos datos son necesarios para tu app o los usuarios pueden decidir si se recopilan o no?

**Respuesta:** ✅ **La recopilación de datos es necesaria (los usuarios no pueden desactivar esta opción)**

**Justificación:**
- El nombre (`display_name`) es **obligatorio** durante el proceso de onboarding
- El usuario **NO puede** crear una cuenta sin proporcionar un nombre
- El nombre es necesario para:
  - Identificar al usuario en la plataforma
  - Mostrar el perfil del usuario
  - Personalizar la experiencia
  - Funcionalidades básicas de la app
- El usuario **SÍ puede** editar o cambiar su nombre después de crearlo, pero debe tener un nombre para usar la app

**Nota:** Aunque el nombre es obligatorio, el usuario puede elegir qué nombre usar (puede ser un pseudónimo o nombre artístico).

---

## 4. ¿Por qué se recopilan los datos de los usuarios?

**Seleccionar las siguientes opciones:**
- ✅ **Funciones de la app**
- ✅ **Personalización**
- ✅ **Administración de la cuenta**

**Justificación detallada:**

### ✅ Funciones de la app
- El nombre se usa para identificar al usuario en la plataforma
- Se muestra en perfiles públicos y privados
- Se usa en notificaciones y comunicaciones dentro de la app
- Es necesario para que otras funciones de la app funcionen correctamente

### ✅ Personalización
- El nombre se usa para personalizar la experiencia del usuario
- Se muestra en saludos y mensajes personalizados
- Se usa para recomendaciones y contenido personalizado

### ✅ Administración de la cuenta
- El nombre es parte esencial de la configuración de la cuenta
- Se usa para identificar la cuenta del usuario
- Es necesario para gestionar el perfil del usuario

**NO se selecciona:**
- ❌ **Estadísticas** - El nombre no se usa para estadísticas de uso o rendimiento
- ❌ **Comunicaciones del desarrollador** - El nombre no se usa específicamente para comunicaciones de marketing del desarrollador
- ❌ **Publicidad o marketing** - El nombre no se usa para publicidad
- ❌ **Seguridad, cumplimiento y prevención de fraudes** - El nombre no se usa principalmente para seguridad (aunque puede ayudar en identificación)

---

## 5. ¿Para qué se usan y comparten los datos de los usuarios?

**Seleccionar las siguientes opciones:**
- ✅ **Funciones de la app**
- ✅ **Personalización**
- ✅ **Administración de la cuenta**

**Justificación detallada:**

### ✅ Funciones de la app
- **Uso:** El nombre se usa para habilitar funciones básicas de la app:
  - Mostrar perfil del usuario
  - Identificar al usuario en interacciones (RSVPs, comentarios, etc.)
  - Mostrar nombre en eventos y clases creados
  - Funcionalidades de búsqueda y seguimiento
- **Compartición:** Se comparte con usuarios públicos para que puedan ver el nombre en perfiles públicos

### ✅ Personalización
- **Uso:** El nombre se usa para personalizar la experiencia:
  - Saludos personalizados ("Hola, [nombre]")
  - Recomendaciones basadas en el perfil
  - Contenido personalizado en el feed
- **Compartición:** Se comparte con usuarios públicos para personalizar interacciones entre usuarios

### ✅ Administración de la cuenta
- **Uso:** El nombre se usa para configurar y administrar la cuenta:
  - Crear y configurar el perfil del usuario
  - Identificar la cuenta del usuario
  - Gestionar información del perfil
- **Compartición:** Se comparte con Supabase (proveedor de backend) para almacenamiento y gestión de la cuenta

**NO se selecciona:**
- ❌ **Estadísticas** - El nombre no se usa para análisis de uso o rendimiento
- ❌ **Comunicaciones del desarrollador** - El nombre no se usa para comunicaciones de marketing
- ❌ **Publicidad o marketing** - El nombre no se usa para publicidad
- ❌ **Seguridad, cumplimiento y prevención de fraudes** - El nombre no se usa principalmente para estos propósitos

---

## 📋 RESUMEN PARA COPIAR EN GOOGLE PLAY CONSOLE

### Nombre

1. **¿Estos datos se recopilan, se comparten o ambas?**
   - ✅ Recopilados
   - ✅ Compartidos

2. **¿Estos datos se procesan de forma efímera?**
   - ❌ No, los datos recopilados NO se procesan de forma efímera

3. **¿Estos datos son necesarios para tu app o los usuarios pueden decidir si se recopilan o no?**
   - ✅ La recopilación de datos es necesaria (los usuarios no pueden desactivar esta opción)

4. **¿Por qué se recopilan los datos de los usuarios?**
   - ✅ Funciones de la app
   - ✅ Personalización
   - ✅ Administración de la cuenta

5. **¿Para qué se usan y comparten los datos de los usuarios?**
   - ✅ Funciones de la app
   - ✅ Personalización
   - ✅ Administración de la cuenta

---

**Última actualización:** Enero 2025

