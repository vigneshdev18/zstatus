import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";
import { ApiResponseMap, GetResponse } from "@/lib/types/api.types";

/**
 * Custom hook that wraps useQuery for API calls with automatic type inference
 *
 * @template TUrl - The API endpoint URL (must be a key in ApiResponseMap)
 * @param url - The API endpoint URL to fetch from
 * @param options - Additional useQuery options (excluding queryKey and queryFn)
 * @returns UseQueryResult with the fetched data, automatically typed based on the URL
 *
 * @example
 * ```tsx
 * // Automatic type inference - no need to specify generic type!
 * const { data } = useApiQuery('/api/services');
 * // data is automatically typed as { services: Service[] }
 *
 * // With options
 * const { data } = useApiQuery('/api/settings', {
 *   enabled: isAuthenticated,
 *   refetchInterval: 5000,
 * });
 * // data is automatically typed as { settings: Settings }
 *
 * // For dynamic URLs (with path parameters), use the base pattern
 * const { data } = useApiQuery(`/api/services/${id}` as '/api/services/[id]');
 * // data is automatically typed as { service: Service }
 * ```
 */
export function useApiQuery<TUrl extends keyof ApiResponseMap>(
  url: TUrl | (string & {}), // Allow string for dynamic URLs
  options?: Omit<
    UseQueryOptions<GetResponse<TUrl>, Error, GetResponse<TUrl>>,
    "queryKey" | "queryFn"
  >
): UseQueryResult<GetResponse<TUrl>, Error> {
  return useQuery<GetResponse<TUrl>, Error>({
    queryKey: ["api", url],
    queryFn: async () => {
      const response = await fetch(url as string);

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
