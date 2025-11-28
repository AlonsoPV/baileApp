# 📋 Configuración de Datos - Dirección - Google Play Console

Respuestas específicas para configurar el tipo de dato "Dirección" en Google Play Console.

---

## 1. ¿Estos datos se recopilan, se comparten o ambas?

**Seleccionar:**
- ⚠️ **Recopilados** (solo si el usuario crea perfil de academia o maestro)
- ⚠️ **Compartidos** (solo si se recopila)

**Justificación:**
- **Recopilados:** La dirección se envía desde el dispositivo del usuario al desarrollador SOLO si el usuario crea un perfil de academia o maestro y decide proporcionarla. Es OPCIONAL.
- **Compartidos:** Si se recopila, la dirección se comparte con:
  - Supabase (proveedor de backend, almacenamiento necesario)
  - Usuarios públicos (la ubicación se muestra en perfiles públicos de academias/maestros)

**Nota importante:** Los usuarios regulares NO proporcionan dirección física, solo seleccionan una "zona" geográfica de un catálogo predefinido (ej: "Ciudad de México"), que NO es una dirección física.

---

## 2. ¿Estos datos se procesan de forma efímera?

**Respuesta:** ❌ **No, los datos recopilados NO se procesan de forma efímera**

**Justificación:**
- Si se proporciona, la dirección se almacena de forma persistente en la base de datos (Supabase PostgreSQL)
- La dirección se guarda en:
  - `profiles_academy.ubicacion` (para academias)
  - `profiles_teacher.ubicaciones[]` (para maestros)
- La dirección permanece almacenada mientras el usuario tenga el perfil activo
- La dirección NO se almacena solo en memoria ni se elimina después de procesar una solicitud
- La dirección se usa continuamente para mostrar ubicación en perfiles públicos

---

## 3. ¿Estos datos son necesarios para tu app o los usuarios pueden decidir si se recopilan o no?

**Respuesta:** ✅ **Los usuarios pueden decidir si los datos se recopilan o no**

**Justificación:**
- La dirección es **OPCIONAL**
- El usuario **PUEDE** elegir proporcionarla o no
- Solo se recopila si:
  - El usuario crea un perfil de academia o maestro
  - Y decide proporcionar la dirección física
- Los usuarios regulares NO proporcionan dirección física
- El usuario puede editar o eliminar la dirección en cualquier momento desde su perfil

**Nota:** La recopilación de datos se mostrará como opcional en la ficha de Play Store.

---

## 4. ¿Por qué se recopilan los datos de los usuarios?

**Seleccionar las siguientes opciones:**
- ✅ **Funciones de la app**
- ✅ **Personalización**

**Justificación detallada:**

### ✅ Funciones de la app
- La dirección se usa para habilitar funciones específicas:
  - Mostrar ubicación física de academias y maestros
  - Búsqueda y filtrado geográfico
  - Información de contacto para clases/eventos
  - Funcionalidades de ubicación en la app

### ✅ Personalización
- La dirección se usa para personalizar la experiencia:
  - Mostrar academias/maestros cercanos
  - Recomendaciones basadas en ubicación
  - Filtrado geográfico de contenido

**NO se selecciona:**
- ❌ **Estadísticas** - La dirección no se usa para estadísticas
- ❌ **Comunicaciones del desarrollador** - La dirección no se usa para comunicaciones
- ❌ **Publicidad o marketing** - La dirección no se usa para publicidad
- ❌ **Seguridad, cumplimiento y prevención de fraudes** - La dirección no se usa para estos propósitos
- ❌ **Administración de la cuenta** - La dirección no es necesaria para administrar la cuenta

---

## 5. ¿Para qué se usan y comparten los datos de los usuarios?

**Seleccionar las siguientes opciones:**
- ✅ **Funciones de la app**
- ✅ **Personalización**

**Justificación detallada:**

### ✅ Funciones de la app
- **Uso:** La dirección se usa para habilitar funciones específicas:
  - Mostrar ubicación física en perfiles públicos
  - Búsqueda y filtrado geográfico
  - Información de contacto para clases/eventos
- **Compartición:** Se comparte con:
  - Supabase (proveedor de backend, almacenamiento necesario)
  - Usuarios públicos (se muestra en perfiles públicos de academias/maestros)

### ✅ Personalización
- **Uso:** La dirección se usa para personalizar la experiencia:
  - Mostrar academias/maestros cercanos
  - Recomendaciones basadas en ubicación
  - Filtrado geográfico de contenido
- **Compartición:** Se comparte con usuarios públicos para permitir búsqueda y filtrado geográfico

**NO se selecciona:**
- ❌ **Estadísticas** - La dirección no se usa para análisis
- ❌ **Comunicaciones del desarrollador** - La dirección no se usa para comunicaciones
- ❌ **Publicidad o marketing** - La dirección no se usa para publicidad
- ❌ **Seguridad, cumplimiento y prevención de fraudes** - La dirección no se usa para estos propósitos
- ❌ **Administración de la cuenta** - La dirección no es necesaria para administrar la cuenta

---

## 📋 RESUMEN PARA COPIAR EN GOOGLE PLAY CONSOLE

### Dirección

1. **¿Estos datos se recopilan, se comparten o ambas?**
   - ⚠️ Recopilados (solo opcionalmente para academias/maestros)
   - ⚠️ Compartidos (solo si se recopila)

2. **¿Estos datos se procesan de forma efímera?**
   - ❌ No, los datos recopilados NO se procesan de forma efímera

3. **¿Estos datos son necesarios para tu app o los usuarios pueden decidir si se recopilan o no?**
   - ✅ Los usuarios pueden decidir si los datos se recopilan o no

4. **¿Por qué se recopilan los datos de los usuarios?**
   - ✅ Funciones de la app
   - ✅ Personalización

5. **¿Para qué se usan y comparten los datos de los usuarios?**
   - ✅ Funciones de la app
   - ✅ Personalización

---

## 🔒 NOTAS IMPORTANTES

### Cuándo se recopila:
- SOLO si el usuario crea un perfil de academia o maestro
- Y decide proporcionar la dirección física
- Es completamente opcional

### Qué NO es dirección:
- La selección de "zona" geográfica (ej: "Ciudad de México") NO es una dirección física
- Los usuarios regulares solo seleccionan una zona de un catálogo predefinido
- Esto NO se considera "dirección" para efectos de esta categoría

---

**Última actualización:** Enero 2025

