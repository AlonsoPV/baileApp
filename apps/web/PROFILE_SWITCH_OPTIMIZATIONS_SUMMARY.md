# Profile Switch Performance Optimizations - Summary

## ✅ Optimizaciones Implementadas

### 1. Instrumentación de Performance
- ✅ **Performance Marks**: Agregados en Navbar (`profile_switch_click`, `profile_switch_navigate_start`)
- ✅ **Performance Measures**: `profile_switch_total`, `profile_switch_navigation`, `profile_switch_render`
- ✅ **Hook `useProfileSwitchMetrics`**: Marca cuando el UI está listo y calcula métricas
- ✅ **Hook `useRenderLogger`**: Logs de renders en desarrollo para diagnosticar re-renders

### 2. Optimización de `useDefaultProfile`
- ✅ **Memoización de funciones**: `getProfileOptions()`, `getDefaultRoute()`, `getDefaultEditRoute()`, `getDefaultProfileInfo()` ahora están memoizados con `useCallback` y `useMemo`
- ✅ **Eliminado interval de 500ms**: Reemplazado por eventos personalizados (`defaultProfileChanged`) para cambios en la misma pestaña
- ✅ **Memoización de verificaciones**: `isUserProfileConfigured`, `isOrganizerProfileConfigured`, etc. están memoizados

### 3. Prefetch de Datos
- ✅ **Hook `useProfilePrefetch`**: Prefetch de datos del perfil destino
- ✅ **Prefetch en hover**: Se ejecuta cuando el usuario hace hover sobre el avatar en el Navbar
- ✅ **Prefetch inteligente**: Solo prefetchea el perfil que se va a mostrar

### 4. Transiciones Suaves
- ✅ **`placeholderData` en queries de perfil**: Agregado `placeholderData: (previousData) => previousData` en:
  - `useUserProfile`
  - `useMyOrganizer`
  - `useAcademyMy`
  - `useTeacherMy`
- ✅ **Efecto**: Mantiene los datos anteriores visibles mientras se cargan los nuevos, evitando flashes/blancos

### 5. Integración en Componentes
- ✅ **UserProfileLive**: Agregado `useProfileSwitchMetrics` para marcar cuando el UI está listo
- ✅ **Navbar**: Agregado prefetch en hover y render logger

## 📊 Métricas Esperadas

### Antes (estimado)
- Tiempo promedio: ~800-1200ms
- P95: ~1500-2000ms
- #Requests: 4-6 queries redundantes
- #Renders: Múltiples re-renders innecesarios

### Después (objetivo)
- Tiempo promedio: < 300ms (con prefetch)
- P95: < 500ms
- #Requests: Reducción del 50% (menos queries redundantes)
- #Renders: Reducción del 30% (memoización)

## 🔍 Cómo Medir

### En Desarrollo
1. Abre la consola del navegador
2. Haz click en el avatar
3. Busca logs con prefijo `[ProfileSwitchMetrics]`:
   ```
   [ProfileSwitchMetrics] {
     component: "UserProfileLive",
     total: 245,
     navigation: 12,
     render: 233,
     route: "/profile/user"
   }
   ```
4. Busca logs de renders: `[RenderLogger] Navbar - Render #X`

### En Producción
- Las métricas se envían a Google Analytics (si está configurado) con el evento `profile_switch_performance`
- Revisa Performance API en DevTools → Performance → User Timing

## 📝 Archivos Modificados

1. `apps/web/src/components/Navbar.tsx`
   - Agregado performance marks
   - Agregado prefetch en hover
   - Agregado render logger

2. `apps/web/src/hooks/useDefaultProfile.ts`
   - Memoización completa de funciones
   - Eliminado interval, reemplazado por eventos
   - Optimización de recálculos

3. `apps/web/src/hooks/useProfilePrefetch.ts` (nuevo)
   - Hook para prefetch de datos de perfil

4. `apps/web/src/hooks/useProfileSwitchMetrics.ts` (nuevo)
   - Hook para medir performance del cambio de perfil

5. `apps/web/src/hooks/useRenderLogger.ts` (nuevo)
   - Hook para loggear renders en desarrollo

6. `apps/web/src/screens/profile/UserProfileLive.tsx`
   - Agregado `useProfileSwitchMetrics` para marcar UI ready

7. `apps/web/src/hooks/useUserProfile.ts`
   - Agregado `placeholderData` para transiciones suaves

8. `apps/web/src/hooks/useOrganizer.ts`
   - Agregado `placeholderData` para transiciones suaves

9. `apps/web/src/hooks/useAcademyMy.ts`
   - Agregado `placeholderData` para transiciones suaves

10. `apps/web/src/hooks/useTeacher.ts`
    - Agregado `placeholderData` para transiciones suaves

## 🚀 Próximos Pasos (Opcional)

### Optimizaciones Adicionales
1. **Code Splitting**: Dynamic import de componentes de perfil pesados
2. **Skeleton Loading**: Skeleton optimizado solo en la zona afectada
3. **Lazy Load de Queries**: Cargar queries de perfil solo cuando se necesiten (no todas al inicio)
4. **React.memo**: Memoizar componentes pesados dentro de los perfiles

### Validación
1. Ejecutar pruebas en diferentes dispositivos (iPhone, Android, Desktop)
2. Medir métricas antes/después en producción
3. Ajustar `staleTime` y `gcTime` según métricas reales
4. Monitorear errores de prefetch (deben ser silenciosos)

## ⚠️ Notas Importantes

- El prefetch es una optimización y falla silenciosamente si hay errores
- Los logs de performance solo aparecen en desarrollo
- Las métricas se envían a Analytics solo si está configurado `window.gtag`
- El interval de localStorage fue eliminado, pero los cambios en otras pestañas siguen funcionando vía `storage` event
