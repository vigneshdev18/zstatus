import { NotificationChannel } from "@/lib/types/alert";

// Microsoft Teams webhook notification
export async function sendTeamsNotification(
  webhookUrl: string,
  title: string,
  message: string,
  severity: "INFO" | "WARNING" | "CRITICAL"
): Promise<void> {
  console.log(`[Alert] Sending notification to Teams channel`);
  const color =
    severity === "CRITICAL"
      ? "FF0000"
      : severity === "WARNING"
      ? "FFA500"
      : "00FF00";

  const card = {
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    summary: title || "ZStatus Alert",
    themeColor: color,
    title: title,
    sections: [
      {
        activityTitle: "ZStatus Alert",
        activitySubtitle: new Date().toLocaleString(),
        markdown: true,
        facts: [
          {
            name: "Severity",
            value: severity,
          },
          {
            name: "Message",
            value: message,
          },
        ],
      },
    ],
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(card),
  });

  if (!response.ok) {
    throw new Error(`Teams notification failed: ${response.statusText}`);
  }
  console.log(`[Alert] Teams notification sent successfully`, response);
}

// Dispatch notification to appropriate channel
export async function dispatchNotification(
  channel: NotificationChannel,
  title: string,
  message: string,
  severity: "INFO" | "WARNING" | "CRITICAL",
  webhookUrl?: string // Optional webhook URL for group-based routing
): Promise<void> {
  console.log(`[Alert] Dispatching notification to ${channel} channel`);
  switch (channel) {
    case "teams":
      // Use provided webhook URL or fall back to env variable
      const teamsWebhook = webhookUrl || process.env.TEAMS_WEBHOOK_URL;
      if (!teamsWebhook) {
        console.warn("[Alert] Teams webhook URL not configured");
        return;
      }
      await sendTeamsNotification(teamsWebhook, title, message, severity);
      break;

    case "email":
      // Email integration would go here
      console.log(`[Alert] Email notification: ${title}`);
      break;

    case "slack":
      // Slack integration would go here
      console.log(`[Alert] Slack notification: ${title}`);
      break;

    default:
      console.warn(`[Alert] Unknown channel: ${channel}`);
  }
}
