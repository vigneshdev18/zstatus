import { NextResponse } from "next/server";
import { scheduler } from "@/lib/scheduler";
import { heartbeatJob } from "@/lib/jobs/heartbeat";
import { healthCheckJob } from "@/lib/jobs/healthcheck";

// Initialize scheduler on server startup
let initialized = false;

async function initializeScheduler() {
  if (initialized) return;

  initialized = true;

  console.log("[API] Initializing scheduler...");

  // Start the scheduler (creates indexes)
  await scheduler.start();

  // Register heartbeat job (runs every 60 seconds)
  scheduler.registerJob({
    name: "heartbeat",
    interval: 60000, // 60 seconds
    handler: heartbeatJob,
  });

  // Register health check job (runs every 60 seconds)
  scheduler.registerJob({
    name: "healthcheck",
    interval: 60000, // 60 seconds
    handler: healthCheckJob,
  });

  console.log("[API] Scheduler initialized with 2 jobs");
}

// Call initialization when module loads
initializeScheduler();

export async function GET() {
  const status = scheduler.getStatus();

  return NextResponse.json({
    message: "Scheduler is running",
    ...status,
  });
}
