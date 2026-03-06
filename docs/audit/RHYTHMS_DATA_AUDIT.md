# RHYTHMS_DATA_AUDIT

Auditoria de fuentes de ritmos para Explore contextual.

## Resumen rapido

- Fuente maestra confirmada: `public.tags` (`tipo = 'ritmo'`).
- En datos operativos hay mezcla de formatos:
  - IDs numericos (`ritmos`, `estilos`)
  - slugs/catalogo (`ritmos_seleccionados`)
  - campos en JSON de cronograma (`ritmos`, `ritmosSeleccionados`, `ritmos_seleccionados`)
- `profiles_brand.ritmos_seleccionados` **no existe** en el esquema activo (ya observado por error `42703`).
- Tablas `classes_parent` y `classes_session` aparecen en app (`useClassEnroll`) pero no se localizaron migraciones en este repo que definan sus columnas de ritmos.

## Inventario de columnas detectadas

| contexto | tabla | columna | tipo de dato | ejemplo real | vigente o legacy |
|---|---|---|---|---|---|
| eventos | `events_date` | `ritmos_seleccionados` | `text[]` (slugs) | app lee/filtra `ritmos_seleccionados` en `useExploreQuery` y editores de eventos | vigente |
| eventos | `events_date` | `estilos` | `int[]` (tag ids) | app filtra por `estilos` en `useExploreQuery` | legacy + vigente (compat) |
| eventos | `events_parent` | `ritmos_seleccionados` | `text[]` (slugs) | app cards y query por sociales usan `events_parent.ritmos_seleccionados` | vigente |
| eventos | `events_parent` | `estilos` | `int[]` (tag ids) | sociales usan `events_parent.estilos` en queries/filtros | legacy + vigente (compat) |
| clases | `profiles_academy.cronograma[*]` | `ritmos` | `jsonb array` (ids) | RPC y mapeo de clases leen `cls->'ritmos'` | legacy + vigente (compat) |
| clases | `profiles_academy.cronograma[*]` | `ritmosSeleccionados` / `ritmos_seleccionados` | `jsonb array` (slugs) | RPC y UI de clases leen ambos nombres | vigente |
| clases | `profiles_teacher.cronograma[*]` | `ritmos` | `jsonb array` (ids) | RPC y mapeo de clases leen `cls->'ritmos'` | legacy + vigente (compat) |
| clases | `profiles_teacher.cronograma[*]` | `ritmosSeleccionados` / `ritmos_seleccionados` | `jsonb array` (slugs) | RPC y UI de clases leen ambos nombres | vigente |
| academias | `profiles_academy` | `ritmos_seleccionados` | `text[]` (slugs) | editor/live de academia usa `ritmos_seleccionados` | vigente |
| academias | `profiles_academy` | `ritmos` | `int[]` (tag ids) | hooks y filtros usan `ritmos` como compatibilidad | legacy + vigente (compat) |
| maestros | `profiles_teacher` | `ritmos_seleccionados` | `text[]` (slugs) | editor/live de teacher usa `ritmos_seleccionados` | vigente |
| maestros | `profiles_teacher` | `ritmos` | `int[]` (tag ids) | hooks/filtros usan `ritmos` como compatibilidad | legacy + vigente (compat) |
| organizadores | `profiles_organizer` | `ritmos_seleccionados` | `text[]` (slugs) | editor/live de organizer usa `ritmos_seleccionados` | vigente |
| organizadores | `profiles_organizer` | `ritmos` | `int[]` (tag ids) | filtros y views usan `ritmos` como compatibilidad | legacy + vigente (compat) |
| bailarines | `profiles_user` | `ritmos_seleccionados` | `text[]` (slugs) | onboarding/profile user usan `ritmos_seleccionados` | vigente |
| bailarines | `profiles_user` | `ritmos` | `int[]` (tag ids) | onboarding y compatibilidad legacy | legacy + vigente (compat) |
| marcas | `profiles_brand` | `ritmos_seleccionados` | no encontrada | error runtime/sql `column pb.ritmos_seleccionados does not exist` | no vigente/no existe en este schema |
| marcas | `profiles_brand` | `ritmos` | no confirmada | no se detecto lectura/escritura clara en app para ritmos de marca | no confirmada |
| clases (modelo nuevo) | `classes_parent` | ritmos* | no confirmado | tabla referenciada por `useClassEnroll`, sin evidencia de columnas de ritmos en repo | pendiente |
| clases (modelo nuevo) | `classes_session` | ritmos* | no confirmado | tabla referenciada por `useClassEnroll`, sin evidencia de columnas de ritmos en repo | pendiente |

## Queries de diagnostico (copiar/pegar en Supabase SQL editor)

### 0) Sanidad de catalogo maestro

```sql
SELECT id, nombre, slug
FROM public.tags
WHERE tipo = 'ritmo'
ORDER BY nombre;
```

```sql
SELECT slug, COUNT(*) AS n
FROM public.tags
WHERE tipo = 'ritmo'
GROUP BY slug
HAVING COUNT(*) > 1
ORDER BY n DESC, slug;
```
[
  {
    "id": 32,
    "nombre": "Acrobacia",
    "slug": "acrobacia"
  },
  {
    "id": 2,
    "nombre": "Bachata Moderna",
    "slug": "moderna"
  },
  {
    "id": 13,
    "nombre": "Bachata sensual",
    "slug": "sensual"
  },
  {
    "id": 11,
    "nombre": "Bachata Tradicional",
    "slug": "tradicional"
  },
  {
    "id": 72,
    "nombre": "Belly Dance",
    "slug": "belly_dance"
  },
  {
    "id": 25,
    "nombre": "Boogie Woogie",
    "slug": "boogie-woogie"
  },
  {
    "id": 70,
    "nombre": "Box",
    "slug": "box"
  },
  {
    "id": 19,
    "nombre": "Break dance",
    "slug": "break-dance"
  },
  {
    "id": 24,
    "nombre": "Cha-cha-chá",
    "slug": "cha-cha-cha"
  },
  {
    "id": 14,
    "nombre": "Cumbia",
    "slug": "cumbia"
  },
  {
    "id": 68,
    "nombre": "Cumbia Sonidera",
    "slug": "cumbia_sonidera"
  },
  {
    "id": 41,
    "nombre": "Cumbia Texana",
    "slug": "cumbia_texana"
  },
  {
    "id": 21,
    "nombre": "Danzón",
    "slug": "danzon"
  },
  {
    "id": 33,
    "nombre": "Elasticidad",
    "slug": "elasticidad"
  },
  {
    "id": 30,
    "nombre": "Heels",
    "slug": "heels"
  },
  {
    "id": 18,
    "nombre": "Hip hop",
    "slug": "hip-hop"
  },
  {
    "id": 69,
    "nombre": "Jumping",
    "slug": "jumping"
  },
  {
    "id": 3,
    "nombre": "Kizomba",
    "slug": "kizomba"
  },
  {
    "id": 4,
    "nombre": "Merengue",
    "slug": "merengue"
  },
  {
    "id": 67,
    "nombre": "Pilates",
    "slug": "pilates"
  },
  {
    "id": 31,
    "nombre": "Pole Dance",
    "slug": "pole_dance"
  },
  {
    "id": 5,
    "nombre": "Reggaeton",
    "slug": "reggaeton"
  },
  {
    "id": 22,
    "nombre": "Rock and Roll",
    "slug": "rock-and-roll"
  },
  {
    "id": 12,
    "nombre": "Salsa Casino",
    "slug": "casino"
  },
  {
    "id": 1,
    "nombre": "Salsa On 1",
    "slug": "on1"
  },
  {
    "id": 26,
    "nombre": "Salsa On 2",
    "slug": "on2"
  },
  {
    "id": 16,
    "nombre": "Semba",
    "slug": "semba"
  },
  {
    "id": 23,
    "nombre": "Swing",
    "slug": "swing"
  },
  {
    "id": 15,
    "nombre": "Timba",
    "slug": "timba"
  },
  {
    "id": 20,
    "nombre": "Twerk",
    "slug": "twerk"
  },
  {
    "id": 66,
    "nombre": "Yoga",
    "slug": "yoga"
  },
  {
    "id": 17,
    "nombre": "Zouk",
    "slug": "zouk"
  },
  {
    "id": 29,
    "nombre": "Zumba",
    "slug": "zumba"
  }
]
### 1) Eventos: `events_date`

```sql
SELECT id, estado_publicacion, estilos, ritmos_seleccionados
FROM public.events_date
WHERE estilos IS NOT NULL OR ritmos_seleccionados IS NOT NULL
ORDER BY id DESC
LIMIT 50;
```

```sql
-- IDs invalidos en estilos (no existen en tags tipo ritmo)
WITH ids AS (
  SELECT DISTINCT (unnest(COALESCE(estilos, '{}'::int[])))::bigint AS id
  FROM public.events_date
  WHERE estado_publicacion = 'publicado'
)
SELECT i.id
FROM ids i
LEFT JOIN public.tags t ON t.id = i.id AND t.tipo = 'ritmo'
WHERE t.id IS NULL
ORDER BY i.id;
```

```sql
-- Slugs invalidos en ritmos_seleccionados (no existen en tags tipo ritmo)
WITH slugs AS (
  SELECT DISTINCT lower(trim(x)) AS slug
  FROM public.events_date ed,
       unnest(COALESCE(ed.ritmos_seleccionados, '{}'::text[])) AS x
  WHERE ed.estado_publicacion = 'publicado'
    AND x IS NOT NULL
    AND trim(x) <> ''
)
SELECT s.slug
FROM slugs s
LEFT JOIN public.tags t ON t.tipo = 'ritmo' AND lower(t.slug) = s.slug
WHERE t.id IS NULL
ORDER BY s.slug;
```
[
  {
    "slug": "bachata_sensual"
  },
  {
    "slug": "bachata_tradicional"
  },
  {
    "slug": "salsa_casino"
  },
  {
    "slug": "salsa_on1"
  },
  {
    "slug": "salsa_on2"
  }
]
### 2) Sociales padre: `events_parent`

```sql
SELECT ep.id, ep.estilos, ep.ritmos_seleccionados
FROM public.events_parent ep
WHERE ep.estilos IS NOT NULL OR ep.ritmos_seleccionados IS NOT NULL
ORDER BY ep.id DESC
LIMIT 50;
```

```sql
-- Padres con estilos/ritmos pero sin ninguna fecha publicada (potencial sobrante)
SELECT ep.id
FROM public.events_parent ep
WHERE (ep.estilos IS NOT NULL OR ep.ritmos_seleccionados IS NOT NULL)
  AND NOT EXISTS (
    SELECT 1
    FROM public.events_date ed
    WHERE ed.parent_id = ep.id
      AND ed.estado_publicacion = 'publicado'
  )
ORDER BY ep.id DESC
LIMIT 200;
```
[
  {
    "id": 39
  },
  {
    "id": 38
  },
  {
    "id": 37
  },
  {
    "id": 35
  },
  {
    "id": 34
  },
  {
    "id": 33
  },
  {
    "id": 32
  },
  {
    "id": 29
  },
  {
    "id": 27
  },
  {
    "id": 25
  },
  {
    "id": 24
  },
  {
    "id": 23
  }
]
### 3) Clases en cronograma: `profiles_academy` y `profiles_teacher`

```sql
-- Academy: muestras de ritmos en cronograma
SELECT pa.id,
       cls->'ritmos' AS ritmos_ids,
       COALESCE(cls->'ritmosSeleccionados', cls->'ritmos_seleccionados') AS ritmos_slugs
FROM public.profiles_academy pa,
     jsonb_array_elements(COALESCE(pa.cronograma, '[]'::jsonb)) AS cls
WHERE pa.estado_aprobacion = 'aprobado'
LIMIT 100;
```

```sql
-- Teacher: muestras de ritmos en cronograma
SELECT pt.id,
       cls->'ritmos' AS ritmos_ids,
       COALESCE(cls->'ritmosSeleccionados', cls->'ritmos_seleccionados') AS ritmos_slugs
FROM public.profiles_teacher pt,
     jsonb_array_elements(COALESCE(pt.cronograma, '[]'::jsonb)) AS cls
WHERE pt.estado_aprobacion = 'aprobado'
LIMIT 100;
```
[
  {
    "id": 11,
    "ritmos_ids": null,
    "ritmos_slugs": null
  },
  {
    "id": 41,
    "ritmos_ids": null,
    "ritmos_slugs": null
  }
]
### 4) Perfiles: slugs + ids

```sql
SELECT id, ritmos, ritmos_seleccionados
FROM public.profiles_academy
WHERE estado_aprobacion = 'aprobado'
  AND (ritmos IS NOT NULL OR ritmos_seleccionados IS NOT NULL)
LIMIT 100;
```

```sql
SELECT id, ritmos, ritmos_seleccionados
FROM public.profiles_teacher
WHERE estado_aprobacion = 'aprobado'
  AND (ritmos IS NOT NULL OR ritmos_seleccionados IS NOT NULL)
LIMIT 100;
```

```sql
SELECT id, ritmos, ritmos_seleccionados
FROM public.profiles_organizer
WHERE estado_aprobacion = 'aprobado'
  AND (ritmos IS NOT NULL OR ritmos_seleccionados IS NOT NULL)
LIMIT 100;
```

```sql
SELECT user_id, ritmos, ritmos_seleccionados, onboarding_complete
FROM public.profiles_user
WHERE onboarding_complete = true
  AND (ritmos IS NOT NULL OR ritmos_seleccionados IS NOT NULL)
LIMIT 100;
```
[
  {
    "user_id": "30df1ca1-d84d-4c0c-8d6b-521c99737314",
    "ritmos": [],
    "ritmos_seleccionados": [
      "moderna"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "449cffd0-e105-41a8-94a0-0154136f95b4",
    "ritmos": [
      2
    ],
    "ritmos_seleccionados": [],
    "onboarding_complete": true
  },
  {
    "user_id": "1220e308-c4c2-45d4-b952-e55002cac49d",
    "ritmos": [],
    "ritmos_seleccionados": [
      "twerk"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "e9d59cc7-bee0-4d6d-9c3f-aa55a834f6db",
    "ritmos": [],
    "ritmos_seleccionados": [],
    "onboarding_complete": true
  },
  {
    "user_id": "004615c1-33e5-41fa-bd8c-7552bed922df",
    "ritmos": [],
    "ritmos_seleccionados": [
      "salsa_on1"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "c1c66083-bfdc-4424-bfba-3ed9a42651f4",
    "ritmos": [],
    "ritmos_seleccionados": [],
    "onboarding_complete": true
  },
  {
    "user_id": "54f1ba23-593a-4140-ad4b-b0a298d4042d",
    "ritmos": [
      1,
      2,
      26
    ],
    "ritmos_seleccionados": [
      "salsa_on1",
      "moderna",
      "salsa_on2"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "b684cc9b-42e5-4b76-a492-5adfd7b3453a",
    "ritmos": [],
    "ritmos_seleccionados": [
      "salsa_on1",
      "moderna",
      "salsa_on2",
      "salsa_casino",
      "merengue",
      "bachata_sensual",
      "bachata_tradicional",
      "cumbia",
      "timba"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "de0ef151-cc92-43e5-95d9-f8fe9a59e670",
    "ritmos": [],
    "ritmos_seleccionados": [],
    "onboarding_complete": true
  },
  {
    "user_id": "b40b2135-2394-4b60-94a0-5de62b04fdce",
    "ritmos": [],
    "ritmos_seleccionados": [],
    "onboarding_complete": true
  },
  {
    "user_id": "6dc3ee23-0811-4953-968e-9a80cf743125",
    "ritmos": [],
    "ritmos_seleccionados": [
      "salsa_on1",
      "moderna",
      "salsa_on2",
      "salsa_casino",
      "bachata_tradicional",
      "bachata_sensual"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "c55afe2e-138d-4f84-87af-6673313aa80c",
    "ritmos": [],
    "ritmos_seleccionados": [
      "salsa_on1",
      "salsa_on2",
      "moderna"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "29a34274-50bf-4c72-b845-4204a4d3d517",
    "ritmos": [],
    "ritmos_seleccionados": [
      "reggaeton",
      "hiphop",
      "pole_dance"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "7a044697-5ece-4cd0-9d81-8e1fddf13b05",
    "ritmos": [],
    "ritmos_seleccionados": [
      "salsa_on2",
      "salsa_on1",
      "bachata_sensual",
      "moderna",
      "cumbia"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "c680e2cc-99f3-4210-87ee-3457db97d804",
    "ritmos": [
      12
    ],
    "ritmos_seleccionados": [],
    "onboarding_complete": true
  },
  {
    "user_id": "4a3695ce-5e07-440b-950d-cdcfb3c4d88c",
    "ritmos": [],
    "ritmos_seleccionados": [
      "moderna",
      "salsa_casino",
      "bachata_tradicional",
      "bachata_sensual",
      "merengue",
      "timba",
      "salsa_on1"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "3f18d796-9195-4247-89f9-32b5acddf860",
    "ritmos": [
      14
    ],
    "ritmos_seleccionados": [
      "cumbia"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "f978f8bc-f7db-46ee-a8ca-29f2528a01ef",
    "ritmos": [],
    "ritmos_seleccionados": [],
    "onboarding_complete": true
  },
  {
    "user_id": "6eccf8b5-da3b-43e4-b1fe-057869881ca9",
    "ritmos": [],
    "ritmos_seleccionados": [
      "salsa_on1",
      "salsa_casino"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "f94632ce-da90-4c9e-b1bc-bc2f1ef386be",
    "ritmos": [],
    "ritmos_seleccionados": [
      "moderna",
      "cumbia"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "5f570acf-e5ef-49e7-b3cc-7d3d3d4b627d",
    "ritmos": [],
    "ritmos_seleccionados": [
      "salsa_on1",
      "salsa_on2",
      "cumbia"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "97a366b0-b1f3-4b85-8069-cb4fea828dda",
    "ritmos": [],
    "ritmos_seleccionados": [
      "bachata_sensual",
      "salsa_on1",
      "moderna",
      "salsa_on2",
      "reggaeton"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "f9db4a77-c1bb-440d-b9a6-4bc571128e50",
    "ritmos": [],
    "ritmos_seleccionados": [
      "salsa_on1",
      "moderna",
      "salsa_on2",
      "salsa_casino",
      "bachata_tradicional",
      "bachata_sensual",
      "zouk",
      "kizomba",
      "hiphop"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "689b66aa-992f-43e2-ab22-13437c34e825",
    "ritmos": [],
    "ritmos_seleccionados": [
      "salsa_on1",
      "salsa_casino",
      "bachata_tradicional",
      "merengue",
      "cumbia",
      "timba",
      "salsa_on2",
      "bachata_sensual"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "60ecf7e0-ac88-4f8f-aecb-29b409c03687",
    "ritmos": [],
    "ritmos_seleccionados": [
      "salsa_on1",
      "moderna"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "04ec9d5d-211b-43b0-9060-0c6481d26434",
    "ritmos": [],
    "ritmos_seleccionados": [
      "cumbia"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "2a2346b4-e35f-415f-9f9f-b724cb99bb8d",
    "ritmos": [],
    "ritmos_seleccionados": [
      "salsa_on1",
      "bachata_tradicional"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "239eee8f-5bf7-42c2-8109-32ae75ba41f7",
    "ritmos": [],
    "ritmos_seleccionados": [],
    "onboarding_complete": true
  },
  {
    "user_id": "85b87843-ef8f-4940-a6fb-784f1d8aeb24",
    "ritmos": [
      12,
      1
    ],
    "ritmos_seleccionados": [],
    "onboarding_complete": true
  },
  {
    "user_id": "64d17906-38ef-4cfb-b9d9-235a8cd1409c",
    "ritmos": [],
    "ritmos_seleccionados": [
      "salsa_on1"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "f141385c-dd6e-4f9a-97a1-75c996c313bb",
    "ritmos": [],
    "ritmos_seleccionados": [
      "salsa_on1",
      "salsa_casino",
      "moderna",
      "bachata_sensual",
      "timba"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "40962326-5155-4640-aab2-9d37c3e40db1",
    "ritmos": [],
    "ritmos_seleccionados": [
      "salsa_on1",
      "moderna",
      "salsa_casino",
      "bachata_tradicional",
      "bachata_sensual",
      "cumbia",
      "twerk",
      "reggaeton",
      "heels",
      "pole_dance",
      "elasticidad"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "831b139a-2718-4821-989a-7ea2782f529c",
    "ritmos": [],
    "ritmos_seleccionados": [
      "salsa_on1",
      "moderna",
      "bachata_tradicional",
      "salsa_casino",
      "bachata_sensual",
      "merengue",
      "timba",
      "cumbia",
      "kizomba",
      "breakdance",
      "reggaeton"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "694d9c09-9e9c-4821-a84c-d31bd087a7c4",
    "ritmos": [],
    "ritmos_seleccionados": [
      "salsa_casino",
      "salsa_on2",
      "salsa_on1"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "f3c7195a-4df4-4b1e-8063-bd7b90666d58",
    "ritmos": [],
    "ritmos_seleccionados": [
      "hiphop",
      "breakdance"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "fc06e42e-d598-4424-82f6-1b386048eafd",
    "ritmos": [],
    "ritmos_seleccionados": [
      "moderna",
      "salsa_on2",
      "bachata_sensual",
      "timba"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "e4ef509e-fa27-4708-9af3-7a8073fabd1d",
    "ritmos": [],
    "ritmos_seleccionados": [
      "bachata_sensual",
      "moderna",
      "bachata_tradicional",
      "salsa_casino",
      "salsa_on1",
      "salsa_on2",
      "merengue",
      "cumbia",
      "timba"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "d410b26f-6dc9-4acb-a20e-3d0ebafbf9b6",
    "ritmos": [],
    "ritmos_seleccionados": [
      "rockandroll"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "0d74063b-e050-406a-86c8-9a5f8bfb451a",
    "ritmos": [],
    "ritmos_seleccionados": [
      "salsa_on2",
      "salsa_casino",
      "bachata_tradicional",
      "timba"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "36ca0eaa-0511-476b-8707-a5b567afd031",
    "ritmos": [],
    "ritmos_seleccionados": [
      "salsa_on1",
      "moderna",
      "salsa_casino",
      "salsa_on2",
      "merengue",
      "bachata_sensual",
      "bachata_tradicional",
      "cumbia",
      "timba"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "ac904452-16f5-4cce-87c6-2b995ee76c74",
    "ritmos": [],
    "ritmos_seleccionados": [
      "rockandroll"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "0a0889c0-e2c8-4828-ae91-e1b0d5d39463",
    "ritmos": [],
    "ritmos_seleccionados": [
      "cumbia",
      "salsa_on1",
      "heels",
      "twerk",
      "reggaeton"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "ee9e3432-5f42-4031-a41f-fdf0c34a1cf0",
    "ritmos": [],
    "ritmos_seleccionados": [
      "bachata_sensual"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "01526a0b-bdf9-4ce9-8b4d-87f035e505d3",
    "ritmos": [],
    "ritmos_seleccionados": [],
    "onboarding_complete": true
  },
  {
    "user_id": "8f106735-b693-4596-8689-e0b7073a4ebe",
    "ritmos": [],
    "ritmos_seleccionados": [],
    "onboarding_complete": true
  },
  {
    "user_id": "3b4fd7f7-4f0a-4f81-af3d-9d8e0046c4cc",
    "ritmos": [],
    "ritmos_seleccionados": [],
    "onboarding_complete": true
  },
  {
    "user_id": "431d36f1-0684-48dd-86ae-2b092e9892cb",
    "ritmos": [],
    "ritmos_seleccionados": [
      "salsa_on1",
      "bachata_sensual",
      "moderna"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "33560ad6-dd46-4039-98ad-23b7b554efbc",
    "ritmos": [],
    "ritmos_seleccionados": [
      "salsa_on1",
      "moderna",
      "salsa_on2",
      "bachata_tradicional",
      "bachata_sensual",
      "zouk",
      "kizomba"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "7e7f959a-8661-4afd-b1d0-f8c5ebaa5592",
    "ritmos": [],
    "ritmos_seleccionados": [
      "salsa_on1",
      "salsa_on2",
      "salsa_casino",
      "bachata_sensual",
      "cumbia",
      "timba"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "a225ed3f-9245-4e27-9ac9-597eae2cc7ac",
    "ritmos": [],
    "ritmos_seleccionados": [
      "salsa_on1",
      "bachata_tradicional",
      "moderna"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "0d112821-1b35-4d7e-9ba0-b6f3018fdfe0",
    "ritmos": [],
    "ritmos_seleccionados": [
      "salsa_on1",
      "moderna",
      "salsa_on2",
      "salsa_casino",
      "bachata_tradicional",
      "bachata_sensual"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "3c216fb8-008d-44c0-b371-b76367ed4abf",
    "ritmos": [],
    "ritmos_seleccionados": [],
    "onboarding_complete": true
  },
  {
    "user_id": "b8dd078c-4fcd-434a-9e8c-4f1265eae89e",
    "ritmos": [],
    "ritmos_seleccionados": [
      "salsa_on1",
      "moderna",
      "bachata_tradicional",
      "bachata_sensual",
      "cumbia",
      "merengue"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "ecac3454-35c0-44da-b630-872f4de3c5cc",
    "ritmos": [],
    "ritmos_seleccionados": [
      "salsa_on1",
      "moderna",
      "salsa_on2",
      "salsa_casino",
      "bachata_tradicional",
      "bachata_sensual",
      "merengue",
      "cumbia",
      "timba"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "501bdfe7-5568-4411-a666-7b17d21face1",
    "ritmos": [
      24,
      25,
      21,
      22,
      23,
      3,
      16,
      17,
      1,
      26,
      12,
      4,
      13,
      14,
      15
    ],
    "ritmos_seleccionados": [
      "reggaeton",
      "chachacha",
      "boogiewoogie",
      "danzon",
      "rockandroll",
      "swing",
      "kizomba",
      "semba",
      "zouk",
      "salsa_on1",
      "salsa_on2",
      "bachata_tradicional",
      "salsa_casino",
      "merengue",
      "bachata_sensual",
      "cumbia",
      "timba"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "70197527-c9f1-4cbf-8190-7698d6f99785",
    "ritmos": [],
    "ritmos_seleccionados": [
      "salsa_on1",
      "moderna",
      "salsa_casino",
      "bachata_sensual",
      "breakdance",
      "hiphop"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "63a5a996-af51-4c8f-a77b-acaa811dce25",
    "ritmos": [
      26,
      4,
      15,
      12
    ],
    "ritmos_seleccionados": [
      "salsa_on2",
      "bachata_tradicional",
      "merengue",
      "timba",
      "salsa_casino"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "e398d678-8e12-419a-83f1-cdfdf9380e5d",
    "ritmos": [],
    "ritmos_seleccionados": [
      "salsa_on1",
      "moderna",
      "salsa_on2",
      "salsa_casino",
      "bachata_tradicional",
      "bachata_sensual",
      "merengue",
      "cumbia"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "48cdf88b-ca0a-40a3-979c-690520a036b8",
    "ritmos": [
      26,
      1
    ],
    "ritmos_seleccionados": [
      "salsa_on2",
      "salsa_on1"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "7408d5af-13c2-4549-9bb5-758d542855b6",
    "ritmos": [
      11
    ],
    "ritmos_seleccionados": [],
    "onboarding_complete": true
  },
  {
    "user_id": "dbed56f4-edeb-4439-8e3d-ce6003d4a91d",
    "ritmos": [
      3,
      13,
      15,
      12,
      14
    ],
    "ritmos_seleccionados": [
      "kizomba",
      "bachata_sensual",
      "timba",
      "salsa_casino",
      "bachata_tradicional",
      "cumbia"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "3eeeb2fc-66e4-4e4d-a7e6-d9901dc47bf9",
    "ritmos": [],
    "ritmos_seleccionados": [
      "salsa_on1",
      "moderna",
      "salsa_on2",
      "salsa_casino",
      "bachata_tradicional",
      "bachata_sensual",
      "merengue",
      "timba"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "08a8fbd6-5496-45f8-8c66-d6bf1b0193b0",
    "ritmos": [
      12,
      13,
      4,
      14,
      21,
      22,
      23,
      24,
      25,
      3
    ],
    "ritmos_seleccionados": [
      "moderna",
      "salsa_casino",
      "bachata_tradicional",
      "bachata_sensual",
      "merengue",
      "cumbia",
      "danzon",
      "rockandroll",
      "swing",
      "chachacha",
      "boogiewoogie",
      "kizomba"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "412dd20b-dd60-43f6-bf90-96a4680b2db3",
    "ritmos": [],
    "ritmos_seleccionados": [
      "salsa_on1",
      "moderna",
      "salsa_on2",
      "salsa_casino",
      "bachata_tradicional",
      "bachata_sensual"
    ],
    "onboarding_complete": true
  },
  {
    "user_id": "0c20805f-519c-4e8e-9081-341ab64e504d",
    "ritmos": [
      13,
      15,
      14,
      2,
      12,
      1
    ],
    "ritmos_seleccionados": [
      "1",
      "bachata_tradicional",
      "bachata_sensual",
      "timba",
      "cumbia",
      "moderna",
      "salsa_casino",
      "salsa_on1"
    ],
    "onboarding_complete": true
  }
]
### 5) Marcas

```sql
-- Verificar columnas de ritmos disponibles en profiles_brand
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles_brand'
  AND column_name ILIKE '%ritmo%'
ORDER BY column_name;
```
[
  {
    "column_name": "ritmos",
    "data_type": "ARRAY",
    "udt_name": "_int8"
  }
]

### 6) classes_parent / classes_session (si existen en tu DB)

```sql
-- Presencia de columnas de ritmo en tablas de clases
SELECT table_name, column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('classes_parent', 'classes_session')
  AND (
    column_name ILIKE '%ritmo%'
    OR column_name ILIKE '%estilo%'
  )
ORDER BY table_name, column_name;
```
Success. No rows returned

### 7) Conteo de uso por contexto (snapshot)

```sql
-- Requiere tener creada rpc_get_used_rhythms_by_context
SELECT 'eventos' AS context, COUNT(*) FROM public.rpc_get_used_rhythms_by_context('eventos')
UNION ALL
SELECT 'clases', COUNT(*) FROM public.rpc_get_used_rhythms_by_context('clases')
UNION ALL
SELECT 'academias', COUNT(*) FROM public.rpc_get_used_rhythms_by_context('academias')
UNION ALL
SELECT 'maestros', COUNT(*) FROM public.rpc_get_used_rhythms_by_context('maestros')
UNION ALL
SELECT 'organizadores', COUNT(*) FROM public.rpc_get_used_rhythms_by_context('organizadores')
UNION ALL
SELECT 'bailarines', COUNT(*) FROM public.rpc_get_used_rhythms_by_context('bailarines')
UNION ALL
SELECT 'marcas', COUNT(*) FROM public.rpc_get_used_rhythms_by_context('marcas');
```
[
  {
    "context": "eventos",
    "count": 9
  },
  {
    "context": "clases",
    "count": 5
  },
  {
    "context": "academias",
    "count": 17
  },
  {
    "context": "maestros",
    "count": 9
  },
  {
    "context": "organizadores",
    "count": 21
  },
  {
    "context": "bailarines",
    "count": 22
  },
  {
    "context": "marcas",
    "count": 0
  }
]
## Hallazgos que explican faltantes/sobrantes

1. **Mezcla de formatos por entidad** (`int[]` + `text[]` + jsonb en cronograma) puede causar desalineacion si una capa solo considera un formato.
2. **Eventos usan doble fuente** (`estilos` y `ritmos_seleccionados`), y sociales pueden arrastrar padres no visibles si no se filtra por fechas publicadas.
3. **Marcas sin columnas de ritmo confirmadas** en este schema generan vacios o errores si la RPC las asume.
4. **Clases en `classes_parent/classes_session` no confirmadas** en migraciones del repo; posible fuente faltante si existen en la DB productiva.
