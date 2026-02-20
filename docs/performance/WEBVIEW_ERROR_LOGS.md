# WebView: logs de error [WEBVIEW_ERR]

Para diagnosticar "No se pudo cargar la página" en Android (o iOS), filtrar logs con:

```bash
adb logcat | grep WEBVIEW_ERR
```

## Formato

Cada error se registra como:

- **onError** — fallo de carga (SSL, DNS, timeout, conexión). Campos: `code`, `description`, `url`, `canGoBack`, `canGoForward`.
- **onHttpError** — respuesta HTTP 4xx/5xx. Campos: `statusCode`, `description`, `url`.
- **onRenderProcessGone** (Android) — proceso del renderer terminado/crasheado. Campos: `didCrash`, `rendererPriorityAtExit`.
- **onContentProcessDidTerminate** (iOS) — proceso de contenido terminado.
- **load_timeout** — no llegó `onLoadEnd` ni READY en 20s. Campos: `timeoutMs`, `message`.

## Ejemplos de logs (para adjuntar al PR)

### 1) SSL / certificado

```json
[WEBVIEW_ERR] onError {
  "code": -2,
  "description": "net::ERR_CERT_AUTHORITY_INVALID",
  "url": "https://dondebailar.com.mx/",
  "canGoBack": false,
  "canGoForward": false
}
```

→ Mensaje al usuario: *"Problema con certificado SSL. Intenta de nuevo. Si persiste, actualiza WebView/Chrome."*

### 2) DNS / resolución

```json
[WEBVIEW_ERR] onError {
  "code": -105,
  "description": "net::ERR_NAME_NOT_RESOLVED",
  "url": "https://dondebailar.com.mx/",
  "canGoBack": false,
  "canGoForward": false
}
```

→ Mensaje: *"No se pudo resolver el servidor. Revisa tu red."*

### 3) Timeout

```json
[WEBVIEW_ERR] onError {
  "source": "load_timeout",
  "timeoutMs": 20000,
  "message": "onLoadEnd/READY did not fire within timeout"
}
```

→ Mensaje: *"La conexión tardó demasiado."*

### 4) HTTP 5xx

```json
[WEBVIEW_ERR] onHttpError {
  "statusCode": 502,
  "description": "Bad Gateway",
  "url": "https://dondebailar.com.mx/"
}
```

→ Mensaje: *"Servidor no disponible (502)."*

## UI de error

- Título: "No se pudo cargar la página".
- Texto: mensaje clasificado (SSL, DNS, timeout, servidor no disponible, genérico).
- En **dev**: caja con `code`, `statusCode`, `description`, `url`.
- Botones: **Reintentar** (reload) y **Abrir en navegador** (`Linking.openURL(WEB_APP_URL)`).

## Ajustes aplicados

- URL base siempre **HTTPS** (`https://dondebailar.com.mx`).
- **Timeout 20s**: si no llega `onLoadEnd` ni READY, se muestra error y Reintentar.
- **mixedContentMode="always"** (Android).
- **cacheEnabled** (Android), **domStorageEnabled**, **javaScriptEnabled**.
- **userAgent** en Android: `DondeBailarApp/{version} Android WebView` (opcional; quitar si rompe el sitio).
- Handlers: **onError**, **onHttpError**, **onRenderProcessGone** (Android), **onContentProcessDidTerminate** (iOS).

## Validación

1. Emulador Android 13+ y dispositivo real (WiFi y datos).
2. Reproducir error y capturar `[WEBVIEW_ERR]` con code/description.
3. Comprobar que Reintentar recarga y que Abrir en navegador abre la URL en el navegador externo.
