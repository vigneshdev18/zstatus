import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";

type HttpMethod = "POST" | "PUT" | "PATCH" | "DELETE";

interface ApiMutationOptions<TData, TVariables> {
  url: string;
  method: HttpMethod;
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
 * Custom hook that wraps useMutation for API calls
 *
 * @template TData - The type of data returned by the API
 * @template TVariables - The type of variables passed to the mutation
 * @param config - Configuration object containing url, method, and options
 * @returns UseMutationResult with mutation functions and state
 *
 * @example
 * ```tsx
 * // Basic usage
 * const createService = useApiMutation<Service, CreateServiceInput>({
 *   url: '/api/services',
 *   method: 'POST',
 *   invalidateQueries: [['api', '/api/services']],
 * });
 *
 * // Usage in component
 * const handleCreate = () => {
 *   createService.mutate({ name: 'New Service', url: 'https://example.com' });
 * };
 *
 * // With options
 * const updateService = useApiMutation<Service, UpdateServiceInput>({
 *   url: `/api/services/${id}`,
 *   method: 'PATCH',
 *   invalidateQueries: [['api', '/api/services'], ['api', `/api/services/${id}`]],
 *   options: {
 *     onSuccess: (data) => {
 *       console.log('Service updated:', data);
 *     },
 *   },
 * });
 * ```
 */
export function useApiMutation<TData = unknown, TVariables = unknown>({
  url,
  method,
  options,
  invalidateQueries = [],
}: ApiMutationOptions<TData, TVariables>): UseMutationResult<
  TData,
  Error,
  TVariables
> {
  const queryClient = useQueryClient();

  const userOnSuccess = options?.onSuccess;

  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables: TVariables) => {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(variables),
      });

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
    onSuccess: (data, variables, onMutateResult, mutationContext) => {
      // Invalidate specified queries
      invalidateQueries.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey: queryKey });
      });

      // Call user-provided onSuccess if it exists
      userOnSuccess?.(data, variables, onMutateResult, mutationContext);
    },
  });
}
