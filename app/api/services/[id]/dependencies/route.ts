import { NextRequest, NextResponse } from "next/server";
import { getAllServices } from "@/lib/db/services";
import { validateDependencies } from "@/lib/dependencies/graph";
import { getDatabase } from "@/lib/mongodb";

// PATCH /api/services/[id]/dependencies - Update service dependencies
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { dependencies } = body;

    if (!Array.isArray(dependencies)) {
      return NextResponse.json(
        { error: "Dependencies must be an array of service IDs" },
        { status: 400 }
      );
    }

    // Validate dependencies
    const validation = await validateDependencies(id, dependencies);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Update service dependencies
    const db = await getDatabase();
    await db.collection("services").updateOne(
      { id },
      {
        $set: {
          dependencies,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      dependencies,
    });
  } catch (error) {
    console.error("[API] Error updating dependencies:", error);
    return NextResponse.json(
      { error: "Failed to update dependencies" },
      { status: 500 }
    );
  }
}

// GET /api/services/[id]/dependencies - Get service dependencies
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const services = await getAllServices();
    const service = services.find((s) => s.id === id);

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Get dependency details
    const dependencyDetails = (service.dependencies || [])
      .map((depId) => {
        const dep = services.find((s) => s.id === depId);
        return dep ? { id: dep.id, name: dep.name } : null;
      })
      .filter(Boolean);

    // Get dependent services (services that depend on this one)
    const dependents = services
      .filter((s) => s.dependencies?.includes(id))
      .map((s) => ({ id: s.id, name: s.name }));

    return NextResponse.json({
      dependencies: dependencyDetails,
      dependents,
    });
  } catch (error) {
    console.error("[API] Error fetching dependencies:", error);
    return NextResponse.json(
      { error: "Failed to fetch dependencies" },
      { status: 500 }
    );
  }
}
