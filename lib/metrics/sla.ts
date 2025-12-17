// SLA metrics calculation utilities

// Calculate uptime percentage based on incident history
export function calculateUptime(
  incidents: { startTime: Date; endTime?: Date; duration?: number }[],
  timeWindowMs: number
): number {
  const now = Date.now();
  const startOfWindow = now - timeWindowMs;

  let totalDowntime = 0;

  for (const incident of incidents) {
    const incidentStart = new Date(incident.startTime).getTime();

    // Skip incidents outside the time window
    if (incident.endTime) {
      const incidentEnd = new Date(incident.endTime).getTime();
      if (incidentEnd < startOfWindow) continue;
    }

    // Calculate overlap with time window
    const effectiveStart = Math.max(incidentStart, startOfWindow);
    const effectiveEnd = incident.endTime
      ? Math.min(new Date(incident.endTime).getTime(), now)
      : now;

    if (effectiveEnd > effectiveStart) {
      totalDowntime += effectiveEnd - effectiveStart;
    }
  }

  const uptime = ((timeWindowMs - totalDowntime) / timeWindowMs) * 100;
  return Math.max(0, Math.min(100, uptime));
}

// Calculate MTTR (Mean Time To Recovery) in milliseconds
export function calculateMTTR(
  incidents: { duration?: number; status: string }[]
): number {
  const closedIncidents = incidents.filter(
    (inc) => inc.status === "CLOSED" && inc.duration
  );

  if (closedIncidents.length === 0) return 0;

  const totalDuration = closedIncidents.reduce(
    (sum, inc) => sum + (inc.duration || 0),
    0
  );

  return totalDuration / closedIncidents.length;
}

// Calculate MTBF (Mean Time Between Failures) in milliseconds
export function calculateMTBF(
  incidents: { startTime: Date }[],
  serviceCreatedAt: Date,
  timeWindowMs: number
): number {
  if (incidents.length === 0) return timeWindowMs;
  if (incidents.length === 1) return timeWindowMs;

  const now = Date.now();
  const startOfWindow = now - timeWindowMs;
  const effectiveStart = Math.max(
    new Date(serviceCreatedAt).getTime(),
    startOfWindow
  );

  // Filter incidents in the time window
  const sortedIncidents = incidents
    .filter((inc) => new Date(inc.startTime).getTime() >= startOfWindow)
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

  if (sortedIncidents.length === 0) return timeWindowMs;
  if (sortedIncidents.length === 1) return timeWindowMs;

  // Calculate time between incidents
  let totalTimeBetween = 0;
  for (let i = 1; i < sortedIncidents.length; i++) {
    const timeBetween =
      new Date(sortedIncidents[i].startTime).getTime() -
      new Date(sortedIncidents[i - 1].startTime).getTime();
    totalTimeBetween += timeBetween;
  }

  return totalTimeBetween / (sortedIncidents.length - 1);
}

// Calculate total downtime in milliseconds
export function calculateTotalDowntime(
  incidents: { startTime: Date; endTime?: Date; duration?: number }[],
  timeWindowMs: number
): number {
  const now = Date.now();
  const startOfWindow = now - timeWindowMs;

  let totalDowntime = 0;

  for (const incident of incidents) {
    const incidentStart = new Date(incident.startTime).getTime();

    // Skip incidents outside the time window
    if (incident.endTime) {
      const incidentEnd = new Date(incident.endTime).getTime();
      if (incidentEnd < startOfWindow) continue;
    }

    // Calculate overlap with time window
    const effectiveStart = Math.max(incidentStart, startOfWindow);
    const effectiveEnd = incident.endTime
      ? Math.min(new Date(incident.endTime).getTime(), now)
      : now;

    if (effectiveEnd > effectiveStart) {
      totalDowntime += effectiveEnd - effectiveStart;
    }
  }

  return totalDowntime;
}

// Format milliseconds to human-readable duration
export function formatDuration(ms: number): string {
  if (ms === 0) return "0s";

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

// Time window constants
export const TIME_WINDOWS = {
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  all: Number.MAX_SAFE_INTEGER,
} as const;

export type TimeWindow = keyof typeof TIME_WINDOWS;
