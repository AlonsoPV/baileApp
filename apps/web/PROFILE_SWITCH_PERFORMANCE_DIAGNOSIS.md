# Profile Switch Performance Diagnosis

## A) Flujo Identificado

### Click Handler
- **Componente**: `Navbar.tsx` (línea 39-50)
- **Handler**: `handleAvatarClick`
- **Acción**: Llama `getDefaultRoute()` → `navigate(target)`

### Hook useDefaultProfile
- **Ubicación**: `apps/web/src/hooks/useDefaultProfile.ts`
- **Problemas identificados**:
  1. **4 queries siempre activas**: Ejecuta `useUserProfile()`, `useMyOrganizer()`, `useAcademyMy()`, `useTeacherMy()` incluso si el usuario solo tiene un tipo de perfil
  2. **Interval de 500ms**: Lee localStorage cada 500ms innecesariamente
  3. **getProfileOptions() se recalcula múltiples veces**: Se llama en `getDefaultRoute()`, `getDefaultEditRoute()`, y `getDefaultProfileInfo()`

### Componentes que se montan
- `/profile/user` → `UserProfileLive` (línea 189 en AppRouter.tsx)
- `/profile/organizer` → `OrganizerProfileLive` (línea 192 en router.tsx)
- `/profile/academy` → `AcademyProfileLive` (línea 193 en router.tsx)
- `/profile/teacher` → `TeacherProfileLive` (ruta no encontrada explícitamente, pero existe)

### Queries que se disparan en cada perfil

#### UserProfileLive
- `useUserProfile()` - Ya ejecutado en useDefaultProfile (duplicado)
- `useTags()`
- `useUserMedia()`
- `useUserRSVPEvents()`
- `useFollowerCounts()`
- `useFollowLists()`

#### OrganizerProfileLive
- `useMyOrganizer()` - Ya ejecutado en useDefaultProfile (duplicado)
- `useEventParentsByOrganizer()`
- `useEventDatesByOrganizer()`
- `useOrganizerMedia()`
- `useTags()`

## B) Instrumentación Agregada

### Performance Marks
- ✅ `profile_switch_click` - En `handleAvatarClick` del Navbar
- ✅ `profile_switch_navigate_start` - Al iniciar navegación
- ✅ `profile_switch_route_change_complete` - Cuando la ruta cambia
- ✅ `profile_switch_ui_ready` - Cuando el UI está listo (sin spinners)

### Performance Measures
- ✅ `profile_switch_total` - Duración total (click → UI ready)
- ✅ `profile_switch_navigation` - Duración de navegación
- ✅ `profile_switch_render` - Duración de render

### Render Logger
- ✅ Hook `useRenderLogger` creado para diagnosticar re-renders
- ✅ Agregado a Navbar y UserProfileLive

## C) Cuellos de Botella Identificados

### 1. Queries Redundantes
- **Problema**: `useDefaultProfile` ejecuta 4 queries siempre, y luego el componente de perfil ejecuta algunas de las mismas queries de nuevo
- **Impacto**: Requests duplicados, tiempo de carga aumentado

### 2. Interval Innecesario
- **Problema**: Interval de 500ms leyendo localStorage
- **Impacto**: Trabajo innecesario en el main thread

### 3. Re-cálculos Múltiples
- **Problema**: `getProfileOptions()` se llama múltiples veces sin memoización
- **Impacto**: Cálculos redundantes en cada render

### 4. Falta de Prefetch
- **Problema**: No hay prefetch de datos del perfil destino antes de navegar
- **Impacto**: El usuario espera mientras se cargan los datos después de navegar

### 5. Re-renders Potenciales
- **Problema**: `getDefaultRoute` no está memoizado, se recalcula en cada render del Navbar
- **Impacto**: Posibles re-renders innecesarios

## D) Optimizaciones a Implementar

### Prioridad Alta
1. ✅ Memoizar `getProfileOptions()` y `getDefaultRoute()` en `useDefaultProfile`
2. ✅ Eliminar o reducir el interval de localStorage (usar eventos de storage)
3. ✅ Lazy load de queries en `useDefaultProfile` (solo cargar las necesarias)
4. ✅ Prefetch de datos del perfil destino al hover o al abrir menú

### Prioridad Media
5. ✅ Agregar `keepPreviousData: true` en queries de perfil para transiciones suaves
6. ✅ Memoizar componentes pesados en perfiles (React.memo)
7. ✅ Optimizar `staleTime` y `cacheTime` para perfiles

### Prioridad Baja
8. ✅ Code splitting de componentes de perfil (dynamic import)
9. ✅ Skeleton loading optimizado (solo zona afectada)

## E) Métricas Objetivo

### Baseline (a medir)
- Tiempo promedio: ?ms
- P95: ?ms
- #Requests durante cambio: ?
- #Renders de componentes principales: ?

### Meta
- Tiempo promedio: < 300ms
- P95: < 500ms
- #Requests: Reducir 50%
- #Renders: Reducir 30%
