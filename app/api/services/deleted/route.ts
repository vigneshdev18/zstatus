import { NextResponse } from "next/server";
import { getDeletedServices } from "@/lib/db/services";

// GET /api/services/deleted - Get all deleted services
export async function GET() {
  try {
    const services = await getDeletedServices();

    return NextResponse.json({
      services: services.map((service) => ({
        id: service.id,
        name: service.name,
        serviceType: service.serviceType,
        timeout: service.timeout,
        checkInterval: service.checkInterval,

        // Metadata
        groupId: service.groupId,
        description: service.description,
        team: service.team,
        owner: service.owner,

        createdAt: service.createdAt.toISOString(),
        updatedAt: service.updatedAt.toISOString(),
        deletedAt: service.deletedAt?.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[API] Error fetching deleted services:", error);
    return NextResponse.json(
      { error: "Failed to fetch deleted services" },
      { status: 500 }
    );
  }
}
