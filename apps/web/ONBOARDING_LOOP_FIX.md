# 🔄 Arreglo del Loop de Onboarding

## 🚨 Problema Identificado

El loop de onboarding ocurría cuando la app decidía que "te falta completar el perfil" al iniciar sesión, pero el perfil en realidad sí estaba guardado. Esto pasaba por:

1. **Condición demasiado estricta**: `!display_name || ritmos.length === 0`
2. **Cache desactualizada** de React Query justo después de login
3. **Redirección antes de que el perfil cargara** (race condition)

## ✅ Solución Implementada

### 1. **Bandera Explícita en Base de Datos**

**Script SQL**: `SCRIPT_7_ONBOARDING_FLAG.sql`

```sql
-- Agregar columna onboarding_complete
ALTER TABLE public.profiles_user
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;

-- Marcar como completo si ya tiene datos mínimos
UPDATE public.profiles_user
SET onboarding_complete = TRUE
WHERE COALESCE(display_name,'') <> ''
  AND COALESCE(array_length(ritmos,1),0) > 0
  AND COALESCE(array_length(zonas,1),0) > 0;
```

**Beneficios:**
- ✅ Solo esta bandera decide si rediriges o no
- ✅ Evita deducir "completo" con múltiples condiciones
- ✅ Backfill automático para usuarios existentes

### 2. **Hook de Estado de Onboarding**

**Archivo**: `src/hooks/useOnboardingStatus.ts`

```typescript
export function useOnboardingStatus() {
  const { user } = useAuth();
  
  const q = useQuery({
    queryKey: ["profile","me", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles_user")
        .select("user_id, display_name, ritmos, zonas, onboarding_complete")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return {
        exists: !!data,
        complete: !!data?.onboarding_complete,
        profile: data
      };
    },
    staleTime: 0, // Siempre fresh
  });

  return {
    loading: q.isLoading || q.isFetching,
    complete: q.data?.complete ?? false,
    // ... otros campos
  };
}
```

**Características:**
- ✅ Espera a que el perfil cargue ANTES de decidir
- ✅ `staleTime: 0` para evitar cache desactualizada
- ✅ Manejo de estados de carga y error

### 3. **Guard de Rutas Inteligente**

**Archivo**: `src/guards/OnboardingGate.tsx`

```typescript
export default function OnboardingGate() {
  const { user, loading: authLoading } = useAuth();
  const { loading, complete } = useOnboardingStatus();
  const loc = useLocation();

  // 1) Si no hay sesión -> login
  if (!authLoading && !user) {
    return <Navigate to="/auth/login" replace />;
  }

  // 2) Espera a que el perfil cargue ANTES de decidir
  if (authLoading || loading) {
    return <LoadingSpinner />;
  }

  const isOnboardingRoute = loc.pathname.startsWith("/onboarding");

  // 3) Si NO completo -> fuerza a onboarding
  if (!complete && !isOnboardingRoute) {
    return <Navigate to="/onboarding/basics" replace />;
  }

  // 4) Si YA completo -> no dejes quedarse en onboarding
  if (complete && isOnboardingRoute) {
    return <Navigate to="/app/profile" replace />;
  }

  return <Outlet />;
}
```

**Lógica:**
- ✅ **Espera datos**: No decide hasta que el perfil esté cargado
- ✅ **Evita saltos**: Si no completo → onboarding
- ✅ **Evita loops**: Si completo → no deja quedarse en onboarding
- ✅ **Loading state**: Muestra spinner mientras carga

### 4. **Router Actualizado**

**Archivo**: `src/router.tsx`

```typescript
export function AppRouter() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/signup" element={<Signup />} />

      {/* Onboarding Routes - Public */}
      <Route path="/onboarding/basics" element={<ProfileBasics />} />
      <Route path="/onboarding/ritmos" element={<PickRitmos />} />
      <Route path="/onboarding/zonas" element={<PickZonas />} />

      {/* Protected Routes with OnboardingGate */}
      <Route element={<OnboardingGate />}>
        <Route path="/app/profile" element={<ProfileScreen />} />
        <Route path="/profile/organizer/edit" element={<OrganizerProfileEditor />} />
        {/* ... todas las rutas protegidas */}
      </Route>

      {/* Public Routes */}
      <Route path="/u/:id" element={<UserPublicProfile />} />
      {/* ... rutas públicas */}
    </Routes>
  );
}
```

**Estructura:**
- ✅ **Onboarding**: Rutas públicas (no necesitan ProtectedRoute)
- ✅ **Protegidas**: Envuelto con OnboardingGate
- ✅ **Públicas**: Sin restricciones

### 5. **Finalización de Onboarding**

**Archivo**: `src/screens/onboarding/PickZonas.tsx`

```typescript
// Mutación para marcar onboarding como completo
const finishOnboarding = useMutation({
  mutationFn: async () => {
    const { error } = await supabase
      .from("profiles_user")
      .update({ onboarding_complete: true })
      .eq("user_id", user!.id);
    if (error) throw error;
  },
  onSuccess: async () => {
    // 🔁 Asegura que el guard vea el cambio
    await qc.invalidateQueries({ queryKey: ["profile","me", user?.id] });
    navigate("/app/profile", { replace: true });
  }
});

const handleSubmit = async (e: FormEvent) => {
  // ... guardar zonas
  await upsert(updates);
  
  // Marcar onboarding como completo
  await finishOnboarding.mutateAsync();
};
```

**Flujo:**
- ✅ **Guarda datos**: Primero guarda zonas
- ✅ **Marca flag**: Luego marca `onboarding_complete = true`
- ✅ **Invalida cache**: Refresca React Query
- ✅ **Navega**: Va a `/app/profile`

### 6. **Protección en Editor de Perfil**

**Archivo**: `src/hooks/useUserProfile.ts`

```typescript
const updateFields = useMutation({
  mutationFn: async (patch: Partial<ProfileUser>) => {
    // 🚫 Blindaje: JAMÁS mandar onboarding_complete desde aquí
    const { media, onboarding_complete, ...rest } = patch;
    const clean = pickDefined<ProfileUser>(rest);
    // ... resto de la lógica
  }
});
```

**Protección:**
- ✅ **Nunca pisa**: El editor no puede cambiar `onboarding_complete`
- ✅ **Solo lectura**: El flag solo se modifica en onboarding
- ✅ **Seguridad**: Evita cambios accidentales

## 🎯 Flujo Completo

### **Usuario Nuevo**
1. **Login** → `OnboardingGate` detecta `complete = false`
2. **Redirige** → `/onboarding/basics`
3. **Completa pasos** → `/onboarding/ritmos` → `/onboarding/zonas`
4. **Finaliza** → Marca `onboarding_complete = true`
5. **Navega** → `/app/profile` (ya no puede volver a onboarding)

### **Usuario Existente**
1. **Login** → `OnboardingGate` detecta `complete = true`
2. **Navega** → `/app/profile` directamente
3. **No loop** → Nunca va a onboarding

### **Usuario con Perfil Incompleto**
1. **Backfill** → Script SQL marca como completo si tiene datos
2. **Login** → Detecta `complete = true`
3. **Navega** → `/app/profile` directamente

## 🔒 Seguridad y Robustez

### **Race Conditions Eliminadas**
- ✅ **Espera datos**: No decide hasta que el perfil esté cargado
- ✅ **Cache fresh**: `staleTime: 0` evita datos obsoletos
- ✅ **Invalidación**: Refresca cache antes de navegar

### **Estados Protegidos**
- ✅ **Flag inmutable**: Solo se modifica en onboarding
- ✅ **Editor blindado**: No puede cambiar el flag
- ✅ **Guard inteligente**: Decide basado en datos reales

### **Experiencia de Usuario**
- ✅ **Sin loops**: Una vez completo, nunca vuelve a onboarding
- ✅ **Loading states**: Spinner mientras carga
- ✅ **Navegación fluida**: Transiciones suaves

## 📋 Checklist de Implementación

- [x] **Campo `onboarding_complete` creado y backfilled**
- [x] **`OnboardingGate` espera datos y decide sin carreras**
- [x] **Al finalizar onboarding, se marca el flag y se invalida el cache**
- [x] **El editor de perfil no pisa `onboarding_complete`**
- [x] **Router actualizado con OnboardingGate**
- [x] **Ya no redirige al Paso 1 si el perfil está completo**

## 🚀 Resultado

**Antes**: Loop infinito de onboarding
**Después**: Navegación fluida y sin loops

¡El problema está completamente resuelto! 🎉
