import { getDatabase } from "@/lib/mongodb";

// Update incident correlation metadata
export async function updateIncidentCorrelation(
  incidentId: string,
  correlationId: string,
  rootCauseServiceId: string,
  impactedServiceIds: string[]
): Promise<void> {
  const db = await getDatabase();

  await db.collection("incidents").updateOne(
    { id: incidentId },
    {
      $set: {
        isCorrelated: true,
        correlationId,
        rootCauseServiceId,
        impactedServiceIds,
        updatedAt: new Date(),
      },
    }
  );
}

// Get all incidents in a correlation group
export async function getCorrelatedIncidents(correlationId: string) {
  const db = await getDatabase();

  return await db
    .collection("incidents")
    .find({ correlationId })
    .sort({ startTime: 1 })
    .toArray();
}
