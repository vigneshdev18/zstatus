import { NextRequest, NextResponse } from "next/server";
import {
  createMaintenanceWindow,
  getMaintenanceWindows,
  deleteMaintenanceWindow,
} from "@/lib/db/maintenance";
import { getServiceById } from "@/lib/db/services";

// POST /api/maintenance - Create maintenance window
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceId, startTime, endTime, reason } = body;

    if (!serviceId || !startTime || !endTime) {
      return NextResponse.json(
        { error: "serviceId, startTime, and endTime are required" },
        { status: 400 }
      );
    }

    // Validate service exists
    const service = await getServiceById(serviceId);
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Create maintenance window
    const window = await createMaintenanceWindow(
      serviceId,
      service.name,
      new Date(startTime),
      new Date(endTime),
      reason
    );

    return NextResponse.json(
      {
        window: {
          id: window.id,
          serviceId: window.serviceId,
          serviceName: window.serviceName,
          startTime: window.startTime.toISOString(),
          endTime: window.endTime.toISOString(),
          reason: window.reason,
          createdAt: window.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API] Error creating maintenance window:", error);
    return NextResponse.json(
      { error: "Failed to create maintenance window" },
      { status: 500 }
    );
  }
}

// GET /api/maintenance - Get maintenance windows
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");

    if (!serviceId) {
      return NextResponse.json(
        { error: "serviceId query parameter is required" },
        { status: 400 }
      );
    }

    const windows = await getMaintenanceWindows(serviceId);

    return NextResponse.json({
      windows: windows.map((w) => ({
        id: w.id,
        serviceId: w.serviceId,
        serviceName: w.serviceName,
        startTime: w.startTime.toISOString(),
        endTime: w.endTime.toISOString(),
        reason: w.reason,
        createdAt: w.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[API] Error fetching maintenance windows:", error);
    return NextResponse.json(
      { error: "Failed to fetch maintenance windows" },
      { status: 500 }
    );
  }
}

// DELETE /api/maintenance - Delete maintenance window
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id query parameter is required" },
        { status: 400 }
      );
    }

    await deleteMaintenanceWindow(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Error deleting maintenance window:", error);
    return NextResponse.json(
      { error: "Failed to delete maintenance window" },
      { status: 500 }
    );
  }
}
