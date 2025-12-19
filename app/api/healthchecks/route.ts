import { NextRequest, NextResponse } from "next/server";
import { getRecentHealthChecks } from "@/lib/db/healthchecks";
import {
  getHealthChecksByServiceIdPaginated,
  countHealthChecksByServiceId,
} from "@/lib/db/healthchecks";
import {
  parsePaginationParams,
  generatePaginationMetadata,
  calculateOffset,
} from "@/lib/utils/pagination";

// GET /api/healthchecks - Get health check results with pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const serviceId = searchParams.get("serviceId");
    const page = searchParams.get("page");
    const pageSize = searchParams.get("pageSize");

    // Legacy support for limit parameter
    const limit = searchParams.get("limit");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // If serviceId is provided with pagination params, use paginated query
    if (serviceId && (page || pageSize)) {
      const { page: currentPage, pageSize: currentPageSize } =
        parsePaginationParams(
          page,
          pageSize,
          20, // default page size
          100 // max page size
        );

      // Parse filter parameters
      const fromDate = searchParams.get("fromDate");
      const toDate = searchParams.get("toDate");
      const minResponseTime = searchParams.get("minResponseTime");
      const maxResponseTime = searchParams.get("maxResponseTime");
      const status = searchParams.get("status");

      const filters = {
        fromDate: fromDate ? new Date(fromDate) : undefined,
        toDate: toDate ? new Date(toDate) : undefined,
        minResponseTime: minResponseTime
          ? parseInt(minResponseTime)
          : undefined,
        maxResponseTime: maxResponseTime
          ? parseInt(maxResponseTime)
          : undefined,
        status: status || undefined,
      };

      const offset = calculateOffset(currentPage, currentPageSize);
      const [healthchecks, totalCount] = await Promise.all([
        getHealthChecksByServiceIdPaginated(
          serviceId,
          offset,
          currentPageSize,
          filters
        ),
        countHealthChecksByServiceId(serviceId, filters),
      ]);

      const paginationMetadata = generatePaginationMetadata(
        currentPage,
        currentPageSize,
        totalCount
      );

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
        pagination: paginationMetadata,
      });
    }

    // Legacy behavior: use limit parameter
    const limitValue = parseInt(limit || "1000");
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;

    const healthchecks = await getRecentHealthChecks(
      limitValue,
      fromDate,
      toDate
    );

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
