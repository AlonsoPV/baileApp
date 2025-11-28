# 📋 Respuestas para Google Play Console - Privacidad y Seguridad

## 1. ¿Todos los datos de los usuarios que recopila tu app se encriptan en tránsito?

**Respuesta: SÍ**

**Justificación:**
- La app utiliza Supabase como backend, que por defecto usa HTTPS/TLS para todas las comunicaciones
- Todas las peticiones HTTP se realizan sobre conexiones encriptadas (HTTPS)
- Los datos se transmiten de forma segura entre el cliente y el servidor
- Supabase cumple con estándares de seguridad y encriptación en tránsito

---

## 2. ¿Cuál de los siguientes métodos de creación de cuentas admite la app?

**Respuestas seleccionadas:**
- ✅ **Nombre de usuario y contraseña** (Email y contraseña)
- ✅ **OAuth** (Google)
- ✅ **Otro** (Magic Link - enlace mágico por email)

**Justificación:**
- La app soporta **Email y contraseña** tradicional: Los usuarios pueden crear una cuenta con email y contraseña, e iniciar sesión con estas credenciales
- La app también utiliza **Magic Link** (enlace mágico enviado por email) como método alternativo de autenticación sin contraseña
- La app también soporta **OAuth con Google** ("Continuar con Google")
- Después del login, se requiere un PIN de 4 dígitos como capa adicional de seguridad (solo primera vez)

**Detalles técnicos:**
- Email y contraseña: El usuario puede registrarse con email y contraseña, e iniciar sesión con estas credenciales
- Magic Link: El usuario ingresa su email, recibe un enlace por correo, hace clic y se autentica (sin necesidad de contraseña)
- Google OAuth: El usuario puede iniciar sesión usando su cuenta de Google
- PIN: Después del primer login, se configura un PIN de 4 dígitos para sesiones futuras

---

## 3. URL de Eliminación de Cuenta

**URL:** `https://dondebailar.com.mx/eliminar-cuenta`

**Descripción de la página:**
La página pública de eliminación de cuenta (`/eliminar-cuenta`) permite a los usuarios solicitar la eliminación completa de su cuenta y todos sus datos personales. La página incluye:

1. **Información clara sobre qué se elimina:**
   - Cuenta de autenticación
   - Perfil de usuario y perfiles relacionados (academia, maestro, organizador, marca)
   - Eventos y clases creados
   - Interacciones (RSVPs, seguimientos, notificaciones)
   - Imágenes y archivos subidos
   - Todos los datos personales asociados

2. **Datos que se conservan:**
   - Ciertos datos pueden conservarse por períodos adicionales según lo requiera la ley (por ejemplo, registros de transacciones por razones fiscales)
   - Estos datos se eliminarán automáticamente al cumplirse los períodos legales aplicables

3. **Plazo de procesamiento:**
   - Las solicitudes se procesan en un plazo máximo de **30 días** desde la recepción

4. **Formulario de solicitud:**
   - Campo de correo electrónico (requerido)
   - Campo de nombre completo (opcional)
   - Campo de razón (opcional)
   - Checkbox de confirmación de que entienden que la eliminación es permanente
   - Campo de confirmación donde deben escribir "ELIMINAR"

5. **Información de contacto:**
   - Email: info@dondebailar.com.mx
   - Los usuarios pueden contactar directamente si tienen preguntas

**Pasos que los usuarios deben seguir:**
1. Visitar `https://dondebailar.com.mx/eliminar-cuenta`
2. Completar el formulario con su correo electrónico asociado a la cuenta
3. Leer y confirmar que entienden que la eliminación es permanente
4. Escribir "ELIMINAR" en el campo de confirmación
5. Enviar la solicitud
6. Recibir confirmación de que la solicitud será procesada en un plazo máximo de 30 días

**Nota:** La página es accesible públicamente, sin necesidad de iniciar sesión, aunque si el usuario tiene sesión activa, se prellenará su correo electrónico.

---

## 4. ¿Pones a disposición de los usuarios una forma para que soliciten que se borre una parte o la totalidad de sus datos, sin necesidad de que deban borrar su cuenta?

**Respuesta: SÍ**

**Justificación:**
- La misma página de eliminación de cuenta (`/eliminar-cuenta`) permite a los usuarios contactar para solicitar la eliminación parcial de datos
- Los usuarios pueden enviar un email a `info@dondebailar.com.mx` especificando qué datos desean eliminar sin eliminar toda la cuenta
- En el formulario de eliminación, hay una sección de ayuda que menciona: "Si deseas solicitar la eliminación de solo una parte de tus datos, puedes contactarnos"

**Funcionalidades disponibles:**
1. **Eliminación completa de cuenta:** A través del formulario en `/eliminar-cuenta`
2. **Eliminación parcial de datos:** Contactando a `info@dondebailar.com.mx` con la solicitud específica
3. **Edición de datos:** Los usuarios pueden editar su perfil desde la app para actualizar o eliminar información específica

**Ejemplos de eliminación parcial:**
- Eliminar solo la foto de perfil
- Eliminar solo ciertos eventos o clases publicados
- Eliminar solo el perfil de maestro/academia/organizador/marca (manteniendo el perfil de usuario)
- Eliminar solo las interacciones (RSVPs, seguimientos)

---

## 📝 Resumen para Copiar en Google Play Console

### Pregunta 1: Encriptación en tránsito
**Respuesta:** SÍ

### Pregunta 2: Métodos de creación de cuentas
**Respuestas seleccionadas:**
- Nombre de usuario y contraseña (Email y contraseña)
- OAuth (Google)
- Otro (Magic Link - enlace mágico por email)

### Pregunta 3: URL de eliminación de cuenta
**URL:** `https://dondebailar.com.mx/eliminar-cuenta`

**Descripción:** Página pública que permite a los usuarios solicitar la eliminación completa de su cuenta y datos personales. Incluye información sobre qué datos se eliminan, datos que se conservan por razones legales, plazo de procesamiento (30 días), y un formulario de solicitud con confirmación. También proporciona información de contacto para solicitudes de eliminación parcial de datos.

### Pregunta 4: Eliminación parcial de datos
**Respuesta:** SÍ

Los usuarios pueden:
- Solicitar eliminación completa a través de `/eliminar-cuenta`
- Solicitar eliminación parcial contactando a `info@dondebailar.com.mx`
- Editar su perfil desde la app para actualizar o eliminar información específica

---

**Última actualización:** Enero 2025

