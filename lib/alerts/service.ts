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
import { getServiceById, updateService } from "@/lib/db/services";
import { getSettings } from "@/lib/db/settings";
import { isEmailEnabled } from "../constants/app.constants";

// Send an alert with deduplication and maintenance window checks
export async function sendAlert(
  serviceId: string,
  serviceName: string,
  type: AlertType,
  severity: AlertSeverity,
  title: string,
  message: string,
  incidentId?: string,
): Promise<void> {
  try {
    // Check global alerts setting first
    const settings = await getSettings();
    if (!settings.globalAlertsEnabled) {
      console.log(
        `[Alert] Global alerts disabled. Skipping alert for ${serviceName}.`,
      );
      return;
    }

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
        `[Alert] Alerts disabled for service ${service.name} (ID: ${service.id}). Skipping notification.`,
      );
      return;
    }

    // 1. Initialize recipients with Env configured recipients
    let emailRecipients: string[] = [];
    const webhookUrls: string[] = [];

    if (process.env.ALERT_RECIPIENTS) {
      const envRecipients = process.env.ALERT_RECIPIENTS.split(",")
        .map((e) => e.trim())
        .filter((e) => e.length > 0);

      if (envRecipients.length > 0) {
        emailRecipients.push(...envRecipients);
        console.log(
          `[Alert] Added ${envRecipients.length} recipient(s) from ALERT_RECIPIENTS env variable`,
        );
      }
    }

    // 2. Check Group and append its channels
    const group = await getGroupByServiceId(serviceId);

    if (group) {
      // Add group webhooks
      if (group.webhookUrls && group.webhookUrls.length > 0) {
        webhookUrls.push(...group.webhookUrls);
      }

      // Add group emails
      if (group.alertEmails && group.alertEmails.length > 0) {
        emailRecipients.push(...group.alertEmails);
        console.log(
          `[Alert] Added ${group.alertEmails.length} group-specific email(s)`,
        );
      }
    } else {
      console.log(
        `[Alert] No group assigned to ${serviceName}. Using only environment configuration.`,
      );
    }

    // Deduplicate email recipients
    emailRecipients = [...new Set(emailRecipients)];

    // 3. Verify we have at least one channel to send to
    const emailAlertsEnabled =
      settings.serviceEmailsEnabled && service.emailAlertsEnabled === true;
    const hasWebhooks = webhookUrls.length > 0;
    const hasEmails = emailRecipients.length > 0 && emailAlertsEnabled;

    if (!hasWebhooks && !hasEmails) {
      console.log(
        `[Alert] Skipping alert for ${serviceName} - no valid notification channels available.`,
      );
      // Detailed logging for debugging
      if (!emailAlertsEnabled && emailRecipients.length > 0)
        console.log(`[Alert] Emails exist but email alerts are disabled.`);
      if (emailAlertsEnabled && emailRecipients.length === 0)
        console.log(`[Alert] Email alerts enabled but no recipients found.`);
      return;
    }

    // 4. Maintenance & Cooldown Checks
    const inMaintenance = await isInMaintenance(serviceId);
    if (inMaintenance) {
      console.log(
        `[Alert] Skipping alert for ${serviceName} - in maintenance window`,
      );
      return;
    }

    const cooldownMinutes = settings.alertCooldownMinutes;
    const recentAlerts = await getRecentAlerts(
      serviceId,
      type,
      cooldownMinutes,
    );
    if (recentAlerts.length > 0) {
      const timeSinceLastAlert = Math.round(
        (Date.now() - new Date(recentAlerts[0].createdAt).getTime()) / 1000,
      );
      console.log(
        `[Alert] Skipping alert for ${serviceName} - cooldown active (${cooldownMinutes} min). Last alert sent ${timeSinceLastAlert}s ago.`,
      );
      return;
    }

    // 5. Create Alert Record
    const channels: NotificationChannel[] = [];
    if (hasWebhooks) channels.push("teams");
    if (hasEmails) channels.push("email");

    const alert = await createAlert(
      serviceId,
      serviceName,
      type,
      severity,
      title,
      message,
      channels,
      incidentId,
    );

    // Enhance message with group information if available
    const enhancedMessage = group
      ? `**Group:** ${group.name}\\n\\n${message}`
      : message;

    // Track statistics
    let webhookSentCount = 0;
    let webhookFailedCount = 0;
    let emailSentCount = 0;
    let emailFailedCount = 0;

    // 6. Send Webhooks
    if (hasWebhooks) {
      console.log(
        `[Alert] Sending webhook alerts for ${serviceName} to ${webhookUrls.length} webhook(s)`,
      );

      for (const webhookUrl of webhookUrls) {
        try {
          await dispatchNotification(
            "teams",
            title,
            enhancedMessage,
            severity,
            webhookUrl,
          );
          webhookSentCount++;
        } catch (error) {
          webhookFailedCount++;
          console.error(`[Alert] Failed to send to webhook endpoint:`, error);
        }
      }
    }

    // 7. Send Emails
    if (hasEmails) {
      // Check message type enablement for email specifically
      let shouldSendEmail = false;
      if (type === "INCIDENT_OPENED" || type === "INCIDENT_CLOSED") {
        shouldSendEmail = service.downtimeAlerts === true;
      } else if (type === "RESPONSE_TIME" || type === "SERVICE_DEGRADED") {
        shouldSendEmail = service.responseTimeAlerts === true;
      }

      if (shouldSendEmail) {
        console.log(
          `[Alert] Sending email alert for ${serviceName} to ${emailRecipients.length} recipient(s)`,
        );

        // Prepare email content
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: ${
              severity === "CRITICAL" ? "#ef4444" : "#f59e0b"
            };">${title}</h2>
            <p><strong>Service:</strong> ${serviceName}</p>
            ${group ? `<p><strong>Group:</strong> ${group.name}</p>` : ""}
            <p><strong>Severity:</strong> ${severity}</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="white-space: pre-wrap; margin: 0;">${message}</p>
            </div>
            <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
              Sent by ZStatus Monitor
            </p>
          </div>
        `;

        const { sendEmail } = await import("@/lib/notifications/email");

        for (const email of emailRecipients) {
          try {
            await sendEmail({
              to: email,
              subject: `[${severity}] ${title}`,
              html: emailHtml,
            });
            emailSentCount++;
            console.log(`[Alert] Sent email to ${email}`);
          } catch (error) {
            emailFailedCount++;
            console.error(`[Alert] Failed to send email to ${email}:`, error);
          }
        }
      } else {
        console.log(
          `[Alert] Skipping email alert for ${serviceName} - alert type "${type}" not enabled for this service`,
        );
      }
    }

    // 8. Update Alert Status
    const totalSentCount = webhookSentCount + emailSentCount;
    const totalFailedCount = webhookFailedCount + emailFailedCount;

    if (totalSentCount > 0) {
      await markAlertSent(alert.id);
      await updateService(serviceId, {
        lastAlertType: type,
        lastAlertSentAt: new Date(),
      });

      console.log(
        `[Alert] Alert processed for ${serviceName}. Sent: ${webhookSentCount} webhooks, ${emailSentCount} emails.`,
      );
    } else {
      await markAlertFailed(
        alert.id,
        `Failed to send. Webhooks: ${webhookFailedCount} failed. Emails: ${emailFailedCount} failed.`,
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
  incidentId: string,
): Promise<void> {
  await sendAlert(
    serviceId,
    serviceName,
    "INCIDENT_OPENED",
    "CRITICAL",
    `🔴 Service Down: ${serviceName}`,
    `An incident has been detected for ${serviceName}. The service is currently DOWN and health checks are failing.`,
    incidentId,
  );
}

// Alert on incident closed
export async function alertIncidentClosed(
  serviceId: string,
  serviceName: string,
  incidentId: string,
  durationMs: number,
): Promise<void> {
  const durationMin = Math.round(durationMs / 1000 / 60);

  await sendAlert(
    serviceId,
    serviceName,
    "INCIDENT_CLOSED",
    "INFO",
    `✅ Service Recovered: ${serviceName}`,
    `The incident for ${serviceName} has been resolved. The service is now UP. Downtime: ${durationMin} minutes.`,
    incidentId,
  );
}
