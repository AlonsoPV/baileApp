# 🔧 Fix: OnboardingGate Bloqueando Rutas de Organizador

## ❌ **Problema**

El `OnboardingGate` estaba redirigiendo a `/onboarding/basics` en todas estas situaciones:
- ❌ Al intentar acceder a rutas de organizador (`/profile/organizer/edit`)
- ❌ Al intentar crear/editar eventos (`/events/parent/*/edit`)
- ❌ Al hacer "Switch a Usuario" desde organizador
- ❌ Incluso si el usuario ya tenía un perfil de organizador funcional

**Causa:** La lógica del guard era demasiado estricta y bloqueaba TODAS las rutas si `onboarding_complete = false`.

## ✅ **Solución Implementada**

### **Lógica Actualizada**

El `OnboardingGate` ahora distingue entre diferentes tipos de rutas:

```typescript
// ✅ PERMITIDAS sin onboarding completo:
const organizerRoutes = [
  '/profile/organizer',  // Perfil de organizador
  '/events/parent',      // Gestión de eventos padre
  '/events/date'         // Gestión de fechas de evento
];

// ✅ PERMITIDAS (rutas públicas):
const publicRoutes = [
  '/u/',                 // Perfiles públicos de usuarios
  '/events/parent/',     // Eventos públicos
  '/events/date/'        // Fechas de eventos públicas
];

// ❌ BLOQUEADAS sin onboarding:
- /app/profile         // Perfil de usuario (requiere onboarding)
- /profile/edit        // Editar perfil de usuario
- Cualquier otra ruta de usuario
```

### **Flujo Correcto**

#### **Usuario SIN onboarding completo:**
1. ✅ Puede crear perfil de organizador → `/profile/organizer/edit`
2. ✅ Puede crear eventos → `/events/parent/new`
3. ✅ Puede gestionar fechas → `/events/date/new/:parentId`
4. ❌ NO puede ver su perfil de usuario → Redirige a `/onboarding/basics`

#### **Usuario CON onboarding completo:**
1. ✅ Acceso total a perfil de usuario
2. ✅ Acceso total a perfil de organizador
3. ✅ Acceso total a gestión de eventos
4. ✅ Puede ver perfiles públicos

## 🎯 **Casos de Uso**

### **Caso 1: Nuevo Usuario que quiere ser Organizador**
```
1. Signup → Login
2. Click "Crear Organizador" 
3. ✅ Va a /profile/organizer/edit (SIN pasar por onboarding de usuario)
4. Completa perfil de organizador
5. Crea eventos
```

### **Caso 2: Organizador que luego quiere completar perfil de usuario**
```
1. Ya tiene perfil de organizador funcionando
2. Click "Switch a Usuario"
3. ❌ Redirige a /onboarding/basics (necesita completar perfil de usuario)
4. Completa onboarding
5. ✅ Ahora puede acceder a ambos perfiles
```

### **Caso 3: Usuario completo que crea perfil de organizador**
```
1. Ya tiene onboarding completo
2. Click "Crear Organizador"
3. ✅ Va directo a /profile/organizer/edit
4. Completa perfil de organizador
5. ✅ Puede alternar entre ambos perfiles libremente
```

## 📋 **Rutas y Comportamiento**

### **Rutas de Usuario (requieren onboarding)**
- `/app/profile` → Perfil principal
- `/profile` → Alias de perfil
- `/profile/edit` → Editar perfil de usuario
- `/me/rsvps` → Mis RSVPs

### **Rutas de Organizador (NO requieren onboarding)**
- `/profile/organizer` → Perfil de organizador live
- `/profile/organizer/edit` → Crear/editar organizador
- `/events/parent/new` → Crear evento padre
- `/events/parent/:id/edit` → Editar evento padre
- `/events/parent/:id/dates` → Dashboard de fechas
- `/events/date/new/:parentId` → Crear fecha
- `/events/date/:id/edit` → Editar fecha

### **Rutas Públicas (sin restricciones)**
- `/u/:id` → Perfil público de usuario
- `/events/parent/:id` → Evento público
- `/events/date/:id` → Fecha de evento pública

### **Rutas de Onboarding (siempre accesibles)**
- `/onboarding/basics` → Paso 1
- `/onboarding/ritmos` → Paso 2
- `/onboarding/zonas` → Paso 3

## 🔍 **Código del Fix**

```typescript
const isOnboardingRoute = loc.pathname.startsWith("/onboarding");

// Rutas que NO requieren onboarding completo
const organizerRoutes = [
  '/profile/organizer',
  '/events/parent',
  '/events/date'
];
const isOrganizerRoute = organizerRoutes.some(route => 
  loc.pathname.startsWith(route)
);

// Rutas públicas que tampoco requieren onboarding
const publicRoutes = ['/u/', '/events/parent/', '/events/date/'];
const isPublicRoute = publicRoutes.some(route => 
  loc.pathname.includes(route) && !loc.pathname.includes('/edit')
);

// Solo bloquea si NO está completo Y NO es ruta especial
if (!complete && !isOnboardingRoute && !isOrganizerRoute && !isPublicRoute) {
  return <Navigate to="/onboarding/basics" replace />;
}
```

## 🚀 **Resultado**

Después de este fix:

✅ **Organizadores pueden trabajar** sin completar onboarding de usuario
✅ **No hay loops infinitos** al editar eventos
✅ **Switch entre perfiles funciona** correctamente
✅ **Rutas públicas accesibles** para todos
✅ **Onboarding solo requerido** para funciones de usuario

## 📝 **Archivo Modificado**

- `apps/web/src/guards/OnboardingGate.tsx` - Lógica de rutas actualizada

## ✅ **Checklist de Verificación**

- [ ] Puedo crear perfil de organizador sin completar onboarding
- [ ] Puedo editar eventos sin ser redirigido a onboarding
- [ ] Switch a Usuario desde Organizador funciona (va a onboarding si falta)
- [ ] Switch a Organizador desde Usuario funciona (directo si ya existe)
- [ ] Rutas públicas accesibles sin login
- [ ] Onboarding solo requerido para perfil de usuario

---

**Fecha**: 2025-01-22
**Status**: ✅ Implementado
**Tipo**: Fix de lógica de rutas
