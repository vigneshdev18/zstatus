import { NextResponse } from "next/server";
import { ensureDefaultAdmin } from "@/lib/auth/setup";

// This endpoint initializes the default admin
// It can be called on app startup or manually
export async function GET() {
  try {
    await ensureDefaultAdmin();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Error in /api/init:", error);
    return NextResponse.json(
      { error: "Initialization failed" },
      { status: 500 },
    );
  }
}
