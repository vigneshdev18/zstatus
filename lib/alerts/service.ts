import {
  createAlert,
  getRecentAlerts,
  markAlertSent,
  markAlertFailed,
} from "@/lib/db/alerts";
import { isInMaintenance } from "@/lib/db/maintenance";
import {
  AlertType,
  AlertSeverity,
  NotificationChannel,
} from "@/lib/types/alert";
import { dispatchNotification } from "@/lib/notifications/dispatcher";
import { getGroupByServiceId } from "@/lib/db/groups";
import { getServiceById } from "@/lib/db/services";

const DEDUP_WINDOW_MINUTES = 5; // Don't send duplicate alerts within 5 minutes

// Send an alert with deduplication and maintenance window checks
export async function sendAlert(
  serviceId: string,
  serviceName: string,
  type: AlertType,
  severity: AlertSeverity,
  title: string,
  message: string,
  incidentId?: string
): Promise<void> {
  try {
    const service = await getServiceById(serviceId);
    if (!service) {
      console.error(`[Alert] Service not found: ${serviceId}`);
      return;
    }

    // Check if alerts are enabled for this service
    const alertsEnabled =
      service.alertsEnabled !== undefined ? service.alertsEnabled : true;
    if (!alertsEnabled) {
      console.log(
        `[Alert] Alerts disabled for service ${service.name} (ID: ${service.id}). Skipping notification.`
      );
      return;
    }

    // Check if service has a group assigned
    const group = await getGroupByServiceId(serviceId);

    if (!group) {
      console.log(
        `[Alert] Skipping alert for ${serviceName} - no group assigned (notifications disabled)`
      );
      return;
    }

    // Check if group has any webhook URLs
    if (!group.webhookUrls || group.webhookUrls.length === 0) {
      console.log(
        `[Alert] Skipping alert for ${serviceName} - group "${group.name}" has no webhook URLs configured`
      );
      return;
    }

    // Check if service is in maintenance
    const inMaintenance = await isInMaintenance(serviceId);
    if (inMaintenance) {
      console.log(
        `[Alert] Skipping alert for ${serviceName} - in maintenance window`
      );
      return;
    }

    // Check for recent duplicate alerts (deduplication)
    const recentAlerts = await getRecentAlerts(
      serviceId,
      type,
      DEDUP_WINDOW_MINUTES
    );
    if (recentAlerts.length > 0) {
      console.log(
        `[Alert] Skipping duplicate alert for ${serviceName} - already sent ${recentAlerts.length} in last ${DEDUP_WINDOW_MINUTES} minutes`
      );
      return;
    }

    // Determine notification channels
    const channels: NotificationChannel[] = ["teams"];

    // Create alert record
    const alert = await createAlert(
      serviceId,
      serviceName,
      type,
      severity,
      title,
      message,
      channels,
      incidentId
    );

    // Enhance message with group information
    const enhancedMessage = `**Group:** ${group.name}\n\n${message}`;

    // Send notifications to all webhook URLs in the group
    let sentCount = 0;
    let failedCount = 0;

    for (const webhookUrl of group.webhookUrls) {
      try {
        // Dispatch to each webhook URL in the group
        await dispatchNotification(
          "teams",
          title,
          enhancedMessage,
          severity,
          webhookUrl
        );
        sentCount++;
        console.log(
          `[Alert] Sent to webhook for group "${group.name}" (${sentCount}/${group.webhookUrls.length})`
        );
      } catch (error) {
        failedCount++;
        console.error(
          `[Alert] Failed to send to webhook for group "${group.name}":`,
          error
        );
      }
    }

    // Mark alert status based on results
    if (sentCount > 0) {
      await markAlertSent(alert.id);
      console.log(
        `[Alert] Sent ${type} alert for ${serviceName} to ${sentCount}/${group.webhookUrls.length} webhooks in group "${group.name}"`
      );
    } else {
      await markAlertFailed(
        alert.id,
        `Failed to send to all ${failedCount} webhooks`
      );
    }
  } catch (error) {
    console.error("[Alert] Error sending alert:", error);
  }
}

// Alert on incident opened
export async function alertIncidentOpened(
  serviceId: string,
  serviceName: string,
  incidentId: string
): Promise<void> {
  await sendAlert(
    serviceId,
    serviceName,
    "INCIDENT_OPENED",
    "CRITICAL",
    `🔴 Service Down: ${serviceName}`,
    `An incident has been detected for ${serviceName}. The service is currently DOWN and health checks are failing.`,
    incidentId
  );
}

// Alert on incident closed
export async function alertIncidentClosed(
  serviceId: string,
  serviceName: string,
  incidentId: string,
  durationMs: number
): Promise<void> {
  const durationMin = Math.round(durationMs / 1000 / 60);

  await sendAlert(
    serviceId,
    serviceName,
    "INCIDENT_CLOSED",
    "INFO",
    `✅ Service Recovered: ${serviceName}`,
    `The incident for ${serviceName} has been resolved. The service is now UP. Downtime: ${durationMin} minutes.`,
    incidentId
  );
}
