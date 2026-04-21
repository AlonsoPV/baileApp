# Perfil público de academia, pantalla de clase y Explore

Este documento describe, a nivel de producto y de implementación en la app web, el **perfil público de academia**, la pantalla **`ClassPublicScreen`** (detalle de una clase dentro del cronograma de un maestro o academia) y **cómo se listan y enlazan** esas entidades en **`ExploreHomeScreenModern`**.

---

## 1. Perfil público de academia (`AcademyPublicScreen`)

**Archivo principal:** `apps/web/src/screens/academy/AcademyPublicScreen.tsx`

### 1.1 Propósito

Es la **vitrina pública** de una academia: identidad, ubicación, clases, promociones, contenido multimedia y datos de contacto. El visitante puede explorar el cronograma, abrir el detalle de una clase (flujo relacionado con `ClassPublicScreen`) y compartir el perfil.

### 1.2 Bloques funcionales (resumen)

| Área | Comportamiento |
|------|----------------|
| **Hero / cabecera** | Nombre público, tipo “academia de baile”, bio y redes (`BioSection`), chips de **ritmos** y **zonas** agrupadas. |
| **Compartir** | Usa `buildShareUrl('academia', id)` y Web Share API o portapapeles. |
| **Clases (“Nuestras clases”)** | Si hay datos en tablas de clases → **`ClasesLiveTabs`** (filtro por día, clics, WhatsApp y Stripe según datos de la academia). Si no, **fallback** a **`ClasesLive`** con `cronograma`/`horarios`, `costos` y primera ubicación. |
| **Promociones** | Lista de promos con tipo (mensualidad, paquete, clase suelta, etc.), precios formateados y copy según `promotionTypeMeta`. |
| **Grupos de competencia** | Sección condicional si existen grupos configurados. |
| **Ubicaciones** | Componente tipo “live” para mostrar sedes (`UbicacionesLive` / flujo equivalente en el archivo). |
| **FAQ** | Preguntas frecuentes desde `academy.faq`. |
| **Reseñas** | Testimonios (`reseñas`: autor, ubicación, rating, texto). |
| **Calificaciones** | `AcademyRatingComponent` enlazado al `academyId`. |
| **Maestros invitados** | Carrusel horizontal (`HorizontalSlider`) con `TeacherCard` y misma prioridad de media que el perfil de maestro (cover / p1 / fallbacks). |
| **Cuenta bancaria** | `BankAccountDisplay` si hay datos en `cuenta_bancaria`. |
| **“Un poco más de nosotros”** | Bloque largo de texto/marketing si aplica (`hasAboutSection`). |
| **Vídeo y galería** | Contenido multimedia adicional según el modelo de la academia (secciones posteriores en el mismo archivo). |

### 1.3 Datos que alimentan las clases en el perfil

- **Cronograma / horarios** y **costos** en el perfil de academia.
- **Clases desde tablas** (`classesFromTables`): cuando existen, la UI prefiere **`ClasesLiveTabs`** para una experiencia alineada con tabs por día y enlaces al detalle.
- **WhatsApp**: `whatsapp_number` y `whatsapp_message_template` (con placeholder `{nombre}`) se pasan a los componentes de clases para contacto contextual.
- **Stripe**: `stripe_account_id` y `stripe_charges_enabled` se propagan para habilitar cobro cuando el producto lo permite.

---

## 2. Pantalla pública de clase (`ClassPublicScreen`)

**Archivo:** `apps/web/src/screens/classes/ClassPublicScreen.tsx`  
**Rutas:** definidas en `apps/web/src/AppRouter.tsx`:

- `/clase` y `/clase/:type/:id` (envueltas en `NativeAwarePublicClassRoute`).
- Ruta abierta relacionada: `/open/clase/:type/:id` → `OpenEntityScreen` (entidad “clase” para vistas embebidas / compartidas).

### 2.1 Identificación del “dueño” de la clase

- **`type`**: `teacher` o `academy` (query `?type=` o segmento de ruta `:type`).
- **`id`**: identificador numérico del maestro o de la academia.

Se cargan datos con **`useTeacherPublic`** o **`useAcademyPublic`** según `type`.

### 2.2 Selección de la clase dentro del cronograma

El perfil expone un **array** `cronograma` (o `horarios`). La pantalla determina **qué ítem** mostrar así:

| Prioridad | Parámetro | Efecto |
|-----------|-----------|--------|
| 1 | `classId` o `claseId` | Busca el índice cuyo `id` coincide con el cronograma. |
| 2 | `i` o `index` | Índice numérico en el array (con validación de rango). |
| 3 | (ninguno) | Índice `0` (primera clase). |

Además, **`dia`** puede acotar el contexto cuando una misma entrada tiene varios días (coherente con enlaces desde Explore que pasan `dia`).

### 2.3 Funcionalidades principales en UI

- **SEO**: `SeoHead` con URL base y metadatos de la clase seleccionada.
- **Compartir**: `buildShareUrl` + Web Share / portapapeles.
- **Favoritos**: usuarios autenticados (`useUserFavorites`) o invitados (`useGuestFavorites`) por `(sourceType, sourceId, cronogramaIndex)` y opcionalmente `classItemId` si existe en el ítem del cronograma.
- **Pago (Stripe)**: `useCreateCheckoutSession` cuando hay precio de clase y cuenta Stripe válida en el perfil (lógica condicionada en el componente).
- **WhatsApp**: solo con número y plantilla configurados; mensaje con prefijo tipo “Hola vengo de Donde Bailar MX…” y sustitución de `{nombre}` / `{clase}`.
- **Calendario**: `AddToCalendarWithStats` para añadir la sesión recurrente o la próxima ocurrencia según utilidades de fechas (`calculateNextDateWithTime`, etc.).
- **Visual**: flyer/imagen de la clase vía **`pickClassItemFlyerUrl`**, media del perfil, mapas de ritmos con catálogo (`RITMOS_CATALOG`, normalización de slugs).
- **Navegación**: enlaces al perfil del maestro o de la academia (`AcademyCard` / `TeacherCard`, rutas del `registry`).

### 2.4 Coherencia con Explore

Los enlaces que genera Explore hacia esta pantalla suelen incluir:

- Ruta canónica tipo **`/clase/academy/123?i=2&dia=4`** (o equivalente con query en `/clase`), alineada con `ClassExploreGridCard.buildClaseHref` (`cronogramaIndex` → `i`, `diaSemana` → `dia`).

---

## 3. Explore moderno: clases y academias (`ExploreHomeScreenModern`)

**Archivo:** `apps/web/src/screens/explore/ExploreHomeScreenModern.tsx`

### 3.1 Secciones y tipos

- Identificadores de sección: `'fechas' | 'clases' | 'academias' | 'maestros' | 'usuarios' | 'organizadores' | 'marcas'`.
- Las secciones **above the fold** incluyen **`fechas`** y **`clases`**, de modo que las clases son visibles pronto en la página.

### 3.2 Datos: academias y maestros para la lista de clases

- **`useExploreQuery`** con `type: 'academias'` alimenta **`academiasData`** (paginación / infinite query).
- **`maestrosData`** se obtiene de forma análoga cuando el tipo seleccionado lo requiere.
- **Carga bajo demanda**: cuando el tipo es **`clases`**, se disparan warmups de paginación tanto para academias como para maestros (`runZoneWarmupPage` para `clases_academias` y `clases_maestros`), para que el hook de lista tenga suficientes filas.

### 3.3 Lista derivada: `useClassesList`

**Archivo:** `apps/web/src/hooks/explore/useClassesList.ts`

- **Entrada**: `academiasData`, `maestrosData`, filtros de **ritmos**, **zonas**, rango de **fechas** (`datePreset`, `dateFrom`, `dateTo`), **búsqueda** (`qDeferred`), idioma y “hoy” (`todayYmd`).
- **Proceso**: aplana el cronograma de cada dueño, resuelve cover del owner, aplica filtros por ritmo/zona/fecha, respeta **blackout** de fechas (`shouldHideExploreClassForBlackout`), y produce ítems con metadata para la UI (`ownerType`, `ownerId`, `cronogramaIndex`, `diaSemana`, etc.).

### 3.4 Cómo se muestran en la UI

- **`ClassExploreGridCard`**: tarjeta de cuadrícula / carrusel; construye el **href** hacia `/clase/:ownerType/:ownerId` con query `i` y `dia` cuando aplica (ver `buildClaseHref` en `ClassExploreGridCard.tsx`).
- **`ClaseListRow`**: variante lista para el mismo tipo de ítem.
- **CTA**: tarjetas de llamada a la acción insertadas en la sección de clases (por ejemplo `cta_classes`).
- **Academias**: la sección de academias puede cargarse de forma **lazy** con **`AcademiesSection`** para no bloquear el bundle inicial.

### 3.5 Filtros y disponibilidad

- Los filtros efectivos dependen del **tipo** seleccionado (`all`, `clases`, `academias`, etc.): `itemsForAvailableFilters` restringe qué ítems participan en `buildAvailableFilters`.
- **Ritmos y zonas** se pueden recortar cuando hay contexto de ritmo/zona para evitar opciones vacías o parpadeos (`availableRitmoIdSet`, `availableZonaIdSet`, árboles para UI de filtros).

---

## 4. Referencias rápidas de archivos

| Tema | Ruta |
|------|------|
| Perfil academia | `apps/web/src/screens/academy/AcademyPublicScreen.tsx` |
| Clase pública | `apps/web/src/screens/classes/ClassPublicScreen.tsx` |
| Explore | `apps/web/src/screens/explore/ExploreHomeScreenModern.tsx` |
| Lista clases Explore | `apps/web/src/hooks/explore/useClassesList.ts` |
| Tarjeta clase Explore | `apps/web/src/components/explore/ClassExploreGridCard.tsx` |
| Rutas app | `apps/web/src/AppRouter.tsx` |

---

*Documento generado para alinear producto y desarrollo sobre el flujo academia → clase pública → Explore.*
