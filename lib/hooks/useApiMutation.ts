import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";
import { ApiResponseMap, ApiResponse } from "@/lib/types/api.types";

type HttpMethod = "POST" | "PUT" | "PATCH" | "DELETE";

interface ApiMutationOptions<
  TUrl extends keyof ApiResponseMap,
  TMethod extends HttpMethod & keyof ApiResponseMap[TUrl],
  TData = ApiResponse<TUrl, TMethod>,
  TVariables = unknown,
> {
  url: TUrl | (string & {}); // Allow string for dynamic URLs
  method: TMethod;
  options?: Omit<
    UseMutationOptions<TData, Error, TVariables, unknown>,
    "mutationFn"
  >;
  /**
   * Optional array of query keys to invalidate after successful mutation
   * @example ['api', '/api/services'] - invalidates the services list query
   */
  invalidateQueries?: string[][];
}

/**
 * Custom hook that wraps useMutation for API calls with automatic type inference
 *
 * @template TUrl - The API endpoint URL (must be a key in ApiResponseMap)
 * @template TMethod - The HTTP method (POST, PUT, PATCH, DELETE)
 * @param config - Configuration object containing url, method, and options
 * @returns UseMutationResult with mutation functions and state, automatically typed
 *
 * @example
 * ```tsx
 * // Automatic type inference - response type is inferred from URL and method!
 * const createService = useApiMutation({
 *   url: '/api/services',
 *   method: 'POST',
 *   invalidateQueries: [['api', '/api/services']],
 * });
 * // createService.mutate expects Service data
 * // createService.data is typed as Service
 *
 * // With options
 * const updateService = useApiMutation({
 *   url: `/api/services/${id}` as '/api/services/[id]',
 *   method: 'PATCH',
 *   invalidateQueries: [['api', '/api/services'], ['api', `/api/services/${id}`]],
 *   options: {
 *     onSuccess: (data) => {
 *       console.log('Service updated:', data);
 *       // data is automatically typed as Service
 *     },
 *   },
 * });
 * ```
 */
export function useApiMutation<
  TUrl extends keyof ApiResponseMap,
  TMethod extends HttpMethod & keyof ApiResponseMap[TUrl],
  TData = ApiResponse<TUrl, TMethod>,
  TVariables = Partial<TData>,
>({
  url,
  method,
  options,
  invalidateQueries = [],
}: ApiMutationOptions<TUrl, TMethod, TData, TVariables>): UseMutationResult<
  TData,
  Error,
  TVariables
> {
  const queryClient = useQueryClient();

  const userOnSuccess = options?.onSuccess;

  return useMutation<TData, Error, TVariables>({
    mutationFn: async (input: TVariables) => {
      // Check if input contains a dynamic URL override
      let requestUrl = url as string;
      let variables = input;

      if (input && typeof input === "object" && "url" in input) {
        requestUrl = (input as any).url;
      }

      const fetchOptions: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
        },
      };

      // Only add body for methods that support it (not DELETE or GET)
      if (method !== "DELETE" && variables !== undefined) {
        fetchOptions.body = JSON.stringify(variables);
      }

      const response = await fetch(requestUrl, fetchOptions);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `API Error: ${response.status} ${response.statusText}${
            errorText ? ` - ${errorText}` : ""
          }`,
        );
      }

      return response.json();
    },
    ...options,
    onSuccess: async (data, variables, context, mutation) => {
      // Invalidate specified queries
      for (const queryKey of invalidateQueries) {
        await queryClient.invalidateQueries({ queryKey });
      }

      // Call user-provided onSuccess if it exists
      if (userOnSuccess) {
        return userOnSuccess(data, variables, context, mutation);
      }
    },
  });
}
