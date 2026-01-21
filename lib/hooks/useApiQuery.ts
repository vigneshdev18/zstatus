import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";
import { ApiResponseMap, GetResponse } from "@/lib/types/api.types";

/** Options for useApiQuery hook */
export interface UseApiQueryOptions<TUrl extends keyof ApiResponseMap>
  extends Omit<
    UseQueryOptions<GetResponse<TUrl>, Error, GetResponse<TUrl>>,
    "queryKey" | "queryFn"
  > {
  /** Query parameters to append to the URL */
  params?: Record<string, string | number | boolean | undefined | null>;
}

/** Build URL with query parameters */
function buildUrl(
  baseUrl: string,
  params?: Record<string, string | number | boolean | undefined | null>
): string {
  if (!params) return baseUrl;

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    // Skip undefined and null values
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Custom hook that wraps useQuery for API calls with automatic type inference
 *
 * @template TUrl - The API endpoint URL (must be a key in ApiResponseMap)
 * @param url - The API endpoint URL to fetch from
 * @param options - Additional useQuery options including params for query string
 * @returns UseQueryResult with the fetched data, automatically typed based on the URL
 */

export function useApiQuery<TUrl extends keyof ApiResponseMap>(
  url: TUrl | (string & {}), // Allow string for dynamic URLs
  options?: UseApiQueryOptions<TUrl>
): UseQueryResult<GetResponse<TUrl>, Error> {
  const { params, ...queryOptions } = options || {};
  const fullUrl = buildUrl(url as string, params);

  return useQuery<GetResponse<TUrl>, Error>({
    queryKey: ["api", url, params], // Include params in query key for proper caching
    queryFn: async () => {
      const response = await fetch(fullUrl);

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
    ...queryOptions,
  });
}
