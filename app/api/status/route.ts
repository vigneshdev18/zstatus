import { NextResponse } from "next/server";
import { testConnection, getDatabase } from "@/lib/mongodb";

export async function GET() {
  try {
    // Test database connection
    const isConnected = await testConnection();

    if (!isConnected) {
      return NextResponse.json(
        {
          database: "disconnected",
          error: "Failed to connect to MongoDB",
        },
        { status: 500 }
      );
    }

    // Get last heartbeat
    const db = await getDatabase();
    const lastHeartbeat = await db
      .collection("heartbeats")
      .findOne({}, { sort: { timestamp: -1 } });

    return NextResponse.json({
      database: "connected",
      scheduler: "running",
      lastHeartbeat: lastHeartbeat?.timestamp || null,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("[API] Status check failed:", error);
    return NextResponse.json(
      {
        database: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
