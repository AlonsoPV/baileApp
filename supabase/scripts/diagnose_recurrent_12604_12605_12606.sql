-- ============================================================================
-- Diagnóstico: ¿Por qué los eventos 12604, 12605, 12606 no se tratan como recurrentes?
-- ============================================================================
-- En la app, un evento recurrente requiere:
-- 1. dia_semana entre 0 y 6 (0=domingo, 6=sábado).
-- 2. parent_id no nulo: ensure_weekly_occurrences solo se llama por parent_id;
--    si parent_id es NULL, nunca se generan ocurrencias futuras.
-- 3. events_live solo incluye filas con fecha >= CURRENT_DATE; las plantillas
--    con fecha NULL no salen en esa vista (el listado viene de events_date directo).
-- ============================================================================

-- 1) Estado actual de los tres eventos
SELECT
  id,
  parent_id,
  organizer_id,
  dia_semana,
  fecha,
  nombre,
  estado_publicacion,
  hora_inicio,
  hora_fin,
  CASE
    WHEN parent_id IS NULL THEN '❌ Sin parent → no se materializan ocurrencias'
    ELSE '✅ Tiene parent'
  END AS motivo_recurrente,
  CASE
    WHEN dia_semana IS NULL THEN '❌ No recurrente (sin dia_semana)'
    WHEN dia_semana NOT BETWEEN 0 AND 6 THEN '❌ dia_semana inválido (debe ser 0-6)'
    ELSE '✅ dia_semana válido'
  END AS estado_dia_semana
FROM public.events_date
WHERE id IN (12604, 12605, 12606)
ORDER BY id;

[
  {
    "id": 12604,
    "parent_id": null,
    "organizer_id": 14,
    "dia_semana": 4,
    "fecha": "2026-03-12",
    "nombre": "Bachata Feeling MX",
    "estado_publicacion": "publicado",
    "hora_inicio": "19:45:00",
    "hora_fin": "01:30:00",
    "motivo_recurrente": "❌ Sin parent → no se materializan ocurrencias",
    "estado_dia_semana": "✅ dia_semana válido"
  },
  {
    "id": 12605,
    "parent_id": 30,
    "organizer_id": 1,
    "dia_semana": 4,
    "fecha": "2026-03-12",
    "nombre": "BACHATAEAMO SALSATEAMO",
    "estado_publicacion": "publicado",
    "hora_inicio": "19:30:00",
    "hora_fin": "00:00:00",
    "motivo_recurrente": "✅ Tiene parent",
    "estado_dia_semana": "✅ dia_semana válido"
  },
  {
    "id": 12606,
    "parent_id": 30,
    "organizer_id": 1,
    "dia_semana": 3,
    "fecha": "2026-03-11",
    "nombre": "BACHATEAMO Wednesday",
    "estado_publicacion": "publicado",
    "hora_inicio": "19:30:00",
    "hora_fin": "01:00:00",
    "motivo_recurrente": "✅ Tiene parent",
    "estado_dia_semana": "✅ dia_semana válido"
  }
]
-- 2) ¿Existe events_parent para organizer 14? (necesario para asignar parent_id)
SELECT id, organizer_id, nombre, created_at
FROM public.events_parent
WHERE organizer_id = 14
ORDER BY id;

[
  {
    "id": 40,
    "organizer_id": 14,
    "nombre": "Bachata Feeling MX",
    "created_at": "2026-03-07 01:29:52.633081+00"
  }
]
-- 3) ¿Aparecen en events_live? (solo si fecha >= hoy; plantillas con fecha NULL no)
SELECT id, parent_id, nombre, fecha, organizador_id
FROM public.events_live
WHERE id IN (12604, 12605, 12606);

[
  {
    "id": 12604,
    "parent_id": null,
    "nombre": "Bachata Feeling MX",
    "fecha": "2026-03-12",
    "organizador_id": 14
  },
  {
    "id": 12606,
    "parent_id": 30,
    "nombre": "BACHATEAMO Wednesday",
    "fecha": "2026-03-11",
    "organizador_id": 1
  },
  {
    "id": 12605,
    "parent_id": 30,
    "nombre": "BACHATAEAMO SALSATEAMO",
    "fecha": "2026-03-12",
    "organizador_id": 1
  }
]
-- 4) Conteo de ocurrencias futuras por parent (si tuvieran parent_id)
-- Si parent_id es NULL, ensure_weekly_occurrences nunca corre para ellos.
SELECT
  ed.id,
  ed.parent_id,
  ed.dia_semana,
  (SELECT COUNT(*) FROM public.events_date ed2
   WHERE ed2.parent_id = ed.parent_id AND ed2.fecha >= CURRENT_DATE) AS ocurrencias_futuras_con_este_parent
FROM public.events_date ed
WHERE ed.id IN (12604, 12605, 12606);
[
  {
    "id": 12604,
    "parent_id": null,
    "dia_semana": 4,
    "ocurrencias_futuras_con_este_parent": 0
  },
  {
    "id": 12605,
    "parent_id": 30,
    "dia_semana": 4,
    "ocurrencias_futuras_con_este_parent": 184
  },
  {
    "id": 12606,
    "parent_id": 30,
    "dia_semana": 3,
    "ocurrencias_futuras_con_este_parent": 184
  }
]
/*
CONCLUSIÓN TÍPICA:
- Si parent_id es NULL (ej. 12604): la app ahora materializa ocurrencias con
  ensure_weekly_occurrences_orphan(organizer_id); no hace falta asignar parent_id.
- Si parent_id no es NULL (12605, 12606): ensure_weekly_occurrences(parent_id)
  genera hasta 30 fechas futuras; el Explore hace un pre-descubrimiento de todos
  los parent_id recurrentes y ejecuta el RPC para que las ocurrencias existan
  aunque no salgan en la primera página. Las 184 se ven al cargar la página que
  incluye al menos una fila de ese parent o al hacer "cargar más".
- Si dia_semana está fuera de 0-6: corregir a valor válido (0=domingo … 6=sábado).

-- Materializar ocurrencias para 12604 (organizer 14, sin parent) — ejecutar una vez si sigue con una sola:
-- SELECT public.ensure_weekly_occurrences_orphan(14, 30);
*/
