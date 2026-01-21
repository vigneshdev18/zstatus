import { NextRequest, NextResponse } from "next/server";
import {
  getServiceById,
  updateService,
  deleteService,
  getServiceWithSecrets,
} from "@/lib/db/services";
import { updateServiceSecrets } from "@/lib/db/service-secrets";
import { UpdateServiceInput, Service } from "@/lib/types/service";
import { requireAdmin } from "@/lib/auth/permissions";

// GET /api/services/[id] - Get single service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const service = await getServiceWithSecrets(id);

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Mask secrets for API response
    const maskSecret = (val?: string) => (val ? "********" : undefined);

    return NextResponse.json({
      service: {
        id: service.id,
        name: service.name,
        serviceType: service.serviceType,
        timeout: service.timeout,
        checkInterval: service.checkInterval,

        // API fields
        healthCheckUrl: service.healthCheckUrl,
        httpMethod: service.httpMethod,
        requestHeaders: service.requestHeaders,
        requestBody: service.requestBody,

        // MongoDB fields
        mongoConnectionString: maskSecret(service.mongoConnectionString),
        mongoDatabase: service.mongoDatabase,
        mongoPipelines: service.mongoPipelines,

        // Elasticsearch fields
        esConnectionString: maskSecret(service.esConnectionString),
        esIndex: service.esIndex,
        esQuery: service.esQuery,
        esUsername: maskSecret(service.esUsername),
        esPassword: maskSecret(service.esPassword),
        esApiKey: maskSecret(service.esApiKey),

        // Redis fieldsk
        redisConnectionString: maskSecret(service.redisConnectionString),
        redisPassword: maskSecret(service.redisPassword),
        redisDatabase: service.redisDatabase,
        redisOperations: service.redisOperations,
        redisKeys: service.redisKeys,

        // Metadata
        groupId: service.groupId,
        alertsEnabled:
          service.alertsEnabled !== undefined ? service.alertsEnabled : true,
        description: service.description,
        team: service.team,
        owner: service.owner,
        grafanaDashboardId: service.grafanaDashboardId,

        // Status fields
        lastStatus: service.lastStatus,
        lastCheckedAt: service.lastCheckedAt?.toISOString(),
        lastAlertType: service.lastAlertType,
        lastAlertSentAt: service.lastAlertSentAt?.toISOString(),

        // Response time alerting
        responseTimeWarningMs: service.responseTimeWarningMs,
        responseTimeWarningAttempts: service.responseTimeWarningAttempts,
        responseTimeCriticalMs: service.responseTimeCriticalMs,
        responseTimeCriticalAttempts: service.responseTimeCriticalAttempts,

        // Retry configuration
        maxRetries: service.maxRetries,
        retryDelayMs: service.retryDelayMs,

        // Connection pooling
        connectionPoolEnabled: service.connectionPoolEnabled,
        connectionPoolSize: service.connectionPoolSize,

        createdAt: service.createdAt.toISOString(),
        updatedAt: service.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[API] Error fetching service:", error);
    return NextResponse.json(
      { error: "Failed to fetch service" },
      { status: 500 },
    );
  }
}

// PUT /api/services/[id] - Update service (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Check admin permission
    await requireAdmin(request);

    const { id } = await params;
    const body = await request.json();

    const updateData: UpdateServiceInput = {
      name: body.name,
      timeout: body.timeout,
      checkInterval: body.checkInterval,

      // Protocol-specific fields
      healthCheckUrl: body.healthCheckUrl,
      httpMethod: body.httpMethod,
      requestHeaders: body.requestHeaders,
      requestBody: body.requestBody,
      mongoDatabase: body.mongoDatabase,
      mongoPipelines: body.mongoPipelines,
      esIndex: body.esIndex,
      esQuery: body.esQuery,

      // Redis fields
      redisDatabase: body.redisDatabase,
      redisOperations: body.redisOperations,
      redisKeys: body.redisKeys,

      // Metadata
      groupId: body.groupId,
      alertsEnabled: body.alertsEnabled,
      description: body.description,
      team: body.team,
      owner: body.owner,
      grafanaDashboardId: body.grafanaDashboardId,

      // Response time alerting
      responseTimeWarningMs: body.responseTimeWarningMs,
      responseTimeWarningAttempts: body.responseTimeWarningAttempts,
      responseTimeCriticalMs: body.responseTimeCriticalMs,
      responseTimeCriticalAttempts: body.responseTimeCriticalAttempts,

      // Retry configuration
      maxRetries: body.maxRetries,
      retryDelayMs: body.retryDelayMs,

      // Connection pooling
      connectionPoolEnabled: body.connectionPoolEnabled,
      connectionPoolSize: body.connectionPoolSize,
    };

    // Extract and update secrets
    const secrets = {
      mongoConnectionString: body.mongoConnectionString,
      esConnectionString: body.esConnectionString,
      esUsername: body.esUsername,
      esPassword: body.esPassword,
      esApiKey: body.esApiKey,
      redisConnectionString: body.redisConnectionString,
      redisPassword: body.redisPassword,
    };

    if (Object.values(secrets).some((v) => v !== undefined)) {
      await updateServiceSecrets(id, secrets);
    }

    // Validate response time thresholds
    if (
      updateData.responseTimeWarningMs &&
      updateData.responseTimeCriticalMs &&
      updateData.responseTimeWarningMs >= updateData.responseTimeCriticalMs
    ) {
      return NextResponse.json(
        {
          error: "Warning threshold must be less than critical threshold",
        },
        { status: 400 },
      );
    }

    // Validate attempt counts
    if (
      updateData.responseTimeWarningAttempts &&
      updateData.responseTimeWarningAttempts < 1
    ) {
      return NextResponse.json(
        { error: "Warning attempts must be at least 1" },
        { status: 400 },
      );
    }

    if (
      updateData.responseTimeCriticalAttempts &&
      updateData.responseTimeCriticalAttempts < 1
    ) {
      return NextResponse.json(
        { error: "Critical attempts must be at least 1" },
        { status: 400 },
      );
    }

    // Invalidate pooled connections if connection details changed
    // This prevents using stale connections after configuration updates
    // Invalidate pooled connections if connection details changed
    // This prevents using stale connections after configuration updates
    if (updateData.connectionPoolEnabled) {
      const { getServiceWithSecrets } = await import("@/lib/db/services");
      const oldService = await getServiceWithSecrets(id);

      if (oldService) {
        const { connectionPool } =
          await import("@/lib/healthcheck/connection-pool");

        await connectionPool.invalidateServiceConnections(
          oldService.serviceType,
          {
            mongoConnectionString: oldService.mongoConnectionString,
            redisConnectionString: oldService.redisConnectionString,
            redisDatabase: oldService.redisDatabase,
          },
          {
            mongoConnectionString:
              secrets.mongoConnectionString || oldService.mongoConnectionString,
            redisConnectionString:
              secrets.redisConnectionString || oldService.redisConnectionString,
            redisDatabase: updateData.redisDatabase,
          },
        );
      }
    }

    const service = await updateService(id, updateData);

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({
      service: {
        id: service.id,
        name: service.name,
        serviceType: service.serviceType,
        timeout: service.timeout,
        checkInterval: service.checkInterval,
        createdAt: service.createdAt.toISOString(),
        updatedAt: service.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[API] Error updating service:", error);
    return NextResponse.json(
      { error: "Failed to update service" },
      { status: 500 },
    );
  }
}

// DELETE /api/services/[id] - Delete service (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Check admin permission
    await requireAdmin(request);

    const { id } = await params;

    // Clean up pooled connections before deleting the service
    // Clean up pooled connections before deleting the service
    const { getServiceWithSecrets } = await import("@/lib/db/services");
    const service = await getServiceWithSecrets(id);

    if (service && service.connectionPoolEnabled) {
      const { connectionPool } =
        await import("@/lib/healthcheck/connection-pool");

      // Remove all connections for this service
      await connectionPool.invalidateServiceConnections(service.serviceType, {
        mongoConnectionString: service.mongoConnectionString,
        redisConnectionString: service.redisConnectionString,
        redisDatabase: service.redisDatabase,
      });
    }

    const deleted = await deleteService(id);

    if (!deleted) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Error deleting service:", error);
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 },
    );
  }
}
