import { NextResponse } from "next/server";
import { getAllIncidents } from "@/lib/db/incidents";

// GET /api/incidents - Get all incidents
export async function GET() {
  try {
    const incidents = await getAllIncidents();

    return NextResponse.json({
      incidents: incidents.map((inc) => ({
        id: inc.id,
        serviceId: inc.serviceId,
        serviceName: inc.serviceName,
        status: inc.status,
        startTime: inc.startTime.toISOString(),
        endTime: inc.endTime?.toISOString(),
        duration: inc.duration,
        failedChecks: inc.failedChecks,
        createdAt: inc.createdAt.toISOString(),
        updatedAt: inc.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[API] Error fetching incidents:", error);
    return NextResponse.json(
      { error: "Failed to fetch incidents" },
      { status: 500 }
    );
  }
}
