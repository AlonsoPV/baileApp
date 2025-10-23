-- ============================================
-- CREAR PERFIL DE USUARIO
-- Script para crear perfil del usuario actual
-- ============================================

-- 1) Verificar si ya existe tu perfil
SELECT 
    user_id,
    display_name,
    created_at
FROM public.profiles_user
WHERE user_id = auth.uid();

-- 2) Si no existe, crear perfil básico
INSERT INTO public.profiles_user (
    user_id,
    email,
    display_name,
    bio,
    avatar_url,
    ritmos,
    zonas,
    redes_sociales,
    respuestas,
    media,
    onboarding_complete,
    created_at
) VALUES (
    auth.uid(),
    (SELECT email FROM auth.users WHERE id = auth.uid()),  -- Email del usuario autenticado
    'Tu Nombre',  -- Cambia por tu nombre real
    'Bailarín(a) apasionado(a) por la danza',  -- Cambia por tu bio
    null,  -- Avatar URL (opcional)
    '{}',  -- Array vacío de ritmos
    '{}',  -- Array vacío de zonas
    '{}',  -- JSON vacío de redes sociales
    '{}',  -- JSON vacío de respuestas
    '[]',  -- Array vacío de media
    false,  -- Onboarding no completado
    NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- 3) Verificar que se creó correctamente
SELECT 
    user_id,
    display_name,
    bio,
    ritmos,
    zonas,
    redes_sociales,
    respuestas,
    media,
    onboarding_complete,
    created_at
FROM public.profiles_user
WHERE user_id = auth.uid();

-- 4) Opcional: Agregar redes sociales de ejemplo
UPDATE public.profiles_user 
SET redes_sociales = '{
    "instagram": "https://instagram.com/tu_usuario",
    "tiktok": "https://tiktok.com/@tu_usuario", 
    "youtube": "https://youtube.com/@tu_canal"
}'::jsonb
WHERE user_id = auth.uid();

-- 5) Opcional: Agregar algunos ritmos y zonas (usa IDs reales de tu tabla tags)
UPDATE public.profiles_user 
SET ritmos = '{1,2,3}',  -- Cambia por IDs reales de ritmos
    zonas = '{1,2}'      -- Cambia por IDs reales de zonas
WHERE user_id = auth.uid();

-- 6) Verificar resultado final
SELECT 
    user_id,
    display_name,
    bio,
    ritmos,
    zonas,
    redes_sociales,
    onboarding_complete
FROM public.profiles_user
WHERE user_id = auth.uid();

-- ============================================
-- INSTRUCCIONES
-- ============================================
/*
1. Ejecuta este script completo
2. Cambia "Tu Nombre" por tu nombre real
3. Cambia las URLs de redes sociales por las tuyas
4. Cambia los IDs de ritmos y zonas por los reales de tu tabla tags
5. Después de ejecutar, recarga la página del perfil
6. Deberías ver todos los datos aparecer
*/
