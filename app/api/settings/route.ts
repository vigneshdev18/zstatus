import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/db/settings";
import { requireAdmin } from "@/lib/auth/permissions";

// GET /api/settings - Get global settings
export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("[API] Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PATCH /api/settings - Update global settings (Admin only)
export async function PATCH(request: NextRequest) {
  try {
    // Check admin permission
    await requireAdmin(request);

    const body = await request.json();

    // Validate globalAlertsEnabled is a boolean if provided
    if (
      body.globalAlertsEnabled !== undefined &&
      typeof body.globalAlertsEnabled !== "boolean"
    ) {
      return NextResponse.json(
        { error: "globalAlertsEnabled must be a boolean" },
        { status: 400 }
      );
    }

    // Validate globalHealthChecksEnabled is a boolean if provided
    if (
      body.globalHealthChecksEnabled !== undefined &&
      typeof body.globalHealthChecksEnabled !== "boolean"
    ) {
      return NextResponse.json(
        { error: "globalHealthChecksEnabled must be a boolean" },
        { status: 400 }
      );
    }

    // Validate alertCooldownMinutes is a number if provided
    if (
      body.alertCooldownMinutes !== undefined &&
      typeof body.alertCooldownMinutes !== "number"
    ) {
      return NextResponse.json(
        { error: "alertCooldownMinutes must be a number" },
        { status: 400 }
      );
    }

    const settings = await updateSettings({
      globalAlertsEnabled: body.globalAlertsEnabled,
      globalHealthChecksEnabled: body.globalHealthChecksEnabled,
      alertCooldownMinutes: body.alertCooldownMinutes,
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("[API] Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
