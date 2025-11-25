-- ========================================
-- ➕ Add new zone tags: "CDMX Poniente" and "CDMX Oriente"
-- This migration inserts two new zone entries into public.tags.
-- It uses ON CONFLICT DO NOTHING to avoid errors if they already exist.
-- ========================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tags') THEN
    RAISE EXCEPTION 'Table public.tags does not exist. Ensure base schema/migrations are applied before this migration.';
  END IF;
END $$;

INSERT INTO public.tags (id, nombre, tipo, slug)
VALUES
  (27, 'CDMX Poniente', 'zona', 'cdmx-poniente'),
  (28, 'CDMX Oriente',  'zona', 'cdmx-oriente')
ON CONFLICT (id) DO NOTHING;

-- Optional: verify inserts
SELECT id, nombre, tipo, slug
FROM public.tags
WHERE tipo = 'zona' AND nombre IN ('CDMX Poniente', 'CDMX Oriente')
ORDER BY id;


