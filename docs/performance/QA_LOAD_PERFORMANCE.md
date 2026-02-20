# QA: Tiempos de carga (Android / WebView)

## Instrumentación [PERF]

Todos los hitos de rendimiento se registran con el prefijo **`[PERF]`** para poder filtrar en Android:

```bash
adb logcat | grep PERF
```

### Hitos (native / Expo)

- `app_start` — arranque
- `app_config_start` / `env_report_generated` — config
- `app_content_mounted` / `providers_rendered` — UI montada
- `root_navigator_mounted` / `navigation_ready` — navegación lista
- `webview_load_start` — WebView empezó a cargar
- `webview_load_progress_100` — progress 100%
- `webview_load_end` — onLoadEnd (tiempo hasta fin de carga)
- `webview_ready` — postMessage READY desde la web (TTI percibido)

### Hitos (web, dentro del WebView)

- `app_start` — entrada en main.tsx
- `first_screen_mount` — Explore montado
- `data_fetch_start` / `data_fetch_end` — fetch Supabase
- `list_render_end` — primer render de listas/carrusel
- `web_ready` — antes de enviar READY al host

## Comparar antes/después

- **app_start → first_screen_mount** — tiempo hasta montar primera pantalla
- **webview_load_start → webview_load_end** — tiempo de carga del WebView
- **webview_load_start → webview_ready** — tiempo hasta “listo” (handshake READY)
- **data_fetch_start → data_fetch_end** — tiempo del primer fetch
- **first_screen_mount → list_render_end** — tiempo hasta primer contenido pintado

## Checklist de validación

- [ ] La app no se queda en blanco; skeleton/cargando aparece rápido
- [ ] Home/Explore interactivo antes de que terminen todas las imágenes
- [ ] Scroll suave (sin jank) en listas y carruseles
- [ ] No hay refetch infinito (React Query con staleTime 2 min en explore)
- [ ] Android: logs `[PERF]` visibles con `adb logcat | grep PERF`
- [ ] WebView: loader se oculta al recibir READY (o al onLoadEnd como fallback)
- [ ] iOS: comportamiento no empeora

## Quick wins aplicados

1. **React Query (explore)**  
   - `staleTime: 120000`, `refetchOnMount: false`, `refetchOnWindowFocus: false`

2. **WebView Android**  
   - `cacheEnabled={true}`, handshake READY para ocultar loader cuando la web está lista

3. **Imágenes**  
   - EventCard: `loading="lazy"` (salvo `priority`), placeholder cuando falla

4. **Medición**  
   - PerformanceLogger (web) + markPerformance (native) con prefijo [PERF]
