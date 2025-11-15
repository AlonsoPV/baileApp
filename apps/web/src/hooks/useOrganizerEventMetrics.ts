import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

type RolCounts = {
  leader: number;
  follower: number;
  ambos: number;
  otros: number;
};

export type ZonaMetric = {
  zona_tag_id: number | null;
  zona_nombre: string;
  count: number;
};

export type RitmoMetric = {
  ritmo_tag_id: number | null;
  ritmo_nombre: string;
  count: number;
};

export type FechaMetric = {
  event_date_id: number;
  parent_id: number | null;
  nombre: string;
  fecha: string | null;
  totalRsvps: number;
  porRol: RolCounts;
  zonas: ZonaMetric[];
  ritmos: RitmoMetric[];
};

export type GlobalFechaMetrics = {
  totalRsvps: number;
  porRol: RolCounts;
  zonas: ZonaMetric[];
  ritmos: RitmoMetric[];
};

export function useOrganizerEventMetrics(organizerId?: number) {
  const query = useQuery({
    queryKey: ["organizer-event-metrics", organizerId],
    enabled: !!organizerId,
    queryFn: async () => {
      if (!organizerId) {
        return {
          global: null as GlobalFechaMetrics | null,
          porFecha: [] as FechaMetric[],
        };
      }

      // Espera una función RPC en Supabase: get_organizer_event_metrics(p_organizer_id)
      const { data, error } = await supabase.rpc(
        "get_organizer_event_metrics",
        { p_organizer_id: organizerId }
      );

      if (error) {
        console.error("[useOrganizerEventMetrics] Error RPC:", error);
        throw error;
      }

      const rows = (data || []) as any[];

      const emptyRol: RolCounts = {
        leader: 0,
        follower: 0,
        ambos: 0,
        otros: 0,
      };

      const global: GlobalFechaMetrics = {
        totalRsvps: 0,
        porRol: { ...emptyRol },
        zonas: [],
        ritmos: [],
      };

      const porFecha: FechaMetric[] = rows.map((row) => {
        const total = Number(row.total_rsvps ?? row.totalRsvps ?? 0);
        const porRolRaw = row.por_rol || row.porRol || {};
        const zonasRaw = row.zonas || [];
        const ritmosRaw = row.ritmos || [];

        const porRol: RolCounts = {
          leader: Number(porRolRaw.leader) || 0,
          follower: Number(porRolRaw.follower) || 0,
          ambos: Number(porRolRaw.ambos) || 0,
          otros: Number(porRolRaw.otros) || 0,
        };

        global.totalRsvps += total;
        global.porRol.leader += porRol.leader;
        global.porRol.follower += porRol.follower;
        global.porRol.ambos += porRol.ambos;
        global.porRol.otros += porRol.otros;

        const zonas: ZonaMetric[] = Array.isArray(zonasRaw)
          ? zonasRaw.map((z: any) => ({
              zona_tag_id: typeof z.zona_tag_id === "number" ? z.zona_tag_id : null,
              zona_nombre: String(z.zona_nombre ?? z.nombre ?? ""),
              count: Number(z.count ?? z.total ?? 0),
            }))
          : [];

        const ritmos: RitmoMetric[] = Array.isArray(ritmosRaw)
          ? ritmosRaw.map((r: any) => ({
              ritmo_tag_id:
                typeof r.ritmo_tag_id === "number"
                  ? r.ritmo_tag_id
                  : typeof r.tag_id === "number"
                  ? r.tag_id
                  : null,
              ritmo_nombre: String(r.ritmo_nombre ?? r.nombre ?? ""),
              count: Number(r.count ?? r.total ?? 0),
            }))
          : [];

        return {
          event_date_id: Number(row.event_date_id ?? row.id),
          parent_id:
            typeof row.parent_id === "number" ? row.parent_id : null,
          nombre: String(
            row.nombre_fecha ?? row.nombre ?? row.date_name ?? "Fecha sin nombre"
          ),
          fecha: row.fecha ?? row.fecha_evento ?? null,
          totalRsvps: total,
          porRol,
          zonas,
          ritmos,
        };
      });

      // Agregados globales de zonas y ritmos
      const zonasMap = new Map<number | null, ZonaMetric>();
      const ritmosMap = new Map<number | null, RitmoMetric>();

      porFecha.forEach((f) => {
        f.zonas.forEach((z) => {
          const key = z.zona_tag_id;
          const prev = zonasMap.get(key) || {
            zona_tag_id: key,
            zona_nombre: z.zona_nombre,
            count: 0,
          };
          prev.count += z.count;
          zonasMap.set(key, prev);
        });
        f.ritmos.forEach((r) => {
          const key = r.ritmo_tag_id;
          const prev = ritmosMap.get(key) || {
            ritmo_tag_id: key,
            ritmo_nombre: r.ritmo_nombre,
            count: 0,
          };
          prev.count += r.count;
          ritmosMap.set(key, prev);
        });
      });

      global.zonas = Array.from(zonasMap.values()).sort(
        (a, b) => b.count - a.count
      );
      global.ritmos = Array.from(ritmosMap.values()).sort(
        (a, b) => b.count - a.count
      );

      return { global, porFecha };
    },
    refetchInterval: 3000,
    staleTime: 0,
    gcTime: 0,
  });

  return {
    global: query.data?.global || null,
    porFecha: query.data?.porFecha || [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}


