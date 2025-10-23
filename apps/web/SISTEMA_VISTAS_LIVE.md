# Sistema de Vistas Live (Públicas)

## 📋 Resumen

Se ha implementado un sistema completo de vistas "live" que permite a usuarios con rol "usuario" ver contenido aprobado y publicado sin necesidad de permisos de organizador.

## 🎯 Objetivo

Permitir que todos los usuarios autenticados puedan:
- Ver organizadores aprobados
- Ver eventos publicados de organizadores aprobados
- Los dueños siempre pueden ver su contenido (aprobado o no)
- Solo los dueños ven botones de edición

## 📁 Archivos Creados/Modificados

### 1. Script SQL
**`SCRIPT_16_VISTAS_LIVE.sql`**
- Políticas RLS para lectura pública de organizadores y eventos
- Vistas `organizers_live` y `events_live`
- Índices para optimización de consultas
- Permisos de lectura para usuarios autenticados

### 2. Hooks de React
**`src/hooks/useLive.ts`**
Hooks para consumir vistas live:
- `useOrganizersLive(params?)` - Lista de organizadores aprobados
- `useOrganizerLiveById(id)` - Organizador específico
- `useEventsLive(params?)` - Lista de eventos publicados
- `useEventLiveById(id)` - Evento específico
- `useEventsByOrganizerLive(organizerId)` - Eventos de un organizador
- `useUpcomingEventsLive(limit)` - Próximos eventos
- `useFeaturedEventsLive(limit)` - Eventos destacados

Todos exportados desde `src/hooks/index.ts`

### 3. Utilidades de Acceso
**`src/lib/access.ts`**
Funciones para control de permisos:
- `canEditOrganizer(row, userId)` - ¿Puede editar organizador?
- `canEditEventDate(row, userId)` - ¿Puede editar evento?
- `canEditEvent(row, userId)` - Alias de canEditEventDate
- `canEditUserProfile(row, userId)` - ¿Puede editar perfil?
- `isOrganizerOwner(organizerUserId, userId)` - ¿Es dueño del organizador?
- `isProfileOwner(profileUserId, userId)` - ¿Es dueño del perfil?
- `isAdmin(userRoles)` - ¿Es administrador?
- `isOrganizer(userRoles)` - ¿Es organizador?
- `hasRole(userRoles, role)` - ¿Tiene rol específico?
- `isOwner(resourceUserId, userId)` - Verificación genérica de propiedad
- `canAdminister(resourceUserId, userId, userRoles)` - ¿Puede administrar?

### 4. Pantallas Actualizadas

**`src/screens/events/EventPublicScreen.tsx`**
- Usa `useEventLiveById` en lugar de `useEventFullByDateId`
- Usa `canEditEventDate` para mostrar/ocultar botón "Editar"
- Muestra link al perfil del organizador
- Mensajes mejorados cuando evento no está disponible

**`src/screens/events/OrganizerPublicScreen.tsx`**
- Usa `useOrganizerLiveById` en lugar de `useOrganizerPublic`
- Usa `useEventsByOrganizerLive` para listar eventos
- Usa `canEditOrganizer` para mostrar/ocultar botón "Editar"
- Muestra eventos como cards con información completa (fecha, hora, lugar)
- Mensajes mejorados cuando organizador no está disponible

**`src/hooks/useExploreQuery.ts`**
- Usa vista `events_live` en lugar de `events_date`
- Usa vista `organizers_live` en lugar de `profiles_organizer`
- Filtra correctamente por `evento_estilos` (campo de la vista)
- Comentarios explicativos sobre por qué no se necesitan filtros adicionales

## 🔐 Políticas de Seguridad (RLS)

### Organizadores
```sql
estado_aprobacion = 'aprobado' OR user_id = auth.uid()
```
✅ Todos ven los aprobados
✅ Dueño siempre ve el suyo

### Eventos Padre
```sql
estado_aprobacion = 'aprobado' OR [es dueño del organizador]
```
✅ Todos ven los aprobados
✅ Dueño siempre ve los suyos

### Fechas de Evento
```sql
estado_publicacion = 'publicado' OR [es dueño del organizador]
```
✅ Todos ven las publicadas
✅ Dueño siempre ve las suyas

## 📊 Vistas SQL

### `organizers_live`
Campos:
- `id`, `user_id`, `nombre_publico`, `bio`, `media`
- `created_at`, `updated_at`

Filtro: `estado_aprobacion = 'aprobado'`

### `events_live`
Campos del evento (events_date):
- `id`, `parent_id`, `fecha`, `hora_inicio`, `hora_fin`
- `lugar`, `direccion`, `ciudad`, `zona`
- `latitud`, `longitud`, `aforo_*`
- `estado_publicacion`, `media`

Campos del evento padre (events_parent):
- `evento_nombre` (nombre)
- `evento_descripcion` (descripcion)
- `evento_estilos` (estilos)
- `sede_general`, `requisitos`

Campos del organizador (profiles_organizer):
- `organizador_nombre` (nombre_publico)
- `organizador_id` (id)
- `organizador_user_id` (user_id)
- `organizador_media` (media)

Filtros: 
- `estado_publicacion = 'publicado'`
- `parent.estado_aprobacion = 'aprobado'`
- `organizer.estado_aprobacion = 'aprobado'`

## 🚀 Instrucciones de Despliegue

### 1. Ejecutar Script SQL
```bash
# En Supabase SQL Editor:
1. Abrir SCRIPT_16_VISTAS_LIVE.sql
2. Ejecutar todo el script
3. Verificar que las vistas se crearon correctamente
```

### 2. Verificación
```sql
-- Debe devolver resultados
SELECT count(*) FROM organizers_live;
SELECT count(*) FROM events_live;

-- Ver ejemplos
SELECT * FROM organizers_live LIMIT 3;
SELECT * FROM events_live LIMIT 3;
```

### 3. Deploy del Frontend
El código frontend ya está actualizado y listo para usar las nuevas vistas.

## ✅ Checklist de Implementación

- [x] Script SQL con políticas RLS
- [x] Vistas `organizers_live` y `events_live`
- [x] Índices para optimización
- [x] Hooks `useLive.ts` con todos los métodos
- [x] Utilidades `access.ts` para permisos
- [x] Actualizar `EventPublicScreen`
- [x] Actualizar `OrganizerPublicScreen`
- [x] Actualizar `useExploreQuery`
- [x] Exportar hooks desde `index.ts`
- [ ] Ejecutar SCRIPT_16 en Supabase
- [ ] Verificar funcionamiento en local
- [ ] Deploy a producción

## 🎨 Cambios Visuales

### EventPublicScreen
- Botón "✏️ Editar" aparece solo si `canEdit === true`
- Link al perfil del organizador
- Mensaje claro cuando evento no está disponible

### OrganizerPublicScreen
- Botón "✏️ Editar" aparece solo si `canEdit === true`
- Lista de eventos muestra fechas completas (no eventos padre)
- Cards de eventos con más información (fecha, hora, lugar, ciudad)
- Mensaje claro cuando organizador no está disponible

### ExploreHomeScreen / ExploreListScreen
- Automáticamente usa vistas live
- Solo muestra contenido aprobado/publicado
- Misma interfaz, datos filtrados correctamente

## 🔧 Mantenimiento

### Agregar nuevos campos a las vistas
```sql
-- Ejemplo: agregar campo "telefono" a organizers_live
DROP VIEW IF EXISTS public.organizers_live CASCADE;
CREATE VIEW public.organizers_live AS
SELECT
  o.id,
  o.user_id,
  o.nombre_publico,
  o.bio,
  o.media,
  o.telefono, -- NUEVO CAMPO
  o.created_at,
  o.updated_at
FROM public.profiles_organizer o
WHERE o.estado_aprobacion = 'aprobado';

-- No olvides actualizar el tipo EventLive en useLive.ts
```

### Debugging
```sql
-- Ver qué ve un usuario específico
SET request.jwt.claims = '{"sub": "user-id-aqui"}';
SELECT * FROM events_live;
SELECT * FROM organizers_live;
```

## 🆘 Troubleshooting

### Error: "permission denied for view events_live"
**Solución:** Ejecutar grants del SCRIPT_16:
```sql
GRANT SELECT ON public.events_live TO authenticated;
GRANT SELECT ON public.organizers_live TO authenticated;
```

### Error: "column evento_estilos does not exist"
**Solución:** La vista no se creó correctamente. Re-ejecutar SCRIPT_16.

### Error: "No se muestran eventos aunque existen"
**Solución:** Verificar que:
1. El evento tiene `estado_publicacion = 'publicado'`
2. El evento padre tiene `estado_aprobacion = 'aprobado'`
3. El organizador tiene `estado_aprobacion = 'aprobado'`

```sql
-- Query de diagnóstico
SELECT 
  d.id,
  d.estado_publicacion,
  p.estado_aprobacion as parent_aprobacion,
  o.estado_aprobacion as org_aprobacion
FROM events_date d
JOIN events_parent p ON p.id = d.parent_id
JOIN profiles_organizer o ON o.id = p.organizer_id
WHERE d.id = [EVENT_ID];
```

## 📚 Referencias

- [Supabase RLS Docs](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Views](https://www.postgresql.org/docs/current/sql-createview.html)
- [React Query](https://tanstack.com/query/latest/docs/react/overview)

## 🎉 Beneficios

1. **Seguridad**: RLS asegura que solo se vea contenido apropiado
2. **Performance**: Vistas optimizadas con índices
3. **UX**: Usuarios ven contenido relevante sin restricciones innecesarias
4. **Mantenibilidad**: Lógica de negocio centralizada en la base de datos
5. **Escalabilidad**: Las vistas se actualizan automáticamente

---

**Fecha de implementación:** 2025-10-22
**Versión:** 1.0.0
**Autor:** Sistema de Vistas Live - BaileApp

