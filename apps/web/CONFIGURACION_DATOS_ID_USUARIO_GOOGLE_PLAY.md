# 📋 Configuración de Datos - ID de Usuario - Google Play Console

Respuestas específicas para configurar el tipo de dato "ID de usuario" en Google Play Console.

---

## 1. ¿Estos datos se recopilan, se comparten o ambas?

**Seleccionar:**
- ✅ **Recopilados**
- ✅ **Compartidos**

**Justificación:**
- **Recopilados:** El ID de usuario se genera automáticamente en el servidor (Supabase) cuando el usuario crea una cuenta. Se asocia con el dispositivo cuando el usuario inicia sesión.
- **Compartidos:** El ID de usuario se comparte con:
  - Supabase (proveedor de backend, necesario para funcionamiento del sistema)
  - Se usa internamente para todas las operaciones de la app

**Nota:** El ID de usuario NO se comparte con usuarios públicos (no se muestra en perfiles públicos).

---

## 2. ¿Estos datos se procesan de forma efímera?

**Respuesta:** ❌ **No, los datos recopilados NO se procesan de forma efímera**

**Justificación:**
- El ID de usuario se almacena de forma persistente en la base de datos (Supabase PostgreSQL)
- El ID de usuario se guarda en:
  - `auth.users.id` (Supabase Auth - almacenamiento permanente)
  - `profiles_user.user_id` (clave foránea - almacenamiento permanente)
- El ID de usuario permanece almacenado mientras el usuario tenga cuenta activa
- El ID de usuario NO se almacena solo en memoria ni se elimina después de procesar una solicitud
- El ID de usuario se usa continuamente para:
  - Identificación única del usuario en el sistema
  - Relaciones con otros datos (perfiles, eventos, RSVPs, notificaciones)
  - Autenticación y autorización
  - Gestión de sesiones

---

## 3. ¿Estos datos son necesarios para tu app o los usuarios pueden decidir si se recopilan o no?

**Respuesta:** ✅ **La recopilación de datos es necesaria (los usuarios no pueden desactivar esta opción)**

**Justificación:**
- El ID de usuario se genera **automáticamente** al crear una cuenta
- El usuario **NO puede** evitar que se genere el ID de usuario
- El ID de usuario es necesario para:
  - Funcionamiento básico del sistema
  - Identificación única del usuario
  - Relaciones con otros datos
  - Autenticación y autorización
  - Todas las funcionalidades de la app
- El usuario **NO tiene control** sobre la generación del ID de usuario, ya que es automático y esencial

**Nota:** El ID de usuario es generado automáticamente por Supabase Auth, el usuario no lo proporciona directamente.

---

## 4. ¿Por qué se recopilan los datos de los usuarios?

**Seleccionar las siguientes opciones:**
- ✅ **Funciones de la app**
- ✅ **Administración de la cuenta**
- ✅ **Seguridad, cumplimiento y prevención de fraudes**

**Justificación detallada:**

### ✅ Funciones de la app
- El ID de usuario se usa para habilitar todas las funciones de la app:
  - Identificación única del usuario en el sistema
  - Relaciones con otros datos (perfiles, eventos, RSVPs, notificaciones)
  - Autenticación y autorización
  - Funcionalidades que requieren identificación del usuario

### ✅ Administración de la cuenta
- El ID de usuario se usa para configurar y administrar la cuenta:
  - Crear y configurar la cuenta del usuario
  - Identificar la cuenta del usuario de forma única
  - Gestionar autenticación y sesiones
  - Vincular datos del usuario con su cuenta

### ✅ Seguridad, cumplimiento y prevención de fraudes
- El ID de usuario se usa para seguridad:
  - Identificación única para prevenir fraudes
  - Autenticación y autorización segura
  - Control de acceso a datos
  - Auditoría de acciones del usuario

**NO se selecciona:**
- ❌ **Estadísticas** - El ID de usuario no se usa directamente para estadísticas de uso o rendimiento
- ❌ **Comunicaciones del desarrollador** - El ID de usuario no se usa para comunicaciones
- ❌ **Publicidad o marketing** - El ID de usuario no se usa para publicidad
- ❌ **Personalización** - El ID de usuario no se usa directamente para personalizar contenido (se usa para vincular datos de personalización)

---

## 5. ¿Para qué se usan y comparten los datos de los usuarios?

**Seleccionar las siguientes opciones:**
- ✅ **Funciones de la app**
- ✅ **Administración de la cuenta**
- ✅ **Seguridad, cumplimiento y prevención de fraudes**

**Justificación detallada:**

### ✅ Funciones de la app
- **Uso:** El ID de usuario se usa para habilitar todas las funciones:
  - Identificación única del usuario
  - Relaciones con otros datos
  - Autenticación y autorización
  - Funcionalidades que requieren identificación
- **Compartición:** Se comparte con Supabase (proveedor de backend, necesario para funcionamiento)

### ✅ Administración de la cuenta
- **Uso:** El ID de usuario se usa para configurar y administrar la cuenta:
  - Crear y configurar la cuenta
  - Identificar la cuenta de forma única
  - Gestionar autenticación y sesiones
- **Compartición:** Se comparte con Supabase (proveedor de backend) para almacenamiento y gestión de la cuenta

### ✅ Seguridad, cumplimiento y prevención de fraudes
- **Uso:** El ID de usuario se usa para seguridad:
  - Identificación única para prevenir fraudes
  - Autenticación y autorización segura
  - Control de acceso a datos
- **Compartición:** Se comparte con Supabase (proveedor de backend) para implementar medidas de seguridad

**NO se selecciona:**
- ❌ **Estadísticas** - El ID de usuario no se usa directamente para análisis
- ❌ **Comunicaciones del desarrollador** - El ID de usuario no se usa para comunicaciones
- ❌ **Publicidad o marketing** - El ID de usuario no se usa para publicidad
- ❌ **Personalización** - El ID de usuario no se usa directamente para personalizar contenido

---

## 📋 RESUMEN PARA COPIAR EN GOOGLE PLAY CONSOLE

### ID de usuario

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
   - ✅ Seguridad, cumplimiento y prevención de fraudes

5. **¿Para qué se usan y comparten los datos de los usuarios?**
   - ✅ Funciones de la app
   - ✅ Administración de la cuenta
   - ✅ Seguridad, cumplimiento y prevención de fraudes

---

**Última actualización:** Enero 2025

