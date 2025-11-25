-- ========================================
-- 🔧 FIX: Corregir roles de miembros en competition_group_members
-- ========================================
-- Cambiar rol 'teacher' a 'student' para usuarios que no tienen perfil de maestro aprobado

-- 0. Crear una versión segura de set_updated_at que verifique si la columna existe
-- Esto previene errores cuando se usa en tablas sin updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Verificar si la tabla tiene la columna updated_at antes de intentar actualizarla
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = TG_TABLE_SCHEMA 
      AND table_name = TG_TABLE_NAME 
      AND column_name = 'updated_at'
  ) THEN
    NEW.updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

-- 1. Eliminar TODOS los triggers de competition_group_members que puedan causar problemas
-- (Esta tabla no tiene columna updated_at, solo joined_at)
DO $$
DECLARE
  trigger_record RECORD;
BEGIN
  -- Obtener todos los triggers de competition_group_members
  FOR trigger_record IN 
    SELECT trigger_name 
    FROM information_schema.triggers
    WHERE event_object_table = 'competition_group_members'
      AND event_object_schema = 'public'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.competition_group_members', trigger_record.trigger_name);
    RAISE NOTICE 'Trigger eliminado: %', trigger_record.trigger_name;
  END LOOP;
  
  RAISE NOTICE 'Todos los triggers de competition_group_members han sido eliminados';
END $$;

-- 2. Actualizar miembros que tienen rol 'teacher' pero no tienen perfil de maestro aprobado
UPDATE public.competition_group_members cgm
SET role = 'student'
WHERE cgm.role = 'teacher'
  AND NOT EXISTS (
    SELECT 1
    FROM public.profiles_teacher pt
    WHERE pt.user_id = cgm.user_id
      AND pt.estado_aprobacion = 'aprobado'
  );

-- Verificar cambios: mostrar miembros que fueron corregidos
SELECT 
  cgm.id,
  cgm.user_id,
  cgm.group_id,
  cgm.role,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.profiles_teacher pt 
      WHERE pt.user_id = cgm.user_id AND pt.estado_aprobacion = 'aprobado'
    ) THEN '✅ Tiene perfil maestro'
    ELSE '❌ Sin perfil maestro aprobado'
  END as tiene_perfil_maestro
FROM public.competition_group_members cgm
WHERE cgm.role = 'teacher'
ORDER BY cgm.joined_at DESC;

-- Mostrar distribución de roles después de la corrección
SELECT 
  role,
  COUNT(*) as total
FROM public.competition_group_members
WHERE is_active = true
GROUP BY role
ORDER BY role;

