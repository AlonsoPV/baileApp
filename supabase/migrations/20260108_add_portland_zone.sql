-- Agregar zona: Portland (EEUU)
-- Nota: la tabla public.tags no modela jerarquía; el "padre" (EEUU) se refleja en UI vía apps/web/src/lib/zonasCatalog.ts

INSERT INTO public.tags (id, nombre, tipo, slug)
OVERRIDING SYSTEM VALUE
VALUES
  (71, 'Portland', 'zona', 'portland')
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  tipo = EXCLUDED.tipo,
  slug = EXCLUDED.slug;


