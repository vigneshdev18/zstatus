"use client";

import { useState } from "react";
import AnalyticsChart from "@/app/components/AnalyticsChart";
import Button from "@/app/components/Button/Button";
import { cn } from "@/lib/utils/cn";

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
  colorIndex?: number; // Add color index to preserve consistent colors
}

interface AnalyticsWithFilterProps {
  serviceData: ServiceData[];
}

// Color palette for different services - 20 vibrant, distinct colors
const SERVICE_COLORS = [
  "#667eea", // Purple-blue
  "#0ba360", // Green
  "#f2994a", // Orange
  "#eb3349", // Red
  "#3cba92", // Teal
  "#f45c43", // Coral
  "#f2c94c", // Yellow
  "#764ba2", // Purple
  "#0f9d58", // Forest green
  "#db4437", // Crimson
  "#4285f4", // Blue
  "#ea4335", // Bright red
  "#fbbc04", // Gold
  "#34a853", // Lime green
  "#ff6d00", // Deep orange
  "#ab47bc", // Magenta
  "#00acc1", // Cyan
  "#7cb342", // Light green
  "#e91e63", // Pink
  "#5e35b1", // Deep purple
];

export default function AnalyticsWithFilter({
  serviceData,
}: AnalyticsWithFilterProps) {
  // Add color index to each service
  const servicesWithColors = serviceData.map((service, index) => ({
    ...service,
    colorIndex: index,
  }));

  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(
    new Set(servicesWithColors.map((s) => s.id))
  );

  const toggleService = (serviceId: string) => {
    const newSelected = new Set(selectedServiceIds);
    if (newSelected.has(serviceId)) {
      newSelected.delete(serviceId);
    } else {
      newSelected.add(serviceId);
    }
    setSelectedServiceIds(newSelected);
  };

  const resetSelection = () => {
    setSelectedServiceIds(new Set(servicesWithColors.map((s) => s.id)));
  };

  const selectAll = () => {
    setSelectedServiceIds(new Set(servicesWithColors.map((s) => s.id)));
  };

  const deselectAll = () => {
    setSelectedServiceIds(new Set());
  };

  // Filter service data based on selection while preserving color indices
  const filteredServiceData = servicesWithColors.filter((service) =>
    selectedServiceIds.has(service.id)
  );

  return (
    <div className="space-y-6">
      {/* Chart */}
      <AnalyticsChart serviceData={filteredServiceData} />

      {/* Service Filter */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Filter Services</h3>
          <div className="flex items-center gap-2">
            <Button onClick={selectAll} variant="ghost" size="sm">
              Select All
            </Button>
            <Button onClick={deselectAll} variant="ghost" size="sm">
              Deselect All
            </Button>
            <Button onClick={resetSelection} size="sm">
              Reset
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 ">
          {servicesWithColors.map((service) => {
            const color =
              SERVICE_COLORS[service.colorIndex! % SERVICE_COLORS.length];
            const isSelected = selectedServiceIds.has(service.id);

            return (
              <button
                key={service.id}
                onClick={() => toggleService(service.id)}
                className={cn(
                  "p-3 rounded-xl border transition-smooth text-left min-w-[150px]",
                  isSelected
                    ? "bg-white/10 border-white/20"
                    : "bg-white/5 border-white/10 opacity-50",
                  "hover:bg-white/15"
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Color indicator */}
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />

                  {/* Service name */}
                  <span className="text-sm text-white font-medium truncate">
                    {service.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {selectedServiceIds.size === 0 && (
          <div className="mt-4 text-center text-sm text-gray-400">
            No services selected. Select at least one service to view data.
          </div>
        )}
      </div>
    </div>
  );
}
