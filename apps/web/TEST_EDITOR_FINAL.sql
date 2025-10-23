-- ============================================
-- TEST: Editor Final
-- Script para probar la funcionalidad completa del editor
-- ============================================

-- 1) Verificar perfil actual
SELECT 
    user_id,
    email,
    display_name,
    respuestas,
    jsonb_array_length(COALESCE(media, '[]'::jsonb)) as total_media
FROM public.profiles_user
WHERE user_id = auth.uid();

-- 2) Limpiar datos existentes (opcional)
-- UPDATE public.profiles_user 
-- SET respuestas = '{}'::jsonb, media = '[]'::jsonb
-- WHERE user_id = auth.uid();

-- 3) Agregar respuestas de ejemplo
UPDATE public.profiles_user 
SET respuestas = COALESCE(respuestas, '{}'::jsonb) || '{
    "dato_curioso": "Soy capaz de bailar salsa con los ojos cerrados y nunca me pierdo el ritmo. ¡Es mi superpoder secreto!",
    "gusta_bailar": "Me encanta bailar bachata porque me permite expresar toda mi pasión y conexión con la música. Es como si mi cuerpo hablara a través del movimiento."
}'::jsonb
WHERE user_id = auth.uid();

-- 4) Agregar fotos de ejemplo en slots específicos
UPDATE public.profiles_user 
SET media = COALESCE(media, '[]'::jsonb) || '[
    {
        "slot": "p1",
        "kind": "photo",
        "url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
        "title": "Foto principal"
    },
    {
        "slot": "p2", 
        "kind": "photo",
        "url": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
        "title": "Foto personal"
    },
    {
        "slot": "p3",
        "kind": "photo", 
        "url": "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&h=300&fit=crop",
        "title": "Foto de baile"
    },
    {
        "slot": "p4",
        "kind": "photo",
        "url": "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=300&fit=crop",
        "title": "Foto carrusel 1"
    },
    {
        "slot": "p5",
        "kind": "photo",
        "url": "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=300&fit=crop",
        "title": "Foto carrusel 2"
    },
    {
        "slot": "p6",
        "kind": "photo",
        "url": "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=300&fit=crop",
        "title": "Foto carrusel 3"
    }
]'::jsonb
WHERE user_id = auth.uid();

-- 5) Verificar resultado final
SELECT 
    user_id,
    display_name,
    respuestas->>'dato_curioso' as dato_curioso,
    respuestas->>'gusta_bailar' as gusta_bailar,
    jsonb_array_length(COALESCE(media, '[]'::jsonb)) as total_media,
    -- Verificar que existen las fotos en los slots correctos
    (SELECT COUNT(*) FROM jsonb_array_elements(media) WHERE value->>'slot' = 'p1') as foto_principal,
    (SELECT COUNT(*) FROM jsonb_array_elements(media) WHERE value->>'slot' = 'p2') as foto_personal,
    (SELECT COUNT(*) FROM jsonb_array_elements(media) WHERE value->>'slot' = 'p3') as foto_baile,
    (SELECT COUNT(*) FROM jsonb_array_elements(media) WHERE value->>'slot' IN ('p4','p5','p6')) as fotos_carrusel
FROM public.profiles_user
WHERE user_id = auth.uid();

-- 6) Mostrar todas las fotos por slot
SELECT 
    value->>'slot' as slot,
    value->>'title' as titulo,
    value->>'url' as url
FROM public.profiles_user,
     jsonb_array_elements(media)
WHERE user_id = auth.uid()
ORDER BY value->>'slot';
