# 🧪 Guía de Pruebas QA - Baile App
## Documento dividido para 4 usuarios de prueba

**Versión:** 1.0.0  
**Fecha:** Diciembre 2024  
**URL de la aplicación:** https://baile-app-1lfl.vercel.app

---

## 📋 **Instrucciones Generales**

### **Para todos los usuarios:**
- ✅ **Crea una cuenta nueva** con un email diferente para cada usuario
- ✅ **Reporta cualquier error** con capturas de pantalla y pasos para reproducirlo
- ✅ **Verifica tanto en desktop como en móvil** (responsive)
- ✅ **Prueba en diferentes navegadores** (Chrome, Firefox, Safari)
- ✅ **Completa todas las pruebas** de tu sección antes de reportar

### **Cómo reportar problemas:**
1. **Descripción clara** del problema
2. **Pasos para reproducirlo** (step-by-step)
3. **Comportamiento esperado** vs **comportamiento actual**
4. **Capturas de pantalla** o videos
5. **Navegador y dispositivo** utilizado

---

# 👤 **USUARIO 1: Autenticación, Onboarding y Perfil de Usuario**

## 🎯 **Objetivo:** Verificar que nuevos usuarios pueden registrarse, completar onboarding y gestionar su perfil básico.

---

## **1. Autenticación y Registro**

### **Prueba 1.1: Registro con Magic Link**
- [ ] Ir a `/login` o `/signup`
- [ ] Ingresar un email válido (ej: `usuario1.test@example.com`)
- [ ] Presionar "Enviar link mágico"
- [ ] Verificar mensaje de confirmación: "Revisa tu email..."
- [ ] Abrir email y hacer clic en el link mágico
- [ ] Verificar redirección a `/auth/callback`
- [ ] Verificar que se crea sesión correctamente

### **Prueba 1.2: Login con PIN (si aplica)**
- [ ] Después del magic link, verificar si se solicita PIN
- [ ] Si es primera vez, configurar PIN de 4 dígitos
- [ ] Verificar que el PIN se guarda correctamente
- [ ] Cerrar sesión y volver a iniciar sesión
- [ ] Verificar que se solicita PIN al iniciar sesión
- [ ] Ingresar PIN incorrecto y verificar mensaje de error
- [ ] Ingresar PIN correcto y verificar acceso

### **Prueba 1.3: Recuperación de PIN**
- [ ] En la pantalla de PIN, hacer clic en "¿Olvidé mi PIN?"
- [ ] Verificar que se redirige a `/auth/pin/setup`
- [ ] Configurar nuevo PIN
- [ ] Verificar que el nuevo PIN funciona

---

## **2. Onboarding (Flujo de Bienvenida)**

### **Prueba 2.1: Paso 1 - Datos Básicos**
- [ ] Verificar redirección automática a `/onboarding/basics`
- [ ] Ingresar nombre de usuario (display_name)
- [ ] Seleccionar "Como te identificas" (lead, follow, ambos)
- [ ] Subir foto de avatar (opcional pero recomendado)
- [ ] Verificar que la foto se muestra en preview
- [ ] Presionar "Continuar" y verificar que NO avanza si falta el nombre
- [ ] Completar nombre y presionar "Continuar"
- [ ] Verificar redirección a `/onboarding/ritmos`

### **Prueba 2.2: Paso 2 - Ritmos Favoritos**
- [ ] Verificar que se muestran chips de ritmos disponibles
- [ ] Seleccionar al menos 1 ritmo (ej: Salsa, Bachata)
- [ ] Verificar que los chips seleccionados se destacan visualmente
- [ ] Seleccionar múltiples ritmos (3-5)
- [ ] Presionar "Continuar" y verificar que NO avanza sin selección
- [ ] Seleccionar al menos 1 ritmo y presionar "Continuar"
- [ ] Verificar redirección a `/onboarding/zonas`

### **Prueba 2.3: Paso 3 - Zonas Favoritas**
- [ ] Verificar que se muestran chips de zonas disponibles
- [ ] Seleccionar al menos 1 zona (ej: CDMX Norte, Sur)
- [ ] Verificar que los chips seleccionados se destacan visualmente
- [ ] Seleccionar múltiples zonas (2-4)
- [ ] Presionar "Completar" y verificar que NO avanza sin selección
- [ ] Seleccionar al menos 1 zona y presionar "Completar"
- [ ] Verificar redirección a `/app/explore`
- [ ] Verificar que `onboarding_complete` se actualiza a `true`

### **Prueba 2.4: Validación de Onboarding**
- [ ] Intentar acceder a `/app/explore` sin completar onboarding
- [ ] Verificar que se redirige a `/onboarding/basics`
- [ ] Completar onboarding completo
- [ ] Verificar que ya no se redirige al onboarding
- [ ] Verificar que puede acceder a todas las rutas protegidas

---

## **3. Perfil de Usuario Básico**

### **Prueba 3.1: Ver Perfil Público**
- [ ] Ir a `/app/profile`
- [ ] Verificar que se muestra el nombre de usuario
- [ ] Verificar que se muestra el avatar (si se subió)
- [ ] Verificar que se muestran los ritmos seleccionados
- [ ] Verificar que se muestran las zonas seleccionadas
- [ ] Verificar que se muestra "Como te identificas" (lead/follow/ambos)

### **Prueba 3.2: Editar Perfil Básico**
- [ ] Ir a `/app/profile` y hacer clic en "Editar perfil"
- [ ] Modificar el nombre de usuario
- [ ] Cambiar la foto de avatar
- [ ] Modificar "Como te identificas"
- [ ] Agregar o modificar bio (descripción)
- [ ] Guardar cambios
- [ ] Verificar que los cambios se reflejan en el perfil público

### **Prueba 3.3: Preferencias de Filtros**
- [ ] Ir a `/app/profile` y buscar sección "⭐ Preferencias de Filtros"
- [ ] Hacer clic en "⚙️ Configurar Preferencias de Filtros"
- [ ] Verificar que se abre modal de preferencias
- [ ] Seleccionar ritmos favoritos (múltiples)
- [ ] Seleccionar zonas favoritas (múltiples)
- [ ] Seleccionar rango de fecha favorito (Hoy, Esta semana, Este mes, Personalizado, Sin filtros)
- [ ] Si selecciona "Personalizado", ingresar número de días
- [ ] Hacer clic en "💾 Guardar cambios"
- [ ] Verificar mensaje de confirmación
- [ ] Verificar que las preferencias se guardan correctamente

### **Prueba 3.4: Aplicación de Filtros Predeterminados**
- [ ] Cerrar sesión y volver a iniciar sesión
- [ ] Ir a `/app/explore`
- [ ] Verificar que se aplican automáticamente los filtros guardados
- [ ] Verificar que se muestra indicador "⭐ Usando tus filtros favoritos"
- [ ] Modificar algún filtro manualmente
- [ ] Verificar que el indicador desaparece
- [ ] Hacer clic en "🔄 Restablecer favoritos"
- [ ] Verificar que se restauran los filtros guardados

---

## **4. Navegación y Menú**

### **Prueba 4.1: Menú Offcanvas**
- [ ] Hacer clic en el ícono de menú (hamburguesa) en la barra superior
- [ ] Verificar que se abre el menú lateral (offcanvas)
- [ ] Verificar que se muestra el avatar y nombre de usuario
- [ ] Verificar que se muestra el email del usuario
- [ ] Verificar que se muestran las opciones del menú:
  - [ ] Retos
  - [ ] Trending
  - [ ] Mi perfil
  - [ ] Solicitar rol
  - [ ] ¿Qué significa los perfiles con ✅?
  - [ ] Cerrar sesión (🚪)

### **Prueba 4.2: Navegación del Menú**
- [ ] Hacer clic en "Retos" y verificar redirección a `/challenges`
- [ ] Volver al menú y hacer clic en "Trending"
- [ ] Verificar redirección a `/trending`
- [ ] Volver al menú y hacer clic en "Mi perfil"
- [ ] Verificar redirección a `/app/profile`
- [ ] Volver al menú y hacer clic en "Solicitar rol"
- [ ] Verificar redirección a `/app/roles/request`
- [ ] Volver al menú y hacer clic en "¿Qué significa los perfiles con ✅?"
- [ ] Verificar redirección a `/validation/info`

### **Prueba 4.3: Cerrar Sesión**
- [ ] Abrir el menú offcanvas
- [ ] Hacer clic en el botón de logout (🚪) en la esquina superior derecha
- [ ] Verificar que se cierra la sesión
- [ ] Verificar que se redirige a la página principal (`/`)
- [ ] Verificar que ya no se puede acceder a rutas protegidas
- [ ] Intentar acceder a `/app/profile` directamente
- [ ] Verificar que se redirige a `/login`

### **Prueba 4.4: Cerrar Menú**
- [ ] Abrir el menú offcanvas
- [ ] Hacer clic fuera del menú (en el overlay)
- [ ] Verificar que el menú se cierra
- [ ] Abrir el menú nuevamente
- [ ] Presionar la tecla "Escape"
- [ ] Verificar que el menú se cierra

---

## **5. Responsive y Compatibilidad**

### **Prueba 5.1: Vista Móvil**
- [ ] Abrir la aplicación en un dispositivo móvil o emulador móvil
- [ ] Verificar que el menú offcanvas se adapta correctamente
- [ ] Verificar que el perfil se ve correctamente en móvil
- [ ] Verificar que los formularios son usables en móvil
- [ ] Verificar que los botones tienen tamaño adecuado para tocar

### **Prueba 5.2: Vista Desktop**
- [ ] Abrir la aplicación en desktop
- [ ] Verificar que el diseño se ve correctamente
- [ ] Verificar que el menú offcanvas funciona correctamente
- [ ] Verificar que los formularios se ven bien en pantalla grande

---

## **📝 Reporte de Usuario 1**

### **Problemas Encontrados:**
1. 
2. 
3. 

### **Sugerencias de Mejora:**
1. 
2. 
3. 

### **Estado General:**
- [ ] ✅ Todo funciona correctamente
- [ ] ⚠️ Hay problemas menores
- [ ] ❌ Hay problemas críticos

---

# 👤 **USUARIO 2: Exploración, Filtros, Eventos y RSVP**

## 🎯 **Objetivo:** Verificar que los usuarios pueden explorar eventos, aplicar filtros, ver detalles y hacer RSVP.

---

## **1. Exploración de Eventos**

### **Prueba 1.1: Página Principal de Exploración**
- [ ] Ir a `/app/explore`
- [ ] Verificar que se muestran eventos y clases
- [ ] Verificar que las tarjetas de eventos se muestran correctamente
- [ ] Verificar que se muestran imágenes de fondo en las tarjetas
- [ ] Verificar que se muestran títulos, fechas y ubicaciones
- [ ] Verificar que las tarjetas son clickeables

### **Prueba 1.2: Navegación a Detalles de Evento**
- [ ] Hacer clic en una tarjeta de evento
- [ ] Verificar que se redirige a la página de detalles del evento
- [ ] Verificar que se muestra toda la información del evento:
  - [ ] Título
  - [ ] Fecha y hora
  - [ ] Ubicación
  - [ ] Descripción
  - [ ] Ritmos
  - [ ] Organizador
  - [ ] Botón "Agregar a calendario"

### **Prueba 1.3: Filtrado de Eventos por Fecha**
- [ ] Verificar que eventos pasados NO se muestran (desaparecen automáticamente)
- [ ] Verificar que eventos futuros se muestran correctamente
- [ ] Verificar que eventos de hoy se muestran
- [ ] Verificar que eventos de esta semana se muestran
- [ ] Verificar que los eventos están ordenados cronológicamente (más cercanos primero)

---

## **2. Sistema de Filtros**

### **Prueba 2.1: Filtro por Ritmos**
- [ ] Ir a `/app/explore`
- [ ] Verificar que se muestra la barra de filtros
- [ ] Hacer clic en el ícono de "Ritmos"
- [ ] Seleccionar uno o más ritmos (ej: Salsa, Bachata)
- [ ] Verificar que solo se muestran eventos/clases con esos ritmos
- [ ] Deseleccionar un ritmo
- [ ] Verificar que se actualiza la lista
- [ ] Deseleccionar todos los ritmos
- [ ] Verificar que se muestran todos los eventos/clases

### **Prueba 2.2: Filtro por Zonas**
- [ ] Hacer clic en el ícono de "Zonas"
- [ ] Seleccionar una o más zonas (ej: CDMX Norte, Sur)
- [ ] Verificar que solo se muestran eventos/clases en esas zonas
- [ ] Deseleccionar una zona
- [ ] Verificar que se actualiza la lista
- [ ] Deseleccionar todas las zonas
- [ ] Verificar que se muestran todos los eventos/clases

### **Prueba 2.3: Filtro por Fechas**
- [ ] Hacer clic en el ícono de "Fechas"
- [ ] Seleccionar "Hoy"
- [ ] Verificar que solo se muestran eventos/clases de hoy
- [ ] Seleccionar "Esta semana"
- [ ] Verificar que solo se muestran eventos/clases de esta semana
- [ ] Seleccionar "Siguientes"
- [ ] Verificar que se muestran eventos/clases futuros
- [ ] Seleccionar "Todos"
- [ ] Verificar que se muestran todos los eventos/clases futuros

### **Prueba 2.4: Búsqueda (Barra de Búsqueda)**
- [ ] Verificar que la barra de búsqueda está colapsada al final de los filtros
- [ ] Hacer clic en la barra de búsqueda para expandirla
- [ ] Ingresar un término de búsqueda (ej: "Salsa")
- [ ] Verificar que se filtran eventos/clases que coinciden
- [ ] Limpiar la búsqueda
- [ ] Verificar que se muestran todos los eventos/clases

### **Prueba 2.5: Combinación de Filtros**
- [ ] Aplicar filtro de ritmos (ej: Salsa)
- [ ] Aplicar filtro de zonas (ej: CDMX Norte)
- [ ] Aplicar filtro de fechas (ej: Esta semana)
- [ ] Verificar que se muestran solo eventos/clases que cumplen TODOS los filtros
- [ ] Remover un filtro
- [ ] Verificar que se actualiza la lista correctamente

### **Prueba 2.6: Filtros Predeterminados (si están configurados)**
- [ ] Si el usuario tiene preferencias de filtros guardadas
- [ ] Verificar que se aplican automáticamente al cargar `/app/explore`
- [ ] Verificar que se muestra indicador "⭐ Usando tus filtros favoritos"
- [ ] Modificar un filtro manualmente
- [ ] Verificar que el indicador desaparece
- [ ] Hacer clic en "🔄 Restablecer favoritos"
- [ ] Verificar que se restauran los filtros guardados

---

## **3. Detalles de Eventos**

### **Prueba 3.1: Información del Evento**
- [ ] Hacer clic en una tarjeta de evento
- [ ] Verificar que se muestra:
  - [ ] Título del evento (bien visible)
  - [ ] Fecha y hora (formato claro)
  - [ ] Ubicación (con ícono)
  - [ ] Descripción completa
  - [ ] Ritmos asociados
  - [ ] Organizador (con enlace al perfil)
  - [ ] Imágenes del evento

### **Prueba 3.2: Chips de Información**
- [ ] Verificar que los chips de fecha, hora y ubicación tienen buen diseño
- [ ] Verificar que los chips son legibles
- [ ] Verificar que los chips tienen íconos apropiados
- [ ] Verificar que el diseño es consistente

### **Prueba 3.3: Botón "Agregar a Calendario"**
- [ ] Hacer clic en "Agregar a calendario"
- [ ] Si no está logueado, verificar que se redirige a `/login`
- [ ] Si está logueado, verificar que se genera el archivo de calendario
- [ ] Verificar que se descarga el archivo `.ics`
- [ ] Verificar que el evento se registra como "tentative" en las métricas (si aplica)

### **Prueba 3.4: Compartir Evento**
- [ ] Buscar botón de compartir en la página de detalles
- [ ] Hacer clic en compartir
- [ ] Verificar que se abre el diálogo de compartir nativo
- [ ] Verificar que la URL se copia correctamente
- [ ] Compartir el evento y verificar que la URL funciona

---

## **4. RSVP y Asistencia**

### **Prueba 4.1: RSVP a Evento**
- [ ] Ir a un evento que permita RSVP
- [ ] Verificar que se muestra contador de RSVPs
- [ ] Hacer clic en "RSVP" o "Confirmar asistencia"
- [ ] Verificar que se registra el RSVP
- [ ] Verificar que el contador se actualiza
- [ ] Verificar que aparece en "Mis RSVPs" (`/app/rsvps`)

### **Prueba 4.2: Cancelar RSVP**
- [ ] Ir a "Mis RSVPs" (`/app/rsvps`)
- [ ] Verificar que se muestran los eventos con RSVP confirmado
- [ ] Hacer clic en "Cancelar RSVP" en un evento
- [ ] Verificar que se cancela el RSVP
- [ ] Verificar que el evento desaparece de "Mis RSVPs"
- [ ] Verificar que el contador en el evento se actualiza

### **Prueba 4.3: Ver Mis RSVPs**
- [ ] Ir a `/app/rsvps`
- [ ] Verificar que se muestran todos los eventos con RSVP confirmado
- [ ] Verificar que se muestra información del evento (fecha, hora, ubicación)
- [ ] Verificar que se pueden ver detalles del evento desde aquí
- [ ] Verificar que se pueden cancelar RSVPs desde aquí

---

## **5. Clases (Exploración)**

### **Prueba 5.1: Ver Clases en Exploración**
- [ ] Ir a `/app/explore`
- [ ] Verificar que se muestran clases junto con eventos
- [ ] Verificar que las tarjetas de clases se distinguen de las de eventos
- [ ] Verificar que se muestran imágenes de fondo en las tarjetas de clases
- [ ] Verificar que las imágenes NO se mueven o desaparecen al aplicar filtros

### **Prueba 5.2: Detalles de Clase**
- [ ] Hacer clic en una tarjeta de clase
- [ ] Verificar que se redirige a la página de detalles de la clase
- [ ] Verificar que se muestra:
  - [ ] Nombre de la clase
  - [ ] Academia o maestro
  - [ ] Fecha y hora (o día de la semana si es recurrente)
  - [ ] Ubicación
  - [ ] Ritmos
  - [ ] Precio
  - [ ] Descripción
  - [ ] Botón "Agregar a calendario"

### **Prueba 5.3: Filtros Aplicados a Clases**
- [ ] Aplicar filtro de ritmos
- [ ] Verificar que se filtran las clases correctamente
- [ ] Aplicar filtro de zonas
- [ ] Verificar que se filtran las clases correctamente
- [ ] Aplicar filtro de fechas
- [ ] Verificar que se filtran las clases correctamente (incluyendo clases semanales)
- [ ] Verificar que las clases semanales se muestran correctamente según el día de la semana

### **Prueba 5.4: Clases Semanales y Fechas Pasadas**
- [ ] Verificar que clases semanales de días pasados (ej: Lunes si hoy es Martes) se muestran al final
- [ ] Verificar que clases semanales de hoy se muestran primero
- [ ] Verificar que las clases están ordenadas cronológicamente

---

## **6. Responsive y UX**

### **Prueba 6.1: Vista Móvil**
- [ ] Abrir `/app/explore` en móvil
- [ ] Verificar que las tarjetas se ven correctamente
- [ ] Verificar que los filtros son usables en móvil
- [ ] Verificar que la barra de búsqueda funciona en móvil
- [ ] Verificar que se puede hacer scroll correctamente
- [ ] Verificar que se muestra al menos una tarjeta completa por defecto

### **Prueba 6.2: Performance**
- [ ] Verificar que la página carga rápidamente
- [ ] Verificar que las imágenes se cargan correctamente
- [ ] Verificar que no hay lag al aplicar filtros
- [ ] Verificar que no hay errores en la consola del navegador

---

## **📝 Reporte de Usuario 2**

### **Problemas Encontrados:**
1. 
2. 
3. 

### **Sugerencias de Mejora:**
1. 
2. 
3. 

### **Estado General:**
- [ ] ✅ Todo funciona correctamente
- [ ] ⚠️ Hay problemas menores
- [ ] ❌ Hay problemas críticos

---

# 👤 **USUARIO 3: Clases, Academias, Maestros y Métricas**

## 🎯 **Objetivo:** Verificar que las academias y maestros pueden crear y gestionar clases, y ver métricas de asistencia.

---

## **1. Perfil de Academia**

### **Prueba 1.1: Crear Perfil de Academia**
- [ ] Iniciar sesión como usuario nuevo
- [ ] Ir a `/app/roles/request`
- [ ] Seleccionar rol "Academia"
- [ ] Completar formulario de solicitud
- [ ] Enviar solicitud
- [ ] **Nota:** Esperar aprobación del administrador (o usar cuenta de administrador para aprobar)

### **Prueba 1.2: Editar Perfil de Academia**
- [ ] Ir a `/app/profile/academy/edit`
- [ ] Verificar que se muestra el editor de perfil
- [ ] Completar información básica:
  - [ ] Nombre de la academia
  - [ ] Descripción/Bio
  - [ ] Ritmos que se enseñan
  - [ ] Zonas donde se ubica
  - [ ] Redes sociales
  - [ ] Fotos y videos
- [ ] Guardar cambios
- [ ] Verificar que se actualiza el perfil público

### **Prueba 1.3: Ver Perfil Público de Academia**
- [ ] Ir a `/academia/{id}` (reemplazar {id} con el ID de la academia)
- [ ] Verificar que se muestra:
  - [ ] Nombre de la academia
  - [ ] Descripción
  - [ ] Ritmos
  - [ ] Zonas
  - [ ] Fotos y videos
  - [ ] Redes sociales
  - [ ] Clases disponibles
  - [ ] Promociones (si hay)
  - [ ] Maestros invitados (si hay)

### **Prueba 1.4: Sección de Clases Live**
- [ ] Verificar que se muestra sección "Clases Live con Tabs Verticales por Día"
- [ ] Verificar que se muestran tabs por día de la semana (Lunes, Martes, etc.)
- [ ] Verificar que los tabs son colapsables
- [ ] Verificar que se puede abrir/cerrar cada tab
- [ ] Verificar que NO hay restricción de que un tab debe estar siempre abierto
- [ ] Verificar que se muestran las clases en cada día
- [ ] Verificar que cada clase muestra:
  - [ ] Nombre de la clase
  - [ ] Hora
  - [ ] Ritmo
  - [ ] Precio
  - [ ] Botón "Ver detalle"

### **Prueba 1.5: Detalle de Clase desde Tabs**
- [ ] Hacer clic en "Ver detalle" en una clase
- [ ] Verificar que se redirige a la página de detalles de la clase
- [ ] Verificar que la URL incluye el índice correcto de la clase (`?i=X`)
- [ ] Verificar que se muestra la información correcta de la clase
- [ ] Verificar que la fecha específica es visible y clara

---

## **2. Creación y Gestión de Clases (Academia)**

### **Prueba 2.1: Crear Nueva Clase**
- [ ] Ir a `/app/profile/academy/edit`
- [ ] Buscar sección de "Clases" o "Cronograma"
- [ ] Hacer clic en "Agregar clase" o "Nueva clase"
- [ ] Completar formulario:
  - [ ] Nombre de la clase
  - [ ] Ritmos (múltiples seleccionables)
  - [ ] Día de la semana (o fecha específica)
  - [ ] Hora de inicio
  - [ ] Hora de fin
  - [ ] Precio (opcional)
  - [ ] Descripción
- [ ] Guardar clase
- [ ] Verificar que la clase aparece en el cronograma
- [ ] Verificar que la clase se muestra en el perfil público

### **Prueba 2.2: Editar Clase Existente**
- [ ] Seleccionar una clase existente
- [ ] Hacer clic en "Editar"
- [ ] Modificar información de la clase
- [ ] Guardar cambios
- [ ] Verificar que los cambios se reflejan en el perfil público

### **Prueba 2.3: Eliminar Clase**
- [ ] Seleccionar una clase existente
- [ ] Hacer clic en "Eliminar" o "Borrar"
- [ ] Confirmar eliminación
- [ ] Verificar que la clase desaparece del cronograma
- [ ] Verificar que la clase desaparece del perfil público

### **Prueba 2.4: Múltiples Ritmos por Clase**
- [ ] Crear una nueva clase
- [ ] Seleccionar múltiples ritmos (ej: Salsa, Bachata)
- [ ] Guardar clase
- [ ] Verificar que se muestran todos los ritmos en el perfil público
- [ ] Verificar que la clase aparece cuando se filtran por cualquiera de esos ritmos

### **Prueba 2.5: Clases Recurrentes vs. Fechas Específicas**
- [ ] Crear una clase recurrente (ej: Todos los lunes)
- [ ] Verificar que se muestra en el tab de "Lunes"
- [ ] Crear una clase con fecha específica (ej: 25 de Diciembre)
- [ ] Verificar que se muestra en la fecha correcta
- [ ] Verificar que las clases recurrentes se muestran correctamente en exploración

---

## **3. Promociones y Paquetes (Academia)**

### **Prueba 3.1: Crear Promoción**
- [ ] Ir a `/app/profile/academy/edit`
- [ ] Buscar sección de "Promociones" o "Costos y Promociones"
- [ ] Hacer clic en "Agregar promoción"
- [ ] Completar formulario:
  - [ ] Nombre de la promoción
  - [ ] Descripción
  - [ ] Precio (o dejar vacío para "Gratis")
  - [ ] Condiciones
  - [ ] Fecha de inicio
  - [ ] Fecha de fin
- [ ] Guardar promoción
- [ ] Verificar que la promoción aparece en el perfil público

### **Prueba 3.2: Ver Promociones en Perfil Público**
- [ ] Ir al perfil público de la academia
- [ ] Verificar que se muestra sección de "Promociones"
- [ ] Verificar que se muestran todas las promociones activas
- [ ] Verificar que las promociones tienen buen diseño visual
- [ ] Verificar que el precio se muestra correctamente:
  - [ ] Si no hay precio: NO se muestra precio
  - [ ] Si precio es 0: se muestra "Gratis"
  - [ ] Si hay precio: se muestra en formato `$##,###`

### **Prueba 3.3: Editar y Eliminar Promoción**
- [ ] Editar una promoción existente
- [ ] Modificar precio, fechas o condiciones
- [ ] Guardar cambios
- [ ] Verificar que los cambios se reflejan en el perfil público
- [ ] Eliminar una promoción
- [ ] Verificar que desaparece del perfil público

---

## **4. Métricas de Clases (Academia)**

### **Prueba 4.1: Acceder a Métricas**
- [ ] Ir a `/app/profile/academy/edit`
- [ ] Verificar que hay pestaña "Métricas clases" junto a "Perfil"
- [ ] Hacer clic en "Métricas clases"
- [ ] Verificar que se muestra el panel de métricas

### **Prueba 4.2: Métricas Globales**
- [ ] Verificar que se muestran métricas globales:
  - [ ] Total de tentativos (asistencias tentativas)
  - [ ] Desglose por rol (leader, follower, ambos, otros)
- [ ] Verificar que los números se actualizan correctamente
- [ ] Verificar que se muestran con íconos y formato claro

### **Prueba 4.3: Métricas por Clase**
- [ ] Verificar que se muestra sección "Métricas por clase"
- [ ] Verificar que se lista cada clase con:
  - [ ] Nombre de la clase (NO "Clase #XXXX")
  - [ ] Fecha específica o día de la semana (formato claro)
  - [ ] Precio (si aplica)
  - [ ] Total de tentativos
  - [ ] Desglose por rol
- [ ] Verificar que la fecha se muestra correctamente (NO "Invalid Date")
- [ ] Verificar que el precio se muestra en formato `$##,###`

### **Prueba 4.4: Registro de Asistencias Tentativas**
- [ ] Ir al perfil público de la academia
- [ ] Hacer clic en una clase
- [ ] Hacer clic en "Agregar a calendario"
- [ ] Verificar que se registra la asistencia tentativa
- [ ] Volver a las métricas de la academia
- [ ] Verificar que el contador se actualiza (puede tomar unos segundos)
- [ ] Verificar que se registra el rol correcto (leader/follower/ambos)

### **Prueba 4.5: Fechas Específicas en Métricas**
- [ ] Verificar que para clases recurrentes se muestra una entrada por cada fecha específica
- [ ] Verificar que se muestran fechas específicas (ej: "Lunes 23 Dic", "Lunes 30 Dic")
- [ ] Verificar que las fechas están ordenadas cronológicamente

---

## **5. Perfil de Maestro**

### **Prueba 5.1: Crear Perfil de Maestro**
- [ ] Iniciar sesión como usuario nuevo
- [ ] Ir a `/app/roles/request`
- [ ] Seleccionar rol "Maestro"
- [ ] Completar formulario de solicitud
- [ ] Enviar solicitud
- [ ] **Nota:** Esperar aprobación del administrador

### **Prueba 5.2: Editar Perfil de Maestro**
- [ ] Ir a `/app/profile/teacher/edit`
- [ ] Completar información básica:
  - [ ] Nombre del maestro
  - [ ] Descripción/Bio
  - [ ] Ritmos que enseña
  - [ ] Zonas donde enseña
  - [ ] Redes sociales
  - [ ] Fotos y videos
- [ ] Guardar cambios
- [ ] Verificar que se actualiza el perfil público

### **Prueba 5.3: Ver Perfil Público de Maestro**
- [ ] Ir a `/maestro/{id}` (reemplazar {id} con el ID del maestro)
- [ ] Verificar que se muestra:
  - [ ] Nombre del maestro
  - [ ] Descripción
  - [ ] Ritmos
  - [ ] Zonas
  - [ ] Fotos y videos
  - [ ] Redes sociales
  - [ ] Clases disponibles
  - [ ] Academias donde enseña (si hay)

---

## **6. Creación y Gestión de Clases (Maestro)**

### **Prueba 6.1: Crear Nueva Clase (Maestro)**
- [ ] Ir a `/app/profile/teacher/edit`
- [ ] Buscar sección de "Clases" o "Cronograma"
- [ ] Crear una nueva clase (similar a academia)
- [ ] Verificar que se puede seleccionar múltiples ritmos
- [ ] Guardar clase
- [ ] Verificar que la clase aparece en el perfil público

### **Prueba 6.2: Métricas de Clases (Maestro)**
- [ ] Ir a `/app/profile/teacher/edit`
- [ ] Verificar que hay pestaña "Métricas clases"
- [ ] Hacer clic en "Métricas clases"
- [ ] Verificar que se muestran métricas globales y por clase
- [ ] Verificar que funcionan igual que las métricas de academia

---

## **7. Invitaciones de Academias a Maestros**

### **Prueba 7.1: Invitar Maestro a Academia**
- [ ] Ir a `/app/profile/academy/edit`
- [ ] Buscar sección "Maestros Invitados"
- [ ] Hacer clic en "Invitar maestro" o "Buscar maestros"
- [ ] Buscar un maestro disponible
- [ ] Enviar invitación
- [ ] Verificar mensaje de éxito
- [ ] Verificar que la invitación aparece como "pendiente"

### **Prueba 7.2: Aceptar/Rechazar Invitación (Maestro)**
- [ ] Iniciar sesión como el maestro invitado
- [ ] Ir a `/app/profile/teacher/edit`
- [ ] Buscar sección de "Invitaciones" o "Notificaciones"
- [ ] Verificar que aparece la invitación de la academia
- [ ] Aceptar invitación
- [ ] Verificar que el maestro aparece en "Maestros Invitados" de la academia
- [ ] Verificar que la academia aparece en "Academias donde enseño" del maestro

### **Prueba 7.3: Ver Maestros Invitados en Academia**
- [ ] Ir al perfil público de la academia
- [ ] Verificar que se muestra sección "Maestros Invitados"
- [ ] Verificar que se muestran las tarjetas de los maestros
- [ ] Verificar que las imágenes de fondo de las tarjetas se muestran correctamente
- [ ] Hacer clic en una tarjeta de maestro
- [ ] Verificar que se redirige al perfil público del maestro

### **Prueba 7.4: Ver Academias en Perfil de Maestro**
- [ ] Ir al perfil público del maestro
- [ ] Verificar que se muestra sección "Academias donde enseño"
- [ ] Verificar que se muestran las tarjetas de las academias
- [ ] Verificar que las imágenes de fondo de las tarjetas se muestran correctamente
- [ ] Hacer clic en una tarjeta de academia
- [ ] Verificar que se redirige al perfil público de la academia

---

## **8. Rutas de Clases**

### **Prueba 8.1: Rutas Correctas de Clases**
- [ ] Ir al perfil público de una academia
- [ ] Hacer clic en "Ver detalle" de una clase
- [ ] Verificar que la URL es correcta (ej: `/clase/academy/{id}?i={index}`)
- [ ] Verificar que se muestra la clase correcta (NO la primera clase siempre)
- [ ] Verificar que cada clase tiene su propia ruta única

### **Prueba 8.2: Rutas en Exploración**
- [ ] Ir a `/app/explore`
- [ ] Hacer clic en una tarjeta de clase
- [ ] Verificar que la ruta es correcta
- [ ] Verificar que se muestra la clase correcta
- [ ] Verificar que el índice en la URL coincide con la clase seleccionada

---

## **📝 Reporte de Usuario 3**

### **Problemas Encontrados:**
1. 
2. 
3. 

### **Sugerencias de Mejora:**
1. 
2. 
3. 

### **Estado General:**
- [ ] ✅ Todo funciona correctamente
- [ ] ⚠️ Hay problemas menores
- [ ] ❌ Hay problemas críticos

---

# 👤 **USUARIO 4: Roles, Validación, Challenges, Trending y Funcionalidades Avanzadas**

## 🎯 **Objetivo:** Verificar funcionalidades avanzadas, roles, validación, challenges, trending y características administrativas.

---

## **1. Sistema de Roles**

### **Prueba 1.1: Solicitar Rol**
- [ ] Iniciar sesión como usuario
- [ ] Ir a `/app/roles/request`
- [ ] Verificar que se muestran los roles disponibles:
  - [ ] Organizador
  - [ ] Academia
  - [ ] Maestro
  - [ ] Marca
- [ ] Seleccionar un rol (ej: Organizador)
- [ ] Completar formulario de solicitud
- [ ] Enviar solicitud
- [ ] Verificar mensaje de confirmación
- [ ] Verificar que la solicitud aparece como "pendiente"

### **Prueba 1.2: Información de Roles**
- [ ] Ir a `/app/roles/info`
- [ ] Verificar que se muestra información sobre cada rol
- [ ] Verificar que se explican las funcionalidades de cada rol
- [ ] Verificar que el diseño es claro y atractivo

### **Prueba 1.3: Aprobación de Rol (Admin)**
- [ ] Iniciar sesión como administrador
- [ ] Ir a `/admin/roles`
- [ ] Verificar que se muestran las solicitudes de roles pendientes
- [ ] Aprobar una solicitud
- [ ] Verificar que el usuario recibe el rol
- [ ] Verificar que el usuario puede acceder a las funcionalidades del rol

---

## **2. Sistema de Validación y Verificación**

### **Prueba 2.1: Badge de Verificación**
- [ ] Verificar que los perfiles verificados muestran badge "✅"
- [ ] Verificar que el badge aparece en:
  - [ ] Perfil público
  - [ ] Tarjetas de perfiles
  - [ ] Banners principales
- [ ] Verificar que el badge es visible pero no intrusivo

### **Prueba 2.2: Información de Validación**
- [ ] Ir a `/validation/info`
- [ ] Verificar que se explica el proceso de validación
- [ ] Verificar que se explica la seguridad
- [ ] Verificar que el diseño es claro y profesional

### **Prueba 2.3: Badge en Banners**
- [ ] Ir a un perfil verificado (academia, maestro, organizador)
- [ ] Verificar que el badge "✅" aparece en el banner principal
- [ ] Verificar que el badge está junto al botón de compartir
- [ ] Verificar que están alineados correctamente (debajo del avatar, inline)
- [ ] Verificar que hay espaciado adecuado entre elementos

### **Prueba 2.4: Remover Texto "Verificado"**
- [ ] Verificar que NO se muestra texto "Verificado" en los banners
- [ ] Verificar que solo se muestra el ícono "✅"
- [ ] Verificar que el diseño es limpio y minimalista

---

## **3. Challenges (Retos)**

### **Prueba 3.1: Ver Lista de Challenges**
- [ ] Ir a `/challenges`
- [ ] Verificar que se muestra lista de challenges
- [ ] Verificar que las tarjetas de challenges se muestran correctamente
- [ ] Verificar que se muestra información relevante (título, descripción, fecha)

### **Prueba 3.2: Ver Detalle de Challenge**
- [ ] Hacer clic en un challenge
- [ ] Verificar que se muestra página de detalles
- [ ] Verificar que se muestra toda la información del challenge
- [ ] Verificar que se pueden ver participantes (si aplica)

### **Prueba 3.3: Crear Challenge (si aplica)**
- [ ] Verificar si los usuarios pueden crear challenges
- [ ] Si es posible, crear un nuevo challenge
- [ ] Verificar que el challenge aparece en la lista
- [ ] Verificar que otros usuarios pueden ver el challenge

---

## **4. Trending**

### **Prueba 4.1: Ver Página de Trending**
- [ ] Ir a `/trending`
- [ ] Verificar que se muestra contenido trending
- [ ] Verificar que se muestran eventos, clases o perfiles populares
- [ ] Verificar que el diseño es atractivo

### **Prueba 4.2: Contenido Trending**
- [ ] Verificar que se muestran los eventos/clases más populares
- [ ] Verificar que se actualiza periódicamente
- [ ] Verificar que el contenido es relevante

---

## **5. Perfil de Organizador**

### **Prueba 5.1: Crear Perfil de Organizador**
- [ ] Solicitar rol de Organizador
- [ ] Esperar aprobación
- [ ] Ir a `/app/profile/organizer/edit`
- [ ] Completar información básica:
  - [ ] Nombre del organizador
  - [ ] Descripción/Bio
  - [ ] Ritmos que organiza
  - [ ] Zonas donde organiza
  - [ ] Redes sociales
  - [ ] Fotos y videos
- [ ] Guardar cambios

### **Prueba 5.2: Crear Evento**
- [ ] Ir a `/app/profile/organizer/edit`
- [ ] Buscar sección de "Eventos"
- [ ] Hacer clic en "Crear evento"
- [ ] Completar formulario:
  - [ ] Título del evento
  - [ ] Descripción
  - [ ] Ritmos
  - [ ] Zonas
  - [ ] Fecha y hora
  - [ ] Ubicación
  - [ ] Precio (opcional)
- [ ] Guardar evento
- [ ] Verificar que el evento aparece en el perfil público

### **Prueba 5.3: Crear Fecha de Evento**
- [ ] Seleccionar un evento existente
- [ ] Hacer clic en "Agregar fecha"
- [ ] Completar formulario:
  - [ ] Fecha y hora
  - [ ] Ubicación
  - [ ] Capacidad (opcional)
- [ ] Guardar fecha
- [ ] Verificar que la fecha aparece en el perfil público
- [ ] Verificar que la fecha aparece en exploración

### **Prueba 5.4: Ver Perfil Público de Organizador**
- [ ] Ir a `/organizador/{id}` (reemplazar {id} con el ID del organizador)
- [ ] Verificar que se muestra:
  - [ ] Nombre del organizador
  - [ ] Descripción
  - [ ] Ritmos
  - [ ] Zonas
  - [ ] Fotos y videos
  - [ ] Redes sociales
  - [ ] Eventos organizados
  - [ ] Badge de verificación (si está verificado)

### **Prueba 5.5: Badge y Compartir en Organizador**
- [ ] Verificar que el badge "✅" aparece en el banner (si está verificado)
- [ ] Verificar que el botón de compartir aparece
- [ ] Verificar que están debajo del avatar, inline, con espaciado adecuado
- [ ] Hacer clic en compartir
- [ ] Verificar que funciona correctamente

---

## **6. Fechas de Eventos**

### **Prueba 6.1: Crear Múltiples Fechas**
- [ ] Crear un evento
- [ ] Agregar múltiples fechas al evento
- [ ] Verificar que todas las fechas aparecen en el perfil público
- [ ] Verificar que todas las fechas aparecen en exploración

### **Prueba 6.2: Editar Fecha de Evento**
- [ ] Seleccionar una fecha existente
- [ ] Editar fecha, hora o ubicación
- [ ] Guardar cambios
- [ ] Verificar que los cambios se reflejan en el perfil público
- [ ] Verificar que los cambios se reflejan en exploración

### **Prueba 6.3: Eliminar Fecha de Evento**
- [ ] Seleccionar una fecha existente
- [ ] Eliminar fecha
- [ ] Confirmar eliminación
- [ ] Verificar que la fecha desaparece del perfil público
- [ ] Verificar que la fecha desaparece de exploración

### **Prueba 6.4: Fechas Pasadas**
- [ ] Verificar que las fechas pasadas NO se muestran en exploración
- [ ] Verificar que las fechas pasadas desaparecen automáticamente
- [ ] Verificar que las fechas futuras se muestran correctamente

### **Prueba 6.5: Zona Horaria (CDMX)**
- [ ] Crear un evento con fecha y hora específica
- [ ] Verificar que la fecha y hora se muestran correctamente en zona horaria CDMX
- [ ] Verificar que NO se muestra un día anterior
- [ ] Verificar que los filtros de fecha funcionan correctamente con zona horaria CDMX

---

## **7. Seguidores y Siguiendo**

### **Prueba 7.1: Seguir Perfil**
- [ ] Ir a un perfil público (academia, maestro, organizador)
- [ ] Buscar botón "Seguir" o "Follow"
- [ ] Hacer clic en "Seguir"
- [ ] Verificar que el botón cambia a "Siguiendo"
- [ ] Verificar que el contador de seguidores se actualiza

### **Prueba 7.2: Dejar de Seguir**
- [ ] Hacer clic en "Siguiendo"
- [ ] Verificar que el botón cambia a "Seguir"
- [ ] Verificar que el contador de seguidores se actualiza

### **Prueba 7.3: Ver Seguidores**
- [ ] Ir a un perfil propio
- [ ] Buscar sección "Seguidores"
- [ ] Hacer clic en "Seguidores"
- [ ] Verificar que se muestra lista de seguidores
- [ ] Verificar que NO hay error 400 Bad Request

### **Prueba 7.4: Ver Siguiendo**
- [ ] Ir a un perfil propio
- [ ] Buscar sección "Siguiendo"
- [ ] Hacer clic en "Siguiendo"
- [ ] Verificar que se muestra lista de perfiles que sigue
- [ ] Verificar que NO hay error 400 Bad Request

---

## **8. Compartir Perfiles**

### **Prueba 8.1: Compartir Perfil de Usuario**
- [ ] Ir a `/app/profile`
- [ ] Buscar botón de compartir
- [ ] Hacer clic en compartir
- [ ] Verificar que se abre diálogo de compartir nativo
- [ ] Verificar que la URL se copia correctamente
- [ ] Compartir el perfil y verificar que la URL funciona

### **Prueba 8.2: Compartir Perfil de Academia**
- [ ] Ir a perfil público de academia
- [ ] Buscar botón de compartir (junto al badge de verificación)
- [ ] Hacer clic en compartir
- [ ] Verificar que funciona correctamente

### **Prueba 8.3: Compartir Perfil de Maestro**
- [ ] Ir a perfil público de maestro
- [ ] Buscar botón de compartir
- [ ] Hacer clic en compartir
- [ ] Verificar que funciona correctamente

### **Prueba 8.4: Compartir Perfil de Organizador**
- [ ] Ir a perfil público de organizador
- [ ] Buscar botón de compartir
- [ ] Hacer clic en compartir
- [ ] Verificar que funciona correctamente

---

## **9. Funcionalidades Administrativas**

### **Prueba 9.1: Panel de Administración**
- [ ] Iniciar sesión como administrador
- [ ] Verificar que aparece opción "Admin" en el menú
- [ ] Ir a `/admin/roles`
- [ ] Verificar que se muestra panel de administración
- [ ] Verificar que se pueden ver solicitudes de roles

### **Prueba 9.2: Aprobar/Rechazar Solicitudes**
- [ ] Ver solicitud de rol pendiente
- [ ] Aprobar solicitud
- [ ] Verificar que el usuario recibe el rol
- [ ] Rechazar solicitud
- [ ] Verificar que el usuario NO recibe el rol

### **Prueba 9.3: Ver Métricas (si aplica)**
- [ ] Verificar si hay sección de métricas en el panel de administración
- [ ] Verificar que se muestran estadísticas relevantes
- [ ] Verificar que los datos son precisos

---

## **10. Responsive y UX Avanzado**

### **Prueba 10.1: Navegación en Móvil**
- [ ] Abrir la aplicación en móvil
- [ ] Verificar que el menú offcanvas funciona correctamente
- [ ] Verificar que todas las funcionalidades son usables en móvil
- [ ] Verificar que los formularios son fáciles de completar en móvil

### **Prueba 10.2: Performance**
- [ ] Verificar que las páginas cargan rápidamente
- [ ] Verificar que las imágenes se cargan correctamente
- [ ] Verificar que no hay lag en las interacciones
- [ ] Verificar que no hay errores en la consola del navegador

### **Prueba 10.3: Accesibilidad**
- [ ] Verificar que los botones tienen tamaños adecuados
- [ ] Verificar que los textos son legibles
- [ ] Verificar que los colores tienen buen contraste
- [ ] Verificar que la navegación por teclado funciona

---

## **11. Validaciones y Errores**

### **Prueba 11.1: Validación de Formularios**
- [ ] Intentar enviar formularios vacíos
- [ ] Verificar que se muestran mensajes de error
- [ ] Verificar que los campos requeridos están marcados
- [ ] Completar formularios correctamente
- [ ] Verificar que se pueden enviar

### **Prueba 11.2: Manejo de Errores**
- [ ] Intentar acceder a rutas que no existen
- [ ] Verificar que se muestra página 404
- [ ] Intentar acceder a perfiles que no existen
- [ ] Verificar que se maneja correctamente
- [ ] Verificar que se muestran mensajes de error claros

### **Prueba 11.3: Validación de Datos**
- [ ] Intentar ingresar datos inválidos (ej: email mal formateado)
- [ ] Verificar que se muestran mensajes de error
- [ ] Verificar que no se pueden guardar datos inválidos

---

## **12. Integraciones y Funcionalidades Externas**

### **Prueba 12.1: Redes Sociales**
- [ ] Verificar que los enlaces de redes sociales funcionan
- [ ] Verificar que los íconos de redes sociales se muestran correctamente
- [ ] Verificar que el ícono de WhatsApp se muestra correctamente
- [ ] Hacer clic en un enlace de red social
- [ ] Verificar que se abre en una nueva pestaña

### **Prueba 12.2: Agregar a Calendario**
- [ ] Hacer clic en "Agregar a calendario" en un evento
- [ ] Verificar que se descarga archivo `.ics`
- [ ] Verificar que el archivo se puede importar a calendario
- [ ] Verificar que la información del evento es correcta

### **Prueba 12.3: Compartir Nativo**
- [ ] Hacer clic en compartir en diferentes contextos
- [ ] Verificar que se abre diálogo de compartir nativo
- [ ] Verificar que funciona en diferentes navegadores
- [ ] Verificar fallback si no está disponible

---

## **📝 Reporte de Usuario 4**

### **Problemas Encontrados:**
1. 
2. 
3. 

### **Sugerencias de Mejora:**
1. 
2. 
3. 

### **Estado General:**
- [ ] ✅ Todo funciona correctamente
- [ ] ⚠️ Hay problemas menores
- [ ] ❌ Hay problemas críticos

---

# 📊 **Resumen General de Pruebas**

## **Funcionalidades Críticas a Verificar:**
1. ✅ Autenticación y registro
2. ✅ Onboarding completo
3. ✅ Exploración de eventos y clases
4. ✅ Filtros y búsqueda
5. ✅ Creación de perfiles (usuario, academia, maestro, organizador)
6. ✅ Creación de eventos y clases
7. ✅ RSVP y asistencia
8. ✅ Métricas de clases
9. ✅ Sistema de roles
10. ✅ Validación y verificación
11. ✅ Challenges y Trending
12. ✅ Responsive y UX

## **Problemas Comunes a Reportar:**
- Errores en la consola del navegador
- Páginas que no cargan
- Funcionalidades que no responden
- Problemas de diseño/UX
- Problemas de performance
- Problemas de responsive

## **Información de Contacto:**
- **Email para reportes:** [tu-email@example.com]
- **Plazo para reportes:** [fecha límite]
- **Formato de reportes:** Descripción clara + pasos para reproducir + capturas de pantalla

---

**¡Gracias por tu ayuda en las pruebas! 🎉**

