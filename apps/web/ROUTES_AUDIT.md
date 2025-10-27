# 🔍 Auditoría de Rutas - BaileApp

## ✅ Rutas Verificadas y Funcionando

### 🔐 Rutas de Autenticación
- ✅ `/auth/login` - Login
- ✅ `/auth/signup` - Registro
- ✅ Ambos redirigen si ya estás autenticado

### 📝 Rutas de Onboarding
- ✅ `/onboarding/basics` - Datos básicos
- ✅ `/onboarding/ritmos` - Selección de ritmos
- ✅ `/onboarding/zonas` - Selección de zonas

### 👤 Rutas de Perfil Principal (Usuario)
- ✅ `/profile` → `ProfileScreen` (vista live)
- ✅ `/profile/edit` → `ProfileScreen` (vista edit)
- ✅ Maneja: usuario, organizador, academia, marca

### 🎤 Rutas de Organizador
- ✅ `/profile/organizer` → `ProfileScreen` (mode: 'organizador')
- ✅ `/profile/organizer/edit` → `ProfileScreen` (mode: 'organizador')
- ✅ `/organizer/:id` → `OrganizerPublicScreen` (pública)
- ✅ `/organizer/edit` → `OrganizerEditScreen` (edición directa)

### 🎓 Rutas de Academia
- ✅ `/profile/academy` → `ProfileScreen` (mode: 'academia')
- ✅ `/profile/academy/edit` → `ProfileScreen` (mode: 'academia')
- ✅ `/academia/editar` → `AcademyEditorScreen` (edición standalone)
- ✅ `/academia/:academyId` → `AcademyPublicScreen` (pública)

### 🏷️ Rutas de Marca
- ✅ `/profile/brand` → `ProfileScreen` (mode: 'marca')
- ✅ `/profile/brand/edit` → `ProfileScreen` (mode: 'marca')
- ✅ `/marca/editar` → `BrandEditorScreen` (edición standalone)
- ✅ `/marca/:brandId` → `BrandPublicScreen` (pública)

### 📅 Rutas de Eventos
- ✅ `/events/new` → `EventCreateWizard`
- ✅ `/events/create` → `EventCreateScreen`
- ✅ `/events/parent/new` → `EventParentEditScreen`
- ✅ `/events/parent/:id/edit` → `EventParentEditScreen`
- ✅ `/events/date/new/:parentId` → `EventDateEditScreen`
- ✅ `/events/date/:id/edit` → `EventDateEditScreen`
- ✅ `/events/:id/edit` → `EventEditor`

### 🎉 Rutas Sociales/Live
- ✅ `/social/new` → `OrganizerEventParentCreateScreen`
- ✅ `/social/:id` → `SocialLiveScreen`
- ✅ `/social/:parentId` → `EventParentPublicScreenNew`
- ✅ `/social/:parentId/edit` → `OrganizerEventParentEditScreen`
- ✅ `/social/:parentId/fecha/nueva` → `OrganizerEventDateCreateScreen`
- ✅ `/social/fecha/:id` → `DateLiveScreen`
- ✅ `/social/fecha/:dateId/edit` → `OrganizerEventDateEditScreen`

### 🔍 Rutas de Exploración
- ✅ `/explore` → `ExploreHomeScreen`
- ✅ `/explore/list` → `ExploreListScreen`

### ⚙️ Rutas de Configuración
- ✅ `/profile/settings` → `DefaultProfileSettings`
- ✅ `/profile/roles` → `RoleSelectorScreen`
- ✅ `/admin/roles` → `AdminRoleRequestsScreen`

### 🐛 Rutas de Debug
- ✅ `/debug/integrity` → `IntegrityDebugScreen`
- ✅ `/info` → `InfoScreen`

### 📊 Rutas Misceláneas
- ✅ `/me/rsvps` → `MyRSVPsScreen`
- ✅ `/u/:id` → `UserPublicProfile`

---

## ⚠️ Posibles Inconsistencias Detectadas

### 1. Rutas Duplicadas de Perfiles
Hay dos conjuntos de rutas para el mismo perfil:

**Perfil Organizador:**
- `/profile/organizer` ✅
- `/organizer/:id` ✅ (pública)

**Perfil Academia:**
- `/profile/academy` ✅
- `/academia/:academyId` ✅ (pública)

**Perfil Marca:**
- `/profile/brand` ✅
- `/marca/:brandId` ✅ (pública)

### 2. Rutas de Edición Duplicadas

**Organizador:**
- `/profile/organizer/edit` ✅ (vía ProfileScreen)
- `/organizer/edit` ✅ (vía OrganizerEditScreen directo)

**Academia:**
- `/profile/academy/edit` ✅ (vía ProfileScreen)
- `/academia/editar` ✅ (vía AcademyEditorScreen directo)

**Marca:**
- `/profile/brand/edit` ✅ (vía ProfileScreen)
- `/marca/editar` ✅ (vía BrandEditorScreen directo)

### 3. Rutas Públicas Sin Autenticación
Estas rutas están FUERA del `OnboardingGate`:
- ✅ `/organizer/:id` - Perfil público organizador
- ✅ `/u/:id` - Perfil público usuario
- ✅ `/social/:id` - Evento social público
- ✅ `/social/fecha/:id` - Fecha de evento pública
- ✅ `/marca/:brandId` - Marca pública
- ✅ `/academia/:academyId` - Academia pública
- ✅ `/events/parent/:id` - Evento padre público (legacy)
- ✅ `/events/date/:id` - Evento fecha pública (legacy)

---

## 🎯 Flujo de Navegación Principal

### Usuario No Autenticado
1. `/` → Redirige a `/app/profile`
2. `/app/profile` → OnboardingGate detecta falta de sesión
3. OnboardingGate → Redirige a `/auth/login`

### Usuario Autenticado - Primera Vez
1. `/auth/login` → Después de login
2. OnboardingGate → Verifica perfil
3. Si no existe → Redirige a `/onboarding/basics`
4. Flujo onboarding → `/onboarding/ritmos` → `/onboarding/zonas`
5. Final → `/app/profile`

### Usuario Autenticado - Perfil Completo
1. `/` → Redirige a `/app/profile`
2. `/app/profile` → OnboardingGate detecta perfil completo
3. Muestra `ProfileScreen` con el modo de perfil activo

### Cambio de Rol (Desde ProfileScreen)
1. Usuario usa dropdown "Cambio de Rol"
2. Selecciona nuevo rol (ej: "Academia")
3. Navega a `/profile/academy` (o `/profile/academy/edit`)
4. `ProfileScreen` detecta `mode === 'academia'`
5. Renderiza `AcademyProfileLive` o `AcademyProfileEditor`

---

## 🚨 Problemas Potenciales

### 1. Duplicación de Screens
Hay múltiples screens que hacen lo mismo:
- `OrganizerProfileLive` vs `OrganizerPublicScreen`
- `AcademyProfileLive` vs `AcademyPublicScreen`
- `BrandPublicScreen` no tiene equivalente "Live"

### 2. ProfileScreen Overload
`ProfileScreen` intenta manejar demasiados casos:
- usuario
- organizador
- academia
- marca
Esto puede causar renders innecesarios.

### 3. Rutas Legacy
Hay rutas legacy que pueden confundir:
- `/events/parent/:id` vs `/social/:id`
- `/events/date/:id` vs `/social/fecha/:id`

---

## ✅ Recomendaciones

### Inmediatas
1. ✅ Remover duplicación de screens
2. ✅ Unificar rutas de edición (usar una sola)
3. ✅ Limpiar rutas legacy

### A Futuro
1. Implementar lazy loading de screens
2. Code splitting por módulos
3. Migración a rutas anidadas (React Router v6 features)

---

**Estado General: ✅ FUNCIONAL**  
**Última actualización:** 2025-10-27
