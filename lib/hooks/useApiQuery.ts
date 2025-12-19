import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";

/**
 * Custom hook that wraps useQuery for API calls
 *
 * @template TData - The type of data returned by the API
 * @param url - The API endpoint URL to fetch from
 * @param options - Additional useQuery options (excluding queryKey and queryFn)
 * @returns UseQueryResult with the fetched data
 *
 * @example
 * ```tsx
 * // Basic usage
 * const { data, isLoading, error } = useApiQuery<Service[]>('/api/services');
 *
 * // With options
 * const { data } = useApiQuery<Settings>('/api/settings', {
 *   enabled: isAuthenticated,
 *   refetchInterval: 5000,
 * });
 * ```
 */
export function useApiQuery<TData = unknown>(
  url: string,
  options?: Omit<UseQueryOptions<TData, Error, TData>, "queryKey" | "queryFn">
): UseQueryResult<TData, Error> {
  return useQuery<TData, Error>({
    queryKey: ["api", url],
    queryFn: async () => {
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `API Error: ${response.status} ${response.statusText}${
            errorText ? ` - ${errorText}` : ""
          }`
        );
      }

      return response.json();
    },
    ...options,
  });
}
