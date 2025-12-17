import { NextRequest, NextResponse } from "next/server";
import { getIncidentsByServiceId } from "@/lib/db/incidents";

// GET /api/services/[id]/incidents - Get incidents for a service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const incidents = await getIncidentsByServiceId(id);

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
    console.error("[API] Error fetching service incidents:", error);
    return NextResponse.json(
      { error: "Failed to fetch incidents" },
      { status: 500 }
    );
  }
}
