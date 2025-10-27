import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';

// Hook para obtener precios de un evento
export function useEventPrices(eventDateId: number) {
  return useQuery({
    queryKey: ['event-prices', eventDateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_prices')
        .select('*')
        .eq('event_date_id', eventDateId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!eventDateId
  });
}

// Hook para crear un precio
export function useCreatePrice() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (priceData: any) => {
      const payload = {
        event_date_id: priceData.event_id ?? priceData.event_date_id,
        nombre: priceData.nombre,
        descripcion: priceData.descripcion ?? null,
        precio: priceData.precio,
        moneda: priceData.moneda ?? 'MXN',
        tipo: priceData.tipo ?? 'general',
        limite_cantidad: priceData.limite_cantidad ?? null,
        fecha_inicio: priceData.fecha_inicio ?? null,
        fecha_fin: priceData.fecha_fin ?? null,
        activo: priceData.activo ?? true,
      };
      const { data, error } = await supabase.from('event_prices').insert(payload).select('*').single();
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
        .from('event_prices')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();
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
      const { error } = await supabase.from('event_prices').delete().eq('id', priceId);
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