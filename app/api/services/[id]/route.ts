import { NextRequest, NextResponse } from "next/server";
import {
  getServiceById,
  updateService,
  deleteService,
} from "@/lib/db/services";
import { UpdateServiceInput, Service } from "@/lib/types/service";
import { requireAdmin } from "@/lib/auth/permissions";

// GET /api/services/[id] - Get single service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = await getServiceById(id);

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

        // API fields
        healthCheckUrl: service.healthCheckUrl,
        httpMethod: service.httpMethod,
        requestHeaders: service.requestHeaders,
        requestBody: service.requestBody,

        // MongoDB fields
        mongoConnectionString: service.mongoConnectionString,
        mongoDatabase: service.mongoDatabase,
        mongoPipelines: service.mongoPipelines,

        // Elasticsearch fields
        esConnectionString: service.esConnectionString,

        // Redis fields
        redisConnectionString: service.redisConnectionString,
        redisPassword: service.redisPassword,
        redisDatabase: service.redisDatabase,
        redisOperations: service.redisOperations,

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

        createdAt: service.createdAt.toISOString(),
        updatedAt: service.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[API] Error fetching service:", error);
    return NextResponse.json(
      { error: "Failed to fetch service" },
      { status: 500 }
    );
  }
}

// PUT /api/services/[id] - Update service (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin permission
    await requireAdmin(request);

    const { id } = params;
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
      mongoConnectionString: body.mongoConnectionString,
      mongoDatabase: body.mongoDatabase,
      mongoPipelines: body.mongoPipelines,
      esConnectionString: body.esConnectionString,

      // Redis fields
      redisConnectionString: body.redisConnectionString,
      redisPassword: body.redisPassword,
      redisDatabase: body.redisDatabase,
      redisOperations: body.redisOperations,

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
    };

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
        { status: 400 }
      );
    }

    // Validate attempt counts
    if (
      updateData.responseTimeWarningAttempts &&
      updateData.responseTimeWarningAttempts < 1
    ) {
      return NextResponse.json(
        { error: "Warning attempts must be at least 1" },
        { status: 400 }
      );
    }

    if (
      updateData.responseTimeCriticalAttempts &&
      updateData.responseTimeCriticalAttempts < 1
    ) {
      return NextResponse.json(
        { error: "Critical attempts must be at least 1" },
        { status: 400 }
      );
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
      { status: 500 }
    );
  }
}

// DELETE /api/services/[id] - Delete service (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin permission
    await requireAdmin(request);

    const { id } = await params;
    const deleted = await deleteService(id);

    if (!deleted) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Error deleting service:", error);
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    );
  }
}
