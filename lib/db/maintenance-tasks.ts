import { getDatabase } from "@/lib/mongodb";

// Create indexes for optimal query performance
export async function createDatabaseIndexes(): Promise<void> {
  try {
    const db = await getDatabase();

    console.log("[Database] Creating indexes...");

    // Services indexes
    await db.collection("services").createIndex({ id: 1 }, { unique: true });
    await db.collection("services").createIndex({ lastStatus: 1 });
    await db.collection("services").createIndex({ createdAt: 1 });

    // Incidents indexes
    await db.collection("incidents").createIndex({ id: 1 }, { unique: true });
    await db.collection("incidents").createIndex({ serviceId: 1 });
    await db.collection("incidents").createIndex({ status: 1 });
    await db.collection("incidents").createIndex({ startTime: -1 }); // Descending for recent first
    await db.collection("incidents").createIndex({ correlationId: 1 });
    await db
      .collection("incidents")
      .createIndex(
        { serviceId: 1, startTime: -1 },
        { name: "service_timeline" }
      );

    // Health checks indexes
    await db
      .collection("healthchecks")
      .createIndex({ id: 1 }, { unique: true });
    await db.collection("healthchecks").createIndex({ serviceId: 1 });
    await db.collection("healthchecks").createIndex({ timestamp: -1 }); // Recent checks first
    await db
      .collection("healthchecks")
      .createIndex(
        { serviceId: 1, timestamp: -1 },
        { name: "service_health_timeline" }
      );
    await db.collection("healthchecks").createIndex({ status: 1 });

    // Alerts indexes
    await db.collection("alerts").createIndex({ id: 1 }, { unique: true });
    await db.collection("alerts").createIndex({ serviceId: 1 });
    await db.collection("alerts").createIndex({ status: 1 });
    await db.collection("alerts").createIndex({ createdAt: -1 });
    await db
      .collection("alerts")
      .createIndex(
        { serviceId: 1, type: 1, createdAt: -1 },
        { name: "alert_dedup" }
      );

    // Maintenance windows indexes
    await db
      .collection("maintenance_windows")
      .createIndex({ id: 1 }, { unique: true });
    await db.collection("maintenance_windows").createIndex({ serviceId: 1 });
    await db.collection("maintenance_windows").createIndex({
      startTime: 1,
      endTime: 1,
    });

    // Heartbeat indexes
    await db.collection("heartbeats").createIndex({ timestamp: -1 });

    console.log("[Database] Indexes created successfully");
  } catch (error) {
    console.error("[Database] Error creating indexes:", error);
    // Don't throw - indexes might already exist
  }
}

// Cleanup old data to prevent unbounded growth
export async function cleanupOldData(): Promise<void> {
  try {
    const db = await getDatabase();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    // Delete health checks older than 30 days
    const healthResult = await db
      .collection("healthchecks")
      .deleteMany({ timestamp: { $lt: thirtyDaysAgo } });

    if (healthResult.deletedCount > 0) {
      console.log(
        `[Cleanup] Deleted ${healthResult.deletedCount} old health checks`
      );
    }

    // Delete closed incidents older than 90 days
    const incidentResult = await db.collection("incidents").deleteMany({
      status: "CLOSED",
      endTime: { $lt: ninetyDaysAgo },
    });

    if (incidentResult.deletedCount > 0) {
      console.log(
        `[Cleanup] Deleted ${incidentResult.deletedCount} old incidents`
      );
    }

    // Delete old alerts older than 90 days
    const alertResult = await db
      .collection("alerts")
      .deleteMany({ createdAt: { $lt: ninetyDaysAgo } });

    if (alertResult.deletedCount > 0) {
      console.log(`[Cleanup] Deleted ${alertResult.deletedCount} old alerts`);
    }

    // Delete old heartbeats (keep last 1000)
    const heartbeats = await db
      .collection("heartbeats")
      .find({})
      .sort({ timestamp: -1 })
      .skip(1000)
      .toArray();

    if (heartbeats.length > 0) {
      const oldestToKeep = heartbeats[heartbeats.length - 1].timestamp;
      const heartbeatResult = await db
        .collection("heartbeats")
        .deleteMany({ timestamp: { $lt: oldestToKeep } });

      if (heartbeatResult.deletedCount > 0) {
        console.log(
          `[Cleanup] Deleted ${heartbeatResult.deletedCount} old heartbeats`
        );
      }
    }
  } catch (error) {
    console.error("[Cleanup] Error during cleanup:", error);
  }
}
