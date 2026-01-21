"use client";

import { useState } from "react";
import Link from "next/link";
import { useApiQuery } from "@/lib/hooks/useApiQuery";

interface Metrics {
  serviceId: string;
  serviceName: string;
  timeWindow: string;
  metrics: {
    uptime: { percentage: number; formatted: string };
    mttr: { milliseconds: number; formatted: string };
    mtbf: { milliseconds: number; formatted: string };
    totalDowntime: { milliseconds: number; formatted: string };
    incidentCount: number;
    openIncidents: number;
  };
}

interface MetricsCardProps {
  serviceId: string;
}

export default function MetricsCard({ serviceId }: MetricsCardProps) {
  const [timeWindow, setTimeWindow] = useState<"7d" | "30d" | "all">("30d");

  // Fetch metrics using useApiQuery
  const { data: metrics, isLoading: loading } = useApiQuery(
    `/api/services/${serviceId}/metrics?window=${timeWindow}` as any,
    {
      enabled: !!serviceId,
    },
  ) as { data: Metrics | undefined; isLoading: boolean };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <p className="text-gray-500 dark:text-gray-400">Loading metrics...</p>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const uptimeColor =
    metrics.metrics.uptime.percentage >= 99.9
      ? "text-green-600 dark:text-green-400"
      : metrics.metrics.uptime.percentage >= 99
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-red-600 dark:text-red-400";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Reliability Metrics
        </h3>
        <select
          value={timeWindow}
          onChange={(e) =>
            setTimeWindow(e.target.value as "7d" | "30d" | "all")
          }
          className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Uptime
          </p>
          <p className={`text-2xl font-bold ${uptimeColor}`}>
            {metrics.metrics.uptime.formatted}
          </p>
        </div>

        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">MTTR</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {metrics.metrics.mttr.formatted}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Mean Time To Recovery
          </p>
        </div>

        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">MTBF</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {metrics.metrics.mtbf.formatted}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Mean Time Between Failures
          </p>
        </div>

        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Total Downtime
          </p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {metrics.metrics.totalDowntime.formatted}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Incidents in period:
          </span>
          <span className="font-medium text-gray-900 dark:text-white">
            {metrics.metrics.incidentCount}
          </span>
        </div>
        {metrics.metrics.openIncidents > 0 && (
          <div className="flex justify-between text-sm mt-2">
            <span className="text-gray-600 dark:text-gray-400">
              Currently open:
            </span>
            <span className="font-medium text-red-600 dark:text-red-400">
              {metrics.metrics.openIncidents}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
