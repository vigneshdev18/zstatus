/**
 * Pagination utility functions for server-side pagination
 */

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationMetadata {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Calculate offset from page number and page size
 * @param page - Current page (1-indexed)
 * @param pageSize - Number of items per page
 * @returns Offset for database query (0-indexed)
 */
export function calculateOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

/**
 * Generate pagination metadata
 * @param page - Current page (1-indexed)
 * @param pageSize - Number of items per page
 * @param totalItems - Total number of items in the dataset
 * @returns Pagination metadata object
 */
export function generatePaginationMetadata(
  page: number,
  pageSize: number,
  totalItems: number
): PaginationMetadata {
  const totalPages = Math.ceil(totalItems / pageSize);

  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * Parse and validate pagination parameters from query string
 * @param pageParam - Page parameter from query string
 * @param pageSizeParam - Page size parameter from query string
 * @param defaultPageSize - Default page size if not provided
 * @param maxPageSize - Maximum allowed page size
 * @returns Validated pagination parameters
 */
export function parsePaginationParams(
  pageParam: string | null,
  pageSizeParam: string | null,
  defaultPageSize: number = 20,
  maxPageSize: number = 100
): PaginationParams {
  const page = Math.max(1, parseInt(pageParam || "1"));
  const pageSize = Math.min(
    maxPageSize,
    Math.max(1, parseInt(pageSizeParam || String(defaultPageSize)))
  );

  return { page, pageSize };
}
