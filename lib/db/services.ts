import { getDatabase } from "@/lib/mongodb";
import {
  Service,
  CreateServiceInput,
  UpdateServiceInput,
} from "@/lib/types/service";
import { ObjectId } from "mongodb";
import { randomUUID } from "node:crypto";

const SERVICES_COLLECTION = "services";

// Create a new service
export async function createService(
  input: CreateServiceInput
): Promise<Service> {
  const db = await getDatabase();

  const service: Service = {
    _id: new ObjectId(),
    id: randomUUID(),
    name: input.name,
    serviceType: input.serviceType,
    timeout: input.timeout,
    checkInterval: input.checkInterval,

    // API fields
    ...(input.healthCheckUrl && { healthCheckUrl: input.healthCheckUrl }),
    ...(input.httpMethod && { httpMethod: input.httpMethod }),
    ...(input.requestHeaders && { requestHeaders: input.requestHeaders }),
    ...(input.requestBody && { requestBody: input.requestBody }),

    // MongoDB fields
    ...(input.mongoConnectionString && {
      mongoConnectionString: input.mongoConnectionString,
    }),
    ...(input.mongoDatabase && { mongoDatabase: input.mongoDatabase }),

    // Elasticsearch fields
    ...(input.esConnectionString && {
      esConnectionString: input.esConnectionString,
    }),

    // Optional metadata
    ...(input.groupId && { groupId: input.groupId }),
    alertsEnabled:
      input.alertsEnabled !== undefined ? input.alertsEnabled : true, // Default to true
    ...(input.description && { description: input.description }),
    ...(input.team && { team: input.team }),
    ...(input.owner && { owner: input.owner }),
    ...(input.grafanaDashboardId && {
      grafanaDashboardId: input.grafanaDashboardId,
    }),

    // Response time alerting with defaults
    responseTimeWarningMs: input.responseTimeWarningMs ?? 3000, // Default 3 seconds
    responseTimeWarningAttempts: input.responseTimeWarningAttempts ?? 3,
    responseTimeCriticalMs: input.responseTimeCriticalMs ?? 5000, // Default 5 seconds
    responseTimeCriticalAttempts: input.responseTimeCriticalAttempts ?? 3,
    consecutiveSlowWarning: 0, // Initialize counters
    consecutiveSlowCritical: 0,

    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.collection<Service>(SERVICES_COLLECTION).insertOne(service);
  return service;
}

// Get all active (non-deleted) services
export async function getAllServices(): Promise<Service[]> {
  const db = await getDatabase();
  const services = await db
    .collection<Service>(SERVICES_COLLECTION)
    .find({ deletedAt: { $exists: false } }) // Exclude soft-deleted services
    .sort({ createdAt: -1 })
    .toArray();

  return services;
}

// Get all active services with metrics (avg response time)
export async function getAllServicesWithMetrics(): Promise<
  (Service & { avgResponseTime?: number })[]
> {
  const db = await getDatabase();

  const servicesWithMetrics = await db
    .collection<Service>(SERVICES_COLLECTION)
    .aggregate([
      // Only active services
      { $match: { deletedAt: { $exists: false } } },

      // Join with healthchecks to calculate average response time
      {
        $lookup: {
          from: "healthchecks",
          let: { serviceId: "$id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$serviceId", "$$serviceId"] },
              },
            },
            { $sort: { timestamp: -1 } },
            { $limit: 100 }, // Last 100 checks
            {
              $group: {
                _id: null,
                avgResponseTime: { $avg: "$responseTime" },
              },
            },
          ],
          as: "metrics",
        },
      },

      // Add avgResponseTime field
      {
        $addFields: {
          avgResponseTime: {
            $ifNull: [{ $arrayElemAt: ["$metrics.avgResponseTime", 0] }, null],
          },
        },
      },

      // Remove temporary metrics array
      {
        $project: {
          metrics: 0,
        },
      },

      // Sort by creation date
      { $sort: { createdAt: -1 } },
    ])
    .toArray();

  return servicesWithMetrics as (Service & { avgResponseTime?: number })[];
}

// Get service by ID (excludes deleted services)
export async function getServiceById(id: string): Promise<Service | null> {
  const db = await getDatabase();
  const service = await db
    .collection<Service>(SERVICES_COLLECTION)
    .findOne({ id, deletedAt: { $exists: false } }); // Exclude soft-deleted services

  return service;
}

// Update service
export async function updateService(
  id: string,
  input: UpdateServiceInput
): Promise<Service | null> {
  const db = await getDatabase();

  const result = await db
    .collection<Service>(SERVICES_COLLECTION)
    .findOneAndUpdate(
      { id },
      {
        $set: {
          ...input,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

  return result || null;
}

// Soft delete service (sets deletedAt timestamp)
export async function deleteService(id: string): Promise<boolean> {
  const db = await getDatabase();

  const result = await db
    .collection<Service>(SERVICES_COLLECTION)
    .findOneAndUpdate(
      { id, deletedAt: { $exists: false } }, // Only delete if not already deleted
      { $set: { deletedAt: new Date(), updatedAt: new Date() } },
      { returnDocument: "after" }
    );

  return result !== null;
}

// Get all deleted services
export async function getDeletedServices(): Promise<Service[]> {
  const db = await getDatabase();
  const services = await db
    .collection<Service>(SERVICES_COLLECTION)
    .find({ deletedAt: { $exists: true } }) // Only soft-deleted services
    .sort({ deletedAt: -1 }) // Most recently deleted first
    .toArray();

  return services;
}

// Restore a soft-deleted service
export async function restoreService(id: string): Promise<boolean> {
  const db = await getDatabase();

  const result = await db
    .collection<Service>(SERVICES_COLLECTION)
    .findOneAndUpdate(
      { id, deletedAt: { $exists: true } }, // Only restore if deleted
      { $unset: { deletedAt: "" }, $set: { updatedAt: new Date() } },
      { returnDocument: "after" }
    );

  return result !== null;
}
