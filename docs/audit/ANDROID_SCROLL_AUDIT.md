# Android Scroll Audit (WebView + RN)

## Contexto

Auditoría enfocada en la capa web (`apps/web`) donde ocurre el scroll principal dentro de WebView Android, con validación secundaria de compatibilidad en capa RN (`src/`).

## Matriz de hallazgos

| Pantalla / Componente | Causa probable | Severidad | Correccion propuesta |
| --- | --- | --- | --- |
| `apps/web/src/components/layout/AppShell.tsx` (`.app-shell-content`) | Contenedor vertical principal sensible a trabajo reactivo durante scroll largo | Alta | Mantener el contenedor como scroller unico, evitar updates no esenciales en su arbol durante scroll, revisar wrappers con `overflow` anidado |
| `apps/web/src/screens/explore/ExploreHomeScreenModern.tsx` | Props/callbacks inestables (`renderItem`, handlers, objetos inline) disparan re-renders evitables | Alta | Estabilizar handlers con `useCallback`, datos derivados con `useMemo`, y mover objetos estilo a referencias estables |
| `apps/web/src/components/explore/HorizontalSlider.tsx` | Re-renders durante scroll horizontal por `setState` frecuente y estado acoplado al render de hijos | Alta | Reducir/aislar `setState` en movimiento, desacoplar estado de navegacion, memoizar hijos pesados para no refrescar todo el slider |
| `apps/web/src/components/explore/HorizontalCarousel.tsx` | Competencia de gestos horizontal/vertical en Android puede capturar touch de forma agresiva | Media | Ajustar coexistencia de gestos (`pan-y`, thresholds), evitar wrappers que interfieran con nested scroll |
| `apps/web/src/components/explore/InfiniteGrid.tsx` | Keys no totalmente estables y rerender global al paginar | Alta | Asegurar keys deterministicas por item, limitar actualizaciones al bloque incremental, memoizar filas/cards |
| Secciones/cards de Explore (event cards y rows) | Componentes pesados sin memo consistente, props nuevas por frame (spreads/objetos inline) | Alta | Aplicar `React.memo` donde corresponda, estabilizar props y callbacks de alto churn, eliminar creacion de objetos en hot paths |
| Cards con imagen/efectos visuales | Costo alto de imagen y efectos (blur/backdrop/shadows) en listas densas Android | Media | Estandarizar tamano visual y `resizeMode/contentFit`, reducir efectos costosos en Android manteniendo estetica base |
| Layouts con wrappers adicionales en pantallas de Explore | Posible relayout frecuente por estructura de wrappers y mediciones durante scroll | Media | Simplificar jerarquia en zonas criticas, aislar mediciones/calculos fuera del ciclo de scroll |
| `src/screens/WebAppScreen.tsx` (RN) | Riesgo de regresion de integracion WebView al aplicar optimizaciones web | Baja | Validar compatibilidad Android/iOS, revisar parametros de WebView y flujos de navegacion tras cambios de performance |

## Focos prioritarios confirmados

- Re-renders durante scroll en `HorizontalSlider`.
- Componentes y card rows sin memo consistente.
- Props inestables (objetos y callbacks inline).
- Imagenes y efectos visuales costosos en cards.
- Grids/listas sin virtualizacion o aislamiento real de render.

## Plan de correccion recomendado

1. **Quick wins de render:** estabilizar props/callbacks y memoizacion en `ExploreHomeScreenModern`, `HorizontalSlider`, `InfiniteGrid` y cards pesadas.
2. **Costo visual:** ajustar estrategia de imagen y degradar efectos costosos para Android/WebView en zonas densas.
3. **Gestos:** validar convivencia vertical/horizontal en carruseles sin degradar UX actual.
4. **Compatibilidad RN:** smoke test en `WebAppScreen` y pantallas secundarias tras cambios web.

## Validacion sugerida (antes/despues)

- Scroll largo en Explore con contenido cargado.
- Sliders horizontales embebidos en scroll vertical.
- Escenarios con filtros activos y paginacion.
- Confirmar menor jank visible y menor volumen de re-render en componentes criticos.

## Validacion funcional ejecutada (antes/despues)

Fecha de ejecucion: `2026-04-04` (entorno local Windows, repo en estado de trabajo).

### Antes (baseline disponible)

- Baseline de performance de datos de Explore regenerado con `pnpm --filter @baileapp/web perf:report`.
- Fuente: `apps/web/PERF_BASELINE_FRONTEND.md` y `apps/web/SLOW_QUERIES.md`.
- Indicadores base relevantes:
  - `useExploreQuery::fetchPage_total` p50 `2680ms`, p95 `3507ms`.
  - `useExploreQuery::main_events_query` p50 `341ms`, p95 `1901ms`.
  - `useExploreQuery::ensure_weekly_occurrences_rpc` p50 `861ms`, p95 `1745ms`.

### Despues (validacion en rama actual)

- `pnpm --filter @baileapp/web build`: OK.
- `pnpm --filter @baileapp/web test:run -- src/utils/eventDateExpiration.test.ts`: OK (13/13).
- `pnpm --filter @baileapp/web test:no-infinite-loading`: OK.
- `pnpm --filter @baileapp/web test:run` completo: no concluyo en el tiempo de ejecucion local (se detuvo para evitar bloqueo).
- `pnpm --filter @baileapp/web lint`: falla por entorno/comando (`eslint` no reconocido).
- `pnpm --filter @baileapp/web typecheck`: falla por errores TS preexistentes en multiples archivos no limitados al alcance de scroll.

### Resultado y lectura antes/despues

- Se valida que el build productivo y pruebas focalizadas criticas pasan en el estado actual.
- El baseline "antes" de performance de queries queda documentado y regenerado.
- No fue posible medir "despues" en dispositivo Android/WebView en esta ejecucion (sin emulador/dispositivo conectado), por lo que la validacion perceptual de jank y gestos queda pendiente de corrida manual.

### Checklist pendiente para cierre en Android (manual)

- Explore con scroll largo y carga alta.
- Sliders horizontales dentro de scroll vertical (verificar no captura agresiva de gestos).
- Escenario con filtros activos y paginacion infinita.
- Confirmar reduccion de jank visible y estabilidad de FPS percibida frente al baseline funcional previo.
