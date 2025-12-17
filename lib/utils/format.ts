/**
 * Format duration in milliseconds to human-readable string
 * @param ms Duration in milliseconds
 * @returns Formatted string like "2h 15m 30s" or "45s"
 */
export function formatDuration(ms: number): string {
  if (!ms || ms < 0) return "0s";

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days}d`);
  }
  if (hours % 24 > 0) {
    parts.push(`${hours % 24}h`);
  }
  if (minutes % 60 > 0) {
    parts.push(`${minutes % 60}m`);
  }
  if (seconds % 60 > 0 || parts.length === 0) {
    parts.push(`${seconds % 60}s`);
  }

  return parts.join(" ");
}

/**
 * Format duration in milliseconds to long human-readable string
 * @param ms Duration in milliseconds
 * @returns Formatted string like "2 hours, 15 minutes, 30 seconds"
 */
export function formatDurationLong(ms: number): string {
  if (!ms || ms < 0) return "0 seconds";

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days} ${days === 1 ? "day" : "days"}`);
  }
  if (hours % 24 > 0) {
    const h = hours % 24;
    parts.push(`${h} ${h === 1 ? "hour" : "hours"}`);
  }
  if (minutes % 60 > 0) {
    const m = minutes % 60;
    parts.push(`${m} ${m === 1 ? "minute" : "minutes"}`);
  }
  if (seconds % 60 > 0 || parts.length === 0) {
    const s = seconds % 60;
    parts.push(`${s} ${s === 1 ? "second" : "seconds"}`);
  }

  return parts.join(", ");
}
