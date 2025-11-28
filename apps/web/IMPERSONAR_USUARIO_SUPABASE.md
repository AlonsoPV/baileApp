# 🔐 Cómo Impersonar Usuario y Cambiar Contraseña en Supabase

## Método 1: Impersonar desde Dashboard (MÁS FÁCIL)

### Pasos:

1. **Ve al Dashboard de Supabase**
   - Abre tu proyecto en https://supabase.com/dashboard

2. **Ve a Authentication > Users**
   - En el menú lateral, haz clic en "Authentication"
   - Luego haz clic en "Users"

3. **Busca el usuario**
   - Busca el usuario con ID: `501bdfe7-5568-4411-a666-7b17d21face1`
   - O busca por email si lo conoces

4. **Impersonar al usuario**
   - Haz clic en el usuario para abrir sus detalles
   - Haz clic en el botón **"Impersonate User"** (o "Impersonar Usuario")
   - Esto abrirá una nueva pestaña donde estarás autenticado como ese usuario

5. **Cambiar la contraseña desde la sesión impersonada**
   - Una vez impersonado, puedes usar la funcionalidad normal de cambio de contraseña de la app
   - O usar el método de reset password desde el Dashboard

---

## Método 2: Cambiar Contraseña Mientras Impersonas

### Opción A: Desde el Dashboard (mientras impersonas)

1. **Mientras estás impersonando**, ve a Authentication > Users
2. Haz clic en el usuario actual (que eres tú impersonando)
3. Haz clic en **"Reset Password"**
4. Se enviará un email de reset al usuario
5. O puedes usar el SQL directo mientras estás impersonando

### Opción B: Usar la API de Supabase Auth (mientras impersonas)

Cuando impersonas, puedes usar la API de Supabase Auth para cambiar la contraseña:

```javascript
// Desde la consola del navegador mientras estás impersonando
const { data, error } = await supabase.auth.updateUser({
  password: 'TuNuevaContraseña123!'
});
```

---

## Método 3: Reset Password Directo (SIN Impersonar)

Si solo quieres cambiar la contraseña sin impersonar:

1. **Ve a Authentication > Users**
2. **Busca el usuario** con ID: `501bdfe7-5568-4411-a666-7b17d21face1`
3. **Haz clic en "..." (menú de opciones)**
4. **Selecciona "Reset Password"**
5. Se enviará un email de reset al usuario

---

## Método 4: SQL Directo (Mientras Impersonas o Como Admin)

Si estás impersonando o tienes permisos de admin, puedes ejecutar este SQL:

```sql
-- Habilitar extensión pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Cambiar contraseña
UPDATE auth.users
SET 
  encrypted_password = crypt('TuNuevaContraseña123!', gen_salt('bf')),
  updated_at = NOW()
WHERE id = '501bdfe7-5568-4411-a666-7b17d21face1';
```

---

## ⚠️ Notas Importantes

1. **Permisos**: Necesitas ser administrador del proyecto para impersonar usuarios
2. **Seguridad**: La impersonación es una función poderosa, úsala con cuidado
3. **Sesión**: Cuando impersonas, estás iniciando sesión como ese usuario
4. **Logout**: Para dejar de impersonar, simplemente cierra la sesión

---

## ✅ Recomendación

**La forma MÁS FÁCIL es:**

1. Ve a Authentication > Users
2. Busca el usuario
3. Haz clic en "Reset Password"
4. El usuario recibirá un email para cambiar su contraseña

**O si necesitas cambiarla inmediatamente:**

1. Impersona al usuario
2. Ejecuta el SQL directo mientras estás impersonando
3. O usa `supabase.auth.updateUser()` desde la consola del navegador

---

## 🔗 Referencias

- [Supabase Auth - Impersonate Users](https://supabase.com/docs/guides/auth/auth-impersonation)
- [Supabase Auth - Reset Password](https://supabase.com/docs/guides/auth/auth-reset-password)

