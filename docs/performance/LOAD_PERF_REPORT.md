# Reporte de performance — Android (WebView) + Web

## Baseline (ANTES) vs (DESPUÉS)

Ejecuta **5 corridas** (emulador + dispositivo real) y llena con **mediana** (y opcional promedio).

| Métrica | Antes (ms) | Después (ms) | Cambio |
|--------|------------|--------------|--------|
| app_start → first_screen_mount |  |  |  |
| webview_load_start → webview_load_end |  |  |  |
| webview_load_start → web_ready |  |  |  |
| data_fetch_start → data_fetch_end |  |  |  |
| first_screen_mount → list_first_render_end |  |  |  |

### Evidencia (logs)

- Android: `adb logcat | grep PERF`
- Errores WebView: `adb logcat | grep WEBVIEW_ERR`

Pega aquí 2-3 ejemplos representativos:

```text
[PERF] ...
```

## Diagnóstico (cuello de botella)

Marca el mayor contribuyente según los logs:

- [ ] WebView carga lenta (webview_load_start → web_ready alto)
- [ ] Fetch inicial lento (data_fetch alto)
- [ ] Render/listas lento (list_first_render_end alto)
- [ ] Bloqueo por overlays/scroll lock
- [ ] Errores SSL/DNS/HTTP

## Cambios implementados

### App (native)
- `src/utils/perf.ts`: PerformanceLogger (mark/measure/flush) con prefijo `[PERF]`.
- `src/screens/WebAppScreen.tsx`:
  - marks de WebView `webview_progress_25/50/75/100`
  - overlay debug DEV (PERF) + botón Copiar (best-effort)

### Web
- `apps/web/src/utils/performanceLogger.ts`:
  - `notifyReady()` ahora envía `{ type:'READY', t, marks }` al host
  - `notifyError()` envía `{ type:'ERROR', ... }`
- `apps/web/src/utils/scrollLockWatchdog.ts` (DEV): alerta si overflow hidden > 3s

## Impacto

Describe qué cambió y por qué:

- **TTFP percibido**: …
- **TTI** (web_ready): …
- **Reducción de errores**: …
- **Fluidez**: …

## Checklist final

- [ ] Scroll vertical funciona en móvil web y en app
- [ ] Cards cargan o muestran error con retry (sin loading infinito)
- [ ] No hay overlay invisible bloqueando toques
- [ ] READY llega antes (mejor TTI)
- [ ] Sin regresiones en desktop/iOS (si aplica)

