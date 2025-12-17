export async function register() {
  // This runs once when the server starts
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log(
      "[Instrumentation] Initializing scheduler on server startup..."
    );

    // Dynamic imports to prevent MongoDB from being bundled for client
    const { scheduler } = await import("./lib/scheduler");
    const { heartbeatJob } = await import("./lib/jobs/heartbeat");
    const { healthCheckJob } = await import("./lib/jobs/healthcheck");

    // Start the scheduler (creates indexes)
    await scheduler.start();

    // Register heartbeat job (runs every 60 seconds)
    scheduler.registerJob({
      name: "heartbeat",
      interval: 60000,
      handler: heartbeatJob,
    });

    // Register health check job (runs every 60 seconds)
    scheduler.registerJob({
      name: "healthcheck",
      interval: 60000,
      handler: healthCheckJob,
    });

    console.log("[Instrumentation] Scheduler initialized with 2 jobs");
  }
}
