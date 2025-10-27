# 🔍 Guía de Debug para useAuth

## ¿Cuándo usar esta guía?

Si ves este error en la consola del navegador:
```
ReferenceError: useAuth is not defined
```

Esta guía te ayudará a identificar y solucionar el problema paso a paso.

## 📋 Checklist rápido

- [ ] ¿Está la app envuelta en `<AuthProvider>`?
- [ ] ¿El import es `import { useAuth } from '@/contexts/AuthProvider'`?
- [ ] ¿Se está usando `useAuth()` dentro de un componente React?
- [ ] ¿Hay sourcemaps activos en el build?

## 🔍 Cómo leer el stack trace

### 1. Identificar el archivo problemático

El stack trace mostrará algo como:
```
ReferenceError: useAuth is not defined
    at SomeComponent (SomeComponent.tsx:15:5)
    at renderWithHooks (react-dom.development.js:16305:9)
```

**Busca la línea que termina en `.tsx:15:5`** - ese es tu archivo y línea problemática.

### 2. Con sourcemaps activos

Si tienes sourcemaps, verás:
```
ReferenceError: useAuth is not defined
    at SomeComponent (SomeComponent.tsx:15:5)
    at renderWithHooks (react-dom.development.js:16305:9)
```

Sin sourcemaps, verás:
```
ReferenceError: useAuth is not defined
    at SomeComponent (index.js:1:1234)
    at renderWithHooks (react-dom.development.js:16305:9)
```

**Los sourcemaps son cruciales para debugging en producción.**

## 🛠️ Soluciones paso a paso

### Paso 1: Verificar el import

**❌ Incorrecto:**
```typescript
import useAuth from '@/hooks/useAuth';
import { useAuth } from '../../hooks/useAuth';
import useAuth from '../hooks/useAuth';
```

**✅ Correcto:**
```typescript
import { useAuth } from '@/contexts/AuthProvider';
```

### Paso 2: Verificar el contexto

Asegúrate de que tu app esté envuelta en `AuthProvider`:

```typescript
// main.tsx
import { AuthProvider } from '@/contexts/AuthProvider';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

### Paso 3: Verificar el uso dentro de componentes

**❌ Incorrecto (fuera de componente):**
```typescript
// utils/auth.ts
export function getUserId() {
  const { user } = useAuth(); // ❌ Error!
  return user?.id;
}
```

**✅ Correcto (dentro de componente):**
```typescript
// components/UserProfile.tsx
export default function UserProfile() {
  const { user } = useAuth(); // ✅ Correcto!
  return <div>{user?.email}</div>;
}
```

**✅ Alternativa para utils:**
```typescript
// utils/auth.ts
export function getUserId(user: User | null) {
  return user?.id;
}

// components/UserProfile.tsx
export default function UserProfile() {
  const { user } = useAuth();
  const userId = getUserId(user); // ✅ Pasar como parámetro
  return <div>{userId}</div>;
}
```

## 🔧 Herramientas de diagnóstico

### 1. Componente de diagnóstico

Agrega temporalmente este componente para detectar problemas:

```typescript
// components/dev/AuthDiagnostic.tsx
import { useAuth } from '@/contexts/AuthProvider';

export default function AuthDiagnostic() {
  try {
    const { user, loading } = useAuth();
    if (import.meta.env.DEV) {
      console.log('[AuthDiagnostic]', { uid: user?.id, loading });
    }
    return null;
  } catch (e) {
    console.error('❌ Auth FAIL:', e);
    return import.meta.env.DEV ? (
      <div style={{
        position: 'fixed', top: 8, right: 8, background: 'crimson',
        color: 'white', padding: '8px 12px', borderRadius: 8, zIndex: 9999
      }}>
        ❌ Auth Error — revisa consola
      </div>
    ) : null;
  }
}
```

### 2. Scripts de verificación

Ejecuta estos comandos para verificar la configuración:

```bash
# Verificar imports incorrectos
npm run check:auth

# Verificar tipos
npm run typecheck

# Verificar linting
npm run lint
```

### 3. Búsqueda manual

Busca en tu código:

```bash
# Buscar imports incorrectos
grep -r "useAuth" src --include="*.ts" --include="*.tsx"

# Buscar uso fuera de componentes
grep -r "useAuth()" src --include="*.ts" --include="*.tsx" | grep -E "(utils|stores|services)"
```

## 🚨 Errores comunes y soluciones

### Error 1: "useAuth is not defined"

**Causa:** Import incorrecto o falta de import.

**Solución:**
```typescript
// Cambiar de:
import useAuth from '@/hooks/useAuth';

// A:
import { useAuth } from '@/contexts/AuthProvider';
```

### Error 2: "Cannot read properties of undefined"

**Causa:** `useAuth()` retorna `undefined` porque no está dentro de `AuthProvider`.

**Solución:** Verificar que la app esté envuelta en `AuthProvider`.

### Error 3: "useAuth is not a function"

**Causa:** Import por defecto en lugar de named import.

**Solución:**
```typescript
// Cambiar de:
import useAuth from '@/contexts/AuthProvider';

// A:
import { useAuth } from '@/contexts/AuthProvider';
```

### Error 4: Stack trace ilegible en producción

**Causa:** Sourcemaps desactivados.

**Solución:** Activar sourcemaps en `vite.config.ts`:
```typescript
export default defineConfig({
  build: {
    sourcemap: true, // ← Clave para stack trace legible
  },
});
```

## 📝 Verificación final

Antes de hacer deploy, verifica:

1. **Build exitoso:** `npm run build`
2. **Sin errores de lint:** `npm run lint`
3. **Sin errores de tipos:** `npm run typecheck`
4. **useAuth solo en componentes:** `npm run check:auth`
5. **Sourcemaps activos:** Verificar en `dist/assets/`

## 🆘 Si nada funciona

1. **Revisa la consola del navegador** para el stack trace completo
2. **Activa sourcemaps** si están desactivados
3. **Verifica que no hay duplicados** de `AuthProvider` o `BrowserRouter`
4. **Revisa el import** en el archivo del stack trace
5. **Verifica que el componente** está dentro de la jerarquía de `AuthProvider`

## 📚 Recursos adicionales

- [React Context Documentation](https://react.dev/reference/react/useContext)
- [Vite Sourcemaps](https://vitejs.dev/config/build-options.html#build-sourcemap)
- [ESLint Import Rules](https://github.com/import-js/eslint-plugin-import)

---

**💡 Tip:** Mantén esta guía actualizada cuando cambies la configuración de autenticación.
