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

    console.log("[Instrumentation] Scheduler initialized with 2 jobs");

    // Graceful shutdown handlers
    const gracefulShutdown = (signal: string) => {
      console.log(
        `\n[Instrumentation] Received ${signal}, shutting down gracefully...`
      );
      scheduler.stop();
      process.exit(0);
    };

    // Handle termination signals
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  }
}
