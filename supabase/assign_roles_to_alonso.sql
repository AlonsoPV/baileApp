-- ============================================
-- ASIGNAR TODOS LOS ROLES A ALONSO
-- ============================================
-- Usuario: 39555d3a-68fa-4bbe-b35e-c12756477285
-- Email: alpeva96@gmail.com
-- ============================================

-- 1. Verificar que existen todos los roles en la tabla roles
DO $$
BEGIN
  -- Insertar roles si no existen
  INSERT INTO public.roles (slug, name, description)
  VALUES 
    ('superadmin', 'Super Admin', 'Administrador con acceso total al sistema'),
    ('usuario', 'Usuario', 'Usuario regular de la plataforma'),
    ('organizador', 'Organizador', 'Organiza eventos sociales'),
    ('academia', 'Academia', 'Academia de baile'),
    ('maestro', 'Maestro', 'Maestro de baile'),
    ('marca', 'Marca', 'Marca comercial')
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;
  
  RAISE NOTICE '✅ Roles verificados/creados en tabla roles';
END $$;

-- 2. Asignar todos los roles al usuario correcto
DO $$
DECLARE
  v_user_id uuid := '39555d3a-68fa-4bbe-b35e-c12756477285';
  v_role_slug text;
  v_roles text[] := ARRAY['superadmin', 'usuario', 'organizador', 'academia', 'maestro', 'marca'];
BEGIN
  FOREACH v_role_slug IN ARRAY v_roles
  LOOP
    -- Insertar el rol si no existe para este usuario
    INSERT INTO public.user_roles (user_id, role_slug)
    VALUES (v_user_id, v_role_slug)
    ON CONFLICT (user_id, role_slug) DO NOTHING;
    
    RAISE NOTICE '✅ Rol % asignado al usuario', v_role_slug;
  END LOOP;
  
  RAISE NOTICE '🎉 Todos los roles asignados correctamente a Alonso';
END $$;

-- 3. Verificar los roles asignados
SELECT 
  ur.user_id,
  ur.role_slug,
  r.name as role_name,
  ur.created_at,
  '✅' as estado
FROM public.user_roles ur
LEFT JOIN public.roles r ON r.slug = ur.role_slug
WHERE ur.user_id = '39555d3a-68fa-4bbe-b35e-c12756477285'
ORDER BY ur.created_at DESC;

-- 4. Verificar perfiles existentes
SELECT 
  'profiles_user' as tabla,
  CASE WHEN EXISTS (SELECT 1 FROM profiles_user WHERE user_id = '39555d3a-68fa-4bbe-b35e-c12756477285') THEN '✅ Existe' ELSE '❌ No existe' END as estado
UNION ALL
SELECT 
  'profiles_organizer' as tabla,
  CASE WHEN EXISTS (SELECT 1 FROM profiles_organizer WHERE user_id = '39555d3a-68fa-4bbe-b35e-c12756477285') THEN '✅ Existe' ELSE '❌ No existe' END as estado
UNION ALL
SELECT 
  'profiles_academy' as tabla,
  CASE WHEN EXISTS (SELECT 1 FROM profiles_academy WHERE user_id = '39555d3a-68fa-4bbe-b35e-c12756477285') THEN '✅ Existe' ELSE '❌ No existe' END as estado
UNION ALL
SELECT 
  'profiles_teacher' as tabla,
  CASE WHEN EXISTS (SELECT 1 FROM profiles_teacher WHERE user_id = '39555d3a-68fa-4bbe-b35e-c12756477285') THEN '✅ Existe' ELSE '❌ No existe' END as estado
UNION ALL
SELECT 
  'profiles_brand' as tabla,
  CASE WHEN EXISTS (SELECT 1 FROM profiles_brand WHERE user_id = '39555d3a-68fa-4bbe-b35e-c12756477285') THEN '✅ Existe' ELSE '❌ No existe' END as estado;

-- 5. Aprobar solicitudes de roles pendientes (si existen)
UPDATE public.role_requests
SET 
  status = 'approved',
  reviewed_by = '39555d3a-68fa-4bbe-b35e-c12756477285',
  reviewed_at = now(),
  updated_at = now()
WHERE user_id = '39555d3a-68fa-4bbe-b35e-c12756477285'
  AND status = 'pending';

-- 6. Resultado final
SELECT 
  '🎉 PROCESO COMPLETADO - ALONSO ES SUPERADMIN' as mensaje,
  COUNT(*) as total_roles
FROM public.user_roles
WHERE user_id = '39555d3a-68fa-4bbe-b35e-c12756477285';

-- 7. OPCIONAL: Eliminar roles del usuario duplicado (si quieres limpiar)
/*
DELETE FROM public.user_roles 
WHERE user_id = '00000000-0000-0000-0000-000000000001';

RAISE NOTICE '🧹 Roles del usuario duplicado eliminados';
*/

