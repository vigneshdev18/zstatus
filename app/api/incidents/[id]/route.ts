import { NextRequest, NextResponse } from "next/server";
import { getIncidentById } from "@/lib/db/incidents";

// GET /api/incidents/[id] - Get incident by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const incident = await getIncidentById(id);

    if (!incident) {
      return NextResponse.json(
        { error: "Incident not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      incident: {
        id: incident.id,
        serviceId: incident.serviceId,
        serviceName: incident.serviceName,
        status: incident.status,
        startTime: incident.startTime.toISOString(),
        endTime: incident.endTime?.toISOString(),
        duration: incident.duration,
        failedChecks: incident.failedChecks,
        createdAt: incident.createdAt.toISOString(),
        updatedAt: incident.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[API] Error fetching incident:", error);
    return NextResponse.json(
      { error: "Failed to fetch incident" },
      { status: 500 }
    );
  }
}
