import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    // Clear auth cookie
    response.cookies.delete("auth_token");

    return response;
  } catch (error) {
    console.error("[API] Error in logout:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
