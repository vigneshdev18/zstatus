import { HealthCheckStatus } from "@/lib/types/healthcheck";
import {
  getActiveIncident,
  createIncident,
  closeIncident,
  incrementFailedChecks,
  updateIncidentFailedChecks,
} from "@/lib/db/incidents";
import { correlateIncidents } from "@/lib/incidents/correlator";
import { alertIncidentOpened, alertIncidentClosed } from "@/lib/alerts/service";
import { getHealthChecksByServiceId } from "@/lib/db/healthchecks";

// Helper function to find when the service actually went down
async function findActualDowntimeStart(
  serviceId: string,
  currentTimestamp: Date
): Promise<{ startTime: Date; failedChecksCount: number }> {
  // Get recent health checks for this service
  const healthChecks = await getHealthChecksByServiceId(serviceId);

  if (healthChecks.length === 0) {
    return { startTime: currentTimestamp, failedChecksCount: 1 }; // No history, use current time
  }

  // Sort by timestamp descending (newest first)
  const sortedChecks = healthChecks.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Find the earliest consecutive DOWN status and count failed checks
  let downtimeStart = currentTimestamp;
  let failedCount = 0;

  for (const check of sortedChecks) {
    if (check.status === "DOWN") {
      downtimeStart = new Date(check.timestamp);
      failedCount++;
    } else {
      // Found an UP status, stop looking back
      break;
    }
  }

  return { startTime: downtimeStart, failedChecksCount: failedCount };
}

// Detect state transitions and manage incident lifecycle
export async function detectIncident(
  serviceId: string,
  serviceName: string,
  currentStatus: HealthCheckStatus,
  lastStatus: HealthCheckStatus | null,
  timestamp: Date
): Promise<void> {
  // UP → DOWN transition OR first check that fails (null → DOWN)
  if (
    (lastStatus === "UP" || lastStatus === null) &&
    currentStatus === "DOWN"
  ) {
    // Check if there's already an open incident (shouldn't be, but check anyway)
    const existingIncident = await getActiveIncident(serviceId);

    if (!existingIncident) {
      // Look back through health check history to find when it actually went down
      const { startTime: actualDowntimeStart, failedChecksCount } =
        await findActualDowntimeStart(serviceId, timestamp);

      // Create new incident with the actual downtime start timestamp
      const incident = await createIncident(
        serviceId,
        serviceName,
        actualDowntimeStart
      );

      // Set the correct failed checks count if we backfilled
      if (failedChecksCount > 1) {
        // Update the incident with the correct failed checks count
        await updateIncidentFailedChecks(incident.id, failedChecksCount);
      }

      const timeDiff = timestamp.getTime() - actualDowntimeStart.getTime();
      const missedSeconds = Math.round(timeDiff / 1000);

      if (missedSeconds > 0) {
        console.log(
          `[Incident] OPENED for ${serviceName} (backfilled ${missedSeconds}s, ${failedChecksCount} failed checks)`
        );
      } else {
        console.log(`[Incident] OPENED for ${serviceName}`);
      }

      // Correlate with other incidents
      await correlateIncidents(serviceId, actualDowntimeStart);

      // Send alert
      await alertIncidentOpened(serviceId, serviceName, incident.id);
    } else {
      // Incident already exists, just increment failed checks
      await incrementFailedChecks(existingIncident.id);
      console.log(
        `[Incident] Existing incident found for ${serviceName}, incrementing failed checks`
      );
    }
  }

  // DOWN → DOWN (continued failure)
  else if (lastStatus === "DOWN" && currentStatus === "DOWN") {
    // Increment failed checks on existing incident
    const incident = await getActiveIncident(serviceId);
    if (incident) {
      await incrementFailedChecks(incident.id);
    } else {
      // Edge case: service is DOWN but no incident exists
      // This can happen if incident was manually deleted or system restarted
      // Look back and create incident with actual start time
      const { startTime: actualDowntimeStart, failedChecksCount } =
        await findActualDowntimeStart(serviceId, timestamp);
      const newIncident = await createIncident(
        serviceId,
        serviceName,
        actualDowntimeStart
      );

      // Set the correct failed checks count
      if (failedChecksCount > 1) {
        await updateIncidentFailedChecks(newIncident.id, failedChecksCount);
      }

      console.log(
        `[Incident] Created missing incident for ${serviceName} (service was DOWN without incident, ${failedChecksCount} failed checks)`
      );

      await correlateIncidents(serviceId, actualDowntimeStart);
      await alertIncidentOpened(serviceId, serviceName, newIncident.id);
    }
  }

  // DOWN → UP transition (recovery)
  else if (lastStatus === "DOWN" && currentStatus === "UP") {
    // Close the active incident
    const incident = await getActiveIncident(serviceId);
    if (incident) {
      const closedIncident = await closeIncident(incident.id, timestamp);
      const duration = timestamp.getTime() - incident.startTime.getTime();
      console.log(
        `[Incident] CLOSED for ${serviceName} (Duration: ${Math.round(
          duration / 1000
        )}s)`
      );

      // Send recovery alert
      if (closedIncident) {
        await alertIncidentClosed(
          serviceId,
          serviceName,
          closedIncident.id,
          duration
        );
      }
    }
  }

  // UP → UP (continued healthy state) - no action needed
  // null → UP (first check success) - no action needed
}
