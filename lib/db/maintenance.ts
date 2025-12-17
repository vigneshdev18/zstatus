import { getDatabase } from "@/lib/mongodb";
import { MaintenanceWindow } from "@/lib/types/alert";
import { ObjectId } from "mongodb";
import { randomUUID } from "node:crypto";

const MAINTENANCE_COLLECTION = "maintenance_windows";

// Create a maintenance window
export async function createMaintenanceWindow(
  serviceId: string,
  serviceName: string,
  startTime: Date,
  endTime: Date,
  reason?: string
): Promise<MaintenanceWindow> {
  const db = await getDatabase();

  const window: MaintenanceWindow = {
    _id: new ObjectId(),
    id: randomUUID(),
    serviceId,
    serviceName,
    startTime,
    endTime,
    reason,
    createdAt: new Date(),
  };

  await db
    .collection<MaintenanceWindow>(MAINTENANCE_COLLECTION)
    .insertOne(window);
  return window;
}

// Check if a service is in maintenance mode
export async function isInMaintenance(serviceId: string): Promise<boolean> {
  const db = await getDatabase();
  const now = new Date();

  const activeWindow = await db
    .collection<MaintenanceWindow>(MAINTENANCE_COLLECTION)
    .findOne({
      serviceId,
      startTime: { $lte: now },
      endTime: { $gte: now },
    });

  return activeWindow !== null;
}

// Get active maintenance windows
export async function getActiveMaintenanceWindows(): Promise<
  MaintenanceWindow[]
> {
  const db = await getDatabase();
  const now = new Date();

  return await db
    .collection<MaintenanceWindow>(MAINTENANCE_COLLECTION)
    .find({
      startTime: { $lte: now },
      endTime: { $gte: now },
    })
    .toArray();
}

// Get all maintenance windows for a service
export async function getMaintenanceWindows(
  serviceId: string
): Promise<MaintenanceWindow[]> {
  const db = await getDatabase();

  return await db
    .collection<MaintenanceWindow>(MAINTENANCE_COLLECTION)
    .find({ serviceId })
    .sort({ startTime: -1 })
    .toArray();
}

// Delete maintenance window
export async function deleteMaintenanceWindow(id: string): Promise<void> {
  const db = await getDatabase();

  await db
    .collection<MaintenanceWindow>(MAINTENANCE_COLLECTION)
    .deleteOne({ id });
}
