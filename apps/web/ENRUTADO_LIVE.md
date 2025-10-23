# Sistema de Enrutado LIVE - Documentación

## 📋 Resumen

Sistema completo de navegación para vistas públicas (LIVE) que permite a todos los usuarios autenticados acceder a contenido aprobado/publicado sin restricciones de onboarding.

## 🗺️ Arquitectura de Rutas

### Rutas Públicas LIVE (Sin onboarding requerido)

| Ruta | Descripción | Componente |
|------|-------------|------------|
| `/organizer/:id` | Perfil público de organizador aprobado | `OrganizerPublicScreen` |
| `/events/date/:id` | Vista pública de evento publicado | `EventPublicScreen` |
| `/events/parent/:id` | Vista de evento padre (legacy) | `EventParentPublicScreen` |
| `/u/:userId` | Perfil público de usuario | `UserPublicProfile` |
| `/explore` | Pantalla de exploración | `ExploreHomeScreen` |
| `/explore/list` | Listado de exploración con filtros | `ExploreListScreen` |

### Rutas Protegidas (Requieren autenticación + ownership)

| Ruta | Descripción |
|------|-------------|
| `/profile/organizer/edit` | Editar perfil de organizador |
| `/profile/organizer/events/date/:id/edit` | Editar fecha de evento |
| `/events/parent/:id/edit` | Editar evento padre |
| `/profile/organizer/dashboard/:id` | Dashboard de eventos del organizador |

## 📁 Archivos Creados/Modificados

### 1. Helper de URLs - `src/lib/urls.ts`
Centraliza todas las URLs de la aplicación para evitar hardcodear rutas.

**Funciones principales:**
```typescript
// Públicas LIVE
urls.organizerLive(id)        // /organizer/:id
urls.eventDateLive(id)        // /events/date/:id
urls.eventParentLive(id)      // /events/parent/:id
urls.userLive(userId)         // /u/:userId

// Exploración
urls.exploreHome()            // /explore
urls.exploreList(type?)       // /explore/list

// Edición
urls.organizerEdit()          // /profile/organizer/edit
urls.eventDateEdit(id)        // /profile/organizer/events/date/:id/edit
```

**Uso:**
```typescript
import { urls } from '@/lib/urls';

// En componentes
<Link to={urls.eventDateLive(123)}>Ver evento</Link>
```

### 2. Componente LiveLink - `src/components/LiveLink.tsx`
Link reutilizable con estilos consistentes para vistas LIVE.

**Características:**
- Hover effects optimizados
- Estilos de card por defecto
- Variante inline para texto

**Uso:**
```typescript
import LiveLink from '@/components/LiveLink';

// Como card (default)
<LiveLink to={urls.organizerLive(123)}>
  <div>Contenido de la card</div>
</LiveLink>

// Inline
<LiveLink asCard={false} to={urls.eventDateLive(456)}>
  Ver evento
</LiveLink>
```

### 3. Componente ShareLink - `src/components/ShareLink.tsx`
Botón para copiar link público al portapapeles.

**Características:**
- Copia URL al portapapeles
- Feedback visual (✓ Copiado!)
- Fallback para navegadores antiguos
- Variante con solo icono

**Uso:**
```typescript
import ShareLink from '@/components/ShareLink';

// Botón completo
<ShareLink label="Compartir" />

// Solo icono
import { ShareLinkIcon } from '@/components/ShareLink';
<ShareLinkIcon />
```

### 4. Cards de Exploración

#### EventCard - `src/components/explore/cards/EventCard.tsx`
Card clicable para eventos en el explorador.

**Características:**
- Muestra: nombre, fecha, hora, lugar, ciudad, organizador
- Animación hover con framer-motion
- Navegación automática a `/events/date/:id`

**Datos esperados:**
```typescript
{
  id: number,              // ID del evento (events_date)
  evento_nombre?: string,  // Nombre del evento
  fecha: string,          // Fecha del evento
  hora_inicio?: string,   // Hora de inicio
  hora_fin?: string,      // Hora de fin
  lugar?: string,         // Lugar
  ciudad?: string,        // Ciudad
  direccion?: string,     // Dirección
  organizador_nombre?: string // Nombre del organizador
}
```

#### OrganizerCard - `src/components/explore/cards/OrganizerCard.tsx`
Card clicable para organizadores.

**Características:**
- Muestra: nombre, bio, fecha de registro
- Indicador "Ver perfil →"
- Navegación automática a `/organizer/:id`

**Datos esperados:**
```typescript
{
  id: number,
  nombre_publico: string,
  bio?: string,
  created_at: string
}
```

### 5. OnboardingGate Actualizado - `src/guards/OnboardingGate.tsx`

**Mejoras:**
- Lista blanca de rutas LIVE con regex
- Permite acceso sin onboarding completo
- Exclude explícitamente rutas públicas

**Rutas excluidas (LIVE_WHITELIST):**
```typescript
const LIVE_WHITELIST = [
  /^\/organizer\/\d+$/,        // /organizer/:id
  /^\/events\/date\/\d+$/,     // /events/date/:id
  /^\/events\/parent\/\d+$/,   // /events/parent/:id
  /^\/u\/[^/]+$/,              // /u/:userId
  /^\/explore\/?$/,            // /explore
  /^\/explore\/list/,          // /explore/list
];
```

### 6. Pantallas Públicas Actualizadas

**EventPublicScreen:**
- Botón "Compartir" con ShareLink
- Botón "Editar" solo para dueños
- Usa vistas LIVE

**OrganizerPublicScreen:**
- Botón "Compartir" con ShareLink
- Botón "Editar" solo para dueños
- Lista de eventos del organizador

## 🔄 Flujo de Navegación

### Desde Exploración
```
ExploreListScreen
  ↓ (clic en EventCard)
EventPublicScreen (/events/date/:id)
  ↓ (clic en organizador)
OrganizerPublicScreen (/organizer/:id)
```

### Desde Perfil de Usuario
```
UserPublicProfile (/u/:userId)
  ↓ (clic en RSVP)
EventPublicScreen (/events/date/:id)
```

### Edición (Solo Owner)
```
EventPublicScreen
  ↓ (clic en "Editar" - solo visible si canEdit)
EventDateEdit (/profile/organizer/events/date/:id/edit)
```

## 🎨 Estilos Consistentes

### Cards
- Border: `1px solid rgba(255, 255, 255, 0.1)`
- Background: `rgba(23, 23, 23, 0.6)`
- Border radius: `1rem`
- Hover: Scale 1.02, translateY -4px
- Shadow en hover: `0 4px 12px rgba(0, 0, 0, 0.3)`

### Botones
- Share: Neutral gray con icono 🔗
- Edit: Pink gradient `rgba(236, 72, 153, 0.8)`

## ⚡ Performance

### Optimizaciones
- Vistas SQL pre-filtradas (solo contenido aprobado)
- React Query para caching automático
- Links con prefetch on hover (React Router)
- Animaciones optimizadas con framer-motion

### Caching
```typescript
// Eventos en caché por 5 minutos
queryKey: ["live", "events", filters]

// Organizadores en caché por 10 minutos  
queryKey: ["live", "organizers", q]
```

## 🔐 Seguridad

### Control de Acceso
1. **RLS en Supabase**: Filtra datos a nivel de base de datos
2. **Vistas LIVE**: Solo exponen contenido aprobado
3. **Guards del Frontend**: OnboardingGate excluye rutas LIVE
4. **Botones condicionales**: `canEdit*()` controla visibilidad

### Principios
- ✅ **Ver**: Todos los usuarios autenticados
- ✅ **Editar**: Solo el dueño del recurso
- ✅ **Sin onboarding**: Rutas LIVE accesibles siempre

## 🧪 Testing

### URLs a probar
```bash
# Públicas (deben funcionar sin onboarding)
/organizer/1
/events/date/5
/u/uuid-123
/explore
/explore/list

# Protegidas (requieren ownership)
/profile/organizer/edit
/profile/organizer/events/date/5/edit
```

### Casos de uso
1. **Usuario nuevo** (sin onboarding) → Puede ver vistas LIVE
2. **Usuario completo** → Puede ver y editar su contenido
3. **Usuario sin roles** → Puede ver todo público, no puede editar
4. **Organizador** → Ve botón "Editar" solo en su contenido

## 📊 Integración con Sistema LIVE

### Flujo completo
```
1. Usuario hace login
   ↓
2. OnboardingGate verifica
   ↓ (ruta LIVE)
3. Pasa sin onboarding
   ↓
4. ExploreListScreen usa useExploreQuery
   ↓
5. useExploreQuery consulta events_live/organizers_live
   ↓
6. EventCard/OrganizerCard renderizan con LiveLink
   ↓
7. Usuario hace clic
   ↓
8. EventPublicScreen usa useEventLiveById
   ↓
9. Muestra evento + botón "Compartir"
   ↓ (si es owner)
10. Muestra botón "Editar"
```

## 🆘 Troubleshooting

### Las cards no son clicables
**Solución:** Verifica que EventCard/OrganizerCard estén usando `<LiveLink>`

### Redirige a onboarding en rutas LIVE
**Solución:** Verifica `LIVE_WHITELIST` en `OnboardingGate.tsx`

### Error 404 en navegación
**Solución:** 
1. Verifica que la ruta exista en `router.tsx`
2. Verifica que esté fuera del `<OnboardingGate>`

### Botón "Editar" no aparece
**Solución:**
1. Verifica que uses `canEditEventDate()` o `canEditOrganizer()`
2. Verifica que `user?.id` coincida con `organizador_user_id`

## 📚 Ejemplos de Código

### Crear nueva card clicable
```typescript
import LiveLink from '@/components/LiveLink';
import { urls } from '@/lib/urls';

export function MyCard({ item }) {
  return (
    <LiveLink to={urls.eventDateLive(item.id)}>
      <div className="p-4">
        <h3>{item.name}</h3>
        <p>{item.description}</p>
      </div>
    </LiveLink>
  );
}
```

### Agregar ShareLink a nueva pantalla
```typescript
import ShareLink from '@/components/ShareLink';

export function MyPublicScreen() {
  return (
    <div>
      <div className="flex justify-between">
        <h1>Título</h1>
        <ShareLink label="Compartir" />
      </div>
      {/* contenido */}
    </div>
  );
}
```

### Usar URLs helper
```typescript
import { urls } from '@/lib/urls';
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const nav = useNavigate();
  
  const handleClick = () => {
    nav(urls.eventDateLive(123));
  };
  
  return <button onClick={handleClick}>Ver evento</button>;
}
```

## ✅ Checklist de Implementación

- [x] Helper de URLs creado
- [x] LiveLink componente creado
- [x] ShareLink componente creado
- [x] EventCard actualizado con navegación
- [x] OrganizerCard actualizado con navegación
- [x] OnboardingGate excluye rutas LIVE
- [x] EventPublicScreen con ShareLink
- [x] OrganizerPublicScreen con ShareLink
- [x] Router.tsx con rutas públicas correctas
- [ ] Pruebas en navegador
- [ ] Verificar deep links en mobile
- [ ] Compartir en redes sociales

## 🎉 Beneficios

1. **UX Mejorada**: Navegación fluida sin fricciones
2. **SEO**: URLs semánticas y compartibles
3. **Mantenibilidad**: URLs centralizadas
4. **Consistencia**: Estilos uniformes en todas las cards
5. **Performance**: Optimizaciones de caching y prefetch
6. **Accesibilidad**: Rutas públicas sin barreras

---

**Fecha de implementación:** 2025-10-22  
**Versión:** 1.0.0  
**Autor:** Sistema de Enrutado LIVE - BaileApp

