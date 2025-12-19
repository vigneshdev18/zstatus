import { NextRequest, NextResponse } from "next/server";
import {
  getAllAlerts,
  getAlertsByServiceIdPaginated,
  countAlertsByServiceId,
} from "@/lib/db/alerts";
import {
  parsePaginationParams,
  generatePaginationMetadata,
  calculateOffset,
} from "@/lib/utils/pagination";

// GET /api/alerts - Get alerts with optional pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const serviceId = searchParams.get("serviceId");
    const page = searchParams.get("page");
    const pageSize = searchParams.get("pageSize");

    // If serviceId is provided with pagination params, use paginated query
    if (serviceId && (page || pageSize)) {
      const { page: currentPage, pageSize: currentPageSize } =
        parsePaginationParams(
          page,
          pageSize,
          10, // default page size
          100 // max page size
        );

      // Parse filter parameters
      const severity = searchParams.get("severity");
      const type = searchParams.get("type");

      const filters = {
        severity: severity || undefined,
        type: type || undefined,
      };

      const offset = calculateOffset(currentPage, currentPageSize);
      const [alerts, totalCount] = await Promise.all([
        getAlertsByServiceIdPaginated(
          serviceId,
          offset,
          currentPageSize,
          filters
        ),
        countAlertsByServiceId(serviceId, filters),
      ]);

      const paginationMetadata = generatePaginationMetadata(
        currentPage,
        currentPageSize,
        totalCount
      );

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
        pagination: paginationMetadata,
      });
    }

    // Legacy behavior: get all alerts
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
