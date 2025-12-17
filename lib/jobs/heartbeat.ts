import { getDatabase } from "@/lib/mongodb";

// Heartbeat job - runs every minute to demonstrate scheduler functionality
export async function heartbeatJob() {
  const timestamp = new Date();
  console.log(`[Heartbeat] ${timestamp.toISOString()}`);

  try {
    // Store heartbeat in database
    const db = await getDatabase();
    await db.collection("heartbeats").insertOne({
      timestamp,
      status: "alive",
    });
  } catch (error) {
    console.error("[Heartbeat] Failed to store in database:", error);
  }
}
