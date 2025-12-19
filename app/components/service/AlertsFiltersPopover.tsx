"use client";

import { useState, useEffect } from "react";
import { HiFilter } from "react-icons/hi";
import Popover from "@/app/components/Popover";

interface AlertsFiltersPopoverProps {
  severity: string;
  type: string;
  onApplyFilters: (filters: { severity: string; type: string }) => void;
  align?: "start" | "center" | "end";
}

export default function AlertsFiltersPopover({
  severity,
  type,
  onApplyFilters,
  align = "center",
}: AlertsFiltersPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempSeverity, setTempSeverity] = useState(severity);
  const [tempType, setTempType] = useState(type);

  // Update temp values when props change
  useEffect(() => {
    setTempSeverity(severity);
    setTempType(type);
  }, [severity, type]);

  const handleApply = () => {
    onApplyFilters({
      severity: tempSeverity,
      type: tempType,
    });
    setIsOpen(false);
  };

  const handleCancel = () => {
    // Reset temp values to current applied values
    setTempSeverity(severity);
    setTempType(type);
    setIsOpen(false);
  };

  // Check if there are any active filters
  const hasActiveFilters = severity !== "all" || type !== "all";

  return (
    <Popover
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
      onClose={() => setIsOpen(false)}
      align={align}
      trigger={
        <button className="flex items-center gap-2 px-4 py-2 glass rounded-lg hover:bg-white/10 transition-smooth text-white">
          <HiFilter className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium">Filters</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
          )}
        </button>
      }
    >
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Alert Filters</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Severity Filter */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Severity</label>
          <select
            value={tempSeverity}
            onChange={(e) => setTempSeverity(e.target.value)}
            className="w-full px-3 py-2 glass rounded-lg text-white bg-transparent border border-white/10 hover:bg-white/10 transition-smooth focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all" className="bg-gray-900">
              All Severities
            </option>
            <option value="CRITICAL" className="bg-gray-900">
              Critical
            </option>
            <option value="WARNING" className="bg-gray-900">
              Warning
            </option>
            <option value="INFO" className="bg-gray-900">
              Info
            </option>
          </select>
        </div>

        {/* Type Filter */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Type</label>
          <select
            value={tempType}
            onChange={(e) => setTempType(e.target.value)}
            className="w-full px-3 py-2 glass rounded-lg text-white bg-transparent border border-white/10 hover:bg-white/10 transition-smooth focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all" className="bg-gray-900">
              All Types
            </option>
            <option value="INCIDENT_OPENED" className="bg-gray-900">
              Incident Opened
            </option>
            <option value="INCIDENT_CLOSED" className="bg-gray-900">
              Incident Closed
            </option>
            <option value="SERVICE_DEGRADED" className="bg-gray-900">
              Service Degraded
            </option>
            <option value="RESPONSE_TIME" className="bg-gray-900">
              Response Time
            </option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-white/10">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 glass rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-smooth"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2 bg-gradient-primary rounded-lg text-sm text-white hover:scale-105 transition-smooth"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </Popover>
  );
}
