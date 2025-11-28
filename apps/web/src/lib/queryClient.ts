import { QueryClient } from '@tanstack/react-query';

/**
 * Configuración global de React Query
 * 
 * Optimizaciones implementadas:
 * - staleTime: 30-60s para datos de lectura frecuente (eventos, academias, clases)
 * - cacheTime: 5 minutos para mantener datos en cache mientras navega
 * - refetchOnMount: false para evitar refetches innecesarios al cambiar de pestañas
 * - refetchOnWindowFocus: false para evitar refetches al cambiar de ventana
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Datos se consideran "frescos" por 30-60 segundos
      // Esto evita refetches innecesarios al cambiar de pestañas
      staleTime: 1000 * 60,            // 1 minuto - datos frescos
      gcTime: 1000 * 60 * 5,           // 5 minutos - tiempo en cache (antes cacheTime)
      retry: 1,                        // Solo 1 reintento en caso de error
      refetchOnWindowFocus: false,     // No refetch al cambiar de ventana
      refetchOnReconnect: false,       // No refetch al reconectar internet
      refetchOnMount: false,           // No refetch al montar componente si hay datos en cache
    },
    mutations: {
      retry: 1,                        // Solo 1 reintento para mutations
    },
  },
});

