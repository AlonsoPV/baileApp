import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthProvider";

export type DateRange = 'hoy' | 'semana' | 'mes' | 'custom' | 'none';

export type UserFilterPreferences = {
  id?: number;
  ritmos: number[];
  zonas: number[];
  date_range: DateRange;
  custom_days?: number | null;
};

export type ProcessedFilters = {
  ritmos: number[];
  zonas: number[];
  fechaDesde: Date | null;
  fechaHasta: Date | null;
};

/**
 * Hook para obtener las preferencias de filtros del usuario
 */
export function useUserFilterPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Obtener preferencias
  const query = useQuery({
    queryKey: ["user-filter-preferences", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("user_filter_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error("[useUserFilterPreferences] Error obteniendo preferencias:", error);
        throw error;
      }

      if (!data) {
        // Si no existe, retornar valores por defecto
        return {
          ritmos: [],
          zonas: [],
          date_range: 'none' as DateRange,
          custom_days: null,
        } as UserFilterPreferences;
      }

      return {
        id: data.id,
        ritmos: (data.ritmos || []) as number[],
        zonas: (data.zonas || []) as number[],
        date_range: (data.date_range || 'none') as DateRange,
        custom_days: data.custom_days || null,
      } as UserFilterPreferences;
    },
  });

  // Guardar preferencias
  const saveMutation = useMutation({
    mutationFn: async (prefs: Omit<UserFilterPreferences, 'id'>) => {
      if (!user?.id) throw new Error("Usuario no autenticado");

      const { data, error } = await supabase
        .from("user_filter_preferences")
        .upsert(
          {
            user_id: user.id,
            ritmos: prefs.ritmos,
            zonas: prefs.zonas,
            date_range: prefs.date_range,
            custom_days: prefs.custom_days || null,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          }
        )
        .select()
        .single();

      if (error) {
        console.error("[useUserFilterPreferences] Error guardando preferencias:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-filter-preferences", user?.id] });
    },
  });

  /**
   * Aplica los filtros predeterminados y retorna filtros procesados
   */
  const applyDefaultFilters = (): ProcessedFilters => {
    const prefs = query.data;
    if (!prefs) {
      return {
        ritmos: [],
        zonas: [],
        fechaDesde: null,
        fechaHasta: null,
      };
    }

    // Calcular fechas según el rango seleccionado
    let fechaDesde: Date | null = null;
    let fechaHasta: Date | null = null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (prefs.date_range) {
      case 'hoy':
        fechaDesde = new Date(today);
        fechaHasta = new Date(today);
        fechaHasta.setHours(23, 59, 59, 999);
        break;

      case 'semana':
        fechaDesde = new Date(today);
        // Obtener el lunes de esta semana
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Ajustar para que lunes sea 1
        fechaDesde.setDate(diff);
        fechaDesde.setHours(0, 0, 0, 0);
        // Hasta el domingo de esta semana
        fechaHasta = new Date(fechaDesde);
        fechaHasta.setDate(fechaHasta.getDate() + 6);
        fechaHasta.setHours(23, 59, 59, 999);
        break;

      case 'mes':
        fechaDesde = new Date(today.getFullYear(), today.getMonth(), 1);
        fechaDesde.setHours(0, 0, 0, 0);
        fechaHasta = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        fechaHasta.setHours(23, 59, 59, 999);
        break;

      case 'custom':
        if (prefs.custom_days && prefs.custom_days > 0) {
          fechaDesde = new Date(today);
          fechaDesde.setHours(0, 0, 0, 0);
          fechaHasta = new Date(today);
          fechaHasta.setDate(fechaHasta.getDate() + prefs.custom_days);
          fechaHasta.setHours(23, 59, 59, 999);
        }
        break;

      case 'none':
      default:
        fechaDesde = null;
        fechaHasta = null;
        break;
    }

    return {
      ritmos: prefs.ritmos || [],
      zonas: prefs.zonas || [],
      fechaDesde,
      fechaHasta,
    };
  };

  return {
    preferences: query.data,
    loading: query.isLoading,
    error: query.error,
    savePreferences: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    applyDefaultFilters,
    refetch: query.refetch,
  };
}

