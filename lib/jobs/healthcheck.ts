import { getAllServices } from "@/lib/db/services";
import { createHealthCheck } from "@/lib/db/healthchecks";
import { runHealthCheck } from "@/lib/healthcheck/runner";
import { detectIncident } from "@/lib/incidents/detector";
import { updateServiceStatus } from "@/lib/db/service-status";
import { getSettings } from "@/lib/db/settings";

// Health check job - runs for all services
export async function healthCheckJob() {
  try {
    // Check if health checks are globally enabled
    const settings = await getSettings();

    console.log(
      `[HealthCheck] globalHealthChecksEnabled: ${settings.globalHealthChecksEnabled}`
    );

    if (!settings.globalHealthChecksEnabled) {
      console.log(
        "[HealthCheck] Global health checks disabled. Skipping all checks."
      );
      return;
    }

    const services = await getAllServices();

    if (services.length === 0) {
      console.log("[HealthCheck] No services configured");
      return;
    }

    console.log(
      `[HealthCheck] Running checks for ${services.length} service(s)`
    );

    // Run health checks for all services
    for (const service of services) {
      try {
        // Build config based on service type
        const config: any = {
          timeout: service.timeout,
        };

        switch (service.serviceType) {
          case "api":
            config.url = service.healthCheckUrl;
            config.method = service.httpMethod || "GET";
            config.headers = service.requestHeaders;
            config.body = service.requestBody;
            break;
          case "mongodb":
            config.mongoConnectionString = service.mongoConnectionString;
            config.mongoDatabase = service.mongoDatabase;
            break;
          case "elasticsearch":
            config.esConnectionString = service.esConnectionString;
            break;
        }

        const result = await runHealthCheck(service.serviceType, config);

        const timestamp = new Date();

        // Store the health check result
        await createHealthCheck(
          service.id,
          service.name,
          result.status,
          result.responseTime,
          result.statusCode,
          result.errorMessage
        );

        // Detect incidents based on state transitions
        await detectIncident(
          service.id,
          service.name,
          result.status,
          service.lastStatus || null,
          timestamp
        );

        // Update service last status
        await updateServiceStatus(service.id, result.status, timestamp);

        console.log(
          `[HealthCheck] ${service.name} [${service.serviceType}]: ${result.status} (${result.responseTime}ms)`
        );
      } catch (error) {
        console.error(`[HealthCheck] Error checking ${service.name}:`, error);

        const timestamp = new Date();

        // Store failed check
        await createHealthCheck(
          service.id,
          service.name,
          "DOWN",
          0,
          undefined,
          error instanceof Error ? error.message : "Unknown error"
        );

        // Detect incident for error case
        await detectIncident(
          service.id,
          service.name,
          "DOWN",
          service.lastStatus || null,
          timestamp
        );

        // Update service status to DOWN
        await updateServiceStatus(service.id, "DOWN", timestamp);
      }
    }
  } catch (error) {
    console.error("[HealthCheck] Job failed:", error);
  }
}
