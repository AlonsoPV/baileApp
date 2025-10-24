import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';

// Hook para obtener precios de un evento
export function useEventPrices(eventId: number) {
  return useQuery({
    queryKey: ['event-prices', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_prices')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!eventId
  });
}

// Hook para crear un precio
export function useCreatePrice() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (priceData: any) => {
      const { data, error } = await supabase
        .rpc('create_event_price_full', {
          p_event_id: priceData.event_id,
          p_nombre: priceData.nombre,
          p_descripcion: priceData.descripcion || null,
          p_precio: priceData.precio,
          p_moneda: priceData.moneda || 'USD',
          p_tipo: priceData.tipo || 'general',
          p_limite_cantidad: priceData.limite_cantidad || null,
          p_fecha_inicio: priceData.fecha_inicio || null,
          p_fecha_fin: priceData.fecha_fin || null,
          p_activo: priceData.activo !== undefined ? priceData.activo : true
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-prices'] });
    },
    onError: (error: any) => {
      showToast('Error al crear precio', 'error');
      console.error('Error creating price:', error);
    }
  });
}

// Hook para actualizar un precio
export function useUpdatePrice() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async ({ id, patch }: { id: number; patch: any }) => {
      const { data, error } = await supabase
        .rpc('update_event_price', {
          p_price_id: id,
          p_patch: patch
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-prices'] });
    },
    onError: (error: any) => {
      showToast('Error al actualizar precio', 'error');
      console.error('Error updating price:', error);
    }
  });
}

// Hook para eliminar un precio
export function useDeletePrice() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (priceId: number) => {
      const { error } = await supabase
        .rpc('delete_event_price', {
          p_price_id: priceId
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-prices'] });
    },
    onError: (error: any) => {
      showToast('Error al eliminar precio', 'error');
      console.error('Error deleting price:', error);
    }
  });
}