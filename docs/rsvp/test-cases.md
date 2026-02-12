# Casos de prueba RSVP – Eventos (específicos, frecuentes, recurrentes)

## Resumen de validación

| Caso | Resultado esperado | Estado |
|------|--------------------|--------|
| A) Evento específico – RSVP ON | Aparece en perfil / Mis RSVPs | [ ] Ejecutar |
| A) Evento específico – RSVP OFF | Desaparece del perfil | [ ] Ejecutar |
| A) Evento específico – Pasó fecha | No se muestra en perfil | [ ] Ejecutar |
| B) Evento frecuente – RSVP por instancia | Solo la instancia RSVP aparece; al pasar fecha desaparece | [ ] Ejecutar |
| C) Evento recurrente – Comportamiento | Ver sección C abajo | [ ] Ejecutar |

---

## A) Evento específico (una sola fecha)

### A1) RSVP ON → aparece en perfil

1. Iniciar sesión.
2. Ir a un evento con fecha futura (ej. `/social/fecha/:dateId`).
3. Hacer clic en "Me interesa" (RSVP ON).
4. Ir a `/profile/user` o `/me/rsvps`.
5. **Esperado:** El evento aparece en la sección "Eventos de Interés" / "Mis RSVPs".

### A2) RSVP OFF (cancelar) → desaparece del perfil

1. Con RSVP ON en un evento.
2. Volver al detalle del evento y hacer clic en "Ya no me interesa" (RSVP OFF).
3. Ir a `/profile/user` o `/me/rsvps`.
4. **Esperado:** El evento ya no aparece.

### A3) Pasó la fecha → no se muestra en perfil

**Opción 1 – Mock de tiempo (si existe):**

1. Si hay helper de "now" o mock de tiempo, usarlo para simular fecha posterior al evento.
2. Ir a perfil / Mis RSVPs.
3. **Esperado:** El evento no aparece.

**Opción 2 – Evento de prueba con fecha pasada:**

1. Crear un evento de prueba con fecha pasada (ej. ayer).
2. Hacer RSVP a ese evento (si se permite).
3. Ir a perfil / Mis RSVPs.
4. **Esperado:** El evento no aparece (filtro `fecha >= today`).

**Nota:** La lógica `isAvailableEventDate` usa `dt >= today`; los eventos de hoy sí se muestran.

---

## B) Evento frecuente (varias instancias)

1. Identificar un evento padre con varias fechas (múltiples filas en `events_date`).
2. Hacer RSVP a **una** instancia específica (entrar a `/social/fecha/:dateId` de esa instancia).
3. **Esperado:** Solo esa instancia aparece en perfil / Mis RSVPs.
4. Simular que pasó la fecha de esa instancia (evento de prueba con fecha pasada).
5. **Esperado:** La instancia desaparece del perfil; las demás instancias no se ven si no hay RSVP en ellas.

---

## C) Evento recurrente (serie)

**Diseño actual (documentado en flow-map.md):**

- RSVP es **por instancia** (`event_date_id`).
- Cada instancia recurrente es una fila en `events_date` con `fecha` concreta.
- `dia_semana` es metadato (0–6); puede usarse para marcar "serie semanal".

### Comportamiento esperado

- **C1 – RSVP por ocurrencia:** RSVP a la ocurrencia del 15/Feb → solo esa aparece. Al pasar el 15/Feb, desaparece.
- **C2 – RSVP al evento “padre”:** No existe en el modelo actual. RSVP siempre es por instancia.

### Caso a validar

1. Evento recurrente con varias fechas (ej. sábados 15/Feb, 22/Feb, 1/Mar).
2. Hacer RSVP a la instancia del 15/Feb.
3. **Esperado:** Solo el 15/Feb aparece en perfil.
4. Después del 15/Feb: **Esperado:** No aparece (filtro `fecha >= today`).

### Observación sobre `dia_semana` (corregido)

- La lógica `isAvailableEventDate` **prioriza la fecha**: si existe `fecha`, se comprueba `fecha >= today`.
- Solo cuando **no hay fecha** y sí hay `dia_semana`, se mantiene visible (slot recurrente sin fecha específica).

---

## D) Validaciones adicionales

### D1) Cache / invalidación

- RSVP ON → ir a perfil sin recargar. **Esperado:** Aparece (React Query invalida `["rsvp", "user-events"]`).
- RSVP OFF → ir a perfil sin recargar. **Esperado:** Desaparece.

### D2) Perfil público vs propio (corregido)

- Perfil propio (`/profile/user`): usa `useUserRSVPEvents`, se invalida correctamente.
- Perfil público (`/u/:id`): usa `['user-rsvps', userId]`, **ahora se invalida** al hacer RSVP (fix aplicado en useUpdateRSVP/useRemoveRSVP).

### D3) Duplicados

- Tap rápido múltiple en "Me interesa". **Esperado:** UN solo registro (constraint UNIQUE en `event_rsvp`).

### D4) Timezone

- `get_event_rsvp_stats` usa `NOW() AT TIME ZONE 'America/Mexico_City'`.
- Filtro cliente usa `new Date()` local del navegador. **Validar** que eventos "de hoy" se muestren correctamente según zona horaria del usuario.

---

## Criterios de "NO CAMBIAR NADA"

Si todo lo siguiente se cumple en pruebas manuales:

- RSVP ON/OFF funciona en evento específico.
- Perfil / Mis RSVPs muestran RSVPs vigentes.
- RSVPs pasados no se muestran (por `isAvailableEventDate`).
- Recurrentes/frecuentes tienen comportamiento consistente con el diseño (RSVP por instancia).
- No se viola la regla "no mostrar pasados".

Entonces: **no hacer cambios**, solo entregar esta documentación.

---

## Cambios aplicados (validación)

1. **`UserPublicScreen` – invalidación:** Añadido `queryClient.invalidateQueries({ queryKey: ["user-rsvps"] })` en `useUpdateRSVP` y `useRemoveRSVP`.
2. **`isAvailableEventDate` – dia_semana vs fecha:** Corregido para priorizar `fecha` cuando existe. Solo cuando no hay fecha se usa `dia_semana` como fallback. Así las instancias recurrentes con fecha pasada ya no se muestran.
