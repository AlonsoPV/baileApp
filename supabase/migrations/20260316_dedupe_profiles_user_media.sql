-- Optional one-time cleanup: deduplicate profiles_user.media arrays
-- keeping the most recent entry (highest ordinality) per logical media key.

WITH dedup AS (
  SELECT
    p.user_id,
    COALESCE(
      (
        SELECT jsonb_agg(x.elem ORDER BY x.ord)
        FROM (
          SELECT DISTINCT ON (k.dedupe_key)
            e.elem,
            e.ord
          FROM jsonb_array_elements(
            CASE
              WHEN jsonb_typeof(p.media) = 'array' THEN p.media
              ELSE '[]'::jsonb
            END
          ) WITH ORDINALITY AS e(elem, ord)
          CROSS JOIN LATERAL (
            SELECT COALESCE(
              NULLIF(e.elem->>'slot', ''),
              NULLIF(e.elem->>'id', ''),
              NULLIF(e.elem->>'url', ''),
              md5(e.elem::text)
            ) AS dedupe_key
          ) AS k
          ORDER BY k.dedupe_key, e.ord DESC
        ) AS x
      ),
      '[]'::jsonb
    ) AS media_dedup
  FROM public.profiles_user p
),
changed AS (
  SELECT d.user_id, d.media_dedup
  FROM dedup d
  JOIN public.profiles_user p ON p.user_id = d.user_id
  WHERE p.media IS DISTINCT FROM d.media_dedup
)
UPDATE public.profiles_user p
SET media = c.media_dedup,
    updated_at = now()
FROM changed c
WHERE p.user_id = c.user_id;
