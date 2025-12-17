import { NextRequest, NextResponse } from "next/server";
import { getRecentHealthChecks } from "@/lib/db/healthchecks";

// GET /api/healthchecks - Get recent health check results
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "1000");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // Parse dates if provided
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;

    const healthchecks = await getRecentHealthChecks(limit, fromDate, toDate);

    return NextResponse.json({
      healthChecks: healthchecks.map((hc) => ({
        id: hc.id,
        serviceId: hc.serviceId,
        serviceName: hc.serviceName,
        status: hc.status,
        responseTime: hc.responseTime,
        statusCode: hc.statusCode,
        errorMessage: hc.errorMessage,
        timestamp: hc.timestamp.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[API] Error fetching health checks:", error);
    return NextResponse.json(
      { error: "Failed to fetch health checks" },
      { status: 500 }
    );
  }
}
