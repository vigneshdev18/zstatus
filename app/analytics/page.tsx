"use client";

import { useState, useEffect, useMemo } from "react";
import AnalyticsWithFilter from "@/app/components/AnalyticsWithFilter";
import {
  default as TimeRangeDropdown,
  TimeRange,
} from "@/app/components/TimeRangeDropdown";
import Loading from "@/app/components/Loading";
import { useApiQuery } from "@/lib/hooks/useApiQuery";

// Import types from AnalyticsWithFilter to ensure compatibility
interface HealthCheck {
  id: string;
  serviceId: string;
  serviceName: string;
  status: "UP" | "DOWN";
  responseTime: number;
  timestamp: string;
  statusCode?: number;
  errorMessage?: string;
}

interface ServiceData {
  id: string;
  name: string;
  checks: HealthCheck[];
}

export default function AnalyticsPage() {
  const [serviceData, setServiceData] = useState<ServiceData[]>([]);
  const [healthChecksLoading, setHealthChecksLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>({
    label: "Last 24 hours",
    value: "24h",
    from: new Date(Date.now() - 24 * 60 * 60 * 1000),
    to: new Date(),
  });

  // Fetch services using useApiQuery
  const { data: servicesResponse, isLoading: servicesLoading } = useApiQuery<{
    services: any[];
  }>("/api/services");

  const services = servicesResponse?.services || [];

  useEffect(() => {
    fetchHealthChecks();
  }, [timeRange, services]);

  const fetchHealthChecks = async () => {
    if (services.length === 0) return;

    setHealthChecksLoading(true);
    try {
      // Fetch health checks with date range filter
      const fromParam = timeRange.from.toISOString();
      const toParam = timeRange.to.toISOString();
      const healthChecksRes = await fetch(
        `/api/healthchecks?limit=5000&from=${fromParam}&to=${toParam}`
      );
      const healthChecksData = await healthChecksRes.json();
      const healthChecks = healthChecksData.healthChecks || [];

      // Group by service
      const grouped = services.map((service: any) => {
        const checks = healthChecks
          .filter((hc: any) => hc.serviceId === service.id)
          .sort(
            (a: any, b: any) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )
          .map((hc: any) => ({
            ...hc,
            status: hc.status as "UP" | "DOWN", // Ensure proper type
          }));

        return {
          id: service.id,
          name: service.name,
          checks,
        };
      });

      setServiceData(grouped);
    } catch (error) {
      console.error("Failed to fetch analytics data:", error);
    } finally {
      setHealthChecksLoading(false);
    }
  };

  const loading = servicesLoading || healthChecksLoading;

  const totalDataPoints = serviceData.reduce(
    (sum, service) => sum + service.checks.length,
    0
  );

  const formatTimeRange = () => {
    if (timeRange.value === "custom") {
      const fromDate = timeRange.from.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const toDate = timeRange.to.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      return `${fromDate} - ${toDate}`;
    }
    return timeRange.label;
  };

  if (loading) {
    return <Loading message="Loading analytics..." />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header with Date Range Picker */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Analytics</h1>
          <p className="text-gray-400">
            Response time trends and service health metrics
          </p>
        </div>

        {/* Time Range Dropdown */}
        <TimeRangeDropdown
          value={timeRange}
          onChange={setTimeRange}
          align="right"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4">
          <p className="text-sm text-gray-400 mb-1">Total Services</p>
          <p className="text-2xl font-bold text-white">{services.length}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-sm text-gray-400 mb-1">Data Points</p>
          <p className="text-2xl font-bold text-white">{totalDataPoints}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-sm text-gray-400 mb-1">Time Range</p>
          <p className="text-2xl font-bold text-white">{formatTimeRange()}</p>
        </div>
      </div>

      {/* Chart with Service Filter */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-2">
          Response Time Trends
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          Red dots indicate service downtime
        </p>
        <AnalyticsWithFilter serviceData={serviceData} />
      </div>
    </div>
  );
}
