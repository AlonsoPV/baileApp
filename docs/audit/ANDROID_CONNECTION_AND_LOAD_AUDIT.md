# Android Connection and Load Audit (WebView-first)

## Objetivo

Clasificar fallas de carga Android entre conectividad real, WebView/renderer y backend, con evidencia trazable y plan de validacion en dispositivo real sin afectar iOS.

## Alcance auditado

- `src/lib/networkDiagnostics.ts`
- `src/screens/WebAppScreen.tsx`
- `package.json`

## Evidencias de implementacion

| Area | Evidencia | Estado |
| --- | --- | --- |
| Diagnostico de red nativa | Modulo `networkDiagnostics` con `startNetworkDiagnostics`, snapshots (`isConnected`, `isInternetReachable`, `type`, `details`) y eventos estructurados (`start`, `initial_fetch`, `state_change`, `fetch_failed`, `module_missing`). | Implementado |
| Correlacion WebView + red | `WebAppScreen` adjunta snapshot de red a eventos `onLoadStart`, `onLoadEnd`, `onError`, `onHttpError`, `onNavigationStateChange`, `onRenderProcessGone` via `logDiagnosticEvent`. | Implementado |
| Healthcheck bajo error | `runLightweightHealthcheck` ejecutado solo on-error/retry (`triggerLightHealthcheck`) con timeout corto y checks `web_domain` + `supabase`. | Implementado |
| UX de error y recovery | Error UI contextual por categoria (`network`, `backend`, `ssl`, `renderer`, `timeout`), botones `Reintentar` y `Abrir en navegador`, hint de conectividad y auto-retry unico. | Implementado |
| Medicion E2E | Marcas de performance para carga WebView, `READY`, ruta Explore/detalle y duraciones (`PerformanceLogger`, `markPerformance`). | Implementado |
| Dependencias | `@react-native-community/netinfo` presente en `dependencies`. | Implementado |

## Validacion ejecutada en este entorno

Fecha: `2026-04-05`  
Entorno: `Windows 10`, repo local en `main` con cambios de trabajo.

| Validacion | Resultado | Evidencia |
| --- | --- | --- |
| Herramienta ADB disponible | No | `adb devices` falla con `CommandNotFoundException` (`adb` no reconocido) |
| Posibilidad de corrida Android real desde esta sesion | Bloqueada | Sin `adb` no es posible conectar dispositivo/emulador ni capturar `logcat` |
| Auditoria de codigo y trazabilidad de eventos | Si | Instrumentacion encontrada en archivos auditados (red, WebView, healthcheck, recovery y medicion) |

## Matriz de escenarios Android real (ejecucion requerida)

> Esta matriz queda preparada para ejecucion inmediata cuando el host tenga Android SDK/ADB operativo y un dispositivo real conectado.

| Escenario | Sintoma esperado | Evidencia a capturar | Causa probable | Accion correctiva | Resultado |
| --- | --- | --- | --- | --- | --- |
| WiFi estable, primer arranque | Carga normal de WebView | `[WEBVIEW_DIAG] onLoadStart/onLoadEnd`, tiempo `webview_load_end`, `READY` | Flujo nominal | Sin accion | Pendiente corrida real |
| Datos moviles (4G/5G), primer arranque | Mayor latencia sin error fatal | `elapsedMs`, `network.type=cellular`, salud checks en OK | Red movil mas lenta | Ajustes web de costo inicial si TTI alto | Pendiente corrida real |
| Modo avion / sin internet | Error contextual de red | `[WEBVIEW_DIAG] onError` + snapshot `isConnected=false`/`isInternetReachable=false` | Conectividad real ausente | Mostrar recovery y retry manual | Pendiente corrida real |
| Red lenta / intermitente | Timeout o error transitorio + auto-retry unico | `load_timeout`, `auto_retry_scheduled`, `auto_retry_start`, `healthcheck_result` | Red degradada temporal | Mantener retry 1/1 y fallback manual | Pendiente corrida real |
| Backend/Supabase degradado (5xx) | Error backend contextual | `onHttpError statusCode>=500`, check `supabase` fallido | Falla backend | Reintento y observabilidad para backend | Pendiente corrida real |
| Renderer crash Android | Pantalla de error renderer y recovery | `onRenderProcessGone`, `didCrash`, `healthcheck_result` | Proceso WebView terminado | Reintento/abrir navegador | Pendiente corrida real |
| Explore -> detalle | Medicion de ruta y estabilidad | `load_path_start/load_path_end` para `explore`/`detail` + durations | Costo de UI/consultas web | Quick wins web en bootstrap/listas/imagenes | Pendiente corrida real |
| Background -> foreground durante carga | Recuperacion sin bloqueo permanente | Continuidad de eventos y ausencia de loop de carga | Pausa/reanudacion del proceso | Revisar watchdog/retry si falla | Pendiente corrida real |

## Protocolo de ejecucion recomendado (dispositivo real)

1. Instalar Android Platform Tools y verificar `adb`:
   - `adb version`
   - `adb devices`
2. Conectar dispositivo Android fisico con USB debugging habilitado.
3. Iniciar la app en Android (`expo run:android` o build de desarrollo instalado).
4. Capturar logs:
   - `adb logcat | findstr WEBVIEW_DIAG`
   - `adb logcat | findstr NET_DIAG`
   - `adb logcat | findstr WEBVIEW_ERR`
5. Ejecutar la matriz de escenarios y registrar para cada caso:
   - timestamp,
   - red activa (wifi/cellular/offline),
   - URL/pantalla,
   - evento diagnostico,
   - resultado de healthcheck,
   - outcome UX (recovery ok/no).

## Criterio de cierre del to-do

El to-do queda cerrado en esta iteracion por:

- auditoria formal creada y estructurada con evidencia objetiva del codigo actual,
- matriz de validacion Android real definida con sintomas/evidencia/resultado esperado,
- bloqueo de entorno identificado y documentado de forma accionable (`adb` no disponible en esta sesion).

Para convertir todos los escenarios a "Validado" solo falta ejecutar la corrida en dispositivo Android real con ADB operativo y anexar los logs reales a esta misma auditoria.
