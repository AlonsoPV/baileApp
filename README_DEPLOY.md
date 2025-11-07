# Deploy Checklist (Staging → Production)

## 1. Database (Supabase)
- [ ] Conéctate al proyecto **de producción** en Supabase SQL Editor.
- [ ] Ejecuta en orden:
  1. `apps/web/FIX_CHALLENGES_VIDEO_BASE.sql`
  2. `apps/web/FIX_CHALLENGES_RLS.sql`
  3. `apps/web/FIX_CHALLENGES_REQUIREMENTS.sql`
  4. `apps/web/FIX_TRENDING_RLS.sql`
- [ ] (Opcional) Diagnóstico/manual: `apps/web/DIAGNOSTICO_CHALLENGE_STATUS.sql`
- [ ] Verifica que el bucket `media` exista y sea de lectura pública.
- [ ] Asegura que tu usuario (o cuentas admin) tengan el rol `superadmin` si es necesario (`INSERT INTO public.user_roles ...`).

## 2. Variables de Entorno
- [ ] En Vercel (Project Settings → Environment Variables):
  - `SUPABASE_URL` → URL del proyecto de **producción**
  - `SUPABASE_ANON_KEY` → anon key de producción
  - Cualquier otra variable personalizada (ej. `SITE_URL`, `SUPABASE_SERVICE_ROLE` si aplica).
- [ ] (Opcional) Configura env vars de “Preview” con las credenciales de staging.
- [ ] Para desarrollo local, usa `.env.local` (producción) o `.env.staging.local` si necesitas apuntar a la instancia de staging.

## 3. Despliegue Web
- [ ] Confirma que la rama `main` contiene los últimos commits (`git push origin main`).
- [ ] En Vercel, dispara un **Production Deploy**.
- [ ] Revisa los logs del build para asegurarte de que se usan las env vars correctas.

## 4. Verificaciones Post-Deploy
- [ ] **Challenges**
  - Crear uno nuevo con portada, video base, requisitos y fechas. Confirmar visualización y edición.
  - Editar un challenge existente (ver toasts y persistencia de datos).
- [ ] **Trendings**
  - Crear y publicar un trending desde `TrendingAdmin` (confirmar toasts de éxito/error).
  - Cerrar un trending y validar que se actualiza en la lista pública.
- [ ] **RLS / Permisos**
  - Usuarios sin rol `superadmin` no deben poder crear/edit challenges/trendings.
  - Usuarios con permisos sí deben hacerlo sin errores.
- [ ] **Storage**
  - Subir portada de trending y de challenge en producción; confirmar que se ven completas.

## 5. Notas
- Los scripts SQL no son migraciones automáticas: ejecútalos manualmente en cada entorno (staging, producción).
- Documenta/guarda el orden de ejecución para futuras réplicas.
- Si manejas CI/CD, considera integrar estos scripts mediante Supabase CLI o un flujo de migraciones.

