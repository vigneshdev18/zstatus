import { NextRequest, NextResponse } from "next/server";
import { restoreService, getServiceById } from "@/lib/db/services";

// POST /api/services/[id]/restore - Restore a deleted service
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const restored = await restoreService(id);

    if (!restored) {
      return NextResponse.json(
        { error: "Service not found or not deleted" },
        { status: 404 }
      );
    }

    // Fetch the restored service to return it
    const service = await getServiceById(id);

    return NextResponse.json({
      success: true,
      service: service
        ? {
            id: service.id,
            name: service.name,
            serviceType: service.serviceType,
            timeout: service.timeout,
            checkInterval: service.checkInterval,
            createdAt: service.createdAt.toISOString(),
            updatedAt: service.updatedAt.toISOString(),
          }
        : null,
    });
  } catch (error) {
    console.error("[API] Error restoring service:", error);
    return NextResponse.json(
      { error: "Failed to restore service" },
      { status: 500 }
    );
  }
}
