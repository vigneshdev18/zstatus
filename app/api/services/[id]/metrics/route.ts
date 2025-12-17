import { NextRequest, NextResponse } from "next/server";
import { getServiceById } from "@/lib/db/services";
import { getIncidentsByServiceId } from "@/lib/db/incidents";
import {
  calculateUptime,
  calculateMTTR,
  calculateMTBF,
  calculateTotalDowntime,
  formatDuration,
  TIME_WINDOWS,
  TimeWindow,
} from "@/lib/metrics/sla";

// GET /api/services/[id]/metrics - Get SLA metrics for a service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const timeWindow = (searchParams.get("window") || "30d") as TimeWindow;

    // Validate time window
    if (!TIME_WINDOWS[timeWindow]) {
      return NextResponse.json(
        { error: "Invalid time window. Use: 7d, 30d, or all" },
        { status: 400 }
      );
    }

    const service = await getServiceById(id);
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const incidents = await getIncidentsByServiceId(id);
    const timeWindowMs = TIME_WINDOWS[timeWindow];

    // Calculate metrics
    const uptime = calculateUptime(incidents, timeWindowMs);
    const mttr = calculateMTTR(incidents);
    const mtbf = calculateMTBF(incidents, service.createdAt, timeWindowMs);
    const totalDowntime = calculateTotalDowntime(incidents, timeWindowMs);

    // Count incidents in time window
    const now = Date.now();
    const startOfWindow = now - timeWindowMs;
    const incidentsInWindow = incidents.filter(
      (inc) => new Date(inc.startTime).getTime() >= startOfWindow
    );

    return NextResponse.json({
      serviceId: id,
      serviceName: service.name,
      timeWindow,
      metrics: {
        uptime: {
          percentage: Number(uptime.toFixed(2)),
          formatted: `${uptime.toFixed(2)}%`,
        },
        mttr: {
          milliseconds: Math.round(mttr),
          formatted: formatDuration(mttr),
        },
        mtbf: {
          milliseconds: Math.round(mtbf),
          formatted: formatDuration(mtbf),
        },
        totalDowntime: {
          milliseconds: totalDowntime,
          formatted: formatDuration(totalDowntime),
        },
        incidentCount: incidentsInWindow.length,
        openIncidents: incidentsInWindow.filter((i) => i.status === "OPEN")
          .length,
      },
    });
  } catch (error) {
    console.error("[API] Error calculating metrics:", error);
    return NextResponse.json(
      { error: "Failed to calculate metrics" },
      { status: 500 }
    );
  }
}
