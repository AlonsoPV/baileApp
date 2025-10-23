-- =====================================================
-- FIX: Corregir tipos de datos en funciones RSVP
-- =====================================================
-- Este script corrige los tipos de datos de INTEGER a BIGINT
-- para que coincidan con los IDs de events_date

-- A) Recrear función get_event_rsvp_stats con BIGINT
DROP FUNCTION IF EXISTS public.get_event_rsvp_stats(INTEGER);
CREATE OR REPLACE FUNCTION public.get_event_rsvp_stats(event_id BIGINT)
RETURNS TABLE (
    total_asistire INTEGER,
    total_interesado INTEGER,
    total_no_asistire INTEGER,
    total_rsvp INTEGER
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT 
        COUNT(*) FILTER (WHERE status = 'asistire')::INTEGER as total_asistire,
        COUNT(*) FILTER (WHERE status = 'interesado')::INTEGER as total_interesado,
        COUNT(*) FILTER (WHERE status = 'no_asistire')::INTEGER as total_no_asistire,
        COUNT(*)::INTEGER as total_rsvp
    FROM public.event_rsvp 
    WHERE event_date_id = event_id;
$$;

-- B) Recrear función get_user_rsvp_status con BIGINT
DROP FUNCTION IF EXISTS public.get_user_rsvp_status(INTEGER);
CREATE OR REPLACE FUNCTION public.get_user_rsvp_status(event_id BIGINT)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT status 
    FROM public.event_rsvp 
    WHERE event_date_id = event_id 
    AND user_id = auth.uid();
$$;

-- C) Recrear función upsert_event_rsvp con BIGINT
DROP FUNCTION IF EXISTS public.upsert_event_rsvp(INTEGER, TEXT);
CREATE OR REPLACE FUNCTION public.upsert_event_rsvp(
    p_event_date_id BIGINT,
    p_status TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    -- Validar que el status sea válido
    IF p_status NOT IN ('asistire', 'interesado', 'no_asistire') THEN
        RETURN json_build_object('error', 'Status inválido');
    END IF;
    
    -- Upsert del RSVP
    INSERT INTO public.event_rsvp (user_id, event_date_id, status)
    VALUES (auth.uid(), p_event_date_id, p_status)
    ON CONFLICT (user_id, event_date_id)
    DO UPDATE SET 
        status = EXCLUDED.status,
        updated_at = NOW();
    
    -- Obtener estadísticas actualizadas
    SELECT json_build_object(
        'success', true,
        'user_status', p_status,
        'stats', json_build_object(
            'asistire', stats.total_asistire,
            'interesado', stats.total_interesado,
            'no_asistire', stats.total_no_asistire,
            'total', stats.total_rsvp
        )
    ) INTO result
    FROM public.get_event_rsvp_stats(p_event_date_id) stats;
    
    RETURN result;
END;
$$;

-- D) Recrear función delete_event_rsvp con BIGINT
DROP FUNCTION IF EXISTS public.delete_event_rsvp(INTEGER);
CREATE OR REPLACE FUNCTION public.delete_event_rsvp(p_event_date_id BIGINT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    -- Eliminar RSVP del usuario
    DELETE FROM public.event_rsvp 
    WHERE user_id = auth.uid() 
    AND event_date_id = p_event_date_id;
    
    -- Obtener estadísticas actualizadas
    SELECT json_build_object(
        'success', true,
        'user_status', null,
        'stats', json_build_object(
            'asistire', stats.total_asistire,
            'interesado', stats.total_interesado,
            'no_asistire', stats.total_no_asistire,
            'total', stats.total_rsvp
        )
    ) INTO result
    FROM public.get_event_rsvp_stats(p_event_date_id) stats;
    
    RETURN result;
END;
$$;

-- E) Actualizar permisos para las nuevas funciones
GRANT EXECUTE ON FUNCTION public.get_event_rsvp_stats(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_rsvp_status(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_event_rsvp(BIGINT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_event_rsvp(BIGINT) TO authenticated;

-- F) Recrear la vista events_with_rsvp_stats
DROP VIEW IF EXISTS public.events_with_rsvp_stats;
CREATE OR REPLACE VIEW public.events_with_rsvp_stats AS
SELECT 
    e.*,
    COALESCE(rsvp_stats.total_asistire, 0) as rsvp_asistire,
    COALESCE(rsvp_stats.total_interesado, 0) as rsvp_interesado,
    COALESCE(rsvp_stats.total_no_asistire, 0) as rsvp_no_asistire,
    COALESCE(rsvp_stats.total_rsvp, 0) as rsvp_total
FROM public.events_live e
LEFT JOIN LATERAL (
    SELECT * FROM public.get_event_rsvp_stats(e.id)
) rsvp_stats ON true;

-- G) Permisos para la vista
GRANT SELECT ON public.events_with_rsvp_stats TO authenticated;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Verificar que las funciones se crearon correctamente
SELECT 
    'Función get_event_rsvp_stats' as elemento,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_event_rsvp_stats' AND data_type = 'bigint') 
         THEN '✅ Corregida (BIGINT)' 
         ELSE '❌ Error' 
    END as estado
UNION ALL
SELECT 
    'Función get_user_rsvp_status' as elemento,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_user_rsvp_status' AND data_type = 'bigint') 
         THEN '✅ Corregida (BIGINT)' 
         ELSE '❌ Error' 
    END as estado
UNION ALL
SELECT 
    'Función upsert_event_rsvp' as elemento,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'upsert_event_rsvp') 
         THEN '✅ Corregida (BIGINT)' 
         ELSE '❌ Error' 
    END as estado
UNION ALL
SELECT 
    'Función delete_event_rsvp' as elemento,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'delete_event_rsvp') 
         THEN '✅ Corregida (BIGINT)' 
         ELSE '❌ Error' 
    END as estado
UNION ALL
SELECT 
    'Vista events_with_rsvp_stats' as elemento,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'events_with_rsvp_stats') 
         THEN '✅ Recreada' 
         ELSE '❌ Error' 
    END as estado;
