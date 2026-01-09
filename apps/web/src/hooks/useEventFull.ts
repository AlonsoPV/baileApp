import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { EventParent, EventDate, EventSchedule, EventPrice } from "../types/events";

function mapJsonCronogramaToSchedules(eventDateId: number, cronograma: any[]): EventSchedule[] {
  const rows = Array.isArray(cronograma) ? cronograma : [];
  return rows
    .filter(Boolean)
    .map((it: any) => {
      const tipoRaw = String(it?.tipo || it?.type || 'otro').toLowerCase();
      const tipo: EventSchedule["tipo"] =
        tipoRaw === 'show' ? 'show' :
        tipoRaw === 'social' ? 'social' :
        tipoRaw === 'clase' ? 'clase' :
        'otro';

      return {
        event_date_id: eventDateId,
        tipo,
        titulo: String(it?.titulo || it?.title || '').trim() || 'Actividad',
        descripcion: it?.descripcion || it?.description || undefined,
        hora_inicio: String(it?.inicio || it?.hora_inicio || '').trim(),
        hora_fin: String(it?.fin || it?.hora_fin || '').trim() || undefined,
        ritmo: typeof it?.ritmoId === 'number' ? it.ritmoId : (typeof it?.ritmo === 'number' ? it.ritmo : undefined),
      };
    })
    // Filtrar entradas inválidas
    .filter((s) => !!s.hora_inicio);
}

function mapJsonCostosToPrices(eventDateId: number, costos: any[]): EventPrice[] {
  const rows = Array.isArray(costos) ? costos : [];
  return rows
    .filter(Boolean)
    .map((it: any) => {
      const tipoRaw = String(it?.tipo || it?.type || '').toLowerCase();
      const tipo: EventPrice["tipo"] =
        tipoRaw.includes('taquilla') ? 'taquilla' :
        tipoRaw.includes('preventa') ? 'preventa' :
        (tipoRaw.includes('promo') || tipoRaw.includes('prom')) ? 'promo' :
        // fallback conservador
        'promo';

      const precio = (it?.precio ?? it?.monto ?? it?.price);
      const numPrecio = precio === '' || precio === undefined || precio === null ? undefined : Number(precio);

      // Nota: EventPriceEditor usa `precio` (legacy), mientras que `types/events.ts` define `monto`.
      // Para compatibilidad, llenamos ambos (via cast).
      const out: any = {
        event_date_id: eventDateId,
        tipo,
        nombre: String(it?.nombre || it?.name || '').trim() || 'General',
        descripcion: it?.regla || it?.descripcion || it?.description || undefined,
      };
      if (Number.isFinite(numPrecio)) {
        out.precio = numPrecio;
        out.monto = numPrecio;
      }
      return out as EventPrice;
    })
    .filter((p) => !!p.nombre);
}

export function useEventFullByDateId(eventDateId?: number) {
  return useQuery({
    queryKey: ["event-full", eventDateId],
    enabled: !!eventDateId,
    queryFn: async () => {
      console.log('[useEventFullByDateId] Fetching data for dateId:', eventDateId);
      
      const { data: date, error: e1 } = await supabase
        .from("events_date").select("*").eq("id", eventDateId!).maybeSingle();
      if (e1) {
        console.error('[useEventFullByDateId] Error fetching date:', e1);
        throw e1;
      }
      if (!date) {
        console.log('[useEventFullByDateId] No date found');
        return null;
      }

      const { data: parent, error: e2 } = await supabase
        .from("events_parent").select("*").eq("id", date.parent_id).maybeSingle();
      if (e2) {
        console.error('[useEventFullByDateId] Error fetching parent:', e2);
        throw e2;
      }

      // Nuevo formato: cronograma/costos dentro de events_date (JSON)
      const jsonCrono = Array.isArray((date as any)?.cronograma) ? (date as any).cronograma : [];
      const jsonCostos = Array.isArray((date as any)?.costos) ? (date as any).costos : [];

      let schedules: EventSchedule[] = [];
      let prices: EventPrice[] = [];

      if (jsonCrono.length || jsonCostos.length) {
        schedules = mapJsonCronogramaToSchedules(eventDateId!, jsonCrono);
        prices = mapJsonCostosToPrices(eventDateId!, jsonCostos);
      } else {
        // Fallback legacy: tablas event_schedules / event_prices
        const [{ data: legacySchedules, error: e3 }, { data: legacyPrices, error: e4 }] = await Promise.all([
          supabase.from("event_schedules").select("*").eq("event_date_id", eventDateId!).order("hora_inicio"),
          supabase.from("event_prices").select("*").eq("event_date_id", eventDateId!),
        ]);

        if (e3) {
          console.error('[useEventFullByDateId] Error fetching schedules:', e3);
          throw e3;
        }
        if (e4) {
          console.error('[useEventFullByDateId] Error fetching prices:', e4);
          throw e4;
        }

        schedules = (legacySchedules || []) as EventSchedule[];
        // Ordenar en cliente para soportar esquemas 'precio' vs 'monto'
        prices = ((legacyPrices || []) as any[])
          .sort((a, b) => {
            const pa = (a?.precio ?? a?.monto ?? 0) as number;
            const pb = (b?.precio ?? b?.monto ?? 0) as number;
            return Number(pa) - Number(pb);
          }) as EventPrice[];
      }

      console.log('[useEventFullByDateId] Data loaded successfully:', {
        parent: parent?.nombre,
        date: date.fecha,
        schedulesCount: schedules?.length || 0,
        pricesCount: prices?.length || 0
      });

      return {
        parent: parent as EventParent,
        date: date as EventDate,
        schedules: (schedules || []) as EventSchedule[],
        prices: (prices || []) as EventPrice[],
      };
    }
  });
}

