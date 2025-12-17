import { getDatabase } from "@/lib/mongodb";
import { Service } from "@/lib/types/service";
import { HealthCheckStatus } from "@/lib/types/healthcheck";

// Update service last status after health check
export async function updateServiceStatus(
  serviceId: string,
  status: HealthCheckStatus,
  timestamp: Date
): Promise<void> {
  const db = await getDatabase();

  await db.collection<Service>("services").updateOne(
    { id: serviceId },
    {
      $set: {
        lastStatus: status,
        lastCheckedAt: timestamp,
        updatedAt: new Date(),
      },
    }
  );
}
