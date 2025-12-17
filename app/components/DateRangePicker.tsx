"use client";

import { useState } from "react";
import { HiClock, HiCalendar, HiChevronDown } from "react-icons/hi";

export interface TimeRange {
  label: string;
  value: string;
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

const getTimeRanges = (): TimeRange[] => {
  const now = new Date();

  return [
    {
      label: "Last 5 minutes",
      value: "5m",
      from: new Date(now.getTime() - 5 * 60 * 1000),
      to: now,
    },
    {
      label: "Last 15 minutes",
      value: "15m",
      from: new Date(now.getTime() - 15 * 60 * 1000),
      to: now,
    },
    {
      label: "Last 30 minutes",
      value: "30m",
      from: new Date(now.getTime() - 30 * 60 * 1000),
      to: now,
    },
    {
      label: "Last 1 hour",
      value: "1h",
      from: new Date(now.getTime() - 60 * 60 * 1000),
      to: now,
    },
    {
      label: "Last 3 hours",
      value: "3h",
      from: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      to: now,
    },
    {
      label: "Last 6 hours",
      value: "6h",
      from: new Date(now.getTime() - 6 * 60 * 60 * 1000),
      to: now,
    },
    {
      label: "Last 12 hours",
      value: "12h",
      from: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      to: now,
    },
    {
      label: "Last 24 hours",
      value: "24h",
      from: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      to: now,
    },
    {
      label: "Last 2 days",
      value: "2d",
      from: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      to: now,
    },
    {
      label: "Last 7 days",
      value: "7d",
      from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      to: now,
    },
    {
      label: "Last 30 days",
      value: "30d",
      from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      to: now,
    },
    {
      label: "Last 90 days",
      value: "90d",
      from: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      to: now,
    },
  ];
};

export default function DateRangePicker({
  value,
  onChange,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const timeRanges = getTimeRanges();

  const handleQuickSelect = (range: TimeRange) => {
    onChange(range);
    setIsOpen(false);
    setShowCustom(false);
  };

  const handleCustomApply = () => {
    if (customFrom && customTo) {
      const customRange: TimeRange = {
        label: "Custom range",
        value: "custom",
        from: new Date(customFrom),
        to: new Date(customTo),
      };
      onChange(customRange);
      setIsOpen(false);
      setShowCustom(false);
    }
  };

  const formatDateRange = (from: Date, to: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - from.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 glass rounded-lg hover:bg-white/10 transition-smooth text-white"
      >
        <HiClock className="w-4 h-4 text-purple-400" />
        <span className="text-sm font-medium">{value.label}</span>
        <HiChevronDown
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false);
              setShowCustom(false);
            }}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-72 glass rounded-xl border border-white/10 shadow-2xl z-50 overflow-hidden">
            {!showCustom ? (
              <>
                {/* Quick Ranges */}
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Quick ranges
                  </div>
                  <div className="space-y-1">
                    {timeRanges.map((range) => (
                      <button
                        key={range.value}
                        onClick={() => handleQuickSelect(range)}
                        className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-smooth ${
                          value.value === range.value
                            ? "bg-purple-500/20 text-white"
                            : "text-gray-300 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Range Button */}
                <div className="border-t border-white/10 p-2">
                  <button
                    onClick={() => setShowCustom(true)}
                    className="w-full px-3 py-2 rounded-lg text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-smooth flex items-center gap-2"
                  >
                    <HiCalendar className="w-4 h-4" />
                    Custom time range
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Custom Range Form */}
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-white">
                      Custom time range
                    </h3>
                    <button
                      onClick={() => setShowCustom(false)}
                      className="text-gray-400 hover:text-white transition-smooth"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
                        From
                      </label>
                      <input
                        type="datetime-local"
                        value={customFrom}
                        onChange={(e) => setCustomFrom(e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
                        To
                      </label>
                      <input
                        type="datetime-local"
                        value={customTo}
                        onChange={(e) => setCustomTo(e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCustom(false)}
                      className="flex-1 px-3 py-2 glass rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-smooth"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCustomApply}
                      disabled={!customFrom || !customTo}
                      className="flex-1 px-3 py-2 bg-gradient-primary rounded-lg text-sm text-white hover:scale-105 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
