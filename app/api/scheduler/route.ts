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

  // Register heartbeat job (runs every minute)
  scheduler.registerJob({
    name: "heartbeat",
    schedule: "* * * * *", // Every minute
    handler: heartbeatJob,
  });

  // Register health check job (runs every minute)
  scheduler.registerJob({
    name: "healthcheck",
    schedule: "* * * * *", // Every minute
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
