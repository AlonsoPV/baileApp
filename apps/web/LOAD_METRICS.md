# Métricas de carga de la app (web)

Evaluación del tamaño del bundle y tiempo de build. Generado a partir del build de producción (`npm run build`).

---

## Consumo en carga (descarga inicial)

### Tamaño de archivos (minificado, en disco)

| Archivo | Tamaño | Notas |
|---------|--------|--------|
| `index.html` | 1.28 KB | Entrada |
| `index-*.css` | **218 KB** (~0.21 MB) | Estilos globales |
| `index-*.js` | **3 116 KB** (~3.04 MB) | Chunk principal (todo el app) |
| `TeacherMetricsPanel-*.js` | 13 KB | Chunk lazy |
| `TeacherRatingComponent-*.js` | 19 KB | Chunk lazy |
| **Total JS+CSS+HTML (carga inicial)** | **~3.35 MB** | Sin contar mapas ni imágenes |

### Transferencia real (gzip)

En la red, el servidor suele enviar los recursos comprimidos (gzip). El build reporta:

| Recurso | Tamaño gzip |
|---------|-------------|
| index.html | 0.63 KB |
| index-*.css | 35.78 KB |
| index-*.js | **773.80 KB** |
| TeacherMetricsPanel | 3.58 KB |
| TeacherRatingComponent | 4.79 KB |
| **Total transferido (estimado)** | **~818 KB (~0.8 MB)** |

- **Consumo al cargar la app (red):** ~**0,8 MB** (con gzip).
- **Consumo en disco / memoria (minificado):** ~**3,35 MB** (JS + CSS + HTML de la carga inicial).

Los chunks lazy (TeacherMetricsPanel, TeacherRatingComponent) solo se descargan al entrar en rutas que los usan.

---

## Tiempo de build

- **Último build:** ~**10,2 s** (3472 módulos transformados).

---

## Velocidad de carga (en el usuario)

El tiempo de carga real depende de:

1. **Red:** con ~0,8 MB (gzip), en 4G (~5 Mb/s) serían ~1–2 s solo de descarga; en 3G mucho más.
2. **Dispositivo:** parseo y ejecución de ~3 MB de JS en móviles puede costar 0,5–2 s extra.
3. **Caché:** repetición de visitas reduce descarga a casi 0 si no hay cambios.

**Problema actual:** el chunk principal `index-*.js` es **~3,1 MB** (minificado), por encima del aviso de Vite (500 KB). Eso implica:

- Primera carga más pesada.
- Mayor tiempo de parse/ejecución en el navegador, sobre todo en móviles.

**Recomendaciones para mejorar:**

1. **Code-splitting por rutas:** usar `React.lazy()` + `Suspense` en rutas (Explore, Academy, Profile, etc.) para dividir el JS en varios chunks y cargar solo el de la pantalla actual.
2. **manualChunks en Vite:** separar React, React-DOM, react-router, Supabase, framer-motion en chunks distintos para mejor caché y paralelismo.
3. **Revisar dependencias pesadas:** `framer-motion`, `react-icons`, `lucide-react` y similares; importar solo los iconos/componentes que se usen (tree-shaking).
4. **Lazy de pantallas grandes:** `ExploreHomeScreenModern`, `AcademyPublicScreen`, etc. cargarlos bajo demanda.

---

## Resumen

| Métrica | Valor |
|---------|--------|
| **MB al cargar (transferido, gzip)** | **~0,8 MB** |
| **MB al cargar (minificado, JS+CSS)** | **~3,35 MB** |
| **Tiempo de build** | ~10 s |
| **Tamaño chunk principal** | ~3,1 MB (objetivo: &lt; 500 KB por chunk) |
