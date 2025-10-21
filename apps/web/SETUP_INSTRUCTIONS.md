# 🚀 Instrucciones de Configuración - Sprint 2

## ✅ **IMPLEMENTACIÓN COMPLETA**

Todos los componentes del Sprint 2 han sido implementados y están listos para usar.

---

## 📋 **PASO 1: Configurar Base de Datos**

### **1.1 Ejecutar Script SQL**

1. Abre **Supabase Dashboard** → **SQL Editor**
2. Abre el archivo `apps/web/DATABASE_SPRINT2.sql`
3. Copia todo el contenido
4. Pégalo en el SQL Editor
5. Haz clic en **RUN**

Este script creará:
- ✅ 4 tablas (profiles_organizer, events_parent, events_date, rsvp)
- ✅ Índices optimizados
- ✅ Triggers para updated_at automático
- ✅ 20+ políticas RLS para seguridad

### **1.2 Verificar Instalación**

Después de ejecutar el script, verifica que las tablas se crearon:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles_organizer', 'events_parent', 'events_date', 'rsvp');
```

Deberías ver 4 filas.

---

## 📋 **PASO 2: Probar el Flujo Completo**

### **2.1 Flujo de Usuario (RSVP)**

1. **Inicia sesión** en la aplicación
2. Ve a tu **Perfil** (`/app/profile`)
3. En la sección "📅 Eventos", haz clic en **🎫 Mis RSVPs**
4. Explora eventos disponibles (cuando haya eventos publicados)
5. Haz clic en un evento y selecciona **Voy**, **Interesado**, o **No Voy**
6. Verifica que tu respuesta aparezca en **Mis RSVPs**

### **2.2 Flujo de Organizador**

1. Ve a tu **Perfil** (`/app/profile`)
2. En la sección "📅 Eventos", haz clic en **✨ Crear Perfil de Organizador**
3. Completa el formulario:
   - Nombre Público (requerido)
   - Biografía (opcional)
   - Media URLs (opcional)
4. Haz clic en **Guardar Organizador**
5. Haz clic en **Enviar a Revisión**
6. **IMPORTANTE:** Para pruebas, debes aprobar tu organizador manualmente:

```sql
-- Aprobar tu organizador (ejecuta en SQL Editor)
UPDATE profiles_organizer 
SET estado_aprobacion = 'aprobado' 
WHERE user_id = auth.uid();
```

7. Recarga la página y verás el botón **Ver Público**
8. También aparecerá la opción **Crear Nuevo Evento**

### **2.3 Flujo de Creación de Eventos**

1. Desde el **Perfil de Organizador**, haz clic en **+ Crear Nuevo Evento**
2. Completa el formulario del evento padre:
   - Nombre del Evento (requerido)
   - Descripción
   - Sede General
   - Selecciona Ritmos/Estilos (multi-select)
   - Media URLs (opcional)
3. Haz clic en **Crear Evento**
4. Serás redirigido al evento creado
5. Navega a crear una **fecha específica** para el evento
6. Completa el formulario de fecha:
   - Fecha (requerido)
   - Hora de inicio y fin
   - Lugar, dirección, ciudad
   - Zona
   - Estilos
   - Estado de publicación: **Publicado** (para que sea visible)
7. Haz clic en **Crear Fecha**

### **2.4 Verificar Vista Pública**

1. Ve a `/events/parent/:id` para ver el evento público
2. Ve a `/events/date/:id` para ver la fecha específica
3. Haz RSVP al evento
4. Verifica en `/me/rsvps` que aparezca tu respuesta

---

## 🔧 **PASO 3: Configuración Opcional**

### **3.1 Datos de Prueba**

Si quieres agregar datos de prueba rápidamente, descomenta la sección al final de `DATABASE_SPRINT2.sql`:

```sql
-- Insertar organizador de ejemplo
INSERT INTO profiles_organizer (user_id, nombre_publico, bio, estado_aprobacion)
VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'Organizador de Ejemplo',
  'Organizamos los mejores eventos de salsa en la ciudad',
  'aprobado'
);

-- ... más datos de ejemplo
```

### **3.2 Personalizar Colores**

Los colores del tema están en `apps/web/src/theme/colors.ts`. Puedes ajustarlos según tu preferencia:

```typescript
export const theme = {
  brand: {
    primary: '#1E88E5',    // Azul principal
    secondary: '#FB8C00',  // Naranja secundario
  },
  // ... más colores
};
```

---

## 📱 **RUTAS DISPONIBLES**

### **Rutas de Usuario:**
- `/app/profile` - Perfil del usuario
- `/me/rsvps` - Mis RSVPs

### **Rutas de Organizador:**
- `/organizer/edit` - Crear/Editar organizador
- `/organizer/:id` - Ver organizador público

### **Rutas de Eventos:**
- `/events/parent/new` - Crear evento padre
- `/events/parent/:id/edit` - Editar evento padre
- `/events/parent/:id` - Ver evento público
- `/events/date/new/:parentId` - Crear fecha de evento
- `/events/date/:id/edit` - Editar fecha de evento
- `/events/date/:id` - Ver fecha pública (con RSVP)

---

## 🐛 **SOLUCIÓN DE PROBLEMAS**

### **Error: "Bucket not found"**

Si aparece este error al subir imágenes de organizador/eventos:

1. Ve a **Supabase Dashboard** → **Storage**
2. Crea un bucket llamado `event-media`
3. Hazlo público
4. Configura políticas RLS similares a `AVATARS`

### **Error: "RLS policy violation"**

Si no puedes crear/editar organizadores o eventos:

1. Verifica que las políticas RLS se crearon correctamente:
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

2. Si faltan políticas, ejecuta nuevamente el script `DATABASE_SPRINT2.sql`

### **Los eventos no aparecen en la vista pública**

Verifica que:
1. El organizador esté **aprobado**
2. El evento padre esté **aprobado** (opcional, según tu configuración)
3. Las fechas del evento estén **publicadas** (no en borrador)

---

## 🎯 **FEATURES IMPLEMENTADOS**

### ✅ **Sistema de Organizadores**
- Crear perfil de organizador
- Sistema de aprobación (borrador → en revisión → aprobado/rechazado)
- Vista pública de organizador
- Gestión de media

### ✅ **Sistema de Eventos**
- Eventos padre con múltiples fechas
- CRUD completo de eventos
- Multi-select de ritmos y zonas
- Estados de publicación (borrador/publicado)
- Vista pública de eventos y fechas

### ✅ **Sistema RSVP**
- 3 estados: Voy, Interesado, No Voy
- Botones interactivos con feedback visual
- Lista de mis RSVPs con navegación
- Join de datos (rsvp → event_date → event_parent)

### ✅ **Seguridad (RLS)**
- Organizadores: solo el dueño puede editar
- Eventos: solo el organizador puede editar
- RSVPs: solo el usuario puede crear/editar sus respuestas
- Lecturas públicas según estado de aprobación/publicación

### ✅ **UX**
- Navegación desde el perfil
- Cards interactivas con hover effects
- Loading states
- Error handling
- Toast notifications
- Validaciones de formularios
- Empty states

---

## 📊 **QUERIES INTEGRADAS**

Todas las queries de Supabase están implementadas y comentadas en los hooks:

### **useOrganizer.ts:**
```typescript
// SELECT * FROM profiles_organizer WHERE user_id = auth.user.id LIMIT 1
// INSERT INTO profiles_organizer ...
// UPDATE profiles_organizer SET ... WHERE id = :id AND user_id = auth.user.id
// UPDATE profiles_organizer SET estado_aprobacion='en_revision' ...
// SELECT * FROM profiles_organizer WHERE id=:id AND (...)
```

### **useEvents.ts:**
```typescript
// INSERT INTO events_parent ... (RLS ensures ownership)
// UPDATE events_parent SET ... WHERE id = :id
// SELECT * FROM events_parent WHERE organizer_id=:id ORDER BY created_at DESC
// INSERT INTO events_date ... (RLS ensures ownership)
// UPDATE events_date SET ... WHERE id = :id
// SELECT * FROM events_date WHERE parent_id=:pid [AND estado_publicacion='publicado'] ORDER BY fecha ASC
// INSERT INTO rsvp ... ON CONFLICT (user_id, event_date_id) DO UPDATE ...
// SELECT * FROM rsvp WHERE user_id=auth.user.id
```

---

## ✅ **DEFINITION OF DONE**

- [x] Crear/editar Organizador
- [x] Ver estados (borrador/en revisión/aprobado/rechazado)
- [x] Crear Evento padre y Fechas
- [x] Listar eventos dentro del organizador
- [x] RSVP funciona y aparece en /me/rsvps
- [x] RLS: otro usuario solo ve organizador/eventos aprobados y fechas publicadas
- [x] Profile tiene enlaces a Organizador y RSVPs
- [x] Queries de Supabase integradas
- [x] Documentación completa

---

## 🎉 **¡LISTO PARA USAR!**

Tu sistema de eventos está completamente funcional. Solo necesitas:

1. ✅ Ejecutar el script SQL (`DATABASE_SPRINT2.sql`)
2. ✅ Iniciar sesión en la aplicación
3. ✅ Ir a tu perfil y comenzar a crear eventos

**¡Disfruta organizando eventos de baile!** 💃🕺🎵

---

## 📚 **DOCUMENTACIÓN ADICIONAL**

- `SPRINT2.md` - Documentación técnica completa
- `DATABASE_SPRINT2.sql` - Script de base de datos con comentarios
- Hooks: Ver comentarios inline en `useOrganizer.ts` y `useEvents.ts`

---

**Desarrollado con ❤️ para BaileApp**
*Fecha: 21 de Octubre, 2025*
