import { TimeRange } from "@/app/components/TimeRangeDropdown";

/**
 * Convert a string time range value to a TimeRange object
 * @param value - Time range string (e.g., "5m", "1h", "7d", "all")
 * @returns TimeRange object with label, value, from, and to dates
 */
export function stringToTimeRange(value: string): TimeRange {
  const now = new Date();

  // Handle custom range format: "custom:<startTimestamp>:<endTimestamp>"
  if (value.startsWith("custom:")) {
    const parts = value.split(":");
    if (parts.length === 3) {
      const from = new Date(parseInt(parts[1]));
      const to = new Date(parseInt(parts[2]));
      return {
        label: "Custom range",
        value: "custom",
        from,
        to,
      };
    }
  }

  switch (value) {
    case "5m":
      return {
        label: "Last 5 minutes",
        value: "5m",
        from: new Date(now.getTime() - 5 * 60 * 1000),
        to: now,
      };
    case "15m":
      return {
        label: "Last 15 minutes",
        value: "15m",
        from: new Date(now.getTime() - 15 * 60 * 1000),
        to: now,
      };
    case "30m":
      return {
        label: "Last 30 minutes",
        value: "30m",
        from: new Date(now.getTime() - 30 * 60 * 1000),
        to: now,
      };
    case "1h":
      return {
        label: "Last 1 hour",
        value: "1h",
        from: new Date(now.getTime() - 60 * 60 * 1000),
        to: now,
      };
    case "3h":
      return {
        label: "Last 3 hours",
        value: "3h",
        from: new Date(now.getTime() - 3 * 60 * 60 * 1000),
        to: now,
      };
    case "6h":
      return {
        label: "Last 6 hours",
        value: "6h",
        from: new Date(now.getTime() - 6 * 60 * 60 * 1000),
        to: now,
      };
    case "12h":
      return {
        label: "Last 12 hours",
        value: "12h",
        from: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        to: now,
      };
    case "24h":
      return {
        label: "Last 24 hours",
        value: "24h",
        from: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        to: now,
      };
    case "2d":
      return {
        label: "Last 2 days",
        value: "2d",
        from: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        to: now,
      };
    case "7d":
      return {
        label: "Last 7 days",
        value: "7d",
        from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        to: now,
      };
    case "30d":
      return {
        label: "Last 30 days",
        value: "30d",
        from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        to: now,
      };
    case "90d":
      return {
        label: "Last 90 days",
        value: "90d",
        from: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        to: now,
      };
    case "all":
    default:
      return {
        label: "All Time",
        value: "all",
        from: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000), // 1 year for "all time"
        to: now,
      };
  }
}

/**
 * Convert a TimeRange object to a string value
 * @param timeRangeObj - TimeRange object
 * @returns String representation of the time range (e.g., "5m", "1h", "custom:123:456")
 */
export function timeRangeToString(timeRangeObj: TimeRange): string {
  if (timeRangeObj.value === "custom") {
    return `custom:${timeRangeObj.from.getTime()}:${timeRangeObj.to.getTime()}`;
  }
  return timeRangeObj.value;
}
