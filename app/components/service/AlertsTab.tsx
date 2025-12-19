"use client";

import { useState, useMemo } from "react";
import { usePagination } from "@/lib/hooks";
import { useApiQuery } from "@/lib/hooks/useApiQuery";
import { Pagination } from "@/app/components/Pagination";
import { PaginationMetadata } from "@/lib/utils/pagination";
import { AlertsFiltersPopover } from "@/app/components/service";

interface Alert {
  id: string;
  incidentId?: string;
  serviceId: string;
  serviceName: string;
  type: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  title: string;
  message: string;
  status: "PENDING" | "SENT" | "FAILED";
  channels: string[];
  sentAt?: string;
  errorMessage?: string;
  createdAt: string;
}

interface AlertsResponse {
  alerts: Alert[];
  pagination: PaginationMetadata;
}

interface AlertsTabProps {
  serviceId: string;
}

export default function AlertsTab({ serviceId }: AlertsTabProps) {
  // Separate pagination for alerts tab
  const {
    page: alertsPage,
    pageSize: alertsPageSize,
    setPage: setAlertsPage,
    setPageSize: setAlertsPageSize,
  } = usePagination({
    initialPage: 1,
    initialPageSize: 10,
  });

  // Filter state for alerts
  const [severity, setSeverity] = useState<string>("all");
  const [alertType, setAlertType] = useState<string>("all");

  // Handle filter application from popover
  const handleApplyFilters = (filters: { severity: string; type: string }) => {
    setSeverity(filters.severity);
    setAlertType(filters.type);
    setAlertsPage(1); // Reset to first page when applying filters
  };

  // Memoize filter params to prevent unnecessary re-renders
  const filterParams = useMemo(() => {
    const params = new URLSearchParams();
    if (severity !== "all") {
      params.set("severity", severity);
    }
    if (alertType !== "all") {
      params.set("type", alertType);
    }
    return params.toString();
  }, [severity, alertType]);

  // Memoize alerts query to prevent API loops
  const alertsQuery = useMemo(
    () =>
      `/api/alerts?serviceId=${serviceId}&page=${alertsPage}&pageSize=${alertsPageSize}${
        filterParams ? `&${filterParams}` : ""
      }`,
    [serviceId, alertsPage, alertsPageSize, filterParams]
  );

  // Fetch paginated alerts
  const { data: alertsData, isLoading: alertsLoading } =
    useApiQuery<AlertsResponse>(alertsQuery);

  const alerts = alertsData?.alerts || [];
  const alertsPagination = alertsData?.pagination;

  // Get severity badge color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      case "WARNING":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "INFO":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "SENT":
        return "bg-green-500/20 text-green-300";
      case "FAILED":
        return "bg-red-500/20 text-red-300";
      case "PENDING":
        return "bg-yellow-500/20 text-yellow-300";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

  // Get alert type icon
  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case "INCIDENT_OPENED":
        return "🔴";
      case "INCIDENT_CLOSED":
        return "✅";
      case "SERVICE_DEGRADED":
        return "⚠️";
      case "RESPONSE_TIME":
        return "⏱️";
      default:
        return "📢";
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="mb-4 pb-4 border-b border-white/10">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-400">
            Filter alerts by severity and type
          </div>
          <AlertsFiltersPopover
            severity={severity}
            type={alertType}
            onApplyFilters={handleApplyFilters}
            align="end"
          />
        </div>

        {/* Active Filters Display */}
        {(severity !== "all" || alertType !== "all") && (
          <div className="mt-3 flex flex-wrap gap-2">
            {severity !== "all" && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  severity === "CRITICAL"
                    ? "bg-red-500/20 text-red-300"
                    : severity === "WARNING"
                    ? "bg-yellow-500/20 text-yellow-300"
                    : "bg-blue-500/20 text-blue-300"
                }`}
              >
                Severity: {severity}
              </span>
            )}
            {alertType !== "all" && (
              <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium">
                Type: {alertType.replace("_", " ").toLowerCase()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Scrollable Alerts List */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-2">
        {alertsLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="p-4 rounded-xl bg-white/5 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-white/10 rounded w-1/2"></div>
            </div>
          ))
        ) : alerts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No alerts sent yet</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-smooth"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-2xl">
                    {getAlertTypeIcon(alert.type)}
                  </span>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-white mb-1">
                      {alert.title}
                    </h4>
                    <p className="text-xs text-gray-400 mb-2">
                      {alert.message}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(
                          alert.severity
                        )}`}
                      >
                        {alert.severity}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                          alert.status
                        )}`}
                      >
                        {alert.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {alert.channels.join(", ")}
                      </span>
                    </div>
                    {alert.errorMessage && (
                      <p className="text-xs text-red-400 mt-2">
                        Error: {alert.errorMessage}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-xs text-gray-400">
                    {new Date(alert.createdAt).toLocaleString()}
                  </p>
                  {alert.sentAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      Sent: {new Date(alert.sentAt).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination at Bottom */}
      {alertsPagination && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <Pagination
            currentPage={alertsPage}
            totalPages={alertsPagination.totalPages}
            onPageChange={setAlertsPage}
            pageSize={alertsPageSize}
            onPageSizeChange={setAlertsPageSize}
            pageSizeOptions={[10, 20, 50, 100]}
          />
        </div>
      )}
    </div>
  );
}
