# Performance Audit

Fecha: 2026-04-12
Entorno: auditoría estática del repo local + `vite build` + `vite preview` + Lighthouse mobile headless local

## Resumen ejecutivo
| Métrica | Valor actual | Objetivo |
|---|---|---|
| LCP | N/D en headless (`NO_LCP`) | < 2.5s |
| INP/FID | N/D en headless | < 200ms |
| CLS | 0.005 | < 0.1 |
| TBT | N/D en headless | < 200ms |
| Speed Index | 4.34s | < 3.4s |
| Bundle JS total (gzip) | 972 KB | < 300KB |
| Bundle CSS total (gzip) | 52 KB | < 100KB |
| Bundle total JS+CSS (gzip) | 1,024 KB | < 400KB |
| Requests en primeros 3s | 40 | < 20 |
| Total transferido primera carga | 1,803 KB | < 1,000KB |
| TTFB local preview | 3.5ms por `curl`, 10ms en Lighthouse | < 200ms |

## Resumen ejecutivo
- La app no está limitada por TTFB local ni por scripts síncronos en `<head>`; el problema dominante de primera carga es el peso acumulado de JS inicial y de imágenes remotas grandes.
- El `build` actual genera 1,024 KB gzip entre JS y CSS. Solo el chunk inicial `index` pesa 129.9 KB gzip y además arrastra `react-vendor`, `supabase` y `motion` en el critical path.
- Hay sobre-fetching claro en Supabase: muchas queries sin `.limit()` y muchos `select('*')`, especialmente en Explore, vistas `live`, RSVP, challenges, roles y trending.
- Hay presión de render evitable: `AuthProvider` recrea el valor del contexto en cada render, `ToastProvider` hace lo mismo, `Navbar` usa `useRenderLogger` con `useEffect` sin dependencias, y hay 776 callbacks inline detectados en `screens`.
- Los assets remotos pesan demasiado para la primera vista. En la captura headless los requests más costosos fueron imágenes remotas de Supabase: un flyer PNG de 676 KB, `icon.png` de 297 KB y otro flyer JPG de 190 KB.

## Hallazgos por categoría

### P0 — Crítico (afecta conversión directamente)
- [ ] Hallazgo: el bundle inicial está sobredimensionado para primer render (`apps/web/dist/assets/index-IR4cS3l9.js` 129.9 KB gzip, más `react-vendor` 58.7 KB, `supabase` 45.7 KB y `motion` 40.4 KB). Impacto estimado: empeora FCP/TTI en mobile y retrasa interacción inicial.
- [ ] Hallazgo: `useExploreQuery` combina paginación principal con una query auxiliar a `events_date` por `parent_id` sin `.limit()` (`apps/web/src/hooks/useExploreQuery.ts`). Impacto estimado: payload impredecible y latencia alta en Explore.
- [ ] Hallazgo: `useLive.ts` usa `select('*')` sin límite en `organizers_live`, `events_live` y variantes públicas (`apps/web/src/hooks/useLive.ts`). Impacto estimado: listados públicos lentos y costosos en red.
- [ ] Hallazgo: la primera carga dispara 40 requests en 3s y 1.8 MB transferidos; el peso dominante viene de imágenes remotas de Supabase (`icon.png`, flyers PNG/JPG). Impacto estimado: degrada LCP real en landing/explore.

### P1 — Alto (degradación visible para el usuario)
- [ ] Hallazgo: `AuthProvider` recrea el objeto `value` del contexto en cada render y expone `signUp`, `signIn`, `signOut` no memoizados (`apps/web/src/contexts/AuthProvider.tsx`). Impacto estimado: re-renders amplios de consumidores de `useAuth()`.
- [ ] Hallazgo: `ToastProvider` también recrea `value={{ showToast }}` (`apps/web/src/components/Toast.tsx`). Impacto estimado: re-render global innecesario de consumidores del contexto.
- [ ] Hallazgo: `useRenderLogger` usa `useEffect` sin array de dependencias y se invoca desde `Navbar` (`apps/web/src/hooks/useRenderLogger.ts`, `apps/web/src/components/Navbar.tsx`). Impacto estimado: trabajo adicional tras cada render.
- [ ] Hallazgo: `framer-motion` se importa en 133 archivos y genera un chunk dedicado de 40.4 KB gzip (`apps/web/package.json`, `apps/web/dist/assets/motion-BYQ0Epu6.js`). Impacto estimado: costo alto de parse/execute y main-thread en pantallas críticas.
- [ ] Hallazgo: `ClassPublicScreen` (2323 líneas) y `EventDatePublicScreen` (709 líneas) siguen como imports estáticos en router (`apps/web/src/AppRouter.tsx`). Impacto estimado: más JS en el arranque web aunque esos deep links no sean el flujo principal de landing.
- [ ] Hallazgo: `OrganizerProfileEditor`, `ExploreHomeScreenModern`, `AcademyProfileEditor`, `BrandProfileEditor` y `TeacherProfileEditor` son módulos gigantes; varios terminan en chunks de 30-76 KB gzip cuando se cargan (`apps/web/src/screens/...`). Impacto estimado: navegación lenta a pantallas pesadas.

### P2 — Medio (mejora progresiva)
- [ ] Hallazgo: hay 776 callbacks inline detectados en `screens` y varios componentes grandes sin `React.memo` (`apps/web/src/screens`, `apps/web/src/components`). Impacto estimado: más reconciliación y renders evitables.
- [ ] Hallazgo: `AppRouter.tsx` declara 62 lazy routes, pero solo existe 1 implementación real de `<Suspense>` reutilizada mediante 12 wrappers `RouteSuspense`. Impacto estimado: múltiples rutas comparten boundary y pueden bloquearse mutuamente.
- [ ] Hallazgo: existen URLs de Storage hardcodeadas fuera del helper centralizado en `apps/web/src/components/Navbar.tsx`, `apps/web/src/components/landing/LandingNav.tsx` y `apps/web/src/lib/seoConfig.ts`. Impacto estimado: inconsistencia de cache busting y optimización de imágenes.
- [ ] Hallazgo: hay `<img>` sin `loading` explícito en vistas públicas y listas (`apps/web/src/screens/events/OrganizerPublicScreen.tsx`, `apps/web/src/pages/trending/TrendingDetail.tsx`, `apps/web/src/screens/events/SocialLiveScreen.tsx`, entre otros). Impacto estimado: consumo innecesario de ancho de banda y peor LCP.
- [ ] Hallazgo: se detectó prefetch, pero es focalizado en perfil y fechas; no hay señal clara de prefetch agresivo desde landing hacia Explore (`apps/web/src/hooks/useProfilePrefetch.ts`, `apps/web/src/components/Navbar.tsx`, `apps/web/src/components/events/EventDatesSheet.tsx`). Impacto estimado: navegación frecuente sin calentamiento de datos.

### P3 — Bajo (optimización fina)
- [ ] Hallazgo: aún hay referencias a `.png`, `.jpg` y `.jpeg` en código y respuestas remotas; no se detectaron assets estáticos locales en `public/` ni `src/assets/` con esos formatos. Impacto estimado: oportunidad de migración progresiva a WebP/AVIF.
- [ ] Hallazgo: `react-icons` se usa en 11 archivos y `date-fns` en 3; no son el principal cuello de botella frente a `framer-motion` y el bundle inicial. Impacto estimado: menor.
- [ ] Hallazgo: no se detectaron imports no tree-shakeable de `lucide-react`; el uso actual parece correcto en 40 archivos. Impacto estimado: bajo riesgo actual.

## Bundle
- Tamaño total gzip: 1,024 KB
- JS total gzip: 972 KB
- CSS total gzip: 52 KB
- Chunks > 100KB gzip: `index-IR4cS3l9.js` (129.9 KB)
- Librerías duplicadas entre chunks: no apareció duplicación clara de `node_modules` en sourcemaps de producción; sí apareció una advertencia de Vite indicando que `hotjar.ts` no puede moverse a un chunk lazy porque está importado de forma estática y dinámica.

### Top 10 chunks más pesados
| Chunk | Tipo | Gzip |
|---|---|---:|
| `index-IR4cS3l9.js` | JS | 129.9 KB |
| `OrganizerProfileEditor-BLe0XwIv.js` | JS | 76.1 KB |
| `react-vendor-BtJ7QBkv.js` | JS | 58.7 KB |
| `supabase-CpRTRdvQ.js` | JS | 45.7 KB |
| `motion-BYQ0Epu6.js` | JS | 40.4 KB |
| `ExploreHomeScreenModern-sriDRK3P.js` | JS | 35.7 KB |
| `EventDateEditScreen-CZhkuIvE.js` | JS | 34.8 KB |
| `AcademyProfileEditor-B12h6Sn3.js` | JS | 33.9 KB |
| `organizerFaq-C4JS9X-3.js` | JS | 23.3 KB |
| `i18n-qcok_38R.js` | JS | 21.6 KB |

### Code splitting
- `AppRouter.tsx` tiene 62 `React.lazy(...)`.
- `AppRouter.tsx` tiene 12 usos de `RouteSuspense`, pero solo 1 implementación real de `<Suspense>` dentro del helper `RouteSuspense`.
- Imports estáticos de pantallas en router:
  - `apps/web/src/screens/classes/ClassPublicScreen.tsx` — 2323 líneas
  - `apps/web/src/screens/events/EventDatePublicScreen.tsx` — 709 líneas
  - `apps/web/src/screens/system/NotFound.tsx` — 306 líneas
  - `apps/web/src/screens/payments/StripeOnboardingSuccess.tsx` — 129 líneas
  - `apps/web/src/screens/payments/StripeOnboardingRefresh.tsx` — 90 líneas
  - `apps/web/src/screens/payments/PaymentSuccess.tsx` — 176 líneas
  - `apps/web/src/screens/payments/PaymentCanceled.tsx` — 139 líneas
- Riesgo principal: `ClassPublicScreen` y `EventDatePublicScreen` son módulos grandes que quedan fuera del split normal. Hay comentario en el router indicando que se mantuvieron estáticos por compatibilidad con WebView/deep-link.

### Librerías pesadas detectadas
| Librería | Archivos con uso detectado | Comentario |
|---|---:|---|
| `framer-motion` | 133 | Principal librería pesada a revisar; presencia transversal |
| `lucide-react` | 40 | Import granular, sin patrón `import * as` |
| `react-icons` | 11 | Uso acotado |
| `date-fns` | 3 | Uso bajo |
| `marked` | 1 | Uso puntual |
| `ics` | 1 | Uso puntual |
| `isomorphic-dompurify` | 1 | Uso puntual |

## Queries
- Queries sin límite explícito: alrededor de 50 patrones relevantes detectados
- Queries con `select('*')`: alrededor de 95 coincidencias; no todas son listas, pero la cifra sigue siendo alta
- Cadenas de waterfall más largas: 4+ pasos en métricas/compras/Explore
- `staleTime` global configurado: sí
- `gcTime` global configurado: sí

### Configuración global React Query
- `apps/web/src/lib/queryClient.ts`
- `staleTime: 60_000`
- `gcTime: 300_000`
- `refetchOnWindowFocus: false`
- `refetchOnReconnect: false`
- `refetchOnMount: false`

### Queries sin límite más relevantes
- `apps/web/src/hooks/useExploreQuery.ts` — query auxiliar a `events_date` por `parent_id`, sin `.limit()`
- `apps/web/src/hooks/useLive.ts` — `useOrganizersLive`, `useEventsLive`, `useEventsByOrganizerLive`
- `apps/web/src/hooks/useRSVP.ts` — `useEventsWithRSVPStats`
- `apps/web/src/hooks/useEvents.ts` — `useParentsByOrganizer`, `useDatesByParent`
- `apps/web/src/hooks/useChallenges.ts` — listas y submissions
- `apps/web/src/hooks/useRoles.ts` — `role_requests`
- `apps/web/src/lib/trending.ts` — listas públicas y candidates

### `select('*')` y over-fetching
- `apps/web/src/hooks/useExploreQuery.ts` usa `"*"` para `v_organizers_public`, `profiles_teacher`, `profiles_academy`, `profiles_brand`, `events_parent`, `v_user_public` cuando el tipo de Explore no es `fechas`.
- `apps/web/src/hooks/useLive.ts` usa `select('*')` en vistas públicas.
- `apps/web/src/hooks/useRSVP.ts`, `apps/web/src/hooks/useChallenges.ts`, `apps/web/src/hooks/useTags.ts`, `apps/web/src/hooks/useRoles.ts`, `apps/web/src/lib/trending.ts` mantienen `select('*')` en lecturas de lista.
- `apps/web/src/lib/eventSelects.ts` está mejor acotado que el resto:
  - `SELECT_EVENTS_CARD`: payload mínimo con `events_parent(...)`
  - `SELECT_EVENTS_DETAIL`: payload más profundo, con un join anidado de `events_parent(...)`

### Waterfalls y dependencias
- `apps/web/src/hooks/useOrganizerEventMetrics.ts` — cadena de consultas dependientes y además `staleTime: 0`, `gcTime: 0`
- `apps/web/src/hooks/useMyPurchases.ts` — varios pasos secuenciales y `select('*')`
- `apps/web/src/hooks/useExploreQuery.ts` — query principal paginada + búsquedas auxiliares + query por `parent_id`
- `apps/web/src/hooks/useProfilePrefetch.ts` — varias `prefetchQuery` dependientes según perfil
- `apps/web/src/hooks/useTeacherStudents.ts`, `apps/web/src/hooks/useAcademyMetrics.ts`, `apps/web/src/hooks/useAcademyClassMetrics.ts`, `apps/web/src/hooks/useTeacherClassMetrics.ts` — overrides agresivos de cache

### Overrides agresivos de cache
- `apps/web/src/hooks/useOrganizerEventMetrics.ts` — `staleTime: 0`, `gcTime: 0`
- `apps/web/src/hooks/useAcademyClassMetrics.ts` — `staleTime: 0`, `gcTime: 0`
- `apps/web/src/hooks/useTeacherClassMetrics.ts` — `staleTime: 0`, `gcTime: 0`
- `apps/web/src/hooks/useTeacherStudents.ts` — varios `staleTime: 0`, `gcTime: 0`
- `apps/web/src/hooks/useAcademyMetrics.ts` — `staleTime: 0`, `gcTime: 0`
- `apps/web/src/hooks/useOrganizer.ts` — `staleTime: 0`, `refetchInterval: 30000`, `refetchOnWindowFocus: true`

### Queries directas fuera de hooks dedicados
- Pantallas con `useQuery` directo:
  - `apps/web/src/screens/profile/UserPublicScreen.tsx`
  - `apps/web/src/screens/brand/BrandPublicScreen.tsx`
  - `apps/web/src/screens/profile/TeacherPublicLive.tsx`
  - `apps/web/src/screens/profile/AcademyProfileEditor.tsx`
  - `apps/web/src/screens/open/OpenEntityScreen.tsx`
  - `apps/web/src/screens/events/OrganizerPublicScreen.tsx`
- Pantallas con `supabase.from(...)` directo:
  - `apps/web/src/screens/profile/OrganizerProfileEditor.tsx`
  - `apps/web/src/screens/events/OrganizerPublicScreen.tsx`
  - `apps/web/src/screens/events/EventDateEditScreen.tsx`
  - `apps/web/src/screens/profile/BrandProfileEditor.tsx`
  - `apps/web/src/screens/events/OrganizerEventDateEditScreen.tsx`
  - `apps/web/src/screens/challenges/ChallengeDetail.tsx`
- Componentes con `supabase.from(...)` directo:
  - `apps/web/src/components/events/EventDatesSheet.tsx`
  - `apps/web/src/components/events/EventDateDrawer.tsx`
  - `apps/web/src/components/AddToCalendarWithStats.tsx`

## Re-renders
- Contextos de alto impacto: `AuthProvider`, `ToastProvider`
- Componentes > 200 líneas sin memo: muchos; ver top 10 abajo
- Callbacks inline en renders críticos: 776 detectados en `screens`

### Contextos
| Contexto | Archivo | Frecuencia probable de cambio | Riesgo |
|---|---|---|---|
| `Ctx` | `apps/web/src/contexts/AuthProvider.tsx` | media/alta | alto, porque está montado en `main.tsx` y alimenta toda la navegación autenticada |
| `ToastContext` | `apps/web/src/components/Toast.tsx` | media | medio, porque `value` se recrea |

### Top 5 componentes grandes sin `React.memo`
| Componente | Archivo | Líneas |
|---|---|---:|
| `FilterBar` | `apps/web/src/components/FilterBar.tsx` | 1912 |
| `CrearClase` | `apps/web/src/components/events/CrearClase.tsx` | 1422 |
| `CompetitionGroupDetail` | `apps/web/src/components/competitionGroups/CompetitionGroupDetail.tsx` | 1397 |
| `CompetitionGroupForm` | `apps/web/src/components/competitionGroups/CompetitionGroupForm.tsx` | 1328 |
| `ClasesLiveTabs` | `apps/web/src/components/classes/ClasesLiveTabs.tsx` | 1308 |

### Otros componentes grandes sin memo
- `apps/web/src/components/events/ScheduleEditor.tsx` — 1241 líneas
- `apps/web/src/components/AddToCalendarWithStats.tsx` — 1218 líneas
- `apps/web/src/components/organizer/UbicacionesEditor.tsx` — 1116 líneas
- `apps/web/src/components/explore/HorizontalSlider.tsx` — 1036 líneas
- `apps/web/src/components/profile/AcademyMetricsPanel.tsx` — 988 líneas

### `useEffect`
- `useEffect` detectados en `screens`: 133
- `useEffect` detectados en `hooks`: 19
- `useEffect` sin array de dependencias confirmado:
  - `apps/web/src/hooks/useRenderLogger.ts`
- Casos a revisar manualmente por complejidad/tamaño:
  - `apps/web/src/screens/explore/ExploreHomeScreenModern.tsx`
  - `apps/web/src/contexts/AuthProvider.tsx`
  - `apps/web/src/components/Navbar.tsx`

## Assets
- Imágenes sin lazy loading explícito: se detectaron varias en vistas públicas; la búsqueda lineal confirmó al menos 15 ocurrencias visibles
- Imágenes en PNG/JPG que deberían ser WebP: sí, especialmente flyers y `icon.png` servidos desde Supabase
- URLs de Storage construidas manualmente: 3 consumer files confirmados, más utilidades de normalización

### Helper central y desvíos
- Helper central:
  - `apps/web/src/utils/supabaseStoragePublicUrl.ts`
- Helpers relacionados:
  - `apps/web/src/lib/supabase.ts`
  - `apps/web/src/utils/imageOptimization.ts`
  - `apps/web/src/utils/storageUrl.ts`
- Construcción manual confirmada fuera del helper:
  - `apps/web/src/components/landing/LandingNav.tsx`
  - `apps/web/src/components/Navbar.tsx`
  - `apps/web/src/lib/seoConfig.ts`

### `<img>` sin `loading` explícito
- `apps/web/src/screens/events/OrganizerPublicScreen.tsx`
- `apps/web/src/screens/profile/OrganizerProfileLive.tsx`
- `apps/web/src/screens/brand/BrandEditorScreen.tsx`
- `apps/web/src/screens/brand/BrandPublicScreen.tsx`
- `apps/web/src/screens/profile/BrandProfileLive.tsx`
- `apps/web/src/pages/trending/TrendingDetail.tsx`
- `apps/web/src/screens/events/SocialLiveScreen.tsx`
- `apps/web/src/components/EventInviteStrip.tsx`
- `apps/web/src/components/brand/ProductsGrid.tsx`
- `apps/web/src/components/MediaGrid.tsx`
- `apps/web/src/screens/profile/teacher/components/ProfileGallery.tsx`

### `loading="eager"` confirmado
- `apps/web/src/screens/profile/UserPublicScreen.tsx`
- `apps/web/src/screens/profile/OrganizerProfileLive.tsx`
- `apps/web/src/components/Navbar.tsx`
- `apps/web/src/screens/profile/teacher/components/ProfileHero.tsx`
- `apps/web/src/screens/profile/UserProfileLive.tsx`

### Formatos no optimizados
- No se detectaron archivos estáticos `.jpg/.jpeg/.png` dentro de `apps/web/public` ni `apps/web/src/assets`.
- Sí se detectaron referencias a PNG/JPG remotos o placeholders en código:
  - `apps/web/src/components/landing/LandingNav.tsx` — `icon.png`
  - `apps/web/src/screens/app/Profile.tsx` — avatars `.png`
  - `apps/web/src/components/competitionGroups/CompetitionGroupForm.tsx` — `cover.jpg`
  - `apps/web/src/screens/profile/ProfileCard.tsx` — placeholder `.png`
  - múltiples filtros contra `/default-media.png`

## Navegación
- Lazy routes declaradas: 62
- Wrappers `RouteSuspense`: 12
- Implementación real de `<Suspense>` en router: 1
- Long tasks > 50ms en carga inicial headless: 1
- Prefetch implementado: sí, pero parcial

### Pantallas críticas y bloqueo del primer render
- `apps/web/src/screens/explore/ExploreHomeScreenModern.tsx` tiene múltiples early returns por `loading` y gates internos; no usa `useSuspenseQuery`, pero sí puede retrasar contenido visible.
- No se detectó `useSuspenseQuery` directo en `screens/explore`, `screens/home` o `pages/Landing`.
- `apps/web/src/screens/events/EventDatePublicScreen.tsx` usa `Suspense` + `useEventDateSuspense`; esto no afecta el primer render de landing, pero sí el deep link público de fecha.

### Prefetch
- Existe en:
  - `apps/web/src/hooks/useProfilePrefetch.ts`
  - `apps/web/src/components/Navbar.tsx`
  - `apps/web/src/components/events/EventDatesSheet.tsx`
- No hay evidencia fuerte de prefetch desde landing hacia Explore o de warming sistemático de las rutas de mayor probabilidad.

## Medición en el navegador

### 6.1 Lighthouse
- Ejecutado contra `vite preview` local en mobile headless
- Resultado usable:
  - CLS: 0.00539
  - Speed Index: 4341 ms
  - FCP: 4341 ms
  - TTFB: 10 ms
- Limitación:
  - Lighthouse devolvió `LanternError: NO_LCP`, así que no se obtuvo LCP/TBT/INP confiables en esta corrida headless.

### 6.2 Network tab — primera carga
- Requests en primeros 3s: 40
- Total transferido: 1,803 KB
- Requests bloqueando render en `<head>`: 0 detectados por Lighthouse
- Transfers más pesados:
  - flyer PNG remoto de Supabase: 676 KB
  - `media/icon.png` remoto: 297 KB
  - flyer JPG remoto de Supabase: 190 KB
  - `index-IR4cS3l9.js`: 127 KB aprox. transferidos

### 6.3 Performance tab — navegación entre rutas
- No ejecutado de forma interactiva en DevTools desde el IDE.
- Pendiente manual:
  - Landing → Explore
  - Explore → detalle de evento
  - detalle → volver

### 6.4 React DevTools — Profiler
- No ejecutado de forma interactiva desde el IDE.
- Pendiente manual:
  - componentes que re-renderizan > 3 veces por interacción
  - renders > 16ms
  - causas frecuentes de "why did this render"

## Qué pasa después
Con el documento completo hay cuatro categorías de trabajo, ordenadas por impacto/esfuerzo:

Impacto alto, esfuerzo bajo — atacar primero:
- Reemplazar `select('*')` por selects explícitos en Explore, `useLive`, RSVP, roles, challenges y trending.
- Revisar queries sin `.limit()` en listas públicas y auxiliares.
- Memoizar `value` de `AuthProvider` y `ToastProvider`; estabilizar callbacks expuestos por contexto.
- Agregar `loading="lazy"` a `<img>` no críticos y mover imágenes críticas a formatos más livianos.

Impacto alto, esfuerzo medio:
- Reducir el chunk inicial (`index`) y reevaluar qué debe quedar estático en `AppRouter.tsx`.
- Consolidar waterfalls de métricas/compras/Explore.
- Revisar `framer-motion` en pantallas de listing/card donde bastaría CSS transitions.

Impacto medio, esfuerzo medio:
- Memoizar componentes grandes con props estables (`FilterBar`, `ClasesLiveTabs`, `CompetitionGroup*`, `ScheduleEditor`).
- Afinar boundaries de `Suspense` por ruta o por sección.
- Añadir prefetch hacia rutas frecuentes como Explore.

Impacto bajo, esfuerzo alto — dejar para último:
- Migración progresiva de flyers PNG/JPG a WebP/AVIF.
- Optimización fina de contextos secundarios y callbacks inline.
- Revisión completa con React Profiler y Chrome Performance para transiciones específicas.

## Limitaciones de esta auditoría
- No se modificó código de la app.
- La parte interactiva de DevTools/Profiler quedó pendiente porque no es automatizable de forma confiable desde este entorno.
- Los conteos de queries y `select('*')` provienen de auditoría estática; son suficientes para priorizar, pero una revisión AST podría refinar totales exactos por hook.
