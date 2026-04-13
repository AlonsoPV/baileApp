# Auditoría de WhatsApp por evento

Fecha: 2026-04-13

Nota de alcance: esta auditoría se hizo sobre el repo local. Se revisó esquema SQL versionado, hooks, pantallas de edición y render público. No se validó una base live ni se ejecutaron flujos manuales completos en navegador durante esta auditoría.

## Fuente actual

| nivel | tabla/campo | uso actual | editable | fuente de verdad | observaciones |
|---|---|---|---|---|---|
| fecha específica | `events_date.telefono_contacto` | número de contacto del evento/fecha | sí | sí | Es el único campo explícito de WhatsApp por evento en el esquema. |
| fecha específica | `events_date.mensaje_contacto` | mensaje base para abrir WhatsApp | sí | sí | Se renderiza en detalle público y se edita en formularios de fecha. |
| evento padre | `events_parent` | no existe campo de WhatsApp | no | no | No hay columna dedicada en esquema ni en hooks públicos/privados. |
| organizador | `profiles_organizer.whatsapp_number` | WhatsApp general del organizador | sí | no para evento | Existe como contacto general del organizador, no como dato propio de una fecha. |
| organizador | `profiles_organizer.whatsapp_message_template` | mensaje general del organizador | sí | no para evento | Debe considerarse fallback visual, nunca payload automático de guardado del evento. |
| estado local | `dateForm.telefono_contacto` / `form.telefono_contacto` | edición temporal en pantallas de fecha | sí | no | Aquí estaba el riesgo de arrastre entre formularios si no se reseteaba o si se clonaba desde otra fecha. |

## Hallazgos

1. La fuente de verdad real del WhatsApp de evento ya estaba en `events_date`.
2. No existe un campo equivalente en `events_parent`, así que no hay una capa "por evento padre" persistida hoy.
3. El detalle público leía solo `events_date.telefono_contacto`, pero el organizador sí tiene WhatsApp general disponible en `v_organizers_public`.
4. El mayor riesgo de mezcla no era el schema, sino el frontend:
   - formularios reutilizados de creación de fecha en `OrganizerProfileEditor`
   - clonación implícita desde otra fecha al flujo de "frecuentes"
   - asignación implícita de `parent_id` cuando no se elegía social y el frontend resolvía uno automáticamente

## Decisión de modelo

Fuente de verdad correcta:

- `events_date.telefono_contacto`
- `events_date.mensaje_contacto`

Reglas:

1. El WhatsApp del evento se guarda por fecha específica.
2. `events_parent` no participa como storage porque hoy no tiene campo dedicado.
3. El WhatsApp del organizador puede usarse solo como fallback visual de lectura si la fecha no tiene uno propio.
4. Ese fallback nunca debe escribirse automáticamente al guardar una fecha.

## Flujo auditado

### Lectura pública

- `EventDatePublicScreen` renderiza el CTA de contacto desde la fecha.
- Se corrigió para resolver el contacto en una sola utilidad:
  1. `events_date.telefono_contacto`
  2. `events_parent` solo si en el futuro existe ese campo
  3. `profiles_organizer.whatsapp_number` como fallback visual
  4. vacío

### Edición y guardado

Pantallas auditadas:

- `EventDateEditScreen`
- `OrganizerEventDateEditScreen`
- `OrganizerEventDateCreateScreen`
- `EventDateFullDrawer`
- `EventEditScreen`
- `EventDateEditor`
- `OrganizerProfileEditor`

Correcciones aplicadas:

1. Se centralizó el payload de guardado en `buildEventWhatsappPayload(...)`.
2. El guardado ahora solo toma `telefono_contacto` y `mensaje_contacto` del formulario de la fecha editada.
3. Ya no se usa ningún fallback visual como fuente de escritura.
4. En `OrganizerProfileEditor` se eliminó la asignación implícita a otro `events_parent` al crear fechas.
5. En `OrganizerProfileEditor` la creación de fechas ahora exige elegir explícitamente el social destino.
6. El formulario reusable de creación se resetea al abrir/cerrar y ya no arrastra WhatsApp de una edición previa.
7. El flujo "frecuentes desde una fecha" ya no copia automáticamente el WhatsApp de la fecha origen.

## Helpers centralizados

Archivo nuevo:

- `apps/web/src/utils/eventWhatsapp.ts`

Funciones:

- `getEventWhatsapp(eventDate, eventParent, organizer)`
- `buildEventWhatsappUrl(phone, message, eventName)`
- `buildEventWhatsappPayload(formLike)`
- `normalizeWhatsappPhoneForStorage(value)`
- `normalizeWhatsappPhoneForLink(value)`

Objetivo:

- una sola jerarquía de lectura
- una sola normalización de payload
- evitar que cada componente resuelva distinto el número del evento

## Riesgos detectados y mitigación

### Riesgo 1: mezcla entre sociales distintos

Antes:

- `OrganizerProfileEditor` podía crear fechas sin `selectedParentId`.
- El hook `useCreateEventDate()` resolvía un `parent_id` implícito para el organizador.

Impacto:

- una fecha nueva podía terminar ligada al social equivocado
- el usuario podía interpretar que el WhatsApp “se movió” entre eventos

Mitigación:

- el formulario ahora exige elegir el social explícitamente
- ya no se permite guardar ese flujo sin `selectedParentId`

### Riesgo 2: arrastre entre formularios

Antes:

- el formulario reutilizable de crear fecha persistía valores locales entre aperturas
- el flujo de "frecuentes" copiaba el WhatsApp de otra fecha

Impacto:

- al abrir un nuevo evento podía verse el número de otro

Mitigación:

- reset explícito del formulario reusable
- en flujos derivados ya no se copia el WhatsApp automáticamente

### Riesgo 3: fallback visual usado como escritura

Antes:

- no había helper único; cada pantalla podía armar payloads a mano

Mitigación:

- `buildEventWhatsappPayload(...)` limita la escritura a los campos de la fecha

## Validación de formato

Decisión:

1. Para storage se conserva texto legible y solo se hace `trim`.
2. Para enlaces salientes se normaliza a dígitos con `normalizeWhatsappPhoneForLink`.
3. No se convierten ni destruyen formatos legacy ya guardados.

## Pruebas ejecutadas

Automatizadas:

- `apps/web/src/utils/eventWhatsapp.test.ts`

Cobertura:

1. prioridad del WhatsApp propio de `events_date`
2. fallback visual al organizador sin convertirlo en dato propio del evento
3. construcción del payload de guardado
4. normalización segura para enlaces de WhatsApp

## Pruebas funcionales obligatorias

Estado: checklist documentado. Requiere validación manual en app para cerrar completamente.

### Caso 1 — Eventos distintos

Esperado:

1. editar evento A con WhatsApp A
2. editar evento B con WhatsApp B
3. guardar ambos
4. cada `events_date` conserva su propio `telefono_contacto`

### Caso 2 — Reabrir formularios

Esperado:

1. abrir A
2. abrir B
3. volver a A
4. no aparece el número de B en el formulario de A

### Caso 3 — Render público

Esperado:

1. si A tiene WhatsApp propio, se muestra A
2. si B tiene WhatsApp propio, se muestra B
3. si una fecha no tiene WhatsApp propio y el organizador sí tiene uno general, el render puede usar fallback visual sin persistirlo

### Caso 4 — Fallback

Esperado:

1. evento sin WhatsApp propio
2. se puede resolver contacto visual desde organizador
3. guardar sin tocar el campo no debe escribir ese fallback en `events_date`

### Caso 5 — Crear nuevo evento / nueva fecha

Esperado:

1. el formulario parte limpio
2. no hereda el WhatsApp de otra fecha previamente editada
3. obliga a elegir el social correcto antes de guardar

## Conclusión

La fuente de verdad correcta para evitar mezcla es `events_date`. El bug principal estaba en el frontend: formularios reutilizados y resolución implícita de `parent_id`. La corrección aplicada centraliza lectura/escritura del WhatsApp, evita que el fallback visual se persista y fuerza que cada nueva fecha quede asociada al social correcto.
