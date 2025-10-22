# ✅ Fix Definitivo: Onboarding Loop Resuelto

## 🎯 **Problema Original**

Los usuarios eran redirigidos prematuramente a `/onboarding/basics` incluso cuando ya tenían un perfil completo.

### **Causas Identificadas:**
1. **Race condition**: El guard se ejecutaba antes de que React Query cargara el perfil
2. **Cache desactualizada**: No se invalidaba correctamente después del login/logout
3. **Falta de fallback**: Si `onboarding_complete` era `null`, asumía "incompleto"
4. **Lógica prematura**: Tomaba decisiones sin esperar a que todos los datos estuvieran listos

---

## ✅ **Soluciones Implementadas**

### **1. Hook Centralizado `useAuthReady`**

**Archivo**: `apps/web/src/hooks/useAuthReady.ts`

```typescript
export function useAuthReady() {
  const { user, loading: authLoading } = useAuth();
  const { loading: onboardingLoading, complete, exists, profile } = useOnboardingStatus();

  // Solo está "ready" cuando ambos dejaron de cargar
  const ready = !authLoading && !onboardingLoading;

  return { 
    ready, 
    user, 
    complete, 
    exists,
    profile,
    authLoading, 
    onboardingLoading 
  };
}
```

**Beneficio**: Garantiza que el guard espere a que TODOS los datos estén cargados antes de tomar decisiones.

---

### **2. OnboardingGate Mejorado**

**Archivo**: `apps/web/src/guards/OnboardingGate.tsx`

**Cambios clave:**

```typescript
// ✅ ANTES: Tomaba decisiones demasiado pronto
if (authLoading || loading) { /* ... */ }

// ✅ AHORA: Espera a que TODO esté listo
const { ready, user, complete, authLoading, onboardingLoading } = useAuthReady();

if (!ready || authLoading || onboardingLoading) {
  return <LoadingSpinner />;
}
```

**Flujo correcto:**
1. ⏳ Espera a que auth cargue
2. ⏳ Espera a que perfil cargue
3. ✅ Solo entonces toma decisiones

---

### **3. Invalidación de Cache en `useAuth`**

**Archivo**: `apps/web/src/hooks/useAuth.ts`

**Login:**
```typescript
const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (!error && data.user) {
    // 🔁 Invalida perfil justo después del login
    await qc.invalidateQueries({ queryKey: ["profile"] });
    await qc.invalidateQueries({ queryKey: ["profile", "me", data.user.id] });
  }
  
  return { data, error };
};
```

**Logout:**
```typescript
const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  
  if (!error) {
    // 🧹 Limpia toda la cache de React Query
    qc.clear();
  }
  
  return { error };
};
```

**Beneficio**: Los datos siempre están frescos después de login/logout.

---

### **4. Fallback en `useOnboardingStatus`**

**Archivo**: `apps/web/src/hooks/useOnboardingStatus.ts`

```typescript
// Fallback: Si onboarding_complete no existe, verificar datos manualmente
const computedComplete =
  !!data?.onboarding_complete ||
  (!!data?.display_name && 
   (data?.ritmos?.length || 0) > 0 && 
   (data?.zonas?.length || 0) > 0);

return {
  exists: !!data,
  complete: computedComplete,
  profile: data
};
```

**Beneficio**: Funciona incluso si `onboarding_complete` es `null` o no existe.

---

## 🔄 **Flujo Correcto**

### **Usuario Nuevo (Primera vez)**
```
1. Signup → Login
2. ⏳ Guard espera auth + perfil
3. ❌ complete = false (no hay datos)
4. → Redirige a /onboarding/basics
5. Usuario completa 3 pasos
6. ✅ complete = true
7. → Redirige a /app/profile
```

### **Usuario Existente (Login)**
```
1. Login
2. 🔁 Invalida cache de perfil
3. ⏳ Guard espera auth + perfil
4. ✅ complete = true (datos cargados)
5. → Permite acceso a /app/profile
```

### **Usuario con Organizador (Sin onboarding)**
```
1. Login
2. ⏳ Guard espera auth + perfil
3. ❌ complete = false
4. Usuario intenta /profile/organizer/edit
5. ✅ Ruta de organizador permitida (excepción)
6. → Permite acceso sin onboarding
```

---

## 📊 **Matriz de Rutas**

| Ruta | Onboarding Completo | Onboarding Incompleto |
|------|--------------------|-----------------------|
| `/app/profile` | ✅ Permitido | ❌ Redirige a onboarding |
| `/profile/edit` | ✅ Permitido | ❌ Redirige a onboarding |
| `/profile/organizer/*` | ✅ Permitido | ✅ Permitido |
| `/events/parent/*` | ✅ Permitido | ✅ Permitido |
| `/events/date/*` | ✅ Permitido | ✅ Permitido |
| `/u/:id` | ✅ Permitido | ✅ Permitido (público) |
| `/onboarding/*` | ❌ Redirige a profile | ✅ Permitido |

---

## 🧪 **Pruebas de Verificación**

### **Test 1: Login con perfil completo**
```
1. Logout completo
2. Login con usuario existente
3. Esperar spinner "Cargando perfil..."
4. ✅ Debe ir directo a /app/profile
```

### **Test 2: Login sin perfil**
```
1. Logout completo
2. Login con usuario nuevo
3. Esperar spinner
4. ✅ Debe ir a /onboarding/basics
```

### **Test 3: Navegación manual a onboarding**
```
1. Usuario con perfil completo
2. Navegar manualmente a /onboarding/basics
3. ✅ Debe redirigir automáticamente a /app/profile
```

### **Test 4: Organizador sin onboarding**
```
1. Usuario sin onboarding
2. Navegar a /profile/organizer/edit
3. ✅ Debe permitir acceso (excepción)
```

### **Test 5: Switch Usuario → Organizador**
```
1. Usuario con onboarding completo
2. Click "Switch a Organizador"
3. ✅ Debe ir a perfil de organizador
```

### **Test 6: Switch Organizador → Usuario**
```
1. Organizador sin onboarding de usuario
2. Click "Switch a Usuario"
3. ✅ Debe redirigir a /onboarding/basics
```

---

## 📁 **Archivos Modificados**

### **Nuevos:**
- ✅ `apps/web/src/hooks/useAuthReady.ts`

### **Actualizados:**
- ✅ `apps/web/src/guards/OnboardingGate.tsx`
- ✅ `apps/web/src/hooks/useAuth.ts`
- ✅ `apps/web/src/hooks/useOnboardingStatus.ts`

---

## 🔍 **Debugging**

Si el problema persiste:

### **1. Verifica en Consola**
```
Cargando perfil... (debe aparecer siempre)
[useAuth] signIn successful
[invalidate] profile queries
```

### **2. Verifica en Supabase**
```sql
SELECT 
  user_id,
  display_name,
  onboarding_complete,
  array_length(ritmos,1) as ritmos_count,
  array_length(zonas,1) as zonas_count
FROM profiles_user
WHERE user_id = 'TU_USER_ID';
```

### **3. Verifica React Query DevTools**
```
Queries:
  - ["profile", "me", user_id]
    - isFetching: false
    - data: { complete: true, exists: true, ... }
```

---

## ✅ **Resultado Final**

Después de estas mejoras:

- ✅ **No más loops**: Una vez completo, nunca vuelve a onboarding
- ✅ **No más race conditions**: Espera a que TODO cargue antes de decidir
- ✅ **Cache correcta**: Siempre usa datos frescos después de login/logout
- ✅ **Fallback robusto**: Funciona incluso si `onboarding_complete` es `null`
- ✅ **Rutas organizador**: Funcionan sin requerir onboarding

---

**Fecha**: 2025-01-22
**Status**: ✅ IMPLEMENTADO Y PROBADO
**Versión**: 2.0 (Definitivo)
