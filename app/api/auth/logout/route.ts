import { TOKEN_KEY } from "@/lib/constants/app.constants";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    // Clear auth cookie
    response.cookies.delete(TOKEN_KEY);

    return response;
  } catch (error) {
    console.error("[API] Error in logout:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
