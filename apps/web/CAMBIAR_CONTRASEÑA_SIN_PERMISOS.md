# 🔐 Cambiar Contraseña Sin Permisos SQL Directos

El error `permission denied for table users` ocurre porque `auth.users` está protegida. Aquí tienes las soluciones que SÍ funcionan:

---

## ✅ SOLUCIÓN 1: Dashboard de Supabase (MÁS FÁCIL - RECOMENDADO)

### Pasos:

1. **Ve a Supabase Dashboard**
   - Abre tu proyecto en https://supabase.com/dashboard

2. **Ve a Authentication > Users**
   - Menú lateral → Authentication → Users

3. **Busca el usuario**
   - Busca por ID: `501bdfe7-5568-4411-a666-7b17d21face1`
   - O busca por email si lo conoces

4. **Haz clic en el usuario** para abrir sus detalles

5. **Haz clic en "..." (menú de opciones)** en la esquina superior derecha

6. **Selecciona "Reset Password"**
   - Esto enviará un email de reset al usuario
   - O si tienes permisos, puedes ver/editar directamente

7. **Alternativa: Si ves el campo de contraseña**
   - Algunas versiones del Dashboard permiten editar directamente
   - Simplemente cambia la contraseña y guarda

---

## ✅ SOLUCIÓN 2: Management API de Supabase (PROGRAMÁTICO)

Usa la Management API con tu `SERVICE_ROLE_KEY`:

### Opción A: Usando cURL

```bash
curl -X PUT 'https://TU_PROYECTO.supabase.co/auth/v1/admin/users/501bdfe7-5568-4411-a666-7b17d21face1' \
  -H "apikey: TU_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer TU_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "TuNuevaContraseña123!"
  }'
```

### Opción B: Usando JavaScript/Node.js

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  'https://TU_PROYECTO.supabase.co',
  'TU_SERVICE_ROLE_KEY' // ⚠️ NUNCA expongas esto en el cliente
);

const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
  '501bdfe7-5568-4411-a666-7b17d21face1',
  { password: 'TuNuevaContraseña123!' }
);

console.log(data, error);
```

### Opción C: Usando Python

```python
from supabase import create_client, Client

url = "https://TU_PROYECTO.supabase.co"
service_role_key = "TU_SERVICE_ROLE_KEY"  # ⚠️ NUNCA expongas esto

supabase: Client = create_client(url, service_role_key)

response = supabase.auth.admin.update_user_by_id(
    "501bdfe7-5568-4411-a666-7b17d21face1",
    {"password": "TuNuevaContraseña123!"}
)

print(response)
```

---

## ✅ SOLUCIÓN 3: Impersonar Usuario (MÁS FÁCIL SI TIENES ACCESO)

1. **Ve a Authentication > Users**
2. **Busca el usuario** con ID: `501bdfe7-5568-4411-a666-7b17d21face1`
3. **Haz clic en "Impersonate User"**
4. **Una vez impersonado**, abre la consola del navegador (F12)
5. **Ejecuta:**

```javascript
const { data, error } = await supabase.auth.updateUser({
  password: 'TuNuevaContraseña123!'
});

if (error) {
  console.error('Error:', error);
} else {
  console.log('✅ Contraseña actualizada:', data);
}
```

---

## ✅ SOLUCIÓN 4: Función SQL con Permisos Especiales

Si realmente necesitas usar SQL, crea una función con `SECURITY DEFINER`:

```sql
-- Crear función con permisos especiales
CREATE OR REPLACE FUNCTION admin_change_password(
  p_user_id UUID,
  p_new_password TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth
AS $$
BEGIN
  -- Validar longitud mínima
  IF LENGTH(p_new_password) < 6 THEN
    RAISE EXCEPTION 'La contraseña debe tener al menos 6 caracteres';
  END IF;
  
  -- Actualizar contraseña
  UPDATE auth.users
  SET 
    encrypted_password = crypt(p_new_password, gen_salt('bf')),
    updated_at = NOW()
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;
  
  RETURN 'Contraseña actualizada correctamente';
END;
$$;

-- Ejecutar la función
SELECT admin_change_password(
  '501bdfe7-5568-4411-a666-7b17d21face1'::uuid,
  'TuNuevaContraseña123!'::text
);
```

**Nota:** Esta función requiere que tengas permisos para crear funciones con `SECURITY DEFINER`.

---

## 🔑 Dónde Encontrar tu SERVICE_ROLE_KEY

1. Ve a Supabase Dashboard
2. Ve a **Settings** (⚙️) → **API**
3. Busca **"service_role"** key (⚠️ NUNCA lo expongas en el cliente)
4. Copia el key

---

## 📋 Resumen de Métodos

| Método | Dificultad | Requisitos | Recomendado |
|--------|-----------|------------|-------------|
| **Dashboard** | ⭐ Fácil | Acceso al Dashboard | ✅ SÍ |
| **Management API** | ⭐⭐ Media | SERVICE_ROLE_KEY | ✅ SÍ |
| **Impersonar** | ⭐ Fácil | Permisos de admin | ✅ SÍ |
| **Función SQL** | ⭐⭐⭐ Difícil | Permisos especiales | ⚠️ Solo si es necesario |

---

## ✅ RECOMENDACIÓN FINAL

**Usa el Dashboard de Supabase:**
1. Authentication > Users
2. Busca el usuario
3. "..." → "Reset Password"

**O si necesitas automatizarlo:**
- Usa la Management API con SERVICE_ROLE_KEY

---

## ⚠️ IMPORTANTE

- **NUNCA** expongas tu `SERVICE_ROLE_KEY` en código del cliente
- **NUNCA** lo subas a Git
- Úsalo solo en el backend o scripts de administración
- El `SERVICE_ROLE_KEY` tiene permisos completos sobre tu proyecto

