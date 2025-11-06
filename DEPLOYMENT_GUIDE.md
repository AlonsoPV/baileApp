# 🚀 Guía de Deployment a Producción

Esta guía describe el proceso completo para llevar código desde desarrollo hasta producción de manera segura.

---

## 📋 **Índice**
1. [Flujo de Trabajo (Git Flow)](#1-flujo-de-trabajo-git-flow)
2. [Pre-deployment Checklist](#2-pre-deployment-checklist)
3. [Proceso Paso a Paso](#3-proceso-paso-a-paso)
4. [Rollback en Caso de Errores](#4-rollback-en-caso-de-errores)
5. [Post-deployment Monitoring](#5-post-deployment-monitoring)
6. [Hotfixes de Emergencia](#6-hotfixes-de-emergencia)

---

## **1. Flujo de Trabajo (Git Flow)**

### **Estructura de Branches:**

```
main (producción)
  ↑
staging (pre-producción)
  ↑
develop (desarrollo)
  ↑
feature/*, fix/*, hotfix/*
```

### **Ambiente por Branch:**

| Branch | Ambiente | URL | Deploy Automático | Propósito |
|--------|----------|-----|-------------------|-----------|
| `feature/*` | Local | localhost:3000 | ❌ No | Desarrollo de features |
| `develop` | Development | dev.baileapp.com | ✅ Sí | Integración continua |
| `staging` | Staging | staging.baileapp.com | ✅ Sí | QA y testing |
| `main` | Production | baileapp.com | ✅ Sí | Producción (usuarios reales) |

---

## **2. Pre-deployment Checklist**

Antes de hacer deploy a producción, verifica:

### **✅ Código:**
- [ ] Todas las features están completas y testeadas
- [ ] No hay `console.log()` o código de debug innecesario
- [ ] No hay comentarios `TODO:` o `FIXME:` críticos
- [ ] Código revisado por al menos 1 persona (code review)
- [ ] Build pasa sin errores: `npm run build`
- [ ] Linter pasa sin errores: `npm run lint`
- [ ] Tests unitarios pasan (si existen): `npm run test`

### **✅ Base de Datos:**
- [ ] Migraciones SQL testeadas en staging
- [ ] Backups de producción creados (antes de migrar)
- [ ] Migraciones son reversibles (tienen rollback)
- [ ] RLS policies probadas en staging
- [ ] No hay queries destructivas (`DROP TABLE`, `DELETE FROM` sin `WHERE`)

### **✅ QA:**
- [ ] QA completo ejecutado en staging (ver `QA_TESTING_GUIDE.md`)
- [ ] Pruebas en mobile (iOS y Android)
- [ ] Pruebas en diferentes navegadores (Chrome, Safari, Firefox)
- [ ] Performance aceptable (Lighthouse score > 80)
- [ ] No hay errores en consola del navegador

### **✅ Configuración:**
- [ ] Variables de entorno de producción actualizadas en Vercel/Netlify
- [ ] Credenciales de OAuth configuradas para producción
- [ ] Storage policies actualizadas en Supabase producción
- [ ] Rate limits configurados correctamente
- [ ] Analytics y monitoring habilitados (Sentry, etc.)

### **✅ Comunicación:**
- [ ] Equipo notificado del deploy (Slack, Discord, etc.)
- [ ] Ventana de mantenimiento comunicada (si aplica)
- [ ] Changelog preparado (lista de cambios para usuarios)

---

## **3. Proceso Paso a Paso**

### **Paso 1: Desarrollo Local (Feature Branch)**

```bash
# 1. Crear branch desde develop
git checkout develop
git pull origin develop
git checkout -b feature/nueva-funcionalidad

# 2. Desarrollar feature
# ... hacer cambios ...

# 3. Commit
git add .
git commit -m "feat: descripción de la feature"

# 4. Push a remoto
git push origin feature/nueva-funcionalidad
```

---

### **Paso 2: Merge a Develop (Integración)**

```bash
# 1. Actualizar develop
git checkout develop
git pull origin develop

# 2. Merge feature
git merge feature/nueva-funcionalidad

# 3. Resolver conflictos (si existen)
# ... editar archivos ...
git add .
git commit -m "merge: feature/nueva-funcionalidad into develop"

# 4. Push
git push origin develop

# Deploy automático a dev.baileapp.com (si configurado)
```

---

### **Paso 3: Merge a Staging (Pre-producción)**

```bash
# 1. Actualizar staging
git checkout staging
git pull origin staging

# 2. Merge desde develop
git merge develop

# 3. Resolver conflictos (si existen)
git add .
git commit -m "merge: develop into staging"

# 4. Push
git push origin staging

# ✅ Deploy automático a staging.baileapp.com
```

**🧪 Ejecutar QA en Staging:**
- Seguir `QA_TESTING_GUIDE.md`
- Reportar bugs y arreglarlos en `staging`
- Re-testear hasta que todo funcione

---

### **Paso 4: Migraciones de Base de Datos (Staging → Producción)**

⚠️ **IMPORTANTE:** Ejecuta migraciones ANTES de hacer deploy del código.

#### **4.1: Backup de Producción**

```bash
# Conectar a Supabase CLI (producción)
supabase link --project-ref your-prod-project-ref

# Crear backup
supabase db dump -f backup-$(date +%Y%m%d-%H%M%S).sql

# Verificar backup
ls -lh backup-*.sql
```

#### **4.2: Ejecutar Migraciones en Producción**

**Opción A: Supabase CLI**
```bash
# Aplicar migraciones pendientes
supabase db push

# O aplicar migración específica
supabase migration up --local
```

**Opción B: SQL Editor (Manual)**
```sql
-- 1. Ir a Supabase Dashboard > SQL Editor
-- 2. Copiar contenido de supabase/migrations/2025xxxx_nueva_feature.sql
-- 3. Ejecutar en producción
-- 4. Verificar que no haya errores
```

#### **4.3: Verificar Migraciones**

```sql
-- Verificar que tablas/columnas existen
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Verificar RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Verificar funciones
SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';
```

---

### **Paso 5: Deploy a Producción (main)**

```bash
# 1. Actualizar main
git checkout main
git pull origin main

# 2. Merge desde staging (NO desde develop directo)
git merge staging

# 3. Tag de versión (semver)
git tag -a v1.2.0 -m "Release v1.2.0: Descripción de cambios"

# 4. Push main y tags
git push origin main
git push origin --tags

# ✅ Deploy automático a baileapp.com
```

---

### **Paso 6: Verificar Deploy en Producción**

#### **6.1: Monitoreo Inmediato (primeros 5 min)**

- [ ] **Vercel/Netlify Dashboard:**
  - Build exitoso (sin errores)
  - Deploy completado (status: Ready)

- [ ] **Abrir app en producción:**
  - [ ] Homepage carga correctamente
  - [ ] Login funciona
  - [ ] Navegación principal funciona
  - [ ] No hay errores en consola del navegador

- [ ] **Supabase Dashboard:**
  - [ ] No hay picos de errores en Logs
  - [ ] Queries ejecutándose normalmente
  - [ ] Storage accesible

#### **6.2: Smoke Tests (primeros 15 min)**

Ejecutar pruebas básicas:

```bash
# Usando curl o Postman
curl https://baileapp.com/api/health
# Esperado: { "status": "ok" }

# O ejecutar subset de QA_TESTING_GUIDE.md:
# - Login
# - Ver perfil
# - Ver explore
# - Crear contenido básico
```

#### **6.3: Monitoring Continuo (primera hora)**

- [ ] **Sentry/Error Tracking:**
  - No hay errores nuevos críticos
  - No hay aumento dramático en errores

- [ ] **Analytics:**
  - Usuarios pueden navegar normalmente
  - No hay caída en engagement

- [ ] **Performance:**
  - Tiempos de carga similares o mejores
  - No hay memory leaks

---

## **4. Rollback en Caso de Errores**

Si algo sale mal en producción, actúa rápido:

### **Opción A: Rollback de Código (Vercel/Netlify)**

#### **Vercel:**
```bash
# 1. Dashboard > Deployments
# 2. Encontrar último deploy exitoso (anterior)
# 3. Click en "..." > "Promote to Production"
# 4. Confirmar
# ✅ Rollback inmediato (< 1 min)
```

#### **Netlify:**
```bash
# 1. Dashboard > Deploys
# 2. Click en deploy anterior exitoso
# 3. Click "Publish deploy"
# ✅ Rollback inmediato
```

#### **Git Rollback (alternativa):**
```bash
# Revertir último commit
git revert HEAD

# O revertir a commit específico
git revert abc123

# Push
git push origin main
# Deploy automático con código anterior
```

---

### **Opción B: Rollback de Base de Datos**

⚠️ **PELIGROSO:** Solo si la migración causó problemas críticos.

```bash
# 1. Restaurar desde backup
supabase db dump --local -f rollback.sql

# 2. Conectar a producción
psql -h db.xxxxx.supabase.co -U postgres -d postgres

# 3. Restaurar
\i backup-20250115-143000.sql

# 4. Verificar
SELECT COUNT(*) FROM profiles_user;
```

---

### **Opción C: Hotfix Inmediato**

Si el bug es pequeño y rápido de arreglar:

```bash
# 1. Crear hotfix branch desde main
git checkout main
git checkout -b hotfix/bug-critico

# 2. Arreglar bug
# ... editar archivos ...

# 3. Commit y push
git add .
git commit -m "hotfix: descripción del fix"
git push origin hotfix/bug-critico

# 4. Merge directo a main (sin pasar por staging)
git checkout main
git merge hotfix/bug-critico
git push origin main

# 5. Deploy automático

# 6. Backport a staging y develop
git checkout staging
git merge hotfix/bug-critico
git push origin staging

git checkout develop
git merge hotfix/bug-critico
git push origin develop
```

---

## **5. Post-deployment Monitoring**

### **Primeras 24 horas:**

- [ ] **Hora 1:** Verificar errores críticos (cada 15 min)
- [ ] **Hora 6:** Revisar analytics y comportamiento de usuarios
- [ ] **Hora 24:** Confirmar que todo está estable

### **Herramientas de Monitoring:**

#### **Sentry (Error Tracking):**
```javascript
// Ya configurado en tu app
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_APP_ENV, // "production"
});
```

Dashboard: https://sentry.io/organizations/tu-org/

#### **Vercel Analytics:**
- Dashboard > Analytics
- Revisar:
  - Page views
  - Unique visitors
  - Errors
  - Performance (Web Vitals)

#### **Supabase Logs:**
- Dashboard > Logs
- Filtrar por:
  - Error logs
  - Slow queries (> 1s)
  - Auth failures

#### **Google Analytics / Mixpanel:**
- Verificar flujos de usuarios
- Comparar con semanas anteriores
- Buscar caídas anormales

---

## **6. Hotfixes de Emergencia**

### **¿Cuándo hacer hotfix?**

✅ **SÍ:**
- Bug que impide login
- Error que rompe funcionalidad principal
- Vulnerabilidad de seguridad
- Pérdida de datos

❌ **NO:**
- Bug visual menor
- Feature request
- Optimización no crítica

### **Proceso de Hotfix:**

```bash
# 1. Crear branch desde main
git checkout main
git pull origin main
git checkout -b hotfix/nombre-del-fix

# 2. Fix rápido y commit
# ... arreglar bug ...
git add .
git commit -m "hotfix: descripción clara"

# 3. Testing local mínimo
npm run build
npm run preview
# Verificar que fix funciona

# 4. Push y merge a main
git push origin hotfix/nombre-del-fix
git checkout main
git merge hotfix/nombre-del-fix
git push origin main

# 5. Tag de versión patch
git tag -a v1.2.1 -m "Hotfix: descripción"
git push origin --tags

# 6. Backport a staging y develop
git checkout staging
git merge hotfix/nombre-del-fix
git push origin staging

git checkout develop
git merge hotfix/nombre-del-fix
git push origin develop

# 7. Notificar al equipo
# Slack/Discord: "🔥 Hotfix deployed: [descripción]"
```

---

## **7. Changelog y Comunicación**

### **Crear CHANGELOG.md:**

```markdown
# Changelog

## [v1.2.0] - 2025-01-15

### 🎉 Nuevas Features
- **Trending System:** Sistema de votación con listas y leaderboard
- **Challenges:** Solo usuarios loggeados pueden subir videos
- **RSVP:** Confirmación de asistencia a eventos

### 🐛 Bug Fixes
- Corregido avatar que no se mostraba en perfiles públicos
- Filtrado de usuarios sin onboarding completo en Explore
- Rutas públicas ahora funcionan correctamente sin login

### 🔧 Mejoras
- Diseño responsive mejorado en mobile
- Performance optimizado en carga de imágenes
- Chips de ritmos con diseño moderno consistente

### 🔐 Seguridad
- RLS policies actualizadas para Trending
- Validación de uploads mejorada

### 📚 Documentación
- Guía de QA completa
- Documentación de staging
- Guía de deployment
```

### **Comunicar a Usuarios (si aplica):**

**Email/Push Notification:**
```
🎉 Nuevas funcionalidades disponibles!

Hola bailarín/a,

Acabamos de lanzar nuevas features:
- 📈 Trending: vota por tus bailarines favoritos
- 🏆 Challenges: sube videos y compite
- 📅 RSVP: confirma tu asistencia a eventos

¡Explóralas ahora en la app!

Equipo Baile App
```

**Social Media:**
```
🚀 ¡Actualización disponible!

Nuevas features:
✨ Sistema de Trending
✨ Challenges con videos
✨ RSVP para eventos

Actualiza la app y descúbrelas 👇
[Link]
```

---

## **8. Resumen: Flujo Completo**

```
┌─────────────────────────────────────────────────────┐
│ 1. DESARROLLO                                       │
│ feature/* → develop → staging                       │
│ Testing local + QA en staging                       │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 2. PRE-DEPLOYMENT                                   │
│ ✅ Checklist completo                               │
│ ✅ Backup de BD                                     │
│ ✅ Migraciones en staging testeadas                 │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 3. DEPLOYMENT                                       │
│ • Ejecutar migraciones en producción               │
│ • Merge staging → main                              │
│ • Tag versión                                       │
│ • Push y deploy automático                          │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 4. VERIFICACIÓN                                     │
│ • Smoke tests (5 min)                               │
│ • Monitoring (1 hora)                               │
│ • Rollback si hay problemas críticos               │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 5. POST-DEPLOYMENT                                  │
│ • Monitoring continuo (24h)                         │
│ • Changelog                                         │
│ • Comunicar a usuarios                              │
└─────────────────────────────────────────────────────┘
```

---

## **9. Scripts Útiles**

Agrega estos scripts a tu proyecto:

### **`deploy.sh` (script de deployment):**

```bash
#!/bin/bash
# deploy.sh - Script para deployment a producción

set -e # Exit on error

echo "🚀 Starting deployment to production..."

# 1. Verificar que estamos en staging
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "staging" ]; then
  echo "❌ Error: Debes estar en branch 'staging'"
  exit 1
fi

# 2. Pull latest
echo "📥 Pulling latest changes..."
git pull origin staging

# 3. Run tests
echo "🧪 Running tests..."
npm run test || { echo "❌ Tests failed"; exit 1; }

# 4. Build
echo "🔨 Building..."
npm run build || { echo "❌ Build failed"; exit 1; }

# 5. Confirmar deploy
read -p "🚦 Ready to deploy to PRODUCTION. Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Deployment cancelled"
  exit 1
fi

# 6. Merge a main
echo "🔀 Merging to main..."
git checkout main
git pull origin main
git merge staging --no-ff -m "deploy: merge staging to main"

# 7. Tag versión
read -p "📦 Version tag (e.g., v1.2.0): " VERSION
git tag -a "$VERSION" -m "Release $VERSION"

# 8. Push
echo "⬆️ Pushing to main..."
git push origin main
git push origin --tags

# 9. Volver a staging
git checkout staging

echo "✅ Deployment completed successfully!"
echo "🔗 Check: https://baileapp.com"
echo "📊 Monitor: https://vercel.com/your-team/baileapp"
```

**Uso:**
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## **10. Troubleshooting Común**

### **Build falla en Vercel:**
```bash
# Local: Verificar que build pasa
npm run build

# Si pasa local pero falla en Vercel:
# 1. Vercel Dashboard > Settings > Environment Variables
# 2. Verificar que todas las VITE_* están configuradas
# 3. Redeploy
```

### **Migraciones fallan:**
```bash
# 1. Verificar sintaxis SQL
psql -f supabase/migrations/2025xxxx_nueva.sql

# 2. Ejecutar paso a paso en SQL Editor
# 3. Si falla, hacer rollback:
DROP TABLE IF EXISTS nueva_tabla;
```

### **OAuth no funciona después de deploy:**
```bash
# Verificar redirect URIs en provider:
# Google: https://console.cloud.google.com
# Facebook: https://developers.facebook.com

# Debe incluir:
# https://your-prod-project.supabase.co/auth/v1/callback
# https://baileapp.com/auth/callback
```

### **Images/Videos no cargan:**
```bash
# Verificar Storage policies en Supabase:
SELECT * FROM storage.policies WHERE bucket_id = 'media';

# Verificar que bucket es público:
UPDATE storage.buckets SET public = true WHERE name = 'media';
```

---

**Última actualización:** 2025-01-XX  
**Responsable de Deploy:** [Tu nombre]  
**Versión actual en producción:** [v1.x.x]

