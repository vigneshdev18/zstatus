import { NextResponse } from "next/server";
import { getAllAlerts } from "@/lib/db/alerts";

// GET /api/alerts - Get all alerts
export async function GET() {
  try {
    const alerts = await getAllAlerts();

    return NextResponse.json({
      alerts: alerts.map((alert) => ({
        id: alert.id,
        incidentId: alert.incidentId,
        serviceId: alert.serviceId,
        serviceName: alert.serviceName,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        status: alert.status,
        channels: alert.channels,
        sentAt: alert.sentAt?.toISOString(),
        errorMessage: alert.errorMessage,
        createdAt: alert.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[API] Error fetching alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}
