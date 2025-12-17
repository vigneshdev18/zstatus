"use client";

import { useState } from "react";
import AnalyticsChart from "@/app/components/AnalyticsChart";

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

// Color palette for different services
const SERVICE_COLORS = [
  "#667eea",
  "#0ba360",
  "#f2994a",
  "#eb3349",
  "#3cba92",
  "#f45c43",
  "#f2c94c",
  "#764ba2",
  "#0f9d58",
  "#db4437",
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
      <div>
        <AnalyticsChart serviceData={filteredServiceData} />
      </div>

      {/* Service Filter */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Filter Services</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="px-3 py-1.5 text-xs glass rounded-lg text-white hover:bg-white/10 transition-smooth"
            >
              Select All
            </button>
            <button
              onClick={deselectAll}
              className="px-3 py-1.5 text-xs glass rounded-lg text-white hover:bg-white/10 transition-smooth"
            >
              Deselect All
            </button>
            <button
              onClick={resetSelection}
              className="px-3 py-1.5 text-xs bg-gradient-primary rounded-lg text-white hover:scale-105 transition-smooth"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {servicesWithColors.map((service) => {
            const color =
              SERVICE_COLORS[service.colorIndex! % SERVICE_COLORS.length];
            const isSelected = selectedServiceIds.has(service.id);

            return (
              <button
                key={service.id}
                onClick={() => toggleService(service.id)}
                className={`
                  p-3 rounded-xl border transition-smooth text-left
                  ${
                    isSelected
                      ? "bg-white/10 border-white/20"
                      : "bg-white/5 border-white/10 opacity-50"
                  }
                  hover:bg-white/15
                `}
              >
                <div className="flex items-center gap-3">
                  {/* Checkbox */}
                  <div
                    className={`
                      w-5 h-5 rounded border-2 flex items-center justify-center transition-smooth
                      ${
                        isSelected ? "border-white bg-white" : "border-gray-400"
                      }
                    `}
                  >
                    {isSelected && (
                      <svg
                        className="w-3 h-3 text-gray-900"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>

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
