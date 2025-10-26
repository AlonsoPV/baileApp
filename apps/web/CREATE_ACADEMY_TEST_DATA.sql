-- Script para crear datos de prueba de academia
-- Ejecutar en Supabase SQL Editor

-- 1. Crear una academia de prueba con estado 'aprobado'
INSERT INTO public.profiles_academy (
  user_id,
  nombre_publico,
  bio,
  avatar_url,
  portada_url,
  estilos,
  ritmos,
  zonas,
  redes_sociales,
  respuestas,
  ubicaciones,
  horarios,
  media,
  estado_aprobacion
) VALUES (
  (SELECT id FROM auth.users LIMIT 1), -- Usar el primer usuario disponible
  'Academia de Baile Moderno',
  'Somos una academia especializada en salsa, bachata y kizomba. Con más de 10 años de experiencia enseñando a bailarines de todos los niveles.',
  'https://via.placeholder.com/150x150/FF3C38/FFFFFF?text=ABM',
  'https://via.placeholder.com/800x400/FF3C38/FFFFFF?text=Academia+de+Baile+Moderno',
  ARRAY[1, 2, 3], -- estilos
  ARRAY[1, 2, 3], -- ritmos
  ARRAY[1, 2], -- zonas
  '{
    "instagram": "https://instagram.com/academiabailemoderno",
    "facebook": "https://facebook.com/academiabailemoderno",
    "whatsapp": "+1234567890",
    "web": "https://academiabailemoderno.com"
  }'::jsonb,
  '{
    "redes": {
      "instagram": "https://instagram.com/academiabailemoderno",
      "facebook": "https://facebook.com/academiabailemoderno",
      "whatsapp": "+1234567890"
    },
    "dato_curioso": "Fundada en 2014",
    "gusta_bailar": "Salsa, Bachata, Kizomba"
  }'::jsonb,
  '[
    {
      "sede": "Sede Principal",
      "direccion": "Calle Principal 123, Colonia Centro",
      "ciudad": "Ciudad de México",
      "zona_id": 1
    },
    {
      "sede": "Sede Norte",
      "direccion": "Avenida Norte 456, Colonia Norte",
      "ciudad": "Ciudad de México",
      "zona_id": 2
    }
  ]'::jsonb,
  '[
    {
      "dia": "Lun",
      "desde": "18:00",
      "hasta": "20:00",
      "ritmo_id": 1
    },
    {
      "dia": "Mie",
      "desde": "19:00",
      "hasta": "21:00",
      "ritmo_id": 2
    },
    {
      "dia": "Vie",
      "desde": "18:30",
      "hasta": "20:30",
      "ritmo_id": 3
    },
    {
      "dia": "Sab",
      "desde": "10:00",
      "hasta": "12:00",
      "ritmo_id": 1
    }
  ]'::jsonb,
  '[
    {
      "type": "image",
      "url": "https://via.placeholder.com/400x300/FF3C38/FFFFFF?text=Clase+de+Salsa"
    },
    {
      "type": "image", 
      "url": "https://via.placeholder.com/400x300/FF8C42/FFFFFF?text=Clase+de+Bachata"
    },
    {
      "type": "video",
      "url": "https://via.placeholder.com/400x300/FFD166/FFFFFF?text=Video+Promocional"
    }
  ]'::jsonb,
  'aprobado'
);

-- 2. Crear otra academia de prueba
INSERT INTO public.profiles_academy (
  user_id,
  nombre_publico,
  bio,
  avatar_url,
  portada_url,
  estilos,
  ritmos,
  zonas,
  redes_sociales,
  respuestas,
  ubicaciones,
  horarios,
  media,
  estado_aprobacion
) VALUES (
  (SELECT id FROM auth.users LIMIT 1), -- Usar el mismo usuario o crear otro
  'Escuela de Danza Contemporánea',
  'Especialistas en danza contemporánea, jazz y ballet. Formamos bailarines profesionales con técnicas modernas y clásicas.',
  'https://via.placeholder.com/150x150/1E88E5/FFFFFF?text=EDC',
  'https://via.placeholder.com/800x400/1E88E5/FFFFFF?text=Escuela+de+Danza+Contemporanea',
  ARRAY[4, 5], -- estilos diferentes
  ARRAY[4, 5], -- ritmos diferentes
  ARRAY[3, 4], -- zonas diferentes
  '{
    "instagram": "https://instagram.com/escueladanzacontemporanea",
    "youtube": "https://youtube.com/escueladanzacontemporanea",
    "web": "https://escueladanzacontemporanea.com"
  }'::jsonb,
  '{
    "redes": {
      "instagram": "https://instagram.com/escueladanzacontemporanea",
      "youtube": "https://youtube.com/escueladanzacontemporanea"
    },
    "dato_curioso": "Más de 500 estudiantes graduados",
    "gusta_bailar": "Danza Contemporánea, Jazz, Ballet"
  }'::jsonb,
  '[
    {
      "sede": "Estudio Principal",
      "direccion": "Calle Artística 789, Colonia Cultural",
      "ciudad": "Ciudad de México",
      "zona_id": 3
    }
  ]'::jsonb,
  '[
    {
      "dia": "Mar",
      "desde": "17:00",
      "hasta": "19:00",
      "ritmo_id": 4
    },
    {
      "dia": "Jue",
      "desde": "18:00",
      "hasta": "20:00",
      "ritmo_id": 5
    },
    {
      "dia": "Sab",
      "desde": "14:00",
      "hasta": "16:00",
      "ritmo_id": 4
    }
  ]'::jsonb,
  '[
    {
      "type": "image",
      "url": "https://via.placeholder.com/400x300/1E88E5/FFFFFF?text=Clase+de+Ballet"
    },
    {
      "type": "image",
      "url": "https://via.placeholder.com/400x300/00BCD4/FFFFFF?text=Clase+de+Jazz"
    }
  ]'::jsonb,
  'aprobado'
);

-- 3. Verificar que las academias se crearon correctamente
SELECT 
  id,
  nombre_publico,
  bio,
  estado_aprobacion,
  created_at
FROM public.profiles_academy
WHERE estado_aprobacion = 'aprobado'
ORDER BY created_at DESC;

-- 4. Verificar la vista pública
SELECT 
  COUNT(*) as total_academies_public
FROM public.v_academies_public;

-- 5. Mostrar academias públicas
SELECT 
  id,
  nombre_publico,
  bio,
  estado_aprobacion,
  created_at
FROM public.v_academies_public
ORDER BY created_at DESC;
