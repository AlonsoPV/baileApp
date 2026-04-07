-- =============================================================================
-- Migración: costos legacy (tipo/monto/nombre/precio) → formato nuevo (phases)
-- =============================================================================
-- Contexto:
--   Legacy: array de objetos sin clave "phases", p. ej.
--     [{"tipo":"preventa","monto":130,"nombre":"Preventa","precio":130,"descripcion":""}, ...]
--   Nuevo: un tablero con id/name/type/amount/currency/description y phases[] (name = 'Dorada').
--
-- Estrategia:
--   - Cada array legacy completo se convierte en UN solo costo con N fases (orden preservado).
--   - Si el primer elemento ya tiene "phases", la fila NO se modifica.
--   - amount del costo padre = precio de la primera fase (alineado con el editor web).
--   - type del costo padre = 'taquilla' (como en datos nuevos de ejemplo).
--
-- Uso:
--   1) Revisar filas candidatas con la consulta de preview al final.
--   2) Ejecutar el bloque UPDATE (ajustar WHERE si solo quieres ciertos ids).
--   3) Opcional: DROP FUNCTION al terminar.
--
-- Ejecutar en Supabase SQL Editor (revisar en staging antes que en producción).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.migrate_event_costos_legacy_to_phased(p_costos jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  out_phases jsonb := '[]'::jsonb;
  elem jsonb;
  i int;
  n int;
  cost_id text;
  phase_id text;
  monto numeric;
  tipo_raw text;
  nombre text;
  descr text;
  is_final boolean;
  amount_first numeric;
  tipo_elem text;
BEGIN
  IF p_costos IS NULL OR jsonb_typeof(p_costos) <> 'array' OR jsonb_array_length(p_costos) = 0 THEN
    RETURN COALESCE(p_costos, '[]'::jsonb);
  END IF;

  -- Ya está en formato nuevo (tiene phases en el primer elemento).
  IF (p_costos->0) ? 'phases' THEN
    RETURN p_costos;
  END IF;

  cost_id :=
    'cost_'
    || (floor(extract(epoch FROM clock_timestamp()) * 1000))::bigint
    || '_'
    || substr(md5(random()::text || clock_timestamp()::text), 1, 6);

  n := jsonb_array_length(p_costos);
  FOR i IN 0 .. (n - 1) LOOP
    elem := p_costos->i;

    monto := COALESCE(
      CASE WHEN elem ? 'monto' AND NULLIF(trim(elem->>'monto'), '') IS NOT NULL THEN (trim(elem->>'monto'))::numeric END,
      CASE WHEN elem ? 'precio' AND NULLIF(trim(elem->>'precio'), '') IS NOT NULL THEN (trim(elem->>'precio'))::numeric END,
      0::numeric
    );

    tipo_raw := lower(trim(COALESCE(elem->>'tipo', '')));
    nombre := trim(COALESCE(elem->>'nombre', ''));
    IF nombre = '' THEN
      nombre :=
        CASE tipo_raw
          WHEN 'taquilla' THEN 'Taquilla'
          WHEN 'preventa' THEN 'Preventa'
          WHEN 'promocion' THEN 'Promoción'
          WHEN 'gratis' THEN 'Gratis'
          WHEN 'otro' THEN 'Otro'
          ELSE 'Fase ' || (i + 1)::text
        END;
    END IF;

    descr := nullif(trim(COALESCE(elem->>'descripcion', elem->>'regla', '')), '');
    is_final := (tipo_raw = 'taquilla');
    tipo_elem := COALESCE(elem->>'tipo', 'otro');

    phase_id :=
      'phase_'
      || (floor(extract(epoch FROM clock_timestamp()) * 1000))::bigint
      || '_'
      || i::text
      || '_'
      || substr(md5(random()::text || i::text || clock_timestamp()::text), 1, 6);

    out_phases :=
      out_phases
      || jsonb_build_array(
        jsonb_strip_nulls(
          jsonb_build_object(
            'id', phase_id,
            'name', nombre,
            'type', tipo_elem,
            'order', i + 1,
            'price', monto,
            'isFinal', is_final,
            'description', descr,
            'startDate', NULL::text,
            'endDate', NULL::text
          )
        )
      );
  END LOOP;

  amount_first := COALESCE((out_phases->0->>'price')::numeric, 0);

  RETURN jsonb_build_array(
    jsonb_build_object(
      'id', cost_id,
      'name', 'Dorada',
      'type', 'taquilla',
      'amount', amount_first,
      'currency', 'MXN',
      'description', '',
      'phases', out_phases
    )
  );
END;
$$;

COMMENT ON FUNCTION public.migrate_event_costos_legacy_to_phased(jsonb) IS
  'Convierte un JSONB array de costos legacy (sin phases) a un único costo con phases[]. Idempotente si ya existe phases.';

-- -----------------------------------------------------------------------------
-- Preview: filas que parecen legacy (sin "phases" en el primer elemento)
-- -----------------------------------------------------------------------------
 SELECT
   ed.id,
   ed.nombre,
   ed.costos AS costos_antes,
   public.migrate_event_costos_legacy_to_phased(ed.costos) AS costos_despues
 FROM public.events_date ed
 WHERE
   ed.costos IS NOT NULL
   AND jsonb_typeof(ed.costos) = 'array'
   AND jsonb_array_length(ed.costos) > 0
   AND NOT (ed.costos->0 ? 'phases')
 ORDER BY ed.id
 LIMIT 50;

-- -----------------------------------------------------------------------------
 UPDATE masivo (descomentar cuando el preview sea correcto)
-- -----------------------------------------------------------------------------

UPDATE public.events_date ed
SET
  costos = public.migrate_event_costos_legacy_to_phased(ed.costos),
  updated_at = now()
WHERE
  ed.costos IS NOT NULL
  AND jsonb_typeof(ed.costos) = 'array'
  AND jsonb_array_length(ed.costos) > 0
  AND NOT (ed.costos->0 ? 'phases');


-- -----------------------------------------------------------------------------
-- Ejemplo puntual: solo el JSON legacy que compartiste (pega el id real)
-- -----------------------------------------------------------------------------
/*
UPDATE public.events_date
SET
  costos = public.migrate_event_costos_legacy_to_phased(
    '[
      {"tipo": "preventa", "monto": 130, "nombre": "Preventa", "precio": 130, "descripcion": ""},
      {"tipo": "taquilla", "monto": 150, "nombre": "Taquilla", "precio": 150, "descripcion": "Bedida de cortesía"}
    ]'::jsonb
  ),
  updated_at = now()
WHERE id = 12345;
*/

-- -----------------------------------------------------------------------------
-- Limpieza opcional (después de migrar y validar)
-- -----------------------------------------------------------------------------
-- DROP FUNCTION IF EXISTS public.migrate_event_costos_legacy_to_phased(jsonb);
