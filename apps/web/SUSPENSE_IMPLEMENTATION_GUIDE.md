# 🚀 Guía de Implementación: Suspense + React Query

## ✅ Estado Actual

### Infraestructura Completada

1. **QueryClient configurado** (`src/lib/queryClient.ts`)
   - Configuración lista para Suspense
   - Comentarios sobre cómo activar Suspense por query

2. **Componentes Skeleton creados** (`src/components/skeletons/EventDateSkeleton.tsx`)
   - Skeleton específico para EventDatePublicScreen
   - Animaciones y estilos consistentes

3. **Error Boundaries creados** (`src/components/errors/QueryErrorBoundary.tsx`)
   - QueryErrorBoundary para capturar errores
   - QueryErrorBoundaryWithReset con reset automático
   - Fallback UI con opciones de reintentar

4. **Hook con Suspense** (`src/hooks/useEventDateSuspense.ts`)
   - Hook tipado correctamente
   - Maneja errores apropiadamente
   - Activa Suspense automáticamente

### Pendiente

- Migración completa de `EventDatePublicScreen` (requiere refactorización extensa)
- Crear hooks con Suspense para otras queries (useEventParent, etc.)
- Migrar otras pantallas

---

## 📋 Cómo Usar Suspense en Nuevas Pantallas

### Paso 1: Crear Hook con Suspense

```typescript
// src/hooks/useMyDataSuspense.ts
import { useQuery } from "@tanstack/react-query";
import type { MyDataType } from "../types";

export function useMyDataSuspense(id: number): MyDataType {
  const query = useQuery<MyDataType>({
    queryKey: ["my-data", id],
    queryFn: async (): Promise<MyDataType> => {
      // Tu lógica de fetch
      const data = await fetchData(id);
      if (!data) {
        throw new Error(`Data with ID ${id} not found`);
      }
      return data;
    },
    enabled: !!id,
    suspense: true, // ⭐ Activar Suspense
    staleTime: 1000 * 60, // 1 minuto
  });

  return query.data!; // Con Suspense, data siempre existe
}
```

### Paso 2: Crear Skeleton Component

```typescript
// src/components/skeletons/MyDataSkeleton.tsx
export function MyDataSkeleton() {
  return (
    <div>
      {/* Tu skeleton UI aquí */}
    </div>
  );
}
```

### Paso 3: Crear Componente de Contenido

```typescript
// En tu pantalla
function MyDataContent({ id }: { id: number }) {
  // Con Suspense, data siempre existe
  const data = useMyDataSuspense(id);
  
  // No necesitas checks de isLoading o !data
  // Suspense maneja todo eso
  
  return (
    <div>
      <h1>{data.title}</h1>
      {/* Resto del contenido */}
    </div>
  );
}
```

### Paso 4: Envolver con Suspense

```typescript
export default function MyDataScreen() {
  const { id } = useParams<{ id: string }>();
  const idNum = id ? parseInt(id) : undefined;

  if (!idNum) {
    return <NotFoundScreen />;
  }

  return (
    <QueryErrorBoundaryWithReset>
      <Suspense fallback={<MyDataSkeleton />}>
        <MyDataContent id={idNum} />
      </Suspense>
    </QueryErrorBoundaryWithReset>
  );
}
```

---

## 🔄 Migrar Pantalla Existente

### Antes (sin Suspense)

```typescript
export default function MyScreen() {
  const { data, isLoading } = useMyData(id);
  
  if (isLoading) return <LoadingScreen />;
  if (!data) return <NotFoundScreen />;
  
  return <Content data={data} />;
}
```

### Después (con Suspense)

```typescript
function MyContent({ id }: { id: number }) {
  const data = useMyDataSuspense(id); // data siempre existe
  
  return <Content data={data} />;
}

export default function MyScreen() {
  const { id } = useParams();
  const idNum = id ? parseInt(id) : undefined;
  
  if (!idNum) return <NotFoundScreen />;
  
  return (
    <QueryErrorBoundaryWithReset>
      <Suspense fallback={<MySkeleton />}>
        <MyContent id={idNum} />
      </Suspense>
    </QueryErrorBoundaryWithReset>
  );
}
```

---

## ⚠️ Consideraciones Importantes

### 1. Queries que NO deben usar Suspense

- Queries que pueden retornar `null` legítimamente
- Queries con `enabled: false` condicional
- Queries que necesitan manejo especial de errores

### 2. Hooks siempre antes de early returns

```typescript
// ✅ BIEN
function MyComponent() {
  const data = useMyDataSuspense(id); // Hook primero
  if (!id) return null; // Early return después
  return <Content data={data} />;
}

// ❌ MAL
function MyComponent() {
  if (!id) return null; // Early return primero
  const data = useMyDataSuspense(id); // Hook después - ERROR!
  return <Content data={data} />;
}
```

### 3. Tipado correcto

```typescript
// ✅ BIEN - Tipo explícito
export function useMyDataSuspense(id: number): MyDataType {
  const query = useQuery<MyDataType>({...});
  return query.data!;
}

// ❌ MAL - Sin tipo
export function useMyDataSuspense(id: number) {
  const query = useQuery({...});
  return query.data!; // TypeScript no sabe el tipo
}
```

---

## 🎯 Próximos Pasos

1. **Migrar EventDatePublicScreen completamente**
   - Extraer lógica de renderizado a componente separado
   - Eliminar early returns de loading
   - Usar Suspense wrapper

2. **Crear más hooks con Suspense**
   - `useEventParentSuspense`
   - `useUserProfileSuspense`
   - `useAcademySuspense`

3. **Migrar otras pantallas**
   - UserPublicScreen
   - OrganizerProfileLive
   - AcademyProfileLive

4. **Crear más skeletons**
   - UserProfileSkeleton
   - OrganizerSkeleton
   - AcademySkeleton

---

## 📚 Recursos

- [React Query Suspense Docs](https://tanstack.com/query/latest/docs/react/guides/suspense)
- [React Suspense Docs](https://react.dev/reference/react/Suspense)
- Evaluación de impacto: `SUSPENSE_REACT_QUERY_EVALUATION.md`

---

**Última actualización:** $(date)
**Estado:** ✅ Infraestructura lista, migración en progreso

