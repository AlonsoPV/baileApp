# 📋 Configuración de Datos - Número de Teléfono - Google Play Console

Respuestas específicas para configurar el tipo de dato "Número de teléfono" en Google Play Console.

---

## 1. ¿Estos datos se recopilan, se comparten o ambas?

**Seleccionar:**
- ⚠️ **Recopilados** (solo como WhatsApp, opcional)
- ⚠️ **Compartidos** (solo si se recopila)

**Justificación:**
- **Recopilados:** El número de teléfono se envía desde el dispositivo del usuario al desarrollador SOLO si el usuario decide compartir su número de WhatsApp. Es OPCIONAL.
- **Compartidos:** Si se recopila, el número se comparte con:
  - Supabase (proveedor de backend, almacenamiento necesario)
  - Usuarios públicos (el número de WhatsApp se muestra en perfiles públicos si el usuario lo proporciona)
  - WhatsApp (indirectamente, cuando los usuarios hacen clic en enlaces de WhatsApp)

**Nota importante:** 
- NO se recopila número de teléfono tradicional
- SOLO se recopila número de WhatsApp si el usuario decide compartirlo
- El usuario puede elegir proporcionarlo o no

---

## 2. ¿Estos datos se procesan de forma efímera?

**Respuesta:** ❌ **No, los datos recopilados NO se procesan de forma efímera**

**Justificación:**
- Si se proporciona, el número de WhatsApp se almacena de forma persistente en la base de datos (Supabase PostgreSQL)
- El número se guarda en:
  - `profiles_user.respuestas.redes.whatsapp` (para usuarios)
  - `profiles_teacher.redes_sociales.whatsapp` (para maestros)
  - `profiles_brand.whatsapp_number` (para marcas)
- El número permanece almacenado mientras el usuario tenga el perfil activo
- El número NO se almacena solo en memoria ni se elimina después de procesar una solicitud
- El número se usa continuamente para mostrar enlaces de WhatsApp en perfiles públicos

---

## 3. ¿Estos datos son necesarios para tu app o los usuarios pueden decidir si se recopilan o no?

**Respuesta:** ✅ **Los usuarios pueden decidir si los datos se recopilan o no**

**Justificación:**
- El número de WhatsApp es **OPCIONAL**
- El usuario **PUEDE** elegir proporcionarlo o no
- El usuario puede editar o eliminar el número en cualquier momento desde su perfil
- No es necesario para el funcionamiento básico de la app
- Solo se usa para facilitar contacto a través de WhatsApp

**Nota:** La recopilación de datos se mostrará como opcional en la ficha de Play Store.

---

## 4. ¿Por qué se recopilan los datos de los usuarios?

**Seleccionar las siguientes opciones:**
- ✅ **Funciones de la app**

**Justificación detallada:**

### ✅ Funciones de la app
- El número de WhatsApp se usa para habilitar funciones específicas:
  - Contacto directo a través de WhatsApp
  - Enlaces de WhatsApp para productos (marcas)
  - Comunicación entre usuarios
  - Funcionalidades de contacto en la app

**NO se selecciona:**
- ❌ **Estadísticas** - El número no se usa para estadísticas
- ❌ **Comunicaciones del desarrollador** - El número no se usa para comunicaciones del desarrollador
- ❌ **Publicidad o marketing** - El número no se usa para publicidad
- ❌ **Seguridad, cumplimiento y prevención de fraudes** - El número no se usa para estos propósitos
- ❌ **Personalización** - El número no se usa para personalizar contenido
- ❌ **Administración de la cuenta** - El número no es necesario para administrar la cuenta

---

## 5. ¿Para qué se usan y comparten los datos de los usuarios?

**Seleccionar las siguientes opciones:**
- ✅ **Funciones de la app**

**Justificación detallada:**

### ✅ Funciones de la app
- **Uso:** El número de WhatsApp se usa para habilitar funciones específicas:
  - Contacto directo a través de WhatsApp
  - Enlaces de WhatsApp para productos (marcas)
  - Comunicación entre usuarios
  - Funcionalidades de contacto en la app
- **Compartición:** Se comparte con:
  - Supabase (proveedor de backend, almacenamiento necesario)
  - Usuarios públicos (se muestra en perfiles públicos si el usuario lo proporciona)
  - WhatsApp (indirectamente, cuando los usuarios hacen clic en enlaces)

**NO se selecciona:**
- ❌ **Estadísticas** - El número no se usa para análisis
- ❌ **Comunicaciones del desarrollador** - El número no se usa para comunicaciones del desarrollador
- ❌ **Publicidad o marketing** - El número no se usa para publicidad
- ❌ **Seguridad, cumplimiento y prevención de fraudes** - El número no se usa para estos propósitos
- ❌ **Personalización** - El número no se usa para personalizar contenido
- ❌ **Administración de la cuenta** - El número no es necesario para administrar la cuenta

---

## 📋 RESUMEN PARA COPIAR EN GOOGLE PLAY CONSOLE

### Número de teléfono

1. **¿Estos datos se recopilan, se comparten o ambas?**
   - ⚠️ Recopilados (solo como WhatsApp, opcional)
   - ⚠️ Compartidos (solo si se recopila)

2. **¿Estos datos se procesan de forma efímera?**
   - ❌ No, los datos recopilados NO se procesan de forma efímera

3. **¿Estos datos son necesarios para tu app o los usuarios pueden decidir si se recopilan o no?**
   - ✅ Los usuarios pueden decidir si los datos se recopilan o no

4. **¿Por qué se recopilan los datos de los usuarios?**
   - ✅ Funciones de la app

5. **¿Para qué se usan y comparten los datos de los usuarios?**
   - ✅ Funciones de la app

---

## 🔒 NOTAS IMPORTANTES

### Cuándo se recopila:
- SOLO si el usuario decide compartir su número de WhatsApp
- Es completamente opcional
- El usuario puede editar o eliminar el número en cualquier momento

### Qué NO se recopila:
- NO se recopila número de teléfono tradicional
- NO se accede a la lista de contactos del dispositivo
- NO se solicita permiso para acceder al teléfono

---

**Última actualización:** Enero 2025

