# 📋 Configuración de Datos - Otra Información - Google Play Console

Respuestas específicas para configurar el tipo de dato "Otra información" en Google Play Console.

---

## 1. ¿Estos datos se recopilan, se comparten o ambas?

**Seleccionar:**
- ✅ **Recopilados**
- ✅ **Compartidos**

**Justificación:**
- **Recopilados:** Los datos se envían desde el dispositivo del usuario al desarrollador y se almacenan en la base de datos (Supabase) y Supabase Storage (archivos multimedia)
- **Compartidos:** Los datos se comparten con:
  - Supabase (proveedor de backend y almacenamiento, necesario para funcionamiento)
  - Usuarios públicos (perfiles públicos, eventos, clases - información que el usuario decide hacer pública)
  - Google OAuth (solo durante proceso de autenticación OAuth, si el usuario elige usar Google)
  - Vercel (métricas de rendimiento y logs, si está desplegado allí)

**Tipos de datos incluidos en "Otra información":**
- Biografía, foto de perfil, preferencias de baile (ritmos, zonas)
- Redes sociales (Instagram, TikTok, YouTube, Facebook, WhatsApp)
- Contenido multimedia (fotos, videos)
- Actividad del usuario (RSVPs, asistencias, notificaciones)
- Datos técnicos (IP, User-Agent, tokens de sesión)

---

## 2. ¿Estos datos se procesan de forma efímera?

**Respuesta:** ⚠️ **PARCIALMENTE - Algunos datos sí, otros no**

**Justificación:**
- **Datos NO efímeros (almacenados persistentemente):**
  - Biografía, foto de perfil, preferencias (ritmos, zonas)
  - Redes sociales
  - Contenido multimedia (fotos, videos)
  - Actividad del usuario (RSVPs, asistencias, notificaciones)
  - Estos datos se almacenan en la base de datos y permanecen mientras el usuario tenga cuenta activa

- **Datos efímeros (procesados temporalmente):**
  - Dirección IP (se registra en logs pero puede no almacenarse permanentemente)
  - User-Agent (se registra en logs pero puede no almacenarse permanentemente)
  - Tokens de sesión (se almacenan localmente pero se renuevan periódicamente)

**Respuesta para Google Play Console:** ❌ **No, los datos recopilados NO se procesan de forma efímera** (la mayoría de los datos se almacenan persistentemente)

---

## 3. ¿Estos datos son necesarios para tu app o los usuarios pueden decidir si se recopilan o no?

**Respuesta:** ⚠️ **PARCIALMENTE - Algunos datos son necesarios, otros son opcionales**

**Justificación:**
- **Datos necesarios (obligatorios):**
  - Preferencias de baile (ritmos, zonas) - obligatorios durante onboarding
  - Datos técnicos (IP, User-Agent, tokens de sesión) - automáticos, necesarios para funcionamiento

- **Datos opcionales (el usuario puede decidir):**
  - Biografía - opcional
  - Foto de perfil - opcional (aunque se recomienda)
  - Redes sociales - opcionales
  - Contenido multimedia - opcional
  - Actividad del usuario - el usuario puede elegir participar o no

**Respuesta para Google Play Console:** ⚠️ **Ambas opciones aplican:**
- Algunos datos son necesarios (ritmos, zonas, datos técnicos)
- Otros datos son opcionales (biografía, redes sociales, multimedia)

**Recomendación:** Seleccionar "Los usuarios pueden decidir si los datos se recopilan o no" ya que la mayoría de los datos en esta categoría son opcionales, excepto algunos datos técnicos automáticos.

---

## 4. ¿Por qué se recopilan los datos de los usuarios?

**Seleccionar las siguientes opciones:**
- ✅ **Funciones de la app**
- ✅ **Personalización**
- ✅ **Administración de la cuenta**
- ✅ **Estadísticas** (solo para datos técnicos)

**Justificación detallada:**

### ✅ Funciones de la app
- Los datos se usan para habilitar funciones de la app:
  - Mostrar perfiles de usuario
  - Crear y mostrar eventos, clases, productos
  - Interacciones entre usuarios (RSVPs, seguimientos)
  - Funcionalidades de contenido multimedia

### ✅ Personalización
- Los datos se usan para personalizar la experiencia:
  - Recomendaciones basadas en preferencias (ritmos, zonas)
  - Contenido personalizado en el feed
  - Sugerencias de eventos y clases relevantes

### ✅ Administración de la cuenta
- Los datos se usan para configurar y administrar la cuenta:
  - Configurar preferencias de perfil
  - Gestionar información del usuario
  - Administrar contenido creado por el usuario

### ✅ Estadísticas (solo para datos técnicos)
- Los datos técnicos (IP, User-Agent) se usan para:
  - Análisis de uso de la app
  - Métricas de rendimiento
  - Detección de errores
  - Mejora del rendimiento

**NO se selecciona:**
- ❌ **Comunicaciones del desarrollador** - Los datos no se usan específicamente para comunicaciones de marketing
- ❌ **Publicidad o marketing** - Los datos no se usan para publicidad
- ❌ **Seguridad, cumplimiento y prevención de fraudes** - Aunque algunos datos pueden ayudar, no es el propósito principal

---

## 5. ¿Para qué se usan y comparten los datos de los usuarios?

**Seleccionar las siguientes opciones:**
- ✅ **Funciones de la app**
- ✅ **Personalización**
- ✅ **Administración de la cuenta**
- ✅ **Estadísticas** (solo para datos técnicos)

**Justificación detallada:**

### ✅ Funciones de la app
- **Uso:** Los datos se usan para habilitar funciones:
  - Mostrar perfiles, eventos, clases, productos
  - Interacciones entre usuarios
  - Funcionalidades de contenido multimedia
- **Compartición:** Se comparte con:
  - Supabase (proveedor de backend, almacenamiento necesario)
  - Usuarios públicos (contenido que el usuario decide hacer público)

### ✅ Personalización
- **Uso:** Los datos se usan para personalizar la experiencia:
  - Recomendaciones basadas en preferencias
  - Contenido personalizado
  - Sugerencias relevantes
- **Compartición:** Se comparte con usuarios públicos para permitir interacciones personalizadas

### ✅ Administración de la cuenta
- **Uso:** Los datos se usan para configurar y administrar la cuenta:
  - Configurar preferencias
  - Gestionar información del usuario
  - Administrar contenido
- **Compartición:** Se comparte con Supabase (proveedor de backend) para almacenamiento y gestión

### ✅ Estadísticas (solo para datos técnicos)
- **Uso:** Los datos técnicos se usan para:
  - Análisis de uso
  - Métricas de rendimiento
  - Detección de errores
- **Compartición:** Se comparte con Vercel (si está desplegado allí) para métricas de rendimiento

**NO se selecciona:**
- ❌ **Comunicaciones del desarrollador** - Los datos no se usan para comunicaciones de marketing
- ❌ **Publicidad o marketing** - Los datos no se usan para publicidad
- ❌ **Seguridad, cumplimiento y prevención de fraudes** - Aunque algunos datos pueden ayudar, no es el propósito principal

---

## 📋 RESUMEN PARA COPIAR EN GOOGLE PLAY CONSOLE

### Otra información

1. **¿Estos datos se recopilan, se comparten o ambas?**
   - ✅ Recopilados
   - ✅ Compartidos

2. **¿Estos datos se procesan de forma efímera?**
   - ❌ No, los datos recopilados NO se procesan de forma efímera

3. **¿Estos datos son necesarios para tu app o los usuarios pueden decidir si se recopilan o no?**
   - ✅ Los usuarios pueden decidir si los datos se recopilan o no
   - (Nota: Algunos datos son necesarios como ritmos/zonas, pero la mayoría son opcionales)

4. **¿Por qué se recopilan los datos de los usuarios?**
   - ✅ Funciones de la app
   - ✅ Personalización
   - ✅ Administración de la cuenta
   - ✅ Estadísticas (solo para datos técnicos)

5. **¿Para qué se usan y comparten los datos de los usuarios?**
   - ✅ Funciones de la app
   - ✅ Personalización
   - ✅ Administración de la cuenta
   - ✅ Estadísticas (solo para datos técnicos)

---

## 🔒 NOTAS IMPORTANTES

### Tipos de datos incluidos:
- **Información del perfil:** Biografía, foto, preferencias (ritmos, zonas)
- **Redes sociales:** Instagram, TikTok, YouTube, Facebook, WhatsApp
- **Contenido multimedia:** Fotos y videos subidos por el usuario
- **Actividad:** RSVPs, asistencias, notificaciones
- **Datos técnicos:** IP, User-Agent, tokens de sesión

### Control del usuario:
- La mayoría de los datos son opcionales
- El usuario puede editar o eliminar su información en cualquier momento
- El usuario controla qué información hacer pública
- Algunos datos son necesarios (ritmos, zonas) para personalización básica

---

**Última actualización:** Enero 2025

