import { NextRequest, NextResponse } from "next/server";
import { createService, getAllServicesWithMetrics } from "@/lib/db/services";
import { CreateServiceInput } from "@/lib/types/service";

// GET /api/services - List all services
export async function GET() {
  try {
    const services = await getAllServicesWithMetrics();

    return NextResponse.json({
      services: services.map((s) => ({
        id: s.id,
        name: s.name,
        serviceType: s.serviceType,
        healthCheckUrl: s.healthCheckUrl,
        timeout: s.timeout,
        checkInterval: s.checkInterval,
        lastStatus: s.lastStatus,
        lastCheckedAt: s.lastCheckedAt?.toISOString(),
        groupId: s.groupId,
        alertsEnabled: s.alertsEnabled !== undefined ? s.alertsEnabled : true,
        avgResponseTime: s.avgResponseTime, // Include average response time
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[API] Error fetching services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

// POST /api/services - Create a new service
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.serviceType) {
      return NextResponse.json(
        { error: "Missing required fields: name, serviceType" },
        { status: 400 }
      );
    }

    const data: CreateServiceInput = {
      name: body.name,
      serviceType: body.serviceType,
      timeout: body.timeout || 5000,
      checkInterval: body.checkInterval || 60,

      // Protocol-specific fields
      healthCheckUrl: body.healthCheckUrl,
      httpMethod: body.httpMethod,
      requestHeaders: body.requestHeaders,
      requestBody: body.requestBody,
      mongoConnectionString: body.mongoConnectionString,
      mongoDatabase: body.mongoDatabase,
      esConnectionString: body.esConnectionString,

      // Metadata
      groupId: body.groupId,
      alertsEnabled:
        body.alertsEnabled !== undefined ? body.alertsEnabled : true,
      description: body.description,
      team: body.team,
      owner: body.owner,
      grafanaDashboardId: body.grafanaDashboardId,
    };

    // Create service
    const service = await createService(data);

    return NextResponse.json(
      {
        service: {
          id: service.id,
          name: service.name,
          serviceType: service.serviceType,
          timeout: service.timeout,
          checkInterval: service.checkInterval,
          createdAt: service.createdAt.toISOString(),
          updatedAt: service.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API] Error creating service:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}
