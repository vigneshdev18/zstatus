import { getDatabase } from "@/lib/mongodb";
import {
  Alert,
  AlertType,
  AlertSeverity,
  NotificationChannel,
  AlertStatus,
} from "@/lib/types/alert";
import { ObjectId } from "mongodb";
import { randomUUID } from "node:crypto";

const ALERTS_COLLECTION = "alerts";

// Create a new alert
export async function createAlert(
  serviceId: string,
  serviceName: string,
  type: AlertType,
  severity: AlertSeverity,
  title: string,
  message: string,
  channels: NotificationChannel[],
  incidentId?: string
): Promise<Alert> {
  const db = await getDatabase();

  const alert: Alert = {
    _id: new ObjectId(),
    id: randomUUID(),
    serviceId,
    serviceName,
    type,
    severity,
    title,
    message,
    status: "PENDING",
    channels,
    incidentId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.collection<Alert>(ALERTS_COLLECTION).insertOne(alert);
  return alert;
}

// Mark alert as sent
export async function markAlertSent(id: string): Promise<void> {
  const db = await getDatabase();

  await db.collection<Alert>(ALERTS_COLLECTION).updateOne(
    { id },
    {
      $set: {
        status: "SENT",
        sentAt: new Date(),
        updatedAt: new Date(),
      },
    }
  );
}

// Mark alert as failed
export async function markAlertFailed(
  id: string,
  errorMessage: string
): Promise<void> {
  const db = await getDatabase();

  await db.collection<Alert>(ALERTS_COLLECTION).updateOne(
    { id },
    {
      $set: {
        status: "FAILED",
        errorMessage,
        updatedAt: new Date(),
      },
    }
  );
}

// Get all alerts
export async function getAllAlerts(limit: number = 100): Promise<Alert[]> {
  const db = await getDatabase();

  return await db
    .collection<Alert>(ALERTS_COLLECTION)
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

// Get alerts by service
export async function getAlertsByServiceId(
  serviceId: string,
  limit: number = 50
): Promise<Alert[]> {
  const db = await getDatabase();

  return await db
    .collection<Alert>(ALERTS_COLLECTION)
    .find({ serviceId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

// Get recent alerts for deduplication check
export async function getRecentAlerts(
  serviceId: string,
  type: AlertType,
  minutesBack: number = 5
): Promise<Alert[]> {
  const db = await getDatabase();
  const cutoffTime = new Date(Date.now() - minutesBack * 60 * 1000);

  return await db
    .collection<Alert>(ALERTS_COLLECTION)
    .find({
      serviceId,
      type,
      createdAt: { $gte: cutoffTime },
    })
    .toArray();
}
