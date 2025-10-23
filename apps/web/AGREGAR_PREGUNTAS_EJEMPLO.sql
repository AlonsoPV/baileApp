-- ============================================
-- AGREGAR PREGUNTAS DE EJEMPLO
-- Script para agregar respuestas de ejemplo
-- ============================================

-- 1) Verificar perfil actual
SELECT 
    user_id,
    email,
    display_name,
    respuestas
FROM public.profiles_user
WHERE user_id = auth.uid();

-- 2) Agregar respuestas de ejemplo
UPDATE public.profiles_user 
SET respuestas = COALESCE(respuestas, '{}'::jsonb) || '{
    "dato_curioso": "Soy capaz de bailar salsa con los ojos cerrados y nunca me pierdo el ritmo. ¡Es mi superpoder secreto!",
    "gusta_bailar": "Me encanta bailar bachata porque me permite expresar toda mi pasión y conexión con la música. Es como si mi cuerpo hablara a través del movimiento."
}'::jsonb
WHERE user_id = auth.uid();

-- 3) Verificar que se agregaron las respuestas
SELECT 
    user_id,
    respuestas->>'dato_curioso' as dato_curioso,
    respuestas->>'gusta_bailar' as gusta_bailar
FROM public.profiles_user
WHERE user_id = auth.uid();

-- 4) También agregar algunas fotos de ejemplo (opcional)
-- Esto simula que tienes fotos en los slots p2 y p3
UPDATE public.profiles_user 
SET media = COALESCE(media, '[]'::jsonb) || '[
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
    }
]'::jsonb
WHERE user_id = auth.uid();

-- 5) Verificar resultado final
SELECT 
    user_id,
    display_name,
    respuestas->>'dato_curioso' as dato_curioso,
    respuestas->>'gusta_bailar' as gusta_bailar,
    jsonb_array_length(COALESCE(media, '[]'::jsonb)) as total_media
FROM public.profiles_user
WHERE user_id = auth.uid();
