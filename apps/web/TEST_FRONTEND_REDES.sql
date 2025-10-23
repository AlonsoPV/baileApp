-- ============================================
-- TEST: Simular Actualización desde Frontend
-- Script para probar exactamente lo que hace la app
-- ============================================

-- 1) Verificar perfil actual
SELECT 
    user_id,
    email,
    display_name,
    redes_sociales,
    created_at
FROM public.profiles_user
WHERE user_id = auth.uid();

-- 2) Simular exactamente lo que hace useUserProfile
-- Esto es lo que ejecuta la app cuando guardas redes sociales
SELECT merge_profiles_user(
    auth.uid(),
    '{
        "redes_sociales": {
            "instagram": "https://instagram.com/mi_usuario_real",
            "tiktok": "https://tiktok.com/@mi_usuario_real", 
            "youtube": "https://youtube.com/@mi_canal_real",
            "facebook": "https://facebook.com/mi_perfil_real",
            "whatsapp": "+1234567890"
        }
    }'::jsonb
);

-- 3) Verificar que se actualizó correctamente
SELECT 
    user_id,
    redes_sociales,
    redes_sociales->>'instagram' as instagram,
    redes_sociales->>'tiktok' as tiktok,
    redes_sociales->>'youtube' as youtube,
    redes_sociales->>'facebook' as facebook,
    redes_sociales->>'whatsapp' as whatsapp
FROM public.profiles_user
WHERE user_id = auth.uid();

-- 4) También probar actualización de otros campos
SELECT merge_profiles_user(
    auth.uid(),
    '{
        "display_name": "Mi Nombre Real",
        "bio": "Bailarín apasionado por la danza",
        "redes_sociales": {
            "instagram": "https://instagram.com/mi_usuario_real",
            "tiktok": "https://tiktok.com/@mi_usuario_real", 
            "youtube": "https://youtube.com/@mi_canal_real"
        }
    }'::jsonb
);

-- 5) Verificar resultado final
SELECT 
    user_id,
    email,
    display_name,
    bio,
    redes_sociales,
    redes_sociales->>'instagram' as instagram,
    redes_sociales->>'tiktok' as tiktok,
    redes_sociales->>'youtube' as youtube
FROM public.profiles_user
WHERE user_id = auth.uid();
