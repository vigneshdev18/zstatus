import { NextRequest, NextResponse } from "next/server";
import {
  getServiceById,
  updateService,
  deleteService,
} from "@/lib/db/services";
import { UpdateServiceInput, Service } from "@/lib/types/service";

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

        // Elasticsearch fields
        esConnectionString: service.esConnectionString,

        // Metadata
        groupId: service.groupId,
        alertsEnabled:
          service.alertsEnabled !== undefined ? service.alertsEnabled : true,
        description: service.description,
        team: service.team,
        owner: service.owner,
        grafanaDashboardId: service.grafanaDashboardId,

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

// PUT /api/services/[id] - Update service
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
      esConnectionString: body.esConnectionString,

      // Metadata
      groupId: body.groupId,
      alertsEnabled: body.alertsEnabled,
      description: body.description,
      team: body.team,
      owner: body.owner,
      grafanaDashboardId: body.grafanaDashboardId,
    };

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

// DELETE /api/services/[id] - Delete service
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
