"use client";

import { useState, useCallback } from "react";

export interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  onPageChange?: (page: number) => void;
}

export interface UsePaginationReturn {
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  resetPagination: () => void;
}

/**
 * Hook for managing pagination state
 *
 * @param options - Configuration options
 * @returns Pagination state and control functions
 *
 * @example
 * const { page, pageSize, nextPage, previousPage, goToPage } = usePagination({
 *   initialPage: 1,
 *   initialPageSize: 20,
 * });
 */
export function usePagination(
  options: UsePaginationOptions = {}
): UsePaginationReturn {
  const { initialPage = 1, initialPageSize = 20, onPageChange } = options;

  const [page, setPageState] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const setPage = useCallback(
    (newPage: number) => {
      setPageState(newPage);
      onPageChange?.(newPage);
    },
    [onPageChange]
  );

  const nextPage = useCallback(() => {
    setPage(page + 1);
  }, [page, setPage]);

  const previousPage = useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page, setPage]);

  const goToPage = useCallback(
    (targetPage: number) => {
      if (targetPage >= 1) {
        setPage(targetPage);
      }
    },
    [setPage]
  );

  const resetPagination = useCallback(() => {
    setPage(initialPage);
    setPageSize(initialPageSize);
  }, [initialPage, initialPageSize, setPage]);

  return {
    page,
    pageSize,
    setPage,
    setPageSize,
    nextPage,
    previousPage,
    goToPage,
    resetPagination,
  };
}
