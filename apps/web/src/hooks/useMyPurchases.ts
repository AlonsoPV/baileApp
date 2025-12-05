import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthProvider';

export type PurchaseKind = 'clase' | 'evento';

export interface PurchaseItem {
  id: string;
  kind: PurchaseKind;
  createdAt: string;
  date?: string | null;
  title: string;
  academyName?: string | null;
  teacherName?: string | null;
  organizerName?: string | null;
  amountMxn?: number | null;
}

export function useMyPurchases() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['purchases', 'me', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<PurchaseItem[]> => {
      if (!user?.id) return [];

      // 1) Compras de CLASES (clase_asistencias con status = 'pagado')
      const { data: classRows, error: classError } = await supabase
        .from('clase_asistencias')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pagado')
        .order('created_at', { ascending: false });

      if (classError) {
        console.error('[useMyPurchases] Error cargando clase_asistencias:', classError);
        throw classError;
      }

      const academyIds = Array.from(
        new Set(
          (classRows || [])
            .map((r: any) => r.academy_id)
            .filter((v: any) => typeof v === 'number' && !Number.isNaN(v)),
        ),
      ) as number[];

      const teacherIds = Array.from(
        new Set(
          (classRows || [])
            .map((r: any) => r.teacher_id)
            .filter((v: any) => typeof v === 'number' && !Number.isNaN(v)),
        ),
      ) as number[];

      let academiesById: Record<number, { nombre_publico?: string | null }> = {};
      let teachersById: Record<number, { nombre_publico?: string | null }> = {};

      if (academyIds.length) {
        const { data, error } = await supabase
          .from('profiles_academy')
          .select('id,nombre_publico')
          .in('id', academyIds);
        if (error) {
          console.warn('[useMyPurchases] Error cargando profiles_academy para compras:', error);
        } else if (data) {
          academiesById = Object.fromEntries(
            data.map((a: any) => [a.id, { nombre_publico: a.nombre_publico }]),
          );
        }
      }

      if (teacherIds.length) {
        const { data, error } = await supabase
          .from('profiles_teacher')
          .select('id,nombre_publico')
          .in('id', teacherIds);
        if (error) {
          console.warn('[useMyPurchases] Error cargando profiles_teacher para compras:', error);
        } else if (data) {
          teachersById = Object.fromEntries(
            data.map((t: any) => [t.id, { nombre_publico: t.nombre_publico }]),
          );
        }
      }

      const classPurchases: PurchaseItem[] = (classRows || []).map((row: any) => {
        const academy = row.academy_id ? academiesById[row.academy_id] : null;
        const teacher = row.teacher_id ? teachersById[row.teacher_id] : null;

        // Usar fecha específica si existe, si no, created_at
        const date =
          row.fecha_especifica ||
          row.created_at ||
          null;

        return {
          id: `class-${row.id}`,
          kind: 'clase',
          createdAt: row.created_at,
          date,
          title: 'Clase reservada',
          academyName: academy?.nombre_publico || null,
          teacherName: teacher?.nombre_publico || null,
          amountMxn: null, // En el futuro se puede rellenar con el monto exacto desde Stripe o una columna dedicada
        };
      });

      // 2) Compras de EVENTOS (event_rsvp con status = 'pagado')
      const { data: eventRows, error: eventError } = await supabase
        .from('event_rsvp')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pagado')
        .order('created_at', { ascending: false });

      if (eventError) {
        console.error('[useMyPurchases] Error cargando event_rsvp:', eventError);
        throw eventError;
      }

      const dateIds = Array.from(
        new Set(
          (eventRows || [])
            .map((r: any) => r.event_date_id)
            .filter((v: any) => typeof v === 'number' && !Number.isNaN(v)),
        ),
      ) as number[];

      let datesById: Record<number, any> = {};
      let parentsById: Record<number, any> = {};

      if (dateIds.length) {
        const { data: dates, error: datesError } = await supabase
          .from('events_date')
          .select('*')
          .in('id', dateIds);

        if (datesError) {
          console.error('[useMyPurchases] Error cargando events_date:', datesError);
          throw datesError;
        }

        if (dates && dates.length) {
          datesById = Object.fromEntries(dates.map((d: any) => [d.id, d]));

          const parentIds = Array.from(
            new Set(
              dates
                .map((d: any) => d.parent_id)
                .filter((v: any) => typeof v === 'number' && !Number.isNaN(v)),
            ),
          ) as number[];

          if (parentIds.length) {
            const { data: parents, error: parentsError } = await supabase
              .from('events_parent')
              .select('id,nombre')
              .in('id', parentIds);

            if (parentsError) {
              console.error('[useMyPurchases] Error cargando events_parent:', parentsError);
              throw parentsError;
            }

            if (parents) {
              parentsById = Object.fromEntries(parents.map((p: any) => [p.id, p]));
            }
          }
        }
      }

      const eventPurchases: PurchaseItem[] = (eventRows || [])
        .map((row: any) => {
          const date = datesById[row.event_date_id];
          const parent = date ? parentsById[date.parent_id] : null;

          if (!date || !parent) return null;

          const eventDate = date.fecha || date.start_date || row.created_at || null;

          return {
            id: `event-${row.id}`,
            kind: 'evento',
            createdAt: row.created_at,
            date: eventDate,
            title: parent.nombre || 'Evento',
            organizerName: null, // Se puede rellenar en el futuro con profiles_organizer si se requiere
            amountMxn: null,
          } as PurchaseItem;
        })
        .filter(Boolean) as PurchaseItem[];

      // 3) Combinar y ordenar por fecha de creación (más reciente primero)
      const all = [...classPurchases, ...eventPurchases];

      return all.sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      });
    },
  });
}


