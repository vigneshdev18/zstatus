import { getDatabase } from "@/lib/mongodb";
import { Incident, IncidentStatus } from "@/lib/types/incident";
import { ObjectId } from "mongodb";
import { randomUUID } from "node:crypto";

const INCIDENTS_COLLECTION = "incidents";

// Create a new incident
export async function createIncident(
  serviceId: string,
  serviceName: string,
  startTime: Date
): Promise<Incident> {
  const db = await getDatabase();

  const incident: Incident = {
    _id: new ObjectId(),
    id: randomUUID(),
    serviceId,
    serviceName,
    status: "OPEN",
    startTime,
    failedChecks: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.collection<Incident>(INCIDENTS_COLLECTION).insertOne(incident);
  return incident;
}

// Get incident by ID
export async function getIncidentById(id: string): Promise<Incident | null> {
  const db = await getDatabase();
  return await db.collection<Incident>(INCIDENTS_COLLECTION).findOne({ id });
}

// Get active (open) incident for a service
export async function getActiveIncident(
  serviceId: string
): Promise<Incident | null> {
  const db = await getDatabase();
  return await db
    .collection<Incident>(INCIDENTS_COLLECTION)
    .findOne({ serviceId, status: "OPEN" }, { sort: { startTime: -1 } });
}

// Get all incidents for a service
export async function getIncidentsByServiceId(
  serviceId: string,
  limit: number = 50
): Promise<Incident[]> {
  const db = await getDatabase();
  return await db
    .collection<Incident>(INCIDENTS_COLLECTION)
    .find({ serviceId })
    .sort({ startTime: -1 })
    .limit(limit)
    .toArray();
}

// Get all incidents
export async function getAllIncidents(
  limit: number = 100
): Promise<Incident[]> {
  const db = await getDatabase();
  return await db
    .collection<Incident>(INCIDENTS_COLLECTION)
    .find({})
    .sort({ startTime: -1 })
    .limit(limit)
    .toArray();
}

// Increment failed checks counter
export async function incrementFailedChecks(incidentId: string): Promise<void> {
  const db = await getDatabase();

  await db.collection<Incident>(INCIDENTS_COLLECTION).updateOne(
    { id: incidentId },
    {
      $inc: { failedChecks: 1 },
      $set: { updatedAt: new Date() },
    }
  );
}

// Update failed checks count to a specific value (for backfilling)
export async function updateIncidentFailedChecks(
  incidentId: string,
  count: number
): Promise<void> {
  const db = await getDatabase();

  await db.collection<Incident>(INCIDENTS_COLLECTION).updateOne(
    { id: incidentId },
    {
      $set: {
        failedChecks: count,
        updatedAt: new Date(),
      },
    }
  );
}

// Close an incident
export async function closeIncident(
  id: string,
  endTime: Date
): Promise<Incident | null> {
  const db = await getDatabase();

  // Get the incident to calculate duration
  const incident = await getIncidentById(id);
  if (!incident) return null;

  const duration = endTime.getTime() - incident.startTime.getTime();

  const result = await db
    .collection<Incident>(INCIDENTS_COLLECTION)
    .findOneAndUpdate(
      { id },
      {
        $set: {
          status: "CLOSED",
          endTime,
          duration,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

  return result || null;
}
