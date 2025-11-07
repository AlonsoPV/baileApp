-- ============================================================================
-- VERIFICAR SISTEMA RSVP EN PRODUCCIÓN
-- ============================================================================

-- 1. Verificar si existe la tabla event_rsvps
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'event_rsvps'
) as tabla_event_rsvps_existe;

-- 2. Ver estructura de event_rsvps (si existe)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'event_rsvps'
ORDER BY ordinal_position;

-- 3. Verificar si existe la columna rsvp_interesado_count en events_date
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'events_date'
  AND column_name = 'rsvp_interesado_count';

-- 4. Verificar si existe la columna eventos_interesados en profiles_user
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles_user'
  AND column_name = 'eventos_interesados';

-- 5. Ver funciones RPC relacionadas con RSVP
SELECT proname, proargnames
FROM pg_proc
WHERE proname LIKE '%rsvp%'
ORDER BY proname;

-- 6. Ver triggers relacionados con RSVP
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%rsvp%'
ORDER BY event_object_table, trigger_name;

-- 7. Ver políticas RLS de event_rsvps (si existe)
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'event_rsvps'
ORDER BY policyname;

