# Audit de compatibilidad backward de costos

## Alcance

Este documento audita los formatos reales de `costos` usados por eventos y define una estrategia de normalizacion para soportar:

- eventos legacy (formato historico)
- eventos nuevos (formato por tipo + fases)

Objetivo: que la UI lea un shape comun normalizado y no el shape crudo de DB.

---

## 1) Formatos reales detectados

### 1.1 Formato legacy (real en datos historicos)

Evidencia:

- `supabase/scripts/update_costos_club_san_luis.sql`
- `supabase/scripts/update_organizer_10_miercoles_costos_cronograma.sql`

Ejemplo real legacy:

```json
[
  {
    "nombre": "Cover",
    "descripcion": "Incluye bebida",
    "tipo": "taquilla",
    "precio": 120,
    "monto": 120
  },
  {
    "nombre": "Mujeres gratis",
    "descripcion": "Hasta las 9:00 pm",
    "tipo": "promocion",
    "precio": 0,
    "monto": 0
  }
]
```

Campos observados en legacy:

- `nombre` (string, opcional)
- `tipo` (string)
- `precio` (number, legacy)
- `monto` (number, variante legacy compatible)
- `descripcion` (string, opcional)
- `regla` (string, legacy alternativo a descripcion)

---

### 1.2 Formato nuevo por tipos/fases (real en frontend)

Evidencia:

- `apps/web/src/types/events.ts` (`EventCost`, `CostPhase`)
- `apps/web/src/components/events/CostsPhasesEditor.tsx`

Ejemplo representativo del formato nuevo:

```json
[
  {
    "id": "cost_abc123",
    "name": "Pulsera general",
    "type": "taquilla",
    "description": "Acceso general",
    "amount": 250,
    "currency": "MXN",
    "phases": [
      {
        "id": "phase_pre_1",
        "name": "Preventa 1",
        "type": "preventa",
        "price": 200,
        "startDate": "2026-03-01",
        "endDate": "2026-03-15",
        "order": 1
      },
      {
        "id": "phase_taq",
        "name": "Taquilla",
        "type": "taquilla",
        "price": 250,
        "order": 2,
        "isFinal": true
      }
    ]
  }
]
```

Campos observados en nuevo:

- `id`, `name`, `type`, `description`, `amount`, `currency`
- `phases[]` con `id`, `name`, `type`, `price`, `startDate`, `endDate`, `order`, `isFinal`

---

## 2) Diferencias exactas entre formatos

## Llaves principales

- legacy usa `nombre`, nuevo usa `name`
- legacy usa `precio/monto`, nuevo usa `amount` y/o `phases[].price`
- legacy no tiene `phases`
- nuevo estructura precios en `phases[]`

## Semantica

- legacy: cada item suele ser un precio "final" de ticket/promocion
- nuevo: cada item representa un tipo de costo con una secuencia de fases

## Campos opcionales y variantes

- descripcion puede llegar como `descripcion` o `regla` en legacy
- precio puede llegar como `precio`, `monto`, `amount`, `price`
- hay registros parcialmente migrados (ej. nuevo sin fases) que deben tolerarse

---

## 3) Punto exacto de ruptura detectado

Componentes con lectura cruda que no soportaban ambos formatos:

- `apps/web/src/screens/events/DateLiveScreen.tsx`
  - renderizaba `date.costos.map(...)` usando `costo.precio`/`costo.tipo`
- `apps/web/src/screens/events/DateLiveScreenModern.tsx`
  - renderizaba `date.costos.map(...)` usando `costo.titulo`/`costo.precio`
- `apps/web/src/components/events/EventInfoGrid.tsx`
  - renderizaba `costo.nombre` + `costo.precio` sin considerar fases

Resultado de la ruptura:

- eventos en formato nuevo quedaban con costo vacio/incorrecto en esas vistas
- eventos historicos y nuevos no compartian una capa de lectura comun en toda la UI

---

## 4) Estrategia de mapeo (normalizacion)

Se implementa helper central:

- `apps/web/src/utils/normalizeEventCosts.ts`
- funcion: `normalizeEventCosts(rawCostsOrEvent)`

Shape normalizado de salida:

```ts
type NormalizedEventCost = {
  id: string;
  name: string;
  description?: string;
  phases: NormalizedCostPhase[];
  sourceFormat: "legacy" | "new";
  type?: string;
};

type NormalizedCostPhase = {
  id: string;
  name: string;
  price: number;
  startDate?: string | null;
  endDate?: string | null;
  isTaquilla?: boolean;
  description?: string;
  order: number;
  type?: string;
};
```

Reglas de mapeo:

1. Detectar formato nuevo si existe `phases` o shape de costo moderno.
2. Detectar legacy en caso contrario.
3. Legacy -> generar un costo con una fase unica.
4. Nuevo -> mapear fases y conservar orden.
5. Tolerar payloads en string JSON y registros semi-migrados (sin fases pero con `amount`).
6. Marcar `sourceFormat` para trazabilidad (`legacy`/`new`).

---

## 5) Migracion segura (sin romper publicados)

- No se altera estructura en DB ni se hace migracion destructiva.
- La compatibilidad se resuelve en lectura (normalizacion).
- Se mantiene render para data historica y data nueva simultaneamente.
- `apps/web/src/utils/eventCosts.ts` se adapta para usar el normalizador central sin romper APIs existentes de utilidades.
