# 🧪 Guía de Pruebas QA - Baile App

Esta guía describe las pruebas mínimas que debe realizar un usuario para validar las funcionalidades principales de la aplicación antes de cada release.

---

## 📋 **Índice**
1. [Autenticación y Onboarding](#1-autenticación-y-onboarding)
2. [Perfiles de Usuario](#2-perfiles-de-usuario)
3. [Exploración y Búsqueda](#3-exploración-y-búsqueda)
4. [Eventos y Fechas](#4-eventos-y-fechas)
5. [Clases](#5-clases)
6. [Challenges](#6-challenges)
7. [Trending](#7-trending)
8. [RSVP](#8-rsvp)
9. [Navegación y Rutas Públicas](#9-navegación-y-rutas-públicas)
10. [Responsive (Mobile)](#10-responsive-mobile)

---

## **1. Autenticación y Onboarding**

### 🎯 **Objetivo:** Verificar que nuevos usuarios pueden registrarse y completar onboarding.

#### **Prueba 1.1: Registro con Magic Link**
- [ ] Ir a `/login` o `/signup`
- [ ] Ingresar un email válido y presionar "Enviar link mágico"
- [ ] Verificar mensaje de confirmación
- [ ] Abrir email y hacer clic en el link
- [ ] Verificar redirección a `/auth/callback`
- [ ] Verificar que se crea `profiles_user` con `onboarding_complete: false`

#### **Prueba 1.2: Completar Onboarding**
- [ ] Usuario nuevo debe ser redirigido a `/onboarding/basics`
- [ ] **Paso 1 - Básicos:**
  - [ ] Ingresar nombre (display_name)
  - [ ] Subir foto de avatar (opcional)
  - [ ] Presionar "Siguiente"
- [ ] **Paso 2 - Ritmos:**
  - [ ] Seleccionar al menos 1 ritmo (ej: Salsa, Bachata)
  - [ ] Verificar que los chips se vean en diseño moderno
  - [ ] Presionar "Siguiente"
- [ ] **Paso 3 - Zonas:**
  - [ ] Seleccionar al menos 1 zona (ej: CDMX Norte, Sur)
  - [ ] Presionar "Completar"
- [ ] Verificar que `onboarding_complete` se actualiza a `true`
- [ ] Verificar redirección a `/app/explore`

#### **Prueba 1.3: Login de Usuario Existente**
- [ ] Cerrar sesión
- [ ] Ingresar email de usuario existente
- [ ] Abrir magic link
- [ ] Verificar que se salta onboarding si `onboarding_complete: true`
- [ ] Verificar redirección directa a `/app/explore`

#### **Criterios de Éxito:**
✅ Email recibido en menos de 1 minuto  
✅ Onboarding completo en menos de 3 minutos  
✅ Usuario puede acceder a `/app/explore` después de onboarding  
✅ No se muestran usuarios incompletos en "¿Con quién bailar?"

---

## **2. Perfiles de Usuario**

### 🎯 **Objetivo:** Verificar creación, edición y visualización de perfiles.

#### **Prueba 2.1: Ver Perfil Propio (Live)**
- [ ] Login como usuario
- [ ] Ir a `/app/profile` (navbar → icono de perfil)
- [ ] Verificar que se muestra:
  - [ ] Avatar/foto de portada
  - [ ] Nombre (display_name)
  - [ ] Bio
  - [ ] Ritmos seleccionados (chips modernos)
  - [ ] Zonas
  - [ ] Redes sociales (si existen)
  - [ ] Galería de fotos (p1, p2, p3)
  - [ ] Videos (v1)
- [ ] Presionar botón "📤 Compartir"
- [ ] Verificar que se copia URL o abre modal de compartir nativo

#### **Prueba 2.2: Editar Perfil**
- [ ] Presionar toggle "Editar" en `/app/profile`
- [ ] **Editar Nombre:**
  - [ ] Cambiar display_name
  - [ ] Presionar "Guardar"
  - [ ] Verificar cambio reflejado en Live
- [ ] **Subir Avatar:**
  - [ ] Seleccionar archivo de imagen (< 5MB)
  - [ ] Verificar preview
  - [ ] Guardar
  - [ ] Verificar que `avatar_url` se actualiza en DB
- [ ] **Editar Bio:**
  - [ ] Agregar/editar texto bio
  - [ ] Guardar
  - [ ] Verificar en Live
- [ ] **Cambiar Ritmos:**
  - [ ] Abrir RitmosChips
  - [ ] Agregar/quitar ritmos
  - [ ] Guardar
  - [ ] Verificar que `ritmos_seleccionados` se actualiza
- [ ] **Agregar Redes Sociales:**
  - [ ] Ingresar Instagram handle (sin @)
  - [ ] Ingresar Facebook URL
  - [ ] Guardar
  - [ ] Verificar que se muestran en Live con íconos clickables
- [ ] **Subir Fotos/Videos:**
  - [ ] Subir foto en slot p1, p2, p3
  - [ ] Subir video en slot v1
  - [ ] Verificar que se guardan en `media` JSONB
  - [ ] Verificar que se muestran en galería (Live)

#### **Prueba 2.3: Ver Perfil Público de Otro Usuario**
- [ ] Copiar URL de perfil propio (ej: `/u/{user_id}`)
- [ ] Cerrar sesión o abrir en navegador privado
- [ ] Pegar URL
- [ ] Verificar que se muestra perfil público sin toggle "Editar"
- [ ] Verificar que avatar se carga correctamente (prioriza `avatar_url`)
- [ ] Verificar que ritmos se muestran en chips modernos
- [ ] Verificar que botón "📤 Compartir" funciona

#### **Criterios de Éxito:**
✅ Todos los cambios se guardan en DB  
✅ Avatar se visualiza en cards de Explore y perfil público  
✅ Ritmos se muestran con diseño moderno consistente  
✅ Perfil público accesible sin login  
✅ Botón compartir copia URL correctamente

---

## **3. Exploración y Búsqueda**

### 🎯 **Objetivo:** Verificar que usuarios pueden descubrir contenido.

#### **Prueba 3.1: Explorar Home (Desktop)**
- [ ] Login y ir a `/app/explore`
- [ ] Verificar que se muestran secciones:
  - [ ] 🏆 Próximas Fechas
  - [ ] 🎓 Encuentra tus clases
  - [ ] 📆 Sociales
  - [ ] 🏫 Academias
  - [ ] 👤 Organizadores
  - [ ] 💃 ¿Con quién bailar?
  - [ ] 🎓 Maestros
  - [ ] 🏷️ Marcas
- [ ] Verificar que cada sección tiene slider horizontal
- [ ] Verificar que cards tienen:
  - [ ] Imagen de fondo o gradiente
  - [ ] Barra superior de gradiente (90deg)
  - [ ] Overlay solo si no hay imagen de fondo
  - [ ] Título con `drop-shadow`
  - [ ] Chips de ritmos/zonas con fondo translúcido
  - [ ] Hover: escala 1.03, y: -8px
- [ ] Hacer scroll horizontal en cada slider
- [ ] Click en una card
- [ ] Verificar que redirige a la ruta correcta

#### **Prueba 3.2: Filtros de Búsqueda**
- [ ] En `/app/explore`, abrir FilterBar
- [ ] **Filtro por Texto:**
  - [ ] Ingresar "Salsa" en búsqueda
  - [ ] Verificar que se filtran resultados
- [ ] **Filtro por Ritmo:**
  - [ ] Seleccionar "Bachata"
  - [ ] Verificar que solo se muestran items con Bachata
- [ ] **Filtro por Zona:**
  - [ ] Seleccionar "CDMX Norte"
  - [ ] Verificar que solo se muestran items en esa zona
- [ ] **Filtro por Fecha:**
  - [ ] Seleccionar rango de fechas
  - [ ] Verificar que solo se muestran eventos en ese rango
- [ ] **Limpiar filtros:**
  - [ ] Presionar "Limpiar"
  - [ ] Verificar que se muestran todos los resultados

#### **Prueba 3.3: "¿Con quién bailar?" (Solo Onboarding Completo)**
- [ ] Verificar que solo se muestran usuarios con `onboarding_complete: true`
- [ ] Crear un usuario nuevo, NO completar onboarding
- [ ] Verificar que NO aparece en la sección
- [ ] Completar onboarding del usuario
- [ ] Refrescar `/app/explore`
- [ ] Verificar que AHORA SÍ aparece

#### **Criterios de Éxito:**
✅ Todas las secciones cargan en < 3 segundos  
✅ Filtros funcionan correctamente  
✅ Solo usuarios con onboarding completo en "¿Con quién bailar?"  
✅ Cards tienen diseño consistente y moderno  
✅ Navegación fluida sin errores 404

---

## **4. Eventos y Fechas**

### 🎯 **Objetivo:** Verificar creación, edición y visualización de eventos.

#### **Prueba 4.1: Crear Evento (Organizador)**
- [ ] Login como usuario con rol `organizador` aprobado
- [ ] Ir a `/profile/organizer` → Editar
- [ ] **Crear Evento Padre (Social):**
  - [ ] Ir a sección "Sociales que organizamos"
  - [ ] Presionar "Crear Social"
  - [ ] Llenar nombre, descripción, ritmos, zonas
  - [ ] Subir portada
  - [ ] Guardar
  - [ ] Verificar que se guarda en `events_parent`
- [ ] **Crear Fecha de Evento:**
  - [ ] Dentro del evento, presionar "Agregar Fecha"
  - [ ] Llenar fecha, hora, lugar, dirección
  - [ ] Subir flyer
  - [ ] Guardar
  - [ ] Verificar que se guarda en `events_date`

#### **Prueba 4.2: Ver Fecha Pública**
- [ ] Copiar URL de fecha (ej: `/event/{eventDateId}`)
- [ ] Abrir en navegador privado
- [ ] Verificar que se muestra:
  - [ ] Flyer/portada
  - [ ] Título y descripción
  - [ ] Fecha, hora, lugar
  - [ ] Mapa con ubicación
  - [ ] Botón "Copiar dirección"
  - [ ] Chips de ritmos
  - [ ] Contador de RSVP
  - [ ] Botón "Me interesa" (si está loggeado)
  - [ ] Botón "📤 Compartir"

#### **Prueba 4.3: RSVP (ver sección 8)**

#### **Criterios de Éxito:**
✅ Eventos solo visibles si organizador está aprobado  
✅ Fechas públicas accesibles sin login  
✅ Flyers/portadas se cargan correctamente  
✅ Botón compartir funciona

---

## **5. Clases**

### 🎯 **Objetivo:** Verificar creación y visualización de clases.

#### **Prueba 5.1: Crear Clase (Academia)**
- [ ] Login como usuario con rol `academia` aprobado
- [ ] Ir a `/profile/academy` → Editar
- [ ] **Agregar Cronograma:**
  - [ ] Ir a sección "Clases"
  - [ ] Presionar "Agregar clase"
  - [ ] Llenar:
    - [ ] Título (ej: "Salsa On1 Principiantes")
    - [ ] Días de la semana (ej: Lunes, Miércoles)
    - [ ] Hora inicio/fin
    - [ ] Ritmo
  - [ ] Guardar
  - [ ] Verificar que se guarda en `cronograma` JSONB
- [ ] **Agregar Costos:**
  - [ ] Ir a sección "Costos"
  - [ ] Agregar costo mensual, por clase, etc.
  - [ ] Guardar
  - [ ] Verificar que se guarda en `costos` JSONB
- [ ] **Agregar Ubicación:**
  - [ ] Ir a sección "Ubicaciones"
  - [ ] Presionar "Agregar ubicación"
  - [ ] Llenar nombre, dirección, latitud/longitud
  - [ ] Guardar individual (botón por ubicación)
  - [ ] Verificar que se guarda en `ubicaciones` JSONB

#### **Prueba 5.2: Ver Clase Pública**
- [ ] Ir a `/app/explore`
- [ ] En sección "Encuentra tus clases", click en una ClassCard
- [ ] Verificar redirección a `/clase/{type}/{id}` (ej: `/clase/academy/2`)
- [ ] Verificar que se muestra:
  - [ ] Header con 2 columnas:
    - [ ] Columna 1: Nombre clase, horario, costo, ubicación chips
    - [ ] Columna 2: AcademyCard o TeacherCard del creador
  - [ ] Cronograma completo con horarios
  - [ ] Mapa de ubicación
  - [ ] Botón "Volver" al perfil del creador

#### **Prueba 5.3: Crear Clase (Maestro)**
- [ ] Login como usuario con rol `maestro` aprobado
- [ ] Repetir proceso de Prueba 5.1 pero en `/profile/teacher`
- [ ] Verificar que la ruta pública es `/clase/teacher/{id}`

#### **Criterios de Éxito:**
✅ Clases solo visibles si creador está aprobado  
✅ Cronograma se muestra correctamente  
✅ Ubicaciones se guardan individualmente  
✅ Cards de creador (Academy/Teacher) se muestran en header

---

## **6. Challenges**

### 🎯 **Objetivo:** Verificar sistema de challenges con aprobación de Super Admin.

#### **Prueba 6.1: Crear Challenge (Usuario)**
- [ ] Login como usuario con rol `usuario` o `superadmin`
- [ ] Ir a `/challenges` (navbar → 🏆)
- [ ] Presionar "➕ Nuevo Challenge"
- [ ] **Llenar formulario:**
  - [ ] Título
  - [ ] Descripción
  - [ ] Seleccionar ritmo (RitmosChips)
  - [ ] Subir foto de portada (350px width, auto height)
  - [ ] Subir video de referencia (owner video)
  - [ ] Fecha límite de envíos
  - [ ] Fecha límite de votación
- [ ] Presionar "Guardar"
- [ ] Verificar que se crea con `status: draft`

#### **Prueba 6.2: Publicar Challenge (Super Admin)**
- [ ] Login como `superadmin`
- [ ] Ir a `/challenges`
- [ ] Abrir un challenge en estado `draft`
- [ ] Presionar "Publicar"
- [ ] Verificar que:
  - [ ] `status` cambia a `open`
  - [ ] `approved_by` se llena con ID de superadmin
  - [ ] `approved_at` se llena con timestamp actual

#### **Prueba 6.3: Subir Video (Usuario)**
- [ ] Login como usuario regular (NO owner del challenge)
- [ ] Ir a `/challenges`
- [ ] Abrir un challenge `open`
- [ ] En sección "Subir mi video":
  - [ ] Seleccionar archivo de video (< 50MB)
  - [ ] Agregar caption
  - [ ] Presionar "Enviar"
  - [ ] Verificar que se crea `challenge_submission` con `status: pending`
- [ ] Intentar subir otro video
- [ ] Verificar mensaje "Solo puedes subir uno a la vez..."
- [ ] Verificar opciones "Ver mi video" o "Editar mi envío"

#### **Prueba 6.4: Moderar Submissions (Owner/SA)**
- [ ] Login como owner del challenge o superadmin
- [ ] Abrir challenge detail
- [ ] En sección "Moderación":
  - [ ] Verificar lista de submissions pendientes
  - [ ] Ver video, caption, autor, fecha
  - [ ] Presionar "Aprobar" en una submission
  - [ ] Verificar que `status` cambia a `approved`
  - [ ] Verificar que aparece en sección "Videos aprobados"
  - [ ] Presionar "Rechazar" en otra submission
  - [ ] Verificar que `status` cambia a `rejected`

#### **Prueba 6.5: Votar (Usuarios)**
- [ ] Login como usuario regular
- [ ] Abrir challenge `open`
- [ ] En sección "Videos aprobados":
  - [ ] Ver videos en slider horizontal (350px width)
  - [ ] Presionar "❤️ Votar" en un video
  - [ ] Verificar que contador aumenta
  - [ ] Presionar nuevamente (quitar voto)
  - [ ] Verificar que contador disminuye
- [ ] Ir a Leaderboard
- [ ] Verificar ranking con:
  - [ ] Medalla (🥇🥈🥉)
  - [ ] Avatar del autor
  - [ ] Nombre (desde `profiles_user`)
  - [ ] Bio
  - [ ] Contador de votos

#### **Prueba 6.6: Editar Submission (Owner del video)**
- [ ] Login como usuario que subió un video
- [ ] Ir a challenge detail
- [ ] En "Mi envío", presionar "Editar mi envío"
- [ ] Cambiar caption y/o reemplazar video
- [ ] Guardar
- [ ] Verificar que se actualiza en DB

#### **Prueba 6.7: Responsive (Mobile)**
- [ ] Abrir `/challenges` en mobile
- [ ] Verificar que:
  - [ ] Cards tienen max-width 100%
  - [ ] Videos se ven a 100% width, auto height
  - [ ] Botones son táctiles (padding adecuado)
  - [ ] No hay overflow horizontal

#### **Criterios de Éxito:**
✅ Solo usuarios autenticados pueden subir videos  
✅ Solo 1 video por usuario por challenge  
✅ Super Admin puede publicar/rechazar  
✅ Votación funciona (toggle)  
✅ Leaderboard muestra nombres correctos desde `profiles_user`  
✅ Diseño responsive en mobile

---

## **7. Trending**

### 🎯 **Objetivo:** Verificar sistema de votación Trending con listas.

#### **Prueba 7.1: Crear Trending (Super Admin)**
- [ ] Login como `superadmin`
- [ ] Ir a `/admin/trending` (navbar → 📈 si superadmin)
- [ ] Presionar "Abrir" en formulario colapsable
- [ ] **Llenar formulario:**
  - [ ] Título
  - [ ] Descripción
  - [ ] Subir foto de portada
  - [ ] Fecha inicio votación
  - [ ] Fecha fin votación
  - [ ] Modo de voto (per_candidate / per_ritmo)
  - [ ] Seleccionar ritmo (RitmosChips)
- [ ] **Agregar Listas de Candidatos:**
  - [ ] Presionar "Agregar lista"
  - [ ] Ingresar nombre de lista (ej: "Bachata Team A")
  - [ ] Seleccionar ritmo para la lista
  - [ ] Buscar usuarios por display_name
  - [ ] Seleccionar 3-5 usuarios
  - [ ] Verificar que se muestran como chips
  - [ ] Repetir para otra lista (ej: "Bachata Team B")
- [ ] Presionar "Crear Trending"
- [ ] Verificar que se crea con `status: draft`

#### **Prueba 7.2: Publicar Trending**
- [ ] En `/admin/trending`, ubicar el trending creado
- [ ] Presionar "Publicar"
- [ ] Verificar que `status` cambia a `open`

#### **Prueba 7.3: Ver Trending Público**
- [ ] Cerrar sesión o usar navegador privado
- [ ] Ir a `/trending` (navbar → 📈 público)
- [ ] Verificar lista de trendings con cards visuales:
  - [ ] Portada de fondo con overlay
  - [ ] Título y descripción
  - [ ] Fechas de inicio/fin
  - [ ] Status chip
  - [ ] Botón "Abrir"
- [ ] Click en un trending

#### **Prueba 7.4: Votar en Trending**
- [ ] Login como usuario regular
- [ ] Abrir trending `open` (dentro de ventana de votación)
- [ ] Verificar que se muestran:
  - [ ] Banner con portada (maxHeight: 220px)
  - [ ] Título, descripción, fechas
  - [ ] Tabs por ritmo
  - [ ] Secciones por lista (ej: "Bachata Team A", "Bachata Team B")
- [ ] **Votar:**
  - [ ] Presionar "❤️ Votar" en un candidato
  - [ ] Verificar que botón cambia a "Quitar voto"
  - [ ] Verificar que solo el usuario ve "Mi voto" (no el contador)
  - [ ] Presionar nuevamente (quitar voto)
  - [ ] Verificar toggle correcto
- [ ] **Restricciones:**
  - [ ] Si `allowed_vote_mode: per_ritmo`, verificar que solo puede votar 1 vez por ritmo
  - [ ] Si fuera de ventana de votación, verificar botón deshabilitado "Fuera de ventana"

#### **Prueba 7.5: Leaderboard (Admin)**
- [ ] Login como `superadmin`
- [ ] Abrir trending cerrado
- [ ] En sección "Leaderboard (Admin)":
  - [ ] Verificar agrupación por ritmo y lista
  - [ ] Verificar top 5 con medallas
  - [ ] Verificar avatar y link a perfil
  - [ ] Verificar contador de votos

#### **Prueba 7.6: Winners Públicos (Trending Cerrado)**
- [ ] Cerrar sesión
- [ ] Abrir trending `closed`
- [ ] Verificar que solo se muestran los ganadores por lista
- [ ] Verificar que no se ve el leaderboard completo

#### **Prueba 7.7: Editar Trending (Super Admin)**
- [ ] Login como `superadmin`
- [ ] En `/admin/trending`, expandir trending
- [ ] Modificar título, descripción, fechas
- [ ] Presionar "Guardar Cambios"
- [ ] Verificar que se actualiza en DB

#### **Criterios de Éxito:**
✅ Solo superadmin puede crear/editar trendings  
✅ Votación funciona (toggle)  
✅ Usuario solo ve su voto, no contadores públicos  
✅ Leaderboard solo visible para superadmin  
✅ Winners visibles al cerrar trending  
✅ Diseño responsive en mobile

---

## **8. RSVP**

### 🎯 **Objetivo:** Verificar sistema de confirmación de asistencia.

#### **Prueba 8.1: Marcar RSVP**
- [ ] Login como usuario
- [ ] Ir a una fecha de evento público (ej: `/event/{eventDateId}`)
- [ ] Presionar botón "Me interesa"
- [ ] Verificar que:
  - [ ] Se crea registro en `event_rsvp` con `status: interesado`
  - [ ] Contador de RSVP aumenta (en EventDatePublicScreen)
  - [ ] Botón cambia a "Ya confirmado" o similar
  - [ ] El evento se agrega a `profiles_user.rsvp_events` (JSONB array)

#### **Prueba 8.2: Quitar RSVP**
- [ ] Presionar nuevamente el botón de RSVP
- [ ] Verificar que:
  - [ ] Se elimina registro de `event_rsvp`
  - [ ] Contador de RSVP disminuye
  - [ ] El evento se elimina de `profiles_user.rsvp_events`

#### **Prueba 8.3: Ver RSVPs en Perfil de Usuario**
- [ ] Ir a `/app/profile`
- [ ] Verificar que se muestra lista de eventos con RSVP
- [ ] (Si implementado) Verificar que se actualiza en tiempo real

#### **Criterios de Éxito:**
✅ RSVP se guarda en tabla independiente  
✅ Contador se actualiza vía trigger SQL  
✅ `profiles_user.rsvp_events` se sincroniza automáticamente  
✅ Toggle funciona correctamente

---

## **9. Navegación y Rutas Públicas**

### 🎯 **Objetivo:** Verificar que todas las rutas públicas funcionan correctamente.

#### **Prueba 9.1: Rutas de Perfiles Públicos**
- [ ] **Usuario:** `/u/{userId}` → Muestra UserPublicScreen
- [ ] **Organizador:** `/organizador/{id}` → Muestra OrganizerPublicScreen
- [ ] **Academia:** `/academia/{id}` → Muestra AcademyPublicScreen
- [ ] **Maestro:** `/maestro/{id}` → Muestra TeacherPublicLive
- [ ] **Marca:** `/marca/{id}` → Muestra BrandPublicScreen (si existe)
- [ ] Verificar que todas cargan sin login
- [ ] Verificar que avatares/portadas se cargan (con `toSupabasePublicUrl`)

#### **Prueba 9.2: Rutas de Eventos y Clases**
- [ ] **Fecha de Evento:** `/event/{eventDateId}` → EventDatePublicScreen
- [ ] **Clase:** `/clase/{type}/{id}` (ej: `/clase/academy/2`) → ClassPublicScreen
- [ ] Verificar que cargan sin login
- [ ] Verificar que mapas se muestran correctamente

#### **Prueba 9.3: Rutas de Challenges y Trending**
- [ ] **Challenges:** `/challenges` → ChallengesList
- [ ] **Challenge Detail:** `/challenges/{id}` → ChallengeDetail
- [ ] **Trending:** `/trending` → TrendingList (público)
- [ ] **Trending Detail:** `/trending/{id}` → TrendingDetail
- [ ] **Admin Trending:** `/admin/trending` → TrendingAdmin (solo superadmin)
- [ ] Verificar que rutas públicas cargan sin login
- [ ] Verificar que `/admin/trending` requiere login + rol superadmin

#### **Prueba 9.4: Links desde Cards**
- [ ] En `/app/explore`, hacer clic en:
  - [ ] EventCard → Debe ir a `/event/{eventDateId}`
  - [ ] ClassCard → Debe ir a `/clase/{type}/{id}`
  - [ ] OrganizerCard → Debe ir a `/organizador/{id}`
  - [ ] AcademyCard → Debe ir a `/academia/{id}`
  - [ ] TeacherCard → Debe ir a `/maestro/{id}`
  - [ ] DancerCard → Debe ir a `/u/{userId}`
  - [ ] SocialCard → Debe ir a ruta del evento padre
- [ ] Verificar que NO hay redirecciones a rutas erróneas (ej: `/profile/academy/2` en lugar de `/academia/2`)

#### **Criterios de Éxito:**
✅ Todas las rutas públicas accesibles sin login  
✅ No hay errores 404  
✅ Cards redirigen a rutas correctas  
✅ Rutas admin protegidas (solo superadmin)

---

## **10. Responsive (Mobile)**

### 🎯 **Objetivo:** Verificar que la app funciona correctamente en dispositivos móviles.

#### **Prueba 10.1: Navbar Mobile**
- [ ] Abrir app en mobile (< 768px)
- [ ] Verificar que navbar está en la parte superior (sticky)
- [ ] Verificar que incluye:
  - [ ] Logo (izquierda)
  - [ ] Hamburger menu (derecha)
- [ ] Abrir hamburger menu
- [ ] Verificar que se muestra menú lateral con:
  - [ ] Links a Explore, Challenges, Trending, Profile
  - [ ] Íconos adecuados
- [ ] Cerrar menú
- [ ] Verificar que navbar NO ocupa toda la pantalla

#### **Prueba 10.2: Explore Mobile**
- [ ] Ir a `/app/explore` en mobile
- [ ] Verificar que:
  - [ ] Padding-top: 64px (para no tapar contenido)
  - [ ] Cards ocupan 100% width
  - [ ] Sliders tienen scroll horizontal
  - [ ] Filtros son táctiles (botones grandes)
  - [ ] No hay overflow horizontal

#### **Prueba 10.3: Perfiles Mobile**
- [ ] Abrir cualquier perfil público en mobile
- [ ] Verificar que:
  - [ ] Padding-top: 64px
  - [ ] Avatar/banner responsive (width: 100%)
  - [ ] Texto no se sale del contenedor
  - [ ] Botones son táctiles (min-height: 44px)
  - [ ] Galería de fotos responsive (CarouselComponent)
  - [ ] Botón compartir visible y funcional

#### **Prueba 10.4: Challenges Mobile**
- [ ] Abrir `/challenges` en mobile
- [ ] Verificar que:
  - [ ] Cards max-width: 100%
  - [ ] Videos width: 100%, height: auto
  - [ ] Botones grandes y táctiles
  - [ ] No hay overflow en approved submissions slider

#### **Prueba 10.5: Trending Mobile**
- [ ] Abrir `/trending` en mobile
- [ ] Verificar que:
  - [ ] Cards max-width: 450px o 100%
  - [ ] Portada responsive
  - [ ] Listas de candidatos apiladas verticalmente
  - [ ] Botones de voto táctiles

#### **Criterios de Éxito:**
✅ Navbar sticky en top  
✅ No hay overflow horizontal  
✅ Botones táctiles (min 44x44px)  
✅ Imágenes/videos responsive  
✅ Texto legible (font-size >= 14px)

---

## **📊 Checklist Final de QA**

Antes de aprobar un release, verificar que:

- [ ] ✅ Todos los usuarios pueden completar onboarding
- [ ] ✅ Perfiles se crean, editan y visualizan correctamente
- [ ] ✅ Exploración y filtros funcionan
- [ ] ✅ Eventos y fechas son públicas y accesibles
- [ ] ✅ Clases se crean y muestran con creador correcto
- [ ] ✅ Challenges: solo usuarios loggeados suben videos, solo 1 por usuario
- [ ] ✅ Trending: solo superadmin crea/edita, votación toggle funciona
- [ ] ✅ RSVP se sincroniza en tabla, contador y perfil de usuario
- [ ] ✅ Todas las rutas públicas funcionan sin login
- [ ] ✅ No hay errores 404 en navegación
- [ ] ✅ Diseño responsive en mobile (< 768px)
- [ ] ✅ Avatares se cargan correctamente en todas las vistas
- [ ] ✅ Ritmos se muestran con diseño moderno consistente
- [ ] ✅ Botón compartir funciona en todos los perfiles

---

## **🐛 Reporte de Bugs**

Si encuentras un bug durante QA, reporta con el siguiente formato:

```markdown
### 🐛 Bug: [Título corto]

**Severidad:** 🔴 Crítico / 🟠 Alto / 🟡 Medio / 🟢 Bajo

**Pasos para reproducir:**
1. Ir a [ruta]
2. Hacer clic en [botón]
3. Ver error

**Resultado esperado:**
[Qué debería pasar]

**Resultado actual:**
[Qué está pasando]

**Evidencia:**
- Screenshot: [adjuntar]
- Console error: [copiar error]
- User ID (si aplica): [uuid]

**Entorno:**
- Browser: Chrome 120 / Safari 17 / etc.
- Device: Desktop / iPhone 14 / Android 12
- Screen size: 1920x1080 / 375x667
```

---

## **✅ Firma de Aprobación QA**

| Tester | Fecha | Versión | Estado |
|--------|-------|---------|--------|
| [Nombre] | [DD/MM/YYYY] | v1.0.0 | ✅ Aprobado / ⚠️ Con observaciones / ❌ Rechazado |

**Observaciones:**
- [Lista de bugs menores o mejoras sugeridas]

---

**Última actualización:** 2025-01-XX  
**Responsable de QA:** [Nombre del tester]

