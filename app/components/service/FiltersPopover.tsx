"use client";

import { useState, useEffect } from "react";
import { HiFilter } from "react-icons/hi";
import Popover from "@/app/components/Popover";
import TimeRangeDropdown, {
  TimeRange,
} from "@/app/components/TimeRangeDropdown";
import {
  stringToTimeRange,
  timeRangeToString,
} from "@/lib/utils/timeRangeHelpers";

interface FiltersPopoverProps {
  timeRange: string;
  minResponseTime: string;
  maxResponseTime: string;
  status: string;
  onApplyFilters: (filters: {
    timeRange: string;
    minResponseTime: string;
    maxResponseTime: string;
    status: string;
  }) => void;
  align?: "start" | "center" | "end";
}

export default function FiltersPopover({
  timeRange,
  minResponseTime,
  maxResponseTime,
  status,
  onApplyFilters,
  align = "center",
}: FiltersPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempTimeRange, setTempTimeRange] = useState(timeRange);
  const [tempMinResponseTime, setTempMinResponseTime] =
    useState(minResponseTime);
  const [tempMaxResponseTime, setTempMaxResponseTime] =
    useState(maxResponseTime);
  const [tempStatus, setTempStatus] = useState(status);

  // Update temp values when props change
  useEffect(() => {
    setTempTimeRange(timeRange);
    setTempMinResponseTime(minResponseTime);
    setTempMaxResponseTime(maxResponseTime);
    setTempStatus(status);
  }, [timeRange, minResponseTime, maxResponseTime, status]);

  const handleApply = () => {
    onApplyFilters({
      timeRange: tempTimeRange,
      minResponseTime: tempMinResponseTime,
      maxResponseTime: tempMaxResponseTime,
      status: tempStatus,
    });
    setIsOpen(false);
  };

  const handleCancel = () => {
    // Reset temp values to current applied values
    setTempTimeRange(timeRange);
    setTempMinResponseTime(minResponseTime);
    setTempMaxResponseTime(maxResponseTime);
    setTempStatus(status);
    setIsOpen(false);
  };

  // Check if there are any active filters
  const hasActiveFilters =
    timeRange !== "all" ||
    minResponseTime ||
    maxResponseTime ||
    status !== "all";

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
          <h3 className="text-lg font-semibold text-white">Filters</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Time Range Filter */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Time Range</label>
          <TimeRangeDropdown
            value={stringToTimeRange(tempTimeRange)}
            onChange={(newTimeRange: TimeRange) => {
              setTempTimeRange(timeRangeToString(newTimeRange));
            }}
            solidBackground={true}
          />
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Status</label>
          <select
            value={tempStatus}
            onChange={(e) => setTempStatus(e.target.value)}
            className="w-full px-3 py-2 glass rounded-lg text-white bg-transparent border border-white/10 hover:bg-white/10 transition-smooth focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all" className="bg-gray-900">
              All Status
            </option>
            <option value="UP" className="bg-gray-900">
              Up
            </option>
            <option value="DOWN" className="bg-gray-900">
              Down
            </option>
          </select>
        </div>

        {/* Min Response Time Filter */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Min Response Time (ms)
          </label>
          <input
            type="number"
            value={tempMinResponseTime}
            onChange={(e) => setTempMinResponseTime(e.target.value)}
            placeholder="e.g., 100"
            className="w-full px-3 py-2 glass rounded-lg text-white bg-transparent border border-white/10 hover:bg-white/10 transition-smooth focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Max Response Time Filter */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Max Response Time (ms)
          </label>
          <input
            type="number"
            value={tempMaxResponseTime}
            onChange={(e) => setTempMaxResponseTime(e.target.value)}
            placeholder="e.g., 1000"
            className="w-full px-3 py-2 glass rounded-lg text-white bg-transparent border border-white/10 hover:bg-white/10 transition-smooth focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
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
