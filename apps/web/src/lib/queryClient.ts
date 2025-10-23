import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,       // 5 minutos - datos se consideran "frescos"
      retry: 1,                        // Solo 1 reintento en caso de error
      refetchOnWindowFocus: false,     // No refetch al cambiar de ventana
      refetchOnReconnect: false,       // No refetch al reconectar internet
      refetchOnMount: false,           // No refetch al montar componente si hay datos en cache
    },
  },
});

