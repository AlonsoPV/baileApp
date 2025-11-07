# 🚀 GUÍA COMPLETA: DEPLOY A PRODUCCIÓN

## ✅ PRE-REQUISITOS (Confirma que completaste)

- [x] Base de datos homologada (staging = producción)
- [x] Eres superadmin en producción
- [x] Tablas antiguas eliminadas (opcional)
- [x] Verificación completa ejecutada sin errores críticos

---

## 📋 PASO 1: CONFIGURAR VARIABLES DE ENTORNO EN VERCEL

### 1.1 Ir a Vercel Dashboard

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto: **baileapp-mobile** (o como se llame)
3. Click en **Settings** → **Environment Variables**

### 1.2 Configurar variables para PRODUCTION

Agrega/actualiza estas variables para el environment **Production**:

```env
VITE_SUPABASE_URL=https://[tu-proyecto-prod].supabase.co
VITE_SUPABASE_ANON_KEY=[tu-anon-key-prod]
```

**¿Dónde encontrar estos valores?**
1. Ve a: **Supabase Dashboard** (producción)
2. Click en **Settings** → **API**
3. Copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

### 1.3 Configurar variables para PREVIEW/STAGING (opcional)

Si quieres que los deploys de preview usen staging:

```env
VITE_SUPABASE_URL=https://[tu-proyecto-staging].supabase.co
VITE_SUPABASE_ANON_KEY=[tu-anon-key-staging]
```

Selecciona environment: **Preview**

---

## 📦 PASO 2: PREPARAR EL CÓDIGO

### 2.1 Verificar que apuntas a las variables correctas

Verifica que tu código use las variables de entorno:

```typescript
// Debe usar import.meta.env.VITE_SUPABASE_URL
// NO debe tener URLs hardcodeadas
```

### 2.2 Commit de cambios (si hay)

```bash
cd apps/web

# Ver cambios pendientes
git status

# Si hay cambios, commitearlos
git add .
git commit -m "chore: preparar para deploy a producción"
```

---

## 🚀 PASO 3: DEPLOY A PRODUCCIÓN

### OPCIÓN A: Deploy Automático (Recomendado)

```bash
# Push a la rama principal (main o master)
git push origin main
```

Vercel detectará el push y hará el deploy automáticamente.

### OPCIÓN B: Deploy Manual desde Vercel Dashboard

1. Ve a: **Vercel Dashboard** → Tu proyecto
2. Click en **Deployments**
3. Encuentra el último deployment exitoso
4. Click en los **3 puntos** → **Redeploy**
5. Selecciona **Use existing Build Cache** (más rápido)
6. Click en **Redeploy**

### OPCIÓN C: Deploy desde CLI

```bash
# Instalar Vercel CLI (si no lo tienes)
npm install -g vercel

# Login
vercel login

# Deploy a producción
cd apps/web
vercel --prod
```

---

## ⏱️ PASO 4: ESPERAR EL DEPLOY

El deploy tomará **3-5 minutos**. Verás el progreso en:
- **Vercel Dashboard** → Deployments → Ver el deployment en progreso

Estados:
- 🟡 **Building** - Compilando el código
- 🟡 **Deploying** - Subiendo a producción
- 🟢 **Ready** - ¡Listo!

---

## ✅ PASO 5: VERIFICAR QUE FUNCIONA

### 5.1 Verificar URL de producción

Tu URL de producción será algo como:
```
https://baile-app-1lfl.vercel.app
```

O tu dominio custom si lo configuraste:
```
https://tudominio.com
```

### 5.2 Pruebas críticas (Checklist)

Abre tu URL de producción y prueba:

#### Autenticación:
- [ ] **Login con Magic Link** funciona
  - Ingresa email → Recibes email → Click en link → Entras
- [ ] **Registro** funciona
  - Nuevo usuario → Onboarding → Completa datos → Entra a app

#### Onboarding:
- [ ] **Flujo completo** funciona
  - Nombre → Ritmos → Zonas → PIN → Completa

#### Perfiles:
- [ ] **Ver perfil de usuario** funciona
  - `/app/profile` muestra tu perfil
- [ ] **Editar perfil** funciona
  - Cambiar nombre → Guardar → Se actualiza

#### Subida de archivos:
- [ ] **Subir avatar** funciona
  - Click en avatar → Seleccionar imagen → Sube correctamente
- [ ] **Ver imagen subida** funciona
  - La imagen se ve en el perfil

#### Navegación:
- [ ] **Explore** funciona (`/explore`)
- [ ] **Eventos** se muestran
- [ ] **Challenges** se muestran (`/challenges`)
- [ ] **Trending** se muestra (`/trending`)

#### RSVP:
- [ ] **Marcar interés en evento** funciona
  - Click en "Me interesa" → Contador aumenta

#### Consola del navegador:
- [ ] **No hay errores críticos** en la consola (F12)
  - Algunos warnings están OK
  - Errores rojos = problema

---

## 🐛 PASO 6: TROUBLESHOOTING

### Problema: "Failed to fetch" o errores de conexión

**Causa:** Variables de entorno incorrectas

**Solución:**
1. Ve a Vercel → Settings → Environment Variables
2. Verifica que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` sean correctos
3. **Redeploy** después de cambiar variables

### Problema: "Bucket not found" al subir imágenes

**Causa:** Buckets no creados en producción

**Solución:**
```sql
-- Ejecuta en Supabase Producción
CREAR_BUCKETS_PROD.sql
SETUP_STORAGE_POLICIES_PROD.sql
```

### Problema: "RLS policy violation"

**Causa:** Políticas RLS no configuradas

**Solución:**
```sql
-- Verifica políticas
SELECT tablename, COUNT(*) 
FROM pg_policies 
GROUP BY tablename 
ORDER BY tablename;
```

### Problema: Onboarding loop (se queda en onboarding)

**Causa:** `onboarding_completed` no se actualiza

**Solución:**
```sql
-- Marca tu usuario como completado
UPDATE public.profiles_user
SET onboarding_completed = true
WHERE user_id = 'TU_USER_ID';
```

### Problema: Imágenes no se ven (404)

**Causa:** Rutas de storage incorrectas

**Solución:**
1. Verifica que el bucket sea público
2. URL correcta: `https://[proyecto].supabase.co/storage/v1/object/public/media/...`

---

## 📊 PASO 7: MONITOREO POST-DEPLOY

### 7.1 Logs de Vercel

Ve a: **Vercel Dashboard** → Tu proyecto → **Logs**

Monitorea por errores en:
- **Functions** - Errores de servidor
- **Edge** - Errores de routing

### 7.2 Logs de Supabase

Ve a: **Supabase Dashboard** → **Logs** → **API**

Monitorea por:
- Errores de RLS
- Queries lentas
- Errores de autenticación

### 7.3 Analytics (opcional)

Ve a: **Vercel Dashboard** → **Analytics**

Revisa:
- Tiempo de carga
- Errores 4xx/5xx
- Tráfico

---

## 🔄 PASO 8: ROLLBACK (Si algo sale mal)

### Si necesitas volver atrás:

1. Ve a: **Vercel Dashboard** → **Deployments**
2. Encuentra el deployment anterior que funcionaba
3. Click en **3 puntos** → **Promote to Production**
4. Confirma

Esto revierte el frontend al estado anterior en ~30 segundos.

**Nota:** La base de datos NO se revierte automáticamente. Si hiciste cambios en la DB, tendrías que revertirlos manualmente.

---

## ✅ CHECKLIST FINAL

- [ ] Variables de entorno configuradas en Vercel
- [ ] Código pusheado a main
- [ ] Deploy completado exitosamente
- [ ] URL de producción funciona
- [ ] Login/Registro funciona
- [ ] Onboarding funciona
- [ ] Subir imágenes funciona
- [ ] Navegación funciona
- [ ] No hay errores críticos en consola
- [ ] Logs de Vercel sin errores críticos
- [ ] Logs de Supabase sin errores críticos

---

## 🎉 ¡PRODUCCIÓN LISTA!

Si completaste todos los pasos y las pruebas pasan, **¡tu app está en producción!**

### Próximos pasos:
1. **Monitorea** por 24-48 horas
2. **Documenta** cualquier issue
3. **Haz backup** regular de la DB
4. **Actualiza** staging con cambios de producción

---

## 📞 COMANDOS ÚTILES

```bash
# Ver logs en tiempo real (Vercel CLI)
vercel logs --follow

# Ver último deployment
vercel ls

# Ver info del proyecto
vercel inspect

# Revertir a deployment anterior
vercel rollback [deployment-url]
```

---

**¿Listo para el deploy?** 🚀

Empieza por el **PASO 1** y avanza paso a paso. ¡Suerte! 🍀

