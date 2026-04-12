import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { normalizeEventsForCards } from "@/utils/normalizeEventsForCards";

/**
 * Próximos eventos públicos con flyer para el mockup del hero.
 * Usa la vista v_events_dates_public (organizadores aprobados, fecha futura).
 */
export function useHeroEvents() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data, error } = await supabase
          .from("v_events_dates_public")
          .select("*")
          .not("flyer_url", "is", null)
          .order("fecha", { ascending: true })
          .limit(12);

        if (cancelled) return;

        if (error || !data?.length) {
          setItems([]);
          setLoading(false);
          return;
        }

        const normalized = normalizeEventsForCards(data, []);
        const withFlyer = normalized.filter((e) => e.__ui?.flyerUrl);
        setItems(withFlyer.slice(0, 5));
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { items, loading };
}
