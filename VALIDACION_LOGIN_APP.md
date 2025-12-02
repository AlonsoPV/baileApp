# 🔍 Validación de Funcionalidad de Inicio de Sesión para App Móvil

## 📋 Resumen Ejecutivo

**Estado Actual:** ⚠️ **INCOMPLETO** - La app móvil muestra la web en un WebView, pero no tiene lógica de autenticación nativa implementada.

**Problemas Identificados:**
1. `RootNavigator.tsx` tiene `isLoggedIn = true` hardcodeado
2. `AuthStack.tsx` solo tiene pantallas placeholder sin funcionalidad
3. No hay integración de Supabase Auth para React Native
4. La autenticación depende completamente del WebView

---

## 🔎 Análisis Detallado

### 1. **Arquitectura Actual**

La app móvil usa un **WebView** que carga `https://dondebailar.com.mx`, lo que significa:
- ✅ La autenticación web funciona dentro del WebView
- ❌ No hay control nativo del estado de autenticación
- ❌ No se puede verificar sesión antes de mostrar el WebView
- ❌ No hay manejo de deep links para OAuth callbacks

### 2. **Archivos Revisados**

#### ✅ **Funcionando (Web)**
- `apps/web/src/contexts/AuthProvider.tsx` - ✅ Funcional
- `apps/web/src/screens/auth/Login.tsx` - ✅ Funcional (Magic Link + Password + Google)
- `apps/web/src/screens/auth/AuthCallback.tsx` - ✅ Funcional
- `apps/web/src/screens/auth/PinLogin.tsx` - ✅ Funcional

#### ⚠️ **Incompleto (Mobile)**
- `src/navigation/RootNavigator.tsx` - ⚠️ `isLoggedIn` hardcodeado
- `src/navigation/AuthStack.tsx` - ⚠️ Solo placeholders
- `src/lib/supabase.ts` - ✅ Configurado pero no usado

### 3. **Problemas Específicos**

#### **Problema 1: RootNavigator.tsx**
```typescript
// ❌ Línea 10: Hardcodeado
const isLoggedIn = true; // TODO: reemplazar con lógica real de sesión (Sprint 1)
```

**Impacto:** La app siempre muestra el WebView, incluso si el usuario no está autenticado.

#### **Problema 2: AuthStack.tsx**
```typescript
// ❌ Solo placeholders sin funcionalidad
function LoginScreen() {
  return (
    <View>
      <Text>¡Bienvenido a BaileApp! 💃</Text>
      <Text>Inicia sesión para continuar</Text>
    </View>
  );
}
```

**Impacto:** No hay forma de autenticarse nativamente en la app.

#### **Problema 3: Falta de Integración Supabase**
- `src/lib/supabase.ts` existe pero no se usa
- No hay `AuthProvider` para React Native
- No hay hooks de autenticación para mobile

---

## ✅ Recomendaciones de Implementación

### **Opción A: Autenticación Nativa (Recomendada)**

Implementar autenticación nativa en React Native con Supabase:

#### **1. Crear AuthProvider para React Native**

```typescript
// src/contexts/AuthProvider.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

#### **2. Actualizar RootNavigator.tsx**

```typescript
// src/navigation/RootNavigator.tsx
import { useAuth } from '../contexts/AuthProvider';

export function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="WebApp" component={WebAppScreen} />
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

#### **3. Implementar LoginScreen Real**

```typescript
// src/screens/auth/LoginScreen.tsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../../contexts/AuthProvider';

export function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    setError('');

    const { error } = await signIn(email.trim(), password.trim());

    if (error) {
      setError(error.message || 'Error al iniciar sesión');
      setLoading(false);
    }
    // Si no hay error, el AuthProvider actualizará el estado y RootNavigator redirigirá
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.link}>¿No tienes cuenta? Regístrate</Text>
      </TouchableOpacity>
    </View>
  );
}
```

#### **4. Configurar Deep Links para OAuth**

En `app.config.ts`, asegúrate de tener:

```typescript
scheme: "dondebailarmx",
```

Y en `RootNavigator.tsx`, manejar deep links:

```typescript
import { Linking } from 'react-native';
import * as Linking from 'expo-linking';

useEffect(() => {
  // Manejar deep links de OAuth
  const handleDeepLink = async (url: string) => {
    if (url.includes('auth/callback')) {
      // Procesar callback de OAuth
      const { data, error } = await supabase.auth.getSession();
      // El AuthProvider actualizará automáticamente
    }
  };

  Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
  
  // Verificar si la app se abrió con un deep link
  Linking.getInitialURL().then((url) => {
    if (url) handleDeepLink(url);
  });
}, []);
```

---

### **Opción B: Mantener WebView pero con Verificación de Sesión**

Si prefieres mantener el WebView pero agregar verificación:

#### **1. Verificar Sesión Antes de Mostrar WebView**

```typescript
// src/navigation/RootNavigator.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function RootNavigator() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    // Verificar sesión al iniciar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    // Escuchar cambios
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsLoggedIn(!!session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (isLoggedIn === null) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <Stack.Screen name="WebApp" component={WebAppScreen} />
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

#### **2. Sincronizar Sesión entre WebView y Native**

```typescript
// En WebAppScreen.tsx, inyectar JavaScript para escuchar cambios de sesión
const injectedJavaScript = `
  (function() {
    // Escuchar cambios de sesión en el WebView
    window.addEventListener('storage', (e) => {
      if (e.key && e.key.includes('supabase.auth.token')) {
        // Notificar a React Native
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'AUTH_STATE_CHANGE',
          hasSession: !!localStorage.getItem(e.key)
        }));
      }
    });
  })();
`;

// En el WebView
<WebView
  onMessage={(event) => {
    const data = JSON.parse(event.nativeEvent.data);
    if (data.type === 'AUTH_STATE_CHANGE') {
      // Actualizar estado nativo
    }
  }}
  injectedJavaScript={injectedJavaScript}
/>
```

---

## 🎯 Plan de Acción Recomendado

### **Fase 1: Implementación Básica (1-2 días)**
1. ✅ Crear `AuthProvider` para React Native
2. ✅ Actualizar `RootNavigator` para usar sesión real
3. ✅ Implementar `LoginScreen` funcional
4. ✅ Agregar `LoadingScreen` component

### **Fase 2: OAuth y Deep Links (2-3 días)**
1. ✅ Configurar deep links en `app.config.ts`
2. ✅ Manejar callbacks de OAuth (Google, Facebook)
3. ✅ Implementar `AuthCallback` screen nativo
4. ✅ Probar flujo completo de OAuth

### **Fase 3: Mejoras (1-2 días)**
1. ✅ Agregar Magic Link support (opcional)
2. ✅ Implementar "Recordar sesión"
3. ✅ Agregar manejo de errores robusto
4. ✅ Testing en iOS y Android

---

## 📝 Checklist de Validación

### **Funcionalidad Básica**
- [ ] Usuario puede iniciar sesión con email/password
- [ ] Usuario puede registrarse
- [ ] Sesión persiste al cerrar y reabrir la app
- [ ] Usuario puede cerrar sesión
- [ ] Redirección correcta según estado de autenticación

### **OAuth**
- [ ] Login con Google funciona
- [ ] Login con Facebook funciona (si está configurado)
- [ ] Deep links funcionan correctamente
- [ ] Callback de OAuth procesa correctamente

### **UX/UI**
- [ ] Loading states apropiados
- [ ] Mensajes de error claros
- [ ] Validación de formularios
- [ ] Navegación fluida entre pantallas

### **Seguridad**
- [ ] Tokens no se exponen en logs
- [ ] Sesión se limpia al cerrar sesión
- [ ] Deep links validados
- [ ] No hay tokens hardcodeados

---

## 🔧 Archivos a Modificar/Crear

### **Crear:**
- `src/contexts/AuthProvider.tsx` (nuevo)
- `src/screens/auth/LoginScreen.tsx` (reemplazar placeholder)
- `src/screens/auth/SignupScreen.tsx` (reemplazar placeholder)
- `src/components/LoadingScreen.tsx` (nuevo)

### **Modificar:**
- `src/navigation/RootNavigator.tsx` (usar sesión real)
- `src/navigation/AuthStack.tsx` (usar screens reales)
- `app.config.ts` (verificar deep links)

### **Dependencias Necesarias:**
```json
{
  "@supabase/supabase-js": "^2.x.x",
  "expo-linking": "~x.x.x",
  "expo-web-browser": "~x.x.x" // Para OAuth
}
```

---

## ⚠️ Consideraciones Importantes

1. **Persistencia de Sesión:** Supabase maneja esto automáticamente con AsyncStorage en React Native
2. **Deep Links:** Requieren configuración en `app.config.ts` y manejo en el código
3. **OAuth:** Necesita URLs de callback configuradas en Supabase Dashboard
4. **WebView vs Nativo:** Si usas WebView, la sesión se comparte automáticamente si usas el mismo dominio

---

## 📚 Recursos

- [Supabase Auth para React Native](https://supabase.com/docs/guides/auth/auth-helpers/react-native)
- [Expo Deep Linking](https://docs.expo.dev/guides/linking/)
- [React Navigation Auth Flow](https://reactnavigation.org/docs/auth-flow/)

---

**Última actualización:** 2025-01-29  
**Estado:** ⚠️ Requiere implementación

