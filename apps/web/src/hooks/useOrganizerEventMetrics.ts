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

export type DateFilter = "today" | "this_week" | "this_month" | "all" | "custom";

export type MetricsFilters = {
  dateFilter: DateFilter;
  from?: string;
  to?: string;
};

export type EventRSVPMetric = {
  id: string;
  eventDateId: number;
  eventDateName: string;
  eventDate: string | null;
  userId: string;
  userName: string;
  roleType: "leader" | "follower" | "ambos" | "otro";
  zone?: string;
  createdAt: string;
};

export type EventDateSummary = {
  eventDateId: number;
  eventDateName: string;
  eventDate: string | null;
  totalRsvps: number;
  byRole: Record<string, number>;
  reservations: EventRSVPMetric[];
  reservationsByDate: Map<string, EventRSVPMetric[]>;
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
  byZone: Record<string, number>;
  totalPurchases: number;
};

type OrganizerEventMetricsResult = {
  global: GlobalFechaMetrics | null;
  porFecha: FechaMetric[];
  byDate: EventDateSummary[];
  perRSVP: EventRSVPMetric[];
};

function getDateRange(filter: DateFilter, from?: string, to?: string): { from: string | null; to: string | null } {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  switch (filter) {
    case "today": {
      const today = new Date(now);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return {
        from: today.toISOString().split('T')[0],
        to: tomorrow.toISOString().split('T')[0],
      };
    }
    case "this_week": {
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 7);
      return {
        from: startOfWeek.toISOString().split('T')[0],
        to: endOfWeek.toISOString().split('T')[0],
      };
    }
    case "this_month": {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return {
        from: startOfMonth.toISOString().split('T')[0],
        to: endOfMonth.toISOString().split('T')[0],
      };
    }
    case "custom":
      return {
        from: from || null,
        to: to || null,
      };
    default:
      return { from: null, to: null };
  }
}

export function useOrganizerEventMetrics(organizerId?: number, filters?: MetricsFilters) {
  const dateFilter = filters?.dateFilter || "all";
  const dateRange = getDateRange(dateFilter, filters?.from, filters?.to);
  
  const query = useQuery<OrganizerEventMetricsResult>({
    queryKey: ["organizer-event-metrics", organizerId, filters],
    enabled: !!organizerId,
    queryFn: async () => {
      if (!organizerId) {
        return {
          global: null as GlobalFechaMetrics | null,
          porFecha: [] as FechaMetric[],
          byDate: [] as EventDateSummary[],
          perRSVP: [] as EventRSVPMetric[],
        };
      }

      console.log("[useOrganizerEventMetrics] 🔍 Consultando métricas para organizerId:", organizerId, "filtros:", filters);

      // Obtener todas las fechas del organizador
      // Primero obtener los parent_ids
      const { data: parents, error: parentsError } = await supabase
        .from("events_parent")
        .select("id")
        .eq("organizer_id", organizerId);

      if (parentsError) {
        console.error("[useOrganizerEventMetrics] Error obteniendo eventos padre:", parentsError);
        throw parentsError;
      }

      const parentIds = (parents || []).map((p: any) => p.id);
      if (parentIds.length === 0) {
        return {
          global: {
            totalRsvps: 0,
            porRol: { leader: 0, follower: 0, ambos: 0, otros: 0 },
            zonas: [],
            ritmos: [],
            byZone: {},
            totalPurchases: 0,
          },
          porFecha: [],
          byDate: [],
          perRSVP: [],
        };
      }

      const { data: eventDates, error: datesError } = await supabase
        .from("events_date")
        .select("id, nombre, fecha, parent_id")
        .in("parent_id", parentIds);

      if (datesError) {
        console.error("[useOrganizerEventMetrics] Error obteniendo fechas:", datesError);
        throw datesError;
      }

      const eventDateIds = (eventDates || []).map((ed: any) => ed.id);
      if (eventDateIds.length === 0) {
        return {
          global: {
            totalRsvps: 0,
            porRol: { leader: 0, follower: 0, ambos: 0, otros: 0 },
            zonas: [],
            ritmos: [],
            byZone: {},
            totalPurchases: 0,
          },
          porFecha: [],
          byDate: [],
          perRSVP: [],
        };
      }

      // Obtener todos los RSVPs para estas fechas
      let rsvpQuery = supabase
        .from("event_rsvp")
        .select("id, event_date_id, user_id, created_at")
        .in("event_date_id", eventDateIds)
        .eq("status", "interesado");

      // Aplicar filtros de fecha si existen
      if (dateRange.from) {
        rsvpQuery = rsvpQuery.gte("created_at", `${dateRange.from}T00:00:00.000Z`);
      }
      if (dateRange.to) {
        rsvpQuery = rsvpQuery.lte("created_at", `${dateRange.to}T23:59:59.999Z`);
      }

      const { data: rsvps, error: rsvpError } = await rsvpQuery;

      if (rsvpError) {
        console.error("[useOrganizerEventMetrics] Error obteniendo RSVPs:", rsvpError);
        throw rsvpError;
      }

      const rsvpData = rsvps || [];
      console.log("[useOrganizerEventMetrics] 📊 RSVPs encontrados:", rsvpData.length);

      // Obtener compras (status = 'pagado') para las mismas fechas
      let purchasesQuery = supabase
        .from("event_rsvp")
        .select("id, event_date_id, created_at")
        .in("event_date_id", eventDateIds)
        .eq("status", "pagado");

      if (dateRange.from) {
        purchasesQuery = purchasesQuery.gte("created_at", `${dateRange.from}T00:00:00.000Z`);
      }
      if (dateRange.to) {
        purchasesQuery = purchasesQuery.lte("created_at", `${dateRange.to}T23:59:59.999Z`);
      }

      const { data: purchaseRows, error: purchaseError } = await purchasesQuery;
      if (purchaseError) {
        console.error("[useOrganizerEventMetrics] Error obteniendo compras (event_rsvp):", purchaseError);
      }

      // Obtener información de usuarios
      const userIds = [...new Set(rsvpData.map((r: any) => r.user_id))];
      const userInfoMap = new Map<string, { name: string; role: string; zones: string[] }>();

      if (userIds.length > 0) {
        const { data: userProfiles, error: userError } = await supabase
          .from("profiles_user")
          .select("user_id, display_name, email, rol_baile, zonas")
          .in("user_id", userIds);

        if (userError) {
          console.error("[useOrganizerEventMetrics] Error obteniendo perfiles:", userError);
        }

        (userProfiles || []).forEach((profile: any) => {
          const nombre = profile.display_name?.trim() || profile.email?.split('@')[0]?.trim() || `Usuario ${profile.user_id.substring(0, 8)}`;
          const role = profile.rol_baile || "otro";
          const zones = Array.isArray(profile.zonas) ? profile.zonas : [];
          userInfoMap.set(profile.user_id, { name: nombre, role, zones });
        });

        // Para usuarios no encontrados
        userIds.forEach((id) => {
          if (!userInfoMap.has(id)) {
            userInfoMap.set(id, { name: `Usuario ${id.substring(0, 8)}`, role: "otro", zones: [] });
          }
        });
      }

      // Obtener nombres de zonas
      const zonaInfoMap = new Map<number, string>();
      const allZonaIds = new Set<number>();
      userInfoMap.forEach((info) => {
        info.zones.forEach((z: any) => {
          if (typeof z === 'number') allZonaIds.add(z);
        });
      });

      if (allZonaIds.size > 0) {
        const { data: zonaTags } = await supabase
          .from("tags")
          .select("id, nombre")
          .in("id", Array.from(allZonaIds))
          .eq("tipo", "zona");  // 🔧 FIX: Filtrar solo tags de tipo 'zona' para evitar mezclar con ritmos

        (zonaTags || []).forEach((tag: any) => {
          zonaInfoMap.set(tag.id, tag.nombre);
        });
      }

      // Crear mapa de fechas
      const eventDateMap = new Map<number, { nombre: string; fecha: string | null }>();
      (eventDates || []).forEach((ed: any) => {
        eventDateMap.set(ed.id, { nombre: ed.nombre || "Fecha sin nombre", fecha: ed.fecha });
      });

      // Procesar RSVPs
      const global: GlobalFechaMetrics = {
        totalRsvps: 0,
        porRol: { leader: 0, follower: 0, ambos: 0, otros: 0 },
        zonas: [],
        ritmos: [],
        byZone: {},
        totalPurchases: 0,
      };

      const perRSVP: EventRSVPMetric[] = [];

      rsvpData.forEach((rsvp: any) => {
        const userInfo = userInfoMap.get(rsvp.user_id) || { name: `Usuario ${rsvp.user_id.substring(0, 8)}`, role: "otro", zones: [] };
        
        // Normalizar role
        let normalizedRole: "leader" | "follower" | "ambos" | "otro" = "otro";
        const role = userInfo.role;
        if (role === 'lead' || role === 'leader') normalizedRole = 'leader';
        else if (role === 'follow' || role === 'follower') normalizedRole = 'follower';
        else if (role === 'ambos') normalizedRole = 'ambos';
        else normalizedRole = 'otro';

        // Actualizar métricas globales
        global.totalRsvps += 1;
        global.porRol[normalizedRole] = (global.porRol[normalizedRole] || 0) + 1;

        // Por zona
        userInfo.zones.forEach((zonaId: any) => {
          if (typeof zonaId === 'number' && zonaInfoMap.has(zonaId)) {
            const zonaNombre = zonaInfoMap.get(zonaId)!;
            global.byZone[zonaNombre] = (global.byZone[zonaNombre] || 0) + 1;
          }
        });

        const eventDateInfo = eventDateMap.get(rsvp.event_date_id) || { nombre: "Fecha desconocida", fecha: null };

        // Agregar a perRSVP
        perRSVP.push({
          id: rsvp.id,
          eventDateId: rsvp.event_date_id,
          eventDateName: eventDateInfo.nombre,
          eventDate: eventDateInfo.fecha,
          userId: rsvp.user_id,
          userName: userInfo.name,
          roleType: normalizedRole,
          zone: userInfo.zones.length > 0 && typeof userInfo.zones[0] === 'number' && zonaInfoMap.has(userInfo.zones[0])
            ? zonaInfoMap.get(userInfo.zones[0])!
            : undefined,
          createdAt: rsvp.created_at,
        });
      });

      // Agrupar por fecha de evento
      const byDateMap = new Map<number, EventDateSummary>();

      perRSVP.forEach((rsvp) => {
        const existing = byDateMap.get(rsvp.eventDateId);

        if (existing) {
          existing.totalRsvps += 1;
          existing.byRole[rsvp.roleType] = (existing.byRole[rsvp.roleType] || 0) + 1;
          existing.reservations.push(rsvp);
          
          const fechaKey = rsvp.eventDate || 'sin-fecha';
          if (!existing.reservationsByDate.has(fechaKey)) {
            existing.reservationsByDate.set(fechaKey, []);
          }
          existing.reservationsByDate.get(fechaKey)!.push(rsvp);
        } else {
          const eventDateInfo = eventDateMap.get(rsvp.eventDateId) || { nombre: "Fecha desconocida", fecha: null };
          const reservationsByDate = new Map<string, EventRSVPMetric[]>();
          const fechaKey = rsvp.eventDate || 'sin-fecha';
          reservationsByDate.set(fechaKey, [rsvp]);

          byDateMap.set(rsvp.eventDateId, {
            eventDateId: rsvp.eventDateId,
            eventDateName: eventDateInfo.nombre,
            eventDate: eventDateInfo.fecha,
            totalRsvps: 1,
            byRole: {
              leader: rsvp.roleType === 'leader' ? 1 : 0,
              follower: rsvp.roleType === 'follower' ? 1 : 0,
              ambos: rsvp.roleType === 'ambos' ? 1 : 0,
              otro: rsvp.roleType === 'otro' ? 1 : 0,
            },
            reservations: [rsvp],
            reservationsByDate,
          });
        }
      });

      const byDate = Array.from(byDateMap.values()).sort((a, b) => b.totalRsvps - a.totalRsvps);

      // Procesar compras por fecha (status = 'pagado')
      const purchasesByDateId = new Map<number, number>();
      (purchaseRows || []).forEach((row: any) => {
        const dateId = row.event_date_id as number;
        if (!dateId) return;
        global.totalPurchases += 1;
        purchasesByDateId.set(dateId, (purchasesByDateId.get(dateId) || 0) + 1);
      });

      // Agregar zonas y ritmos globales (simplificado por ahora)
      global.zonas = Object.entries(global.byZone)
        .map(([nombre, count]) => ({ zona_tag_id: null, zona_nombre: nombre, count }))
        .sort((a, b) => b.count - a.count);

      // Mantener compatibilidad con el formato anterior
      const porFecha: FechaMetric[] = byDate.map((summary) => ({
        event_date_id: summary.eventDateId,
        parent_id: null,
        nombre: summary.eventDateName,
        fecha: summary.eventDate,
        totalRsvps: summary.totalRsvps,
        porRol: {
          leader: summary.byRole.leader || 0,
          follower: summary.byRole.follower || 0,
          ambos: summary.byRole.ambos || 0,
          otros: summary.byRole.otro || 0,
        },
        zonas: [],
        ritmos: [],
      }));

      return { global, porFecha, byDate, perRSVP };
    },
    refetchInterval: 5000,
    staleTime: 0,
    gcTime: 0,
  });

  return {
    global: query.data?.global || null,
    porFecha: query.data?.porFecha || [],
    byDate: query.data?.byDate || [],
    perRSVP: query.data?.perRSVP || [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}


