# 🔍 Debug Guide: useAuth Stack Trace Analysis

## Objetivo

Cuando ocurra el error `ReferenceError: useAuth is not defined`, este documento te ayuda a identificar exactamente dónde falla usando el stack trace con sourcemap.

---

## 📋 Cómo Leer el Stack Trace

### 1. Formato del Stack Trace

Cuando useAuth falle, verás algo como esto en la consola del navegador:

```
ReferenceError: useAuth is not defined
    at SomeComponent (http://localhost:5173/src/screens/events/SomeScreen.tsx:45:12)
    at AppContent
    at App (http://localhost:5173/src/App.tsx:17:5)
```

### 2. Información del Stack Trace

**URL del archivo**: `http://localhost:5173/src/screens/events/SomeScreen.tsx:45:12`
- **Archivo**: `apps/web/src/screens/events/SomeScreen.tsx`
- **Línea**: `45`
- **Columna**: `12`

**Función que falla**: `SomeComponent` (primer elemento del stack)
- Esta es la función/componente donde se usa `useAuth()` sin importarlo

---

## 🎯 Patrones Comunes de Errores

### Error Patrón 1: Falta el Import

```typescript
// ❌ MAL - Sin import
export function MyComponent() {
  const { user } = useAuth(); // ❌ useAuth is not defined
  return <div>...</div>;
}

// ✅ BIEN - Con import
import { useAuth } from '@/contexts/AuthProvider';

export function MyComponent() {
  const { user } = useAuth(); // ✅ Funciona
  return <div>...</div>;
}
```

**Stack trace típico**:
```
ReferenceError: useAuth is not defined
    at MyComponent (MyComponent.tsx:5:15)
```

**Fix**: Agregar `import { useAuth } from '@/contexts/AuthProvider';` al inicio del archivo.

---

### Error Patrón 2: Usado Fuera de React Context

```typescript
// ❌ MAL - En un store (fuera de React)
import { useAuth } from '@/contexts/AuthProvider';

export const myStore = create((set) => ({
  user: null,
  init: () => {
    const { user } = useAuth(); // ❌ Fuera de contexto React
    set({ user });
  }
}));
```

**Stack trace típico**:
```
Error: useAuth fue usado fuera de <AuthProvider>. Envuelve tu árbol en <AuthProvider>.
    at useAuth (AuthProvider.tsx:131:9)
    at myStore (myStore.ts:10:25)
```

**Fix**: No usar `useAuth()` en stores, utils, o fuera de componentes. Pasar datos como props o usar callbacks.

---

### Error Patrón 3: Import Roto (Path Incorrecto)

```typescript
// ❌ MAL - Path incorrecto
import { useAuth } from '../../hooks/useAuth'; // ❌ Ruta incorrecta

export function MyComponent() {
  const { user } = useAuth();
  return <div>...</div>;
}
```

**Stack trace típico**:
```
Module not found: Can't resolve '../../hooks/useAuth'
```

**Fix**: Cambiar a `import { useAuth } from '@/contexts/AuthProvider';`

---

### Error Patrón 4: Import con Case Sensitive

```typescript
// ❌ MAL - Case incorrecto
import { useauth } from '@/contexts/AuthProvider'; // ❌ 'useauth' != 'useAuth'

export function MyComponent() {
  const { user } = useAuth(); // ❌ useAuth is not defined
}
```

**Fix**: Usar exactamente `useAuth` (con mayúscula en A).

---

## 🔧 Debugging Tool: Auth Stack Diagnóstico

### Agregar Temporalmente en App.tsx

Si necesitas ver el stack completo, agrega esto temporalmente:

```typescript
import { AuthProvider, useAuth } from "./contexts/AuthProvider";

// Componente de diagnóstico
function AuthDiagnostic() {
  try {
    const auth = useAuth();
    console.log('✅ Auth OK:', { 
      userId: auth.user?.id, 
      loading: auth.loading 
    });
    return null;
  } catch (error: any) {
    console.error('❌ Auth FAIL:', error);
    console.error('❌ Stack:', error.stack);
    
    // Este return mostrará un indicador visual
    return (
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        right: 0, 
        background: 'red', 
        color: 'white',
        padding: '8px',
        zIndex: 9999 
      }}>
        ❌ Auth Error - Check console
      </div>
    );
  }
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthDiagnostic /> {/* Temporal - remover después */}
        <ToastProvider>
          <AppBootstrap>
            <AppContent />
          </AppBootstrap>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

---

## 📊 Ejemplo Real de Stack Trace

Si el error ocurre, verás algo así:

```
ReferenceError: useAuth is not defined
    at useAuth (http://localhost:5173/src/screens/profile/UserProfileEditor.tsx:42:8)
    at UserProfileEditor (http://localhost:5173/src/screens/profile/UserProfileEditor.tsx:42:8)
    at renderWithHooks (react-dom.development.js:16685)
    at updateFunctionComponent (react-dom.development.js:16946)
    ...
```

### Análisis de este Stack:

1. **Archivo**: `apps/web/src/screens/profile/UserProfileEditor.tsx`
2. **Línea**: `42`
3. **Función**: `UserProfileEditor`
4. **Problema**: useAuth() usado en línea 42 pero no importado o mal importado

### Fix para este caso:

Abrir `UserProfileEditor.tsx` y agregar:
```typescript
import { useAuth } from '@/contexts/AuthProvider';
```

Luego verificar que la línea 42 es correcta:
```typescript
const { user, loading } = useAuth(); // Debe tener el import arriba
```

---

## ✅ Checklist de Verificación

Cuando veas el error, verifica:

- [ ] El archivo tiene `import { useAuth } from '@/contexts/AuthProvider';`
- [ ] El import está al inicio del archivo (después de `import React`)
- [ ] La función que usa useAuth es un componente React (no es un store/utils)
- [ ] El componente está dentro del árbol envuelto por `<AuthProvider>`
- [ ] No hay typos en el nombre del import (useAuth, no useauth)

---

## 🚨 Uso INCORRECTO de useAuth

### ❌ NO hacer esto:

1. **En stores**:
```typescript
// ❌ NUNCA
export const myStore = create((set) => ({
  init: async () => {
    const { user } = useAuth(); // ❌ NUNCA
  }
}));
```

2. **En utils**:
```typescript
// ❌ NUNCA
export function myUtil() {
  const { user } = useAuth(); // ❌ NUNCA
}
```

3. **En funciones helpers**:
```typescript
// ❌ NUNCA
function myHelper() {
  const { user } = useAuth(); // ❌ NUNCA
}
```

### ✅ Hacer esto:

1. **Pasar como parámetro**:
```typescript
// ✅ BIEN
export function myUtil(user: User) {
  // usar user aquí
}

// En el componente:
export function MyComponent() {
  const { user } = useAuth();
  myUtil(user);
}
```

2. **Usar en componente y pasar al store**:
```typescript
// ✅ BIEN
export function MyComponent() {
  const { user } = useAuth();
  
  useEffect(() => {
    myStore.getState().setUser(user);
  }, [user]);
  
  return <div>...</div>;
}
```

---

## 📝 Log del Error

Cuando veas el error, copia y pega aquí:

1. **URL completa del archivo** (del stack trace)
2. **Línea** (del stack trace)
3. **Nombre de la función/componente** (del stack trace)
4. **Contenido del archivo** (alrededor de esa línea)

Ejemplo:

```
URL: http://localhost:5173/src/screens/profile/UserProfileEditor.tsx:42:8
Línea: 42
Función: UserProfileEditor

Archivo (líneas 1-50):
import React from 'react';
...
const { user } = useAuth(); // línea 42
...
```

---

## 🎯 Quick Fix Checklist

Si el error aparece en producción:

1. **Activa sourcemaps** en `vite.config.ts`:
```typescript
build: {
  sourcemap: true,
}
```

2. **Despliega y captura el error** en Vercel/Railway logs

3. **Identifica el archivo** del stack trace (primera línea)

4. **Agrega el import** faltante o corrige el uso incorrecto

5. **Re-despliega** y verifica

---

## 📞 Próximos Pasos

Cuando veas el error:
1. Copia el **stack trace completo** de la consola
2. Identifica el **primer archivo** del stack (ese es donde falla)
3. Mira la **línea exacta** del error
4. Verifica si tiene el **import correcto**
5. Si todo está bien, puede ser uso fuera de React context

**Comparte el stack trace** y te diré exactamente qué fix aplicar.

