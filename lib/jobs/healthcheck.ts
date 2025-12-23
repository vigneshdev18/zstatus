import { getAllServices, updateService } from "@/lib/db/services";
import { createHealthCheck } from "@/lib/db/healthchecks";
import { runHealthCheck } from "@/lib/healthcheck/runner";
import { detectIncident } from "@/lib/incidents/detector";
import { updateServiceStatus } from "@/lib/db/service-status";
import { getSettings } from "@/lib/db/settings";
import { sendAlert } from "@/lib/alerts/service";
import { Service } from "@/lib/types/service";

/**
 * Check if response time exceeds thresholds and trigger alerts if needed
 */
async function checkResponseTimeThresholds(
  service: Service,
  responseTime: number,
  timestamp: Date
) {
  const warningMs = service.responseTimeWarningMs ?? 3000;
  const warningAttempts = service.responseTimeWarningAttempts ?? 3;
  const criticalMs = service.responseTimeCriticalMs ?? 5000;
  const criticalAttempts = service.responseTimeCriticalAttempts ?? 3;

  let consecutiveSlowWarning = service.consecutiveSlowWarning ?? 0;
  let consecutiveSlowCritical = service.consecutiveSlowCritical ?? 0;

  // Check critical threshold first (higher priority)
  if (responseTime >= criticalMs) {
    consecutiveSlowCritical++;
    consecutiveSlowWarning = 0; // Reset warning counter

    console.log(
      `[ResponseTime] ${service.name}: CRITICAL threshold breach (${responseTime}ms >= ${criticalMs}ms) - ${consecutiveSlowCritical}/${criticalAttempts} attempts`
    );

    if (consecutiveSlowCritical >= criticalAttempts) {
      // Trigger CRITICAL alert
      await sendAlert(
        service.id,
        service.name,
        "RESPONSE_TIME",
        "CRITICAL",
        `Response Time Critical: ${service.name}`,
        `🔴 RESPONSE TIME CRITICAL\n` +
          `Response time exceeded critical threshold\n` +
          `Current: ${responseTime}ms | Threshold: ${criticalMs}ms\n` +
          `Consecutive slow responses: ${consecutiveSlowCritical}/${criticalAttempts}`
      );

      console.log(
        `[ResponseTime] ${service.name}: CRITICAL alert triggered after ${consecutiveSlowCritical} consecutive attempts`
      );

      // Reset counter after alerting
      consecutiveSlowCritical = 0;
    }
  } else if (responseTime >= warningMs) {
    consecutiveSlowWarning++;
    consecutiveSlowCritical = 0; // Reset critical counter

    console.log(
      `[ResponseTime] ${service.name}: WARNING threshold breach (${responseTime}ms >= ${warningMs}ms) - ${consecutiveSlowWarning}/${warningAttempts} attempts`
    );

    if (consecutiveSlowWarning >= warningAttempts) {
      // Trigger WARNING alert
      await sendAlert(
        service.id,
        service.name,
        "RESPONSE_TIME",
        "WARNING",
        `Response Time Warning: ${service.name}`,
        `⚠️ RESPONSE TIME WARNING\n` +
          `Response time exceeded warning threshold\n` +
          `Current: ${responseTime}ms | Threshold: ${warningMs}ms\n` +
          `Consecutive slow responses: ${consecutiveSlowWarning}/${warningAttempts}`
      );

      console.log(
        `[ResponseTime] ${service.name}: WARNING alert triggered after ${consecutiveSlowWarning} consecutive attempts`
      );

      // Reset counter after alerting
      consecutiveSlowWarning = 0;
    }
  } else {
    // Response time is good - reset both counters
    if (consecutiveSlowWarning > 0 || consecutiveSlowCritical > 0) {
      console.log(
        `[ResponseTime] ${service.name}: Response time normal (${responseTime}ms) - resetting counters`
      );
    }
    consecutiveSlowWarning = 0;
    consecutiveSlowCritical = 0;
  }

  // Update service with new consecutive counts
  await updateService(service.id, {
    consecutiveSlowWarning,
    consecutiveSlowCritical,
  });
}

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
            config.mongoPipelines = service.mongoPipelines;
            break;
          case "elasticsearch":
            config.esConnectionString = service.esConnectionString;
            break;
          case "redis":
            config.redisConnectionString = service.redisConnectionString;
            config.redisPassword = service.redisPassword;
            config.redisDatabase = service.redisDatabase;
            config.redisOperations = service.redisOperations;
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

        // Check response time thresholds (only for UP status)
        if (result.status === "UP") {
          await checkResponseTimeThresholds(
            service,
            result.responseTime,
            timestamp
          );
        }

        // Log status transition for debugging
        if (service.lastStatus !== result.status) {
          console.log(
            `[HealthCheck] ${service.name}: ${service.lastStatus || "null"} → ${
              result.status
            }`
          );
        }

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
