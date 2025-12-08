import { UseQueryResult, UseInfiniteQueryResult } from '@tanstack/react-query';

/**
 * Hook de utilidad para manejar loading states inteligentes
 * Diferencia entre first load (isLoading) y refetch (isFetching)
 * Soporta tanto useQuery como useInfiniteQuery
 */
export function useSmartLoading<TData, TError>(
  query: UseQueryResult<TData, TError> | UseInfiniteQueryResult<TData, TError>
) {
  const { data, isLoading, isFetching, error } = query;

  // Para infinite queries, verificar si hay páginas con data
  const hasData = query && 'pages' in query
    ? !!(query as UseInfiniteQueryResult<TData, TError>).data?.pages?.some(page => (page as any)?.data?.length > 0)
    : !!data;

  // First load: no hay data y está cargando
  const isFirstLoad = isLoading && !hasData;

  // Refetch: hay data pero está actualizando
  const isRefetching = isFetching && hasData;

  return {
    isFirstLoad,
    isRefetching,
    hasData,
    isLoading,
    isFetching,
    data,
    error,
  };
}

export default useSmartLoading;

