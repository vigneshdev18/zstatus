import { getDatabase } from "@/lib/mongodb";
import { HealthCheck } from "@/lib/types/healthcheck";
import { ObjectId } from "mongodb";
import { randomUUID } from "node:crypto";

const HEALTHCHECKS_COLLECTION = "healthchecks";

// Store a health check result
export async function createHealthCheck(
  serviceId: string,
  serviceName: string,
  status: "UP" | "DOWN",
  responseTime: number,
  statusCode?: number,
  errorMessage?: string,
  errorType?: string,
  metrics?: any
): Promise<HealthCheck> {
  const db = await getDatabase();

  const healthCheck: HealthCheck = {
    _id: new ObjectId(),
    id: randomUUID(),
    serviceId,
    serviceName,
    status,
    responseTime,
    ...(statusCode && { statusCode }),
    ...(errorMessage && { errorMessage }),
    ...(errorType && { errorType }),
    ...(metrics && { metrics }),
    timestamp: new Date(),
  };

  await db
    .collection<HealthCheck>(HEALTHCHECKS_COLLECTION)
    .insertOne(healthCheck);
  return healthCheck;
}

// Get recent health checks for a service
export async function getHealthChecksByServiceId(
  serviceId: string,
  limit: number = 10
): Promise<HealthCheck[]> {
  const db = await getDatabase();

  const checks = await db
    .collection<HealthCheck>(HEALTHCHECKS_COLLECTION)
    .find({ serviceId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();

  return checks;
}

// Get health checks for a service with pagination and filters
export async function getHealthChecksByServiceIdPaginated(
  serviceId: string,
  offset: number = 0,
  limit: number = 20,
  filters?: {
    fromDate?: Date;
    toDate?: Date;
    minResponseTime?: number;
    maxResponseTime?: number;
    status?: string;
  }
): Promise<HealthCheck[]> {
  const db = await getDatabase();

  // Build query with filters
  const query: any = { serviceId };

  // Time range filter
  if (filters?.fromDate || filters?.toDate) {
    query.timestamp = {};
    if (filters.fromDate) {
      query.timestamp.$gte = filters.fromDate;
    }
    if (filters.toDate) {
      query.timestamp.$lte = filters.toDate;
    }
  }

  // Response time filter
  if (
    filters?.minResponseTime !== undefined ||
    filters?.maxResponseTime !== undefined
  ) {
    query.responseTime = {};
    if (filters.minResponseTime !== undefined) {
      query.responseTime.$gte = filters.minResponseTime;
    }
    if (filters.maxResponseTime !== undefined) {
      query.responseTime.$lte = filters.maxResponseTime;
    }
  }

  // Status filter
  if (filters?.status && filters.status !== "all") {
    query.status = filters.status;
  }

  const checks = await db
    .collection<HealthCheck>(HEALTHCHECKS_COLLECTION)
    .find(query)
    .sort({ timestamp: -1 })
    .skip(offset)
    .limit(limit)
    .toArray();

  return checks;
}

// Count total health checks for a service with filters
export async function countHealthChecksByServiceId(
  serviceId: string,
  filters?: {
    fromDate?: Date;
    toDate?: Date;
    minResponseTime?: number;
    maxResponseTime?: number;
    status?: string;
  }
): Promise<number> {
  const db = await getDatabase();

  // Build query with filters
  const query: any = { serviceId };

  // Time range filter
  if (filters?.fromDate || filters?.toDate) {
    query.timestamp = {};
    if (filters.fromDate) {
      query.timestamp.$gte = filters.fromDate;
    }
    if (filters.toDate) {
      query.timestamp.$lte = filters.toDate;
    }
  }

  // Response time filter
  if (
    filters?.minResponseTime !== undefined ||
    filters?.maxResponseTime !== undefined
  ) {
    query.responseTime = {};
    if (filters.minResponseTime !== undefined) {
      query.responseTime.$gte = filters.minResponseTime;
    }
    if (filters.maxResponseTime !== undefined) {
      query.responseTime.$lte = filters.maxResponseTime;
    }
  }

  // Status filter
  if (filters?.status && filters.status !== "all") {
    query.status = filters.status;
  }

  const count = await db
    .collection<HealthCheck>(HEALTHCHECKS_COLLECTION)
    .countDocuments(query);

  return count;
}

// Get recent health checks (with optional date range filter)
export async function getRecentHealthChecks(
  limit: number = 100,
  fromDate?: Date,
  toDate?: Date
): Promise<HealthCheck[]> {
  const db = await getDatabase();

  // Build query with optional date range
  const query: any = {};

  if (fromDate || toDate) {
    query.timestamp = {};
    if (fromDate) {
      query.timestamp.$gte = fromDate;
    }
    if (toDate) {
      query.timestamp.$lte = toDate;
    }
  }

  const checks = await db
    .collection<HealthCheck>(HEALTHCHECKS_COLLECTION)
    .find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();

  return checks;
}

// Get last health check for a service
export async function getLastHealthCheck(
  serviceId: string
): Promise<HealthCheck | null> {
  const db = await getDatabase();

  const check = await db
    .collection<HealthCheck>(HEALTHCHECKS_COLLECTION)
    .findOne({ serviceId }, { sort: { timestamp: -1 } });

  return check;
}

// Get service metrics using aggregation
export async function getServiceMetrics(serviceId: string): Promise<{
  avgResponseTime: number;
  throughput: number;
}> {
  const db = await getDatabase();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // Aggregation pipeline to calculate metrics
  const result = await db
    .collection<HealthCheck>(HEALTHCHECKS_COLLECTION)
    .aggregate([
      { $match: { serviceId } },
      { $sort: { timestamp: -1 } },
      {
        $facet: {
          // Get last 10 checks for average response time
          avgResponse: [
            { $limit: 10 },
            {
              $group: {
                _id: null,
                avg: { $avg: "$responseTime" },
              },
            },
          ],
          // Count checks in last hour for throughput
          throughput: [
            {
              $match: {
                timestamp: { $gte: oneHourAgo },
              },
            },
            { $count: "count" },
          ],
        },
      },
    ])
    .toArray();

  const metrics = result[0];
  const avgResponseTime = metrics?.avgResponse[0]?.avg
    ? Math.round(metrics.avgResponse[0].avg)
    : 0;
  const throughput = metrics?.throughput[0]?.count || 0;

  return { avgResponseTime, throughput };
}
