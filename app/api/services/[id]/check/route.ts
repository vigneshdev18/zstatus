import { NextRequest, NextResponse } from "next/server";
import { getServiceById } from "@/lib/db/services";
import { createHealthCheck } from "@/lib/db/healthchecks";
import { runHealthCheck } from "@/lib/healthcheck/runner";
import { detectIncident } from "@/lib/incidents/detector";
import { updateServiceStatus } from "@/lib/db/service-status";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = await getServiceById(id);

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

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

    return NextResponse.json({
      status: result.status,
      responseTime: result.responseTime,
      statusCode: result.statusCode,
      errorMessage: result.errorMessage,
      timestamp: timestamp.toISOString(),
    });
  } catch (error) {
    console.error("[ManualCheck] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Health check failed",
      },
      { status: 500 }
    );
  }
}
