import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '@/contexts/AuthProvider';

export type RatingValue = 'excelente' | 'muy_bueno' | 'bueno' | 'regular' | 'no_aplica';

export interface AcademyRating {
  id: number;
  academy_id: number;
  user_id: string;
  overall_rating: RatingValue;
  puntualidad?: RatingValue | null;
  instalaciones?: RatingValue | null;
  atencion_staff?: RatingValue | null;
  organizacion?: RatingValue | null;
  precio_valor?: RatingValue | null;
  created_at: string;
  updated_at: string;
}

export interface AcademyRatingStats {
  overall: {
    excelente: number;
    muy_bueno: number;
    bueno: number;
    regular: number;
    no_aplica: number;
    total: number;
  };
  puntualidad: {
    excelente: number;
    muy_bueno: number;
    bueno: number;
    regular: number;
    no_aplica: number;
    total: number;
  };
  instalaciones: {
    excelente: number;
    muy_bueno: number;
    bueno: number;
    regular: number;
    no_aplica: number;
    total: number;
  };
  atencion_staff: {
    excelente: number;
    muy_bueno: number;
    bueno: number;
    regular: number;
    no_aplica: number;
    total: number;
  };
  organizacion: {
    excelente: number;
    muy_bueno: number;
    bueno: number;
    regular: number;
    no_aplica: number;
    total: number;
  };
  precio_valor: {
    excelente: number;
    muy_bueno: number;
    bueno: number;
    regular: number;
    no_aplica: number;
    total: number;
  };
}

export interface CreateRatingInput {
  academy_id: number;
  overall_rating: RatingValue;
  puntualidad?: RatingValue | null;
  instalaciones?: RatingValue | null;
  atencion_staff?: RatingValue | null;
  organizacion?: RatingValue | null;
  precio_valor?: RatingValue | null;
}

// Función helper para verificar si es un error 406
function is406Error(error: any): boolean {
  if (!error) return false;
  
  // Verificar diferentes formas en que puede venir el error 406
  const errorString = JSON.stringify(error).toLowerCase();
  const status = error.status || error.statusCode || error.code;
  const message = error.message || error.msg || '';
  
  return (
    status === 406 ||
    status === '406' ||
    errorString.includes('406') ||
    message.includes('406') ||
    message.includes('not acceptable') ||
    error.code === '406' ||
    error.code === 'PGRST406'
  );
}

// Obtener estadísticas de calificaciones de una academia
export function useAcademyRatingStats(academyId?: number) {
  return useQuery({
    queryKey: ['academy-ratings-stats', academyId],
    queryFn: async () => {
      if (!academyId) return null;

      try {
        const { data, error } = await supabase.rpc('get_academy_rating_average', {
          academy_id_param: academyId,
        });

        if (error) {
          // Si la función no existe o hay error 406, calcular manualmente
          // No mostrar error 406 en consola (tabla puede no existir)
          if (is406Error(error)) {
            return await calculateStatsManually(academyId);
          }
          // Solo mostrar otros errores
          if (error.code && !is406Error(error)) {
            console.error('[useAcademyRatingStats] Error en RPC:', error);
          }
          // Intentar calcular manualmente como fallback
          return await calculateStatsManually(academyId);
        }

        return data as AcademyRatingStats;
      } catch (err: any) {
        // Capturar errores de red o otros errores inesperados
        if (is406Error(err)) {
          return await calculateStatsManually(academyId);
        }
        // Solo mostrar otros errores inesperados
        if (!is406Error(err)) {
          console.error('[useAcademyRatingStats] Error inesperado:', err);
        }
        // Intentar calcular manualmente como fallback
        return await calculateStatsManually(academyId);
      }
    },
    enabled: !!academyId,
    retry: false, // No reintentar para evitar spam de errores
    refetchOnWindowFocus: false, // No refetch al enfocar ventana
    refetchOnMount: false, // No refetch al montar si ya hay datos
    throwOnError: false, // Suprimir errores en la consola del navegador
  });
}

// Calcular estadísticas manualmente (fallback)
async function calculateStatsManually(academyId: number): Promise<AcademyRatingStats> {
  try {
    const { data, error } = await supabase
      .from('academy_ratings')
      .select('*')
      .eq('academy_id', academyId);

    if (error) {
      // Silenciar errores 406 (tabla no existe o problema de RLS)
      if (is406Error(error)) {
        return getEmptyStats();
      }
      // Solo mostrar otros errores
      if (error.code && !is406Error(error)) {
        console.error('[calculateStatsManually] Error:', error);
      }
      return getEmptyStats();
    }

    const ratings = data || [];

    const stats: AcademyRatingStats = {
      overall: { excelente: 0, muy_bueno: 0, bueno: 0, regular: 0, no_aplica: 0, total: 0 },
      puntualidad: { excelente: 0, muy_bueno: 0, bueno: 0, regular: 0, no_aplica: 0, total: 0 },
      instalaciones: { excelente: 0, muy_bueno: 0, bueno: 0, regular: 0, no_aplica: 0, total: 0 },
      atencion_staff: { excelente: 0, muy_bueno: 0, bueno: 0, regular: 0, no_aplica: 0, total: 0 },
      organizacion: { excelente: 0, muy_bueno: 0, bueno: 0, regular: 0, no_aplica: 0, total: 0 },
      precio_valor: { excelente: 0, muy_bueno: 0, bueno: 0, regular: 0, no_aplica: 0, total: 0 },
    };

    ratings.forEach((rating) => {
      // Overall
      if (rating.overall_rating) {
        stats.overall[rating.overall_rating as RatingValue]++;
        stats.overall.total++;
      }

      // Puntualidad
      if (rating.puntualidad) {
        stats.puntualidad[rating.puntualidad as RatingValue]++;
        stats.puntualidad.total++;
      }

      // Instalaciones
      if (rating.instalaciones) {
        stats.instalaciones[rating.instalaciones as RatingValue]++;
        stats.instalaciones.total++;
      }

      // Atención staff
      if (rating.atencion_staff) {
        stats.atencion_staff[rating.atencion_staff as RatingValue]++;
        stats.atencion_staff.total++;
      }

      // Organización
      if (rating.organizacion) {
        stats.organizacion[rating.organizacion as RatingValue]++;
        stats.organizacion.total++;
      }

      // Precio-valor
      if (rating.precio_valor) {
        stats.precio_valor[rating.precio_valor as RatingValue]++;
        stats.precio_valor.total++;
      }
    });

    return stats;
  } catch (err: any) {
    // Capturar errores de red o otros errores inesperados
    // Silenciar errores 406 (tabla no existe o problema de RLS)
    if (is406Error(err)) {
      return getEmptyStats();
    }
    // Solo mostrar otros errores inesperados
    if (!is406Error(err)) {
      console.error('[calculateStatsManually] Error inesperado:', err);
    }
    return getEmptyStats();
  }
}

function getEmptyStats(): AcademyRatingStats {
  return {
    overall: { excelente: 0, muy_bueno: 0, bueno: 0, regular: 0, no_aplica: 0, total: 0 },
    puntualidad: { excelente: 0, muy_bueno: 0, bueno: 0, regular: 0, no_aplica: 0, total: 0 },
    instalaciones: { excelente: 0, muy_bueno: 0, bueno: 0, regular: 0, no_aplica: 0, total: 0 },
    atencion_staff: { excelente: 0, muy_bueno: 0, bueno: 0, regular: 0, no_aplica: 0, total: 0 },
    organizacion: { excelente: 0, muy_bueno: 0, bueno: 0, regular: 0, no_aplica: 0, total: 0 },
    precio_valor: { excelente: 0, muy_bueno: 0, bueno: 0, regular: 0, no_aplica: 0, total: 0 },
  };
}

// Obtener la calificación del usuario actual para una academia
export function useMyAcademyRating(academyId?: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['academy-rating-mine', academyId, user?.id],
    queryFn: async () => {
      if (!academyId || !user?.id) return null;

      try {
        const { data, error } = await supabase
          .from('academy_ratings')
          .select('*')
          .eq('academy_id', academyId)
          .eq('user_id', user.id)
          .maybeSingle(); // Usar maybeSingle() en lugar de single() para evitar errores 406

        if (error) {
          // Error 406 = Not Acceptable (tabla no existe o problema de RLS)
          // Silenciar el error - puede ser que la tabla no exista aún o no haya permisos
          if (is406Error(error)) {
            // No mostrar el error en consola - es esperado si la tabla no existe
            return null;
          }
          
          // Solo mostrar otros errores inesperados (no 406)
          console.error('[useMyAcademyRating] Error inesperado:', error);
          return null;
        }

        return data as AcademyRating | null;
      } catch (err: any) {
        // Capturar errores de red o otros errores inesperados
        // Silenciar errores 406 (tabla no existe o problema de RLS)
        if (is406Error(err)) {
          // No mostrar el error en consola - es esperado si la tabla no existe
          return null;
        }
        // Solo mostrar otros errores inesperados (no 406)
        console.error('[useMyAcademyRating] Error inesperado:', err);
        return null;
      }
    },
    enabled: !!academyId && !!user?.id,
    retry: false, // No reintentar para evitar spam de errores
    refetchOnWindowFocus: false, // No refetch al enfocar ventana para evitar errores repetidos
    refetchOnMount: false, // No refetch al montar si ya hay datos
    throwOnError: false, // Suprimir errores en la consola del navegador
    // Suprimir errores de red en consola para errores 406
    meta: {
      suppressErrorLogging: true, // Prevenir que React Query loguee errores 406
    },
  });
}

// Crear o actualizar calificación
export function useUpsertAcademyRating() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRatingInput) => {
      if (!user?.id) {
        throw new Error('Usuario no autenticado');
      }

      const { data, error } = await supabase
        .from('academy_ratings')
        .upsert(
          {
            ...input,
            user_id: user.id,
          },
          {
            onConflict: 'academy_id,user_id',
          }
        )
        .select()
        .single();

      if (error) {
        console.error('[useUpsertAcademyRating] Error:', error);
        throw error;
      }

      return data as AcademyRating;
    },
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['academy-ratings-stats', data.academy_id] });
      queryClient.invalidateQueries({ queryKey: ['academy-rating-mine', data.academy_id] });
    },
  });
}

// Calcular promedio numérico de una categoría
export function calculateAverage(stats: { excelente: number; muy_bueno: number; bueno: number; regular: number; no_aplica: number; total: number }): number | null {
  if (stats.total === 0) return null;

  // Ponderación: Excelente=5, Muy bueno=4, Bueno=3, Regular=2, No aplica=0 (no cuenta)
  const total = stats.excelente * 5 + stats.muy_bueno * 4 + stats.bueno * 3 + stats.regular * 2;
  const count = stats.excelente + stats.muy_bueno + stats.bueno + stats.regular;

  if (count === 0) return null;

  return total / count;
}

// Obtener emoji y texto de calificación
export function getRatingDisplay(rating: RatingValue): { emoji: string; label: string } {
  const map: Record<RatingValue, { emoji: string; label: string }> = {
    excelente: { emoji: '⭐', label: 'Excelente' },
    muy_bueno: { emoji: '👍', label: 'Muy bueno' },
    bueno: { emoji: '🙂', label: 'Bueno' },
    regular: { emoji: '😐', label: 'Regular' },
    no_aplica: { emoji: '❌', label: 'No aplica' },
  };

  return map[rating];
}

