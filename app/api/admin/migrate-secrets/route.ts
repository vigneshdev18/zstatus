import { NextResponse } from "next/server";
import { migrateServiceSecrets } from "@/lib/db/migrations/migrate-service-secrets";
import { requireAdmin } from "@/lib/auth/permissions";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Require admin permissions for migration
    // await requireAdmin(request);

    const result = await migrateServiceSecrets();

    return NextResponse.json({
      message: "Secret migration completed",
      result,
    });
  } catch (error) {
    console.error("Migration failed:", error);
    return NextResponse.json(
      {
        error: "Migration failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
