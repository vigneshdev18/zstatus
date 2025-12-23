"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Dot,
} from "recharts";

interface HealthCheck {
  id: string;
  serviceId: string;
  serviceName: string;
  status: "UP" | "DOWN";
  responseTime: number;
  timestamp: string; // Changed from Date to string
  statusCode?: number;
  errorMessage?: string;
}

interface ServiceData {
  id: string;
  name: string;
  checks: HealthCheck[];
  colorIndex?: number; // Optional color index for consistent coloring
}

interface AnalyticsChartProps {
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

const DOWN_COLOR = "#ef4444"; // Red for down status

// Time bucket configuration
// Health checks are grouped by minute (seconds are removed)
const TIME_BUCKET_SECONDS = 60;

/**
 * Rounds a timestamp down to the start of the minute
 * This removes seconds and milliseconds, grouping all checks in the same minute
 * Example: 16:47:32.456 → 16:47:00.000
 */
const roundToNearestBucket = (timestamp: number): number => {
  const date = new Date(timestamp);
  date.setSeconds(0, 0); // Set seconds and milliseconds to 0
  return date.getTime();
};

// Custom dot to highlight down status
const CustomDot = (props: any) => {
  const { cx, cy, payload, dataKey } = props;

  // Check if this data point has a down status for this service
  const serviceId = dataKey.replace("service_", "");
  const isDown = payload[`${dataKey}_status`] === "DOWN";

  if (isDown) {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill={DOWN_COLOR}
        stroke="#fff"
        strokeWidth={2}
      />
    );
  }

  return null;
};

// Custom Tooltip to show all services at the cursor position
const CustomTooltip = (args: any) => {
  const { active, payload, label } = args;
  if (active && payload && payload.length > 0) {
    return (
      <div
        className="glass p-4 rounded-xl border border-white/10"
        style={{
          backgroundColor: "rgba(26, 26, 36, 0.95)",
          backdropFilter: "blur(12px)",
        }}
      >
        <p className="text-gray-400 text-sm mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => {
            // Extract service name from dataKey
            const serviceName = entry.name;
            const responseTime = entry.value;
            const statusKey = `${entry.dataKey}_status`;
            const status = entry.payload[statusKey];

            return (
              <div
                key={index}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-white text-sm">{serviceName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium text-sm">
                    {responseTime?.toFixed(0)}ms
                  </span>
                  {status === "DOWN" && (
                    <span className="text-red-400 text-xs px-1.5 py-0.5 bg-red-500/20 rounded">
                      DOWN
                    </span>
                  )}
                  {status === "UP" && (
                    <span className="text-green-400 text-xs px-1.5 py-0.5 bg-green-500/20 rounded">
                      UP
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
};

export default function AnalyticsChart({ serviceData }: AnalyticsChartProps) {
  // Transform data for Recharts with time bucketing
  // Group health checks by rounded timestamps to align services
  const bucketMap = new Map<number, Map<string, HealthCheck>>();

  // Collect all checks and group them by time bucket and service
  serviceData.forEach((service) => {
    service.checks.forEach((check) => {
      const originalTimestamp = new Date(check.timestamp).getTime();
      const bucketTimestamp = roundToNearestBucket(originalTimestamp);

      if (!bucketMap.has(bucketTimestamp)) {
        bucketMap.set(bucketTimestamp, new Map());
      }

      const bucket = bucketMap.get(bucketTimestamp)!;

      // If multiple checks for the same service in this bucket, keep the most recent
      const existing = bucket.get(service.id);
      if (
        !existing ||
        originalTimestamp > new Date(existing.timestamp).getTime()
      ) {
        bucket.set(service.id, check);
      }
    });
  });

  // Convert to sorted array of bucket timestamps
  const sortedBuckets = Array.from(bucketMap.keys()).sort((a, b) => a - b);

  // Create data points for the chart
  const chartData = sortedBuckets.map((bucketTimestamp) => {
    const dataPoint: any = {
      timestamp: bucketTimestamp,
      time: new Date(bucketTimestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const bucket = bucketMap.get(bucketTimestamp)!;

    // Add data for each service in this bucket
    serviceData.forEach((service) => {
      const check = bucket.get(service.id);

      if (check) {
        dataPoint[`service_${service.id}`] = check.responseTime;
        dataPoint[`service_${service.id}_status`] = check.status;
      }
    });

    return dataPoint;
  });

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-400">No data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
        <XAxis
          dataKey="time"
          stroke="#9ca3af"
          tick={{ fill: "#9ca3af" }}
          tickLine={{ stroke: "#9ca3af" }}
        />
        <YAxis
          stroke="#9ca3af"
          tick={{ fill: "#9ca3af" }}
          tickLine={{ stroke: "#9ca3af" }}
          label={{
            value: "Response Time (ms)",
            angle: -90,
            position: "insideLeft",
            style: { fill: "#9ca3af" },
          }}
        />
        <Tooltip content={<CustomTooltip />} shared />
        <Legend wrapperStyle={{ color: "#fff" }} iconType="line" />
        {serviceData.map((service, index) => {
          // Use colorIndex if provided, otherwise fall back to current index
          const colorIdx =
            service.colorIndex !== undefined ? service.colorIndex : index;
          return (
            <Line
              key={service.id}
              type="monotone"
              dataKey={`service_${service.id}`}
              stroke={SERVICE_COLORS[colorIdx % SERVICE_COLORS.length]}
              strokeWidth={2}
              name={service.name}
              dot={<CustomDot />}
              activeDot={{ r: 3 }}
              connectNulls
            />
          );
        })}
      </LineChart>
    </ResponsiveContainer>
  );
}
