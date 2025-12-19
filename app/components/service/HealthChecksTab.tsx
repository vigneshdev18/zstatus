"use client";

import { useState, useMemo } from "react";
import { usePagination } from "@/lib/hooks";
import { useApiQuery } from "@/lib/hooks/useApiQuery";
import { Pagination } from "@/app/components/Pagination";
import { PaginationMetadata } from "@/lib/utils/pagination";
import { FiltersPopover } from "@/app/components/service";

interface HealthCheck {
  id: string;
  serviceId: string;
  serviceName: string;
  status: "UP" | "DOWN";
  responseTime: number;
  statusCode?: number;
  errorMessage?: string;
  timestamp: string;
}

interface HealthChecksResponse {
  healthChecks: HealthCheck[];
  pagination: PaginationMetadata;
}

interface HealthChecksTabProps {
  serviceId: string;
}

export default function HealthChecksTab({ serviceId }: HealthChecksTabProps) {
  const { page, pageSize, setPage, setPageSize } = usePagination({
    initialPage: 1,
    initialPageSize: 10,
  });

  // Filter state for health checks
  const [timeRange, setTimeRange] = useState<string>("all");
  const [minResponseTime, setMinResponseTime] = useState<string>("");
  const [maxResponseTime, setMaxResponseTime] = useState<string>("");
  const [status, setStatus] = useState<string>("all");

  // Handle filter application from popover
  const handleApplyFilters = (filters: {
    timeRange: string;
    minResponseTime: string;
    maxResponseTime: string;
    status: string;
  }) => {
    setTimeRange(filters.timeRange);
    setMinResponseTime(filters.minResponseTime);
    setMaxResponseTime(filters.maxResponseTime);
    setStatus(filters.status);
    setPage(1); // Reset to first page when applying filters
  };

  // Build filter query params
  const getFilterParams = () => {
    const params = new URLSearchParams();

    // Time range filter
    if (timeRange !== "all") {
      const now = new Date();
      let fromDate: Date | undefined;

      switch (timeRange) {
        case "5m":
          fromDate = new Date(now.getTime() - 5 * 60 * 1000);
          break;
        case "15m":
          fromDate = new Date(now.getTime() - 15 * 60 * 1000);
          break;
        case "30m":
          fromDate = new Date(now.getTime() - 30 * 60 * 1000);
          break;
        case "1h":
          fromDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case "3h":
          fromDate = new Date(now.getTime() - 3 * 60 * 60 * 1000);
          break;
        case "6h":
          fromDate = new Date(now.getTime() - 6 * 60 * 60 * 1000);
          break;
        case "12h":
          fromDate = new Date(now.getTime() - 12 * 60 * 60 * 1000);
          break;
        case "24h":
          fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "2d":
          fromDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
          break;
        case "7d":
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "90d":
          fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
      }

      if (fromDate) {
        params.set("fromDate", fromDate.toISOString());
      }
    }

    // Response time filters
    if (minResponseTime) {
      params.set("minResponseTime", minResponseTime);
    }
    if (maxResponseTime) {
      params.set("maxResponseTime", maxResponseTime);
    }

    // Status filter
    if (status !== "all") {
      params.set("status", status);
    }

    return params.toString();
  };

  // Memoize filter params to prevent unnecessary re-renders
  const filterParams = useMemo(
    () => getFilterParams(),
    [timeRange, minResponseTime, maxResponseTime, status]
  );

  // Memoize health checks query to prevent API loops
  const healthChecksQuery = useMemo(
    () =>
      `/api/healthchecks?serviceId=${serviceId}&page=${page}&pageSize=${pageSize}${
        filterParams ? `&${filterParams}` : ""
      }`,
    [serviceId, page, pageSize, filterParams]
  );

  // Fetch filtered health checks
  const {
    data: filteredHealthChecksData,
    isLoading: filteredHealthChecksLoading,
  } = useApiQuery<HealthChecksResponse>(healthChecksQuery);

  const filteredHealthChecks = filteredHealthChecksData?.healthChecks || [];
  const filteredPagination = filteredHealthChecksData?.pagination;

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="mb-4 pb-4 border-b border-white/10">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-400">
            Filter health checks by time range and response time
          </div>
          <div className="flex-shrink-0">
            <FiltersPopover
              timeRange={timeRange}
              minResponseTime={minResponseTime}
              maxResponseTime={maxResponseTime}
              status={status}
              onApplyFilters={handleApplyFilters}
              align="end"
            />
          </div>
        </div>

        {/* Active Filters Display */}
        {(timeRange !== "all" ||
          minResponseTime ||
          maxResponseTime ||
          status !== "all") && (
          <div className="mt-3 flex flex-wrap gap-2">
            {timeRange !== "all" && (
              <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium">
                Time: {timeRange === "all" ? "All Time" : `Last ${timeRange}`}
              </span>
            )}
            {status !== "all" && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  status === "UP"
                    ? "bg-green-500/20 text-green-300"
                    : "bg-red-500/20 text-red-300"
                }`}
              >
                Status: {status}
              </span>
            )}
            {minResponseTime && (
              <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium">
                Min: {minResponseTime}ms
              </span>
            )}
            {maxResponseTime && (
              <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs font-medium">
                Max: {maxResponseTime}ms
              </span>
            )}
          </div>
        )}
      </div>

      {/* Scrollable Health Checks List */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-2">
        {filteredHealthChecksLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="p-4 rounded-xl bg-white/5 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-3/4"></div>
            </div>
          ))
        ) : filteredHealthChecks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">
              {timeRange !== "all" || minResponseTime || maxResponseTime
                ? "No health checks match the selected filters"
                : "No health checks recorded yet"}
            </p>
          </div>
        ) : (
          filteredHealthChecks.map((check) => (
            <div
              key={check.id}
              className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-smooth"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`
                    w-3 h-3 rounded-full
                    ${check.status === "UP" ? "bg-green-500" : "bg-red-500"}
                  `}
                  ></div>
                  <div>
                    <p className="text-sm text-white font-medium">
                      {new Date(check.timestamp).toLocaleString()}
                    </p>
                    {check.errorMessage && (
                      <p className="text-xs text-red-400 mt-1">
                        {check.errorMessage}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Response Time</p>
                    <p className="text-sm text-white font-medium">
                      {check.responseTime}ms
                    </p>
                  </div>
                  {check.statusCode && (
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Status Code</p>
                      <p className="text-sm text-white font-medium">
                        {check.statusCode}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination at Bottom */}
      {filteredPagination && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <Pagination
            currentPage={page}
            totalPages={filteredPagination.totalPages}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 20, 50, 100]}
          />
        </div>
      )}
    </div>
  );
}
