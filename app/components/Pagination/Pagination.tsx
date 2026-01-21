"use client";

import { HiChevronLeft, HiChevronRight } from "react-icons/hi";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  showPageNumbers?: boolean;
  maxPageNumbers?: number;
  className?: string;
}

/**
 * Reusable Pagination Component
 *
 * @param currentPage - Current active page (1-indexed)
 * @param totalPages - Total number of pages
 * @param onPageChange - Callback when page changes
 * @param pageSize - Current page size
 * @param onPageSizeChange - Callback when page size changes
 * @param pageSizeOptions - Available page size options (default: [10, 20, 50, 100])
 * @param showPageNumbers - Whether to show numbered pages (default: true)
 * @param maxPageNumbers - Maximum page numbers to show before adding ellipsis (default: 7)
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  showPageNumbers = true,
  maxPageNumbers = 7,
  className = "",
}: PaginationProps) {
  if (totalPages <= 1 && !pageSize) {
    return null;
  }

  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= maxPageNumbers) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    const leftSiblingIndex = Math.max(currentPage - 1, 1);
    const rightSiblingIndex = Math.min(currentPage + 1, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    // Always show first page
    pages.push(1);

    if (shouldShowLeftDots) {
      pages.push("...");
    }

    // Show pages around current page
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i);
      }
    }

    if (shouldShowRightDots) {
      pages.push("...");
    }

    // Always show last page
    if (totalPages !== 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = showPageNumbers ? getPageNumbers() : [];

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      {/* Left: Navigation Buttons */}
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 glass rounded-lg hover:bg-white/10 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <HiChevronLeft className="w-5 h-5 text-gray-400" />
        </button>

        {/* Page Numbers */}
        {showPageNumbers && totalPages > 1 && (
          <div className="flex items-center gap-1">
            {pageNumbers.map((pageNum, index) => {
              if (pageNum === "...") {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-3 py-2 text-gray-400"
                  >
                    ...
                  </span>
                );
              }

              const page = pageNum as number;
              const isActive = page === currentPage;

              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`
                    px-3 py-2 rounded-lg font-medium transition-smooth min-w-[40px]
                    ${
                      isActive
                        ? "bg-gradient-primary text-white shadow-gradient"
                        : "glass text-gray-300 hover:bg-white/10"
                    }
                  `}
                  aria-label={`Page ${page}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {page}
                </button>
              );
            })}
          </div>
        )}

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 glass rounded-lg hover:bg-white/10 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <HiChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        {/* Page Info */}
        {totalPages > 1 && (
          <span className="ml-2 text-sm text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
        )}
      </div>

      {/* Right: Page Size Selector */}
      {pageSize && onPageSizeChange && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Show:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-3 py-2 glass rounded-lg text-white bg-transparent border border-white/10 hover:bg-white/10 transition-smooth focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size} className="bg-gray-900">
                {size}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-400">per page</span>
        </div>
      )}
    </div>
  );
}
