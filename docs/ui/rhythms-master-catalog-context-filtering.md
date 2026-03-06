# Ritmos: catalogo maestro + subconjunto contextual

## Decisión

La fuente de verdad de ritmos es un **catalogo maestro unico** (`tags` con `tipo='ritmo'`).
No se crean catalogos duplicados por perfil o por seccion.

## Como se construye el filtro

1. El backend expone `rpc_get_used_rhythms_by_context(p_context)`.
2. La RPC toma el contexto (`eventos`, `clases`, `academias`, `maestros`, `organizadores`, `bailarines`, `marcas`), extrae ritmos realmente usados y cruza contra `tags`.
3. El frontend usa `useUsedRhythmsByContext(context)` para cargar ese subconjunto.
4. El dropdown muestra solo esos ritmos.
5. Al cambiar de contexto, se limpian ritmos seleccionados que ya no existen en el subconjunto nuevo.

## Por que este enfoque

- Evita inconsistencias entre catalogos duplicados.
- Mantiene una sola taxonomia de ritmos para toda la app.
- Permite UX contextual (solo lo relevante por seccion) sin perder normalizacion de datos.
- Facilita evolucion futura a cache agregada/materializada sin cambiar la fuente de verdad.
