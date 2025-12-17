import { NextRequest, NextResponse } from "next/server";
import { updateService, getServiceById } from "@/lib/db/services";

// PATCH /api/services/[id]/alerts - Toggle alerts for a service
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate alertsEnabled is a boolean
    if (typeof body.alertsEnabled !== "boolean") {
      return NextResponse.json(
        { error: "alertsEnabled must be a boolean" },
        { status: 400 }
      );
    }

    // Update the service
    const service = await updateService(id, {
      alertsEnabled: body.alertsEnabled,
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      service: {
        id: service.id,
        name: service.name,
        alertsEnabled: service.alertsEnabled,
      },
    });
  } catch (error) {
    console.error("[API] Error toggling alerts:", error);
    return NextResponse.json(
      { error: "Failed to toggle alerts" },
      { status: 500 }
    );
  }
}
