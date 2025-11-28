# React Query Optimization - Resumen de Cambios

## 📋 Objetivo
Centralizar el fetching de datos y optimizar el caché usando `@tanstack/react-query` para reducir al menos 50% de llamadas repetidas a Supabase al cambiar de pestañas.

## ✅ Cambios Implementados

### 1. Instalación de DevTools
- ✅ Instalado `@tanstack/react-query-devtools` como dev dependency
- ✅ Agregado en `main.tsx` solo en modo desarrollo

### 2. Configuración Global Mejorada (`src/lib/queryClient.ts`)
- ✅ **staleTime**: Aumentado a 1 minuto (antes 5 minutos, pero ahora más balanceado)
- ✅ **gcTime**: 5 minutos (tiempo en cache, antes `cacheTime`)
- ✅ **refetchOnMount**: `false` - Evita refetches innecesarios al cambiar de pestañas
- ✅ **refetchOnWindowFocus**: `false` - Evita refetches al cambiar de ventana
- ✅ **retry**: 1 para queries y mutations

### 3. Nuevos Hooks Optimizados

#### `useUserMeta` (`src/hooks/useUserMeta.ts`)
- ✅ Hook centralizado para obtener metadata de usuarios (nombre, bio, ruta)
- ✅ Cachea resultados por 1 minuto
- ✅ Reemplaza llamadas directas a Supabase en `ChallengeDetail`
- ✅ Reduce fetches repetidos cuando múltiples componentes necesitan la misma metadata

### 4. Hooks Optimizados

#### `useTags`
- ✅ **staleTime**: 5 minutos (tags cambian poco)
- ✅ **gcTime**: 10 minutos en cache

#### `useUserProfile`
- ✅ **staleTime**: 30 segundos (antes 0 - siempre obsoleto)
- ✅ **gcTime**: 5 minutos en cache

#### `useOnboardingStatus`
- ✅ **staleTime**: 1 minuto (antes 0)
- ✅ **gcTime**: 5 minutos en cache

#### `useRoles`
- ✅ Ya tenía `staleTime: 60_000` (1 minuto) - ✅ Optimizado
- ✅ `useRolesCatalog` tiene `staleTime: Infinity` - ✅ Correcto (catálogo no cambia)

### 5. Refactorizaciones

#### `ChallengeDetail.tsx`
- ✅ Reemplazado `useEffect` con llamadas directas a Supabase por `useUserMeta`
- ✅ Reduce fetches repetidos cuando se navega entre challenges
- ✅ Cachea metadata de usuarios compartida entre submissions y leaderboard

## 📊 Impacto Esperado

### Reducción de Llamadas
- **Antes**: Cada cambio de pestaña disparaba nuevos fetches
- **Después**: Datos en cache por 30s-5min según tipo, evitando refetches innecesarios

### Mejoras de Performance
1. **Navegación entre pestañas**: Datos se sirven desde cache si están "frescos"
2. **Metadata de usuarios**: Cacheada y compartida entre componentes
3. **Tags y catálogos**: Cacheados por más tiempo (cambian poco)
4. **Perfiles**: Cacheados por 30 segundos (balance entre frescura y performance)

## 🔧 Configuración de Cache por Tipo de Dato

| Tipo de Dato | staleTime | gcTime | Razón |
|--------------|-----------|--------|-------|
| Perfil de usuario | 30s | 5min | Puede cambiar pero no tan frecuentemente |
| Metadata de usuarios | 1min | 5min | Cambia poco, se comparte entre componentes |
| Tags/Ritmos/Zonas | 5min | 10min | Catálogos que cambian raramente |
| Catálogo de roles | Infinity | - | No cambia |
| Estado de onboarding | 1min | 5min | Cambia poco después de completado |
| Challenges/Events | 1min | 5min | Datos de lectura frecuente |

## 🚀 Próximos Pasos Recomendados

1. **Monitorear con DevTools**: Usar React Query DevTools para identificar queries que aún se refetch innecesariamente
2. **Optimizar más hooks**: Revisar otros hooks que puedan beneficiarse de staleTime más largo
3. **Prefetching**: Considerar prefetch de datos comunes al hover o antes de navegar
4. **Invalidación inteligente**: Asegurar que mutations invalidan solo las queries relevantes

## 📝 Archivos Modificados

1. `apps/web/package.json` - Agregado devtools
2. `apps/web/src/lib/queryClient.ts` - Configuración mejorada
3. `apps/web/src/main.tsx` - Agregado ReactQueryDevtools
4. `apps/web/src/hooks/useUserMeta.ts` - **NUEVO** hook centralizado
5. `apps/web/src/screens/challenges/ChallengeDetail.tsx` - Refactorizado para usar useUserMeta
6. `apps/web/src/hooks/useTags.ts` - Optimizado staleTime
7. `apps/web/src/hooks/useUserProfile.ts` - Optimizado staleTime
8. `apps/web/src/hooks/useOnboardingStatus.ts` - Optimizado staleTime

## 🎯 Resultado

El proyecto ahora tiene:
- ✅ Configuración centralizada de React Query
- ✅ DevTools para debugging en desarrollo
- ✅ Cache inteligente que reduce llamadas repetidas
- ✅ Hooks optimizados con staleTime apropiado
- ✅ Mejor experiencia de usuario (navegación más rápida)

